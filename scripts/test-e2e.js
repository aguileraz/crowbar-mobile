#!/usr/bin/env node

/**
 * E2E Test Runner
 * Runs end-to-end tests with proper setup and reporting
 */

const { execSync } = require('child_process');
const _path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${message}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logStep(message) {
  log(`\n➤ ${message}`, colors.blue);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function setupE2EEnvironment() {
  logStep('Setting up E2E test environment...');
  
  try {
    // Ensure test directories exist
    const testDirs = [
      'src/test/e2e',
      'coverage/e2e',
      'test-results/e2e',
    ];
    
    testDirs.forEach(dir => {
      const fullPath = _path.resolve(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Set environment variables for E2E tests
    process.env.NODE_ENV = 'test';
    process.env.E2E_TEST = 'true';
    process.env.JEST_TIMEOUT = '30000';
    
    logSuccess('E2E environment setup completed');
    return true;
  } catch (error) {
    logError(`Failed to setup E2E environment: ${error.message}`);
    return false;
  }
}

function runE2ETests(options = {}) {
  logStep('Running E2E tests...');
  
  const testCommand = [
    'npx jest',
    '--config jest.config.js',
    '--testPathPattern=e2e',
    '--runInBand', // Run tests serially for E2E
    '--verbose',
    '--detectOpenHandles',
    '--forceExit',
    '--testTimeout=30000',
    options.pattern ? `--testNamePattern="${options.pattern}"` : '',
    options.coverage ? '--coverage --coverageDirectory=coverage/e2e' : '',
    options.updateSnapshots ? '--updateSnapshot' : '',
  ].filter(Boolean).join(' ');
  
  try {
    execSync(testCommand, {
      stdio: 'inherit',
      cwd: _path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        E2E_TEST: 'true',
      }
    });
    
    logSuccess('E2E tests completed successfully');
    return true;
  } catch (error) {
    logError('E2E tests failed');
    return false;
  }
}

function generateE2EReport() {
  logStep('Generating E2E test report...');
  
  try {
    // Generate HTML report
    execSync('npx jest --config jest.config.js --testPathPattern=e2e --coverage --coverageDirectory=coverage/e2e --coverageReporters=html,text,lcov', {
      stdio: 'pipe',
      cwd: _path.resolve(__dirname, '..'),
    });
    
    // Generate test results summary
    const reportPath = _path.resolve(__dirname, '..', 'test-results', 'e2e', 'summary.json');
    const reportDir = _path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      environment: 'E2E',
      status: 'completed',
      coverage: {
        html: 'coverage/e2e/lcov-report/index.html',
        lcov: 'coverage/e2e/lcov.info',
      },
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    logSuccess('E2E report generated');
    log(`Coverage report: ${_path.resolve(__dirname, '..', 'coverage/e2e/lcov-report/index.html')}`, colors.cyan);
    return true;
  } catch (error) {
    logWarning('Failed to generate E2E report (tests may have passed)');
    return false;
  }
}

function runVisualRegressionTests() {
  logStep('Running visual regression tests...');
  
  try {
    // This would run screenshot comparison tests
    // For now, we'll just log that this feature is available
    logWarning('Visual regression tests not implemented yet');
    logWarning('Consider adding screenshot testing with tools like:');
    log('  - react-native-screenshot-test', colors.yellow);
    log('  - Appium with image comparison', colors.yellow);
    log('  - Detox with screenshot assertions', colors.yellow);
    
    return true;
  } catch (error) {
    logError(`Visual regression tests failed: ${error.message}`);
    return false;
  }
}

function runPerformanceTests() {
  logStep('Running performance tests...');
  
  try {
    // This would run performance benchmarks
    logWarning('Performance tests not implemented yet');
    logWarning('Consider adding performance testing with:');
    log('  - React Native Performance Monitor', colors.yellow);
    log('  - Flipper Performance Plugin', colors.yellow);
    log('  - Custom performance metrics', colors.yellow);
    
    return true;
  } catch (error) {
    logError(`Performance tests failed: ${error.message}`);
    return false;
  }
}

function cleanup() {
  logStep('Cleaning up E2E test artifacts...');
  
  try {
    // Clean up temporary files, screenshots, etc.
    const tempDirs = [
      'tmp/e2e',
      'screenshots/temp',
    ];
    
    tempDirs.forEach(dir => {
      const fullPath = _path.resolve(__dirname, '..', dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    });
    
    logSuccess('Cleanup completed');
  } catch (error) {
    logWarning('Cleanup had some issues (this is usually not critical)');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
    updateSnapshots: args.includes('--update-snapshots'),
    visual: args.includes('--visual'),
    performance: args.includes('--performance'),
    report: args.includes('--report'),
  };
  
  logHeader('Crowbar Mobile - E2E Test Runner');
  
  log(`Test Environment: E2E`, colors.cyan);
  log(`Node Environment: ${process.env.NODE_ENV || 'development'}`, colors.cyan);
  log(`Jest Timeout: 30 seconds`, colors.cyan);
  
  let success = true;
  
  try {
    // Setup E2E environment
    const setupSuccess = setupE2EEnvironment();
    if (!setupSuccess) {
      success = false;
      return;
    }
    
    // Run main E2E tests
    const testsSuccess = runE2ETests(options);
    if (!testsSuccess) {
      success = false;
    }
    
    // Run visual regression tests if requested
    if (options.visual) {
      const visualSuccess = runVisualRegressionTests();
      if (!visualSuccess) {
        logWarning('Visual tests failed but continuing...');
      }
    }
    
    // Run performance tests if requested
    if (options.performance) {
      const perfSuccess = runPerformanceTests();
      if (!perfSuccess) {
        logWarning('Performance tests failed but continuing...');
      }
    }
    
    // Generate report if requested or if coverage was enabled
    if (options.report || options.coverage) {
      const reportSuccess = generateE2EReport();
      if (!reportSuccess) {
        logWarning('Report generation failed but tests may have passed');
      }
    }
    
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    success = false;
  } finally {
    // Always run cleanup
    cleanup();
  }
  
  // Final result
  if (success) {
    logHeader('E2E Tests Completed Successfully! 🎉');
    
    if (options.coverage) {
      log('\nCoverage Report:', colors.bright);
      log(`  HTML: coverage/e2e/lcov-report/index.html`, colors.cyan);
      log(`  LCOV: coverage/e2e/lcov.info`, colors.cyan);
    }
    
    process.exit(0);
  } else {
    logHeader('E2E Tests Failed! ❌');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\nReceived SIGINT, cleaning up...', colors.yellow);
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\nReceived SIGTERM, cleaning up...', colors.yellow);
  cleanup();
  process.exit(1);
});

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Usage: node scripts/test-e2e.js [options]', colors.bright);
  log('\nOptions:');
  log('  --coverage              Generate coverage report');
  log('  --pattern=<pattern>     Run tests matching pattern');
  log('  --update-snapshots      Update test snapshots');
  log('  --visual                Run visual regression tests');
  log('  --performance           Run performance tests');
  log('  --report                Generate detailed test report');
  log('  --help, -h              Show this help message');
  log('\nExamples:');
  log('  node scripts/test-e2e.js');
  log('  node scripts/test-e2e.js --coverage');
  log('  node scripts/test-e2e.js --pattern="Auth"');
  log('  node scripts/test-e2e.js --visual --performance');
  process.exit(0);
}

// Run the main function
main().catch(_error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
