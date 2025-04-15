"""
Examples of using the API Performance Testing Library programmatically.

This file contains examples of how to use the API performance testing library
in your own code. You can run this file directly to see how it works:

```bash
python manage.py shell -c "from api_performance import examples; examples.run_example()"
```
"""

import os
import time
from api_performance.test_runner import (
    APIPerformanceTester, TestConfig, RequestConfig, TestResult
)
from api_performance.visualization import visualize_test_results


def basic_example():
    """Run a basic API performance test with minimal configuration."""
    print("Running basic API performance test...")
    
    # Define test configuration
    config = TestConfig(
        name="basic_example",
        base_url="http://localhost:8000",
        requests=[
            RequestConfig(
                method="GET",
                endpoint="api/prompts/",
                headers={"Content-Type": "application/json"}
            ),
            RequestConfig(
                method="GET",
                endpoint="api/auth/profile/",
                headers={"Content-Type": "application/json"}
            ),
        ],
        iterations=5,  # Small number for quick demonstration
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
    
    return results_file


def advanced_example():
    """Run a more advanced API performance test with authentication and custom settings."""
    print("Running advanced API performance test...")
    
    # Define test configuration with more options
    config = TestConfig(
        name="advanced_example",
        base_url="http://localhost:8000",
        requests=[
            # GET requests
            RequestConfig(
                method="GET",
                endpoint="api/prompts/",
                headers={"Content-Type": "application/json"}
            ),
            RequestConfig(
                method="GET",
                endpoint="api/prompts/?search=test",
                headers={"Content-Type": "application/json"}
            ),
            # POST request with JSON data
            RequestConfig(
                method="POST",
                endpoint="api/prompts/",
                headers={"Content-Type": "application/json"},
                json_data={
                    "title": f"Test Prompt {int(time.time())}",
                    "description": "This is a test prompt with a {{variable}}",
                    "favorite": False
                }
            ),
        ],
        iterations=10,
        concurrent=True,
        max_workers=3,
        warm_up_iterations=2,
        include_response_data=True
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
    
    return results_file


def compare_example():
    """Run two tests and compare the results."""
    print("Running comparison example...")
    
    # Run two tests with different parameters
    file1 = basic_example()
    
    # Change some parameters for the second test
    file2 = advanced_example()
    
    # Use the comparison functionality to compare the results
    print(f"Comparing {file1} and {file2}...")
    
    # Here you would typically use the compare_tests management command:
    # python manage.py compare_tests file1 file2
    
    print("To compare results, run the following command:")
    print(f"python manage.py compare_tests {file1} {file2} --metric median_time")
    
    return (file1, file2)


def run_example():
    """Run all examples."""
    print("\n=== API Performance Testing Library Examples ===\n")

    try:
        # Create output directory if it doesn't exist
        os.makedirs("performance_results", exist_ok=True)
        
        # Run basic example
        basic_example()
        print("\nBasic example completed successfully.")
        
        # Run advanced example
        advanced_example()
        print("\nAdvanced example completed successfully.")
        
        # Run comparison example
        compare_example()
        print("\nComparison example completed successfully.")
        
        print("\nAll examples completed successfully. Check the 'performance_results' directory for outputs.")
        
    except Exception as e:
        print(f"\nError running examples: {str(e)}")
        raise


if __name__ == "__main__":
    # This code runs when the file is executed directly
    run_example() 