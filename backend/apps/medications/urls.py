from django.urls import path
from .views import MedicationDetailView, MedicationListCreateView

urlpatterns = [
    path("", MedicationListCreateView.as_view(), name="medication-list"),
    path("<uuid:pk>/", MedicationDetailView.as_view(), name="medication-detail"),
]
