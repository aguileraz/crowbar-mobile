#!/usr/bin/env node

/**
 * Crowbar Mobile - Production Environment Configuration
 * Configures and validates production environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Production configuration template
const PRODUCTION_CONFIG = {
  // App Configuration
  NODE_ENV: 'production',
  BUILD_TYPE: 'production',
  APP_NAME: 'Crowbar Mobile',
  APP_VERSION: '1.0.0',
  
  // API Configuration
  API_BASE_URL: 'https://crowbar-backend.azurewebsites.net/api',
  WS_BASE_URL: 'wss://crowbar-backend.azurewebsites.net',
  API_TIMEOUT: '20000',
  
  // Firebase Configuration (Production)
  FIREBASE_PROJECT_ID: 'crowbar-prod',
  FIREBASE_API_KEY: 'REPLACE_WITH_PRODUCTION_KEY',
  FIREBASE_AUTH_DOMAIN: 'crowbar-prod.firebaseapp.com',
  FIREBASE_STORAGE_BUCKET: 'crowbar-prod.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: 'REPLACE_WITH_SENDER_ID',
  FIREBASE_APP_ID: 'REPLACE_WITH_APP_ID',
  FIREBASE_MEASUREMENT_ID: 'REPLACE_WITH_MEASUREMENT_ID',
  
  // Feature Flags
  ENABLE_ANALYTICS: 'true',
  ENABLE_CRASHLYTICS: 'true',
  ENABLE_PERFORMANCE_MONITORING: 'true',
  ENABLE_DEBUG_MODE: 'false',
  ENABLE_FLIPPER: 'false',
  ENABLE_DEV_MENU: 'false',
  ENABLE_PERFORMANCE_DASHBOARD: 'false',
  ENABLE_MOCK_PAYMENTS: 'false',
  ENABLE_OFFLINE_MODE: 'true',
  ENABLE_REAL_TIME_FEATURES: 'true',
  
  // Performance Configuration
  CACHE_TTL: '1800000', // 30 minutes
  MAX_CACHE_SIZE: '200', // 200MB
  REQUEST_TIMEOUT: '20000',
  MAX_RETRY_ATTEMPTS: '5',
  LOG_LEVEL: 'error',
  
  // Third Party Services (Production)
  SENTRY_DSN: 'REPLACE_WITH_PRODUCTION_SENTRY_DSN',
  AMPLITUDE_API_KEY: 'REPLACE_WITH_PRODUCTION_AMPLITUDE_KEY',
  MIXPANEL_TOKEN: 'REPLACE_WITH_PRODUCTION_MIXPANEL_TOKEN',
  
  // Payment Configuration (Live Keys)
  STRIPE_PUBLISHABLE_KEY: 'REPLACE_WITH_LIVE_STRIPE_KEY',
  PAYPAL_CLIENT_ID: 'REPLACE_WITH_PRODUCTION_PAYPAL_ID',
  
  // Social Login
  GOOGLE_CLIENT_ID_ANDROID: 'REPLACE_WITH_PRODUCTION_GOOGLE_ANDROID_ID',
  GOOGLE_CLIENT_ID_IOS: 'REPLACE_WITH_PRODUCTION_GOOGLE_IOS_ID',
  FACEBOOK_APP_ID: 'REPLACE_WITH_PRODUCTION_FACEBOOK_ID',
  
  // Security
  ENCRYPTION_KEY: 'REPLACE_WITH_PRODUCTION_ENCRYPTION_KEY',
  JWT_SECRET: 'REPLACE_WITH_PRODUCTION_JWT_SECRET',
  
  // Build Configuration
  ENABLE_HERMES: 'true',
  ENABLE_PROGUARD: 'true',
  ENABLE_BUNDLE_SPLITTING: 'true',
  ENABLE_TREE_SHAKING: 'true',
  
  // App Store Configuration
  APP_STORE_TEAM_ID: 'REPLACE_WITH_APPLE_TEAM_ID',
  APP_STORE_BUNDLE_ID: 'com.crowbar.mobile',
  GOOGLE_PLAY_PACKAGE_NAME: 'com.crowbar.mobile',
  GOOGLE_PLAY_TRACK: 'production',
  
  // Monitoring
  SLACK_WEBHOOK_URL: 'REPLACE_WITH_SLACK_WEBHOOK',
  SLACK_CHANNEL: '#crowbar-mobile-alerts',
  NOTIFICATION_EMAIL: 'alerts@crowbar.com',
  
  // Health Check
  HEALTH_CHECK_URL: 'https://crowbar-backend.azurewebsites.net/health',
  
  // Security Headers
  ENABLE_SSL_PINNING: 'true',
  ENABLE_ROOT_DETECTION: 'true',
  ENABLE_DEBUGGER_DETECTION: 'true',
};

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
  title: (msg) => console.log(`${colors.cyan}${colors.bold}🔧 ${msg}${colors.reset}\n`),
};

/**
 * Generate production environment file
 */
