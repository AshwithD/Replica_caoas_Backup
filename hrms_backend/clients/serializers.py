from rest_framework import serializers
from .models import UDINRecord, STTRecord, Client, SPOC, ClientSPOC, FileUpload, Document, DepartmentMessage, Company
from datetime import timedelta, datetime, time

class UDINRecordSerializer(serializers.ModelSerializer):
    # Use SlugRelatedField for the 'spoc' ForeignKey.
    # It will automatically convert the SPOC name from the frontend into a SPOC instance.
    spoc = serializers.SlugRelatedField(
        slug_field='name',       # Use the 'name' field of the SPOC model for lookup
        queryset=SPOC.objects.all(), # Provide all possible SPOC objects for validation
        allow_null=True,         # Allow this field to be null (maps to null=True on model)
        required=False,          # Make this field optional in the serializer
    )
    # This field is for displaying the SPOC's name, not for updating the SPOC relationship.
    spoc_name = serializers.CharField(source='spoc.name', read_only=True)

    fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    proposed_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    fee = serializers.SerializerMethodField()
    invoice_no = serializers.SerializerMethodField()
    invoice_date = serializers.SerializerMethodField()

    class Meta:
        model = UDINRecord
        fields = [
            'id', 'internal_ref_no', 'client_name', 'date_of_udin', 'attestation_type',
            'spoc',          # Include 'spoc' for both reading (as object) and writing (by name)
            'spoc_name',     # Include 'spoc_name' for read-only display of the name
            'fee', 'proposed_fee', 'fee_status', 'invoice_no', 'invoice_date', 'udin_no', 'request_by',
            'created_at', 'updated_at', 'is_done', 'period_type', 'period_start_date', 'period_end_date',
        ]
        # Explicitly ensure these fields are not required and allow null values for serializer validation.
        extra_kwargs = {
            'spoc': {'required': False, 'allow_null': True},
            'fee': {'required': False, 'allow_null': True},
            'proposed_fee': {'required': False, 'allow_null': True},
            'invoice_no': {'required': False, 'allow_null': True},
            'invoice_date': {'required': False, 'allow_null': True},
            'udin_no': {'required': False, 'allow_null': True},
            'request_by': {'required': False, 'allow_null': True},
            'date_of_udin': {'required': False, 'allow_null': True}, # Ensure date field handles null/empty properly
        }

    def is_user_authorized(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        user = request.user
        user_full_name = f"{user.first_name} {user.last_name}".strip().lower()
        spoc_name = obj.spoc.name.lower() if obj.spoc else ''

        return user.role.lower() in ['founder', 'admin'] or user_full_name == spoc_name

    def get_fee(self, obj):
        return obj.fee if self.is_user_authorized(obj) else None

    def get_invoice_no(self, obj):
        return obj.invoice_no if self.is_user_authorized(obj) else None

    def get_invoice_date(self, obj):
        return obj.invoice_date if self.is_user_authorized(obj) else None


    def create(self, validated_data):
        spoc_instance = validated_data.pop('spoc', None)
        client_name = validated_data.get('client_name')

        if spoc_instance is None and client_name:
            client = Client.objects.filter(
                name__iexact=client_name.strip()
            ).first()

            if client:
                group = ClientGroup.objects.filter(
                    clients=client,
                    is_active=True
                ).select_related('primary_spoc', 'secondary_spoc').first()

                if group:
                    spoc_instance = group.primary_spoc or group.secondary_spoc

        validated_data['spoc'] = spoc_instance
        return super().create(validated_data)


    def update(self, instance, validated_data):
        validated_data.pop('spoc_name', None)

        if 'spoc' not in self.initial_data:
            client_name = validated_data.get('client_name', instance.client_name)

            client = Client.objects.filter(
                name__iexact=client_name.strip()
            ).first()

            if client:
                group = ClientGroup.objects.filter(
                    clients=client,
                    is_active=True
                ).select_related('primary_spoc', 'secondary_spoc').first()

                if group:
                    instance.spoc = group.primary_spoc or group.secondary_spoc

        return super().update(instance, validated_data)


class STTRecordSerializer(serializers.ModelSerializer):
    # Use SlugRelatedField for the 'spoc' ForeignKey.
    # It will automatically convert the SPOC name from the frontend into a SPOC instance.
    spoc = serializers.SlugRelatedField(
        slug_field='name',       # Use the 'name' field of the SPOC model for lookup
        queryset=SPOC.objects.all(), # Provide all possible SPOC objects for validation
        allow_null=True,         # Allow this field to be null (maps to null=True on model)
        required=False,          # Make this field optional in the serializer
    )
    # This field is for displaying the SPOC's name, not for updating the SPOC relationship.
    spoc_name = serializers.CharField(source='spoc.name', read_only=True)
    department = serializers.CharField(required=False, allow_null=True, allow_blank=True)  # Add this line

    class Meta:
        model = STTRecord
        fields = [
            'id', 'stt_no', 'client_name', 'date_of_stt', 'description',
            'spoc',          # Include 'spoc' for both reading (as object) and writing (by name)
            'spoc_name',     # Include 'spoc_name' for read-only display of the name
            'spoc_fee_type', 'fee', 'proposed_fee', 'fee_status', 'invoice_no', 'invoice_date', 'request_by',
            'created_at', 'updated_at', 'is_done', 'period_type', 'period_start_date', 'period_end_date',
            'department',  # Add here
        ]
        # Explicitly ensure these fields are not required and allow null values for serializer validation.
        extra_kwargs = {
            'spoc': {'required': False, 'allow_null': True},
            'spoc_fee_type': {'required': False, 'allow_null': True},
            'fee': {'required': False, 'allow_null': True},
            'proposed_fee': {'required': False, 'allow_null': True},
            'invoice_no': {'required': False, 'allow_null': True},
            'invoice_date': {'required': False, 'allow_null': True},
            'request_by': {'required': False, 'allow_null': True},
            'date_of_stt': {'required': False, 'allow_null': True}, # Ensure date field handles null/empty properly
            'department': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
    

    def create(self, validated_data):
        spoc_instance = validated_data.pop('spoc', None) # Pop spoc first

        # If SPOC is not provided in data, try to auto-assign based on client
        if spoc_instance is None and 'client_name' in validated_data:
            client_name = validated_data['client_name']
            client_spoc = ClientSPOC.objects.filter(client__name=client_name).select_related('spoc').first()
            if client_spoc:
                spoc_instance = client_spoc.spoc

        validated_data['spoc'] = spoc_instance
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Pop read-only fields first to prevent them from interfering with validation
        validated_data.pop('spoc_name', None)
        validated_data.pop('created_at', None) # Assuming these are read-only model fields
        validated_data.pop('updated_at', None) # Assuming these are read-only model fields

        # Handle 'spoc' field separately IF it was sent in the request data
        # We check self.initial_data to see if the key was explicitly present (even if its value was empty/null)
        if 'spoc' in self.initial_data:
            # If 'spoc' was sent, validated_data['spoc'] will already contain the SPOC instance or None
            # (due to SlugRelatedField's parsing of the name or empty string/null).
            spoc_value = validated_data.pop('spoc')
            instance.spoc = spoc_value
        else:
            # If 'spoc' was NOT sent in the request (e.g., partial update for other fields),
            # we should retain the existing SPOC unless auto-assignment is triggered.
            current_client_name = instance.client_name
            new_client_name = validated_data.get('client_name', current_client_name)

            # Auto-assign SPOC only if client_name has changed, or if current SPOC is None and a client is present.
            if new_client_name != current_client_name or (instance.spoc is None and new_client_name):
                client_spoc = ClientSPOC.objects.filter(client__name=new_client_name).select_related('spoc').first()
                if client_spoc:
                    instance.spoc = client_spoc.spoc
                elif instance.spoc is not None: # If client_name changed and no new mapping, clear existing SPOC
                    instance.spoc = None
                # If instance.spoc was already None and no new mapping, it remains None.

        # Convert empty strings for number fields to None before validation.
        # This is a common issue with Ant Design's number inputs if they are left empty.
        for field_name in ['fee', 'proposed_fee']:
            if field_name in validated_data and validated_data[field_name] == '':
                validated_data[field_name] = None
        
        # Process all other fields through the default ModelSerializer update logic
        return super().update(instance, validated_data)


# class ClientSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Client
#         fields = ['id', 'name']

class SPOCSerializer(serializers.ModelSerializer):
    class Meta:
        model = SPOC
        fields = ['id', 'name']

class ClientSPOCSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    spoc_name = serializers.CharField(source='spoc.name', read_only=True)

    class Meta:
        model = ClientSPOC
        fields = ['id', 'client', 'spoc', 'client_name', 'spoc_name']

# class AttestationTypeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = AttestationType
#         fields = ['id', 'name']

# class DescriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Description
#         fields = ['id', 'name']

# class TeamLeadSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = TeamLead
#         fields = ['id', 'name']


########################################################################################################################
from rest_framework import serializers
from employee.models import Team
from .models import (
    SPOC, Client, GroupCategory, ClientGroup,
    MainService, SubService, ClientGroupService, Constitution, Task, TaskTimeEntry
)

# serializers.py

class TaskHistorySerializer(serializers.Serializer):
    time = serializers.DateTimeField()
    user = serializers.CharField()
    action = serializers.CharField()
    details = serializers.CharField(allow_blank=True)
    
class SPOCSerializer(serializers.ModelSerializer):
    class Meta:
        model = SPOC
        fields = '__all__'

# New Serializer: ConstitutionSerializer
class ConstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Constitution
        fields = '__all__'

# class ClientSerializer(serializers.ModelSerializer):
#     # 'id' is required=False for creation of new clients, but will be present for existing ones
#     id = serializers.IntegerField(required=False) 
#     # Add _tempId as a write-only field to receive it from the frontend
#     _tempId = serializers.CharField(required=False, write_only=True)
#     # Add is_active field
#     is_active = serializers.BooleanField(required=False, default=True)

#     phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
#     email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
#     contact_person = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    

#     # For reading, show the name of the constitution
#     constitution_name = serializers.CharField(source='constitution.name', read_only=True)
    
#     class Meta:
#         model = Client
#         fields = '__all__' # This will now include 'constitution' (ID for write) and 'address'

#     def validate_name(self, value):
#         """
#         Check that the client name is unique, allowing the current instance's name
#         to be used during updates.
#         """
#         # Get the current instance if it exists (i.e., this is an update operation)
#         instance = self.instance

#         # Query for clients with the same name
#         qs = Client.objects.filter(name=value)

#         if instance:
#             # If it's an update, exclude the current instance from the uniqueness check
#             qs = qs.exclude(pk=instance.pk)

#         if qs.exists():
#             raise serializers.ValidationError("Client with this name already exists.")
#         return value
    
#     def _can_view_sensitive_data(self, obj):
#         """
#         Allow sensitive data if the user is admin or founder;
#         or if the user is the spoc (either primary or secondary) 
#         of any ClientGroup that includes this client.
#         """
#         request = self.context.get('request')
#         if not request or not request.user.is_authenticated:
#             return False

#         user_role = getattr(request.user, 'role', '').lower()
#         if user_role in ['admin', 'founder']:
#             return True

#         # Convert the request.user to a SPOC instance.
#         # Adjust the lookup as needed depending on your SPOC model.
#         from .models import ClientGroup, SPOC  # Ensure SPOC is imported
#         spoc_instance = SPOC.objects.filter(email=request.user.email).first()
#         if not spoc_instance:
#             return False

#         return ClientGroup.objects.filter(
#             Q(clients=obj),
#             # Use the SPOC instance for the filter.
#             Q(primary_spoc=spoc_instance) | Q(secondary_spoc=spoc_instance)
#         ).exists()

# class ClientSPOCSerializer(serializers.ModelSerializer):
#     # spoc_name = serializers.CharField(source='spoc.name', read_only=True)
#     spoc = SPOCSerializer(read_only=True) 
#     client_name = serializers.CharField(source='client.name', read_only=True)

    # class Meta:
    #     model = ClientSPOC
    #     fields = ['id', 'client', 'spoc', 'is_primary', 'client_name']
    #     read_only_fields = ['client_name']

# from .models import ClientGroup
# class ClientSerializer(serializers.ModelSerializer):
#     id = serializers.IntegerField(required=False)
#     _tempId = serializers.CharField(required=False, write_only=True)
#     is_active = serializers.BooleanField(required=False, default=True)

#     # writable fields
#     phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
#     email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
#     contact_person = serializers.CharField(required=False, allow_blank=True, allow_null=True)

#     constitution_name = serializers.CharField(source='constitution.name', read_only=True)

#     spocs = ClientSPOCSerializer(many=True, read_only=True)
#     group_name = serializers.SerializerMethodField()

#     class Meta:
#         model = Client
#         fields = '__all__'

#     def to_representation(self, instance):
#         """Override to apply sensitive data check only on output"""
#         data = super().to_representation(instance)

#         if not self._can_view_sensitive_data(instance):
#             data['phone'] = None
#             data['email'] = None
#             data['contact_person'] = None

#         return data

#     def _can_view_sensitive_data(self, obj):
#         request = self.context.get('request')
#         if not request or not request.user.is_authenticated:
#             return False

#         user_role = getattr(request.user, 'role', '').lower()
#         if user_role in ['admin', 'founder']:
#             return True

#         from .models import ClientGroup, SPOC
#         spoc_instance = SPOC.objects.filter(email=request.user.email).first()
#         if not spoc_instance:
#             return False

#         return ClientGroup.objects.filter(
#             Q(clients=obj),
#             Q(primary_spoc=spoc_instance) | Q(secondary_spoc=spoc_instance)
#         ).exists()


#     def get_phone(self, obj):
#         return obj.phone if self._can_view_sensitive_data(obj) else None

#     def get_email(self, obj):
#         return obj.email if self._can_view_sensitive_data(obj) else None

#     def get_contact_person(self, obj):
#         return obj.contact_person if self._can_view_sensitive_data(obj) else None

#     def get_group_name(self, obj):
#         group = ClientGroup.objects.filter(
#             clients=obj,
#             is_active=True
#         ).first()
#         return group.group_name if group else None

from django.db.models import Q
from rest_framework import serializers

from .models import Client, ClientGroup, SPOC
from .serializers import ClientSPOCSerializer


# class ClientSerializer(serializers.ModelSerializer):
#     id = serializers.IntegerField(required=False)
#     _tempId = serializers.CharField(required=False, write_only=True)
#     is_active = serializers.BooleanField(required=False, default=True)

#     # writable fields
#     phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
#     email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
#     contact_person = serializers.CharField(required=False, allow_blank=True, allow_null=True)

#     # constitution_name = serializers.CharField(
#     #     source='constitution.name',
#     #     read_only=True
#     # )

#     constitution = serializers.PrimaryKeyRelatedField(
#         queryset=Constitution.objects.all(),
#         allow_null=True,
#         required=False
#     )

#     spocs = ClientSPOCSerializer(many=True, read_only=True)
#     groups_info = serializers.SerializerMethodField()

#     # 👇 THIS IS WHAT DROPDOWN USES
#     group_name = serializers.SerializerMethodField()
#     # spoc_name = serializers.SerializerMethodField()
#     primary_spoc_name = serializers.SerializerMethodField()

#     class Meta:
#         model = Client
#         fields = '__all__'

#     # --------------------------------------------------
#     # OUTPUT MASKING (phone/email/contact_person)
#     # --------------------------------------------------
#     # def to_representation(self, instance):
#     #     data = super().to_representation(instance)

#     #     if not self._can_view_sensitive_data(instance):
#     #         data['phone'] = None
#     #         data['email'] = None
#     #         data['contact_person'] = None

#     #     return data

#     def to_representation(self, instance):
#         data = super().to_representation(instance)

#         # ✅ FORCE UPPERCASE FOR DISPLAY
#         if data.get("name"):
#             data["name"] = data["name"].upper()

#         if not self._can_view_sensitive_data(instance):
#             data['phone'] = None
#             data['email'] = None
#             data['contact_person'] = None

#         return data

#     # --------------------------------------------------
#     # PERMISSION CHECK
#     # --------------------------------------------------
#     # def _can_view_sensitive_data(self, obj):
#     #     request = self.context.get('request')

#     #     if not request or not request.user.is_authenticated:
#     #         return False

#     #     user_role = getattr(request.user, 'role', '').lower()
#     #     if user_role in ['admin', 'founder']:
#     #         return True

#     #     spoc_instance = SPOC.objects.filter(email=request.user.email).first()
#     #     if not spoc_instance:
#     #         return False

#     #     return ClientGroup.objects.filter(
#     #         clients=obj,
#     #         is_active=True
#     #     ).filter(
#     #         Q(primary_spoc=spoc_instance) |
#     #         Q(secondary_spoc=spoc_instance)
#     #     ).exists()

#     def _can_view_sensitive_data(self, obj):
#         return getattr(obj, "can_view_sensitive_data", False)


#     # --------------------------------------------------
#     # SAFE GETTERS
#     # --------------------------------------------------
#     def get_phone(self, obj):
#         return obj.phone if self._can_view_sensitive_data(obj) else None

#     def get_email(self, obj):
#         return obj.email if self._can_view_sensitive_data(obj) else None

#     def get_contact_person(self, obj):
#         return obj.contact_person if self._can_view_sensitive_data(obj) else None

#     # --------------------------------------------------
#     # ⭐ GROUP NAME (KEY FIX)
#     # --------------------------------------------------
#     # def get_group_name(self, obj):
#     #     """
#     #     Returns active ClientGroup.group_name for this client.
#     #     Used in client dropdown as:
#     #     <Group Name> – <Client Name>
#     #     """
#     #     group = ClientGroup.objects.filter(
#     #         clients=obj,
#     #         is_active=True
#     #     ).only('group_name').first()

#     #     return group.group_name if group else None

#     # def get_primary_spoc_name(self, obj):
#     #     """
#     #     Returns primary SPOC name from ClientGroup
#     #     (same source as frontend table)
#     #     """
#     #     group = ClientGroup.objects.filter(
#     #         clients=obj,
#     #         is_active=True
#     #     ).select_related("primary_spoc").first()

#     #     if not group or not group.primary_spoc:
#     #         return None

#     #     return group.primary_spoc.name
#     def get_group_name(self, obj):
#         # 🛑 OLD: ClientGroup.objects.filter(...) hits DB every time
#         # ✅ NEW: Iterate over the pre-fetched list in memory
#         # This uses the data we fetched in the ViewSet
#         for group in obj.client_groups_membership.all():
#             if group.is_active:
#                 return group.group_name
#         return None

#     def get_primary_spoc_name(self, obj):
#         # ✅ NEW: Use memory lookup
#         for group in obj.client_groups_membership.all():
#             if group.is_active and group.primary_spoc:
#                 return group.primary_spoc.name
#         return None

#     def get_groups_info(self, obj):
#         # Because we used prefetch_related in views.py, this loop does NOT hit the DB
#         return [
#             {
#                 "id": g.id,
#                 "group_name": g.group_name,
#                 "primary_spoc_name": g.primary_spoc.name if g.primary_spoc else "N/A"
#             }
#             for g in obj.client_groups_membership.all()
#         ]

#     def validate(self, data):
#         start = data.get("start_time")
#         end = data.get("end_time")

#         if not start or not end:
#             return data

#         # If end is earlier, assume it's next day
#         if end <= start:
#             end = end + timedelta(days=1)
#             data["end_time"] = end

#         # Max allowed = next day 6 AM
#         next_day_6am = timezone.make_aware(
#             datetime.combine(start.date() + timedelta(days=1), time(6, 0))
#         )

#         if end > next_day_6am:
#             raise serializers.ValidationError(
#                 "End time cannot be after 6:00 AM next day"
#             )

#         return data

class ClientSerializer(serializers.ModelSerializer):
    id       = serializers.IntegerField(required=False)
    _tempId  = serializers.CharField(required=False, write_only=True)
    is_active = serializers.BooleanField(required=False, default=True)

    # writable fields
    phone          = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email          = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    contact_person = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    constitution = serializers.PrimaryKeyRelatedField(
        queryset=Constitution.objects.all(),
        allow_null=True,
        required=False,
    )

    spocs      = ClientSPOCSerializer(many=True, read_only=True)
    groups_info       = serializers.SerializerMethodField()
    group_name        = serializers.SerializerMethodField()
    primary_spoc_name = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = '__all__'

    # ── Output masking ────────────────────────────────────────────────────────
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('name'):
            data['name'] = data['name'].upper()
        if not self._can_view_sensitive_data(instance):
            data['phone']          = None
            data['email']          = None
            data['contact_person'] = None
        return data

    # ── Permission check — uses prefetch cache, zero DB hits ─────────────────
    def _can_view_sensitive_data(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        role = (getattr(request.user, 'role', '') or '').lower()
        if role in ('admin', 'founder'):
            return True
        user_email = request.user.email
        # Iterates over prefetch cache — no extra query
        for grp in obj.client_groups_membership.all():
            if not grp.is_active:
                continue
            if grp.primary_spoc and grp.primary_spoc.email == user_email:
                return True
            if grp.secondary_spoc and grp.secondary_spoc.email == user_email:
                return True
        return False

    # ── Safe getters (used by to_representation masking) ─────────────────────
    def get_phone(self, obj):
        return obj.phone if self._can_view_sensitive_data(obj) else None

    def get_email(self, obj):
        return obj.email if self._can_view_sensitive_data(obj) else None

    def get_contact_person(self, obj):
        return obj.contact_person if self._can_view_sensitive_data(obj) else None

    # ── Group name — prefetch cache, no DB hit ────────────────────────────────
    def get_group_name(self, obj):
        for grp in obj.client_groups_membership.all():
            if grp.is_active:
                return grp.group_name
        return None

    # ── Primary SPOC name — select_related on Prefetch, no DB hit ────────────
    def get_primary_spoc_name(self, obj):
        for grp in obj.client_groups_membership.all():
            if grp.is_active and grp.primary_spoc:
                return grp.primary_spoc.name
        return None

    # ── Groups info — prefetch cache, no DB hit ───────────────────────────────
    def get_groups_info(self, obj):
        return [
            {
                'id':                g.id,
                'group_name':        g.group_name,
                'primary_spoc_name': g.primary_spoc.name if g.primary_spoc else 'N/A',
            }
            for g in obj.client_groups_membership.all()
        ]

    # ── Validation ────────────────────────────────────────────────────────────
    def validate(self, data):
        start = data.get('start_time')
        end   = data.get('end_time')

        if not start or not end:
            return data

        if end <= start:
            end = end + timedelta(days=1)
            data['end_time'] = end

        next_day_6am = timezone.make_aware(
            datetime.combine(start.date() + timedelta(days=1), time(6, 0))
        )
        if end > next_day_6am:
            raise serializers.ValidationError(
                'End time cannot be after 6:00 AM next day'
            )
        return data


class ClientListSerializer(serializers.ModelSerializer):
    """
    Lean serializer for ClientViewSet list action.
    Uses prefetch cache — zero extra queries per object.
    Only returns fields needed for tables and dropdowns.
    """
    group_name        = serializers.SerializerMethodField()
    primary_spoc_name = serializers.SerializerMethodField()
    constitution_name = serializers.CharField(
        source='constitution.name', read_only=True, default=None
    )

    class Meta:
        model  = Client
        fields = [
            'id', 'name', 'email', 'phone',
            'contact_person', 'nature_of_business',
            'gstin', 'pan', 'tan', 'cin', 'iec', 'lei',
            'ksea', 'udyam', 'apt', 'ept',
            'constitution', 'constitution_name',
            'address', 'is_active',
            'group_name', 'primary_spoc_name',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('name'):
            data['name'] = data['name'].upper()
        if not self._can_view(instance):
            data['phone']          = None
            data['email']          = None
            data['contact_person'] = None
        return data

    def _can_view(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        role = (getattr(request.user, 'role', '') or '').lower()
        if role in ('admin', 'founder'):
            return True
        user_email = request.user.email
        for grp in obj.client_groups_membership.all():
            if not grp.is_active:
                continue
            if grp.primary_spoc and grp.primary_spoc.email == user_email:
                return True
            if grp.secondary_spoc and grp.secondary_spoc.email == user_email:
                return True
        return False

    def get_group_name(self, obj):
        for grp in obj.client_groups_membership.all():
            if grp.is_active:
                return grp.group_name
        return None

    def get_primary_spoc_name(self, obj):
        for grp in obj.client_groups_membership.all():
            if grp.is_active and grp.primary_spoc:
                return grp.primary_spoc.name
        return None


class ClientLiteSerializer(serializers.ModelSerializer):
    """
    Ultra-lean serializer for dropdowns only.
    group_name and primary_spoc_name come from
    Subquery annotations on the queryset —
    single SQL query total, zero Python loops.
    """
    group_name        = serializers.CharField(
        source='_group_name',        read_only=True, default=None
    )
    primary_spoc_name = serializers.CharField(
        source='_primary_spoc_name', read_only=True, default=None
    )

    class Meta:
        model  = Client
        fields = ['id', 'name', 'is_active', 'group_name', 'primary_spoc_name']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('name'):
            data['name'] = data['name'].upper()
        return data

class GroupCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupCategory
        fields = '__all__'

class MainServiceSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    class Meta:
        model = MainService
        fields = '__all__'

class SubServiceSerializer(serializers.ModelSerializer):
    main_service_name = serializers.CharField(source='main_service.name', read_only=True)
    team_name = serializers.CharField(source='main_service.team.name', read_only=True)  # ✅ Add this
    main_service = serializers.PrimaryKeyRelatedField(
        queryset=MainService.objects.all()
    )

    class Meta:
        model = SubService
        fields = '__all__'


# class ClientGroupServiceSerializer(serializers.ModelSerializer):
#     # -------- READ-ONLY DISPLAY FIELDS --------
#     main_service_name = serializers.CharField(
#         source='main_service.name', read_only=True
#     )
#     sub_service_name = serializers.CharField(
#         source='sub_service.name', read_only=True
#     )
#     client_name = serializers.CharField(
#         source='client.name', read_only=True
#     )

#     # -------- WRITE FIELDS (IMPORTANT) --------
#     main_service = serializers.PrimaryKeyRelatedField(
#         queryset=MainService.objects.all()
#     )
#     sub_service = serializers.PrimaryKeyRelatedField(
#         queryset=SubService.objects.all()
#     )
#     client = serializers.PrimaryKeyRelatedField(
#         queryset=Client.objects.all()
#     )

#     is_active = serializers.BooleanField(required=False, default=True)

#     class Meta:
#         model = ClientGroupService
#         fields = [
#             'id',
#             'client_group',
#             'client',
#             'main_service',
#             'sub_service',
#             'fee',
#             'period',
#             'due_date',
#             'main_service_name',
#             'sub_service_name',
#             'client_name',
#             'is_active',
#         ]

#         read_only_fields = [
#             'main_service_name',
#             'sub_service_name',
#             'client_name',
#         ]

#         extra_kwargs = {
#             'client_group': {'required': False}
#         }

from datetime import date


from rest_framework import serializers
from datetime import date
from clients.models import ClientGroupService


class ClientGroupServiceSerializer(serializers.ModelSerializer):

    period = serializers.CharField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = ClientGroupService
        fields = "__all__"

    def create(self, validated_data):
        sub = validated_data.get("sub_service")

        # Default values
        period = None
        due_date = None

        if sub and sub.period and sub.due_day:
            period = sub.period

            if sub.period == "Monthly":
                due_date = date(2000, 1, sub.due_day)
            elif sub.due_month:
                due_date = date(2000, sub.due_month, sub.due_day)

        validated_data["period"] = period
        validated_data["due_date"] = due_date

        validated_data.setdefault("fee", None)

        return super().create(validated_data)
    
    def validate(self, attrs):
        # Allow update without resending unchanged fields
        if self.instance:
            attrs.setdefault("main_service", self.instance.main_service)
            attrs.setdefault("sub_service", self.instance.sub_service)
            attrs.setdefault("client", self.instance.client)
            attrs.setdefault("client_group", self.instance.client_group)
        return attrs

    def update(self, instance, validated_data):
        sub = validated_data.get("sub_service", instance.sub_service)

        # Recalculate period & due_date only if sub_service changes
        if sub:
            if sub.period and sub.due_day:
                instance.period = sub.period

                if sub.period == "Monthly":
                    instance.due_date = date(2000, 1, sub.due_day)
                elif sub.due_month:
                    instance.due_date = date(2000, sub.due_month, sub.due_day)
            else:
                instance.period = None
                instance.due_date = None

        return super().update(instance, validated_data)

# class ClientLiteSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Client
#         fields = '__all__' # Only what you need for the group list

# class ClientListSerializer(serializers.ModelSerializer):
#     """
#     Lean serializer for list/dropdown.
#     All related data from prefetch cache — zero extra queries.
#     """
#     group_name        = serializers.SerializerMethodField()
#     primary_spoc_name = serializers.SerializerMethodField()
#     constitution_name = serializers.CharField(
#         source='constitution.name', read_only=True, default=None
#     )

#     class Meta:
#         model  = Client
#         fields = [
#             'id', 'name', 'email', 'phone',
#             'contact_person', 'nature_of_business',
#             'gstin', 'pan', 'tan', 'cin', 'iec', 'lei',
#             'ksea', 'udyam', 'apt', 'ept',
#             'constitution', 'constitution_name',
#             'billing_cycle', 'invoice_date',
#             'address', 'is_active',
#             'group_name', 'primary_spoc_name',
#         ]

#     def to_representation(self, instance):
#         data = super().to_representation(instance)
#         if data.get('name'):
#             data['name'] = data['name'].upper()
#         if not self._can_view(instance):
#             data['phone']          = None
#             data['email']          = None
#             data['contact_person'] = None
#         return data

#     def _can_view(self, obj):
#         request = self.context.get('request')
#         if not request:
#             return False
#         role = (getattr(request.user, 'role', '') or '').lower()
#         if role in ('admin', 'founder'):
#             return True
#         user_email = request.user.email
#         for grp in obj.client_groups_membership.all():
#             if not grp.is_active:
#                 continue
#             if grp.primary_spoc and grp.primary_spoc.email == user_email:
#                 return True
#             if grp.secondary_spoc and grp.secondary_spoc.email == user_email:
#                 return True
#         return False

#     def get_group_name(self, obj):
#         for grp in obj.client_groups_membership.all():
#             if grp.is_active:
#                 return grp.group_name
#         return None

#     def get_primary_spoc_name(self, obj):
#         for grp in obj.client_groups_membership.all():
#             if grp.is_active and grp.primary_spoc:
#                 return grp.primary_spoc.name
#         return None

class ClientGroupReadSerializer(serializers.ModelSerializer):
    group_category_name = serializers.CharField(source='group_category.name', read_only=True)
    primary_spoc_name = serializers.CharField(source='primary_spoc.name', read_only=True)
    secondary_spoc_name = serializers.CharField(source='secondary_spoc.name', read_only=True)
    gst_number = serializers.CharField(read_only=True)
    # Use the updated ClientSerializer for nested clients
    # clients = ClientSerializer(many=True, read_only=True) 
    clients = ClientListSerializer(many=True, read_only=True)
    group_services = ClientGroupServiceSerializer(many=True, read_only=True)
    is_active = serializers.BooleanField(read_only=True) 
    description = serializers.CharField(required=False, allow_blank=True) # Added description for reading

    class Meta:
        model = ClientGroup
        fields = [
            'id', 'group_name', 'group_category', 'group_category_name',
            'primary_spoc', 'primary_spoc_name', 'secondary_spoc', 'secondary_spoc_name',
            'clients', 'gst_number',
            'group_services', 'created_at', 'updated_at', 'is_active', 'description'
        ]

class ClientGroupWriteSerializer(serializers.ModelSerializer):
    # clients will now be a list of client IDs, not full client objects
    clients = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), many=True, required=False, allow_empty=True
    )
    group_services_data = serializers.ListField(
        child=serializers.DictField(), # Accept dictionaries for services
        required=False, allow_empty=True, write_only=True
    )
    is_active = serializers.BooleanField(required=False) 
    description = serializers.CharField(required=False, allow_blank=True) # Added description for writing

    class Meta:
        model = ClientGroup
        fields = [
            'id', 'group_name', 'group_category',
            'primary_spoc', 'secondary_spoc',
            'clients', # Changed from clients_data
            'group_services_data',
            'is_active',
            'description' # Added description to writable fields
        ]

    def create(self, validated_data):
        clients_to_link = validated_data.pop('clients', [])
        group_services_data = validated_data.pop('group_services_data', [])

        client_group = ClientGroup.objects.create(**validated_data)
        client_group.clients.set(clients_to_link)

        for service_item_data in group_services_data:
            client_identifier = service_item_data.pop('client')
            try:
                service_client_instance = Client.objects.get(id=int(client_identifier))
            except (ValueError, Client.DoesNotExist):
                raise serializers.ValidationError(f"Client with ID '{client_identifier}' not found for service.")

            ClientGroupService.objects.create(
                client_group=client_group,
                client=service_client_instance,
                main_service_id=service_item_data.pop('main_service'),
                sub_service_id=service_item_data.pop('sub_service'),
                **service_item_data
            )

        return client_group

    def update(self, instance, validated_data):
        # Update basic group fields first
        for attr, value in validated_data.items():
            # Exclude 'clients' and 'group_services_data' from direct setattr here
            # as they are handled separately below.
            if attr not in ['clients', 'group_services_data']:
                setattr(instance, attr, value)
        instance.save()

        # Only update clients if 'clients' field is explicitly provided in the request
        if 'clients' in validated_data:
            clients_to_link = validated_data.pop('clients')
            instance.clients.set(clients_to_link)

        # Only update group services if 'group_services_data' field is explicitly provided
        if 'group_services_data' in validated_data:
            group_services_data = validated_data.pop('group_services_data')
            # Delete existing services for this group to re-create them
            instance.group_services.all().delete()

            for service_item_data in group_services_data:
                client_identifier = service_item_data.pop('client')
                try:
                    client_id_int = int(client_identifier)
                    service_client_instance = Client.objects.get(id=client_id_int)
                except (ValueError, Client.DoesNotExist):
                    raise serializers.ValidationError(f"Client with ID '{client_identifier}' not found for service.")

                ClientGroupService.objects.create(
                    client_group=instance,
                    client=service_client_instance,
                    main_service_id=service_item_data.pop('main_service'),
                    sub_service_id=service_item_data.pop('sub_service'),
                    **service_item_data
                )

        return instance
    
from .models import Task, TaskTimeEntry, InternalTimeEntry
from django.contrib.auth import get_user_model
from employee.models import Employee
from .utils.time_overlap import check_time_overlap

class TaskTimeEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField(read_only=True)
    task_id = serializers.CharField(source="task.task_id", read_only=True)
    date = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TaskTimeEntry
        fields = ['id', 'task', 'employee', 'task_id', 'date', 'employee_name', 'start_time', 'end_time', 'duration', 'notes', 'created_at']

    def get_employee_name(self, obj):
        # Use get_full_name() if available, else fallback to username or email
        user = obj.employee
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name:
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None)

    def get_date(self, obj):
        if obj.start_time:
            return obj.start_time.date()
        return None

    

    def validate(self, data):
        request = self.context.get("request")
        employee = request.user if request else None

        start = data.get("start_time")
        end = data.get("end_time")

        if not employee:
            raise serializers.ValidationError("Employee not detected.")

        if start and end:

            if end <= start:
                raise serializers.ValidationError("End time must be after start time.")

            duration = (end - start).total_seconds() / 3600
            if duration > 15:
                raise serializers.ValidationError("Time entry cannot exceed 15 hours.")

            if check_time_overlap(employee, start, end, self.instance, "task"):
                raise serializers.ValidationError(
                    "Time overlaps with another Task/Internal entry."
                )

        return data


class InternalTimeEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = InternalTimeEntry
        fields = [
            "id",
            "employee",
            "employee_name",
            "description",
            "date",
            "start_time",
            "end_time",
            "duration",
            "notes",
            "status",
            "created_at"
        ]
        read_only_fields = ["employee", "created_at"]

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.email

    def get_date(self, obj):
        return obj.start_time.date() if obj.start_time else None

    def validate(self, data):
        request = self.context.get("request")
        employee = request.user if request else None

        start = data.get("start_time")
        end = data.get("end_time")

        if not employee:
            raise serializers.ValidationError("Employee not detected.")

        if start and end:

            if end <= start:
                raise serializers.ValidationError("End time must be after start time.")

            duration = (end - start).total_seconds() / 3600
            if duration > 15:
                raise serializers.ValidationError("Time entry cannot exceed 15 hours.")

            from .utils.time_overlap import check_time_overlap

            if check_time_overlap(employee, start, end, self.instance, "internal"):
                raise serializers.ValidationError(
                    "Time overlaps with another Task/Internal entry."
                )

        return data





# class TaskSerializer(serializers.ModelSerializer):
#     assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
#     time_entries = TaskTimeEntrySerializer(many=True, read_only=True)
#     created_by_username = serializers.SerializerMethodField(read_only=True)
#     proof_file = serializers.FileField(use_url=True, required=False, allow_null=True)

#     marked_done_by_name = serializers.SerializerMethodField(read_only=True)

#     class Meta:
#         model = Task
#         fields = [
#             'id', 'task_id', 'client', 'sub_service', 'spoc', 'team', 'status', 'period', 'due_date',
#             'employee_id', 'comments', 'total_hours', 'start_time', 'end_time', 'file', 'proof_file',
#             'created_at', 'updated_at', 'marked_done_by', 'marked_done_by_name', 'marked_done_at',
#             'assigned_to', 'assigned_to_name', 'assigned_at',
#             'time_entries', 'created_by_username'
#         ]
#         read_only_fields = ["total_hours", "marked_done_by_name", "marked_done_by", "marked_done_at"]

#     def get_created_by_username(self, obj):
#         user = getattr(obj, 'created_by', None)
#         if not user:
#             return None
#         if hasattr(user, 'get_full_name'):
#             name = user.get_full_name()
#             if name:
#                 return name
#         return getattr(user, 'username', None) or getattr(user, 'email', None)

#     def update(self, instance, validated_data):
#         request = self.context.get("request")
#         user = request.user if request else None

#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)

#         # 🔥 THIS IS THE FIX
#         instance.save(user=user)
#         return instance

#     def get_marked_done_by_name(self, obj):
#         user = obj.marked_done_by
#         if not user:
#             return None

#         if hasattr(user, 'get_full_name'):
#             name = user.get_full_name()
#             if name:
#                 return name

#         return getattr(user, 'username', None) or getattr(user, 'email', None)


from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskAssignmentHistory, TaskAssignment

ASSIGN_ROLES = {"team lead", "manager", "admin", "founder"}


class TaskAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source="user.get_full_name",
        read_only=True
    )

    class Meta:
        model = TaskAssignment
        fields = [
            "id",
            "user",
            "user_name",
            "assigned_at",
            "is_active",
        ]

from rest_framework.exceptions import ValidationError

# class TaskListSerializer(serializers.ModelSerializer):
#     # Raw IDs (for existing frontend logic)
#     client = serializers.PrimaryKeyRelatedField(read_only=True)
#     sub_service = serializers.PrimaryKeyRelatedField(read_only=True)
#     spoc = serializers.PrimaryKeyRelatedField(read_only=True)
#     team = serializers.PrimaryKeyRelatedField(read_only=True)

#     # Human-readable names (for fast display)
#     client_name = serializers.CharField(source="client.name", read_only=True)
#     sub_service_name = serializers.CharField(source="sub_service.name", read_only=True)
#     spoc_name = serializers.CharField(source="spoc.name", read_only=True)
#     team_name = serializers.CharField(source="team.name", read_only=True)
#     created_by_name = serializers.SerializerMethodField()
#     client_group_name = serializers.SerializerMethodField()

#     assigned_user_ids = serializers.SerializerMethodField()
#     time_entries = TaskTimeEntrySerializer(many=True, read_only=True)
#     created_by_id = serializers.IntegerField(source="created_by.id", read_only=True)


#     class Meta:
#         model = Task
#         fields = [
#             "id",
#             "task_id",

#             # keep old fields
#             "client",
#             "sub_service",
#             "spoc",
#             "team",

#             # new display fields
#             "client_name",
#             "client_group_name",
#             "sub_service_name",
#             "spoc_name",
#             "team_name",

#             "status",
#             "period",
#             "due_date",
#             "created_at",
#             "created_by_name",
#             "created_by_id",
#             "assigned_user_ids",
#             "time_entries",
#         ]
#     def get_created_by_name(self, obj):
#         user = getattr(obj, 'created_by', None)
#         if not user:
#             return None

#         if hasattr(user, 'get_full_name'):
#             name = user.get_full_name()
#             if name:
#                 return name

#         return getattr(user, 'username', None) or getattr(user, 'email', None)

#     def get_client_group_name(self, obj):
#         client = obj.client
#         if not client:
#             return None

#         # ManyToMany reverse relation
#         group = client.client_groups_membership.filter(is_active=True).first()
#         return group.group_name if group else None

#     def get_assigned_user_ids(self, obj):
#         return list(
#             obj.assignments
#             .filter(is_active=True)
#             .values_list("user_id", flat=True)
#         )

# class TaskListSerializer(serializers.ModelSerializer):
#     client = serializers.PrimaryKeyRelatedField(read_only=True)
#     sub_service = serializers.PrimaryKeyRelatedField(read_only=True)
#     spoc = serializers.PrimaryKeyRelatedField(read_only=True)
#     team = serializers.PrimaryKeyRelatedField(read_only=True)

#     client_name = serializers.CharField(source="client.name", read_only=True)
#     sub_service_name = serializers.CharField(source="sub_service.name", read_only=True)
#     spoc_name = serializers.CharField(source="spoc.name", read_only=True)
#     team_name = serializers.CharField(source="team.name", read_only=True)

#     created_by_name = serializers.SerializerMethodField()
#     client_group_name = serializers.SerializerMethodField()
#     assigned_user_ids = serializers.SerializerMethodField()

#     # 🔥 NEW
#     has_my_time_entry = serializers.SerializerMethodField()
#     time_entry_user_ids = serializers.SerializerMethodField()

#     created_by_id = serializers.IntegerField(source="created_by.id", read_only=True)

#     class Meta:
#         model = Task
#         fields = [
#             "id",
#             "task_id",
#             "client",
#             "sub_service",
#             "spoc",
#             "team",

#             "client_name",
#             "client_group_name",
#             "sub_service_name",
#             "spoc_name",
#             "team_name",

#             "status",
#             "period",
#             "due_date",
#             "created_at",
#             "created_by_name",
#             "created_by_id",
#             "assigned_user_ids",

#             # 🔥 lightweight time entry info
#             "has_my_time_entry",
#             "time_entry_user_ids",
#         ]

#     # -------------------------
#     # FAST HELPERS
#     # -------------------------

#     def get_created_by_name(self, obj):
#         user = obj.created_by
#         if not user:
#             return None
#         return (
#             user.get_full_name()
#             or getattr(user, "username", None)
#             or getattr(user, "email", None)
#         )

#     def get_client_group_name(self, obj):
#         client = obj.client
#         if not client:
#             return None

#         groups = getattr(client, "client_groups_membership", None)
#         if not groups:
#             return None

#         for g in groups.all():
#             if g.is_active:
#                 return g.group_name
#         return None

#     def get_assigned_user_ids(self, obj):
#         assignments = getattr(obj, "assignments", None)
#         if not assignments:
#             return []
#         return [a.user_id for a in assignments.all() if a.is_active]

#     # -------------------------
#     # 🔥 TIME ENTRY HELPERS
#     # -------------------------

#     def get_time_entry_user_ids(self, obj):
#         entries = getattr(obj, "time_entries", None)
#         if not entries:
#             return []
#         return list(
#             entries.all().values_list("employee_id", flat=True)
#         )

#     def get_has_my_time_entry(self, obj):
#         request = self.context.get("request")
#         if not request or not request.user:
#             return False

#         user_id = request.user.id
#         entries = getattr(obj, "time_entries", None)
#         if not entries:
#             return False

#         return entries.filter(employee_id=user_id).exists()

# class TaskListSerializer(serializers.ModelSerializer):
#     client = serializers.PrimaryKeyRelatedField(read_only=True)
#     sub_service = serializers.PrimaryKeyRelatedField(read_only=True)
#     spoc = serializers.PrimaryKeyRelatedField(read_only=True)
#     team = serializers.PrimaryKeyRelatedField(read_only=True)

#     client_name = serializers.CharField(source="client.name", read_only=True)
#     sub_service_name = serializers.CharField(source="sub_service.name", read_only=True)
#     spoc_name = serializers.CharField(source="spoc.name", read_only=True)
#     team_name = serializers.CharField(source="team.name", read_only=True)

#     created_by_name = serializers.SerializerMethodField()
#     client_group_name = serializers.SerializerMethodField()
#     assigned_user_ids = serializers.SerializerMethodField()

#     has_my_time_entry = serializers.SerializerMethodField()
#     time_entry_user_ids = serializers.SerializerMethodField()

#     created_by_id = serializers.IntegerField(source="created_by.id", read_only=True)

#     # ✅ Add this
#     total_hours = serializers.SerializerMethodField()

#     class Meta:
#         model = Task
#         fields = [
#             "id",
#             "task_id",
#             "client",
#             "sub_service",
#             "spoc",
#             "team",

#             "client_name",
#             "client_group_name",
#             "sub_service_name",
#             "spoc_name",
#             "team_name",

#             "status",
#             "period",
#             "due_date",
#             "created_at",
#             "created_by_name",
#             "created_by_id",
#             "assigned_user_ids",

#             "has_my_time_entry",
#             "time_entry_user_ids",

#             # ✅ Add this
#             "total_hours",
#         ]

#     def get_created_by_name(self, obj):
#         user = obj.created_by
#         if not user:
#             return None
#         return (
#             user.get_full_name()
#             or getattr(user, "username", None)
#             or getattr(user, "email", None)
#         )

#     def get_client_group_name(self, obj):
#         client = obj.client
#         if not client:
#             return None
#         groups = getattr(client, "client_groups_membership", None)
#         if not groups:
#             return None
#         for g in groups.all():
#             if g.is_active:
#                 return g.group_name
#         return None

#     def get_assigned_user_ids(self, obj):
#         assignments = getattr(obj, "assignments", None)
#         if not assignments:
#             return []
#         return [a.user_id for a in assignments.all() if a.is_active]

#     def get_time_entry_user_ids(self, obj):
#         entries = getattr(obj, "time_entries", None)
#         if not entries:
#             return []
#         return list(entries.all().values_list("employee_id", flat=True))

#     # def get_has_my_time_entry(self, obj):
#     #     request = self.context.get("request")
#     #     if not request or not request.user:
#     #         return False
#     #     user_id = request.user.id
#     #     entries = getattr(obj, "time_entries", None)
#     #     if not entries:
#     #         return False
#     #     return entries.filter(employee_id=user_id).exists()

#     # AFTER — pure Python, uses prefetch cache
#     def get_has_my_time_entry(self, obj):
#         request = self.context.get("request")
#         if not request or not request.user:
#             return False
#         user_id = request.user.id
#         return any(
#             e.employee_id == user_id
#             for e in obj.time_entries.all()  # free — already in prefetch cache
#         )

#     # ✅ Add this method
#     # def get_total_hours(self, obj):
#     #     entries = getattr(obj, "time_entries", None)
#     #     if not entries:
#     #         return 0
#     #     total_seconds = 0
#     #     for entry in entries.all():  # free — already prefetched
#     #         if entry.start_time and entry.end_time:
#     #             diff = (entry.end_time - entry.start_time).total_seconds()
#     #             if diff > 0:
#     #                 total_seconds += diff
#     #     return total_seconds / 3600  # decimal hours, e.g. 1.5 = 1h 30m

#     def get_total_hours(self, obj):
#         total_seconds = 0
#         for entry in obj.time_entries.all():  # already prefetched
#             if entry.start_time and entry.end_time:
#                 diff = (entry.end_time - entry.start_time).total_seconds()
#                 if diff > 0:
#                     total_seconds += diff
#         return total_seconds / 3600


# class TaskSerializer(serializers.ModelSerializer):
#     # assigned_to_name = serializers.CharField(
#     #     source='assigned_to.get_full_name',
#     #     read_only=True
#     # )

#     assignments = TaskAssignmentSerializer(many=True, read_only=True)


#     time_entries = TaskTimeEntrySerializer(many=True, read_only=True)

#     created_by_username = serializers.SerializerMethodField(read_only=True)

#     proof_file = serializers.FileField(
#         use_url=True,
#         required=False,
#         allow_null=True
#     )

#     marked_done_by_name = serializers.SerializerMethodField(read_only=True)

#     class Meta:
#         model = Task
#         fields = [
#             'id', 'task_id', 'client', 'sub_service', 'spoc', 'team',
#             'status', 'period', 'due_date',
#             'employee_id', 'comments', 'total_hours',
#             'start_time', 'end_time',
#             'file', 'proof_file',
#             'created_at', 'updated_at',
#             'marked_done_by', 'marked_done_by_name', 'marked_done_at',
#             # 'assigned_to', 'assigned_to_name', 'assigned_at',
#             'time_entries', 'assignments',
#             'created_by_username'
#         ]
#         read_only_fields = [
#             "total_hours",
#             "marked_done_by",
#             "marked_done_by_name",
#             "marked_done_at",
#         ]

#     # -------------------------
#     # READ HELPERS
#     # -------------------------
#     def get_created_by_username(self, obj):
#         user = getattr(obj, 'created_by', None)
#         if not user:
#             return None

#         if hasattr(user, 'get_full_name'):
#             name = user.get_full_name()
#             if name:
#                 return name

#         return getattr(user, 'username', None) or getattr(user, 'email', None)

#     def get_marked_done_by_name(self, obj):
#         user = obj.marked_done_by
#         if not user:
#             return None

#         if hasattr(user, 'get_full_name'):
#             name = user.get_full_name()
#             if name:
#                 return name

#         return getattr(user, 'username', None) or getattr(user, 'email', None)

#     # -------------------------
#     # UPDATE (🔥 CRITICAL PART)
#     # -------------------------
#     def update(self, instance, validated_data):
#         request = self.context.get("request")
#         user = request.user if request else None
#         role = (getattr(user, "role", "") or "").lower()

#         # 🔒 Handle assignment safely
#         new_assignee = validated_data.get("assigned_to", None)
#         old_assignee = instance.assigned_to

#         # ❌ If user is NOT allowed → block assignment change
#         if "assigned_to" in validated_data and role not in ASSIGN_ROLES:
#             validated_data.pop("assigned_to", None)

#         if validated_data.get("status") == "Done":
#             if not instance.time_entries.exists():
#                 raise ValidationError({
#                     "status": "You must add at least one time entry before completing the task."
#                 })

#         # 🚫 Block adding time after Done
#         if instance.status == "Done" and "status" not in validated_data:
#             raise ValidationError("Completed tasks cannot be modified.")

#         # Apply normal field updates
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)

