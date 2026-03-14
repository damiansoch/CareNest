from django.contrib import admin
from .models import Medication, MedicationSchedule


class MedicationScheduleInline(admin.TabularInline):
    model = MedicationSchedule
    extra = 0


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ["name", "dosage", "form", "senior", "is_active", "start_date"]
    list_filter = ["is_active", "form"]
    search_fields = ["name", "senior__first_name", "senior__last_name"]
    inlines = [MedicationScheduleInline]
