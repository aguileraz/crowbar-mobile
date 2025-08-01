#!/usr/bin/env node

/**
const { execSync } = require('child_process');

 * Script de revisão de segurança para Crowbar Mobile
 * Verifica vulnerabilidades, configurações e melhores práticas
 */

const fs = require('fs');
const _path = require('_path');
const _crypto = require('crypto');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Funções de log
const log = {
  info: (msg) => ,
  success: (msg) => ,
  warning: (msg) => ,
  error: (msg) => ,
  header: (msg) => ,
};

// Configurações de segurança
const _SECURITY_CHECKS = {
  dependencies: {
    name: 'Dependency Vulnerabilities',
    critical: true,
  },
  secrets: {
    name: 'Hardcoded Secrets',
    critical: true,
  },
  firebase: {
    name: 'Firebase Configuration',
    critical: true,
  },
  api: {
    name: 'API Security',
    critical: true,
  },
  storage: {
    name: 'Secure Storage',
    critical: true,
  },
  permissions: {
    name: 'App Permissions',
    critical: false,
  },
  ssl: {
    name: 'SSL/TLS Configuration',
    critical: true,
  },
  auth: {
    name: 'Authentication Security',
    critical: true,
  },
};

// Padrões de secrets para buscar
const SECRET_PATTERNS = [
  /['"]?api[_-]?key['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?secret[_-]?key['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?private[_-]?key['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"]/gi,
  /['"]?token['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /['"]?client[_-]?secret['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /-----BEGIN\s+[A-Z]+\s+PRIVATE\s+KEY-----/g,
  /['"]?firebase[_-]?api[_-]?key['"]?\s*[:=]\s*['"][^'"]{20,}['"]/gi,
];

// Arquivos a ignorar na busca por secrets
const IGNORE_FILES = [
  'node_modules',
  '.git',
  'ios/Pods',
  'android/build',
  '*.log',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  '.env.example',
  'security-review.js',
];

const results = {
  passed: 0,
  warnings: 0,
  failed: 0,
  critical: 0,
  issues: [],
};

/**
 * 1. Verificar vulnerabilidades em dependências
 */
async function checkDependencyVulnerabilities() {
  log.header('Dependency Vulnerabilities');
  
  try {
    const audit = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(audit);
    
    const vulnerabilities = auditData.metadata.vulnerabilities;
    const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      log.success('No known vulnerabilities found');
      results.passed++;
    } else {
      log.error(`Found ${total} vulnerabilities:`);
      log.info(`  Critical: ${vulnerabilities.critical || 0}`);
      log.info(`  High: ${vulnerabilities.high || 0}`);
      log.info(`  Moderate: ${vulnerabilities.moderate || 0}`);
      log.info(`  Low: ${vulnerabilities.low || 0}`);
      
      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        results.critical++;
        results.issues.push({
          type: 'critical',
          check: 'dependencies',
          message: `${vulnerabilities.critical + vulnerabilities.high} critical/high vulnerabilities found`,
        });
      } else {
        results.warnings++;
        results.issues.push({
          type: 'warning',
          check: 'dependencies',
          message: `${total} low/moderate vulnerabilities found`,
        });
      }
      
      // Listar vulnerabilidades críticas
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
          if (vuln.severity === 'critical' || vuln.severity === 'high') {
            log.error(`  ${pkg}: ${vuln.via[0].title || vuln.via[0]}`);
          }
        });
      }
    }
  } catch (error) {
    if (error.message.includes('npm audit')) {
      // Parse output mesmo com erro (npm audit retorna exit code 1 com vulnerabilidades)
      try {
        const output = error.stdout || error.output[1];
        const auditData = JSON.parse(output);
        const vulnerabilities = auditData.metadata.vulnerabilities;
        const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
        
        if (total > 0) {
          log.error(`Found ${total} vulnerabilities - run 'npm audit' for details`);
          results.failed++;
          results.issues.push({
            type: 'error',
            check: 'dependencies',
            message: `${total} vulnerabilities found in dependencies`,
          });
        }
      } catch (parseError) {
        log.warning('Could not parse npm audit results');
        results.warnings++;
      }
    } else {
      log.error(`Error running npm audit: ${error.message}`);
      results.failed++;
    }
  }
}

