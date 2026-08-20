import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
django.setup()

from account.models import User
from employee.models import Employee, Team

# ── Create Teams ──────────────────────────────────────────────────────────────
team_audit, _   = Team.objects.get_or_create(name='Audit',    defaults={'description': 'Audit Team'})
team_tax, _     = Team.objects.get_or_create(name='Tax',      defaults={'description': 'Tax Team'})
team_account, _ = Team.objects.get_or_create(name='Accounts', defaults={'description': 'Accounts Team'})
team_it, _      = Team.objects.get_or_create(name='IT',       defaults={'description': 'IT Team'})

print("✅ Teams created")

# ── Demo Employee Data ────────────────────────────────────────────────────────
demo_employees = [
    {
        'email': 'hr@test.com',
        'password': 'Test@1234',
        'role': 'HR',
        'first_name': 'Priya',
        'last_name': 'Sharma',
        'department': 'Human Resources',
        'position': 'HR Manager',
        'employee_code': 'EMP001',
    },
    {
        'email': 'manager@test.com',
        'password': 'Test@1234',
        'role': 'Manager',
        'first_name': 'Rahul',
        'last_name': 'Verma',
        'department': 'Audit',
        'position': 'Audit Manager',
        'employee_code': 'EMP002',
    },
    {
        'email': 'teamlead@test.com',
        'password': 'Test@1234',
        'role': 'Team Lead',
        'first_name': 'Anjali',
        'last_name': 'Patel',
        'department': 'Tax',
        'position': 'Tax Team Lead',
        'employee_code': 'EMP003',
    },
    {
        'email': 'employee1@test.com',
        'password': 'Test@1234',
        'role': 'Employee',
        'first_name': 'Amit',
        'last_name': 'Kumar',
        'department': 'Audit',
        'position': 'Audit Assistant',
        'employee_code': 'EMP004',
    },
    {
        'email': 'employee2@test.com',
        'password': 'Test@1234',
        'role': 'Employee',
        'first_name': 'Sneha',
        'last_name': 'Joshi',
        'department': 'Tax',
        'position': 'Tax Consultant',
        'employee_code': 'EMP005',
    },
    {
        'email': 'founder@test.com',
        'password': 'Test@1234',
        'role': 'Founder',
        'first_name': 'Vikram',
        'last_name': 'Shah',
        'department': 'Management',
        'position': 'Founder',
        'employee_code': 'EMP006',
    },
]

# ── Create Users & Employees ──────────────────────────────────────────────────
for emp_data in demo_employees:
    email = emp_data['email']

    if User.objects.filter(email=email).exists():
        print(f"Skipping {email} - already exists")
        continue

    user = User.objects.create_user(
        email=email,
        password=emp_data['password'],
        role=emp_data['role'],
        first_name=emp_data['first_name'],
        last_name=emp_data['last_name'],
        is_active=True,
    )

    Employee.objects.create(
        user=user,
        employee_code=emp_data['employee_code'],
        first_name=emp_data['first_name'],
        last_name=emp_data['last_name'],
        department=emp_data['department'],
        position=emp_data['position'],
        status='active',
    )

    print(f"Created: {emp_data['first_name']} {emp_data['last_name']} ({emp_data['role']})")

print("\nAll demo employees created!")
print("-" * 50)
print(f"{'Role':<12} | {'Email':<30} | Password")
print("-" * 50)
for emp in demo_employees:
    print(f"{emp['role']:<12} | {emp['email']:<30} | {emp['password']}")