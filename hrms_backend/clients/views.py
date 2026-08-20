# import os
# import pandas as pd
# import datetime
# import calendar
# from django.conf import settings
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# from rest_framework.views import APIView
# from rest_framework.permissions import AllowAny
# from django.core.mail import EmailMessage, get_connection
# from rest_framework import viewsets, generics, status
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.views.decorators.csrf import ensure_csrf_cookie
# from rest_framework.pagination import PageNumberPagination
# from datetime import date
# from django.db.models.functions import Substr, Cast
# from django.db.models import IntegerField
# from django.db.models import F
# from django.db import models
# from rest_framework import viewsets, status, filters
# from rest_framework.decorators import action, api_view
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework.pagination import PageNumberPagination
# from rest_framework.viewsets import ModelViewSet
# from rest_framework import generics, parsers
# from django.utils import timezone # Import timezone
# import uuid # Import uuid for generating Message-IDs
# from .utils.google_sheets import read_recipients_from_google_sheet
# from employee.models import Employee  # Import your Employee model

# from .models import UDINRecord, STTRecord, Client, SPOC, DepartmentMessage, Document, EmailLog
# from .serializers import (
#     STTRecordSerializer,
#     ClientSerializer, ClientLiteSerializer,
#     SPOCSerializer, DepartmentMessageSerializer, DocumentSerializer
# )

# @ensure_csrf_cookie
# def get_csrf_token(request):
#     return JsonResponse({'success': True})


# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status, permissions
# import pandas as pd
# from io import BytesIO
# from .models import Client, SPOC, ClientSPOC

# """
# ===================================================================
# UDIN RECORD VIEWSET — PERFORMANCE-OPTIMIZED VERSION
# ===================================================================

# CHANGES FROM ORIGINAL:
# 1. ✅ pagination_class = StandardResultsSetPagination  (was commented out)
# 2. ✅ max_page_size = 500                              (was commented out)
# 3. ✅ select_related('spoc') on queryset               (was missing → N+1 queries)
# 4. ✅ Non-admin/founder roles now filtered at DB level  (was only manager)
# 5. ✅ list() override supports ?all=true for Excel export without pagination

# HOW TO APPLY:
# - Replace your existing UDINRecordViewSet class and
#   StandardResultsSetPagination class with this file's content.
# - No migrations needed — only queryset/view layer changes.
# ===================================================================
# """

# from rest_framework.pagination import PageNumberPagination
# from rest_framework.viewsets import ModelViewSet
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from django.db.models import Q


# class StandardResultsSetPagination(PageNumberPagination):
#     page_size = 20
#     page_size_query_param = 'page_size'
#     max_page_size = 500   # ✅ CHANGED: was commented out; now allows up to 500 per page (used for Excel export)

# #STTRecord:
# class STTRecordViewSet(viewsets.ModelViewSet):
#     serializer_class    = STTRecordSerializer
#     permission_classes  = [IsAuthenticated]
#     pagination_class    = StandardResultsSetPagination

#     def get_queryset(self):
#         qs      = STTRecord.objects.all().order_by('-date_of_stt')
#         params  = self.request.query_params
#         user    = self.request.user

#         # ---- identify current user ----
#         full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
#         dept_raw  = None
#         if user.is_authenticated:
#             employee = Employee.objects.filter(user=user).first()
#             if employee and employee.department:
#                 dept_raw = employee.department                       # e.g. "IDT, DT"
#         dept_list = [d.strip() for d in dept_raw.split(',')] if dept_raw else []

#         # ---- role‑based visibility rules ----
#         role = (user.role or '').lower()

#         if role in ('founder', 'admin'):
#             pass   # founders / admins see **everything**

#         elif role == 'manager':
#             # manager → records where (department matches   OR   SPOC is the manager)
#             qs = qs.filter(
#                 models.Q(department__in=dept_list) |
#                 models.Q(spoc__name__iexact=full_name) |
#                 models.Q(request_by__iexact=full_name)
#             )

#         else:
#             # all other users → records where (department matches   OR   SPOC is the user)
#             if dept_list:
#                 qs = qs.filter(
#                     models.Q(department__in=dept_list) |
#                     models.Q(spoc__name__iexact=full_name)
#                 )
#             else:
#                 # user has no department → rely solely on SPOC match
#                 qs = qs.filter(spoc__name__iexact=full_name)

#         # ---- existing column / month filters (unchanged) ----
#         if month := params.get('month'):
#             try:
#                 year, m = month.split('-')
#                 qs = qs.filter(date_of_stt__year=year, date_of_stt__month=int(m))
#             except ValueError:
#                 pass

#         if stt_no := params.get('stt_no'):
#             qs = qs.filter(stt_no__icontains=stt_no)

#         if client_name := params.get('client_name'):
#             qs = qs.filter(client_name__icontains=client_name)

#         if department := params.get('department'):
#             qs = qs.filter(department__icontains=department)

#         if spoc_name := params.get('spoc_name'):
#             qs = qs.filter(spoc__name__icontains=spoc_name)

#         if description := params.get('description'):
#             qs = qs.filter(description__icontains=description)

#         if invoice_no := params.get('invoice_no'):
#             qs = qs.filter(invoice_no__icontains=invoice_no)

#         if request_by := params.get('request_by'):
#             qs = qs.filter(request_by__icontains=request_by)

#         return qs


#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = request.data.copy()

#         # Extract client_name, period details, and description from the validated data
#         client_name = serializer.validated_data.get('client_name')
#         period_type = serializer.validated_data.get('period_type')
#         period_start_date = serializer.validated_data.get('period_start_date')
#         period_end_date = serializer.validated_data.get('period_end_date')

#         # Now using 'description' directly as per your model and serializer update
#         description = serializer.validated_data.get('description') 

#         if not data.get('department'):
#             try:
#                 employee = Employee.objects.filter(user=request.user).first()
#                 if employee and employee.department:
#                     data['department'] = employee.department
#             except Exception as e:
#                 pass

#         serializer = self.get_serializer(data=data)
#         serializer.is_valid(raise_exception=True)

#         # Check for existing STTRecord with the same client_name, period details, and description
#         existing_record = STTRecord.objects.filter(
#             client_name=client_name,
#             period_type=period_type,
#             period_start_date=period_start_date,
#             period_end_date=period_end_date,
#             description=description, # Now checking against the 'description' field
#         ).first()

#         if existing_record:
#             # If a record exists, return an error response
#             return Response(
#                 f"STT record already created with old STT number: {existing_record.stt_no}",
#                 status=status.HTTP_409_CONFLICT,
#                 content_type="text/plain"
#             )
#         else:
#             # If no duplicate exists, proceed to create the new record
#             self.perform_create(serializer)
#             return Response({
#                 "message": f"🎉 Congratulations! Your STT No {serializer.data.get('stt_no')} has been created.",
#                 "data": serializer.data
#             }, status=status.HTTP_201_CREATED)

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from clients.models import STTRecord



# @api_view(['GET'])
# def get_next_ref_no(request):
#     today = date.today()
#     # print(f"Today's date: {today}")
#     if today.month >= 4:
#         fy_start = today.year
#         fy_end = today.year + 1
#     else:
#         fy_start = today.year - 1
#         fy_end = today.year
#     fy_str = f"{fy_start}-{str(fy_end)[-2:]}"

#     last_record = UDINRecord.objects.filter(
#         internal_ref_no__icontains=f"-{fy_str}"
#     ).order_by('-id').first()

#     next_number = 1
#     if last_record:
#         try:
#             parts = last_record.internal_ref_no.split('-')
#             if len(parts) >= 3 and parts[1].isdigit():
#                 next_number = int(parts[1]) + 1
#         except (IndexError, ValueError):
#             pass

#     new_ref_no = f"CKPSCA-{next_number:03d}-{fy_str}"
#     return Response({"internal_ref_no": new_ref_no})

# #STT_No Generation
# @api_view(['GET'])
# def get_next_stt_no(request):
#     today = date.today()
#     if today.month >= 4:
#         fy_start = today.year
#         fy_end = today.year + 1
#     else:
#         fy_start = today.year - 1
#         fy_end = today.year
#     fy_str = f"{fy_start}-{str(fy_end)[-2:]}"

#     last_record = STTRecord.objects.filter(
#         stt_no__icontains=f"-{fy_str}"
#     ).order_by('-id').first()

#     next_number = 1
#     if last_record:
#         try:
#             parts = last_record.stt_no.split('-')
#             if len(parts) >= 3 and parts[1].isdigit():
#                 next_number = int(parts[1]) + 1
#         except (IndexError, ValueError):
#             pass

#     new_stt_no = f"CKPSCA-STT-{next_number:04d}-{fy_str}"
#     return Response({"stt_no": new_stt_no})

# from rest_framework import viewsets, filters
# from django_filters.rest_framework import DjangoFilterBackend
# from django.views.decorators.cache import cache_page

# # ── views.py ──────────────────────────────────────────────────────────────────

# from rest_framework.pagination import PageNumberPagination
# from django.db.models import Prefetch, OuterRef, Subquery
# from django.utils.decorators import method_decorator
# from django.views.decorators.cache import cache_page


# class ClientPagination(PageNumberPagination):
#     page_size             = 100
#     page_size_query_param = 'page_size'
#     max_page_size         = 500


# class ClientViewSet(viewsets.ModelViewSet):
#     permission_classes = [IsAuthenticated]
#     pagination_class   = ClientPagination

#     filter_backends  = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
#     search_fields    = [
#         'name',
#         'gstin',
#         'client_groups_membership__group_name',
#         'client_groups_membership__primary_spoc__name',
#     ]
#     filterset_fields = ['is_active']
#     ordering_fields  = ['name', 'created_at']
#     ordering         = ['name']

#     def get_serializer_class(self):
#         if self.action == 'list':
#             return ClientListSerializer   # lean — for tables & dropdowns
#         return ClientSerializer           # full — for create / update / retrieve

#     def get_queryset(self):
#         return Client.objects.select_related(
#             'constitution',
#         ).prefetch_related(
#             Prefetch(
#                 'client_groups_membership',
#                 queryset=ClientGroup.objects.select_related(
#                     'primary_spoc',
#                     'secondary_spoc',
#                 ).only(
#                     'id', 'group_name', 'is_active',
#                     'primary_spoc__id', 'primary_spoc__name', 'primary_spoc__email',
#                     'secondary_spoc__id', 'secondary_spoc__name', 'secondary_spoc__email',
#                 )
#             ),
#             Prefetch(
#                 'spocs',
#                 queryset=ClientSPOC.objects.select_related('spoc').only(
#                     'id', 'client_id',
#                     'spoc__id', 'spoc__name', 'spoc__email',
#                 )
#             ),
#         ).order_by('name')

#     @action(
#         detail=False, methods=['post'],
#         parser_classes=(MultiPartParser, FormParser)
#     )
#     def bulk_upload(self, request, *args, **kwargs):
#         file_obj = request.data.get('file')
#         if not file_obj:
#             return Response(
#                 {'detail': 'No file provided'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             if file_obj.name.endswith('.csv'):
#                 df = pd.read_csv(io.BytesIO(file_obj.read()))
#             elif file_obj.name.endswith('.xlsx'):
#                 df = pd.read_excel(io.BytesIO(file_obj.read()))
#             else:
#                 return Response(
#                     {'detail': 'Unsupported file format. Please upload CSV or XLSX.'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             required_columns = ['name', 'email']
#             if not all(col in df.columns for col in required_columns):
#                 return Response(
#                     {'detail': f'Missing required columns: {required_columns}'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             def safe(row, col):
#                 return row[col] if col in row.index and pd.notna(row[col]) else None

#             clients_to_create = []
#             errors            = []

#             for index, row in df.iterrows():
#                 try:
#                     client_data = {
#                         'name':               row['name'],
#                         'email':              safe(row, 'email'),
#                         'phone':              safe(row, 'phone'),
#                         'address':            safe(row, 'address'),
#                         'nature_of_business': safe(row, 'nature_of_business'),
#                         'contact_person':     safe(row, 'contact_person'),
#                         'cin':                safe(row, 'cin'),
#                         'pan':                safe(row, 'pan'),
#                         'gstin':              safe(row, 'gstin'),
#                         'iec':                safe(row, 'iec'),
#                         'ksea':               safe(row, 'ksea'),
#                         'udyam':              safe(row, 'udyam'),
#                         'apt':                safe(row, 'apt'),
#                         'ept':                safe(row, 'ept'),
#                         'tan':                safe(row, 'tan'),
#                         'lei':                safe(row, 'lei'),
#                     }
#                     serializer = ClientSerializer(data=client_data)
#                     serializer.is_valid(raise_exception=True)
#                     clients_to_create.append(Client(**serializer.validated_data))
#                 except Exception as e:
#                     errors.append(f"Row {index + 1}: {e}")

