#!/bin/bash

# Script to wait for Android emulator to be fully booted and ready
# Checks multiple conditions to ensure emulator is truly ready for testing

set +e  # Don't exit on error

echo "⏳ Waiting for emulator to start..."

# Maximum wait time (5 minutes)
MAX_WAIT_TIME=300
WAIT_INTERVAL=5
elapsed=0

# Function to check if emulator is online
is_emulator_online() {
    adb devices | grep -q "emulator.*device"
}

# Function to check if boot is completed
is_boot_completed() {
    boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    [ "$boot_completed" = "1" ]
}

# Function to check if package manager is ready
is_package_manager_ready() {
    adb shell pm list packages 2>/dev/null | grep -q "package:"
}

# Function to check if home screen is ready
is_home_ready() {
    adb shell dumpsys window 2>/dev/null | grep -q "mCurrentFocus.*Launcher"
}

# Wait for ADB to see the emulator
echo "📱 Waiting for emulator to appear in ADB..."
while ! is_emulator_online; do
    if [ $elapsed -ge $MAX_WAIT_TIME ]; then
        echo "❌ Timeout waiting for emulator to appear in ADB"
        adb devices
        exit 1
    fi
    
    sleep $WAIT_INTERVAL
    elapsed=$((elapsed + WAIT_INTERVAL))
    echo "   Still waiting... ($elapsed seconds)"
done
echo "✅ Emulator detected in ADB"

# Wait for boot to complete
echo "🔄 Waiting for emulator to boot..."
while ! is_boot_completed; do
    if [ $elapsed -ge $MAX_WAIT_TIME ]; then
        echo "❌ Timeout waiting for emulator to boot"
        exit 1
    fi
    
    sleep $WAIT_INTERVAL
    elapsed=$((elapsed + WAIT_INTERVAL))
    echo "   Still booting... ($elapsed seconds)"
done
echo "✅ Boot completed"

# Wait for package manager
echo "📦 Waiting for package manager..."
while ! is_package_manager_ready; do
    if [ $elapsed -ge $MAX_WAIT_TIME ]; then
        echo "❌ Timeout waiting for package manager"
        exit 1
    fi
    
    sleep $WAIT_INTERVAL
    elapsed=$((elapsed + WAIT_INTERVAL))
    echo "   Still waiting... ($elapsed seconds)"
done
echo "✅ Package manager ready"

# Additional wait for system to stabilize
echo "⏱️  Waiting for system to stabilize..."
sleep 10

# Disable animations for better test performance
echo "🎨 Disabling animations for testing..."
adb shell settings put global window_animation_scale 0.0
adb shell settings put global transition_animation_scale 0.0
adb shell settings put global animator_duration_scale 0.0

# Unlock screen
echo "🔓 Unlocking screen..."
adb shell input keyevent 82  # Menu button
adb shell input keyevent 3   # Home button

# Print device info
echo ""
echo "📱 Emulator Information:"
echo "   API Level: $(adb shell getprop ro.build.version.sdk | tr -d '\r')"
echo "   Device: $(adb shell getprop ro.product.model | tr -d '\r')"
echo "   Build: $(adb shell getprop ro.build.display.id | tr -d '\r')"
echo ""

echo "✅ Emulator is ready for testing!"
echo "   Total wait time: $elapsed seconds"

exit 0