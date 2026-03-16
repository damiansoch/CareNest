from django.contrib import admin
from django.utils.html import format_html

from .models import Document, DocumentPage


class DocumentPageInline(admin.TabularInline):
    model = DocumentPage
    extra = 0
    readonly_fields = ["page_number", "mime_type", "file_size", "is_encrypted", "created_at"]
    fields = ["page_number", "mime_type", "file_size", "is_encrypted", "created_at"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["name", "senior", "category", "tag_list", "page_count_display", "uploaded_by", "created_at"]
    list_filter = ["category", "senior__family"]
    search_fields = ["name", "senior__first_name", "senior__last_name"]
    readonly_fields = ["id", "uploaded_by", "created_at", "updated_at"]
    inlines = [DocumentPageInline]

    def tag_list(self, obj):
        return ", ".join(obj.tags) if obj.tags else "—"
    tag_list.short_description = "Tags"

    def page_count_display(self, obj):
        return obj.pages.count()
    page_count_display.short_description = "Pages"


@admin.register(DocumentPage)
class DocumentPageAdmin(admin.ModelAdmin):
    list_display = ["document", "page_number", "mime_type", "file_size_display", "is_encrypted", "created_at"]
    list_filter = ["mime_type", "is_encrypted"]
    readonly_fields = ["id", "document", "page_number", "mime_type", "file_size", "is_encrypted", "created_at"]

    def file_size_display(self, obj):
        kb = obj.file_size / 1024
        if kb < 1024:
            return f"{kb:.1f} KB"
        return f"{kb / 1024:.1f} MB"
    file_size_display.short_description = "Size"

    def has_add_permission(self, request):
        return False
