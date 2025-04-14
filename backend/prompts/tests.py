from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Prompt
from .serializers import PromptSerializer, PromptCreateSerializer


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
    
    def test_prompt_creation(self):
        """Test that a prompt can be created."""
        self.assertEqual(self.prompt.title, 'Test Prompt')
        self.assertEqual(self.prompt.description, 'This is a test prompt')
        self.assertEqual(self.prompt.created_by, self.user)
        self.assertFalse(self.prompt.favorite)
    
    def test_prompt_str_representation(self):
        """Test the string representation of the Prompt model."""
        self.assertEqual(str(self.prompt), 'Test Prompt')


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
    
    def test_prompt_serializer_contains_expected_fields(self):
        """Test that PromptSerializer includes the expected fields."""
        serializer = PromptSerializer(instance=self.prompt)
        expected_fields = ['id', 'title', 'description', 'favorite', 'created_by', 'created_at', 'updated_at']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_prompt_create_serializer_contains_expected_fields(self):
        """Test that PromptCreateSerializer includes only the needed fields."""
        serializer = PromptCreateSerializer(instance=self.prompt)
        expected_fields = ['title', 'description', 'favorite']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))


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
        self.prompt_list_url = reverse('prompt-list')
        self.prompt_detail_url = reverse('prompt-detail', args=[self.prompt.id])
    
    def test_create_prompt(self):
        """Test that a prompt can be created through the API."""
        new_prompt_data = {
            'title': 'New Test Prompt',
            'description': 'This is a new test prompt',
            'favorite': True
        }
        response = self.client.post(self.prompt_list_url, new_prompt_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prompt.objects.count(), 2)
        self.assertEqual(Prompt.objects.latest('id').title, 'New Test Prompt')
    
    def test_get_prompt_list(self):
        """Test that a list of prompts can be retrieved by the owner."""
        response = self.client.get(self.prompt_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
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
        self.assertEqual(Prompt.objects.count(), 0)
    
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
