from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json

from .models import Profile
from .serializers import UserSerializer, ProfileSerializer


class ProfileModelTest(TestCase):
    """Tests for the Profile model."""
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        # Profile should be created automatically via signals
        self.profile = Profile.objects.get(user=self.user)
    
    def test_profile_creation(self):
        """Test that a profile is automatically created when a user is created."""
        self.assertIsNotNone(self.profile)
        self.assertEqual(self.profile.user, self.user)
    
    def test_profile_str_representation(self):
        """Test the string representation of the Profile model."""
        self.assertEqual(str(self.profile), f'Profile for {self.user.username}')


class UserSerializerTest(TestCase):
    """Tests for the User serializer."""
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.user_data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpassword123'
        }
    
    def test_user_serializer_contains_expected_fields(self):
        """Test that UserSerializer includes the expected fields."""
        serializer = UserSerializer(instance=self.user)
        expected_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_create_user_with_serializer(self):
        """Test that a user can be created with the serializer."""
        serializer = UserSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.email, 'new@example.com')
        self.assertTrue(user.check_password('newpassword123'))
        # Check that profile was created
        self.assertTrue(hasattr(user, 'profile'))


class ProfileSerializerTest(TestCase):
    """Tests for the Profile serializer."""
    
    def setUp(self):
        """Set up test data for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.profile = Profile.objects.get(user=self.user)
    
    def test_profile_serializer_contains_expected_fields(self):
        """Test that ProfileSerializer includes the expected fields."""
        serializer = ProfileSerializer(instance=self.profile)
        expected_fields = ['id', 'bio', 'avatar', 'user']
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
    
    def test_update_profile_with_serializer(self):
        """Test that a profile can be updated with the serializer."""
        profile_data = {
            'bio': 'New test bio',
            'user': self.user.id
        }
        serializer = ProfileSerializer(instance=self.profile, data=profile_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()
        self.assertEqual(updated_profile.bio, 'New test bio')


class UserAPITest(APITestCase):
    """Tests for the User API endpoints."""
    
    def setUp(self):
        """Set up test data and client for all test methods."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('profile')
        self.users_url = reverse('users-list')
    
    def test_register_user(self):
        """Test that a user can register."""
        user_data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpassword123'
        }
        response = self.client.post(self.register_url, user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_login_user(self):
        """Test that a user can login and receive a token."""
        login_data = {
            'username': 'testuser',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_get_user_profile(self):
        """Test that a user can get their profile."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_update_user_profile(self):
        """Test that a user can update their profile."""
        self.client.force_authenticate(user=self.user)
        profile_data = {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'updated@example.com',
            'profile': {
                'bio': 'Updated bio'
            }
        }
        response = self.client.put(
            self.profile_url, 
            data=json.dumps(profile_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Test')
        self.assertEqual(self.user.last_name, 'User')
        self.assertEqual(self.user.email, 'updated@example.com')
        self.assertEqual(self.user.profile.bio, 'Updated bio')
    
    def test_get_users_list_authenticated(self):
        """Test that an authenticated user can get a list of users."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
    
    def test_get_users_list_unauthenticated(self):
        """Test that an unauthenticated user cannot get a list of users."""
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_login_with_wrong_credentials(self):
        """Test that a user cannot login with wrong credentials."""
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
    
    def test_cannot_register_with_existing_username(self):
        """Test that a user cannot register with an existing username."""
        user_data = {
            'username': 'testuser',
            'email': 'another@example.com',
            'password': 'password123'
        }
        response = self.client.post(self.register_url, user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
    
    def test_cannot_register_with_empty_password(self):
        """Test that a user cannot register with an empty password."""
        user_data = {
            'username': 'emptypassword',
            'email': 'empty@example.com',
            'password': ''
        }
        response = self.client.post(self.register_url, user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data) 