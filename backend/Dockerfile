FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Make sure the template and static directories exist
RUN mkdir -p /app/templates /app/static /app/staticfiles /app/media

# Ensure template files are correctly placed
RUN if [ -d /app/templates ]; then cp -r /app/templates/* /app/templates/ 2>/dev/null || true; fi
RUN if [ -d /app/static ]; then cp -r /app/static/* /app/static/ 2>/dev/null || true; fi

RUN chmod +x /app/init.sh

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "prompt_manager.wsgi:application"] 