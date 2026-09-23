import os
from django.core.management.base import BaseCommand,CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
class Command(BaseCommand):
 def add_arguments(self,p):p.add_argument('--username',required=True);p.add_argument('--role',required=True,choices=['editor','publisher'])
 def handle(self,*args,**o):
  password=os.getenv('SIGNAL_OPERATOR_PASSWORD')
  if not password:raise CommandError('SIGNAL_OPERATOR_PASSWORD required')
  user=get_user_model()(username=o['username'])
  try:user.full_clean(exclude=['password']);validate_password(password,user)
  except ValidationError as e:raise CommandError('; '.join(e.messages))
  with transaction.atomic():
   user.set_password(password);user.save();group,_=Group.objects.get_or_create(name=o['role']);user.groups.add(group)
  self.stdout.write('Operator created: '+user.username+' / '+o['role'])
