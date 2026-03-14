from rest_framework import serializers
from .models import Appointment, ReminderConfig, ReminderLog


class ReminderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderConfig
        fields = ["id", "offset_hours", "is_enabled"]


class AppointmentSerializer(serializers.ModelSerializer):
    reminder_configs = ReminderConfigSerializer(many=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "title",
            "doctor_name",
            "location",
            "datetime",
            "notes",
            "assigned_caregiver",
            "reminder_configs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_assigned_caregiver(self, user):
        """Ensure assigned caregiver belongs to the same family."""
        if user is None:
            return user
        request = self.context["request"]
        family = request.user.membership.family
        if not hasattr(user, "membership") or user.membership.family != family:
            raise serializers.ValidationError("Caregiver must belong to the same family.")
        return user

    def create(self, validated_data):
        configs_data = validated_data.pop("reminder_configs", [])
        appointment = Appointment.objects.create(**validated_data)
        for cfg in configs_data:
            ReminderConfig.objects.create(appointment=appointment, **cfg)
        return appointment

    def update(self, instance, validated_data):
        configs_data = validated_data.pop("reminder_configs", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if configs_data is not None:
            instance.reminder_configs.all().delete()
            # Also clear reminder logs since the appointment changed
            instance.reminder_logs.all().delete()
            for cfg in configs_data:
                ReminderConfig.objects.create(appointment=instance, **cfg)

        return instance


class AppointmentWithSeniorSerializer(AppointmentSerializer):
    senior_id = serializers.UUIDField(source="senior.id", read_only=True)
    senior_name = serializers.SerializerMethodField()

    class Meta(AppointmentSerializer.Meta):
        fields = AppointmentSerializer.Meta.fields + ["senior_id", "senior_name"]

    def get_senior_name(self, obj):
        return f"{obj.senior.first_name} {obj.senior.last_name}"


class ReminderLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderLog
        fields = ["id", "offset_hours", "status", "sent_at", "error_message"]
