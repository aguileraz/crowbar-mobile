#!/usr/bin/env node

/**
 * Crowbar Mobile - Environment Management Script
 * Manages environment configurations and switches between environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ENVIRONMENTS = ['development', 'staging', 'production'];
const ENV_FILES = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production',
};
const ACTIVE_ENV_FILE = '.env';

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
  title: (msg) => console.log(`${colors.cyan}${colors.bold}🌍 ${msg}${colors.reset}\n`),
};

/**
 * Parse environment file
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

/**
 * Get current environment
 */
function getCurrentEnvironment() {
  if (fs.existsSync(ACTIVE_ENV_FILE)) {
    const env = parseEnvFile(ACTIVE_ENV_FILE);
    return env.NODE_ENV || 'unknown';
  }
  return 'none';
}

/**
 * Switch to environment
 */
function switchEnvironment(environment) {
  if (!ENVIRONMENTS.includes(environment)) {
    log.error(`Invalid environment: ${environment}`);
    log.info(`Valid environments: ${ENVIRONMENTS.join(', ')}`);
    return false;
  }

  const envFile = ENV_FILES[environment];
  if (!fs.existsSync(envFile)) {
    log.error(`Environment file not found: ${envFile}`);
    return false;
  }

  try {
    // Copy environment file to active .env
    fs.copyFileSync(envFile, ACTIVE_ENV_FILE);
    log.success(`Switched to ${environment} environment`);
    return true;
  } catch (error) {
    log.error(`Failed to switch environment: ${error.message}`);
    return false;
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment(environment) {
  const envFile = ENV_FILES[environment];
  if (!fs.existsSync(envFile)) {
    log.error(`Environment file not found: ${envFile}`);
    return false;
  }

  const env = parseEnvFile(envFile);
  const issues = [];

  // Required variables
  const requiredVars = [
    'NODE_ENV',
    'BUILD_TYPE',
    'API_BASE_URL',
    'WS_BASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_API_KEY',
  ];

  requiredVars.forEach(varName => {
    if (!env[varName] || env[varName].includes('replace-with-real') || env[varName].includes('your-')) {
      issues.push(`Missing or placeholder value for ${varName}`);
    }
  });

  // Environment-specific validations
  if (environment === 'production') {
    const productionVars = [
      'SENTRY_DSN',
      'STRIPE_PUBLISHABLE_KEY',
      'ENCRYPTION_KEY',
      'JWT_SECRET',
    ];

    productionVars.forEach(varName => {
      if (!env[varName] || env[varName].includes('replace-with-real')) {
        issues.push(`Production requires real value for ${varName}`);
      }
    });

    // Check for development values in production
    if (env.ENABLE_DEBUG_MODE === 'true') {
      issues.push('Debug mode should be disabled in production');
    }

    if (env.ENABLE_FLIPPER === 'true') {
      issues.push('Flipper should be disabled in production');
    }

    if (env.LOG_LEVEL !== 'error') {
      issues.push('Log level should be "error" in production');
    }
  }

  if (issues.length > 0) {
    log.warning(`Environment ${environment} has ${issues.length} issues:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }

  log.success(`Environment ${environment} is valid`);
  return true;
}

/**
 * Compare environments
 */
function compareEnvironments(env1, env2) {
  const envFile1 = ENV_FILES[env1];
  const envFile2 = ENV_FILES[env2];

  if (!fs.existsSync(envFile1) || !fs.existsSync(envFile2)) {
    log.error('One or both environment files not found');
    return;
  }

  const config1 = parseEnvFile(envFile1);
  const config2 = parseEnvFile(envFile2);

  const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
  const differences = [];

  allKeys.forEach(key => {
    const value1 = config1[key];
    const value2 = config2[key];

    if (value1 !== value2) {
      differences.push({
        key,
        [env1]: value1 || '(not set)',
        [env2]: value2 || '(not set)',
      });
    }
  });

  if (differences.length === 0) {
    log.success(`Environments ${env1} and ${env2} are identical`);
  } else {
    log.info(`Found ${differences.length} differences between ${env1} and ${env2}:`);
    console.log('\nKey'.padEnd(30), env1.padEnd(20), env2.padEnd(20));
    console.log('-'.repeat(70));
    differences.forEach(diff => {
      console.log(
        diff.key.padEnd(30),
        String(diff[env1]).padEnd(20),
        String(diff[env2]).padEnd(20)
      );
    });
  }
}

/**
 * List all environments
 */
function listEnvironments() {
  const current = getCurrentEnvironment();
  
  log.info('Available environments:');
  ENVIRONMENTS.forEach(env => {
    const envFile = ENV_FILES[env];
    const exists = fs.existsSync(envFile);
    const isCurrent = env === current;
    const status = exists ? (isCurrent ? '(current)' : '(available)') : '(missing)';
    const icon = exists ? (isCurrent ? '👉' : '📄') : '❌';
    
    console.log(`  ${icon} ${env.padEnd(12)} ${status}`);
  });
}

/**
 * Create environment template
 */
function createEnvironmentTemplate(environment) {
  const envFile = ENV_FILES[environment];
  
  if (fs.existsSync(envFile)) {
    log.warning(`Environment file already exists: ${envFile}`);
    return false;
  }

  // Read example file as template
  const exampleFile = '.env.example';
  if (!fs.existsSync(exampleFile)) {
    log.error('Example environment file not found');
    return false;
  }

  try {
    let content = fs.readFileSync(exampleFile, 'utf8');
    
    // Replace placeholders based on environment
    content = content.replace(/NODE_ENV=development/g, `NODE_ENV=${environment}`);
    content = content.replace(/BUILD_TYPE=development/g, `BUILD_TYPE=${environment}`);
    
    // Environment-specific replacements
    if (environment === 'staging') {
      content = content.replace(/API_BASE_URL_DEVELOPMENT/g, 'API_BASE_URL_STAGING');
      content = content.replace(/WS_BASE_URL_DEVELOPMENT/g, 'WS_BASE_URL_STAGING');
      content = content.replace(/FIREBASE_.*_DEVELOPMENT/g, match => match.replace('_DEVELOPMENT', '_STAGING'));
    } else if (environment === 'production') {
      content = content.replace(/API_BASE_URL_DEVELOPMENT/g, 'API_BASE_URL_PRODUCTION');
      content = content.replace(/WS_BASE_URL_DEVELOPMENT/g, 'WS_BASE_URL_PRODUCTION');
      content = content.replace(/FIREBASE_.*_DEVELOPMENT/g, match => match.replace('_DEVELOPMENT', '_PRODUCTION'));
    }

    fs.writeFileSync(envFile, content);
    log.success(`Created environment template: ${envFile}`);
    return true;
  } catch (error) {
    log.error(`Failed to create environment template: ${error.message}`);
    return false;
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}${colors.bold}Crowbar Mobile - Environment Management${colors.reset}

Usage: node scripts/manage-environments.js <command> [options]

Commands:
  switch <env>        Switch to specified environment
  current             Show current environment
  list                List all environments
  validate <env>      Validate environment configuration
  compare <env1> <env2>  Compare two environments
  create <env>        Create environment template
  help                Show this help message

Examples:
  node scripts/manage-environments.js switch staging
  node scripts/manage-environments.js validate production
  node scripts/manage-environments.js compare development staging
  node scripts/manage-environments.js create testing

Environments: ${ENVIRONMENTS.join(', ')}
`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  log.title('Environment Management');

  switch (command) {
    case 'switch':
      const targetEnv = args[1];
      if (!targetEnv) {
        log.error('Please specify an environment to switch to');
        log.info('Usage: node scripts/manage-environments.js switch <environment>');
        return;
      }
      if (switchEnvironment(targetEnv)) {
        log.info(`Current environment: ${getCurrentEnvironment()}`);
      }
      break;

    case 'current':
      const current = getCurrentEnvironment();
      log.info(`Current environment: ${current}`);
      break;

    case 'list':
      listEnvironments();
      break;

    case 'validate':
      const envToValidate = args[1];
      if (!envToValidate) {
        log.error('Please specify an environment to validate');
        return;
      }
      validateEnvironment(envToValidate);
      break;

    case 'compare':
      const env1 = args[1];
      const env2 = args[2];
      if (!env1 || !env2) {
        log.error('Please specify two environments to compare');
        log.info('Usage: node scripts/manage-environments.js compare <env1> <env2>');
        return;
      }
      compareEnvironments(env1, env2);
      break;

    case 'create':
      const newEnv = args[1];
      if (!newEnv) {
        log.error('Please specify an environment name to create');
        return;
      }
      createEnvironmentTemplate(newEnv);
      break;

    default:
      log.error(`Unknown command: ${command}`);
      showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  switchEnvironment,
  getCurrentEnvironment,
  validateEnvironment,
  compareEnvironments,
  listEnvironments,
  createEnvironmentTemplate,
};
