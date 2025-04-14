"""
URL configuration for prompt_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.http import HttpResponse
from django.template import loader, TemplateDoesNotExist
from django.shortcuts import render

# Create a fallback view for when templates are missing
def home_view(request):
    try:
        # First try to render the template
        return render(request, 'index.html')
    except TemplateDoesNotExist:
        # If template is not found, return a basic HTML response
        return HttpResponse("""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Prompt Management System</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 1200px; margin: 0 auto; }
                h1 { color: #2c3e50; }
                ul { padding-left: 20px; }
                a { color: #3498db; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Prompt Management System</h1>
                
                <h2>Available Links:</h2>
                <ul>
                    <li><a href="/admin/">Admin Interface</a></li>
                    <li><a href="/api/docs/">API Documentation (Swagger)</a></li>
                    <li><a href="/api/redoc/">API Documentation (ReDoc)</a></li>
                    <li><a href="/api/prompts/">Prompts API</a></li>
                    <li><a href="/api/auth/login/">Authentication API</a></li>
                </ul>
            </div>
        </body>
        </html>
        """, content_type="text/html")

def fallback_home_view(request, exception=None):
    return home_view(request)

schema_view = get_schema_view(
    openapi.Info(
        title="Prompt Manager API",
        default_version='v1',
        description="API for managing writing prompts",
        contact=openapi.Contact(email="contact@promptmanager.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Home page with fallback
    path('', home_view, name='home'),
    
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include([
        path('', include('prompts.urls')),
        path('auth/', include('users.urls')),
    ])),
    
    # Swagger Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Add fallback handler for the home page
handler404 = fallback_home_view

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
