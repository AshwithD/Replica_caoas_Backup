# # account/views.py
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import login, logout
# from .serializers import UserSerializer, LoginSerializer, RegisterSerializer
# from .models import User
# from django.http import JsonResponse
# from django.views.decorators.csrf import ensure_csrf_cookie
# from rest_framework.permissions import IsAuthenticated # Keep this import
# from django.utils import timezone
# from django.db import IntegrityError 
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.authentication import SessionAuthentication, BasicAuthentication # Often needed for IsAuthenticated
# from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
# from django.http import JsonResponse

# @csrf_exempt
# @ensure_csrf_cookie
# def csrf_token_view(request):
#     return JsonResponse({'message': 'CSRF cookie set'})

# class RegisterView(APIView):
#     authentication_classes = []
#     permission_classes = []
#     serializer_class = RegisterSerializer
#     queryset = User.objects.all()

#     def post(self, request):
#         # max_users = get_max_users()
#         max_users = 100

#         if max_users > 0:
#             current = User.objects.filter(is_active=True).count()
#             if current >= max_users:
#                 return Response({
#                     'message': f'User limit reached. Your license allows a maximum of {max_users} users. '
#                                     f'You currently have {current} accounts. '
#                                     f'Contact CAOAS Support team to upgrade your license.',
#                 }, status=status.HTTP_403_FORBIDDEN)
#         serializer = RegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             user = serializer.save()
#             return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def update_profile(request):
#     user = request.user
#     user.email = request.data.get('email', user.email)
#     if request.data.get('password'):
#         user.set_password(request.data['password'])
#     if request.FILES.get('profile_picture'):
#         user.profile_picture = request.FILES['profile_picture']
#     user.save()
#     return Response({'status': 'profile updated'})


# # account/views.py
# # from rest_framework.authtoken.models import Token # Add this import at the top

# # class LoginView(APIView):
# #     authentication_classes = []
# #     permission_classes = []

# #     def post(self, request):
# #         serializer = LoginSerializer(data=request.data)
# #         if serializer.is_valid():
# #             user = serializer.validated_data
# #             login(request, user) # This handles session-based login
# #             request.session.save()

# #             # --- ADD THIS PART: Generate and return token ---
# #             token, created = Token.objects.get_or_create(user=user)
# #             response_data = UserSerializer(user).data
# #             response_data['token'] = token.key # Add the token to the response
# #             # --- END ADDITION ---

# #             return Response(response_data)
# #         else:
# #             print(f"LoginView: Serializer errors: {serializer.errors}")
# #             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# from rest_framework.authtoken.models import Token
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import login
# from rest_framework.views import APIView
# from employee.models import Employee
# from datetime import date

# class LoginView(APIView):
#     authentication_classes = []
#     permission_classes = []

#     def post(self, request):
#         serializer = LoginSerializer(data=request.data)

#         if serializer.is_valid():
#             user = serializer.validated_data

#             # 🔍 Check employee inactive BEFORE login
#             try:
#                 emp = Employee.objects.get(user=user)
#                 if emp.status == "inactive":
#                     return Response(
#                         {"message": "Login disabled, Please contact Admin"},
#                         status=status.HTTP_403_FORBIDDEN
#                     )
#             except Employee.DoesNotExist:
#                 pass  # HR / Admin login without employee profile

#             # 👌 If employee is active → continue login
#             login(request, user)
#             request.session.save()

#             token, created = Token.objects.get_or_create(user=user)
#             response_data = UserSerializer(user).data
#             response_data["token"] = token.key

#             return Response(response_data, status=status.HTTP_200_OK)

#         # ❌ Invalid credentials
#         return Response(
#             {"message": "Invalid credentials."},
#             status=status.HTTP_400_BAD_REQUEST
#         )

    
# # from django.contrib.auth import get_user_model
# # User = get_user_model()
# # from django.contrib.auth.tokens import default_token_generator
# # from django.core.mail import send_mail
# # from django.conf import settings
# # from django.urls import reverse
# # from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
# # from django.utils.encoding import force_bytes, force_str
# # from rest_framework.views import APIView
# # from rest_framework.response import Response
# # from rest_framework import status
# # from rest_framework.permissions import AllowAny

# # class PasswordResetRequestView(APIView):
# #     permission_classes = [AllowAny]
# #     def post(self, request):
# #         email = request.data.get("email")
# #         if not email:
# #             return Response({"detail": "Email is required."}, status=400)

