"""payroll/portal/serializers/auth.py — portal auth serializers."""

from rest_framework import serializers

from ..models import PortalUser


class PortalLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)


class PortalUserSelfSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(source="client.id", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = PortalUser
        fields = [
            "id", "email", "role", "is_active", "must_change_password",
            "client_id", "client_name",
        ]
        read_only_fields = fields


class PortalChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(trim_whitespace=False, write_only=True)
    new_password = serializers.CharField(
        min_length=8, max_length=128, trim_whitespace=False, write_only=True,
        help_text="At least 8 characters.",
    )
