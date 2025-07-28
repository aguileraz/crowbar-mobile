/**
 * Setup global para testes E2E do Crowbar Mobile
 * 
 * Configurações globais necessárias para execução dos testes end-to-end
 * usando Detox e Jest.
 */

// Importar globals do Detox (com fallback para mock)
try {
  const { device, element, by, waitFor } = require('detox');
  
  // Tornar Detox globals disponíveis
  global.device = device;
  global.element = element;
  global.by = by;
  global.waitFor = waitFor;
} catch (error) {
  // Mock Detox globals para testes de configuração
  global.device = { 
    launchApp: () => Promise.resolve(),
    terminateApp: () => Promise.resolve(),
    getPlatform: () => 'mock'
  };
  global.element = () => ({ 
    toBeVisible: () => ({ withTimeout: () => Promise.resolve() })
  });
  global.by = { 
    text: () => 'mock-by-text',
    id: () => 'mock-by-id'
  };
  global.waitFor = () => ({ 
    toBeVisible: () => ({ withTimeout: () => Promise.resolve() })
  });
}

// Configurações de timeout para elementos lentos
const TIMEOUT_CONFIG = {
  DEFAULT: 5000,
  SLOW: 10000,
  VERY_SLOW: 15000
};

// Configurações para diferentes tipos de device
const DEVICE_CONFIG = {
  ANDROID: {
    platform: 'android',
    timeouts: {
      tap: 1000,
      type: 2000,
      scroll: 2000
    }
  },
  iOS: {
    platform: 'ios',
    timeouts: {
      tap: 800,
      type: 1500,
      scroll: 1500
    }
  }
};

// Configurações globais para testes
global.TIMEOUT_CONFIG = TIMEOUT_CONFIG;
global.DEVICE_CONFIG = DEVICE_CONFIG;

// Configurações para expectativas do Detox
const _detoxConfig = {
  timeout: TIMEOUT_CONFIG.DEFAULT,
  interval: 500
};

// Configurar timeouts padrão para expectativas
beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
});

// Configurar helpers globais
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para aguardar elemento aparecer
global.waitForElement = async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  await waitFor(targetElement).toBeVisible().withTimeout(timeout);
};

// Helper para aguardar elemento desaparecer
global.waitForElementToDisappear = async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  await waitFor(targetElement).toBeNotVisible().withTimeout(timeout);
};

// Helper para aguardar e tocar em elemento
global.waitAndTap = async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  await waitFor(targetElement).toBeVisible().withTimeout(timeout);
  await targetElement.tap();
};

// Helper para aguardar e digitar texto
global.waitAndType = async (targetElement, text, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  await waitFor(targetElement).toBeVisible().withTimeout(timeout);
  await targetElement.clearText();
  await targetElement.typeText(text);
};

// Helper para scroll até elemento
global.scrollToElement = async (scrollView, targetElement, direction = 'down', offset = 0.5) => {
  await scrollView.scroll(500, direction, offset);
  await waitFor(targetElement).toBeVisible().withTimeout(TIMEOUT_CONFIG.SLOW);
};

// Helper para aguardar carregamento
global.waitForLoading = async (timeout = TIMEOUT_CONFIG.SLOW) => {
  await sleep(1000); // Aguarda loading aparecer
  await waitFor(element(by.text('Carregando...')))
    .toBeNotVisible()
    .withTimeout(timeout);
};

// Helper para aguardar tela carregar
global.waitForScreen = async (screenTestID, timeout = TIMEOUT_CONFIG.SLOW) => {
  await waitFor(element(by.id(screenTestID)))
    .toBeVisible()
    .withTimeout(timeout);
};

// Logger para debug
global.logTest = (message) => {
  console.log(`[E2E TEST] ${new Date().toISOString()}: ${message}`);
};

// Configurar mock para notificações se necessário
global.mockNotifications = () => {
  // Mock para notificações push durante testes
  if (typeof jest !== 'undefined') {
    jest.mock('@react-native-firebase/messaging', () => ({
      messaging: () => ({
        requestPermission: jest.fn(() => Promise.resolve(true)),
        getToken: jest.fn(() => Promise.resolve('mock-token')),
        onTokenRefresh: jest.fn(),
        onMessage: jest.fn(),
        onNotificationOpenedApp: jest.fn(),
        getInitialNotification: jest.fn(() => Promise.resolve(null)),
      }),
    }));
  }
};

// Configurar comportamento padrão para testes
beforeAll(async () => {
  logTest('Iniciando configuração global dos testes E2E');
  
  // Configurar permissões para notificações
  if (device.getPlatform() === 'android') {
    await device.grantPermission('android.permission.POST_NOTIFICATIONS');
  }
  
  logTest('Configuração global finalizada');
});

afterAll(async () => {
  logTest('Finalizando testes E2E');
});

// Configurar screenshot em caso de falha
afterEach(async () => {
  if (jasmine.currentTest && jasmine.currentTest.failedExpectations.length > 0) {
    const testName = jasmine.currentTest.fullName.replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}_${timestamp}.png`;
    
    try {
      await device.takeScreenshot(filename);
      logTest(`Screenshot salvo: ${filename}`);
    } catch (error) {
      logTest(`Erro ao capturar screenshot: ${error.message}`);
    }
  }
});

logTest('Setup E2E carregado com sucesso');