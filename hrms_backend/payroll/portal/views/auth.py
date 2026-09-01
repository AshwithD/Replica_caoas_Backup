"""payroll/portal/views/auth.py — portal login/logout/me/change-password."""

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..auth import issue_token, revoke_token
from ..models import PortalUser
from ..serializers import (
    PortalChangePasswordSerializer,
    PortalLoginSerializer,
    PortalUserSelfSerializer,
)
from .base import PortalScopeBase


class PortalLoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PortalLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]

        user = (
            PortalUser.objects.select_related("client")
            .filter(email__iexact=email, is_active=True)
            .first()
        )
        if user is None or not user.check_password(password):
            raise ValidationError({"detail": "Invalid email or password."})

        token = issue_token(user)
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return Response(
            {"token": token, "user": PortalUserSelfSerializer(user).data}
        )


class PortalLogoutView(PortalScopeBase, APIView):
    def post(self, request):
        revoke_token(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PortalMeView(PortalScopeBase, APIView):
    def get(self, request):
        return Response(PortalUserSelfSerializer(request.user).data)


class PortalChangePasswordView(PortalScopeBase, APIView):
    def post(self, request):
        serializer = PortalChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            raise ValidationError({"old_password": "Current password is incorrect."})
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password", "updated_at"])
        # Rotate the token so sessions logged in under the old password end.
        token = issue_token(user)
        return Response(
            {"detail": "Password changed.", "token": token,
             "user": PortalUserSelfSerializer(user).data}
        )
