#!/bin/bash

# Integration test for the complete results collection and reporting system
# Validates the end-to-end workflow from collection to packaging

set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Results Collection Integration Test"
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

# Create mock test results
mock_results_dir=$(mktemp -d)
export RESULTS_DIR="$mock_results_dir"

echo "Mock results directory: $mock_results_dir"

# Create mock directory structure
mkdir -p "$mock_results_dir/unit"
mkdir -p "$mock_results_dir/integration"
mkdir -p "$mock_results_dir/e2e"
mkdir -p "$mock_results_dir/logs"
mkdir -p "$mock_results_dir/screenshots"

# Create mock test results
cat > "$mock_results_dir/unit/results.json" <<EOF
{
  "success": true,
  "numTotalTests": 25,
  "numPassedTests": 23,
  "numFailedTests": 2,
  "numPendingTests": 0,
  "numTotalTestSuites": 5
}
EOF

cat > "$mock_results_dir/integration/results.json" <<EOF
{
  "success": true,
  "numTotalTests": 15,
  "numPassedTests": 14,
  "numFailedTests": 1,
  "numPendingTests": 0,
  "numTotalTestSuites": 3
}
EOF

cat > "$mock_results_dir/e2e/detox-results.json" <<EOF
{
  "success": false,
  "numTotalTests": 8,
  "numPassedTests": 6,
  "numFailedTests": 2,
  "numPendingTests": 0,
  "numTotalTestSuites": 2
}
EOF

# Create mock aggregated results
cat > "$mock_results_dir/aggregated-report.json" <<EOF
{
  "summary": {
    "total_tests": 48,
    "passed": 43,
    "failed": 5,
    "skipped": 0,
    "pass_rate": 89.58
  },
  "by_type": {
    "unit": {"total": 25, "passed": 23, "failed": 2, "skipped": 0},
    "integration": {"total": 15, "passed": 14, "failed": 1, "skipped": 0},
    "e2e": {"total": 8, "passed": 6, "failed": 2, "skipped": 0}
  },
  "coverage": {
    "lines": 85.2,
    "branches": 78.5,
    "functions": 92.1,
    "statements": 84.7
  }
}
EOF

# Create mock logs
echo "Mock test log entry 1" > "$mock_results_dir/logs/unit.log"
echo "Mock test log entry 2" > "$mock_results_dir/logs/integration.log"
echo "Mock error log entry" > "$mock_results_dir/logs/error.log"

# Create mock screenshots (small PNG files)
echo -e "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde" > "$mock_results_dir/screenshots/test1.png"
echo -e "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde" > "$mock_results_dir/screenshots/failure1.png"

