"""
API URLs for backend app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/social/', views.SocialAuthView.as_view(), name='social-auth'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('auth/settings/', views.UserSettingsView.as_view(), name='user-settings'),
    
    # Projects
    path('projects/', views.ProjectListCreate.as_view(), name='project-list-create'),
    path('projects/<slug:slug>/', views.ProjectRetrieveUpdateDestroy.as_view(), name='project-detail'),
    
    # Skills
    path('skills/', views.SkillListCreate.as_view(), name='skill-list-create'),
    path('skills/<int:pk>/', views.SkillRetrieveUpdateDestroy.as_view(), name='skill-detail'),
    
    # About
    path('about/', views.AboutListCreate.as_view(), name='about-list-create'),
    path('about/<int:pk>/', views.AboutRetrieveUpdateDestroy.as_view(), name='about-detail'),
    
    # Likes
    path('like/<str:content_type>/<int:content_id>/', views.ToggleLikeView.as_view(), name='toggle-like'),
    path('my-likes/', views.UserLikesView.as_view(), name='user-likes'),
    
    # Contact
    path('contact/', views.ContactMessageCreate.as_view(), name='contact-create'),
    path('contact/messages/', views.ContactMessageList.as_view(), name='contact-messages'),
    path('contact/<int:pk>/reply/', views.ContactMessageReplyView.as_view(), name='contact-reply'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='mark-notification-read'),
    
    # Email Subscription
    path('subscribe/', views.EmailSubscriptionView.as_view(), name='subscribe'),
    path('unsubscribe/', views.UnsubscribeView.as_view(), name='unsubscribe'),
    
    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', views.AdminUserUpdateView.as_view(), name='admin-user-update'),
    
    # Site Settings
    path('settings/', views.SiteSettingsView.as_view(), name='site-settings'),
    
    # Image Upload
    path('upload/', views.ImageUploadView.as_view(), name='image-upload'),
    
    # CV Routes
    path('cv/', views.CVFullView.as_view(), name='cv-full'),
    path('cv/experiences/', views.CVExperienceListCreate.as_view(), name='cv-experience-list'),
    path('cv/experiences/<int:pk>/', views.CVExperienceDetail.as_view(), name='cv-experience-detail'),
    path('cv/education/', views.CVEducationListCreate.as_view(), name='cv-education-list'),
    path('cv/education/<int:pk>/', views.CVEducationDetail.as_view(), name='cv-education-detail'),
    path('cv/skills/', views.CVSkillListCreate.as_view(), name='cv-skill-list'),
    path('cv/skills/<int:pk>/', views.CVSkillDetail.as_view(), name='cv-skill-detail'),
    path('cv/languages/', views.CVLanguageListCreate.as_view(), name='cv-language-list'),
    path('cv/languages/<int:pk>/', views.CVLanguageDetail.as_view(), name='cv-language-detail'),
    path('cv/certifications/', views.CVCertificationListCreate.as_view(), name='cv-certification-list'),
    path('cv/certifications/<int:pk>/', views.CVCertificationDetail.as_view(), name='cv-certification-detail'),
    path('cv/projects/', views.CVProjectListCreate.as_view(), name='cv-project-list'),
    path('cv/projects/<int:pk>/', views.CVProjectDetail.as_view(), name='cv-project-detail'),
    path('cv/interests/', views.CVInterestListCreate.as_view(), name='cv-interest-list'),
    path('cv/interests/<int:pk>/', views.CVInterestDetail.as_view(), name='cv-interest-detail'),
]
