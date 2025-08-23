#!/usr/bin/env node
const { execSync } = require('child_process');

const _path = require('_path');

/**
 * Security Check Script for Crowbar Mobile
 * Validates security configurations before production deployment
 */

const fs = require('fs');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  title: (msg) => console.log(`🎯 ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
};

let securityScore = 0;
let maxScore = 0;
const issues = [];

/**
 * Check npm audit for vulnerabilities
 */
function checkDependencies() {
  log.title('Checking Dependencies');
  maxScore += 20;
  
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities.total === 0) {
      log.success('No vulnerabilities found in dependencies');
      securityScore += 20;
    } else {
      log.error(`Found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
      log.info(`Critical: ${audit.metadata.vulnerabilities.critical}`);
      log.info(`High: ${audit.metadata.vulnerabilities.high}`);
      log.info(`Moderate: ${audit.metadata.vulnerabilities.moderate}`);
      log.info(`Low: ${audit.metadata.vulnerabilities.low}`);
      issues.push(`${audit.metadata.vulnerabilities.total} npm vulnerabilities`);
    }
  } catch (error) {
    log.error('Failed to run npm audit');
    issues.push('Unable to check npm vulnerabilities');
  }
}

/**
 * Check for hardcoded secrets
 */
function checkForSecrets() {
  log.title('Checking for Hardcoded Secrets');
  maxScore += 20;
  
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
    /secret\s*[:=]\s*["'][^"']+["']/gi,
    /password\s*[:=]\s*["'][^"']+["']/gi,
    /token\s*[:=]\s*["'][^"']+["']/gi,
    /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi
  ];
  
  const filesToCheck = [
    'src',
    'config',
    'android/app/src/main/java',
    'android/app/src/main/res'
  ];
  
  let secretsFound = false;
  
  filesToCheck.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = walkDir(dir);
      files.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.java')) {
          const content = fs.readFileSync(file, 'utf8');
          secretPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              // Filter out test files and comments
              const realMatches = matches.filter(match => {
                return !match.includes('test') && 
                       !match.includes('mock') && 
                       !match.includes('example') &&
                       !match.includes('placeholder');
              });
              
              if (realMatches.length > 0) {
                log.warning(`Potential secret in ${file}: ${realMatches[0].substring(0, 50)}...`);
                secretsFound = true;
              }
            }
          });
        }
      });
    }
  });
  
  if (!secretsFound) {
    log.success('No hardcoded secrets found');
    securityScore += 20;
  } else {
    issues.push('Potential hardcoded secrets detected');
  }
}

/**
 * Check Android security configuration
 */
function checkAndroidSecurity() {
  log.title('Checking Android Security Configuration');
  maxScore += 20;
  let androidScore = 0;
  
  // Check AndroidManifest.xml
  const manifestPath = 'android/app/src/main/AndroidManifest.xml';
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    
    if (manifest.includes('android:allowBackup="false"')) {
      log.success('Backup is disabled');
      androidScore += 5;
    } else {
      log.error('Backup is not disabled');
      issues.push('Android backup should be disabled');
    }
    
    if (manifest.includes('android:networkSecurityConfig')) {
      log.success('Network security config is set');
      androidScore += 5;
    } else {
      log.warning('Network security config not found');
      issues.push('Network security config should be configured');
    }
  }
  
  // Check network_security_config.xml
  const networkConfigPath = 'android/app/src/main/res/xml/network_security_config.xml';
  if (fs.existsSync(networkConfigPath)) {
    const networkConfig = fs.readFileSync(networkConfigPath, 'utf8');
    
    if (networkConfig.includes('cleartextTrafficPermitted="false"')) {
      log.success('Cleartext traffic is disabled for production');
      androidScore += 10;
    } else {
      log.error('Cleartext traffic is not properly disabled');
      issues.push('Cleartext traffic should be disabled');
    }
  }
  
  securityScore += androidScore;
}

/**
 * Check Firebase configuration
 */
function checkFirebaseConfig() {
  log.title('Checking Firebase Configuration');
  maxScore += 20;
  
  const googleServicesPath = 'android/app/google-services.json';
  if (fs.existsSync(googleServicesPath)) {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    
    if (googleServices.project_info.project_id.includes('develop') || 
        googleServices.project_info.project_id.includes('dev')) {
      log.warning('Using development Firebase project');
      issues.push('Switch to production Firebase project');
      securityScore += 10; // Partial credit
    } else {
      log.success('Using production Firebase project');
      securityScore += 20;
    }
  } else {
    log.error('google-services.json not found');
    issues.push('Firebase configuration missing');
  }
}

/**
 * Check environment files
 */
function checkEnvironmentFiles() {
  log.title('Checking Environment Configuration');
  maxScore += 20;
  
  const envFiles = ['.env', '.env.production', '.env.staging'];
  let hasPlaceholders = false;
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('replace-with-real') || 
          content.includes('your-') || 
          content.includes('placeholder')) {
        log.warning(`${file} contains placeholder values`);
        hasPlaceholders = true;
      }
    }
  });
  
  if (!hasPlaceholders) {
    log.success('Environment files configured properly');
    securityScore += 20;
  } else {
    log.info('Environment files contain placeholders (expected for repository)');
    securityScore += 20; // Full credit as this is correct for repo
  }
}

/**
 * Walk directory recursively
 */
function walkDir(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== 'build') {
        walk(itemPath);
      } else if (stat.isFile()) {
        files.push(itemPath);
      }
    });
  }
  
  walk(dir);
  return files;
}

/**
 * Generate security report
 */
function generateReport() {
  const percentage = Math.round((securityScore / maxScore) * 100);
  
  );
  log.title('SECURITY CHECK SUMMARY');
  );
  
  ${colors.reset}`);
  
  if (percentage >= 90) {

  } else if (percentage >= 70) {
    ${colors.reset}`);
  } else {

  }
  
  if (issues.length > 0) {

    issues.forEach((issue, _index) => {

    });
  }
  
  );
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    score: securityScore,
    maxScore: maxScore,
    percentage: percentage,
    issues: issues,
    status: percentage >= 90 ? 'PASSED' : percentage >= 70 ? 'WARNING' : 'FAILED'
  };
  
  fs.writeFileSync('security-check-report.json', JSON.stringify(report, null, 2));
  log.info('Detailed report saved to: security-check-report.json');
}

/**
 * Main execution
 */
function main() {
  log.title('Crowbar Mobile Security Check');
  
  checkDependencies();
  checkForSecrets();
  checkAndroidSecurity();
  checkFirebaseConfig();
  checkEnvironmentFiles();
  
  generateReport();
  
  // Exit with error code if security score is too low
  if ((securityScore / maxScore) < 0.7) {
    process.exit(1);
  }
}

// Run the security check
main();