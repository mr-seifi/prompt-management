import os
import json
import time
import argparse
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from django.urls import reverse
from rest_framework.test import APIClient
from api_performance.test_runner import (
    APIPerformanceTester, TestConfig, RequestConfig, TestResult
)
from api_performance.visualization import visualize_test_results
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
import sys
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

User = get_user_model()

class Command(BaseCommand):
    help = 'Run API performance tests against endpoints'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='performance_results',
            help='Directory to save test results and visualizations'
        )
        parser.add_argument(
            '--iterations',
            type=int,
            default=20,
            help='Number of requests to make for each endpoint (default: 20)'
        )
        parser.add_argument(
            '--concurrent',
            action='store_true',
            help='Run requests concurrently instead of sequentially'
        )
        parser.add_argument(
            '--max-workers',
            type=int,
            default=5,
            help='Maximum number of workers for concurrent execution (default: 5)'
        )
        parser.add_argument(
            '--warm-up',
            type=int,
            default=2,
            help='Number of warm-up requests to make before testing (default: 2)'
        )
        parser.add_argument(
            '--host',
            type=str,
            default='http://localhost:8000',
            help='Base URL for API requests (default: http://localhost:8000)'
        )
        parser.add_argument(
            '--test-name',
            type=str,
            default=f'api_test_{int(time.time())}',
            help='Name for this test run (default: auto-generated)'
        )
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for authentication (will create if not exists)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin_password',
            help='Password for authentication'
        )
        parser.add_argument(
            '--endpoints',
            nargs='+',
            help='Specific endpoints to test (omit to test all predefined endpoints)'
        )
        parser.add_argument(
            '--include-response',
            action='store_true',
            help='Include response data in results (increases file size)'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['png', 'pdf', 'svg'],
            default='png',
            help='Output format for visualizations (default: png)'
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Print debug information during test execution'
        )

    def _setup_auth(self, username, password):
        """Set up authentication for API requests."""
        # Check if user exists, create if not
        try:
            user = User.objects.get(username=username)
            # Update password if user exists
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Using existing user: {username}'
            ))
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=f'{username}@example.com',
                password=password
            )
            self.stdout.write(self.style.SUCCESS(
                f'Created test user: {username} with password: {password}'
            ))
        
        # Get auth token
        try:
            client = APIClient()
            response = client.post(
                '/api/auth/login/',
                {'username': username, 'password': password},
                format='json'
            )
            
            if response.status_code != 200:
                self.stdout.write(self.style.WARNING(f'Auth response status: {response.status_code}'))
                self.stdout.write(self.style.WARNING(f'Auth response data: {response.data}'))
                raise CommandError(f'Failed to authenticate: {response.data}')
            
            return response.data['access']
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Authentication error: {str(e)}'))
            self.stdout.write(self.style.WARNING('Attempting to create a token manually...'))
            
            try:
                # Try to use JWT tokens directly
                refresh = RefreshToken.for_user(user)
                self.stdout.write(self.style.SUCCESS('Successfully created token manually'))
                return str(refresh.access_token)
            except Exception as e2:
                self.stdout.write(self.style.ERROR(f'Manual token creation failed: {str(e2)}'))
                raise CommandError("Failed to authenticate using all available methods")

    def _get_predefined_tests(self, host, iterations, concurrent, warm_up, include_response, 
                          test_name, auth_token=None, specific_endpoints=None, prompt_id=None):
        """
        Get predefined test configurations.
        
        Args:
            host: Base URL for API
            iterations: Number of iterations for each endpoint
            concurrent: Whether to run tests concurrently
            warm_up: Number of warm-up requests
            include_response: Whether to include response data
            test_name: Base name for the test
            auth_token: Authentication token
            specific_endpoints: List of specific endpoints to test
            prompt_id: ID of the prompt to use in the endpoints (defaults to 1)
            
        Returns:
            List of TestConfig objects
        """
        # Use the provided prompt_id or default to 1
        pid = prompt_id or 1
        
        # Define available endpoints with their methods
        available_endpoints = {
            'prompts': {
                'list': RequestConfig(method='GET', endpoint='api/prompts/'),
                'create': RequestConfig(
                    method='POST', 
                    endpoint='api/prompts/',
                    json_data={
                        'title': 'Test Prompt',
                        'description': 'This is a test prompt for performance testing with {{variable1}}',
                        'variables_schema': {
                            'variable1': {'type': 'string', 'description': 'Test variable'}
                        }
                    }
                ),
                # Use the prompt_id parameter
                'detail': RequestConfig(method='GET', endpoint=f'api/prompts/{pid}/'),
            },
            'favorites': {
                'toggle': RequestConfig(
                    method='PATCH', 
                    endpoint=f'api/prompts/{pid}/toggle_favorite/',
                    json_data={}
                ),
            },
            'variables': {
                'list': RequestConfig(method='GET', endpoint=f'api/prompts/{pid}/variables/'),
            },
            'render': {
                'render_prompt': RequestConfig(
                    method='POST',
                    endpoint=f'api/prompts/{pid}/render/',
                    json_data={
                        'variable_values': {
                            'variable1': 'test value'
                        }
                    }
                ),
            }
        }
        
        # If specific endpoints were requested, filter the available ones
        test_endpoints = []
        if specific_endpoints:
            for endpoint_key in specific_endpoints:
                if endpoint_key in available_endpoints:
                    for method_name, req_config in available_endpoints[endpoint_key].items():
                        test_endpoints.append(req_config)
                else:
                    logger.warning(f"Endpoint {endpoint_key} not found in predefined endpoints")
        else:
            # Use all available endpoints if none specified
            for endpoint_type in available_endpoints.values():
                for req_config in endpoint_type.values():
                    test_endpoints.append(req_config)
        
        # Create test configurations
        if not test_endpoints:
            logger.error("No valid endpoints selected for testing")
            sys.exit(1)
            
        # We'll create a single test config with all endpoints
        config = TestConfig(
            name=test_name,
            base_url=host,
            requests=test_endpoints,
            iterations=iterations,
            concurrent=concurrent,
            warm_up_iterations=warm_up,
            include_response_data=include_response,
            auth_token=auth_token  # Pass the auth token here so APIPerformanceTester can use it
        )
        
        return [config]

    def _print_summary(self, test_result):
        """Print a summary of the test results to the console."""
        self.stdout.write('\nTest Results Summary:')
        
        for endpoint, stats in test_result.summary.items():
            self.stdout.write(f'Endpoint: {endpoint}')
            self.stdout.write(f'  Success rate: {stats["success_rate"]*100:.2f}%')
            self.stdout.write(f'  Mean time: {stats["mean_time"]*1000:.2f} ms')
            self.stdout.write(f'  Median time: {stats["median_time"]*1000:.2f} ms')
            self.stdout.write(f'  Min time: {stats["min_time"]*1000:.2f} ms')
            self.stdout.write(f'  Max time: {stats["max_time"]*1000:.2f} ms')
            if stats.get('p95_time'):
                self.stdout.write(f'  95th percentile: {stats["p95_time"]*1000:.2f} ms')
        
        # Print status code distribution
        self.stdout.write('\nStatus Code Distribution:')
        status_counts = {}
        for endpoint, results in test_result.request_results.items():
            endpoint_counts = {}
            for result in results:
                status = result.status_code
                endpoint_counts[status] = endpoint_counts.get(status, 0) + 1
            status_counts[endpoint] = endpoint_counts
            
        for endpoint, counts in status_counts.items():
            self.stdout.write(f'  {endpoint}:')
            for status, count in counts.items():
                status_type = "Success" if 200 <= status < 300 else "Error"
                self.stdout.write(f'    Status {status} ({status_type}): {count} requests')

    def _create_test_prompt(self, auth_token=None):
        """Create a test prompt to ensure we have at least one prompt available for testing."""
        try:
            from rest_framework.test import APIClient
            
            # Create a client and set the auth token
            client = APIClient()
            if auth_token:
                client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
            
            # Create a test prompt
            response = client.post(
                '/api/prompts/',
                {
                    'title': 'API Test Prompt',
                    'description': 'This is a test prompt created for API performance testing with {{variable1}}',
                    'variables_schema': {
                        'variable1': {'type': 'string', 'description': 'Test variable'}
                    },
                    'favorite': False
                },
                format='json'
            )
            
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS(f'Created test prompt with ID: {response.data["id"]}'))
                return response.data["id"]
            else:
                self.stdout.write(self.style.WARNING(f'Failed to create test prompt: {response.data}'))
                return None
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test prompt: {str(e)}'))
            return None

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        iterations = options['iterations']
        concurrent = options['concurrent']
        max_workers = options['max_workers']
        warm_up = options['warm_up']
        host = options['host']
        test_name = options['test_name']
        username = options['username']
        password = options['password']
        specified_endpoints = options['endpoints']
        include_response = options['include_response']
        output_format = options['format']
        debug = options['debug']
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Set up authentication
        try:
            auth_token = self._setup_auth(username, password)
            self.stdout.write(self.style.SUCCESS('Authentication successful'))
            if debug:
                self.stdout.write(f"Token: {auth_token[:10]}...")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Authentication failed: {str(e)}'))
            auth_token = None
        
        # Create a test prompt to ensure we have at least one prompt available
        prompt_id = self._create_test_prompt(auth_token)
        if prompt_id:
            self.stdout.write(self.style.SUCCESS(f'Using test prompt with ID: {prompt_id}'))
        else:
            self.stdout.write(self.style.WARNING(
                'Could not create a test prompt. Some tests may fail if prompt ID 1 does not exist.'
            ))
            prompt_id = 1  # Default to ID 1 if we couldn't create a prompt
        
        # Get test configurations with the prompt ID
        test_configs = self._get_predefined_tests(
            host, iterations, concurrent, warm_up, include_response, 
            test_name, auth_token, specified_endpoints, prompt_id
        )
        
        if not test_configs:
            raise CommandError('No endpoints to test')
        
        # Run the performance test
        self.stdout.write(f'Running API performance test: {test_name}')
        
        for config in test_configs:
            self.stdout.write(f'Testing {len(config.requests)} endpoints with {iterations} iterations each')
            
            # Extra check for authentication
            if not auth_token:
                self.stdout.write(self.style.WARNING('Running tests without authentication. This may result in 403 errors.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Using authentication token for all requests'))
            
            if debug:
                for i, req_config in enumerate(config.requests):
                    self.stdout.write(f"Request {i+1}: {req_config.method} {req_config.endpoint}")
                    self.stdout.write(f"  Headers: {req_config.headers}")
                    if req_config.json_data:
                        self.stdout.write(f"  JSON Data: {req_config.json_data}")
            
            # Execute the test
            try:
                # Create the tester with the current config
                tester = APIPerformanceTester(config)
                
                # Verify the auth token is in the session headers
                if auth_token and 'Authorization' in tester.session.headers:
                    self.stdout.write(self.style.SUCCESS('Auth token correctly set in session headers'))
                
                # Run the test
                start_time = time.time()
                self.stdout.write(f"Starting test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Call the run() method instead of _run_sequential() or _run_concurrent()
                result = tester.run()
                
                end_time = time.time()
                duration = end_time - start_time
                self.stdout.write(f"Test completed in {duration:.2f} seconds")
                
                # Save results
                result_file = result.save_to_file(directory=output_dir)
                self.stdout.write(self.style.SUCCESS(f'Test results saved to {result_file}'))
                
                # Print summary
                self._print_summary(result)
                
                # Generate visualizations if requested
                if output_format:
                    try:
                        # Use the already imported visualize_test_results function
                        viz_file = visualize_test_results(
                            results_file=result_file, 
                            output_dir=output_dir, 
                            file_format=output_format
                        )
                        self.stdout.write(self.style.SUCCESS(f'Visualizations generated in {output_dir}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Failed to generate visualization: {str(e)}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Test execution error: {str(e)}'))
                if debug:
                    import traceback
                    self.stdout.write(traceback.format_exc())
        
        self.stdout.write(self.style.SUCCESS('Test completed successfully')) 