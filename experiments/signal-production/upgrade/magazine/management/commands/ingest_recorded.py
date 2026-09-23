import json
from pathlib import Path
from django.core.management.base import BaseCommand,CommandError
from magazine.domain import ingest,Invalid
class Command(BaseCommand):
 def add_arguments(self,p):p.add_argument('path')
 def handle(self,*args,**o):
  path=Path(o['path'])
  if path.stat().st_size>65536:raise CommandError('Input exceeds 64 KiB')
  try:a,created=ingest(json.loads(path.read_text()))
  except (ValueError,TypeError,KeyError) as e:raise CommandError(str(e))
  self.stdout.write(f'article={a.pk} created={created} status={a.status}')
