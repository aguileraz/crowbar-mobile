 
/**
 * Smoke test para verificar configuração E2E
 */

describe('Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should launch app successfully', async () => {
    // Aguardar app carregar
    await waitFor(element(by.text('Crowbar')))
      .toBeVisible()
      .withTimeout(10000);
      
    // Verificar se chegou na tela inicial (login ou home)
    const loginButton = element(by.id('login-button'));
    const homeScreen = element(by.id('home-screen'));
    
    // App pode estar na tela de login ou home (se já logado)
    await expect(loginButton.atIndex(0).or(homeScreen)).toExist();
  });

  it('should show login screen for new users', async () => {
    // Limpar dados do app
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    
    // Verificar elementos da tela de login
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    // Procurar link de registro
    const registerLink = element(by.text('Criar conta'));
    await expect(registerLink).toBeVisible();
    
    // Navegar para registro
    await registerLink.tap();
    
    // Verificar tela de registro
    await expect(element(by.id('register-screen'))).toBeVisible();
    await expect(element(by.id('name-input'))).toBeVisible();
  });

  it('should handle device rotation', async () => {
    // Testar rotação apenas no iOS (Android tem issues com rotação no emulador)
    if (device.getPlatform() === 'ios') {
      await device.setOrientation('landscape');
      await expect(element(by.id('register-screen'))).toBeVisible();
      
      await device.setOrientation('portrait');
      await expect(element(by.id('register-screen'))).toBeVisible();
    }
  });

  it('should handle app backgrounding', async () => {
    // Enviar app para background
    await device.sendToHome();
    await device.launchApp();
    
    // Verificar que app retorna ao estado correto
    await expect(element(by.id('register-screen'))).toBeVisible();
  });
});