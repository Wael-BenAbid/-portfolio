"""
CV App - Curriculum Vitae / Resume models
"""
from django.db import models


class CVExperience(models.Model):
    """Work experience entries"""
    title = models.CharField(max_length=100)
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Experience"
        verbose_name_plural = "CV Experiences"
    
    def __str__(self):
        return f"{self.title} at {self.company}"


class CVEducation(models.Model):
    """Education entries"""
    degree = models.CharField(max_length=100)
    institution = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    gpa = models.CharField(max_length=10, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Education"
        verbose_name_plural = "CV Education"
    
    def __str__(self):
        return f"{self.degree} at {self.institution}"


class CVSkill(models.Model):
    """Skills for CV"""
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    SKILL_CATEGORIES = [
        ('technical', 'Technical'),
        ('language', 'Language'),
        ('soft', 'Soft Skills'),
        ('tool', 'Tools & Software'),
        ('other', 'Other'),
    ]
    name = models.CharField(max_length=50)
    level = models.CharField(max_length=20, choices=SKILL_LEVELS, default='intermediate')
    category = models.CharField(max_length=20, choices=SKILL_CATEGORIES, default='technical')
    percentage = models.IntegerField(default=80, help_text="Skill percentage (0-100)")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', '-percentage', 'order']
        verbose_name = "CV Skill"
        verbose_name_plural = "CV Skills"
    
    def __str__(self):
        return f"{self.name} ({self.level})"


class CVLanguage(models.Model):
    """Language proficiency"""
    LANGUAGE_LEVELS = [
        ('native', 'Native'),
        ('fluent', 'Fluent'),
        ('advanced', 'Advanced'),
        ('intermediate', 'Intermediate'),
        ('basic', 'Basic'),
    ]
    name = models.CharField(max_length=50)
    level = models.CharField(max_length=20, choices=LANGUAGE_LEVELS, default='intermediate')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-level']
        verbose_name = "CV Language"
        verbose_name_plural = "CV Languages"
    
    def __str__(self):
        return f"{self.name} ({self.level})"


class CVCertification(models.Model):
    """Professional certifications"""
    name = models.CharField(max_length=100)
    issuer = models.CharField(max_length=100)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=100, blank=True)
    credential_url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-order', '-issue_date']
        verbose_name = "CV Certification"
        verbose_name_plural = "CV Certifications"
    
    def __str__(self):
        return f"{self.name} - {self.issuer}"


class CVProject(models.Model):
    """Notable projects for CV"""
    title = models.CharField(max_length=100)
    description = models.TextField()
    technologies = models.CharField(max_length=200, help_text="Comma-separated list of technologies")
    url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_ongoing = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Project"
        verbose_name_plural = "CV Projects"
    
    def __str__(self):
        return self.title


class CVInterest(models.Model):
    """Personal interests/hobbies"""
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or name")
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "CV Interest"
        verbose_name_plural = "CV Interests"
    
    def __str__(self):
        return self.name
