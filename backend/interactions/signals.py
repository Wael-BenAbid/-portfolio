"""
Signals for Interactions App - Handles likes count updates
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from interactions.models import Like
from projects.models import Project, MediaItem


@receiver(post_save, sender=Like)
def update_likes_count_on_save(sender, instance, created, **kwargs):
    """Update likes count when a like is saved"""
    if created:
        if instance.content_type == 'project' and instance.project:
            instance.project.likes_count += 1
            instance.project.save(update_fields=['likes_count'])
        elif instance.content_type == 'media' and instance.media:
            instance.media.likes_count += 1
            instance.media.save(update_fields=['likes_count'])


@receiver(post_delete, sender=Like)
def update_likes_count_on_delete(sender, instance, **kwargs):
    """Update likes count when a like is deleted"""
    if instance.content_type == 'project' and instance.project:
        instance.project.likes_count = max(0, instance.project.likes_count - 1)
        instance.project.save(update_fields=['likes_count'])
    elif instance.content_type == 'media' and instance.media:
        instance.media.likes_count = max(0, instance.media.likes_count - 1)
        instance.media.save(update_fields=['likes_count'])
