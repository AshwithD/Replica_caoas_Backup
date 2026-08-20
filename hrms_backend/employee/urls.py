from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from .views import (
    ProfileUpdateView,
    EmployeeViewSet,
    TeamViewSet,
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'teams',     TeamViewSet,     basename='team')

urlpatterns = [
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('', include(router.urls)),
]

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]