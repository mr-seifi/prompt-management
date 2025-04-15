import json
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import argparse
import sys
import numpy as np

# Set the style for plots
plt.style.use('ggplot')
sns.set_theme(style="darkgrid")


def load_test_results(file_path: str) -> Dict:
    """
    Load test results from a JSON file.
    
    Args:
        file_path: Path to the JSON file containing test results
        
    Returns:
        Dictionary containing test results
    """
    with open(file_path, 'r') as f:
        return json.load(f)


def prepare_dataframe(test_results: Dict, run_name: str) -> pd.DataFrame:
    """
    Convert test results to a pandas DataFrame for easier analysis.
    
    Args:
        test_results: Dictionary containing test results
        run_name: Name to identify this test run in the dataframe
        
    Returns:
        DataFrame with each request as a row
    """
    rows = []
    
    for endpoint, results in test_results['request_results'].items():
        for result in results:
            row = {
                'run': run_name,
                'endpoint': endpoint,
                'timestamp': result['timestamp'],
                'status_code': result['status_code'],
                'elapsed_time': result['elapsed_time'],
                'response_size': result['response_size'],
                'success': result['success'],
            }
            rows.append(row)
    
    df = pd.DataFrame(rows)
    
    # Convert types
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['elapsed_time_ms'] = df['elapsed_time'] * 1000  # Convert to milliseconds
    
    return df