function generateProductionEnv() {
  log.info('Generating production environment file...');
  
  const envContent = Object.entries(PRODUCTION_CONFIG)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const header = `# Crowbar Mobile - Production Environment
# Generated on: ${new Date().toISOString()}
# 
# IMPORTANT: Replace all REPLACE_WITH_* values with actual production values
# Never commit actual secrets to version control
#
`;

  const fullContent = header + envContent;
  
  fs.writeFileSync('.env.production', fullContent);
  log.success('Production environment file generated: .env.production');
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  log.info('Validating production environment...');
  
  if (!fs.existsSync('.env.production')) {
    log.error('Production environment file not found');
    return false;
  }
  
  const envContent = fs.readFileSync('.env.production', 'utf8');
  const issues = [];
  
  // Check for placeholder values
  const placeholders = envContent.match(/REPLACE_WITH_[A-Z_]+/g);
  if (placeholders) {
    issues.push(`Found ${placeholders.length} placeholder values that need to be replaced`);
    placeholders.forEach(placeholder => {
      issues.push(`  - ${placeholder}`);
    });
  }
  
  // Check for required variables
  const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID',
    'API_BASE_URL',
    'STRIPE_PUBLISHABLE_KEY',
    'SENTRY_DSN'
  ];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=REPLACE_WITH_`)) {
      issues.push(`Missing or placeholder value for ${varName}`);
    }
  });
  
  // Check for development values in production
  if (envContent.includes('ENABLE_DEBUG_MODE=true')) {
    issues.push('Debug mode should be disabled in production');
  }
  
  if (envContent.includes('ENABLE_FLIPPER=true')) {
    issues.push('Flipper should be disabled in production');
  }
  
  if (envContent.includes('LOG_LEVEL=debug')) {
    issues.push('Log level should be "error" in production');
  }
  
  if (issues.length > 0) {
    log.warning(`Environment validation found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }
  
  log.success('Environment validation passed');
  return true;
}

/**
 * Configure Azure App Service environment variables
 */
