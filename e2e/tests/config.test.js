 
/**
 * Teste de configuração E2E
 * Valida se as configurações do Detox estão corretas
 */

describe('E2E Configuration Test', () => {
  it('should have Detox globals available', () => {
    expect(typeof device).toBe('object');
    expect(typeof element).toBe('function');
    expect(typeof by).toBe('object');
    expect(typeof waitFor).toBe('function');
  });

  it('should have global helpers available', () => {
    expect(typeof sleep).toBe('function');
    expect(typeof waitForElement).toBe('function');
    expect(typeof waitAndTap).toBe('function');
    expect(typeof waitAndType).toBe('function');
  });

  it('should have timeout configuration', () => {
    expect(TIMEOUT_CONFIG).toBeDefined();
    expect(TIMEOUT_CONFIG.DEFAULT).toBe(5000);
    expect(TIMEOUT_CONFIG.SLOW).toBe(10000);
  });

  it('should have device configuration', () => {
    expect(DEVICE_CONFIG).toBeDefined();
    expect(DEVICE_CONFIG.ANDROID).toBeDefined();
    expect(DEVICE_CONFIG.iOS).toBeDefined();
  });

  it('should have logger available', () => {
    expect(typeof logTest).toBe('function');
    
    // Test logger function
    logTest('Configuration test completed successfully');
  });
});