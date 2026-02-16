"""
CV App - URL routes for CV data
"""
from django.urls import path
from . import views

urlpatterns = [
    # Full CV data
    path('', views.CVFullView.as_view(), name='cv-full'),
    
    # Experience
    path('experiences/', views.CVExperienceListCreate.as_view(), name='cv-experience-list'),
    path('experiences/<int:pk>/', views.CVExperienceDetail.as_view(), name='cv-experience-detail'),
    
    # Education
    path('education/', views.CVEducationListCreate.as_view(), name='cv-education-list'),
    path('education/<int:pk>/', views.CVEducationDetail.as_view(), name='cv-education-detail'),
    
    # Skills
    path('skills/', views.CVSkillListCreate.as_view(), name='cv-skill-list'),
    path('skills/<int:pk>/', views.CVSkillDetail.as_view(), name='cv-skill-detail'),
    
    # Languages
    path('languages/', views.CVLanguageListCreate.as_view(), name='cv-language-list'),
    path('languages/<int:pk>/', views.CVLanguageDetail.as_view(), name='cv-language-detail'),
    
    # Certifications
    path('certifications/', views.CVCertificationListCreate.as_view(), name='cv-certification-list'),
    path('certifications/<int:pk>/', views.CVCertificationDetail.as_view(), name='cv-certification-detail'),
    
    # CV Projects
    path('projects/', views.CVProjectListCreate.as_view(), name='cv-project-list'),
    path('projects/<int:pk>/', views.CVProjectDetail.as_view(), name='cv-project-detail'),
    
    # Interests
    path('interests/', views.CVInterestListCreate.as_view(), name='cv-interest-list'),
    path('interests/<int:pk>/', views.CVInterestDetail.as_view(), name='cv-interest-detail'),
]
