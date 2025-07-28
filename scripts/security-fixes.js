#!/usr/bin/env node

/**
 * Script para aplicar correções de segurança automaticamente
 */

const fs = require('fs');
const _path = require('path');
const { execSync: _execSync } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Funções de log
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
};

log.info('🔒 Applying security fixes to Crowbar Mobile\n');

/**
 * 1. Criar arquivo de configuração de segurança de rede para Android
 */
function createAndroidNetworkSecurityConfig() {
  log.info('Creating Android network security configuration...');
  
  const xmlDir = _path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'xml');
  const configPath = _path.join(xmlDir, 'network_security_config.xml');
  
  // Criar diretório se não existir
  if (!fs.existsSync(xmlDir)) {
    fs.mkdirSync(xmlDir, { recursive: true });
  }
  
  const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Configuração padrão - apenas HTTPS -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Configuração específica para domínio de produção (opcional - para certificate pinning) -->
    <domain-config>
        <domain includeSubdomains="true">crowbar-backend.azurewebsites.net</domain>
        <trust-anchors>
            <certificates src="system" />
            <!-- Adicione pins de certificado aqui quando disponível -->
        </trust-anchors>
    </domain-config>
    
    <!-- Apenas para desenvolvimento local -->
    <debug-overrides>
        <base-config cleartextTrafficPermitted="true">
            <trust-anchors>
                <certificates src="system" />
                <certificates src="user" />
            </trust-anchors>
        </base-config>
    </debug-overrides>
</network-security-config>`;
  
  fs.writeFileSync(configPath, networkSecurityConfig);
  log.success('Created network_security_config.xml');
  
  // Atualizar AndroidManifest.xml para referenciar o arquivo
  const manifestPath = _path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  if (!manifest.includes('android:networkSecurityConfig')) {
    manifest = manifest.replace(
      '<application',
      '<application\n      android:networkSecurityConfig="@xml/network_security_config"'
    );
    fs.writeFileSync(manifestPath, manifest);
    log.success('Updated AndroidManifest.xml with network security config');
  }
}

/**
 * 2. Atualizar Info.plist do iOS para garantir App Transport Security
 */
function updateIOSInfoPlist() {
  log.info('\nUpdating iOS Info.plist for App Transport Security...');
  
  const plistPath = _path.join(__dirname, '..', 'ios', 'CrowbarMobile', 'Info.plist');
  
  if (fs.existsSync(plistPath)) {
    let plist = fs.readFileSync(plistPath, 'utf8');
    
    // Remover NSAllowsArbitraryLoads se existir
    if (plist.includes('NSAllowsArbitraryLoads')) {
      log.warning('Found NSAllowsArbitraryLoads in Info.plist - removing...');
      
      // Remover toda a seção NSAppTransportSecurity que permite tráfego arbitrário
      plist = plist.replace(
        /<key>NSAppTransportSecurity<\/key>\s*<dict>\s*<key>NSAllowsArbitraryLoads<\/key>\s*<true\/>\s*<\/dict>/g,
        ''
      );
      
      // Adicionar configuração segura
      const secureATS = `	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<false/>
		<key>NSExceptionDomains</key>
		<dict>
			<!-- Apenas para desenvolvimento local -->
			<key>localhost</key>
			<dict>
				<key>NSExceptionAllowsInsecureHTTPLoads</key>
				<true/>
			</dict>
		</dict>
	</dict>`;
      
      // Inserir antes do </dict> final
      plist = plist.replace(/<\/dict>\s*<\/plist>/, `${secureATS}\n</dict>\n</plist>`);
      
      fs.writeFileSync(plistPath, plist);
      log.success('Updated Info.plist with secure App Transport Security settings');
    } else {
      log.success('Info.plist already has secure ATS configuration');
    }
  }
}

/**
 * 3. Criar exemplo de arquivo de configuração de produção seguro
 */
function createSecureProductionEnv() {
  log.info('\nCreating secure production environment example...');
  
  const envSecurePath = _path.join(__dirname, '..', '.env.production.secure.example');
  
  const secureEnv = `# ===========================================
# CROWBAR MOBILE - SECURE PRODUCTION EXAMPLE
# ===========================================
# This is an example of a secure production configuration
# Copy to .env.production and replace with actual values
# NEVER commit the actual .env.production file

NODE_ENV=production
BUILD_TYPE=production

# ===========================================
# API CONFIGURATION
# ===========================================
# Use environment variables or secure configuration management
API_BASE_URL=https://crowbar-backend.azurewebsites.net/api
WS_BASE_URL=wss://crowbar-backend.azurewebsites.net
API_TIMEOUT=20000
# API_KEY should be loaded from secure storage or environment variable
API_KEY=\${CROWBAR_API_KEY}