#         # Save with your existing audit logic
#         instance.save(user=user)

#         # ✅ If assignment changed AND user is allowed → store history
#         if (
#             "assigned_to" in validated_data
#             and role in ASSIGN_ROLES
#             and new_assignee != old_assignee
#         ):
#             instance.assigned_at = timezone.now()
#             instance.save(update_fields=["assigned_at"])

#             TaskAssignmentHistory.objects.create(
#                 task=instance,
#                 assigned_from=old_assignee,
#                 assigned_to=new_assignee,
#                 assigned_by=user,
#             )

#         return instance

#     def validate(self, attrs):
#         # 🔥 Only run on CREATE
#         if self.instance is not None:
#             return attrs

#         client = attrs.get("client")
#         sub_service = attrs.get("sub_service")
#         period = attrs.get("period")
#         due_date = attrs.get("due_date")
#         team = attrs.get("team")
#         spoc = attrs.get("spoc")

#         existing = Task.objects.filter(
#             client=client,
#             sub_service=sub_service,
#             period=period,
#             due_date=due_date,
#             team=team,
#             spoc=spoc,
#         ).first()

#         if existing:
#             raise ValidationError({
#                 "non_field_errors": [
#                     f"Activity is already created in {existing.task_id}"
#                 ]
#             })

#         return attrs


