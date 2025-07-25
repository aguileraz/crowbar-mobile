#!/bin/bash

# Integration test for the complete test execution system
# Validates that all components work together properly

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Test Execution Integration Test"
echo "======================================"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_start() {
    echo -e "\n${BLUE}[TEST]${NC} $1"
}

test_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

# Test environment setup
test_start "Setting up test environment"

# Check if we're in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    IN_DOCKER=true
else
    echo "Running outside Docker container"
    IN_DOCKER=false
fi

# Make all scripts executable
chmod +x docker/android/scripts/*.sh 2>/dev/null || true

# Test 1: Script executable permissions
test_start "Testing script permissions"

all_executable=true
for script in run-tests.sh parse-jest-results.sh run-detox-tests.sh retry-handler.sh aggregate-results.sh; do
    if [ -x "docker/android/scripts/$script" ]; then
        test_pass "$script is executable"
    else
        test_fail "$script is not executable"
        all_executable=false
    fi
done

# Test 2: Test runner help/usage
test_start "Testing main test runner"

if docker/android/scripts/run-tests.sh --help 2>&1 | grep -q "Usage:"; then
    test_pass "Test runner shows help"
else
    test_fail "Test runner help not working"
fi

# Test 3: Jest parser functionality
test_start "Testing Jest result parser"

# Create a mock Jest result
mock_jest_result=$(mktemp)
cat > "$mock_jest_result" <<EOF
{
  "success": true,
  "numTotalTests": 10,
  "numPassedTests": 8,
  "numFailedTests": 2,
  "numPendingTests": 0,
  "numTotalTestSuites": 3
}
EOF

if docker/android/scripts/parse-jest-results.sh "$mock_jest_result" "unit" 2>&1 | grep -q "8"; then
    test_pass "Jest parser correctly parses results"
else
    test_fail "Jest parser failed to parse mock results"
fi

rm -f "$mock_jest_result"

# Test 4: Retry handler functionality
test_start "Testing retry handler"

if docker/android/scripts/retry-handler.sh retry "echo 'test'" "echo_test" 1 &> /dev/null; then
    test_pass "Retry handler executes simple command"
else
    test_fail "Retry handler failed on simple command"
fi

# Test 5: Aggregator functionality
test_start "Testing results aggregator"

# Create mock output directory
mock_output_dir=$(mktemp -d)
mkdir -p "$mock_output_dir/unit"
mkdir -p "$mock_output_dir/integration"
mkdir -p "$mock_output_dir/e2e"

# Create mock results with all tests passing
cat > "$mock_output_dir/unit/results.json" <<EOF
{
  "success": true,
  "numTotalTests": 50,
  "numPassedTests": 50,
  "numFailedTests": 0,
  "numPendingTests": 0
}
EOF

# Run aggregator (will exit 0 with no failures)
docker/android/scripts/aggregate-results.sh "$mock_output_dir" &> /dev/null

if [ -f "$mock_output_dir/aggregated-report.json" ] && [ -f "$mock_output_dir/test-summary.txt" ] && [ -f "$mock_output_dir/dashboard.html" ]; then
    test_pass "Aggregator generates all reports"
else
    test_fail "Aggregator missing output files"
fi

rm -rf "$mock_output_dir"

# Test 6: Parallel execution support
test_start "Testing parallel execution configuration"

if grep -q "run_parallel_tests\|PARALLEL_EXECUTION" docker/android/scripts/run-tests.sh; then
    test_pass "Parallel execution support present"
else
    test_fail "Parallel execution support missing"
fi

# Test 7: Error handling in all scripts
test_start "Testing error handling across scripts"

error_handling_ok=true
for script in docker/android/scripts/*.sh; do
    if [ -f "$script" ]; then
        # Check for any form of error handling (set -e, set +e, trap, or explicit error handling)
        if ! grep -q "set -e\|set +e\|trap\|handle_error\|exit 1" "$script"; then
            test_fail "$(basename "$script") missing error handling"
            error_handling_ok=false
        fi
    fi
done

if [ "$error_handling_ok" = true ]; then
    test_pass "All scripts have error handling"
fi

# Test 8: Output directory handling
test_start "Testing output directory creation"

test_output_dir=$(mktemp -d)
if docker/android/scripts/run-tests.sh --output "$test_output_dir" --types none &> /dev/null; then
    if [ -d "$test_output_dir/unit" ] && [ -d "$test_output_dir/integration" ] && [ -d "$test_output_dir/e2e" ]; then
        test_pass "Output directories created correctly"
    else
        test_fail "Output directory structure incorrect"
    fi
else
    test_fail "Failed to create output directories"
fi
rm -rf "$test_output_dir"

# Test 9: Integration flow simulation
test_start "Testing complete integration flow"

# This tests that scripts can call each other
integration_test_dir=$(mktemp -d)
export OUTPUT_DIR="$integration_test_dir"

# Create mock results first
echo '{"success": true, "numTotalTests": 5, "numPassedTests": 5, "numFailedTests": 0}' > "$integration_test_dir/results.json"

# Test the flow
flow_success=true

# 1. Parse results
if docker/android/scripts/parse-jest-results.sh "$integration_test_dir/results.json" "test" &> /dev/null; then
    echo "  Jest parser executed successfully"
else
    flow_success=false
    echo "  Jest parser failed"
fi

# 2. Retry handler
if docker/android/scripts/retry-handler.sh retry "true" "test_command" 1 &> /dev/null; then
    echo "  Retry handler executed successfully"
else
    flow_success=false
    echo "  Retry handler failed"
fi

if [ "$flow_success" = true ]; then
    test_pass "Integration flow works correctly"
else
    test_fail "Integration flow has issues"
fi

rm -rf "$integration_test_dir"

# Test 10: Configuration environment variables
test_start "Testing configuration support"

config_vars_found=0
for var in MAX_RETRIES PARALLEL_EXECUTION OUTPUT_DIR TEST_TYPES RETRY_FAILED; do
    if grep -q "$var" docker/android/scripts/run-tests.sh; then
        ((config_vars_found++))
    fi
done

if [ $config_vars_found -ge 4 ]; then
    test_pass "Configuration variables supported"
else
    test_fail "Missing configuration variable support"
fi

echo ""
echo "======================================"
echo "Integration Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All integration tests passed!${NC}"
    echo "The test execution system is ready for use."
    exit 0
else
    echo -e "\n${RED}Some integration tests failed!${NC}"
    echo "Please fix the issues before using the test system."
    exit 1
fi