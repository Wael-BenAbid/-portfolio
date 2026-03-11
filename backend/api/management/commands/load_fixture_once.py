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

        # Use a simple check: if all expected CV data already exists, skip loading
        # The fixture has 4 experiences, 9 skills, 3 languages - check all are present
        with connection.cursor() as cursor:
            try:
                cursor.execute("SELECT COUNT(*) FROM cv_cvexperience")
                exp_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM cv_cvskill")
                skill_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM cv_cvlanguage")
                lang_count = cursor.fetchone()[0]
                if exp_count >= 4 and skill_count >= 9 and lang_count >= 3:
                    self.stdout.write(self.style.SUCCESS(
                        f'Data already fully loaded ({exp_count} experiences, {skill_count} skills, {lang_count} languages). Skipping.'
                    ))
                    return
                else:
                    self.stdout.write(
                        f'Partial data found ({exp_count} exp, {skill_count} skills, {lang_count} langs). Loading full fixture...'
                    )
            except Exception:
                # Table doesn't exist yet — migrations may not have run
                self.stdout.write(self.style.WARNING(
                    'CV table not found. Skipping fixture load (run migrations first).'
                ))
                return

        self.stdout.write('Loading production fixture data...')
        try:
            # Filter out user objects that may conflict with existing users
            import json
            import tempfile
            with open(fixture_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Remove CustomUser objects — admin is created by promote_admin
            # Keep non-user objects; for user FK refs, the user must already exist
            from django.contrib.auth import get_user_model
            User = get_user_model()
            existing_emails = set(User.objects.values_list('email', flat=True))

            filtered = []
            for obj in data:
                if obj['model'].lower() == 'api.customuser':
                    email = obj['fields'].get('email', '')
                    if email in existing_emails:
                        self.stdout.write(f'  Skipping existing user: {email}')
                        continue
                filtered.append(obj)

            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.json', delete=False, encoding='utf-8'
            ) as tmp:
                json.dump(filtered, tmp)
                tmp_path = tmp.name

            call_command('loaddata', tmp_path, verbosity=1)
            os.unlink(tmp_path)
            self.stdout.write(self.style.SUCCESS('Production data loaded successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to load fixture: {e}'))
