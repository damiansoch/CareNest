from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0003_event_type_url_reminder_days"),
    ]

    operations = [
        migrations.AlterField(
            model_name="appointment",
            name="url",
            field=models.URLField(
                blank=True,
                max_length=2000,
                help_text="Optional link, e.g. shop website",
            ),
        ),
    ]
