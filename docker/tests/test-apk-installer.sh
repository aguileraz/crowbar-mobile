#!/bin/bash

# Test suite for APK installation and validation system
# Tests APK validation, installation, and verification processes

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "APK Installation System Tests"
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

# Test 1: APK installer script exists
test_start "APK installer script exists"
if [ -f "docker/android/scripts/install-apk.sh" ]; then
    test_pass
else
    test_fail "install-apk.sh not found"
fi

# Test 2: APK validation script exists
test_start "APK validation script exists"
if [ -f "docker/android/scripts/validate-apk.sh" ]; then
    test_pass
else
    test_fail "validate-apk.sh not found"
fi

# Test 3: Scripts have proper shebang
test_start "Scripts have proper shebang"
if [ -f "docker/android/scripts/install-apk.sh" ] && head -n1 docker/android/scripts/install-apk.sh | grep -q "^#!/bin/bash"; then
    test_pass
else
    test_fail "Missing or incorrect shebang"
fi

# Test 4: APK validation includes package name check
test_start "APK validation includes package name check"
if [ -f "docker/android/scripts/validate-apk.sh" ] && grep -q "aapt.*package" docker/android/scripts/validate-apk.sh 2>/dev/null; then
    test_pass
else
    test_fail "Package name validation not implemented"
fi

# Test 5: APK validation includes signature check
test_start "APK validation includes signature check"
if [ -f "docker/android/scripts/validate-apk.sh" ] && grep -q "apksigner\|jarsigner" docker/android/scripts/validate-apk.sh 2>/dev/null; then
    test_pass
else
    test_fail "Signature verification not implemented"
fi

# Test 6: APK validation includes API level check
test_start "APK validation includes API level check"
if [ -f "docker/android/scripts/validate-apk.sh" ] && grep -q "minSdkVersion\|targetSdkVersion" docker/android/scripts/validate-apk.sh 2>/dev/null; then
    test_pass
else
    test_fail "API level compatibility check not implemented"
fi

# Test 7: Installation script has error handling
test_start "Installation script has error handling"
if [ -f "docker/android/scripts/install-apk.sh" ] && grep -q "set -e\|trap\|exit" docker/android/scripts/install-apk.sh 2>/dev/null; then
    test_pass
else
    test_fail "Error handling not implemented"
fi

# Test 8: Installation script checks ADB connection
test_start "Installation script checks ADB connection"
if [ -f "docker/android/scripts/install-apk.sh" ] && grep -q "adb devices\|adb get-state" docker/android/scripts/install-apk.sh 2>/dev/null; then
    test_pass
else
    test_fail "ADB connection check not implemented"
fi

# Test 9: Installation verification exists
test_start "Installation verification exists"
if [ -f "docker/android/scripts/verify-installation.sh" ]; then
    test_pass
else
    test_fail "verify-installation.sh not found"
fi

# Test 10: Verification checks app is installed
test_start "Verification checks app is installed"
if [ -f "docker/android/scripts/verify-installation.sh" ] && grep -q "pm list packages\|pm path" docker/android/scripts/verify-installation.sh 2>/dev/null; then
    test_pass
else
    test_fail "Package installation check not implemented"
fi

# Test 11: Verification checks app can launch
test_start "Verification checks app can launch"
if [ -f "docker/android/scripts/verify-installation.sh" ] && grep -q "am start\|monkey" docker/android/scripts/verify-installation.sh 2>/dev/null; then
    test_pass
else
    test_fail "App launch verification not implemented"
fi

# Test 12: Test APK exists for testing
test_start "Test APK exists for validation"
if [ -f "docker/tests/test-app.apk" ] || [ -f "docker/tests/sample.apk" ]; then
    test_pass
else
    test_fail "No test APK found for validation tests"
fi

# Test 13: Integration test script exists
test_start "APK installation integration test exists"
if [ -f "docker/tests/test-apk-integration.sh" ]; then
    test_pass
else
    test_fail "test-apk-integration.sh not found"
fi

echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All APK installation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi