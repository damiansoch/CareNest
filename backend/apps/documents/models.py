import uuid

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.utils.translation import gettext_lazy as _


class Document(models.Model):
    """A named document belonging to a senior, composed of one or more pages."""

    class Category(models.TextChoices):
        MEDICAL_REPORT    = "medical_report",    _("Medical Report")
        PRESCRIPTION      = "prescription",      _("Prescription")
        LAB_RESULT        = "lab_result",        _("Lab Result")
        INSURANCE         = "insurance",         _("Insurance")
        IDENTITY          = "identity",          _("Identity Document")
        CONSENT_FORM      = "consent_form",      _("Consent Form")
        REFERRAL          = "referral",          _("Referral")
        DISCHARGE_SUMMARY = "discharge_summary", _("Discharge Summary")
        OTHER             = "other",             _("Other")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    senior = models.ForeignKey(
        "seniors.Senior",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    name = models.CharField(max_length=300)
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.OTHER,
    )
    tags = ArrayField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        help_text=_("Free-form tags for additional filtering"),
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("document")
        verbose_name_plural = _("documents")
        ordering = ["-created_at"]
        indexes = [
            GinIndex(fields=["tags"], name="document_tags_gin"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_category_display()}) — {self.senior}"


class DocumentPage(models.Model):
    """A single page (image or PDF) within a document."""

    ALLOWED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "application/pdf",
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="pages",
    )
    page_number = models.PositiveSmallIntegerField()
    mime_type = models.CharField(max_length=30)
    file_size = models.PositiveIntegerField(help_text=_("Size in bytes"))
    # Binary content — never exposed through serializers, only streamed via the
    # dedicated content endpoint.
    content = models.BinaryField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("document page")
        verbose_name_plural = _("document pages")
        unique_together = [("document", "page_number")]
        ordering = ["document", "page_number"]

    def __str__(self) -> str:
        return f"{self.document.name} — page {self.page_number}"
