#!/bin/bash

# Test Results Aggregator for Crowbar Mobile
# Aggregates results from multiple test types and parallel executions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[AGGREGATE]${NC} $1"
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

# Global totals
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
TOTAL_DURATION=0
TOTAL_SUITES=0

# Test type results
declare -A test_results

# Parse JSON results file
parse_json_results() {
    local json_file="$1"
    local test_type="$2"
    
    if [ ! -f "$json_file" ]; then
        log_warning "Results file not found: $json_file"
        return 1
    fi
    
    log_info "Parsing $test_type results from $json_file"
    
    if command -v jq &> /dev/null; then
        # Extract statistics using jq
        local tests=$(jq -r '.numTotalTests // 0' "$json_file" 2>/dev/null || echo "0")
        local passed=$(jq -r '.numPassedTests // 0' "$json_file" 2>/dev/null || echo "0")
        local failed=$(jq -r '.numFailedTests // 0' "$json_file" 2>/dev/null || echo "0")
        local skipped=$(jq -r '.numPendingTests // 0' "$json_file" 2>/dev/null || echo "0")
        local suites=$(jq -r '.numTotalTestSuites // 0' "$json_file" 2>/dev/null || echo "0")
        
        # Update totals
        TOTAL_TESTS=$((TOTAL_TESTS + tests))
        TOTAL_PASSED=$((TOTAL_PASSED + passed))
        TOTAL_FAILED=$((TOTAL_FAILED + failed))
        TOTAL_SKIPPED=$((TOTAL_SKIPPED + skipped))
        TOTAL_SUITES=$((TOTAL_SUITES + suites))
        
        # Store per-type results
        test_results["${test_type}_total"]=$tests
        test_results["${test_type}_passed"]=$passed
        test_results["${test_type}_failed"]=$failed
        test_results["${test_type}_skipped"]=$skipped
        
        log_info "$test_type: $passed/$tests passed"
    else
        log_error "jq not available for JSON parsing"
        return 1
    fi
}

# Parse text summary files
parse_text_summary() {
    local summary_file="$1"
    local test_type="$2"
    
    if [ ! -f "$summary_file" ]; then
        return 1
    fi
    
    log_info "Parsing text summary for $test_type"
    
    # Extract numbers using grep and sed
    local total=$(grep -E "Total Tests?:" "$summary_file" | sed 's/[^0-9]*//g' | head -1)
    local passed=$(grep -E "Passed:" "$summary_file" | sed 's/[^0-9]*//g' | head -1)
    local failed=$(grep -E "Failed:" "$summary_file" | sed 's/[^0-9]*//g' | head -1)
    
    if [ -n "$total" ]; then
        test_results["${test_type}_total"]=$total
        TOTAL_TESTS=$((TOTAL_TESTS + total))
    fi
    
    if [ -n "$passed" ]; then
        test_results["${test_type}_passed"]=$passed
        TOTAL_PASSED=$((TOTAL_PASSED + passed))
    fi
    
    if [ -n "$failed" ]; then
        test_results["${test_type}_failed"]=$failed
        TOTAL_FAILED=$((TOTAL_FAILED + failed))
    fi
}

# Collect coverage data
collect_coverage() {
    local output_dir="$1"
    local coverage_file="$output_dir/coverage-summary.json"
    
    log_info "Collecting coverage data..."
    
    # Merge coverage from different test types
    local unit_coverage="$output_dir/unit/coverage/coverage-summary.json"
    local integration_coverage="$output_dir/integration/coverage/coverage-summary.json"
    
    if [ -f "$unit_coverage" ] && command -v jq &> /dev/null; then
        local lines_pct=$(jq -r '.total.lines.pct' "$unit_coverage" 2>/dev/null || echo "0")
        local branches_pct=$(jq -r '.total.branches.pct' "$unit_coverage" 2>/dev/null || echo "0")
        local functions_pct=$(jq -r '.total.functions.pct' "$unit_coverage" 2>/dev/null || echo "0")
        local statements_pct=$(jq -r '.total.statements.pct' "$unit_coverage" 2>/dev/null || echo "0")
        
        test_results["coverage_lines"]=$lines_pct
        test_results["coverage_branches"]=$branches_pct
        test_results["coverage_functions"]=$functions_pct
        test_results["coverage_statements"]=$statements_pct
        
        log_info "Coverage: ${lines_pct}% lines, ${branches_pct}% branches"
    fi
}

