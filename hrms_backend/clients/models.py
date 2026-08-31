# ─── Standard Library ─────────────────────────────────────────────────────────
import os
from math import floor
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

# ─── Django Core ──────────────────────────────────────────────────────────────
from django.db import models, transaction
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Q, F, JSONField
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.utils.timezone import now, is_aware, make_naive
from django.utils.dateparse import parse_datetime

# ─── Third Party ──────────────────────────────────────────────────────────────
from cryptography.fernet import InvalidToken

# ─── Local ────────────────────────────────────────────────────────────────────
from utils.encryption import encrypt_text, decrypt_text
from employee.models import Team

User = get_user_model()

class UDINRecord(models.Model):
    internal_ref_no = models.CharField(max_length=100, unique=True, blank=True)
    client_name = models.CharField(max_length=255)
    date_of_udin = models.DateField()
    attestation_type = models.CharField(max_length=200)
    spoc = models.ForeignKey('SPOC', null=True, blank=True, on_delete=models.SET_NULL)

    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half-Yearly'),
        ('annually', 'Annually'),
        ('not_applicable', 'Not Applicable'),
    ]
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, null=True, blank=True)
    period_start_date = models.DateField(null=True, blank=True)
    period_end_date = models.DateField(null=True, blank=True)

    _fee = models.TextField(db_column="fee", null=True, blank=True)
    # fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # proposed_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    _proposed_fee = models.TextField(db_column="proposed_fee", null=True, blank=True)

    fee_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )
    invoice_no = models.CharField(max_length=100, blank=True, null=True)
    invoice_date = models.DateField(blank=True, null=True)
    udin_no = models.CharField(max_length=100, blank=True, unique=True, null=True)
    request_by = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_done = models.BooleanField(default=False)

    @property
    def fee(self):
        if self._fee:
            try:
                return Decimal(decrypt_text(self._fee))
            except (InvalidToken, InvalidOperation, ValueError):
                return None
        return None

    @fee.setter
    def fee(self, value):
        if value is not None:
            self._fee = encrypt_text(str(value))
        else:
            self._fee = None

    @property
    def proposed_fee(self):
        if self._proposed_fee:
            return Decimal(decrypt_text(self._proposed_fee))
        return None

    @proposed_fee.setter
    def proposed_fee(self, value):
        if value is not None:
            self._proposed_fee = encrypt_text(str(value))
        else:
            self._proposed_fee = None


    def save(self, *args, **kwargs):
        # Auto-generate internal_ref_no
        if not self.id:
            today = now().date()
            year = today.year
            if today.month >= 4:
                fy_start = year
                fy_end = year + 1
            else:
                fy_start = year - 1
                fy_end = year
            fy_str = f"{fy_start}-{str(fy_end)[-2:]}"
            last = UDINRecord.objects.filter(internal_ref_no__icontains=f"-{fy_str}").order_by('-id').first()
            next_no = 1
            if last:
                try:
                    parts = last.internal_ref_no.split('-')
                    if len(parts) >= 3 and parts[1].isdigit():
                        next_no = int(parts[1]) + 1
                except:
                    pass
            self.internal_ref_no = f"CKPSCA-{next_no:03d}-{fy_str}"

        # Auto-assign spoc based on client_name
        if self.client_name and (self.spoc is None):
            from clients.models import ClientSPOC
            client_spoc = ClientSPOC.objects.filter(client__name__iexact=self.client_name)\
                                            .select_related('spoc').first()
            if client_spoc:
                self.spoc = client_spoc.spoc

        if self.fee_status == 'accepted' and self.proposed_fee is not None:
            self.fee = self.proposed_fee

        # 🔒 Encrypt proposed_fee before saving (if fee is a Decimal)
        if isinstance(self.proposed_fee, Decimal):
            self._proposed_fee = encrypt_text(str(self.proposed_fee))

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_name} - {self.internal_ref_no}"

    


