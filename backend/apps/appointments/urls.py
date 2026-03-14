from django.urls import path
from .views import AppointmentDetailView, AppointmentListCreateView

urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointment-list"),
    path("<uuid:pk>/", AppointmentDetailView.as_view(), name="appointment-detail"),
]