/**
 * 2. Buscar por secrets hardcoded
 */
async function checkHardcodedSecrets() {
  log.header('Hardcoded Secrets');
  
  const secretsFound = [];
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = _path.join(dir, file);
      
      // Verificar se deve ignorar
      if (IGNORE_FILES.some(pattern => fullPath.includes(pattern))) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        SECRET_PATTERNS.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Verificar se não é um placeholder
              if (!match.includes('your-') && !match.includes('replace-with') && !match.includes('example')) {
                secretsFound.push({
                  file: fullPath,
                  match: match.substring(0, 50) + '...',
                  line: content.substring(0, content.indexOf(match)).split('\n').length,
                });
              }
            });
          }
        });
      }
    });
  }
  
  searchDirectory(_path.join(__dirname, '..', 'src'));
  
  if (secretsFound.length === 0) {
    log.success('No hardcoded secrets found');
    results.passed++;
  } else {
    log.error(`Found ${secretsFound.length} potential hardcoded secrets:`);
    secretsFound.forEach(secret => {
      log.error(`  ${secret.file}:${secret.line} - ${secret.match}`);
    });
    results.critical++;
    results.issues.push({
      type: 'critical',
      check: 'secrets',
      message: `${secretsFound.length} potential hardcoded secrets found`,
    });
  }
}

/**
 * 3. Verificar configuração do Firebase
 */
async function checkFirebaseConfiguration() {
  log.header('Firebase Configuration');
  
  const checks = {
    envFiles: true,
    productionConfig: true,
    securityRules: true,
  };
  
  // Verificar arquivos de ambiente
  const envFiles = ['.env', '.env.production'];
  envFiles.forEach(envFile => {
    const envPath = _path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Verificar se tem placeholders
      if (content.includes('your-') || content.includes('replace-with')) {
        log.warning(`${envFile} contains placeholder values`);
        checks.productionConfig = false;
      }
      
      // Verificar se está no .gitignore
      const gitignorePath = _path.join(__dirname, '..', '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.includes(envFile)) {
          log.error(`${envFile} is not in .gitignore!`);
          checks.envFiles = false;
        }
      }
    }
  });
  
  // Verificar google-services.json
  const googleServicesPath = _path.join(__dirname, '..', 'android', 'app', 'google-services.json');
  if (fs.existsSync(googleServicesPath)) {
    const content = fs.readFileSync(googleServicesPath, 'utf8');
    const config = JSON.parse(content);
    
    if (config.project_info && config.project_info.project_id) {
      log.info(`Firebase project: ${config.project_info.project_id}`);
      
      // Verificar se é projeto de produção
      if (config.project_info.project_id.includes('dev') || config.project_info.project_id.includes('test')) {
        log.warning('Using development/test Firebase project');
        checks.productionConfig = false;
      }
    }
  }
  
  // Resumo
  const allPassed = Object.values(checks).every(check => check);
  if (allPassed) {
    log.success('Firebase configuration looks secure');
    results.passed++;
  } else {
    log.warning('Firebase configuration needs review');
    results.warnings++;
    results.issues.push({
      type: 'warning',
      check: 'firebase',
      message: 'Firebase configuration needs production values',
    });
  }
}

/**
 * 4. Verificar segurança da API
 */
