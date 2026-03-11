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
        url_fields = [
            'logo_url', 'favicon_url', 'profile_image', 'drone_image',
            'cv_profile_image', 'footer_background_video',
        ]

        with connection.cursor() as cursor:
            try:
                cursor.execute("SELECT COUNT(*) FROM content_sitesettings")
                if cursor.fetchone()[0] == 0:
                    self.stdout.write('No SiteSettings found, skipping.')
                    return

                updates = []
                for field in url_fields:
                    updates.append(
                        f"{field} = CASE WHEN {field} LIKE 'http://localhost%%' THEN '' ELSE {field} END"
                    )

                sql = f"UPDATE content_sitesettings SET {', '.join(updates)}"
                cursor.execute(sql)
                self.stdout.write(self.style.SUCCESS(
                    f'Fixed localhost URLs in SiteSettings ({cursor.rowcount} row(s) updated).'
                ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not fix URLs: {e}'))
