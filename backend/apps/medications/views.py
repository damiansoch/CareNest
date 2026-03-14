from rest_framework import generics
from rest_framework.response import Response

from apps.accounts.permissions import IsFamilyMember
from apps.seniors.models import Senior
from .models import Medication
from .serializers import MedicationSerializer


class MedicationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = MedicationSerializer

    def _get_senior(self):
        family = self.request.user.membership.family
        return Senior.objects.get(pk=self.kwargs["senior_id"], family=family)

    def get_queryset(self):
        senior = self._get_senior()
        qs = Medication.objects.filter(senior=senior).prefetch_related("schedules")
        active_only = self.request.query_params.get("active", "true").lower() == "true"
        if active_only:
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        senior = self._get_senior()
        serializer.save(senior=senior)


class MedicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = MedicationSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        senior = Senior.objects.get(pk=self.kwargs["senior_id"], family=family)
        return Medication.objects.filter(senior=senior).prefetch_related("schedules")

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of delete."""
        medication = self.get_object()
        medication.is_active = False
        medication.save()
        return Response(status=204)