async function checkAPISecurity() {
  log.header('API Security');
  
  const apiFile = _path.join(__dirname, '..', 'src', 'services', 'api.ts');
  if (fs.existsSync(apiFile)) {
    const content = fs.readFileSync(apiFile, 'utf8');
    
    const checks = {
      https: content.includes('https://') || !content.includes('http://'),
      auth: content.includes('Authorization') || content.includes('Bearer'),
      timeout: content.includes('timeout'),
      errorHandling: content.includes('catch') || content.includes('interceptors'),
    };
    
    // Verificar cada aspecto
    if (!checks.https) {
      log.error('API using insecure HTTP protocol');
      results.critical++;
    } else {
      log.success('API using HTTPS');
    }
    
    if (!checks.auth) {
      log.warning('No authentication headers found');
      results.warnings++;
    } else {
      log.success('Authentication implemented');
    }
    
    if (!checks._timeout) {
      log.warning('No timeout configuration found');
      results.warnings++;
    } else {
      log.success('Timeout configured');
    }
    
    if (!checks.errorHandling) {
      log.warning('No error handling found');
      results.warnings++;
    } else {
      log.success('Error handling implemented');
    }
    
    // Verificar API_KEY no ambiente de produção
    const envProd = _path.join(__dirname, '..', '.env.production');
    if (fs.existsSync(envProd)) {
      const envContent = fs.readFileSync(envProd, 'utf8');
      if (envContent.includes('API_KEY=production-api-key-replace-with-real')) {
        log.error('Production API key not configured');
        results.critical++;
        results.issues.push({
          type: 'critical',
          check: 'api',
          message: 'Production API key is still a placeholder',
        });
      }
    }
    
    const allPassed = Object.values(checks).every(check => check);
    if (allPassed && results.critical === 0) {
      results.passed++;
    }
  } else {
    log.error('API service file not found');
    results.failed++;
  }
}

/**
 * 5. Verificar armazenamento seguro
 */
async function checkSecureStorage() {
  log.header('Secure Storage');
  
  // Buscar uso de AsyncStorage vs Keychain
  const srcPath = _path.join(__dirname, '..', 'src');
  let asyncStorageUsage = 0;
  let keychainUsage = 0;
  let sensitiveDataInAsync = false;
  
  function searchForStorage(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = _path.join(dir, file);
      
      if (IGNORE_FILES.some(pattern => fullPath.includes(pattern))) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchForStorage(fullPath);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('AsyncStorage')) {
          asyncStorageUsage++;
          
          // Verificar se está armazenando dados sensíveis
          if (content.includes('token') || content.includes('password') || content.includes('credential')) {
            sensitiveDataInAsync = true;
          }
        }
        
        if (content.includes('Keychain') || content.includes('keychain')) {
          keychainUsage++;
        }
      }
    });
  }
  
  searchForStorage(srcPath);
  
  if (keychainUsage > 0) {
    log.success(`Using react-native-keychain for secure storage (${keychainUsage} files)`);
  }
  
  if (asyncStorageUsage > 0) {
    log.info(`Using AsyncStorage in ${asyncStorageUsage} files`);
  }
  
  if (sensitiveDataInAsync) {
    log.error('Sensitive data possibly stored in AsyncStorage (not encrypted)');
    results.critical++;
    results.issues.push({
      type: 'critical',
      check: 'storage',
      message: 'Sensitive data stored in AsyncStorage instead of Keychain',
    });
  } else if (keychainUsage > 0) {
    log.success('Sensitive data appears to be stored securely');
    results.passed++;
  } else {
    log.warning('No secure storage implementation found');
    results.warnings++;
  }
}

/**
 * 6. Verificar permissões do app
 */
