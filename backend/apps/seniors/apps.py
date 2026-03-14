from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class SeniorsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.seniors"
    verbose_name = _("Seniors")
