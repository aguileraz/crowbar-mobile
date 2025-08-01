#!/bin/bash
set -e

echo "🧪 Crowbar Mobile Test Runner"
echo "============================="

# Configuration
TEST_RESULTS_DIR=${TEST_RESULTS_DIR:-/app/test-results}
SCREENSHOT_DIR=${SCREENSHOT_DIR:-/app/screenshots}
LOG_DIR=${LOG_DIR:-/app/logs}
REPORT_DIR=${REPORT_DIR:-/app/reports}
PARALLEL_TESTS=${PARALLEL_TESTS:-true}
TEST_TARGETS=${TEST_TARGETS:-"android-31"}

# Function to run tests on a specific target
run_tests_on_target() {
    local target=$1
    local port=$2
    local api_level=$3
    
    echo "📱 Running tests on $target (API $api_level)..."
    
    # Create target-specific directories
    mkdir -p "$TEST_RESULTS_DIR/$target"
    mkdir -p "$SCREENSHOT_DIR/$target"
    mkdir -p "$LOG_DIR/$target"
    
    # Configure WebDriverIO for this target
    export APPIUM_HOST=$target
    export APPIUM_PORT=$port
    export ANDROID_API_LEVEL=$api_level
    export SCREENSHOTS_PATH="$SCREENSHOT_DIR/$target"
    export LOG_PATH="$LOG_DIR/$target"
    
    # Run tests
    cd /app/e2e
    npm run test:android -- \
        --spec ./specs/**/*.spec.ts \
        --reporter spec \
        --reporter allure \
        --reporter-options outputDir="$TEST_RESULTS_DIR/$target" \
        > "$LOG_DIR/$target/test-run.log" 2>&1
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Tests passed on $target"
    else
        echo "❌ Tests failed on $target (exit code: $exit_code)"
    fi
    
    return $exit_code
}

# Function to generate consolidated report
generate_report() {
    echo "📊 Generating test report..."
    
    # Merge all Allure results
    mkdir -p "$REPORT_DIR/allure-results"
    find "$TEST_RESULTS_DIR" -name "*.json" -o -name "*.xml" | \
        xargs cp -t "$REPORT_DIR/allure-results"
    
    # Generate Allure report
    allure generate "$REPORT_DIR/allure-results" -o "$REPORT_DIR/allure-report" --clean
    
    # Generate summary JSON
    node /app/scripts/generate-summary.js "$TEST_RESULTS_DIR" > "$REPORT_DIR/summary.json"
    
    echo "✅ Report generated at $REPORT_DIR/allure-report"
}

# Main execution
echo "🔧 Test Configuration:"
echo "  - Targets: $TEST_TARGETS"
echo "  - Parallel: $PARALLEL_TESTS"
echo "  - Results: $TEST_RESULTS_DIR"
echo ""

# Parse test targets
IFS=',' read -ra TARGETS <<< "$TEST_TARGETS"

# Define port mappings
declare -A PORT_MAP=(
    ["android-31"]="4723"
    ["android-26"]="4724"
    ["android-21"]="4725"
)

declare -A API_MAP=(
    ["android-31"]="31"
    ["android-26"]="26"
    ["android-21"]="21"
)

# Run tests
if [ "$PARALLEL_TESTS" = "true" ]; then
    echo "🚀 Running tests in parallel..."
    
    # Build command for parallel execution
    COMMANDS=""
    for target in "${TARGETS[@]}"; do
        port=${PORT_MAP[$target]}
        api=${API_MAP[$target]}
        COMMANDS="$COMMANDS \"run_tests_on_target $target $port $api\""
    done
    
    # Export function for subshells
    export -f run_tests_on_target
    
    # Run in parallel using concurrently
    eval "concurrently --prefix \"[{name}]\" --names $(IFS=,; echo \"${TARGETS[*]}\") $COMMANDS"
    
else
    echo "🚶 Running tests sequentially..."
    
    OVERALL_EXIT_CODE=0
    for target in "${TARGETS[@]}"; do
        port=${PORT_MAP[$target]}
        api=${API_MAP[$target]}
        
        run_tests_on_target "$target" "$port" "$api"
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -ne 0 ]; then
            OVERALL_EXIT_CODE=$EXIT_CODE
        fi
    done
fi

# Generate report
generate_report

# Print summary
echo ""
echo "📋 Test Summary:"
echo "==============="
jq . "$REPORT_DIR/summary.json"

# Exit with appropriate code
exit $OVERALL_EXIT_CODE