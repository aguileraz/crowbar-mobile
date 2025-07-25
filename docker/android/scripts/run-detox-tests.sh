#!/bin/bash

# Detox E2E Test Runner for Crowbar Mobile
# Runs Detox tests in headless Android emulator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="${1:-/app/test-results/e2e}"
PROJECT_ROOT="/app"
DETOX_CONFIG="${DETOX_CONFIG:-.detoxrc.js}"
HEADLESS="${HEADLESS:-true}"
TAKE_SCREENSHOTS="${TAKE_SCREENSHOTS:-failure}"
VIDEO_RECORDING="${VIDEO_RECORDING:-false}"
ARTIFACTS_DIR="$OUTPUT_DIR/artifacts"
RETRY_TIMES="${DETOX_RETRY_TIMES:-1}"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Detox installation
check_detox() {
    log_info "Checking Detox installation..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Detox is installed
    if ! npm list detox &> /dev/null; then
        log_error "Detox not found in project dependencies"
        return 1
    fi
    
    # Check Detox configuration
    if [ ! -f "$DETOX_CONFIG" ] && [ ! -f ".detoxrc.json" ]; then
        log_error "Detox configuration file not found"
        return 1
    fi
    
    # Check if detox CLI is available
    if ! npx detox --version &> /dev/null; then
        log_error "Detox CLI not accessible"
        return 1
    fi
    
    log_success "Detox is properly installed"
}

# Configure emulator for headless operation
configure_headless_emulator() {
    log_info "Configuring emulator for headless operation..."
    
    # Set environment variables for headless mode
    export ANDROID_EMULATOR_USE_SYSTEM_LIBS=1
    
    if [ "$HEADLESS" = "true" ]; then
        # Headless emulator flags
        export EMULATOR_HEADLESS=true
        export LD_LIBRARY_PATH=$ANDROID_HOME/emulator/lib64:$ANDROID_HOME/emulator/lib64/qt/lib:$LD_LIBRARY_PATH
        
        # Additional headless configuration
        local emulator_config="$HOME/.android/avd/test_avd.avd/config.ini"
        if [ -f "$emulator_config" ]; then
            # Ensure headless-friendly settings
            sed -i 's/hw.gpu.enabled=.*/hw.gpu.enabled=yes/' "$emulator_config" 2>/dev/null || true
            sed -i 's/hw.gpu.mode=.*/hw.gpu.mode=swiftshader_indirect/' "$emulator_config" 2>/dev/null || true
        fi
        
        log_info "Headless mode enabled"
    else
        log_info "Running with GUI mode"
    fi
}

# Wait for emulator to be ready
wait_for_emulator() {
    log_info "Waiting for emulator to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
            log_success "Emulator is ready"
            
            # Additional stability wait
            sleep 5
            
            # Disable animations for stable tests
            log_info "Disabling animations..."
            adb shell settings put global window_animation_scale 0
            adb shell settings put global transition_animation_scale 0
            adb shell settings put global animator_duration_scale 0
            
            return 0
        fi
        
        ((attempt++))
        log_info "Waiting for emulator... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    log_error "Emulator failed to boot within timeout"
    return 1
}

# Build app for testing
build_app() {
    log_info "Building app for E2E tests..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    log_info "Cleaning previous builds..."
    npx detox clean-framework-cache || true
    
    # Build the app
    if npx detox build --configuration android.emu.debug; then
        log_success "App built successfully"
    else
        log_error "Failed to build app for testing"
        return 1
    fi
}

# Setup test artifacts directory
setup_artifacts() {
    log_info "Setting up artifacts directory..."
    
    mkdir -p "$ARTIFACTS_DIR"
    mkdir -p "$ARTIFACTS_DIR/screenshots"
    mkdir -p "$ARTIFACTS_DIR/videos"
    mkdir -p "$ARTIFACTS_DIR/logs"
    
    # Configure Detox artifacts
    export DETOX_ARTIFACTS_LOCATION="$ARTIFACTS_DIR"
}

# Run Detox tests
run_detox() {
    log_info "Running Detox E2E tests..."
    
    cd "$PROJECT_ROOT"
    
    # Prepare test command
    local detox_cmd="npx detox test"
    
    # Add configuration
    detox_cmd="$detox_cmd --configuration android.emu.debug"
    
    # Add headless flag if needed
    if [ "$HEADLESS" = "true" ]; then
        detox_cmd="$detox_cmd --headless"
    fi
    
    # Add artifacts configuration
    detox_cmd="$detox_cmd --artifacts-location $ARTIFACTS_DIR"
    
    # Configure screenshots
    case "$TAKE_SCREENSHOTS" in
        always)
            detox_cmd="$detox_cmd --take-screenshots all"
            ;;
        failure)
            detox_cmd="$detox_cmd --take-screenshots failing"
            ;;
        manual)
            detox_cmd="$detox_cmd --take-screenshots manual"
            ;;
        *)
            detox_cmd="$detox_cmd --take-screenshots none"
            ;;
    esac
    
    # Add video recording if enabled
    if [ "$VIDEO_RECORDING" = "true" ]; then
        detox_cmd="$detox_cmd --record-videos all"
    else
        detox_cmd="$detox_cmd --record-videos none"
    fi
    
    # Add retry logic
    if [ "$RETRY_TIMES" -gt 0 ]; then
        detox_cmd="$detox_cmd --retries $RETRY_TIMES"
    fi
    
    # Add JSON output for parsing
    local json_output="$OUTPUT_DIR/detox-results.json"
    detox_cmd="$detox_cmd --jest-report-specs --reporters jest-json --outputFile $json_output"
    
    # Add cleanup flag
    detox_cmd="$detox_cmd --cleanup"
    
    # Add loglevel
    detox_cmd="$detox_cmd --loglevel info"
    
    log_info "Executing: $detox_cmd"
    
    # Run tests and capture output
    if $detox_cmd 2>&1 | tee "$OUTPUT_DIR/detox.log"; then
        log_success "Detox tests completed successfully"
        parse_results "$json_output"
        return 0
    else
        log_error "Detox tests failed"
        parse_results "$json_output"
        collect_failure_artifacts
        return 1
    fi
}