function configureAzureEnvironment() {
  log.info('Configuring Azure App Service environment variables...');
  
  try {
    // Read production environment
    if (!fs.existsSync('.env.production')) {
      log.error('Production environment file not found');
      return false;
    }
    
    const envContent = fs.readFileSync('.env.production', 'utf8');
    const envVars = [];
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          envVars.push(`${key}="${value}"`);
        }
      }
    });
    
    if (envVars.length === 0) {
      log.warning('No environment variables found to configure');
      return false;
    }
    
    // Configure Azure App Service
    const appName = 'crowbar-backend';
    const resourceGroup = 'crowbar-prod-rg';
    
    log.info(`Configuring ${envVars.length} environment variables in Azure...`);
    
    // Split into chunks to avoid command line length limits
    const chunkSize = 10;
    for (let i = 0; i < envVars.length; i += chunkSize) {
      const chunk = envVars.slice(i, i + chunkSize);
      const command = `az webapp config appsettings set --name ${appName} --resource-group ${resourceGroup} --settings ${chunk.join(' ')}`;
      
      try {
        execSync(command, { stdio: 'pipe' });
        log.success(`Configured variables ${i + 1}-${Math.min(i + chunkSize, envVars.length)}`);
      } catch (error) {
        log.error(`Failed to configure variables ${i + 1}-${Math.min(i + chunkSize, envVars.length)}: ${error.message}`);
        return false;
      }
    }
    
    log.success('Azure environment variables configured');
    return true;
    
  } catch (error) {
    log.error(`Azure configuration failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate Firebase configuration files
 */
function generateFirebaseConfig() {
  log.info('Generating Firebase configuration files...');
  
  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env.production', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
    
    // Generate Firebase config for Android
    const androidConfig = {
      project_info: {
        project_number: envVars.FIREBASE_MESSAGING_SENDER_ID || "REPLACE_WITH_PROJECT_NUMBER",
        project_id: envVars.FIREBASE_PROJECT_ID || "crowbar-prod"
      },
      client: [
        {
          client_info: {
            mobilesdk_app_id: envVars.FIREBASE_APP_ID || "REPLACE_WITH_APP_ID",
            android_client_info: {
              package_name: "com.crowbar.mobile"
            }
          },
          oauth_client: [],
          api_key: [
            {
              current_key: envVars.FIREBASE_API_KEY || "REPLACE_WITH_API_KEY"
            }
          ],
          services: {
            appinvite_service: {
              other_platform_oauth_client: []
            }
          }
        }
      ],
      configuration_version: "1"
    };
    
    // Generate Firebase config for iOS
    const iosConfig = {
      API_KEY: envVars.FIREBASE_API_KEY || "REPLACE_WITH_API_KEY",
      GCM_SENDER_ID: envVars.FIREBASE_MESSAGING_SENDER_ID || "REPLACE_WITH_SENDER_ID",
      PLIST_VERSION: "1",
      BUNDLE_ID: "com.crowbar.mobile",
      PROJECT_ID: envVars.FIREBASE_PROJECT_ID || "crowbar-prod",
      STORAGE_BUCKET: envVars.FIREBASE_STORAGE_BUCKET || "crowbar-prod.appspot.com",
      IS_ADS_ENABLED: false,
      IS_ANALYTICS_ENABLED: true,
      IS_APPINVITE_ENABLED: true,
      IS_GCM_ENABLED: true,
      IS_SIGNIN_ENABLED: true,
      GOOGLE_APP_ID: envVars.FIREBASE_APP_ID || "REPLACE_WITH_APP_ID"
    };
    
    // Save configurations
    fs.writeFileSync('./android/app/google-services.json', JSON.stringify(androidConfig, null, 2));
    fs.writeFileSync('./ios/GoogleService-Info.plist', generatePlist(iosConfig));
    
    log.success('Firebase configuration files generated');
    return true;
    
  } catch (error) {
    log.error(`Firebase config generation failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate iOS plist content
 */
function generatePlist(config) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>API_KEY</key>
  <string>${config.API_KEY}</string>
  <key>GCM_SENDER_ID</key>
  <string>${config.GCM_SENDER_ID}</string>
  <key>PLIST_VERSION</key>
  <string>${config.PLIST_VERSION}</string>
  <key>BUNDLE_ID</key>
  <string>${config.BUNDLE_ID}</string>
  <key>PROJECT_ID</key>
  <string>${config.PROJECT_ID}</string>
  <key>STORAGE_BUCKET</key>
  <string>${config.STORAGE_BUCKET}</string>
  <key>IS_ADS_ENABLED</key>
  <${config.IS_ADS_ENABLED}/>
  <key>IS_ANALYTICS_ENABLED</key>
  <${config.IS_ANALYTICS_ENABLED}/>
  <key>IS_APPINVITE_ENABLED</key>
  <${config.IS_APPINVITE_ENABLED}/>
  <key>IS_GCM_ENABLED</key>
  <${config.IS_GCM_ENABLED}/>
  <key>IS_SIGNIN_ENABLED</key>
  <${config.IS_SIGNIN_ENABLED}/>
  <key>GOOGLE_APP_ID</key>
  <string>${config.GOOGLE_APP_ID}</string>
</dict>
</plist>`;
}

/**
 * Generate security checklist
 */
function generateSecurityChecklist() {
  log.info('Generating security checklist...');
  
  const checklist = `# Production Security Checklist

## Environment Variables
- [ ] All REPLACE_WITH_* values have been replaced with actual values
- [ ] No development/test keys are used in production
- [ ] All secrets are stored securely (Azure Key Vault, etc.)
- [ ] Environment variables are not logged or exposed

## Firebase Security
- [ ] Firestore security rules are configured for production
- [ ] Firebase API keys are restricted to specific domains/apps
- [ ] Firebase Authentication is properly configured
- [ ] Firebase Storage security rules are in place

## API Security
- [ ] HTTPS is enforced for all API endpoints
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection protection is in place
- [ ] XSS protection is enabled

## Mobile App Security
- [ ] Code obfuscation is enabled (ProGuard/R8)
- [ ] SSL pinning is implemented
- [ ] Root/jailbreak detection is enabled
- [ ] Debugger detection is enabled
- [ ] Sensitive data is encrypted
- [ ] Keychain/Keystore is used for sensitive storage

## Infrastructure Security
- [ ] Web Application Firewall (WAF) is configured
- [ ] DDoS protection is enabled
- [ ] Security headers are configured
- [ ] Regular security scans are scheduled
- [ ] Backup encryption is enabled
- [ ] Access controls are properly configured

## Monitoring & Alerting
- [ ] Security monitoring is enabled
- [ ] Intrusion detection is configured
- [ ] Failed login attempts are monitored
- [ ] Suspicious activity alerts are set up
- [ ] Security incident response plan is in place

## Compliance
- [ ] LGPD compliance is verified (Brazil)
- [ ] GDPR compliance is verified (if applicable)
- [ ] Privacy policy is updated and accessible
- [ ] Terms of service are updated
- [ ] Data retention policies are implemented

---
Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync('./docs/SECURITY_CHECKLIST.md', checklist);
  log.success('Security checklist generated: docs/SECURITY_CHECKLIST.md');
}

/**
 * Main configuration function
 */
async function main() {
  log.title('Production Environment Configuration');
  
  try {
    const tasks = [
      { name: 'Generate Production Environment', fn: generateProductionEnv },
      { name: 'Validate Environment', fn: validateEnvironment },
      { name: 'Generate Firebase Config', fn: generateFirebaseConfig },
      { name: 'Generate Security Checklist', fn: generateSecurityChecklist },
    ];
    
    let successCount = 0;
    
    for (const task of tasks) {
      log.info(`\n${'='.repeat(50)}`);
      log.info(`${task.name}...`);
      log.info(`${'='.repeat(50)}`);
      
      const success = task.fn();
      if (success) {
        successCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log.title('Environment Configuration Summary');
    
    console.log(`✅ Completed: ${successCount}/${tasks.length} tasks`);
    console.log(`📁 Files generated:`);
    console.log(`   - .env.production`);
    console.log(`   - android/app/google-services.json`);
    console.log(`   - ios/GoogleService-Info.plist`);
    console.log(`   - docs/SECURITY_CHECKLIST.md`);
    
    if (successCount === tasks.length) {
      log.success('🎉 Production environment configuration completed!');
      log.warning('⚠️ IMPORTANT: Replace all placeholder values with actual production values');
      log.info('Next steps:');
      log.info('1. Replace REPLACE_WITH_* values in .env.production');
      log.info('2. Configure Azure App Service environment variables');
      log.info('3. Review and complete security checklist');
      log.info('4. Test configuration in staging environment');
    } else {
      log.warning('⚠️ Environment configuration completed with issues');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    log.error(`Environment configuration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateProductionEnv,
  validateEnvironment,
  configureAzureEnvironment,
  generateFirebaseConfig,
  generateSecurityChecklist,
};
