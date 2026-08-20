from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

from django.utils import timezone
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    signature = models.TextField(blank=True, null=True)  # base64 image string
    role = models.CharField(max_length=20, choices=[
        ('Admin', 'Admin'),
        ('Founder', 'Founder'),
        ('HR', 'HR'),
        ('Manager', 'Manager'),
        ('Team Lead', 'Team Lead'),
        ('Employee', 'Employee'),
        ('Intern', 'Intern'),
    ], blank=True, null=True)

    # employee = models.OneToOneField(
    #     'employees.Employee',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='user'
    # )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)

    # manual status
    STATUS_CHOICES = [
        ("available", "Available"),
        ("busy", "Busy"),
        ("meeting", "In Meeting"),
        ("ooo", "Out of Office"),
        ("away", "Away"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    status_message = models.CharField(max_length=100, blank=True, default="")
    status_updated_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] 
    objects = UserManager()

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()



from django.utils import timezone
from datetime import timedelta

# class PasswordResetOTP(models.Model):
#     email = models.EmailField()
#     otp = models.CharField(max_length=6)
#     created_at = models.DateTimeField(auto_now_add=True)
#     attempts = models.PositiveIntegerField(default=0)
#     is_locked = models.BooleanField(default=False)

#     def is_expired(self):
#         return timezone.now() > self.created_at + timedelta(minutes=5)

from django.utils import timezone
from datetime import timedelta

from django.db import models
from django.utils import timezone
from datetime import timedelta

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    attempts = models.PositiveIntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)

    MAX_ATTEMPTS = 3
    RESEND_COOLDOWN_SECONDS = 60
    LOCK_DURATION_MINUTES = 10

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)

    # ✅ THIS METHOD WAS MISSING
    def can_resend(self):
        return timezone.now() > self.created_at + timedelta(
            seconds=self.RESEND_COOLDOWN_SECONDS
        )

    def unlock_time(self):
        if not self.locked_at:
            return None
        return self.locked_at + timedelta(minutes=self.LOCK_DURATION_MINUTES)

    def is_unlock_time_reached(self):
        return self.locked_at and timezone.now() >= self.unlock_time()

    def attempts_left(self):
        return max(0, self.MAX_ATTEMPTS - self.attempts)

    def __str__(self):
        return f"{self.email} ({self.otp})"
