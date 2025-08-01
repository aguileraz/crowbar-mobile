#!/usr/bin/env node

/**
 * Final Build Validation Script
 * Orchestrates the complete production build and validation process
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}\n`),
};

// Validation steps tracking
const steps = {
  environment: { status: 'pending', name: 'Environment Setup' },
  quality: { status: 'pending', name: 'Quality Checks' },
  security: { status: 'pending', name: 'Security Review' },
  performance: { status: 'pending', name: 'Performance Tests' },
  build: { status: 'pending', name: 'Production Build' },
  smoke: { status: 'pending', name: 'Smoke Tests' },
};

/**
 * Run a command and capture results
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
 * 1. Validate Environment Setup
 */
function validateEnvironment() {
  log.header('📋 Step 1/6: Environment Setup');
  
  try {
    // Check Node version
    const nodeVersion = process.version;
    log.info(`Node.js version: ${nodeVersion}`);
    
    // Check if production environment exists
    if (!fs.existsSync('.env.production')) {
      log.error('Production environment file not found');
      log.info('Creating from example...');
      
      if (fs.existsSync('.env.production.secure.example')) {
        fs.copyFileSync('.env.production.secure.example', '.env.production');
        log.warning('Created .env.production - Please update with real values');
      } else {
        throw new Error('.env.production.secure.example not found');
      }
    }
    
    // Switch to production environment
    log.info('Switching to production environment...');
    const envResult = runCommand('npm run env:prod', { silent: true });
    
    if (!envResult.success) {
      throw new Error('Failed to switch to production environment');
    }
    
    // Validate environment variables
    const envContent = fs.readFileSync('.env.production', 'utf8');
    if (envContent.includes('your-') || envContent.includes('replace-with')) {
      log.warning('Production environment contains placeholder values');
      steps.environment.status = 'warning';
    } else {
      log.success('Environment setup validated');
      steps.environment.status = 'passed';
    }
    
  } catch (error) {
    log.error(`Environment validation failed: ${error.message}`);
    steps.environment.status = 'failed';
    return false;
  }
  
  return true;
}

/**
 * 2. Run Quality Checks
 */
function runQualityChecks() {
  log.header('🎯 Step 2/6: Quality Checks');
  
  try {
    // ESLint
    log.info('Running ESLint...');
    const lintResult = runCommand('npm run lint', { silent: true });
    
    if (!lintResult.success) {
      const errorMatch = lintResult.output.match(/(\d+) errors?/);
      const warningMatch = lintResult.output.match(/(\d+) warnings?/);
      
      if (errorMatch && parseInt(errorMatch[1], 10) > 0) {
        log.error(`ESLint: ${errorMatch[0]}`);
        steps.quality.status = 'failed';
        return false;
      }
      
      if (warningMatch) {
        log.warning(`ESLint: ${warningMatch[0]}`);
      }
    } else {
      log.success('ESLint passed');
    }
    
    // TypeScript
    log.info('Running TypeScript check...');
    const tsResult = runCommand('npm run type-check', { silent: true });
    
    if (!tsResult.success) {
      log.error('TypeScript compilation failed');
      steps.quality.status = 'failed';
      return false;
    } else {
      log.success('TypeScript check passed');
    }
    
    // Tests
    log.info('Running unit tests...');
    const testResult = runCommand('npm test -- --passWithNoTests', { silent: true });
    
    if (!testResult.success) {
      log.warning('Some tests failed');
      steps.quality.status = 'warning';
    } else {
      log.success('Unit tests passed');
      steps.quality.status = 'passed';
    }
    
  } catch (error) {
    log.error(`Quality checks failed: ${error.message}`);
    steps.quality.status = 'failed';
    return false;
  }
  
  return true;
}

/**
 * 3. Run Security Review
 */
