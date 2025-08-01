#!/bin/bash

# Installation Verification Script for Crowbar Mobile
# Verifies that an app was installed correctly and can launch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAUNCH_TIMEOUT=10
ACTIVITY_CHECK_RETRIES=5
ACTIVITY_CHECK_DELAY=2

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

# Function to check if package is installed
check_package_installed() {
    local package_name="$1"
    
    log_info "Checking if package is installed: $package_name"
    
    if adb shell pm list packages | grep -q "^package:${package_name}$"; then
        log_success "Package is installed"
        
        # Get package path
        local package_path=$(adb shell pm path "$package_name" | grep "package:" | cut -d: -f2)
        if [ -n "$package_path" ]; then
            log_info "Package path: $package_path"
        fi
        
        return 0
    else
        log_error "Package not found in installed packages"
        return 1
    fi
}

# Function to get app info
get_app_info() {
    local package_name="$1"
    
    log_info "Getting app information..."
    
    # Get version info
    local version_info=$(adb shell dumpsys package "$package_name" | grep -E "versionCode|versionName" | head -2)
    if [ -n "$version_info" ]; then
        echo "$version_info" | while read -r line; do
            log_info "  $line"
        done
    fi
    
    # Get install time
    local install_time=$(adb shell dumpsys package "$package_name" | grep "firstInstallTime" | head -1)
    if [ -n "$install_time" ]; then
        log_info "  $install_time"
    fi
    
    # Get data directory
    local data_dir=$(adb shell pm path "$package_name" | grep "data" || true)
    if [ -n "$data_dir" ]; then
        log_info "  Data directory: $data_dir"
    fi
}

# Function to check app permissions
check_app_permissions() {
    local package_name="$1"
    
    log_info "Checking granted permissions..."
    
    local granted_perms=$(adb shell dumpsys package "$package_name" | grep -A 100 "granted=true" | grep "android.permission" | sed 's/.*android.permission.//' | sort -u)
    
    if [ -n "$granted_perms" ]; then
        local perm_count=$(echo "$granted_perms" | wc -l)
        log_info "  $perm_count permissions granted"
        
        # Check for critical permissions
        if echo "$granted_perms" | grep -q "INTERNET"; then
            log_success "  ✓ INTERNET permission granted"
        fi
    else
        log_warning "  No permissions granted"
    fi
}

# Function to find main activity
find_main_activity() {
    local package_name="$1"
    
    log_info "Finding main activity..."
    
    # Method 1: Check for MAIN/LAUNCHER activity
    local main_activity=$(adb shell cmd package resolve-activity --brief "$package_name" | tail -n 1)
    
    if [ -n "$main_activity" ] && [ "$main_activity" != "No activity found" ]; then
        echo "$main_activity"
        return 0
    fi
    
    # Method 2: Parse from package dump
    main_activity=$(adb shell dumpsys package "$package_name" | grep -A 5 "android.intent.action.MAIN" | grep "$package_name" | head -1 | awk '{print $2}')
    
    if [ -n "$main_activity" ]; then
        echo "$main_activity"
        return 0
    fi
    
    # Method 3: Use monkey to find launchable activity
    main_activity=$(adb shell monkey -p "$package_name" -c android.intent.category.LAUNCHER 0 2>&1 | grep "Using main activity" | awk '{print $4}')
    
    if [ -n "$main_activity" ]; then
        echo "$main_activity"
        return 0
    fi
    
    return 1
}

# Function to launch app
launch_app() {
    local package_name="$1"
    
    log_info "Attempting to launch app..."
    
    # Find main activity
    local main_activity=$(find_main_activity "$package_name")
    
    if [ -z "$main_activity" ]; then
        log_error "Could not find main activity"
        
        # Try launching with monkey as fallback
        log_info "Attempting to launch with monkey..."
        if adb shell monkey -p "$package_name" -c android.intent.category.LAUNCHER 1 &> /tmp/monkey.log; then
            log_success "App launched with monkey"
            return 0
        else
            log_error "Failed to launch app"
            return 1
        fi
    fi
    
    log_info "Main activity: $main_activity"
    
    # Clear logcat
    adb logcat -c
    
    # Launch activity
    if adb shell am start -n "$main_activity" -W &> /tmp/launch.log; then
        log_success "App launch command executed"
        
        # Check launch result
        if grep -q "Complete" /tmp/launch.log; then
            local launch_time=$(grep "TotalTime:" /tmp/launch.log | awk '{print $2}')
            log_success "App launched successfully (${launch_time}ms)"
            return 0
        elif grep -q "does not exist" /tmp/launch.log; then
            log_error "Activity does not exist"
            return 1
        fi
    else
        log_error "Failed to execute launch command"
        cat /tmp/launch.log
        return 1
    fi
}

