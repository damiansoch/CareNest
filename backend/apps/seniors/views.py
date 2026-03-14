from rest_framework import generics, filters
from rest_framework.response import Response

from apps.accounts.permissions import IsFamilyMember
from .models import Senior
from .serializers import SeniorListSerializer, SeniorSerializer


class SeniorListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFamilyMember]
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name"]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return SeniorListSerializer
        return SeniorSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        qs = Senior.objects.filter(family=family)
        include_archived = self.request.query_params.get("archived", "false").lower() == "true"
        if not include_archived:
            qs = qs.filter(is_archived=False)
        return qs

    def perform_create(self, serializer):
        family = self.request.user.membership.family
        serializer.save(family=family)


class SeniorDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = SeniorSerializer

    def get_queryset(self):
        family = self.request.user.membership.family
        return Senior.objects.filter(family=family)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: archive instead of delete."""
        senior = self.get_object()
        senior.is_archived = True
        senior.save()
        return Response(status=204)
