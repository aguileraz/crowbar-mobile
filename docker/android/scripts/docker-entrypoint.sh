#!/bin/bash

# Docker entrypoint script for Android testing environment
# Handles initialization of display, VNC server, and Android emulator

set -e

echo "🚀 Starting Android Docker Environment..."

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$EMULATOR_PID" ]; then
        kill -TERM "$EMULATOR_PID" 2>/dev/null || true
    fi
    if [ ! -z "$VNC_PID" ]; then
        kill -TERM "$VNC_PID" 2>/dev/null || true
    fi
    if [ ! -z "$XVFB_PID" ]; then
        kill -TERM "$XVFB_PID" 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start X virtual framebuffer
echo "📺 Starting virtual display..."
Xvfb :1 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

# Start window manager (fluxbox)
echo "🪟 Starting window manager..."
fluxbox -display :1 &
sleep 1

# Start VNC server if enabled
if [ "${ENABLE_VNC:-true}" = "true" ]; then
    echo "🔌 Starting VNC server on port $VNC_PORT..."
    x11vnc -display :1 -nopw -listen 0.0.0.0 -xkb -ncache 10 -forever -shared &
    VNC_PID=$!
    echo "✅ VNC server started. Connect to port $VNC_PORT"
fi

# Enable hardware acceleration if available
if [ -e /dev/kvm ]; then
    echo "🚀 KVM acceleration available"
    chmod 666 /dev/kvm || true
else
    echo "⚠️  KVM not available, emulator will run in software mode (slower)"
fi

# Configure emulator options
EMULATOR_ARGS="-no-window -no-boot-anim -gpu swiftshader_indirect -verbose"

# Add audio configuration to prevent warnings
EMULATOR_ARGS="$EMULATOR_ARGS -no-audio"

# Add memory and partition size for better performance
EMULATOR_ARGS="$EMULATOR_ARGS -memory 2048 -partition-size 2048"

# Start Android emulator if requested
if [ "${START_EMULATOR:-true}" = "true" ]; then
    echo "📱 Starting Android emulator..."
    echo "   AVD: ${ANDROID_AVD_NAME:-test_avd}"
    echo "   Args: $EMULATOR_ARGS ${EMULATOR_EXTRA_ARGS:-}"
    
    # Start emulator in background
    emulator @${ANDROID_AVD_NAME:-test_avd} $EMULATOR_ARGS ${EMULATOR_EXTRA_ARGS:-} &
    EMULATOR_PID=$!
    
    # Wait for emulator to be ready
    if [ "${WAIT_FOR_EMULATOR:-true}" = "true" ]; then
        /usr/local/bin/wait-for-emulator.sh
    fi
fi

# Execute the provided command or run interactive shell
if [ $# -eq 0 ]; then
    echo "✅ Android environment ready!"
    echo ""
    echo "Available commands:"
    echo "  - adb devices          : List connected devices"
    echo "  - adb shell            : Connect to emulator shell"
    echo "  - npm test             : Run tests"
    echo "  - npm run test:e2e     : Run E2E tests"
    echo ""
    
    # Keep container running
    while true; do
        sleep 1
    done
else
    # Execute provided command
    echo "🔧 Executing: $@"
    exec "$@"
fi