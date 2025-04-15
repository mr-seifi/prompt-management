import time
import json
import requests
import statistics
import logging
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime
import os
import concurrent.futures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api_performance')

@dataclass
class RequestConfig:
    """Configuration for a single API request."""
    method: str
    endpoint: str
    headers: Dict[str, str] = field(default_factory=dict)
    params: Dict[str, Any] = field(default_factory=dict)
    data: Optional[Dict[str, Any]] = None
    json_data: Optional[Dict[str, Any]] = None
    auth: Optional[tuple] = None
    timeout: float = 30.0
    allow_redirects: bool = True
    verify: bool = True

@dataclass
class RequestResult:
    """Results of a single API request execution."""
    status_code: int
    elapsed_time: float  # in seconds
    response_size: int
    timestamp: str
    success: bool
    error: Optional[str] = None
    response_headers: Dict[str, str] = field(default_factory=dict)
    response_data: Optional[Any] = None

@dataclass
class TestConfig:
    """Configuration for a test run."""
    name: str
    base_url: str
    requests: List[RequestConfig]
    iterations: int = 1
    concurrent: bool = False
    max_workers: int = 5
    warm_up_iterations: int = 0
    include_response_data: bool = False
    auth_token: Optional[str] = None
    setup_function: Optional[Callable] = None
    teardown_function: Optional[Callable] = None

@dataclass
class TestResult:
    """Results of a complete test run."""
    test_name: str
    start_time: str
    end_time: str
    total_duration: float
    request_results: Dict[str, List[RequestResult]]
    iterations: int
    concurrent: bool
    summary: Dict[str, Any] = field(default_factory=dict)

    def calculate_summary(self):
        """Calculate summary statistics for the test run."""
        summary = {}
        
        for endpoint, results in self.request_results.items():
            # Extract elapsed times for successful requests
            elapsed_times = [r.elapsed_time for r in results if r.success]
            if not elapsed_times:
                continue
                
            # Calculate statistics
            endpoint_summary = {
                'min_time': min(elapsed_times),
                'max_time': max(elapsed_times),
                'mean_time': statistics.mean(elapsed_times),
                'median_time': statistics.median(elapsed_times),
                'p95_time': sorted(elapsed_times)[int(len(elapsed_times) * 0.95)] if len(elapsed_times) >= 20 else None,
                'p99_time': sorted(elapsed_times)[int(len(elapsed_times) * 0.99)] if len(elapsed_times) >= 100 else None,
                'std_dev': statistics.stdev(elapsed_times) if len(elapsed_times) > 1 else 0,
                'total_requests': len(results),
                'successful_requests': len(elapsed_times),
                'failed_requests': len(results) - len(elapsed_times),
                'success_rate': len(elapsed_times) / len(results) if results else 0,
                'avg_response_size': statistics.mean([r.response_size for r in results if r.success]) if elapsed_times else 0
            }
            summary[endpoint] = endpoint_summary
            
        self.summary = summary
        return summary

    def to_dict(self):
        """Convert test result to dictionary."""
        if not self.summary:
            self.calculate_summary()
            
        result_dict = asdict(self)
        
        # Remove response_data if it wasn't requested to keep results compact
        if not self.request_results:
            return result_dict
            
        for endpoint in result_dict['request_results']:
            for request in result_dict['request_results'][endpoint]:
                if 'response_data' in request and not request['response_data']:
                    del request['response_data']
                    
        return result_dict

    def save_to_file(self, directory='performance_results'):
        """Save test results to a JSON file."""
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{directory}/{self.test_name}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
            
        logger.info(f"Test results saved to {filename}")
        return filename


