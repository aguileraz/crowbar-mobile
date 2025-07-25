#!/bin/bash

# APK Installation Script for Crowbar Mobile
# Installs APK with comprehensive error handling and validation

set -e  # Exit on error
trap 'echo "Error occurred at line $LINENO"' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
RETRY_DELAY=2
TIMEOUT=300  # 5 minutes for installation

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

# Function to check ADB connection
check_adb_connection() {
    log_info "Checking ADB connection..."
    
    # Check if adb is available
    if ! command -v adb &> /dev/null; then
        log_error "ADB not found in PATH"
        return 1
    fi
    
    # Check device connection
    local device_count=$(adb devices | grep -c "device$" || true)
    
    if [ "$device_count" -eq 0 ]; then
        log_error "No devices connected"
        return 1
    elif [ "$device_count" -gt 1 ]; then
        log_warning "Multiple devices connected, using first one"
    fi
    
    # Get device state
    local device_state=$(adb get-state 2>/dev/null || echo "unknown")
    
    if [ "$device_state" != "device" ]; then
        log_error "Device not ready (state: $device_state)"
        return 1
    fi
    
    log_success "ADB connection verified"
    return 0
}

# Function to validate APK file
validate_apk_file() {
    local apk_file="$1"
    
    log_info "Validating APK file: $apk_file"
    
    # Check if file exists
    if [ ! -f "$apk_file" ]; then
        log_error "APK file not found: $apk_file"
        return 1
    fi
    
    # Check file extension
    if [[ ! "$apk_file" =~ \.apk$ ]]; then
        log_error "File does not have .apk extension"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -c%s "$apk_file" 2>/dev/null || stat -f%z "$apk_file" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        log_error "APK file is empty"
        return 1
    fi
    
    log_success "APK file validation passed"
    return 0
}

# Function to uninstall existing app
uninstall_existing_app() {
    local package_name="$1"
    
    log_info "Checking if app is already installed..."
    
    if adb shell pm list packages | grep -q "^package:${package_name}$"; then
        log_warning "App already installed, uninstalling..."
        
        if adb uninstall "$package_name"; then
            log_success "Existing app uninstalled"
        else
            log_error "Failed to uninstall existing app"
            return 1
        fi
    else
        log_info "App not previously installed"
    fi
    
    return 0
}

# Function to install APK with retries
install_apk_with_retries() {
    local apk_file="$1"
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Installation attempt $attempt/$MAX_RETRIES..."
        
        if timeout $TIMEOUT adb install -r "$apk_file" 2>&1 | tee /tmp/install.log; then
            log_success "APK installed successfully"
            return 0
        else
            log_warning "Installation attempt $attempt failed"
            
            # Check for specific error messages
            if grep -q "INSTALL_FAILED_INSUFFICIENT_STORAGE" /tmp/install.log; then
                log_error "Insufficient storage on device"
                return 1
            elif grep -q "INSTALL_FAILED_VERSION_DOWNGRADE" /tmp/install.log; then
                log_error "Cannot downgrade app version"
                return 1
            fi
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log_info "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
        
        ((attempt++))
    done
    
    log_error "Failed to install APK after $MAX_RETRIES attempts"
    return 1
}

# Function to get package name from APK
get_package_name() {
    local apk_file="$1"
    
    # Try using aapt if available
    if command -v aapt &> /dev/null; then
        aapt dump badging "$apk_file" 2>/dev/null | grep "package:" | sed "s/.*name='\([^']*\)'.*/\1/"
    else
        # Fallback: install and get package name from recent installs
        echo ""
    fi
}

# Main installation function
main() {
    local apk_file="${1:-}"
    local force_install="${2:-false}"
    
    # Validate arguments
    if [ -z "$apk_file" ]; then
        log_error "Usage: $0 <apk_file> [force_install]"
        exit 1
    fi
    
    log_info "Starting APK installation process..."
    log_info "APK file: $apk_file"
    
    # Validate APK file
    if ! validate_apk_file "$apk_file"; then
        exit 1
    fi
    
    # Check ADB connection
    if ! check_adb_connection; then
        exit 1
    fi
    
    # Get package name if possible
    local package_name=$(get_package_name "$apk_file")
    if [ -n "$package_name" ]; then
        log_info "Package name: $package_name"
        
        # Uninstall existing app if not forcing install
        if [ "$force_install" != "true" ] && [ -n "$package_name" ]; then
            uninstall_existing_app "$package_name" || true
        fi
    fi
    
    # Install APK
    if ! install_apk_with_retries "$apk_file"; then
        exit 1
    fi
    
    # Verify installation
    if [ -n "$package_name" ] && command -v verify-installation.sh &> /dev/null; then
        log_info "Verifying installation..."
        if verify-installation.sh "$package_name"; then
            log_success "Installation verified successfully"
        else
            log_warning "Installation verification failed"
        fi
    fi
    
    log_success "APK installation completed successfully!"
    
    # Display app info
    if [ -n "$package_name" ]; then
        echo
        log_info "App Information:"
        adb shell pm dump "$package_name" | grep -E "versionCode|versionName" | head -2 || true
    fi
}

# Run main function
main "$@"