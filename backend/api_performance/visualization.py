import json
import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path

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


def prepare_dataframe(test_results: Dict) -> pd.DataFrame:
    """
    Convert test results to a pandas DataFrame for easier analysis.
    
    Args:
        test_results: Dictionary containing test results
        
    Returns:
        DataFrame with each request as a row
    """
    rows = []
    
    for endpoint, results in test_results['request_results'].items():
        for result in results:
            row = {
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


def plot_response_times(df: pd.DataFrame, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot response times for each endpoint.
    
    Args:
        df: DataFrame containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    plt.figure(figsize=(12, 8))
    
    # Get all unique endpoints
    endpoints = df['endpoint'].unique()
    
    # Create a box plot for response times by endpoint
    ax = sns.boxplot(x='endpoint', y='elapsed_time_ms', data=df, palette='viridis')
    
    # Customize the plot
    plt.title(f'Response Time Distribution by Endpoint - {test_name}', fontsize=16)
    plt.xlabel('Endpoint', fontsize=14)
    plt.ylabel('Response Time (ms)', fontsize=14)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Add individual data points
    sns.stripplot(x='endpoint', y='elapsed_time_ms', data=df, 
                 size=4, color='black', alpha=0.3)
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{test_name}_response_times.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_response_time_series(df: pd.DataFrame, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot response times as a time series.
    
    Args:
        df: DataFrame containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    plt.figure(figsize=(14, 8))
    
    # Get all unique endpoints
    endpoints = df['endpoint'].unique()
    
    # Create a new figure for each endpoint
    for endpoint in endpoints:
        endpoint_df = df[df['endpoint'] == endpoint].sort_values('timestamp')
        
        plt.figure(figsize=(14, 6))
        plt.plot(endpoint_df['timestamp'], endpoint_df['elapsed_time_ms'], 
                 marker='o', linestyle='-', label=endpoint)
        
        # Add trend line
        z = np.polyfit(mdates.date2num(endpoint_df['timestamp']), endpoint_df['elapsed_time_ms'], 1)
        p = np.poly1d(z)
        plt.plot(endpoint_df['timestamp'], p(mdates.date2num(endpoint_df['timestamp'])), 
                 "r--", linewidth=2)
        
        # Customize the plot
        plt.title(f'Response Time Over Time - {endpoint} - {test_name}', fontsize=16)
        plt.xlabel('Time', fontsize=14)
        plt.ylabel('Response Time (ms)', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=25)
        plt.tight_layout()
        
        # Save the plot
        os.makedirs(output_dir, exist_ok=True)
        endpoint_name = endpoint.replace('/', '_').replace('?', '').replace('&', '')
        filename = os.path.join(output_dir, f"{test_name}_{endpoint_name}_time_series.{file_format}")
        plt.savefig(filename, dpi=300)
        plt.close()
    
    # Create a combined plot for all endpoints
    plt.figure(figsize=(14, 8))
    
    for endpoint in endpoints:
        endpoint_df = df[df['endpoint'] == endpoint].sort_values('timestamp')
        plt.plot(endpoint_df['timestamp'], endpoint_df['elapsed_time_ms'], 
                 marker='o', linestyle='-', alpha=0.7, label=endpoint)
    
    # Customize the plot
    plt.title(f'Response Time Over Time - All Endpoints - {test_name}', fontsize=16)
    plt.xlabel('Time', fontsize=14)
    plt.ylabel('Response Time (ms)', fontsize=14)
    plt.grid(True, alpha=0.3)
    plt.legend(fontsize=12)
    plt.xticks(rotation=25)
    plt.tight_layout()
    
    # Save the plot
    filename = os.path.join(output_dir, f"{test_name}_all_time_series.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_status_code_distribution(df: pd.DataFrame, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot distribution of status codes for each endpoint.
    
    Args:
        df: DataFrame containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    plt.figure(figsize=(12, 8))
    
    # Count status codes for each endpoint
    status_counts = df.groupby(['endpoint', 'status_code']).size().reset_index(name='count')
    
    # Use a bar plot
    g = sns.catplot(
        x='endpoint', y='count', hue='status_code', 
        data=status_counts, kind='bar', 
        palette='viridis', height=8, aspect=1.5
    )
    
    # Customize the plot
    g.set_xticklabels(rotation=45, ha='right')
    g.fig.suptitle(f'Status Code Distribution by Endpoint - {test_name}', fontsize=16, y=1.02)
    g.set_axis_labels('Endpoint', 'Count', fontsize=14)
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{test_name}_status_codes.{file_format}")
    g.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_response_size_vs_time(df: pd.DataFrame, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot response size vs. response time for each endpoint.
    
    Args:
        df: DataFrame containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    plt.figure(figsize=(12, 8))
    
    # Create scatter plot with endpoints as hue
    g = sns.lmplot(
        x='response_size', y='elapsed_time_ms', 
        hue='endpoint', data=df, 
        height=8, aspect=1.5, 
        scatter_kws={'alpha': 0.6}
    )
    
    # Customize the plot
    g.fig.suptitle(f'Response Size vs. Response Time - {test_name}', fontsize=16, y=1.02)
    g.set_axis_labels('Response Size (bytes)', 'Response Time (ms)', fontsize=14)
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{test_name}_size_vs_time.{file_format}")
    g.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_success_rate(df: pd.DataFrame, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot success rate for each endpoint.
    
    Args:
        df: DataFrame containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    plt.figure(figsize=(12, 6))
    
    # Calculate success rate for each endpoint
    success_rates = df.groupby('endpoint')['success'].mean().reset_index()
    success_rates['success_rate'] = success_rates['success'] * 100
    
    # Create bar plot
    plt.figure(figsize=(12, 6))
    ax = sns.barplot(x='endpoint', y='success_rate', data=success_rates, palette='RdYlGn')
    
    # Customize the plot
    ax.set_title(f'Success Rate by Endpoint - {test_name}', fontsize=16)
    ax.set_xlabel('Endpoint', fontsize=14)
    ax.set_ylabel('Success Rate (%)', fontsize=14)
    ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
    
    # Add value labels on bars
    for i, p in enumerate(ax.patches):
        ax.annotate(f'{p.get_height():.1f}%', 
                   (p.get_x() + p.get_width() / 2., p.get_height()),
                   ha='center', va='bottom', fontsize=12)
    
    plt.ylim(0, 105)  # Set y-axis limit to show full percentage range with some padding
    plt.tight_layout()
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{test_name}_success_rate.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def plot_summary_statistics(test_results: Dict, test_name: str, output_dir: str, file_format: str = 'png'):
    """
    Plot summary statistics for the test.
    
    Args:
        test_results: Dictionary containing test results
        test_name: Name of the test to include in the title
        output_dir: Directory to save the plot
        file_format: Format for the output file (png, pdf, svg)
    """
    summary = test_results['summary']
    
    if not summary:
        return None
    
    # Extract data for plotting
    endpoints = list(summary.keys())
    min_times = [summary[ep]['min_time'] * 1000 for ep in endpoints]
    max_times = [summary[ep]['max_time'] * 1000 for ep in endpoints]
    mean_times = [summary[ep]['mean_time'] * 1000 for ep in endpoints]
    median_times = [summary[ep]['median_time'] * 1000 for ep in endpoints]
    
    # Create a DataFrame for easier plotting
    summary_df = pd.DataFrame({
        'endpoint': endpoints,
        'min_time': min_times,
        'mean_time': mean_times,
        'median_time': median_times,
        'max_time': max_times
    })
    
    # Reshape for seaborn
    summary_long = pd.melt(
        summary_df, 
        id_vars=['endpoint'], 
        value_vars=['min_time', 'mean_time', 'median_time', 'max_time'],
        var_name='statistic', 
        value_name='time_ms'
    )
    
    # Create the plot
    plt.figure(figsize=(14, 8))
    ax = sns.barplot(x='endpoint', y='time_ms', hue='statistic', data=summary_long, palette='viridis')
    
    # Customize the plot
    ax.set_title(f'Response Time Statistics by Endpoint - {test_name}', fontsize=16)
    ax.set_xlabel('Endpoint', fontsize=14)
    ax.set_ylabel('Response Time (ms)', fontsize=14)
    ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
    plt.legend(title='Statistic', fontsize=12)
    plt.tight_layout()
    
    # Save the plot
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{test_name}_summary_stats.{file_format}")
    plt.savefig(filename, dpi=300)
    plt.close()
    
    return filename


def generate_html_report(test_results: Dict, plot_files: List[str], output_dir: str):
    """
    Generate an HTML report for the test results.
    
    Args:
        test_results: Dictionary containing test results
        plot_files: List of paths to plot files
        output_dir: Directory to save the report
    """
    test_name = test_results['test_name']
    start_time = test_results['start_time']
    end_time = test_results['end_time']
    total_duration = test_results['total_duration']
    iterations = test_results['iterations']
    concurrent = test_results['concurrent']
    summary = test_results['summary']
    
    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Performance Test Report - {test_name}</title>
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
            .test-info {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }}
            .test-summary {{
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }}
            .summary-item {{
                flex: 1;
                min-width: 200px;
                background-color: #e9ecef;
                padding: 15px;
                border-radius: 5px;
            }}
            .endpoint-stats {{
                margin-bottom: 30px;
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
            footer {{
                margin-top: 30px;
                text-align: center;
                font-size: 0.9em;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>API Performance Test Report</h1>
                <h2>{test_name}</h2>
            </header>
            
            <section class="test-info">
                <h3>Test Information</h3>
                <div class="test-summary">
                    <div class="summary-item">
                        <p><strong>Start Time:</strong> {start_time}</p>
                        <p><strong>End Time:</strong> {end_time}</p>
                        <p><strong>Total Duration:</strong> {total_duration:.2f} seconds</p>
                    </div>
                    <div class="summary-item">
                        <p><strong>Iterations:</strong> {iterations}</p>
                        <p><strong>Concurrent Execution:</strong> {'Yes' if concurrent else 'No'}</p>
                    </div>
                </div>
            </section>
            
            <section class="endpoint-stats">
                <h3>Endpoint Statistics</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Success Rate</th>
                            <th>Min Time (ms)</th>
                            <th>Mean Time (ms)</th>
                            <th>Median Time (ms)</th>
                            <th>Max Time (ms)</th>
                            <th>P95 Time (ms)</th>
                            <th>Requests</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Add rows for each endpoint
    for endpoint, stats in summary.items():
        p95_time = stats['p95_time'] * 1000 if stats['p95_time'] is not None else 'N/A'
        html_content += f"""
                        <tr>
                            <td>{endpoint}</td>
                            <td>{stats['success_rate']*100:.2f}%</td>
                            <td>{stats['min_time']*1000:.2f}</td>
                            <td>{stats['mean_time']*1000:.2f}</td>
                            <td>{stats['median_time']*1000:.2f}</td>
                            <td>{stats['max_time']*1000:.2f}</td>
                            <td>{p95_time if isinstance(p95_time, str) else f'{p95_time:.2f}'}</td>
                            <td>{stats['total_requests']}</td>
                        </tr>
        """
    
    html_content += """
                    </tbody>
                </table>
            </section>
            
            <section class="visualizations">
                <h3>Visualizations</h3>
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
    report_path = os.path.join(output_dir, f"{test_name}_report.html")
    with open(report_path, 'w') as f:
        f.write(html_content)
    
    return report_path


def visualize_test_results(
    results_file: str, 
    output_dir: str = 'performance_results',
    file_format: str = 'png',
    generate_report: bool = True
) -> Dict[str, str]:
    """
    Generate visualizations from test results.
    
    Args:
        results_file: Path to the JSON file containing test results
        output_dir: Directory to save visualizations
        file_format: Format for output files (png, pdf, svg)
        generate_report: Whether to generate an HTML report
        
    Returns:
        Dictionary of output file paths
    """
    # Load test results
    test_results = load_test_results(results_file)
    test_name = test_results['test_name']
    
    # Prepare output directory
    report_dir = os.path.join(output_dir, 
                             f"{test_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    os.makedirs(report_dir, exist_ok=True)
    
    # Prepare DataFrame
    df = prepare_dataframe(test_results)
    
    # Generate plots
    output_files = {}
    
    # Copy the input file to the output directory
    results_filename = os.path.basename(results_file)
    output_results_file = os.path.join(report_dir, results_filename)
    with open(results_file, 'r') as src, open(output_results_file, 'w') as dst:
        json.dump(json.load(src), dst, indent=2)
    output_files['results_json'] = output_results_file
    
    # Generate and save plots
    output_files['response_times'] = plot_response_times(df, test_name, report_dir, file_format)
    output_files['time_series'] = plot_response_time_series(df, test_name, report_dir, file_format)
    output_files['status_codes'] = plot_status_code_distribution(df, test_name, report_dir, file_format)
    output_files['size_vs_time'] = plot_response_size_vs_time(df, test_name, report_dir, file_format)
    output_files['success_rate'] = plot_success_rate(df, test_name, report_dir, file_format)
    output_files['summary_stats'] = plot_summary_statistics(test_results, test_name, report_dir, file_format)
    
    # Generate HTML report if requested
    if generate_report:
        plot_files = [file for file in output_files.values() if file is not None and file.endswith(f'.{file_format}')]
        report_path = generate_html_report(test_results, plot_files, report_dir)
        output_files['html_report'] = report_path
    
    return output_files 