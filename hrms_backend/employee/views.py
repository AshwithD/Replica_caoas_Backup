# # hrms_backend/employee/views.py

# # ─── Standard Library ─────────────────────────────────────────────────────────
# import calendar
# import io
# from datetime import date, timedelta
# from decimal import Decimal

# # ─── Django ───────────────────────────────────────────────────────────────────
# from django.contrib.auth import login, logout, get_user_model
# from django.contrib.auth.tokens import default_token_generator
# from django.core.mail import send_mail
# from django.conf import settings
# from django.db import transaction
# from django.db.models import Sum, F
# from django.http import JsonResponse, HttpResponse
# from django.shortcuts import get_object_or_404
# from django.utils import timezone
# from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
# from django.utils.encoding import force_bytes, force_str
# from django.views.decorators.csrf import ensure_csrf_cookie

# # ─── REST Framework ───────────────────────────────────────────────────────────
# from rest_framework import mixins, generics, serializers, status, viewsets
# from rest_framework.authentication import SessionAuthentication
# from rest_framework.decorators import action, api_view, permission_classes
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.viewsets import GenericViewSet
# from rest_framework.authtoken.models import Token

# # ─── ReportLab ────────────────────────────────────────────────────────────────
# from reportlab.lib.pagesizes import letter
# from reportlab.lib import colors
# from reportlab.lib.units import inch
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.enums import TA_CENTER

# # ─── Third Party ──────────────────────────────────────────────────────────────
# import pandas as pd

# # ─── Local ────────────────────────────────────────────────────────────────────
# from .models import Employee, Team, EmployeeDocument
# from .serializers import (
#     EmployeeSerializer,
#     TeamSerializer,
#     EmployeeDocumentSerializer,
#     UserSerializer,
#     LoginSerializer,
#     RegisterSerializer,
#     UserEmployeeSerializer,
# )
# from .permissions import IsHRorAdmin, IsEmployeeOrHRorAdmin

# # ─── License (Optional) ───────────────────────────────────────────────────────
# def get_max_users():
#     return 100

# User = get_user_model()

# # --- CSRF View ---
# @ensure_csrf_cookie
# def csrf_token_view(request):
#     return JsonResponse({'detail': 'CSRF cookie set'})

# class UserListView(generics.ListAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     permission_classes = [IsHRorAdmin]

# # --- Employee Views ---

# class TeamViewSet(viewsets.ModelViewSet):
#     queryset = Team.objects.all()
#     serializer_class = TeamSerializer
#     permission_classes = [IsAuthenticated]



# from rest_framework.decorators import action
# from .models import EmployeeDocument
# from .serializers import EmployeeDocumentSerializer
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class EmployeeViewSet(viewsets.ModelViewSet):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsHRorAdmin]
#     parser_classes = [JSONParser, MultiPartParser, FormParser]

#     def get_permissions(self):
#         if self.action in ['retrieve']:
#             self.permission_classes = [IsAuthenticated]
#         elif self.action == 'list':
#             self.permission_classes = [IsHRorAdmin]
#         else:
#             self.permission_classes = [IsHRorAdmin]
#         return super().get_permissions()

#     def retrieve(self, request, *args, **kwargs):
#         instance = self.get_object()
#         if request.user.role == 'employee' and instance.user != request.user:
#             return Response(status=status.HTTP_403_FORBIDDEN)
#         serializer = self.get_serializer(instance)
#         return Response(serializer.data)

#     def partial_update(self, request, *args, **kwargs):
#         # role lives on accounts.User, not Employee — extract before calling super()
#         # request.POST is used for multipart/form-data (how the frontend sends it)
#         role = request.POST.get('role') or request.data.get('role')

#         response = super().partial_update(request, *args, **kwargs)

#         if role and response.status_code in (200, 206):
#             employee = self.get_object()
#             employee.user.role = role
#             employee.user.save(update_fields=['role'])
#             # Patch the response so the frontend sees the new role immediately
#             # without needing a separate re-fetch
#             if isinstance(response.data.get('user'), dict):
#                 response.data['user']['role'] = role

