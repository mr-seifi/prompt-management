from rest_framework import serializers
from .models import Prompt
import re
import json

class PromptSerializer(serializers.ModelSerializer):
    """
    Serializer for the Prompt model with all fields.
    """
    created_by = serializers.ReadOnlyField(source='created_by.username')
    detected_variables = serializers.SerializerMethodField()
    
    class Meta:
        model = Prompt
        fields = ['id', 'title', 'description', 'variables_schema', 'detected_variables', 
                 'favorite', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'detected_variables']
    
    def get_detected_variables(self, obj):
        """Return variables detected in the prompt template"""
        return obj.extract_variables()
    
    def validate(self, data):
        """
        Validate that all variables in the schema are used in the description
        and all variables in the description have a schema definition.
        """
        if 'description' in data:
            description = data['description']
            variables_schema = data.get('variables_schema', {})
            
            # Extract variables from the description
            pattern = r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}'
            matches = re.findall(pattern, description)
            detected_vars = set(matches)
            
            # Check that all detected variables have a schema definition
            schema_vars = set(variables_schema.keys()) if variables_schema else set()
            
            undefined_vars = detected_vars - schema_vars
            if undefined_vars and variables_schema:
                raise serializers.ValidationError(
                    f"Variables used in template but not defined in schema: {', '.join(undefined_vars)}"
                )
            
            # Auto-populate variables_schema if it's empty but variables are detected
            if detected_vars and not variables_schema:
                auto_schema = {var: {"type": "string", "description": f"Value for {var}"} 
                              for var in detected_vars}
                data['variables_schema'] = auto_schema
        
        return data


class PromptCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating prompts, with only the needed fields.
    """
    detected_variables = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Prompt
        fields = ['title', 'description', 'variables_schema', 'detected_variables', 'favorite']
        
    def get_detected_variables(self, obj):
        """Return variables detected in the prompt template"""
        return obj.extract_variables()
    
    def validate(self, data):
        """
        Validate that all variables in the schema are used in the description
        and all variables in the description have a schema definition.
        """
        if 'description' in data:
            description = data['description']
            variables_schema = data.get('variables_schema', {})
            
            # Extract variables from the description
            pattern = r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}'
            matches = re.findall(pattern, description)
            detected_vars = set(matches)
            
            # Check that all detected variables have a schema definition
            schema_vars = set(variables_schema.keys()) if variables_schema else set()
            
            undefined_vars = detected_vars - schema_vars
            if undefined_vars and variables_schema:
                raise serializers.ValidationError(
                    f"Variables used in template but not defined in schema: {', '.join(undefined_vars)}"
                )
            
            # Auto-populate variables_schema if it's empty but variables are detected
            if detected_vars and not variables_schema:
                auto_schema = {var: {"type": "string", "description": f"Value for {var}"} 
                              for var in detected_vars}
                data['variables_schema'] = auto_schema
        
        return data


class PromptRenderSerializer(serializers.Serializer):
    """
    Serializer for rendering a prompt with variable values.
    """
    variable_values = serializers.JSONField(required=True)
    
    def validate(self, data):
        """
        Validate that all required variables have values.
        """
        prompt = self.context.get('prompt')
        variable_values = data.get('variable_values', {})
        
        if not prompt:
            raise serializers.ValidationError("Prompt object required in context")
        
        # Get variables from the prompt description
        required_vars = set(prompt.extract_variables())
        provided_vars = set(variable_values.keys())
        
        # Check if all required variables have values
        missing_vars = required_vars - provided_vars
        if missing_vars:
            raise serializers.ValidationError(
                f"Missing values for variables: {', '.join(missing_vars)}"
            )
        
        # Check if there are any extra variables provided
        extra_vars = provided_vars - required_vars
        if extra_vars:
            raise serializers.ValidationError(
                f"Unknown variables provided: {', '.join(extra_vars)}"
            )
        
        return data 