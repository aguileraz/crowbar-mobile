# Crowbar Mobile - React Native Build Container
# For building APK/IPA artifacts in CI/CD

FROM node:18

WORKDIR /app

# Install React Native dependencies
RUN apt-get update && apt-get install -y \
    openjdk-11-jdk \
    android-sdk \
    && rm -rf /var/lib/apt/lists/*

# Set Android environment variables
ENV ANDROID_HOME=/usr/lib/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build APK (production)
CMD ["npm", "run", "build:android"]

# Note: For iOS builds, use macOS runner in GitHub Actions
# This Dockerfile is primarily for Android builds
