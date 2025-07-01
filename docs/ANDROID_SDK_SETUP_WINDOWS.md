# Android SDK Setup Guide - Windows 11

## Overview
Complete guide to install Android SDK and development tools on Windows 11 for React Native development.

## Prerequisites
- Windows 11 (64-bit)
- At least 8GB RAM (16GB recommended)
- At least 20GB free disk space
- Administrator privileges

## Step 1: Install Java JDK

### Option A: Install via Chocolatey (Recommended)
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install OpenJDK 17 (recommended for React Native)
choco install openjdk17 -y
```

### Option B: Manual Installation
1. Download OpenJDK 17 from: https://adoptium.net/
2. Choose "Windows x64" installer
3. Run installer with default settings
4. Verify installation: `java -version`

## Step 2: Install Android Studio

### Download and Install
1. Go to: https://developer.android.com/studio
2. Download "Android Studio Hedgehog" (latest stable)
3. Run the installer (`android-studio-2023.x.x.xx-windows.exe`)
4. Follow installation wizard:
   - Choose "Standard" installation
   - Accept all license agreements
   - Let it download Android SDK components

### Initial Setup
1. Launch Android Studio
2. Complete the setup wizard:
   - Choose "Standard" setup type
   - Select UI theme (Light/Dark)
   - Verify settings and click "Finish"
3. Wait for initial SDK download (this may take 10-30 minutes)

## Step 3: Configure Android SDK

### SDK Manager Configuration
1. Open Android Studio
2. Go to: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. In **SDK Platforms** tab, ensure these are checked:
   - ✅ Android 14.0 (API 34) - Latest
   - ✅ Android 13.0 (API 33) - Recommended for React Native
   - ✅ Android 12.0 (API 31)
   - ✅ Show Package Details (expand and select):
     - Android SDK Platform 33
     - Intel x86 Atom_64 System Images
     - Google APIs Intel x86 Atom_64 System Images

4. In **SDK Tools** tab, ensure these are checked:
   - ✅ Android SDK Build-Tools (latest)
   - ✅ Android SDK Command-line Tools (latest)
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Intel x86 Emulator Accelerator (HAXM installer)

5. Click "Apply" and wait for downloads to complete

## Step 4: Set Environment Variables

### Automatic Setup (PowerShell Script)
```powershell
# Get Android SDK path (usually in AppData)
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"

# Set ANDROID_HOME environment variable
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

# Add Android SDK tools to PATH
$newPath = "$currentPath;$androidHome\platform-tools;$androidHome\tools;$androidHome\tools\bin"
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")

# Refresh environment variables in current session
$env:ANDROID_HOME = $androidHome
$env:PATH = "$env:PATH;$androidHome\platform-tools;$androidHome\tools;$androidHome\tools\bin"

Write-Host "Environment variables set successfully!"
Write-Host "ANDROID_HOME: $androidHome"
```

### Manual Setup (Alternative)
1. Open **System Properties** → **Advanced** → **Environment Variables**
2. Under **User Variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
3. Edit **PATH** variable and add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

## Step 5: Create Android Virtual Device (AVD)

### Using Android Studio
1. Open Android Studio
2. Go to: **Tools → AVD Manager**
3. Click **Create Virtual Device**
4. Choose device: **Pixel 7** (recommended)
5. Select system image: **API 33 (Android 13.0)**
6. Configure AVD:
   - Name: `Pixel_7_API_33`
   - Startup orientation: Portrait
   - Enable hardware acceleration
7. Click **Finish**

### Test AVD
1. In AVD Manager, click ▶️ (Play) button
2. Wait for emulator to boot (first time may take 5-10 minutes)
3. Verify Android home screen appears

## Step 6: Verify Installation

### Command Line Verification
```powershell
# Verify Java
java -version

# Verify Android SDK
adb version

# List available AVDs
emulator -list-avds

# Check React Native doctor
npx react-native doctor
```

### Expected Output
```
# Java version
openjdk version "17.0.x" 2023-xx-xx

# ADB version
Android Debug Bridge version 1.0.xx

# AVD list
Pixel_7_API_33

# React Native doctor should show ✓ for Android development environment
```

## Step 7: Test with React Native Project

### Build and Run
```powershell
# Navigate to your React Native project
cd path\to\crowbar-mobile

# Start Metro bundler
npx react-native start

# In another terminal, run Android app
npx react-native run-android
```

## Troubleshooting

### Common Issues

#### 1. JAVA_HOME not found
```powershell
# Check if JAVA_HOME is set
echo $env:JAVA_HOME

# If empty, set manually
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot"
```

#### 2. Android SDK not found
```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# Verify SDK directory exists
Test-Path $env:ANDROID_HOME
```

#### 3. Emulator won't start
- Enable Hyper-V in Windows Features
- Install Intel HAXM from SDK Manager
- Restart computer after installation

#### 4. Build fails with "SDK location not found"
Create `local.properties` in `android/` folder:
```
sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk
```

### Performance Tips
- Allocate at least 4GB RAM to AVD
- Enable hardware acceleration
- Use SSD for Android SDK installation
- Close unnecessary applications when running emulator

## Next Steps
1. Complete this installation guide
2. Test React Native app build
3. Set up physical device debugging (optional)
4. Configure release builds and signing

---

**Note:** This guide assumes a clean installation. If you have previous Android development tools installed, you may need to clean up conflicting configurations.
