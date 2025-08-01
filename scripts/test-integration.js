/* eslint-disable no-console */
#!/usr/bin/env node

/**
const { execSync } = require('child_process');

 * Integration Test Runner
 * Runs integration tests with proper setup and cleanup
 */

const _path = require('_path');

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

async function checkAPIAvailability() {
  logStep('Checking API availability...');
  
  try {
    const testApiUrl = process.env.TEST_API_URL || 'https://crowbar-backend-staging.azurewebsites.net/api';
    
    // Simple curl check
    execSync(`curl -f -s -o /dev/null --max-time 10 ${testApiUrl}/health || exit 1`, {
      stdio: 'pipe'
    });
    
    logSuccess('API is available');
    return true;
  } catch (error) {
    logWarning('API is not available - some tests may be skipped');
    return false;
  }
}

function runTests(pattern = '') {
  logStep(`Running integration tests${pattern ? ` (${pattern})` : ''}...`);
  
  const testCommand = [
    'npx jest',
    '--config jest.config.js',
    '--testPathPattern=integration',
    '--runInBand', // Run tests serially to avoid conflicts
    '--verbose',
    '--detectOpenHandles',
    '--forceExit',
    pattern ? `--testNamePattern="${pattern}"` : '',
  ].filter(Boolean).join(' ');
  
  try {
    execSync(testCommand, {
      stdio: 'inherit',
      cwd: _path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TEST_TIMEOUT: '30000',
      }
    });
    
    logSuccess('Integration tests completed successfully');
    return true;
  } catch (error) {
    logError('Integration tests failed');
    return false;
  }
}

function runCoverageReport() {
  logStep('Generating coverage report...');
  
  try {
    execSync('npx jest --config jest.config.js --testPathPattern=integration --coverage --coverageDirectory=coverage/integration', {
      stdio: 'inherit',
      cwd: _path.resolve(__dirname, '..'),
    });
    
    logSuccess('Coverage report generated in coverage/integration/');
    return true;
  } catch (error) {
    logError('Failed to generate coverage report');
    return false;
  }
}

function cleanup() {
  logStep('Cleaning up test artifacts...');
  
  try {
    // Clean up any test files or temporary data
    // This would depend on your specific cleanup needs
    
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
    skipApiCheck: args.includes('--skip-api-check'),
  };
  
  logHeader('Crowbar Mobile - Integration Test Runner');
  
  log(`Test API URL: ${process.env.TEST_API_URL || 'https://crowbar-backend-staging.azurewebsites.net/api'}`, colors.cyan);
  log(`Node Environment: ${process.env.NODE_ENV || 'development'}`, colors.cyan);
  
  let success = true;
  
  try {
    // Check API availability
    if (!options.skipApiCheck) {
      const apiAvailable = await checkAPIAvailability();
      if (!apiAvailable) {
        logWarning('Continuing with tests - unavailable API tests will be skipped');
      }
    }
    
    // Run tests
    const testsSuccess = runTests(options.pattern);
    if (!testsSuccess) {
      success = false;
    }
    
    // Generate coverage report if requested
    if (options.coverage && testsSuccess) {
      const coverageSuccess = runCoverageReport();
      if (!coverageSuccess) {
        logWarning('Tests passed but coverage report failed');
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
    logHeader('Integration Tests Completed Successfully! 🎉');
    process.exit(0);
  } else {
    logHeader('Integration Tests Failed! ❌');
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
  log('Usage: node scripts/test-integration.js [options]', colors.bright);
  log('\nOptions:');
  log('  --coverage              Generate coverage report');
  log('  --pattern=<pattern>     Run tests matching pattern');
  log('  --skip-api-check        Skip API availability check');
  log('  --help, -h              Show this help message');
  log('\nExamples:');
  log('  node scripts/test-integration.js');
  log('  node scripts/test-integration.js --coverage');
  log('  node scripts/test-integration.js --pattern="Auth"');
  log('  node scripts/test-integration.js --skip-api-check');
  process.exit(0);
}

// Run the main function
main().catch(_error => {
  logError(`Fatal error: ${_error.message}`);
  process.exit(1);
});