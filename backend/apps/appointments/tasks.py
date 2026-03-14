"""
Celery tasks for appointment reminder emails.
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_appointment_reminders(self):
    """
    Periodic task: scan upcoming appointments and send due reminder emails.
    Runs every 15 minutes via Celery Beat.

    Idempotent: ReminderLog unique constraint prevents duplicate sends.
    """
    from .models import Appointment, ReminderConfig, ReminderLog

    now = timezone.now()
    # Look ahead far enough to catch 24h reminders
    lookahead = now + timedelta(hours=25)

    appointments = (
        Appointment.objects
        .filter(datetime__gte=now, datetime__lte=lookahead)
        .prefetch_related(
            "reminder_configs",
            "reminder_logs",
            "senior",
            "senior__family__memberships__user",
        )
        .select_related("assigned_caregiver", "senior")
    )

    for appointment in appointments:
        for config in appointment.reminder_configs.filter(is_enabled=True):
            send_time = appointment.datetime - timedelta(hours=config.offset_hours)

            if now < send_time:
                # Not yet time to send
                continue

            # Check if already sent (unique constraint is the true guard)
            already_sent = appointment.reminder_logs.filter(
                offset_hours=config.offset_hours,
                status=ReminderLog.Status.SENT,
            ).exists()

            if already_sent:
                continue

            _dispatch_reminder_email(appointment, config.offset_hours)


def _dispatch_reminder_email(appointment, offset_hours):
    """Send a single reminder email and log the result."""
    from .models import ReminderLog

    senior = appointment.senior
    family = senior.family

    # Recipients: all admin caregivers + assigned caregiver (deduplicated)
    admin_emails = list(
        family.memberships
        .filter(role="admin")
        .values_list("user__email", flat=True)
    )
    if appointment.assigned_caregiver:
        admin_emails.append(appointment.assigned_caregiver.email)
    recipients = list(set(admin_emails))

    subject = (
        f"Przypomnienie: {appointment.title} — {senior.full_name}"
        if senior.preferred_language == "pl"
        else f"Reminder: {appointment.title} — {senior.full_name}"
    )

    if senior.preferred_language == "pl":
        body = (
            f"Przypomnienie o wizycie lekarskiej:\n\n"
            f"Pacjent: {senior.full_name}\n"
            f"Tytuł: {appointment.title}\n"
            f"Lekarz: {appointment.doctor_name or '—'}\n"
            f"Lokalizacja: {appointment.location or '—'}\n"
            f"Data i godzina: {appointment.datetime.strftime('%d.%m.%Y %H:%M')}\n"
            f"Notatki: {appointment.notes or '—'}\n"
        )
    else:
        body = (
            f"Appointment reminder:\n\n"
            f"Patient: {senior.full_name}\n"
            f"Title: {appointment.title}\n"
            f"Doctor: {appointment.doctor_name or '—'}\n"
            f"Location: {appointment.location or '—'}\n"
            f"Date & time: {appointment.datetime.strftime('%Y-%m-%d %H:%M')}\n"
            f"Notes: {appointment.notes or '—'}\n"
        )

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
        ReminderLog.objects.create(
            appointment=appointment,
            offset_hours=offset_hours,
            status=ReminderLog.Status.SENT,
        )
        logger.info(
            "Reminder sent for appointment %s (%dh before)",
            appointment.id,
            offset_hours,
        )
    except IntegrityError:
        # Race condition: another worker already sent this. Safe to ignore.
        logger.warning(
            "Duplicate reminder blocked for appointment %s (%dh)",
            appointment.id,
            offset_hours,
        )
    except Exception as exc:
        ReminderLog.objects.get_or_create(
            appointment=appointment,
            offset_hours=offset_hours,
            defaults={
                "status": ReminderLog.Status.FAILED,
                "error_message": str(exc),
            },
        )
        logger.error(
            "Failed to send reminder for appointment %s: %s",
            appointment.id,
            exc,
        )
