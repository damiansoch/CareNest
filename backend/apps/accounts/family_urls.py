from django.urls import path

from .views import FamilyView, InvitationListCreateView, MemberRemoveView, MembersView

urlpatterns = [
    path("", FamilyView.as_view(), name="family-detail"),
    path("members/", MembersView.as_view(), name="family-members"),
    path("members/<uuid:pk>/", MemberRemoveView.as_view(), name="family-member-remove"),
    path("invitations/", InvitationListCreateView.as_view(), name="family-invitations"),
]