#             if errors:
#                 return Response(
#                     {'detail': 'Validation errors during bulk upload', 'errors': errors},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             with transaction.atomic():
#                 Client.objects.bulk_create(
#                     clients_to_create,
#                     ignore_conflicts=True
#                 )

#             return Response(
#                 {'detail': f'Successfully uploaded {len(clients_to_create)} clients.'},
#                 status=status.HTTP_200_OK
#             )

#         except Exception as e:
#             return Response(
#                 {'detail': f'Error processing file: {str(e)}'},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# # ── ClientLiteViewSet — for dropdowns only (id + name + group) ───────────────

# class ClientLiteViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     Ultra-fast read-only endpoint for dropdowns.
#     Returns only id, name, group_name, primary_spoc_name.
#     Uses Subquery annotation — single SQL query, no Python loops.
#     """
#     permission_classes = [IsAuthenticated]
#     serializer_class   = ClientLiteSerializer
#     pagination_class   = None  # return all for dropdown use

#     filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields    = ['name']
#     ordering         = ['name']

#     def get_queryset(self):
#         active_group = ClientGroup.objects.filter(
#             clients=OuterRef('pk'),
#             is_active=True,
#         ).select_related('primary_spoc')

#         return Client.objects.annotate(
#             _group_name=Subquery(
#                 active_group.values('group_name')[:1]
#             ),
#             _primary_spoc_name=Subquery(
#                 active_group.values('primary_spoc__name')[:1]
#             ),
#         ).only(
#             'id', 'name', 'is_active',
#         ).order_by('name')



# class SPOCViewSet(viewsets.ModelViewSet):
#     queryset = SPOC.objects.all()
#     serializer_class = SPOCSerializer
#     permission_classes = [IsAuthenticated]
#     pagination_class = None

# import os
# import datetime
# from django.conf import settings
# from django.http import JsonResponse
# from rest_framework import generics, parsers, status
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.db.models import Q
# from django.utils import timezone # Import timezone for deleted_at timestamp
# from django.db.models.signals import pre_delete
# from django.dispatch import receiver

# from .models import Document # Your Document model
# from .serializers import DocumentSerializer # Your DocumentSerializer
# from employee.models import Employee # Assuming your Employee model is in users.models
# from rest_framework.decorators import action
# import jwt
# import os
# import uuid
# import json # Import json for parsing incoming callback data
# from django.conf import settings
# from django.http import JsonResponse, HttpResponse # Import HttpResponse for callback success
# from django.views.decorators.csrf import csrf_exempt
# from django.shortcuts import get_object_or_404
# # from django.utils import timezone # Uncomment if you want to use timezone for 'iat'

# # Assuming you have a Document model. If not, adjust this import.
# from .models import Document # <--- UNCOMMENTED THIS LINE

# import jwt
# import os
# import uuid
# import json
# from django.conf import settings
# from django.http import JsonResponse, HttpResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.shortcuts import get_object_or_404

# from .models import Document


# # Function to generate a unique key for the document (important for caching/versioning)
# def generate_onlyoffice_doc_key(document_id):
#     return f"{document_id}-{uuid.uuid4().hex}"

# # --- Define your OnlyOffice JWT Secret ---
# # This MUST match the 'secret' string in your ONLYOFFICE Document Server's local.json
# # From your local.json: "cJLCqmq9ljxGhOu95z8fgOTuvhbBxYs3"
# # It's highly recommended to store this in your Django settings.py:
# # settings.py: ONLYOFFICE_JWT_SECRET = "cJLCqmq9ljxGhOu95z8fgOTuvhbBxYs3"
# ONLYOFFICE_JWT_SECRET = "oGxl61ilfi8IcJx5YNhv8B62ROgwzHWC" # Ensure this matches your local.json

# # Utility to map file extensions to documentType
# def get_document_type(ext):
#     ext_lower = ext.lower()
#     if ext_lower in ["doc", "docx", "odt", "rtf", "txt"]: return "word"
#     if ext_lower in ["pdf"]: return "pdf"
#     if ext_lower in ["xls", "xlsx", "ods", "csv"]: return "cell"
#     if ext_lower in ["ppt", "pptx", "odp"]: return "slide"
#     return "word" # default fallback

# def get_onlyoffice_editor_config(request, document_id):
#     try:
#         document_instance = get_object_or_404(Document, pk=document_id)

#         # IMPORTANT: This should be the URL where your Django server is reachable
#         # by the ONLYOFFICE Document Server and your frontend.
#         # For localhost setup, this should be http://localhost:8000
#         DJANGO_PUBLIC_URL = "http://host.docker.internal:8000" # <--- **KEEP THIS AS LOCALHOST**

#         # --- CRITICAL: Ensure ALLOWED_HOSTS in settings.py includes 'localhost', '127.0.0.1' ---

#         # REMOVE OR COMMENT OUT THESE LINES THAT USE HOST_IP
#         # HOST_IP = "192.168.1.174"
#         # url = f"http://{HOST_IP}:8000{document_instance.file.url}"
#         # callback_url = f"http://{HOST_IP}:8000/api/clients/onlyoffice/callback/"

#         # Construct the URL where ONLYOFFICE Document Server can fetch the document
#         # This assumes Django is serving your media files at /media/
#         document_url = f"{DJANGO_PUBLIC_URL}{document_instance.file.url}" # <--- **USE THIS**
#         # The callback URL for ONLYOFFICE Document Server to send save/status updates
#         callback_url = f"{DJANGO_PUBLIC_URL}/api/clients/onlyoffice/callback/" # <--- **USE THIS**

#         file_name = os.path.basename(document_instance.file.name)
#         file_ext = os.path.splitext(file_name)[1].lstrip('.')

#         doc_key = generate_onlyoffice_doc_key(document_id)

#         user_name = "Guest User"
#         if request.user.is_authenticated:
#             user_name = request.user.get_full_name() or request.user.username

#         # Construct the base OnlyOffice configuration JSON
#         config = {
#             "document": {
#                 "fileType": file_ext,
#                 "key": doc_key,
#                 "title": file_name,
#                 "url": document_url, # <--- Ensure this uses document_url
#                 "permissions": {
#                     "edit": True,
#                     "download": True,
#                     "print": True,
#                     "comment": True,
#                     "fillForms": True,
#                     "review": True,
#                     "copy": True
#                 }
#             },
#             "documentType": get_document_type(file_ext),
#             "editorConfig": {
#                 "callbackUrl": callback_url, # <--- Ensure this uses callback_url
#                 "mode": "edit",
#                 "lang": "en",
#                 "user": {
#                     "id": str(request.user.id) if request.user.is_authenticated else "guest",
#                     "name": user_name,
#                 },
#                 "customization": {
#                     "autosave": True,
#                     "forcesave": True,
#                     "chat": True,
#                     "comments": True,
#                     "help": True,
#                     "macros": True,
#                     "plugins": True,
#                     "compactToolbar": False,
#                     "zoom": 100,
#                     "uiTheme": "theme-light",
#                     "goback": {
#                         "url": f"{DJANGO_PUBLIC_URL}/", # This is correct
#                         "text": "Back to Documents",
#                         "blank": False
#                     }
#                 }
#             },
#             "type": "desktop",
#             "width": "100%",
#             "height": "90vh",
#         }

#         # --- JWT GENERATION ---
#         jwt_payload = {
#             "document": config["document"],
#             "editorConfig": config["editorConfig"],
#             "documentType": config["documentType"],
#         }

#         token = jwt.encode(jwt_payload, ONLYOFFICE_JWT_SECRET, algorithm="HS256")

#         config["token"] = token

#         # IMPORTANT: This should be the public URL where your ONLYOFFICE Document Server is reachable
#         # by the browser. For localhost setup, this should be http://localhost:8080/
#         config["documentServerUrl"] = "http://localhost:8080/" # <--- KEEP THIS AS LOCALHOST

#         print(f"Generated ONLYOFFICE Config: {json.dumps(config, indent=2)}")
#         return JsonResponse(config)

#     except Document.DoesNotExist:
#         print(f"Error generating OnlyOffice config: No Document matches the given query. Document ID: {document_id}")
#         return JsonResponse({"error": f"Document with ID {document_id} not found."}, status=404)
#     except Exception as e:
#         print(f"Error generating OnlyOffice config: {e}")
#         return JsonResponse({"error": str(e)}, status=500)

# @csrf_exempt
# def onlyoffice_callback(request):
#     """
#     Handles callbacks from the ONLYOFFICE Document Server.
#     This endpoint receives POST requests from the Document Server.
#     """
#     try:
#         data = json.loads(request.body)
#         print(f"ONLYOFFICE Callback Received: {json.dumps(data, indent=2)}")

#         callback_token = data.get('token')
#         if callback_token:
#             try:
#                 decoded_payload = jwt.decode(callback_token, ONLYOFFICE_JWT_SECRET, algorithms=["HS256"])
#                 print(f"Callback JWT Decoded: {json.dumps(decoded_payload, indent=2)}")
#             except jwt.ExpiredSignatureError:
#                 print("Callback JWT has expired.")
#             except jwt.InvalidTokenError:
#                 print("Invalid Callback JWT.")
#         else:
#             print("No JWT token found in callback data (from Document Server).")

#         status = data.get('status')
#         doc_key = data.get('key')
#         doc_url = data.get('url')

#         if status == 2:
#             print(f"Document {doc_key} saved. New URL: {doc_url}")

#         elif status == 3:
#             print(f"Document {doc_key} is being edited by others.")
#         elif status == 6:
#             print(f"Document {doc_key} is auto-saving.")
#         elif status == 7:
#             print(f"Document {doc_key} is explicitly saving (intermediate save).")
#         else:
#             print(f"Unhandled ONLYOFFICE callback status: {status} for document {doc_key}")

#         return JsonResponse({"error": 0})

#     except json.JSONDecodeError:
#         print("Error: Invalid JSON in ONLYOFFICE callback request body.")
#         return JsonResponse({"error": 1, "message": "Invalid JSON"}, status=400)
#     except Exception as e:
#         print(f"Error processing ONLYOFFICE callback: {e}")
#         return JsonResponse({"error": 1, "message": str(e)}, status=500)


# # clients/views.py
# from rest_framework import viewsets
# from rest_framework.parsers import MultiPartParser, FormParser
# from .models import Process
# from .serializers import ProcessSerializer



# DEPARTMENT_SHEET_IDS = {
#     "Bank Statement and Expenses Details": "1YexlQsYTbpa8Iv2OTk1ihjcXLOTv4sdar9kG-jyYzA",  # Google Sheet ID for this department
#     "PT Payment Challan": "1lgqpem6VfqefbVxnoAv54HhLPjokvgGe_P3_714jYpA",
#     "Outward & Inward": "18IrDIuxyrN4pFPwXBYDsZ6NVE5qBjIopOYLp_QoZ2vU",
#     "TDS and TCS Inputs": "1J7oAut6f2SJVrpvQ3Mn6ZjOVTcWf3ZXbxyKlgVYsb60",
#     "E-TDS Data": "1wfAgQwruNYJaV4wyFDX5bkUu0VaRFOaz5d4e_pzk_zw",
#     "Advance Tax Inputs": "19LxOBFSyanm5PxABB5pd4x9UwJDK23aRixdNm4cMsgE",
#     "Book Keeping": "1EzSS45blLfL6Ht2sKwhnXjIUATAzuFPvFJFJaunmyUw",
# }


# # Calculate previous month's details for default behavior
# now = datetime.datetime.now()
# first_day_of_current_month = now.replace(day=1)
# # Subtract one day from the first day of the current month to get to the last day of the previous month
# last_day_of_previous_month = first_day_of_current_month - datetime.timedelta(days=1)

# # These global variables will now refer to the previous month
# current_month_name = calendar.month_name[last_day_of_previous_month.month]
# current_year = last_day_of_previous_month.year
# current_month_year_str = f"{current_month_name}_{current_year}"

# # Helper function to get financial quarter and year
# def get_financial_quarter_and_year(target_date):
#     month = target_date.month
#     year = target_date.year

#     prev_quarter_month_start = 0
#     prev_quarter_year = 0

