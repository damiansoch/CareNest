"""
CareNest REST API v1 URL configuration.
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth
    path("auth/", include("apps.accounts.urls")),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Family & team
    path("family/", include("apps.accounts.family_urls")),

    # Seniors, medications, appointments (nested under seniors)
    path("seniors/", include("apps.seniors.urls")),
    path("seniors/<uuid:senior_id>/medications/", include("apps.medications.urls")),
    path("seniors/<uuid:senior_id>/appointments/", include("apps.appointments.urls")),

    # Family-wide appointment list (all seniors)
    path("appointments/", include("apps.appointments.family_urls")),
]