# Parse test results
parse_results() {
    local json_file="$1"
    
    if [ ! -f "$json_file" ]; then
        log_warning "Results file not found, checking for Jest output..."
        
        # Try to find Jest results
        json_file="$OUTPUT_DIR/e2e-results.json"
    fi
    
    if [ -f "$json_file" ]; then
        log_info "Parsing test results..."
        
        # Use Jest parser if available
        if [ -f "$(dirname "$0")/parse-jest-results.sh" ]; then
            "$(dirname "$0")/parse-jest-results.sh" "$json_file" "e2e"
        fi
    fi
}

# Collect failure artifacts
collect_failure_artifacts() {
    log_info "Collecting failure artifacts..."
    
    # Copy device logs
    adb logcat -d > "$ARTIFACTS_DIR/logs/device.log" 2>/dev/null || true
    
    # Take a final screenshot
    adb shell screencap -p /sdcard/failure.png && \
        adb pull /sdcard/failure.png "$ARTIFACTS_DIR/screenshots/final-failure.png" && \
        adb shell rm /sdcard/failure.png || true
    
    # List artifacts
    log_info "Artifacts collected in: $ARTIFACTS_DIR"
    find "$ARTIFACTS_DIR" -type f -name "*.png" -o -name "*.mp4" -o -name "*.log" | head -20
}

# Generate HTML report
generate_report() {
    log_info "Generating E2E test report..."
    
    local report_file="$OUTPUT_DIR/index.html"
    
    cat > "$report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Detox E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #333; color: white; padding: 20px; }
        .summary { margin: 20px 0; padding: 20px; background: #f5f5f5; }
        .artifacts { margin: 20px 0; }
        .screenshot { max-width: 300px; margin: 10px; border: 1px solid #ddd; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Detox E2E Test Report</h1>
        <p>Generated: $(date)</p>
    </div>
    <div class="summary">
        <h2>Test Summary</h2>
        <p>Configuration: android.emu.debug</p>
        <p>Headless: $HEADLESS</p>
        <p>Screenshots: $TAKE_SCREENSHOTS</p>
    </div>
    <div class="artifacts">
        <h2>Test Artifacts</h2>
EOF
    
    # Add screenshots
    if ls "$ARTIFACTS_DIR/screenshots"/*.png &> /dev/null; then
        echo "<h3>Screenshots</h3>" >> "$report_file"
        for img in "$ARTIFACTS_DIR/screenshots"/*.png; do
            echo "<img src='artifacts/screenshots/$(basename "$img")' class='screenshot' alt='Test screenshot'>" >> "$report_file"
        done
    fi
    
    echo "</div></body></html>" >> "$report_file"
    
    log_info "HTML report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting Detox E2E test execution..."
    log_info "Output directory: $OUTPUT_DIR"
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Check Detox installation
    if ! check_detox; then
        exit 1
    fi
    
    # Configure headless emulator
    configure_headless_emulator
    
    # Wait for emulator
    if ! wait_for_emulator; then
        exit 1
    fi
    
    # Setup artifacts
    setup_artifacts
    
    # Build app
    if ! build_app; then
        exit 1
    fi
    
    # Run tests
    local test_exit_code=0
    run_detox || test_exit_code=$?
    
    # Generate report
    generate_report
    
    # Summary
    if [ $test_exit_code -eq 0 ]; then
        log_success "E2E tests completed successfully!"
    else
        log_error "E2E tests failed with exit code: $test_exit_code"
    fi
    
    exit $test_exit_code
}

# Parse command line arguments
while [[ $# -gt 1 ]]; do
    case $1 in
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --headless)
            HEADLESS="$2"
            shift 2
            ;;
        --screenshots)
            TAKE_SCREENSHOTS="$2"
            shift 2
            ;;
        --video)
            VIDEO_RECORDING="$2"
            shift 2
            ;;
        --retries)
            RETRY_TIMES="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Update OUTPUT_DIR if provided as first argument
if [ -n "$1" ]; then
    OUTPUT_DIR="$1"
fi

# Run main function
main