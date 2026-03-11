"""
Fix localhost URLs in production database.

Replaces http://localhost:8000/media/... with empty strings
since those files don't exist on the production server.
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Remove localhost URLs from production database fields'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Fix SiteSettings localhost URLs
            self._fix_table(cursor, 'content_sitesettings', [
                'logo_url', 'favicon_url', 'profile_image', 'drone_image',
                'cv_profile_image', 'footer_background_video', 'drone_video_url',
            ])

            # Fix Project localhost URLs
            self._fix_table(cursor, 'projects_project', [
                'thumbnail', 'video_url',
            ])

    def _fix_table(self, cursor, table, fields):
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            if cursor.fetchone()[0] == 0:
                self.stdout.write(f'No rows in {table}, skipping.')
                return

            updates = []
            for field in fields:
                updates.append(
                    f"{field} = CASE WHEN {field} LIKE 'http://localhost%%' THEN '' ELSE {field} END"
                )

            sql = f"UPDATE {table} SET {', '.join(updates)}"
            cursor.execute(sql)
            self.stdout.write(self.style.SUCCESS(
                f'Fixed localhost URLs in {table} ({cursor.rowcount} row(s) updated).'
            ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not fix {table}: {e}'))