#     # Determine the end month and year of the previous quarter
#     if 4 <= month <= 6:  # Current quarter is Q1 (Apr-Jun)
#         # Previous quarter is Q4 (Jan-Mar) of the same calendar year
#         prev_quarter_month_start = 1
#         prev_quarter_year = year
#     elif 7 <= month <= 9:  # Current quarter is Q2 (Jul-Sep)
#         # Previous quarter is Q1 (Apr-Jun) of the same calendar year
#         prev_quarter_month_start = 4
#         prev_quarter_year = year
#     elif 10 <= month <= 12:  # Current quarter is Q3 (Oct-Dec)
#         # Previous quarter is Q2 (Jul-Sep) of the same calendar year
#         prev_quarter_month_start = 7
#         prev_quarter_year = year
#     else:  # 1 <= month <= 3 (Current quarter is Q4 (Jan-Mar))
#         # Previous quarter is Q3 (Oct-Dec) of the previous calendar year
#         prev_quarter_month_start = 10
#         prev_quarter_year = year - 1

#     # Now, based on prev_quarter_month_start and prev_quarter_year,
#     # determine the details for the previous quarter.
#     if prev_quarter_month_start == 4:
#         quarter = "Q1"
#         fy_start_year = prev_quarter_year
#         fy_end_year = prev_quarter_year + 1
#         quarter_months = "Apr-Jun"
#     elif prev_quarter_month_start == 7:
#         quarter = "Q2"
#         fy_start_year = prev_quarter_year
#         fy_end_year = prev_quarter_year + 1
#         quarter_months = "Jul-Sep"
#     elif prev_quarter_month_start == 10:
#         quarter = "Q3"
#         fy_start_year = prev_quarter_year
#         fy_end_year = prev_quarter_year + 1
#         quarter_months = "Oct-Dec"
#     else: # prev_quarter_month_start == 1 (Jan-Mar)
#         quarter = "Q4"
#         fy_start_year = prev_quarter_year - 1 # Q4 is part of the previous FY
#         fy_end_year = prev_quarter_year
#         quarter_months = "Jan-Mar"

#     return quarter, f"{fy_start_year}-{str(fy_end_year)[-2:]}", quarter_months


# import json
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from .models import Company, Invoice
# from .serializers import InvoiceSerializer, CompanySerializer

# @csrf_exempt
# def company_details_api(request):
#     # Retrieve company details (GET request)
#     if request.method == 'GET':
#         try:
#             # Assumes there is only one company profile
#             company = Company.objects.first()
#             if company:
#                 # Convert Django model instance to a dictionary
#                 data = {
#                     'companyName': company.companyName,
#                     'companytype': company.companytype,
#                     'natureOfBusiness': company.natureOfBusiness,
#                     'incorporationDate': company.incorporationDate,
#                     'stateOfRegistration': company.stateOfRegistration,
#                     'panNo': company.panNo,
#                     'gstNo': company.gstNo,
#                     'tanNo': company.tanNo,
#                     'cin': company.cin,
#                     'lutNo': company.lutNo,
#                     'lutDate': company.lutDate,
#                     'contactPerson': company.contactPerson,
#                     'contactEmail': company.contactEmail,
#                     'contactPhone': company.contactPhone,
#                     'address': company.address,
#                     'bankAccountNo': company.bankAccountNo,
#                     'ifscCode': company.ifscCode,
#                     'bankName': company.bankName,
#                     'bankAddress': company.bankAddress,
#                     'additionalBasicDetails': company.additionalBasicDetails,
#                     'additionalIdentificationDetails': company.additionalIdentificationDetails,
#                     'additionalContactDetails': company.additionalContactDetails,
#                     'additionalBankingDetails': company.additionalBankingDetails,
#                     'otherDetails': company.otherDetails,
#                     'sacDetails': company.sacDetails
#                 }
#                 return JsonResponse(data)
#             else:
#                 return JsonResponse({'message': 'No company details found'}, status=404)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     # Save or update company details (POST request)
#     elif request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             # Find the existing company or create a new one
#             company, created = Company.objects.get_or_create(id=1) # Using a fixed ID for a single-profile app
            
#             # Update the company object with the new data
#             for key, value in data.items():
#                 if key in ['incorporationDate', 'lutDate'] and value:
#                     # Convert date strings from frontend to Python date objects
#                     setattr(company, key, value)
#                 elif key in ['additionalBasicDetails', 'additionalIdentificationDetails', 'additionalContactDetails', 'additionalBankingDetails', 'otherDetails']:
#                     # Ensure dynamic fields are handled as JSON
#                     setattr(company, key, value)
#                 else:
#                     setattr(company, key, value)
            
#             company.save()
#             return JsonResponse({'message': 'Company details saved successfully', 'id': company.id}, status=200)

#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     return JsonResponse({'error': 'Method not allowed'}, status=405)

# from django.db.models import Sum, Count, Avg

# from rest_framework.response import Response

# ##################################################################################################################################

# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.decorators import action
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# from django.db import transaction
# import pandas as pd
# import io

# from .models import (
#     SPOC, Client, ClientSPOC, GroupCategory, ClientGroup,
#     MainService, SubService, ClientGroupService, Constitution, Task, TaskTimeEntry
# )
# from .serializers import (
#     SPOCSerializer, ClientSerializer, ClientSPOCSerializer, GroupCategorySerializer, ClientListSerializer,
#     MainServiceSerializer, SubServiceSerializer, ClientGroupServiceSerializer,
#     ClientGroupReadSerializer, ClientGroupWriteSerializer, ConstitutionSerializer, TaskSerializer
# )

# # You might need authentication and permission classes here
# # from rest_framework.permissions import IsAuthenticated

# class ConstitutionViewSet(viewsets.ModelViewSet):
#     queryset = Constitution.objects.all()
#     serializer_class = ConstitutionSerializer

# # class SPOCViewSet(viewsets.ModelViewSet):
# #     queryset = SPOC.objects.all()
# #     serializer_class = SPOCSerializer
# #     # permission_classes = [IsAuthenticated] # Example

# class ClientViewSet(viewsets.ModelViewSet):
#     # queryset = Client.objects.all().order_by('name')
#     # serializer_class = ClientSerializer
#     # permission_classes = [IsAuthenticated]
#     queryset = Client.objects.prefetch_related(
#         Prefetch(
#             'client_groups_membership',
#             queryset=ClientGroup.objects.select_related(
#                 'primary_spoc', 'secondary_spoc'
#             ).filter(is_active=True)
#         )
#     ).order_by('name')

#     def get_serializer_class(self):
#         if self.action == 'list':
#             return ClientListSerializer   # lean — fast for 500 clients
#         return ClientSerializer           # full — used for retrieve/create/update

#     @action(detail=False, methods=['post'], parser_classes=(MultiPartParser, FormParser))
#     def bulk_upload(self, request, *args, **kwargs):
#         """
#         Handles bulk upload of clients via CSV or Excel file.
#         Expects a file named 'file' in the request.
#         """
#         file_obj = request.data.get('file')

#         if not file_obj:
#             return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             if file_obj.name.endswith('.csv'):
#                 df = pd.read_csv(io.BytesIO(file_obj.read()))
#             elif file_obj.name.endswith('.xlsx'):
#                 df = pd.read_excel(io.BytesIO(file_obj.read()))
#             else:
#                 return Response({'detail': 'Unsupported file format. Please upload CSV or XLSX.'}, status=status.HTTP_400_BAD_REQUEST)

#             # Assuming your CSV/Excel has columns matching model fields
#             # You'll need to map these correctly
#             required_columns = ['name', 'email'] # Customize as needed
#             if not all(col in df.columns for col in required_columns):
#                 return Response({'detail': f'Missing required columns. Ensure all of {required_columns} are present.'}, status=status.HTTP_400_BAD_REQUEST)

#             clients_to_create = []
#             errors = []

#             for index, row in df.iterrows():
#                 try:
#                     # Clean and validate data as necessary
#                     client_data = {
#                         'name': row['name'],
#                         'email': row['email'] if pd.notna(row['email']) else None,
#                         'phone': row['phone'] if pd.notna(row['phone']) else None,
#                         'address': row['address'] if pd.notna(row['address']) else None,
#                         'nature_of_business': row['nature_of_business'] if pd.notna(row['nature_of_business']) else None,
#                         'contact_person': row['contact_person'] if pd.notna(row['contact_person']) else None,
#                         'cin': row['cin'] if pd.notna(row['cin']) else None,
#                         'pan': row['pan'] if pd.notna(row['pan']) else None,
#                         'gstin': row['gstin'] if pd.notna(row['gstin']) else None,
#                         'iec': row['iec'] if pd.notna(row['iec']) else None,
#                         'ksea': row['ksea'] if pd.notna(row['ksea']) else None,
#                         'udyam': row['udyam'] if pd.notna(row['udyam']) else None,
#                         'apt': row['apt'] if pd.notna(row['apt']) else None,
#                         'ept': row['ept'] if pd.notna(row['ept']) else None,
#                         'tan': row['tan'] if pd.notna(row['tan']) else None,
#                         'lei': row['lei'] if pd.notna(row['lei']) else None,
#                     }
#                     serializer = self.get_serializer(data=client_data)
#                     serializer.is_valid(raise_exception=True)
#                     clients_to_create.append(Client(**serializer.validated_data))
#                 except Exception as e:
#                     errors.append(f"Row {index + 1}: {e}")
            
#             if errors:
#                 return Response({'detail': 'Validation errors during bulk upload', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

#             with transaction.atomic():
#                 Client.objects.bulk_create(clients_to_create, ignore_conflicts=True) # ignore_conflicts for existing names/emails

#             return Response({'detail': f'Successfully uploaded {len(clients_to_create)} clients.'}, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({'detail': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class ClientSPOCViewSet(viewsets.ModelViewSet):
#     queryset = ClientSPOC.objects.all()
#     serializer_class = ClientSPOCSerializer
#     permission_classes = [IsAuthenticated]

# class GroupCategoryViewSet(viewsets.ModelViewSet):
#     queryset = GroupCategory.objects.all()
#     serializer_class = GroupCategorySerializer
#     permission_classes = [IsAuthenticated]

# from rest_framework import viewsets
# from rest_framework.permissions import IsAuthenticated
# from clients.models import MainService
# from clients.serializers import MainServiceSerializer
# from clients.utils.soft_delete import SoftDeleteMixin


# class MainServiceViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
#     serializer_class = MainServiceSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return MainService.objects.filter(is_active=True).order_by('name')


# from clients.models import SubService
# from clients.serializers import SubServiceSerializer

# class SubServiceViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
#     serializer_class = SubServiceSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return SubService.objects.filter(is_active=True).order_by('name')


# from clients.models import ClientGroupService
# from clients.serializers import ClientGroupServiceSerializer

# class ClientGroupServiceViewSet(ModelViewSet):
#     serializer_class = ClientGroupServiceSerializer
#     queryset = ClientGroupService.objects.all()   # ✅ IMPORTANT

#     def get_queryset(self):
#         qs = super().get_queryset()

#         # OPTIONAL filtering for list view only
#         if self.action == "list":
#             return qs.filter(client_group__clients=self.request.user)

#         return qs  # 🔥 DO NOT FILTER retrieve/update/destroy


# from django.db.models import Q, Prefetch

# class ClientGroupViewSet(viewsets.ModelViewSet):
#     permission_classes = [IsAuthenticated]
#     queryset = ClientGroup.objects.all()

#     def get_queryset(self):
#         user = self.request.user
#         role = (user.role or "").lower()

#         qs = ClientGroup.objects.prefetch_related(
#             Prefetch(
#                 'clients',
#                 queryset=Client.objects.select_related(
#                     'constitution',
#                 ).prefetch_related(
#                     Prefetch(
#                         'client_groups_membership',
#                         queryset=ClientGroup.objects.select_related(
#                             'primary_spoc',
#                             'secondary_spoc',
#                         ).only(
#                             'id', 'group_name', 'is_active',
#                             'primary_spoc__id', 'primary_spoc__name', 'primary_spoc__email',
#                             'secondary_spoc__id', 'secondary_spoc__name', 'secondary_spoc__email',
#                         )
#                     ),
#                 ).only(
#                     'id', 'name', 'email', 'phone',
#                     'contact_person', 'nature_of_business',
#                     'gstin', 'pan', 'tan', 'cin',
#                     'iec', 'lei', 'ksea', 'udyam', 'apt', 'ept',
#                     'constitution', 'constitution_id', 'address', 'is_active',
#                 )
#             ),
#             Prefetch(
#                 'group_services',
#                 queryset=ClientGroupService.objects.select_related(
#                     'main_service',
#                     'sub_service',
#                 ).prefetch_related('client'),
#             ),
#         ).select_related(
#             'group_category',
#             'primary_spoc',
#             'secondary_spoc',
#         ).order_by('group_name')