#     # def create(self, validated_data):
#     #     request = self.context.get("request")
#     #     user = request.user if request else None
#     #     role = (getattr(user, "role", "") or "").lower()

#     #     assigned_to = validated_data.get("assigned_to", None)

#     #     # 🔒 Block assignment if role not allowed
#     #     if assigned_to and role not in ASSIGN_ROLES:
#     #         validated_data.pop("assigned_to", None)
#     #         assigned_to = None

#     #     task = Task.objects.create(
#     #         **validated_data,
#     #         created_by=user,
#     #         assigned_at=timezone.now() if assigned_to else None
#     #     )

#     #     # 🧾 Create assignment history (only if assigned)
#     #     if assigned_to and role in ASSIGN_ROLES:
#     #         TaskAssignmentHistory.objects.create(
#     #             task=task,
#     #             assigned_from=None,
#     #             assigned_to=assigned_to,
#     #             assigned_by=user
#     #         )

#     #     return task


# class TaskAssignmentHistorySerializer(serializers.ModelSerializer):
#     assignments = TaskAssignmentSerializer(many=True, read_only=True)

#     assigned_from_name = serializers.CharField(
#         source="assigned_from.get_full_name",
#         read_only=True
#     )
#     assigned_to_name = serializers.CharField(
#         source="assigned_to.get_full_name",
#         read_only=True
#     )
#     assigned_by_name = serializers.CharField(
#         source="assigned_by.get_full_name",
#         read_only=True
#     )

