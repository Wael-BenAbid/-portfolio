"""
Custom permission classes for the API
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the resource
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit the resource,
    but allow read access to all
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_admin()
