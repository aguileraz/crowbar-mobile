/**
 * LoginPage - Page Object para tela de login
 * 
 * Contém todos os elementos e ações relacionadas à tela de login
 * do aplicativo Crowbar Mobile.
 */

const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor() {
    super();
    
    // Seletores dos elementos da tela de login
    this.selectors = {
      // Campos de entrada
      emailInput: 'login-email-input',
      passwordInput: 'login-password-input',
      
      // Botões
      loginButton: 'login-button',
      registerButton: 'register-button',
      forgotPasswordButton: 'forgot-password-button',
      
      // Links e navegação
      registerLink: 'register-link',
      forgotPasswordLink: 'forgot-password-link',
      
      // Elementos de estado
      loadingIndicator: 'login-loading',
      errorMessage: 'login-error-message',
      
      // Tela
      loginScreen: 'login-screen',
      
      // Elementos do cabeçalho
      title: 'login-title',
      subtitle: 'login-subtitle',
      
      // Elementos de validação
      emailError: 'email-error',
      passwordError: 'password-error',
      
      // Elementos de sucesso
      successMessage: 'login-success-message'
    };
    
    // Dados de teste
    this.testData = {
      validUser: {
        email: 'teste@crowbar.com',
        password: 'Teste123!'
      },
      invalidUser: {
        email: 'invalido@teste.com',
        password: 'senha123'
      },
      emptyFields: {
        email: '',
        password: ''
      },
      invalidEmail: {
        email: 'email-invalido',
        password: 'Teste123!'
      },
      shortPassword: {
        email: 'teste@crowbar.com',
        password: '123'
      }
    };
  }

  /**
   * Aguarda a tela de login carregar completamente
   */
  async waitForLoginScreen() {
    await this.waitForScreen(this.selectors.loginScreen);
    await this.waitForElement(this.selectors.title);
    await this.waitForElement(this.selectors.emailInput);
    await this.waitForElement(this.selectors.passwordInput);
    await this.waitForElement(this.selectors.loginButton);
  }

  /**
   * Preenche o campo de email
   * @param {string} email - Email a ser inserido
   */
  async enterEmail(email) {
    await this.typeText(this.selectors.emailInput, email);
  }

  /**
   * Preenche o campo de senha
   * @param {string} password - Senha a ser inserida
   */
  async enterPassword(password) {
    await this.typeText(this.selectors.passwordInput, password);
  }

  /**
   * Toca no botão de login
   */
  async tapLoginButton() {
    await this.tapElement(this.selectors.loginButton);
  }

  /**
   * Toca no link de registro
   */
  async tapRegisterLink() {
    await this.tapElement(this.selectors.registerLink);
  }

  /**
   * Toca no link de esqueceu a senha
   */
  async tapForgotPasswordLink() {
    await this.tapElement(this.selectors.forgotPasswordLink);
  }

  /**
   * Executa o fluxo completo de login
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   */
  async login(email, password) {
    await this.waitForLoginScreen();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLoginButton();
  }

  /**
   * Faz login com usuário válido
   */
  async loginWithValidUser() {
    await this.login(
      this.testData.validUser.email,
      this.testData.validUser.password
    );
  }

  /**
   * Faz login com usuário inválido
   */
  async loginWithInvalidUser() {
    await this.login(
      this.testData.invalidUser.email,
      this.testData.invalidUser.password
    );
  }

  /**
   * Tenta fazer login com campos vazios
   */
  async loginWithEmptyFields() {
    await this.login(
      this.testData.emptyFields.email,
      this.testData.emptyFields.password
    );
  }

  /**
   * Tenta fazer login com email inválido
   */
  async loginWithInvalidEmail() {
    await this.login(
      this.testData.invalidEmail.email,
      this.testData.invalidEmail.password
    );
  }

  /**
   * Tenta fazer login com senha muito curta
   */
  async loginWithShortPassword() {
    await this.login(
      this.testData.shortPassword.email,
      this.testData.shortPassword.password
    );
  }

  /**
   * Aguarda e verifica se o loading está visível
   */
  async waitForLoading() {
    await this.waitForElement(this.selectors.loadingIndicator);
  }

  /**
   * Aguarda o loading desaparecer
   */
  async waitForLoadingToDisappear() {
    await this.waitForElementToDisappear(this.selectors.loadingIndicator);
  }

  /**
   * Verifica se mensagem de erro está visível
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectErrorMessage(expectedMessage) {
    await this.waitForElement(this.selectors.errorMessage);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.errorMessage, expectedMessage);
    }
  }

  /**
   * Verifica se há erro no campo de email
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectEmailError(expectedMessage) {
    await this.waitForElement(this.selectors.emailError);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.emailError, expectedMessage);
    }
  }

  /**
   * Verifica se há erro no campo de senha
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectPasswordError(expectedMessage) {
    await this.waitForElement(this.selectors.passwordError);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.passwordError, expectedMessage);
    }
  }

  /**
   * Verifica se mensagem de sucesso está visível
   */
  async expectSuccessMessage() {
    await this.waitForElement(this.selectors.successMessage);
  }

  /**
   * Verifica se o botão de login está habilitado
   */
  async expectLoginButtonEnabled() {
    await this.waitForElement(this.selectors.loginButton);
    await expect(element(by.id(this.selectors.loginButton))).toBeEnabled();
  }

  /**
   * Verifica se o botão de login está desabilitado
   */
  async expectLoginButtonDisabled() {
    await this.waitForElement(this.selectors.loginButton);
    await expect(element(by.id(this.selectors.loginButton))).toBeDisabled();
  }

  /**
   * Verifica se a tela de login está visível
   */
  async expectLoginScreenVisible() {
    await this.expectElementToBeVisible(this.selectors.loginScreen);
  }

  /**
   * Verifica se o título da tela está correto
   */
  async expectTitle(expectedTitle = 'Entrar') {
    await this.expectElementToHaveText(this.selectors.title, expectedTitle);
  }

  /**
   * Verifica se o subtítulo da tela está correto
   */
  async expectSubtitle(expectedSubtitle) {
    if (expectedSubtitle) {
      await this.expectElementToHaveText(this.selectors.subtitle, expectedSubtitle);
    }
  }

  /**
   * Limpa os campos de entrada
   */
  async clearFields() {
    await element(by.id(this.selectors.emailInput)).clearText();
    await element(by.id(this.selectors.passwordInput)).clearText();
  }

  /**
   * Verifica se campos estão vazios
   */
  async expectEmptyFields() {
    await this.expectElementToHaveText(this.selectors.emailInput, '');
    await this.expectElementToHaveText(this.selectors.passwordInput, '');
  }

  /**
   * Verifica se o foco está no campo de email
   */
  async expectEmailFieldFocused() {
    await expect(element(by.id(this.selectors.emailInput))).toBeFocused();
  }

  /**
   * Verifica se o foco está no campo de senha
   */
  async expectPasswordFieldFocused() {
    await expect(element(by.id(this.selectors.passwordInput))).toBeFocused();
  }

  /**
   * Navega para tela de registro
   */
  async navigateToRegister() {
    await this.tapRegisterLink();
  }

  /**
   * Navega para tela de recuperação de senha
   */
  async navigateToForgotPassword() {
    await this.tapForgotPasswordLink();
  }

  /**
   * Verifica se todos os elementos da tela estão visíveis
   */
  async expectAllElementsVisible() {
    await this.expectElementToBeVisible(this.selectors.loginScreen);
    await this.expectElementToBeVisible(this.selectors.title);
    await this.expectElementToBeVisible(this.selectors.emailInput);
    await this.expectElementToBeVisible(this.selectors.passwordInput);
    await this.expectElementToBeVisible(this.selectors.loginButton);
    await this.expectElementToBeVisible(this.selectors.registerLink);
    await this.expectElementToBeVisible(this.selectors.forgotPasswordLink);
  }
}

module.exports = LoginPage;