#!/bin/sh
set -e

python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Start Celery worker in background
celery -A config worker -l info -Q default &

# Start Celery beat in background
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler &

# Start gunicorn in foreground (keeps container alive)
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
