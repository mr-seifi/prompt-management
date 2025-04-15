import os
import json
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from api_performance.test_runner import APIPerformanceTester, TestConfig, RequestConfig

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test API performance with different dataset sizes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='performance_results/scale_tests',
            help='Directory to save test results and visualizations'
        )
        parser.add_argument(
            '--sizes',
            type=int,
            nargs='+',
            default=[10, 50, 100, 200, 500],
            help='Dataset sizes to test (number of prompts)'
        )
        parser.add_argument(
            '--iterations',
            type=int,
            default=10,
            help='Number of iterations for each endpoint and size'
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
            '--host',
            type=str,
            default='http://localhost:8000',
            help='Base URL for API requests (default: http://localhost:8000)'
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
            help='Maximum number of workers for concurrent execution'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['png', 'pdf', 'svg'],
            default='png',
            help='Output format for visualizations'
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

    def _create_test_prompts(self, auth_token, size, existing_count=0):
        """
        Create test prompts for performance testing.
        
        Args:
            auth_token: Authentication token
            size: Number of prompts to create
            existing_count: Number of prompts that already exist
            
        Returns:
            List of created prompt IDs
        """
        self.stdout.write(f"Creating {size} test prompts...")
        
        client = APIClient()
        if auth_token:
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Track created prompt IDs
        prompt_ids = []
        
        # Create batches of prompts (using transaction for efficiency)
        batch_size = 50
        with transaction.atomic():
            for i in range(size):
                # Add some realistic variation to the prompts
                num_vars = (i % 3) + 1  # 1, 2, or 3 variables
                var_schema = {}
                var_placeholders = ""
                
                # Create variables
                for v in range(num_vars):
                    var_name = f"variable{v+1}"
                    var_schema[var_name] = {
                        "type": "string", 
                        "description": f"Test variable {v+1}"
                    }
                    var_placeholders += f" with {{{{{var_name}}}}}"
                
                # Every 5th prompt is a favorite
                is_favorite = (i % 5 == 0)
                
                response = client.post(
                    '/api/prompts/',
                    {
                        'title': f'Scale Test Prompt {existing_count + i + 1}',
                        'description': f'This is a test prompt {existing_count + i + 1} created for scalability testing{var_placeholders}',
                        'variables_schema': var_schema,
                        'favorite': is_favorite
                    },
                    format='json'
                )
                
                if response.status_code == 201:
                    prompt_ids.append(response.data["id"])
                else:
                    self.stdout.write(self.style.WARNING(
                        f'Failed to create prompt {i+1}: {response.data}'
                    ))
                
                # Print progress every 10 prompts
                if (i + 1) % 10 == 0:
                    self.stdout.write(f"Created {i+1}/{size} prompts...")
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {len(prompt_ids)} prompts'
        ))
        
        return prompt_ids

    def _count_existing_prompts(self, auth_token):
        """Count existing prompts for the authenticated user."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        response = client.get('/api/prompts/')
        if response.status_code == 200:
            return response.data.get('count', 0)
        else:
            self.stdout.write(self.style.WARNING(
                f'Failed to count existing prompts: {response.data}'
            ))
            return 0

    def _create_test_config(self, host, size, auth_token, iterations, concurrent, max_workers):
        """
        Create test configuration for a specific dataset size.
        
        Args:
            host: Base URL for API
            size: Dataset size (number of prompts)
            auth_token: Authentication token
            iterations: Number of iterations
            concurrent: Whether to run tests concurrently
            max_workers: Maximum number of workers for concurrent execution
            
        Returns:
            TestConfig object
        """
        endpoints = [
            # Basic list endpoint - gets paginated results
            RequestConfig(method='GET', endpoint='api/prompts/'),
            
            # Search endpoint
            RequestConfig(method='GET', endpoint='api/prompts/?search=Scale Test'),
            
            # Filter by favorites
            RequestConfig(method='GET', endpoint='api/prompts/?favorite=true'),
            
            # Sorting endpoint
            RequestConfig(method='GET', endpoint='api/prompts/?ordering=-updated_at'),
            
            # Combination of filters
            RequestConfig(method='GET', endpoint='api/prompts/?search=Scale&favorite=true'),
        ]
        
        return TestConfig(
            name=f'scale_test_{size}_prompts',
            base_url=host,
            requests=endpoints,
            iterations=iterations,
            concurrent=concurrent,
            max_workers=max_workers,
            auth_token=auth_token
        )

    def _run_test_for_size(self, config, size):
        """
        Run performance test for a specific dataset size.
        
        Args:
            config: TestConfig object
            size: Dataset size (number of prompts)
            
        Returns:
            Dictionary with test results
        """
        self.stdout.write(f'Running performance test for dataset size: {size}')
        
        # Create tester object
        tester = APIPerformanceTester(config)
        
        # Run the test
        start_time = time.time()
        result = tester.run()
        duration = time.time() - start_time
        
        self.stdout.write(f'Test completed in {duration:.2f} seconds')
        
        return result

    def _visualize_results(self, results, dataset_sizes, output_dir, file_format):
        """
        Create visualizations of test results across dataset sizes.
        
        Args:
            results: Dictionary mapping dataset sizes to test results
            dataset_sizes: List of dataset sizes
            output_dir: Directory to save visualizations
            file_format: Format for output files
        """
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Extract data for plotting
        plot_data = []
        
        for size, result in results.items():
            for endpoint, stats in result.summary.items():
                # Endpoint name for display
                display_endpoint = endpoint.replace('api/prompts/', '')
                if display_endpoint == '':
                    display_endpoint = 'list_all'
                
                plot_data.append({
                    'dataset_size': size,
                    'endpoint': display_endpoint,
                    'median_time': stats['median_time'] * 1000,  # Convert to ms
                    'mean_time': stats['mean_time'] * 1000,
                    'min_time': stats['min_time'] * 1000,
                    'max_time': stats['max_time'] * 1000,
                    'success_rate': stats['success_rate'] * 100
                })
        
        # Convert to DataFrame
        df = pd.DataFrame(plot_data)
        
        # 1. Line plot - Response time vs Dataset Size
        plt.figure(figsize=(12, 7))
        sns.lineplot(
            data=df, 
            x='dataset_size', 
            y='median_time', 
            hue='endpoint', 
            marker='o',
            linewidth=2.5
        )
        plt.title('API Response Time by Dataset Size', fontsize=16)
        plt.xlabel('Number of Prompts', fontsize=14)
        plt.ylabel('Median Response Time (ms)', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = os.path.join(output_dir, f'scale_test_response_time_{timestamp}.{file_format}')
        plt.savefig(filename, dpi=300)
        plt.close()
        
        # 2. Bar plot - Success Rate vs Dataset Size
        plt.figure(figsize=(12, 7))
        sns.barplot(
            data=df,
            x='dataset_size',
            y='success_rate',
            hue='endpoint'
        )
        plt.title('API Success Rate by Dataset Size', fontsize=16)
        plt.xlabel('Number of Prompts', fontsize=14)
        plt.ylabel('Success Rate (%)', fontsize=14)
        plt.ylim(0, 105)  # Set y-axis limit
        plt.tight_layout()
        
        filename = os.path.join(output_dir, f'scale_test_success_rate_{timestamp}.{file_format}')
        plt.savefig(filename, dpi=300)
        plt.close()
        
        # 3. Heatmap - Response Time by Endpoint and Dataset Size
        pivot_df = df.pivot_table(
            index='endpoint', 
            columns='dataset_size', 
            values='median_time'
        )
        
        plt.figure(figsize=(12, 8))
        sns.heatmap(
            pivot_df,
            annot=True,
            fmt='.1f',
            cmap='viridis',
            linewidths=.5
        )
        plt.title('Median Response Time (ms) by Endpoint and Dataset Size', fontsize=16)
        plt.tight_layout()
        
        filename = os.path.join(output_dir, f'scale_test_heatmap_{timestamp}.{file_format}')
        plt.savefig(filename, dpi=300)
        plt.close()
        
        # 4. Generate HTML report
        html_content = self._generate_html_report(results, dataset_sizes, plot_data, timestamp)
        
        # Save HTML report
        report_filename = os.path.join(output_dir, f'scale_test_report_{timestamp}.html')
        with open(report_filename, 'w') as f:
            f.write(html_content)
        
        self.stdout.write(self.style.SUCCESS(
            f'Visualizations saved to {output_dir}'
        ))
        
        return [filename, report_filename]

    def _generate_html_report(self, results, dataset_sizes, plot_data, timestamp):
        """Generate HTML report for scale test results."""
        df = pd.DataFrame(plot_data)
        
        # CSS styles
        css = """
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            header {
                background-color: #2c3e50;
                color: white;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 5px;
            }
            h1, h2, h3 {
                margin-top: 0;
            }
            .charts {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
                margin-bottom: 30px;
            }
            .chart-container {
                text-align: center;
                margin-bottom: 30px;
            }
            .chart-container img {
                max-width: 100%;
                height: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            th {
                background-color: #2c3e50;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .summary {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .card {
                background-color: white;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                padding: 20px;
                margin-bottom: 20px;
            }
        </style>
        """
        
        # Chart placeholders (these would be replaced by actual charts in a web app)
        charts_html = """
        <div class="chart-container">
            <h3>Response Time by Dataset Size</h3>
            <p>This chart shows how response times change as the number of prompts increases.</p>
            <img src="scale_test_response_time_{timestamp}.{format}" alt="Response Time Chart">
        </div>
        
        <div class="chart-container">
            <h3>Success Rate by Dataset Size</h3>
            <p>This chart shows how the success rate changes as the number of prompts increases.</p>
            <img src="scale_test_success_rate_{timestamp}.{format}" alt="Success Rate Chart">
        </div>
        
        <div class="chart-container">
            <h3>Response Time Heatmap</h3>
            <p>This heatmap visualizes response times across different endpoints and dataset sizes.</p>
            <img src="scale_test_heatmap_{timestamp}.{format}" alt="Response Time Heatmap">
        </div>
        """.format(timestamp=timestamp, format='png')
        
        # Generate result tables for each dataset size
        tables_html = ""
        
        for size in dataset_sizes:
            result = results[size]
            
            tables_html += f"""
            <div class="card">
                <h3>Results for {size} Prompts</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Median Time (ms)</th>
                            <th>Mean Time (ms)</th>
                            <th>Min Time (ms)</th>
                            <th>Max Time (ms)</th>
                            <th>Success Rate (%)</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            for endpoint, stats in result.summary.items():
                display_endpoint = endpoint.replace('api/prompts/', '')
                if display_endpoint == '':
                    display_endpoint = 'list_all'
                
                tables_html += f"""
                        <tr>
                            <td>{display_endpoint}</td>
                            <td>{stats['median_time'] * 1000:.2f}</td>
                            <td>{stats['mean_time'] * 1000:.2f}</td>
                            <td>{stats['min_time'] * 1000:.2f}</td>
                            <td>{stats['max_time'] * 1000:.2f}</td>
                            <td>{stats['success_rate'] * 100:.2f}</td>
                        </tr>
                """
            
            tables_html += """
                    </tbody>
                </table>
            </div>
            """
        
        # Assemble the full HTML report
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Scale Test Results</title>
            {css}
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>API Scale Test Results</h1>
                    <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </header>
                
                <div class="summary">
                    <h2>Test Summary</h2>
                    <p>This report shows how API performance varies with different dataset sizes.</p>
                    <p>Dataset sizes tested: {', '.join(map(str, dataset_sizes))}</p>
                </div>
                
                <h2>Visualizations</h2>
                {charts_html}
                
                <h2>Detailed Results</h2>
                {tables_html}
            </div>
        </body>
        </html>
        """
        
        return html

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        sizes = options['sizes']
        iterations = options['iterations']
        username = options['username']
        password = options['password']
        host = options['host']
        concurrent = options['concurrent']
        max_workers = options['max_workers']
        file_format = options['format']
        debug = options['debug']
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Set up authentication
        try:
            auth_token = self._setup_auth(username, password)
            self.stdout.write(self.style.SUCCESS('Authentication successful'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Authentication failed: {str(e)}'))
            auth_token = None
            raise CommandError('Authentication is required for scale testing')
        
        # Count existing prompts
        existing_count = self._count_existing_prompts(auth_token)
        self.stdout.write(f'Found {existing_count} existing prompts')
        
        # Store results for each dataset size
        results = {}
        
        # Previous size to track cumulative prompts
        prev_size = 0
        
        # Run tests for each dataset size
        try:
            for size in sorted(sizes):
                # Calculate how many additional prompts to create
                prompts_to_create = size - prev_size
                
                if prompts_to_create > 0:
                    # Create additional prompts to reach the desired size
                    self._create_test_prompts(auth_token, prompts_to_create, existing_count + prev_size)
                
                # Create test configuration
                config = self._create_test_config(
                    host, size, auth_token, iterations, concurrent, max_workers
                )
                
                # Run test for this size
                result = self._run_test_for_size(config, size)
                
                # Store result
                results[size] = result
                
                # Update previous size
                prev_size = size
                
            # Visualize results
            self._visualize_results(results, sizes, output_dir, file_format)
            
            self.stdout.write(self.style.SUCCESS('Scale testing completed successfully'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during scale testing: {str(e)}'))
            if debug:
                import traceback
                self.stdout.write(traceback.format_exc())
            raise CommandError('Scale testing failed') 