# employee/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()


# ─── Delete User when Employee is deleted ─────────────────────────────────────
@receiver(post_delete, sender=Employee)
def delete_user_with_employee(sender, instance, **kwargs):
    user = instance.user
    if user:
        user.delete()


# ─── Sync Employee name to User ───────────────────────────────────────────────
@receiver(post_save, sender=Employee)
def sync_employee_name_to_user(sender, instance, **kwargs):
    user = instance.user
    updated = False
    if user.first_name != instance.first_name:
        user.first_name = instance.first_name
        updated = True
    if user.last_name != instance.last_name:
        user.last_name = instance.last_name
        updated = True
    if updated:
        user.save()

# ─── Payroll/Payslip/LeaveBalance signals removed ─────────────────────────────
# These will be added back when Payroll, Payslip, LeaveBalance models are created