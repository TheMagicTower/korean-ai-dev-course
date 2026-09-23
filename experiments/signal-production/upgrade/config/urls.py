from django.urls import path,re_path
from django.views.static import serve
from django.conf import settings
from magazine import views
urlpatterns=[path('',views.home),path('healthz',views.health),path('readyz',views.ready),path('accounts/login/',views.sign_in),path('accounts/logout/',views.sign_out),path('desk/',views.desk),path('api/articles/',views.api),path('api/articles/<int:pk>/',views.api),path('api/articles/<int:pk>/<str:action>/',views.api),path('static/style.css',serve,{'path':'style.css','document_root':settings.BASE_DIR/'static'}),path('static/desk.js',serve,{'path':'desk.js','document_root':settings.BASE_DIR/'static'})]
