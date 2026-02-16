"""
Interactions App - User interactions (likes, notifications)
"""
from django.db import models
from django.utils import timezone


class Like(models.Model):
    """User likes for projects and media"""
    user = models.ForeignKey('api.CustomUser', on_delete=models.CASCADE, related_name='likes')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    media = models.ForeignKey('projects.MediaItem', on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    content_type = models.CharField(max_length=20)  # 'project' or 'media'
    content_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'content_type', 'content_id']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} liked {self.content_type}:{self.content_id}"


class Notification(models.Model):
    """User notifications"""
    NOTIFICATION_TYPES = [
        ('new_project', 'New Project'),
        ('update', 'Update'),
        ('message', 'Message'),
        ('like', 'Like'),
        ('system', 'System'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    recipients = models.ManyToManyField('api.CustomUser', related_name='notifications', blank=True)
    is_read = models.ManyToManyField('api.CustomUser', related_name='read_notifications', blank=True)
    link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def mark_as_read(self, user):
        """Mark notification as read for a specific user"""
        self.is_read.add(user)
    
    def is_read_by(self, user):
        """Check if notification is read by a specific user"""
        return user in self.is_read.all()
