"""payroll/portal/serializers/admin.py — internal management of portal logins."""

from rest_framework import serializers

from ..models import PortalUser


class PortalUserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, trim_whitespace=False,
        help_text="Set on create (required) or to reset the password on update.",
    )
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = PortalUser
        fields = [
            "id", "email", "client", "client_name", "role", "is_active",
            "must_change_password", "password", "last_login", "created_at", "updated_at",
        ]
        read_only_fields = ["last_login", "created_at", "updated_at"]

    def validate_email(self, value):
        return value.strip().lower()

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
