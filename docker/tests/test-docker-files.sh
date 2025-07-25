#!/bin/bash

# Simple test to verify Docker files are correctly set up
# This doesn't require building the image

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Docker Files Structure Test"
echo "======================================"

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Dockerfile exists
echo -n "Checking Dockerfile exists... "
if [ -f "docker/android/Dockerfile" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 2: docker-entrypoint.sh exists
echo -n "Checking docker-entrypoint.sh exists... "
if [ -f "docker/android/scripts/docker-entrypoint.sh" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 3: wait-for-emulator.sh exists
echo -n "Checking wait-for-emulator.sh exists... "
if [ -f "docker/android/scripts/wait-for-emulator.sh" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: docker-compose.yml exists
echo -n "Checking docker-compose.yml exists... "
if [ -f "docker/docker-compose.yml" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Scripts are executable
echo -n "Checking scripts have shebang... "
if head -n1 docker/android/scripts/docker-entrypoint.sh | grep -q "^#!/bin/bash"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 6: Dockerfile has required components
echo -n "Checking Dockerfile has Android SDK setup... "
if grep -q "ANDROID_HOME" docker/android/Dockerfile && \
   grep -q "sdkmanager" docker/android/Dockerfile && \
   grep -q "avdmanager" docker/android/Dockerfile; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 7: VNC configuration in Dockerfile
echo -n "Checking VNC server configuration... "
if grep -q "x11vnc" docker/android/Dockerfile && \
   grep -q "xvfb" docker/android/Dockerfile && \
   grep -q "DISPLAY" docker/android/Dockerfile; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 8: README exists
echo -n "Checking README documentation exists... "
if [ -f "docker/README.md" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All file structure tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi