
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
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    thumbnail = models.ImageField(upload_to='projects/thumbnails/')
    created_at = models.DateTimeField(auto_now_add=True)
    featured = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class MediaItem(models.Model):
    MEDIA_TYPE = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    project = models.ForeignKey(Project, related_name='media', on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=MEDIA_TYPE)
    image = models.ImageField(upload_to='projects/media/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class Skill(models.Model):
    CATEGORIES = [
        ('Frontend', 'Frontend'),
        ('Backend', 'Backend'),
        ('DevOps', 'DevOps'),
        ('Drone', 'Drone'),
        ('Editing', 'Editing'),
    ]
    name = models.CharField(max_length=100)
    level = models.IntegerField()
    category = models.CharField(max_length=20, choices=CATEGORIES)

    def __str__(self):
        return self.name

class About(models.Model):
    bio = models.TextField()
    profile_image = models.ImageField(upload_to='about/')
    drone_image = models.ImageField(upload_to='about/')

    class Meta:
        verbose_name_plural = "About"
