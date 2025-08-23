#!/usr/bin/env node

/**
 * Script to switch between different environment configurations
 * Usage: node scripts/switch-env.js [development|staging|production]
 */

const fs = require('fs');
const path = require('path');

const environments = ['development', 'staging', 'production'];
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.error('❌ Error: Please specify an environment (development, staging, production)');
  console.log('Usage: node scripts/switch-env.js [environment]');
  process.exit(1);
}

if (!environments.includes(targetEnv)) {
  console.error(`❌ Error: Invalid environment "${targetEnv}". Must be one of: ${environments.join(', ')}`);
  process.exit(1);
}

const sourceFile = path.join(__dirname, '..', `.env.${targetEnv}`);
const targetFile = path.join(__dirname, '..', '.env');

try {
  if (!fs.existsSync(sourceFile)) {

    process.exit(1);
  }

  fs.copyFileSync(sourceFile, targetFile);

  // Display current configuration
  const envContent = fs.readFileSync(targetFile, 'utf8');
  const apiUrl = envContent.match(/API_BASE_URL=(.+)/)?.[1] || 'Not set';
  const nodeEnv = envContent.match(/NODE_ENV=(.+)/)?.[1] || 'Not set';

} catch (error) {

  process.exit(1);
}