import hashlib,json,re
from urllib.parse import urlsplit
from django.db import transaction
from .models import Article,Edition,Audit

class Problem(Exception):
 def __init__(self,message,status=400): self.message=message;self.status=status

def text(value,label,limit):
 if not isinstance(value,str) or not value.strip() or len(value)>limit: raise Problem(f'{label}: 필수 값이며 {limit}자 이하여야 합니다.')
 return value.strip()

def validate(data,sources=None):
 if not isinstance(data,dict): raise Problem('JSON 객체가 필요합니다.')
 title=text(data.get('title'),'제목',200);summary=text(data.get('summary'),'본문',10000)
 src=sources if sources is not None else data.get('sources')
 if not isinstance(src,list) or not 1<=len(src)<=20: raise Problem('출처는 1~20개 필요합니다.')
 ids=set()
 for s in src:
  if not isinstance(s,dict):raise Problem('잘못된 출처 형식입니다.')
  sid=text(s.get('id'),'출처 ID',80)
  if sid in ids:raise Problem('출처 ID가 중복되었습니다.')
  ids.add(sid)
  text(s.get('title'),'출처 제목',300)
  url=text(s.get('url'),'출처 URL',2000)
  try:
   parts=urlsplit(url)
   safe=parts.scheme=='https' and parts.hostname=='www.nasa.gov' and parts.username is None and parts.password is None and parts.port in (None,443)
  except ValueError:safe=False
  if not safe:raise Problem('출처는 HTTPS www.nasa.gov 주소만 허용됩니다.')
  excerpt=text(s.get('excerpt'),'근거 발췌',10000)
  digest=s.get('sha256')
  if not isinstance(digest,str) or not re.fullmatch('[a-f0-9]{64}',digest) or hashlib.sha256(excerpt.encode()).hexdigest()!=digest:raise Problem('출처 SHA-256 해시가 발췌문과 일치하지 않습니다.')
 claims=data.get('claims')
 if not isinstance(claims,list) or not 1<=len(claims)<=30:raise Problem('근거가 연결된 주장이 1~30개 필요합니다.')
 for claim in claims:
  if not isinstance(claim,dict):raise Problem('잘못된 주장 형식입니다.')
  text(claim.get('text'),'주장',2000)
  if not isinstance(claim.get('evidenceId'),str) or claim.get('evidenceId') not in ids:raise Problem('주장에 연결된 근거를 찾을 수 없습니다.')
 provenance=data.get('provenance',{})
 if not isinstance(provenance,dict) or len(json.dumps(provenance,ensure_ascii=False))>16000:raise Problem('AI 기록 형식 또는 길이가 잘못되었습니다.')
 return dict(title=title,summary=summary,claims=claims,sources=src,provenance=provenance)

def article_json(a):
 return {'id':a.pk,'title':a.title,'summary':a.summary,'claims':a.claims,'sources':a.sources,'provenance':a.provenance,'version':a.version,'status':a.status,'approved_version':a.approved_version,'correction_reason':a.correction_reason}

def edition_json(e):return {'id':e.pk,'article_id':e.article_id,'revision':e.revision,'snapshot':e.snapshot,'published_at':e.published_at.isoformat(),'url':f'/editions/{e.pk}/'}

def audit(a,user,action,reason=''):Audit.objects.create(article=a,actor=user,action=action,version=a.version,reason=reason)

@transaction.atomic
def create(data,user,import_digest=None):
 values=validate(data)
 a=Article.objects.create(**values,last_editor=user,import_digest=import_digest)
 audit(a,user,'import' if import_digest else 'create')
 return a

@transaction.atomic
def mutate(article_id,action,data,user):
 try:a=Article.objects.get(pk=article_id)
 except Article.DoesNotExist:raise Problem('기사를 찾을 수 없습니다.',404)
 v=data.get('version')
 if type(v) is not int or v<1:raise Problem('정수 버전이 필요합니다.')
 fingerprint=hashlib.sha256(json.dumps({'article':article_id,'version':v},sort_keys=True).encode()).hexdigest()
 if action=='publish':
  key=text(data.get('idempotency_key'),'중복 방지 키',128)
  previous=Edition.objects.filter(idempotency_key=key).first()
  if previous:
   if previous.request_fingerprint!=fingerprint:raise Problem('중복 방지 키가 다른 요청에 사용되었습니다.',409)
   return a,previous,False
 if v!=a.version:raise Problem('다른 작업자가 변경했습니다. 최신 기사를 다시 불러오십시오.',409)
 old_version=a.version
 if action=='edit':
  values=validate(data,a.sources)
  reason=data.get('reason','')
  if a.editions.exists():reason=text(reason,'정정 이유',1000)
  elif not isinstance(reason,str) or len(reason)>1000:raise Problem('정정 이유가 너무 깁니다.')
  a.title=values['title'];a.summary=values['summary'];a.claims=values['claims'];a.correction_reason=reason
  a.last_editor=user;a.status='draft';a.approved_version=None;a.approved_by=None
 elif action=='approve':
  if a.last_editor_id==user.pk:raise Problem('본인이 편집한 기사는 승인할 수 없습니다.',403)
  validate(article_json(a));a.status='approved';a.approved_version=a.version+1;a.approved_by=user
 elif action=='hold':
  text(data.get('reason'),'보류 이유',1000);a.status='held';a.approved_version=None;a.approved_by=None
 elif action=='publish':
  if a.status!='approved' or a.approved_version!=a.version:raise Problem('현재 버전의 발행자 승인이 필요합니다.')
  validate(article_json(a))
  e=Edition.objects.create(article=a,revision=a.version,snapshot=article_json(a),idempotency_key=key,request_fingerprint=fingerprint)
  a.status='published';a.approved_version=None
 else:raise Problem('알 수 없는 작업입니다.',404)
 a.version=old_version+1;a.save()
 audit(a,user,action,data.get('reason','') if action=='hold' else a.correction_reason)
 return a,e if action=='publish' else None,True
