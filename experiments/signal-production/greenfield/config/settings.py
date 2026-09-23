import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
BASE_DIR=Path(__file__).resolve().parent.parent
ENV=os.environ.get("SIGNAL_ENV","production")
if ENV not in ("local","production"): raise ImproperlyConfigured("SIGNAL_ENV must be local or production")
SECRET_KEY=os.environ.get("SIGNAL_SECRET_KEY", "local-development-only-key-not-for-production" if ENV=="local" else "")
raw_db=os.environ.get("SIGNAL_DB", str(BASE_DIR/"runtime.sqlite3") if ENV=="local" else "")
ALLOWED_HOSTS=os.environ.get("SIGNAL_ALLOWED_HOSTS","localhost,127.0.0.1" if ENV=="local" else "").split(",")
if ENV=="production" and (len(SECRET_KEY)<50 or not raw_db or not Path(raw_db).is_absolute() or not all(ALLOWED_HOSTS) or "*" in ALLOWED_HOSTS): raise ImproperlyConfigured("Production requires a 50+ character secret, absolute SIGNAL_DB and explicit SIGNAL_ALLOWED_HOSTS")
if ENV=="local" and any(h not in ("localhost","127.0.0.1","[::1]") for h in ALLOWED_HOSTS): raise ImproperlyConfigured("Local mode only permits loopback hosts")
if raw_db and not Path(raw_db).is_absolute(): raise ImproperlyConfigured("SIGNAL_DB must be an absolute path")
DEBUG=False
INSTALLED_APPS=["django.contrib.auth","django.contrib.contenttypes","django.contrib.sessions","django.contrib.staticfiles","news"]
MIDDLEWARE=["django.middleware.security.SecurityMiddleware","django.contrib.sessions.middleware.SessionMiddleware","django.middleware.common.CommonMiddleware","django.middleware.csrf.CsrfViewMiddleware","django.contrib.auth.middleware.AuthenticationMiddleware"]
ROOT_URLCONF="config.urls"
TEMPLATES=[{"BACKEND":"django.template.backends.django.DjangoTemplates","DIRS":[BASE_DIR/"templates"],"APP_DIRS":True,"OPTIONS":{"context_processors":["django.template.context_processors.request","django.contrib.auth.context_processors.auth","django.template.context_processors.csrf"]}}]
DATABASES={"default":{"ENGINE":"django.db.backends.sqlite3","NAME":raw_db,"OPTIONS":{"timeout":5,"transaction_mode":"IMMEDIATE"}}}
AUTH_PASSWORD_VALIDATORS=[{"NAME":"django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},{"NAME":"django.contrib.auth.password_validation.MinimumLengthValidator","OPTIONS":{"min_length":12}},{"NAME":"django.contrib.auth.password_validation.CommonPasswordValidator"},{"NAME":"django.contrib.auth.password_validation.NumericPasswordValidator"}]
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SECURE=ENV=="production"
CSRF_COOKIE_SECURE=ENV=="production"
SECURE_SSL_REDIRECT=ENV=="production"
SECURE_HSTS_SECONDS=31536000 if ENV=="production" else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS=ENV=="production"
SECURE_HSTS_PRELOAD=ENV=="production"
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS="DENY"
MIDDLEWARE.append("django.middleware.clickjacking.XFrameOptionsMiddleware")
DATA_UPLOAD_MAX_MEMORY_SIZE=65536
DATA_UPLOAD_MAX_NUMBER_FIELDS=40
STATIC_URL="/static/"
STATIC_ROOT=BASE_DIR/"collected-static"
STATICFILES_DIRS=[BASE_DIR/"static"]
DEFAULT_AUTO_FIELD="django.db.models.BigAutoField"
TIME_ZONE="UTC"
USE_TZ=True
LANGUAGE_CODE="ko-kr"
LOGIN_URL="/accounts/login/"
SESSION_COOKIE_AGE=28800
CSRF_FAILURE_VIEW="news.views.csrf_failure"
LOGGING={"version":1,"disable_existing_loggers":False,"handlers":{"null":{"class":"logging.NullHandler"}},"loggers":{"django.request":{"handlers":["null"],"propagate":False},"django.security":{"handlers":["null"],"propagate":False}}}
