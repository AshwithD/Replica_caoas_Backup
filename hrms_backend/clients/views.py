

# clients/views.py

# ─── Standard Library ─────────────────────────────────────────────────────────
import os
import io
import json
import uuid
import datetime
import calendar
import logging
from datetime import date, timedelta
from decimal import Decimal

# ─── Django ───────────────────────────────────────────────────────────────────
from django.conf import settings
from django.db import models, transaction
from django.db.models import (
    Q, F, Sum, Count, Avg, Max,
    ExpressionWrapper, DurationField,
    IntegerField, CharField, Value, Case, When,
    Prefetch, OuterRef, Subquery,
)
from django.db.models.functions import Concat, TruncDate
from django.http import JsonResponse, HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

# ─── REST Framework ───────────────────────────────────────────────────────────
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import NotFound

# ─── Third Party ──────────────────────────────────────────────────────────────
import pandas as pd
import pytz
from dateutil.relativedelta import relativedelta
from django_filters.rest_framework import DjangoFilterBackend

# ─── Local Models ─────────────────────────────────────────────────────────────
from .models import (
    STTRecord, Client, SPOC, ClientSPOC,
    GroupCategory, ClientGroup, ClientGroupService,
    Constitution, MainService, SubService,
    Task, TaskTimeEntry, TaskAssignment, TaskAssignmentHistory,
    InternalTimeEntry, Company,
)

# ─── Local Serializers ────────────────────────────────────────────────────────
from .serializers import (
    STTRecordSerializer,
    ClientSerializer, ClientListSerializer, ClientLiteSerializer,
    SPOCSerializer, ClientSPOCSerializer,
    GroupCategorySerializer, ConstitutionSerializer,
    MainServiceSerializer, SubServiceSerializer,
    ClientGroupServiceSerializer,
    ClientGroupReadSerializer, ClientGroupWriteSerializer,
    TaskSerializer, TaskListSerializer,
)

# ─── Local Utils ──────────────────────────────────────────────────────────────
from .utils.soft_delete import SoftDeleteMixin
from .utils.time_overlap import check_time_overlap

# ─── Employee Models ──────────────────────────────────────────────────────────
from employee.models import Employee, Team

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────
ASSIGN_ROLES = {"team lead", "manager", "admin", "founder"}


# ══════════════════════════════════════════════════════════════════════════════
# CSRF
# ══════════════════════════════════════════════════════════════════════════════

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'success': True})


# ══════════════════════════════════════════════════════════════════════════════
# PAGINATION
# ══════════════════════════════════════════════════════════════════════════════

class StandardResultsSetPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = 'page_size'
    max_page_size         = 500


class ClientPagination(PageNumberPagination):
    page_size             = 100
    page_size_query_param = 'page_size'
    max_page_size         = 500


class TaskPagination(PageNumberPagination):
    page_size             = 50
    page_size_query_param = 'page_size'
    max_page_size         = 200


# ══════════════════════════════════════════════════════════════════════════════
# STT RECORD
# ══════════════════════════════════════════════════════════════════════════════

