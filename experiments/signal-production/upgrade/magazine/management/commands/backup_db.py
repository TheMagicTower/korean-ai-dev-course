import sqlite3,os
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand,CommandError
class Command(BaseCommand):
 def add_arguments(self,p):p.add_argument('output_path')
 def handle(self,*args,**o):
  dest=Path(o['output_path']).resolve();source=Path(settings.DATABASES['default']['NAME']).resolve()
  if not source.exists() or dest==source or dest.exists():raise CommandError('Source must exist and output must be new')
  fd=os.open(dest,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(fd)
  try:
   with sqlite3.connect(source) as src,sqlite3.connect(dest) as out:src.backup(out)
  except Exception:
   dest.unlink(missing_ok=True);raise CommandError('Backup failed')
  self.stdout.write('Consistent SQLite backup created')
