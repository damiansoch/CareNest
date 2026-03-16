"""
Celery tasks for appointment/event reminder emails.

Reminder schedule (checked once daily at 08:00 Warsaw time):
  offset_hours=168 → send when event is exactly 7 days away (today + 7)
  offset_hours=48  → send when event is exactly 2 days away (today + 2)
  offset_hours=0   → send on the day of the event (today)
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError
from django.utils import timezone

logger = logging.getLogger(__name__)

# Maps offset_hours value → how many days before the event to send
_OFFSET_TO_DAYS = {
    0: 0,    # on the day
    48: 2,   # 2 days before
    168: 7,  # 7 days (1 week) before
}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_appointment_reminders(self):
    """
    Periodic task: send due reminder emails for upcoming events.
    Runs once daily at 08:00 Warsaw time via Celery Beat.

    For each enabled offset (on the day / 2 days before / 7 days before) we
    look for events whose date matches today + N days. This is reliable because
    the task runs daily — no need for a sliding time-window.

    Idempotent: ReminderLog unique constraint prevents duplicate sends.
    """
    from .models import Appointment, ReminderLog

    # Use local date in Warsaw timezone (same tz as Celery Beat schedule)
    local_now = timezone.localtime(timezone.now())
    today = local_now.date()

    for offset_hours, days_before in _OFFSET_TO_DAYS.items():
        target_date = today + timedelta(days=days_before)

        appointments = (
            Appointment.objects
            .filter(datetime__date=target_date)
            .prefetch_related(
                "reminder_configs",
                "reminder_logs",
                "senior",
                "senior__family__memberships__user",
            )
            .select_related("assigned_caregiver", "senior")
        )

        for appointment in appointments:
            config = appointment.reminder_configs.filter(
                offset_hours=offset_hours,
                is_enabled=True,
            ).first()

            if not config:
                continue

            already_sent = appointment.reminder_logs.filter(
                offset_hours=offset_hours,
                status=ReminderLog.Status.SENT,
            ).exists()

            if already_sent:
                continue

            _dispatch_reminder_email(appointment, offset_hours)


def _dispatch_reminder_email(appointment, offset_hours):
    """Send a single reminder email and log the result."""
    from .models import Appointment, ReminderLog

    senior = appointment.senior
    family = senior.family

    # Recipients: everyone in the family (all roles)
    recipients = list(
        family.memberships
        .values_list("user__email", flat=True)
        .distinct()
    )

    days_before = _OFFSET_TO_DAYS.get(offset_hours, 0)
    event_date_str = appointment.datetime.strftime(
        "%d.%m.%Y %H:%M" if senior.preferred_language == "pl" else "%Y-%m-%d %H:%M"
    )

    is_pl = senior.preferred_language == "pl"
    event_type = appointment.event_type

    # ── Subject ──────────────────────────────────────────────────────────────
    if is_pl:
        if days_before == 0:
            timing = "Dziś"
        elif days_before == 2:
            timing = "Za 2 dni"
        else:
            timing = "Za 7 dni"
        subject = f"Przypomnienie ({timing}): {appointment.title} — {senior.full_name}"
    else:
        if days_before == 0:
            timing = "Today"
        elif days_before == 2:
            timing = "In 2 days"
        else:
            timing = "In 7 days"
        subject = f"Reminder ({timing}): {appointment.title} — {senior.full_name}"

    # ── Body ─────────────────────────────────────────────────────────────────
    if is_pl:
        type_labels = {
            Appointment.EventType.APPOINTMENT: "Wizyta lekarska",
            Appointment.EventType.SHOPPING: "Zakupy / zaopatrzenie",
            Appointment.EventType.OTHER: "Inne",
        }
        type_label = type_labels.get(event_type, event_type)
        body_lines = [
            f"Przypomnienie o nadchodzącym zdarzeniu:\n",
            f"Podopieczny: {senior.full_name}",
            f"Rodzaj: {type_label}",
            f"Tytuł: {appointment.title}",
            f"Data i godzina: {event_date_str}",
        ]
        if event_type == Appointment.EventType.APPOINTMENT:
            if appointment.doctor_name:
                body_lines.append(f"Lekarz: {appointment.doctor_name}")
            if appointment.location:
                body_lines.append(f"Lokalizacja: {appointment.location}")
        if appointment.url:
            body_lines.append(f"Link: {appointment.url}")
        if appointment.notes:
            body_lines.append(f"Notatki: {appointment.notes}")
    else:
        type_labels = {
            Appointment.EventType.APPOINTMENT: "Medical appointment",
            Appointment.EventType.SHOPPING: "Shopping / supplies",
            Appointment.EventType.OTHER: "Other",
        }
        type_label = type_labels.get(event_type, event_type)
        body_lines = [
            f"Reminder for an upcoming event:\n",
            f"Person in care: {senior.full_name}",
            f"Type: {type_label}",
            f"Title: {appointment.title}",
            f"Date & time: {event_date_str}",
        ]
        if event_type == Appointment.EventType.APPOINTMENT:
            if appointment.doctor_name:
                body_lines.append(f"Doctor: {appointment.doctor_name}")
            if appointment.location:
                body_lines.append(f"Location: {appointment.location}")
        if appointment.url:
            body_lines.append(f"Link: {appointment.url}")
        if appointment.notes:
            body_lines.append(f"Notes: {appointment.notes}")

    body = "\n".join(body_lines)

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
            "Reminder sent for event %s (offset %dh / %d days before)",
            appointment.id,
            offset_hours,
            days_before,
        )
    except IntegrityError:
        # Race condition: another worker already sent this. Safe to ignore.
        logger.warning(
            "Duplicate reminder blocked for event %s (offset %dh)",
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
            "Failed to send reminder for event %s: %s",
            appointment.id,
            exc,
        )
