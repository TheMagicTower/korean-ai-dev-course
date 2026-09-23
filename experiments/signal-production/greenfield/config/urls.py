from django.urls import path
from news import views
urlpatterns=[path('',views.home),path('editions/<int:edition_id>/',views.edition),path('healthz',views.health),path('readyz',views.ready),path('accounts/login/',views.login_view),path('accounts/logout/',views.logout_view),path('desk/',views.desk),path('api/articles/',views.articles),path('api/articles/<int:article_id>/',views.detail),path('api/articles/<int:article_id>/<str:action>/',views.action),path('assets/style.css',views.stylesheet),path('assets/desk.js',views.script)]
handler400=views.error400
handler404=views.error404
handler500=views.error500