#         if role in ['admin', 'founder']:
#             return qs
#         if role == 'spoc':
#             return qs.filter(
#                 Q(primary_spoc=user) | Q(secondary_spoc=user)
#             )
#         return qs

#     def get_serializer_class(self):
#         if self.action in ['create', 'update', 'partial_update']:
#             return ClientGroupWriteSerializer
#         return ClientGroupReadSerializer
    

# from django.shortcuts import render
# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.decorators import action
# from rest_framework.permissions import IsAuthenticated
# from datetime import date
# from django.db import transaction
# import calendar

# from .models import ClientGroupService, Task, TaskAssignmentHistory, TaskAssignment
# from .serializers import TaskSerializer, TaskHistorySerializer, TaskListSerializer

# from django.db import transaction
# from django.db.models import Max


# def get_financial_year(date_obj):
#     """Returns financial year string e.g. '2024-25'"""
#     if date_obj.month >= 4:
#         return f"{date_obj.year}-{str(date_obj.year + 1)[-2:]}"
#     else:
#         return f"{date_obj.year - 1}-{str(date_obj.year)[-2:]}"


# def get_next_task_id_serial_number(date_obj):
#     """
#     Returns the next serial number for the current financial year.
#     MUST be called inside a transaction.atomic() + select_for_update() block
#     to prevent race conditions on concurrent task creation.

#     Task ID format: CKPSCA-STT-{serial:04d}-{FY}
#     Example:        CKPSCA-STT-0042-2024-25
#     """
#     fy_str = get_financial_year(date_obj)
#     prefix = f"CKPSCA-STT-"
#     suffix = f"-{fy_str}"

#     # select_for_update locks matched rows until the transaction commits,
#     # preventing two concurrent requests from reading the same max serial.
#     last_record = (
#         Task.objects
#         .select_for_update()
#         .filter(
#             task_id__startswith=prefix,
#             task_id__endswith=suffix,
#         )
#         .order_by('-task_id')   # lexicographic order works because serial is zero-padded
#         .first()
#     )

#     if not last_record or not last_record.task_id:
#         return 1

#     try:
#         # Format: CKPSCA-STT-0042-2024-25
#         # Split:  ['CKPSCA', 'STT', '0042', '2024', '25']
#         parts = last_record.task_id.split('-')
#         serial_part = parts[2]  # '0042'

#         if not serial_part.isdigit():
#             raise ValueError(f"Non-numeric serial part: {serial_part!r}")

#         return int(serial_part) + 1

#     except (IndexError, ValueError) as e:
#         # Log this — silent fallback to 1 can create duplicate IDs
#         import logging
#         logger = logging.getLogger(__name__)
#         logger.error(
#             "get_next_task_id_serial_number: failed to parse task_id=%r, error=%s",
#             last_record.task_id, e
#         )
#         # Fall back to count-based estimate rather than restarting at 1
#         return Task.objects.filter(
#             task_id__startswith=prefix,
#             task_id__endswith=suffix,
#         ).count() + 1

# from django.db.models import Count, Sum, F, ExpressionWrapper, fields
# from dateutil.relativedelta import relativedelta
# from datetime import timedelta
# from django.utils.dateparse import parse_date
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.parsers import MultiPartParser, FormParser
# from clients.models import SPOC
# from django.http import FileResponse
# from rest_framework.decorators import action
# from rest_framework.authentication import SessionAuthentication, TokenAuthentication
# from django.core.exceptions import ValidationError

# from django.db.models import Exists, OuterRef, Value, BooleanField
# from django.db.models.functions import Coalesce
# from .utils.time_overlap import check_time_overlap
# from django.utils.dateparse import parse_datetime
# from django.utils import timezone
# ASSIGN_ROLES = {"team lead", "manager", "admin", "founder"}

# from django.db.models.functions import Concat
# from django.db.models import Value, CharField
# from django.db import transaction

# from django.db.models import Q, Prefetch
# from rest_framework import viewsets
# from rest_framework.pagination import PageNumberPagination
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.parsers import JSONParser, MultiPartParser, FormParser


# # ── Pagination ────────────────────────────────────────────────────────────────
# class TaskPagination(PageNumberPagination):
#     page_size             = 50    # default: 50 tasks per page
#     page_size_query_param = 'page_size'
#     max_page_size         = 200   # hard cap so nobody requests all 5415 at once


# class TaskViewSet(viewsets.ModelViewSet):
#     permission_classes = [IsAuthenticated]
#     parser_classes     = (JSONParser, MultiPartParser, FormParser)
#     pagination_class   = TaskPagination

#     def get_serializer_class(self):
#         if self.action == 'list':
#             return TaskListSerializer
#         return TaskSerializer

#     def _base_qs(self):
#         return Task.objects.select_related(
#             'client',
#             'sub_service',
#             'spoc',
#             'team',
#             'created_by',
#             'marked_done_by',
#         ).prefetch_related(
#             Prefetch(
#                 'assignments',
#                 queryset=TaskAssignment.objects.select_related('user').filter(is_active=True),
#             ),
#             Prefetch(
#                 'time_entries',
#                 queryset=TaskTimeEntry.objects.only(
#                     'id', 'task_id', 'employee_id', 'start_time', 'end_time'
#                 ),
#             ),
#             # ── Removed .only() from ClientGroup — field names vary per your model ──
#             Prefetch(
#                 'client__client_groups_membership',
#                 queryset=ClientGroup.objects.filter(is_active=True),
#             ),
#         ).order_by('-created_at')


#     def get_queryset(self):
#         user  = self.request.user
#         scope = self.request.query_params.get('scope', 'all')
#         role  = (getattr(user, 'role', '') or '').lower()

#         base_qs = self._base_qs()

#         # ── Apply filters from frontend query params ──────────────────────────
#         task_id         = self.request.query_params.get('task_id')
#         client_ids      = self.request.query_params.get('client')
#         sub_service_ids = self.request.query_params.get('sub_service')
#         spoc_ids        = self.request.query_params.get('spoc')
#         team_ids        = self.request.query_params.get('team')
#         status_vals     = self.request.query_params.get('status')
#         created_by_name = self.request.query_params.get('created_by_name')
#         due_after       = self.request.query_params.get('due_date_after')
#         due_before      = self.request.query_params.get('due_date_before')

#         if task_id:
#             base_qs = base_qs.filter(task_id__icontains=task_id)

#         if client_ids:
#             ids = [i.strip() for i in client_ids.split(',') if i.strip()]
#             base_qs = base_qs.filter(client_id__in=ids)

#         if sub_service_ids:
#             ids = [i.strip() for i in sub_service_ids.split(',') if i.strip()]
#             base_qs = base_qs.filter(sub_service_id__in=ids)

#         if spoc_ids:
#             ids = [i.strip() for i in spoc_ids.split(',') if i.strip()]
#             base_qs = base_qs.filter(spoc_id__in=ids)

#         if team_ids:
#             ids = [i.strip() for i in team_ids.split(',') if i.strip()]
#             base_qs = base_qs.filter(team_id__in=ids)


#         if status_vals:
#             statuses = [s.strip() for s in status_vals.split(',') if s.strip()]
#             db_statuses = [s for s in statuses if s != 'Over Due']
#             include_overdue = 'Over Due' in statuses

#             from django.utils import timezone
#             today = timezone.now().date()

#             # ── If filtering In Progress, exclude past-due tasks ──────────────
#             if 'In Progress' in db_statuses:
#                 db_statuses_q = (
#                     Q(status='In Progress', due_date__gte=today) |
#                     Q(status__in=[s for s in db_statuses if s != 'In Progress'])
#                 )
#             else:
#                 db_statuses_q = Q(status__in=db_statuses) if db_statuses else Q()

#             # ── Same for To Do ─────────────────────────────────────────────────
#             if 'To Do' in db_statuses:
#                 db_statuses_q = (
#                     Q(status='To Do', due_date__gte=today) |
#                     Q(status__in=[s for s in db_statuses if s != 'To Do'])
#                 )

#             if db_statuses and include_overdue:
#                 base_qs = base_qs.filter(
#                     db_statuses_q |
#                     Q(due_date__lt=today, status__in=['To Do', 'In Progress'])
#                 )
#             elif db_statuses:
#                 base_qs = base_qs.filter(db_statuses_q)
#             elif include_overdue:
#                 base_qs = base_qs.filter(
#                     due_date__lt=today,
#                     status__in=['To Do', 'In Progress']
#                 )

#         if created_by_name:
#             names = [n.strip() for n in created_by_name.split(',') if n.strip()]
#             q = Q()
#             for name in names:
#                 parts = name.strip().split(' ', 1)
#                 if len(parts) == 2:
#                     q |= Q(created_by__first_name__icontains=parts[0],
#                         created_by__last_name__icontains=parts[1])
#                 else:
#                     q |= Q(created_by__first_name__icontains=parts[0]) | \
#                         Q(created_by__last_name__icontains=parts[0])
#             base_qs = base_qs.filter(q)

#         if due_after:
#             base_qs = base_qs.filter(due_date__gte=due_after)

#         if due_before:
#             base_qs = base_qs.filter(due_date__lte=due_before)

#         # ── Single-object actions ─────────────────────────────────────────────
#         if self.action in ('retrieve', 'update', 'partial_update', 'destroy', 'history'):
#             return base_qs

#         # ── scope=my ──────────────────────────────────────────────────────────
#         if scope == 'my':
#             return base_qs.filter(
#                 Q(created_by=user) |
#                 Q(assignments__user=user, assignments__is_active=True) |
#                 Q(time_entries__employee=user)
#             ).distinct()

#         # ── Admin / Founder ───────────────────────────────────────────────────
#         if role in ('admin', 'founder'):
#             return base_qs

#         # ── Everyone else ─────────────────────────────────────────────────────
#         employee = Employee.objects.filter(user=user).first()
#         if not employee or not employee.department:
#             return base_qs.none()

#         dept_q = Q()
#         for dept in [d.strip() for d in employee.department.split(',') if d.strip()]:
#             dept_q |= Q(team__name__iexact=dept)

#         spoc   = SPOC.objects.filter(
#             Q(email__iexact=user.email) |
#             Q(name__iexact=user.get_full_name())
#         ).first()
#         spoc_q = Q(spoc=spoc) if spoc else Q()

#         return base_qs.filter(
#             dept_q | spoc_q |
#             Q(created_by=user) |
#             Q(assignments__user=user, assignments__is_active=True) |
#             Q(time_entries__employee=user)
#         ).distinct()

#     # ── retrieve ──────────────────────────────────────────────────────────────

#     def retrieve(self, request, *args, **kwargs):
#         pk   = kwargs.get('pk')
#         user = request.user
#         role = (getattr(user, 'role', '') or '').lower()

#         # ── Guard: non-numeric pk means a custom action was misrouted ──
#         if not str(pk).lstrip('-').isdigit():
#             return Response(
#                 {'error': f'Invalid task id: {pk}'},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         base_qs = Task.objects.select_related(
#             'client', 'spoc', 'sub_service', 'team',
#             'created_by', 'marked_done_by',
#         ).prefetch_related(
#             'time_entries',
#             'time_entries__employee',
#             'assignments',
#             'assignments__user',
#         )

#         # ── Admin / Founder: retrieve any task ──
#         if role in ('admin', 'founder'):
#             task = base_qs.filter(pk=pk).first()
#             if not task:
#                 raise NotFound('No Task matches the given query.')
#             return Response(self.get_serializer(task).data)

#         # ── Non-admin: visibility rules ──
#         employee = Employee.objects.filter(user=user).first()
#         dept_q   = Q()
#         if employee and employee.department:
#             for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
#                 dept_q |= Q(team__name__icontains=d)

#         spoc = SPOC.objects.filter(
#             Q(email__iexact=user.email) |
#             Q(name__iexact=user.get_full_name())
#         ).first()
#         spoc_q = Q(spoc=spoc) if spoc else Q()

#         task = base_qs.filter(
#             dept_q | spoc_q |
#             Q(created_by=user) |
#             Q(assignments__user=user, assignments__is_active=True) |
#             Q(time_entries__employee=user),
#             pk=pk,
#         ).distinct().first()

#         if not task:
#             raise NotFound('No Task matches the given query.')

#         return Response(self.get_serializer(task).data)

#     # ── Helper: build role-scoped allowed_task_ids ────────────────────────────

#     def _get_allowed_task_ids(self, user):
#         """
#         Returns None for admin/founder (no restriction),
#         or a flat list of task IDs this user is allowed to see.
#         """
#         role = (getattr(user, 'role', '') or '').lower()
#         if role in ('admin', 'founder'):
#             return None