def plot_response_time_comparison(df1: pd.DataFrame, df2: pd.DataFrame, 
                                 run1_name: str, run2_name: str, 
                                 output_dir: str, file_format: str = 'png'):
    """
    Plot response time comparison between two test runs.
    
    Args:
        df1: DataFrame for first test run
        df2: DataFrame for second test run
        run1_name: Name of the first test run
        run2_name: Name of the second test run
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    # Combine dataframes
    combined_df = pd.concat([df1, df2])
    
    # Create a box plot for comparison
    plt.figure(figsize=(14, 8))
    ax = sns.boxplot(x='endpoint', y='elapsed_time_ms', hue='run', data=combined_df, palette='Set2')
    
    # Customize the plot
    plt.title(f'Response Time Comparison: {run1_name} vs {run2_name}', fontsize=16)
    plt.xlabel('Endpoint', fontsize=14)
    plt.ylabel('Response Time (ms)', fontsize=14)
    plt.xticks(rotation=45, ha='right')
    plt.legend(title='Test Run')
    plt.tight_layout()
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"response_time_comparison.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_success_rate_comparison(df1: pd.DataFrame, df2: pd.DataFrame, 
                               run1_name: str, run2_name: str, 
                               output_dir: str, file_format: str = 'png'):
    """
    Plot success rate comparison between two test runs.
    
    Args:
        df1: DataFrame for first test run
        df2: DataFrame for second test run
        run1_name: Name of the first test run
        run2_name: Name of the second test run
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    # Calculate success rates for each endpoint in each run
    success_rate1 = df1.groupby('endpoint')['success'].mean().reset_index()
    success_rate1['run'] = run1_name
    success_rate1['success_rate'] = success_rate1['success'] * 100
    
    success_rate2 = df2.groupby('endpoint')['success'].mean().reset_index()
    success_rate2['run'] = run2_name
    success_rate2['success_rate'] = success_rate2['success'] * 100
    
    # Combine the success rates
    combined_success = pd.concat([success_rate1, success_rate2])
    
    # Create a bar plot
    plt.figure(figsize=(14, 8))
    ax = sns.barplot(x='endpoint', y='success_rate', hue='run', data=combined_success, palette='Set2')
    
    # Customize the plot
    plt.title(f'Success Rate Comparison: {run1_name} vs {run2_name}', fontsize=16)
    plt.xlabel('Endpoint', fontsize=14)
    plt.ylabel('Success Rate (%)', fontsize=14)
    plt.xticks(rotation=45, ha='right')
    plt.legend(title='Test Run')
    plt.ylim(0, 105)  # Set y-axis limit to show full percentage range with some padding
    plt.tight_layout()
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"success_rate_comparison.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_response_time_improvement(results1: Dict, results2: Dict, 
                                 run1_name: str, run2_name: str, 
                                 output_dir: str, file_format: str = 'png'):
    """
    Plot response time improvement between two test runs.
    
    Args:
        results1: Results dictionary for first test run
        results2: Results dictionary for second test run
        run1_name: Name of the first test run
        run2_name: Name of the second test run
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    summary1 = results1['summary']
    summary2 = results2['summary']
    
    # Find common endpoints
    common_endpoints = list(set(summary1.keys()) & set(summary2.keys()))
    
    if not common_endpoints:
        return None
    
    # Calculate improvements for mean response time
    improvements = []
    for endpoint in common_endpoints:
        mean_time1 = summary1[endpoint]['mean_time'] * 1000  # Convert to ms
        mean_time2 = summary2[endpoint]['mean_time'] * 1000  # Convert to ms
        
        # Calculate percentage improvement (negative means slower)
        if mean_time1 > 0:
            improvement = ((mean_time1 - mean_time2) / mean_time1) * 100
        else:
            improvement = 0
        
        improvements.append({
            'endpoint': endpoint,
            'run1_time': mean_time1,
            'run2_time': mean_time2,
            'improvement': improvement,
            'absolute_diff': mean_time1 - mean_time2
        })
    
    # Create DataFrame for plotting
    improvements_df = pd.DataFrame(improvements)
    
    # Sort by improvement percentage (descending)
    improvements_df = improvements_df.sort_values('improvement', ascending=False)
    
    # Plot improvement
    plt.figure(figsize=(14, 8))
    
    # Create bar colors based on improvement (green for positive, red for negative)
    bar_colors = ['green' if x >= 0 else 'red' for x in improvements_df['improvement']]
    
    ax = plt.bar(improvements_df['endpoint'], improvements_df['improvement'], color=bar_colors)
    
    # Add a horizontal line at 0
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    
    # Add value labels on bars
    for i, v in enumerate(improvements_df['improvement']):
        plt.text(i, v + (5 if v >= 0 else -5), 
                f"{v:.1f}%", 
                ha='center', va='bottom' if v >= 0 else 'top',
                fontsize=10, fontweight='bold')
    
    # Customize the plot
    plt.title(f'Response Time Improvement: {run1_name} to {run2_name}', fontsize=16)
    plt.xlabel('Endpoint', fontsize=14)
    plt.ylabel('Improvement (%)', fontsize=14)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"response_time_improvement.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def generate_detailed_stats_table(results1: Dict, results2: Dict, 
                                 run1_name: str, run2_name: str):
    """
    Generate a detailed statistics table comparing two test runs.
    
    Args:
        results1: Results dictionary for first test run
        results2: Results dictionary for second test run
        run1_name: Name of the first test run
        run2_name: Name of the second test run
        
    Returns:
        HTML table with detailed stats
    """
    summary1 = results1['summary']
    summary2 = results2['summary']
    
    # Find common endpoints
    common_endpoints = list(set(summary1.keys()) & set(summary2.keys()))
    
    if not common_endpoints:
        return "<p>No common endpoints found to compare.</p>"
    
    # Create table
    html = """
    <table>
        <thead>
            <tr>
                <th>Endpoint</th>
                <th>Metric</th>
                <th>{run1}</th>
                <th>{run2}</th>
                <th>Diff</th>
                <th>% Change</th>
            </tr>
        </thead>
        <tbody>
    """.format(run1=run1_name, run2=run2_name)
    
    for endpoint in common_endpoints:
        stats1 = summary1[endpoint]
        stats2 = summary2[endpoint]
        
        # Define metrics to compare
        metrics = [
            ('Mean Time (ms)', 'mean_time', 1000),
            ('Median Time (ms)', 'median_time', 1000),
            ('Min Time (ms)', 'min_time', 1000),
            ('Max Time (ms)', 'max_time', 1000),
            ('Success Rate (%)', 'success_rate', 100),
            ('Requests', 'total_requests', 1)
        ]
        
        # Add rows for each metric
        for i, (metric_name, metric_key, multiplier) in enumerate(metrics):
            if metric_key in stats1 and metric_key in stats2:
                val1 = stats1[metric_key] * multiplier
                val2 = stats2[metric_key] * multiplier
                diff = val2 - val1
                
                if val1 != 0:
                    pct_change = (diff / val1) * 100
                else:
                    pct_change = 0
                
                # Determine if this change is positive (green) or negative (red)
                if metric_key == 'success_rate':
                    # Higher success rate is better
                    color = 'green' if diff >= 0 else 'red'
                elif metric_key == 'total_requests':
                    # Just show difference without color
                    color = 'black'
                else:
                    # Lower times are better
                    color = 'green' if diff <= 0 else 'red'
                
                html += """
                <tr{row_style}>
                    {endpoint_cell}
                    <td>{metric}</td>
                    <td>{val1:.2f}</td>
                    <td>{val2:.2f}</td>
                    <td style="color: {color};">{diff:+.2f}</td>
                    <td style="color: {color};">{pct_change:+.2f}%</td>
                </tr>
                """.format(
                    row_style=' class="endpoint-row"' if i == 0 else '',
                    endpoint_cell=f'<td rowspan="{len(metrics)}">{endpoint}</td>' if i == 0 else '',
                    metric=metric_name,
                    val1=val1,
                    val2=val2,
                    diff=diff,
                    pct_change=pct_change,
                    color=color
                )
    
    html += """
        </tbody>
    </table>
    """
    
    return html


def generate_html_report(results1: Dict, results2: Dict, 
                        run1_name: str, run2_name: str, 
                        plot_files: List[str], output_dir: str):
    """
    Generate an HTML report comparing two test runs.
    
    Args:
        results1: Results dictionary for first test run
        results2: Results dictionary for second test run
        run1_name: Name of the first test run
        run2_name: Name of the second test run
        plot_files: List of paths to plot files
        output_dir: Directory to save the report
    """
    # Generate detailed stats table
    stats_table = generate_detailed_stats_table(results1, results2, run1_name, run2_name)
    
    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Performance Comparison: {run1_name} vs {run2_name}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            header {{
                background-color: #2c3e50;
                color: white;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 5px;
            }}
            h1, h2, h3 {{
                margin-top: 0;
            }}
            .comparison-info {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }}
            .chart-container {{
                margin: 20px 0;
                text-align: center;
            }}
            .chart-container img {{
                max-width: 100%;
                height: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            th, td {{
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            th {{
                background-color: #2c3e50;
                color: white;
            }}
            tr:nth-child(even) {{
                background-color: #f8f9fa;
            }}
            .endpoint-row td {{
                border-top: 2px solid #2c3e50;
            }}
            footer {{
                margin-top: 30px;
                text-align: center;
                font-size: 0.9em;
                color: #666;
            }}
            .summary-box {{
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 5px;
                background-color: #e9ecef;
            }}
            .improvement-positive {{
                color: green;
                font-weight: bold;
            }}
            .improvement-negative {{
                color: red;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>API Performance Comparison Report</h1>
                <h2>{run1_name} vs {run2_name}</h2>
            </header>
            
            <section class="comparison-info">
                <h3>Comparison Overview</h3>
                <div class="summary-box">
                    <p><strong>Run 1:</strong> {run1_name}</p>
                    <p><strong>Run 2:</strong> {run2_name}</p>
                    <p><strong>Generated on:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
            </section>
            
            <section class="detailed-stats">
                <h3>Detailed Statistics Comparison</h3>
                {stats_table}
            </section>
            
            <section class="visualizations">
                <h3>Comparison Visualizations</h3>
    """
    
    # Add images for each plot
    for plot_file in plot_files:
        plot_name = os.path.basename(plot_file)
        plot_title = plot_name.replace('_', ' ').replace('.png', '').replace('.pdf', '').replace('.svg', '')
        # Get just the filename without the path
        plot_filename = os.path.basename(plot_file)
        html_content += f"""
                <div class="chart-container">
                    <h4>{plot_title}</h4>
                    <img src="{plot_filename}" alt="{plot_title}">
                </div>
        """
    
    html_content += """
            </section>
            
            <footer>
                <p>Generated on """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
            </footer>
        </div>
    </body>
    </html>
    """
    
    # Write HTML content to file
    os.makedirs(output_dir, exist_ok=True)
    report_path = os.path.join(output_dir, "comparison_report.html")
    with open(report_path, 'w') as f:
        f.write(html_content)
    
    return report_path


def compare_test_results(
    file1: str,
    file2: str, 
    output_dir: str = 'performance_comparisons',
    file_format: str = 'png',
    run1_label: Optional[str] = None,
    run2_label: Optional[str] = None
) -> Dict[str, str]:
    """
    Compare two test results and generate a comparison report.
    
    Args:
        file1: Path to the first test results JSON file
        file2: Path to the second test results JSON file
        output_dir: Directory to save the comparison report and visualizations
        file_format: Format for visualization files (png, pdf, svg)
        run1_label: Custom label for the first run (defaults to test name from results)
        run2_label: Custom label for the second run (defaults to test name from results)
        
    Returns:
        Dictionary of output file paths
    """
    # Load test results
    results1 = load_test_results(file1)
    results2 = load_test_results(file2)
    
    # Use provided labels or default to test names
    run1_name = run1_label or results1['test_name']
    run2_name = run2_label or results2['test_name']
    
    # Prepare output directory
    comparison_dir = os.path.join(output_dir, 
                                f"comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    os.makedirs(comparison_dir, exist_ok=True)
    
    # Prepare DataFrames
    df1 = prepare_dataframe(results1, run1_name)
    df2 = prepare_dataframe(results2, run2_name)
    
    # Generate comparison plots
    output_files = {}
    
    # Plot response time comparison
    output_files['response_time_comparison'] = plot_response_time_comparison(
        df1, df2, run1_name, run2_name, comparison_dir, file_format
    )
    
    # Plot success rate comparison
    output_files['success_rate_comparison'] = plot_success_rate_comparison(
        df1, df2, run1_name, run2_name, comparison_dir, file_format
    )
    
    # Plot response time improvement
    output_files['response_time_improvement'] = plot_response_time_improvement(
        results1, results2, run1_name, run2_name, comparison_dir, file_format
    )
    
    # Generate HTML report
    plot_files = [file for file in output_files.values() if file is not None]
    report_path = generate_html_report(
        results1, results2, run1_name, run2_name, plot_files, comparison_dir
    )
    output_files['html_report'] = report_path
    
    print(f"Comparison report generated at: {report_path}")
    return output_files


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Compare two API performance test results')
    parser.add_argument('file1', help='Path to the first test results JSON file')
    parser.add_argument('file2', help='Path to the second test results JSON file')
    parser.add_argument('--output-dir', default='performance_comparisons',
                       help='Directory to save the comparison report and visualizations')
    parser.add_argument('--format', choices=['png', 'pdf', 'svg'], default='png',
                       help='Format for visualization files')
    parser.add_argument('--run1-label', help='Custom label for the first run')
    parser.add_argument('--run2-label', help='Custom label for the second run')
    
    args = parser.parse_args()
    
    # Validate input files
    if not os.path.exists(args.file1):
        print(f"Error: File not found: {args.file1}")
        sys.exit(1)
    
    if not os.path.exists(args.file2):
        print(f"Error: File not found: {args.file2}")
        sys.exit(1)
    
    try:
        # Generate comparison
        output_files = compare_test_results(
            args.file1,
            args.file2,
            args.output_dir,
            args.format,
            args.run1_label,
            args.run2_label
        )
        
        # Print output location
        print(f"Comparison completed successfully.")
        print(f"HTML Report: {output_files['html_report']}")
        
    except Exception as e:
        print(f"Error generating comparison: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 