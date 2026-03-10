"""
Interactions App - Views for likes and notifications
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from projects.models import Project, MediaItem
from .models import Like, Notification
from .serializers import LikeSerializer, NotificationSerializer


# ============ Like Views ============

class ToggleLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, content_type, content_id):
        user = request.user
        
        if content_type == 'project':
            content_obj = get_object_or_404(Project, id=content_id)
            like_filter = {'user': user, 'project': content_obj}
        elif content_type == 'media':
            content_obj = get_object_or_404(MediaItem, id=content_id)
            like_filter = {'user': user, 'media': content_obj}
        else:
            return Response({'error': 'Invalid content type'}, status=status.HTTP_400_BAD_REQUEST)

        like = Like.objects.filter(**like_filter).first()
        
        if like:
            like.delete()
            if content_type == 'project':
                content_obj.refresh_from_db(fields=['likes_count'])
            else:
                content_obj.refresh_from_db(fields=['likes_count'])
            return Response({'liked': False, 'message': 'Like removed', 'likes_count': max(0, content_obj.likes_count)})
        else:
            Like.objects.create(
                user=user,
                content_type=content_type,
                content_id=content_id,
                **{'project' if content_type == 'project' else 'media': content_obj}
            )
            if content_type == 'project':
                content_obj.refresh_from_db(fields=['likes_count'])
            else:
                content_obj.refresh_from_db(fields=['likes_count'])
            return Response({'liked': True, 'message': 'Liked successfully', 'likes_count': content_obj.likes_count})


class UserLikesView(generics.ListAPIView):
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Like.objects.filter(user=self.request.user)


# ============ Notification Views ============

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipients=self.request.user)


class NotificationUnreadCountView(APIView):
    """Return the number of unread notifications for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipients=request.user
        ).exclude(
            is_read=request.user
        ).count()
        return Response({'unread_count': count})


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, recipients=request.user)
        notification.is_read.add(request.user)
        return Response({'message': 'Notification marked as read'})


class MarkAllNotificationsReadView(APIView):
    """Mark all unread notifications as read for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        unread = Notification.objects.filter(
            recipients=request.user
        ).exclude(is_read=request.user)
        for notif in unread:
            notif.is_read.add(request.user)
        return Response({'message': 'All notifications marked as read'})

