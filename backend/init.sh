#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Create necessary directories if they don't exist
mkdir -p /app/staticfiles /app/media /app/static /app/templates /app/static/css

# Set the correct permissions
chmod -R 755 /app/staticfiles /app/media /app/static /app/templates

# Ensure template files are in the right place
if [ -f /app/static/index.html ] && [ ! -f /app/staticfiles/index.html ]; then
    cp /app/static/index.html /app/staticfiles/
fi

if [ -f /app/templates/index.html ] && [ ! -f /app/static/index.html ]; then
    cp /app/templates/index.html /app/static/
fi

if [ -f /app/static/index.html ] && [ ! -f /app/templates/index.html ]; then
    cp /app/static/index.html /app/templates/
fi

# Copy static CSS files if they exist
if [ -d /app/static/css ] && [ ! -d /app/staticfiles/css ]; then
    mkdir -p /app/staticfiles/css
    cp -r /app/static/css/* /app/staticfiles/css/ 2>/dev/null || true
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create superuser if not exists
echo "Creating superuser if needed..."
python manage.py shell -c "
from django.contrib.auth.models import User
import os
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin_password')
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print('Superuser created.')
else:
    print('Superuser already exists.')
"

# Start server
echo "Starting server..."
exec gunicorn prompt_manager.wsgi:application --bind 0.0.0.0:8000 