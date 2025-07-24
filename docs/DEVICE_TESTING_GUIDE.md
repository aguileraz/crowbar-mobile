# Device Testing Guide

This guide covers comprehensive testing of Crowbar Mobile on physical devices to validate production readiness.

## Prerequisites

### Android Testing Setup

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK and platform tools
   - Add to PATH: `export PATH=$PATH:$ANDROID_HOME/platform-tools`

2. **Enable Developer Options on Device**
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Settings → Developer Options → USB Debugging (Enable)
   ```

3. **Connect Device**
   ```bash
   adb devices
   # Should show: device_id    device
   ```

### iOS Testing Setup (macOS only)

1. **Install Xcode** (from App Store)
2. **Connect iOS Device** with USB cable
3. **Trust Developer** on device when prompted
4. **Add Apple ID** to Xcode for signing

## Testing Process

### 1. Environment Setup

```bash
# Verify React Native environment
npx react-native doctor

# Check connected devices
adb devices                    # Android
xcrun simctl list devices     # iOS simulators
ios-deploy --detect          # iOS devices
```

### 2. Performance Testing

#### Run Automated Performance Tests
```bash
# Complete performance validation
npm run perf:test

# Platform-specific tests
npm run perf:test:android
npm run perf:test:ios

# Device tier-specific tests
npm run perf:test:high      # High-end devices
npm run perf:test:mid       # Mid-range devices  
npm run perf:test:low       # Low-end devices
```

#### Manual Performance Checks
- **Cold Start Time**: Should be < 3 seconds
- **Memory Usage**: Should be < 150MB baseline
- **FPS**: Should maintain > 50 FPS during animations
- **Battery Usage**: Monitor during extended testing

### 3. Build Testing

#### Install Development Build
```bash
# Android
npx react-native run-android --mode=debug

# iOS  
npx react-native run-ios --mode=Debug
```

#### Install Production Build
```bash
# Android (after building)
adb install android/app/build/outputs/apk/release/app-release.apk

# iOS (through Xcode)
# Open ios/CrowbarMobile.xcworkspace
# Select physical device → Product → Run
```

### 4. Functional Testing Checklist

#### Core Features
- [ ] **App Launch**: Opens without crashes
- [ ] **Authentication**: Firebase Auth login/register
- [ ] **Navigation**: All screens accessible
- [ ] **API Calls**: Network requests successful
- [ ] **Offline Mode**: Works without internet
- [ ] **Push Notifications**: Receives and displays properly

#### Platform-Specific Features
- [ ] **Android**: Back button navigation
- [ ] **Android**: App icons and splash screen
- [ ] **iOS**: Gesture navigation
- [ ] **iOS**: Status bar styling

#### Performance Features
- [ ] **Animations**: Smooth 60fps animations  
- [ ] **List Scrolling**: No jank in product lists
- [ ] **Image Loading**: Progressive loading with placeholders
- [ ] **Network**: Proper loading states

### 5. Device Categories Testing

#### High-End Devices (Recommended)
- **Android**: Samsung Galaxy S22+, Pixel 7 Pro, OnePlus 10 Pro
- **iOS**: iPhone 14 Pro, iPhone 13 Pro Max
- **Expectations**: All features work flawlessly

#### Mid-Range Devices (Target)
- **Android**: Samsung Galaxy A54, Pixel 6a, OnePlus Nord
- **iOS**: iPhone 12, iPhone SE (3rd gen)
- **Expectations**: Good performance with minor compromises

#### Low-End Devices (Minimum Support)
- **Android**: Samsung Galaxy A33, Motorola G Power
- **iOS**: iPhone 11, iPhone XR  
- **Expectations**: Functional but reduced animations

### 6. Network Testing

#### Connection Types
- [ ] **WiFi**: Fast and stable connection
- [ ] **4G/LTE**: Mobile data connection
- [ ] **Slow 3G**: Simulate poor connection
- [ ] **Offline**: No internet connection

#### API Testing
- [ ] **Authentication**: Login/logout flows
- [ ] **Product Data**: Fetching marketplace data
- [ ] **Real-time**: WebSocket connections
- [ ] **Error Handling**: Network failures

### 7. Security Testing

#### Data Protection
- [ ] **Secure Storage**: Tokens stored in Keychain/Keystore
- [ ] **HTTPS**: All API calls use SSL/TLS
- [ ] **Certificate Pinning**: Validates server certificates
- [ ] **App Permissions**: Only necessary permissions requested

#### Authentication Security
- [ ] **Token Refresh**: Automatic token renewal
- [ ] **Session Management**: Proper logout clearing
- [ ] **Biometric Auth**: Works if available

### 8. Accessibility Testing

#### Screen Reader Support
- [ ] **VoiceOver** (iOS): Content readable
- [ ] **TalkBack** (Android): Content readable
- [ ] **Focus Management**: Proper navigation order

#### Visual Accessibility
- [ ] **Font Scaling**: Supports large text sizes
- [ ] **Color Contrast**: Meets WCAG guidelines
- [ ] **Touch Targets**: Minimum 44px tap areas

## Testing Tools

### Performance Monitoring
```bash
# Real-time performance monitoring
npm run perf:monitor

