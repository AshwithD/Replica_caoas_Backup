# employee/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class Team(models.Model):
    name = models.CharField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    WORK_TYPE_CHOICES = [
        ('fixed', 'Fixed Time'),
        ('flexible', 'Flexible Time'),
    ]
    WORK_WEEK_CHOICES = [
        ('5_days', '5 Days (Mon-Fri)'),
        ('6_days', '6 Days (Mon-Sat)'),
    ]

    user                 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee')
    employee_code        = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name           = models.CharField(max_length=100)
    last_name            = models.CharField(max_length=100)
    department           = models.CharField(max_length=100, blank=True, null=True)
    position             = models.CharField(max_length=100, blank=True, null=True)
    hire_date            = models.DateField(default=timezone.now)
    contact_number       = models.CharField(max_length=20, blank=True, null=True)
    address              = models.TextField(blank=True, null=True)
    date_of_birth        = models.DateField(blank=True, null=True)
    ctc                  = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    uan                  = models.CharField(max_length=100, blank=True, null=True)
    pan_number           = models.CharField(max_length=10, blank=True, null=True)
    account_no           = models.CharField(max_length=50, blank=True, null=True)
    status               = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    resignation_date     = models.DateField(blank=True, null=True)

    manager              = models.ForeignKey(
                                'self', null=True, blank=True,
                                on_delete=models.SET_NULL,
                                related_name='team_members'
                            )

    # ─── Work Settings ────────────────────────────────────────────────────
    daily_required_hours = models.DecimalField(max_digits=4, decimal_places=2, default=9.00)  # ← Only ONE
    work_type            = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES, default='fixed')
    work_week_type       = models.CharField(max_length=20, choices=WORK_WEEK_CHOICES, default='5_days')
    is_same_timing       = models.BooleanField(default=True)
    custom_timings       = models.JSONField(default=dict, blank=True, null=True)
    fixed_start_time     = models.TimeField(null=True, blank=True)
    fixed_end_time       = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class EmployeeDocument(models.Model):
    employee    = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    file        = models.FileField(upload_to='employee_docs/')
    file_name   = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.file_name:
            self.file_name = self.file.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.employee.full_name}"