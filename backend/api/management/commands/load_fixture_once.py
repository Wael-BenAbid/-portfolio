"""
One-time fixture loader for production deployment.

Loads production_fixture.json if it has not been loaded yet.
Uses a database flag (cache table) to ensure it only runs once.
"""
import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection


class Command(BaseCommand):
    help = 'Load production_fixture.json once (skips if already loaded)'

    def handle(self, *args, **options):
        fixture_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            '..', '..', '..', 'production_fixture.json'
        )
        fixture_path = os.path.normpath(fixture_path)

        if not os.path.exists(fixture_path):
            self.stdout.write(self.style.WARNING(
                f'No fixture file found at {fixture_path}, skipping.'
            ))
            return

        # Use a simple check: if any CV data already exists, skip loading
        with connection.cursor() as cursor:
            try:
                cursor.execute("SELECT COUNT(*) FROM cv_cvexperience")
                count = cursor.fetchone()[0]
                if count > 0:
                    self.stdout.write(self.style.SUCCESS(
                        f'Data already loaded ({count} CV experiences found). Skipping fixture load.'
                    ))
                    return
            except Exception:
                # Table doesn't exist yet — migrations may not have run
                self.stdout.write(self.style.WARNING(
                    'CV table not found. Skipping fixture load (run migrations first).'
                ))
                return

        self.stdout.write('Loading production fixture data...')
        try:
            call_command('loaddata', fixture_path, verbosity=1)
            self.stdout.write(self.style.SUCCESS('Production data loaded successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to load fixture: {e}'))
