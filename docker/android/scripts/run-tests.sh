#!/bin/bash

# Test Orchestration Script for Crowbar Mobile
# Runs unit tests, integration tests, and E2E tests in Docker environment

set -e
trap 'handle_error $? $LINENO' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT="/app"
OUTPUT_DIR="${OUTPUT_DIR:-/app/test-results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_TYPES="${TEST_TYPES:-unit,integration,e2e}"
PARALLEL_EXECUTION="${PARALLEL:-false}"
MAX_PARALLEL_JOBS="${MAX_PARALLEL_JOBS:-2}"
RETRY_FAILED="${RETRY_FAILED:-true}"
MAX_RETRIES="${MAX_RETRIES:-2}"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

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

log_section() {
    echo -e "\n${CYAN}==== $1 ====${NC}\n"
}

# Error handler
handle_error() {
    local exit_code=$1
    local line_number=$2
    log_error "Command failed with exit code $exit_code at line $line_number"
    
    # Save error state
    echo "{\"error\": true, \"exit_code\": $exit_code, \"line\": $line_number}" > "$OUTPUT_DIR/error.json"
    
    # Cleanup before exit
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    
    # Kill any remaining test processes
    pkill -f "jest" || true
    pkill -f "detox" || true
    
    # Save final results
    save_summary
}

# Create output directories
setup_directories() {
    log_info "Setting up output directories..."
    
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/unit"
    mkdir -p "$OUTPUT_DIR/integration"
    mkdir -p "$OUTPUT_DIR/e2e"
    mkdir -p "$OUTPUT_DIR/screenshots"
    mkdir -p "$OUTPUT_DIR/logs"
    
    log_success "Output directories created"
}

# Check environment
check_environment() {
    log_section "Environment Check"
    
    # Check if in Docker
    if [ -f /.dockerenv ]; then
        log_info "Running inside Docker container"
    else
        log_warning "Not running in Docker container"
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_info "Node.js version: $node_version"
    else
        log_error "Node.js not found"
        return 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_info "npm version: $npm_version"
    else
        log_error "npm not found"
        return 1
    fi
    
    # Check if project exists
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "Project not found at $PROJECT_ROOT"
        return 1
    fi
    
    # Check Android emulator (if running E2E tests)
    if [[ "$TEST_TYPES" == *"e2e"* ]]; then
        if adb devices | grep -q "emulator"; then
            log_info "Android emulator is running"
        else
            log_warning "No Android emulator detected for E2E tests"
        fi
    fi
    
    log_success "Environment check completed"
}

# Install dependencies
install_dependencies() {
    log_section "Installing Dependencies"
    
    cd "$PROJECT_ROOT"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        npm ci --no-audit --prefer-offline || npm install
    else
        log_info "Dependencies already installed"
    fi
    
    log_success "Dependencies ready"
}

# Run unit tests
run_unit_tests() {
    log_section "Running Unit Tests"
    
    cd "$PROJECT_ROOT"
    
    local unit_output="$OUTPUT_DIR/unit/results.json"
    local unit_coverage="$OUTPUT_DIR/unit/coverage"
    
    log_info "Executing Jest unit tests..."
    
    # Run Jest with JSON reporter
    if npm test -- \
        --testPathPattern="(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$" \
        --testPathIgnorePatterns="e2e|integration" \
        --json \
        --outputFile="$unit_output" \
        --coverage \
        --coverageDirectory="$unit_coverage" \
        --maxWorkers=2 \
        --forceExit \
        2>&1 | tee "$OUTPUT_DIR/logs/unit.log"; then
        
        log_success "Unit tests completed"
        
        # Parse results
        if [ -f "$SCRIPT_DIR/parse-jest-results.sh" ]; then
            "$SCRIPT_DIR/parse-jest-results.sh" "$unit_output" "unit"
        fi
        
        return 0
    else
        log_error "Unit tests failed"
        
        # Still try to parse partial results
        if [ -f "$SCRIPT_DIR/parse-jest-results.sh" ] && [ -f "$unit_output" ]; then
            "$SCRIPT_DIR/parse-jest-results.sh" "$unit_output" "unit" || true
        fi
        
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    log_section "Running Integration Tests"
    
    cd "$PROJECT_ROOT"
    
    local integration_output="$OUTPUT_DIR/integration/results.json"
    
    log_info "Executing integration tests..."
    
    # Run integration tests
    if npm test -- \
        --testPathPattern="integration" \
        --json \
        --outputFile="$integration_output" \
        --maxWorkers=1 \
        --forceExit \
        2>&1 | tee "$OUTPUT_DIR/logs/integration.log"; then
        
        log_success "Integration tests completed"
        
        # Parse results
        if [ -f "$SCRIPT_DIR/parse-jest-results.sh" ]; then
            "$SCRIPT_DIR/parse-jest-results.sh" "$integration_output" "integration"
        fi
        
        return 0
    else
        log_error "Integration tests failed"
        
        # Parse partial results
        if [ -f "$SCRIPT_DIR/parse-jest-results.sh" ] && [ -f "$integration_output" ]; then
            "$SCRIPT_DIR/parse-jest-results.sh" "$integration_output" "integration" || true
        fi
        
        return 1
    fi
}

# Run E2E tests
run_e2e_tests() {
    log_section "Running E2E Tests"
    
    cd "$PROJECT_ROOT"
    
    # Check if Detox is configured
    if [ ! -f ".detoxrc.js" ] && [ ! -f ".detoxrc.json" ]; then
        log_warning "Detox configuration not found, skipping E2E tests"
        return 0
    fi
    
    # Run Detox tests
    if [ -f "$SCRIPT_DIR/run-detox-tests.sh" ]; then
        "$SCRIPT_DIR/run-detox-tests.sh" "$OUTPUT_DIR/e2e"
    else
        log_error "Detox test runner not found"
        return 1
    fi
}

# Run tests with retry logic
run_with_retry() {
    local test_function=$1
    local test_name=$2
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Running $test_name (attempt $attempt/$MAX_RETRIES)..."
        
        if $test_function; then
            log_success "$test_name passed"
            return 0
        else
            if [ $attempt -lt $MAX_RETRIES ]; then
                log_warning "$test_name failed, retrying..."
                sleep 2
            else
                log_error "$test_name failed after $MAX_RETRIES attempts"
                return 1
            fi
        fi
        
        ((attempt++))
    done
}

# Run tests in parallel
run_parallel_tests() {
    log_info "Running tests in parallel mode..."
    
    local pids=()
    local failed=0
    
    # Start tests in background
    for test_type in $(echo "$TEST_TYPES" | tr ',' ' '); do
        case $test_type in
            unit)
                run_unit_tests &
                pids+=($!)
                ;;
            integration)
                run_integration_tests &
                pids+=($!)
                ;;
            e2e)
                run_e2e_tests &
                pids+=($!)
                ;;
        esac
        
        # Limit parallel jobs
        if [ ${#pids[@]} -ge $MAX_PARALLEL_JOBS ]; then
            wait "${pids[0]}" || ((failed++))
            pids=("${pids[@]:1}")
        fi
    done
    
    # Wait for remaining jobs
    for pid in "${pids[@]}"; do
        wait "$pid" || ((failed++))
    done
    
    return $failed
}

# Run tests sequentially
run_sequential_tests() {
    log_info "Running tests in sequential mode..."
    
    local failed=0
    
    for test_type in $(echo "$TEST_TYPES" | tr ',' ' '); do
        case $test_type in
            unit)
                if [ "$RETRY_FAILED" = "true" ]; then
                    run_with_retry run_unit_tests "unit tests" || ((failed++))
                else
                    run_unit_tests || ((failed++))
                fi
                ;;
            integration)
                if [ "$RETRY_FAILED" = "true" ]; then
                    run_with_retry run_integration_tests "integration tests" || ((failed++))
                else
                    run_integration_tests || ((failed++))
                fi
                ;;
            e2e)
                if [ "$RETRY_FAILED" = "true" ]; then
                    run_with_retry run_e2e_tests "E2E tests" || ((failed++))
                else
                    run_e2e_tests || ((failed++))
                fi
                ;;
            *)
                log_warning "Unknown test type: $test_type"
                ;;
        esac
    done
    
    return $failed
}

# Aggregate test results
aggregate_results() {
    log_section "Aggregating Results"
    
    if [ -f "$SCRIPT_DIR/aggregate-results.sh" ]; then
        "$SCRIPT_DIR/aggregate-results.sh" "$OUTPUT_DIR"
    else
        log_warning "Result aggregation script not found"
    fi
}

# Save test summary
save_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    cat > "$OUTPUT_DIR/summary.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "duration": $duration,
  "test_types": "$TEST_TYPES",
  "parallel": $PARALLEL_EXECUTION,
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "skipped": $SKIPPED_TESTS,
  "success_rate": $(awk "BEGIN {printf \"%.2f\", $PASSED_TESTS / $TOTAL_TESTS * 100}" 2>/dev/null || echo "0"),
  "output_dir": "$OUTPUT_DIR"
}
EOF
    
    # Display summary
    log_section "Test Summary"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Skipped: $SKIPPED_TESTS"
    echo "Duration: ${duration}s"
    echo "Results saved to: $OUTPUT_DIR"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    log_section "Crowbar Mobile Test Runner"
    log_info "Starting test execution..."
    log_info "Test types: $TEST_TYPES"
    log_info "Output directory: $OUTPUT_DIR"
    
    # Setup
    setup_directories
    check_environment
    install_dependencies
    
    # Run tests
    local test_exit_code=0
    
    if [ "$PARALLEL_EXECUTION" = "true" ]; then
        run_parallel_tests || test_exit_code=$?
    else
        run_sequential_tests || test_exit_code=$?
    fi
    
    # Aggregate results
    aggregate_results
    
    # Save summary
    save_summary
    
    # Final status
    if [ $test_exit_code -eq 0 ]; then
        log_success "All tests completed successfully!"
    else
        log_error "Some tests failed (exit code: $test_exit_code)"
    fi
    
    # Cleanup
    cleanup
    
    # Propagate exit code
    exit $test_exit_code
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --types)
            TEST_TYPES="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL_EXECUTION="true"
            shift
            ;;
        --no-retry)
            RETRY_FAILED="false"
            shift
            ;;
        --max-retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --types <types>      Comma-separated test types (default: unit,integration,e2e)"
            echo "  --output <dir>       Output directory (default: /app/test-results)"
            echo "  --parallel           Run tests in parallel"
            echo "  --no-retry           Disable retry for failed tests"
            echo "  --max-retries <n>    Maximum retry attempts (default: 2)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Handle special case for directory creation test
if [ "$TEST_TYPES" = "none" ]; then
    setup_directories
    exit 0
fi

# Run main function
main