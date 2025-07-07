#!/usr/bin/env node

/**
 * Crowbar Mobile - App Store Submission Script
 * Automates submission to App Store and Google Play Store
 */

const fs = require('fs');
const path = require('path');
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
  appStore: {
    teamId: 'APPLE_TEAM_ID',
    appId: 'APP_STORE_APP_ID',
    bundleId: 'com.crowbar.mobile',
    ipaPath: './ios/build/CrowbarMobile.ipa',
    username: 'APPLE_ID_EMAIL',
    password: 'APP_SPECIFIC_PASSWORD'
  },
  googlePlay: {
    packageName: 'com.crowbar.mobile',
    aabPath: './android/app/build/outputs/bundle/release/app-release.aab',
    serviceAccountKey: './android/service-account-key.json',
    track: 'production' // internal, alpha, beta, production
  },
  metadata: {
    metadataFile: './store-assets/app-store-metadata.json'
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
  title: (msg) => console.log(`${colors.cyan}${colors.bold}🏪 ${msg}${colors.reset}\n`),
};

/**
 * Run command and capture output
 */
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
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
 * Check submission prerequisites
 */
function checkPrerequisites() {
  log.info('Checking submission prerequisites...');
  
  const checks = [];
  
  // Common checks
  checks.push(
    { name: 'Node.js', command: 'node --version' },
    { name: 'Store Assets', check: () => fs.existsSync('./store-assets') }
  );
  
  // iOS specific checks
  if (process.platform === 'darwin') {
    checks.push(
      { name: 'Xcode Command Line Tools', command: 'xcode-select --version' },
      { name: 'Transporter (optional)', command: 'xcrun altool --version', optional: true }
    );
  }
  
  // Android specific checks
  checks.push(
    { name: 'Java', command: 'java -version' }
  );
  
  let allPassed = true;
  
  checks.forEach(check => {
    if (check.command) {
      const result = runCommand(check.command, { silent: true });
      if (result.success) {
        log.success(`${check.name} is available`);
      } else {
        if (check.optional) {
          log.warning(`${check.name} is not available (optional)`);
        } else {
          log.error(`${check.name} is not available`);
          allPassed = false;
        }
      }
    } else if (check.check) {
      if (check.check()) {
        log.success(`${check.name} is available`);
      } else {
        log.error(`${check.name} is not available`);
        allPassed = false;
      }
    }
  });
  
  return allPassed;
}

/**
 * Validate builds before submission
 */