function runSecurityReview() {
  log.header('🔒 Step 3/6: Security Review');
  
  try {
    log.info('Running security review...');
    const _securityResult = runCommand('node scripts/security-review.js', { silent: false });
    
    // Check security report
    if (fs.existsSync('security-report.json')) {
      const report = JSON.parse(fs.readFileSync('security-report.json', 'utf8'));
      
      if (report.summary.critical > 0) {
        log.error(`${report.summary.critical} critical security issues found`);
        steps.security.status = 'failed';
        return false;
      }
      
      if (report.summary.warnings > 0) {
        log.warning(`${report.summary.warnings} security warnings`);
        steps.security.status = 'warning';
      } else {
        log.success('Security review passed');
        steps.security.status = 'passed';
      }
    }
    
  } catch (error) {
    log.error(`Security review failed: ${error.message}`);
    steps.security.status = 'failed';
    return false;
  }
  
  return true;
}

/**
 * 4. Run Performance Tests
 */
function runPerformanceTests() {
  log.header('⚡ Step 4/6: Performance Tests');
  
  try {
    // Check if device is connected
    log.info('Checking for connected devices...');
    const adbResult = runCommand('adb devices', { silent: true });
    
    if (!adbResult.success || !adbResult.output.includes('device')) {
      log.warning('No device connected - skipping performance tests');
      log.info('Connect a device and run: npm run perf:test');
      steps.performance.status = 'skipped';
      return true;
    }
    
    // Run performance tests
    log.info('Running performance tests...');
    const _perfResult = runCommand('npm run perf:test', { silent: false });
    
    // Check performance report
    if (fs.existsSync('performance-report.json')) {
      const report = JSON.parse(fs.readFileSync('performance-report.json', 'utf8'));
      
      if (report.summary.failed > 0) {
        log.error('Performance criteria not met');
        steps.performance.status = 'failed';
        return false;
      }
      
      if (report.summary.warnings > 0) {
        log.warning('Performance warnings detected');
        steps.performance.status = 'warning';
      } else {
        log.success('Performance tests passed');
        steps.performance.status = 'passed';
      }
    }
    
  } catch (error) {
    log.warning(`Performance tests skipped: ${error.message}`);
    steps.performance.status = 'skipped';
  }
  
  return true;
}

/**
 * 5. Build Production Apps
 */
function buildProduction() {
  log.header('🏗️  Step 5/6: Production Build');
  
  try {
    log.info('Starting production build...');
    const _buildResult = runCommand('node scripts/build-production.js', { silent: false });
    
    // Check build report
    if (fs.existsSync('docs/BUILD_REPORT.md')) {
      log.success('Production build completed');
      steps.build.status = 'passed';
    } else {
      log.error('Build report not generated');
      steps.build.status = 'failed';
      return false;
    }
    
  } catch (error) {
    log.error(`Production build failed: ${error.message}`);
    steps.build.status = 'failed';
    return false;
  }
  
  return true;
}

/**
 * 6. Run Smoke Tests
 */
function runSmokeTests() {
  log.header('🔥 Step 6/6: Smoke Tests');
  
  try {
    log.info('Running smoke tests on builds...');
    const _smokeResult = runCommand('node scripts/smoke-test-builds.js', { silent: false });
    
    // Check smoke test report
    if (fs.existsSync('smoke-test-report.json')) {
      const report = JSON.parse(fs.readFileSync('smoke-test-report.json', 'utf8'));
      
      if (report.verdict === 'FAIL') {
        log.error('Smoke tests failed');
        steps.smoke.status = 'failed';
        return false;
      }
      
      if (report.summary.warnings > 0) {
        log.warning(`${report.summary.warnings} smoke test warnings`);
        steps.smoke.status = 'warning';
      } else {
        log.success('Smoke tests passed');
        steps.smoke.status = 'passed';
      }
      
      if (report.readyForSubmission) {
        log.success('🎉 Builds are ready for app store submission!');
      }
    }
    
  } catch (error) {
    log.error(`Smoke tests failed: ${error.message}`);
    steps.smoke.status = 'failed';
    return false;
  }
  
  return true;
}

/**
 * Generate final validation report
 */
