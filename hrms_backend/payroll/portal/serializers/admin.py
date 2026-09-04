"""payroll/portal/serializers/admin.py — internal management of portal logins."""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from ..models import PortalUser
from .submissions import client_logo_url


class PortalUserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, trim_whitespace=False,
        help_text="Set on create (required) or to reset the password on update.",
    )
    client_name = serializers.CharField(source="client.name", read_only=True)
    # Staff-only: the current password in clear text so it can be read back to
    # the client. Safe here because this serializer is behind the internal
    # admin endpoint; the portal's own serializers never expose it.
    password_plain = serializers.CharField(read_only=True)
    client_logo = serializers.SerializerMethodField()

    class Meta:
        model = PortalUser
        fields = [
            "id", "email", "client", "client_name", "client_logo", "role", "is_active",
            "must_change_password", "password", "password_plain", "last_login", "created_at", "updated_at",
        ]
        read_only_fields = ["password_plain", "last_login", "created_at", "updated_at"]

    def get_client_logo(self, obj):
        return client_logo_url(obj.client, self.context.get("request"))

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        """Run Django's configured password validators on portal passwords too.

        Staff type these in by hand for a client, so without this a one-
        character password was accepted and silently handed to the client.
        Blank is allowed on update (it means "keep the existing password").
        """
        if not value:
            return value
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def create(self, validated_data):
        raw = validated_data.pop("password", None)
        if not raw:
            raise serializers.ValidationError(
                {"password": "A password is required when creating a portal user."}
            )
        validated_data.setdefault("must_change_password", True)
        user = PortalUser(**validated_data)
        user.set_password(raw)
        user.save()
        return user

    def update(self, instance, validated_data):
        raw = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if raw:
            instance.set_password(raw)
            instance.must_change_password = True
        instance.save()
        return instance
