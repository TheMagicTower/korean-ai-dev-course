import os,sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand,CommandError

class Command(BaseCommand):
 help='SQLite online backup API로 새 파일에 일관된 백업을 만듭니다.'
 def add_arguments(self,parser):parser.add_argument('output_path')
 def handle(self,*args,**options):
  source=Path(settings.DATABASES['default']['NAME']).resolve();destination=Path(options['output_path']).resolve()
  if not source.is_file():raise CommandError('원본 DB를 찾을 수 없습니다.')
  if source==destination:raise CommandError('원본 DB에 덮어쓸 수 없습니다.')
  try:
   fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.close(fd)
  except FileExistsError:raise CommandError('백업 대상은 새 파일이어야 합니다.')
  try:
   with sqlite3.connect(f'file:{source}?mode=ro',uri=True) as src,sqlite3.connect(destination) as dst:
    src.backup(dst)
    if dst.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise CommandError('백업 무결성 검사 실패')
  except Exception:
   destination.unlink(missing_ok=True);raise
  self.stdout.write('온라인 백업 및 무결성 검사를 완료했습니다.')
