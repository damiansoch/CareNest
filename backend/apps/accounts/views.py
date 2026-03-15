from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, status
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
