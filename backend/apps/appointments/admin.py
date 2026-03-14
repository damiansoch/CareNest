from django.contrib import admin
from .models import Appointment, ReminderConfig, ReminderLog


class ReminderConfigInline(admin.TabularInline):
    model = ReminderConfig
    extra = 0


class ReminderLogInline(admin.TabularInline):
    model = ReminderLog
    extra = 0
    readonly_fields = ["offset_hours", "status", "sent_at", "error_message"]
    can_delete = False


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["title", "senior", "doctor_name", "datetime", "assigned_caregiver"]
    list_filter = ["senior__family"]
    search_fields = ["title", "doctor_name", "senior__first_name", "senior__last_name"]
    raw_id_fields = ["assigned_caregiver"]
    inlines = [ReminderConfigInline, ReminderLogInline]
