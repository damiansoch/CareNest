from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CaregiverMembership, Family, Invitation, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "first_name", "last_name", "is_active", "preferred_language"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {"fields": ("preferred_language",)}),
    )


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(CaregiverMembership)
class CaregiverMembershipAdmin(admin.ModelAdmin):
    list_display = ["user", "family", "role", "joined_at"]
    list_filter = ["role", "family"]


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ["email", "family", "role", "status", "expires_at"]
    list_filter = ["status", "role"]
    readonly_fields = ["token"]