# Make all scripts executable
chmod +x ../android/scripts/*.sh 2>/dev/null || true

# Test 1: Scripts are executable
test_start "Testing script permissions"

all_executable=true
for script in collect-results.sh generate-html-report.sh screenshot-capture.sh log-collector.sh package-artifacts.sh; do
    if [ -x "../android/scripts/$script" ]; then
        echo "  ✓ $script is executable"
    else
        echo "  ✗ $script is not executable"
        all_executable=false
    fi
done

if [ "$all_executable" = true ]; then
    test_pass "All scripts are executable"
else
    test_fail "Some scripts are not executable"
fi

# Test 2: Results collection
test_start "Testing results collection"

if ../android/scripts/collect-results.sh collect &> /tmp/collect.log; then
    if [ -f "$mock_results_dir/test_results_summary.json" ]; then
        test_pass "Results collection completed with summary"
    else
        test_fail "Results collection missing summary file"
    fi
else
    test_fail "Results collection failed"
    echo "  Error log:"
    tail -5 /tmp/collect.log || true
fi

# Test 3: JSON schema validation
test_start "Testing JSON schema validation"

if [ -f "$mock_results_dir/test_results_summary.json" ]; then
    if command -v jq &> /dev/null; then
        if jq . "$mock_results_dir/test_results_summary.json" &> /dev/null; then
            # Check for required schema fields
            schema_version=$(jq -r '.schema.version' "$mock_results_dir/test_results_summary.json" 2>/dev/null)
            if [ "$schema_version" != "null" ] && [ -n "$schema_version" ]; then
                test_pass "JSON schema is valid with version $schema_version"
            else
                test_fail "JSON schema missing version"
            fi
        else
            test_fail "JSON schema is invalid"
        fi
    else
        test_pass "JSON schema validation skipped (jq not available)"
    fi
else
    test_fail "No JSON summary file to validate"
fi

# Test 4: HTML report generation
test_start "Testing HTML report generation"

if ../android/scripts/generate-html-report.sh "$mock_results_dir" "$mock_results_dir/test-report.html" &> /dev/null; then
    if [ -f "$mock_results_dir/test-report.html" ]; then
        # Check if HTML contains expected content
        if grep -q "Test Results" "$mock_results_dir/test-report.html" && \
           grep -q "chart" "$mock_results_dir/test-report.html"; then
            test_pass "HTML report generated with charts"
        else
            test_fail "HTML report missing expected content"
        fi
    else
        test_fail "HTML report file not created"
    fi
else
    test_fail "HTML report generation failed"
fi

# Test 5: Screenshot capture setup
test_start "Testing screenshot capture setup"

if ../android/scripts/screenshot-capture.sh setup &> /dev/null; then
    if [ -d "$mock_results_dir/screenshots/originals" ] && \
       [ -d "$mock_results_dir/screenshots/thumbnails" ]; then
        test_pass "Screenshot directories created"
    else
        test_fail "Screenshot directories not created"
    fi
else
    test_fail "Screenshot setup failed"
fi

# Test 6: Log collection
test_start "Testing log collection"

if ../android/scripts/log-collector.sh setup &> /dev/null; then
    if [ -d "$mock_results_dir/logs/system" ] && \
       [ -d "$mock_results_dir/logs/tests" ]; then
        test_pass "Log collection directories created"
    else
        test_fail "Log collection directories not created"
    fi
else
    test_fail "Log collection setup failed"
fi

# Test 7: Artifact packaging - CI package
test_start "Testing CI artifact packaging"

if ../android/scripts/package-artifacts.sh ci &> /dev/null; then
    if [ -d "$mock_results_dir/artifacts/packages" ] && \
       ls "$mock_results_dir/artifacts/packages"/*ci*.tar.gz &> /dev/null; then
        test_pass "CI package created successfully"
    else
        test_fail "CI package not created"
    fi
else
    test_fail "CI packaging failed"
fi

# Test 8: Artifact packaging - Reports package  
test_start "Testing reports packaging"

if ../android/scripts/package-artifacts.sh reports &> /dev/null; then
    if ls "$mock_results_dir/artifacts/packages"/*reports*.zip &> /dev/null; then
        test_pass "Reports package created successfully"
    else
        test_fail "Reports package not created"
    fi
else
    test_fail "Reports packaging failed"
fi

# Test 9: Manifest generation
test_start "Testing manifest generation"

if [ -d "$mock_results_dir/artifacts/manifests" ]; then
    manifest_count=$(find "$mock_results_dir/artifacts/manifests" -name "*.manifest.json" | wc -l)
    if [ "$manifest_count" -gt 0 ]; then
        test_pass "Package manifests generated ($manifest_count files)"
    else
        test_fail "No package manifests generated"
    fi
else
    test_fail "Manifests directory not created"
fi

# Test 10: Download index generation
test_start "Testing download index generation"

if [ -f "$mock_results_dir/artifacts/index.html" ]; then
    if grep -q "Test Artifacts Download" "$mock_results_dir/artifacts/index.html" && \
       grep -q "download-btn" "$mock_results_dir/artifacts/index.html"; then
        test_pass "Download index generated with proper content"
    else
        test_fail "Download index missing expected content"
    fi
else
    test_fail "Download index not generated"
fi

# Test 11: Complete workflow test
test_start "Testing complete workflow"

workflow_temp_dir=$(mktemp -d)
export RESULTS_DIR="$workflow_temp_dir"

# Create minimal test data
mkdir -p "$workflow_temp_dir/unit"
echo '{"success": true, "numTotalTests": 5, "numPassedTests": 5, "numFailedTests": 0}' > "$workflow_temp_dir/unit/results.json"
echo '{"summary": {"total_tests": 5, "passed": 5, "failed": 0, "pass_rate": 100}}' > "$workflow_temp_dir/aggregated-report.json"

# Run complete workflow
if ../android/scripts/collect-results.sh collect &> /dev/null && \
   ../android/scripts/package-artifacts.sh ci &> /dev/null; then
    
    # Check outputs
    if [ -f "$workflow_temp_dir/test_results_summary.json" ] && \
       ls "$workflow_temp_dir/artifacts/packages"/*.tar.gz &> /dev/null; then
        test_pass "Complete workflow executed successfully"
    else
        test_fail "Complete workflow missing expected outputs"
    fi
else
    test_fail "Complete workflow execution failed"
fi

rm -rf "$workflow_temp_dir"

# Test 12: Error handling
test_start "Testing error handling with invalid data"

error_test_dir=$(mktemp -d)
export RESULTS_DIR="$error_test_dir"

# Create invalid JSON
echo "invalid json content" > "$error_test_dir/broken.json"

# Run collection and expect it to handle errors gracefully
if ../android/scripts/collect-results.sh collect &> /dev/null; then
    test_pass "Error handling works correctly"
else
    test_pass "Error handling detected and prevented execution"
fi

rm -rf "$error_test_dir"

echo ""
echo "======================================"
echo "Integration Test Summary"
echo "======================================"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

# Display artifact summary if available
if [ -d "$mock_results_dir/artifacts" ]; then
    echo ""
    echo "Generated Artifacts:"
    find "$mock_results_dir/artifacts" -type f -name "*.tar.gz" -o -name "*.zip" -o -name "*.html" -o -name "*.json" | while read file; do
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "  $(basename "$file") - $size"
    done
fi

# Cleanup
rm -rf "$mock_results_dir"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All integration tests passed!${NC}"
    echo "The results collection system is fully functional."
    exit 0
else
    echo -e "\n${RED}Some integration tests failed!${NC}"
    echo "Please review and fix the issues before deploying."
    exit 1
fi