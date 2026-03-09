from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_save
        from django.dispatch import receiver

        @receiver(post_save, sender='api.SecurityAlert')
        def send_security_alert_email(sender, instance, created, **kwargs):
            """Send email to all admin users when a new SecurityAlert is created."""
            if not created:
                return
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                from django.contrib.auth import get_user_model

                User = get_user_model()
                admin_emails = list(
                    User.objects.filter(is_staff=True)
                    .exclude(email='')
                    .values_list('email', flat=True)
                )
                if not admin_emails:
                    return

                subject = f"[🚨 Security Alert] {instance.get_severity_display().upper()} — {instance.title}"
                body = (
                    f"A new security alert has been triggered on your portfolio.\n\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"Type      : {instance.get_alert_type_display()}\n"
                    f"Severity  : {instance.get_severity_display()}\n"
                    f"Status    : {instance.get_status_display()}\n"
                    f"Title     : {instance.title}\n"
                    f"Details   : {instance.description}\n"
                    f"Evidence  : {instance.evidence}\n"
                    f"User      : {instance.user.email if instance.user else 'N/A'}\n"
                    f"Time      : {instance.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                    f"Please review this alert in the Traçage dashboard immediately."
                )

                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True,
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(
                    f"Failed to send security alert email: {e}", exc_info=True
                )
