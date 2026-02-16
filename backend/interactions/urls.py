"""
Interactions App - URL routes for likes and notifications
"""
from django.urls import path
from . import views

urlpatterns = [
    # Likes
    path('like/<str:content_type>/<int:content_id>/', views.ToggleLikeView.as_view(), name='toggle-like'),
    path('my-likes/', views.UserLikesView.as_view(), name='user-likes'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='mark-notification-read'),
]
