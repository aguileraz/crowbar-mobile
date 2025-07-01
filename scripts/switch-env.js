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
  console.error('❌ Please specify an environment: development, staging, or production');
  console.log('Usage: node scripts/switch-env.js [development|staging|production]');
  process.exit(1);
}

if (!environments.includes(targetEnv)) {
  console.error(`❌ Invalid environment: ${targetEnv}`);
  console.log(`Valid environments: ${environments.join(', ')}`);
  process.exit(1);
}

const sourceFile = path.join(__dirname, '..', `.env.${targetEnv}`);
const targetFile = path.join(__dirname, '..', '.env');

try {
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Environment file not found: .env.${targetEnv}`);
    process.exit(1);
  }

  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ Successfully switched to ${targetEnv} environment`);
  console.log(`📄 Copied .env.${targetEnv} to .env`);
  
  // Display current configuration
  const envContent = fs.readFileSync(targetFile, 'utf8');
  const apiUrl = envContent.match(/API_BASE_URL=(.+)/)?.[1] || 'Not set';
  const nodeEnv = envContent.match(/NODE_ENV=(.+)/)?.[1] || 'Not set';
  
  console.log('\n📋 Current Configuration:');
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   API URL: ${apiUrl}`);
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
  process.exit(1);
}
