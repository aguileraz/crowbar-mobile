#!/usr/bin/env node

/**
 * Firebase Configuration Test Script
 * Tests if Firebase configuration is properly loaded and valid
 */

const fs = require('fs');
const _path = require('path');

console.log('🔥 Firebase Configuration Test\n');

// Test 1: Check if configuration files exist
console.log('📁 Checking configuration files...');

const androidConfigPath = _path.join(__dirname, '..', 'android', 'app', 'google-services.json');
const iosConfigPath = _path.join(__dirname, '..', 'ios', 'GoogleService-Info.plist');
const envPath = _path.join(__dirname, '..', '.env');

const androidConfigExists = fs.existsSync(androidConfigPath);
const iosConfigExists = fs.existsSync(iosConfigPath);
const envExists = fs.existsSync(envPath);

console.log(`✅ Android config (google-services.json): ${androidConfigExists ? 'Found' : 'Missing'}`);
console.log(`✅ iOS config (GoogleService-Info.plist): ${iosConfigExists ? 'Found' : 'Missing'}`);
console.log(`✅ Environment file (.env): ${envExists ? 'Found' : 'Missing'}\n`);

// Test 2: Validate Android configuration
if (androidConfigExists) {
  console.log('🤖 Validating Android configuration...');
  try {
    const androidConfig = JSON.parse(fs.readFileSync(androidConfigPath, 'utf8'));
    
    const projectId = androidConfig.project_info?.project_id;
    const projectNumber = androidConfig.project_info?.project_number;
    const appId = androidConfig.client?.[0]?.client_info?.mobilesdk_app_id;
    const apiKey = androidConfig.client?.[0]?.api_key?.[0]?.current_key;
    const packageName = androidConfig.client?.[0]?.client_info?.android_client_info?.package_name;
    
    console.log(`   Project ID: ${projectId || 'Missing'}`);
    console.log(`   Project Number: ${projectNumber || 'Missing'}`);
    console.log(`   App ID: ${appId || 'Missing'}`);
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'Missing'}`);
    console.log(`   Package Name: ${packageName || 'Missing'}`);
    
    // Check for placeholder values
    const hasPlaceholders = 
      projectId?.includes('dev') ||
      apiKey?.includes('Dummy') ||
      projectNumber === '123456789012';
    
    if (hasPlaceholders) {
      console.log('⚠️  Warning: Some values appear to be placeholders');
    } else {
      console.log('✅ Android configuration looks valid');
    }
  } catch (error) {
    console.log(`❌ Error reading Android config: ${error.message}`);
  }
  console.log('');
}

// Test 3: Validate environment variables
if (envExists) {
  console.log('🌍 Validating environment variables...');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    const firebaseVars = {};
    envLines.forEach(line => {
      if (line.startsWith('FIREBASE_')) {
        const [key, value] = line.split('=');
        firebaseVars[key] = value;
      }
    });
    
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_APP_ID', 
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID'
    ];
    
    requiredVars.forEach(varName => {
      const value = firebaseVars[varName];
      const hasValue = value && value.trim() !== '';
      const isPlaceholder = value?.includes('your-') || value?.includes('dev-');
      
      console.log(`   ${varName}: ${hasValue ? (isPlaceholder ? '⚠️  Placeholder' : '✅ Set') : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.log(`❌ Error reading environment file: ${error.message}`);
  }
  console.log('');
}

// Test 4: Summary
console.log('📋 Summary:');
if (androidConfigExists && iosConfigExists && envExists) {
  console.log('✅ All Firebase configuration files are present');
  console.log('🚀 Firebase should be ready for development');
  console.log('\n💡 Next steps:');
  console.log('   1. Start an Android emulator or connect a device');
  console.log('   2. Run: npx react-native run-android');
  console.log('   3. Check app logs for Firebase initialization');
} else {
  console.log('❌ Some configuration files are missing');
  console.log('🔧 Please complete Firebase setup before proceeding');
}
