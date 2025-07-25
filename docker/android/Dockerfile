# Android Testing Environment for Crowbar Mobile
# Provides Android SDK, emulator, and testing tools in a containerized environment

FROM openjdk:17-slim

# Install system dependencies
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
    # Additional dependencies for Android emulator
    libx11-6 \
    libxcb1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrender1 \
    libxtst6 \
    libpulse0 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    fonts-liberation \
    xdg-utils \
    # APK tools
    aapt \
    apksigner \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Android SDK environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_HOME}
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator

# Create Android SDK directory
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools

# Download and install Android command line tools
RUN cd ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-9477386_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-9477386_latest.zip

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Install required Android SDK components
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-30" \
    "platforms;android-34" \
    "system-images;android-30;google_apis;x86_64" \
    "emulator" \
    "build-tools;34.0.0" \
    "build-tools;35.0.0"

# Create Android Virtual Device (AVD)
RUN echo no | avdmanager create avd \
    --name test_avd \
    --package "system-images;android-30;google_apis;x86_64" \
    --device "pixel_4"

# Configure emulator settings for better performance
RUN mkdir -p ~/.android && \
    echo "hw.keyboard=yes" >> ~/.android/avd/test_avd.avd/config.ini && \
    echo "hw.gpu.enabled=yes" >> ~/.android/avd/test_avd.avd/config.ini && \
    echo "hw.gpu.mode=swiftshader_indirect" >> ~/.android/avd/test_avd.avd/config.ini

# Create working directory
WORKDIR /app

# Create scripts directory
RUN mkdir -p /usr/local/bin

# Copy scripts
COPY docker/android/scripts/docker-entrypoint.sh /usr/local/bin/
COPY docker/android/scripts/wait-for-emulator.sh /usr/local/bin/

# Make scripts executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/wait-for-emulator.sh

# Environment variables for display and VNC
ENV DISPLAY=:1
ENV VNC_PORT=5900
ENV NO_VNC_PORT=6080

# Expose ports
# 5554-5555: Android emulator
# 5900: VNC server
# 6080: noVNC web interface
# 8081: Metro bundler
EXPOSE 5554 5555 5900 6080 8081

# Set up entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command
CMD ["bash"]