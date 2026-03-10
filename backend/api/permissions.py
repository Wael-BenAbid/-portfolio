"""
Custom permission classes for the API
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the resource
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return bool(
            request.user.is_superuser
            or request.user.is_staff
            or (hasattr(request.user, 'is_admin') and request.user.is_admin())
            or getattr(request.user, 'user_type', None) == 'admin'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit the resource,
    but allow read access to all
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        return bool(
            request.user.is_superuser
            or request.user.is_staff
            or (hasattr(request.user, 'is_admin') and request.user.is_admin())
            or getattr(request.user, 'user_type', None) == 'admin'
        )