function validateBuilds() {
  log.info('Validating builds for submission...');
  
  const validations = [];
  
  // Check iOS build
  if (process.platform === 'darwin') {
    const { ipaPath } = CONFIG.appStore;
    if (fs.existsSync(ipaPath)) {
      const stats = fs.statSync(ipaPath);
      validations.push({
        platform: 'iOS',
        file: ipaPath,
        size: stats.size,
        valid: stats.size > 1024 * 1024 // At least 1MB
      });
    } else {
      validations.push({
        platform: 'iOS',
        file: ipaPath,
        valid: false,
        error: 'IPA file not found'
      });
    }
  }
  
  // Check Android build
  const { aabPath } = CONFIG.googlePlay;
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    validations.push({
      platform: 'Android',
      file: aabPath,
      size: stats.size,
      valid: stats.size > 1024 * 1024 // At least 1MB
    });
  } else {
    validations.push({
      platform: 'Android',
      file: aabPath,
      valid: false,
      error: 'AAB file not found'
    });
  }
  
  // Display validation results
  console.log('\n📋 Build Validation Results:');
  console.log('='.repeat(50));
  
  let allValid = true;
  validations.forEach(validation => {
    const status = validation.valid ? '✅' : '❌';
    if (validation.valid) {
      const size = `${(validation.size / 1024 / 1024).toFixed(2)} MB`;
      console.log(`${status} ${validation.platform}: ${size}`);
    } else {
      console.log(`${status} ${validation.platform}: ${validation.error}`);
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * Prepare store assets
 */
function prepareStoreAssets() {
  log.info('Preparing store assets...');
  
  try {
    // Generate store assets if not already done
    if (!fs.existsSync('./store-assets/app-store-metadata.json')) {
      log.info('Generating store assets...');
      const generateResult = runCommand('npm run store:assets', { silent: true });
      if (!generateResult.success) {
        log.error('Failed to generate store assets');
        return false;
      }
    }
    
    // Validate metadata file
    if (!fs.existsSync(CONFIG.metadata.metadataFile)) {
      log.error('Store metadata file not found');
      return false;
    }
    
    const metadata = JSON.parse(fs.readFileSync(CONFIG.metadata.metadataFile, 'utf8'));
    
    // Check for placeholder values
    const metadataStr = JSON.stringify(metadata);
    if (metadataStr.includes('REPLACE_WITH_') || metadataStr.includes('your-')) {
      log.warning('Store metadata contains placeholder values. Please update before submission.');
    }
    
    log.success('Store assets prepared');
    return true;
    
  } catch (error) {
    log.error(`Store assets preparation failed: ${error.message}`);
    return false;
  }
}

/**
 * Submit to App Store (iOS)
 */
function submitToAppStore() {
  log.info('Submitting to App Store...');
  
  if (process.platform !== 'darwin') {
    log.warning('App Store submission requires macOS. Skipping iOS submission.');
    return true;
  }
  
  try {
    const { appStore } = CONFIG;
    
    // Check if IPA exists
    if (!fs.existsSync(appStore.ipaPath)) {
      log.error('IPA file not found. Please build iOS app first.');
      return false;
    }
    
    // Method 1: Try using Transporter (recommended)
    log.info('Attempting submission via Transporter...');
    
    const transporterCommand = `xcrun altool --upload-app --type ios --file "${appStore.ipaPath}" --username "${appStore.username}" --password "${appStore.password}"`;
    
    const transporterResult = runCommand(transporterCommand, { silent: true });
    
    if (transporterResult.success) {
      log.success('iOS app uploaded successfully via Transporter');
      return true;
    } else {
      log.warning('Transporter upload failed. Manual submission required.');
      
      // Provide manual instructions
      log.info('Manual submission steps:');
      log.info('1. Open Xcode');
      log.info('2. Go to Window > Organizer');
      log.info('3. Select your app archive');
      log.info('4. Click "Distribute App"');
      log.info('5. Choose "App Store Connect"');
      log.info('6. Follow the upload wizard');
      
      return false;
    }
    
  } catch (error) {
    log.error(`App Store submission failed: ${error.message}`);
    return false;
  }
}

/**
 * Submit to Google Play Store (Android)
 */
function submitToGooglePlay() {
  log.info('Submitting to Google Play Store...');
  
  try {
    const { googlePlay } = CONFIG;
    
    // Check if AAB exists
    if (!fs.existsSync(googlePlay.aabPath)) {
      log.error('AAB file not found. Please build Android app first.');
      return false;
    }
    
    // Check if service account key exists
    if (!fs.existsSync(googlePlay.serviceAccountKey)) {
      log.warning('Google Play service account key not found. Manual submission required.');
      
      // Provide manual instructions
      log.info('Manual submission steps:');
      log.info('1. Go to Google Play Console');
      log.info('2. Select your app');
      log.info('3. Go to Release > Production');
      log.info('4. Create new release');
      log.info(`5. Upload AAB file: ${googlePlay.aabPath}`);
      log.info('6. Fill in release notes');
      log.info('7. Review and rollout');
      
      return false;
    }
    
    // Try automated submission using Google Play CLI (if available)
    log.info('Attempting automated submission...');
    
    // Note: This would require google-play-cli or similar tool
    // For now, we'll provide manual instructions
    log.warning('Automated Google Play submission not implemented. Manual submission required.');
    
    log.info('Manual submission steps:');
    log.info('1. Go to https://play.google.com/console');
    log.info('2. Select your app');
    log.info('3. Go to Release > Production');
    log.info('4. Create new release');
    log.info(`5. Upload AAB file: ${googlePlay.aabPath}`);
    log.info('6. Fill in release notes');
    log.info('7. Review and rollout');
    
    return false;
    
  } catch (error) {
    log.error(`Google Play submission failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate submission report
 */
function generateSubmissionReport() {
  log.info('Generating submission report...');
  
  const report = `# App Store Submission Report

## Submission Information
- **Date**: ${new Date().toISOString()}
- **App Version**: ${CONFIG.app.version}
- **Build Number**: ${CONFIG.app.buildNumber}

## Builds Submitted

### iOS (App Store)
- **Bundle ID**: ${CONFIG.appStore.bundleId}
- **IPA Path**: ${CONFIG.appStore.ipaPath}
- **Status**: ${fs.existsSync(CONFIG.appStore.ipaPath) ? 'Ready for submission' : 'Build not found'}

### Android (Google Play)
- **Package Name**: ${CONFIG.googlePlay.packageName}
- **AAB Path**: ${CONFIG.googlePlay.aabPath}
- **Status**: ${fs.existsSync(CONFIG.googlePlay.aabPath) ? 'Ready for submission' : 'Build not found'}

## Submission Checklist

### Pre-Submission
- [ ] Builds validated and tested
- [ ] Store assets generated
- [ ] Metadata reviewed and updated
- [ ] Legal documents (privacy policy, terms) updated
- [ ] App icons and screenshots prepared

### App Store (iOS)
- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles valid
- [ ] IPA uploaded successfully
- [ ] App information completed
- [ ] Screenshots and metadata uploaded
- [ ] Submitted for review

### Google Play Store (Android)
- [ ] Google Play Console account active
- [ ] App created in console
- [ ] AAB uploaded successfully
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] Pricing and distribution set
- [ ] Released to production

## Next Steps
1. Monitor submission status in respective consoles
2. Respond to any review feedback
3. Prepare for app launch marketing
4. Set up post-launch monitoring
5. Plan for future updates

## Important Links
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policy**: https://play.google.com/about/developer-content-policy/

---
Generated by: App Store Submission Script
`;

  fs.writeFileSync('./docs/SUBMISSION_REPORT.md', report);
  log.success('Submission report generated: docs/SUBMISSION_REPORT.md');
}

/**
 * Create submission checklist
 */
function createSubmissionChecklist() {
  log.info('Creating submission checklist...');
  
  const checklist = `# App Store Submission Checklist

## Pre-Submission Requirements

### General
- [ ] App builds completed and validated
- [ ] All features tested on physical devices
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Legal compliance verified

### Store Assets
- [ ] App icons generated (all sizes)
- [ ] Screenshots captured (all required sizes)
- [ ] Feature graphics created
- [ ] App descriptions written
- [ ] Keywords optimized
- [ ] Privacy policy updated
- [ ] Terms of service updated

### Technical Requirements
- [ ] App follows platform guidelines
- [ ] No crashes or critical bugs
- [ ] Proper error handling implemented
- [ ] Offline functionality tested
- [ ] Performance optimized

## iOS App Store Submission

### Apple Developer Account
- [ ] Apple Developer Program membership active
- [ ] Team roles and permissions configured
- [ ] Certificates valid and not expiring soon
- [ ] Provisioning profiles configured

### App Store Connect
- [ ] App created in App Store Connect
- [ ] App information completed
- [ ] Pricing and availability set
- [ ] App Review Information provided
- [ ] Version information completed

### Build Upload
- [ ] Archive created successfully
- [ ] IPA exported with correct settings
- [ ] Build uploaded via Xcode or Transporter
- [ ] Build processing completed
- [ ] Build selected for submission

### Review Submission
- [ ] All required information provided
- [ ] Screenshots uploaded
- [ ] App description finalized
- [ ] Keywords set
- [ ] Age rating completed
- [ ] Submitted for review

## Google Play Store Submission

### Google Play Console
- [ ] Google Play Console account active
- [ ] App created in console
- [ ] Developer account verified
- [ ] Payment profile set up (if paid app)

### Store Listing
- [ ] App title and description
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] App icon uploaded
- [ ] Categorization completed
- [ ] Contact details provided

### Release Management
- [ ] AAB uploaded successfully
- [ ] Release notes written
- [ ] Content rating completed
- [ ] Target audience selected
- [ ] Pricing and distribution configured

### Policy Compliance
- [ ] Content policy compliance verified
- [ ] Privacy policy linked
- [ ] Permissions justified
- [ ] Data safety form completed

## Post-Submission

### Monitoring
- [ ] Review status monitoring set up
- [ ] Crash reporting active
- [ ] Analytics configured
- [ ] Performance monitoring enabled

### Marketing Preparation
- [ ] Launch plan prepared
- [ ] Press kit ready
- [ ] Social media content prepared
- [ ] Website updated

### Support Preparation
- [ ] Support documentation ready
- [ ] FAQ prepared
- [ ] Support channels configured
- [ ] User feedback process established

---
**Completion Date**: ___________
**Submitted By**: ___________
**Review Status**: ___________
`;

  fs.writeFileSync('./docs/SUBMISSION_CHECKLIST.md', checklist);
  log.success('Submission checklist created: docs/SUBMISSION_CHECKLIST.md');
}

/**
 * Main submission function
 */
async function main() {
  log.title('App Store Submission');
  
  try {
    // Check prerequisites
    if (!checkPrerequisites()) {
      log.error('Prerequisites not met');
      process.exit(1);
    }
    
    // Submission tasks
    const tasks = [
      { name: 'Validate Builds', fn: validateBuilds },
      { name: 'Prepare Store Assets', fn: prepareStoreAssets },
      { name: 'Submit to App Store', fn: submitToAppStore, optional: true },
      { name: 'Submit to Google Play', fn: submitToGooglePlay, optional: true },
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
        if (task.optional) {
          log.warning(`${task.name} requires manual completion`);
        } else {
          log.error(`${task.name} failed`);
        }
      }
    }
    
    // Generate documentation
    generateSubmissionReport();
    createSubmissionChecklist();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log.title('App Store Submission Summary');
    
    console.log(`✅ Completed: ${successCount}/${tasks.length} automated tasks`);
    console.log(`📱 App Version: ${CONFIG.app.version} (${CONFIG.app.buildNumber})`);
    console.log(`📁 Reports: docs/SUBMISSION_REPORT.md, docs/SUBMISSION_CHECKLIST.md`);
    
    log.info('Manual submission steps:');
    log.info('1. Complete submission checklist');
    log.info('2. Upload builds to respective stores');
    log.info('3. Fill in store metadata');
    log.info('4. Submit for review');
    log.info('5. Monitor review status');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    log.error(`App store submission failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  validateBuilds,
  prepareStoreAssets,
  submitToAppStore,
  submitToGooglePlay,
  generateSubmissionReport,
  createSubmissionChecklist,
};
