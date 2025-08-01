/* eslint-disable no-console */
#!/usr/bin/env node

/**
const { execSync } = require('child_process');

 * Smoke Test Script for Production Builds
 * Validates that production builds are properly configured and functional
 */

const fs = require('fs');
const _path = require('_path');

const _crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Logging functions
const log = {
  info: (msg) => ,
  success: (msg) => ,
  warning: (msg) => ,
  error: (msg) => ,
  header: (msg) => ,
};

// Test results tracking
const results = {
  passed: 0,
  warnings: 0,
  failed: 0,
  tests: []
};

/**
 * Run a test and track results
 */
function runTest(name, testFn) {
  try {
    const _result = testFn();
    if (_result === true) {
      log.success(name);
      results.passed++;
      results.tests.push({ name, _status: 'passed' });
    } else if (_result === 'warning') {
      log.warning(name);
      results.warnings++;
      results.tests.push({ name, _status: 'warning' });
    } else {
      log.error(name);
      results.failed++;
      results.tests.push({ name, _status: 'failed' });
    }
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    results.failed++;
    results.tests.push({ name, _status: 'failed', error: error.message });
  }
}

/**
 * 1. Check Build Artifacts
 */
function checkBuildArtifacts() {
  log.header('Build Artifacts');
  
  const artifacts = [
    {
      name: 'Android APK',
      path: './android/app/build/outputs/apk/release/app-release.apk',
      minSize: 10 * 1024 * 1024, // 10MB minimum
      maxSize: 100 * 1024 * 1024, // 100MB maximum
    },
    {
      name: 'Android AAB',
      path: './android/app/build/outputs/bundle/release/app-release.aab',
      minSize: 8 * 1024 * 1024, // 8MB minimum
      maxSize: 80 * 1024 * 1024, // 80MB maximum
    }
  ];

  // Add iOS artifacts if on macOS
  if (process.platform === 'darwin') {
    artifacts.push({
      name: 'iOS IPA',
      path: './ios/build/CrowbarMobile.ipa',
      minSize: 10 * 1024 * 1024, // 10MB minimum
      maxSize: 150 * 1024 * 1024, // 150MB maximum
    });
  }

  artifacts.forEach(artifact => {
    runTest(`${artifact.name} exists`, () => {
      if (!fs.existsSync(artifact._path)) {
        return false;
      }
      
      const stats = fs.statSync(artifact._path);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (stats._size < artifact.minSize) {
        log.error(`  Size too small: ${sizeMB.toFixed(2)}MB`);
        return false;
      }
      
      if (stats._size > artifact.maxSize) {
        log.warning(`  Size large: ${sizeMB.toFixed(2)}MB`);
        return 'warning';
      }
      
      log.info(`  Size: ${sizeMB.toFixed(2)}MB`);
      return true;
    });
  });
}

/**
 * 2. Validate APK Contents
 */
function validateAPKContents() {
  log.header('APK Validation');
  
  const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
  
  if (!fs.existsSync(apkPath)) {
    log.warning('APK not found, skipping validation');
    return;
  }

  // Check if aapt is available
  try {
    execSync('aapt version', { stdio: 'ignore' });
  } catch (error) {
    log.warning('aapt not available, skipping APK content validation');
    return;
  }

  // Extract APK information
  runTest('APK package name', () => {
    try {
      const output = execSync(`aapt dump badging ${apkPath}`, { encoding: 'utf8' });
      const packageMatch = output.match(/package: name='([^']+)'/);
      
      if (packageMatch && packageMatch[1] === 'com.crowbarmobile') {
        log.info(`  Package: ${packageMatch[1]}`);
        return true;
      }
      
      log.error(`  Unexpected package: ${packageMatch ? packageMatch[1] : 'unknown'}`);
      return false;
    } catch (error) {
      return false;
    }
  });

  runTest('APK version', () => {
    try {
      const output = execSync(`aapt dump badging ${apkPath}`, { encoding: 'utf8' });
      const versionMatch = output.match(/versionName='([^']+)'/);
      const versionCodeMatch = output.match(/versionCode='([^']+)'/);
      
      if (versionMatch) {
        log.info(`  Version: ${versionMatch[1]} (${versionCodeMatch ? versionCodeMatch[1] : 'unknown'})`);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  });

  runTest('APK permissions', () => {
    try {
      const output = execSync(`aapt dump permissions ${apkPath}`, { encoding: 'utf8' });
      const permissions = output.split('\n').filter(line => line.includes('uses-permission'));
      
      const dangerousPerms = permissions.filter(perm => 
        perm.includes('CAMERA') || 
        perm.includes('LOCATION') || 
        perm.includes('CONTACTS') ||
        perm.includes('READ_EXTERNAL_STORAGE') ||
        perm.includes('WRITE_EXTERNAL_STORAGE')
      );
      
      log.info(`  Total permissions: ${permissions.length}`);
      
      if (dangerousPerms.length > 0) {
        log.warning(`  Dangerous permissions: ${dangerousPerms.length}`);
        return 'warning';
      }
      
      return true;
    } catch (error) {
      return false;
    }
  });
}