class APIPerformanceTester:
    """
    A class for testing API performance metrics.
    
    This class allows you to configure and run performance tests against API endpoints,
    measuring response times, throughput, and other performance metrics.
    """
    
    def __init__(self, config: TestConfig):
        """
        Initialize the API performance tester.
        
        Args:
            config: TestConfig object with test configuration
        """
        self.config = config
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'User-Agent': 'API-Performance-Tester/1.0',
            'Accept': 'application/json',
        })
        
        # Set auth token if provided
        if config.auth_token:
            self._setup_auth_header(config.auth_token)
        
        # Initialize the request counters
        self.request_count = 0
        self.success_count = 0
        self.error_count = 0
    
    def _setup_auth_header(self, token: str):
        """
        Set up authentication header for all requests.
        
        Args:
            token: Authentication token
        """
        logger.info("Setting up authentication header for all requests")
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def _make_request(self, request_config: RequestConfig) -> RequestResult:
        """
        Make a single HTTP request and measure performance metrics.
        
        Args:
            request_config: Configuration for this request
            
        Returns:
            RequestResult object containing performance metrics
        """
        # Prepare request URL and parameters
        url = f"{self.config.base_url.rstrip('/')}/{request_config.endpoint.lstrip('/')}"
        
        # Create a copy of the headers to avoid modifying the original
        headers = dict(request_config.headers)
        
        # If we have a session with auth but the request doesn't have it, add it
        if 'Authorization' in self.session.headers and 'Authorization' not in headers:
            headers['Authorization'] = self.session.headers['Authorization']
            
        # For CSRF protected endpoints, ensure we have the CSRF token
        # This is more important for Django REST views using SessionAuthentication
        if request_config.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            if 'X-CSRFToken' not in headers and hasattr(self.session, 'cookies'):
                csrf_token = self.session.cookies.get('csrftoken')
                if csrf_token:
                    headers['X-CSRFToken'] = csrf_token
        
        # Start timer
        start_time = time.time()
        timestamp = datetime.now().isoformat()
        
        try:
            # Make the request
            response = self.session.request(
                method=request_config.method,
                url=url,
                headers=headers,
                params=request_config.params,
                data=request_config.data,
                json=request_config.json_data,
                auth=request_config.auth,
                timeout=request_config.timeout,
                allow_redirects=request_config.allow_redirects,
                verify=request_config.verify
            )
            
            # Calculate elapsed time
            elapsed_time = time.time() - start_time
            
            # Try to parse response data
            response_data = None
            if self.config.include_response_data:
                try:
                    response_data = response.json()
                except (ValueError, json.JSONDecodeError):
                    response_data = response.text[:1000] if response.text else None
            
            # Get response size
            response_size = len(response.content)
            
            # Check if request was successful
            success = 200 <= response.status_code < 300
            
            # Additional logging for debugging
            if not success:
                logger.warning(
                    f"Request to {url} failed with status {response.status_code}: {response.text[:500]}"
                )
            
            # Create the result object
            result = RequestResult(
                status_code=response.status_code,
                elapsed_time=elapsed_time,
                response_size=response_size,
                timestamp=timestamp,
                success=success,
                error=None if success else response.text[:500],
                response_headers=dict(response.headers),
                response_data=response_data
            )
            
            # Update counters
            self.request_count += 1
            if success:
                self.success_count += 1
            else:
                self.error_count += 1
                
            return result
            
        except Exception as e:
            # Calculate elapsed time even for failed requests
            elapsed_time = time.time() - start_time
            
            # Update counters
            self.request_count += 1
            self.error_count += 1
            
            return RequestResult(
                status_code=-1,
                elapsed_time=elapsed_time,
                response_size=0,
                timestamp=timestamp,
                success=False,
                error=str(e)
            )
    
    def _run_sequential(self) -> Dict[str, List[RequestResult]]:
        """Run tests sequentially."""
        results = {req.endpoint: [] for req in self.config.requests}
        
        # Perform warm-up requests if configured
        if self.config.warm_up_iterations > 0:
            logger.info(f"Performing {self.config.warm_up_iterations} warm-up requests...")
            for _ in range(self.config.warm_up_iterations):
                for req_config in self.config.requests:
                    self._make_request(req_config)
        
        # Run the actual test iterations
        for i in range(self.config.iterations):
            logger.info(f"Running iteration {i+1}/{self.config.iterations}")
            
            for req_config in self.config.requests:
                result = self._make_request(req_config)
                results[req_config.endpoint].append(result)
                
        return results
    
    def _run_concurrent(self) -> Dict[str, List[RequestResult]]:
        """Run tests concurrently using thread pool."""
        results = {req.endpoint: [] for req in self.config.requests}
        
        # Perform warm-up requests if configured
        if self.config.warm_up_iterations > 0:
            logger.info(f"Performing {self.config.warm_up_iterations} warm-up requests...")
            for _ in range(self.config.warm_up_iterations):
                for req_config in self.config.requests:
                    self._make_request(req_config)
        
        # Prepare tasks for concurrent execution
        tasks = []
        for i in range(self.config.iterations):
            for req_config in self.config.requests:
                tasks.append((i, req_config))
        
        # Execute tasks concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
            future_to_task = {
                executor.submit(self._make_request, req_config): (i, req_config)
                for i, req_config in tasks
            }
            
            for future in concurrent.futures.as_completed(future_to_task):
                _, req_config = future_to_task[future]
                result = future.result()
                results[req_config.endpoint].append(result)
                
        return results
    
    def run(self) -> TestResult:
        """
        Run the performance test and collect results.
        
        Returns:
            TestResult object with all test metrics
        """
        logger.info(f"Starting API performance test: {self.config.name}")
        
        # Call setup function if provided
        if self.config.setup_function:
            logger.info("Calling setup function...")
            self.config.setup_function()
        
        # Record start time
        start_time = time.time()
        start_time_str = datetime.now().isoformat()
        
        # Run the test (either sequentially or concurrently)
        if self.config.concurrent:
            logger.info(f"Running concurrent test with {self.config.max_workers} workers")
            request_results = self._run_concurrent()
        else:
            logger.info("Running sequential test")
            request_results = self._run_sequential()
        
        # Record end time
        end_time = time.time()
        end_time_str = datetime.now().isoformat()
        total_duration = end_time - start_time
        
        # Call teardown function if provided
        if self.config.teardown_function:
            logger.info("Calling teardown function...")
            self.config.teardown_function()
        
        # Create test result
        test_result = TestResult(
            test_name=self.config.name,
            start_time=start_time_str,
            end_time=end_time_str,
            total_duration=total_duration,
            request_results=request_results,
            iterations=self.config.iterations,
            concurrent=self.config.concurrent
        )
        
        # Calculate summary statistics
        test_result.calculate_summary()
        
        # Log test summary
        logger.info(f"Test completed in {total_duration:.2f} seconds")
        logger.info(f"Requests: {self.request_count}, Successful: {self.success_count}, Failed: {self.error_count}")
        for endpoint, stats in test_result.summary.items():
            logger.info(f"Endpoint: {endpoint}")
            logger.info(f"  Success rate: {stats['success_rate']*100:.2f}%")
            logger.info(f"  Mean time: {stats['mean_time']*1000:.2f} ms")
            logger.info(f"  Median time: {stats['median_time']*1000:.2f} ms")
            logger.info(f"  Min time: {stats['min_time']*1000:.2f} ms")
            logger.info(f"  Max time: {stats['max_time']*1000:.2f} ms")
            if stats['p95_time']:
                logger.info(f"  95th percentile: {stats['p95_time']*1000:.2f} ms")
        
        return test_result 