#         employee = Employee.objects.filter(user=user).first()
#         if not employee or not employee.department:
#             return []

#         dept_q = Q()
#         for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
#             dept_q |= Q(team__name__iexact=d)

#         spoc = SPOC.objects.filter(
#             Q(email__iexact=user.email) |
#             Q(name__iexact=user.get_full_name())
#         ).first()
#         spoc_q = Q(spoc=spoc) if spoc else Q()

#         return Task.objects.filter(
#             dept_q | spoc_q |
#             Q(created_by=user) |
#             Q(assignments__user=user, assignments__is_active=True) |
#             Q(time_entries__employee=user)
#         ).distinct().values_list('id', flat=True)

#     @action(detail=False, methods=['get'], url_path='export')
#     def export(self, request):
#         qs = self.get_queryset()   # all filters applied, no pagination
#         serializer = TaskListSerializer(qs, many=True)
#         return Response(serializer.data)

#     # ── Helper: apply date filter to a TaskTimeEntry queryset ────────────────

#     def _apply_entry_date_filter(self, entry_qs, start_date, end_date):
#         """
#         Filters entry_qs by start_time (when work was actually done).
#         start_date / end_date are 'YYYY-MM-DD' strings or None.
#         """
#         from datetime import datetime, time as dt_time
#         if start_date:
#             try:
#                 entry_qs = entry_qs.filter(
#                     start_time__gte=datetime.strptime(start_date, '%Y-%m-%d')
#                 )
#             except ValueError:
#                 pass
#         if end_date:
#             try:
#                 ed = datetime.strptime(end_date, '%Y-%m-%d')
#                 entry_qs = entry_qs.filter(
#                     start_time__lte=datetime.combine(ed.date(), dt_time(23, 59, 59))
#                 )
#             except ValueError:
#                 pass
#         return entry_qs

#     # ── Helper: apply categorical filters directly on entry_qs ───────────────

#     def _apply_entry_categorical_filters(self, entry_qs, request):
#         client_ids = request.query_params.get('client_id')
#         team_ids   = request.query_params.get('team_id')
#         sub_ids    = request.query_params.get('sub_service_id')
#         group_ids  = request.query_params.get('client_group_id')

#         if client_ids:
#             entry_qs = entry_qs.filter(task__client_id__in=client_ids.split(','))
#         if team_ids:
#             entry_qs = entry_qs.filter(task__team_id__in=team_ids.split(','))
#         if sub_ids:
#             entry_qs = entry_qs.filter(task__sub_service_id__in=sub_ids.split(','))
#         if group_ids:
#             entry_qs = entry_qs.filter(
#                 task__client__client_groups_membership__id__in=group_ids.split(',')
#             )
#         return entry_qs

#     # ── Helper: build role-scoped allowed_task_ids ────────────────────────────

#     def _get_allowed_task_ids(self, user):
#         """
#         Returns None for admin/founder (no restriction),
#         or a queryset of task IDs this user is allowed to see.
#         """
#         role = (getattr(user, 'role', '') or '').lower()
#         if role in ('admin', 'founder'):
#             return None

#         employee = Employee.objects.filter(user=user).first()
#         if not employee or not employee.department:
#             return []

#         dept_q = Q()
#         for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
#             dept_q |= Q(team__name__iexact=d)

#         spoc = SPOC.objects.filter(
#             Q(email__iexact=user.email) |
#             Q(name__iexact=user.get_full_name())
#         ).first()
#         spoc_q = Q(spoc=spoc) if spoc else Q()

#         return Task.objects.filter(
#             dept_q | spoc_q |
#             Q(created_by=user) |
#             Q(assignments__user=user, assignments__is_active=True) |
#             Q(time_entries__employee=user)
#         ).distinct().values_list('id', flat=True)

#     # ── Helper: apply date filter to a TaskTimeEntry queryset ────────────────

#     def _apply_entry_date_filter(self, entry_qs, start_date, end_date):
#         """
#         Filters by start_time (when work was actually done), not task due_date.
#         """
#         from datetime import datetime, time as dt_time
#         if start_date:
#             try:
#                 entry_qs = entry_qs.filter(
#                     start_time__gte=datetime.strptime(start_date, '%Y-%m-%d')
#                 )
#             except ValueError:
#                 pass
#         if end_date:
#             try:
#                 ed = datetime.strptime(end_date, '%Y-%m-%d')
#                 entry_qs = entry_qs.filter(
#                     start_time__lte=datetime.combine(ed.date(), dt_time(23, 59, 59))
#                 )
#             except ValueError:
#                 pass
#         return entry_qs

#     # ── Helper: apply categorical filters on entry_qs ────────────────────────

#     def _apply_entry_categorical_filters(self, entry_qs, request):
#         """
#         Applies all categorical filters (client, team, sub_service, group, employee)
#         directly on a TaskTimeEntry queryset via task__ FK traversal.
#         Called by time_per_client, time_per_employee, time_per_employee_clients.
#         """
#         client_ids     = request.query_params.get('client_id')
#         team_ids       = request.query_params.get('team_id')
#         sub_ids        = request.query_params.get('sub_service_id')
#         group_ids      = request.query_params.get('client_group_id')
#         employee_names = request.query_params.get('employee_name')  # comma-separated full names

#         if client_ids:
#             entry_qs = entry_qs.filter(task__client_id__in=client_ids.split(','))
#         if team_ids:
#             entry_qs = entry_qs.filter(task__team_id__in=team_ids.split(','))
#         if sub_ids:
#             entry_qs = entry_qs.filter(task__sub_service_id__in=sub_ids.split(','))
#         if group_ids:
#             entry_qs = entry_qs.filter(
#                 task__client__client_groups_membership__id__in=group_ids.split(',')
#             )
#         if employee_names:
#             # Each name is "First Last" — build OR query across all selected names
#             name_q = Q()
#             for full_name in [n.strip() for n in employee_names.split(',') if n.strip()]:
#                 parts      = full_name.split(' ', 1)
#                 first_name = parts[0]
#                 last_name  = parts[1] if len(parts) > 1 else ''
#                 name_q |= Q(
#                     employee__first_name__iexact=first_name,
#                     employee__last_name__iexact=last_name,
#                 )
#             entry_qs = entry_qs.filter(name_q)

#         return entry_qs

#     # ── Helper: base entry queryset scoped to allowed tasks ──────────────────

#     def _base_entry_qs(self, user):
#         allowed_task_ids = self._get_allowed_task_ids(user)
#         qs = TaskTimeEntry.objects.filter(
#             start_time__isnull=False,
#             end_time__isnull=False,
#         )
#         if allowed_task_ids is not None:
#             qs = qs.filter(task_id__in=allowed_task_ids)
#         return qs

#     # ── time_per_client ───────────────────────────────────────────────────────

#     @action(detail=False, methods=['get'], url_path='time_per_client')
#     def time_per_client(self, request):
#         try:
#             from django.db.models import Sum, F, ExpressionWrapper, DurationField

#             entry_qs = self._base_entry_qs(request.user)
#             entry_qs = self._apply_entry_date_filter(
#                 entry_qs,
#                 request.query_params.get('start_date'),
#                 request.query_params.get('end_date'),
#             )
#             entry_qs = self._apply_entry_categorical_filters(entry_qs, request)

#             entries = (
#                 entry_qs
#                 .values(
#                     client_id=F('task__client__id'),
#                     client_name=F('task__client__name'),
#                 )
#                 .annotate(
#                     total_seconds=Sum(
#                         ExpressionWrapper(
#                             F('end_time') - F('start_time'),
#                             output_field=DurationField()
#                         )
#                     )
#                 )
#                 .order_by('-total_seconds')
#             )

#             data = [
#                 {
#                     'client_id':      e['client_id'],
#                     'client_name':    e['client_name'] or 'N/A',
#                     'total_hours_ms': int(e['total_seconds'].total_seconds() * 1000),
#                 }
#                 for e in entries
#                 if e['total_seconds'] and e['total_seconds'].total_seconds() > 0
#             ]
#             return Response(data)

#         except Exception as e:
#             import traceback; traceback.print_exc()
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # ── time_per_employee ─────────────────────────────────────────────────────

#     @action(detail=False, methods=['get'], url_path='time_per_employee')
#     def time_per_employee(self, request):
#         try:
#             from django.db.models import Sum, F, ExpressionWrapper, DurationField, CharField, Value
#             from django.db.models.functions import Concat

#             entry_qs = self._base_entry_qs(request.user)
#             entry_qs = self._apply_entry_date_filter(
#                 entry_qs,
#                 request.query_params.get('start_date'),
#                 request.query_params.get('end_date'),
#             )
#             entry_qs = self._apply_entry_categorical_filters(entry_qs, request)

#             entries = (
#                 entry_qs
#                 .annotate(
#                     full_name=Concat(
#                         F('employee__first_name'),
#                         Value(' '),
#                         F('employee__last_name'),
#                         output_field=CharField()
#                     ),
#                     team_label=F('employee__employee__department'),
#                 )
#                 .values('full_name', 'team_label')
#                 .annotate(
#                     total_seconds=Sum(
#                         ExpressionWrapper(
#                             F('end_time') - F('start_time'),
#                             output_field=DurationField()
#                         )
#                     )
#                 )
#                 .order_by('-total_seconds')
#             )

#             data = [
#                 {
#                     'name':           e['full_name'] or 'N/A',
#                     'team_name':      e['team_label'] or '—',
#                     'total_hours_ms': int(e['total_seconds'].total_seconds() * 1000),
#                 }
#                 for e in entries
#                 if e['total_seconds'] and e['total_seconds'].total_seconds() > 0
#             ]
#             return Response(data)

#         except Exception as e:
#             import traceback; traceback.print_exc()
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # ── time_per_employee_clients ─────────────────────────────────────────────

#     @action(detail=False, methods=['get'], url_path='time_per_employee_clients')
#     def time_per_employee_clients(self, request):
#         try:
#             from django.db.models import Sum, F, ExpressionWrapper, DurationField

#             employee_name = request.query_params.get('employee_name', '').strip()
#             if not employee_name:
#                 return Response({'error': 'employee_name is required'}, status=400)

#             # When called from the employee modal, employee_name is a single full name.
#             # Strip any comma-separated extras and use just the first name provided.
#             single_name = employee_name.split(',')[0].strip()
#             parts      = single_name.split(' ', 1)
#             first_name = parts[0]
#             last_name  = parts[1] if len(parts) > 1 else ''

#             entry_qs = self._base_entry_qs(request.user).filter(
#                 employee__first_name__iexact=first_name,
#                 employee__last_name__iexact=last_name,
#             )
#             entry_qs = self._apply_entry_date_filter(
#                 entry_qs,
#                 request.query_params.get('start_date'),
#                 request.query_params.get('end_date'),
#             )
#             # Apply other categorical filters but skip employee_name
#             # (already filtered above by exact first/last match)
#             client_ids = request.query_params.get('client_id')
#             team_ids   = request.query_params.get('team_id')
#             sub_ids    = request.query_params.get('sub_service_id')
#             group_ids  = request.query_params.get('client_group_id')
#             if client_ids:
#                 entry_qs = entry_qs.filter(task__client_id__in=client_ids.split(','))
#             if team_ids:
#                 entry_qs = entry_qs.filter(task__team_id__in=team_ids.split(','))
#             if sub_ids:
#                 entry_qs = entry_qs.filter(task__sub_service_id__in=sub_ids.split(','))
#             if group_ids:
#                 entry_qs = entry_qs.filter(
#                     task__client__client_groups_membership__id__in=group_ids.split(',')
#                 )

#             entries = (
#                 entry_qs
#                 .values(
#                     client_id=F('task__client__id'),
#                     client_name=F('task__client__name'),
#                 )
#                 .annotate(
#                     total_seconds=Sum(
#                         ExpressionWrapper(
#                             F('end_time') - F('start_time'),
#                             output_field=DurationField()
#                         )
#                     )
#                 )
#                 .order_by('-total_seconds')
#             )

#             data = [
#                 {
#                     'client_id':      e['client_id'],
#                     'client_name':    e['client_name'] or 'N/A',
#                     'total_hours_ms': int(e['total_seconds'].total_seconds() * 1000),
#                 }
#                 for e in entries
#                 if e['total_seconds'] and e['total_seconds'].total_seconds() > 0
#             ]
#             return Response(data)

#         except Exception as e:
#             import traceback; traceback.print_exc()
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # ── client_task_summary ───────────────────────────────────────────────────