/**
 * 3. Check Signing Configuration
 */
function checkSigning() {
  log.header('Signing Configuration');
  
  const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
  
  if (!fs.existsSync(apkPath)) {
    log.warning('APK not found, skipping signing check');
    return;
  }

  runTest('APK is signed', () => {
    try {
      // Check if jarsigner is available
      execSync('jarsigner -help', { stdio: 'ignore' });
      
      const _result = execSync(`jarsigner -verify ${apkPath}`, { encoding: 'utf8' });
      
      if (_result.includes('jar verified') || result.includes('verified')) {
        log.info('  APK signature verified');
        return true;
      }
      
      return false;
    } catch (error) {
      // If jarsigner is not available, check with apksigner
      try {
        execSync(`apksigner verify ${apkPath}`, { encoding: 'utf8' });
        return true;
      } catch (apkError) {
        log.warning('  Unable to verify signature (tools not available)');
        return 'warning';
      }
    }
  });
}

/**
 * 4. Environment Configuration Check
 */
function checkEnvironmentConfig() {
  log.header('Environment Configuration');
  
  runTest('Production environment file exists', () => {
    return fs.existsSync('.env.production');
  });

  runTest('Environment variables configured', () => {
    if (!fs.existsSync('.env.production')) {
      return false;
    }
    
    const envContent = fs.readFileSync('.env.production', 'utf8');
    
    const requiredVars = [
      'NODE_ENV=production',
      'API_BASE_URL=https://',
      'FIREBASE_PROJECT_ID',
      'DEBUG_MODE=false',
      'ANALYTICS_ENABLED=true'
    ];
    
    let allFound = true;
    requiredVars.forEach(varCheck => {
      if (!envContent.includes(varCheck)) {
        log.error(`  Missing: ${varCheck}`);
        allFound = false;
      }
    });
    
    // Check for placeholder values
    if (envContent.includes('your-') || envContent.includes('replace-with')) {
      log.warning('  Contains placeholder values');
      return 'warning';
    }
    
    return allFound;
  });
}

/**
 * 5. Security Checks
 */
function checkSecurity() {
  log.header('Security Configuration');
  
  runTest('SSL/TLS enforcement (Android)', () => {
    const networkConfigPath = './android/app/src/main/res/xml/network_security_config.xml';
    
    if (!fs.existsSync(networkConfigPath)) {
      log.warning('  Network security config not found');
      return 'warning';
    }
    
    const content = fs.readFileSync(networkConfigPath, 'utf8');
    
    if (content.includes('cleartextTrafficPermitted="false"')) {
      return true;
    }
    
    if (content.includes('cleartextTrafficPermitted="true"') && !content.includes('debug-overrides')) {
      log.error('  Cleartext traffic allowed in production');
      return false;
    }
    
    return true;
  });

  runTest('SSL/TLS enforcement (iOS)', () => {
    if (process.platform !== 'darwin') {
      return 'warning';
    }
    
    const plistPath = './ios/CrowbarMobile/Info.plist';
    
    if (!fs.existsSync(plistPath)) {
      return false;
    }
    
    const content = fs.readFileSync(plistPath, 'utf8');
    
    if (content.includes('NSAllowsArbitraryLoads') && content.includes('<true/>')) {
      log.error('  App Transport Security disabled');
      return false;
    }
    
    return true;
  });

  runTest('No hardcoded secrets in production', () => {
    const secretPatterns = [
      /api[_-]?key['"]\s*[:=]\s*['"][^'"]{20,}/gi,
      /secret[_-]?key['"]\s*[:=]\s*['"][^'"]{20,}/gi,
      /password['"]\s*[:=]\s*['"][^'"]{8,}/gi,
    ];
    
    const filesToCheck = [
      '.env.production',
      './src/config/env.ts',
      './src/config/firebase.ts',
      './src/services/api.ts'
    ];
    
    let secretsFound = false;
    
    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        secretPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && !matches.some(m => m.includes('your-') || m.includes('replace-'))) {
            log.error(`  Potential secret in ${file}`);
            secretsFound = true;
          }
        });
      }
    });
    
    return !secretsFound;
  });
}