class STTRecordViewSet(viewsets.ModelViewSet):
    serializer_class   = STTRecordSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = StandardResultsSetPagination

    def get_queryset(self):
        qs     = STTRecord.objects.all().order_by('-date_of_stt')
        params = self.request.query_params
        user   = self.request.user

        full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        dept_raw  = None
        if user.is_authenticated:
            employee = Employee.objects.filter(user=user).first()
            if employee and employee.department:
                dept_raw = employee.department
        dept_list = [d.strip() for d in dept_raw.split(',')] if dept_raw else []

        role = (user.role or '').lower()

        if role in ('founder', 'admin'):
            pass
        elif role == 'manager':
            qs = qs.filter(
                Q(department__in=dept_list) |
                Q(spoc__name__iexact=full_name) |
                Q(request_by__iexact=full_name)
            )
        else:
            if dept_list:
                qs = qs.filter(
                    Q(department__in=dept_list) |
                    Q(spoc__name__iexact=full_name)
                )
            else:
                qs = qs.filter(spoc__name__iexact=full_name)

        if month := params.get('month'):
            try:
                year, m = month.split('-')
                qs = qs.filter(date_of_stt__year=year, date_of_stt__month=int(m))
            except ValueError:
                pass

        for field, lookup in [
            ('stt_no',       'stt_no__icontains'),
            ('client_name',  'client_name__icontains'),
            ('department',   'department__icontains'),
            ('spoc_name',    'spoc__name__icontains'),
            ('description',  'description__icontains'),
            ('invoice_no',   'invoice_no__icontains'),
            ('request_by',   'request_by__icontains'),
        ]:
            if val := params.get(field):
                qs = qs.filter(**{lookup: val})

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = request.data.copy()

        client_name       = serializer.validated_data.get('client_name')
        period_type       = serializer.validated_data.get('period_type')
        period_start_date = serializer.validated_data.get('period_start_date')
        period_end_date   = serializer.validated_data.get('period_end_date')
        description       = serializer.validated_data.get('description')

        if not data.get('department'):
            try:
                employee = Employee.objects.filter(user=request.user).first()
                if employee and employee.department:
                    data['department'] = employee.department
            except Exception:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        existing = STTRecord.objects.filter(
            client_name=client_name,
            period_type=period_type,
            period_start_date=period_start_date,
            period_end_date=period_end_date,
            description=description,
        ).first()

        if existing:
            return Response(
                f"STT record already created with old STT number: {existing.stt_no}",
                status=status.HTTP_409_CONFLICT,
                content_type="text/plain"
            )

        self.perform_create(serializer)
        return Response({
            "message": f"Congratulations! Your STT No {serializer.data.get('stt_no')} has been created.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)


# ══════════════════════════════════════════════════════════════════════════════
# CLIENT
# ══════════════════════════════════════════════════════════════════════════════

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class   = ClientPagination
    filter_backends    = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields      = ['name', 'gstin', 'client_groups_membership__group_name']
    filterset_fields   = ['is_active']
    ordering_fields    = ['name', 'created_at']
    ordering           = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer

    def get_queryset(self):
        return Client.objects.select_related(
            'constitution',
        ).prefetch_related(
            Prefetch(
                'client_groups_membership',
                queryset=ClientGroup.objects.select_related(
                    'primary_spoc', 'secondary_spoc',
                ).only(
                    'id', 'group_name', 'is_active',
                    'primary_spoc__id', 'primary_spoc__name', 'primary_spoc__email',
                    'secondary_spoc__id', 'secondary_spoc__name', 'secondary_spoc__email',
                )
            ),
            Prefetch(
                'spocs',
                queryset=ClientSPOC.objects.select_related('spoc').only(
                    'id', 'client_id', 'spoc__id', 'spoc__name', 'spoc__email',
                )
            ),
        ).order_by('name')

    @action(detail=False, methods=['post'], parser_classes=(MultiPartParser, FormParser))
    def bulk_upload(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_obj.read()))
            elif file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(file_obj.read()))
            else:
                return Response({'detail': 'Unsupported file format.'}, status=status.HTTP_400_BAD_REQUEST)

            required_columns = ['name', 'email']
            if not all(col in df.columns for col in required_columns):
                return Response({'detail': f'Missing required columns: {required_columns}'}, status=status.HTTP_400_BAD_REQUEST)

            def safe(row, col):
                return row[col] if col in row.index and pd.notna(row[col]) else None

            clients_to_create = []
            errors = []

            for index, row in df.iterrows():
                try:
                    client_data = {k: safe(row, k) for k in [
                        'name', 'email', 'phone', 'address', 'nature_of_business',
                        'contact_person', 'cin', 'pan', 'gstin', 'iec',
                        'ksea', 'udyam', 'apt', 'ept', 'tan', 'lei',
                    ]}
                    serializer = ClientSerializer(data=client_data)
                    serializer.is_valid(raise_exception=True)
                    clients_to_create.append(Client(**serializer.validated_data))
                except Exception as e:
                    errors.append(f"Row {index + 1}: {e}")

            if errors:
                return Response({'detail': 'Validation errors', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                Client.objects.bulk_create(clients_to_create, ignore_conflicts=True)

            return Response({'detail': f'Successfully uploaded {len(clients_to_create)} clients.'})

        except Exception as e:
            return Response({'detail': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClientLiteViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ClientLiteSerializer
    pagination_class   = None
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name']
    ordering           = ['name']

    def get_queryset(self):
        active_group = ClientGroup.objects.filter(
            clients=OuterRef('pk'), is_active=True,
        ).select_related('primary_spoc')

        return Client.objects.annotate(
            _group_name=Subquery(active_group.values('group_name')[:1]),
            _primary_spoc_name=Subquery(active_group.values('primary_spoc__name')[:1]),
        ).only('id', 'name', 'is_active').order_by('name')


# ══════════════════════════════════════════════════════════════════════════════
# SPOC
# ══════════════════════════════════════════════════════════════════════════════

class SPOCViewSet(viewsets.ModelViewSet):
    queryset           = SPOC.objects.all()
    serializer_class   = SPOCSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None


# ══════════════════════════════════════════════════════════════════════════════
# CONSTITUTION & GROUP CATEGORY
# ══════════════════════════════════════════════════════════════════════════════

class ConstitutionViewSet(viewsets.ModelViewSet):
    queryset           = Constitution.objects.all()
    serializer_class   = ConstitutionSerializer
    permission_classes = [IsAuthenticated]


class GroupCategoryViewSet(viewsets.ModelViewSet):
    queryset           = GroupCategory.objects.all()
    serializer_class   = GroupCategorySerializer
    permission_classes = [IsAuthenticated]


# ══════════════════════════════════════════════════════════════════════════════
# SERVICES
# ══════════════════════════════════════════════════════════════════════════════

class MainServiceViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    serializer_class   = MainServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MainService.objects.filter(is_active=True).order_by('name')


class SubServiceViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    serializer_class   = SubServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubService.objects.filter(is_active=True).order_by('name')


class ClientGroupServiceViewSet(ModelViewSet):
    serializer_class = ClientGroupServiceSerializer
    queryset         = ClientGroupService.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            return qs.filter(client_group__clients=self.request.user)
        return qs


# ══════════════════════════════════════════════════════════════════════════════
# CLIENT SPOC
# ══════════════════════════════════════════════════════════════════════════════

class ClientSPOCViewSet(viewsets.ModelViewSet):
    queryset           = ClientSPOC.objects.all()
    serializer_class   = ClientSPOCSerializer
    permission_classes = [IsAuthenticated]


# ══════════════════════════════════════════════════════════════════════════════
# CLIENT GROUP
# ══════════════════════════════════════════════════════════════════════════════

class ClientGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset           = ClientGroup.objects.all()

    def get_queryset(self):
        user = self.request.user
        role = (user.role or "").lower()

        qs = ClientGroup.objects.prefetch_related(
            Prefetch(
                'clients',
                queryset=Client.objects.select_related('constitution').prefetch_related(
                    Prefetch(
                        'client_groups_membership',
                        queryset=ClientGroup.objects.select_related(
                            'primary_spoc', 'secondary_spoc',
                        ).only(
                            'id', 'group_name', 'is_active',
                            'primary_spoc__id', 'primary_spoc__name', 'primary_spoc__email',
                            'secondary_spoc__id', 'secondary_spoc__name', 'secondary_spoc__email',
                        )
                    ),
                ).only(
                    'id', 'name', 'email', 'phone', 'contact_person',
                    'nature_of_business', 'gstin', 'pan', 'tan', 'cin',
                    'iec', 'lei', 'ksea', 'udyam', 'apt', 'ept',
                    'constitution', 'constitution_id', 'address', 'is_active',
                )
            ),
            Prefetch(
                'group_services',
                queryset=ClientGroupService.objects.select_related(
                    'main_service', 'sub_service',
                ).prefetch_related('client'),
            ),
        ).select_related(
            'group_category', 'primary_spoc', 'secondary_spoc',
        ).order_by('group_name')

        if role in ['admin', 'founder']:
            return qs
        if role == 'spoc':
            return qs.filter(Q(primary_spoc=user) | Q(secondary_spoc=user))
        return qs

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClientGroupWriteSerializer
        return ClientGroupReadSerializer


# ══════════════════════════════════════════════════════════════════════════════
# TASK HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def get_financial_year(date_obj):
    if date_obj.month >= 4:
        return f"{date_obj.year}-{str(date_obj.year + 1)[-2:]}"
    return f"{date_obj.year - 1}-{str(date_obj.year)[-2:]}"


def get_next_task_id_serial_number(date_obj):
    fy_str = get_financial_year(date_obj)
    prefix = "CKPSCA-STT-"
    suffix = f"-{fy_str}"

    last_record = (
        Task.objects
        .select_for_update()
        .filter(task_id__startswith=prefix, task_id__endswith=suffix)
        .order_by('-task_id')
        .first()
    )

    if not last_record or not last_record.task_id:
        return 1

    try:
        parts       = last_record.task_id.split('-')
        serial_part = parts[2]
        if not serial_part.isdigit():
            raise ValueError(f"Non-numeric serial: {serial_part!r}")
        return int(serial_part) + 1
    except (IndexError, ValueError) as e:
        logger.error("get_next_task_id_serial_number failed: task_id=%r, error=%s", last_record.task_id, e)
        return Task.objects.filter(task_id__startswith=prefix, task_id__endswith=suffix).count() + 1


# ══════════════════════════════════════════════════════════════════════════════
# TASK VIEWSET
# ══════════════════════════════════════════════════════════════════════════════

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes     = (JSONParser, MultiPartParser, FormParser)
    pagination_class   = TaskPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def _base_qs(self):
        return Task.objects.select_related(
            'client', 'sub_service', 'spoc', 'team', 'created_by', 'marked_done_by',
        ).prefetch_related(
            Prefetch('assignments', queryset=TaskAssignment.objects.select_related('user').filter(is_active=True)),
            Prefetch('time_entries', queryset=TaskTimeEntry.objects.only('id', 'task_id', 'employee_id', 'start_time', 'end_time')),
            Prefetch('client__client_groups_membership', queryset=ClientGroup.objects.filter(is_active=True)),
        ).order_by('-created_at')

    def get_queryset(self):
        user  = self.request.user
        scope = self.request.query_params.get('scope', 'all')
        role  = (getattr(user, 'role', '') or '').lower()

        base_qs = self._base_qs()

        # ─── Filters ──────────────────────────────────────────────────────────
        params = self.request.query_params

        if task_id := params.get('task_id'):
            base_qs = base_qs.filter(task_id__icontains=task_id)
        if client_ids := params.get('client'):
            base_qs = base_qs.filter(client_id__in=[i.strip() for i in client_ids.split(',')])
        if sub_ids := params.get('sub_service'):
            base_qs = base_qs.filter(sub_service_id__in=[i.strip() for i in sub_ids.split(',')])
        if spoc_ids := params.get('spoc'):
            base_qs = base_qs.filter(spoc_id__in=[i.strip() for i in spoc_ids.split(',')])
        if team_ids := params.get('team'):
            base_qs = base_qs.filter(team_id__in=[i.strip() for i in team_ids.split(',')])
        if due_after := params.get('due_date_after'):
            base_qs = base_qs.filter(due_date__gte=due_after)
        if due_before := params.get('due_date_before'):
            base_qs = base_qs.filter(due_date__lte=due_before)

        if status_vals := params.get('status'):
            statuses        = [s.strip() for s in status_vals.split(',') if s.strip()]
            db_statuses     = [s for s in statuses if s != 'Over Due']
            include_overdue = 'Over Due' in statuses
            today           = timezone.now().date()

            if db_statuses and include_overdue:
                base_qs = base_qs.filter(
                    Q(status__in=db_statuses, due_date__gte=today) |
                    Q(due_date__lt=today, status__in=['To Do', 'In Progress'])
                )
            elif db_statuses:
                base_qs = base_qs.filter(status__in=db_statuses, due_date__gte=today)
            elif include_overdue:
                base_qs = base_qs.filter(due_date__lt=today, status__in=['To Do', 'In Progress'])

        if created_by_name := params.get('created_by_name'):
            names = [n.strip() for n in created_by_name.split(',') if n.strip()]
            q = Q()
            for name in names:
                parts = name.strip().split(' ', 1)
                if len(parts) == 2:
                    q |= Q(created_by__first_name__icontains=parts[0], created_by__last_name__icontains=parts[1])
                else:
                    q |= Q(created_by__first_name__icontains=parts[0]) | Q(created_by__last_name__icontains=parts[0])
            base_qs = base_qs.filter(q)

        # ─── Single-object actions ────────────────────────────────────────────
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy', 'history'):
            return base_qs

        # ─── Scope: my ────────────────────────────────────────────────────────
        if scope == 'my':
            return base_qs.filter(
                Q(created_by=user) |
                Q(assignments__user=user, assignments__is_active=True) |
                Q(time_entries__employee=user)
            ).distinct()

        # ─── Admin / Founder ──────────────────────────────────────────────────
        if role in ('admin', 'founder'):
            return base_qs

        # ─── Others ───────────────────────────────────────────────────────────
        employee = Employee.objects.filter(user=user).first()
        if not employee or not employee.department:
            return base_qs.none()

        dept_q = Q()
        for dept in [d.strip() for d in employee.department.split(',') if d.strip()]:
            dept_q |= Q(team__name__iexact=dept)

        spoc   = SPOC.objects.filter(Q(email__iexact=user.email) | Q(name__iexact=user.get_full_name())).first()
        spoc_q = Q(spoc=spoc) if spoc else Q()

        return base_qs.filter(
            dept_q | spoc_q |
            Q(created_by=user) |
            Q(assignments__user=user, assignments__is_active=True) |
            Q(time_entries__employee=user)
        ).distinct()

    def retrieve(self, request, *args, **kwargs):
        pk   = kwargs.get('pk')
        user = request.user
        role = (getattr(user, 'role', '') or '').lower()

        if not str(pk).lstrip('-').isdigit():
            return Response({'error': f'Invalid task id: {pk}'}, status=status.HTTP_400_BAD_REQUEST)

        base_qs = Task.objects.select_related(
            'client', 'spoc', 'sub_service', 'team', 'created_by', 'marked_done_by',
        ).prefetch_related('time_entries', 'time_entries__employee', 'assignments', 'assignments__user')

        if role in ('admin', 'founder'):
            task = base_qs.filter(pk=pk).first()
            if not task:
                raise NotFound('No Task matches the given query.')
            return Response(self.get_serializer(task).data)

        employee = Employee.objects.filter(user=user).first()
        dept_q   = Q()
        if employee and employee.department:
            for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
                dept_q |= Q(team__name__icontains=d)

        spoc   = SPOC.objects.filter(Q(email__iexact=user.email) | Q(name__iexact=user.get_full_name())).first()
        spoc_q = Q(spoc=spoc) if spoc else Q()

        task = base_qs.filter(
            dept_q | spoc_q |
            Q(created_by=user) |
            Q(assignments__user=user, assignments__is_active=True) |
            Q(time_entries__employee=user),
            pk=pk,
        ).distinct().first()

        if not task:
            raise NotFound('No Task matches the given query.')

        return Response(self.get_serializer(task).data)

    def _get_allowed_task_ids(self, user):
        role = (getattr(user, 'role', '') or '').lower()
        if role in ('admin', 'founder'):
            return None

        employee = Employee.objects.filter(user=user).first()
        if not employee or not employee.department:
            return []

        dept_q = Q()
        for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
            dept_q |= Q(team__name__iexact=d)

        spoc   = SPOC.objects.filter(Q(email__iexact=user.email) | Q(name__iexact=user.get_full_name())).first()
        spoc_q = Q(spoc=spoc) if spoc else Q()

        return Task.objects.filter(
            dept_q | spoc_q |
            Q(created_by=user) |
            Q(assignments__user=user, assignments__is_active=True) |
            Q(time_entries__employee=user)
        ).distinct().values_list('id', flat=True)

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        qs         = self.get_queryset()
        serializer = TaskListSerializer(qs, many=True)
        return Response(serializer.data)

    def _apply_entry_date_filter(self, entry_qs, start_date, end_date):
        from datetime import datetime, time as dt_time
        if start_date:
            try:
                entry_qs = entry_qs.filter(start_time__gte=datetime.strptime(start_date, '%Y-%m-%d'))
            except ValueError:
                pass
        if end_date:
            try:
                ed       = datetime.strptime(end_date, '%Y-%m-%d')
                entry_qs = entry_qs.filter(start_time__lte=datetime.combine(ed.date(), dt_time(23, 59, 59)))
            except ValueError:
                pass
        return entry_qs

    def _apply_entry_categorical_filters(self, entry_qs, request):
        client_ids     = request.query_params.get('client_id')
        team_ids       = request.query_params.get('team_id')
        sub_ids        = request.query_params.get('sub_service_id')
        group_ids      = request.query_params.get('client_group_id')
        employee_names = request.query_params.get('employee_name')

        if client_ids:
            entry_qs = entry_qs.filter(task__client_id__in=client_ids.split(','))
        if team_ids:
            entry_qs = entry_qs.filter(task__team_id__in=team_ids.split(','))
        if sub_ids:
            entry_qs = entry_qs.filter(task__sub_service_id__in=sub_ids.split(','))
        if group_ids:
            entry_qs = entry_qs.filter(task__client__client_groups_membership__id__in=group_ids.split(','))
        if employee_names:
            name_q = Q()
            for full_name in [n.strip() for n in employee_names.split(',') if n.strip()]:
                parts = full_name.split(' ', 1)
                name_q |= Q(employee__first_name__iexact=parts[0], employee__last_name__iexact=parts[1] if len(parts) > 1 else '')
            entry_qs = entry_qs.filter(name_q)
        return entry_qs

    def _base_entry_qs(self, user):
        allowed_task_ids = self._get_allowed_task_ids(user)
        qs = TaskTimeEntry.objects.filter(start_time__isnull=False, end_time__isnull=False)
        if allowed_task_ids is not None:
            qs = qs.filter(task_id__in=allowed_task_ids)
        return qs

    @action(detail=False, methods=['get'], url_path='dashboard_summary')
    def dashboard_summary(self, request):
        try:
            today            = date.today()
            allowed_task_ids = self._get_allowed_task_ids(request.user)

            if allowed_task_ids is None:
                base_qs = Task.objects.all()
            elif len(allowed_task_ids) == 0:
                base_qs = Task.objects.none()
            else:
                base_qs = Task.objects.filter(id__in=allowed_task_ids)

            counts = base_qs.aggregate(
                todo=Count(Case(When(status='To Do',       due_date__gte=today, then=1), output_field=IntegerField())),
                in_progress=Count(Case(When(status='In Progress', due_date__gte=today, then=1), output_field=IntegerField())),
                done=Count(Case(When(status='Done', then=1), output_field=IntegerField())),
                overdue=Count(Case(When(~Q(status='Done'), due_date__lt=today, then=1), output_field=IntegerField())),
                total=Count('id'),
            )

            fystart_year = today.year if today.month >= 4 else today.year - 1
            fy_start     = date(fystart_year, 4, 1)
            in7          = today + timedelta(days=7)

            upcoming_qs = base_qs.filter(~Q(status='Done')).filter(
                Q(due_date__lt=today, due_date__gte=fy_start) |
                Q(due_date__gte=today, due_date__lte=in7)
            ).select_related('client', 'sub_service').only(
                'id', 'task_id', 'status', 'due_date',
                'client__id', 'client__name',
                'sub_service__id', 'sub_service__name',
            ).order_by('due_date')

            tasks_data = [
                {
                    'id':               t.id,
                    'task_id':          t.task_id,
                    'status':           t.status,
                    'due_date':         str(t.due_date) if t.due_date else None,
                    'client':           t.client_id,
                    'client_name':      t.client.name if t.client else None,
                    'sub_service':      t.sub_service_id,
                    'sub_service_name': t.sub_service.name if t.sub_service else None,
                    'task_pk':          t.id,
                }
                for t in upcoming_qs
            ]

            return Response({
                'status_counts': {
                    'To Do':       counts['todo'],
                    'In Progress': counts['in_progress'],
                    'Done':        counts['done'],
                    'Over Due':    counts['overdue'],
                    'total':       counts['total'],
                },
                'tasks': tasks_data,
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def assign_multiple(self, request, pk=None):
        task = self.get_object()
        user = request.user
        role = (user.role or '').lower()

        if role not in ASSIGN_ROLES:
            return Response({'detail': 'Not allowed'}, status=403)

        user_ids = request.data.get('user_ids', [])
        if not isinstance(user_ids, list):
            return Response({'detail': 'user_ids must be a list'}, status=400)

        existing          = TaskAssignment.objects.filter(task=task, is_active=True)
        existing_user_ids = set(existing.values_list('user_id', flat=True))
        incoming_user_ids = set(map(int, user_ids))

        to_remove = existing_user_ids - incoming_user_ids
        if to_remove:
            TaskAssignment.objects.filter(task=task, user_id__in=to_remove, is_active=True).update(is_active=False)
            for uid in to_remove:
                TaskAssignmentHistory.objects.create(task=task, assigned_from_id=uid, assigned_to_id=None, assigned_by=user)

        to_add = incoming_user_ids - existing_user_ids
        for uid in to_add:
            assignment, created = TaskAssignment.objects.get_or_create(
                task=task, user_id=uid, defaults={'assigned_by': user, 'is_active': True}
            )
            if not created and not assignment.is_active:
                assignment.is_active   = True
                assignment.assigned_by = user
                assignment.save(update_fields=['is_active', 'assigned_by'])
            TaskAssignmentHistory.objects.create(task=task, assigned_from=None, assigned_to_id=uid, assigned_by=user)

        return Response({'message': 'Assignments updated successfully'})

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        task    = self.get_object()
        history = []

        history.append({
            'type': 'created', 'time': task.created_at, 'message': 'Task created',
            'user': task.created_by.get_full_name() if task.created_by else 'System',
        })

        for h in TaskAssignmentHistory.objects.filter(task=task).order_by('assigned_at', 'id'):
            actor = h.assigned_by.get_full_name() if h.assigned_by else 'System'
            if h.assigned_to:
                history.append({'type': 'assigned',   'user': actor, 'time': h.assigned_at, 'message': f'Assigned to {h.assigned_to.get_full_name()}'})
            elif h.assigned_from:
                history.append({'type': 'unassigned', 'user': actor, 'time': h.assigned_at, 'message': f'Unassigned {h.assigned_from.get_full_name()}'})

        for t in TaskTimeEntry.objects.filter(task=task).order_by('created_at'):
            history.append({'type': 'time', 'user': t.employee.get_full_name(), 'time': t.created_at, 'start_time': t.start_time, 'end_time': t.end_time, 'message': 'Added time'})

        if task.marked_done_at:
            history.append({'type': 'done', 'time': task.marked_done_at, 'message': 'Marked as Done', 'user': task.marked_done_by.get_full_name() if task.marked_done_by else 'System'})

        history = [h for h in history if h.get('time') is not None]
        history.sort(key=lambda x: x['time'])
        return Response(history)

    def perform_create(self, serializer):
        user = self.request.user
        role = (getattr(user, 'role', '') or '').lower()

        with transaction.atomic():
            next_serial    = get_next_task_id_serial_number(date.today())
            financial_year = get_financial_year(date.today())
            task_id        = f'CKPSCA-STT-{next_serial:04d}-{financial_year}'
            task           = serializer.save(created_by=user, task_id=task_id)

            assigned_users = self.request.data.getlist('assigned_users')
            if role in ASSIGN_ROLES and assigned_users:
                for uid in assigned_users:
                    TaskAssignment.objects.create(task=task, user_id=uid, is_active=True, assigned_by=user)
                    TaskAssignmentHistory.objects.create(task=task, assigned_from=None, assigned_to_id=uid, assigned_by=user)

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop('partial', False)
        instance = self.get_object()
        data     = request.data.copy()

        raw = data.pop('assigned_employees_data', None)
        assigned_employees_data = []

        if raw:
            if isinstance(raw, list) and len(raw) == 1:
                raw = raw[0]
            if isinstance(raw, str):
                try:
                    assigned_employees_data = json.loads(raw)
                except Exception:
                    assigned_employees_data = []
            elif isinstance(raw, list):
                assigned_employees_data = raw

        for emp in assigned_employees_data:
            employee_user = request.user
            if not employee_user.is_authenticated:
                continue

            for entry in emp.get('time_entries', []):
                start_time = entry.get('start_time')
                end_time   = entry.get('end_time')
                notes      = entry.get('notes', '')

                if not start_time or not end_time:
                    continue

                start_dt = parse_datetime(str(start_time))
                end_dt   = parse_datetime(str(end_time))

                if not start_dt or not end_dt:
                    return Response({'detail': 'Invalid datetime format.'}, status=status.HTTP_400_BAD_REQUEST)

                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt)
                if timezone.is_naive(end_dt):
                    end_dt = timezone.make_aware(end_dt)

                if end_dt <= start_dt:
                    return Response({'detail': 'End time must be after start time.'}, status=status.HTTP_400_BAD_REQUEST)

                if check_time_overlap(employee_user, start_dt, end_dt, instance=None, entry_type='task'):
                    return Response({'detail': 'Time entry overlaps with an existing entry.'}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    TaskTimeEntry.objects.create(task=instance, employee=employee_user, start_time=start_dt, end_time=end_dt, notes=notes)
                except Exception as e:
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        total_hours = instance.time_entries.exclude(duration__isnull=True).aggregate(total=Sum('duration'))['total']
        instance.total_hours = total_hours
        instance.save(update_fields=['total_hours'])

        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['post'])
    def create_monthly_tasks(self, request):
        try:
            with transaction.atomic():
                today              = date.today()
                created_count      = 0
                next_serial_number = get_next_task_id_serial_number(today)

                services = ClientGroupService.objects.filter(is_active=True).select_related(
                    'client_group', 'client', 'main_service', 'sub_service'
                )

                def months_ahead(month, year):
                    return (year - today.year) * 12 + (month - today.month)

                def nearest_due(due_months):
                    best, best_diff = None, None
                    for dm in due_months:
                        y    = today.year if dm >= today.month else today.year + 1
                        diff = months_ahead(dm, y)
                        if best_diff is None or diff < best_diff:
                            best, best_diff = (dm, y), diff
                    return best, best_diff

                def get_period_label(service_period, due_date, custom_label=None):
                    if custom_label and custom_label.strip():
                        return custom_label.strip()
                    if not due_date:
                        return service_period or 'Unknown'
                    end = due_date - relativedelta(months=1)
                    if service_period == 'Monthly':    return end.strftime('%b-%Y')
                    if service_period == 'Quarterly':  start = end - relativedelta(months=2) + relativedelta(day=1); return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"
                    if service_period == 'Half-Yearly': start = end - relativedelta(months=5) + relativedelta(day=1); return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"
                    if service_period == 'Annually':   start = end - relativedelta(months=11) + relativedelta(day=1); return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"
                    return end.strftime('%b-%Y')

                for service in services:
                    if not service.due_date:
                        continue

                    due_month, due_day, task_due_date = service.due_date.month, service.due_date.day, None

                    if service.period == 'Monthly':
                        last_day      = calendar.monthrange(today.year, today.month)[1]
                        task_due_date = date(today.year, today.month, min(due_day, last_day))
                    elif service.period == 'Quarterly':
                        due_months = [(due_month + i * 3 - 1) % 12 + 1 for i in range(4)]
                        (dm, y), diff = nearest_due(due_months)
                        if dm and 0 <= diff <= 2:
                            last_day = calendar.monthrange(y, dm)[1]; task_due_date = date(y, dm, min(due_day, last_day))
                    elif service.period == 'Half-Yearly':
                        due_months = [due_month, (due_month + 6 - 1) % 12 + 1]
                        (dm, y), diff = nearest_due(due_months)
                        if dm and 0 <= diff <= 6:
                            last_day = calendar.monthrange(y, dm)[1]; task_due_date = date(y, dm, min(due_day, last_day))
                    elif service.period == 'Annually':
                        y = today.year if due_month >= today.month else today.year + 1
                        diff = months_ahead(due_month, y)
                        if 0 <= diff <= 6:
                            last_day = calendar.monthrange(y, due_month)[1]; task_due_date = date(y, due_month, min(due_day, last_day))

                    if not task_due_date:
                        continue

                    period_label   = get_period_label(service.period, task_due_date, service.period_label or service.sub_service.period_label)
                    team_instance  = service.main_service.team
                    spoc_instance  = service.client_group.primary_spoc

                    if not team_instance or not spoc_instance:
                        continue
                    if Task.objects.filter(client=service.client, sub_service=service.sub_service, period=period_label).exists():
                        continue

                    task           = Task.objects.create(client=service.client, sub_service=service.sub_service, spoc=spoc_instance, team=team_instance, status='To Do', period=period_label, due_date=task_due_date, created_by=None)
                    financial_year = get_financial_year(today)
                    task.task_id   = f'CKPSCA-STT-{next_serial_number:04d}-{financial_year}'
                    task.save(update_fields=['task_id'])
                    next_serial_number += 1
                    created_count      += 1

            if created_count > 0:
                return Response({'message': f'Successfully created {created_count} new tasks.'}, status=status.HTTP_201_CREATED)
            return Response({'message': 'No new tasks were created (they may already exist).'})

        except Exception as e:
            import traceback
            return Response({'error': str(e), 'detail': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ══════════════════════════════════════════════════════════════════════════════
# TASK TIME ENTRY EDIT VIEW
# ══════════════════════════════════════════════════════════════════════════════

class TaskTimeEntryEditView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_error(self, pk, user):
        try:
            entry = TaskTimeEntry.objects.select_related("task").get(pk=pk)
        except TaskTimeEntry.DoesNotExist:
            return None, Response({"detail": "Time entry not found."}, status=404)

        if entry.employee_id != user.id:
            return None, Response({"detail": "You can only edit your own time entries."}, status=403)
        if timezone.localtime(entry.start_time).date() != timezone.localdate():
            return None, Response({"detail": "Time entries can only be edited on the day they were created."}, status=403)
        if entry.task.status == "Done":
            return None, Response({"detail": "Cannot edit time entries for a completed task."}, status=403)

        return entry, None

    def patch(self, request, pk):
        entry, err = self._get_or_error(pk, request.user)
        if err:
            return err

        raw_start = request.data.get("start_time")
        raw_end   = request.data.get("end_time")
        notes     = request.data.get("notes", entry.notes)

        if raw_start:
            dt = parse_datetime(str(raw_start))
            if not dt:
                return Response({"detail": "Invalid start_time."}, status=400)
            entry.start_time = timezone.make_aware(dt) if timezone.is_naive(dt) else dt

        if raw_end:
            dt = parse_datetime(str(raw_end))
            if not dt:
                return Response({"detail": "Invalid end_time."}, status=400)
            entry.end_time = timezone.make_aware(dt) if timezone.is_naive(dt) else dt

        if entry.end_time and entry.start_time:
            if entry.end_time <= entry.start_time:
                return Response({"detail": "End time must be after start time."}, status=400)
            if (entry.end_time - entry.start_time).total_seconds() / 3600 > 15:
                return Response({"detail": "Time entry cannot exceed 15 hours."}, status=400)

        if (
            TaskTimeEntry.objects.filter(employee=request.user, start_time__lt=entry.end_time, end_time__gt=entry.start_time).exclude(pk=entry.pk).exists()
            or InternalTimeEntry.objects.filter(employee=request.user, start_time__lt=entry.end_time, end_time__gt=entry.start_time).exists()
        ):
            return Response({"detail": "Time entry overlaps with an existing entry."}, status=400)

        entry.notes = notes
        entry.save()
        return Response({"id": entry.id, "start_time": entry.start_time, "end_time": entry.end_time, "notes": entry.notes})

    def delete(self, request, pk):
        entry, err = self._get_or_error(pk, request.user)
        if err:
            return err
        entry.delete()
        return Response(status=204)


# ══════════════════════════════════════════════════════════════════════════════
# COMPANY
# ══════════════════════════════════════════════════════════════════════════════

@csrf_exempt
def company_details_api(request):
    if request.method == 'GET':
        try:
            company = Company.objects.first()
            if not company:
                return JsonResponse({'message': 'No company details found'}, status=404)
            fields = [
                'companyName', 'companytype', 'natureOfBusiness', 'incorporationDate',
                'stateOfRegistration', 'panNo', 'gstNo', 'tanNo', 'cin', 'lutNo', 'lutDate',
                'contactPerson', 'contactEmail', 'contactPhone', 'address',
                'bankAccountNo', 'ifscCode', 'bankName', 'bankAddress',
                'additionalBasicDetails', 'additionalIdentificationDetails',
                'additionalContactDetails', 'additionalBankingDetails', 'otherDetails', 'sacDetails',
            ]
            data = {f: getattr(company, f) for f in fields}
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            data    = json.loads(request.body)
            company, _ = Company.objects.get_or_create(id=1)
            for key, value in data.items():
                setattr(company, key, value)
            company.save()
            return JsonResponse({'message': 'Company details saved successfully', 'id': company.id})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)