# #         try:
# #             user = User.objects.get(email=email)
# #             uid = urlsafe_base64_encode(force_bytes(user.pk))
# #             token = default_token_generator.make_token(user)
# #             reset_link = f"{settings.FRONTEND_URL}/reset-password-confirm?uid={uid}&token={token}"

# #             send_mail(
# #                 subject="Password Reset Request",
# #                 message=f"Click the link to reset your password: {reset_link}",
# #                 from_email=settings.DEFAULT_FROM_EMAIL,
# #                 recipient_list=[user.email],
# #             )

# #             return Response({"detail": "Password reset link sent to your email."})
# #         except User.DoesNotExist:
# #             return Response({"detail": "User with this email does not exist."}, status=404)


# # class PasswordResetConfirmView(APIView):
# #     permission_classes = [AllowAny]
# #     def post(self, request):
# #         uidb64 = request.data.get("uid")
# #         token = request.data.get("token")
# #         new_password = request.data.get("password")

# #         if not all([uidb64, token, new_password]):
# #             return Response({"detail": "Missing required fields."}, status=400)

# #         try:
# #             uid = force_str(urlsafe_base64_decode(uidb64))
# #             user = User.objects.get(pk=uid)
# #             if not default_token_generator.check_token(user, token):
# #                 return Response({"detail": "Invalid or expired token."}, status=400)

# #             user.set_password(new_password)
# #             user.save()
# #             return Response({"detail": "Password has been reset successfully."})
# #         except Exception as e:
# #             return Response({"detail": "Invalid reset request."}, status=400)


# from rest_framework.authentication import SessionAuthentication
# from rest_framework.permissions import AllowAny

# class CsrfExemptSessionAuthentication(SessionAuthentication):
#     def enforce_csrf(self, request):
#         return


# import random
# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags
# from django.conf import settings
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.utils import timezone
# from .models import PasswordResetOTP
# from django.contrib.auth import get_user_model

# User = get_user_model()

# def generate_otp():
#     return str(random.randint(100000, 999999))

# class SendResetOTPView(APIView):
#     authentication_classes = [CsrfExemptSessionAuthentication]
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")

#         if not email:
#             return Response({"detail": "Email is required"}, 400)

#         if not User.objects.filter(email=email).exists():
#             return Response(
#                 {"detail": "No user found with this email"},
#                 status=404
#             )

#         last_otp = PasswordResetOTP.objects.filter(email=email).order_by('-created_at').first()

#         if last_otp and not last_otp.can_resend():
#             seconds_left = PasswordResetOTP.RESEND_COOLDOWN_SECONDS - int(
#                 (timezone.now() - last_otp.created_at).total_seconds()
#             )
#             return Response(
#                 {"detail": "Please wait before resending OTP", "cooldown": seconds_left},
#                 status=429
#             )

#         PasswordResetOTP.objects.filter(email=email).delete()

#         otp = generate_otp()

#         PasswordResetOTP.objects.create(
#             email=email,
#             otp=otp,
#             attempts=0,
#             is_locked=False
#         )

#         send_mail(
#             "Your Password Reset OTP",
#             otp,
#             settings.DEFAULT_FROM_EMAIL,
#             [email],
#         )

#         return Response({"message": "OTP sent"}, 200)



# from django.db.models import F
# class VerifyResetOTPView(APIView):
#     authentication_classes = [CsrfExemptSessionAuthentication]
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")

#         record = PasswordResetOTP.objects.filter(email=email).first()

#         if not record:
#             return Response({"detail": "OTP not found"}, status=404)

#         # 🔓 Auto-unlock after time
#         if record.is_locked and record.is_unlock_time_reached():
#             record.is_locked = False
#             record.attempts = 0
#             record.locked_at = None
#             record.save(update_fields=["is_locked", "attempts", "locked_at"])

#         if record.is_locked:
#             unlock_at = record.unlock_time()
#             seconds_left = int((unlock_at - timezone.now()).total_seconds())

#             return Response(
#                 {
#                     "detail": "OTP locked",
#                     "unlock_in": seconds_left
#                 },
#                 status=403
#             )

#         if record.is_expired():
#             return Response({"detail": "OTP expired"}, status=400)

#         if record.otp != otp:
#             record.attempts += 1

