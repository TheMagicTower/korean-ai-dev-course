"""Disposable file-backed SQLite concurrency, backup and rollback exercise.
Run: SIGNAL_ENV=local python scripts/verify_operations.py
No external network, secrets or source data are written to evidence.
"""
import os,sys,json,tempfile,subprocess,sqlite3,threading,secrets,shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
RUN=BASE/'.runtime';RUN.mkdir(exist_ok=True)
work=Path(tempfile.mkdtemp(prefix='verification-',dir=RUN))
os.environ['SIGNAL_ENV']='local';os.environ['SIGNAL_DB']=str(work/'active.sqlite3')
os.environ['DJANGO_SETTINGS_MODULE']='config.settings'
import django
django.setup()
from django.core.management import call_command
from django.contrib.auth.models import User,Group
from django.test import Client,override_settings
from django.db import connections
from news.models import Article,Edition,Audit
from news.domain import article_json

def command(*args,env=None,cwd=BASE):
 result=subprocess.run([sys.executable,'manage.py',*args],cwd=cwd,env=env or os.environ.copy(),capture_output=True,text=True)
 print('COMMAND:', 'python manage.py '+' '.join(args));print(result.stdout.strip());
 if result.returncode:print(result.stderr);raise AssertionError('Command failed')
 return result
command('migrate','--noinput')
command('ingest_recorded',str(BASE.parent/'shared/source-fixture.json'))
for name in ['editor','publisher']:
 env={**os.environ,'SIGNAL_OPERATOR_PASSWORD':secrets.token_urlsafe(30)}
 command('create_operator','--username',name,'--role',name,env=env)
editor=User.objects.get(username='editor');publisher=User.objects.get(username='publisher')
a=Article.objects.get();payload={k:v for k,v in article_json(a).items() if k in ['title','summary','claims','version']}
barrier=threading.Barrier(2)
def edit_worker(n):
 connections.close_all()
 c=Client();c.force_login(User.objects.get(pk=editor.pk))
 barrier.wait()
 r=c.post(f'/api/articles/{a.pk}/edit/',json.dumps({**payload,'title':f'동시 수정 {n}'}),content_type='application/json')
 connections.close_all();return r.status_code
with override_settings(ALLOWED_HOSTS=['testserver']):
 with ThreadPoolExecutor(max_workers=2) as pool:codes=list(pool.map(edit_worker,[1,2]))
 assert sorted(codes)==[200,409],codes
 print('PASS actual two-thread concurrent edit:',codes)
 a.refresh_from_db();p=Client();p.force_login(publisher)
 r=p.post(f'/api/articles/{a.pk}/approve/',json.dumps({'version':a.version}),content_type='application/json');assert r.status_code==200
 approved=r.json();barrier=threading.Barrier(2)
 def publish_worker(n):
  connections.close_all();c=Client();c.force_login(User.objects.get(pk=publisher.pk));barrier.wait()
  r=c.post(f'/api/articles/{a.pk}/publish/',json.dumps({'version':approved['version'],'idempotency_key':'concurrent-identical'}),content_type='application/json')
  connections.close_all();return r.status_code,r.json()
 with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(publish_worker,[1,2]))
 assert sorted(x[0] for x in results)==[200,201],results
 assert len({x[1]['edition']['id'] for x in results})==1
 assert Edition.objects.count()==1
 print('PASS actual two-thread duplicate publish:',[x[0] for x in results],'; editions:',Edition.objects.count())

def fingerprint(path):
 with sqlite3.connect(path) as db:
  tables=[x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
  return {t:sorted(db.execute('SELECT * FROM "'+t+'"').fetchall(),key=repr) for t in tables}
connections.close_all()
before=fingerprint(work/'active.sqlite3')
command('backup_db',str(work/'backup.sqlite3'))
restore_env={**os.environ,'SIGNAL_DB':str(work/'restored.sqlite3')}
command('restore_db',str(work/'backup.sqlite3'),env=restore_env)
assert before==fingerprint(work/'restored.sqlite3')
print('PASS online backup / new-destination restore: all table rows and immutable snapshots identical')
refusal=subprocess.run([sys.executable,'manage.py','restore_db',str(work/'backup.sqlite3')],cwd=BASE,env=restore_env,capture_output=True,text=True)
assert refusal.returncode!=0 and before==fingerprint(work/'restored.sqlite3')
print('PASS existing destination restore rejected without overwrite')
# Only 0002's triggers are reversible; initial schema reversal would destroy data and is forbidden.
command('migrate','news','0001',env=restore_env)
mid=fingerprint(work/'restored.sqlite3');assert {k:v for k,v in before.items() if k!='django_migrations'}=={k:v for k,v in mid.items() if k!='django_migrations'}
command('migrate','news','0002',env=restore_env)
after=fingerprint(work/'restored.sqlite3');assert {k:v for k,v in before.items() if k!='django_migrations'}=={k:v for k,v in after.items() if k!='django_migrations'}
print('PASS disposable migration 0002→0001→0002: all application rows preserved; no destructive 0001 downgrade')
# Real release-directory switch with a deliberately broken candidate health endpoint.
releases=work/'releases';releases.mkdir()
for name in ['stable','broken']:
 target=releases/name;target.mkdir()
 for entry in ['manage.py','config','news','templates','static']:
  source=BASE/entry
  if source.is_dir():shutil.copytree(source,target/entry,ignore=shutil.ignore_patterns('__pycache__'))
  else:shutil.copy2(source,target/entry)
urls=releases/'broken/config/urls.py';urls.write_text(urls.read_text()+"\nurlpatterns.insert(0,path('healthz',lambda request: views.JsonResponse({'status':'broken'},status=503)))\n")
current=work/'current';current.symlink_to(releases/'broken',target_is_directory=True)
probe="from django.test import Client,override_settings;\nwith override_settings(ALLOWED_HOSTS=['testserver']): print(Client().get('/healthz').status_code)"
def probe_release():
 r=subprocess.run([sys.executable,'manage.py','shell','-c',probe],cwd=current,env=restore_env,capture_output=True,text=True)
 assert r.returncode==0,r.stderr
 return r.stdout.strip().splitlines()[-1]
assert probe_release()=='503';current.unlink();current.symlink_to(releases/'stable',target_is_directory=True);assert probe_release()=='200'
assert after==fingerprint(work/'restored.sqlite3')
print('PASS release-directory rollback: broken health503 → archived stable health200; restored DB unchanged')
production={**os.environ,'SIGNAL_ENV':'production','SIGNAL_SECRET_KEY':secrets.token_urlsafe(60),'SIGNAL_ALLOWED_HOSTS':'magazine.example.org'}
command('check','--deploy','--fail-level','WARNING',env=production)
bad={k:v for k,v in os.environ.items() if k not in ['SIGNAL_ENV','SIGNAL_SECRET_KEY','SIGNAL_DB','SIGNAL_ALLOWED_HOSTS']}
r=subprocess.run([sys.executable,'manage.py','check'],cwd=BASE,env=bad,capture_output=True,text=True);assert r.returncode!=0
print('PASS default production rejects missing mandatory environment')
print('PASS operations verification complete; disposable runtime files excluded from version control')