#     class Meta:
#         model = TaskAssignmentHistory
#         fields = "__all__"


# ══════════════════════════════════════════════════════
#  TaskListSerializer  — lightweight, used for list action
#  All SerializerMethodFields use prefetch cache (no extra DB hits)
# ══════════════════════════════════════════════════════

class TaskListSerializer(serializers.ModelSerializer):
    client      = serializers.PrimaryKeyRelatedField(read_only=True)
    sub_service = serializers.PrimaryKeyRelatedField(read_only=True)
    spoc        = serializers.PrimaryKeyRelatedField(read_only=True)
    team        = serializers.PrimaryKeyRelatedField(read_only=True)

    # ── These use select_related so no extra query ────────────────────────────
    client_name      = serializers.CharField(source="client.name",       read_only=True)
    sub_service_name = serializers.CharField(source="sub_service.name",  read_only=True)
    spoc_name        = serializers.CharField(source="spoc.name",         read_only=True)
    team_name        = serializers.CharField(source="team.name",         read_only=True)
    created_by_id    = serializers.IntegerField(source="created_by.id",  read_only=True)

    # ── SerializerMethodFields — all pure Python, use prefetch cache ──────────
    created_by_name    = serializers.SerializerMethodField()
    client_group_name  = serializers.SerializerMethodField()
    assigned_user_ids  = serializers.SerializerMethodField()
    has_my_time_entry  = serializers.SerializerMethodField()
    time_entry_user_ids = serializers.SerializerMethodField()
    total_hours        = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "task_id",
            "client",
            "sub_service",
            "spoc",
            "team",

            "client_name",
            "client_group_name",
            "sub_service_name",
            "spoc_name",
            "team_name",

            "status",
            "period",
            "due_date",
            "created_at",
            "created_by_name",
            "created_by_id",
            "assigned_user_ids",

            "has_my_time_entry",
            "time_entry_user_ids",
            "total_hours",
        ]

    def get_created_by_name(self, obj):
        user = obj.created_by
        if not user:
            return None
        return (
            user.get_full_name()
            or getattr(user, "username", None)
            or getattr(user, "email", None)
        )

    def get_client_group_name(self, obj):
        # Uses prefetch_related('client__client_groups_membership')
        client = obj.client
        if not client:
            return None
        groups = getattr(client, "client_groups_membership", None)
        if not groups:
            return None
        # .all() hits prefetch cache — zero extra queries
        for g in groups.all():
            if g.is_active:
                return g.group_name
        return None

    def get_assigned_user_ids(self, obj):
        # Uses prefetch_related('assignments') — zero extra queries
        return [
            a.user_id
            for a in obj.assignments.all()
            if a.is_active
        ]

    def get_time_entry_user_ids(self, obj):
        # Uses prefetch_related('time_entries') — zero extra queries
        return [e.employee_id for e in obj.time_entries.all()]

    def get_has_my_time_entry(self, obj):
        # Pure Python over prefetch cache — zero extra queries
        request = self.context.get("request")
        if not request or not request.user:
            return False
        user_id = request.user.id
        return any(e.employee_id == user_id for e in obj.time_entries.all())

    def get_total_hours(self, obj):
        # Pure Python over prefetch cache — zero extra queries
        total_seconds = 0
        for entry in obj.time_entries.all():
            if entry.start_time and entry.end_time:
                diff = (entry.end_time - entry.start_time).total_seconds()
                if diff > 0:
                    total_seconds += diff
        return round(total_seconds / 3600, 2)


