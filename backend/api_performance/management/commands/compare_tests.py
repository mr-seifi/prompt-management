import os
import json
import glob
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Any
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from api_performance.visualization import load_test_results, prepare_dataframe
from api_performance.compare_runs import compare_test_results


class Command(BaseCommand):
    help = 'Compare two API performance test result files'

    def add_arguments(self, parser):
        parser.add_argument('file1', 
                          help='Path to the first test results JSON file')
        parser.add_argument('file2', 
                          help='Path to the second test results JSON file')
        parser.add_argument('--output-dir', default='performance_comparisons',
                          help='Directory to save the comparison report and visualizations')
        parser.add_argument('--format', choices=['png', 'pdf', 'svg'], default='png',
                          help='Format for visualization files')
        parser.add_argument('--run1-label', 
                          help='Custom label for the first run')
        parser.add_argument('--run2-label', 
                          help='Custom label for the second run')
        parser.add_argument('--open', action='store_true',
                          help='Open the report in a browser after generation')

    def _load_multiple_results(self, file_paths: List[str], endpoints: List[str] = None) -> Dict[str, Dict]:
        """Load and validate multiple test result files."""
        results = {}
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
                continue
                
            try:
                data = load_test_results(file_path)
                test_name = data.get('test_name', os.path.basename(file_path))
                
                # Filter endpoints if specified
                if endpoints:
                    filtered_results = {}
                    for endpoint, result_list in data['request_results'].items():
                        if any(e in endpoint for e in endpoints):
                            filtered_results[endpoint] = result_list
                    data['request_results'] = filtered_results
                
                results[test_name] = data
                
            except (json.JSONDecodeError, KeyError) as e:
                self.stdout.write(self.style.ERROR(f'Error loading {file_path}: {str(e)}'))
                
        return results

    def _plot_comparison_by_endpoint(self, results: Dict[str, Dict], 
                                     metric: str, output_dir: str, 
                                     file_format: str = 'png'):
        """Plot comparison of test results by endpoint."""
        if not results:
            return None
            
        # Extract common endpoints across all test results
        common_endpoints = set()
        
        for test_name, data in results.items():
            if 'summary' in data:
                for endpoint in data['summary'].keys():
                    common_endpoints.add(endpoint)
        
        if not common_endpoints:
            self.stdout.write(self.style.WARNING('No common endpoints found for comparison'))
            return None
            
        # Prepare data for plotting
        plot_data = []
        
        for test_name, data in results.items():
            if 'summary' not in data:
                continue
                
            for endpoint, stats in data['summary'].items():
                if endpoint in common_endpoints and metric in stats:
                    # Convert to milliseconds for better display
                    value = stats[metric] * 1000 if stats[metric] is not None else 0
                    
                    plot_data.append({
                        'test_name': test_name,
                        'endpoint': endpoint,
                        'value': value
                    })
        
        if not plot_data:
            self.stdout.write(self.style.WARNING(f'No data found for metric: {metric}'))
            return None
            
        # Create DataFrame for plotting
        df = pd.DataFrame(plot_data)
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Create comparison bar plot
        plt.figure(figsize=(14, 8))
        ax = sns.barplot(x='endpoint', y='value', hue='test_name', data=df, palette='viridis')
        
        # Customize the plot
        metric_label = metric.replace('_', ' ').title()
        ax.set_title(f'Comparison of {metric_label} by Endpoint', fontsize=16)
        ax.set_xlabel('Endpoint', fontsize=14)
        ax.set_ylabel(f'{metric_label} (ms)', fontsize=14)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
        plt.legend(title='Test Name', fontsize=12)
        plt.tight_layout()
        
        # Save the plot
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = os.path.join(output_dir, f"comparison_{metric}_{timestamp}.{file_format}")
        plt.savefig(filename, dpi=300)
        plt.close()
        
        return filename

    def _generate_html_report(self, results: Dict[str, Dict], 
                             plot_files: List[str], output_dir: str):
        """Generate HTML report for test comparison."""
        if not results:
            return None
            
        # Extract common endpoints
        common_endpoints = set()
        for test_name, data in results.items():
            if 'summary' in data:
                for endpoint in data['summary'].keys():
                    common_endpoints.add(endpoint)
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Performance Test Comparison</title>
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
                    <h1>API Performance Test Comparison</h1>
                    <h2>Tests Compared: {", ".join(results.keys())}</h2>
                </header>
                
                <section class="tests-summary">
                    <h3>Test Information</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Start Time</th>
                                <th>Duration</th>
                                <th>Iterations</th>
                                <th>Concurrent</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        # Add rows for each test
        for test_name, data in results.items():
            html_content += f"""
                            <tr>
                                <td>{test_name}</td>
                                <td>{data.get('start_time', 'N/A')}</td>
                                <td>{data.get('total_duration', 'N/A'):.2f} seconds</td>
                                <td>{data.get('iterations', 'N/A')}</td>
                                <td>{'Yes' if data.get('concurrent', False) else 'No'}</td>
                            </tr>
            """
        
        html_content += """
                        </tbody>
                    </table>
                </section>
                
                <section class="endpoint-comparison">
                    <h3>Endpoint Comparison</h3>
        """
        
        # Add tables for each endpoint
        for endpoint in sorted(common_endpoints):
            html_content += f"""
                    <h4>{endpoint}</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Success Rate</th>
                                <th>Min Time (ms)</th>
                                <th>Mean Time (ms)</th>
                                <th>Median Time (ms)</th>
                                <th>Max Time (ms)</th>
                                <th>P95 Time (ms)</th>
                            </tr>
                        </thead>
                        <tbody>
            """
            
            for test_name, data in results.items():
                if 'summary' in data and endpoint in data['summary']:
                    stats = data['summary'][endpoint]
                    p95_time = stats.get('p95_time', None)
                    p95_display = f"{p95_time*1000:.2f}" if p95_time is not None else "N/A"
                    
                    html_content += f"""
                            <tr>
                                <td>{test_name}</td>
                                <td>{stats.get('success_rate', 0)*100:.2f}%</td>
                                <td>{stats.get('min_time', 0)*1000:.2f}</td>
                                <td>{stats.get('mean_time', 0)*1000:.2f}</td>
                                <td>{stats.get('median_time', 0)*1000:.2f}</td>
                                <td>{stats.get('max_time', 0)*1000:.2f}</td>
                                <td>{p95_display}</td>
                            </tr>
                    """
            
            html_content += """
                        </tbody>
                    </table>
            """
        
        html_content += """
                </section>
                
                <section class="visualizations">
                    <h3>Comparison Charts</h3>
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
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = os.path.join(output_dir, f"comparison_report_{timestamp}.html")
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        return report_path

    def handle(self, *args, **options):
        file1 = options['file1']
        file2 = options['file2']
        
        # Validate input files
        if not os.path.exists(file1):
            self.stderr.write(self.style.ERROR(f"Error: File not found: {file1}"))
            return
        
        if not os.path.exists(file2):
            self.stderr.write(self.style.ERROR(f"Error: File not found: {file2}"))
            return
        
        self.stdout.write(self.style.SUCCESS("Comparing API performance test results..."))
        
        try:
            # Generate comparison
            output_files = compare_test_results(
                file1,
                file2,
                options['output_dir'],
                options['format'],
                options['run1_label'],
                options['run2_label']
            )
            
            report_path = output_files['html_report']
            
            self.stdout.write(self.style.SUCCESS(f"Comparison completed successfully."))
            self.stdout.write(self.style.SUCCESS(f"HTML Report: {report_path}"))
            
            # Open the report in the default browser if requested
            if options['open'] and os.path.exists(report_path):
                import webbrowser
                self.stdout.write("Opening report in browser...")
                webbrowser.open(f"file://{os.path.abspath(report_path)}")
                
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error generating comparison: {str(e)}"))
            import traceback
            traceback.print_exc() 