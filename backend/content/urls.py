"""
Content App - URL routes for site content
"""
from django.urls import path
from . import views

urlpatterns = [
    # Site Settings - Root endpoint for settings
    path('', views.SiteSettingsView.as_view(), name='site-settings'),
    path('settings/', views.SiteSettingsView.as_view(), name='site-settings-alt'),
    
    # About
    path('about/', views.AboutListCreate.as_view(), name='about-list-create'),
    path('about/<int:pk>/', views.AboutRetrieveUpdateDestroy.as_view(), name='about-detail'),
    
    # Contact
    path('contact/', views.ContactMessageCreate.as_view(), name='contact-create'),
    path('contact/messages/', views.ContactMessageList.as_view(), name='contact-messages'),
    path('contact/<int:pk>/reply/', views.ContactMessageReplyView.as_view(), name='contact-reply'),
    
    # Email Subscription
    path('subscribe/', views.EmailSubscriptionView.as_view(), name='subscribe'),
    path('unsubscribe/', views.UnsubscribeView.as_view(), name='unsubscribe'),
    
    # Image Upload
    path('upload/', views.ImageUploadView.as_view(), name='image-upload'),
]
