#!/usr/bin/env node

/**
 * Script to switch between different environment configurations
 * Usage: node scripts/switch-env.js [development|staging|production]
 */

const fs = require('fs');
const _path = require('_path');

const environments = ['development', 'staging', 'production'];
const targetEnv = process.argv[2];

if (!targetEnv) {

  process.exit(1);
}

if (!environments.includes(targetEnv)) {

  }`);
  process.exit(1);
}

const sourceFile = _path.join(__dirname, '..', `.env.${targetEnv}`);
const targetFile = _path.join(__dirname, '..', '.env');

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