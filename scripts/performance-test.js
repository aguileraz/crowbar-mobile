#!/usr/bin/env node

/**
 * Script de teste de performance para Crowbar Mobile
 * Valida métricas de performance em dispositivos reais
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações de performance
const PERFORMANCE_CRITERIA = {
  android: {
    coldStart: {
      high: 2000,    // High-end devices
      mid: 3000,     // Mid-range devices  
      low: 4000,     // Low-end devices
    },
    memoryUsage: {
      high: 200,     // MB
      mid: 150,      // MB
      low: 100,      // MB
    },
    bundleSize: {
      apk: 50,       // MB
      aab: 40,       // MB
    },
    minFPS: {
      high: 55,
      mid: 50,
      low: 45,
    }
  },
  ios: {
    coldStart: {
      high: 1500,    // Newer iPhones
      mid: 2500,     // Older iPhones
    },
    memoryUsage: {
      high: 180,     // MB
      mid: 120,      // MB
    },
    bundleSize: {
      ipa: 60,       // MB
    },
    minFPS: {
      high: 60,
      mid: 55,
    }
  }
};

// Device profiles
const DEVICE_PROFILES = {
  android: {
    high: ['Pixel 6', 'Galaxy S21', 'OnePlus 9'],
    mid: ['Pixel 3a', 'Galaxy A52', 'Moto G Power'],
    low: ['Galaxy J7', 'Moto E', 'Redmi 9A'],
  },
  ios: {
    high: ['iPhone 13', 'iPhone 12', 'iPhone 11'],
    mid: ['iPhone 8', 'iPhone SE', 'iPhone 7'],
  }
};

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
  metric: (name, value, unit, status) => {
    const icon = status === 'pass' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    const color = status === 'pass' ? colors.green : status === 'warning' ? colors.yellow : colors.red;
    console.log(`  ${color}${icon}${colors.reset} ${name}: ${value}${unit}`);
  }
};

// Parse argumentos
const args = process.argv.slice(2);
const platform = args.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'android';
const deviceTier = args.find(arg => arg.startsWith('--tier='))?.split('=')[1] || 'mid';
const buildType = args.find(arg => arg.startsWith('--build='))?.split('=')[1] || 'release';

log.info('🚀 Crowbar Mobile Performance Test\n');

/**
 * Verificar dispositivo conectado
 */