#             if record.attempts >= record.MAX_ATTEMPTS:
#                 record.is_locked = True
#                 record.locked_at = timezone.now()

#             record.save(update_fields=["attempts", "is_locked", "locked_at"])

#             return Response(
#                 {
#                     "detail": "Invalid OTP",
#                     "attempts_left": record.attempts_left()
#                 },
#                 status=400
#             )

#         return Response({"detail": "OTP verified"}, status=200)




# class ResetPasswordWithOTPView(APIView):
#     authentication_classes = [CsrfExemptSessionAuthentication]
#     permission_classes = [AllowAny]

#     def post(self, request):
#         email = request.data.get("email")
#         otp = request.data.get("otp")
#         password = request.data.get("password")

#         record = PasswordResetOTP.objects.filter(email=email, otp=otp).order_by('-created_at').first()
#         if not record or record.is_expired():
#             return Response({"detail": "Invalid or expired OTP"}, status=400)

#         try:
#             user = User.objects.get(email=email)
#             user.set_password(password)
#             user.save()
#             # record.delete()
#             return Response({"detail": "Password reset successfully"}, status=200)
#         except User.DoesNotExist:
#             return Response({"detail": "User not found"}, status=404)


# class LogoutView(APIView):
#     # Logout usually requires authentication to know who to log out.
#     # If unauthenticated users should also be able to hit this, you'd add the lines below.
#     # authentication_classes = []
#     # permission_classes = []
#     def post(self, request):
#         logout(request)
#         return Response({"message": "Logged out successfully"})

# # class UserView(APIView):
# #     # --- RECOMMENDED CHANGE START ---
# #     # Enforce authentication at the permission level.
# #     # This means only authenticated users will reach the 'get' method.
# #     permission_classes = [IsAuthenticated]
# #     # You might also need to explicitly state authentication_classes if not globally configured
# #     # authentication_classes = [SessionAuthentication, BasicAuthentication] # Example, adjust as per your setup
# #     # --- RECOMMENDED CHANGE END ---

# #     def get(self, request):
# #         """
# #         Returns the details of the currently authenticated user.
# #         Since permission_classes is [IsAuthenticated], request.user will always be an authenticated User instance here.
# #         """
# #         serializer = UserSerializer(request.user)
# #         return Response(serializer.data)

# # In account/views.py or wherever UserView is located

# class UserView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             # 1. OPTIMIZATION: Fetch the user again WITH the employee data.
#             # This puts the employee data into the "prefetch cache".
#             user = User.objects.prefetch_related('employee').get(id=request.user.id)
            
#             # 2. Now the serializer will use the cache (0 extra DB queries)
#             serializer = UserSerializer(user, context={'request': request})
#             return Response(serializer.data)
            
#         except User.DoesNotExist:
#             return Response({"detail": "User not found"}, status=404)

# @api_view(['GET'])
# def user_roles(request):
#     roles = [ {"value": choice[0], "label": choice[1]} for choice in User._meta.get_field('role').choices ]
#     return Response(roles)


# # ─── ADD THESE AT THE BOTTOM OF account/views.py ─────────────────────────────

# class LogoutView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             request.user.auth_token.delete()
#         except Exception:
#             pass
#         logout(request)
#         return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# class UserView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         serializer = UserSerializer(request.user)
#         return Response(serializer.data)

#     def put(self, request):
#         user = request.user
#         user.email = request.data.get('email', user.email)
#         if request.data.get('password'):
#             user.set_password(request.data['password'])
#         if request.FILES.get('profile_picture'):
#             user.profile_picture = request.FILES['profile_picture']
#         user.save()
#         return Response(UserSerializer(user).data)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def user_roles(request):
#     user = request.user

#     # All available roles as array for dropdowns
#     all_roles = [
#         {'value': 'Admin',     'label': 'Admin'},
#         {'value': 'Founder',   'label': 'Founder'},
#         {'value': 'HR',        'label': 'HR'},
#         {'value': 'Manager',   'label': 'Manager'},
#         {'value': 'Team Lead', 'label': 'Team Lead'},
#         {'value': 'Employee',  'label': 'Employee'},
#         {'value': 'Intern',    'label': 'Intern'},
#     ]

#     return Response(all_roles)


# # ─── OTP PASSWORD RESET ───────────────────────────────────────────────────────
# import random
# import string
# from django.core.mail import send_mail
# from django.conf import settings as django_settings


# def generate_otp():
#     return ''.join(random.choices(string.digits, k=6))


# class SendResetOTPView(APIView):
#     authentication_classes = []
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get('email')

#         if not email:
#             return Response(
#                 {'message': 'Email is required.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             return Response(
#                 {'message': 'No account found with this email.'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         otp = generate_otp()

#         # Save OTP to database using existing PasswordResetOTP model
#         from .models import PasswordResetOTP
#         PasswordResetOTP.objects.filter(email=email).delete()  # Clear old OTPs
#         PasswordResetOTP.objects.create(email=email, otp=otp)

#         try:
#             send_mail(
#                 subject='Password Reset OTP',
#                 message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 5 minutes.',
#                 from_email=django_settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[email],
#                 fail_silently=False,
#             )
#         except Exception as e:
#             return Response(
#                 {'message': f'Failed to send OTP. Error: {str(e)}'},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#         return Response(
#             {'message': 'OTP sent to your email address.'},
#             status=status.HTTP_200_OK
#         )


# class VerifyResetOTPView(APIView):
#     authentication_classes = []
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get('email')
#         otp = request.data.get('otp')

#         if not email or not otp:
#             return Response(
#                 {'message': 'Email and OTP are required.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         from .models import PasswordResetOTP

#         try:
#             otp_record = PasswordResetOTP.objects.filter(email=email).latest('created_at')
#         except PasswordResetOTP.DoesNotExist:
#             return Response(
#                 {'message': 'OTP not found. Please request a new one.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Check if locked
#         if otp_record.is_locked:
#             if not otp_record.is_unlock_time_reached():
#                 return Response(
#                     {'message': 'Too many attempts. Please try again later.'},
#                     status=status.HTTP_429_TOO_MANY_REQUESTS
#                 )
#             else:
#                 otp_record.is_locked = False
#                 otp_record.attempts = 0
#                 otp_record.save()

#         # Check if expired
#         if otp_record.is_expired():
#             return Response(
#                 {'message': 'OTP has expired. Please request a new one.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Check OTP match
#         if otp_record.otp != otp:
#             otp_record.attempts += 1
#             if otp_record.attempts >= PasswordResetOTP.MAX_ATTEMPTS:
#                 otp_record.is_locked = True
#                 otp_record.locked_at = timezone.now()
#             otp_record.save()
#             return Response(
#                 {
#                     'message': 'Invalid OTP.',
#                     'attempts_left': otp_record.attempts_left()
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         return Response(
#             {'message': 'OTP verified successfully.'},
#             status=status.HTTP_200_OK
#         )


# class ResetPasswordWithOTPView(APIView):
#     authentication_classes = []
#     permission_classes = []

#     def post(self, request):
#         email = request.data.get('email')
#         otp = request.data.get('otp')
#         new_password = request.data.get('new_password')

#         if not email or not otp or not new_password:
#             return Response(
#                 {'message': 'Email, OTP and new password are required.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         from .models import PasswordResetOTP

#         try:
#             otp_record = PasswordResetOTP.objects.filter(email=email).latest('created_at')
#         except PasswordResetOTP.DoesNotExist:
#             return Response(
#                 {'message': 'OTP not found. Please request a new one.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Validate OTP again
#         if otp_record.is_expired():
#             return Response(
#                 {'message': 'OTP has expired. Please request a new one.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if otp_record.otp != otp:
#             return Response(
#                 {'message': 'Invalid OTP.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Reset password
#         try:
#             user = User.objects.get(email=email)
#         except User.DoesNotExist:
#             return Response(
#                 {'message': 'No account found with this email.'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         user.set_password(new_password)
#         user.save()

#         # Delete used OTP
#         otp_record.delete()

#         # Delete existing tokens to force re-login
#         from rest_framework.authtoken.models import Token
#         Token.objects.filter(user=user).delete()

#         return Response(
#             {'message': 'Password reset successfully. Please login with new password.'},
#             status=status.HTTP_200_OK
#         )




























# account/views.py

# ─── Standard Library ─────────────────────────────────────────────────────────
import random
import string
from datetime import date

# ─── Django ───────────────────────────────────────────────────────────────────
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

# ─── REST Framework ───────────────────────────────────────────────────────────
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# ─── Local ────────────────────────────────────────────────────────────────────
from .models import User, PasswordResetOTP
from .serializers import UserSerializer, LoginSerializer, RegisterSerializer
from employee.models import Employee


# ══════════════════════════════════════════════════════════════════════════════
# CSRF
# ══════════════════════════════════════════════════════════════════════════════

@csrf_exempt
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'message': 'CSRF cookie set'})


# ══════════════════════════════════════════════════════════════════════════════
# REGISTER
# ══════════════════════════════════════════════════════════════════════════════

class RegisterView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        max_users = 100
        if max_users > 0:
            current = User.objects.filter(is_active=True).count()
            if current >= max_users:
                return Response({
                    'message': f'User limit reached. Maximum {max_users} users allowed. '
                               f'You currently have {current} accounts.',
                }, status=status.HTTP_403_FORBIDDEN)

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════════════════

class LoginView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data

            # Check if employee is inactive
            try:
                emp = Employee.objects.get(user=user)
                if emp.status == "inactive":
                    return Response(
                        {"message": "Login disabled. Please contact Admin."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Employee.DoesNotExist:
                pass  # Admin/HR without employee profile - allow login

            login(request, user)
            request.session.save()

            token, _     = Token.objects.get_or_create(user=user)
            response_data = UserSerializer(user).data
            response_data["token"] = token.key

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════════════════════════════════════
# LOGOUT
# ══════════════════════════════════════════════════════════════════════════════

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        logout(request)
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# ══════════════════════════════════════════════════════════════════════════════
# USER
# ══════════════════════════════════════════════════════════════════════════════

class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        user.email = request.data.get('email', user.email)
        if request.data.get('password'):
            user.set_password(request.data['password'])
        if request.FILES.get('profile_picture'):
            user.profile_picture = request.FILES['profile_picture']
        user.save()
        return Response(UserSerializer(user).data)


# ══════════════════════════════════════════════════════════════════════════════
# USER ROLES
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_roles(request):
    return Response([
        {'value': 'Admin',     'label': 'Admin'},
        {'value': 'Founder',   'label': 'Founder'},
        {'value': 'HR',        'label': 'HR'},
        {'value': 'Manager',   'label': 'Manager'},
        {'value': 'Team Lead', 'label': 'Team Lead'},
        {'value': 'Employee',  'label': 'Employee'},
        {'value': 'Intern',    'label': 'Intern'},
    ])


# ══════════════════════════════════════════════════════════════════════════════
# PASSWORD RESET VIA OTP
# ══════════════════════════════════════════════════════════════════════════════

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


class SendResetOTPView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        otp = generate_otp()
        PasswordResetOTP.objects.filter(email=email).delete()
        PasswordResetOTP.objects.create(email=email, otp=otp)

        try:
            send_mail(
                subject='Password Reset OTP',
                message=f'Your OTP for password reset is: {otp}\n\nThis OTP is valid for 5 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'message': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'OTP sent to your email address.'}, status=status.HTTP_200_OK)


class VerifyResetOTPView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        email = request.data.get('email')
        otp   = request.data.get('otp')

        if not email or not otp:
            return Response({'message': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = PasswordResetOTP.objects.filter(email=email).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({'message': 'OTP not found. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check locked
        if otp_record.is_locked:
            if not otp_record.is_unlock_time_reached():
                return Response({'message': 'Too many attempts. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            otp_record.is_locked = False
            otp_record.attempts  = 0
            otp_record.save()

        # Check expired
        if otp_record.is_expired():
            return Response({'message': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check OTP
        if otp_record.otp != otp:
            otp_record.attempts += 1
            if otp_record.attempts >= PasswordResetOTP.MAX_ATTEMPTS:
                otp_record.is_locked = True
                otp_record.locked_at = timezone.now()
            otp_record.save()
            return Response(
                {'message': 'Invalid OTP.', 'attempts_left': otp_record.attempts_left()},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'message': 'OTP verified successfully.'}, status=status.HTTP_200_OK)


class ResetPasswordWithOTPView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        email        = request.data.get('email')
        otp          = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not otp or not new_password:
            return Response({'message': 'Email, OTP and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_record = PasswordResetOTP.objects.filter(email=email).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({'message': 'OTP not found. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({'message': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp != otp:
            return Response({'message': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        otp_record.delete()
        Token.objects.filter(user=user).delete()

        return Response({'message': 'Password reset successfully. Please login with new password.'}, status=status.HTTP_200_OK)