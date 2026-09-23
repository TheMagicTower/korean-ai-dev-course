import os,sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand,CommandError

class Command(BaseCommand):
 help='오프라인 새 SIGNAL_DB에만 백업을 복구합니다. 존재하는 DB는 거부합니다.'
 def add_arguments(self,parser):parser.add_argument('input_path')
 def handle(self,*args,**options):
  source=Path(options['input_path']).resolve();destination=Path(settings.DATABASES['default']['NAME']).resolve()
  if not source.is_file() or source==destination:raise CommandError('유효한 별도 백업 파일이 필요합니다.')
  try:
   fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.close(fd)
  except FileExistsError:raise CommandError('복구 대상 DB가 이미 존재합니다. 서버를 중단하고 새 SIGNAL_DB 경로를 사용하십시오.')
  try:
   with sqlite3.connect(f'file:{source}?mode=ro',uri=True) as src,sqlite3.connect(destination) as dst:
    if src.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise CommandError('백업 무결성 검사 실패')
    required={'news_article','news_edition','news_audit','django_migrations'}
    tables={row[0] for row in src.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if not required<=tables:raise CommandError('Signal Magazine 백업이 아닙니다.')
    src.backup(dst)
    if dst.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise CommandError('복구 무결성 검사 실패')
  except Exception:
   destination.unlink(missing_ok=True);raise
  self.stdout.write('새 DB 복구와 무결성 검사를 완료했습니다. 기존 운영 DB는 변경하지 않았습니다.')
