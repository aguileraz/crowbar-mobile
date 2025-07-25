#!/bin/bash

# Test suite for test execution orchestration system
# Validates the test runner and result parsing functionality

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Test Executor System Tests"
echo "======================================"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_start() {
    echo -n "$1... "
}

test_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    if [ -n "$1" ]; then
        echo "  Reason: $1"
    fi
    ((TESTS_FAILED++))
}

# Test 1: Main test runner script exists
test_start "Main test runner script exists"
if [ -f "docker/android/scripts/run-tests.sh" ]; then
    test_pass
else
    test_fail "run-tests.sh not found"
fi

# Test 2: Jest test parser exists
test_start "Jest test parser script exists"
if [ -f "docker/android/scripts/parse-jest-results.sh" ]; then
    test_pass
else
    test_fail "parse-jest-results.sh not found"
fi

# Test 3: Detox test runner exists
test_start "Detox test runner script exists"
if [ -f "docker/android/scripts/run-detox-tests.sh" ]; then
    test_pass
else
    test_fail "run-detox-tests.sh not found"
fi

# Test 4: Test retry handler exists
test_start "Test retry handler exists"
if [ -f "docker/android/scripts/retry-handler.sh" ]; then
    test_pass
else
    test_fail "retry-handler.sh not found"
fi

# Test 5: Scripts have proper shebang
test_start "All scripts have proper shebang"
all_have_shebang=true
for script in docker/android/scripts/run-tests.sh \
              docker/android/scripts/parse-jest-results.sh \
              docker/android/scripts/run-detox-tests.sh \
              docker/android/scripts/retry-handler.sh; do
    if [ -f "$script" ] && ! head -n1 "$script" | grep -q "^#!/bin/bash"; then
        all_have_shebang=false
        break
    fi
done

if [ "$all_have_shebang" = true ]; then
    test_pass
else
    test_fail "Some scripts missing proper shebang"
fi

# Test 6: Test runner supports multiple test types
test_start "Test runner supports multiple test types"
if [ -f "docker/android/scripts/run-tests.sh" ] && \
   grep -q "unit\|integration\|e2e" docker/android/scripts/run-tests.sh 2>/dev/null; then
    test_pass
else
    test_fail "Test type support not implemented"
fi

# Test 7: Jest parser handles JSON output
test_start "Jest parser handles JSON output"
if [ -f "docker/android/scripts/parse-jest-results.sh" ] && \
   grep -q "json\|JSON" docker/android/scripts/parse-jest-results.sh 2>/dev/null; then
    test_pass
else
    test_fail "JSON parsing not implemented"
fi

# Test 8: Detox runner has headless configuration
test_start "Detox runner has headless configuration"
if [ -f "docker/android/scripts/run-detox-tests.sh" ] && \
   grep -q "headless\|--headless" docker/android/scripts/run-detox-tests.sh 2>/dev/null; then
    test_pass
else
    test_fail "Headless configuration not found"
fi

# Test 9: Retry handler has configurable attempts
test_start "Retry handler has configurable attempts"
if [ -f "docker/android/scripts/retry-handler.sh" ] && \
   grep -q "MAX_RETRIES\|RETRY_COUNT" docker/android/scripts/retry-handler.sh 2>/dev/null; then
    test_pass
else
    test_fail "Retry configuration not implemented"
fi

# Test 10: Error handling in all scripts
test_start "All scripts have error handling"
all_have_error_handling=true
for script in docker/android/scripts/run-tests.sh \
              docker/android/scripts/parse-jest-results.sh \
              docker/android/scripts/run-detox-tests.sh \
              docker/android/scripts/retry-handler.sh; do
    if [ -f "$script" ] && ! grep -q "set -e\|trap\|exit" "$script" 2>/dev/null; then
        all_have_error_handling=false
        break
    fi
done

if [ "$all_have_error_handling" = true ]; then
    test_pass
else
    test_fail "Some scripts missing error handling"
fi

# Test 11: Result aggregation functionality
test_start "Result aggregation functionality exists"
if [ -f "docker/android/scripts/aggregate-results.sh" ]; then
    test_pass
else
    test_fail "aggregate-results.sh not found"
fi

# Test 12: Parallel execution support
test_start "Parallel execution configuration exists"
if [ -f "docker/android/scripts/run-tests.sh" ] && \
   grep -q "parallel\|PARALLEL\|concurrent" docker/android/scripts/run-tests.sh 2>/dev/null; then
    test_pass
else
    test_fail "Parallel execution not configured"
fi

# Test 13: Output directory creation
test_start "Test output directory handling"
if [ -f "docker/android/scripts/run-tests.sh" ] && \
   grep -q "mkdir.*results\|OUTPUT_DIR" docker/android/scripts/run-tests.sh 2>/dev/null; then
    test_pass
else
    test_fail "Output directory handling not implemented"
fi

# Test 14: Exit code propagation
test_start "Exit code propagation implemented"
if [ -f "docker/android/scripts/run-tests.sh" ] && \
   grep -q "exit.*\$\|return.*\$" docker/android/scripts/run-tests.sh 2>/dev/null; then
    test_pass
else
    test_fail "Exit code propagation not found"
fi

# Test 15: Integration test script exists
test_start "Test execution integration test exists"
if [ -f "docker/tests/test-execution-integration.sh" ]; then
    test_pass
else
    test_fail "test-execution-integration.sh not found"
fi

echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All test executor tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi