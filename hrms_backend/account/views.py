
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