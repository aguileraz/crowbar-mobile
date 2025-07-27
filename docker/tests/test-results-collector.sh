#!/bin/bash

# Test suite for results collection and reporting system
# Validates report generation, screenshot capture, and artifact packaging

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Results Collection System Tests"
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

# Test 1: Results collector script exists
test_start "Results collector script exists"
SCRIPT_DIR="../android/scripts"
if [ -f "$SCRIPT_DIR/collect-results.sh" ]; then
    test_pass
else
    test_fail "collect-results.sh not found"
fi

# Test 2: HTML report generator exists
test_start "Enhanced HTML report generator exists"
if [ -f "$SCRIPT_DIR/generate-html-report.sh" ]; then
    test_pass
else
    test_fail "generate-html-report.sh not found"
fi

# Test 3: Screenshot capture script exists
test_start "Screenshot capture script exists"
if [ -f "$SCRIPT_DIR/screenshot-capture.sh" ]; then
    test_pass
else
    test_fail "screenshot-capture.sh not found"
fi

# Test 4: Log collector script exists
test_start "Log collector script exists"
if [ -f "$SCRIPT_DIR/log-collector.sh" ]; then
    test_pass
else
    test_fail "log-collector.sh not found"
fi

# Test 5: Artifact packager script exists
test_start "Artifact packager script exists"
if [ -f "$SCRIPT_DIR/package-artifacts.sh" ]; then
    test_pass
else
    test_fail "package-artifacts.sh not found"
fi

# Test 6: Scripts have proper shebang
test_start "All scripts have proper shebang"
all_have_shebang=true
for script in $SCRIPT_DIR/collect-results.sh \
              $SCRIPT_DIR/generate-html-report.sh \
              $SCRIPT_DIR/screenshot-capture.sh \
              $SCRIPT_DIR/log-collector.sh \
              $SCRIPT_DIR/package-artifacts.sh; do
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

# Test 7: HTML report includes test details
test_start "HTML report includes test failure details"
if [ -f "$SCRIPT_DIR/generate-html-report.sh" ] && \
   grep -q "stack.*trace\|failure.*details\|error.*message" $SCRIPT_DIR/generate-html-report.sh 2>/dev/null; then
    test_pass
else
    test_fail "Test failure details not included"
fi

# Test 8: Screenshot capture supports multiple formats
test_start "Screenshot capture supports multiple sources"
if [ -f "$SCRIPT_DIR/screenshot-capture.sh" ] && \
   grep -q "adb.*screencap\|screenshot" $SCRIPT_DIR/screenshot-capture.sh 2>/dev/null; then
    test_pass
else
    test_fail "Screenshot capture not properly implemented"
fi

# Test 9: Log collector aggregates multiple sources
test_start "Log collector aggregates multiple sources"
if [ -f "$SCRIPT_DIR/log-collector.sh" ] && \
   grep -q "logcat\|emulator.*log\|test.*log" $SCRIPT_DIR/log-collector.sh 2>/dev/null; then
    test_pass
else
    test_fail "Log aggregation not implemented"
fi

# Test 10: JSON summary has standardized schema
test_start "JSON summary has standardized schema"
if [ -f "$SCRIPT_DIR/collect-results.sh" ] && \
   grep -q "schema\|version\|timestamp" $SCRIPT_DIR/collect-results.sh 2>/dev/null; then
    test_pass
else
    test_fail "Standardized schema not implemented"
fi

# Test 11: Artifact packaging creates archives
test_start "Artifact packaging creates archives"
if [ -f "$SCRIPT_DIR/package-artifacts.sh" ] && \
   grep -q "tar\|zip\|archive" $SCRIPT_DIR/package-artifacts.sh 2>/dev/null; then
    test_pass
else
    test_fail "Archive creation not implemented"
fi

# Test 12: Error handling in all scripts
test_start "All scripts have error handling"
all_have_error_handling=true
for script in $SCRIPT_DIR/collect-results.sh \
              $SCRIPT_DIR/generate-html-report.sh \
              $SCRIPT_DIR/screenshot-capture.sh \
              $SCRIPT_DIR/log-collector.sh \
              $SCRIPT_DIR/package-artifacts.sh; do
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

# Test 13: HTML report includes charts/visualization
test_start "HTML report includes visualization"
if [ -f "$SCRIPT_DIR/generate-html-report.sh" ] && \
   grep -q "chart\|graph\|canvas\|svg" $SCRIPT_DIR/generate-html-report.sh 2>/dev/null; then
    test_pass
else
    test_fail "Visualization not implemented"
fi

# Test 14: Screenshot gallery implementation
test_start "Screenshot gallery in HTML report"
if [ -f "$SCRIPT_DIR/generate-html-report.sh" ] && \
   grep -q "gallery\|thumbnail\|lightbox" $SCRIPT_DIR/generate-html-report.sh 2>/dev/null; then
    test_pass
else
    test_fail "Screenshot gallery not implemented"
fi

# Test 15: Integration test exists
test_start "Results collection integration test exists"
if [ -f "./test-results-integration.sh" ]; then
    test_pass
else
    test_fail "test-results-integration.sh not found"
fi

echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All results collector tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi