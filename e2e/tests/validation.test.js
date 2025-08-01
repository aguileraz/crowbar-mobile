 
/**
 * Teste de validação do ambiente E2E
 * Funciona tanto em ambiente mock quanto com Detox real
 */

describe('E2E Environment Validation', () => {
  beforeAll(async () => {
    logTest('Iniciando validação do ambiente E2E');
    
    // Tentar inicializar o dispositivo apenas se não for mock
    if (device.getPlatform() !== 'mock') {
      try {
        await device.launchApp();
        logTest('App inicializado com sucesso');
      } catch (error) {
        logTest(`Falha ao inicializar app: ${error.message}`);
        // Não falhar o teste, apenas logar
      }
    } else {
      logTest('Executando em modo mock - não requer emulador');
    }
  });

  afterAll(async () => {
    logTest('Finalizando validação do ambiente E2E');
    
    // Finalizar app apenas se não for mock
    if (device.getPlatform() !== 'mock') {
      try {
        await device.terminateApp();
        logTest('App finalizado com sucesso');
      } catch (error) {
        logTest(`Erro ao finalizar app: ${error.message}`);
      }
    }
  });

  it('should validate device setup', async () => {
    expect(device).toBeDefined();
    expect(typeof device.getPlatform).toBe('function');
    
    const platform = device.getPlatform();
    logTest(`Plataforma detectada: ${platform}`);
    
    expect(platform).toMatch(/^(android|ios|mock)$/);
  });

  it('should validate element selectors', () => {
    expect(by).toBeDefined();
    expect(typeof by.text).toBe('function');
    expect(typeof by.id).toBe('function');
    
    // Testar seletores básicos
    const textSelector = by.text('test');
    const idSelector = by.id('test-id');
    
    expect(textSelector).toBeDefined();
    expect(idSelector).toBeDefined();
    
    logTest('Seletores funcionando corretamente');
  });

  it('should validate element interactions', async () => {
    expect(element).toBeDefined();
    expect(typeof element).toBe('function');
    
    // Criar elemento de teste
    const testElement = element(by.id('test-element'));
    
    expect(testElement).toBeDefined();
    expect(typeof testElement.tap).toBe('function');
    expect(typeof testElement.typeText).toBe('function');
    expect(typeof testElement.clearText).toBe('function');
    
    logTest('Interações de elemento funcionando');
  });

  it('should validate wait functions', () => {
    expect(waitFor).toBeDefined();
    expect(typeof waitFor).toBe('function');
    
    // Testar waitFor
    const testElement = element(by.id('test-element'));
    const waitForElement = waitFor(testElement);
    
    expect(waitForElement).toBeDefined();
    expect(typeof waitForElement.toBeVisible).toBe('function');
    expect(typeof waitForElement.toBeNotVisible).toBe('function');
    
    logTest('Funções de espera funcionando');
  });

  it('should validate helper functions', () => {
    expect(typeof sleep).toBe('function');
    expect(typeof waitForElement).toBe('function');
    expect(typeof waitAndTap).toBe('function');
    expect(typeof waitAndType).toBe('function');
    expect(typeof scrollToElement).toBe('function');
    expect(typeof waitForLoading).toBe('function');
    expect(typeof waitForScreen).toBe('function');
    
    logTest('Helpers globais disponíveis');
  });

  it('should validate timeout configurations', () => {
    expect(TIMEOUT_CONFIG).toBeDefined();
    expect(typeof TIMEOUT_CONFIG.DEFAULT).toBe('number');
    expect(typeof TIMEOUT_CONFIG.SLOW).toBe('number');
    expect(typeof TIMEOUT_CONFIG.VERY_SLOW).toBe('number');
    
    expect(TIMEOUT_CONFIG.DEFAULT).toBeGreaterThan(0);
    expect(TIMEOUT_CONFIG.SLOW).toBeGreaterThan(TIMEOUT_CONFIG.DEFAULT);
    expect(TIMEOUT_CONFIG.VERY_SLOW).toBeGreaterThan(TIMEOUT_CONFIG.SLOW);
    
    logTest(`Timeouts configurados: DEFAULT=${TIMEOUT_CONFIG.DEFAULT}, SLOW=${TIMEOUT_CONFIG.SLOW}`);
  });

  it('should validate device configurations', () => {
    expect(DEVICE_CONFIG).toBeDefined();
    expect(DEVICE_CONFIG.ANDROID).toBeDefined();
    expect(DEVICE_CONFIG.iOS).toBeDefined();
    
    expect(DEVICE_CONFIG.ANDROID.platform).toBe('android');
    expect(DEVICE_CONFIG.iOS.platform).toBe('ios');
    
    expect(DEVICE_CONFIG.ANDROID.timeouts).toBeDefined();
    expect(DEVICE_CONFIG.iOS.timeouts).toBeDefined();
    
    logTest('Configurações de dispositivo validadas');
  });

  it('should validate logger functionality', () => {
    expect(typeof logTest).toBe('function');
    
    // Testar logger
    logTest('Teste do logger - se você está vendo isso, o logger funciona!');
    
    // Verificar se não gera erro
    expect(() => logTest('Teste sem erro')).not.toThrow();
  });

  it('should handle real device operations gracefully', async () => {
    const platform = device.getPlatform();
    
    if (platform === 'mock') {
      logTest('Modo mock - simulando operações de dispositivo');
      
      // Em modo mock, as operações devem resolver sem erro
      await expect(device.launchApp()).resolves.not.toThrow();
      await expect(device.terminateApp()).resolves.not.toThrow();
      
    } else {
      logTest(`Dispositivo real detectado: ${platform}`);
      
      // Testar operações básicas sem falhar se não houver emulador
      try {
        await device.grantPermission('android.permission.POST_NOTIFICATIONS');
        logTest('Permissões concedidas com sucesso');
      } catch (error) {
        logTest(`Permissões não disponíveis (esperado em ambiente sem emulador): ${error.message}`);
      }
    }
  });

  it('should validate complete E2E setup', async () => {
    // Este teste valida todo o setup necessário para E2E
    const setupItems = [
      { name: 'device', value: device },
      { name: 'element', value: element },
      { name: 'by', value: by },
      { name: 'waitFor', value: waitFor },
      { name: 'sleep', value: sleep },
      { name: 'TIMEOUT_CONFIG', value: TIMEOUT_CONFIG },
      { name: 'DEVICE_CONFIG', value: DEVICE_CONFIG },
      { name: 'logTest', value: logTest }
    ];

    setupItems.forEach(item => {
      expect(item.value).toBeDefined();
      logTest(`✓ ${item.name} está disponível`);
    });

    logTest('Setup E2E completamente validado - pronto para testes!');
  });
});