# Generate performance report
npm run perf:report
```

### Device Information
```bash
# Get device specifications
npm run device:info

# Check device tier classification
npm run device:classify
```

### Debug Tools
```bash
# Enable developer menu (Debug builds)
adb shell input keyevent 82      # Android
# Shake device                   # iOS

# React Native debugger
npm run debug:react-native

# Flipper (if enabled)
npm run debug:flipper
```

## Automated Testing Scripts

### Run Complete Device Test Suite
```bash
# Full automated testing
npm run test:device

# Smoke tests only
npm run test:smoke

# Performance validation
npm run test:performance
```

### Generate Test Reports
```bash
# Comprehensive device report
npm run report:device

# Performance metrics
npm run report:performance

# Compatibility report
npm run report:compatibility
```

## Common Issues & Solutions

### Build Issues
- **Gradle Build Fails**: Clean and rebuild `./android/gradlew clean`
- **Metro Bundler Issues**: Reset cache `npx react-native start --reset-cache`
- **iOS Code Signing**: Check certificates in Xcode

### Performance Issues  
- **Slow Cold Start**: Check bundle size and initialization code
- **Memory Leaks**: Use Flipper memory profiler
- **Animation Jank**: Enable native driver for animations

### Device-Specific Issues
- **Android Permissions**: Check manifest and runtime permissions
- **iOS Provisioning**: Ensure valid development certificate
- **Network Issues**: Verify API endpoints and SSL certificates

## Success Criteria

### Performance Benchmarks
- ✅ **Cold Start**: < 3 seconds on mid-range devices
- ✅ **Memory Usage**: < 150MB baseline
- ✅ **FPS**: > 50 FPS during navigation
- ✅ **Bundle Size**: < 50MB APK, < 40MB AAB

### Functional Requirements
- ✅ **Core Features**: 100% working
- ✅ **Network Reliability**: Handles offline/online transitions
- ✅ **Security**: All sensitive data encrypted
- ✅ **Accessibility**: Basic screen reader support

### Compatibility
- ✅ **Android**: 90%+ of target devices
- ✅ **iOS**: 95%+ of target devices
- ✅ **Performance**: Acceptable on minimum spec devices

## Test Documentation

### Record Test Sessions
- **Video Recording**: Screen recordings of test sessions
- **Performance Logs**: Capture FPS, memory, network metrics
- **Crash Reports**: Document any crashes with stack traces
- **User Experience Notes**: Document any usability issues

### Test Reports
Generate reports for:
- Device compatibility matrix
- Performance benchmarks by device tier
- Feature functionality across platforms
- Security validation results

---

**Note**: For comprehensive testing, use multiple devices across different:
- **Price ranges** (high-end, mid-range, budget)
- **OS versions** (latest, previous, minimum supported)
- **Screen sizes** (small, medium, large, tablet)
- **Network conditions** (WiFi, cellular, poor connection)

**Last Updated**: 2025-01-24