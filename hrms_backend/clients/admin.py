# from django.contrib import admin
# from .models import (
#     UDINRecord, Client, AttestationType, TeamLead, SPOC, ClientSPOC, Recipient, FileUpload
# )

# @admin.register(UDINRecord)
# class UDINRecordAdmin(admin.ModelAdmin):
#     list_display = (
#         'internal_ref_no', 'client_name', 'date_of_udin', 'attestation_type',
#         'spoc', 'fee', 'invoice_no', 'invoice_date', 'udin_no', 'request_by'
#     )
#     search_fields = ('client_name', 'internal_ref_no', 'udin_no', 'request_by')
#     list_filter = ('attestation_type', 'date_of_udin', 'client_name', 'spoc')

# @admin.register(Client)
# class ClientAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     search_fields = ('name',)

# @admin.register(AttestationType)
# class AttestationTypeAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     search_fields = ('name',)

# @admin.register(TeamLead)
# class TeamLeadAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     search_fields = ('name',)

# @admin.register(SPOC)
# class SPOCAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     search_fields = ('name',)
#     filter_horizontal = ('clients',)

# @admin.register(ClientSPOC)
# class ClientSPOCAdmin(admin.ModelAdmin):
#     list_display = ('client', 'spoc')
#     search_fields = ('client__name', 'spoc__name')
#     list_filter = ('client', 'spoc')

# @admin.register(Recipient)
# class RecipientAdmin(admin.ModelAdmin):
#     list_display = ('email', 'token', 'upload_date', 'reminder_sent')
#     search_fields = ('email',)

# @admin.register(FileUpload)
# class FileUploadAdmin(admin.ModelAdmin):
#     list_display = ('email', 'file', 'uploaded_at', 'is_uploaded')
#     search_fields = ('email',)

    