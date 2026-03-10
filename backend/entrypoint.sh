#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-portfolio.settings.prod}"

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting application..."
exec "$@"