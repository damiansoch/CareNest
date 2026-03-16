"""
Change notification service.

Called from DRF views (not signals) so that we always have access to the
actor (the user who performed the action) and can exclude them from the
recipient list.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

# ── Event message tables ──────────────────────────────────────────────────────

_PL_EVENTS: dict[str, tuple[str, str]] = {
    "senior_added":           ("Dodano podopiecznego",        "Dodano nowego podopiecznego: {subject}."),
    "senior_archived":        ("Zarchiwizowano podopiecznego", "Podopieczny {subject} został zarchiwizowany."),
    "medication_added":       ("Dodano lek",                  'Dodano lek \u201e{subject}\u201d dla {senior}.'),
    "medication_updated":     ("Zaktualizowano lek",          'Lek \u201e{subject}\u201d dla {senior} został zaktualizowany.'),
    "medication_deleted":     ("Usunięto lek",                'Lek \u201e{subject}\u201d dla {senior} został usunięty.'),
    "appointment_created":    ("Dodano wizytę",               'Dodano wizytę \u201e{subject}\u201d dla {senior}.'),
    "appointment_updated":    ("Zaktualizowano wizytę",       'Wizyta \u201e{subject}\u201d dla {senior} została zaktualizowana.'),
    "appointment_deleted":    ("Usunięto wizytę",             'Wizyta \u201e{subject}\u201d dla {senior} została usunięta.'),
    "document_uploaded":      ("Przesłano dokument",          'Przesłano dokument \u201e{subject}\u201d dla {senior}.'),
}

_EN_EVENTS: dict[str, tuple[str, str]] = {
    "senior_added":           ("Senior added",            "A new senior was added: {subject}."),
    "senior_archived":        ("Senior archived",         "Senior {subject} has been archived."),
    "medication_added":       ("Medication added",        "Medication \"{subject}\" was added for {senior}."),
    "medication_updated":     ("Medication updated",      "Medication \"{subject}\" for {senior} was updated."),
    "medication_deleted":     ("Medication deleted",      "Medication \"{subject}\" for {senior} was deleted."),
    "appointment_created":    ("Appointment created",     "Appointment \"{subject}\" was created for {senior}."),
    "appointment_updated":    ("Appointment updated",     "Appointment \"{subject}\" for {senior} was updated."),
    "appointment_deleted":    ("Appointment deleted",     "Appointment \"{subject}\" for {senior} was deleted."),
    "document_uploaded":      ("Document uploaded",       "Document \"{subject}\" was uploaded for {senior}."),
}


# ── Public API ────────────────────────────────────────────────────────────────

def send_change_notification(
    *,
    actor_id: str,
    family_id: str,
    event_type: str,
    subject_name: str,
    senior_name: str,
    detail_url: str,
) -> None:
    """
    Send a change-notification email to all family caregivers except the actor.

    Parameters
    ----------
    actor_id     : UUID string of the user who performed the action
    family_id    : UUID string of the family
    event_type   : one of the keys in _PL_EVENTS / _EN_EVENTS
    subject_name : human-readable name of the object that changed
    senior_name  : full name of the related senior
    detail_url   : relative frontend path, e.g. "/pl/seniors/<id>/medications"
    """
    from apps.accounts.models import CaregiverMembership  # avoid circular import at module load

    recipients = list(
        CaregiverMembership.objects
        .filter(family_id=family_id)
        .select_related("user")
        .values_list("user__email", "user__preferred_language", named=True)
    )

    if not recipients:
        return

    full_url = f"{settings.FRONTEND_URL}{detail_url}"
    actor_label = _get_actor_name(actor_id)

    pl_emails = [r.user__email for r in recipients if r.user__preferred_language == "pl"]
    en_emails = [r.user__email for r in recipients if r.user__preferred_language != "pl"]

    if pl_emails:
        subject, body = _build_message(_PL_EVENTS, event_type, subject_name, senior_name, full_url, actor_label, lang="pl")
        _send(subject, body, pl_emails)

    if en_emails:
        subject, body = _build_message(_EN_EVENTS, event_type, subject_name, senior_name, full_url, actor_label, lang="en")
        _send(subject, body, en_emails)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_actor_name(actor_id: str) -> str:
    from apps.accounts.models import User
    try:
        u = User.objects.get(pk=actor_id)
        return u.get_full_name() or u.email
    except User.DoesNotExist:
        return ""


def _build_message(
    event_table: dict,
    event_type: str,
    subject_name: str,
    senior_name: str,
    full_url: str,
    actor_label: str,
    lang: str,
) -> tuple[str, str]:
    default = ("CareNest", "A change was made." if lang == "en" else "Nastąpiła zmiana.")
    title, tmpl = event_table.get(event_type, default)
    description = tmpl.format(subject=subject_name, senior=senior_name)

    if lang == "pl":
        body = (
            f"{description}\n\n"
            f"Zmienił(a): {actor_label}\n"
            f"Link: {full_url}\n\n"
            f"— CareNest"
        )
    else:
        body = (
            f"{description}\n\n"
            f"Changed by: {actor_label}\n"
            f"Link: {full_url}\n\n"
            f"— CareNest"
        )

    return f"CareNest: {title}", body


def _send(subject: str, body: str, recipient_list: list[str]) -> None:
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send change notification to %s", recipient_list)
