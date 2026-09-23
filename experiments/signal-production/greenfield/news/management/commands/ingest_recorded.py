import json,hashlib
from pathlib import Path
from django.core.management.base import BaseCommand,CommandError
from django.db import transaction
from news.models import Article
from news.domain import create,Problem

class Command(BaseCommand):
 help='기록된 AI 입력을 미승인 초안으로 가져옵니다.'
 def add_arguments(self,parser):parser.add_argument('path')
 @transaction.atomic
 def handle(self,*args,**options):
  path=Path(options['path'])
  if not path.is_file() or path.stat().st_size>65536:raise CommandError('입력 파일이 없거나 64 KiB를 넘었습니다.')
  try:
   data=json.loads(path.read_text())
   if not isinstance(data,dict) or data.get('mode')!='recorded-run' or not isinstance(data.get('draft'),dict):raise Problem('recorded-run 형식이 필요합니다.')
   digest=hashlib.sha256(json.dumps(data,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
   if Article.objects.filter(import_digest=digest).exists():self.stdout.write('이미 가져온 기록입니다.');return
   payload={**data['draft'],'sources':data.get('sources'),'provenance':{k:v for k,v in data.items() if k not in ['draft','sources','editions','corrections']}}
   a=create(payload,None,import_digest=digest)
  except (ValueError,TypeError,Problem) as exc:raise CommandError(exc.message if isinstance(exc,Problem) else '기록 JSON 형식이 잘못되었습니다.')
  self.stdout.write(f'미승인 초안 {a.pk}를 저장했습니다.')
