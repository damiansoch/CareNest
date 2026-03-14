from rest_framework import serializers
from .models import Medication, MedicationSchedule


class MedicationScheduleSerializer(serializers.ModelSerializer):
    time_of_day = serializers.ChoiceField(
        choices=MedicationSchedule.TimeOfDay.choices,
        required=True,
        error_messages={
            "required": "time_of_day is required for each schedule.",
            "blank": "time_of_day cannot be blank.",
            "invalid_choice": "Invalid time_of_day value.",
        },
    )
    custom_time = serializers.TimeField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "custom_time must be in HH:MM or HH:MM:SS format.",
        },
    )

    class Meta:
        model = MedicationSchedule
        fields = ["id", "time_of_day", "custom_time"]
        read_only_fields = ["id"]

    def to_internal_value(self, data):
        data = data.copy()
        if data.get("custom_time") == "":
            data["custom_time"] = None
        return super().to_internal_value(data)

    def validate(self, data):
        time_of_day = data.get("time_of_day")
        custom_time = data.get("custom_time")

        if time_of_day == MedicationSchedule.TimeOfDay.CUSTOM and not custom_time:
            raise serializers.ValidationError({
                "custom_time": "custom_time is required when time_of_day is 'custom'."
            })

        return data


class MedicationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            "required": "name is required.",
            "blank": "name cannot be blank.",
        },
    )
    dosage = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            "required": "dosage is required.",
            "blank": "dosage cannot be blank.",
        },
    )
    form = serializers.ChoiceField(
        choices=Medication.Form.choices,
        required=True,
        error_messages={
            "required": "form is required.",
            "blank": "form cannot be blank.",
            "invalid_choice": "Invalid form value.",
        },
    )
    start_date = serializers.DateField(
        required=True,
        error_messages={
            "required": "start_date is required.",
            "invalid": "start_date must be in YYYY-MM-DD format.",
        },
    )
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        error_messages={
            "invalid": "end_date must be in YYYY-MM-DD format.",
        },
    )
    instructions = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    schedules = MedicationScheduleSerializer(
        many=True,
        required=True,
        error_messages={
            "required": "schedules is required.",
        },
    )

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

    def to_internal_value(self, data):
        data = data.copy()
        if data.get("end_date") == "":
            data["end_date"] = None
        return super().to_internal_value(data)

    def validate_schedules(self, value):
        if not value:
            raise serializers.ValidationError("At least one schedule is required.")
        return value

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