# Function to check if app is running
check_app_running() {
    local package_name="$1"
    local retries=$ACTIVITY_CHECK_RETRIES
    
    log_info "Checking if app is running..."
    
    while [ $retries -gt 0 ]; do
        # Check for running processes
        if adb shell ps | grep -q "$package_name"; then
            log_success "App process is running"
            
            # Check for visible activities
            local current_activity=$(adb shell dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" | grep "$package_name" || true)
            
            if [ -n "$current_activity" ]; then
                log_success "App has visible activity"
                log_info "  $current_activity"
            fi
            
            return 0
        fi
        
        ((retries--))
        if [ $retries -gt 0 ]; then
            log_info "Waiting for app to start... ($retries retries left)"
            sleep $ACTIVITY_CHECK_DELAY
        fi
    done
    
    log_error "App process not found after multiple checks"
    return 1
}

# Function to capture screenshot
capture_screenshot() {
    local package_name="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local screenshot_file="/tmp/${package_name}_${timestamp}.png"
    
    log_info "Capturing screenshot..."
    
    if adb shell screencap -p /sdcard/screenshot.png && \
       adb pull /sdcard/screenshot.png "$screenshot_file" &> /dev/null && \
       adb shell rm /sdcard/screenshot.png; then
        log_success "Screenshot saved: $screenshot_file"
    else
        log_warning "Failed to capture screenshot"
    fi
}

# Function to check for crashes
check_for_crashes() {
    local package_name="$1"
    
    log_info "Checking for crashes..."
    
    # Check logcat for crashes
    local crash_count=$(adb logcat -d | grep -E "FATAL EXCEPTION|AndroidRuntime.*$package_name" | wc -l)
    
    if [ "$crash_count" -gt 0 ]; then
        log_error "Found $crash_count crash(es) in logcat"
        
        # Save crash log
        adb logcat -d | grep -A 20 -B 5 "FATAL EXCEPTION" > /tmp/${package_name}_crash.log
        log_info "Crash log saved to /tmp/${package_name}_crash.log"
        
        return 1
    else
        log_success "No crashes detected"
        return 0
    fi
}

# Main verification function
main() {
    local package_name="${1:-}"
    local skip_launch="${2:-false}"
    
    # Validate arguments
    if [ -z "$package_name" ]; then
        log_error "Usage: $0 <package_name> [skip_launch]"
        exit 1
    fi
    
    log_info "Starting installation verification..."
    log_info "Package: $package_name"
    echo
    
    # Check if package is installed
    if ! check_package_installed "$package_name"; then
        exit 1
    fi
    
    # Get app information
    get_app_info "$package_name"
    
    # Check permissions
    check_app_permissions "$package_name"
    
    # Launch app (unless skipped)
    if [ "$skip_launch" != "true" ]; then
        if launch_app "$package_name"; then
            # Wait a moment for app to fully start
            sleep 3
            
            # Check if app is running
            if check_app_running "$package_name"; then
                # Capture screenshot as proof
                capture_screenshot "$package_name"
                
                # Check for crashes
                check_for_crashes "$package_name"
            fi
        else
            log_warning "App launch failed, but installation was successful"
        fi
    else
        log_info "Skipping app launch test"
    fi
    
    echo
    log_success "Installation verification completed!"
    
    # Summary
    echo "======================================"
    echo "Verification Summary:"
    echo "  ✓ Package installed: YES"
    echo "  ✓ App info retrieved: YES"
    
    if [ "$skip_launch" != "true" ]; then
        if check_app_running "$package_name" &> /dev/null; then
            echo "  ✓ App launches: YES"
            echo "  ✓ App running: YES"
        else
            echo "  ! App launches: FAILED"
        fi
    fi
    
    echo "======================================"
}

# Run main function
main "$@"