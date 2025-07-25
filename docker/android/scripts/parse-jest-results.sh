#!/bin/bash

# Jest Test Result Parser for Crowbar Mobile
# Parses Jest JSON output and extracts meaningful statistics

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Function to parse Jest JSON results
parse_jest_json() {
    local json_file="$1"
    local test_type="${2:-test}"
    
    if [ ! -f "$json_file" ]; then
        log_error "JSON file not found: $json_file"
        return 1
    fi
    
    log_info "Parsing Jest results for $test_type tests..."
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found, using basic parsing"
        parse_jest_basic "$json_file" "$test_type"
        return
    fi
    
    # Extract test statistics using jq
    local success=$(jq -r '.success' "$json_file" 2>/dev/null || echo "false")
    local num_failed_tests=$(jq -r '.numFailedTests' "$json_file" 2>/dev/null || echo "0")
    local num_passed_tests=$(jq -r '.numPassedTests' "$json_file" 2>/dev/null || echo "0")
    local num_pending_tests=$(jq -r '.numPendingTests' "$json_file" 2>/dev/null || echo "0")
    local num_total_tests=$(jq -r '.numTotalTests' "$json_file" 2>/dev/null || echo "0")
    local num_test_suites=$(jq -r '.numTotalTestSuites' "$json_file" 2>/dev/null || echo "0")
    local num_failed_suites=$(jq -r '.numFailedTestSuites' "$json_file" 2>/dev/null || echo "0")
    local start_time=$(jq -r '.startTime' "$json_file" 2>/dev/null || echo "0")
    
    # Calculate duration if available
    local duration=0
    if [ -n "$start_time" ] && [ "$start_time" != "null" ]; then
        local end_time=$(date +%s%3N)
        duration=$((end_time - start_time))
    fi
    
    # Display summary
    echo
    echo "=== $test_type Test Results ==="
    echo "Total Test Suites: $num_test_suites"
    echo "Failed Suites: $num_failed_suites"
    echo "Total Tests: $num_total_tests"
    echo "Passed: $num_passed_tests"
    echo "Failed: $num_failed_tests"
    echo "Pending: $num_pending_tests"
    echo "Success: $success"
    echo "Duration: ${duration}ms"
    echo
    
    # Export results for aggregation
    export JEST_${test_type^^}_TOTAL=$num_total_tests
    export JEST_${test_type^^}_PASSED=$num_passed_tests
    export JEST_${test_type^^}_FAILED=$num_failed_tests
    export JEST_${test_type^^}_PENDING=$num_pending_tests
    
    # Process failed tests
    if [ "$num_failed_tests" -gt 0 ]; then
        log_error "Failed tests detected:"
        echo
        
        # Extract failed test details
        jq -r '.testResults[] | select(.numFailingTests > 0) | 
            "File: \(.name)\n" + 
            (.assertionResults[] | select(.status == "failed") | 
            "  Test: \(.title)\n  Error: \(.failureMessages[0] // "Unknown error")\n")' \
            "$json_file" 2>/dev/null || true
    fi
    
    # Process coverage if available
    local coverage_file=$(dirname "$json_file")/coverage/coverage-summary.json
    if [ -f "$coverage_file" ]; then
        parse_coverage "$coverage_file"
    fi
    
    # Create simplified summary
    create_summary "$json_file" "$test_type"
    
    # Return appropriate exit code
    if [ "$success" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Basic parsing without jq
parse_jest_basic() {
    local json_file="$1"
    local test_type="$2"
    
    log_info "Using basic JSON parsing..."
    
    # Extract basic stats using grep and sed
    local num_total=$(grep -o '"numTotalTests":[0-9]*' "$json_file" | sed 's/.*://')
    local num_passed=$(grep -o '"numPassedTests":[0-9]*' "$json_file" | sed 's/.*://')
    local num_failed=$(grep -o '"numFailedTests":[0-9]*' "$json_file" | sed 's/.*://')
    local success=$(grep -o '"success":[a-z]*' "$json_file" | sed 's/.*://')
    
    echo
    echo "=== $test_type Test Results (Basic) ==="
    echo "Total Tests: ${num_total:-0}"
    echo "Passed: ${num_passed:-0}"
    echo "Failed: ${num_failed:-0}"
    echo "Success: ${success:-false}"
    echo
}

# Parse coverage data
parse_coverage() {
    local coverage_file="$1"
    
    if [ ! -f "$coverage_file" ]; then
        return
    fi
    
    log_info "Parsing coverage data..."
    
    if command -v jq &> /dev/null; then
        local lines_pct=$(jq -r '.total.lines.pct' "$coverage_file" 2>/dev/null || echo "0")
        local branches_pct=$(jq -r '.total.branches.pct' "$coverage_file" 2>/dev/null || echo "0")
        local functions_pct=$(jq -r '.total.functions.pct' "$coverage_file" 2>/dev/null || echo "0")
        local statements_pct=$(jq -r '.total.statements.pct' "$coverage_file" 2>/dev/null || echo "0")
        
        echo "=== Coverage Report ==="
        echo "Lines: ${lines_pct}%"
        echo "Branches: ${branches_pct}%"
        echo "Functions: ${functions_pct}%"
        echo "Statements: ${statements_pct}%"
        echo
        
        # Warn if coverage is low
        if (( $(echo "$lines_pct < 80" | bc -l) )); then
            log_warning "Line coverage is below 80%"
        fi
    fi
}

# Create simplified summary file
create_summary() {
    local json_file="$1"
    local test_type="$2"
    local summary_file="$(dirname "$json_file")/summary.txt"
    
    {
        echo "Test Type: $test_type"
        echo "Timestamp: $(date)"
        echo "Source: $json_file"
        echo "---"
        
        if command -v jq &> /dev/null; then
            jq -r '
                "Total Tests: \(.numTotalTests)\n" +
                "Passed: \(.numPassedTests)\n" +
                "Failed: \(.numFailedTests)\n" +
                "Pending: \(.numPendingTests)\n" +
                "Success: \(.success)\n" +
                "Test Suites: \(.numTotalTestSuites)\n" +
                "Failed Suites: \(.numFailedTestSuites)"
            ' "$json_file" 2>/dev/null || echo "Failed to parse JSON"
        else
            echo "Basic parsing mode - install jq for detailed results"
        fi
    } > "$summary_file"
    
    log_info "Summary saved to: $summary_file"
}

# Extract error details for failed tests
extract_errors() {
    local json_file="$1"
    local error_file="$(dirname "$json_file")/errors.txt"
    
    if command -v jq &> /dev/null; then
        jq -r '.testResults[] | 
            select(.numFailingTests > 0) | 
            .assertionResults[] | 
            select(.status == "failed") | 
            "File: \(.ancestorTitles | join(" > "))\nTest: \(.title)\nError:\n\(.failureMessages | join("\n"))\n---\n"' \
            "$json_file" > "$error_file" 2>/dev/null
        
        if [ -s "$error_file" ]; then
            log_info "Error details saved to: $error_file"
        else
            rm -f "$error_file"
        fi
    fi
}

# Main function
main() {
    local json_file="${1:-}"
    local test_type="${2:-test}"
    
    if [ -z "$json_file" ]; then
        log_error "Usage: $0 <json_file> [test_type]"
        exit 1
    fi
    
    # Parse results
    if parse_jest_json "$json_file" "$test_type"; then
        log_success "Jest results parsed successfully"
        exit 0
    else
        log_error "Jest tests failed"
        
        # Extract error details
        extract_errors "$json_file"
        
        exit 1
    fi
}

# Run main function
main "$@"