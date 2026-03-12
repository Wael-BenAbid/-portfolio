"""
Management command: fix_cloudinary_auto_urls

One-time fix for records written while AutoCloudinaryStorage incorrectly
set RESOURCE_TYPE='auto'.  Cloudinary does not serve /auto/upload/ delivery
URLs — only /image/upload/, /video/upload/, and /raw/upload/ are valid.

For each bad URL, this command queries the Cloudinary API to discover the
actual resource_type the asset was stored under, then rewrites the URL with
the correct delivery path.

Also fixes any /image/upload/ URLs that were written by a previous run of
this command that blindly assumed 'image' — Cloudinary returns 404 for those
if the asset is actually a video.

Usage:
    python manage.py fix_cloudinary_auto_urls          # dry-run (default)
    python manage.py fix_cloudinary_auto_urls --apply  # write to DB
"""

import re

import cloudinary.api
from django.core.management.base import BaseCommand
from django.db import transaction

# Patterns for URLs we need to re-examine
_BAD_PATTERNS = ('/auto/upload/', '/image/upload/', '/video/upload/')

# Regex to extract the public_id from a Cloudinary delivery URL.
# Handles: https://res.cloudinary.com/<cloud>/<type>/upload/v<N>/<public_id>
#      and: https://res.cloudinary.com/<cloud>/<type>/upload/<public_id>
_URL_RE = re.compile(
    r'res\.cloudinary\.com/[^/]+/(?:image|video|raw|auto)/upload/'
    r'(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$'
)


def _extract_public_id(url: str) -> str | None:
    m = _URL_RE.search(url)
    return m.group(1) if m else None


def _resolve_resource_type(public_id: str) -> str | None:
    """Ask Cloudinary which resource_type bucket the asset lives in."""
    for rt in ('image', 'video', 'raw'):
        try:
            cloudinary.api.resource(public_id, resource_type=rt)
            return rt
        except cloudinary.api.NotFound:
            continue
        except Exception:
            # Could be a network/auth error — re-raise so the caller can log it
            raise
    return None


def _fix_url(url: str) -> str | None:
    """
    Return (corrected_url) if the URL needs changing, or None if
    - the URL is already correct, or
    - the asset cannot be found in any Cloudinary bucket.
    """
    if not url:
        return None

    # Only touch Cloudinary delivery URLs
    if 'res.cloudinary.com' not in url:
        return None

    # Check whether this URL needs re-examination.
    # /auto/upload/ is always broken.
    # /image/upload/ and /video/upload/ may be wrong if they were set by the
    # previous version of this command that blindly used 'image'.
    needs_check = '/auto/upload/' in url or '/image/upload/' in url or '/video/upload/' in url
    if not needs_check:
        return None

    public_id = _extract_public_id(url)
    if not public_id:
        return None

    actual_type = _resolve_resource_type(public_id)
    if not actual_type:
        return None  # Asset not found in any bucket — leave unchanged

    # Build the correct URL
    correct_url = _URL_RE.sub(
        lambda m: url.replace(
            re.search(r'/(image|video|raw|auto)/upload/', url).group(0),
            f'/{actual_type}/upload/',
        ),
        url
    )
    # Simpler string replacement:
    for rt_slug in ('auto', 'image', 'video', 'raw'):
        candidate = f'/{rt_slug}/upload/'
        if candidate in url:
            correct_url = url.replace(candidate, f'/{actual_type}/upload/', 1)
            break

    if correct_url == url:
        return None  # Already correct
    return correct_url


class Command(BaseCommand):
    help = 'Fix bad Cloudinary delivery URLs (/auto/, wrong resource type) in the DB'

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
        # Check any project with a Cloudinary thumbnail that might be wrong
        for p in Project.objects.filter(thumbnail__contains='res.cloudinary.com'):
            try:
                new_thumb = _fix_url(p.thumbnail)
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Project #{p.id}: Cloudinary API error — {e}'
                ))
                continue
            if new_thumb is None:
                continue
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
        for u in CustomUser.objects.filter(profile_image__contains='res.cloudinary.com'):
            try:
                new_pi = _fix_url(u.profile_image)
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  User #{u.id}: Cloudinary API error — {e}'
                ))
                continue
            if new_pi is None:
                continue
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
                try:
                    new = _fix_url(old)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'  SiteSettings #{s.id} .{field}: Cloudinary API error — {e}'
                    ))
                    continue
                if new is None:
                    continue
                self.stdout.write(
                    f'  SiteSettings #{s.id} .{field}: {old!r} -> {new!r}'
                )
                setattr(s, field, new)
                changed_fields.append(field)
                count += 1
            if apply and changed_fields:
                s.save(update_fields=changed_fields)
        return count
