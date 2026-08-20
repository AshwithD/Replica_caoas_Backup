# management/commands/send_reminders.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from myapp.models import Recipient

class Command(BaseCommand):
    help = "Send reminders to recipients who haven't uploaded files in 5 days"

    def handle(self, *args, **kwargs):
        cutoff = timezone.now() - timedelta(days=5)
        recipients = Recipient.objects.filter(upload_date__isnull=True, reminder_sent=False)

        for recipient in recipients:
            send_mail(
                "Reminder: Please upload your files",
                "You haven't uploaded your files yet. Please do so as soon as possible.",
                "noreply@yourdomain.com",
                [recipient.email]
            )
            recipient.reminder_sent = True
            recipient.save()

        self.stdout.write(self.style.SUCCESS("Reminders sent."))
