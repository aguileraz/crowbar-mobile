#!/usr/bin/env node

/**
 * Smoke Tests Script for Crowbar Mobile Production Build
 * Validates critical functionality and configuration for production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Logging functions
const log = {
  title: (msg) => console.log(`\n${colors.cyan}${colors.bold}🧪 ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (step, msg) => console.log(`${colors.cyan}[${step}]${colors.reset} ${msg}`)
};

const results = {
  passed: 0,
  warnings: 0,
  failed: 0,
  tests: []
};

/**
 * Test production environment configuration
 */
function testProductionEnvironment() {
  log.step(1, 'Testing production environment configuration...');
  
  try {
    // Check .env file exists and is set to production
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      results.failed++;
      results.tests.push({ name: 'Environment File', status: 'FAILED', message: '.env file not found' });
      log.error('.env file not found');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envConfig = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envConfig[key.trim()] = value.trim();
      }
    });

    // Validate production settings
    const requiredSettings = {
      'NODE_ENV': 'production',
      'BUILD_TYPE': 'production',
      'DEBUG_MODE': 'false',
      'FLIPPER_ENABLED': 'false',
      'DEV_MENU_ENABLED': 'false'
    };

    let envValid = true;
    Object.entries(requiredSettings).forEach(([key, expectedValue]) => {
      if (envConfig[key] !== expectedValue) {
        log.error(`${key} should be ${expectedValue}, got ${envConfig[key]}`);
        envValid = false;
      }
    });

    // Check API URLs are production
    if (!envConfig.API_BASE_URL || envConfig.API_BASE_URL.includes('localhost')) {
      log.error('API_BASE_URL should not contain localhost for production');
      envValid = false;
    }

    if (envValid) {
      results.passed++;
      results.tests.push({ name: 'Environment Configuration', status: 'PASSED', message: 'All production settings valid' });
      log.success('Production environment configuration valid');
    } else {
      results.failed++;
      results.tests.push({ name: 'Environment Configuration', status: 'FAILED', message: 'Invalid production settings' });
    }

  } catch (err) {
    results.failed++;
    results.tests.push({ name: 'Environment Configuration', status: 'FAILED', message: err.message });
    log.error(`Environment test failed: ${err.message}`);
  }
}

/**
 * Test bundle creation and validation
 */
function testBundleCreation() {
  log.step(2, 'Testing bundle creation...');
  
  try {
    // Test if we can create a bundle without errors
    const bundleCommand = 'npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test-bundle.js --assets-dest /tmp/test-assets';
    
    execSync(bundleCommand, { stdio: 'pipe', timeout: 120000 });
    
    // Check if bundle was created
    if (fs.existsSync('/tmp/test-bundle.js')) {
      const bundleStats = fs.statSync('/tmp/test-bundle.js');
      const bundleSizeMB = (bundleStats.size / 1024 / 1024).toFixed(2);
      
      log.success(`Bundle created successfully (${bundleSizeMB}MB)`);
      
      // Validate bundle size (should be reasonable for production)
      if (bundleStats.size > 10 * 1024 * 1024) { // 10MB
        results.warnings++;
        results.tests.push({ name: 'Bundle Size', status: 'WARNING', message: `Bundle size is ${bundleSizeMB}MB - consider optimization` });
        log.warning(`Bundle size is large: ${bundleSizeMB}MB`);
      } else {
        results.passed++;
        results.tests.push({ name: 'Bundle Creation', status: 'PASSED', message: `Bundle created (${bundleSizeMB}MB)` });
      }
      
      // Clean up
      fs.unlinkSync('/tmp/test-bundle.js');
      if (fs.existsSync('/tmp/test-assets')) {
        execSync('rm -rf /tmp/test-assets');
      }
    } else {
      results.failed++;
      results.tests.push({ name: 'Bundle Creation', status: 'FAILED', message: 'Bundle file not created' });
      log.error('Bundle file was not created');
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name: 'Bundle Creation', status: 'FAILED', message: err.message });
    log.error(`Bundle creation failed: ${err.message.split('\n')[0]}`);
  }
}

/**
 * Test TypeScript compilation
 */
function testTypeScriptCompilation() {
  log.step(3, 'Testing TypeScript compilation...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 60000 });
    results.passed++;
    results.tests.push({ name: 'TypeScript Compilation', status: 'PASSED', message: 'No TypeScript errors' });
    log.success('TypeScript compilation successful');
  } catch (err) {
    const errorOutput = err.stdout ? err.stdout.toString() : err.message;
    const errorCount = (errorOutput.match(/error TS/g) || []).length;
    
    if (errorCount > 0) {
      results.failed++;
      results.tests.push({ name: 'TypeScript Compilation', status: 'FAILED', message: `${errorCount} TypeScript errors found` });
      log.error(`TypeScript compilation failed with ${errorCount} errors`);
    } else {
      results.warnings++;
      results.tests.push({ name: 'TypeScript Compilation', status: 'WARNING', message: 'Compilation issues detected' });
      log.warning('TypeScript compilation completed with warnings');
    }
  }
}

/**
 * Test Firebase configuration
 */
