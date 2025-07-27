#!/bin/bash

# Screenshot Capture System for Crowbar Mobile
# Captures screenshots on test failures and organizes them for reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCREENSHOTS_DIR="${SCREENSHOTS_DIR:-/app/test-results/screenshots}"
THUMBNAIL_SIZE="${THUMBNAIL_SIZE:-300x200}"
COMPRESS_QUALITY="${COMPRESS_QUALITY:-85}"
MAX_SCREENSHOTS="${MAX_SCREENSHOTS:-50}"
TIMESTAMP_FORMAT="${TIMESTAMP_FORMAT:-%Y%m%d_%H%M%S}"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[SCREENSHOT]${NC} $1"
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

# Setup screenshot directory
setup_screenshot_dir() {
    log_info "Setting up screenshot directory: $SCREENSHOTS_DIR"
    
    mkdir -p "$SCREENSHOTS_DIR"
    mkdir -p "$SCREENSHOTS_DIR/failures"
    mkdir -p "$SCREENSHOTS_DIR/thumbnails"
    mkdir -p "$SCREENSHOTS_DIR/originals"
    
    # Create index file
    echo "# Screenshot Index" > "$SCREENSHOTS_DIR/index.md"
    echo "Generated: $(date)" >> "$SCREENSHOTS_DIR/index.md"
    echo "" >> "$SCREENSHOTS_DIR/index.md"
}

# Check if emulator is available
check_emulator() {
    if ! adb devices | grep -q "emulator.*device"; then
        log_error "No emulator device available for screenshots"
        return 1
    fi
    
    # Check if screen is accessible
    if ! adb shell dumpsys window displays &> /dev/null; then
        log_error "Cannot access emulator display"
        return 1
    fi
    
    return 0
}

# Capture screenshot from emulator
capture_emulator_screenshot() {
    local filename="$1"
    local description="$2"
    local timestamp=$(date +"$TIMESTAMP_FORMAT")
    local screenshot_file="$SCREENSHOTS_DIR/originals/${timestamp}_${filename}.png"
    
    log_info "Capturing emulator screenshot: $filename"
    
    # Capture screenshot
    if adb shell screencap -p /sdcard/screenshot.png && \
       adb pull /sdcard/screenshot.png "$screenshot_file" &> /dev/null && \
       adb shell rm /sdcard/screenshot.png; then
        
        log_success "Screenshot captured: $screenshot_file"
        
        # Create thumbnail if convert is available
        create_thumbnail "$screenshot_file" "$filename"
        
        # Add to index
        add_to_index "$screenshot_file" "$filename" "$description"
        
        echo "$screenshot_file"
        return 0
    else
        log_error "Failed to capture screenshot"
        return 1
    fi
}

# Create thumbnail version
create_thumbnail() {
    local original_file="$1"
    local filename="$2"
    local thumbnail_file="$SCREENSHOTS_DIR/thumbnails/thumb_$(basename "$original_file")"
    
    # Try using convert (ImageMagick)
    if command -v convert &> /dev/null; then
        if convert "$original_file" -resize "$THUMBNAIL_SIZE" -quality "$COMPRESS_QUALITY" "$thumbnail_file" 2>/dev/null; then
            log_info "Thumbnail created: $thumbnail_file"
            return 0
        fi
    fi
    
    # Fallback: copy original
    cp "$original_file" "$thumbnail_file"
    log_warning "Thumbnail creation failed, using original file"
}

# Add screenshot to index
add_to_index() {
    local screenshot_file="$1"
    local filename="$2"
    local description="$3"
    local timestamp=$(date)
    
    cat >> "$SCREENSHOTS_DIR/index.md" <<EOF
## $(basename "$screenshot_file")
- **Test:** $filename
- **Description:** $description
- **Timestamp:** $timestamp
- **Path:** $screenshot_file

EOF
}

# Capture screenshot on test failure
capture_on_failure() {
    local test_name="$1"
    local error_message="$2"
    local test_type="${3:-unknown}"
    
    log_info "Capturing failure screenshot for: $test_name"
    
    # Ensure emulator is available
    if ! check_emulator; then
        return 1
    fi
    
    # Clean test name for filename
    local clean_name=$(echo "$test_name" | sed 's/[^a-zA-Z0-9._-]/_/g' | cut -c1-50)
    local description="Test failure: $test_name"
    
    if [ -n "$error_message" ]; then
        description="$description - Error: $(echo "$error_message" | cut -c1-100)"
    fi
    
    # Capture the screenshot
    local screenshot_path=$(capture_emulator_screenshot "failure_${test_type}_${clean_name}" "$description")
    
    if [ -n "$screenshot_path" ]; then
        # Copy to failures directory for easy access
        cp "$screenshot_path" "$SCREENSHOTS_DIR/failures/"
        
        # Create failure report
        create_failure_report "$test_name" "$error_message" "$screenshot_path"
        
        return 0
    else
        return 1
    fi
}

# Create detailed failure report
create_failure_report() {
    local test_name="$1"
    local error_message="$2"
    local screenshot_path="$3"
    local report_file="$SCREENSHOTS_DIR/failures/$(basename "$screenshot_path" .png).txt"
    
    cat > "$report_file" <<EOF
Test Failure Report
==================

Test Name: $test_name
Timestamp: $(date)
Screenshot: $screenshot_path

Error Details:
$error_message

Device Information:
$(adb shell getprop ro.build.version.sdk 2>/dev/null | sed 's/^/API Level: /')
$(adb shell getprop ro.product.model 2>/dev/null | sed 's/^/Device: /')
$(adb shell getprop ro.build.display.id 2>/dev/null | sed 's/^/Build: /')

Screen Information:
$(adb shell dumpsys window displays 2>/dev/null | grep -E "Display|size|density" | head -5)

Memory Information:
$(adb shell dumpsys meminfo 2>/dev/null | grep -E "Total RAM|Free RAM|Used RAM" | head -3)
EOF
    
    log_info "Failure report created: $report_file"
}

