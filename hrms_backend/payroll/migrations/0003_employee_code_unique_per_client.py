# Generated manually — employee_code was globally unique, but
# excel_parser.py's import logic assumes codes can be reused across
# different clients (matched by client scope). This aligns the DB
# constraint with that intent: unique per (client, employee_code)
# instead of unique across the whole table.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0002_client_is_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='employee',
            name='employee_code',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='employee',
            unique_together={('client', 'employee_code')},
        ),
    ]