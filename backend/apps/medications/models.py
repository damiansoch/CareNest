import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Medication(models.Model):
    """A medication assigned to a senior."""

    class Form(models.TextChoices):
        TABLET = "tablet", _("Tablet")
        CAPSULE = "capsule", _("Capsule")
        LIQUID = "liquid", _("Liquid")
        INJECTION = "injection", _("Injection")
        PATCH = "patch", _("Patch")
        DROPS = "drops", _("Drops")
        INHALER = "inhaler", _("Inhaler")
        OTHER = "other", _("Other")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    senior = models.ForeignKey(
        "seniors.Senior",
        on_delete=models.CASCADE,
        related_name="medications",
    )
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100, blank=True)
    form = models.CharField(max_length=20, choices=Form.choices, default=Form.TABLET)
    instructions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("medication")
        verbose_name_plural = _("medications")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.dosage}) — {self.senior}"


class MedicationSchedule(models.Model):
    """Time-of-day slot(s) for taking a medication."""

    class TimeOfDay(models.TextChoices):
        MORNING = "morning", _("Morning")
        MIDDAY = "midday", _("Midday")
        AFTERNOON = "afternoon", _("Afternoon")
        EVENING = "evening", _("Evening")
        BEDTIME = "bedtime", _("Bedtime")
        CUSTOM = "custom", _("Custom time")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    time_of_day = models.CharField(max_length=20, choices=TimeOfDay.choices)
    custom_time = models.TimeField(
        null=True,
        blank=True,
        help_text=_("Required when time_of_day is 'custom'."),
    )

    class Meta:
        verbose_name = _("medication schedule")
        verbose_name_plural = _("medication schedules")
        unique_together = [("medication", "time_of_day")]

    def __str__(self):
        return f"{self.medication.name} @ {self.get_time_of_day_display()}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.time_of_day == self.TimeOfDay.CUSTOM and not self.custom_time:
            raise ValidationError(_("custom_time is required when time_of_day is 'custom'."))
