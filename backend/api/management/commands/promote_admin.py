"""
Management command to promote an existing user to admin/superuser,
or create a new superuser if user doesn't exist.

Usage:
    python manage.py promote_admin waelbenabid1@gmail.com
    python manage.py promote_admin waelbenabid1@gmail.com --create --password 'SecurePass123!'
"""
from django.core.management.base import BaseCommand, CommandError
from api.models import CustomUser


class Command(BaseCommand):
    help = 'Promote an existing user to admin/superuser or create one'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to promote')
        parser.add_argument('--create', action='store_true', help='Create user if not found')
        parser.add_argument('--password', type=str, help='Password (only used with --create)')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()

        try:
            user = CustomUser.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.user_type = 'admin'
            user.save(update_fields=['is_staff', 'is_superuser', 'user_type'])
            self.stdout.write(self.style.SUCCESS(
                f'User "{email}" promoted to admin/superuser.'
            ))
        except CustomUser.DoesNotExist:
            if options['create']:
                password = options.get('password')
                if not password:
                    raise CommandError('--password is required when using --create')
                user = CustomUser.objects.create_superuser(
                    email=email,
                    password=password,
                    user_type='admin',
                )
                self.stdout.write(self.style.SUCCESS(
                    f'Superuser "{email}" created.'
                ))
            else:
                raise CommandError(
                    f'User "{email}" not found. '
                    f'Login with Google first, or use --create --password "..." to create.'
                )