#         return response

#     @action(detail=False, methods=['put'], url_path='profile')
#     def update_profile(self, request):
#         """Allow logged-in user to update their own profile (incl. picture)"""
#         employee = Employee.objects.get(user=request.user)
#         serializer = self.get_serializer(employee, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data)
        


#     @action(detail=True, methods=['get', 'post'], url_path='documents')
#     def handle_documents(self, request, pk=None):
#         employee = self.get_object()

#         if request.method == 'GET':
#             # List documents
#             documents = employee.documents.all()
#             serializer = EmployeeDocumentSerializer(
#                 documents, 
#                 many=True, 
#                 context={'request': request}
#             )
#             return Response(serializer.data)



#         elif request.method == 'POST':
#             files = request.FILES.getlist('files')

#             if not files:
#                 return Response(
#                     {"error": "No files uploaded"},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             uploaded_docs = []

#             for file in files:
#                 doc = EmployeeDocument.objects.create(
#                     employee=employee,
#                     file=file
#                 )

#                 uploaded_docs.append(
#                     EmployeeDocumentSerializer(
#                         doc,
#                         context={'request': request}
#                     ).data
#                 )

#             return Response(
#                 uploaded_docs,
#                 status=status.HTTP_201_CREATED
#             )


#     @action(detail=True, methods=['delete'], url_path='documents/(?P<doc_id>[^/.]+)')
#     def delete_document(self, request, pk=None, doc_id=None):
#         try:
#             doc = EmployeeDocument.objects.get(id=doc_id, employee_id=pk)
#             doc.delete()
#             return Response({"message": "Document deleted"}, status=status.HTTP_200_OK)
#         except EmployeeDocument.DoesNotExist:
#             return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)



#     @action(detail=False, methods=["get"], url_path="users")
#     def users(self, request):
#         """Returns all active users for dropdowns (admin/founder only)."""
#         role = (request.user.role or "").lower()
#         if role not in ["admin", "founder"]:
#             return Response({"error": "Not authorized"}, status=403)

#         users = User.objects.filter(is_active=True).order_by("first_name")
#         data = [
#             {
#                 "id": u.id,
#                 "first_name": u.first_name or "",
#                 "last_name": u.last_name or "",
#                 "role": getattr(u, "role", "") or "",
#                 "email": u.email,
#             }
#             for u in users
#         ]
#         return Response(data)
    
#     def perform_destroy(self, instance):
#         from django.db import connection
        
#         employee_id = instance.id
#         user = instance.user
        
#         # Delete all related records that have FK constraints
#         with connection.cursor() as cursor:
#             # Delete related records in order
#             cursor.execute("DELETE FROM employee_leavebalance WHERE employee_id = %s", [employee_id])
#             cursor.execute("DELETE FROM employee_leaverequest WHERE employee_id = %s", [employee_id])
#             cursor.execute("DELETE FROM employee_attendance WHERE employee_id = %s", [employee_id])
#             cursor.execute("DELETE FROM employee_employeedocument WHERE employee_id = %s", [employee_id])
        
#         # Delete employee
#         instance.delete()
        
#         # Delete user
#         if user:
#             try:
#                 user.delete()
#             except Exception:
#                 pass


# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework.response import Response

# class ProfileUpdateView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser]

#     def put(self, request):
#         user = request.user

#         # Handle profile picture
#         profile_pic = request.FILES.get('profile_picture')
#         if profile_pic:
#             user.profile_picture = profile_pic

#         # Handle password
#         new_password = request.data.get('password')
#         if new_password:
#             user.set_password(new_password)

#         user.save()
#         return Response({"detail": "Profile updated successfully."})


















# employee/views.py

# ─── Standard Library ─────────────────────────────────────────────────────────
from datetime import date, timedelta
from decimal import Decimal

# ─── Django ───────────────────────────────────────────────────────────────────
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

