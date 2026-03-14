import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Extended user with family membership and language preference."""

    class Language(models.TextChoices):
        POLISH = "pl", _("Polish")
        ENGLISH = "en", _("English")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    preferred_language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.POLISH,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"


class Family(models.Model):
    """Top-level tenant. All data is scoped to a family."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("family")
        verbose_name_plural = _("families")

    def __str__(self):
        return self.name


class CaregiverMembership(models.Model):
    """Connects a User to a Family with a role."""

    class Role(models.TextChoices):
        ADMIN = "admin", _("Admin")
        MEMBER = "member", _("Member")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="membership",
    )
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("caregiver membership")
        verbose_name_plural = _("caregiver memberships")

    def __str__(self):
        return f"{self.user} — {self.family} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


class Invitation(models.Model):
    """Email-based invitation to join a family as a caregiver."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        ACCEPTED = "accepted", _("Accepted")
        EXPIRED = "expired", _("Expired")
        REVOKED = "revoked", _("Revoked")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_invitations",
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=10,
        choices=CaregiverMembership.Role.choices,
        default=CaregiverMembership.Role.MEMBER,
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("invitation")
        verbose_name_plural = _("invitations")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invite {self.email} → {self.family} ({self.status})"

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expires_at < timezone.now()
