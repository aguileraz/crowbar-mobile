# Dockerfile for Appium Server
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    git \
    build-essential \
    python3 \
    python3-pip \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Set up Android SDK environment (minimal for Appium)
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/platform-tools

# Install Android SDK platform tools only (for ADB)
RUN mkdir -p $ANDROID_HOME && \
    wget -q https://dl.google.com/android/repository/platform-tools-latest-linux.zip && \
    unzip -q platform-tools-latest-linux.zip -d $ANDROID_HOME && \
    rm platform-tools-latest-linux.zip

# Install Appium and dependencies
RUN npm install -g \
    appium@2.0.1 \
    appium-doctor

# Install Appium drivers
RUN appium driver install uiautomator2 && \
    appium driver install espresso

# Install Appium plugins
RUN appium plugin install images && \
    appium plugin install execute-driver

# Create working directory
WORKDIR /workspace

# Copy Appium configuration
COPY --chmod=644 <<EOF /workspace/.appiumrc.json
{
  "server": {
    "port": 4723,
    "host": "0.0.0.0",
    "allow-cors": true,
    "log-level": "info",
    "log-timestamp": true,
    "local-timezone": true,
    "session-override": true,
    "strict-caps": false,
    "relaxed-security": true,
    "allow-insecure": [
      "chromedriver_autodownload"
    ],
    "plugin": {
      "images": {
        "matchThreshold": 0.4,
        "fixImageTemplateScale": true
      }
    }
  }
}
EOF

# Health check script
COPY --chmod=755 <<EOF /healthcheck.sh
#!/bin/bash
curl -f http://localhost:4723/status || exit 1
EOF

# Startup script
COPY --chmod=755 <<EOF /start-appium.sh
#!/bin/bash
set -e

echo "Starting Appium Server..."
echo "Configuration:"
echo "  - Port: 4723"
echo "  - Allow CORS: true"
echo "  - Drivers: uiautomator2, espresso"
echo "  - Plugins: images, execute-driver"

# Start Appium with configuration
appium server \
    --config /workspace/.appiumrc.json \
    --driver-xcuitest-webdriveragent-port 8100 \
    --plugin images \
    --plugin execute-driver
EOF

# Expose Appium port
EXPOSE 4723

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

CMD ["/start-appium.sh"]