# Capture screenshot series during test execution
capture_series() {
    local test_name="$1"
    local interval="${2:-5}"
    local max_captures="${3:-10}"
    local series_dir="$SCREENSHOTS_DIR/series_$(date +%s)"
    
    log_info "Starting screenshot series for: $test_name (interval: ${interval}s, max: $max_captures)"
    
    mkdir -p "$series_dir"
    
    for i in $(seq 1 "$max_captures"); do
        if check_emulator; then
            local screenshot_file="$series_dir/step_$(printf "%03d" $i).png"
            adb shell screencap -p /sdcard/screenshot.png && \
            adb pull /sdcard/screenshot.png "$screenshot_file" &> /dev/null && \
            adb shell rm /sdcard/screenshot.png
            
            log_info "Series capture $i/$max_captures"
            
            if [ $i -lt "$max_captures" ]; then
                sleep "$interval"
            fi
        else
            log_warning "Emulator not available, stopping series"
            break
        fi
    done
    
    log_success "Screenshot series completed: $series_dir"
    echo "$series_dir"
}

# Clean old screenshots
cleanup_old_screenshots() {
    local days="${1:-7}"
    
    log_info "Cleaning screenshots older than $days days..."
    
    # Clean originals
    find "$SCREENSHOTS_DIR/originals" -name "*.png" -mtime +$days -delete 2>/dev/null || true
    
    # Clean thumbnails
    find "$SCREENSHOTS_DIR/thumbnails" -name "*.png" -mtime +$days -delete 2>/dev/null || true
    
    # Clean failure reports
    find "$SCREENSHOTS_DIR/failures" -name "*.txt" -mtime +$days -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Generate screenshot gallery HTML
generate_gallery() {
    local gallery_file="$SCREENSHOTS_DIR/gallery.html"
    
    log_info "Generating screenshot gallery..."
    
    cat > "$gallery_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Screenshot Gallery</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 30px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .screenshot { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .screenshot img { width: 100%; height: auto; border-radius: 4px; }
        .screenshot .info { margin-top: 10px; font-size: 0.9em; color: #666; }
        .screenshot .timestamp { font-size: 0.8em; color: #999; }
        .failure { border-left: 4px solid #dc3545; }
        .success { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Screenshots Gallery</h1>
        <p>Generated: $(date)</p>
    </div>
    <div class="gallery">
EOF
    
    # Add screenshots
    for screenshot in "$SCREENSHOTS_DIR/originals"/*.png; do
        if [ -f "$screenshot" ]; then
            local filename=$(basename "$screenshot")
            local timestamp=$(stat -c %y "$screenshot" 2>/dev/null || stat -f "%Sm" "$screenshot" 2>/dev/null || echo "Unknown")
            local class_name="screenshot"
            
            if [[ "$filename" == *"failure"* ]]; then
                class_name="screenshot failure"
            fi
            
            cat >> "$gallery_file" <<EOF
        <div class="$class_name">
            <img src="originals/$filename" alt="$filename">
            <div class="info">$filename</div>
            <div class="timestamp">$timestamp</div>
        </div>
EOF
        fi
    done
    
    cat >> "$gallery_file" <<EOF
    </div>
</body>
</html>
EOF
    
    log_success "Screenshot gallery generated: $gallery_file"
}

# Main function
main() {
    local action="${1:-setup}"
    shift
    
    case "$action" in
        setup)
            setup_screenshot_dir
            ;;
        capture)
            local test_name="${1:-unknown_test}"
            local description="${2:-Test screenshot}"
            
            if ! check_emulator; then
                exit 1
            fi
            
            setup_screenshot_dir
            capture_emulator_screenshot "$test_name" "$description"
            ;;
        failure)
            local test_name="${1:-unknown_test}"
            local error_message="${2:-Test failed}"
            local test_type="${3:-unknown}"
            
            setup_screenshot_dir
            capture_on_failure "$test_name" "$error_message" "$test_type"
            ;;
        series)
            local test_name="${1:-test_series}"
            local interval="${2:-5}"
            local max_captures="${3:-10}"
            
            setup_screenshot_dir
            capture_series "$test_name" "$interval" "$max_captures"
            ;;
        cleanup)
            local days="${1:-7}"
            cleanup_old_screenshots "$days"
            ;;
        gallery)
            generate_gallery
            ;;
        *)
            echo "Usage: $0 {setup|capture|failure|series|cleanup|gallery} [options]"
            echo
            echo "Actions:"
            echo "  setup                           - Setup screenshot directories"
            echo "  capture <name> [description]    - Capture a screenshot"
            echo "  failure <test> [error] [type]   - Capture screenshot on test failure"
            echo "  series <test> [interval] [max]  - Capture screenshot series"
            echo "  cleanup [days]                  - Clean old screenshots (default: 7 days)"
            echo "  gallery                         - Generate HTML gallery"
            echo
            echo "Environment Variables:"
            echo "  SCREENSHOTS_DIR     - Output directory (default: /app/test-results/screenshots)"
            echo "  THUMBNAIL_SIZE      - Thumbnail size (default: 300x200)"
            echo "  COMPRESS_QUALITY    - JPEG quality (default: 85)"
            echo "  MAX_SCREENSHOTS     - Maximum screenshots (default: 50)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"