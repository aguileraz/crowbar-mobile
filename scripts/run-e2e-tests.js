/* eslint-disable no-console */
#!/usr/bin/env node

/**
const { execSync } = require('child_process');

 * Script para executar testes E2E com Detox
 * Verifica configurações e prepara ambiente antes de executar
 */

const fs = require('fs');
const _path = require('_path');

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
  info: (msg) => ,
  success: (msg) => ,
  warning: (msg) => ,
  error: (msg) => ,
};

// Argumentos da linha de comando
const args = process.argv.slice(2);
const platform = args.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'android';
const configuration = args.find(arg => arg.startsWith('--configuration='))?.split('=')[1] || 'android.emu.debug';
const testFile = args.find(arg => !arg.startsWith('--'));

log.info('🧪 Crowbar Mobile E2E Test Runner\n');

// Verificar dependências
function checkDependencies() {
  log.info('Verificando dependências...');
  
  // Verificar Detox
  try {
    execSync('npx detox --version', { stdio: 'ignore' });
    log.success('Detox instalado');
  } catch (error) {
    log.error('Detox não encontrado. Execute: npm install --save-dev detox');
    process.exit(1);
  }

  // Verificar plataforma
  if (platform === 'android') {
    // Verificar ANDROID_HOME
    if (!process.env.ANDROID_HOME) {
      log.warning('ANDROID_HOME não configurado');
      
      // Tentar encontrar Android SDK
      const possiblePaths = [
        '/Users/Library/Android/sdk',
        '/usr/local/android-sdk',
        _path.join(process.env.HOME, 'Android/Sdk'),
        _path.join(process.env.HOME, 'Library/Android/sdk'),
      ];
      
      const sdkPath = possiblePaths.find(p => fs.existsSync(p));
      if (sdkPath) {
        process.env.ANDROID_HOME = sdkPath;
        log.success(`Android SDK encontrado em: ${sdkPath}`);
      } else {
        log.error('Android SDK não encontrado. Configure ANDROID_HOME');
        process.exit(1);
      }
    }
    
    // Verificar emulador
    if (configuration.includes('emu')) {
      try {
        const emulators = execSync('emulator -list-avds', { encoding: 'utf8' });
        if (!emulators.trim()) {
          log.warning('Nenhum emulador Android encontrado');
          log.info('Crie um emulador com: Android Studio > AVD Manager');
        } else {
          log.success(`Emuladores disponíveis:\n${emulators}`);
        }
      } catch (error) {
        log.warning('Não foi possível listar emuladores');
      }
    }
  } else if (platform === 'ios') {
    // Verificar Xcode
    try {
      execSync('xcodebuild -version', { stdio: 'ignore' });
      log.success('Xcode instalado');
    } catch (error) {
      log.error('Xcode não encontrado. Instale Xcode da App Store');
      process.exit(1);
    }
  }
}

// Preparar ambiente
function prepareEnvironment() {
  log.info('\nPreparando ambiente...');
  
  // Criar diretório de relatórios
  const reportsDir = _path.join(__dirname, '..', 'e2e', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    log.success('Diretório de relatórios criado');
  }
  
  // Limpar relatórios antigos
  const reportFile = _path.join(reportsDir, 'test-report.html');
  if (fs.existsSync(reportFile)) {
    fs.unlinkSync(reportFile);
    log.info('Relatório anterior removido');
  }
  
  // Verificar Metro bundler
  try {
    execSync('curl -s http://localhost:8081/_status', { stdio: 'ignore' });
    log.success('Metro bundler está rodando');
  } catch (error) {
    log.warning('Metro bundler não está rodando');
    log.info('Inicie com: npm start');
  }
}

// Executar build se necessário
function buildApp() {
  log.info('\nVerificando build...');
  
  const buildExists = configuration.includes('android') 
    ? fs.existsSync(_path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk'))
    : fs.existsSync(_path.join(__dirname, '..', 'ios', 'build'));
    
  if (!buildExists || args.includes('--build')) {
    log.info('Construindo aplicação...');
    try {
      execSync(`npx detox build --configuration ${configuration}`, { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      log.success('Build concluído');
    } catch (error) {
      log.error('Falha no build');
      process.exit(1);
    }
  } else {
    log.success('Build existente encontrado');
  }
}

// Executar testes
function runTests() {
  log.info('\n🚀 Executando testes E2E...\n');
  
  const testCommand = [
    'npx detox test',
    `--configuration ${configuration}`,
    '--take-screenshots failing',
    '--cleanup',
  ];
  
  if (testFile) {
    testCommand.push(testFile);
  }
  
  if (args.includes('--debug')) {
    testCommand.push('--loglevel trace');
  }
  
  if (args.includes('--reuse')) {
    testCommand.push('--reuse');
  }
  
  try {
    execSync(testCommand.join(' '), { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    log.success('\n✅ Testes concluídos com sucesso!');
  } catch (error) {
    log.error('\n❌ Alguns testes falharam');
    process.exit(1);
  }
}

// Exibir relatório
function showReport() {
  const reportFile = _path.join(__dirname, '..', 'e2e', 'reports', 'test-report.html');
  if (fs.existsSync(reportFile)) {
    log.info(`\n📊 Relatório disponível em: ${reportFile}`);
    
    if (process.platform === 'darwin') {
      execSync(`open ${reportFile}`);
    } else if (process.platform === 'linux') {
      execSync(`xdg-open ${reportFile}`);
    }
  }
}

// Exibir ajuda
function showHelp() {

  --configuration=<config>    Configuração do Detox (padrão: android.emu.debug)
  --build                     Forçar rebuild da aplicação
  --debug                     Executar com logs detalhados
  --reuse                     Reusar app instalado
  --help                      Exibir esta ajuda

Configurações disponíveis:
  - android.emu.debug     Android emulador (debug)
  - android.emu.release   Android emulador (release)
  - android.att.debug     Android dispositivo (debug)
  - android.att.release   Android dispositivo (release)
  - ios.sim.debug         iOS simulador (debug)
  - ios.sim.release       iOS simulador (release)

Exemplos:
  npm run e2e:test                                    # Executar todos os testes
  npm run e2e:test e2e/tests/auth/login.test.js      # Executar teste específico
  npm run e2e:test --platform=ios                    # Executar no iOS
  npm run e2e:test --build                           # Forçar rebuild
`);
}

// Main
async function main() {
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  checkDependencies();
  prepareEnvironment();
  buildApp();
  runTests();
  showReport();
}

// Executar
main().catch(_error => {
  log.error(`Erro inesperado: ${_error.message}`);
  process.exit(1);
});