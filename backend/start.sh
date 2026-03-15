#!/bin/sh
set -e

python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Single Celery process: worker + beat combined.
# --pool=solo    → no forking, single-threaded (~80 MB vs ~200 MB for prefork)
# --concurrency=1 → one task at a time (fine for a daily reminder job)
# --beat         → built-in scheduler (no separate beat process needed)
# --loglevel=warning → less I/O noise
celery -A config worker \
  --beat \
  --pool=solo \
  --concurrency=1 \
  --loglevel=warning \
  --scheduler celery.beat:PersistentScheduler &

# Gunicorn: 1 process + 4 threads instead of 2 processes.
# gthread worker class handles concurrent requests via threads (~120 MB vs ~300 MB).
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 1 \
  --worker-class gthread \
  --threads 4 \
  --timeout 120
