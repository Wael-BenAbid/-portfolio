"""
Projects App - Views for projects and media management
"""
import logging
from rest_framework import generics, permissions, pagination, status
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.conf import settings
import os

logger = logging.getLogger(__name__)

from .models import Project, Skill, MediaItem, ProjectRegistration
from .serializers import ProjectSerializer, SkillSerializer, MediaItemCreateSerializer, ProjectRegistrationSerializer
from api.permissions import IsAdminUser, IsAdminOrReadOnly


# ============ Pagination ============

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100  # Allow reasonable page size for users


# ============ Project Views ============

@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_CREATE_RATE_LIMIT', '100/h'), method='POST', block=True), name='dispatch')
class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        # Only return active projects for anonymous users or non-admin users
        queryset = Project.objects.select_related('created_by').prefetch_related('media')
        
        # For authenticated users, annotate with liked information to avoid N+1 queries
        if self.request.user.is_authenticated:
            from django.db.models import Exists, OuterRef
            from interactions.models import Like
            
            # Annotate projects with is_liked
            project_likes = Like.objects.filter(
                user=self.request.user,
                project=OuterRef('pk'),
                content_type='project'
            )
            queryset = queryset.annotate(is_liked=Exists(project_likes))
            
            # For media items, we need to handle it differently since it's a related field
            # We'll prefetch media items and annotate them in the serializer
            
        if not (self.request.user.is_authenticated and self.request.user.is_admin()):
            queryset = queryset.filter(is_active=True)
            
        return queryset
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_CREATE_RATE_LIMIT', '100/h'), method='POST', block=True), name='dispatch')
@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_UPDATE_RATE_LIMIT', '50/h'), method=['PUT', 'PATCH'], block=True), name='dispatch')
@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_DELETE_RATE_LIMIT', '20/h'), method='DELETE', block=True), name='dispatch')
class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        # Only return active projects for anonymous users or non-admin users
        queryset = Project.objects.select_related('created_by').prefetch_related('media')
        
        # For authenticated users, annotate with liked information to avoid N+1 queries
        if self.request.user.is_authenticated:
            from django.db.models import Exists, OuterRef
            from interactions.models import Like
            
            # Annotate projects with is_liked
            project_likes = Like.objects.filter(
                user=self.request.user,
                project=OuterRef('pk'),
                content_type='project'
            )
            queryset = queryset.annotate(is_liked=Exists(project_likes))
            
            # For media items, we need to handle it differently since it's a related field
            # We'll prefetch media items and annotate them in the serializer
            
        if not (self.request.user.is_authenticated and self.request.user.is_admin()):
            queryset = queryset.filter(is_active=True)
            
        return queryset

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def retrieve(self, request, *args, **kwargs):
        # Increment views count
        instance = self.get_object()
        instance.views_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ============ Skill Views ============

class SkillListCreate(generics.ListCreateAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class SkillRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]


# ============ Media Item Views ============

