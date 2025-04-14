from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json

from .models import Prompt
from .serializers import PromptSerializer, PromptCreateSerializer, PromptRenderSerializer


class PromptModelTest(TestCase):
    """Tests for the Prompt model."""
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com',
            password='password123'
        )
        self.prompt = Prompt.objects.create(
            title='Test Prompt',
            description='This is a test prompt',
            created_by=self.user,
            favorite=False
        )
        
        # Create a prompt with template variables
        self.template_prompt = Prompt.objects.create(
            title='Template Prompt',
            description='Hello, {{ name }}! Welcome to {{ place }}.',
            created_by=self.user,
            favorite=False,
            variables_schema={
                'name': {'type': 'string', 'description': 'Person name'},
                'place': {'type': 'string', 'description': 'Location name'}
            }
        )
    
    def test_prompt_creation(self):
        """Test that a prompt can be created."""
        self.assertEqual(self.prompt.title, 'Test Prompt')
        self.assertEqual(self.prompt.description, 'This is a test prompt')
        self.assertEqual(self.prompt.created_by, self.user)
        self.assertFalse(self.prompt.favorite)
    
    def test_prompt_str_representation(self):
        """Test the string representation of the Prompt model."""
        self.assertEqual(str(self.prompt), 'Test Prompt')
        
    def test_render_template(self):
        """Test that a template prompt can be rendered with variable values."""
        variable_values = {
            'name': 'John',
            'place': 'New York'
        }
        rendered_text = self.template_prompt.render_template(variable_values)
        self.assertEqual(rendered_text, 'Hello, John! Welcome to New York.')
        
    def test_extract_variables(self):
        """Test that variables are correctly extracted from a template prompt."""
        variables = self.template_prompt.extract_variables()
        self.assertEqual(set(variables), {'name', 'place'})
        
        # Test with no variables
        variables = self.prompt.extract_variables()
        self.assertEqual(variables, [])