# ══════════════════════════════════════════════════════
#  TaskSerializer  — full, used for retrieve / update / create
# ══════════════════════════════════════════════════════

class TaskSerializer(serializers.ModelSerializer):
    assignments  = TaskAssignmentSerializer(many=True, read_only=True)
    time_entries = TaskTimeEntrySerializer(many=True, read_only=True)

    created_by_username = serializers.SerializerMethodField(read_only=True)

    proof_file = serializers.FileField(
        use_url=True,
        required=False,
        allow_null=True,
    )

    client_name      = serializers.CharField(source='client.name',        read_only=True)
    sub_service_name = serializers.CharField(source='sub_service.name',   read_only=True)
    spoc_name        = serializers.CharField(source='spoc.name',          read_only=True)
    team_name        = serializers.CharField(source='team.name',          read_only=True)

    marked_done_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'task_id', 'client', 'sub_service', 'spoc', 'team',
            'client_name', 'sub_service_name', 'spoc_name', 'team_name',    
            'status', 'period', 'due_date',
            'employee_id', 'comments', 'total_hours',
            'start_time', 'end_time',
            'file', 'proof_file',
            'created_at', 'updated_at',
            'marked_done_by', 'marked_done_by_name', 'marked_done_at',
            'time_entries', 'assignments',
            'created_by_username',
        ]
        read_only_fields = [
            "total_hours",
            "marked_done_by",
            "marked_done_by_name",
            "marked_done_at",
        ]

    def get_created_by_username(self, obj):
        user = getattr(obj, 'created_by', None)
        if not user:
            return None
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name:
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None)

    def get_marked_done_by_name(self, obj):
        user = obj.marked_done_by
        if not user:
            return None
        if hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name:
                return name
        return getattr(user, 'username', None) or getattr(user, 'email', None)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user    = request.user if request else None
        role    = (getattr(user, "role", "") or "").lower()

        new_assignee = validated_data.get("assigned_to", None)
        old_assignee = instance.assigned_to

        if "assigned_to" in validated_data and role not in ASSIGN_ROLES:
            validated_data.pop("assigned_to", None)

        if validated_data.get("status") == "Done":
            if not instance.time_entries.exists():
                raise ValidationError({
                    "status": "You must add at least one time entry before completing the task."
                })

        if instance.status == "Done" and "status" not in validated_data:
            raise ValidationError("Completed tasks cannot be modified.")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save(user=user)

        if (
            "assigned_to" in validated_data
            and role in ASSIGN_ROLES
            and new_assignee != old_assignee
        ):
            instance.assigned_at = timezone.now()
            instance.save(update_fields=["assigned_at"])

            TaskAssignmentHistory.objects.create(
                task=instance,
                assigned_from=old_assignee,
                assigned_to=new_assignee,
                assigned_by=user,
            )

        return instance

    def validate(self, attrs):
        # Only run on CREATE
        if self.instance is not None:
            return attrs

        existing = Task.objects.filter(
            client=attrs.get("client"),
            sub_service=attrs.get("sub_service"),
            period=attrs.get("period"),
            due_date=attrs.get("due_date"),
            team=attrs.get("team"),
            spoc=attrs.get("spoc"),
        ).first()

        if existing:
            raise ValidationError({
                "non_field_errors": [
                    f"Activity is already created in {existing.task_id}"
                ]
            })

        return attrs


