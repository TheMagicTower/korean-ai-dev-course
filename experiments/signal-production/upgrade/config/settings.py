import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
BASE_DIR=Path(__file__).resolve().parent.parent
ENV=os.getenv('SIGNAL_ENV','production')
if ENV not in ('local','production'): raise ImproperlyConfigured('Invalid SIGNAL_ENV')
LOCAL=ENV=='local'
SECRET_KEY=os.getenv('SIGNAL_SECRET_KEY','local-only-do-not-deploy' if LOCAL else '')
DB=os.getenv('SIGNAL_DB',str(BASE_DIR/'signal.sqlite3') if LOCAL else '')
HOSTS=os.getenv('SIGNAL_ALLOWED_HOSTS','localhost,127.0.0.1' if LOCAL else '')
if not SECRET_KEY or not DB or not HOSTS or not Path(DB).is_absolute(): raise ImproperlyConfigured('Explicit secret, absolute database and hosts required')
if not LOCAL and (len(SECRET_KEY)<50 or '*' in HOSTS or SECRET_KEY.startswith('local-')): raise ImproperlyConfigured('Unsafe production settings')
ALLOWED_HOSTS=HOSTS.split(',')
if LOCAL and any(h not in ['localhost','127.0.0.1','[::1]','testserver'] for h in ALLOWED_HOSTS):raise ImproperlyConfigured('Local mode is loopback only')
DEBUG=False
INSTALLED_APPS=['django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','magazine']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']
ROOT_URLCONF='config.urls'
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[BASE_DIR/'templates'],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application'
DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':DB,'OPTIONS':{'timeout':5,'transaction_mode':'IMMEDIATE'}}}
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'}]
LANGUAGE_CODE='ko-kr'
TIME_ZONE='UTC'
USE_TZ=True
STATIC_URL='/static/'
STATIC_ROOT=BASE_DIR/'collected-static'
STATICFILES_DIRS=[BASE_DIR/'static']
LOGIN_URL='/accounts/login/'
SESSION_COOKIE_HTTPONLY=True
CSRF_COOKIE_HTTPONLY=True
SESSION_COOKIE_SECURE=not LOCAL
CSRF_COOKIE_SECURE=not LOCAL
SECURE_SSL_REDIRECT=not LOCAL
SECURE_HSTS_SECONDS=31536000 if not LOCAL else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS=not LOCAL
SECURE_HSTS_PRELOAD=not LOCAL
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS='DENY'
DATA_UPLOAD_MAX_MEMORY_SIZE=65536
SESSION_COOKIE_AGE=28800
CSRF_FAILURE_VIEW='magazine.views.csrf_failure'
LOGGING={'version':1,'disable_existing_loggers':False,'handlers':{'console':{'class':'logging.StreamHandler'}},'loggers':{'django.request':{'handlers':['console'],'level':'CRITICAL','propagate':False}}}
