from django.db import models
from django.conf import settings
from django.db.models import Q

class Article(models.Model):
 title=models.CharField(max_length=200)
 summary=models.TextField()
 claims=models.JSONField(default=list)
 sources=models.JSONField(default=list)
 provenance=models.JSONField(default=dict)
 version=models.PositiveIntegerField(default=1)
 status=models.CharField(max_length=12,default='draft')
 approved_version=models.PositiveIntegerField(null=True,blank=True)
 approved_by=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,on_delete=models.PROTECT,related_name='approvals')
 last_editor=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,on_delete=models.PROTECT,related_name='edits')
 correction_reason=models.CharField(max_length=1000,blank=True)
 import_digest=models.CharField(max_length=64,null=True,unique=True)
 updated_at=models.DateTimeField(auto_now=True)
 class Meta:
  constraints=[models.CheckConstraint(condition=Q(version__gte=1),name='positive_version'),models.CheckConstraint(condition=Q(status__in=['draft','approved','held','published']),name='valid_status')]

class Edition(models.Model):
 article=models.ForeignKey(Article,on_delete=models.PROTECT,related_name='editions')
 revision=models.PositiveIntegerField()
 snapshot=models.JSONField()
 idempotency_key=models.CharField(max_length=128,unique=True)
 request_fingerprint=models.CharField(max_length=64)
 published_at=models.DateTimeField(auto_now_add=True)
 class Meta:
  constraints=[models.UniqueConstraint(fields=['article','revision'],name='unique_published_revision')]

class Audit(models.Model):
 actor=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,on_delete=models.PROTECT)
 action=models.CharField(max_length=32)
 article=models.ForeignKey(Article,on_delete=models.PROTECT)
 version=models.PositiveIntegerField()
 reason=models.CharField(max_length=1000,blank=True)
 at=models.DateTimeField(auto_now_add=True)

class LoginAttempt(models.Model):
 key=models.CharField(max_length=64,unique=True)
 failures=models.PositiveIntegerField(default=0)
 window_started=models.DateTimeField()