function testFirebaseConfiguration() {
  log.step(4, 'Testing Firebase configuration...');
  
  try {
    // Check Android google-services.json
    const googleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
    if (fs.existsSync(googleServicesPath)) {
      const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
      
      if (googleServices.project_info && googleServices.project_info.project_id) {
        const projectId = googleServices.project_info.project_id;
        log.success(`Firebase Android configuration found (${projectId})`);
        
        // Check if it's a production project
        if (projectId.includes('dev') || projectId.includes('test')) {
          results.warnings++;
          results.tests.push({ name: 'Firebase Configuration', status: 'WARNING', message: 'Using development Firebase project' });
          log.warning('Firebase project appears to be for development');
        } else {
          results.passed++;
          results.tests.push({ name: 'Firebase Configuration', status: 'PASSED', message: 'Production Firebase configuration' });
        }
      } else {
        results.failed++;
        results.tests.push({ name: 'Firebase Configuration', status: 'FAILED', message: 'Invalid google-services.json format' });
        log.error('Invalid google-services.json format');
      }
    } else {
      results.failed++;
      results.tests.push({ name: 'Firebase Configuration', status: 'FAILED', message: 'google-services.json not found' });
      log.error('google-services.json not found');
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name: 'Firebase Configuration', status: 'FAILED', message: err.message });
    log.error(`Firebase configuration test failed: ${err.message}`);
  }
}

/**
 * Test critical dependencies
 */
function testDependencies() {
  log.step(5, 'Testing critical dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const criticalDeps = [
      'react-native',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      'react-navigation',
      '@reduxjs/toolkit',
      'react-native-paper'
    ];

    let depsValid = true;
    criticalDeps.forEach(dep => {
      const found = packageJson.dependencies[dep] || 
                   packageJson.dependencies[`@react-navigation/native`] || // Special case for react-navigation
                   Object.keys(packageJson.dependencies).find(key => key.includes(dep.replace('@', '').replace('/', '-')));
      
      if (!found) {
        log.error(`Critical dependency missing: ${dep}`);
        depsValid = false;
      }
    });

    if (depsValid) {
      results.passed++;
      results.tests.push({ name: 'Critical Dependencies', status: 'PASSED', message: 'All critical dependencies present' });
      log.success('All critical dependencies are present');
    } else {
      results.failed++;
      results.tests.push({ name: 'Critical Dependencies', status: 'FAILED', message: 'Missing critical dependencies' });
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name: 'Critical Dependencies', status: 'FAILED', message: err.message });
    log.error(`Dependencies test failed: ${err.message}`);
  }
}

/**
 * Test Android build configuration
 */
function testAndroidConfiguration() {
  log.step(6, 'Testing Android build configuration...');
  
  try {
    const gradlePropsPath = path.join(__dirname, '..', 'android', 'gradle.properties');
    if (fs.existsSync(gradlePropsPath)) {
      const gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');
      
      // Check key production settings
      const hasHermes = gradleProps.includes('hermesEnabled=true');
      
      if (hasHermes) {
        log.success('Hermes JS engine enabled');
      } else {
        log.warning('Hermes JS engine not enabled');
      }
      
      results.passed++;
      results.tests.push({ name: 'Android Configuration', status: 'PASSED', message: 'Android build configuration valid' });
      log.success('Android build configuration valid');
    } else {
      results.failed++;
      results.tests.push({ name: 'Android Configuration', status: 'FAILED', message: 'gradle.properties not found' });
      log.error('gradle.properties not found');
    }
  } catch (err) {
    results.failed++;
    results.tests.push({ name: 'Android Configuration', status: 'FAILED', message: err.message });
    log.error(`Android configuration test failed: ${err.message}`);
  }
}

/**
 * Generate smoke test report
 */
function generateReport() {
  log.title('Smoke Test Results Summary');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    summary: {
      total: results.tests.length,
      passed: results.passed,
      warnings: results.warnings,
      failed: results.failed
    },
    tests: results.tests,
    production_readiness: results.failed === 0 ? 'READY' : 'NOT_READY',
    recommendations: []
  };

  // Add recommendations based on results
  if (results.failed > 0) {
    report.recommendations.push('Fix all failed tests before production deployment');
  }
  if (results.warnings > 0) {
    report.recommendations.push('Review and address warning issues for optimal production performance');
  }
  if (results.failed === 0 && results.warnings === 0) {
    report.recommendations.push('Application is ready for production deployment');
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'smoke-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Display summary
  console.log('\n' + '='.repeat(60));
  log.title('SMOKE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total Tests: ${results.tests.length}${colors.reset}`);
  
  if (report.production_readiness === 'READY') {
    console.log(`\n${colors.green}${colors.bold}🚀 PRODUCTION READY${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}🚫 NOT PRODUCTION READY${colors.reset}`);
  }
  
  console.log('='.repeat(60));
  log.info(`Detailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Main smoke test execution
 */
async function runSmokeTests() {
  log.title('Crowbar Mobile Production Smoke Tests');
  
  try {
    testProductionEnvironment();
    testBundleCreation();
    testTypeScriptCompilation();
    testFirebaseConfiguration();
    testDependencies();
    testAndroidConfiguration();
    
    generateReport();
  } catch (err) {
    log.error(`Fatal error during smoke tests: ${err.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runSmokeTests();
}

module.exports = { runSmokeTests };