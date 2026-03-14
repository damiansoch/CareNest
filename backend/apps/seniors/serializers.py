from rest_framework import serializers
from .models import Senior


class SeniorSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Senior
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "date_of_birth",
            "notes",
            "preferred_language",
            "photo",
            "accessibility_preferences",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "full_name", "created_at", "updated_at"]


class SeniorListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Senior
        fields = ["id", "first_name", "last_name", "full_name", "date_of_birth", "photo", "is_archived"]
