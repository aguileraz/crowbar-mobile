#!/bin/bash

# Test suite for CI/CD integration
# Validates GitHub Actions workflow and docker-compose configurations

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "CI/CD Integration Tests"
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

# Test 1: GitHub Actions workflow file exists
test_start "GitHub Actions workflow file exists"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    test_pass
else
    test_fail "android-tests.yml not found"
fi

# Test 2: docker-compose.yml exists
test_start "docker-compose.yml file exists"
if [ -f "../docker-compose.yml" ]; then
    test_pass
else
    test_fail "docker-compose.yml not found"
fi

# Test 3: PR comment script exists
test_start "PR comment script exists"
if [ -f "../android/scripts/post-pr-comment.sh" ]; then
    test_pass
else
    test_fail "post-pr-comment.sh not found"
fi

# Test 4: Workflow has proper trigger configuration
test_start "Workflow has proper triggers"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "pull_request:" "../../.github/workflows/android-tests.yml" && \
       grep -q "push:" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Missing PR or push triggers"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 5: Workflow includes Docker build step
test_start "Workflow includes Docker build"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "docker build" "../../.github/workflows/android-tests.yml" || \
       grep -q "docker/build-push-action" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Docker build step not found"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 6: Workflow includes test execution
test_start "Workflow includes test execution"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "run-tests.sh" "../../.github/workflows/android-tests.yml" || \
       grep -q "docker-compose.*test" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Test execution step not found"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 7: Workflow includes artifact upload
test_start "Workflow includes artifact upload"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "actions/upload-artifact" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Artifact upload step not found"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 8: docker-compose has proper service definition
test_start "docker-compose has Android emulator service"
if [ -f "../docker-compose.yml" ]; then
    if grep -q "android-emulator:" "../docker-compose.yml" || \
       grep -q "services:" "../docker-compose.yml"; then
        test_pass
    else
        test_fail "Service definition not found"
    fi
else
    test_fail "docker-compose.yml not found"
fi

# Test 9: docker-compose has volume mounts
test_start "docker-compose has volume configuration"
if [ -f "../docker-compose.yml" ]; then
    if grep -q "volumes:" "../docker-compose.yml"; then
        test_pass
    else
        test_fail "Volume configuration not found"
    fi
else
    test_fail "docker-compose.yml not found"
fi

# Test 10: PR comment script has proper shebang
test_start "PR comment script has proper shebang"
if [ -f "../android/scripts/post-pr-comment.sh" ]; then
    if head -n1 "../android/scripts/post-pr-comment.sh" | grep -q "^#!/bin/bash"; then
        test_pass
    else
        test_fail "Invalid or missing shebang"
    fi
else
    test_fail "Script not found"
fi

# Test 11: Workflow sets up caching
test_start "Workflow includes Docker layer caching"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "cache" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Docker caching not configured"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 12: Workflow has job dependencies
test_start "Workflow has proper job dependencies"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "needs:" "../../.github/workflows/android-tests.yml" || \
       grep -q "jobs:" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Job dependencies not configured"
    fi
else
    test_fail "Workflow file not found"
fi

# Test 13: Status check configuration exists
test_start "Status check configuration documented"
if [ -f "../CI_CONFIG.md" ] || [ -f "../../.github/BRANCH_PROTECTION.md" ]; then
    test_pass
else
    test_fail "Status check documentation not found"
fi

# Test 14: README includes CI/CD documentation
test_start "README includes CI/CD section"
if [ -f "../README.md" ]; then
    if grep -q "CI/CD\|Continuous Integration\|GitHub Actions" "../README.md"; then
        test_pass
    else
        test_fail "CI/CD documentation not found in README"
    fi
else
    test_fail "README.md not found"
fi

# Test 15: Workflow has timeout configuration
test_start "Workflow has timeout settings"
if [ -f "../../.github/workflows/android-tests.yml" ]; then
    if grep -q "timeout-minutes:" "../../.github/workflows/android-tests.yml"; then
        test_pass
    else
        test_fail "Timeout configuration missing"
    fi
else
    test_fail "Workflow file not found"
fi

echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}All CI/CD integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi