from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Prompt
from .serializers import PromptSerializer, PromptCreateSerializer, PromptRenderSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.created_by == request.user


class PromptViewSet(viewsets.ModelViewSet):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions for Prompts.
    
    Additionally it provides:
    - `favorite` action to mark prompts as favorites
    - `render` action to fill in template variables with values
    - `variables` action to extract variables from the prompt template
    """
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['favorite']
    search_fields = ['title', 'description',]
    ordering_fields = ['created_at', 'title', 'updated_at']
    
    def get_queryset(self):
        """
        This view should return a list of all prompts for the currently
        authenticated user.
        """
        user = self.request.user
        return Prompt.objects.filter(created_by=user)
    
    def get_serializer_class(self):
        """
        Return different serializers based on the action
        """
        if self.action == 'create':
            return PromptCreateSerializer
        elif self.action == 'render':
            return PromptRenderSerializer
        return PromptSerializer
    
    def perform_create(self, serializer):
        """
        Set the owner of the prompt to the current user when creating
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def toggle_favorite(self, request, pk=None):
        """
        Toggle the favorite status of a prompt
        """
        prompt = self.get_object()
        prompt.favorite = not prompt.favorite
        prompt.save()
        
        serializer = self.get_serializer(prompt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def render(self, request, pk=None):
        """
        Render a prompt template by replacing variables with provided values.
        
        Expected format:
        {
            "variable_values": {
                "var1": "value1",
                "var2": "value2",
                ...
            }
        }
        """
        prompt = self.get_object()
        serializer = self.get_serializer(
            data=request.data, 
            context={'prompt': prompt}
        )
        
        if serializer.is_valid():
            variable_values = serializer.validated_data['variable_values']
            rendered_text = prompt.render_template(variable_values)
            
            return Response({
                'prompt_id': prompt.id,
                'title': prompt.title,
                'original_template': prompt.description,
                'rendered_text': rendered_text,
                'variables_used': variable_values
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def variables(self, request, pk=None):
        """
        Extract and return all variables used in the prompt template.
        """
        prompt = self.get_object()
        variables = prompt.extract_variables()
        schema = prompt.variables_schema or {}
        
        # Create a response with variable information
        response_data = {
            'prompt_id': prompt.id,
            'title': prompt.title,
            'variables': {
                var: schema.get(var, {"type": "string", "description": f"Value for {var}"})
                for var in variables
            }
        }
        
        return Response(response_data)
