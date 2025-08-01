#!/bin/bash

# Test script for Android Docker environment
# Tests that the Dockerfile builds correctly and contains all required components

# Don't exit on error during tests
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test functions
function test_start() {
    echo -e "${YELLOW}Running: $1${NC}"
    ((TESTS_RUN++))
}

function test_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
}

function test_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

# Test helper functions
function docker_build_test_image() {
    echo "Building test Docker image..."
    docker build -t crowbar-android-test:test -f docker/android/Dockerfile . > /tmp/docker-build.log 2>&1
    return $?
}

function docker_run_command() {
    docker run --rm crowbar-android-test:test $1
}

# Start tests
echo "======================================"
echo "Android Docker Environment Tests"
echo "======================================"

# Test 1: Dockerfile exists
test_start "Dockerfile exists"
if [ -f "docker/android/Dockerfile" ]; then
    test_pass
else
    test_fail "docker/android/Dockerfile not found"
fi

# Test 2: Dockerfile has valid syntax
test_start "Dockerfile syntax is valid"
if docker build --no-cache -t dockerfile-syntax-test -f docker/android/Dockerfile . 2>&1 | grep -q "syntax error"; then
    test_fail "Dockerfile has syntax errors"
else
    test_pass
fi

# Only run container tests if we can build the image
if docker_build_test_image; then
    # Test 3: Java is installed
    test_start "Java 17 is installed"
    if docker_run_command "java -version 2>&1" | grep -q "openjdk version \"17"; then
        test_pass
    else
        test_fail "Java 17 not found"
    fi

    # Test 4: Android SDK is installed
    test_start "Android SDK is installed"
    if docker_run_command "test -d \$ANDROID_HOME"; then
        test_pass
    else
        test_fail "ANDROID_HOME directory not found"
    fi

    # Test 5: Android SDK tools are accessible
    test_start "Android SDK tools are in PATH"
    if docker_run_command "which sdkmanager" > /dev/null 2>&1; then
        test_pass
    else
        test_fail "sdkmanager not found in PATH"
    fi

    # Test 6: Required SDK components are installed
    test_start "Required SDK components installed"
    SDK_COMPONENTS=$(docker_run_command "sdkmanager --list_installed 2>/dev/null")
    REQUIRED_COMPONENTS=("platform-tools" "platforms;android-30" "emulator" "system-images;android-30")
    MISSING_COMPONENTS=""
    
    for component in "${REQUIRED_COMPONENTS[@]}"; do
        if ! echo "$SDK_COMPONENTS" | grep -q "$component"; then
            MISSING_COMPONENTS="$MISSING_COMPONENTS $component"
        fi
    done
    
    if [ -z "$MISSING_COMPONENTS" ]; then
        test_pass
    else
        test_fail "Missing components:$MISSING_COMPONENTS"
    fi

    # Test 7: AVD is created
    test_start "Android Virtual Device (AVD) exists"
    if docker_run_command "avdmanager list avd" | grep -q "test_avd"; then
        test_pass
    else
        test_fail "AVD 'test_avd' not found"
    fi

    # Test 8: Node.js and npm are installed
    test_start "Node.js and npm are installed"
    if docker_run_command "node --version && npm --version" > /dev/null 2>&1; then
        test_pass
    else
        test_fail "Node.js or npm not found"
    fi

    # Test 9: VNC server is installed
    test_start "VNC server (x11vnc) is installed"
    if docker_run_command "which x11vnc" > /dev/null 2>&1; then
        test_pass
    else
        test_fail "x11vnc not found"
    fi

    # Test 10: Virtual display (Xvfb) is installed
    test_start "Virtual display (Xvfb) is installed"
    if docker_run_command "which Xvfb" > /dev/null 2>&1; then
        test_pass
    else
        test_fail "Xvfb not found"
    fi

    # Test 11: Entry point script exists
    test_start "Entry point script exists"
    if docker_run_command "test -f /usr/local/bin/docker-entrypoint.sh"; then
        test_pass
    else
        test_fail "docker-entrypoint.sh not found"
    fi

    # Test 12: Wait for emulator script exists
    test_start "Wait for emulator script exists"
    if docker_run_command "test -f /usr/local/bin/wait-for-emulator.sh"; then
        test_pass
    else
        test_fail "wait-for-emulator.sh not found"
    fi

    # Test 13: Scripts are executable
    test_start "Scripts have execute permissions"
    if docker_run_command "test -x /usr/local/bin/docker-entrypoint.sh && test -x /usr/local/bin/wait-for-emulator.sh"; then
        test_pass
    else
        test_fail "Scripts are not executable"
    fi

    # Clean up test image
    docker rmi crowbar-android-test:test > /dev/null 2>&1
else
    echo -e "${RED}Failed to build Docker image. Skipping container tests.${NC}"
    echo "Check /tmp/docker-build.log for details"
    TESTS_FAILED=$((TESTS_FAILED + 11))  # Count skipped tests as failures
fi

# Test summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Tests run: $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi