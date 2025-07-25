#!/bin/bash

# Test Retry Handler for Crowbar Mobile
# Implements smart retry logic for flaky tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"
EXPONENTIAL_BACKOFF="${EXPONENTIAL_BACKOFF:-true}"
FLAKY_TEST_THRESHOLD="${FLAKY_TEST_THRESHOLD:-2}"
RETRY_LOG="${RETRY_LOG:-/app/test-results/retry.log}"

# Retry statistics
declare -A retry_stats
declare -A flaky_tests

# Function to print colored output
log_info() {
    echo -e "${BLUE}[RETRY]${NC} $1"
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

log_retry() {
    echo -e "${MAGENTA}[RETRY]${NC} $1"
}

# Initialize retry tracking
init_retry_tracking() {
    log_info "Initializing retry tracking..."
    
    # Create retry log directory
    mkdir -p "$(dirname "$RETRY_LOG")"
    
    # Initialize log file
    {
        echo "=== Retry Handler Log ==="
        echo "Started: $(date)"
        echo "Max Retries: $MAX_RETRIES"
        echo "Retry Delay: $RETRY_DELAY"
        echo "Exponential Backoff: $EXPONENTIAL_BACKOFF"
        echo "========================="
        echo
    } > "$RETRY_LOG"
}

# Execute command with retry logic
retry_command() {
    local command="$1"
    local test_name="${2:-command}"
    local max_attempts="${3:-$MAX_RETRIES}"
    local attempt=1
    local exit_code=0
    local delay=$RETRY_DELAY
    
    log_info "Executing: $test_name"
    log_info "Command: $command"
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt/$max_attempts for $test_name"
        
        # Record attempt
        echo "[$(date)] Attempt $attempt for $test_name" >> "$RETRY_LOG"
        
        # Execute command
        if eval "$command"; then
            log_success "$test_name succeeded on attempt $attempt"
            
            # Update statistics
            retry_stats["$test_name"]=$attempt
            
            # Mark as flaky if needed more than one attempt
            if [ $attempt -gt 1 ]; then
                ((flaky_tests["$test_name"]++))
                log_warning "$test_name is potentially flaky (succeeded after $attempt attempts)"
            fi
            
            return 0
        else
            exit_code=$?
            log_error "$test_name failed on attempt $attempt (exit code: $exit_code)"
            
            # Record failure
            echo "[$(date)] Failed: $test_name (exit: $exit_code)" >> "$RETRY_LOG"
            
            if [ $attempt -lt $max_attempts ]; then
                log_retry "Retrying $test_name in ${delay}s..."
                sleep $delay
                
                # Apply exponential backoff if enabled
                if [ "$EXPONENTIAL_BACKOFF" = "true" ]; then
                    delay=$((delay * 2))
                fi
            fi
        fi
        
        ((attempt++))
    done
    
    # Final failure
    log_error "$test_name failed after $max_attempts attempts"
    retry_stats["$test_name"]=-1
    
    return $exit_code
}

# Retry specific test file
retry_test_file() {
    local test_file="$1"
    local test_type="${2:-unit}"
    
    if [ ! -f "$test_file" ]; then
        log_error "Test file not found: $test_file"
        return 1
    fi
    
    log_info "Retrying test file: $test_file"
    
    local command="npm test -- $test_file --json --outputFile=/tmp/retry-result.json"
    
    if retry_command "$command" "$(basename "$test_file")" "$MAX_RETRIES"; then
        return 0
    else
        return 1
    fi
}

# Analyze failed tests and determine retry strategy
analyze_failures() {
    local results_file="$1"
    local retry_list="/tmp/retry-list.txt"
    
    log_info "Analyzing test failures..."
    
    # Clear retry list
    > "$retry_list"
    
    # Extract failed test files
    if command -v jq &> /dev/null && [ -f "$results_file" ]; then
        jq -r '.testResults[] | select(.numFailingTests > 0) | .name' "$results_file" > "$retry_list"
        
        local failed_count=$(wc -l < "$retry_list")
        log_info "Found $failed_count failed test files"
        
        # Check if failures might be environment-related
        if [ "$failed_count" -gt 10 ]; then
            log_warning "Large number of failures detected - possible environment issue"
            return 1
        fi
    else
        log_warning "Cannot analyze failures - jq not available or results file missing"
        return 1
    fi
    
    return 0
}

# Retry failed tests individually
retry_failed_tests() {
    local results_file="$1"
    local test_type="${2:-test}"
    local retry_list="/tmp/retry-list.txt"
    
    if ! analyze_failures "$results_file"; then
        log_error "Failure analysis suggests systemic issue - skipping individual retries"
        return 1
    fi
    
    if [ ! -s "$retry_list" ]; then
        log_info "No failed tests to retry"
        return 0
    fi
    
    log_info "Retrying failed tests individually..."
    
    local total_failed=0
    local total_recovered=0
    
    while IFS= read -r test_file; do
        if retry_test_file "$test_file" "$test_type"; then
            ((total_recovered++))
            log_success "Recovered: $test_file"
        else
            ((total_failed++))
            log_error "Still failing: $test_file"
        fi
    done < "$retry_list"
    
    # Summary
    log_info "Retry Summary:"
    log_info "  Total retried: $((total_failed + total_recovered))"
    log_info "  Recovered: $total_recovered"
    log_info "  Still failing: $total_failed"
    
    # Update retry log
    {
        echo
        echo "=== Retry Summary ==="
        echo "Timestamp: $(date)"
        echo "Test Type: $test_type"
        echo "Total Retried: $((total_failed + total_recovered))"
        echo "Recovered: $total_recovered"
        echo "Still Failing: $total_failed"
        echo "===================="
    } >> "$RETRY_LOG"
    
    return $total_failed
}

# Generate flaky test report
generate_flaky_report() {
    local report_file="${1:-/app/test-results/flaky-tests.txt}"
    
    log_info "Generating flaky test report..."
    
    {
        echo "=== Flaky Test Report ==="
        echo "Generated: $(date)"
        echo "Threshold: $FLAKY_TEST_THRESHOLD attempts"
        echo "========================="
        echo
        
        local has_flaky=false
        
        for test in "${!flaky_tests[@]}"; do
            if [ "${flaky_tests[$test]}" -ge "$FLAKY_TEST_THRESHOLD" ]; then
                echo "- $test (flaky ${flaky_tests[$test]} times)"
                has_flaky=true
            fi
        done
        
        if [ "$has_flaky" = false ]; then
            echo "No consistently flaky tests detected."
        fi
        
        echo
        echo "=== Retry Statistics ==="
        for test in "${!retry_stats[@]}"; do
            local attempts="${retry_stats[$test]}"
            if [ "$attempts" -eq -1 ]; then
                echo "- $test: FAILED all attempts"
            else
                echo "- $test: succeeded after $attempts attempt(s)"
            fi
        done
    } > "$report_file"
    
    log_info "Flaky test report saved to: $report_file"
}

# Smart retry based on test history
smart_retry() {
    local test_name="$1"
    local command="$2"
    local history_file="/app/test-results/test-history.json"
    
    # Check test history if available
    if [ -f "$history_file" ] && command -v jq &> /dev/null; then
        local failure_rate=$(jq -r ".\"$test_name\".failure_rate // 0" "$history_file" 2>/dev/null || echo "0")
        
        if (( $(echo "$failure_rate > 0.5" | bc -l) )); then
            log_warning "$test_name has high failure rate ($failure_rate), increasing retries"
            retry_command "$command" "$test_name" $((MAX_RETRIES + 2))
        else
            retry_command "$command" "$test_name" "$MAX_RETRIES"
        fi
    else
        retry_command "$command" "$test_name" "$MAX_RETRIES"
    fi
}

# Main retry orchestration
main() {
    local action="${1:-retry}"
    shift
    
    # Initialize tracking for all modes
    init_retry_tracking
    
    case "$action" in
        retry)
            # Retry a single command
            retry_command "$@"
            ;;
        analyze)
            # Analyze and retry failed tests
            local results_file="${1:-}"
            local test_type="${2:-test}"
            
            if [ -z "$results_file" ]; then
                log_error "Usage: $0 analyze <results_file> [test_type]"
                exit 1
            fi
            
            init_retry_tracking
            retry_failed_tests "$results_file" "$test_type"
            generate_flaky_report
            ;;
        smart)
            # Smart retry with history
            local test_name="${1:-}"
            local command="${2:-}"
            
            if [ -z "$test_name" ] || [ -z "$command" ]; then
                log_error "Usage: $0 smart <test_name> <command>"
                exit 1
            fi
            
            init_retry_tracking
            smart_retry "$test_name" "$command"
            ;;
        report)
            # Generate flaky test report
            generate_flaky_report "$1"
            ;;
        *)
            echo "Usage: $0 {retry|analyze|smart|report} [options]"
            echo
            echo "Actions:"
            echo "  retry <command> [name] [max_attempts]  - Retry a command"
            echo "  analyze <results_file> [test_type]     - Analyze and retry failed tests"
            echo "  smart <test_name> <command>            - Smart retry with history"
            echo "  report [output_file]                   - Generate flaky test report"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"