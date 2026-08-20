# employee/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
import json

# ─── Local Models (only existing ones) ───────────────────────────────────────
from .models import Employee, EmployeeDocument, Team

# ─── License (Optional) ───────────────────────────────────────────────────────
def get_max_users():
    return 100  # License module disabled locally

User = get_user_model()

# --- User & Auth Serializers ---
class UserSerializer(serializers.ModelSerializer):
    employee_id = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'employee_id', 'department']

    def get_employee_id(self, obj):
        try:
            return obj.employee.first().id
        except Exception as e:
            print("⚠️ Error:", e)
            return None

    def get_department(self, obj):
        try:
            employee = obj.employee.first()
            return employee.department if employee else None
        except Exception as e:
            print("⚠️ Error fetching department:", e)
            return None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        user = authenticate(email=email, password=password) 
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid Credentials")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(required=False, default='employee')

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'confirm_password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password') 
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'employee')
        )
        return user


# --- Employee Serializers ---
User = get_user_model()

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


import json

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )
    role = serializers.CharField(write_only=True, required=False, default='employee')

    profile_picture = serializers.ImageField(
        source="user.profile_picture",
        required=False,
        allow_null=True
    )

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'user']

    def to_internal_value(self, data):
        # Convert QueryDict to a regular mutable dict first
        if hasattr(data, 'dict'):
            data = data.dict()  # QueryDict → plain dict, takes last value for each key
        else:
            data = data.copy()

        # Handle empty time fields
        for field in ['fixed_start_time', 'fixed_end_time']:
            if data.get(field) == '':
                data[field] = None

        # Handle custom_timings — always a string from FormData
        if 'custom_timings' in data:
            value = data['custom_timings']
            if isinstance(value, str):
                if value.strip() == '' or value.strip() == '{}':
                    data['custom_timings'] = {}
                else:
                    try:
                        data['custom_timings'] = json.loads(value)
                    except json.JSONDecodeError:
                        data['custom_timings'] = {}
            elif value is None:
                data['custom_timings'] = {}

        return super().to_internal_value(data)

    def validate(self, data):
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError(
                    {"confirm_password": "Passwords do not match."}
                )

        instance = self.instance
        work_type = data.get('work_type', instance.work_type if instance else 'fixed')
        is_same_timing = data.get('is_same_timing', instance.is_same_timing if instance else True)

        # if work_type == 'fixed':
        #     if is_same_timing:
        #         start = data.get('fixed_start_time', instance.fixed_start_time if instance else None)
        #         end = data.get('fixed_end_time', instance.fixed_end_time if instance else None)
        #         if not start or not end:
        #             raise serializers.ValidationError("Start and End time required for Fixed/Same timing.")
        #     else:
        #         custom = data.get('custom_timings', instance.custom_timings if instance else None)
        #         if not custom:
        #             raise serializers.ValidationError("Custom timings are required when 'Different Timings' is selected.")
        
        return data

    def create(self, validated_data):
        with transaction.atomic():
            max_users = get_max_users()
            if max_users > 0:
                current = User.objects.filter(is_active=True).count()
                if current >= max_users:
                    raise serializers.ValidationError({
                        'message': f'User limit reached. Your license allows a maximum of {max_users} users. '
                           f'You currently have {current} accounts. '
                           f'Contact CAOAS Support team to upgrade your license.',
                    })

            email = validated_data.pop("email", None)
            password = validated_data.pop("password", None)
            confirm_password = validated_data.pop("confirm_password", None)
            role = validated_data.pop("role", "employee")

            employee_status = validated_data.get("status", "active")
            is_active       = (employee_status == "active")

            if not email:
                raise serializers.ValidationError({"email": "Email is required."})
            if not password:
                raise serializers.ValidationError({"password": "Password is required."})

            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": ["Email already exists."]})
            if Employee.objects.filter(employee_code=validated_data.get("employee_code")).exists():
                raise serializers.ValidationError({"employee_code": ["Employee code already exists."]})

            user_picture = None
            user_dict = validated_data.pop("user", None)
            if user_dict:
                user_picture = user_dict.get("profile_picture")

            phone_num = validated_data.pop("phone_number", None)
            if phone_num:
                validated_data["contact_number"] = phone_num

            first_name = validated_data.get("first_name", "")
            last_name = validated_data.get("last_name", "")

            user = User.objects.create_user(
                email=email,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                is_active=is_active,
            )

            if user_picture:
                user.profile_picture = user_picture
                user.save()

            employee = Employee.objects.create(
                user=user,
                **validated_data
            )

            return employee

    def update(self, instance, validated_data):
        user = instance.user

        user_data = validated_data.pop("user", {})

        if "profile_picture" in user_data:
            user.profile_picture = user_data["profile_picture"]

        user.first_name = validated_data.get("first_name", user.first_name)
        user.last_name  = validated_data.get("last_name",  user.last_name)
        user.email      = user_data.get("email", user.email)
        user.role       = user_data.get("role",  user.role)

        password         = validated_data.pop("password",         None)
        confirm_password = validated_data.pop("confirm_password", None)
        if password:
            if password != confirm_password:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
            user.set_password(password)

        # ── Sync Employee.status → User.is_active ─────────────────────────────
        # Must do this BEFORE validated_data loop so we can read the incoming value
        incoming_status = validated_data.get("status", instance.status)
        new_is_active   = (incoming_status == "active")
        if user.is_active != new_is_active:
            user.is_active = new_is_active

        user.save()

        phone_num = validated_data.pop("phone_number", None)
        if phone_num:
            instance.contact_number = phone_num

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class UserEmployeeSerializer(serializers.ModelSerializer):
    employee_profile = EmployeeSerializer(read_only=True) 

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'employee_profile']


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = ['id', 'file_name', 'file', 'file_url', 'uploaded_at']
        extra_kwargs = {
            'file': {'write_only': True}
        }

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
