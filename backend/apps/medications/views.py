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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        self.perform_create(serializer)
        return Response(serializer.data, status=201)

    def perform_create(self, serializer):
        senior = self._get_senior()
        med = serializer.save(senior=senior)
        from apps.notifications.tasks import dispatch_change_notification
        dispatch_change_notification.delay(
            actor_id=str(self.request.user.id),
            family_id=str(senior.family_id),
            event_type="medication_added",
            subject_name=med.name,
            senior_name=senior.full_name,
            detail_url=f"/pl/seniors/{senior.id}/medications",
        )


class MedicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = MedicationSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        senior = Senior.objects.get(pk=self.kwargs["senior_id"], family=family)
        return Medication.objects.filter(senior=senior).prefetch_related("schedules")

    def perform_update(self, serializer):
        med = serializer.save()
        senior = med.senior
        from apps.notifications.tasks import dispatch_change_notification
        dispatch_change_notification.delay(
            actor_id=str(self.request.user.id),
            family_id=str(senior.family_id),
            event_type="medication_updated",
            subject_name=med.name,
            senior_name=senior.full_name,
            detail_url=f"/pl/seniors/{senior.id}/medications",
        )

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of delete."""
        medication = self.get_object()
        senior = medication.senior
        name = medication.name
        medication.is_active = False
        medication.save()
        from apps.notifications.tasks import dispatch_change_notification
        dispatch_change_notification.delay(
            actor_id=str(request.user.id),
            family_id=str(senior.family_id),
            event_type="medication_deleted",
            subject_name=name,
            senior_name=senior.full_name,
            detail_url=f"/pl/seniors/{senior.id}/medications",
        )
        return Response(status=204)
