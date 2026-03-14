from rest_framework import serializers
from .models import Medication, MedicationSchedule


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = ["id", "time_of_day", "custom_time"]

    def validate(self, data):
        if data.get("time_of_day") == MedicationSchedule.TimeOfDay.CUSTOM and not data.get("custom_time"):
            raise serializers.ValidationError(
                {"custom_time": "Required when time_of_day is 'custom'."}
            )
        return data


class MedicationSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, required=False)

    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "dosage",
            "form",
            "instructions",
            "notes",
            "start_date",
            "end_date",
            "is_active",
            "schedules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        schedules_data = validated_data.pop("schedules", [])
        medication = Medication.objects.create(**validated_data)
        for schedule in schedules_data:
            MedicationSchedule.objects.create(medication=medication, **schedule)
        return medication

    def update(self, instance, validated_data):
        schedules_data = validated_data.pop("schedules", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if schedules_data is not None:
            instance.schedules.all().delete()
            for schedule in schedules_data:
                MedicationSchedule.objects.create(medication=instance, **schedule)

        return instance
