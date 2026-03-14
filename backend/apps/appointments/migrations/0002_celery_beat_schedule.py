"""
Data migration: registers the appointment reminder Celery beat periodic task.
Requires django-celery-beat to be installed and migrated first.
"""
from django.db import migrations


def create_periodic_task(apps, schema_editor):
    try:
        IntervalSchedule = apps.get_model("django_celery_beat", "IntervalSchedule")
        PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    except LookupError:
        # django_celery_beat not yet migrated — skip silently
        return

    schedule, _ = IntervalSchedule.objects.get_or_create(
        every=15,
        period=IntervalSchedule.MINUTES,
    )

    PeriodicTask.objects.update_or_create(
        name="Send appointment reminders",
        defaults={
            "task": "apps.appointments.tasks.send_appointment_reminders",
            "interval": schedule,
            "enabled": True,
        },
    )


def remove_periodic_task(apps, schema_editor):
    try:
        PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
        PeriodicTask.objects.filter(name="Send appointment reminders").delete()
    except LookupError:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("appointments", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_periodic_task, remove_periodic_task),
    ]
