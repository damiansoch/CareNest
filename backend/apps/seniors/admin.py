from django.contrib import admin
from .models import Senior


@admin.register(Senior)
class SeniorAdmin(admin.ModelAdmin):
    list_display = ["full_name", "family", "date_of_birth", "preferred_language", "is_archived"]
    list_filter = ["is_archived", "preferred_language", "family"]
    search_fields = ["first_name", "last_name"]
    readonly_fields = ["created_at", "updated_at"]
