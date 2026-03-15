from rest_framework import serializers

from .models import Document, DocumentPage


class DocumentPageMetaSerializer(serializers.ModelSerializer):
    """Lightweight page info — no binary content."""

    class Meta:
        model = DocumentPage
        fields = ["id", "page_number", "mime_type", "file_size"]


class UploaderSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Used for the list endpoint.
    Does NOT include the pages array or any binary data.
    page_count and total_size_bytes are annotated on the queryset.
    """
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    uploaded_by = serializers.SerializerMethodField()
    page_count = serializers.IntegerField(read_only=True)
    total_size_bytes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "name",
            "category",
            "category_display",
            "tags",
            "page_count",
            "total_size_bytes",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]

    def get_uploaded_by(self, obj):
        if obj.uploaded_by:
            return {
                "id": str(obj.uploaded_by.id),
                "first_name": obj.uploaded_by.first_name,
                "last_name": obj.uploaded_by.last_name,
            }
        return None


class DocumentDetailSerializer(DocumentListSerializer):
    """
    Used for the detail endpoint.
    Adds the pages metadata array (still no binary content).
    """
    pages = DocumentPageMetaSerializer(many=True, read_only=True)

    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + ["pages"]
