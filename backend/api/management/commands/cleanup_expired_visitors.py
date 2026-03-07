"""
Django management command to clean up expired visitor records (GDPR compliance).

Usage:
    python manage.py cleanup_expired_visitors

This should be run as a scheduled task (e.g., via celery beat or cron):
    Daily at 2 AM: 0 2 * * * python manage.py cleanup_expired_visitors
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Visitor, VisitorConsent


class Command(BaseCommand):
    help = 'Delete visitor records older than 90 days (GDPR compliance) and expired consents'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        now = timezone.now()
        dry_run = options['dry_run']
        
        # Count expired visitor records
        expired_visitors = Visitor.objects.filter(
            will_delete_at__lte=now
        )
        visitor_count = expired_visitors.count()
        
        # Count expired consents
        expired_consents = VisitorConsent.objects.filter(
            EXPIRES_AT__lte=now
        )
        consent_count = expired_consents.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {visitor_count} expired visitor records'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {consent_count} expired consent records'
                )
            )
            return
        
        # Delete expired visitor records
        if visitor_count > 0:
            expired_visitors.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Deleted {visitor_count} expired visitor records'
                )
            )
        else:
            self.stdout.write('No expired visitor records to delete')
        
        # Delete expired consents
        if consent_count > 0:
            expired_consents.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Deleted {consent_count} expired consent records'
                )
            )
        else:
            self.stdout.write('No expired consent records to delete')
        
        self.stdout.write(
            self.style.SUCCESS(
                '✓ GDPR cleanup completed successfully'
            )
        )
