import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Senior(models.Model):
    """A senior person managed by a family."""

    class Language(models.TextChoices):
        POLISH = "pl", _("Polish")
        ENGLISH = "en", _("English")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "accounts.Family",
        on_delete=models.CASCADE,
        related_name="seniors",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    preferred_language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.POLISH,
    )
    photo = models.ImageField(upload_to="seniors/photos/", null=True, blank=True)
    # e.g. {"large_text": true, "high_contrast": false}
    accessibility_preferences = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("senior")
        verbose_name_plural = _("seniors")
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
