/**
 * Teste básico do aplicativo
 * Valida funcionalidades básicas da aplicação
 */

describe('Crowbar Mobile App', () => {
  beforeAll(async () => {
    logTest('Iniciando teste do aplicativo principal');
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    logTest('Finalizando teste do aplicativo principal');
  });

  it('should have welcome screen', async () => {
    logTest('Testando tela de boas-vindas');
    
    // Aguardar a tela principal carregar
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUT_CONFIG.SLOW);
  });

  it('should show app title', async () => {
    logTest('Testando título do aplicativo');
    
    await waitFor(element(by.text('Crowbar')))
      .toBeVisible()
      .withTimeout(TIMEOUT_CONFIG.DEFAULT);
  });

  it('should navigate to login screen', async () => {
    logTest('Testando navegação para tela de login');
    
    // Procurar botão de login
    const loginButton = element(by.id('login-button'));
    await waitAndTap(loginButton);
    
    // Verificar se chegou na tela de login
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(TIMEOUT_CONFIG.DEFAULT);
  });
});