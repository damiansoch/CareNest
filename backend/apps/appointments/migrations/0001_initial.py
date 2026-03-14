import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("seniors", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Appointment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=300)),
                ("doctor_name", models.CharField(blank=True, max_length=200)),
                ("location", models.CharField(blank=True, max_length=300)),
                ("datetime", models.DateTimeField()),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("senior", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="appointments", to="seniors.senior")),
                ("assigned_caregiver", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_appointments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "appointment", "verbose_name_plural": "appointments", "ordering": ["datetime"]},
        ),
        migrations.CreateModel(
            name="ReminderConfig",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("offset_hours", models.IntegerField(choices=[(2, "2 hours before"), (24, "24 hours before")])),
                ("is_enabled", models.BooleanField(default=True)),
                ("appointment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reminder_configs", to="appointments.appointment")),
            ],
            options={"verbose_name": "reminder config", "verbose_name_plural": "reminder configs", "unique_together": {("appointment", "offset_hours")}},
        ),
        migrations.CreateModel(
            name="ReminderLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("offset_hours", models.IntegerField()),
                ("status", models.CharField(choices=[("sent", "Sent"), ("failed", "Failed")], max_length=10)),
                ("sent_at", models.DateTimeField(auto_now_add=True)),
                ("error_message", models.TextField(blank=True)),
                ("appointment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reminder_logs", to="appointments.appointment")),
            ],
            options={"verbose_name": "reminder log", "verbose_name_plural": "reminder logs", "ordering": ["-sent_at"], "unique_together": {("appointment", "offset_hours")}},
        ),
    ]