# ══════════════════════════════════════════════════════
#  TaskAssignmentHistorySerializer  — unchanged
# ══════════════════════════════════════════════════════

class TaskAssignmentHistorySerializer(serializers.ModelSerializer):
    assignments = TaskAssignmentSerializer(many=True, read_only=True)

    assigned_from_name = serializers.CharField(
        source="assigned_from.get_full_name", read_only=True
    )
    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    assigned_by_name = serializers.CharField(
        source="assigned_by.get_full_name", read_only=True
    )

    class Meta:
        model  = TaskAssignmentHistory
        fields = "__all__"
    
    
# class SACSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SAC
#         fields = ['id', 'code', 'description']

class CompanySerializer(serializers.ModelSerializer):

    class Meta:
        model = Company
        fields = '__all__'

###############################################################################################



class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileUpload
        fields = '__all__'

# serializers.py
from rest_framework import serializers
from .models import Process, Section, Step

class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ['id', 'description']

class SectionSerializer(serializers.ModelSerializer):
    items = StepSerializer(many=True)

    class Meta:
        model = Section
        fields = ['id', 'title', 'items']
# clients/serializers.py
from rest_framework import serializers
from .models import Process

class ProcessSerializer(serializers.ModelSerializer):
    sop_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Process
        fields = ['id', 'name', 'sop_file', 'sop_file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_sop_file_url(self, obj):
        request = self.context.get('request')
        if obj.sop_file:
            return request.build_absolute_uri(obj.sop_file.url)
        return None

# # documents/serializers.py
# from rest_framework import serializers
# from .models import Document

# class DocumentSerializer(serializers.ModelSerializer):
#     file_url = serializers.SerializerMethodField()

#     class Meta:
#         model = Document
#         # Removed 'category' from fields
#         fields = ['id', 'file', 'file_name', 'uploaded_at', 'is_folder', 'parent_folder', 'owner', 'file_url', 'department',]
#         read_only_fields = ['uploaded_at', 'file_url', 'owner', 'department']

#     def get_file_url(self, obj):
#         request = self.context.get('request')
#         if obj.file and hasattr(obj.file, 'url'):
#             return request.build_absolute_uri(obj.file.url)
#         return None

#     def validate(self, data):
#         if data.get('is_folder'):
#             if data.get('file'):
#                 raise serializers.ValidationError("Folders cannot have a file attached.")
#             if not data.get('file_name'):
#                 raise serializers.ValidationError("Folder must have a name.")
#         else: # It's a file
#             if not data.get('file'):
#                 raise serializers.ValidationError("File must be provided for a document.")
#         return data

from rest_framework import serializers
from .models import Document, Company
from account.serializers import UserSerializer

class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_location = serializers.SerializerMethodField()
    owner = UserSerializer(read_only=True)
    deleted_by = UserSerializer(read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'file', 'file_name', 'uploaded_at', 'is_folder',
            'parent_folder', 'owner', 'file_url', 'deleted_by',
            'is_deleted', 'deleted_at', 'is_public_root', 'is_private_root', 'file_location',
        ]
        read_only_fields = [
            'uploaded_at', 'file_url', 'owner', 'deleted_at', 'is_public_root', 'is_private_root'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_location(self, obj):
        # Walk up the parent folders to build the path
        path = []
        current = obj.parent_folder
        while current:
            path.insert(0, current.file_name)
            current = current.parent_folder
        return "/" + "/".join(path) if path else "Root"

    def validate(self, data):
    # --- Existing file/folder checks ---
        if data.get('is_folder'):
            if data.get('file'):
                raise serializers.ValidationError("Folders cannot have a file attached.")
            if not data.get('file_name'):
                raise serializers.ValidationError("Folder must have a name.")
        else:
            if not self.instance and not data.get('file'):
                raise serializers.ValidationError("File must be provided for a document (on creation).")

        # --- Root folder restrictions ---
        if self.instance and (self.instance.is_public_root or self.instance.is_private_root):
            if 'file_name' in data and data['file_name'] != self.instance.file_name:
                user = self.context['request'].user
                if user.role not in ["Admin", "Founder"]:
                    raise serializers.ValidationError(
                        f"Only Admin or Founder can rename the root folder '{self.instance.file_name}'."
                    )


        return data

        

class DepartmentMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentMessage
        fields = ['id', 'department', 'message', 'created_at']


# class CompanySerializer(serializers.ModelSerializer):

#     class Meta:
#         model = Company
#         fields = '__all__'

from rest_framework import serializers
from django.db import transaction
from .models import Invoice, InvoiceItem, Client, RecurringInvoice, RecurringInvoiceItem
# from django.contrib.auth import get_user_model

# User = get_user_model()

class InvoiceItemSerializer(serializers.ModelSerializer):
    sac_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = InvoiceItem
        fields = ['sac_code', 'particulars', 'amount']

    def create(self, validated_data):
        # Amount encryption is handled in the model setter
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Amount encryption is handled in the model setter
        return super().update(instance, validated_data)


# class InvoiceSerializer(serializers.ModelSerializer):
#     items = InvoiceItemSerializer(many=True)
#     created_by_name = serializers.SerializerMethodField(read_only=True)

#     client_id = serializers.PrimaryKeyRelatedField(
#         queryset=Client.objects.all(),
#         source='client',
#         write_only=True,
#         required=False,
#         allow_null=True
#     )

#     client_obj = serializers.SerializerMethodField(read_only=True)
#     ref_invoice_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)

#     # Expose amount fields as decimals for the API
#     amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     sub_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     cgst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     sgst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     igst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     partial_payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     final_payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
#     balance_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

#     class Meta:
#         model = Invoice
#         fields = [
#             'id', 'invoice_no', 'date', 'amount', 'status', 'gst_type', 'category', 'document_type',
#             'client', 'client_id', 'client_obj', 'client_name', 'client_address', 'ref_invoice_number',
#             'client_gstin', 'sub_total', 'cgst', 'sgst', 'igst', 'items', 'created_by_name', 'downloaded_at', 'is_downloaded', 
#             'partial_payment_amount', 'final_payment_amount', 'balance_amount', 'payment_mode', 'payment_details'
#         ]
#         read_only_fields = ['id', 'invoice_no', 'client', 'created_by_name', 'client_obj', 'balance_amount']

#     def get_client_obj(self, obj):
#         if obj.client:
#             return {
#                 'id': obj.client.id,
#                 'name': obj.client.name,
#                 'address': obj.client.address,
#                 'gstin': obj.client.gstin
#             }
#         return None

#     def get_created_by_name(self, obj):
#         if obj.created_by:
#             if obj.created_by.first_name and obj.created_by.last_name:
#                 return f"{obj.created_by.first_name} {obj.created_by.last_name}"
#             return obj.created_by.username
#         return "N/A"

#     def create(self, validated_data):
#         items_data = validated_data.pop('items', [])
#         client = validated_data.get('client')

#         if client:
#             validated_data['client_name'] = validated_data.get('client_name') or client.name
#             validated_data['client_address'] = validated_data.get('client_address') or client.address
#             validated_data['client_gstin'] = validated_data.get('client_gstin') or client.gstin

#         with transaction.atomic():
#             invoice = Invoice.objects.create(**validated_data)
#             for item_data in items_data:
#                 InvoiceItem.objects.create(invoice=invoice, **item_data)
#         return invoice

#     def update(self, instance, validated_data):
#         items_data = validated_data.pop('items', None)
#         with transaction.atomic():
#             for field in ['date', 'status', 'gst_type', 'category', 'document_type', 
#                           'client', 'client_name', 'client_address', 'client_gstin', 
#                           'ref_invoice_number', 'amount', 'sub_total', 'cgst', 'sgst', 'igst', 
#                           'partial_payment_amount', 'final_payment_amount', 'payment_mode', 'payment_details']:
#                 if field in validated_data:
#                     setattr(instance, field, validated_data[field])

#             instance.save()  # encrypts amounts automatically

#             if items_data is not None:
#                 instance.items.all().delete()
#                 for item_data in items_data:
#                     InvoiceItem.objects.create(invoice=instance, **item_data)

#         return instance


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)   # ADD

    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )

    client_obj = serializers.SerializerMethodField(read_only=True)
    ref_invoice_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # Expose amount fields as decimals for the API
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    sub_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    cgst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    sgst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    igst = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    partial_payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    final_payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    balance_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    applicable_tax_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2,
        required=False, allow_null=True
    )
    cess_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        required=False, allow_null=True
    )

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_no', 'date', 'amount', 'status', 'gst_type', 'category', 'document_type',
            'client', 'client_id', 'client_obj', 'client_name', 'client_address', 'ref_invoice_number',
            'client_gstin', 'sub_total', 'cgst', 'sgst', 'igst', 'items', 'created_by_name',
            'partial_payment_amount', 'final_payment_amount', 'balance_amount', 'payment_mode', 'payment_details', 'downloaded_at', 'is_downloaded',
            'approver_signature', 'approved_by_name', 'approved_at', 'approved_by', 'place_of_supply', 'reverse_charge', 'ecommerce_gstin', 'invoice_type',
            'applicable_tax_rate', 'cess_amount',
        ]
        read_only_fields = ['id', 'invoice_no', 'client', 'created_by_name', 'client_obj', 'balance_amount', 'approver_signature', 'approved_by_name', 'approved_at', 'approed_by']  # ADD 'approved_by_name' and 'approved_at' to read-only fields

    def get_client_obj(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.name,
                'address': obj.client.address,
                'gstin': obj.client.gstin
            }
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            if obj.created_by.first_name and obj.created_by.last_name:
                return f"{obj.created_by.first_name} {obj.created_by.last_name}"
            return obj.created_by.username
        return "N/A"
    
    def get_approved_by_name(self, obj):           # ADD
        if obj.approved_by:
            name = f"{obj.approved_by.first_name or ''} {obj.approved_by.last_name or ''}".strip()
            return name or obj.approved_by.email
        return None

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        client = validated_data.get('client')

        if client:
            validated_data['client_name'] = validated_data.get('client_name') or client.name
            validated_data['client_address'] = validated_data.get('client_address') or client.address
            validated_data['client_gstin'] = validated_data.get('client_gstin') or client.gstin

        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        with transaction.atomic():
            for field in ['date', 'status', 'gst_type', 'category', 'document_type', 
                          'client', 'client_name', 'client_address', 'client_gstin', 'place_of_supply', 'reverse_charge', 'ecommerce_gstin', 'invoice_type',
                          'ref_invoice_number', 'amount', 'sub_total', 'cgst', 'sgst', 'igst', 'applicable_tax_rate', 'cess_amount',
                          'partial_payment_amount', 'final_payment_amount', 'payment_mode', 'payment_details']:
                if field in validated_data:
                    setattr(instance, field, validated_data[field])

            instance.save()  # encrypts amounts automatically

            if items_data is not None:
                instance.items.all().delete()
                for item_data in items_data:
                    InvoiceItem.objects.create(invoice=instance, **item_data)

        return instance



