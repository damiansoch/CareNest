import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Appointment(models.Model):
    """A medical appointment for a senior."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    senior = models.ForeignKey(
        "seniors.Senior",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    assigned_caregiver = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_appointments",
    )
    title = models.CharField(max_length=300)
    doctor_name = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=300, blank=True)
    datetime = models.DateTimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("appointment")
        verbose_name_plural = _("appointments")
        ordering = ["datetime"]

    def __str__(self):
        return f"{self.title} — {self.senior} @ {self.datetime:%Y-%m-%d %H:%M}"


class ReminderConfig(models.Model):
    """Reminder settings for an appointment."""

    class OffsetChoice(models.IntegerChoices):
        TWO_HOURS = 2, _("2 hours before")
        TWENTY_FOUR_HOURS = 24, _("24 hours before")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="reminder_configs",
    )
    offset_hours = models.IntegerField(choices=OffsetChoice.choices)
    is_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("reminder config")
        verbose_name_plural = _("reminder configs")
        unique_together = [("appointment", "offset_hours")]

    def __str__(self):
        return f"{self.appointment} — {self.get_offset_hours_display()}"


class ReminderLog(models.Model):
    """Tracks sent (or failed) reminder emails to prevent duplicates."""

    class Status(models.TextChoices):
        SENT = "sent", _("Sent")
        FAILED = "failed", _("Failed")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="reminder_logs",
    )
    offset_hours = models.IntegerField()
    status = models.CharField(max_length=10, choices=Status.choices)
    sent_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True)

    class Meta:
        verbose_name = _("reminder log")
        verbose_name_plural = _("reminder logs")
        # Prevent duplicate reminder sends
        unique_together = [("appointment", "offset_hours")]
        ordering = ["-sent_at"]

    def __str__(self):
        return f"Reminder [{self.status}] for {self.appointment} ({self.offset_hours}h before)"