@method_decorator(ratelimit(key='user', rate=os.environ.get('MEDIA_UPLOAD_RATE_LIMIT', '50/h'), method='POST', block=True), name='dispatch')
class MediaItemCreate(generics.CreateAPIView):
    """View for creating media items for a project"""
    serializer_class = MediaItemCreateSerializer
    permission_classes = [IsAdminUser]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)
    
    def perform_create(self, serializer):
        # Return the saved instance
        return serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            # Get the saved instance directly from save() method
            media_item = self.perform_create(serializer)
        except Exception as e:
            logger.error("Cloudinary upload failed in MediaItemCreate: %s", str(e), exc_info=True)
            return Response(
                {'error': {'code': 'UPLOAD_FAILED', 'message': str(e)}},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        # Return data in format matching MediaItemSerializer
        from .serializers import MediaItemSerializer
        response_serializer = MediaItemSerializer(media_item, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@method_decorator(ratelimit(key='user', rate=os.environ.get('MEDIA_DELETE_RATE_LIMIT', '50/h'), method='DELETE', block=True), name='dispatch')
class MediaItemDelete(generics.DestroyAPIView):
    """View for deleting media items from a project"""
    queryset = MediaItem.objects.all()
    permission_classes = [IsAdminUser]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)


# ============ Project Registration Views ============

from rest_framework.views import APIView
from django.shortcuts import get_object_or_404


class ProjectRegisterView(APIView):
    """
    Authenticated user registers for a project.
    POST /api/projects/<slug>/register/
    Body: { phone?: string, message?: string }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        project = get_object_or_404(Project, slug=slug, is_active=True)
        if not project.show_registration:
            return Response({'detail': 'Les inscriptions ne sont pas ouvertes pour ce projet.'}, status=status.HTTP_400_BAD_REQUEST)

        if ProjectRegistration.objects.filter(project=project, user=request.user).exists():
            return Response({'detail': 'Vous êtes déjà inscrit à ce projet.', 'already_registered': True}, status=status.HTTP_200_OK)

        registration = ProjectRegistration.objects.create(
            project=project,
            user=request.user,
            phone=request.data.get('phone', ''),
            message=request.data.get('message', ''),
        )

        # Notify admin via Notification
        try:
            from interactions.models import Notification
            from api.models import CustomUser
            admins = CustomUser.objects.filter(user_type='admin')
            notif = Notification.objects.create(
                title=f'Nouvelle inscription : {project.title}',
                message=f'{request.user.email} vient de s\'inscrire au projet « {project.title} ».',
                notification_type='system',
                link=f'/admin/registrations',
            )
            notif.recipients.set(admins)
        except Exception:
            pass  # Don't block registration if notification fails

        serializer = ProjectRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectRegistrationStatusView(APIView):
    """Check whether the current user is registered for a project."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        registered = ProjectRegistration.objects.filter(project=project, user=request.user).exists()
        return Response({'registered': registered})


class ProjectRegistrationListView(generics.ListAPIView):
    """Admin: list all registrations, optionally filtered by project slug."""
    serializer_class = ProjectRegistrationSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = ProjectRegistration.objects.select_related('project', 'user')
        slug = self.request.query_params.get('project')
        if slug:
            qs = qs.filter(project__slug=slug)
        return qs


class ProjectRegistrationUpdateView(generics.UpdateAPIView):
    """Admin: update status of a registration."""
    serializer_class = ProjectRegistrationSerializer
    permission_classes = [IsAdminUser]
    queryset = ProjectRegistration.objects.all()

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'confirmed', 'cancelled']:
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = new_status
        instance.save(update_fields=['status', 'updated_at'])

        # Notify the user
        try:
            from interactions.models import Notification
            status_labels = {'confirmed': 'confirmée', 'cancelled': 'annulée', 'pending': 'en attente'}
            notif = Notification.objects.create(
                title=f'Inscription {status_labels.get(new_status, new_status)} : {instance.project.title}',
                message=f'Votre inscription au projet « {instance.project.title} » est maintenant {status_labels.get(new_status, new_status)}.',
                notification_type='system',
                link=f'/project/{instance.project.slug}',
            )
            notif.recipients.add(instance.user)
        except Exception:
            pass

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProjectRegistrationContactView(APIView):
    """Admin: send a platform message + email notification to a registrant."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        registration = get_object_or_404(
            ProjectRegistration.objects.select_related('user', 'project'),
            pk=pk,
        )
        recipient = registration.user

        subject = (request.data.get('subject') or '').strip()
        message_text = (request.data.get('message') or '').strip()

        if not message_text:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not subject:
            subject = f"Concernant votre inscription: {registration.project.title}"

        admin_name = request.user.get_full_name().strip() or request.user.email

        # Store message in the platform so the user can read it from settings.
        try:
            from content.models import ContactMessage

            ContactMessage.objects.create(
                name=admin_name,
                email=request.user.email or settings.DEFAULT_FROM_EMAIL or 'no-reply@localhost',
                subject=subject,
                message=message_text,
                user=recipient,
                status='new',
            )
        except Exception:
            # Continue with notification/email even if message persistence fails.
            pass

        try:
            from interactions.models import Notification

            notif = Notification.objects.create(
                title='Nouveau message concernant votre inscription',
                message=f"Vous avez reçu un nouveau message au sujet du projet « {registration.project.title} ».",
                notification_type='message',
                link='/settings',
            )
            notif.recipients.add(recipient)
        except Exception:
            pass

        email_sent = False
        try:
            from django.core.mail import send_mail

            if recipient.email:
                from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
                if from_email:
                    send_mail(
                        subject=f"Nouveau message sur la plateforme - {registration.project.title}",
                        message=(
                            f"Bonjour {recipient.first_name or recipient.email},\n\n"
                            f"Vous avez reçu un nouveau message concernant votre inscription au projet \"{registration.project.title}\".\n"
                            "Connectez-vous à la plateforme pour le consulter dans vos messages.\n\n"
                            f"Objet: {subject}\n\n"
                            "Ceci est un email de notification automatique."
                        ),
                        from_email=from_email,
                        recipient_list=[recipient.email],
                        fail_silently=False,
                    )
                    email_sent = True
        except Exception:
            email_sent = False

        return Response(
            {
                'detail': 'Message sent successfully.',
                'email_sent': email_sent,
            },
            status=status.HTTP_200_OK,
        )

