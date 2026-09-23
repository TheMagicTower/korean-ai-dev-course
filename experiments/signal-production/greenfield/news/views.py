import hashlib,json,logging
from functools import wraps
from datetime import timedelta
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.decorators import login_required
from django.db import connection,OperationalError,IntegrityError,transaction
from django.http import JsonResponse,HttpResponse
from django.core.exceptions import RequestDataTooBig
from django.shortcuts import render,redirect,get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from .models import Article,Edition,LoginAttempt
from .domain import Problem,article_json,edition_json,create,mutate
logger=logging.getLogger('signal')

def csrf_failure(request,reason=''):return JsonResponse({'error':'CSRF 검증 실패'},status=403)

def role(user,name):return user.is_authenticated and user.groups.filter(name=name).exists()

def api(fn):
 @wraps(fn)
 def wrapped(request,*args,**kwargs):
  try:
   if not request.user.is_authenticated:return JsonResponse({'error':'로그인이 필요합니다.'},status=401)
   if not (role(request.user,'editor') or role(request.user,'publisher')):raise Problem('편집국 권한이 없습니다.',403)
   return fn(request,*args,**kwargs)
  except RequestDataTooBig:return JsonResponse({'error':'요청이 너무 큽니다.'},status=400)
  except Problem as exc:return JsonResponse({'error':exc.message},status=exc.status)
  except (OperationalError,IntegrityError):return JsonResponse({'error':'동시 변경 충돌입니다. 최신 버전을 불러온 뒤 재시도하십시오.'},status=409)
  except Exception:
   logger.error('api_failure',extra={'event':'api_failure'})
   return JsonResponse({'error':'요청을 처리할 수 없습니다.'},status=500)
 return wrapped

def body(request):
 if request.content_type!='application/json':raise Problem('application/json 요청이 필요합니다.')
 try:
  if int(request.META.get('CONTENT_LENGTH') or 0)>65536:raise Problem('요청이 너무 큽니다.')
  data=json.loads(request.body)
 except (ValueError,UnicodeDecodeError):raise Problem('JSON 형식을 확인하십시오.')
 if not isinstance(data,dict):raise Problem('JSON 객체가 필요합니다.')
 return data

def require(request,name):
 if not role(request.user,name):raise Problem('이 작업에 필요한 역할이 없습니다.',403)

@api
def articles(request):
 if request.method=='GET':return JsonResponse({'articles':[article_json(a) for a in Article.objects.order_by('-updated_at')[:100]]})
 if request.method!='POST':raise Problem('허용되지 않은 HTTP 메서드입니다.',405)
 require(request,'editor')
 return JsonResponse(article_json(create(body(request),request.user)),status=201)

@api
def detail(request,article_id):
 if request.method!='GET':raise Problem('허용되지 않은 HTTP 메서드입니다.',405)
 try:a=Article.objects.get(pk=article_id)
 except Article.DoesNotExist:raise Problem('기사를 찾을 수 없습니다.',404)
 return JsonResponse(article_json(a))

@api
def action(request,article_id,action):
 if request.method!='POST':raise Problem('POST 요청이 필요합니다.',405)
 require(request,'editor' if action=='edit' else 'publisher')
 a,e,created=mutate(article_id,action,body(request),request.user)
 if action=='publish':return JsonResponse({'article':article_json(a),'edition':edition_json(e)},status=201 if created else 200)
 return JsonResponse(article_json(a))

def home(request):return render(request,'home.html',{'editions':Edition.objects.order_by('-published_at')})
def edition(request,edition_id):return render(request,'home.html',{'editions':[get_object_or_404(Edition,pk=edition_id)],'single':True})
def health(request):return JsonResponse({'status':'ok'})
def ready(request):
 try:
  with connection.cursor() as cur:cur.execute('SELECT COUNT(*) FROM news_article');cur.fetchone()
  return JsonResponse({'status':'ready'})
 except Exception:return JsonResponse({'status':'unavailable'},status=503)

@ensure_csrf_cookie
def login_view(request):
 error=''
 if request.method=='POST':
  username=request.POST.get('username','');password=request.POST.get('password','')
  if len(username)>150 or len(password)>1024:return render(request,'login.html',{'error':'입력 길이를 확인하십시오.'},status=400)
  key=hashlib.sha256((username.casefold()+'|'+request.META.get('REMOTE_ADDR','')).encode()).hexdigest()
  now=timezone.now()
  with transaction.atomic():
   attempt,_=LoginAttempt.objects.get_or_create(key=key,defaults={'window_started':now})
   if now-attempt.window_started>timedelta(minutes=10):attempt.failures=0;attempt.window_started=now
   if attempt.failures>=5:return render(request,'login.html',{'error':'로그인 시도가 많습니다. 10분 후 다시 시도하십시오.'},status=429)
   user=authenticate(request,username=username,password=password)
   if user is not None and (role(user,'editor') or role(user,'publisher')):
    attempt.delete();login(request,user);return redirect('/desk/')
   attempt.failures+=1;attempt.save();error='계정 또는 비밀번호를 확인하십시오.'
 return render(request,'login.html',{'error':error},status=400 if error else 200)

def logout_view(request):
 if request.method!='POST':return JsonResponse({'error':'POST 요청이 필요합니다.'},status=405)
 logout(request);return redirect('/')

@login_required
@ensure_csrf_cookie
def desk(request):
 if not (role(request.user,'editor') or role(request.user,'publisher')):return HttpResponse('권한이 없습니다.',status=403)
 return render(request,'desk.html',{'is_editor':role(request.user,'editor'),'is_publisher':role(request.user,'publisher')})

def stylesheet(request):
 from pathlib import Path
 from django.conf import settings
 return HttpResponse((Path(settings.BASE_DIR)/'static/style.css').read_text(),content_type='text/css')
def script(request):
 from pathlib import Path
 from django.conf import settings
 return HttpResponse((Path(settings.BASE_DIR)/'static/desk.js').read_text(),content_type='application/javascript')

def error400(request,exception=None):
 return JsonResponse({'error':'요청을 확인하십시오.'},status=400) if request.path.startswith('/api/') else HttpResponse('요청을 확인하십시오.',status=400)
def error404(request,exception=None):
 return JsonResponse({'error':'경로를 찾을 수 없습니다.'},status=404) if request.path.startswith('/api/') else HttpResponse('페이지를 찾을 수 없습니다.',status=404)
def error500(request):
 return JsonResponse({'error':'요청을 처리할 수 없습니다.'},status=500) if request.path.startswith('/api/') else HttpResponse('요청을 처리할 수 없습니다.',status=500)
