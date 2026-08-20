from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from .views import (
    # ─── Client ───────────────────────────────────────────────────────────
    ClientViewSet,
    ClientLiteViewSet,
    ClientSPOCViewSet,
    ClientGroupViewSet,
    GroupCategoryViewSet,
    ConstitutionViewSet,

    # ─── SPOC ─────────────────────────────────────────────────────────────
    SPOCViewSet,

    # ─── Services ─────────────────────────────────────────────────────────
    MainServiceViewSet,
    SubServiceViewSet,
    ClientGroupServiceViewSet,

    # ─── Tasks / STT ──────────────────────────────────────────────────────
    STTRecordViewSet,
    TaskViewSet,
    TaskTimeEntryEditView,

    # ─── Company ──────────────────────────────────────────────────────────
    company_details_api,
)

# ─── Router ───────────────────────────────────────────────────────────────────
router = DefaultRouter()

# Client
router.register(r'clients',                 ClientViewSet,             basename='client')
router.register(r'clients-lite',            ClientLiteViewSet,         basename='client-lite')
router.register(r'client-spocs',            ClientSPOCViewSet,         basename='client-spoc')
router.register(r'client-groups',           ClientGroupViewSet,        basename='clientgroup')
router.register(r'client-group-categories', GroupCategoryViewSet,      basename='groupcategory')
router.register(r'constitutions',           ConstitutionViewSet,       basename='constitution')

# SPOC
router.register(r'spocs',                   SPOCViewSet,               basename='spoc')

# Services
router.register(r'mainservices',            MainServiceViewSet,        basename='mainservice')
router.register(r'subservices',             SubServiceViewSet,         basename='subservice')
router.register(r'client-group-services',   ClientGroupServiceViewSet, basename='clientgroupservice')

# Tasks / STT
router.register(r'stt-records',             STTRecordViewSet,          basename='stt-record')
router.register(r'tasks',                   TaskViewSet,               basename='task')

# ─── URL Patterns ─────────────────────────────────────────────────────────────
urlpatterns = [
    path('company/',                        company_details_api,                  name='company-details'),
    path('task-time-entries/<int:pk>/',     TaskTimeEntryEditView.as_view(),      name='task-time-entry-edit'),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)