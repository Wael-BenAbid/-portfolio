"""
Signals for Interactions App - Handles likes count updates
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from interactions.models import Like
from projects.models import Project, MediaItem


@receiver(post_save, sender=Like)
def update_likes_count_on_save(sender, instance, created, **kwargs):
    """Update likes count when a like is saved using atomic F expressions"""
    if created:
        if instance.content_type == 'project' and instance.project:
            Project.objects.filter(pk=instance.project.pk).update(
                likes_count=F('likes_count') + 1
            )
        elif instance.content_type == 'media' and instance.media:
            MediaItem.objects.filter(pk=instance.media.pk).update(
                likes_count=F('likes_count') + 1
            )


@receiver(post_delete, sender=Like)
def update_likes_count_on_delete(sender, instance, **kwargs):
    """Update likes count when a like is deleted using atomic F expressions"""
    if instance.content_type == 'project' and instance.project:
        Project.objects.filter(pk=instance.project.pk, likes_count__gt=0).update(
            likes_count=F('likes_count') - 1
        )
    elif instance.content_type == 'media' and instance.media:
        MediaItem.objects.filter(pk=instance.media.pk, likes_count__gt=0).update(
            likes_count=F('likes_count') - 1
        )
