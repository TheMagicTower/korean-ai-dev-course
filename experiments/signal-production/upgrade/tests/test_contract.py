import copy,json,hashlib,threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from django.test import TestCase,TransactionTestCase,Client
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import close_old_connections,connection,transaction,IntegrityError
from magazine.models import Article,Edition,Audit
from magazine.domain import ingest
FIXTURE=json.loads((Path(__file__).resolve().parents[2]/'shared/source-fixture.json').read_text())
def users():
 result=[]
 for role in ['editor','publisher']:
  u=get_user_model().objects.create_user(role,password='OnlyTesting-9281!');u.groups.add(Group.objects.get_or_create(name=role)[0]);result.append(u)
 return result
class Contract(TestCase):
 def setUp(self):
  self.editor,self.publisher=users();self.a,_=ingest(copy.deepcopy(FIXTURE));self.ec=Client();self.pc=Client();self.ec.force_login(self.editor);self.pc.force_login(self.publisher)
 def post(self,c,action,p=None):
  data={'version':Article.objects.get(pk=self.a.pk).version};data.update(p or {})
  return c.post(f'/api/articles/{self.a.pk}/{action}/',data=json.dumps(data),content_type='application/json')
 def edit(self,**kw):
  return dict(title='수정 제목',summary='수정 본문',claims=self.a.claims,**kw)
 def test_permissions_and_csrf(self):
  self.assertEqual(self.client.get('/api/articles/').status_code,401)
  for action in ['approve','hold','publish']:self.assertEqual(self.post(self.ec,action).status_code,403)
  self.assertEqual(self.post(self.pc,'edit',self.edit()).status_code,403)
  csrf=Client(enforce_csrf_checks=True);csrf.force_login(self.editor)
  self.assertEqual(csrf.post('/api/articles/',data='{}',content_type='application/json').status_code,403)
 def test_publish_corrections_and_immutable_snapshot(self):
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'before'}).status_code,400)
  self.assertEqual(self.post(self.ec,'edit',self.edit()).status_code,200)
  self.assertEqual(self.post(self.pc,'approve').status_code,200)
  v=Article.objects.get(pk=self.a.pk).version
  p={'version':v,'idempotency_key':'first'}
  first=self.post(self.pc,'publish',p);self.assertEqual(first.status_code,200)
  retry=self.post(self.pc,'publish',p);self.assertEqual(first.json()['edition']['id'],retry.json()['edition']['id'])
  snapshot=copy.deepcopy(Edition.objects.get().snapshot)
  self.assertEqual(self.post(self.ec,'edit',self.edit()).status_code,400)
  self.assertEqual(self.post(self.ec,'edit',self.edit(reason='오탈자 정정')).status_code,200)
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'second'}).status_code,400)
  self.assertEqual(self.post(self.pc,'approve').status_code,200)
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'second'}).status_code,200)
  self.assertEqual(Edition.objects.count(),2);self.assertEqual(Edition.objects.first().snapshot,snapshot)
  self.assertEqual(Edition.objects.last().snapshot['correction_reason'],'오탈자 정정')
  self.assertContains(self.client.get('/'),'오탈자 정정')
  self.assertTrue(Audit.objects.filter(actor='publisher',action='publish').exists())
 def test_hold_revokes_and_stale(self):
  self.assertEqual(self.post(self.pc,'approve').status_code,200)
  self.assertEqual(self.post(self.pc,'hold',{'reason':'근거 재검토'}).status_code,200)
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'held'}).status_code,400)
  self.assertEqual(self.post(self.ec,'edit',self.edit(version=1)).status_code,409)
 def test_editor_change_revokes_approval(self):
  self.post(self.pc,'approve');self.post(self.ec,'edit',self.edit())
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'edited'}).status_code,400)
 def test_self_approval(self):
  self.post(self.ec,'edit',self.edit());self.editor.groups.add(Group.objects.get(name='publisher'))
  self.assertEqual(self.post(self.ec,'approve').status_code,400)
 def test_validation(self):
  p=dict(FIXTURE['draft'],sources=FIXTURE['sources'],provenance={'mode':'recorded-run'})
  cases=[]
  for field,value in [('title',''),('title','x'*201),('summary',''),('summary','x'*5001),('claims',[]),('claims',[{'text':'test','evidenceId':[]}]),('claims',[{'text':'test','evidenceId':'missing'}]),('sources',[])]:
   q=copy.deepcopy(p);q[field]=value;cases.append(q)
  for url in ['https://[invalid','http://www.nasa.gov/a','https://evil.example/a','https://www.nasa.gov@evil.example/a','https://www.nasa.gov:443/a']:
   q=copy.deepcopy(p);q['sources'][0]['url']=url;cases.append(q)
  q=copy.deepcopy(p);q['sources'][0]['sha256']='0'*64;cases.append(q)
  for q in cases:self.assertEqual(self.ec.post('/api/articles/',data=json.dumps(q),content_type='application/json').status_code,400)
  self.assertEqual(self.ec.post('/api/articles/',data=json.dumps(p),content_type='application/json').status_code,201)
 def test_import_resets_and_deduplicates(self):
  data=copy.deepcopy(FIXTURE);data['draft']['status']='published';data['draft']['reviewVersion']=1
  a,created=ingest(data);again,created2=ingest(data)
  self.assertEqual(a.status,'draft');self.assertIsNone(a.approved_revision);self.assertEqual(a.pk,again.pk);self.assertFalse(created2)
  self.assertEqual(a.sources,FIXTURE['sources']);self.assertEqual(a.provenance['run'],FIXTURE['run'])
 def test_login_throttle(self):
  for _ in range(5):self.assertEqual(self.client.post('/accounts/login/',{'username':'editor','password':'bad'}).status_code,200)
  self.assertEqual(self.client.post('/accounts/login/',{'username':'editor','password':'bad'}).status_code,429)
 def test_new_session_persistence(self):
  self.post(self.ec,'edit',self.edit());new=Client();new.force_login(self.editor)
  self.assertEqual(new.get(f'/api/articles/{self.a.pk}/').json()['title'],'수정 제목')
 def test_html_escaping_and_health(self):
  self.post(self.ec,'edit',dict(title='<script>alert(1)</script>',summary='내용',claims=self.a.claims))
  self.assertContains(self.ec.get('/desk/'),'&lt;script&gt;');self.assertNotContains(self.ec.get('/desk/'),'<script>alert(1)</script>')
  self.assertEqual(self.client.get('/healthz').status_code,200);self.assertEqual(self.client.get('/readyz').status_code,200)
 def test_idempotency_conflict(self):
  self.post(self.pc,'approve');v=Article.objects.get(pk=self.a.pk).version
  self.post(self.pc,'publish',{'idempotency_key':'same','version':v})
  self.assertEqual(self.post(self.pc,'publish',{'idempotency_key':'same','version':v+1}).status_code,409)
 def test_database_snapshot_immutable(self):
  self.post(self.pc,'approve');self.post(self.pc,'publish',{'idempotency_key':'immutable'})
  for operation in [lambda:Edition.objects.update(snapshot={}),lambda:Edition.objects.all().delete()]:
   with self.assertRaises(IntegrityError):
    with transaction.atomic():operation()
  self.assertEqual(Edition.objects.count(),1)
  self.assertTrue(Edition.objects.get().snapshot.get('title'))
 def test_invalid_action(self):self.assertEqual(self.post(self.pc,'delete').status_code,404)
