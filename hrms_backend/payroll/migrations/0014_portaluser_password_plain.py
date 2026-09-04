from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payroll', '0013_alter_clientprofile_payroll_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='portaluser',
            name='_password_plain',
            field=models.TextField(blank=True, db_column='password_plain', default=''),
        ),
    ]
