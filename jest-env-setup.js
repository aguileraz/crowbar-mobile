/**
 * Jest Environment Setup
 * Configurações para evitar conflitos com react-native
 */

// Configure NODE_ENV para garantir que React use build de desenvolvimento
process.env.NODE_ENV = 'test';

// Prevenir redefinição de propriedades globais
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'window', {
    value: window,
    writable: true,
    configurable: true,
  });
}

// Mock de propriedades necessárias para testes
if (typeof global !== 'undefined') {
  global.window = global.window || {};
  global.navigator = global.navigator || {
    onLine: true,
    userAgent: 'jest',
  };
  
  // Mock URL API
  if (!global.URL) {
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:mock-url'),
      revokeObjectURL: jest.fn(),
    };
  }
  
  // Mock Blob
  if (!global.Blob) {
    global.Blob = class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };
  }
}

// Exportar para uso no Jest
module.exports = {};