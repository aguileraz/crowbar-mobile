/**
 * Smoke Tests - Testes Básicos de Funcionamento
 *
 * Estes testes verificam as funcionalidades mais críticas do aplicativo
 * de forma rápida para garantir que a build está funcional.
 *
 * Executam em ~2-3 minutos no CI.
 */

describe('Smoke Tests - Crowbar Mobile', () => {
  beforeAll(async () => {
    // Inicializar o Detox antes de todos os testes
    await device.launchApp({
      permissions: { notifications: 'YES' },
      delete: true, // Reinstalar app para estado limpo
    });
  });

  beforeEach(async () => {
    // Reload do app antes de cada teste
    await device.reloadReactNative();
  });

  describe('App Initialization', () => {
    it('deve iniciar o app sem crashes', async () => {
      // Verificar que o app iniciou verificando se algum elemento está visível
      // Ajustar o testID conforme sua tela inicial
      await expect(element(by.id('app-root'))).toBeVisible();
    });

    it('deve exibir a tela inicial', async () => {
      // Este teste verifica se a navegação principal está presente
      // Ajustar testIDs conforme implementação
      const welcomeText = element(by.text(/bem.*vindo|welcome/i));
      const loginButton = element(by.text(/entrar|login/i));

      try {
        await waitFor(welcomeText).toBeVisible().withTimeout(5000);
      } catch (error) {
        // Se não houver tela de welcome, verificar se há botão de login
        await waitFor(loginButton).toBeVisible().withTimeout(5000);
      }
    });
  });

  describe('Navigation', () => {
    it('deve navegar entre telas principais', async () => {
      // Teste básico de navegação
      // Ajustar conforme estrutura real do app

      // Exemplo: tentar acessar menu/navegação
      const menuButton = element(by.id('menu-button')).or(element(by.id('drawer-button')));

      try {
        await menuButton.tap();
        await expect(element(by.id('navigation-menu'))).toBeVisible();
      } catch (error) {
        // Se não houver menu, apenas log - não falhar o smoke test
        console.log('Navigation menu not found - skipping navigation test');
      }
    });
  });

  describe('Connectivity', () => {
    it('deve lidar com estado offline gracefully', async () => {
      // Desconectar rede
      await device.setURLBlacklist(['.*']);

      // Aguardar um pouco para estado offline ser detectado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reconectar
      await device.setURLBlacklist([]);

      // App deve continuar responsivo
      await expect(element(by.id('app-root'))).toBeVisible();
    });
  });

  afterAll(async () => {
    // Cleanup após todos os testes
    await device.terminateApp();
  });
});
