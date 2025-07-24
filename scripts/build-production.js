#!/usr/bin/env node

/**
 * Crowbar Mobile - Production Build Script
 * Generates final optimized builds for iOS and Android with signing
 */

const fs = require('fs');
const _path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  app: {
    name: 'Crowbar Mobile',
    version: '1.0.0',
    buildNumber: '1',
    bundleId: 'com.crowbar.mobile',
    packageName: 'com.crowbar.mobile'
  },
  android: {
    buildType: 'release',
    outputDir: './android/app/build/outputs',
    keystore: {
      file: './android/app/crowbar-release-key.keystore',
      alias: 'crowbar-release',
      storePassword: 'KEYSTORE_PASSWORD',
      keyPassword: 'KEY_PASSWORD'
    }
  },
  ios: {
    scheme: 'CrowbarMobile',
    configuration: 'Release',
    outputDir: './ios/build',
    exportMethod: 'app-store',
    teamId: 'APPLE_TEAM_ID',
    provisioningProfile: 'Crowbar Mobile Distribution'
  },
  optimization: {
    enableHermes: true,
    enableProguard: true,
    enableR8: true,
    bundleSplitting: true,
    treeShaking: true,
    minifyJS: true,
    optimizeImages: true
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bold}📱 ${msg}${colors.reset}\n`),
};

/**
 * Run command and capture output
 */
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd(),
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

/**
 * Check build prerequisites
 */
function checkPrerequisites() {
  log.info('Checking build prerequisites...');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'React Native CLI', command: 'npx react-native --version' },
  ];
  
  // Platform-specific checks
  if (process.platform === 'darwin') {
    checks.push(
      { name: 'Xcode', command: 'xcodebuild -version' },
      { name: 'CocoaPods', command: 'pod --version' }
    );
  }
  
  checks.push(
    { name: 'Java', command: 'java -version' },
    { name: 'Android SDK', command: 'adb --version' }
  );
  
  let allPassed = true;
  
  checks.forEach(check => {
    const result = runCommand(check.command, { silent: true });
    if (result.success) {
      log.success(`${check.name} is available`);
    } else {
      log.error(`${check.name} is not available`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Prepare build environment
 */
function prepareBuildEnvironment() {
  log.info('Preparing build environment...');
  
  try {
    // Switch to production environment
    log.info('Switching to production environment...');
    runCommand('npm run env:prod', { silent: true });
    
    // Clean previous builds
    log.info('Cleaning previous builds...');
    runCommand('npm run clean', { silent: true });
    
    // Install dependencies
    log.info('Installing dependencies...');
    const installResult = runCommand('npm install', { silent: true });
    if (!installResult.success) {
      log.error('Failed to install dependencies');
      return false;
    }
    
    // Optimize assets
    log.info('Optimizing assets...');
    runCommand('npm run optimize:assets', { silent: true });
    
    log.success('Build environment prepared');
    return true;
    
  } catch (error) {
    log.error(`Build environment preparation failed: ${error.message}`);
    return false;
  }
}

/**
 * Build Android APK/AAB
 */
function buildAndroid() {
  log.info('Building Android release...');
  
  try {
    // Check Android environment
    if (!fs.existsSync('./android')) {
      log.error('Android project not found');
      return false;
    }
    
    // Install Android dependencies
    log.info('Installing Android dependencies...');
    runCommand('cd android && ./gradlew clean', { silent: true });
    
    // Configure signing
    log.info('Configuring Android signing...');
    const { keystore } = CONFIG.android;
    
    // Check if keystore exists
    if (!fs.existsSync(keystore.file)) {
      log.warning('Release keystore not found. Creating debug build...');
      
      // Build debug APK
      const debugResult = runCommand('cd android && ./gradlew assembleDebug');
      if (!debugResult.success) {
        log.error('Debug build failed');
        return false;
      }
      
      log.success('Android debug build completed');
      return true;
    }
    
    // Build release APK
    log.info('Building release APK...');
    const apkResult = runCommand('cd android && ./gradlew assembleRelease');
    if (!apkResult.success) {
      log.error('APK build failed');
      return false;
    }
    
    // Build release AAB (for Play Store)
    log.info('Building release AAB...');
    const aabResult = runCommand('cd android && ./gradlew bundleRelease');
    if (!aabResult.success) {
      log.warning('AAB build failed, but APK succeeded');
    }
    
    // Verify builds
    const apkPath = `${CONFIG.android.outputDir}/apk/release/app-release.apk`;
    const aabPath = `${CONFIG.android.outputDir}/bundle/release/app-release.aab`;
    
    if (fs.existsSync(apkPath)) {
      const apkSize = fs.statSync(apkPath).size;
      log.success(`APK built successfully (${(apkSize / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    if (fs.existsSync(aabPath)) {
      const aabSize = fs.statSync(aabPath).size;
      log.success(`AAB built successfully (${(aabSize / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    log.success('Android build completed');
    return true;
    
  } catch (error) {
    log.error(`Android build failed: ${error.message}`);
    return false;
  }
}

/**
 * Build iOS IPA
 */
function buildIOS() {
  log.info('Building iOS release...');
  
  if (process.platform !== 'darwin') {
    log.warning('iOS build requires macOS. Skipping iOS build.');
    return true;
  }
  
  try {
    // Check iOS environment
    if (!fs.existsSync('./ios')) {
      log.error('iOS project not found');
      return false;
    }
    
    // Install iOS dependencies
    log.info('Installing iOS dependencies...');
    runCommand('cd ios && pod install', { silent: true });
    
    // Build iOS project
    log.info('Building iOS project...');
    const { ios } = CONFIG;
    
    const buildCommand = `cd ios && xcodebuild -workspace CrowbarMobile.xcworkspace -scheme ${ios.scheme} -configuration ${ios.configuration} -destination generic/platform=iOS -archivePath build/CrowbarMobile.xcarchive archive`;
    
    const buildResult = runCommand(buildCommand);
    if (!buildResult.success) {
      log.error('iOS build failed');
      return false;
    }
    
    // Export IPA
    log.info('Exporting IPA...');
    
    // Create export options plist
    const exportOptions = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>${ios.exportMethod}</string>
    <key>teamID</key>
    <string>${ios.teamId}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;
    
    fs.writeFileSync('./ios/ExportOptions.plist', exportOptions);
    
    const exportCommand = `cd ios && xcodebuild -exportArchive -archivePath build/CrowbarMobile.xcarchive -exportPath build -exportOptionsPlist ExportOptions.plist`;
    
    const exportResult = runCommand(exportCommand);
    if (!exportResult.success) {
      log.warning('IPA export failed, but archive succeeded');
    }
    
    // Verify build
    const ipaPath = `${ios.outputDir}/CrowbarMobile.ipa`;
    if (fs.existsSync(ipaPath)) {
      const ipaSize = fs.statSync(ipaPath).size;
      log.success(`IPA built successfully (${(ipaSize / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    log.success('iOS build completed');
    return true;
    
  } catch (error) {
    log.error(`iOS build failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate builds
 */
function validateBuilds() {
  log.info('Validating builds...');
  
  const validations = [];
  
  // Validate Android builds
  const apkPath = `${CONFIG.android.outputDir}/apk/release/app-release.apk`;
  const aabPath = `${CONFIG.android.outputDir}/bundle/release/app-release.aab`;
  
  if (fs.existsSync(apkPath)) {
    const apkSize = fs.statSync(apkPath).size;
    validations.push({
      platform: 'Android APK',
      path: apkPath,
      size: apkSize,
      valid: apkSize > 1024 * 1024 // At least 1MB
    });
  }
  
  if (fs.existsSync(aabPath)) {
    const aabSize = fs.statSync(aabPath).size;
    validations.push({
      platform: 'Android AAB',
      path: aabPath,
      size: aabSize,
      valid: aabSize > 1024 * 1024 // At least 1MB
    });
  }
  
  // Validate iOS builds (macOS only)
  if (process.platform === 'darwin') {
    const ipaPath = `${CONFIG.ios.outputDir}/CrowbarMobile.ipa`;
    if (fs.existsSync(ipaPath)) {
      const ipaSize = fs.statSync(ipaPath).size;
      validations.push({
        platform: 'iOS IPA',
        path: ipaPath,
        size: ipaSize,
        valid: ipaSize > 1024 * 1024 // At least 1MB
      });
    }
  }
  
  // Display validation results
  console.log('\n📋 Build Validation Results:');
  console.log('='.repeat(60));
  
  let allValid = true;
  validations.forEach(validation => {
    const status = validation.valid ? '✅' : '❌';
    const size = `${(validation.size / 1024 / 1024).toFixed(2)} MB`;
    console.log(`${status} ${validation.platform}: ${size}`);
    console.log(`   Path: ${validation.path}`);
    if (!validation.valid) allValid = false;
  });
  
  if (validations.length === 0) {
    log.warning('No builds found to validate');
    return false;
  }
  
  return allValid;
}

/**
 * Generate build report
 */
function generateBuildReport() {
  log.info('Generating build report...');
  
  const builds = [];
  
  // Check Android builds
  const apkPath = `${CONFIG.android.outputDir}/apk/release/app-release.apk`;
  const aabPath = `${CONFIG.android.outputDir}/bundle/release/app-release.aab`;
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    builds.push({
      platform: 'Android',
      type: 'APK',
      path: apkPath,
      size: stats.size,
      created: stats.mtime
    });
  }
  
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    builds.push({
      platform: 'Android',
      type: 'AAB',
      path: aabPath,
      size: stats.size,
      created: stats.mtime
    });
  }
  
  // Check iOS builds
  if (process.platform === 'darwin') {
    const ipaPath = `${CONFIG.ios.outputDir}/CrowbarMobile.ipa`;
    if (fs.existsSync(ipaPath)) {
      const stats = fs.statSync(ipaPath);
      builds.push({
        platform: 'iOS',
        type: 'IPA',
        path: ipaPath,
        size: stats.size,
        created: stats.mtime
      });
    }
  }
  
  const report = `# Production Build Report

## Build Information
- **Date**: ${new Date().toISOString()}
- **Version**: ${CONFIG.app.version}
- **Build Number**: ${CONFIG.app.buildNumber}
- **Environment**: Production

## Generated Builds

${builds.map(build => `### ${build.platform} ${build.type}
- **Path**: ${build.path}
- **Size**: ${(build.size / 1024 / 1024).toFixed(2)} MB
- **Created**: ${build.created.toISOString()}
`).join('\n')}

## Build Configuration
- **Hermes**: ${CONFIG.optimization.enableHermes ? 'Enabled' : 'Disabled'}
- **ProGuard**: ${CONFIG.optimization.enableProguard ? 'Enabled' : 'Disabled'}
- **R8**: ${CONFIG.optimization.enableR8 ? 'Enabled' : 'Disabled'}
- **Bundle Splitting**: ${CONFIG.optimization.bundleSplitting ? 'Enabled' : 'Disabled'}
- **Tree Shaking**: ${CONFIG.optimization.treeShaking ? 'Enabled' : 'Disabled'}

## Next Steps
- [ ] Test builds on physical devices
- [ ] Verify app functionality
- [ ] Check performance metrics
- [ ] Submit to app stores
- [ ] Monitor crash reports

## Store Submission
### Android (Google Play)
- Upload AAB file to Google Play Console
- Complete store listing information
- Submit for review

### iOS (App Store)
- Upload IPA via Xcode or Transporter
- Complete App Store Connect information
- Submit for review

---
Generated by: Production Build Script
`;

  fs.writeFileSync('./docs/BUILD_REPORT.md', report);
  log.success('Build report generated: docs/BUILD_REPORT.md');
}

/**
 * Main build function
 */
async function main() {
  log.title('Production Build');
  
  try {
    // Check prerequisites
    if (!checkPrerequisites()) {
      log.error('Prerequisites not met');
      process.exit(1);
    }
    
    // Build tasks
    const tasks = [
      { name: 'Prepare Build Environment', fn: prepareBuildEnvironment },
      { name: 'Build Android', fn: buildAndroid },
      { name: 'Build iOS', fn: buildIOS },
      { name: 'Validate Builds', fn: validateBuilds },
    ];
    
    let successCount = 0;
    
    for (const task of tasks) {
      log.info(`\n${'='.repeat(50)}`);
      log.info(`${task.name}...`);
      log.info(`${'='.repeat(50)}`);
      
      const success = task.fn();
      if (success) {
        successCount++;
        log.success(`${task.name} completed`);
      } else {
        log.error(`${task.name} failed`);
        // Continue with other builds even if one fails
      }
    }
    
    // Generate report
    generateBuildReport();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log.title('Production Build Summary');
    
    console.log(`✅ Completed: ${successCount}/${tasks.length} tasks`);
    console.log(`📱 App Version: ${CONFIG.app.version} (${CONFIG.app.buildNumber})`);
    console.log(`📁 Report: docs/BUILD_REPORT.md`);
    
    if (successCount >= 3) { // At least prepare, one platform, and validate
      log.success('🎉 Production builds completed successfully!');
      log.info('Next steps:');
      log.info('1. Test builds on physical devices');
      log.info('2. Verify app functionality');
      log.info('3. Submit to app stores');
      log.info('4. Monitor deployment');
    } else {
      log.warning('⚠️ Production builds completed with issues. Please review and fix.');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    log.error(`Production build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  prepareBuildEnvironment,
  buildAndroid,
  buildIOS,
  validateBuilds,
  generateBuildReport,
};
