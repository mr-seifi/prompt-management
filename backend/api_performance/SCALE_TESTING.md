# API Scale Testing

This tool tests API performance as the dataset size increases, helping you understand how your application scales with larger volumes of data.

## Overview

The scale testing tool measures API performance across different dataset sizes by:

1. Creating varying numbers of test prompts
2. Running performance tests on key endpoints for each dataset size
3. Comparing response times, success rates, and other metrics
4. Generating visual reports showing performance trends

## Usage

### Basic Usage

Run a basic scale test with the default options:

```bash
python manage.py scale_test
```

This will:
- Create datasets of 10, 50, 100, 200, and 500 prompts
- Test each endpoint with 10 iterations per dataset size
- Generate HTML reports and visualizations

### Advanced Options

Customize the scale test with various options:

```bash
python manage.py scale_test \
  --sizes 25 75 150 300 \
  --iterations 20 \
  --concurrent \
  --max-workers 8 \
  --output-dir custom_results \
  --format pdf
```

### Available Options

- `--output-dir`: Directory to save test results (default: `performance_results/scale_tests`)
- `--sizes`: Dataset sizes to test, i.e., number of prompts (default: `10 50 100 200 500`)
- `--iterations`: Number of requests to make for each endpoint and size (default: `10`)
- `--username`: Username for authentication (default: `admin`)
- `--password`: Password for authentication (default: `admin_password`)
- `--host`: Base URL for API requests (default: `http://localhost:8000`)
- `--concurrent`: Run requests concurrently instead of sequentially
- `--max-workers`: Maximum number of concurrent workers (default: `5`)
- `--format`: Output format for visualizations (`png`, `pdf`, `svg`, default: `png`)
- `--debug`: Print debug information during test execution

## Output and Visualizations

The scale test produces several visualizations to help you understand scaling performance:

### 1. Response Time Line Chart

Shows how response times increase as the dataset grows for each endpoint. This helps identify which endpoints might become bottlenecks as your data grows.

### 2. Success Rate Bar Chart

Displays the success rate for each endpoint across different dataset sizes. This helps identify reliability issues that might emerge at scale.

### 3. Response Time Heatmap

A color-coded matrix showing response times for each endpoint and dataset size, making it easy to spot performance outliers.

### 4. HTML Report

A comprehensive HTML report that includes:
- Test configuration details
- All visualizations in one place
- Detailed results tables for each dataset size
- Summary statistics and performance analysis

## Interpreting Results

When analyzing scale test results, look for:

1. **Non-linear response time growth**: If response time grows faster than dataset size, this might indicate an inefficient database query or algorithm.

2. **Declining success rates**: If success rates drop as dataset size increases, investigate timeout settings or resource constraints.

3. **Endpoint outliers**: If specific endpoints perform significantly worse at scale, they may need optimization.

4. **Performance cliffs**: Sudden jumps in response time at specific dataset sizes can indicate memory issues or query plan changes.

## Example: Optimizing for Scale

Here's how to use scale testing to optimize your API:

1. Run an initial scale test to establish a baseline
2. Identify endpoints with poor scaling characteristics
3. Implement optimizations (index creation, query optimization, etc.)
4. Run another scale test to measure improvement
5. Compare results using the `compare_tests` command

## Implementation Details

The scale testing tool works by:

1. Creating test prompts with the authenticated user
2. Testing API endpoints with progressively larger datasets
3. Measuring response times, success rates, and other metrics
4. Generating visualizations and reports for analysis

The test is incremental - it creates additional prompts to reach each target size rather than recreating all prompts for each test. This makes testing more efficient and realistic.

## Tips for Effective Scale Testing

- Test with realistic data similar to your production environment
- Include a wide range of dataset sizes to identify non-linear performance curves
- Focus on endpoints that handle large data volumes (listing, searching, filtering)
- Run tests multiple times to ensure results are consistent
- Test during off-peak hours if using a shared database

## Cleaning Up Test Data

After running scale tests, you may want to clean up the test data. You can use the Django admin interface to delete the test prompts created by the scale test. 