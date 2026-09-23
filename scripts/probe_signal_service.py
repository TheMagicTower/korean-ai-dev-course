"""Same black-box HTTP contract for both service candidates; localhost only.
Run with SIGNAL_EDITOR_PASSWORD / SIGNAL_PUBLISHER_PASSWORD and --url.
No credentials or session cookies are written to evidence.
"""
import argparse,concurrent.futures,copy,http.cookiejar,json,os,time,urllib.request,urllib.error,urllib.parse
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
class Client:
 def __init__(self,url):
  self.base=url.rstrip('/');self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
 def req(self,path,data=None,csrf=True,form=False):
  headers={'Referer':self.base+path}
  if data is not None:
   headers['Content-Type']='application/x-www-form-urlencoded' if form else 'application/json'
   if csrf:
    token=next((c.value for c in self.jar if c.name=='csrftoken'),'')
    headers['X-CSRFToken']=token
   data=(urllib.parse.urlencode(data) if form else json.dumps(data)).encode()
  r=urllib.request.Request(self.base+path,data=data,headers=headers)
  try:
   with self.opener.open(r,timeout=15) as x: body=x.read().decode();code=x.status;url=x.url
  except urllib.error.HTTPError as x:body=x.read().decode();code=x.code;url=x.url
  try:body=json.loads(body)
  except ValueError:pass
  return code,body,url
 def login(self,user,password):
  self.req('/accounts/login/')
  code,body,url=self.req('/accounts/login/',{'username':user,'password':password},form=True)
  assert code==200 and '/accounts/login/' not in url, f'Login failed for {user}: {code}'
 def post(self,path,data,expected=(200,)):
  code,body,_=self.req(path,data)
  assert code in expected,f'{path} status {code} expected {expected}; body {str(body)[:450]}'
  return body