#     @action(detail=False, methods=['get'], url_path='client_task_summary')
#     def client_task_summary(self, request):
#         try:
#             from django.db.models import Sum, F, ExpressionWrapper, DurationField, CharField, Value
#             from django.db.models.functions import Concat

#             client_id = request.query_params.get('client_id')
#             if not client_id:
#                 return Response({'error': 'client_id is required'}, status=400)

#             start_date = request.query_params.get('start_date')
#             end_date   = request.query_params.get('end_date')

#             # Task scope for done_count
#             allowed_task_ids = self._get_allowed_task_ids(request.user)
#             if allowed_task_ids is not None:
#                 task_qs = Task.objects.filter(id__in=allowed_task_ids, client_id=client_id)
#             else:
#                 task_qs = Task.objects.filter(client_id=client_id)

#             done_count = task_qs.filter(status='Done').count()

#             # Time entries scoped to this client
#             entry_qs = self._base_entry_qs(request.user).filter(task__client_id=client_id)
#             entry_qs = self._apply_entry_date_filter(entry_qs, start_date, end_date)

#             # Categorical filters except client_id (already set above)
#             team_ids       = request.query_params.get('team_id')
#             sub_ids        = request.query_params.get('sub_service_id')
#             group_ids      = request.query_params.get('client_group_id')
#             employee_names = request.query_params.get('employee_name')

#             if team_ids:
#                 entry_qs = entry_qs.filter(task__team_id__in=team_ids.split(','))
#             if sub_ids:
#                 entry_qs = entry_qs.filter(task__sub_service_id__in=sub_ids.split(','))
#             if group_ids:
#                 entry_qs = entry_qs.filter(
#                     task__client__client_groups_membership__id__in=group_ids.split(',')
#                 )
#             if employee_names:
#                 name_q = Q()
#                 for full_name in [n.strip() for n in employee_names.split(',') if n.strip()]:
#                     parts = full_name.split(' ', 1)
#                     name_q |= Q(
#                         employee__first_name__iexact=parts[0],
#                         employee__last_name__iexact=parts[1] if len(parts) > 1 else '',
#                     )
#                 entry_qs = entry_qs.filter(name_q)

#             dur_expr = ExpressionWrapper(
#                 F('end_time') - F('start_time'),
#                 output_field=DurationField()
#             )

#             te_qs = entry_qs.annotate(
#                 employee_full_name=Concat(
#                     F('employee__first_name'),
#                     Value(' '),
#                     F('employee__last_name'),
#                     output_field=CharField()
#                 ),
#                 svc_name=F('task__sub_service__name'),
#                 dur=dur_expr,
#             )

#             total    = te_qs.aggregate(total=Sum('dur'))
#             total_ms = int(total['total'].total_seconds() * 1000) if total['total'] else 0

#             emp_rows = (
#                 te_qs.values('employee_full_name')
#                 .annotate(ms=Sum('dur'))
#                 .order_by('-ms')
#             )
#             svc_rows = (
#                 te_qs.values('svc_name')
#                 .annotate(ms=Sum('dur'))
#                 .order_by('-ms')
#             )
#             cross_rows = (
#                 te_qs.values('employee_full_name', 'svc_name')
#                 .annotate(ms=Sum('dur'))
#                 .order_by('employee_full_name', '-ms')
#             )

#             per_employee_services = {}
#             per_service_employees = {}
#             for row in cross_rows:
#                 emp = row['employee_full_name'] or 'N/A'
#                 svc = row['svc_name'] or 'N/A'
#                 ms  = int(row['ms'].total_seconds() * 1000) if row['ms'] else 0
#                 if ms <= 0:
#                     continue
#                 per_employee_services.setdefault(emp, []).append({'name': svc, 'ms': ms})
#                 per_service_employees.setdefault(svc, []).append({'name': emp, 'ms': ms})

#             for emp in per_employee_services:
#                 per_employee_services[emp].sort(key=lambda x: -x['ms'])
#             for svc in per_service_employees:
#                 per_service_employees[svc].sort(key=lambda x: -x['ms'])

#             def to_ms(val):
#                 return int(val.total_seconds() * 1000) if val else 0

#             return Response({
#                 'done_count':     done_count,
#                 'total_hours_ms': total_ms,
#                 'employees': [
#                     {'name': e['employee_full_name'] or 'N/A', 'ms': to_ms(e['ms'])}
#                     for e in emp_rows if e['ms']
#                 ],
#                 'sub_services': [
#                     {'name': s['svc_name'] or 'N/A', 'ms': to_ms(s['ms'])}
#                     for s in svc_rows if s['ms']
#                 ],
#                 'per_employee_services': per_employee_services,
#                 'per_service_employees': per_service_employees,
#             })

#         except Exception as e:
#             import traceback; traceback.print_exc()
#             return Response({'error': str(e)}, status=500)

#     # ── dashboard_summary ─────────────────────────────────────────────────────

#     @action(detail=False, methods=['get'], url_path='dashboard_summary')
#     def dashboard_summary(self, request):
#         try:
#             from django.db.models import Count, Case, When, IntegerField

#             today = date.today()

#             allowed_task_ids = self._get_allowed_task_ids(request.user)
#             if allowed_task_ids is None:
#                 base_qs = Task.objects.all()
#             elif len(allowed_task_ids) == 0:
#                 base_qs = Task.objects.none()
#             else:
#                 base_qs = Task.objects.filter(id__in=allowed_task_ids)

#             # Categorical task-level filters
#             client_ids = request.query_params.get('client_id')
#             team_ids   = request.query_params.get('team_id')
#             sub_ids    = request.query_params.get('sub_service_id')
#             group_ids  = request.query_params.get('client_group_id')

#             if client_ids:
#                 base_qs = base_qs.filter(client_id__in=client_ids.split(','))
#             if team_ids:
#                 base_qs = base_qs.filter(team_id__in=team_ids.split(','))
#             if sub_ids:
#                 base_qs = base_qs.filter(sub_service_id__in=sub_ids.split(','))
#             if group_ids:
#                 base_qs = base_qs.filter(
#                     client__client_groups_membership__id__in=group_ids.split(',')
#                 )

#             # Employee filter — narrow tasks to those that have time entries
#             # logged by the selected employee(s) in the selected date range
#             employee_names = request.query_params.get('employee_name')
#             if employee_names:
#                 name_q = Q()
#                 for full_name in [n.strip() for n in employee_names.split(',') if n.strip()]:
#                     parts = full_name.split(' ', 1)
#                     name_q |= Q(
#                         time_entries__employee__first_name__iexact=parts[0],
#                         time_entries__employee__last_name__iexact=parts[1] if len(parts) > 1 else '',
#                     )
#                 base_qs = base_qs.filter(name_q).distinct()

#             # Date filter on task due_date (stat cards count tasks, not time entries)
#             start_date = request.query_params.get('start_date')
#             end_date   = request.query_params.get('end_date')
#             if start_date:
#                 base_qs = base_qs.filter(due_date__gte=start_date)
#             if end_date:
#                 base_qs = base_qs.filter(due_date__lte=end_date)

#             counts = base_qs.aggregate(
#                 todo=Count(Case(
#                     When(status='To Do', due_date__gte=today, then=1),  # exclude overdue
#                     output_field=IntegerField(),
#                 )),
#                 in_progress=Count(Case(
#                     When(status='In Progress', due_date__gte=today, then=1),  # exclude overdue
#                     output_field=IntegerField(),
#                 )),
#                 done=Count(Case(
#                     When(status='Done', then=1),
#                     output_field=IntegerField(),
#                 )),
#                 overdue=Count(Case(
#                     When(~Q(status='Done'), due_date__lt=today, then=1),
#                     output_field=IntegerField(),
#                 )),
#                 total=Count('id'),
#             )

#             # Upcoming tasks window
#             if start_date or end_date:
#                 upcoming_qs = base_qs.filter(~Q(status='Done'))
#             else:
#                 fystart_year = today.year if today.month >= 4 else today.year - 1
#                 fy_start     = date(fystart_year, 4, 1)
#                 in7          = today + timedelta(days=7)
#                 upcoming_qs  = base_qs.filter(~Q(status='Done')).filter(
#                     Q(due_date__lt=today, due_date__gte=fy_start) |
#                     Q(due_date__gte=today, due_date__lte=in7)
#                 )

#             upcoming_qs = upcoming_qs.select_related(
#                 'client', 'sub_service',
#             ).only(
#                 'id', 'task_id', 'status', 'due_date',
#                 'client__id', 'client__name',
#                 'sub_service__id', 'sub_service__name',
#             ).order_by('due_date')

#             tasks_data = [
#                 {
#                     'id':               t.id,
#                     'task_id':          t.task_id,
#                     'status':           t.status,
#                     'due_date':         str(t.due_date) if t.due_date else None,
#                     'client':           t.client_id,
#                     'client_name':      t.client.name  if t.client      else None,
#                     'sub_service':      t.sub_service_id,
#                     'sub_service_name': t.sub_service.name if t.sub_service else None,
#                 }
#                 for t in upcoming_qs
#             ]

#             return Response({
#                 'status_counts': {
#                     'To Do':       counts['todo'],
#                     'In Progress': counts['in_progress'],
#                     'Done':        counts['done'],
#                     'Over Due':    counts['overdue'],
#                     'total':       counts['total'],
#                 },
#                 'tasks': tasks_data,
#             })

#         except Exception as e:
#             import traceback; traceback.print_exc()
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#     @action(detail=False, methods=['get'], url_path='dashboard_data')
#     def dashboard_data(self, request):
#         try:
#             start_date_str       = request.query_params.get('start_date')
#             end_date_str         = request.query_params.get('end_date')
#             client_ids_str       = request.query_params.get('client_id')
#             team_ids_str         = request.query_params.get('team_id')
#             client_group_ids_str = request.query_params.get('client_group_id')
#             sub_service_ids_str  = request.query_params.get('sub_service_id')

#             user = request.user
#             role = (getattr(user, 'role', '') or '').lower()

#             # ── Build base queryset WITHOUT inheriting get_queryset() prefetches ──
#             # This avoids the duplicate Prefetch('time_entries') conflict
#             if role in ('admin', 'founder'):
#                 base_qs = Task.objects.all()
#             else:
#                 # Replicate role scoping without prefetches
#                 employee = Employee.objects.filter(user=user).first()
#                 if not employee or not employee.department:
#                     base_qs = Task.objects.none()
#                 else:
#                     dept_q = Q()
#                     for d in [x.strip() for x in employee.department.split(',') if x.strip()]:
#                         dept_q |= Q(team__name__iexact=d)

#                     spoc = SPOC.objects.filter(
#                         Q(email__iexact=user.email) |
#                         Q(name__iexact=user.get_full_name())
#                     ).first()
#                     spoc_q = Q(spoc=spoc) if spoc else Q()

#                     base_qs = Task.objects.filter(
#                         dept_q | spoc_q |
#                         Q(created_by=user) |
#                         Q(assignments__user=user, assignments__is_active=True) |
#                         Q(time_entries__employee=user)
#                     ).distinct()

#             # ── Apply fresh prefetches — no conflict ──────────────────────────────
#             tasks_queryset = base_qs.select_related(
#                 'client', 'team', 'sub_service', 'spoc', 'created_by',
#             ).prefetch_related(
#                 Prefetch(
#                     'time_entries',
#                     queryset=TaskTimeEntry.objects.only(
#                         'id', 'task_id', 'employee_id',
#                         'start_time', 'end_time', 'employee__first_name',
#                         'employee__last_name',
#                     ).select_related('employee'),
#                 ),
#                 Prefetch(
#                     'assignments',
#                     queryset=TaskAssignment.objects.filter(
#                         is_active=True
#                     ).select_related('user').only(
#                         'id', 'task_id', 'user_id', 'is_active',
#                         'user__first_name', 'user__last_name', 'user__email',
#                     ),
#                 ),
#                 'client__client_groups_membership',
#             )

#             # ── Apply URL filters ─────────────────────────────────────────────────
#             if start_date_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     due_date__gte=parse_date(start_date_str)
#                 )
#             if end_date_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     due_date__lte=parse_date(end_date_str)
#                 )
#             if client_ids_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     client__id__in=[int(i) for i in client_ids_str.split(',')]
#                 )
#             if team_ids_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     team__id__in=[int(i) for i in team_ids_str.split(',')]
#                 )
#             if client_group_ids_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     client__client_groups_membership__id__in=[
#                         int(i) for i in client_group_ids_str.split(',')
#                     ]
#                 )
#             if sub_service_ids_str:
#                 tasks_queryset = tasks_queryset.filter(
#                     sub_service__id__in=[int(i) for i in sub_service_ids_str.split(',')]
#                 )

