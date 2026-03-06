"""
Projects App - Project and media management
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify


class Project(models.Model):
    CATEGORY_CHOICES = [
        ('Développement', 'Développement'),
        ('Drone', 'Drone'),
        ('Mélangé', 'Mélangé'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)  # unique=True automatically creates an index
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Développement')
    thumbnail = models.URLField(max_length=500, blank=True, null=True, help_text="URL to thumbnail image")
    video_url = models.URLField(blank=True, null=True)
    project_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    show_registration = models.BooleanField(default=True, help_text="Show registration button on project detail page")
    created_by = models.ForeignKey('api.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes_count = models.IntegerField(default=0, editable=False)
    views_count = models.IntegerField(default=0, editable=False)

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
        
        # Fix category encoding issue
        if self.category:
            try:
                # Fix UTF-8 encoding issue (e.g., "D\xc3\xa9veloppement" to "Développement")
                self.category = self.category.encode('latin-1').decode('utf-8')
            except:
                pass
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class MediaItem(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    file = models.FileField(
        upload_to='project_media/%Y/%m/',
        null=True,
        blank=True,
        help_text="Upload high-resolution image or video file (max 50MB)"
    )
    thumbnail = models.ImageField(
        upload_to='project_media/thumbnails/%Y/%m/',
        blank=True,
        null=True,
        help_text="Optional thumbnail for videos"
    )
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.IntegerField(default=0, editable=False)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.media_type} - {self.project.title}"
    
    @property
    def url(self):
        """Return the URL of the uploaded file"""
        if self.file:
            return self.file.url
        return None


class Skill(models.Model):
    name = models.CharField(max_length=50)
    category = models.CharField(max_length=50, blank=True)
    proficiency = models.IntegerField(
        default=80,
        help_text="Skill proficiency (0-100)",
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or name")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
