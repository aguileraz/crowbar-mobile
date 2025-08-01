#!/bin/bash
set -e

echo "🚀 Starting Android Emulator Docker Container..."

# Function to wait for emulator
wait_for_emulator() {
    echo "⏳ Waiting for emulator to start..."
    local timeout=300
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if adb devices | grep -q "emulator.*device"; then
            echo "✅ Emulator is ready!"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo "   Waiting... ($elapsed/$timeout seconds)"
    done
    
    echo "❌ Emulator failed to start within $timeout seconds"
    return 1
}

# Function to start Appium
start_appium() {
    echo "🔧 Starting Appium server..."
    appium \
        --address 0.0.0.0 \
        --port 4723 \
        --relaxed-security \
        --log-level info \
        --log /app/logs/appium.log &
    
    # Wait for Appium to start
    sleep 10
    
    # Check if Appium is running
    if curl -s http://localhost:4723/status | grep -q "ready"; then
        echo "✅ Appium server is ready!"
    else
        echo "❌ Appium server failed to start"
        exit 1
    fi
}

# Function to install APK
install_apk() {
    if [ -f "/app/app-release.apk" ]; then
        echo "📱 Installing APK..."
        adb install -r /app/app-release.apk
        echo "✅ APK installed successfully"
    else
        echo "⚠️  No APK found at /app/app-release.apk"
    fi
}

# Main execution
echo "🏁 Starting services..."

# Start emulator if not already running
if ! adb devices | grep -q "emulator.*device"; then
    echo "🤖 Starting Android emulator..."
    emulator -avd test -no-window -no-audio -gpu swiftshader_indirect &
    wait_for_emulator
fi

# Install APK if provided
install_apk

# Start Appium server
start_appium

# Keep container running
echo "🎯 Container is ready for testing!"
echo "   Appium: http://localhost:4723"
echo "   ADB: localhost:5555"

# If TEST_COMMAND is provided, execute it
if [ -n "$TEST_COMMAND" ]; then
    echo "🧪 Executing test command: $TEST_COMMAND"
    cd /app
    eval $TEST_COMMAND
    TEST_EXIT_CODE=$?
    
    # Copy test results
    if [ -d "/app/test-results" ]; then
        echo "📊 Test results available in /app/test-results"
    fi
    
    exit $TEST_EXIT_CODE
else
    # Keep container alive for manual testing
    tail -f /dev/null
fi