# Generate aggregated report
generate_report() {
    local output_dir="$1"
    local report_file="$output_dir/aggregated-report.json"
    local summary_file="$output_dir/test-summary.txt"
    
    log_info "Generating aggregated report..."
    
    # Calculate percentages
    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$(awk "BEGIN {printf \"%.2f\", $TOTAL_PASSED / $TOTAL_TESTS * 100}")
    fi
    
    # Generate JSON report
    cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_tests": $TOTAL_TESTS,
    "passed": $TOTAL_PASSED,
    "failed": $TOTAL_FAILED,
    "skipped": $TOTAL_SKIPPED,
    "pass_rate": $pass_rate,
    "total_suites": $TOTAL_SUITES
  },
  "by_type": {
EOF
    
    # Add per-type results
    local first=true
    for test_type in unit integration e2e; do
        if [ "${test_results[${test_type}_total]:-0}" -gt 0 ]; then
            if [ "$first" = false ]; then
                echo "," >> "$report_file"
            fi
            first=false
            
            cat >> "$report_file" <<EOF
    "$test_type": {
      "total": ${test_results[${test_type}_total]:-0},
      "passed": ${test_results[${test_type}_passed]:-0},
      "failed": ${test_results[${test_type}_failed]:-0},
      "skipped": ${test_results[${test_type}_skipped]:-0}
    }
EOF
        fi
    done
    
    # Add coverage if available
    if [ -n "${test_results[coverage_lines]}" ]; then
        cat >> "$report_file" <<EOF
  },
  "coverage": {
    "lines": ${test_results[coverage_lines]},
    "branches": ${test_results[coverage_branches]},
    "functions": ${test_results[coverage_functions]},
    "statements": ${test_results[coverage_statements]}
EOF
    fi
    
    echo "  }" >> "$report_file"
    echo "}" >> "$report_file"
    
    # Generate text summary
    cat > "$summary_file" <<EOF
=====================================
TEST EXECUTION SUMMARY
=====================================
Generated: $(date)

Overall Results:
  Total Tests:  $TOTAL_TESTS
  Passed:       $TOTAL_PASSED
  Failed:       $TOTAL_FAILED
  Skipped:      $TOTAL_SKIPPED
  Pass Rate:    ${pass_rate}%
  Test Suites:  $TOTAL_SUITES

Results by Type:
EOF
    
    for test_type in unit integration e2e; do
        if [ "${test_results[${test_type}_total]:-0}" -gt 0 ]; then
            cat >> "$summary_file" <<EOF

  ${test_type^^} Tests:
    Total:   ${test_results[${test_type}_total]:-0}
    Passed:  ${test_results[${test_type}_passed]:-0}
    Failed:  ${test_results[${test_type}_failed]:-0}
    Skipped: ${test_results[${test_type}_skipped]:-0}
EOF
        fi
    done
    
    # Add coverage summary if available
    if [ -n "${test_results[coverage_lines]}" ]; then
        cat >> "$summary_file" <<EOF

Code Coverage:
  Lines:      ${test_results[coverage_lines]}%
  Branches:   ${test_results[coverage_branches]}%
  Functions:  ${test_results[coverage_functions]}%
  Statements: ${test_results[coverage_statements]}%
EOF
    fi
    
    echo "=====================================" >> "$summary_file"
    
    log_success "Reports generated:"
    log_info "  JSON: $report_file"
    log_info "  Text: $summary_file"
}

