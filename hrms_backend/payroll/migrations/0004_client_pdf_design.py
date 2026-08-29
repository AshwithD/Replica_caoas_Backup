# Generated manually to add Client.pdf_design

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0003_employee_code_unique_per_client'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='pdf_design',
            field=models.PositiveSmallIntegerField(
                choices=[(1, 'Design 1'), (2, 'Design 2'), (3, 'Design 3'), (4, 'Design 4'),
                         (5, 'Design 5'), (6, 'Design 6'), (7, 'Design 7'), (8, 'Design 8')],
                default=1,
            ),
        ),
    ]