class Concurrent(TransactionTestCase):
 reset_sequences=True
 def setUp(self):
  import importlib
  migration=importlib.import_module('magazine.migrations.0002_immutable_editions')
  with connection.cursor() as cursor:
   for sql in migration.DROP_SQL.split(';'):
    if sql.strip():cursor.execute(sql)
  connection.connection.executescript(migration.CREATE_SQL)
  self.editor,self.publisher=users();self.a,_=ingest(copy.deepcopy(FIXTURE))
 def _fixture_teardown(self):
  # Django flush needs to delete test rows; production trigger removal is never automatic.
  import importlib
  migration=importlib.import_module('magazine.migrations.0002_immutable_editions')
  connection.connection.executescript(migration.DROP_SQL)
  super()._fixture_teardown()
 def race(self,role,action,p):
  barrier=threading.Barrier(2)
  clients=[Client(),Client()]
  for client in clients:client.force_login(get_user_model().objects.get(username=role))
  def one(index):
   close_old_connections();c=clients[index];barrier.wait(timeout=10)
   response=c.post(f'/api/articles/{self.a.pk}/{action}/',data=json.dumps(p),content_type='application/json');close_old_connections();return response.status_code
  with ThreadPoolExecutor(max_workers=2) as pool:return list(pool.map(one,range(2)))
 def test_concurrent_edit(self):
  codes=self.race('editor','edit',dict(version=1,title='동시 변경',summary='본문',claims=self.a.claims))
  self.assertEqual(sorted(codes),[200,409]);self.assertEqual(Article.objects.get().version,2)
 def test_concurrent_publication(self):
  self.a.status='approved';self.a.approved_revision=1;self.a.save()
  codes=self.race('publisher','publish',{'version':1,'idempotency_key':'concurrent'})
  self.assertTrue(all(x in [200,409] for x in codes));self.assertIn(200,codes);self.assertEqual(Edition.objects.count(),1)