class STTRecord(models.Model):
    stt_no = models.CharField(max_length=100, unique=True, blank=True)
    client_name = models.CharField(max_length=255) # Keep this as required initially
    date_of_stt = models.DateField()             # Keep this as required initially
    description = models.CharField(max_length=100) # Keep this as required initially
    spoc = models.ForeignKey('SPOC', null=True, blank=True, on_delete=models.SET_NULL)
    department = models.CharField(max_length=100, blank=True, null=True)  

    # --- NEW PERIOD FIELDS ---
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half-Yearly'),
        ('annually', 'Annually'),
        ('not_applicable', 'Not Applicable'),
    ]

    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, null=True, blank=True)
    period_start_date = models.DateField(null=True, blank=True)
    period_end_date = models.DateField(null=True, blank=True)

    # Make these fields optional
    # Removed the duplicate 'fee' field definition. Keep only one.
    SPOC_FEE_CHOICES = [
    ('monthly', 'Monthly'),
    ('quarterly', 'Quarterly'),
    ('half_yearly', 'Half-Yearly'),
    ('yearly', 'Yearly'),
    ('custom', 'Enter Fee'),
    ]

    fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    spoc_fee_type = models.CharField(max_length=20, choices=SPOC_FEE_CHOICES, null=True, blank=True, help_text="Fee type selected by SPOC")
    proposed_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fee_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    invoice_no = models.CharField(max_length=100, blank=True, null=True)
    invoice_date = models.DateField(blank=True, null=True)
    request_by = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_done = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Generate stt_no only for new records
        if not self.id:
            with transaction.atomic():
                today = now().date()
                year = today.year
                if today.month >= 4:
                    fy_start = year
                    fy_end = year + 1
                else:
                    fy_start = year - 1
                    fy_end = year
                fy_str = f"{fy_start}-{str(fy_end)[-2:]}"

                last_record = STTRecord.objects.filter(
                    stt_no__icontains=f"-{fy_str}"
                ).order_by('-id').first()

                next_number = 1
                if last_record:
                    try:
                        parts = last_record.stt_no.split('-')
                        if len(parts) >= 2 and parts[2].isdigit():
                            next_number = int(parts[2]) + 1
                    except (IndexError, ValueError):
                        pass

                self.stt_no = f"CKPSCA-STT-{next_number:04d}-{fy_str}"


        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_name} - {self.stt_no}"

