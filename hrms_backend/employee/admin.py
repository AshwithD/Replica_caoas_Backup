from django.contrib import admin
from .models import Employee, Team, EmployeeDocument


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'department', 'position', 'hire_date')
    search_fields = ('first_name', 'last_name')
    list_filter = ('department', 'position')


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ('employee',)
    search_fields = ('employee__first_name',)