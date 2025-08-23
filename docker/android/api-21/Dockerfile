# Dockerfile for Android API 21 (5.0 Lollipop)
FROM crowbar-android-base:latest

ARG API_LEVEL=21
ARG SYSTEM_IMAGE="system-images;android-21;google_apis;x86"
ARG DEVICE_NAME="Nexus 5"
ARG DEVICE_ID="nexus_5"

# Install API specific components
RUN sdkmanager \
    "platforms;android-${API_LEVEL}" \
    "${SYSTEM_IMAGE}" \
    "build-tools;30.0.3" \
    > /dev/null 2>&1

# Create AVD
RUN echo "no" | avdmanager create avd \
    --name test_device_${API_LEVEL} \
    --package "${SYSTEM_IMAGE}" \
    --force

# Configure AVD settings for better performance
RUN echo "hw.lcd.density=480" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "hw.keyboard=yes" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "hw.cpu.ncore=2" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "hw.gpu.enabled=yes" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "hw.gpu.mode=swiftshader_indirect" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "hw.ramSize=2048" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "vm.heapSize=256" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini && \
    echo "disk.dataPartition.size=2G" >> ~/.android/avd/test_device_${API_LEVEL}.avd/config.ini

# Create startup script
COPY --chmod=755 <<EOF /start-emulator.sh
#!/bin/bash
set -e

echo "Starting Android Emulator API ${API_LEVEL}..."

# Start ADB server
adb start-server

# Start emulator with performance flags
emulator -avd test_device_${API_LEVEL} \
    -no-window \
    -no-audio \
    -no-boot-anim \
    -gpu swiftshader_indirect \
    -memory 2048 \
    -cores 2 \
    -netfast \
    -no-snapshot-save \
    -noaudio \
    -qemu -cpu max &

EMULATOR_PID=\$!

# Wait for emulator to boot
echo "Waiting for emulator to boot..."
timeout 300 bash -c '
while [[ "\$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]]; do
    sleep 2
    echo -n "."
done
'

if [ \$? -eq 0 ]; then
    echo ""
    echo "✅ Emulator booted successfully!"
    
    # Configure emulator settings
    adb shell settings put global window_animation_scale 0
    adb shell settings put global transition_animation_scale 0
    adb shell settings put global animator_duration_scale 0
    adb shell settings put system accelerometer_rotation 0
    
    echo "Emulator ready for testing on API ${API_LEVEL}"
    
    # Keep container running
    wait \$EMULATOR_PID
else
    echo ""
    echo "❌ Emulator failed to boot within timeout"
    exit 1
fi
EOF

# Expose ADB port
EXPOSE 5554 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD adb shell getprop sys.boot_completed | grep -q "1" || exit 1

# Set environment variables
ENV API_LEVEL=${API_LEVEL}
ENV DEVICE_NAME="${DEVICE_NAME}"
ENV AVD_NAME=test_device_${API_LEVEL}

CMD ["/start-emulator.sh"]