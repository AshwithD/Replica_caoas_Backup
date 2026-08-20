from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import Document

@receiver(post_migrate)
def create_default_folders(sender, **kwargs):
    if sender.name == "clients":  # change to your app name
        for folder_name in ["Public", "Private"]:
            Document.objects.get_or_create(
                file_name=folder_name,
                is_folder=True,
                parent_folder=None,
                defaults={"owner": None, "department": None}
            )
