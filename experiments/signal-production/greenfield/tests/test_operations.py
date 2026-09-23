import json,os,tempfile,hashlib,sqlite3
from pathlib import Path
from io import StringIO
from django.test import TestCase,override_settings
from django.core.management import call_command
from django.core.management.base import CommandError
from django.contrib.auth.models import User
from news.models import Article,Audit

class OperationsTests(TestCase):
 def test_import_is_validated_idempotent_unapproved(self):
  fixture=Path(__file__).resolve().parents[2]/'shared/source-fixture.json'
  call_command('ingest_recorded',str(fixture),stdout=StringIO());call_command('ingest_recorded',str(fixture),stdout=StringIO())
  self.assertEqual(Article.objects.count(),1)
  a=Article.objects.get();self.assertEqual(a.status,'draft');self.assertIsNone(a.approved_version)
  self.assertEqual(a.provenance['run']['model'],'jev-1.13.0');self.assertEqual(Audit.objects.count(),1)
  data=json.loads(fixture.read_text());data['sources'][0]['url']='https://evil.test/'
  with tempfile.TemporaryDirectory() as temp:
   path=Path(temp)/'bad.json';path.write_text(json.dumps(data))
   with self.assertRaises(CommandError):call_command('ingest_recorded',str(path))
 def test_operator_requires_valid_password_and_single_role(self):
  from unittest.mock import patch
  with patch.dict(os.environ,{'SIGNAL_OPERATOR_PASSWORD':'short'}):
   with self.assertRaises(CommandError):call_command('create_operator',username='test-editor',role='editor')
  with patch.dict(os.environ,{'SIGNAL_OPERATOR_PASSWORD':'A-long-operator-passphrase-123!'}):
   call_command('create_operator',username='test-editor',role='editor',stdout=StringIO())
  user=User.objects.get(username='test-editor');self.assertTrue(user.check_password('A-long-operator-passphrase-123!'))
  self.assertEqual(list(user.groups.values_list('name',flat=True)),['editor'])
 def test_login_rate_limit_expiry_and_csrf(self):
  from django.test import Client
  from django.utils import timezone
  from datetime import timedelta
  from news.models import LoginAttempt
  c=Client(enforce_csrf_checks=True)
  self.assertEqual(c.post('/accounts/login/',{'username':'a','password':'b'}).status_code,403)
  for _ in range(5):self.assertEqual(self.client.post('/accounts/login/',{'username':'a','password':'b'}).status_code,400)
  self.assertEqual(self.client.post('/accounts/login/',{'username':'a','password':'b'}).status_code,429)
  LoginAttempt.objects.update(window_started=timezone.now()-timedelta(minutes=11))
  self.assertEqual(self.client.post('/accounts/login/',{'username':'a','password':'b'}).status_code,400)