# ─── REST Framework ───────────────────────────────────────────────────────────
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# ─── Local ────────────────────────────────────────────────────────────────────
from .models import Employee, Team, EmployeeDocument
from .serializers import (
    EmployeeSerializer,
    TeamSerializer,
    EmployeeDocumentSerializer,
    UserSerializer,
    UserEmployeeSerializer,
)
from .permissions import IsHRorAdmin, IsEmployeeOrHRorAdmin

# ─── License (Optional) ───────────────────────────────────────────────────────
def get_max_users():
    return 100

User = get_user_model()


# ─── CSRF View ────────────────────────────────────────────────────────────────
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'detail': 'CSRF cookie set'})


# ─── User List View ───────────────────────────────────────────────────────────
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsHRorAdmin]


# ─── Team ViewSet ─────────────────────────────────────────────────────────────
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]


# ─── Employee ViewSet ─────────────────────────────────────────────────────────
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRorAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['retrieve']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsHRorAdmin]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role == 'employee' and instance.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        role = request.POST.get('role') or request.data.get('role')
        response = super().partial_update(request, *args, **kwargs)
        if role and response.status_code in (200, 206):
            employee = self.get_object()
            employee.user.role = role
            employee.user.save(update_fields=['role'])
            if isinstance(response.data.get('user'), dict):
                response.data['user']['role'] = role
        return response

    @action(detail=False, methods=['put'], url_path='profile')
    def update_profile(self, request):
        """Allow logged-in user to update their own profile"""
        employee = Employee.objects.get(user=request.user)
        serializer = self.get_serializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def handle_documents(self, request, pk=None):
        employee = self.get_object()

        if request.method == 'GET':
            documents = employee.documents.all()
            serializer = EmployeeDocumentSerializer(
                documents, many=True, context={'request': request}
            )
            return Response(serializer.data)

        elif request.method == 'POST':
            files = request.FILES.getlist('files')
            if not files:
                return Response(
                    {"error": "No files uploaded"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            uploaded_docs = []
            for file in files:
                doc = EmployeeDocument.objects.create(employee=employee, file=file)
                uploaded_docs.append(
                    EmployeeDocumentSerializer(doc, context={'request': request}).data
                )
            return Response(uploaded_docs, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='documents/(?P<doc_id>[^/.]+)')
    def delete_document(self, request, pk=None, doc_id=None):
        try:
            doc = EmployeeDocument.objects.get(id=doc_id, employee_id=pk)
            doc.delete()
            return Response({"message": "Document deleted"}, status=status.HTTP_200_OK)
        except EmployeeDocument.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="users")
    def users(self, request):
        """Returns all active users for dropdowns"""
        role = (request.user.role or "").lower()
        if role not in ["admin", "founder"]:
            return Response({"error": "Not authorized"}, status=403)
        users = User.objects.filter(is_active=True).order_by("first_name")
        data = [
            {
                "id":         u.id,
                "first_name": u.first_name or "",
                "last_name":  u.last_name or "",
                "role":       getattr(u, "role", "") or "",
                "email":      u.email,
            }
            for u in users
        ]
        return Response(data)

    def perform_destroy(self, instance):
        employee_id = instance.id

        # Delete all related records that have FK constraints
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM employee_leavebalance   WHERE employee_id = %s", [employee_id])
            cursor.execute("DELETE FROM employee_leaverequest   WHERE employee_id = %s", [employee_id])
            cursor.execute("DELETE FROM employee_attendance     WHERE employee_id = %s", [employee_id])
            cursor.execute("DELETE FROM employee_employeedocument WHERE employee_id = %s", [employee_id])

        # Signal will handle user deletion
        instance.delete()


# ─── Profile Update View ──────────────────────────────────────────────────────
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        user = request.user
        profile_pic = request.FILES.get('profile_picture')
        if profile_pic:
            user.profile_picture = profile_pic
        new_password = request.data.get('password')
        if new_password:
            user.set_password(new_password)
        user.save()
        return Response({"detail": "Profile updated successfully."})