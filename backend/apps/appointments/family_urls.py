from django.urls import path
from .views import FamilyAppointmentListView

urlpatterns = [
    path("", FamilyAppointmentListView.as_view(), name="family-appointment-list"),
]