async function checkAppPermissions() {
  log.header('App Permissions');
  
  // Android
  const androidManifest = _path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(androidManifest)) {
    const content = fs.readFileSync(androidManifest, 'utf8');
    
    const permissions = content.match(/<uses-permission[^>]+>/g) || [];
    log.info(`Android permissions (${permissions.length}):`);
    
    const dangerousPerms = [];
    permissions.forEach(perm => {
      const permName = perm.match(/android:name="([^"]+)"/)?.[1];
      if (permName) {
        const isDangerous = permName.includes('CAMERA') || 
                          permName.includes('LOCATION') || 
                          permName.includes('CONTACTS') ||
                          permName.includes('STORAGE');
        
        if (isDangerous) {
          log.warning(`  ${permName} (dangerous)`);
          dangerousPerms.push(permName);
        } else {
          log.info(`  ${permName}`);
        }
      }
    });
    
    if (dangerousPerms.length > 0) {
      log.warning(`Using ${dangerousPerms.length} dangerous permissions - ensure they are necessary`);
      results.warnings++;
    } else {
      log.success('No unnecessary dangerous permissions');
      results.passed++;
    }
  }
  
  // iOS
  const infoPlist = _path.join(__dirname, '..', 'ios', 'CrowbarMobile', 'Info.plist');
  if (fs.existsSync(infoPlist)) {
    const content = fs.readFileSync(infoPlist, 'utf8');
    
    const usageDescriptions = content.match(/NS\w+UsageDescription/g) || [];
    log.info(`\niOS usage descriptions (${usageDescriptions.length}):`);
    usageDescriptions.forEach(usage => {
      log.info(`  ${usage}`);
    });
  }
}

/**
 * 7. Verificar configuração SSL/TLS
 */
async function checkSSLConfiguration() {
  log.header('SSL/TLS Configuration');
  
  const checks = {
    androidCleartextTraffic: true,
    iosATS: true,
    certificatePinning: false,
  };
  
  // Android - verificar cleartextTrafficPermitted
  const networkConfig = _path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml');
  const androidManifest = _path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  
  if (fs.existsSync(androidManifest)) {
    const content = fs.readFileSync(androidManifest, 'utf8');
    if (content.includes('cleartextTrafficPermitted="true"')) {
      log.error('Android allowing cleartext traffic');
      checks.androidCleartextTraffic = false;
    } else {
      log.success('Android cleartext traffic disabled');
    }
  }
  
  // iOS - verificar App Transport Security
  const infoPlist = _path.join(__dirname, '..', 'ios', 'CrowbarMobile', 'Info.plist');
  if (fs.existsSync(infoPlist)) {
    const content = fs.readFileSync(infoPlist, 'utf8');
    if (content.includes('NSAllowsArbitraryLoads') && content.includes('<true/>')) {
      log.error('iOS App Transport Security disabled');
      checks.iosATS = false;
    } else {
      log.success('iOS App Transport Security enabled');
    }
  }
  
  // Certificate Pinning
  if (fs.existsSync(networkConfig)) {
    const content = fs.readFileSync(networkConfig, 'utf8');
    if (content.includes('pin-set')) {
      log.success('Certificate pinning configured (Android)');
      checks.certificatePinning = true;
    }
  }
  
  if (!checks.certificatePinning) {
    log.warning('Certificate pinning not implemented');
    results.warnings++;
  }
  
  if (!checks.androidCleartextTraffic || !checks.iosATS) {
    results.critical++;
    results.issues.push({
      type: 'critical',
      check: 'ssl',
      message: 'SSL/TLS not properly enforced',
    });
  } else {
    results.passed++;
  }
}

/**
 * 8. Verificar segurança de autenticação
 */
