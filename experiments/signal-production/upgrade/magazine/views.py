import json,hashlib,logging
from datetime import timedelta
from django.http import JsonResponse,HttpResponse
from django.core.exceptions import RequestDataTooBig
from django.shortcuts import render,redirect
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.decorators import login_required
from django.db import connection,OperationalError,IntegrityError,transaction
from django.utils import timezone
from django.views.decorators.http import require_http_methods,require_POST
from django.middleware.csrf import get_token
from .models import Article,Edition,LoginAttempt
from .domain import article_json,create,mutate,Invalid,Conflict
log=logging.getLogger('signal')
def role(user):
 if not user.is_authenticated:return None
 names=set(user.groups.values_list('name',flat=True))
 return 'publisher' if 'publisher' in names else 'editor' if 'editor' in names else None
def csrf_failure(request,reason=''):return JsonResponse({'error':'CSRF 검증 실패'},status=403)
def home(request):return render(request,'home.html',{'editions':Edition.objects.order_by('-id')})
def health(request):return JsonResponse({'status':'alive'})
def ready(request):
 try:
  Article.objects.exists();return JsonResponse({'status':'ready'})
 except Exception:return JsonResponse({'status':'unavailable'},status=503)
@require_http_methods(['GET','POST'])
def sign_in(request):
 error=''
 if request.method=='POST':
  username=request.POST.get('username','')[:150];password=request.POST.get('password','')
  key=hashlib.sha256((username+'|'+request.META.get('REMOTE_ADDR','')).encode()).hexdigest()
  now=timezone.now()
  with transaction.atomic():
   attempt,_=LoginAttempt.objects.get_or_create(key=key,defaults={'since':now})
   if now-attempt.since>timedelta(minutes=10):attempt.count=0;attempt.since=now
   if attempt.count>=5:return render(request,'login.html',{'error':'로그인 시도가 많습니다. 10분 뒤 다시 시도해 주세요.'},status=429)
   user=authenticate(request,username=username,password=password) if len(password)<=256 else None
   if user and role(user):
    attempt.delete();login(request,user);return redirect('/desk/')
   attempt.count+=1;attempt.save();error='계정 또는 비밀번호를 확인해 주세요.'
 return render(request,'login.html',{'error':error})
@require_POST
def sign_out(request):logout(request);return redirect('/')
@login_required
def desk(request):
 r=role(request.user)
 if not r:return HttpResponse('접근 권한이 없습니다.',status=403)
 return render(request,'desk.html',{'articles':Article.objects.order_by('-id'),'role':r,'csrf_value':get_token(request)})
@require_http_methods(['GET','POST'])
def api(request,pk=None,action=None):
 r=role(request.user)
 if action and action not in ('edit','approve','hold','publish'):return JsonResponse({'error':'지원하지 않는 작업'},status=404)
 if not r:return JsonResponse({'error':'인증이 필요합니다.'},status=401)
 try:
  if request.method=='GET':
   if action:return JsonResponse({'error':'POST만 지원합니다.'},status=405)
   return JsonResponse(article_json(Article.objects.get(pk=pk)) if pk else {'articles':[article_json(a) for a in Article.objects.order_by('id')]})
  expected='editor' if action in (None,'edit') else 'publisher'
  if r!=expected:return JsonResponse({'error':'이 작업의 권한이 없습니다.'},status=403)
  if len(request.body)>65536:raise Invalid('요청이 너무 큽니다.')
  try:p=json.loads(request.body)
  except (ValueError,UnicodeDecodeError):raise Invalid('올바른 JSON이 필요합니다.')
  if not isinstance(p,dict):raise Invalid('JSON 객체가 필요합니다.')
  if action is None:
   if pk:return JsonResponse({'error':'지원하지 않는 작업'},status=405)
   return JsonResponse(article_json(create(p,request.user)),status=201)
  a,e=mutate(pk,action,p,request.user)
  if e:return JsonResponse({'article':article_json(a),'edition':{'id':e.pk,'snapshot':e.snapshot,'created_at':e.created_at.isoformat()}},status=200)
  return JsonResponse(article_json(a))
 except Article.DoesNotExist:return JsonResponse({'error':'기사를 찾을 수 없습니다.'},status=404)
 except RequestDataTooBig:return JsonResponse({'error':'요청이 너무 큽니다.'},status=400)
 except Invalid as e:return JsonResponse({'error':str(e)},status=400)
 except (Conflict,IntegrityError):return JsonResponse({'error':'동시 변경 또는 재시도 키 충돌입니다.'},status=409)
 except OperationalError:return JsonResponse({'error':'저장소가 사용 중입니다. 잠시 후 다시 시도해 주세요.'},status=409)
 except Exception:
  log.error('request_failed action=%s article=%s',action,pk)
  return JsonResponse({'error':'요청 처리에 실패했습니다.'},status=500)
