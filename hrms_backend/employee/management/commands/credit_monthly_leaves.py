# credit_monthly_leaves.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from dateutil.relativedelta import relativedelta
from employee.models import Employee, LeaveBalance

# monthly accrual amount: 22/year => 22/12 per month
MONTHLY_ACCRUAL = 22.0 / 12.0  # = 1.833333...

class Command(BaseCommand):
    help = "Credit monthly paid leaves (22/year) to employees who have completed 6 months."

    def handle(self, *args, **options):
        today = date.today()
        # first day of current month
        first_of_month = today.replace(day=1)

        employees = Employee.objects.select_related("leave_balance").all()
        credited = 0
        for emp in employees:
            lb, created = LeaveBalance.objects.get_or_create(employee=emp)

            # if hire_date + 6 months is <= today → eligible
            try:
                six_months_after_join = emp.hire_date + relativedelta(months=6)
            except Exception:
                # skip if hire_date missing
                continue

            if six_months_after_join <= today:
                # If already credited for this month skip
                if lb.last_accrual and lb.last_accrual >= first_of_month:
                    continue

                # Credit only once per month
                lb.credit_paid_leave(MONTHLY_ACCRUAL)
                lb.last_accrual = first_of_month
                lb.save(update_fields=["last_accrual", "updated_at"])
                credited += 1

        self.stdout.write(self.style.SUCCESS(f"Credited monthly leaves for {credited} employees."))
