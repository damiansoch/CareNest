from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Invitation
from .permissions import IsFamilyAdmin, IsFamilyMember
from .serializers import (
    CreateInvitationSerializer,
    FamilySerializer,
    InvitationSerializer,
    MembershipSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class FamilyView(generics.RetrieveUpdateAPIView):
    serializer_class = FamilySerializer
    permission_classes = [IsFamilyMember]

    def get_object(self):
        return self.request.user.membership.family

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsFamilyAdmin()]
        return super().get_permissions()


class MembersView(generics.ListAPIView):
    serializer_class = MembershipSerializer
    permission_classes = [IsFamilyMember]

    def get_queryset(self):
        family = self.request.user.membership.family
        return family.memberships.select_related("user").all()


class InvitationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFamilyAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateInvitationSerializer
        return InvitationSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        return family.invitations.select_related("invited_by").all()

    def create(self, request, *args, **kwargs):
        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        family = request.user.membership.family
        expires_at = timezone.now() + timedelta(hours=settings.INVITATION_EXPIRY_HOURS)

        invitation = Invitation.objects.create(
            family=family,
            invited_by=request.user,
            email=serializer.validated_data["email"],
            role=serializer.validated_data["role"],
            expires_at=expires_at,
        )

        # Send invitation email
        invite_url = f"{settings.FRONTEND_URL}/pl/auth/register?token={invitation.token}"
        send_mail(
            subject=f"Zaproszenie do CareNest — {family.name}",
            message=(
                f"Zostałeś zaproszony do rodziny \"{family.name}\" w CareNest.\n\n"
                f"Kliknij link, aby dołączyć: {invite_url}\n\n"
                f"Link wygasa za {settings.INVITATION_EXPIRY_HOURS} godzin."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=True,
        )

        return Response(
            InvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )


class AcceptInvitationView(APIView):
    """Check if an invitation token is valid (used during registration flow)."""
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            invitation = Invitation.objects.select_related("family").get(
                token=token,
                status=Invitation.Status.PENDING,
            )
        except Invitation.DoesNotExist:
            return Response(
                {"detail": _("Invalid or expired invitation.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invitation.is_expired:
            return Response(
                {"detail": _("This invitation has expired.")},
                status=status.HTTP_410_GONE,
            )

        return Response({
            "email": invitation.email,
            "family_name": invitation.family.name,
            "role": invitation.role,
        })


class PasswordResetRequestView(APIView):
    """Send a password-reset email. Always returns 200 to avoid email enumeration."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.FRONTEND_URL}/pl/auth/reset-password"
                f"?uid={uid}&token={token}"
            )
            send_mail(
                subject="CareNest — Reset hasła",
                message=(
                    "Otrzymaliśmy prośbę o reset hasła do konta CareNest.\n\n"
                    f"Kliknij link, aby ustawić nowe hasło:\n{reset_url}\n\n"
                    "Jeśli nie składałeś/aś tej prośby, zignoruj tę wiadomość.\n"
                    "Link jest ważny przez 24 godziny."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Do not reveal whether the email exists
        return Response({"detail": "If this email exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    """Validate the reset token and set a new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        password = request.data.get("password", "")

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": _("Invalid link.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": _("Invalid or expired token.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"password": [_("Password must be at least 8 characters.")]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()
        return Response({"detail": "Password has been reset successfully."})


class MemberRemoveView(generics.DestroyAPIView):
    """Remove a caregiver from the family. Admin only; cannot remove yourself."""
    permission_classes = [IsFamilyAdmin]
    serializer_class = MembershipSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        return family.memberships.select_related("user").all()

    def perform_destroy(self, instance):
        if instance.user == self.request.user:
            raise PermissionDenied(_("You cannot remove yourself from the family."))
        instance.delete()