class SttRecordPickerSerializer(serializers.ModelSerializer):
    """
    Lightweight Task serializer for the invoice generator picker.
    Only returns tasks that belong to the client and have no invoice linked yet.
    """
    sub_service_name = serializers.CharField(
        source='sub_service.name',
        read_only=True,
    )
 
    class Meta:
        model  = Task
        fields = [
            'id',
            'task_id',
            'sub_service_name',
            'period',
            'due_date',
            'status',
            'invoice_no',    # new field — null means not yet billed
            'invoice_date',  # new field
        ]
 
 
class UdinPickerSerializer(serializers.ModelSerializer):
    """
    Lightweight UDIN serializer for the invoice generator picker.
    Only returns records that belong to the client and have no invoice linked yet.
    fee / proposed_fee are encrypted — expose via SerializerMethodField.
    """
    fee_display          = serializers.SerializerMethodField()
    proposed_fee_display = serializers.SerializerMethodField()
 
    def get_fee_display(self, obj):
        try:
            return float(obj.fee) if obj.fee is not None else None
        except Exception:
            return None
 
    def get_proposed_fee_display(self, obj):
        try:
            return float(obj.proposed_fee) if obj.proposed_fee is not None else None
        except Exception:
            return None
 
    class Meta:
        model  = UDINRecord
        fields = [
            'id',
            'internal_ref_no',
            'client_name',
            'date_of_udin',
            'attestation_type',
            'period_type',
            'period_start_date',
            'period_end_date',
            'udin_no',
            'fee_display',
            'proposed_fee_display',
            'fee_status',
            'invoice_no',    # existing field — null means not yet billed
            'invoice_date',  # existing field
            'is_done',
        ]
 

