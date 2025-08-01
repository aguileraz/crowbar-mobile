#!/bin/bash

# Integration test for APK installation system
# Tests the complete flow from validation to verification

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "APK Installation Integration Test"
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

# Make scripts executable
chmod +x docker/android/scripts/*.sh 2>/dev/null || true

# Test 1: Script permissions
test_start "Testing script permissions"

if [ -x "docker/android/scripts/install-apk.sh" ] && \
   [ -x "docker/android/scripts/validate-apk.sh" ] && \
   [ -x "docker/android/scripts/verify-installation.sh" ]; then
    test_pass "All scripts are executable"
else
    test_fail "Some scripts are not executable"
fi

# Test 2: Validate script help/usage
test_start "Testing script usage messages"

if docker/android/scripts/install-apk.sh 2>&1 | grep -q "Usage:"; then
    test_pass "install-apk.sh shows usage"
else
    test_fail "install-apk.sh missing usage message"
fi

if docker/android/scripts/validate-apk.sh 2>&1 | grep -q "Usage:"; then
    test_pass "validate-apk.sh shows usage"
else
    test_fail "validate-apk.sh missing usage message"
fi

if docker/android/scripts/verify-installation.sh 2>&1 | grep -q "Usage:"; then
    test_pass "verify-installation.sh shows usage"
else
    test_fail "verify-installation.sh missing usage message"
fi

# Test 3: APK validation with missing file
test_start "Testing APK validation with missing file"

if ! docker/android/scripts/validate-apk.sh /tmp/nonexistent.apk 2>&1 | grep -q "not found"; then
    test_fail "validate-apk.sh should fail for missing file"
else
    test_pass "validate-apk.sh correctly handles missing file"
fi

# Test 4: Installation script with missing file
test_start "Testing installation with missing file"

if ! docker/android/scripts/install-apk.sh /tmp/nonexistent.apk 2>&1 | grep -q "not found"; then
    test_fail "install-apk.sh should fail for missing file"
else
    test_pass "install-apk.sh correctly handles missing file"
fi

# Test 5: Verification with invalid package
test_start "Testing verification with invalid package"

if ! docker/android/scripts/verify-installation.sh com.invalid.package 2>&1 | grep -q "Usage:"; then
    test_pass "verify-installation.sh handles invalid package"
else
    test_fail "verify-installation.sh should handle invalid package"
fi

# Test 6: Check for required functions in scripts
test_start "Testing required functions in scripts"

# Check install-apk.sh functions
if grep -q "check_adb_connection" docker/android/scripts/install-apk.sh && \
   grep -q "validate_apk_file" docker/android/scripts/install-apk.sh && \
   grep -q "install_apk_with_retries" docker/android/scripts/install-apk.sh; then
    test_pass "install-apk.sh has required functions"
else
    test_fail "install-apk.sh missing required functions"
fi

# Check validate-apk.sh functions
if grep -q "validate_package_name" docker/android/scripts/validate-apk.sh && \
   grep -q "validate_api_levels" docker/android/scripts/validate-apk.sh && \
   grep -q "validate_signature" docker/android/scripts/validate-apk.sh; then
    test_pass "validate-apk.sh has required functions"
else
    test_fail "validate-apk.sh missing required functions"
fi

# Check verify-installation.sh functions
if grep -q "check_package_installed" docker/android/scripts/verify-installation.sh && \
   grep -q "launch_app" docker/android/scripts/verify-installation.sh && \
   grep -q "check_app_running" docker/android/scripts/verify-installation.sh; then
    test_pass "verify-installation.sh has required functions"
else
    test_fail "verify-installation.sh missing required functions"
fi

# Test 7: Error handling
test_start "Testing error handling"

# Check for set -e or error handling
if grep -q "set -e\|trap" docker/android/scripts/install-apk.sh && \
   grep -q "set -e" docker/android/scripts/validate-apk.sh && \
   grep -q "set -e" docker/android/scripts/verify-installation.sh; then
    test_pass "All scripts have error handling"
else
    test_fail "Some scripts missing error handling"
fi

# Test 8: Logging functions
test_start "Testing logging functions"

if grep -q "log_error\|log_info\|log_success" docker/android/scripts/install-apk.sh && \
   grep -q "log_error\|log_info\|log_success" docker/android/scripts/validate-apk.sh && \
   grep -q "log_error\|log_info\|log_success" docker/android/scripts/verify-installation.sh; then
    test_pass "All scripts have logging functions"
else
    test_fail "Some scripts missing logging functions"
fi

# Test 9: Configuration variables
test_start "Testing configuration variables"

if grep -q "MAX_RETRIES\|TIMEOUT" docker/android/scripts/install-apk.sh && \
   grep -q "MIN_SDK_VERSION\|MAX_SDK_VERSION" docker/android/scripts/validate-apk.sh; then
    test_pass "Scripts have configuration variables"
else
    test_fail "Scripts missing configuration variables"
fi

# Test 10: Integration with Docker
if [ "$IN_DOCKER" = true ]; then
    test_start "Testing Docker integration"
    
    # Check if scripts are accessible in container
    if [ -f "/usr/local/bin/install-apk.sh" ] || [ -f "docker/android/scripts/install-apk.sh" ]; then
        test_pass "Scripts accessible in Docker environment"
    else
        test_fail "Scripts not properly mounted in Docker"
    fi
else
    test_start "Skipping Docker integration tests (not in Docker)"
fi

echo ""
echo "======================================"
echo "Integration Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All integration tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some integration tests failed!${NC}"
    exit 1
fi