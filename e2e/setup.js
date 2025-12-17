/**
 * Detox E2E Tests Setup
 *
 * Configuração global para testes E2E com Detox.
 * Este arquivo é executado antes de todos os testes.
 */

const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const config = require('../.detoxrc');

// Configurar timeout global para testes
jest.setTimeout(120000);

// Configurar o adapter do Detox
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  // Inicializar Detox
  await detox.init(config, { launchApp: false });
});

beforeEach(async () => {
  // Setup antes de cada teste
  await adapter.beforeEach();
});

afterAll(async () => {
  // Cleanup após todos os testes
  await adapter.afterAll();
  await detox.cleanup();
});

// Configurações globais úteis
global.waitFor = waitFor;
global.element = element;
global.by = by;
global.device = device;
global.expect = expect;

// Helper functions
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.tapAndWait = async (matcher, waitTime = 1000) => {
  await element(matcher).tap();
  await sleep(waitTime);
};

global.typeAndWait = async (matcher, text, waitTime = 500) => {
  await element(matcher).typeText(text);
  await sleep(waitTime);
};

// Log de início dos testes
console.log('✓ Detox E2E setup concluído');
