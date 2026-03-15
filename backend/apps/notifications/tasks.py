from celery import shared_task

from .service import send_change_notification


@shared_task(bind=True, max_retries=3, default_retry_delay=30, name="notifications.dispatch_change_notification")
def dispatch_change_notification(self, **kwargs) -> None:
    """
    Asynchronous wrapper around send_change_notification.

    All keyword arguments are forwarded directly to the service function.
    Retries up to 3 times on transient failures (e.g. SMTP timeouts).
    """
    try:
        send_change_notification(**kwargs)
    except Exception as exc:
        raise self.retry(exc=exc)
