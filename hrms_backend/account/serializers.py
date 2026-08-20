from rest_framework import serializers
from .models import User # Assuming your custom User model is imported here
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    employee_id = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'full_name', 'profile_picture', 'employee_id', 'employee_code', 'department']

    def get_employee_helper(self, obj):
        # Try direct attribute (OneToOne)
        emp = getattr(obj, 'employee', None)
        if emp is not None:
            # If it's a manager/queryset (reverse FK), return first
            if hasattr(emp, 'all'):
                return next(iter(emp.all()), None)
            return emp
        # fallback common reverse manager name for FK
        mgr = getattr(obj, 'employee_set', None)
        if mgr is not None:
            return next(iter(mgr.all()), None)
        return None

    def get_employee_id(self, obj):
        emp = self.get_employee_helper(obj)
        return emp.id if emp else None

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
        return None

    def get_employee_code(self, obj):
        emp = self.get_employee_helper(obj)
        return emp.employee_code if emp else None

    def get_department(self, obj):
        emp = self.get_employee_helper(obj)
        return emp.department if emp else None



class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid Credentials")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'confirm_password', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)