# -------------------------
# SPOC Model
# -------------------------
class SPOC(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name or self.email

# -------------------------
# Constitution Model
# -------------------------
class Constitution(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Constitution"
        verbose_name_plural = "Constitutions"
        ordering = ['name']

    def __str__(self):
        return self.name

# -------------------------
# Client Model
# -------------------------
class Client(models.Model):
    name = models.CharField(max_length=255, unique=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    nature_of_business = models.CharField(max_length=255, blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    constitution = models.ForeignKey(Constitution, on_delete=models.SET_NULL, null=True, blank=True)

    # Identification Numbers
    cin = models.CharField(max_length=21, blank=True, null=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    iec = models.CharField(max_length=10, blank=True, null=True)
    ksea = models.CharField(max_length=50, blank=True, null=True)
    udyam = models.CharField(max_length=50, blank=True, null=True)
    apt = models.CharField(max_length=50, blank=True, null=True)
    ept = models.CharField(max_length=50, blank=True, null=True)
    tan = models.CharField(max_length=10, blank=True, null=True)
    lei = models.CharField(max_length=20, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):          # <-- add here
        if self.name:
            self.name = self.name.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name.upper() if self.name else ""




   
        # logo = models.ImageField(upload_to="payroll/client_logos/", null=True, blank=True)
        # email = models.EmailField(blank=True)
        # pf_establishment_code = models.CharField(max_length=40, blank=True)
        # is_active = models.BooleanField(default=True)
        # PDF_DESIGN_CHOICES = [(i, f"Design {i}") for i in range(1, 9)]
        # pdf_design = models.PositiveSmallIntegerField(choices=PDF_DESIGN_CHOICES, default=1)
    
    

# -------------------------
# Client-SPOC Mapping
# -------------------------
class ClientSPOC(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='spocs')
    spoc = models.ForeignKey(SPOC, on_delete=models.CASCADE, related_name='clients')
    is_primary = models.BooleanField(default=True)

    class Meta:
        unique_together = ('client', 'spoc')

    def __str__(self):
        return f"{self.client.name} - {self.spoc.name} ({'Primary' if self.is_primary else 'Secondary'})"

# -------------------------
# Group Category
# -------------------------
class GroupCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

# -------------------------
# Client Group
# -------------------------
class ClientGroup(models.Model):
    group_category = models.ForeignKey(GroupCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_groups')
    group_name = models.CharField(max_length=255, unique=True)
    primary_spoc = models.ForeignKey(SPOC, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_groups')
    secondary_spoc = models.ForeignKey(SPOC, on_delete=models.SET_NULL, null=True, blank=True, related_name='secondary_groups')
    
    clients = models.ManyToManyField(Client, related_name='client_groups_membership', blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # def __str__(self):
    #     return self.group_name

    def save(self, *args, **kwargs):          # <-- add
        if self.group_name:
            self.group_name = self.group_name.upper()
        super().save(*args, **kwargs)

    def __str__(self):                        # <-- update
        return self.group_name.upper() if self.group_name else ""

# -------------------------
# Main & Sub Services
# -------------------------
class MainService(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    # team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='main_services')
    team = models.ForeignKey(Team, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('name', 'team')

    def __str__(self):
        return self.name

from django.core.exceptions import ValidationError

class SubService(models.Model):
    PERIOD_CHOICES = [
        ("Monthly", "Monthly"),
        ("Quarterly", "Quarterly"),
        ("Half-Yearly", "Half-Yearly"),
        ("Annually", "Annually"),
        ("Event-Based", "Event-Based"),
    ]

    name = models.CharField(max_length=255)
    main_service = models.ForeignKey(
        MainService,
        on_delete=models.CASCADE,
        related_name="sub_services"
    )

    period = models.CharField(
        max_length=20,
        choices=PERIOD_CHOICES,
        null=True,
        blank=True
    )

    due_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True
    )

    due_month = models.PositiveSmallIntegerField(
        null=True,
        blank=True
    )

    period_label = models.CharField(max_length=50, null=True, blank=True)

    is_active = models.BooleanField(default=True)

    def clean(self):
        if self.period == "Monthly" and not self.due_day:
            raise ValidationError("Monthly services require due_day")

        if self.period != "Monthly" and (not self.due_day or not self.due_month):
            raise ValidationError("Non-monthly services require due_day and due_month")


class ClientGroupService(models.Model):
    client_group = models.ForeignKey(ClientGroup, related_name="group_services", on_delete=models.CASCADE)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)

    main_service = models.ForeignKey(MainService, on_delete=models.PROTECT)
    sub_service = models.ForeignKey(SubService, on_delete=models.PROTECT)

    period = models.CharField(max_length=20, null=True, blank=True)
    period_label = models.CharField(max_length=50, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True      # ✅ IMPORTANT
    )

    is_active = models.BooleanField(default=True)


# -------------------------
# Task & Task Time Entry
# -------------------------
class Task(models.Model):
    STATUS_CHOICES = [
        ('To Do', 'To Do'),
        ('In Progress', 'In Progress'),
        ('Done', 'Done'),
        ('Over Due', 'Over Due'),
    ]

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['client']),
            models.Index(fields=['team']),
            models.Index(fields=['due_date', 'status']),  # composite for overdue query
        ]
    
    task_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True, db_index=True)
    # sub_service = models.ForeignKey(SubService, on_delete=models.CASCADE, related_name='tasks')
    sub_service = models.ForeignKey(
        SubService,
        on_delete=models.PROTECT, db_index=True
    )
    is_active = models.BooleanField(default=True)
    spoc = models.ForeignKey(SPOC, on_delete=models.CASCADE, related_name='tasks', db_index=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='tasks')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='To Do', db_index=True)

    marked_done_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tasks_marked_done"
    )
    marked_done_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        user = kwargs.pop('user', None)

        if self.status == 'Done':
            if self.marked_done_at is None:
                self.marked_done_at = timezone.now()

            if self.marked_done_by is None and user:
                self.marked_done_by = user

        super().save(*args, **kwargs)
    
    period = models.CharField(max_length=100, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    employee_id = models.CharField(max_length=50, null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    file = models.FileField(upload_to='task_files/', null=True, blank=True)
    proof_file = models.FileField(upload_to='task_proofs/', null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_tasks')
    assigned_at = models.DateTimeField(null=True, blank=True)

    invoice_no   = models.CharField(max_length=100, blank=True, null=True)
    invoice_date = models.DateField(blank=True, null=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Task for {self.sub_service.name} - {self.status}"

User = settings.AUTH_USER_MODEL

class TaskAssignment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="assignments"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_assignments"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_tasks_by_me"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("task", "user")


class TaskAssignmentHistory(models.Model):
    task = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="assignment_history"
    )
    assigned_from = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_assigned_from"
    )
    assigned_to = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="task_assigned_to"
    )

    assigned_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_assigned_by"
    )
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.task.task_id}: {self.assigned_from} → {self.assigned_to}"

class TaskTimeEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_index=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)  # e.g. 7.19 = 7h 19m
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["employee", "start_time"])
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "start_time", "end_time"],
                name="uniq_time_entry"
            ),
            models.CheckConstraint(
                condition=Q(end_time__gt=F("start_time")),
                name="end_after_start",
            ),
        ]


    @property
    def duration_human(self):
        if self.duration is None:
            return None
        hours = floor(float(self.duration))
        minutes = int(round((float(self.duration) - hours) * 100))
        return f"{hours}h {minutes}m"

    

    def clean(self):
        if self.end_time and self.start_time:
            # 1️⃣ Enforce > start
            if self.end_time <= self.start_time:
                raise ValidationError("End time must be strictly greater than start time.")

            # 2️⃣ Enforce max 15 hours
            duration = (self.end_time - self.start_time).total_seconds() / 3600
            if duration > 15:
                raise ValidationError("Time entry cannot exceed 15 hours.")

            # 3️⃣ Prevent overlap for same employee
            overlap = TaskTimeEntry.objects.filter(
                employee=self.employee
            ).exclude(id=self.id).filter(
                Q(start_time__lt=self.end_time) &
                Q(end_time__gt=self.start_time)
            )

            if overlap.exists():
                raise ValidationError("This time entry overlaps with an existing entry.")

    

    def save(self, *args, **kwargs):
        # ---- Parse datetimes safely ----
        if isinstance(self.start_time, str):
            self.start_time = parse_datetime(self.start_time)

        if isinstance(self.end_time, str):
            self.end_time = parse_datetime(self.end_time)

        if not self.start_time or not self.end_time:
            super().save(*args, **kwargs)
            return

        # ---- Normalize timezone ----
        start = self.start_time
        end = self.end_time

        if is_aware(start):
            start = make_naive(start)

        if is_aware(end):
            end = make_naive(end)

        # ---- Validation ----
        if end <= start:
            raise ValidationError("End time must be strictly greater than start time.")

        delta = end - start
        total_seconds = delta.total_seconds()

        if total_seconds > 15 * 3600:
            raise ValidationError("Total duration cannot exceed 15 hours in a single entry.")

        # ==========================================================
        # ⭐ IGNORE SECONDS — CALCULATE ONLY MINUTES
        # ==========================================================
        total_minutes = int(total_seconds // 60)   # floor division removes seconds

        hours = total_minutes // 60
        minutes = total_minutes % 60

        # store as HH.MM (7h 19m → 7.19)
        self.duration = Decimal(f"{hours}.{minutes:02d}")

        self.full_clean()
        super().save(*args, **kwargs)



class InternalTimeEntry(models.Model):
    STATUS_CHOICES = (
        ("In Progress", "In Progress"),
        ("Done", "Done"),
    )

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="internal_time_entries",
        db_index=True
    )

    description = models.ForeignKey(
        "clients.SubService",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )

    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="In Progress"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["employee", "start_time"])
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_time__gt=F("start_time")),   # ← FIXED
                name="internal_end_after_start"
            ),
            models.UniqueConstraint(
                fields=["employee", "start_time", "end_time"],
                name="uniq_internal_entry"
            )
        ]

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time.")

        duration = (self.end_time - self.start_time).total_seconds() / 3600
        if duration > 15:
            raise ValidationError("Internal time cannot exceed 15 hours.")

        # Prevent overlap with TASK time
        overlap_task = TaskTimeEntry.objects.filter(
            employee=self.employee,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        )

        # Prevent overlap with INTERNAL time
        overlap_internal = InternalTimeEntry.objects.filter(
            employee=self.employee
        ).exclude(id=self.id).filter(
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        )

        if overlap_task.exists() or overlap_internal.exists():
            raise ValidationError("Time entry overlaps with an existing entry.")

    

    def save(self, *args, **kwargs):
        # ---- Parse & normalize times ----
        start = self.start_time
        end = self.end_time

        if not start or not end:
            raise ValidationError("Start and end time are required")

        if is_aware(start):
            start = make_naive(start)

        if is_aware(end):
            end = make_naive(end)

        self.start_time = start
        self.end_time = end

        # ---- Validation ----
        if end <= start:
            raise ValidationError("End time must be after start time.")

        delta = end - start
        total_seconds = delta.total_seconds()

        if total_seconds > 15 * 3600:
            raise ValidationError("Internal time cannot exceed 15 hours.")

        # ---- Overlap with TASK time ----
        from .models import TaskTimeEntry
        overlap_task = TaskTimeEntry.objects.filter(
            employee=self.employee,
            start_time__lt=end,
            end_time__gt=start
        )

        # ---- Overlap with INTERNAL time ----
        overlap_internal = InternalTimeEntry.objects.filter(
            employee=self.employee
        ).exclude(id=self.id).filter(
            start_time__lt=end,
            end_time__gt=start
        )

        if overlap_task.exists() or overlap_internal.exists():
            raise ValidationError("Time entry overlaps with an existing entry.")

        # ---- Store duration ----
        self.duration = (
            Decimal(total_seconds) / Decimal(3600)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        super().save(*args, **kwargs)


# ----------------------------
# Company Model with JSONField
# ----------------------------
class Company(models.Model):
    companyName = models.CharField(max_length=255)
    companytype = models.CharField(max_length=255, blank=True, null=True)
    natureOfBusiness = models.CharField(max_length=255, blank=True, null=True)
    incorporationDate = models.DateField(blank=True, null=True)
    stateOfRegistration = models.CharField(max_length=100, blank=True, null=True)
    panNo = models.CharField(max_length=20, blank=True, null=True)
    gstNo = models.CharField(max_length=20, blank=True, null=True)
    tanNo = models.CharField(max_length=20, blank=True, null=True)
    cin = models.CharField(max_length=50, blank=True, null=True)
    lutNo = models.CharField(max_length=50, blank=True, null=True)
    lutDate = models.DateField(blank=True, null=True)
    contactPerson = models.CharField(max_length=255, blank=True, null=True)
    contactEmail = models.EmailField(blank=True, null=True)
    contactPhone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    bankAccountNo = models.CharField(max_length=50, blank=True, null=True)
    ifscCode = models.CharField(max_length=20, blank=True, null=True)
    bankName = models.CharField(max_length=255, blank=True, null=True)
    bankAddress = models.TextField(blank=True, null=True)

    additionalBasicDetails = JSONField(default=list, blank=True)
    additionalIdentificationDetails = JSONField(default=list, blank=True)
    additionalContactDetails = JSONField(default=list, blank=True)
    additionalBankingDetails = JSONField(default=list, blank=True)
    otherDetails = JSONField(default=list, blank=True)
    sacDetails = JSONField(default=list, blank=True)

    def __str__(self):
        return self.companyName

# -------------------------
# SIGNAL: Delete related data when a ClientGroup is deleted
# -------------------------
@receiver(post_delete, sender=ClientGroup)
def delete_group_related_data(sender, instance, **kwargs):
    # Delete group services
    instance.group_services.all().delete()

    # Delete clients that belong only to this group
    for client in instance.clients.all():
        if client.client_groups_membership.exclude(id=instance.id).exists():
            continue
        # Delete tasks & task time entries
        client.tasks.all().delete()
        # Delete client SPOC mappings
        client.spocs.all().delete()
        # Delete client
        client.delete()

######################################################################################################################################

class Recipient(models.Model):
    email = models.EmailField(unique=True)
    token = models.CharField(max_length=64, unique=True)
    upload_date = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    def __str__(self):
        return self.email

User = get_user_model()

class EmailLog(models.Model):
    recipient_email = models.EmailField()
    department_type = models.CharField(max_length=100)
    month_year = models.CharField(max_length=20) # e.g., "May_2025"
    message_id = models.CharField(max_length=255, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_reminder = models.BooleanField(default=False)


    class Meta:
        unique_together = ('recipient_email', 'department_type', 'month_year', 'is_reminder') # Ensure uniqueness for initial emails

    def __str__(self):
        return f"Email to {self.recipient_email} for {self.department_type} ({self.month_year}) - ID: {self.message_id}"

class FileUpload(models.Model):
    email = models.EmailField()
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_uploaded = models.BooleanField(default=False)


# clients/models.py
from django.db import models

class Process(models.Model):
    name = models.CharField(max_length=100, unique=True)
    sop_file = models.FileField(upload_to="sop_files/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



# class Process(models.Model):
#     name = models.CharField(max_length=200)

#     def __str__(self):
#         return self.name

class Section(models.Model):
    process = models.ForeignKey(Process, related_name='sections', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.process.name} - {self.title}"

class Step(models.Model):
    section = models.ForeignKey(Section, related_name='items', on_delete=models.CASCADE)
    description = models.TextField()

    def __str__(self):
        return f"{self.section.title} - {self.description[:50]}" 

# Function to dynamically determine the upload path based on folder hierarchy
def document_upload_path(instance, filename):
    # Start with a base directory (e.g., 'documents')
    path_parts = ['documents']

    # If the document has a parent folder, build the path based on its hierarchy
    if instance.parent_folder:
        current_folder = instance.parent_folder
        folder_names = []
        # Traverse up the hierarchy to get all parent folder names in order
        while current_folder:
            folder_names.insert(0, current_folder.file_name) # Insert at beginning to get correct order
            current_folder = current_folder.parent_folder
        path_parts.extend(folder_names) # Add all folder names to the path

    # Add the original filename at the end
    path_parts.append(filename)

    # Join all parts to create the final path (e.g., 'documents/folder1/subfolderA/file.pdf')
    return os.path.join(*path_parts)

from django.db.models import Q

class Document(models.Model):
    file = models.FileField(upload_to=document_upload_path, blank=True, null=True)
    file_name = models.CharField(max_length=255)
    department = models.CharField(max_length=100, blank=True, null=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    is_folder = models.BooleanField(default=False)
    parent_folder = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_documents',
        null=True,
        blank=True
    )

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Use SET_NULL so if the user is deleted, the field is null, not the document
        related_name='deleted_documents',
        null=True,
        blank=True
    )

    # Root folder flags
    is_public_root = models.BooleanField(default=False)
    is_private_root = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['file_name', 'parent_folder', 'owner'],
                condition=Q(is_deleted=False),   # ✅ ignore trashed files
                name="unique_active_file_per_folder_per_owner"
            )
        ]
        ordering = ['-is_folder', 'file_name']

    def save(self, *args, **kwargs):
        if self.file and not self.file_name:
            self.file_name = self.file.name
        if self.is_folder and self.file:
            raise ValueError("A folder cannot have an associated file.")

        # Ensure only root folders can have flags
        if self.parent_folder:
            self.is_public_root = False
            self.is_private_root = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{'(Folder) ' if self.is_folder else ''}{self.file_name or self.id}"

