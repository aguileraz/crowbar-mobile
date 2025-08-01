# Docker Configuration Specification

This is the Docker configuration for the spec detailed in @.agent-os/specs/2025-07-25-android-docker-testing/spec.md

> Created: 2025-07-25
> Version: 1.0.0

## Dockerfile Structure

```dockerfile
# Multi-stage build for optimization
FROM openjdk:17-slim AS android-base

# System dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    git \
    curl \
    libglu1-mesa \
    libpulse-dev \
    libasound2 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libgconf-2-4 \
    fontconfig \
    locales \
    python3 \
    python3-pip \
    nodejs \
    npm \
    x11vnc \
    xvfb \
    fluxbox \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator

# Install Android SDK
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-9477386_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-9477386_latest.zip

# Accept licenses and install SDK components
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" \
    "platforms;android-30" \
    "platforms;android-34" \
    "system-images;android-30;google_apis;x86_64" \
    "emulator" \
    "build-tools;34.0.0"

# Create AVD
RUN echo no | avdmanager create avd \
    --name test_avd \
    --package "system-images;android-30;google_apis;x86_64" \
    --device "pixel_4"

# React Native dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Scripts
COPY scripts/docker-entrypoint.sh /usr/local/bin/
COPY scripts/wait-for-emulator.sh /usr/local/bin/
COPY scripts/run-tests.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

# VNC and display setup
ENV DISPLAY=:1
ENV VNC_PORT=5900
ENV NO_VNC_PORT=6080

# Expose ports
EXPOSE 5554 5555 5900 6080 8081

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
```

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  android-test:
    build:
      context: .
      dockerfile: Dockerfile.android-test
    container_name: crowbar-android-test
    privileged: true
    environment:
      - ANDROID_EMULATOR_WAIT_TIME_BEFORE_KILL=60
      - ANDROID_AVD_NAME=test_avd
      - EMULATOR_ARGS=-no-window -gpu swiftshader_indirect -no-boot-anim
    volumes:
      - ./:/app
      - gradle-cache:/root/.gradle
      - android-cache:/root/.android
      - emulator-data:/root/.config/android
    ports:
      - "5554:5554"  # Emulator
      - "5555:5555"  # ADB
      - "5900:5900"  # VNC
      - "8081:8081"  # Metro bundler
    devices:
      - /dev/kvm
    command: ["run-tests.sh"]

volumes:
  gradle-cache:
  android-cache:
  emulator-data:
```

## Entry Point Script

```bash
#!/bin/bash
# docker-entrypoint.sh

# Start X virtual framebuffer
Xvfb :1 -screen 0 1024x768x24 &

# Start VNC server
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -forever &

# Start window manager
fluxbox &

# Enable KVM if available
if [ -e /dev/kvm ]; then
    chmod 666 /dev/kvm
fi

# Start emulator
emulator @${ANDROID_AVD_NAME} ${EMULATOR_ARGS} &

# Wait for emulator to be ready
/usr/local/bin/wait-for-emulator.sh

# Execute provided command or run tests
exec "$@"
```

## GitHub Actions Integration

```yaml
name: Android Docker Tests

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  android-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Enable KVM
      run: |
        echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
        sudo udevadm control --reload-rules
        sudo udevadm trigger --name-match=kvm
    
    - name: Build Docker Image
      run: docker build -t crowbar-android-test -f Dockerfile.android-test .
    
    - name: Run Tests
      run: |
        docker run --rm \
          --device /dev/kvm \
          -v ${{ github.workspace }}:/app \
          crowbar-android-test \
          npm run test:docker:android
    
    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          test-results/
          coverage/
          screenshots/
```