def run(url):
 started=datetime.now(timezone.utc).isoformat();results=[]
 def ok(name):results.append({'check':name,'status':'passed','at':datetime.now(timezone.utc).isoformat()})
 anon=Client(url);editor=Client(url);publisher=Client(url)
 for path in ['/healthz','/readyz']:assert anon.req(path)[0]==200
 ok('health_and_database_readiness')
 code,body,u=anon.req('/api/articles/');assert code in (401,403) or '/accounts/login/' in u
 ok('anonymous_draft_denied')
 editor.login('editor',os.environ['SIGNAL_EDITOR_PASSWORD']);publisher.login('publisher',os.environ['SIGNAL_PUBLISHER_PASSWORD'])
 fixture=json.loads((ROOT/'experiments/signal-production/shared/source-fixture.json').read_text())
 payload={'title':'계약 검증 기사 '+str(time.time_ns()),'summary':fixture['draft']['summary'],'claims':fixture['draft']['claims'],'sources':fixture['sources'],'provenance':{'run':fixture['run'],'textOrigin':fixture['textOrigin']}}
 assert editor.req('/api/articles/',payload,csrf=False)[0]==403
 assert publisher.req('/api/articles/',payload)[0]==403
 ok('csrf_and_publisher_create_denied')
 bad=copy.deepcopy(payload);bad['sources'][0]['url']='javascript:alert(1)';assert editor.req('/api/articles/',bad)[0]==400
 bad=copy.deepcopy(payload);bad['claims']=[];assert editor.req('/api/articles/',bad)[0]==400
 bad=copy.deepcopy(payload);bad['claims'][0]['evidenceId']=[];assert editor.req('/api/articles/',bad)[0]==400
 bad=copy.deepcopy(payload);bad['title']='x'*201;assert editor.req('/api/articles/',bad)[0]==400
 ok('invalid_source_missing_evidence_wrong_type_and_oversized_title_rejected')
 article=editor.post('/api/articles/',payload,(201,));aid=article['id'];prefix=f'/api/articles/{aid}/';v=article['version']
 assert editor.req(prefix+'approve/',{'version':v})[0]==403
 assert editor.req(prefix+'publish/',{'version':v,'idempotency_key':'denied-'+str(aid)})[0]==403
 assert publisher.req(prefix+'publish/',{'version':v,'idempotency_key':'unapproved-'+str(aid)})[0] in (400,409)
 assert publisher.req(prefix+'edit/',{'version':v,'title':'forbidden','summary':payload['summary'],'claims':payload['claims']})[0]==403
 ok('editor_approve_publish_denied_and_unapproved_publish_denied')
 edit={'version':v,'title':payload['title']+' 수정','summary':payload['summary'],'claims':payload['claims'],'reason':''}
 article=editor.post(prefix+'edit/',edit);assert article['version']>v
 assert editor.req(prefix+'edit/',edit)[0]==409
 ok('optimistic_stale_edit_conflict')
 article=publisher.post(prefix+'approve/',{'version':article['version']})
 approved=article['version'];article=editor.post(prefix+'edit/',{**edit,'version':approved,'title':edit['title']+' 재수정'})
 assert publisher.req(prefix+'publish/',{'version':article['version'],'idempotency_key':'invalidated-'+str(aid)})[0] in (400,409)
 ok('edit_invalidates_approval')
 article=publisher.post(prefix+'approve/',{'version':article['version']})
 article=publisher.post(prefix+'hold/',{'version':article['version'],'reason':'추가 검토'})
 assert publisher.req(prefix+'publish/',{'version':article['version'],'idempotency_key':'held-'+str(aid)})[0] in (400,409)
 ok('hold_invalidates_approval')
 article=publisher.post(prefix+'approve/',{'version':article['version']})
 req={'version':article['version'],'idempotency_key':'publish-'+str(aid)}
 published=publisher.post(prefix+'publish/',req,(200,201));repeat=publisher.post(prefix+'publish/',req,(200,201))
 assert published['edition']['id']==repeat['edition']['id']
 assert publisher.req(prefix+'publish/',{**req,'version':999999})[0]==409
 assert published['edition']['snapshot'].get('correction_reason','')=='', 'Internal hold reason leaked into public correction'
 ok('idempotent_retry_key_conflict_and_no_private_hold_note_in_first_edition')
 code,public,_=anon.req('/');assert code==200 and article['title'] in public
 ok('anonymous_reader_sees_server_publication')
 article=published['article'];oldtitle=article['title'];before=article['version']
 assert editor.req(prefix+'edit/',{**edit,'version':before,'reason':''})[0]==400
 article=editor.post(prefix+'edit/',{**edit,'version':before,'title':oldtitle+' 정정','reason':'검증용 정정 사유'})
 article=publisher.post(prefix+'approve/',{'version':article['version']})
 corrected=publisher.post(prefix+'publish/',{'version':article['version'],'idempotency_key':'correction-'+str(aid)},(200,201))
 assert corrected['edition']['id']!=published['edition']['id']
 assert '정정' in anon.req('/')[1]
 ok('correction_requires_reason_and_publishes_new_edition')
 fresh=Client(url);fresh.login('editor',os.environ['SIGNAL_EDITOR_PASSWORD']);current=fresh.req(prefix)[1]
 assert current['version']==corrected['article']['version']
 ok('fresh_authenticated_session_reads_persisted_revision')
 # Two actual HTTP clients race on the same revision; exactly one succeeds.
 second=Client(url);second.login('editor',os.environ['SIGNAL_EDITOR_PASSWORD'])
 payload2={**edit,'version':current['version'],'reason':'동시 수정 검증'}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  futures=[pool.submit(c.req,prefix+'edit/',{**payload2,'title':oldtitle+str(i)}) for i,c in enumerate([editor,second])]
  codes=sorted(f.result()[0] for f in futures)
 assert codes==[200,409],f'Concurrent edit codes {codes}'
 ok('actual_concurrent_http_edit_one_success_one_conflict')
 return {'started_at':started,'finished_at':datetime.now(timezone.utc).isoformat(),'base_url':url,'checks':results,'status':'passed','limitations':'Does not replace independent code review, backup restore, TLS staging or browser UI checks.'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--output',required=True);args=p.parse_args()
 if urllib.parse.urlparse(args.url).hostname not in ('127.0.0.1','localhost'):raise SystemExit('Local disposable service only')
 try: result=run(args.url)
 except Exception as e:
  result={'status':'failed','at':datetime.now(timezone.utc).isoformat(),'error':str(e)}
  Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');raise
 Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
