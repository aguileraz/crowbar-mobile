#!/bin/bash

# Crowbar Mobile - Production Build Script
# Este script prepara e executa builds de produção para Android e iOS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="CrowbarMobile"
ANDROID_PACKAGE="com.crowbar.mobile"
IOS_SCHEME="CrowbarMobile"
BUILD_DIR="./build"
ANDROID_BUILD_DIR="./android/app/build/outputs"
IOS_BUILD_DIR="./ios/build"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on CI
is_ci() {
    [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf $BUILD_DIR/temp
}

# Trap cleanup on exit
trap cleanup EXIT

# Main build function
main() {
    log_info "🚀 Starting Crowbar Mobile production build..."
    
    # Parse command line arguments
    PLATFORM=""
    BUILD_TYPE="release"
    SKIP_TESTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            --build-type)
                BUILD_TYPE="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validate platform
    if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "both" ]]; then
        log_error "Platform must be 'android', 'ios', or 'both'"
        show_help
        exit 1
    fi
    
    # Setup environment
    setup_environment
    
    # Run pre-build checks
    pre_build_checks
    
    # Install dependencies
    install_dependencies
    
    # Run tests (unless skipped)
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    # Build based on platform
    case $PLATFORM in
        android)
            build_android
            ;;
        ios)
            build_ios
            ;;
        both)
            build_android
            build_ios
            ;;
    esac
    
    # Post-build tasks
    post_build_tasks
    
    log_success "🎉 Build completed successfully!"
}

show_help() {
    echo "Crowbar Mobile Production Build Script"
    echo ""
    echo "Usage: $0 --platform <android|ios|both> [options]"
    echo ""
    echo "Options:"
    echo "  --platform <platform>    Target platform (android, ios, or both)"
    echo "  --build-type <type>      Build type (release, debug) [default: release]"
    echo "  --skip-tests            Skip running tests"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform android"
    echo "  $0 --platform both --skip-tests"
    echo "  $0 --platform ios --build-type debug"
}

setup_environment() {
    log_info "Setting up build environment..."
    
    # Set environment variables
    export NODE_ENV=production
    export BUILD_TYPE=production
    
    # Create build directory
    mkdir -p $BUILD_DIR
    mkdir -p $BUILD_DIR/temp
    
    # Set React Native environment
    export RN_SRC_EXT=ts,tsx
    
    log_success "Environment setup completed"
}

pre_build_checks() {
    log_info "Running pre-build checks..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check npm version
    NPM_VERSION=$(npm --version)
    log_info "npm version: $NPM_VERSION"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check if React Native CLI is available
    if ! command -v npx react-native &> /dev/null; then
        log_error "React Native CLI not found"
        exit 1
    fi
    
    # Platform-specific checks
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        check_android_requirements
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        check_ios_requirements
    fi
    
    log_success "Pre-build checks passed"
}

check_android_requirements() {
    log_info "Checking Android requirements..."
    
    # Check Java version
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        log_info "Java version: $JAVA_VERSION"
    else
        log_error "Java not found. Please install Java 17 or higher."
        exit 1
    fi
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        log_error "ANDROID_HOME environment variable not set"
        exit 1
    fi
    
    # Check if gradlew exists
    if [ ! -f "android/gradlew" ]; then
        log_error "Gradle wrapper not found in android directory"
        exit 1
    fi
    
    log_success "Android requirements satisfied"
}

check_ios_requirements() {
    log_info "Checking iOS requirements..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS builds require macOS"
        exit 1
    fi
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        log_error "Xcode not found. Please install Xcode."
        exit 1
    fi
    
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    log_info "Xcode version: $XCODE_VERSION"
    
    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        log_error "CocoaPods not found. Please install CocoaPods."
        exit 1
    fi
    
    log_success "iOS requirements satisfied"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install npm dependencies
    npm ci
    
    # iOS-specific dependencies
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            log_info "Installing iOS dependencies..."
            cd ios
            pod install --repo-update
            cd ..
        fi
    fi
    
    log_success "Dependencies installed"
}

run_tests() {
    log_info "Running tests..."
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint
    
    # Run type checking
    log_info "Running TypeScript check..."
    npx tsc --noEmit
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:unit -- --coverage --watchAll=false
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration -- --watchAll=false
    
    log_success "All tests passed"
}

