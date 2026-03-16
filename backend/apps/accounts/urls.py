from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    AcceptInvitationView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("invitations/<uuid:token>/", AcceptInvitationView.as_view(), name="invitation-detail"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
