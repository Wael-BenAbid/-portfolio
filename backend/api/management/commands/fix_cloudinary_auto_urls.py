"""
Management command: fix_cloudinary_auto_urls

One-time fix for records written while AutoCloudinaryStorage incorrectly
set RESOURCE_TYPE='auto'.  Cloudinary does not serve /auto/upload/ delivery
URLs — only /image/upload/, /video/upload/, and /raw/upload/ are valid.

This command replaces every stored URL that contains '/auto/upload/' with
'/image/upload/' across all URL fields that are populated via the upload
endpoints (project thumbnails, user profile images, site settings images).

Usage:
    python manage.py fix_cloudinary_auto_urls          # dry-run (default)
    python manage.py fix_cloudinary_auto_urls --apply  # write to DB
"""

from django.core.management.base import BaseCommand
from django.db import transaction

BAD = '/auto/upload/'
GOOD = '/image/upload/'


def _fix(value: str) -> str:
    return value.replace(BAD, GOOD) if value and BAD in value else value


class Command(BaseCommand):
    help = 'Replace bad /auto/upload/ Cloudinary URLs with /image/upload/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            default=False,
            help='Write the fixes to the database (default: dry-run only)',
        )

    def handle(self, *args, **options):
        apply = options['apply']
        if not apply:
            self.stdout.write(self.style.WARNING(
                'DRY-RUN mode — pass --apply to actually update the DB'
            ))

        total = 0

        with transaction.atomic():
            total += self._fix_projects(apply)
            total += self._fix_users(apply)
            total += self._fix_site_settings(apply)

            if not apply:
                # Roll back so nothing actually changes in dry-run mode.
                transaction.set_rollback(True)

        if total == 0:
            self.stdout.write(self.style.SUCCESS('No bad URLs found — nothing to fix.'))
        else:
            verb = 'Fixed' if apply else 'Would fix'
            self.stdout.write(self.style.SUCCESS(f'{verb} {total} URL(s).'))

    # ── per-model helpers ────────────────────────────────────────────

    def _fix_projects(self, apply: bool) -> int:
        from projects.models import Project

        count = 0
        for p in Project.objects.filter(thumbnail__contains=BAD):
            new_thumb = _fix(p.thumbnail)
            self.stdout.write(
                f'  Project #{p.id} "{p.title}": '
                f'{p.thumbnail!r} -> {new_thumb!r}'
            )
            if apply:
                p.thumbnail = new_thumb
                p.save(update_fields=['thumbnail'])
            count += 1
        return count

    def _fix_users(self, apply: bool) -> int:
        from api.models import CustomUser

        count = 0
        for u in CustomUser.objects.filter(profile_image__contains=BAD):
            new_pi = _fix(u.profile_image)
            self.stdout.write(
                f'  User #{u.id} "{u.email}": '
                f'{u.profile_image!r} -> {new_pi!r}'
            )
            if apply:
                u.profile_image = new_pi
                u.save(update_fields=['profile_image'])
            count += 1
        return count

    def _fix_site_settings(self, apply: bool) -> int:
        from content.models import SiteSettings

        url_fields = [
            'profile_image', 'drone_image', 'drone_video_url',
            'logo_url', 'favicon_url', 'cv_profile_image',
        ]
        count = 0
        for s in SiteSettings.objects.all():
            changed_fields = []
            for field in url_fields:
                old = getattr(s, field, None)
                new = _fix(old)
                if new != old:
                    self.stdout.write(
                        f'  SiteSettings #{s.id} .{field}: '
                        f'{old!r} -> {new!r}'
                    )
                    setattr(s, field, new)
                    changed_fields.append(field)
                    count += 1
            if apply and changed_fields:
                s.save(update_fields=changed_fields)
        return count