build_android() {
    log_info "Building Android app..."
    
    cd android
    
    # Clean previous builds
    ./gradlew clean
    
    # Build based on build type
    if [ "$BUILD_TYPE" = "release" ]; then
        log_info "Building Android release AAB..."
        ./gradlew bundleRelease
        
        # Also build APK for testing
        log_info "Building Android release APK..."
        ./gradlew assembleRelease
        
        # Copy outputs to build directory
        cp app/build/outputs/bundle/release/app-release.aab ../$BUILD_DIR/
        cp app/build/outputs/apk/release/app-release.apk ../$BUILD_DIR/
        
        log_success "Android release build completed"
        log_info "AAB: $BUILD_DIR/app-release.aab"
        log_info "APK: $BUILD_DIR/app-release.apk"
    else
        log_info "Building Android debug APK..."
        ./gradlew assembleDebug
        
        # Copy output to build directory
        cp app/build/outputs/apk/debug/app-debug.apk ../$BUILD_DIR/
        
        log_success "Android debug build completed"
        log_info "APK: $BUILD_DIR/app-debug.apk"
    fi
    
    cd ..
}

build_ios() {
    log_info "Building iOS app..."
    
    cd ios
    
    # Clean previous builds
    xcodebuild clean -workspace $IOS_SCHEME.xcworkspace -scheme $IOS_SCHEME
    
    # Build based on build type
    if [ "$BUILD_TYPE" = "release" ]; then
        log_info "Building iOS release archive..."
        
        # Create archive
        xcodebuild archive \
            -workspace $IOS_SCHEME.xcworkspace \
            -scheme $IOS_SCHEME \
            -configuration Release \
            -destination 'generic/platform=iOS' \
            -archivePath ../$BUILD_DIR/$IOS_SCHEME.xcarchive
        
        # Export IPA
        if [ -f "ExportOptions.plist" ]; then
            xcodebuild -exportArchive \
                -archivePath ../$BUILD_DIR/$IOS_SCHEME.xcarchive \
                -exportOptionsPlist ExportOptions.plist \
                -exportPath ../$BUILD_DIR/
        else
            log_warning "ExportOptions.plist not found. Archive created but IPA not exported."
        fi
        
        log_success "iOS release build completed"
        log_info "Archive: $BUILD_DIR/$IOS_SCHEME.xcarchive"
        
        if [ -f "../$BUILD_DIR/$IOS_SCHEME.ipa" ]; then
            log_info "IPA: $BUILD_DIR/$IOS_SCHEME.ipa"
        fi
    else
        log_info "Building iOS debug..."
        
        xcodebuild build \
            -workspace $IOS_SCHEME.xcworkspace \
            -scheme $IOS_SCHEME \
            -configuration Debug \
            -destination 'generic/platform=iOS Simulator'
        
        log_success "iOS debug build completed"
    fi
    
    cd ..
}

post_build_tasks() {
    log_info "Running post-build tasks..."
    
    # Generate build info
    cat > $BUILD_DIR/build-info.json << EOF
{
    "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "platform": "$PLATFORM",
    "buildType": "$BUILD_TYPE",
    "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)"
}
EOF
    
    # List build outputs
    log_info "Build outputs:"
    ls -la $BUILD_DIR/
    
    # Calculate file sizes
    if [ -f "$BUILD_DIR/app-release.aab" ]; then
        AAB_SIZE=$(du -h "$BUILD_DIR/app-release.aab" | cut -f1)
        log_info "Android AAB size: $AAB_SIZE"
    fi
    
    if [ -f "$BUILD_DIR/app-release.apk" ]; then
        APK_SIZE=$(du -h "$BUILD_DIR/app-release.apk" | cut -f1)
        log_info "Android APK size: $APK_SIZE"
    fi
    
    if [ -f "$BUILD_DIR/$IOS_SCHEME.ipa" ]; then
        IPA_SIZE=$(du -h "$BUILD_DIR/$IOS_SCHEME.ipa" | cut -f1)
        log_info "iOS IPA size: $IPA_SIZE"
    fi
    
    log_success "Post-build tasks completed"
}

# Run main function with all arguments
main "$@"
