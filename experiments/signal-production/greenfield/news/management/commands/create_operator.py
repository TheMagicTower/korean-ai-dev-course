import os
from django.core.management.base import BaseCommand,CommandError
from django.contrib.auth.models import User,Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

class Command(BaseCommand):
 help='환경변수 비밀번호로 새 편집국 계정을 발급합니다. 기존 계정은 변경하지 않습니다.'
 def add_arguments(self,parser):
  parser.add_argument('--username',required=True)
  parser.add_argument('--role',choices=['editor','publisher'],required=True)
 @transaction.atomic
 def handle(self,*args,**options):
  username=options['username'];password=os.environ.get('SIGNAL_OPERATOR_PASSWORD','')
  if not username or len(username)>150:raise CommandError('계정 이름 길이를 확인하십시오.')
  if User.objects.filter(username=username).exists():raise CommandError('이미 존재하는 계정입니다.')
  user=User(username=username)
  try:user.full_clean(exclude=['password']);validate_password(password,user)
  except ValidationError:raise CommandError('계정 또는 비밀번호 정책을 충족하지 못했습니다. 비밀번호는 최소 12자이며 일반적인 비밀번호는 허용되지 않습니다.')
  user.set_password(password);user.save();user.groups.add(Group.objects.get_or_create(name=options['role'])[0])
  self.stdout.write('운영자 계정을 발급했습니다.')
