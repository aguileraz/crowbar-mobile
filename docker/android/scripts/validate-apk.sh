#!/bin/bash

# APK Validation Script for Crowbar Mobile
# Validates APK files for installation readiness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_SDK_VERSION=21  # Android 5.0
MAX_SDK_VERSION=34  # Android 14
EXPECTED_PACKAGE_PREFIX="com.crowbarmobile"

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

# Function to check if required tools are available
check_tools() {
    local missing_tools=()
    
    if ! command -v aapt &> /dev/null; then
        missing_tools+=("aapt")
    fi
    
    if ! command -v apksigner &> /dev/null && ! command -v jarsigner &> /dev/null; then
        missing_tools+=("apksigner or jarsigner")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Install missing tools with: apt-get install aapt apksigner"
        return 1
    fi
    
    return 0
}

# Function to validate APK structure
validate_apk_structure() {
    local apk_file="$1"
    
    log_info "Validating APK structure..."
    
    # Check if it's a valid ZIP file
    if ! unzip -t "$apk_file" &> /dev/null; then
        log_error "APK is not a valid ZIP archive"
        return 1
    fi
    
    # Check for required files
    local required_files=("AndroidManifest.xml" "classes.dex" "resources.arsc")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if ! unzip -l "$apk_file" | grep -q "$file"; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Missing required files: ${missing_files[*]}"
        return 1
    fi
    
    log_success "APK structure is valid"
    return 0
}

# Function to validate package name
validate_package_name() {
    local apk_file="$1"
    
    log_info "Validating package name..."
    
    local package_info=$(aapt dump badging "$apk_file" 2>/dev/null | grep "package:")
    
    if [ -z "$package_info" ]; then
        log_error "Could not extract package information"
        return 1
    fi
    
    local package_name=$(echo "$package_info" | sed "s/.*name='\([^']*\)'.*/\1/")
    local version_code=$(echo "$package_info" | sed "s/.*versionCode='\([^']*\)'.*/\1/")
    local version_name=$(echo "$package_info" | sed "s/.*versionName='\([^']*\)'.*/\1/")
    
    log_info "Package: $package_name"
    log_info "Version: $version_name ($version_code)"
    
    # Validate package name format
    if [[ ! "$package_name" =~ ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$ ]]; then
        log_error "Invalid package name format"
        return 1
    fi
    
    # Check if package name matches expected prefix (warning only)
    if [ -n "$EXPECTED_PACKAGE_PREFIX" ] && [[ ! "$package_name" =~ ^$EXPECTED_PACKAGE_PREFIX ]]; then
        log_warning "Package name does not match expected prefix: $EXPECTED_PACKAGE_PREFIX"
    fi
    
    log_success "Package name is valid"
    return 0
}

# Function to validate API levels
validate_api_levels() {
    local apk_file="$1"
    
    log_info "Validating API level compatibility..."
    
    local sdk_info=$(aapt dump badging "$apk_file" 2>/dev/null | grep "sdkVersion:")
    
    if [ -z "$sdk_info" ]; then
        log_error "Could not extract SDK version information"
        return 1
    fi
    
    local min_sdk=$(echo "$sdk_info" | sed "s/.*minSdkVersion:'\([^']*\)'.*/\1/")
    local target_sdk=$(echo "$sdk_info" | grep "targetSdkVersion:" | sed "s/.*targetSdkVersion:'\([^']*\)'.*/\1/")
    
    log_info "Min SDK Version: $min_sdk (Android $(get_android_version $min_sdk))"
    
    if [ -n "$target_sdk" ]; then
        log_info "Target SDK Version: $target_sdk (Android $(get_android_version $target_sdk))"
    fi
    
    # Check minimum SDK version
    if [ "$min_sdk" -lt "$MIN_SDK_VERSION" ]; then
        log_error "Min SDK version ($min_sdk) is below required minimum ($MIN_SDK_VERSION)"
        return 1
    fi
    
    # Check if target SDK is too high (warning only)
    if [ -n "$target_sdk" ] && [ "$target_sdk" -gt "$MAX_SDK_VERSION" ]; then
        log_warning "Target SDK version ($target_sdk) is above tested maximum ($MAX_SDK_VERSION)"
    fi
    
    log_success "API levels are compatible"
    return 0
}

# Function to get Android version name from API level
get_android_version() {
    local api_level=$1
    
    case $api_level in
        21) echo "5.0" ;;
        22) echo "5.1" ;;
        23) echo "6.0" ;;
        24) echo "7.0" ;;
        25) echo "7.1" ;;
        26) echo "8.0" ;;
        27) echo "8.1" ;;
        28) echo "9.0" ;;
        29) echo "10" ;;
        30) echo "11" ;;
        31) echo "12" ;;
        32) echo "12L" ;;
        33) echo "13" ;;
        34) echo "14" ;;
        *) echo "Unknown" ;;
    esac
}