function checkDevice() {
  log.info('Verificando dispositivo conectado...');
  
  try {
    if (platform === 'android') {
      const devices = execSync('adb devices', { encoding: 'utf8' });
      const deviceLines = devices.split('\n').filter(line => line.includes('device') && !line.includes('List'));
      
      if (deviceLines.length === 0) {
        log.error('Nenhum dispositivo Android conectado');
        log.info('Conecte um dispositivo ou inicie um emulador');
        process.exit(1);
      }
      
      // Obter informações do dispositivo
      const model = execSync('adb shell getprop ro.product.model', { encoding: 'utf8' }).trim();
      const androidVersion = execSync('adb shell getprop ro.build.version.release', { encoding: 'utf8' }).trim();
      const apiLevel = execSync('adb shell getprop ro.build.version.sdk', { encoding: 'utf8' }).trim();
      
      log.success(`Dispositivo encontrado: ${model} (Android ${androidVersion}, API ${apiLevel})`);
      
      return { model, androidVersion, apiLevel };
    } else {
      // iOS - verificar simulador ou dispositivo
      const devices = execSync('xcrun simctl list devices booted', { encoding: 'utf8' });
      
      if (!devices.includes('(Booted)')) {
        log.error('Nenhum simulador iOS iniciado');
        log.info('Inicie um simulador no Xcode');
        process.exit(1);
      }
      
      log.success('Simulador iOS encontrado');
      return { model: 'iOS Simulator' };
    }
  } catch (error) {
    log.error(`Erro ao verificar dispositivo: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Medir tamanho do bundle
 */
function measureBundleSize() {
  log.info('\n📦 Medindo tamanho do bundle...');
  
  let bundlePath;
  let bundleSize;
  
  try {
    if (platform === 'android') {
      bundlePath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', buildType, `app-${buildType}.apk`);
      
      if (!fs.existsSync(bundlePath)) {
        log.warning('APK não encontrado. Construindo...');
        execSync(`cd android && ./gradlew assemble${buildType.charAt(0).toUpperCase() + buildType.slice(1)}`, { stdio: 'inherit' });
      }
      
      const stats = fs.statSync(bundlePath);
      bundleSize = (stats.size / (1024 * 1024)).toFixed(2);
      
      const limit = PERFORMANCE_CRITERIA.android.bundleSize.apk;
      const status = bundleSize <= limit ? 'pass' : 'fail';
      
      log.metric('APK Size', bundleSize, 'MB', status);
      
      if (status === 'fail') {
        log.warning(`Tamanho do APK excede o limite de ${limit}MB`);
        analyzeBundle();
      }
    } else {
      // iOS bundle size check would go here
      log.info('Verificação de tamanho do bundle iOS não implementada');
    }
    
    return bundleSize;
  } catch (error) {
    log.error(`Erro ao medir bundle: ${error.message}`);
    return 0;
  }
}

/**
 * Analisar composição do bundle
 */
function analyzeBundle() {
  log.info('\n📊 Analisando composição do bundle...');
  
  try {
    execSync('npm run bundle:analyze', { stdio: 'inherit' });
  } catch (error) {
    log.warning('Não foi possível analisar o bundle');
  }
}

/**
 * Medir tempo de cold start
 */
async function measureColdStart() {
  log.info('\n⏱️  Medindo tempo de cold start...');
  
  try {
    // Fechar app se estiver aberto
    if (platform === 'android') {
      execSync('adb shell am force-stop com.crowbarmobile', { stdio: 'ignore' });
      await sleep(1000);
    }
    
    // Limpar cache
    if (platform === 'android') {
      execSync('adb shell pm clear com.crowbarmobile', { stdio: 'ignore' });
      await sleep(1000);
    }
    
    // Marcar início
    const startTime = Date.now();
    
    // Iniciar app
    if (platform === 'android') {
      execSync('adb shell am start -n com.crowbarmobile/.MainActivity');
    } else {
      // iOS launch command
      execSync('xcrun simctl launch booted com.crowbar.mobile');
    }
    
    // Aguardar app estar completamente carregado
    // Em um cenário real, você usaria uma ferramenta como Maestro ou verificaria logs
    await waitForAppReady();
    
    const coldStartTime = Date.now() - startTime;
    const criteria = PERFORMANCE_CRITERIA[platform].coldStart[deviceTier];
    const status = coldStartTime <= criteria ? 'pass' : coldStartTime <= criteria * 1.2 ? 'warning' : 'fail';
    
    log.metric('Cold Start Time', coldStartTime, 'ms', status);
    
    return { coldStartTime, status };
  } catch (error) {
    log.error(`Erro ao medir cold start: ${error.message}`);
    return { coldStartTime: 0, status: 'fail' };
  }
}

/**
 * Aguardar app estar pronto
 */
async function waitForAppReady(maxWait = 10000) {
  const startWait = Date.now();
  
  while (Date.now() - startWait < maxWait) {
    try {
      if (platform === 'android') {
        // Verificar se activity principal está visível
        const activities = execSync('adb shell dumpsys activity | grep mResumedActivity', { encoding: 'utf8' });
        if (activities.includes('MainActivity')) {
          await sleep(500); // Aguardar renderização completa
          return;
        }
      }
    } catch (error) {
      // Continuar tentando
    }
    
    await sleep(100);
  }
  
  throw new Error('Timeout aguardando app ficar pronto');
}

/**
 * Medir uso de memória
 */
async function measureMemoryUsage() {
  log.info('\n💾 Medindo uso de memória...');
  
  try {
    // Aguardar estabilização
    await sleep(2000);
    
    let memoryUsage;
    
    if (platform === 'android') {
      const memInfo = execSync('adb shell dumpsys meminfo com.crowbarmobile', { encoding: 'utf8' });
      
      // Extrair total PSS (Proportional Set Size)
      const pssMatch = memInfo.match(/TOTAL\s+(\d+)/);
      if (pssMatch) {
        memoryUsage = Math.round(parseInt(pssMatch[1]) / 1024); // Converter para MB
      }
    } else {
      // iOS memory measurement
      log.info('Medição de memória iOS não implementada');
      return { memoryUsage: 0, status: 'unknown' };
    }
    
    const criteria = PERFORMANCE_CRITERIA[platform].memoryUsage[deviceTier];
    const status = memoryUsage <= criteria ? 'pass' : memoryUsage <= criteria * 1.2 ? 'warning' : 'fail';
    
    log.metric('Memory Usage', memoryUsage, 'MB', status);
    
    return { memoryUsage, status };
  } catch (error) {
    log.error(`Erro ao medir memória: ${error.message}`);
    return { memoryUsage: 0, status: 'fail' };
  }
}

/**
 * Medir FPS durante navegação
 */
async function measureFPS() {
  log.info('\n🎮 Medindo FPS durante navegação...');
  
  try {
    if (platform === 'android') {
      // Habilitar GPU profiling
      execSync('adb shell setprop debug.hwui.profile true');
      
      // Limpar dados anteriores
      execSync('adb shell dumpsys gfxinfo com.crowbarmobile reset');
      
      // Simular navegação (você precisaria de uma ferramenta como Appium para navegação real)
      log.info('Simulando navegação no app...');
      await simulateNavigation();
      
      // Coletar dados de FPS
      const gfxInfo = execSync('adb shell dumpsys gfxinfo com.crowbarmobile', { encoding: 'utf8' });
      
      // Extrair janky frames
      const jankyMatch = gfxInfo.match(/Janky frames:\s+(\d+)\s+\(([\d.]+)%\)/);
      if (jankyMatch) {
        const jankyPercent = parseFloat(jankyMatch[2]);
        const smoothPercent = 100 - jankyPercent;
        const avgFPS = Math.round(60 * (smoothPercent / 100));
        
        const criteria = PERFORMANCE_CRITERIA[platform].minFPS[deviceTier];
        const status = avgFPS >= criteria ? 'pass' : avgFPS >= criteria - 5 ? 'warning' : 'fail';
        
        log.metric('Average FPS', avgFPS, '', status);
        log.metric('Smooth Frames', smoothPercent.toFixed(1), '%', status);
        
        return { avgFPS, smoothPercent, status };
      }
    } else {
      log.info('Medição de FPS iOS não implementada');
      return { avgFPS: 60, smoothPercent: 100, status: 'unknown' };
    }
  } catch (error) {
    log.error(`Erro ao medir FPS: ${error.message}`);
    return { avgFPS: 0, smoothPercent: 0, status: 'fail' };
  }
}

/**
 * Simular navegação básica
 */
async function simulateNavigation() {
  if (platform === 'android') {
    // Swipe up (scroll)
    execSync('adb shell input swipe 500 1500 500 300 300');
    await sleep(1000);
    
    // Swipe down
    execSync('adb shell input swipe 500 300 500 1500 300');
    await sleep(1000);
    
    // Tap em coordenada (ajustar conforme necessário)
    execSync('adb shell input tap 500 500');
    await sleep(2000);
    
    // Voltar
    execSync('adb shell input keyevent 4');
    await sleep(1000);
  }
}

/**
 * Gerar relatório de performance
 */
function generateReport(results) {
  log.info('\n📄 Gerando relatório de performance...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    platform,
    deviceTier,
    buildType,
    device: results.device,
    metrics: {
      bundleSize: results.bundleSize,
      coldStart: results.coldStart,
      memory: results.memory,
      fps: results.fps,
    },
    summary: {
      passed: 0,
      warnings: 0,
      failed: 0,
    }
  };
  
  // Contar resultados
  Object.values(results).forEach(result => {
    if (result.status === 'pass') report.summary.passed++;
    else if (result.status === 'warning') report.summary.warnings++;
    else if (result.status === 'fail') report.summary.failed++;
  });
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Exibir resumo
  console.log('📊 RESUMO DA PERFORMANCE');
  console.log('═'.repeat(50));
  console.log(`${colors.green}✅ Passou:${colors.reset} ${report.summary.passed}`);
  console.log(`${colors.yellow}⚠️  Avisos:${colors.reset} ${report.summary.warnings}`);
  console.log(`${colors.red}❌ Falhou:${colors.reset} ${report.summary.failed}`);
  console.log('═'.repeat(50));
  
  if (report.summary.failed > 0) {
    log.error('\n❌ O app não atende aos critérios de performance!');
    process.exit(1);
  } else if (report.summary.warnings > 0) {
    log.warning('\n⚠️  O app tem avisos de performance que devem ser verificados.');
  } else {
    log.success('\n✅ O app atende a todos os critérios de performance!');
  }
  
  log.info(`\nRelatório completo salvo em: ${reportPath}`);
}

/**
 * Função auxiliar de sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executar testes de performance
 */
async function runPerformanceTests() {
  const results = {};
  
  // Verificar dispositivo
  results.device = checkDevice();
  
  // Medir tamanho do bundle
  results.bundleSize = measureBundleSize();
  
  // Medir cold start
  results.coldStart = await measureColdStart();
  
  // Medir memória
  results.memory = await measureMemoryUsage();
  
  // Medir FPS
  results.fps = await measureFPS();
  
  // Gerar relatório
  generateReport(results);
}

// Executar
runPerformanceTests().catch(error => {
  log.error(`Erro fatal: ${error.message}`);
  process.exit(1);
});