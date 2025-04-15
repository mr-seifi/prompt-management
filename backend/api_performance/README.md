# API Performance Testing Library

A comprehensive toolkit for testing and analyzing the performance of API endpoints in Django applications.

## Features

- Perform load testing on API endpoints
- Measure response times, success rates, and other metrics
- Generate detailed visualizations of performance data
- Compare performance between different test runs
- Test how API performance scales with dataset size
- Create professional HTML reports with interactive charts

## Installation

The library is included in the project. Make sure you have installed the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Running API Performance Tests

Use the `test_api` management command to run performance tests against your API endpoints:

```bash
python manage.py test_api --iterations 50 --concurrent --output-dir performance_results
```

#### Available Options

- `--output-dir`: Directory to save test results (default: `performance_results`)
- `--iterations`: Number of requests to make for each endpoint (default: 20)
- `--concurrent`: Run requests concurrently instead of sequentially
- `--max-workers`: Maximum number of concurrent workers (default: 5)
- `--warm-up`: Number of warm-up requests to make before testing (default: 2)
- `--host`: Base URL for API requests (default: `http://localhost:8000`)
- `--test-name`: Name for this test run (default: auto-generated)
- `--username`: Username for authentication (will create if not exists)
- `--password`: Password for authentication
- `--endpoints`: Specific endpoints to test (omit to test all predefined endpoints)
- `--include-response`: Include response data in results (increases file size)
- `--format`: Output format for visualizations (`png`, `pdf`, `svg`, default: `png`)

### Testing API Performance with Different Dataset Sizes

Use the `scale_test` management command to understand how your API performs as the dataset grows:

```bash
python manage.py scale_test --sizes 10 50 100 500 1000 --iterations 20
```

This command creates test prompts in incremental batches and measures API performance at each size.

#### Available Options

- `--output-dir`: Directory to save test results (default: `performance_results/scale_tests`)
- `--sizes`: Dataset sizes to test, i.e., number of prompts (default: `10 50 100 200 500`)
- `--iterations`: Number of requests to make for each endpoint and size (default: `10`)
- `--concurrent`: Run requests concurrently instead of sequentially
- `--max-workers`: Maximum number of concurrent workers (default: `5`)
- `--format`: Output format for visualizations (`png`, `pdf`, `svg`, default: `png`)

For more details on scale testing, see [SCALE_TESTING.md](./SCALE_TESTING.md).

### Comparing Test Results

Use the `compare_tests` management command to compare the results of multiple test runs:

```bash
python manage.py compare_tests performance_results/*.json --metric median_time
```

#### Available Options

- `result_files`: JSON files containing test results to compare
- `--output-dir`: Directory to save comparison visualizations (default: `performance_comparisons`)
- `--format`: Output format for visualizations (`png`, `pdf`, `svg`, default: `png`)
- `--endpoints`: Specific endpoints to compare (omit to compare all endpoints)
- `--metric`: Metric to use for comparison (`mean_time`, `median_time`, `min_time`, `max_time`, `p95_time`, default: `median_time`)

## Using the Library Programmatically

You can also use the API performance testing library programmatically in your own code:

```python
from api_performance.test_runner import APIPerformanceTester, TestConfig, RequestConfig
from api_performance.visualization import visualize_test_results

# Define test configuration
config = TestConfig(
    name="my_api_test",
    base_url="http://localhost:8000",
    requests=[
        RequestConfig(
            method="GET",
            endpoint="api/prompts/",
            headers={"Authorization": "Bearer your_token"}
        ),
        # Add more requests as needed
    ],
    iterations=20,
    concurrent=True,
    max_workers=5
)

# Run the test
tester = APIPerformanceTester(config)
test_result = tester.run()

# Save results to file
results_file = test_result.save_to_file("performance_results")

# Generate visualizations
visualize_test_results(
    results_file=results_file,
    output_dir="performance_results",
    file_format="png",
    generate_report=True
)
```

## Understanding the Results

The test results are saved as JSON files in the output directory. The library generates several visualizations to help you analyze the performance of your API endpoints:

- **Response Time Distribution**: Box plots showing the distribution of response times for each endpoint
- **Response Time Series**: Line charts showing how response times change over the duration of the test
- **Status Code Distribution**: Bar charts showing the distribution of HTTP status codes for each endpoint
- **Success Rate**: Bar charts showing the success rate for each endpoint
- **Response Size vs. Time**: Scatter plots showing the relationship between response size and response time
- **Summary Statistics**: Bar charts comparing min, mean, median, and max response times for each endpoint
- **Scale Performance**: Charts showing how performance metrics change as dataset size increases (for scale tests)

## Customizing the Tests

To add or modify the endpoints that are tested by default, edit the `_get_predefined_tests` method in the `test_api.py` file. The method returns a list of `RequestConfig` objects, which you can modify to suit your needs.

For more advanced customization, you can create your own test runner by extending the `APIPerformanceTester` class and overriding its methods.

## HTML Reports

The library generates comprehensive HTML reports that include:

- Test information (start time, duration, iterations, etc.)
- Summary statistics for each endpoint
- Interactive charts for visualizing performance data
- Comparison tables for multiple test runs
- For scale tests, detailed performance analysis across different dataset sizes 