#             # ── Evaluate once ─────────────────────────────────────────────────────
#             all_tasks = list(tasks_queryset.distinct())
#             today     = date.today()

#             # ── Status counts — pure Python ────────────────────────────────────────
#             todo = inprogress = done = overdue = 0
#             for t in all_tasks:
#                 if t.status == 'Done':
#                     done += 1
#                 elif t.due_date and t.due_date < today:
#                     overdue += 1
#                 elif t.status == 'To Do':
#                     todo += 1
#                 elif t.status == 'In Progress':
#                     inprogress += 1

#             status_dict = {
#                 'To Do':       todo,
#                 'In Progress': inprogress,
#                 'Done':        done,
#                 'Over Due':    overdue,
#             }

#             # ── Serialize ──────────────────────────────────────────────────────────
#             tasks_data = TaskListSerializer(
#                 all_tasks,
#                 many=True,
#                 context={'request': request},
#             ).data

#             return Response({
#                 'status_counts': status_dict,
#                 'tasks':         tasks_data,
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             import traceback
#             traceback.print_exc()
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )

#     # ── assign_multiple ───────────────────────────────────────────────────────

#     @action(detail=True, methods=['post'])
#     def assign_multiple(self, request, pk=None):
#         task = self.get_object()
#         user = request.user
#         role = (user.role or '').lower()

#         if role not in ASSIGN_ROLES:
#             return Response({'detail': 'Not allowed'}, status=403)

#         user_ids = request.data.get('user_ids', [])
#         if not isinstance(user_ids, list):
#             return Response({'detail': 'user_ids must be a list'}, status=400)

#         existing          = TaskAssignment.objects.filter(task=task, is_active=True)
#         existing_user_ids = set(existing.values_list('user_id', flat=True))
#         incoming_user_ids = set(map(int, user_ids))

#         # Unassign
#         to_remove = existing_user_ids - incoming_user_ids
#         if to_remove:
#             TaskAssignment.objects.filter(
#                 task=task, user_id__in=to_remove, is_active=True
#             ).update(is_active=False)
#             for uid in to_remove:
#                 TaskAssignmentHistory.objects.create(
#                     task=task,
#                     assigned_from_id=uid,
#                     assigned_to_id=None,
#                     assigned_by=user,
#                 )

#         # Assign / re-activate
#         to_add = incoming_user_ids - existing_user_ids
#         for uid in to_add:
#             assignment, created = TaskAssignment.objects.get_or_create(
#                 task=task, user_id=uid,
#                 defaults={'assigned_by': user, 'is_active': True},
#             )
#             if not created and not assignment.is_active:
#                 assignment.is_active   = True
#                 assignment.assigned_by = user
#                 assignment.save(update_fields=['is_active', 'assigned_by'])

#             TaskAssignmentHistory.objects.create(
#                 task=task,
#                 assigned_from=None,
#                 assigned_to_id=uid,
#                 assigned_by=user,
#             )

#         return Response({'message': 'Assignments updated successfully'})

#     # ── assign ────────────────────────────────────────────────────────────────

#     @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
#     def assign(self, request, pk=None):
#         task = self.get_object()
#         user = request.user
#         role = (user.role or '').lower()

#         if role not in ASSIGN_ROLES:
#             return Response(
#                 {'detail': 'You are not allowed to assign tasks'},
#                 status=status.HTTP_403_FORBIDDEN,
#             )

#         assigned_to_id = request.data.get('assigned_to')
#         if not assigned_to_id:
#             return Response(
#                 {'detail': 'assigned_to is required'},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         old_assignee         = task.assigned_to
#         task.assigned_to_id  = assigned_to_id
#         task.assigned_at     = timezone.now()
#         task.save(update_fields=['assigned_to', 'assigned_at'])

#         TaskAssignmentHistory.objects.create(
#             task=task,
#             assigned_from=old_assignee,
#             assigned_to_id=assigned_to_id,
#             assigned_by=user,
#         )

#         return Response({'message': 'Task reassigned successfully'})

#     # ── add_time_entry ────────────────────────────────────────────────────────

#     @action(detail=True, methods=['post'])
#     def add_time_entry(self, request, pk=None):
#         task = self.get_object()

#         if task.status == 'Done':
#             return Response(
#                 {'detail': 'Cannot add time to a completed task.'},
#                 status=400,
#             )

#         serializer = TaskTimeEntrySerializer(
#             data=request.data,
#             context={'request': request},
#         )
#         if serializer.is_valid():
#             serializer.save(task=task, employee=request.user)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     # ── download_file ─────────────────────────────────────────────────────────

#     @action(
#         detail=True, methods=['get'], url_path='download-file',
#         authentication_classes=[SessionAuthentication, TokenAuthentication],
#         permission_classes=[IsAuthenticated],
#     )
#     def download_file(self, request, pk=None):
#         task = self.get_object()
#         if not task.file:
#             return Response(
#                 {'error': 'No related file found'},
#                 status=status.HTTP_404_NOT_FOUND,
#             )
#         file_handle = task.file.open('rb')
#         return FileResponse(
#             file_handle,
#             as_attachment=True,
#             filename=task.file.name.split('/')[-1],
#         )
    
#     def get_period_label(self, service_period, due_date, custom_label=None):
#         if custom_label and custom_label.strip():
#             return custom_label.strip()

#         if not due_date:
#             return service_period or 'Unknown'

#         end = due_date - relativedelta(months=1)

#         if service_period == 'Monthly':
#             return end.strftime('%b-%Y')

#         if service_period == 'Quarterly':
#             start = end - relativedelta(months=2) + relativedelta(day=1)
#             return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"

#         if service_period == 'Half-Yearly':
#             start = end - relativedelta(months=5) + relativedelta(day=1)
#             return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"

#         if service_period == 'Annually':
#             start = end - relativedelta(months=11) + relativedelta(day=1)
#             return f"{start.strftime('%b-%Y')} to {end.strftime('%b-%Y')}"

#         return end.strftime('%b-%Y')

#     @action(detail=False, methods=['post'])
#     def create_monthly_tasks(self, request):
#         try:
#             with transaction.atomic():
#                 today              = date.today()
#                 created_count      = 0
#                 next_serial_number = get_next_task_id_serial_number(today)

#                 services = ClientGroupService.objects.filter(
#                     is_active=True
#                 ).select_related(
#                     'client_group', 'client', 'main_service', 'sub_service'
#                 )

#                 def months_ahead(month, year):
#                     """How many months from today is (month, year). 0 = current month."""
#                     return (year - today.year) * 12 + (month - today.month)

#                 def nearest_due(due_months):
#                     """
#                     From a list of recurring due months, return (month, year) of the
#                     nearest occurrence that is >= today's month.
#                     """
#                     best = None
#                     best_diff = None
#                     for dm in due_months:
#                         y    = today.year if dm >= today.month else today.year + 1
#                         diff = months_ahead(dm, y)
#                         if best_diff is None or diff < best_diff:
#                             best      = (dm, y)
#                             best_diff = diff
#                     return best, best_diff

#                 for service in services:
#                     if not service.due_date:
#                         continue

#                     due_month = service.due_date.month
#                     due_day   = service.due_date.day
#                     task_due_date = None

#                     if service.period == 'Monthly':
#                         # Only current month
#                         last_day      = calendar.monthrange(today.year, today.month)[1]
#                         task_due_date = date(today.year, today.month, min(due_day, last_day))

#                     elif service.period == 'Quarterly':
#                         # All 4 recurring due months; pick the nearest one
#                         # that falls within the current quarter window (0–2 months ahead)
#                         due_months = [(due_month + i * 3 - 1) % 12 + 1 for i in range(4)]
#                         (dm, y), diff = nearest_due(due_months)
#                         if dm and 0 <= diff <= 2:
#                         # if 0 <= diff <= 2:   # within current quarter
#                             last_day      = calendar.monthrange(y, dm)[1]
#                             task_due_date = date(y, dm, min(due_day, last_day))

#                     elif service.period == 'Half-Yearly':
#                         # 2 recurring due months; pick nearest within 6 months
#                         due_months = [due_month, (due_month + 6 - 1) % 12 + 1]
#                         (dm, y), diff = nearest_due(due_months)
#                         # if 0 <= diff <= 6:
#                         if dm and 0 <= diff <= 6:   # within current half-year
#                             last_day      = calendar.monthrange(y, dm)[1]
#                             task_due_date = date(y, dm, min(due_day, last_day))

#                     elif service.period == 'Annually':
#                         # Single annual due month; create if within next 6 months
#                         y    = today.year if due_month >= today.month else today.year + 1
#                         diff = months_ahead(due_month, y)
#                         if 0 <= diff <= 6:
#                             last_day      = calendar.monthrange(y, due_month)[1]
#                             task_due_date = date(y, due_month, min(due_day, last_day))

#                     if task_due_date is None:
#                         continue

#                     # period_label = self.get_period_label(service.period, task_due_date)

#                     period_label = self.get_period_label(
#                         service.period,
#                         task_due_date,
#                         service.period_label or service.sub_service.period_label,
#                     )

#                     # Skip if task already exists for this client + sub_service + period
#                     if Task.objects.filter(
#                         client=service.client,
#                         sub_service=service.sub_service,
#                         period=period_label,
#                     ).exists():
#                         continue

#                     team_instance = service.main_service.team
#                     spoc_instance = service.client_group.primary_spoc
#                     if not team_instance or not spoc_instance:
#                         continue

#                     task = Task.objects.create(
#                         client=service.client,
#                         sub_service=service.sub_service,
#                         spoc=spoc_instance,
#                         team=team_instance,
#                         status='To Do',
#                         period=period_label,
#                         due_date=task_due_date,
#                         created_by=None,
#                     )

#                     financial_year = get_financial_year(today)
#                     task.task_id   = f'CKPSCA-STT-{next_serial_number:04d}-{financial_year}'
#                     task.save(update_fields=['task_id'])

#                     next_serial_number += 1
#                     created_count      += 1

#             if created_count > 0:
#                 return Response(
#                     {'message': f'Successfully created {created_count} new tasks.'},
#                     status=status.HTTP_201_CREATED,
#                 )
#             return Response(
#                 {'message': 'No new tasks were created (they may already exist).'},
#                 status=status.HTTP_200_OK,
#             )

#         # except Exception as e:
#         #     return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#         except Exception as e:
#             import traceback
#             return Response({'error': str(e), 'detail': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#     # ── history ───────────────────────────────────────────────────────────────

#     @action(detail=True, methods=['get'])
#     def history(self, request, pk=None):
#         task    = self.get_object()
#         history = []

#         # 1. Created
#         history.append({
#             'type':    'created',
#             'user':    task.created_by.get_full_name() if task.created_by else 'System',
#             'time':    task.created_at,
#             'message': 'Task created',
#         })

#         # 2. Assignments
#         for h in TaskAssignmentHistory.objects.filter(task=task).order_by('assigned_at', 'id'):
#             actor = h.assigned_by.get_full_name() if h.assigned_by else 'System'
#             if h.assigned_to:
#                 history.append({
#                     'type':    'assigned',
#                     'user':    actor,
#                     'time':    h.assigned_at,
#                     'message': f'Assigned to {h.assigned_to.get_full_name()}',
#                 })
#             elif h.assigned_from:
#                 history.append({
#                     'type':    'unassigned',
#                     'user':    actor,
#                     'time':    h.assigned_at,
#                     'message': f'Unassigned {h.assigned_from.get_full_name()}',
#                 })

#         # 3. Time entries
#         for t in TaskTimeEntry.objects.filter(task=task).order_by('created_at'):
#             history.append({
#                 'type':       'time',
#                 'user':       t.employee.get_full_name(),
#                 'time':       t.created_at,
#                 'start_time': t.start_time,
#                 'end_time':   t.end_time,
#                 'message':    'Added time',
#             })

#         # 4. Marked done
#         if task.marked_done_at:
#             history.append({
#                 'type':    'done',
#                 'user':    task.marked_done_by.get_full_name() if task.marked_done_by else 'System',
#                 'time':    task.marked_done_at,
#                 'message': 'Marked as Done',
#             })

#         # 5. Sort and remove None times
#         history = [h for h in history if h.get('time') is not None]
#         history.sort(key=lambda x: x['time'])

#         return Response(history)

    

#     def perform_create(self, serializer):
#         user = self.request.user
#         role = (getattr(user, 'role', '') or '').lower()

