from rest_framework import generics
from rest_framework.response import Response

from apps.accounts.permissions import IsFamilyMember
from apps.seniors.models import Senior
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentWithSeniorSerializer


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = AppointmentSerializer

    def _get_senior(self):
        family = self.request.user.membership.family
        return Senior.objects.get(pk=self.kwargs["senior_id"], family=family)

    def get_queryset(self):
        senior = self._get_senior()
        return (
            Appointment.objects
            .filter(senior=senior)
            .prefetch_related("reminder_configs")
            .select_related("assigned_caregiver")
            .order_by("datetime")
        )

    def perform_create(self, serializer):
        senior = self._get_senior()
        serializer.save(senior=senior)


class FamilyAppointmentListView(generics.ListAPIView):
    """All upcoming appointments across all seniors in the family."""
    permission_classes = [IsFamilyMember]
    serializer_class = AppointmentWithSeniorSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        qs = (
            Appointment.objects
            .filter(senior__family=family, senior__is_archived=False)
            .prefetch_related("reminder_configs")
            .select_related("senior", "assigned_caregiver")
            .order_by("datetime")
        )
        upcoming = self.request.query_params.get("upcoming")
        if upcoming == "true":
            from django.utils import timezone
            qs = qs.filter(datetime__gte=timezone.now())
        return qs


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        senior = Senior.objects.get(pk=self.kwargs["senior_id"], family=family)
        return (
            Appointment.objects
            .filter(senior=senior)
            .prefetch_related("reminder_configs")
            .select_related("assigned_caregiver")
        )
