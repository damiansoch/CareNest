from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Family, CaregiverMembership, Invitation

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "preferred_language"]
        read_only_fields = ["id", "email"]


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    family_name = serializers.CharField(max_length=200, required=False)
    invitation_token = serializers.UUIDField(required=False)

    def validate_email(self, value):
        # Full uniqueness check is deferred to validate() where we have the
        # full context (invitation token) to allow re-joining after removal.
        return value.lower()

    def validate(self, data):
        email = data.get("email", "")
        invitation_token = data.get("invitation_token")

        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            if not invitation_token:
                # No invitation — this is a new-family registration, block duplicates.
                raise serializers.ValidationError(
                    {"email": _("A user with this email already exists.")}
                )
            if hasattr(existing_user, "membership"):
                # Already a member of some family.
                raise serializers.ValidationError(
                    {"email": _("This user is already a member of a family.")}
                )
            # Existing user with no membership + valid invitation → re-join allowed.
            data["_existing_user"] = existing_user

        if not data.get("family_name") and not invitation_token:
            raise serializers.ValidationError(
                _("Provide either a family name (new family) or an invitation token.")
            )
        if invitation_token:
            try:
                invitation = Invitation.objects.get(
                    token=invitation_token,
                    status=Invitation.Status.PENDING,
                )
            except Invitation.DoesNotExist:
                raise serializers.ValidationError(_("Invalid or expired invitation token."))
            if invitation.is_expired:
                raise serializers.ValidationError(_("This invitation has expired."))
            data["_invitation"] = invitation
        return data

    def create(self, validated_data):
        existing_user = validated_data.pop("_existing_user", None)
        invitation = validated_data.pop("_invitation", None)
        family_name = validated_data.pop("family_name", None)

        if existing_user:
            # Re-join: reuse the existing account, do not create a new one or
            # change their password.
            user = existing_user
        else:
            user = User.objects.create_user(
                username=validated_data["email"],
                email=validated_data["email"],
                password=validated_data["password"],
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
            )

        if invitation:
            family = invitation.family
            role = invitation.role
            invitation.status = Invitation.Status.ACCEPTED
            invitation.accepted_at = timezone.now()
            invitation.save()
        else:
            family = Family.objects.create(name=family_name)
            role = CaregiverMembership.Role.ADMIN

        CaregiverMembership.objects.create(user=user, family=family, role=role)
        return user


class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CaregiverMembership
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class InvitationSerializer(serializers.ModelSerializer):
    invited_by = UserSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ["id", "token", "email", "role", "status", "created_at", "expires_at", "invited_by"]
        read_only_fields = ["id", "token", "status", "created_at", "expires_at", "invited_by"]

    def validate_email(self, value):
        return value.lower()


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=CaregiverMembership.Role.choices,
        default=CaregiverMembership.Role.MEMBER,
    )

    def validate_email(self, value):
        return value.lower()
