"""Disposable persistent SQLite migration/backup/release rollback rehearsal."""
import os,sys,subprocess,tempfile,sqlite3,json,secrets,socket,time,urllib.request
from pathlib import Path
base=Path(__file__).resolve().parents[1]
def serve_snapshot(db):
 with socket.socket() as sock:
  sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
 env=dict(os.environ,SIGNAL_ENV='local',SIGNAL_DB=str(db))
 args=[sys.executable,'-m','gunicorn','config.wsgi:application','--bind',f'127.0.0.1:{port}','--workers','1','--no-control-socket']
 print('COMMAND: python -m gunicorn config.wsgi:application --bind localhost:<ephemeral> --workers 1 --no-control-socket')
 process=subprocess.Popen(args,cwd=base,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for _ in range(100):
   try:
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/readyz',timeout=1) as response:assert response.status==200
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/',timeout=1) as response:return response.read().decode()
   except OSError:time.sleep(.05)
  raise AssertionError('Gunicorn readiness failed')
 finally:
  process.terminate();process.wait(timeout=10)
def cmd(args,db,extra=None,ok=True):
 env=dict(os.environ,SIGNAL_ENV='local',SIGNAL_DB=str(db));env.update(extra or {})
 p=subprocess.run([sys.executable,'manage.py',*args],cwd=base,env=env,text=True,capture_output=True)
 print('COMMAND:', 'python manage.py',' '.join(args));print(p.stdout,p.stderr)
 assert (p.returncode==0)==ok,(args,p.returncode)
 return p
with tempfile.TemporaryDirectory(prefix='signal-upgrade-ops-') as d:
 d=Path(d);db=d/'original.db';backup=d/'backup.db';restored=d/'restored.db'
 cmd(['migrate','--noinput'],db)
 cmd(['ingest_recorded','../shared/source-fixture.json'],db)
 cmd(['ingest_recorded','../shared/source-fixture.json'],db)
 for role in ['editor','publisher']:
  cmd(['create_operator','--username',role,'--role',role],db,{'SIGNAL_OPERATOR_PASSWORD':secrets.token_urlsafe(30)})
 script="from magazine.models import Article;from magazine.domain import mutate;from django.contrib.auth import get_user_model;a=Article.objects.first();u=get_user_model().objects.get(username='publisher');a,_=mutate(a.pk,'approve',{'version':a.version},u);mutate(a.pk,'publish',{'version':a.version,'idempotency_key':'ops-publication'},u);print('published snapshot persisted')"
 cmd(['shell','-c',script],db)
 before=serve_snapshot(db)
 cmd(['backup_db',str(backup)],db)
 cmd(['restore_db',str(backup)],restored)
 def snapshot(path):
  with sqlite3.connect(path) as c:return {'counts':{t:c.execute('SELECT COUNT(*) FROM '+t).fetchone()[0] for t in ['magazine_article','magazine_edition','magazine_audit','auth_user']},'editions':c.execute('SELECT snapshot FROM magazine_edition ORDER BY id').fetchall()}
 assert snapshot(db)==snapshot(restored);print('PASS online SQLite backup + new offline restore: counts and publication snapshots equal')
 cmd(['restore_db',str(backup)],db,ok=False)
 cmd(['migrate','--plan'],restored)
 cmd(['migrate','--noinput'],restored)
 after=serve_snapshot(restored)
 assert before==after;print('PASS actual Gunicorn stop + new restored DB path restart: anonymous publication HTML identical')
 assert snapshot(db)==snapshot(restored);print('PASS release rollback rehearsal: restored pre-release snapshot on new DB; same release migration no-op; no destructive downgrade')
 cmd(['shell','-c',"from magazine.models import Edition;assert Edition.objects.count()==1;print('Fresh process persisted publication:',Edition.objects.first().snapshot['title'])"],restored)
 cmd(['check','--deploy','--fail-level','WARNING'],d/'prod.db',{'SIGNAL_ENV':'production','SIGNAL_SECRET_KEY':secrets.token_urlsafe(64),'SIGNAL_ALLOWED_HOSTS':'signal.example.org'})
 cmd(['check'],d/'unsafe.db',{'SIGNAL_ENV':'production','SIGNAL_SECRET_KEY':'short','SIGNAL_ALLOWED_HOSTS':'*'},ok=False)
 print('PASS production secure settings and unsafe fail-closed')