# Function to validate APK signature
validate_signature() {
    local apk_file="$1"
    
    log_info "Validating APK signature..."
    
    # Try apksigner first (preferred)
    if command -v apksigner &> /dev/null; then
        if apksigner verify --verbose "$apk_file" &> /tmp/apksigner.log; then
            log_success "APK signature is valid (apksigner)"
            
            # Extract certificate info
            local cert_info=$(grep "Signer #1" -A 5 /tmp/apksigner.log | grep "Subject:" || true)
            if [ -n "$cert_info" ]; then
                log_info "Certificate: $cert_info"
            fi
            
            return 0
        else
            log_error "APK signature verification failed"
            cat /tmp/apksigner.log
            return 1
        fi
    # Fallback to jarsigner
    elif command -v jarsigner &> /dev/null; then
        if jarsigner -verify -verbose -certs "$apk_file" &> /tmp/jarsigner.log; then
            if grep -q "jar verified" /tmp/jarsigner.log; then
                log_success "APK signature is valid (jarsigner)"
                return 0
            fi
        fi
        
        log_error "APK signature verification failed"
        grep "Warning:" /tmp/jarsigner.log || true
        return 1
    else
        log_warning "No signature verification tool available"
        return 0
    fi
}

# Function to check permissions
check_permissions() {
    local apk_file="$1"
    
    log_info "Checking app permissions..."
    
    local permissions=$(aapt dump permissions "$apk_file" 2>/dev/null | grep "uses-permission:" | sed "s/.*name='\([^']*\)'.*/\1/")
    
    if [ -z "$permissions" ]; then
        log_info "No permissions requested"
    else
        log_info "Permissions requested:"
        echo "$permissions" | while read -r perm; do
            echo "  - $perm"
        done
        
        # Check for dangerous permissions
        local dangerous_perms=$(echo "$permissions" | grep -E "CAMERA|RECORD_AUDIO|READ_CONTACTS|ACCESS_FINE_LOCATION|READ_SMS" || true)
        if [ -n "$dangerous_perms" ]; then
            log_warning "App requests dangerous permissions:"
            echo "$dangerous_perms" | while read -r perm; do
                echo "  ! $perm"
            done
        fi
    fi
    
    return 0
}

# Function to display APK info summary
display_apk_summary() {
    local apk_file="$1"
    
    echo
    log_info "APK Summary:"
    echo "======================================"
    
    # File info
    local file_size=$(ls -lh "$apk_file" | awk '{print $5}')
    echo "File: $(basename "$apk_file")"
    echo "Size: $file_size"
    
    # Package info
    local badging=$(aapt dump badging "$apk_file" 2>/dev/null)
    
    local package_name=$(echo "$badging" | grep "package:" | sed "s/.*name='\([^']*\)'.*/\1/")
    local app_label=$(echo "$badging" | grep "application-label:" | head -1 | sed "s/.*application-label:'\([^']*\)'.*/\1/")
    
    echo "Package: $package_name"
    echo "App Name: $app_label"
    
    # Activity info
    local main_activity=$(echo "$badging" | grep "launchable-activity:" | sed "s/.*name='\([^']*\)'.*/\1/")
    if [ -n "$main_activity" ]; then
        echo "Main Activity: $main_activity"
    fi
    
    echo "======================================"
}

# Main validation function
main() {
    local apk_file="${1:-}"
    
    # Validate arguments
    if [ -z "$apk_file" ]; then
        log_error "Usage: $0 <apk_file>"
        exit 1
    fi
    
    # Check if file exists
    if [ ! -f "$apk_file" ]; then
        log_error "APK file not found: $apk_file"
        exit 1
    fi
    
    log_info "Starting APK validation..."
    log_info "APK file: $apk_file"
    echo
    
    # Check required tools
    if ! check_tools; then
        exit 1
    fi
    
    # Run validation checks
    local validation_failed=0
    
    if ! validate_apk_structure "$apk_file"; then
        ((validation_failed++))
    fi
    
    if ! validate_package_name "$apk_file"; then
        ((validation_failed++))
    fi
    
    if ! validate_api_levels "$apk_file"; then
        ((validation_failed++))
    fi
    
    if ! validate_signature "$apk_file"; then
        ((validation_failed++))
    fi
    
    # Non-critical checks
    check_permissions "$apk_file"
    
    # Display summary
    display_apk_summary "$apk_file"
    
    # Final result
    echo
    if [ $validation_failed -eq 0 ]; then
        log_success "APK validation completed successfully!"
        log_info "The APK is ready for installation"
        exit 0
    else
        log_error "APK validation failed with $validation_failed error(s)"
        exit 1
    fi
}

# Run main function
main "$@"