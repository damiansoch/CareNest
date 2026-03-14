import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Senior",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("preferred_language", models.CharField(choices=[("pl", "Polish"), ("en", "English")], default="pl", max_length=2)),
                ("photo", models.ImageField(blank=True, null=True, upload_to="seniors/photos/")),
                ("accessibility_preferences", models.JSONField(blank=True, default=dict)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("family", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="seniors", to="accounts.family")),
            ],
            options={"verbose_name": "senior", "verbose_name_plural": "seniors", "ordering": ["last_name", "first_name"]},
        ),
    ]