class PromptSerializerTest(TestCase):
    """Tests for the Prompt serializers."""
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.prompt_attributes = {
            'title': 'Test Prompt',
            'description': 'This is a test prompt',
            'favorite': False
        }
        self.prompt = Prompt.objects.create(
            created_by=self.user,
            **self.prompt_attributes
        )
        
        # Create a prompt with template variables
        self.template_attributes = {
            'title': 'Template Prompt',
            'description': 'Hello, {{ name }}! Welcome to {{ place }}.',
            'favorite': False,
            'variables_schema': {
                'name': {'type': 'string', 'description': 'Person name'},
                'place': {'type': 'string', 'description': 'Location name'}
            }
        }
        self.template_prompt = Prompt.objects.create(
            created_by=self.user,
            **self.template_attributes
        )
    
    def test_prompt_serializer_contains_expected_fields(self):
        """Test that PromptSerializer includes the expected fields."""
        serializer = PromptSerializer(instance=self.prompt)
        expected_fields = ['id', 'title', 'description', 'variables_schema', 'detected_variables', 
                          'favorite', 'created_by', 'created_at', 'updated_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_prompt_create_serializer_contains_expected_fields(self):
        """Test that PromptCreateSerializer includes only the needed fields."""
        serializer = PromptCreateSerializer(instance=self.prompt)
        expected_fields = ['title', 'description', 'variables_schema', 'detected_variables', 'favorite']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
        
    def test_prompt_render_serializer_validation(self):
        """Test that PromptRenderSerializer validates the input correctly."""
        # Valid input
        valid_data = {
            'variable_values': {
                'name': 'John',
                'place': 'New York'
            }
        }
        serializer = PromptRenderSerializer(data=valid_data, context={'prompt': self.template_prompt})
        self.assertTrue(serializer.is_valid())
        
        # Missing required variable
        invalid_data = {
            'variable_values': {
                'name': 'John'
            }
        }
        serializer = PromptRenderSerializer(data=invalid_data, context={'prompt': self.template_prompt})
        self.assertFalse(serializer.is_valid())
        self.assertIn('Missing values for variables', str(serializer.errors))
        
        # Extra variable
        invalid_data = {
            'variable_values': {
                'name': 'John',
                'place': 'New York',
                'extra': 'Value'
            }
        }
        serializer = PromptRenderSerializer(data=invalid_data, context={'prompt': self.template_prompt})
        self.assertFalse(serializer.is_valid())
        self.assertIn('Unknown variables provided', str(serializer.errors))


class PromptAPITest(APITestCase):
    """Tests for the Prompt API endpoints."""
    
    def setUp(self):
        """Set up test data and client for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.prompt_data = {
            'title': 'Test Prompt',
            'description': 'This is a test prompt',
            'favorite': False
        }
        self.prompt = Prompt.objects.create(
            created_by=self.user,
            **self.prompt_data
        )
        
        # Create a template prompt
        self.template_data = {
            'title': 'Template Prompt',
            'description': 'Hello, {{ name }}! Welcome to {{ place }}.',
            'favorite': False,
            'variables_schema': {
                'name': {'type': 'string', 'description': 'Person name'},
                'place': {'type': 'string', 'description': 'Location name'}
            }
        }
        self.template_prompt = Prompt.objects.create(
            created_by=self.user,
            **self.template_data
        )
        
        self.prompt_list_url = reverse('prompt-list')
        self.prompt_detail_url = reverse('prompt-detail', args=[self.prompt.id])
        self.template_detail_url = reverse('prompt-detail', args=[self.template_prompt.id])
    
    def test_create_prompt(self):
        """Test that a prompt can be created through the API."""
        new_prompt_data = {
            'title': 'New Test Prompt',
            'description': 'This is a new test prompt',
            'favorite': True
        }
        response = self.client.post(self.prompt_list_url, new_prompt_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prompt.objects.count(), 3)
        self.assertEqual(Prompt.objects.latest('id').title, 'New Test Prompt')
    
    def test_create_template_prompt(self):
        """Test that a template prompt can be created through the API."""
        new_template_data = {
            'title': 'New Template',
            'description': 'Hi {{ user }}! Your code is {{ code }}.',
            'favorite': True,
            'variables_schema': {
                'user': {'type': 'string', 'description': 'Username'},
                'code': {'type': 'string', 'description': 'Verification code'}
            }
        }
        response = self.client.post(
            self.prompt_list_url, 
            data=json.dumps(new_template_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prompt.objects.count(), 3)
        
        # Check that variables were detected
        self.assertEqual(set(response.data['detected_variables']), {'user', 'code'})
    
    def test_get_prompt_list(self):
        """Test that a list of prompts can be retrieved by the owner."""
        response = self.client.get(self.prompt_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
    
    def test_get_prompt_detail(self):
        """Test that a specific prompt can be retrieved by the owner."""
        response = self.client.get(self.prompt_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Prompt')
    
    def test_update_prompt(self):
        """Test that a prompt can be updated by the owner."""
        updated_data = {
            'title': 'Updated Test Prompt',
            'description': 'This is an updated test prompt',
            'favorite': True
        }
        response = self.client.put(self.prompt_detail_url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.prompt.refresh_from_db()
        self.assertEqual(self.prompt.title, 'Updated Test Prompt')
        self.assertEqual(self.prompt.description, 'This is an updated test prompt')
        self.assertTrue(self.prompt.favorite)
    
    def test_delete_prompt(self):
        """Test that a prompt can be deleted by the owner."""
        response = self.client.delete(self.prompt_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Prompt.objects.filter(id=self.prompt.id).count(), 0)
    
    def test_toggle_favorite(self):
        """Test that a prompt's favorite status can be toggled."""
        toggle_url = reverse('prompt-toggle-favorite', args=[self.prompt.id])
        response = self.client.patch(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.prompt.refresh_from_db()
        self.assertTrue(self.prompt.favorite)
        
        # Toggle again
        response = self.client.patch(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.prompt.refresh_from_db()
        self.assertFalse(self.prompt.favorite)
    
    def test_get_variables(self):
        """Test that template variables can be retrieved."""
        variables_url = reverse('prompt-variables', args=[self.template_prompt.id])
        response = self.client.get(variables_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['prompt_id'], self.template_prompt.id)
        self.assertEqual(response.data['title'], 'Template Prompt')
        self.assertEqual(set(response.data['variables'].keys()), {'name', 'place'})
    
    def test_render_template(self):
        """Test that a template prompt can be rendered with variable values."""
        render_url = reverse('prompt-render', args=[self.template_prompt.id])
        variable_values = {
            'variable_values': {
                'name': 'John',
                'place': 'New York'
            }
        }
        response = self.client.post(
            render_url, 
            data=json.dumps(variable_values),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['prompt_id'], self.template_prompt.id)
        self.assertEqual(response.data['title'], 'Template Prompt')
        self.assertEqual(response.data['rendered_text'], 'Hello, John! Welcome to New York.')
    
    def test_non_owner_cannot_access_prompt(self):
        """Test that a user cannot access prompts created by someone else."""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='password123'
        )
        self.client.force_authenticate(user=other_user)
        response = self.client.get(self.prompt_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_auto_schema_creation(self):
        """Test that variables_schema is auto-populated when not provided."""
        auto_schema_data = {
            'title': 'Auto Schema Prompt',
            'description': 'Hello, {{ auto_var }}! This is {{ another_var }}.',
            'favorite': False
        }
        response = self.client.post(
            self.prompt_list_url, 
            data=json.dumps(auto_schema_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify variables schema was auto-populated in the response
        self.assertIn('variables_schema', response.data)
        schema = response.data['variables_schema']
        self.assertEqual(set(schema.keys()), {'auto_var', 'another_var'})
        for var in schema.values():
            self.assertEqual(var['type'], 'string')
            self.assertIn('Value for', var['description'])
        
        # Also verify the detected_variables field contains the correct variables
        self.assertIn('detected_variables', response.data)
        self.assertEqual(set(response.data['detected_variables']), {'auto_var', 'another_var'})
