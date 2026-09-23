from django.db import models
from django.conf import settings
class Article(models.Model):
 title=models.CharField(max_length=200)
 summary=models.TextField()
 claims=models.JSONField()
 sources=models.JSONField()
 provenance=models.JSONField()
 version=models.PositiveIntegerField(default=1)
 status=models.CharField(max_length=12,default='draft')
 author=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,on_delete=models.PROTECT)
 approved_revision=models.PositiveIntegerField(null=True)
 correction_reason=models.TextField(blank=True)
 class Meta:
  constraints=[models.CheckConstraint(condition=models.Q(version__gte=1),name='positive_version'),models.CheckConstraint(condition=models.Q(status__in=['draft','approved','held','published']),name='known_status')]
class Edition(models.Model):
 article=models.ForeignKey(Article,on_delete=models.PROTECT)
 revision=models.PositiveIntegerField()
 snapshot=models.JSONField()
 idempotency_key=models.CharField(max_length=100,unique=True)
 request_hash=models.CharField(max_length=64)
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta:
  constraints=[models.UniqueConstraint(fields=['article','revision'],name='one_edition_per_revision')]
 def save(self,*args,**kwargs):
  if self.pk:raise ValueError('Published snapshots are immutable')
  return super().save(*args,**kwargs)
class Audit(models.Model):
 actor=models.CharField(max_length=150)
 action=models.CharField(max_length=30)
 article=models.ForeignKey(Article,on_delete=models.PROTECT)
 version=models.PositiveIntegerField()
 at=models.DateTimeField(auto_now_add=True)
class ImportRecord(models.Model):
 digest=models.CharField(max_length=64,unique=True)
 article=models.ForeignKey(Article,on_delete=models.PROTECT)
class LoginAttempt(models.Model):
 key=models.CharField(max_length=64,unique=True)
 count=models.PositiveIntegerField(default=0)
 since=models.DateTimeField()
