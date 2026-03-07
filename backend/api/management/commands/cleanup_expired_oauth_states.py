"""
Management command to clean up expired OAuth state tokens.

Usage: python manage.py cleanup_expired_oauth_states [--dry-run]
Schedule: 0 3 * * * python manage.py cleanup_expired_oauth_states
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import OAuthState


class Command(BaseCommand):
    help = 'Delete expired OAuth state tokens (CSRF tokens older than 15 min)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
    
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        now = timezone.now()
        
        # Find expired OAuth states
        expired_states = OAuthState.objects.filter(expires_at__lte=now)
        count = expired_states.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'[DRY RUN] Would delete {count} expired OAuth state tokens'
                )
            )
            for state in expired_states[:10]:  # Show first 10
                self.stdout.write(
                    f'  - {state.provider} state (expired {state.expires_at})'
                )
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
        else:
            expired_states.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {count} expired OAuth state tokens'
                )
            )