# Note: Remember to run Django migrations after this change:
# python manage.py makemigrations
# python manage.py migrate

# New models for Department and DepartmentMessage

class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class DepartmentMessage(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message to {self.department.name} at {self.created_at}"




def generate_invoice_number(document_type, category=None):
    today = timezone.now().date()
    current_year = today.year

    fy_start = current_year if today.month >= 4 else current_year - 1
    fy_end = fy_start + 1
    fy_range = f"{str(fy_start)[-2:]}-{str(fy_end)[-2:]}"

    PREFIX_MAP = {
        ("Invoice", "tax_invoice"): "",
        ("Invoice", "credit_note"): "CN",
        ("Invoice", "debit_note"): "DN",
        ("Proforma", "tax_invoice"): "CKPSCA",
        ("Proforma", "credit_note"): "CKPSCACN",
        ("Proforma", "debit_note"): "CKPSCADN",
    }

    prefix = PREFIX_MAP.get((category, document_type), "")

    # everything starts from 0001 every FY
    start_number = 1

    with transaction.atomic():
        last_invoice = (
            Invoice.objects
            .select_for_update()
            .filter(
                category=category,
                document_type=document_type,
                invoice_no__isnull=False,
                invoice_no__endswith=f"/{fy_range}",
            )
            .order_by("id")
            .last()
        )

        next_number = start_number

        if last_invoice and last_invoice.invoice_no:
            try:
                raw = last_invoice.invoice_no.split("/")[0]
                numeric_str = raw[len(prefix):]
                next_number = int(numeric_str) + 1
            except (ValueError, IndexError):
                next_number = start_number

        while True:
            invoice_no = f"{prefix}{next_number:04d}/{fy_range}"

            if not Invoice.objects.filter(invoice_no=invoice_no).exists():
                return invoice_no

            next_number += 1



class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Outstanding', 'Outstanding'),
        ('Paid', 'Paid'),
        ('Rejected', 'Rejected'),
        ('Canceled', 'Canceled'),
        ('Partially Paid', 'Partially Paid'),
        ('System Generated', 'System Generated'),
    ]

    CATEGORY_CHOICES = [
        ('Invoice', 'Invoice'),
        ('Proforma', 'Proforma'),
    ]

    GST_TYPE_CHOICES = [
        ('Local', 'Local'),
        ('Interstate', 'Interstate'),
        ('SEZ', 'SEZ Supplies'),
        ('no_gst', 'No GST'),
    ]

    DOCUMENT_TYPE_CHOICES = [
        ('tax_invoice', 'Tax Invoice'),
        ('credit_note', 'Credit Note'),
        ('debit_note', 'Debit Note'),
    ]

    # Invoice details
    invoice_no = models.CharField(max_length=50, unique=True, blank=True, null=True)
    date = models.DateField()
    _amount = models.TextField(db_column="amount", default='0.00')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    gst_type = models.CharField(max_length=20, default='Local')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Invoice')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='tax_invoice')
    ref_invoice_number = models.CharField(max_length=255, blank=True, null=True)

    # Client details - handles both regular and one-time clients
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    client_name = models.CharField(max_length=255, blank=True, null=True)
    client_address = models.TextField(blank=True, null=True)
    client_gstin = models.CharField(max_length=15, blank=True, null=True)

    place_of_supply  = models.CharField(max_length=60,  blank=True, null=True)
    reverse_charge   = models.CharField(max_length=1,   default='N')   # 'Y' or 'N'
    ecommerce_gstin  = models.CharField(max_length=15,  blank=True, null=True)
    invoice_type     = models.CharField(
        max_length=10, blank=True, null=True,
        help_text="GSTR-1 type: R, DE, SEWP, SEWOP, CBW"
    )

    # Tax and totals
    _sub_total = models.TextField(db_column="sub_total", default='0.00')
    _cgst = models.TextField(db_column="cgst", default='0.00')
    _sgst = models.TextField(db_column="sgst", default='0.00')
    _igst = models.TextField(db_column="igst", default='0.00')

    _applicable_tax_rate = models.TextField(
        db_column="applicable_tax_rate", blank=True, null=True,
        help_text="Override tax rate % for GSTR-1 (e.g. 65.00)"
    )
    _cess_amount = models.TextField(
        db_column="cess_amount", blank=True, null=True,
    )
    
    # New fields for payment tracking
    _partial_payment_amount = models.TextField(db_column="partial_payment_amount", default='0.00')
    _final_payment_amount = models.TextField(db_column="final_payment_amount", default='0.00')
    _balance_amount = models.TextField(db_column="balance_amount", default='0.00')
    payment_mode = models.CharField(max_length=20, blank=True, null=True)
    payment_details = models.JSONField(blank=True, null=True)

    # In your Invoice model, add:
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_invoices'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approver_signature = models.TextField(blank=True, null=True)  # snapshot at approval time

    # Doneload Tracking
    is_downloaded = models.BooleanField(default=False)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    downloaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    @property
    def amount(self):
        if hasattr(self, '_amount') and self._amount:
            try:
                return Decimal(decrypt_text(self._amount))
            except (InvalidToken, ValueError):
                # Fallback: value might already be plain decimal
                try:
                    return Decimal(self._amount)
                except:
                    return None
        return Decimal('0.00')

    @amount.setter
    def amount(self, value):
        if value is not None:
            self._amount = encrypt_text(str(value))
        else:
            self._amount = None

    @property
    def sub_total(self):
        if not self._sub_total:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._sub_total))
        except (InvalidToken, ValueError):
            return Decimal(self._sub_total or '0.00')

    @sub_total.setter
    def sub_total(self, value):
        if value is not None:
            self._sub_total = encrypt_text(str(value))
        else:
            self._sub_total = None

    # CGST
    @property
    def cgst(self):
        if not self._cgst:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._cgst))
        except (InvalidToken, ValueError):
            return Decimal(self._cgst or '0.00')

    @cgst.setter
    def cgst(self, value):
        if value is not None:
            self._cgst = encrypt_text(str(value))
        else:
            self._cgst = None

    # SGST
    @property
    def sgst(self):
        if not self._sgst:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._sgst))
        except (InvalidToken, ValueError):
            return Decimal(self._sgst or '0.00')

    @sgst.setter
    def sgst(self, value):
        if value is not None:
            self._sgst = encrypt_text(str(value))
        else:
            self._sgst = None

    # IGST
    @property
    def igst(self):
        if not self._igst:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._igst))
        except (InvalidToken, ValueError):
            return Decimal(self._igst or '0.00')

    @igst.setter
    def igst(self, value):
        if value is not None:
            self._igst = encrypt_text(str(value))
        else:
            self._igst = None

    @property
    def partial_payment_amount(self):
        if hasattr(self, '_partial_payment_amount') and self._partial_payment_amount:
            try:
                return Decimal(decrypt_text(self._partial_payment_amount))
            except (InvalidToken, ValueError):
                # fallback if value is plain
                return Decimal(self._partial_payment_amount)
        return Decimal('0.00')

    @partial_payment_amount.setter
    def partial_payment_amount(self, value):
        if value is not None:
            self._partial_payment_amount = encrypt_text(str(value))
        else:
            self._partial_payment_amount = None

    @property
    def final_payment_amount(self):
        if not self._final_payment_amount:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._final_payment_amount))
        except (InvalidToken, ValueError):
            return Decimal(self._final_payment_amount or '0.00')

    @final_payment_amount.setter
    def final_payment_amount(self, value):
        if value is not None:
            self._final_payment_amount = encrypt_text(str(value))
        else:
            self._final_payment_amount = None

    @property
    def balance_amount(self):
        return self.amount - (self.partial_payment_amount + self.final_payment_amount)

    @balance_amount.setter
    def balance_amount(self, value):
        if value is not None:
            self._balance_amount = encrypt_text(str(value))
        else:
            self._balance_amount = None

    @property
    def applicable_tax_rate(self):
        if not self._applicable_tax_rate:
            return None
        try:
            return Decimal(decrypt_text(self._applicable_tax_rate))
        except (InvalidToken, ValueError):
            try:
                return Decimal(self._applicable_tax_rate)
            except Exception:
                return None
    
    @applicable_tax_rate.setter
    def applicable_tax_rate(self, value):
        if value is not None:
            self._applicable_tax_rate = encrypt_text(str(value))
        else:
            self._applicable_tax_rate = None

    @property
    def cess_amount(self):
        if not self._cess_amount:
            return Decimal('0.00')
        try:
            return Decimal(decrypt_text(self._cess_amount))
        except (InvalidToken, ValueError):
            try:
                return Decimal(self._cess_amount)
            except Exception:
                return Decimal('0.00')
    
    @cess_amount.setter
    def cess_amount(self, value):
        if value is not None:
            self._cess_amount = encrypt_text(str(value))
        else:
            self._cess_amount = None

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices'
    )

    class Meta:
        # ordering = ['-date']
        ordering = ['-invoice_no']
    def __str__(self):
        return self.invoice_no if self.invoice_no else f"Draft Invoice - {self.id}"

    
    def save(self, *args, **kwargs):
        from decimal import Decimal

        NO_INVOICE_STATUSES = ["Draft", "System Generated", "Rejected", "Canceled"]

        if not self.invoice_no and self.date and self.status not in NO_INVOICE_STATUSES:
            self.invoice_no = generate_invoice_number(self.document_type, self.category)

        self.balance_amount = self.amount - (self.partial_payment_amount + self.final_payment_amount)
        super().save(*args, **kwargs)






