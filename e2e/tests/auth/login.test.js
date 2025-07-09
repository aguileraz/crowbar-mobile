/**
 * Testes E2E para fluxo de login
 * 
 * Testa todos os cenários relacionados ao login de usuários
 * incluindo casos de sucesso e falha.
 */

import { TEST_USERS, TEST_IDS, EXPECTED_TEXTS } from '../../helpers/testData';
import { login, logout, expectVisible, expectText } from '../../helpers/actions';

describe('Login Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true });
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  it('deve realizar login com credenciais válidas', async () => {
    logTest('Teste: Login com credenciais válidas');
    
    // Realizar login
    await login();
    
    // Verificar que está na tela inicial
    await expectVisible(TEST_IDS.NAV.HOME);
    await expectVisible(TEST_IDS.NAV.BOXES);
    await expectVisible(TEST_IDS.NAV.CART);
    await expectVisible(TEST_IDS.NAV.PROFILE);
    
    logTest('Login realizado com sucesso');
  });

  it('deve mostrar erro com credenciais inválidas', async () => {
    logTest('Teste: Login com credenciais inválidas');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tentar login com credenciais inválidas
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), 
      TEST_USERS.INVALID_USER.email
    );
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), 
      TEST_USERS.INVALID_USER.password
    );
    
    // Tentar fazer login
    await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
    
    // Verificar mensagem de erro
    await waitForElement(element(by.text(EXPECTED_TEXTS.LOGIN.errorInvalid)));
    
    logTest('Erro de credenciais inválidas exibido corretamente');
  });

  it('deve validar campos obrigatórios', async () => {
    logTest('Teste: Validação de campos obrigatórios');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tentar login sem preencher campos
    await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
    
    // Verificar mensagens de validação
    await waitForElement(element(by.text('E-mail é obrigatório')));
    
    // Preencher apenas email
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), 
      TEST_USERS.VALID_USER.email
    );
    await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
    
    // Verificar mensagem de senha obrigatória
    await waitForElement(element(by.text('Senha é obrigatória')));
    
    logTest('Validações de campos obrigatórios funcionando');
  });

  it('deve validar formato de email', async () => {
    logTest('Teste: Validação de formato de email');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tentar com email inválido
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), 'emailinvalido');
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), '123456');
    await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('E-mail inválido')));
    
    logTest('Validação de formato de email funcionando');
  });

  it('deve navegar para tela de esqueci senha', async () => {
    logTest('Teste: Navegação para esqueci senha');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tocar em esqueci senha
    await waitAndTap(element(by.id(TEST_IDS.AUTH.FORGOT_PASSWORD)));
    
    // Verificar que navegou para tela correta
    await waitForElement(element(by.text('Recuperar Senha')));
    await expectVisible('forgot-password-email-input');
    
    logTest('Navegação para esqueci senha funcionando');
  });

  it('deve navegar para tela de registro', async () => {
    logTest('Teste: Navegação para registro');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tocar em criar conta
    await waitAndTap(element(by.id(TEST_IDS.AUTH.CREATE_ACCOUNT)));
    
    // Verificar que navegou para tela de registro
    await waitForElement(element(by.text(EXPECTED_TEXTS.REGISTER.title)));
    await expectVisible(TEST_IDS.AUTH.NAME_INPUT);
    await expectVisible(TEST_IDS.AUTH.CPF_INPUT);
    
    logTest('Navegação para registro funcionando');
  });

  it('deve manter usuário logado após reiniciar app', async () => {
    logTest('Teste: Persistência de login');
    
    // Realizar login
    await login();
    
    // Verificar que está logado
    await expectVisible(TEST_IDS.NAV.HOME);
    
    // Reiniciar app sem limpar dados
    await device.terminateApp();
    await device.launchApp({ delete: false });
    
    // Verificar que continua logado
    await expectVisible(TEST_IDS.NAV.HOME);
    
    logTest('Persistência de login funcionando');
  });

  it('deve realizar logout corretamente', async () => {
    logTest('Teste: Logout');
    
    // Realizar login
    await login();
    
    // Realizar logout
    await logout();
    
    // Verificar que voltou para tela de login
    await expectVisible(TEST_IDS.AUTH.EMAIL_INPUT);
    await expectVisible(TEST_IDS.AUTH.PASSWORD_INPUT);
    
    logTest('Logout funcionando corretamente');
  });

  it('deve mostrar/ocultar senha ao tocar no ícone', async () => {
    logTest('Teste: Mostrar/ocultar senha');
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Digitar senha
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), 
      TEST_USERS.VALID_USER.password
    );
    
    // Verificar que senha está oculta (campo com secureTextEntry)
    const passwordField = element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT));
    await expect(passwordField).toHaveToggleValue(false); // Visibilidade desativada
    
    // Tocar no ícone de visibilidade
    await waitAndTap(element(by.id('auth-password-visibility-toggle')));
    
    // Verificar que senha está visível
    await expect(passwordField).toHaveToggleValue(true); // Visibilidade ativada
    
    // Tocar novamente para ocultar
    await waitAndTap(element(by.id('auth-password-visibility-toggle')));
    
    // Verificar que senha está oculta novamente
    await expect(passwordField).toHaveToggleValue(false);
    
    logTest('Toggle de visibilidade de senha funcionando');
  });

  it('deve lidar com timeout de rede', async () => {
    logTest('Teste: Timeout de rede');
    
    // Simular modo offline
    await device.setURLBlacklist(['.*']);
    
    // Aguardar tela de login
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    
    // Tentar login
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), 
      TEST_USERS.VALID_USER.email
    );
    await waitAndType(
      element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), 
      TEST_USERS.VALID_USER.password
    );
    await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
    
    // Verificar mensagem de erro de rede
    await waitForElement(
      element(by.text('Erro de conexão. Verifique sua internet.')),
      10000
    );
    
    // Restaurar conectividade
    await device.clearURLBlacklist();
    
    logTest('Tratamento de timeout de rede funcionando');
  });
});