/**
 * Setup mock para testes de configuração E2E
 * Apenas testa se as configurações estão corretas sem inicializar Detox
 */

// Mock Detox globals para testes de configuração
global.device = { 
  launchApp: jest.fn(() => Promise.resolve()),
  terminateApp: jest.fn(() => Promise.resolve()),
  getPlatform: jest.fn(() => 'mock'),
  uninstallApp: jest.fn(() => Promise.resolve()),
  installApp: jest.fn(() => Promise.resolve()),
  setOrientation: jest.fn(() => Promise.resolve()),
  sendToHome: jest.fn(() => Promise.resolve()),
  takeScreenshot: jest.fn(() => Promise.resolve()),
  grantPermission: jest.fn(() => Promise.resolve()),
};

global.element = jest.fn(() => ({ 
  toBeVisible: jest.fn(() => ({ 
    withTimeout: jest.fn(() => Promise.resolve()) 
  })),
  toBeNotVisible: jest.fn(() => ({ 
    withTimeout: jest.fn(() => Promise.resolve()) 
  })),
  toExist: jest.fn(() => Promise.resolve()),
  tap: jest.fn(() => Promise.resolve()),
  clearText: jest.fn(() => Promise.resolve()),
  typeText: jest.fn(() => Promise.resolve()),
  atIndex: jest.fn(() => ({
    or: jest.fn(() => ({ toExist: jest.fn(() => Promise.resolve()) }))
  }))
}));

global.by = { 
  text: jest.fn((text) => `mock-by-text-${text}`),
  id: jest.fn((id) => `mock-by-id-${id}`)
};

global.waitFor = jest.fn(() => ({ 
  toBeVisible: jest.fn(() => ({ 
    withTimeout: jest.fn(() => Promise.resolve()) 
  })),
  toBeNotVisible: jest.fn(() => ({ 
    withTimeout: jest.fn(() => Promise.resolve()) 
  }))
}));

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

// Helpers globais
global.sleep = jest.fn((ms) => new Promise(resolve => setTimeout(resolve, ms)));

// Helper para aguardar elemento aparecer
global.waitForElement = jest.fn(async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  return Promise.resolve();
});

// Helper para aguardar elemento desaparecer
global.waitForElementToDisappear = jest.fn(async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  return Promise.resolve();
});

// Helper para aguardar e tocar em elemento
global.waitAndTap = jest.fn(async (targetElement, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  return Promise.resolve();
});

// Helper para aguardar e digitar texto
global.waitAndType = jest.fn(async (targetElement, text, timeout = TIMEOUT_CONFIG.DEFAULT) => {
  return Promise.resolve();
});

// Helper para scroll até elemento
global.scrollToElement = jest.fn(async (scrollView, targetElement, direction = 'down', offset = 0.5) => {
  return Promise.resolve();
});

// Helper para aguardar carregamento
global.waitForLoading = jest.fn(async (timeout = TIMEOUT_CONFIG.SLOW) => {
  return Promise.resolve();
});

// Helper para aguardar tela carregar
global.waitForScreen = jest.fn(async (screenTestID, timeout = TIMEOUT_CONFIG.SLOW) => {
  return Promise.resolve();
});

// Logger para debug
global.logTest = jest.fn((message) => {
  console.log(`[E2E TEST MOCK] ${new Date().toISOString()}: ${message}`);
});

// Mock para notificações
global.mockNotifications = jest.fn(() => {
  // Mock implementation
});

console.log('[E2E MOCK] Setup mock carregado com sucesso');