import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("seniors", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Medication",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=200)),
                ("dosage", models.CharField(blank=True, max_length=100)),
                ("form", models.CharField(choices=[("tablet", "Tablet"), ("capsule", "Capsule"), ("liquid", "Liquid"), ("injection", "Injection"), ("patch", "Patch"), ("drops", "Drops"), ("inhaler", "Inhaler"), ("other", "Other")], default="tablet", max_length=20)),
                ("instructions", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("senior", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="medications", to="seniors.senior")),
            ],
            options={"verbose_name": "medication", "verbose_name_plural": "medications", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="MedicationSchedule",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("time_of_day", models.CharField(choices=[("morning", "Morning"), ("midday", "Midday"), ("afternoon", "Afternoon"), ("evening", "Evening"), ("bedtime", "Bedtime"), ("custom", "Custom time")], max_length=20)),
                ("custom_time", models.TimeField(blank=True, null=True)),
                ("medication", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="schedules", to="medications.medication")),
            ],
            options={"verbose_name": "medication schedule", "verbose_name_plural": "medication schedules", "unique_together": {("medication", "time_of_day")}},
        ),
    ]
