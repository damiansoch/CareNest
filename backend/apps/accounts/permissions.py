from rest_framework.permissions import BasePermission


class IsFamilyMember(BasePermission):
    """User must belong to a family."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "membership")
        )


class IsFamilyAdmin(BasePermission):
    """User must be an admin of their family."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "membership")
            and request.user.membership.is_admin
        )
