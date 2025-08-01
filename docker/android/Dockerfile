# Base image with Android emulator support
FROM budtmo/docker-android:emulator-31

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Appium and drivers
RUN npm install -g appium@2.0.0 \
    && appium driver install uiautomator2 \
    && appium driver install espresso

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Install test dependencies
COPY e2e/package*.json ./e2e/
RUN cd e2e && npm ci

# Create directories for test results
RUN mkdir -p /app/test-results \
    /app/screenshots \
    /app/logs

# Copy test configuration and scripts
COPY e2e/ /app/e2e/
COPY docker/android/scripts/ /app/scripts/

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Environment variables
ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    PATH=$PATH:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator \
    APPIUM_HOME=/app \
    TEST_RESULTS_DIR=/app/test-results

# Expose ports
EXPOSE 4723 5554 5555 4724 4725

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD adb devices | grep -q "emulator" || exit 1

# Entry point script
COPY docker/android/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]