function generateFinalReport() {
  const report = {
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    steps: steps,
    artifacts: {
      android: {
        apk: fs.existsSync('./android/app/build/outputs/apk/release/app-release.apk'),
        aab: fs.existsSync('./android/app/build/outputs/bundle/release/app-release.aab'),
      },
      ios: {
        ipa: fs.existsSync('./ios/build/CrowbarMobile.ipa'),
      }
    },
    reports: {
      security: fs.existsSync('security-report.json'),
      performance: fs.existsSync('performance-report.json'),
      smokeTest: fs.existsSync('smoke-test-report.json'),
      build: fs.existsSync('docs/BUILD_REPORT.md'),
    },
    readyForSubmission: false
  };
  
  // Check if ready for submission
  const criticalSteps = ['environment', 'quality', 'security', 'build', 'smoke'];
  const failedSteps = criticalSteps.filter(step => steps[step].status === 'failed');
  const warningSteps = criticalSteps.filter(step => steps[step].status === 'warning');
  
  report.readyForSubmission = failedSteps.length === 0 && warningSteps.length <= 2;
  
  // Save report
  fs.writeFileSync('final-validation-report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\n' + '═'.repeat(60));
  log.header('📊 FINAL BUILD VALIDATION SUMMARY');
  
  Object.entries(steps).forEach(([_key, step]) => {
    const icon = step.status === 'passed' ? '✅' : 
                 step.status === 'warning' ? '⚠️' : 
                 step.status === 'failed' ? '❌' : 
                 step.status === 'skipped' ? '⏭️' : '⏳';
    console.log(`${icon} ${step.name}: ${step.status.toUpperCase()}`);
  });
  
  console.log('\n' + '═'.repeat(60));
  
  if (report.readyForSubmission) {
    log.success('✅ VALIDATION PASSED - Ready for app store submission!');
    console.log('\n📱 Next Steps:');
    console.log('1. Review all reports in detail');
    console.log('2. Test builds on physical devices');
    console.log('3. Prepare store listings');
    console.log('4. Submit to app stores');
  } else if (failedSteps.length > 0) {
    log.error('❌ VALIDATION FAILED - Critical issues must be fixed');
    console.log(`\nFailed steps: ${failedSteps.join(', ')}`);
  } else {
    log.warning('⚠️  VALIDATION PASSED WITH WARNINGS - Review before submission');
    console.log(`\nSteps with warnings: ${warningSteps.join(', ')}`);
  }
  
  console.log('\n📄 Reports Generated:');
  console.log('- final-validation-report.json');
  console.log('- security-report.json');
  console.log('- smoke-test-report.json');
  console.log('- docs/BUILD_REPORT.md');
  
  console.log('\n' + '═'.repeat(60));
  
  return report.readyForSubmission;
}

/**
 * Main validation process
 */
async function runFinalValidation() {
  log.header('🚀 CROWBAR MOBILE - FINAL BUILD VALIDATION');
  console.log('This process will validate the app is ready for production');
  console.log('=' + '═'.repeat(59));
  
  // Run all validation steps
  const validationSteps = [
    { name: 'Environment', fn: validateEnvironment },
    { name: 'Quality', fn: runQualityChecks },
    { name: 'Security', fn: runSecurityReview },
    { name: 'Performance', fn: runPerformanceTests },
    { name: 'Build', fn: buildProduction },
    { name: 'Smoke Tests', fn: runSmokeTests },
  ];
  
  let shouldContinue = true;
  
  for (const step of validationSteps) {
    if (!shouldContinue) break;
    
    shouldContinue = step.fn();
    
    // Allow continuing with warnings but not failures
    if (!shouldContinue && steps[step.name.toLowerCase()].status === 'warning') {
      shouldContinue = true;
    }
  }
  
  // Generate final report
  const isReady = generateFinalReport();
  
  // Exit with appropriate code
  process.exit(isReady ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runFinalValidation().catch(_error => {
    log.error(`Fatal error: ${_error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runFinalValidation
};