# Generate HTML dashboard
generate_html_dashboard() {
    local output_dir="$1"
    local dashboard_file="$output_dir/dashboard.html"
    
    log_info "Generating HTML dashboard..."
    
    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$(awk "BEGIN {printf \"%.1f\", $TOTAL_PASSED / $TOTAL_TESTS * 100}")
    fi
    
    cat > "$dashboard_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Crowbar Mobile Test Results Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 0 20px; text-align: center; }
        .metric-value { font-size: 48px; font-weight: bold; }
        .metric-label { color: #666; margin-top: 5px; }
        .pass { color: #4CAF50; }
        .fail { color: #F44336; }
        .skip { color: #FF9800; }
        .chart { width: 100%; height: 300px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        .status-pass { color: #4CAF50; font-weight: bold; }
        .status-fail { color: #F44336; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Results Dashboard</h1>
        <p>Crowbar Mobile - $(date)</p>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>Overall Summary</h2>
            <div style="text-align: center;">
                <div class="metric">
                    <div class="metric-value">$TOTAL_TESTS</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric">
                    <div class="metric-value pass">$TOTAL_PASSED</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric">
                    <div class="metric-value fail">$TOTAL_FAILED</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                    <div class="metric-value skip">$TOTAL_SKIPPED</div>
                    <div class="metric-label">Skipped</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${pass_rate}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Results by Test Type</h2>
            <table>
                <tr>
                    <th>Test Type</th>
                    <th>Total</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Skipped</th>
                    <th>Pass Rate</th>
                </tr>
EOF
    
    # Add rows for each test type
    for test_type in unit integration e2e; do
        local total=${test_results[${test_type}_total]:-0}
        local passed=${test_results[${test_type}_passed]:-0}
        local failed=${test_results[${test_type}_failed]:-0}
        local skipped=${test_results[${test_type}_skipped]:-0}
        
        if [ $total -gt 0 ]; then
            local type_pass_rate=$(awk "BEGIN {printf \"%.1f\", $passed / $total * 100}")
            local status_class="status-pass"
            if [ $failed -gt 0 ]; then
                status_class="status-fail"
            fi
            
            cat >> "$dashboard_file" <<EOF
                <tr>
                    <td>${test_type^^}</td>
                    <td>$total</td>
                    <td class="status-pass">$passed</td>
                    <td class="status-fail">$failed</td>
                    <td>$skipped</td>
                    <td class="$status_class">${type_pass_rate}%</td>
                </tr>
EOF
        fi
    done
    
    cat >> "$dashboard_file" <<EOF
            </table>
        </div>
EOF
    
    # Add coverage section if available
    if [ -n "${test_results[coverage_lines]}" ]; then
        cat >> "$dashboard_file" <<EOF
        <div class="card">
            <h2>Code Coverage</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Coverage %</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Lines</td>
                    <td>${test_results[coverage_lines]}%</td>
                    <td class="$([ ${test_results[coverage_lines]%.*} -ge 80 ] && echo "status-pass" || echo "status-fail")">
                        $([ ${test_results[coverage_lines]%.*} -ge 80 ] && echo "✓ Good" || echo "✗ Low")
                    </td>
                </tr>
                <tr>
                    <td>Branches</td>
                    <td>${test_results[coverage_branches]}%</td>
                    <td class="$([ ${test_results[coverage_branches]%.*} -ge 80 ] && echo "status-pass" || echo "status-fail")">
                        $([ ${test_results[coverage_branches]%.*} -ge 80 ] && echo "✓ Good" || echo "✗ Low")
                    </td>
                </tr>
                <tr>
                    <td>Functions</td>
                    <td>${test_results[coverage_functions]}%</td>
                    <td class="$([ ${test_results[coverage_functions]%.*} -ge 80 ] && echo "status-pass" || echo "status-fail")">
                        $([ ${test_results[coverage_functions]%.*} -ge 80 ] && echo "✓ Good" || echo "✗ Low")
                    </td>
                </tr>
                <tr>
                    <td>Statements</td>
                    <td>${test_results[coverage_statements]}%</td>
                    <td class="$([ ${test_results[coverage_statements]%.*} -ge 80 ] && echo "status-pass" || echo "status-fail")">
                        $([ ${test_results[coverage_statements]%.*} -ge 80 ] && echo "✓ Good" || echo "✗ Low")
                    </td>
                </tr>
            </table>
        </div>
EOF
    fi
    
    cat >> "$dashboard_file" <<EOF
        <div class="card">
            <h2>Test Artifacts</h2>
            <ul>
                <li><a href="aggregated-report.json">JSON Report</a></li>
                <li><a href="test-summary.txt">Text Summary</a></li>
                <li><a href="unit/results.json">Unit Test Results</a></li>
                <li><a href="integration/results.json">Integration Test Results</a></li>
                <li><a href="e2e/index.html">E2E Test Report</a></li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "HTML dashboard generated: $dashboard_file"
}

# Main aggregation function
main() {
    local output_dir="${1:-/app/test-results}"
    
    log_info "Starting results aggregation..."
    log_info "Output directory: $output_dir"
    
    # Process unit test results
    if [ -f "$output_dir/unit/results.json" ]; then
        parse_json_results "$output_dir/unit/results.json" "unit"
    elif [ -f "$output_dir/unit/summary.txt" ]; then
        parse_text_summary "$output_dir/unit/summary.txt" "unit"
    fi
    
    # Process integration test results
    if [ -f "$output_dir/integration/results.json" ]; then
        parse_json_results "$output_dir/integration/results.json" "integration"
    elif [ -f "$output_dir/integration/summary.txt" ]; then
        parse_text_summary "$output_dir/integration/summary.txt" "integration"
    fi
    
    # Process E2E test results
    if [ -f "$output_dir/e2e/detox-results.json" ]; then
        parse_json_results "$output_dir/e2e/detox-results.json" "e2e"
    elif [ -f "$output_dir/e2e/summary.txt" ]; then
        parse_text_summary "$output_dir/e2e/summary.txt" "e2e"
    fi
    
    # Collect coverage data
    collect_coverage "$output_dir"
    
    # Generate reports
    generate_report "$output_dir"
    generate_html_dashboard "$output_dir"
    
    # Display summary
    echo
    cat "$output_dir/test-summary.txt"
    echo
    
    # Exit with appropriate code
    if [ $TOTAL_FAILED -gt 0 ]; then
        log_error "Tests failed: $TOTAL_FAILED"
        exit 1
    else
        log_success "All tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"