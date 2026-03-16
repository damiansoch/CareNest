"""
Migration: add event_type + url to Appointment, change ReminderConfig offsets to days-based values.

offset_hours mapping (old → new):
  2  (2 hours before)  → 0   (on the day)
  24 (24 hours before) → 48  (2 days before)
New values: 0 = on the day, 48 = 2 days before, 168 = 7 days (1 week) before.
"""
from django.db import migrations, models


def migrate_offset_hours_forward(apps, schema_editor):
    """Convert old hour-based offsets to the new day-based values."""
    ReminderConfig = apps.get_model("appointments", "ReminderConfig")
    ReminderLog = apps.get_model("appointments", "ReminderLog")
    # 2h before → on the day (0), 24h before → 2 days before (48)
    for Model in (ReminderConfig, ReminderLog):
        Model.objects.filter(offset_hours=2).update(offset_hours=0)
        Model.objects.filter(offset_hours=24).update(offset_hours=48)


def migrate_offset_hours_backward(apps, schema_editor):
    """Reverse: convert day-based offsets back to hour-based values."""
    ReminderConfig = apps.get_model("appointments", "ReminderConfig")
    ReminderLog = apps.get_model("appointments", "ReminderLog")
    for Model in (ReminderConfig, ReminderLog):
        Model.objects.filter(offset_hours=0).update(offset_hours=2)
        Model.objects.filter(offset_hours=48).update(offset_hours=24)
        Model.objects.filter(offset_hours=168).delete()  # no backward equivalent


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0002_celery_beat_schedule"),
    ]

    operations = [
        # 1. Add event_type field (default = appointment for all existing rows)
        migrations.AddField(
            model_name="appointment",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("appointment", "Medical appointment"),
                    ("shopping", "Shopping / supplies"),
                    ("other", "Other"),
                ],
                default="appointment",
                max_length=20,
            ),
        ),
        # 2. Add url field
        migrations.AddField(
            model_name="appointment",
            name="url",
            field=models.URLField(
                blank=True,
                help_text="Optional link, e.g. shop website",
            ),
        ),
        # 3. Data migration: convert existing offset values
        migrations.RunPython(migrate_offset_hours_forward, migrate_offset_hours_backward),
        # 4. Update choices on ReminderConfig.offset_hours (metadata only — no DB change)
        migrations.AlterField(
            model_name="reminderconfig",
            name="offset_hours",
            field=models.IntegerField(
                choices=[
                    (0, "On the day"),
                    (48, "2 days before"),
                    (168, "7 days (1 week) before"),
                ]
            ),
        ),
    ]
