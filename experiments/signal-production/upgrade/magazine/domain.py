import json,hashlib
from urllib.parse import urlsplit
from django.db import transaction
from .models import Article,Edition,Audit,ImportRecord
class Invalid(ValueError):pass
class Conflict(ValueError):pass
def text(v,name,limit):
 if not isinstance(v,str) or not v.strip() or len(v)>limit:raise Invalid(name+' 값이 없거나 너무 깁니다.')
 return v.strip()
def validate(p):
 if not isinstance(p,dict):raise Invalid('JSON 객체가 필요합니다.')
 title=text(p.get('title'),'제목',200);summary=text(p.get('summary'),'본문',5000)
 sources=p.get('sources');claims=p.get('claims');prov=p.get('provenance')
 if not isinstance(sources,list) or not 1<=len(sources)<=3:raise Invalid('출처 1~3개가 필요합니다.')
 ids=set()
 for s in sources:
  if not isinstance(s,dict):raise Invalid('출처 형식 오류')
  sid=text(s.get('id'),'근거 ID',100)
  if sid in ids:raise Invalid('근거 ID 중복')
  ids.add(sid);text(s.get('title'),'출처 제목',300);excerpt=text(s.get('excerpt'),'근거 발췌',5000)
  try:u=urlsplit(text(s.get('url'),'URL',2000))
  except ValueError:raise Invalid('URL 형식 오류')
  if u.scheme!='https' or u.netloc!='www.nasa.gov' or u.username or u.password:raise Invalid('NASA HTTPS URL만 허용합니다.')
  if s.get('sha256')!=hashlib.sha256(s['excerpt'].encode()).hexdigest():raise Invalid('근거 해시가 일치하지 않습니다.')
 if not isinstance(claims,list) or not 1<=len(claims)<=20:raise Invalid('주장 1~20개가 필요합니다.')
 for c in claims:
  if not isinstance(c,dict) or not isinstance(c.get('evidenceId'),str) or c.get('evidenceId') not in ids:raise Invalid('주장의 원문 근거가 없습니다.')
  text(c.get('text'),'주장',1000)
 if not isinstance(prov,dict) or len(json.dumps(prov,ensure_ascii=False))>16000:raise Invalid('AI 기록 형식 또는 길이 오류')
 return dict(title=title,summary=summary,claims=claims,sources=sources,provenance=prov)
def article_json(a):return dict(id=a.pk,title=a.title,summary=a.summary,claims=a.claims,sources=a.sources,provenance=a.provenance,version=a.version,status=a.status,correction_reason=a.correction_reason)
def audit(a,actor,action):Audit.objects.create(article=a,actor=actor,action=action,version=a.version)
def create(p,user):
 with transaction.atomic():
  a=Article.objects.create(**validate(p),author=user);audit(a,user.username,'create');return a
def mutate(pk,action,p,user):
 with transaction.atomic():
  a=Article.objects.get(pk=pk)
  version=p.get('version')
  if type(version)!=int:raise Invalid('version은 정수여야 합니다.')
  fingerprint=hashlib.sha256(json.dumps({'id':pk,'version':version},sort_keys=True).encode()).hexdigest()
  if action=='publish':
   key=text(p.get('idempotency_key'),'재시도 키',100)
   existing=Edition.objects.filter(idempotency_key=key).first()
   if existing:
    if existing.request_hash!=fingerprint:raise Conflict('재시도 키가 다른 요청에 사용됐습니다.')
    return a,existing
  if a.version!=version:raise Conflict('다른 사용자가 변경했습니다. 새로고침해 주세요.')
  if action=='edit':
   reason=p.get('reason','')
   if Edition.objects.filter(article=a).exists():reason=text(reason,'정정 이유',1000)
   elif not isinstance(reason,str) or len(reason)>1000:raise Invalid('정정 이유 형식 오류')
   values=validate(dict(p,sources=a.sources,provenance=a.provenance))
   for k,v in values.items():setattr(a,k,v)
   a.status='draft';a.approved_revision=None;a.correction_reason=reason;a.author=user
  elif action=='approve':
   if a.author_id==user.pk:raise Invalid('자신이 편집한 기사는 승인할 수 없습니다.')
   validate(article_json(a));a.status='approved';a.approved_revision=version+1
  elif action=='hold':
   text(p.get('reason'),'보류 이유',1000);a.status='held';a.approved_revision=None
  elif action=='publish':
   if a.status!='approved' or a.approved_revision!=version:raise Invalid('현재 버전의 승인이 필요합니다.')
   validate(article_json(a));a.status='published'
  a.version+=1
  fields={f:getattr(a,f) for f in ['title','summary','claims','sources','provenance','version','status','approved_revision','correction_reason','author_id']}
  if Article.objects.filter(pk=pk,version=version).update(**fields)!=1:raise Conflict('동시 변경 충돌')
  edition=None
  if action=='publish':edition=Edition.objects.create(article=a,revision=version,snapshot=article_json(a),idempotency_key=key,request_hash=fingerprint)
  audit(a,user.username,action)
  return a,edition
def ingest(data):
 if not isinstance(data,dict) or data.get('mode')!='recorded-run':raise Invalid('recorded-run 상태가 필요합니다.')
 draft=data.get('draft',{})
 if not isinstance(draft,dict):raise Invalid('초안 형식 오류')
 p=dict(draft,sources=data.get('sources'),provenance={k:data.get(k) for k in ['mode','textOrigin','run','classification']})
 fields=validate(p);digest=hashlib.sha256(json.dumps(data,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
 with transaction.atomic():
  old=ImportRecord.objects.filter(digest=digest).first()
  if old:return old.article,False
  a=Article.objects.create(**fields);ImportRecord.objects.create(digest=digest,article=a);audit(a,'recorded-import','import');return a,True
