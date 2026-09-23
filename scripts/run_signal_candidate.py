"""Local disposable service runner for the shared comparison contract.
Private runtime files stay in /tmp; they are never part of the course artifact.
"""
import argparse,json,os,secrets,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PYTHON='/tmp/kdev-production-venv/bin/python'
p=argparse.ArgumentParser();p.add_argument('action',choices=['setup','serve','probe','recover']);p.add_argument('route',choices=['upgrade','greenfield']);args=p.parse_args()
route=args.route;folder=ROOT/'experiments/signal-production'/route
runtime=Path('/tmp')/f'kdev-signal-{route}-20260923';runtime.mkdir(mode=0o700,exist_ok=True)
credential=runtime/'credentials.json';port=8871 if route=='upgrade' else 8872
if not credential.exists():
 credential.write_text(json.dumps({k:secrets.token_urlsafe(36) for k in ['SIGNAL_SECRET_KEY','SIGNAL_EDITOR_PASSWORD','SIGNAL_PUBLISHER_PASSWORD']}));credential.chmod(0o600)
private=json.loads(credential.read_text());env={**os.environ,**private,'SIGNAL_ENV':'local','SIGNAL_ALLOWED_HOSTS':'127.0.0.1,localhost','SIGNAL_DB':str(runtime/'db.sqlite3')}
def cmd(parts,extra=None):return subprocess.run([PYTHON,'manage.py',*parts],cwd=folder,env={**env,**(extra or {})},check=True,text=True)
if args.action=='setup':
 cmd(['migrate','--noinput'])
 for role in ['editor','publisher']:cmd(['create_operator','--username',role,'--role',role],{'SIGNAL_OPERATOR_PASSWORD':private['SIGNAL_'+role.upper()+'_PASSWORD']})
 cmd(['ingest_recorded',str(ROOT/'experiments/signal-production/shared/source-fixture.json')])
 print('Local candidate ready:',route,'http://127.0.0.1:'+str(port))
elif args.action=='serve':
 os.chdir(folder);os.execve(PYTHON,[PYTHON,'-m','gunicorn','config.wsgi:application','--bind',f'127.0.0.1:{port}','--workers','1','--threads','4','--no-control-socket','--access-logfile','-','--error-logfile','-'],env)
elif args.action=='probe':
 subprocess.run([PYTHON,str(ROOT/'scripts/probe_signal_service.py'),'--url',f'http://127.0.0.1:{port}','--output',str(folder/'evidence/root-http.json')],env=env,check=True)
elif args.action=='recover':
 import sqlite3
 backup=runtime/('backup-'+secrets.token_hex(4)+'.sqlite3');restored=runtime/('restore-'+secrets.token_hex(4)+'.sqlite3')
 cmd(['backup_db',str(backup)])
 cmd(['restore_db',str(backup)],{'SIGNAL_DB':str(restored)})
 def content(path):
  with sqlite3.connect(path) as c:
   assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
   tables=[r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
   return {t:c.execute('SELECT * FROM "'+t+'" ORDER BY rowid').fetchall() for t in tables}
 assert content(backup)==content(restored),'Backup and restored rows differ'
 report={'status':'passed','backup_restore_all_tables_equal':True,'tables':list(content(restored)),'restored_to_fresh_destination':True}
 (folder/'evidence/root-recovery.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report))
