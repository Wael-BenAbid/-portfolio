"""
Projects App - Project and media management
"""
from django.db import models
from django.utils.text import slugify


class Project(models.Model):
    CATEGORY_CHOICES = [
        ('Development', 'Development'),
        ('Drone', 'Drone'),
        ('Mixed', 'Mixed'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Development')
    thumbnail = models.URLField(max_length=500, blank=True, null=True, help_text="URL to thumbnail image")
    video_url = models.URLField(blank=True, null=True)
    project_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('api.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def likes_count(self):
        return self.likes.count()


class MediaItem(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    url = models.URLField(max_length=500, help_text="URL to media file")
    thumbnail = models.URLField(max_length=500, blank=True, null=True, help_text="URL to video thumbnail")
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.media_type} - {self.project.title}"

    @property
    def likes_count(self):
        return self.likes.count()


class Skill(models.Model):
    name = models.CharField(max_length=50)
    category = models.CharField(max_length=50, blank=True)
    proficiency = models.IntegerField(default=80, help_text="Skill proficiency (0-100)")
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or name")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
