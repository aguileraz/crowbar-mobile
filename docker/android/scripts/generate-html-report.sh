#!/bin/bash

# Enhanced HTML Report Generator for Crowbar Mobile
# Creates comprehensive test reports with charts, failure details, and screenshots

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORT_TITLE="Crowbar Mobile Test Report"
REPORT_VERSION="1.0.0"
CHART_JS_CDN="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"
LIGHTBOX_CSS="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/css/lightbox.min.css"
LIGHTBOX_JS="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox.min.js"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[REPORT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate CSS styles
generate_css() {
    cat <<EOF
<style>
    /* Base styles */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f8f9fa;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    
    /* Header */
    .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 0;
        text-align: center;
        margin-bottom: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }
    
    .header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        font-weight: 700;
    }
    
    .header .subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
    }
    
    /* Cards */
    .card {
        background: white;
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #e9ecef;
    }
    
    .card h2 {
        font-size: 1.5rem;
        margin-bottom: 20px;
        color: #495057;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
    }
    
    /* Metrics grid */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .metric {
        text-align: center;
        padding: 25px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        border: 1px solid #dee2e6;
    }
    
    .metric-value {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 5px;
    }
    
    .metric-label {
        font-size: 0.9rem;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .metric.success .metric-value { color: #28a745; }
    .metric.danger .metric-value { color: #dc3545; }
    .metric.warning .metric-value { color: #ffc107; }
    .metric.info .metric-value { color: #17a2b8; }
    
    /* Tables */
    .table-responsive {
        overflow-x: auto;
        border-radius: 8px;
        border: 1px solid #dee2e6;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    
    th, td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }
    
    th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        position: sticky;
        top: 0;
    }
    
    tr:hover {
        background: #f8f9fa;
    }
    
    /* Status badges */
    .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .badge.success { background: #d4edda; color: #155724; }
    .badge.danger { background: #f8d7da; color: #721c24; }
    .badge.warning { background: #fff3cd; color: #856404; }
    .badge.info { background: #d1ecf1; color: #0c5460; }
    
    /* Charts */
    .chart-container {
        position: relative;
        height: 400px;
        margin: 20px 0;
    }
    
    .chart-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin: 30px 0;
    }
    
    @media (max-width: 768px) {
        .chart-grid {
            grid-template-columns: 1fr;
        }
    }
    
    /* Timeline */
    .timeline {
        position: relative;
        margin: 30px 0;
    }
    
    .timeline::before {
        content: '';
        position: absolute;
        left: 30px;
        top: 0;
        height: 100%;
        width: 2px;
        background: #dee2e6;
    }
    
    .timeline-item {
        position: relative;
        margin-bottom: 30px;
        padding-left: 70px;
    }
    
    .timeline-marker {
        position: absolute;
        left: 20px;
        top: 10px;
        width: 20px;
        height: 20px;
        background: #667eea;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .timeline-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    /* Screenshot gallery */
    .screenshot-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .screenshot-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }
    
    .screenshot-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .screenshot-thumbnail {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-bottom: 2px solid #e9ecef;
    }
    
    .screenshot-caption {
        padding: 10px;
        background: white;
        font-size: 0.85rem;
        color: #6c757d;
    }
    
    /* Error details */
    .error-details {
        background: #f8f9fa;
        border-left: 4px solid #dc3545;
        padding: 20px;
        margin: 15px 0;
        border-radius: 0 8px 8px 0;
    }
    
    .error-title {
        font-weight: 600;
        color: #dc3545;
        margin-bottom: 10px;
    }
    
    .stack-trace {
        background: #212529;
        color: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.85rem;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
    }
    
    /* Log viewer */
    .log-viewer {
        background: #212529;
        color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.85rem;
        max-height: 400px;
        overflow-y: auto;
        margin: 20px 0;
    }
    
    .log-line {
        margin-bottom: 2px;
        padding: 2px 0;
    }
    
    .log-line.error { color: #ff6b6b; }
    .log-line.warning { color: #feca57; }
    .log-line.info { color: #48dbfb; }
    .log-line.success { color: #1dd1a1; }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .container {
            padding: 10px;
        }
        
        .header h1 {
            font-size: 2rem;
        }
        
        .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .metric-value {
            font-size: 2rem;
        }
        
        .card {
            padding: 20px;
        }
        
        th, td {
            padding: 10px;
        }
    }
    
    /* Print styles */
    @media print {
        .header {
            background: #667eea !important;
            -webkit-print-color-adjust: exact;
        }
        
        .card {
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #dee2e6;
        }
        
        .chart-container {
            page-break-inside: avoid;
        }
    }
</style>
EOF
}

# Generate JavaScript for charts
generate_charts_js() {
    local test_data="$1"
    
    cat <<EOF
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Parse test data
    const testData = $test_data;
    
    // Test Results Pie Chart
    if (document.getElementById('testResultsChart')) {
        const ctx1 = document.getElementById('testResultsChart').getContext('2d');
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [testData.passed, testData.failed, testData.skipped],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    // Test Types Bar Chart
    if (document.getElementById('testTypesChart')) {
        const ctx2 = document.getElementById('testTypesChart').getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: Object.keys(testData.byType || {}),
                datasets: [{
                    label: 'Passed',
                    data: Object.values(testData.byType || {}).map(t => t.passed),
                    backgroundColor: '#28a745'
                }, {
                    label: 'Failed',
                    data: Object.values(testData.byType || {}).map(t => t.failed),
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
    
    // Coverage Chart
    if (document.getElementById('coverageChart') && testData.coverage) {
        const ctx3 = document.getElementById('coverageChart').getContext('2d');
        new Chart(ctx3, {
            type: 'radar',
            data: {
                labels: ['Lines', 'Branches', 'Functions', 'Statements'],
                datasets: [{
                    label: 'Coverage %',
                    data: [
                        testData.coverage.lines,
                        testData.coverage.branches,
                        testData.coverage.functions,
                        testData.coverage.statements
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
});
</script>
EOF
}

# Generate screenshot gallery
generate_screenshot_gallery() {
    local screenshots_dir="$1"
    
    if [ ! -d "$screenshots_dir" ]; then
        echo "<p class='text-muted'>No screenshots available</p>"
        return
    fi
    
    echo "<div class='screenshot-gallery'>"
    
    local count=0
    for screenshot in "$screenshots_dir"/*.png "$screenshots_dir"/*.jpg; do
        if [ -f "$screenshot" ]; then
            local filename=$(basename "$screenshot")
            local relative_path="screenshots/$filename"
            
            cat <<EOF
<div class="screenshot-item">
    <a href="$relative_path" data-lightbox="screenshots" data-title="$filename">
        <img src="$relative_path" alt="$filename" class="screenshot-thumbnail">
        <div class="screenshot-caption">$filename</div>
    </a>
</div>
EOF
            ((count++))
        fi
    done
    
    echo "</div>"
    
    if [ $count -eq 0 ]; then
        echo "<p class='text-muted'>No screenshots captured</p>"
    else
        echo "<p class='text-muted'>$count screenshot(s) captured</p>"
    fi
}

# Generate test failure details
generate_failure_details() {
    local results_file="$1"
    
    if [ ! -f "$results_file" ]; then
        echo "<p class='text-muted'>No detailed results available</p>"
        return
    fi
    
    if command -v jq &> /dev/null; then
        # Extract failed tests with details
        jq -r '.testResults[]? | select(.numFailingTests > 0) | 
            .assertionResults[]? | select(.status == "failed") | 
            "<div class=\"error-details\">
                <div class=\"error-title\">\(.ancestorTitles | join(" › ")) › \(.title)</div>
                <div class=\"stack-trace\">\(.failureMessages[]? // "No error message available")</div>
            </div>"' "$results_file" 2>/dev/null || echo "<p class='text-muted'>Unable to parse failure details</p>"
    else
        echo "<p class='text-muted'>jq not available for detailed parsing</p>"
    fi
}

# Generate execution timeline
generate_timeline() {
    local results_dir="$1"
    
    cat <<EOF
<div class="timeline">
    <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <h5>Test Execution Started</h5>
            <p class="text-muted">$(date)</p>
        </div>
    </div>
EOF
    
    # Add timeline items for each test type
    for test_type in unit integration e2e; do
        if [ -f "$results_dir/$test_type/results.json" ]; then
            cat <<EOF
    <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <h5>${test_type^} Tests Completed</h5>
            <p class="text-muted">Results available in $test_type/results.json</p>
        </div>
    </div>
EOF
        fi
    done
    
    cat <<EOF
    <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <h5>Report Generated</h5>
            <p class="text-muted">$(date)</p>
        </div>
    </div>
</div>
EOF
}

# Main report generation function
generate_report() {
    local results_dir="$1"
    local output_file="$2"
    local test_data_json="${3:-$results_dir/aggregated-report.json}"
    
    log_info "Generating enhanced HTML report..."
    log_info "Results directory: $results_dir"
    log_info "Output file: $output_file"
    
    # Ensure output directory exists
    mkdir -p "$(dirname "$output_file")"
    
    # Load test data
    local test_data="{}"
    if [ -f "$test_data_json" ]; then
        test_data=$(cat "$test_data_json")
    fi
    
    # Start HTML document
    cat > "$output_file" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$REPORT_TITLE</title>
    <link rel="stylesheet" href="$LIGHTBOX_CSS">
    $(generate_css)
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>$REPORT_TITLE</h1>
            <p class="subtitle">Comprehensive Test Results and Analysis</p>
            <p class="subtitle">Generated on $(date) • Version $REPORT_VERSION</p>
        </div>
    </div>
    
    <div class="container">
EOF
    
    # Add summary metrics
    if command -v jq &> /dev/null && [ -f "$test_data_json" ]; then
        local total_tests=$(jq -r '.summary.total_tests // 0' "$test_data_json")
        local passed_tests=$(jq -r '.summary.passed // 0' "$test_data_json")
        local failed_tests=$(jq -r '.summary.failed // 0' "$test_data_json")
        local skipped_tests=$(jq -r '.summary.skipped // 0' "$test_data_json")
        local pass_rate=$(jq -r '.summary.pass_rate // 0' "$test_data_json")
        
        cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Test Summary</h2>
            <div class="metrics-grid">
                <div class="metric info">
                    <div class="metric-value">$total_tests</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric success">
                    <div class="metric-value">$passed_tests</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric danger">
                    <div class="metric-value">$failed_tests</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric warning">
                    <div class="metric-value">$skipped_tests</div>
                    <div class="metric-label">Skipped</div>
                </div>
                <div class="metric info">
                    <div class="metric-value">$pass_rate%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
            </div>
        </div>
EOF
    fi
    
    # Add charts
    cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Visual Analysis</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    <canvas id="testResultsChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="testTypesChart"></canvas>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="coverageChart"></canvas>
            </div>
        </div>
EOF
    
    # Add test results table
    cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Detailed Results by Test Type</h2>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Test Type</th>
                            <th>Total</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Skipped</th>
                            <th>Pass Rate</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
EOF
    
    # Add test type rows if data is available
    if command -v jq &> /dev/null && [ -f "$test_data_json" ]; then
        for test_type in unit integration e2e; do
            if jq -e ".by_type.$test_type" "$test_data_json" &> /dev/null; then
                local total=$(jq -r ".by_type.$test_type.total // 0" "$test_data_json")
                local passed=$(jq -r ".by_type.$test_type.passed // 0" "$test_data_json")
                local failed=$(jq -r ".by_type.$test_type.failed // 0" "$test_data_json")
                local skipped=$(jq -r ".by_type.$test_type.skipped // 0" "$test_data_json")
                
                if [ "$total" -gt 0 ]; then
                    local rate=$(awk "BEGIN {printf \"%.1f\", $passed / $total * 100}")
                    local badge_class="success"
                    if [ "$failed" -gt 0 ]; then
                        badge_class="danger"
                    fi
                    
                    cat >> "$output_file" <<EOF
                        <tr>
                            <td>${test_type^}</td>
                            <td>$total</td>
                            <td>$passed</td>
                            <td>$failed</td>
                            <td>$skipped</td>
                            <td>$rate%</td>
                            <td><span class="badge $badge_class">$([ "$failed" -eq 0 ] && echo "PASS" || echo "FAIL")</span></td>
                        </tr>
EOF
                fi
            fi
        done
    fi
    
    cat >> "$output_file" <<EOF
                    </tbody>
                </table>
            </div>
        </div>
EOF
    
    # Add failure details if there are failures
    if command -v jq &> /dev/null && [ -f "$test_data_json" ]; then
        local total_failed=$(jq -r '.summary.failed // 0' "$test_data_json")
        if [ "$total_failed" -gt 0 ]; then
            cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Failure Details</h2>
            $(generate_failure_details "$results_dir/unit/results.json")
            $(generate_failure_details "$results_dir/integration/results.json")
            $(generate_failure_details "$results_dir/e2e/results.json")
        </div>
EOF
        fi
    fi
    
    # Add screenshot gallery
    cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Screenshots</h2>
            $(generate_screenshot_gallery "$results_dir/screenshots")
        </div>
EOF
    
    # Add execution timeline
    cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Execution Timeline</h2>
            $(generate_timeline "$results_dir")
        </div>
EOF
    
    # Add artifacts section
    cat >> "$output_file" <<EOF
        <div class="card">
            <h2>Artifacts & Downloads</h2>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Artifact</th>
                            <th>Description</th>
                            <th>Size</th>
                            <th>Download</th>
                        </tr>
                    </thead>
                    <tbody>
EOF
    
    # List available artifacts
    for artifact in "$results_dir"/*.json "$results_dir"/*.txt "$results_dir"/*.zip "$results_dir"/*.tar.gz; do
        if [ -f "$artifact" ]; then
            local filename=$(basename "$artifact")
            local filesize=$(ls -lh "$artifact" | awk '{print $5}')
            local description="Test artifact"
            
            case "$filename" in
                *report*) description="Test report" ;;
                *summary*) description="Test summary" ;;
                *coverage*) description="Coverage report" ;;
                *logs*) description="Log archive" ;;
                *artifacts*) description="Complete artifact package" ;;
            esac
            
            cat >> "$output_file" <<EOF
                        <tr>
                            <td>$filename</td>
                            <td>$description</td>
                            <td>$filesize</td>
                            <td><a href="$filename" download class="badge info">Download</a></td>
                        </tr>
EOF
        fi
    done
    
    # Close HTML document
    cat >> "$output_file" <<EOF
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="$LIGHTBOX_JS"></script>
    <script src="$CHART_JS_CDN"></script>
    $(generate_charts_js "$test_data")
</body>
</html>
EOF
    
    log_success "Enhanced HTML report generated: $output_file"
}

# Main function
main() {
    local results_dir="${1:-/app/test-results}"
    local output_file="${2:-$results_dir/enhanced-report.html}"
    local test_data_json="${3:-$results_dir/aggregated-report.json}"
    
    if [ "$1" = "--help" ]; then
        echo "Usage: $0 [results_dir] [output_file] [test_data_json]"
        echo "  results_dir   : Directory containing test results (default: /app/test-results)"
        echo "  output_file   : Output HTML file path (default: results_dir/enhanced-report.html)"
        echo "  test_data_json: JSON file with test data (default: results_dir/aggregated-report.json)"
        exit 0
    fi
    
    generate_report "$results_dir" "$output_file" "$test_data_json"
}

# Run main function
main "$@"