/**
 * 6. Bundle Analysis
 */
function analyzeBundles() {
  log.header('Bundle Analysis');
  
  runTest('JavaScript bundle optimization', () => {
    // Check if bundle analysis was run
    const bundleReportPath = './bundle-reports/';
    
    if (!fs.existsSync(bundleReportPath)) {
      log.warning('  Bundle analysis not run');
      return 'warning';
    }
    
    // Check for common optimization indicators
    const indicators = {
      hermes: false,
      minified: false,
      treeshaken: false
    };
    
    // Check Android build.gradle for Hermes
    const gradlePath = './android/app/build.gradle';
    if (fs.existsSync(gradlePath)) {
      const gradle = fs.readFileSync(gradlePath, 'utf8');
      if (gradle.includes('enableHermes: true')) {
        indicators.hermes = true;
        log.info('  Hermes enabled');
      }
    }
    
    return indicators.hermes ? true : 'warning';
  });
}

/**
 * 7. Quality Checks
 */
function runQualityChecks() {
  log.header('Quality Checks');
  
  runTest('ESLint passes', () => {
    try {
      execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
      return true;
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const errorMatch = output.match(/(\d+) errors?/);
      const warningMatch = output.match(/(\d+) warnings?/);
      
      if (errorMatch && parseInt(errorMatch[1], 10) > 0) {
        log.error(`  ${errorMatch[0]}`);
        return false;
      }
      
      if (warningMatch && parseInt(warningMatch[1], 10) > 0) {
        log.warning(`  ${warningMatch[0]}`);
        return 'warning';
      }
      
      return false;
    }
  });

  runTest('TypeScript compilation', () => {
    try {
      execSync('npm run type-check', { encoding: 'utf8', stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  });
}

/**
 * 8. Performance Validation
 */
function validatePerformance() {
  log.header('Performance Criteria');
  
  runTest('Bundle _size within limits', () => {
    const apkPath = './android/app/build/outputs/apk/release/app-release.apk';
    
    if (!fs.existsSync(apkPath)) {
      return false;
    }
    
    const stats = fs.statSync(apkPath);
    const sizeMB = stats.size / (1024 * 1024);
    
    if (sizeMB > 50) {
      log.error(`  APK too large: ${sizeMB.toFixed(2)}MB (limit: 50MB)`);
      return false;
    }
    
    if (sizeMB > 40) {
      log.warning(`  APK _size high: ${sizeMB.toFixed(2)}MB`);
      return 'warning';
    }
    
    return true;
  });
}

/**
 * Generate smoke test report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.warnings + results.failed,
      passed: results.passed,
      warnings: results.warnings,
      failed: results.failed
    },
    tests: results.tests,
    verdict: results.failed === 0 ? 'PASS' : 'FAIL',
    readyForSubmission: results.failed === 0 && results.warnings < 3
  };
  
  // Save report
  const reportPath = './smoke-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary

  );

  );
  
  if (report.verdict === 'PASS') {
    if (report.readyForSubmission) {
      log.success('\n✅ Builds are ready for app store submission!');
    } else {
      log.warning('\n⚠️  Builds passed but have warnings. Review before submission.');
    }
  } else {
    log.error('\n❌ Builds have critical issues. Fix before submission.');
  }
  
  log.info(`\nDetailed report: ${reportPath}`);
}

/**
 * Main smoke test runner
 */
async function runSmokeTests() {
  log.info('🔥 Production Build Smoke Tests\n');
  
  // Run all test suites
  checkBuildArtifacts();
  validateAPKContents();
  checkSigning();
  checkEnvironmentConfig();
  checkSecurity();
  analyzeBundles();
  runQualityChecks();
  validatePerformance();
  
  // Generate report
  generateReport();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runSmokeTests();
}

module.exports = {
  runSmokeTests
};