class InvoiceItem(models.Model):
    """
    Model to store individual line items of an invoice.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    sac_code = models.CharField(max_length=10, blank=False)
    # particulars = models.CharField(max_length=100000)
    particulars = models.TextField(blank=True, null=True)
    _amount = models.TextField(db_column="amount", default='0.00')

    @property
    def amount(self):
        if hasattr(self, '_amount') and self._amount:
            try:
                return Decimal(decrypt_text(self._amount))
            except (InvalidToken, ValueError):
                # Fallback: value might already be plain decimal
                try:
                    return Decimal(self._amount)
                except:
                    return None
        return Decimal('0.00')

    @amount.setter
    def amount(self, value):
        if value is not None:
            self._amount = encrypt_text(str(value))
        else:
            self._amount = None

    def __str__(self):
        return f"{self.invoice.invoice_no} - {self.particulars}"

class RecurringInvoice(models.Model):
    FREQUENCY_CHOICES = [
        ('Monthly', 'Monthly'),
        ('Quarterly', 'Quarterly'),
        ('Half-Yearly', 'Half-Yearly'),
        ('Yearly', 'Yearly'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField(blank=True, null=True)
    client_gstin = models.CharField(max_length=15, blank=True, null=True)

    gst_type = models.CharField(max_length=20, default='Local')
    # particulars = models.CharField(max_length=255)
    # sac_code = models.CharField(max_length=10, blank=True, null=True)
    # amount = models.DecimalField(max_digits=10, decimal_places=2)

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    start_date = models.DateField()
    next_invoice_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    # def __str__(self):
        # return f"Recurring {self.particulars} for {self.client_name} ({self.frequency})"
    def __str__(self):
        return f"Recurring invoice for {self.client_name} ({self.frequency})"

class RecurringInvoiceItem(models.Model):
    invoice = models.ForeignKey(RecurringInvoice, related_name="items", on_delete=models.CASCADE)
    # particular = models.CharField(max_length=255)
    particulars = models.TextField(blank=True, null=True)
    sac_code = models.CharField(max_length=50)
    _amount = models.TextField()
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))

    @property
    def amount(self):
        if hasattr(self, '_amount') and self._amount:
            try:
                return Decimal(decrypt_text(self._amount))
            except (InvalidToken, ValueError):
                # Fallback: value might already be plain decimal
                try:
                    return Decimal(self._amount)
                except:
                    return None
        return Decimal('0.00')

    @amount.setter
    def amount(self, value):
        if value is not None:
            self._amount = encrypt_text(str(value))
        else:
            self._amount = None

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    _amount = models.TextField(db_column="amount", default='0.00')
    mode_of_payment = models.CharField(max_length=20, blank=True, null=True)
    payment_details = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    @property
    def amount(self):
        if hasattr(self, '_amount') and self._amount:
            try:
                return Decimal(decrypt_text(self._amount))
            except (InvalidToken, ValueError):
                # Fallback: value might already be plain decimal
                try:
                    return Decimal(self._amount)
                except:
                    return None
        return Decimal('0.00')

    @amount.setter
    def amount(self, value):
        if value is not None:
            self._amount = encrypt_text(str(value))
        else:
            self._amount = None

    def __str__(self):
        return f"Payment of {self.amount} for {self.invoice.invoice_no}"

class ClientRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # mirrors Client fields exactly
    name               = models.CharField(max_length=255)
    email              = models.EmailField(blank=True, null=True)
    phone              = models.CharField(max_length=20, blank=True, null=True)
    contact_person     = models.CharField(max_length=255, blank=True, null=True)
    nature_of_business = models.CharField(max_length=255, blank=True, null=True)
    constitution       = models.IntegerField(blank=True, null=True)  # FK id to Constitution
    address            = models.TextField(blank=True, null=True)
    client_group = models.ForeignKey(          # ← does this exist?
        'ClientGroup',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='client_requests'
    )

    gstin = models.CharField(max_length=20, blank=True, null=True)
    iec   = models.CharField(max_length=20, blank=True, null=True)
    ksea  = models.CharField(max_length=20, blank=True, null=True)
    udyam = models.CharField(max_length=20, blank=True, null=True)
    apt   = models.CharField(max_length=20, blank=True, null=True)
    ept   = models.CharField(max_length=20, blank=True, null=True)
    tan   = models.CharField(max_length=20, blank=True, null=True)
    lei   = models.CharField(max_length=20, blank=True, null=True)
    cin   = models.CharField(max_length=20, blank=True, null=True)
    pan   = models.CharField(max_length=20, blank=True, null=True)

    # billing_cycle = models.CharField(max_length=20, blank=True, null=True)
    # invoice_date  = models.DateField(blank=True, null=True)

    # request metadata
    notes          = models.TextField(blank=True, null=True)
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    rejection_note = models.TextField(blank=True, null=True)
    requested_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='client_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"


class ServiceRequest(models.Model):
    SERVICE_TYPE_CHOICES = [
        ('main_service', 'Main Service'),
        ('sub_service',  'Sub-Service'),
    ]
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    requested_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_requests')
    service_type   = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    service_name   = models.CharField(max_length=255)
    team           = models.ForeignKey('employee.Team', on_delete=models.SET_NULL, null=True, blank=True)
    parent_service = models.ForeignKey(MainService, on_delete=models.SET_NULL, null=True, blank=True)
    period         = models.CharField(max_length=20, null=True, blank=True)
    due_day        = models.IntegerField(null=True, blank=True)
    due_month      = models.IntegerField(null=True, blank=True)
    notes          = models.TextField(blank=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_note = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class GroupRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    group_name          = models.CharField(max_length=255)
    group_category      = models.ForeignKey(
        'GroupCategory', on_delete=models.SET_NULL, null=True, blank=True
    )
    primary_spoc        = models.IntegerField(null=True, blank=True)   # employee id
    secondary_spoc      = models.IntegerField(null=True, blank=True)   # employee id
    clients_data        = models.JSONField(default=list, blank=True)
    group_services_data = models.JSONField(default=list, blank=True)
    notes               = models.TextField(blank=True)
    status              = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    rejection_note      = models.TextField(blank=True)
    requested_by        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='group_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.group_name} ({self.status})"