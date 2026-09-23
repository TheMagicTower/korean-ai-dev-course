"""Check both explicit local migrations and fail-closed production settings."""
import json,os,secrets,subprocess,sys,tempfile
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
route=sys.argv[1]
assert route in ['upgrade','greenfield']
cwd=root/'experiments/signal-production'/route
with tempfile.TemporaryDirectory(prefix='signal-release-check-') as tmp:
 base={k:v for k,v in os.environ.items() if not k.startswith('SIGNAL_')}
 result=subprocess.run([sys.executable,'manage.py','check'],cwd=cwd,env=base,capture_output=True,text=True)
 assert result.returncode!=0,'Production default unexpectedly starts without explicit configuration'
 env={**base,'SIGNAL_ENV':'production','SIGNAL_SECRET_KEY':secrets.token_urlsafe(64),'SIGNAL_ALLOWED_HOSTS':'signal.example.invalid','SIGNAL_DB':tmp+'/production.sqlite3'}
 proc=subprocess.run([sys.executable,'manage.py','check','--deploy','--fail-level','WARNING'],cwd=cwd,env=env,capture_output=True,text=True)
 assert proc.returncode==0,proc.stdout+proc.stderr
 env.update(SIGNAL_ENV='local',SIGNAL_ALLOWED_HOSTS='127.0.0.1,localhost')
 migrations=subprocess.run([sys.executable,'manage.py','makemigrations','--check','--dry-run'],cwd=cwd,env=env,capture_output=True,text=True)
 assert migrations.returncode==0,migrations.stdout+migrations.stderr
 print(json.dumps({'at':datetime.now(timezone.utc).isoformat(),'route':route,'missing_production_config':'refused','production_deploy_check':proc.stdout.strip(),'migration_drift':migrations.stdout.strip(),'status':'passed'},ensure_ascii=False))
