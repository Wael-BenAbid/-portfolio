#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-portfolio.settings.prod}"

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Auto-promote or create admin from env vars (runs on every deploy, idempotent)
if [ -n "$ADMIN_EMAIL" ]; then
  echo "Ensuring admin user: $ADMIN_EMAIL"
  if [ -n "$ADMIN_PASSWORD" ]; then
    python manage.py promote_admin "$ADMIN_EMAIL" --create --password "$ADMIN_PASSWORD" || true
  else
    python manage.py promote_admin "$ADMIN_EMAIL" || true
  fi
fi

echo "Starting application..."
exec "$@"