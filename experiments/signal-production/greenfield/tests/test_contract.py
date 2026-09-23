import hashlib,json
from django.test import TestCase,Client
from django.contrib.auth.models import User,Group

class ContractTests(TestCase):
 def setUp(self):
  self.editor=User.objects.create_user("editor",password="editor-test-only-password")
  self.publisher=User.objects.create_user("publisher",password="publisher-test-only-password")
  self.editor.groups.add(Group.objects.get_or_create(name="editor")[0])
  self.publisher.groups.add(Group.objects.get_or_create(name="publisher")[0])
  self.e=Client();self.e.force_login(self.editor)
  self.p=Client();self.p.force_login(self.publisher)
  self.payload={"title":"검증 기사","summary":"근거를 확인한 기사입니다.","claims":[{"text":"NASA 자료입니다.","evidenceId":"nasa-1"}],"sources":[{"id":"nasa-1","title":"NASA 자료","url":"https://www.nasa.gov/example/","excerpt":"recorded excerpt","sha256":hashlib.sha256(b"recorded excerpt").hexdigest()}],"provenance":{"mode":"recorded-run"}}
 def post(self,c,url,data): return c.post(url,json.dumps(data),content_type="application/json")
 def create(self):
  r=self.post(self.e,"/api/articles/",self.payload);self.assertEqual(r.status_code,201,r.content);return r.json()
 def test_draft_requires_auth_and_roles(self):
  self.assertIn(self.client.get("/api/articles/").status_code,[401,403,302])
  self.assertEqual(self.post(self.p,"/api/articles/",self.payload).status_code,403)
  a=self.create();u=f"/api/articles/{a['id']}/"
  self.assertEqual(self.post(self.e,u+"approve/",{"version":a['version']}).status_code,403)
  self.assertEqual(self.post(self.p,u+"edit/",{"version":a['version'],**self.payload}).status_code,403)
 def test_publish_correction_immutable_and_stale(self):
  a=self.create();u=f"/api/articles/{a['id']}/"
  self.assertEqual(self.post(self.p,u+"publish/",{"version":a['version'],"idempotency_key":"first"}).status_code,400)
  a=self.post(self.p,u+"approve/",{"version":a['version']}).json()
  request={"version":a['version'],"idempotency_key":"first"}
  r=self.post(self.p,u+"publish/",request);self.assertEqual(r.status_code,201,r.content)
  published=r.json();a=published['article']
  self.assertEqual(self.post(self.p,u+"publish/",request).json()['edition']['id'],published['edition']['id'])
  self.assertEqual(self.post(self.e,u+"edit/",{"version":a['version'],**self.payload}).status_code,400)
  changed={**self.payload,"title":"정정 제목","version":a['version'],"reason":"원문 표기 정정"}
  a=self.post(self.e,u+"edit/",changed).json()
  self.assertEqual(self.post(self.e,u+"edit/",changed).status_code,409)
  self.assertEqual(self.post(self.p,u+"publish/",{"version":a['version'],"idempotency_key":"second"}).status_code,400)
  a=self.post(self.p,u+"approve/",{"version":a['version']}).json()
  r=self.post(self.p,u+"publish/",{"version":a['version'],"idempotency_key":"second"})
  self.assertEqual(r.status_code,201,r.content)
  page=self.client.get('/');self.assertContains(page,"정정 제목");self.assertContains(page,"검증 기사");self.assertContains(page,"원문 표기 정정")
 def test_validation_csrf_hold(self):
  for bad in [{"title":""},{"summary":""},{"claims":[]},{"title":"x"*201},{"sources":[{**self.payload['sources'][0],"url":"http://www.nasa.gov/a"}]}]:
   self.assertEqual(self.post(self.e,"/api/articles/",{**self.payload,**bad}).status_code,400)
  csrf=Client(enforce_csrf_checks=True);csrf.force_login(self.editor)
  self.assertEqual(self.post(csrf,"/api/articles/",self.payload).status_code,403)
  a=self.create();u=f"/api/articles/{a['id']}/"
  a=self.post(self.p,u+"approve/",{"version":a['version']}).json()
  a=self.post(self.p,u+"hold/",{"version":a['version'],"reason":"추가 검토"}).json()
  self.assertEqual(self.post(self.p,u+"publish/",{"version":a['version'],"idempotency_key":"held"}).status_code,400)
 def test_malformed_claim_and_cross_article_key_and_self_approval(self):
  bad={**self.payload,'claims':[{'text':'bad','evidenceId':['nasa-1']}]}
  self.assertEqual(self.post(self.e,'/api/articles/',bad).status_code,400)
  self.editor.groups.add(Group.objects.get(name='publisher'))
  a=self.create();url=f"/api/articles/{a['id']}/"
  self.assertEqual(self.post(self.e,url+'approve/',{'version':a['version']}).status_code,403)
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  self.assertEqual(self.post(self.p,url+'publish/',{'version':a['version'],'idempotency_key':'shared'}).status_code,201)
  b=self.create();other=f"/api/articles/{b['id']}/"
  b=self.post(self.p,other+'approve/',{'version':b['version']}).json()
  self.assertEqual(self.post(self.p,other+'publish/',{'version':b['version'],'idempotency_key':'shared'}).status_code,409)
 def test_snapshot_database_immutable(self):
  from news.models import Edition
  from django.db import DatabaseError,transaction
  a=self.create();url=f"/api/articles/{a['id']}/"
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  self.post(self.p,url+'publish/',{'version':a['version'],'idempotency_key':'immutable'})
  with self.assertRaises(DatabaseError),transaction.atomic():Edition.objects.update(snapshot={'title':'tampered'})
  with self.assertRaises(DatabaseError),transaction.atomic():Edition.objects.all().delete()
 def test_hold_reason_is_private_and_does_not_replace_correction(self):
  from news.models import Audit
  a=self.create();url=f"/api/articles/{a['id']}/"
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  a=self.post(self.p,url+'hold/',{'version':a['version'],'reason':'추가 검토 내부 메모'}).json()
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  result=self.post(self.p,url+'publish/',{'version':a['version'],'idempotency_key':'hold-private'}).json()
  self.assertEqual(result['edition']['snapshot']['correction_reason'],'')
  self.assertNotContains(self.client.get('/'),'추가 검토 내부 메모')
  self.assertEqual(Audit.objects.filter(action='hold').get().reason,'추가 검토 내부 메모')
  a=result['article']
  a=self.post(self.e,url+'edit/',{**self.payload,'version':a['version'],'reason':'수치 정정 공개 사유'}).json()
  a=self.post(self.p,url+'hold/',{'version':a['version'],'reason':'담당자 검토 내부 메모'}).json()
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  result=self.post(self.p,url+'publish/',{'version':a['version'],'idempotency_key':'hold-correction'}).json()
  self.assertEqual(result['edition']['snapshot']['correction_reason'],'수치 정정 공개 사유')
  self.assertNotContains(self.client.get('/'),'담당자 검토 내부 메모')
 def test_json_errors_and_escaped_public_content(self):
  self.assertEqual(self.e.get('/api/articles/999999/').status_code,404)
  self.assertEqual(self.e.get('/api/unknown/').headers['Content-Type'],'application/json')
  self.assertEqual(self.e.post('/api/articles/','{broken',content_type='application/json').status_code,400)
  self.assertEqual(self.e.post('/api/articles/','x'*66000,content_type='application/json').status_code,400)
  payload={**self.payload,'title':'<script>alert(1)</script>'}
  a=self.post(self.e,'/api/articles/',payload).json();url=f"/api/articles/{a['id']}/"
  a=self.post(self.p,url+'approve/',{'version':a['version']}).json()
  self.post(self.p,url+'publish/',{'version':a['version'],'idempotency_key':'escape'})
  page=self.client.get('/')
  self.assertContains(page,'&lt;script&gt;alert(1)&lt;/script&gt;')
  self.assertNotContains(page,'<script>alert(1)</script>')
