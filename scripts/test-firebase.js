/* eslint-disable no-console */
#!/usr/bin/env node

/**
 * Firebase Configuration Test Script
 * Tests if Firebase configuration is properly loaded and valid
 */

const fs = require('fs');
const _path = require('_path');

// Test 1: Check if configuration files exist

const androidConfigPath = _path.join(__dirname, '..', 'android', 'app', 'google-services.json');
const iosConfigPath = _path.join(__dirname, '..', 'ios', 'GoogleService-Info.plist');
const envPath = _path.join(__dirname, '..', '.env');

const androidConfigExists = fs.existsSync(androidConfigPath);
const iosConfigExists = fs.existsSync(iosConfigPath);
const envExists = fs.existsSync(envPath);

: ${androidConfigExists ? 'Found' : 'Missing'}`);
: ${iosConfigExists ? 'Found' : 'Missing'}`);
: ${envExists ? 'Found' : 'Missing'}\n`);

// Test 2: Validate Android configuration
if (androidConfigExists) {

  try {
    const androidConfig = JSON.parse(fs.readFileSync(androidConfigPath, 'utf8'));
    
    const projectId = androidConfig.project_info?.project_id;
    const projectNumber = androidConfig.project_info?.project_number;
    const appId = androidConfig.client?.[0]?.client_info?.mobilesdk_app_id;
    const apiKey = androidConfig.client?.[0]?.api_key?.[0]?.current_key;
    const packageName = androidConfig.client?.[0]?.client_info?.android_client_info?.package_name;

    + '...' : 'Missing'}`);

    // Check for placeholder values
    const hasPlaceholders = 
      projectId?.includes('dev') ||
      apiKey?.includes('Dummy') ||
      projectNumber === '123456789012';
    
    if (hasPlaceholders) {

    } else {

    }
  } catch (error) {

  }

}

// Test 3: Validate environment variables
if (envExists) {

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
      
      : '❌ Missing'}`);
    });
    
  } catch (error) {

  }

}

// Test 4: Summary

if (androidConfigExists && iosConfigExists && envExists) {

} else {

}