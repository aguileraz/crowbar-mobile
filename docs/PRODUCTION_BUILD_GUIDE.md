# Production Build Guide

This guide covers the complete process for creating and validating production builds of Crowbar Mobile.

## Prerequisites

### Development Environment
- Node.js 18+ 
- npm 9+
- React Native CLI
- Android Studio (for Android builds)
- Xcode 14+ (for iOS builds, macOS only)
- Java 11+ (for Android)

### Signing Requirements

#### Android
- Release keystore file (`crowbar-release-key.keystore`)
- Keystore password
- Key alias and password

#### iOS
- Apple Developer account
- Distribution certificate
- Provisioning profile
- Team ID

## Build Process

### 1. Complete Final Validation

Run the comprehensive validation process:

```bash
npm run build:validate
```

This command will:
1. ✅ Validate environment setup
2. ✅ Run quality checks (ESLint, TypeScript, tests)
3. ✅ Perform security review
4. ✅ Run performance tests (if device connected)
5. ✅ Build production apps
6. ✅ Run smoke tests

### 2. Manual Build Commands

If you need to run builds separately:

#### Android
```bash
# Clean previous builds
npm run clean:android

# Build APK (for testing)
cd android && ./gradlew assembleRelease

# Build AAB (for Play Store)
cd android && ./gradlew bundleRelease
```

#### iOS
```bash
# Clean previous builds
npm run clean:ios

# Build archive
cd ios && xcodebuild -workspace CrowbarMobile.xcworkspace \
  -scheme CrowbarMobile \
  -configuration Release \
  -destination generic/platform=iOS \
  archive

# Export IPA
cd ios && xcodebuild -exportArchive \
  -archivePath build/CrowbarMobile.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

### 3. Build Outputs

After successful builds, you'll find:

- **Android APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **Android AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **iOS IPA**: `ios/build/CrowbarMobile.ipa`

## Quality Checks

### Security Review

Run security checks independently:

```bash
npm run security:review
```

Apply automatic security fixes:

```bash
npm run security:fix
```

### Smoke Tests

Validate builds without rebuilding:

```bash
npm run build:smoke-test
```

### Performance Testing

Test on real devices:

```bash
# Connect device first
npm run perf:test

# Platform specific
npm run perf:test:android
npm run perf:test:ios
```

## Environment Configuration

### Production Environment

1. Copy example file:
```bash
cp .env.production.secure.example .env.production
```

2. Update with real values:
- API endpoints
- Firebase configuration
- API keys
- Feature flags

### Critical Settings

Ensure these are set for production:

```env
NODE_ENV=production
BUILD_TYPE=production
DEBUG_MODE=false
ANALYTICS_ENABLED=true
FLIPPER_ENABLED=false
DEV_MENU_ENABLED=false
LOG_LEVEL=error
```

## Signing Configuration

### Android Signing

1. Generate release keystore (first time only):
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/crowbar-release-key.keystore \
  -alias crowbar-release \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

2. Configure `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=crowbar-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=crowbar-release
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

### iOS Signing

1. Open Xcode
2. Select project → Signing & Capabilities
3. Configure:
   - Team
   - Bundle Identifier
   - Provisioning Profile
   - Signing Certificate

## Build Optimization

### Bundle Size Optimization

1. Analyze bundle:
```bash
npm run analyze:bundle
```

2. Optimization checklist:
- ✅ Hermes enabled (Android)
- ✅ ProGuard/R8 enabled
- ✅ Tree shaking active
- ✅ Image optimization
- ✅ Unused dependencies removed

### Performance Criteria

Builds must meet:
- Cold start: < 3 seconds
- Bundle size: < 50MB (APK), < 40MB (AAB)
- Memory usage: < 150MB
- FPS: > 50

## Troubleshooting

### Common Issues

#### Build Fails
- Clean and rebuild: `npm run clean:all`
- Check Node modules: `rm -rf node_modules && npm install`
- Reset Metro cache: `npx react-native start --reset-cache`

#### Signing Issues
- Verify keystore location and passwords
- Check certificate expiration
- Ensure provisioning profile is valid

#### Performance Issues
- Run bundle analyzer
- Check for large dependencies
- Optimize images and assets

## Store Submission

### Google Play Store

1. Build AAB file
2. Upload to Play Console
3. Complete store listing:
   - App description
   - Screenshots
   - Privacy policy
   - Content rating

### Apple App Store

1. Build IPA file
2. Upload via Xcode or Transporter
3. Complete App Store Connect:
   - App information
   - Screenshots
   - App review notes
   - Export compliance

## Monitoring

After release:

1. Monitor crash reports
2. Track performance metrics
3. Review user feedback
4. Plan updates

## Commands Summary

```bash
# Complete validation and build
npm run build:validate

# Individual steps
npm run security:review
npm run perf:test
npm run build:production
npm run build:smoke-test

# Clean builds
npm run clean:all

# Environment management
npm run env:prod
npm run env:validate
```

## Checklist

Before submission:

- [ ] All quality checks pass
- [ ] Security review complete
- [ ] Performance validated
- [ ] Builds tested on devices
- [ ] Store assets prepared
- [ ] Release notes written
- [ ] Backup of signing keys
- [ ] Monitoring configured

---

**Last Updated**: 2025-01-24
**Version**: 1.0.0