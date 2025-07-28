#!/bin/bash
set -e

echo "🐳 Crowbar Docker Test Environment"
echo "=================================="

# Configuration
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"
TEST_MODE=${1:-"all"} # all, single, parallel
TARGET_API=${2:-"31"} # 21, 26, 31

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check KVM support (for better performance)
    if [ -e /dev/kvm ]; then
        echo -e "${GREEN}✅ KVM support detected${NC}"
    else
        echo -e "${YELLOW}⚠️  KVM not available - emulator will run slower${NC}"
    fi
    
    # Check if APK exists
    if [ ! -f "$APK_PATH" ]; then
        echo -e "${YELLOW}⚠️  APK not found. Building it now...${NC}"
        cd "$PROJECT_ROOT"
        npm run build:android
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to build Docker images
build_images() {
    echo "🏗️  Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    case "$TEST_MODE" in
        "single")
            docker-compose build android-$TARGET_API
            ;;
        *)
            docker-compose build
            ;;
    esac
    
    echo -e "${GREEN}✅ Docker images built${NC}"
}

# Function to run tests
run_tests() {
    echo "🚀 Starting test environment..."
    
    cd "$PROJECT_ROOT"
    
    # Copy APK to mounted volume
    cp "$APK_PATH" "$PROJECT_ROOT/android/app/build/outputs/apk/app-release.apk" 2>/dev/null || true
    
    case "$TEST_MODE" in
        "single")
            echo "Running tests on Android API $TARGET_API..."
            docker-compose up -d android-$TARGET_API
            
            # Wait for emulator
            echo "Waiting for emulator to be ready..."
            docker-compose run --rm test-runner /app/scripts/wait-for-emulator.sh android-$TARGET_API
            
            # Run tests
            docker-compose run --rm \
                -e TEST_TARGETS="android-$TARGET_API" \
                -e PARALLEL_TESTS=false \
                test-runner
            ;;
        
        "parallel")
            echo "Running tests in parallel on all API levels..."
            docker-compose up -d android-31 android-26 android-21
            
            # Wait for all emulators
            docker-compose run --rm test-runner /app/scripts/wait-for-all-emulators.sh
            
            # Run tests in parallel
            docker-compose run --rm test-runner
            ;;
        
        *)
            echo "Running tests sequentially on all API levels..."
            docker-compose up -d android-31 android-26 android-21
            
            # Run tests sequentially
            docker-compose run --rm \
                -e PARALLEL_TESTS=false \
                test-runner
            ;;
    esac
    
    TEST_EXIT_CODE=$?
    
    # Copy results to host
    echo "📋 Copying test results..."
    docker cp crowbar-test-runner:/app/test-results "$PROJECT_ROOT/test-results-docker"
    docker cp crowbar-test-runner:/app/reports "$PROJECT_ROOT/test-reports-docker"
    
    return $TEST_EXIT_CODE
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker-compose down
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to show results
show_results() {
    echo ""
    echo "📊 Test Results"
    echo "==============="
    
    if [ -f "$PROJECT_ROOT/test-reports-docker/summary.json" ]; then
        cat "$PROJECT_ROOT/test-reports-docker/summary.json" | jq .
    else
        echo "No summary found"
    fi
    
    echo ""
    echo "📈 Detailed report available at:"
    echo "   file://$PROJECT_ROOT/test-reports-docker/allure-report/index.html"
}

# Main execution
echo "Configuration:"
echo "  - Mode: $TEST_MODE"
echo "  - Target API: $TARGET_API"
echo "  - APK: $APK_PATH"
echo ""

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run workflow
check_prerequisites
build_images
run_tests
TEST_RESULT=$?

# Show results
show_results

# Exit with test result code
exit $TEST_RESULT