# class RecurringInvoiceItemSerializer(serializers.ModelSerializer):
#     # Accept decimal on input
#     amount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
#     # Expose decrypted amount for read
#     display_amount = serializers.SerializerMethodField()

#     class Meta:
#         model = RecurringInvoiceItem
#         fields = ['particulars', 'sac_code', 'amount', 'display_amount']

#     def get_display_amount(self, obj):
#         return obj.amount  # already returns Decimal

#     def create(self, validated_data):
#         amount = validated_data.pop('amount', None)
#         item = RecurringInvoiceItem(**validated_data)
#         if amount is not None:
#             item.amount = amount  # encrypt and store in _amount
#         item.save()
#         return item


# class RecurringInvoiceSerializer(serializers.ModelSerializer):
#     client = serializers.PrimaryKeyRelatedField(
#         queryset=Client.objects.all(), required=False, allow_null=True
#     )
#     next_invoice_date = serializers.DateField(required=False, allow_null=True)
#     items = RecurringInvoiceItemSerializer(many=True)
#     created_by = serializers.PrimaryKeyRelatedField(read_only=True)  # add this

#     class Meta:
#         model = RecurringInvoice
#         fields = '__all__'

#     def create(self, validated_data):
#         items_data = validated_data.pop('items', [])

#         if not validated_data.get("next_invoice_date"):
#             validated_data["next_invoice_date"] = validated_data.get("start_date")

#         invoice = super().create(validated_data)

#         for item_data in items_data:
#             item_serializer = RecurringInvoiceItemSerializer(data={**item_data, 'invoice': invoice.id})
#             item_serializer.is_valid(raise_exception=True)
#             item_serializer.save(invoice=invoice)

#         return invoice

#     def update(self, instance, validated_data):
#         items_data = validated_data.pop('items', [])

#         # Update main RecurringInvoice fields
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()

#         # Update items: simple approach = delete existing and recreate
#         instance.items.all().delete()
#         for item_data in items_data:
#             item_serializer = RecurringInvoiceItemSerializer(data={**item_data, 'invoice': instance.id})
#             item_serializer.is_valid(raise_exception=True)
#             item_serializer.save(invoice=instance)

#         return instance


# class RecurringInvoiceItemSerializer(serializers.ModelSerializer):
#     amount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
#     display_amount = serializers.SerializerMethodField()

#     class Meta:
#         model = RecurringInvoiceItem
#         fields = ['particulars', 'sac_code', 'amount', 'display_amount']

#     def get_display_amount(self, obj):
#         return obj.amount


# class RecurringInvoiceSerializer(serializers.ModelSerializer):
#     client = serializers.PrimaryKeyRelatedField(
#         queryset=Client.objects.all(), required=False, allow_null=True
#     )
#     next_invoice_date = serializers.DateField(required=False, allow_null=True)
#     items = RecurringInvoiceItemSerializer(many=True)
#     created_by = serializers.PrimaryKeyRelatedField(read_only=True)
#     created_by_name = serializers.SerializerMethodField()

#     class Meta:
#         model = RecurringInvoice
#         fields = '__all__'

#     def get_created_by_name(self, obj):
#         if obj.created_by:
#             name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
#             return name or obj.created_by.username
#         return '—'

#     def _save_items(self, invoice, items_data):
#         for item_data in items_data:
#             if not item_data.get('particulars') or not item_data.get('sac_code'):
#                 continue
#             amount = item_data.pop('amount', None)
#             item = RecurringInvoiceItem(invoice=invoice, **item_data)
#             if amount is not None:
#                 item.amount = amount
#             item.save()

#     def create(self, validated_data):
#         items_data = validated_data.pop('items', [])
#         if not validated_data.get("next_invoice_date"):
#             validated_data["next_invoice_date"] = validated_data.get("start_date")
#         invoice = RecurringInvoice.objects.create(**validated_data)
#         self._save_items(invoice, items_data)
#         return invoice

#     def update(self, instance, validated_data):
#         items_data = validated_data.pop('items', [])
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         instance.items.all().delete()
#         self._save_items(instance, items_data)
#         return instance


from decimal import Decimal
from rest_framework import serializers
from .models import RecurringInvoice, RecurringInvoiceItem


# ─── Item serializer ──────────────────────────────────────────────────────────

class RecurringInvoiceItemSerializer(serializers.ModelSerializer):
    """
    Handles the encrypted `amount` property and exposes a plain
    `display_amount` for the frontend to render.
    `gst_rate` is stored on the item and driven by the parent's gst_type.
    """

    # Write-only: accepts the raw number from the frontend
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        write_only=True, required=False,
    )

    # Read-only: decrypted value returned to the frontend
    display_amount = serializers.SerializerMethodField()

    def get_display_amount(self, obj):
        try:
            return float(obj.amount or 0)
        except Exception:
            return 0.0

    class Meta:
        model  = RecurringInvoiceItem
        fields = [
            "id",
            "particulars",
            "sac_code",
            "amount",        # write-only (encrypted on save)
            "display_amount",# read-only  (decrypted for display)
            "gst_rate",
        ]


# ─── Recurring invoice serializer ────────────────────────────────────────────

class RecurringInvoiceSerializer(serializers.ModelSerializer):
    items           = RecurringInvoiceItemSerializer(many=True)
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        if obj.created_by:
            full = obj.created_by.get_full_name()
            return full if full else obj.created_by.email
        return None

    class Meta:
        model  = RecurringInvoice
        fields = [
            "id",
            "client",
            "client_name",
            "gst_type",
            "frequency",
            "start_date",
            "next_invoice_date",
            "is_active",
            "items",
            "created_by",
            "created_by_name",
        ]
        read_only_fields = ["next_invoice_date", "created_by", "created_by_name"]

    # ── Create ────────────────────────────────────────────────────────────────
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])

        # next_invoice_date defaults to start_date on first creation
        if "next_invoice_date" not in validated_data:
            validated_data["next_invoice_date"] = validated_data.get("start_date")

        recurring = RecurringInvoice.objects.create(**validated_data)

        for item_data in items_data:
            amount   = item_data.pop("amount", Decimal("0.00"))
            gst_rate = item_data.pop("gst_rate", Decimal("0.00"))

            obj          = RecurringInvoiceItem(invoice=recurring, gst_rate=gst_rate, **item_data)
            obj.amount   = amount   # triggers encrypted setter
            obj.save()

        return recurring

    # ── Update ────────────────────────────────────────────────────────────────
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace items only when the frontend sends a new list
        if items_data is not None:
            instance.items.all().delete()

            for item_data in items_data:
                amount   = item_data.pop("amount", Decimal("0.00"))
                gst_rate = item_data.pop("gst_rate", Decimal("0.00"))

                obj          = RecurringInvoiceItem(invoice=instance, gst_rate=gst_rate, **item_data)
                obj.amount   = amount
                obj.save()

        return instance

from rest_framework import serializers
from django.db import transaction
from .models import Payment, Invoice

class PaymentSerializer(serializers.ModelSerializer):
    # Expose 'amount' as a decimal for API usage
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    invoice_id = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all(),
        source='invoice',
        write_only=True
    )
    invoice_no = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'invoice_id', 'invoice_no', 'amount', 'mode_of_payment', 'payment_details', 'date']
        read_only_fields = ['id', 'invoice', 'invoice_no', 'date']

    def get_invoice_no(self, obj):
        return obj.invoice.invoice_no if obj.invoice else None

    def create(self, validated_data):
        # amount encryption is handled in model setter
        with transaction.atomic():
            payment = Payment.objects.create(**validated_data)
        return payment

    def update(self, instance, validated_data):
        with transaction.atomic():
            for field in ['amount', 'mode_of_payment', 'payment_details']:
                if field in validated_data:
                    setattr(instance, field, validated_data[field])
            instance.save()  # amount encryption happens automatically
        return instance

# from .models import ClientRequest, ServiceRequest

# class ClientRequestSerializer(serializers.ModelSerializer):
#     requested_by_name = serializers.SerializerMethodField()
#     client_group_name = serializers.CharField(
#         source='client_group.group_name', read_only=True
#     )

#     class Meta:
#         model  = ClientRequest
#         fields = '__all__'
#         read_only_fields = [
#             'status', 'requested_by', 'rejection_note',
#             'created_at', 'updated_at', 'requested_by_name',
#         ]

#     def get_requested_by_name(self, obj):
#         if obj.requested_by:
#             return obj.requested_by.get_full_name() or obj.requested_by.email
#         return None


# class ServiceRequestSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = ServiceRequest
#         fields = '__all__'
#         read_only_fields = ['requested_by', 'status', 'rejection_note', 'created_at']

#     def create(self, validated_data):
#         validated_data['requested_by'] = self.context['request'].user
#         return super().create(validated_data)


from .models import ClientRequest, ServiceRequest, GroupRequest


class ClientRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    client_group_name = serializers.CharField(
        source='client_group.group_name', read_only=True
    )

    class Meta:
        model  = ClientRequest
        fields = '__all__'
        read_only_fields = [
            'status', 'requested_by', 'rejection_note',
            'created_at', 'updated_at', 'requested_by_name',
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.email
        return None


class ServiceRequestSerializer(serializers.ModelSerializer):
    requested_by_name   = serializers.SerializerMethodField()
    team_name           = serializers.CharField(source='team.name', read_only=True)
    parent_service_name = serializers.CharField(source='parent_service.name', read_only=True)

    class Meta:
        model  = ServiceRequest
        fields = '__all__'
        read_only_fields = [
            'requested_by', 'status', 'rejection_note',
            'created_at', 'requested_by_name',
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.email
        return None

    def create(self, validated_data):
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)


class GroupRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = GroupRequest
        fields = '__all__'
        read_only_fields = [
            'status', 'requested_by', 'rejection_note',
            'created_at', 'updated_at', 'requested_by_name',
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.email
        return None