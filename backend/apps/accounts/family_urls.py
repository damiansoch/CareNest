from django.urls import path

from .views import FamilyView, InvitationListCreateView, MembersView

urlpatterns = [
    path("", FamilyView.as_view(), name="family-detail"),
    path("members/", MembersView.as_view(), name="family-members"),
    path("invitations/", InvitationListCreateView.as_view(), name="family-invitations"),
]
