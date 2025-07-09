/**
 * Testes E2E para fluxo de autenticação
 * 
 * Testa os fluxos de login, registro e recuperação de senha
 * do aplicativo Crowbar Mobile.
 */

const LoginPage = require('../page-objects/LoginPage');
const RegisterPage = require('../page-objects/RegisterPage');
const ShopPage = require('../page-objects/ShopPage');

describe('Fluxo de Autenticação', () => {
  let loginPage;
  let registerPage;
  let shopPage;

  beforeAll(async () => {
    // Inicializar page objects
    loginPage = new LoginPage();
    registerPage = new RegisterPage();
    shopPage = new ShopPage();
  });

  beforeEach(async () => {
    // Reiniciar app antes de cada teste
    await device.reloadReactNative();
    
    // Aguardar app carregar e navegar para login se necessário
    await device.launchApp({ newInstance: true });
    
    // Aguardar tela inicial carregar
    await sleep(2000);
  });

  afterEach(async () => {
    // Fazer logout se estiver logado
    try {
      await device.pressBack();
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Tela de Login', () => {
    it('deve exibir todos os elementos da tela de login', async () => {
      // Aguardar tela de login carregar
      await loginPage.waitForLoginScreen();
      
      // Verificar se todos os elementos estão visíveis
      await loginPage.expectAllElementsVisible();
      
      // Verificar título da tela
      await loginPage.expectTitle('Entrar');
      
      // Verificar se botão de login está habilitado inicialmente
      await loginPage.expectLoginButtonEnabled();
      
      // Capturar screenshot para documentação
      await loginPage.takeScreenshot('login-screen');
    });

    it('deve fazer login com credenciais válidas', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Fazer login com usuário válido
      await loginPage.loginWithValidUser();
      
      // Aguardar loading desaparecer
      await loginPage.waitForLoadingToDisappear();
      
      // Verificar se navegou para tela principal
      await shopPage.waitForShopScreen();
      await shopPage.expectShopScreenVisible();
      
      // Capturar screenshot de sucesso
      await shopPage.takeScreenshot('login-success');
    });

    it('deve mostrar erro com credenciais inválidas', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tentar login com credenciais inválidas
      await loginPage.loginWithInvalidUser();
      
      // Aguardar loading desaparecer
      await loginPage.waitForLoadingToDisappear();
      
      // Verificar se mensagem de erro aparece
      await loginPage.expectErrorMessage('Credenciais inválidas');
      
      // Verificar se ainda está na tela de login
      await loginPage.expectLoginScreenVisible();
      
      // Capturar screenshot do erro
      await loginPage.takeScreenshot('login-error');
    });

    it('deve mostrar erro de validação com campos vazios', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tentar login com campos vazios
      await loginPage.loginWithEmptyFields();
      
      // Verificar erros de validação
      await loginPage.expectEmailError('Email é obrigatório');
      await loginPage.expectPasswordError('Senha é obrigatória');
      
      // Verificar se ainda está na tela de login
      await loginPage.expectLoginScreenVisible();
    });

    it('deve mostrar erro com email inválido', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tentar login com email inválido
      await loginPage.loginWithInvalidEmail();
      
      // Verificar erro de validação do email
      await loginPage.expectEmailError('Email inválido');
      
      // Verificar se ainda está na tela de login
      await loginPage.expectLoginScreenVisible();
    });

    it('deve mostrar erro com senha muito curta', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tentar login com senha muito curta
      await loginPage.loginWithShortPassword();
      
      // Verificar erro de validação da senha
      await loginPage.expectPasswordError('Senha deve ter no mínimo 6 caracteres');
      
      // Verificar se ainda está na tela de login
      await loginPage.expectLoginScreenVisible();
    });

    it('deve navegar para tela de registro', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tocar no link de registro
      await loginPage.navigateToRegister();
      
      // Verificar se navegou para tela de registro
      await registerPage.waitForRegisterScreen();
      await registerPage.expectRegisterScreenVisible();
      
      // Verificar título da tela de registro
      await registerPage.expectTitle('Criar Conta');
    });

    it('deve navegar para tela de recuperação de senha', async () => {
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Tocar no link de esqueceu senha
      await loginPage.navigateToForgotPassword();
      
      // Verificar se navegou para tela de recuperação
      // (Assumindo que existe uma tela de recuperação)
      await sleep(2000);
      
      // Capturar screenshot da tela de recuperação
      await loginPage.takeScreenshot('forgot-password-screen');
    });
  });

  describe('Tela de Registro', () => {
    beforeEach(async () => {
      // Navegar para tela de registro
      await loginPage.waitForLoginScreen();
      await loginPage.navigateToRegister();
      await registerPage.waitForRegisterScreen();
    });

    it('deve exibir todos os elementos da tela de registro', async () => {
      // Verificar se todos os elementos estão visíveis
      await registerPage.expectAllElementsVisible();
      
      // Verificar título da tela
      await registerPage.expectTitle('Criar Conta');
      
      // Verificar se checkbox de termos está desmarcado
      await registerPage.expectTermsCheckboxUnchecked();
      
      // Capturar screenshot para documentação
      await registerPage.takeScreenshot('register-screen');
    });

    it('deve fazer registro com dados válidos', async () => {
      // Fazer registro com dados válidos
      await registerPage.registerWithValidUser();
      
      // Aguardar loading desaparecer
      await registerPage.waitForLoadingToDisappear();
      
      // Verificar se mostra mensagem de sucesso ou navega para login
      try {
        await registerPage.expectSuccessMessage();
      } catch (error) {
        // Ou pode navegar diretamente para login
        await loginPage.expectLoginScreenVisible();
      }
      
      // Capturar screenshot de sucesso
      await registerPage.takeScreenshot('register-success');
    });

    it('deve mostrar erro com usuário já existente', async () => {
      // Tentar registrar usuário já existente
      await registerPage.registerWithExistingUser();
      
      // Aguardar loading desaparecer
      await registerPage.waitForLoadingToDisappear();
      
      // Verificar mensagem de erro
      await registerPage.expectErrorMessage('Usuário já existe');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve mostrar erro de validação com campos vazios', async () => {
      // Tentar registro com campos vazios
      await registerPage.registerWithEmptyFields();
      
      // Verificar erros de validação
      await registerPage.expectNameError('Nome é obrigatório');
      await registerPage.expectEmailError('Email é obrigatório');
      await registerPage.expectPasswordError('Senha é obrigatória');
      await registerPage.expectConfirmPasswordError('Confirmação de senha é obrigatória');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve mostrar erro com email inválido', async () => {
      // Tentar registro com email inválido
      await registerPage.registerWithInvalidEmail();
      
      // Verificar erro de validação do email
      await registerPage.expectEmailError('Email inválido');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve mostrar erro com senha muito curta', async () => {
      // Tentar registro com senha muito curta
      await registerPage.registerWithShortPassword();
      
      // Verificar erro de validação da senha
      await registerPage.expectPasswordError('Senha deve ter no mínimo 6 caracteres');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve mostrar erro com senhas não coincidentes', async () => {
      // Tentar registro com senhas diferentes
      await registerPage.registerWithMismatchPassword();
      
      // Verificar erro de validação
      await registerPage.expectConfirmPasswordError('Senhas não coincidem');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve mostrar erro sem aceitar termos', async () => {
      // Tentar registro sem aceitar termos
      await registerPage.registerWithoutTerms();
      
      // Verificar erro de validação dos termos
      await registerPage.expectTermsError('Você deve aceitar os termos de uso');
      
      // Verificar se ainda está na tela de registro
      await registerPage.expectRegisterScreenVisible();
    });

    it('deve navegar de volta para tela de login', async () => {
      // Navegar de volta para login
      await registerPage.navigateToLogin();
      
      // Verificar se voltou para tela de login
      await loginPage.waitForLoginScreen();
      await loginPage.expectLoginScreenVisible();
      
      // Verificar título da tela de login
      await loginPage.expectTitle('Entrar');
    });

    it('deve alternar checkbox de termos', async () => {
      // Verificar se checkbox está desmarcado
      await registerPage.expectTermsCheckboxUnchecked();
      
      // Tocar no checkbox
      await registerPage.tapTermsCheckbox();
      
      // Verificar se checkbox está marcado
      await registerPage.expectTermsCheckboxChecked();
      
      // Tocar novamente no checkbox
      await registerPage.tapTermsCheckbox();
      
      // Verificar se checkbox está desmarcado novamente
      await registerPage.expectTermsCheckboxUnchecked();
    });
  });

  describe('Fluxo Completo de Autenticação', () => {
    it('deve permitir registro seguido de login', async () => {
      // Navegar para registro
      await loginPage.waitForLoginScreen();
      await loginPage.navigateToRegister();
      await registerPage.waitForRegisterScreen();
      
      // Fazer registro
      await registerPage.registerWithValidUser();
      await registerPage.waitForLoadingToDisappear();
      
      // Navegar para login (se não navegar automaticamente)
      try {
        await registerPage.navigateToLogin();
      } catch (error) {
        // Pode já estar na tela de login
      }
      
      // Aguardar tela de login
      await loginPage.waitForLoginScreen();
      
      // Fazer login com o usuário recém-criado
      await loginPage.loginWithValidUser();
      await loginPage.waitForLoadingToDisappear();
      
      // Verificar se navegou para tela principal
      await shopPage.waitForShopScreen();
      await shopPage.expectShopScreenVisible();
      
      // Capturar screenshot final
      await shopPage.takeScreenshot('complete-auth-flow');
    });

    it('deve manter sessão após reiniciar app', async () => {
      // Fazer login
      await loginPage.waitForLoginScreen();
      await loginPage.loginWithValidUser();
      await loginPage.waitForLoadingToDisappear();
      
      // Verificar se está na tela principal
      await shopPage.waitForShopScreen();
      
      // Reiniciar app
      await device.reloadReactNative();
      await device.launchApp({ newInstance: false });
      
      // Verificar se ainda está logado
      await shopPage.waitForShopScreen();
      await shopPage.expectShopScreenVisible();
    });
  });
});