#         with transaction.atomic():                                    # ← owns the lock scope
#             next_serial    = get_next_task_id_serial_number(date.today())
#             financial_year = get_financial_year(date.today())
#             task_id        = f'CKPSCA-STT-{next_serial:04d}-{financial_year}'

#             task = serializer.save(created_by=user, task_id=task_id)

#             assigned_users = self.request.data.getlist('assigned_users')
#             if role in ASSIGN_ROLES and assigned_users:
#                 for uid in assigned_users:
#                     TaskAssignment.objects.create(
#                         task=task, user_id=uid,
#                         is_active=True, assigned_by=user,
#                     )
#                     TaskAssignmentHistory.objects.create(
#                         task=task, assigned_from=None,
#                         assigned_to_id=uid, assigned_by=user,
#                     )

#     # ── update ────────────────────────────────────────────────────────────────

#     def update(self, request, *args, **kwargs):
#         partial  = kwargs.pop('partial', False)
#         instance = self.get_object()
#         data     = request.data.copy()

#         raw = data.pop('assigned_employees_data', None)
#         assigned_employees_data = []

#         if raw:
#             if isinstance(raw, list) and len(raw) == 1:
#                 raw = raw[0]
#             if isinstance(raw, str):
#                 try:
#                     assigned_employees_data = json.loads(raw)
#                 except Exception:
#                     assigned_employees_data = []
#             elif isinstance(raw, list):
#                 assigned_employees_data = raw

#         for emp in assigned_employees_data:
#             employee_user = request.user
#             if not employee_user.is_authenticated:
#                 continue

#             for entry in emp.get('time_entries', []):
#                 start_time = entry.get('start_time')
#                 end_time   = entry.get('end_time')
#                 notes      = entry.get('notes', '')

#                 if not start_time or not end_time:
#                     continue

#                 start_dt = parse_datetime(str(start_time))
#                 end_dt   = parse_datetime(str(end_time))

#                 if not start_dt or not end_dt:
#                     return Response(
#                         {'detail': 'Invalid datetime format.'},
#                         status=status.HTTP_400_BAD_REQUEST,
#                     )

#                 if timezone.is_naive(start_dt):
#                     start_dt = timezone.make_aware(start_dt)
#                 if timezone.is_naive(end_dt):
#                     end_dt = timezone.make_aware(end_dt)

#                 if end_dt <= start_dt:
#                     return Response(
#                         {'detail': 'End time must be after start time.'},
#                         status=status.HTTP_400_BAD_REQUEST,
#                     )

#                 if check_time_overlap(
#                     employee_user, start_dt, end_dt,
#                     instance=None, entry_type='task'
#                 ):
#                     return Response(
#                         {'detail': 'Time entry overlaps with an existing entry.'},
#                         status=status.HTTP_400_BAD_REQUEST,
#                     )

#                 try:
#                     TaskTimeEntry.objects.create(
#                         task=instance,
#                         employee=employee_user,
#                         start_time=start_dt,
#                         end_time=end_dt,
#                         notes=notes,
#                     )
#                 except ValidationError as e:
#                     return Response(
#                         {'error': e.message_dict or e.messages},
#                         status=status.HTTP_400_BAD_REQUEST,
#                     )

#         serializer = self.get_serializer(instance, data=data, partial=partial)
#         serializer.is_valid(raise_exception=True)
#         self.perform_update(serializer)

#         from django.db.models import Sum
#         total_hours = (
#             instance.time_entries
#             .exclude(duration__isnull=True)
#             .aggregate(total=Sum('duration'))['total']
#         )
#         instance.total_hours = total_hours
#         instance.save(update_fields=['total_hours'])

#         return Response(self.get_serializer(instance).data)

# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.db.models import Prefetch
# from clients.models import Task  # adjust if needed
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.db.models import Q
# from .models import STTRecord, UDINRecord


# # clients/views.py
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.utils import timezone
# from datetime import datetime, time
# from .models import TaskTimeEntry, InternalTimeEntry
# from django.db.models.functions import TruncDate

# # clients/views.py
# from datetime import datetime, time
# from django.utils import timezone
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# import pytz

# from .models import TaskTimeEntry


# import pytz
# from datetime import datetime, time
# from django.db.models import Q
# from django.utils import timezone
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from .models import TaskTimeEntry
# from employee.models import Employee, Team  # Ensure Team is imported

# from datetime import datetime, time
# import pytz

# from django.db.models import Q
# from django.utils import timezone
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated

# from .models import TaskTimeEntry, InternalTimeEntry
# from employee.models import Employee, Team


# from django.utils import timezone
# from django.utils.dateparse import parse_datetime
# from django.db.models import Q
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
 
 
# class TaskTimeEntryEditView(APIView):
#     """
#     PATCH  /clients/task-time-entries/<pk>/   — edit start/end/notes
#     DELETE /clients/task-time-entries/<pk>/   — delete
 
#     Guards:
#       • Logged-in user must own the entry (entry.employee == request.user)
#       • Entry's start_time must be today (same calendar day, local time)
#       • Task must not be marked Done
#     """
#     permission_classes = [IsAuthenticated]
 
#     def _get_or_error(self, pk, user):
#         from .models import TaskTimeEntry
#         try:
#             entry = TaskTimeEntry.objects.select_related("task").get(pk=pk)
#         except TaskTimeEntry.DoesNotExist:
#             return None, Response({"detail": "Time entry not found."}, status=404)
 
#         if entry.employee_id != user.id:
#             return None, Response(
#                 {"detail": "You can only edit your own time entries."}, status=403
#             )
 
#         if timezone.localtime(entry.start_time).date() != timezone.localdate():
#             return None, Response(
#                 {"detail": "Time entries can only be edited on the day they were created."},
#                 status=403,
#             )
 
#         if entry.task.status == "Done":
#             return None, Response(
#                 {"detail": "Cannot edit time entries for a completed task."}, status=403
#             )
 
#         return entry, None
 
#     def patch(self, request, pk):
#         entry, err = self._get_or_error(pk, request.user)
#         if err:
#             return err
 
#         raw_start = request.data.get("start_time")
#         raw_end   = request.data.get("end_time")
#         notes     = request.data.get("notes", entry.notes)
 
#         if raw_start:
#             dt = parse_datetime(str(raw_start))
#             if not dt:
#                 return Response({"detail": "Invalid start_time."}, status=400)
#             entry.start_time = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
 
#         if raw_end:
#             dt = parse_datetime(str(raw_end))
#             if not dt:
#                 return Response({"detail": "Invalid end_time."}, status=400)
#             entry.end_time = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
 
#         if entry.end_time and entry.start_time:
#             if entry.end_time <= entry.start_time:
#                 return Response({"detail": "End time must be after start time."}, status=400)
#             if (entry.end_time - entry.start_time).total_seconds() / 3600 > 15:
#                 return Response({"detail": "Time entry cannot exceed 15 hours."}, status=400)
 
#         # Overlap check — exclude self, check both tables
#         from .models import TaskTimeEntry as TTE, InternalTimeEntry as ITE
 
#         if (
#             TTE.objects.filter(
#                 employee=request.user,
#                 start_time__lt=entry.end_time,
#                 end_time__gt=entry.start_time,
#             ).exclude(pk=entry.pk).exists()
#             or
#             ITE.objects.filter(
#                 employee=request.user,
#                 start_time__lt=entry.end_time,
#                 end_time__gt=entry.start_time,
#             ).exists()
#         ):
#             return Response({"detail": "Time entry overlaps with an existing entry."}, status=400)
 
#         entry.notes = notes
#         entry.save()
 
#         return Response({
#             "id":         entry.id,
#             "start_time": entry.start_time,
#             "end_time":   entry.end_time,
#             "notes":      entry.notes,
#         })
 
#     def delete(self, request, pk):
#         entry, err = self._get_or_error(pk, request.user)
#         if err:
#             return err
#         entry.delete()
#         return Response(status=204)
 
# import json
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from .models import Company, Invoice
# from .serializers import InvoiceSerializer, CompanySerializer

# @csrf_exempt
# def company_details_api(request):
#     # Retrieve company details (GET request)
#     if request.method == 'GET':
#         try:
#             # Assumes there is only one company profile
#             company = Company.objects.first()
#             if company:
#                 # Convert Django model instance to a dictionary
#                 data = {
#                     'companyName': company.companyName,
#                     'companytype': company.companytype,
#                     'natureOfBusiness': company.natureOfBusiness,
#                     'incorporationDate': company.incorporationDate,
#                     'stateOfRegistration': company.stateOfRegistration,
#                     'panNo': company.panNo,
#                     'gstNo': company.gstNo,
#                     'tanNo': company.tanNo,
#                     'cin': company.cin,
#                     'lutNo': company.lutNo,
#                     'lutDate': company.lutDate,
#                     'contactPerson': company.contactPerson,
#                     'contactEmail': company.contactEmail,
#                     'contactPhone': company.contactPhone,
#                     'address': company.address,
#                     'bankAccountNo': company.bankAccountNo,
#                     'ifscCode': company.ifscCode,
#                     'bankName': company.bankName,
#                     'bankAddress': company.bankAddress,
#                     'additionalBasicDetails': company.additionalBasicDetails,
#                     'additionalIdentificationDetails': company.additionalIdentificationDetails,
#                     'additionalContactDetails': company.additionalContactDetails,
#                     'additionalBankingDetails': company.additionalBankingDetails,
#                     'otherDetails': company.otherDetails,
#                     'sacDetails': company.sacDetails
#                 }
#                 return JsonResponse(data)
#             else:
#                 return JsonResponse({'message': 'No company details found'}, status=404)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     # Save or update company details (POST request)
#     elif request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             # Find the existing company or create a new one
#             company, created = Company.objects.get_or_create(id=1) # Using a fixed ID for a single-profile app
            
#             # Update the company object with the new data
#             for key, value in data.items():
#                 if key in ['incorporationDate', 'lutDate'] and value:
#                     # Convert date strings from frontend to Python date objects
#                     setattr(company, key, value)
#                 elif key in ['additionalBasicDetails', 'additionalIdentificationDetails', 'additionalContactDetails', 'additionalBankingDetails', 'otherDetails']:
#                     # Ensure dynamic fields are handled as JSON
#                     setattr(company, key, value)
#                 else:
#                     setattr(company, key, value)
            
#             company.save()
#             return JsonResponse({'message': 'Company details saved successfully', 'id': company.id}, status=200)

#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

#     return JsonResponse({'error': 'Method not allowed'}, status=405)

# from django.db.models import Sum, Count, Avg
# from rest_framework.decorators import action
# from rest_framework.response import Response

# from datetime import date

# def get_financial_year(instance=None):
#     """
#     Generates the current financial year in 'yy-yy' format.
#     Accepts an optional 'instance' argument to work as a callable in Django models.
#     """
#     today = date.today()
#     if today.month >= 4:
#         start_year = today.year % 100
#         end_year = (today.year + 1) % 100
#     else:
#         start_year = (today.year - 1) % 100
#         end_year = today.year % 100
#     return f"{start_year:02d}-{end_year:02d}"


# from django.db import transaction
# from django.utils.timezone import now



# from django.utils import timezone
# from rest_framework import generics
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status as drf_status
# from .serializers import SttRecordPickerSerializer, UdinPickerSerializer

# # And here is a simplified version if you are not using DRF's generics
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from .models import Invoice, InvoiceItem, RecurringInvoice
# from .serializers import InvoiceItemSerializer, RecurringInvoiceSerializer

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def invoice_item_list(request):
#     """
#     Returns a list of all invoice items.
#     """
#     invoice_items = InvoiceItem.objects.all()
#     serializer = InvoiceItemSerializer(invoice_items, many=True)
#     return Response(serializer.data)
# from decimal import Decimal


# from decimal import Decimal
# from django.utils import timezone
# from datetime import timedelta
# from rest_framework import viewsets, status
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.decorators import action
# from rest_framework.response import Response

# # ─────────────────────────────────────────────────────────────
# # COMPLETE UPDATED VIEWS — replace your entire views section
# # for the three Request ViewSets
# # ─────────────────────────────────────────────────────────────

# from rest_framework import viewsets, permissions
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from .models import ClientRequest, Client, ServiceRequest, GroupRequest, MainService, SubService
# from .serializers import (
#     ClientRequestSerializer, ClientSerializer,
#     ServiceRequestSerializer, GroupRequestSerializer,
# )


# # ── helper ────────────────────────────────────────────────────
# def _is_privileged(user):
#     """Returns True for Founder / Admin regardless of case."""
#     role = getattr(user, 'role', '') or ''
#     return role.lower() in ('founder', 'admin')









































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