async function checkAuthenticationSecurity() {
  log.header('Authentication Security');

  const checks = {
    biometrics: false,
    tokenRefresh: false,
    sessionTimeout: false,
    secureTokenStorage: false,
  };
  
  // Procurar por implementações de autenticação
  const srcPath = _path.join(__dirname, '..', 'src');
  
  function searchForAuth(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = _path.join(dir, file);
      
      if (IGNORE_FILES.some(pattern => fullPath.includes(pattern))) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchForAuth(fullPath);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('Biometrics') || content.includes('FaceID') || content.includes('TouchID')) {
          checks.biometrics = true;
        }
        
        if (content.includes('refreshToken') || content.includes('tokenRefresh')) {
          checks.tokenRefresh = true;
        }
        
        if (content.includes('sessionTimeout') || content.includes('SESSION_TIMEOUT')) {
          checks.sessionTimeout = true;
        }
        
        if (content.includes('Keychain') && (content.includes('token') || content.includes('Token'))) {
          checks.secureTokenStorage = true;
        }
      }
    });
  }
  
  searchForAuth(srcPath);
  
  // Reportar resultados
  if (checks.biometrics) {
    log.success('Biometric authentication available');
  } else {
    log.info('Biometric authentication not implemented');
  }
  
  if (checks.tokenRefresh) {
    log.success('Token refresh mechanism implemented');
  } else {
    log.warning('No token refresh mechanism found');
    results.warnings++;
  }
  
  if (checks.sessionTimeout) {
    log.success('Session timeout implemented');
  } else {
    log.warning('No session timeout found');
    results.warnings++;
  }
  
  if (checks.secureTokenStorage) {
    log.success('Tokens stored securely');
    results.passed++;
  } else {
    log.error('Tokens may not be stored securely');
    results.critical++;
    results.issues.push({
      type: 'critical',
      check: 'auth',
      message: 'Authentication tokens not stored in secure storage',
    });
  }
}

/**
 * Gerar relatório de segurança
 */
function generateSecurityReport() {
  log.header('Security Report Summary');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      warnings: results.warnings,
      failed: results.failed,
      critical: results.critical,
    },
    issues: results.issues,
    recommendations: [],
  };
  
  // Adicionar recomendações baseadas nos issues
  if (results.issues.some(issue => issue.check === 'dependencies')) {
    report.recommendations.push('Run "npm audit fix" to fix dependency vulnerabilities');
  }
  
  if (results.issues.some(issue => issue.check === 'secrets')) {
    report.recommendations.push('Move all secrets to environment variables or secure configuration');
  }
  
  if (results.issues.some(issue => issue.check === 'firebase')) {
    report.recommendations.push('Update Firebase configuration with production values');
  }
  
  if (results.issues.some(issue => issue.check === 'api')) {
    report.recommendations.push('Configure production API keys and ensure HTTPS is enforced');
  }
  
  if (results.issues.some(issue => issue.check === 'storage')) {
    report.recommendations.push('Use react-native-keychain for storing sensitive data');
  }
  
  if (results.issues.some(issue => issue.check === 'ssl')) {
    report.recommendations.push('Enable SSL/TLS enforcement and consider certificate pinning');
  }
  
  if (results.issues.some(issue => issue.check === 'auth')) {
    report.recommendations.push('Implement secure token storage and session management');
  }
  
  // Salvar relatório
  const reportPath = _path.join(__dirname, '..', 'security-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Exibir resumo

  );

  );
  
  if (results.critical > 0) {
    log.error('\n🚨 CRITICAL SECURITY ISSUES FOUND!');
    results.issues
      .filter(issue => issue.type === 'critical')
      .forEach(issue => {
        log.error(`  - ${issue.message}`);
      });
  }
  
  if (report.recommendations.length > 0) {

    report.recommendations.forEach((_rec, _index) => {

    });
  }
  
  log.info(`\nDetailed report saved to: ${reportPath}`);
  
  // Exit code baseado em issues críticas
  if (results.critical > 0) {
    process.exit(1);
  }
}

/**
 * Executar revisão de segurança
 */
async function runSecurityReview() {
  log.info('🔒 Crowbar Mobile Security Review\n');
  
  await checkDependencyVulnerabilities();
  await checkHardcodedSecrets();
  await checkFirebaseConfiguration();
  await checkAPISecurity();
  await checkSecureStorage();
  await checkAppPermissions();
  await checkSSLConfiguration();
  await checkAuthenticationSecurity();
  
  generateSecurityReport();
}

// Executar
runSecurityReview().catch(_error => {
  log.error(`Fatal error: ${_error.message}`);
  process.exit(1);
});