# ===========================================
# FIREBASE CONFIGURATION
# ===========================================
# These should match your production Firebase project
FIREBASE_PROJECT_ID=crowbar-mobile-prod
FIREBASE_APP_ID=\${FIREBASE_PROD_APP_ID}
FIREBASE_API_KEY=\${FIREBASE_PROD_API_KEY}
FIREBASE_AUTH_DOMAIN=crowbar-mobile-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=crowbar-mobile-prod.appspot.com
FIREBASE_MESSAGING_SENDER_ID=\${FIREBASE_PROD_SENDER_ID}

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
# Session timeout in milliseconds (30 minutes)
SESSION_TIMEOUT=1800000
# Enable certificate pinning
CERTIFICATE_PINNING_ENABLED=true
# Force HTTPS for all requests
FORCE_HTTPS=true

# ===========================================
# APP CONFIGURATION
# ===========================================
APP_VERSION=1.0.0
DEBUG_MODE=false
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true

# ===========================================
# PRODUCTION FLAGS
# ===========================================
FLIPPER_ENABLED=false
DEV_MENU_ENABLED=false
LOG_LEVEL=error
# Only log errors to external services
REMOTE_LOGGING_ENABLED=true`;
  
  fs.writeFileSync(envSecurePath, secureEnv);
  log.success('Created .env.production.secure.example');
}

/**
 * 4. Adicionar verificações de segurança ao auth service
 */
function updateAuthService() {
  log.info('\nUpdating auth service with secure storage...');
  
  const authServicePath = _path.join(__dirname, '..', 'src', 'services', 'auth.ts');
  
  if (fs.existsSync(authServicePath)) {
    let authService = fs.readFileSync(authServicePath, 'utf8');
    
    // Verificar se já importa secureStorage
    if (!authService.includes('secureStorage')) {
      // Adicionar import
      authService = authService.replace(
        "import { apiClient } from './api';",
        "import { apiClient } from './api';\nimport { secureStorage } from './secureStorage';"
      );
      
      // Substituir AsyncStorage por secureStorage em métodos de token
      authService = authService.replace(
        /AsyncStorage\.setItem\(['"]auth_token['"],\s*token\)/g,
        'secureStorage.setAuthToken(token)'
      );
      
      authService = authService.replace(
        /AsyncStorage\.getItem\(['"]auth_token['"]\)/g,
        'secureStorage.getAuthToken()'
      );
      
      authService = authService.replace(
        /AsyncStorage\.removeItem\(['"]auth_token['"]\)/g,
        'secureStorage.removeAuthToken()'
      );
      
      fs.writeFileSync(authServicePath, authService);
      log.success('Updated auth service to use secure storage');
    } else {
      log.info('Auth service already uses secure storage');
    }
  }
}

/**
 * 5. Adicionar script de migração para tokens existentes
 */
function createMigrationScript() {
  log.info('\nCreating token migration script...');
  
  const migrationPath = _path.join(__dirname, '..', 'src', 'utils', 'migrateSecureStorage.ts');
  
  const migrationScript = `/**
 * Script de migração para mover tokens do AsyncStorage para armazenamento seguro
 * Execute uma vez após atualizar o app
 */

import { secureStorage } from '../services/secureStorage';
import logger from '../services/loggerService';

export async function migrateToSecureStorage(): Promise<void> {
  try {
    logger.info('Starting secure storage migration...', 'Migration');
    
    // Executar migração
    await secureStorage.migrateFromAsyncStorage();
    
    logger.info('Secure storage migration completed', 'Migration');
  } catch (error) {
    logger.error('Failed to migrate to secure storage', 'Migration', error);
  }
}

// Auto-executar na inicialização do app (adicionar ao App.tsx)
export async function checkAndMigrate(): Promise<void> {
  try {
    // Verificar se já foi migrado
    const migrated = await AsyncStorage.getItem('secure_storage_migrated');
    
    if (!migrated) {
      await migrateToSecureStorage();
      await AsyncStorage.setItem('secure_storage_migrated', 'true');
    }
  } catch (error) {
    logger.error('Migration check failed', 'Migration', error);
  }
}`;
  
  fs.writeFileSync(migrationPath, migrationScript);
  log.success('Created migration script');
}

/**
 * Executar todas as correções
 */
async function runSecurityFixes() {
  try {
    createAndroidNetworkSecurityConfig();
    updateIOSInfoPlist();
    createSecureProductionEnv();
    updateAuthService();
    createMigrationScript();
    
    log.success('\n✅ Security fixes applied successfully!');
    log.info('\n📋 Next steps:');
    log.info('1. Review and test the changes');
    log.info('2. Update .env.production with real values');
    log.info('3. Add certificate pinning for production domains');
    log.info('4. Run the security review again to verify fixes');
    log.info('5. Add checkAndMigrate() to App.tsx for token migration');
    
  } catch (error) {
    log.error(`Failed to apply security fixes: ${error.message}`);
    process.exit(1);
  }
}

// Executar
runSecurityFixes();