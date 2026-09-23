import sqlite3,os
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand,CommandError
class Command(BaseCommand):
 def add_arguments(self,p):p.add_argument('input_path')
 def handle(self,*args,**o):
  src=Path(o['input_path']).resolve();dest=Path(settings.DATABASES['default']['NAME']).resolve()
  if dest.exists() or not src.exists() or src==dest:raise CommandError('Offline restore requires an absent new SIGNAL_DB destination')
  with sqlite3.connect(f'file:{src}?mode=ro',uri=True) as source:
   if source.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise CommandError('Invalid backup')
   if not source.execute("SELECT name FROM sqlite_master WHERE name='magazine_article'").fetchone():raise CommandError('Not a Signal backup')
   fd=os.open(dest,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(fd)
   try:
    with sqlite3.connect(dest) as output:source.backup(output)
   except Exception:
    dest.unlink(missing_ok=True);raise CommandError('Restore failed')
  self.stdout.write('Restored to new offline destination')
