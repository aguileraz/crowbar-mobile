/**
 * RegisterPage - Page Object para tela de registro
 * 
 * Contém todos os elementos e ações relacionadas à tela de registro
 * do aplicativo Crowbar Mobile.
 */

const BasePage = require('./BasePage');

class RegisterPage extends BasePage {
  constructor() {
    super();
    
    // Seletores dos elementos da tela de registro
    this.selectors = {
      // Campos de entrada
      nameInput: 'register-name-input',
      emailInput: 'register-email-input',
      passwordInput: 'register-password-input',
      confirmPasswordInput: 'register-confirm-password-input',
      
      // Botões
      registerButton: 'register-button',
      loginButton: 'login-button',
      backButton: 'back-button',
      
      // Links e navegação
      loginLink: 'login-link',
      termsLink: 'terms-link',
      privacyLink: 'privacy-link',
      
      // Elementos de estado
      loadingIndicator: 'register-loading',
      errorMessage: 'register-error-message',
      successMessage: 'register-success-message',
      
      // Tela
      registerScreen: 'register-screen',
      
      // Elementos do cabeçalho
      title: 'register-title',
      subtitle: 'register-subtitle',
      
      // Elementos de validação
      nameError: 'name-error',
      emailError: 'email-error',
      passwordError: 'password-error',
      confirmPasswordError: 'confirm-password-error',
      
      // Checkbox de termos
      termsCheckbox: 'terms-checkbox',
      termsError: 'terms-error',
      
      // Elementos de força da senha
      passwordStrength: 'password-strength',
      passwordRequirements: 'password-requirements'
    };
    
    // Dados de teste
    this.testData = {
      validUser: {
        name: 'Usuário Teste',
        email: 'novo@crowbar.com',
        password: 'Teste123!',
        confirmPassword: 'Teste123!'
      },
      existingUser: {
        name: 'Usuário Existente',
        email: 'teste@crowbar.com',
        password: 'Teste123!',
        confirmPassword: 'Teste123!'
      },
      invalidEmail: {
        name: 'Usuário Teste',
        email: 'email-invalido',
        password: 'Teste123!',
        confirmPassword: 'Teste123!'
      },
      shortPassword: {
        name: 'Usuário Teste',
        email: 'teste@crowbar.com',
        password: '123',
        confirmPassword: '123'
      },
      mismatchPassword: {
        name: 'Usuário Teste',
        email: 'teste@crowbar.com',
        password: 'Teste123!',
        confirmPassword: 'Teste456!'
      },
      emptyFields: {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    };
  }

  /**
   * Aguarda a tela de registro carregar completamente
   */
  async waitForRegisterScreen() {
    await this.waitForScreen(this.selectors.registerScreen);
    await this.waitForElement(this.selectors.title);
    await this.waitForElement(this.selectors.nameInput);
    await this.waitForElement(this.selectors.emailInput);
    await this.waitForElement(this.selectors.passwordInput);
    await this.waitForElement(this.selectors.confirmPasswordInput);
    await this.waitForElement(this.selectors.registerButton);
  }

  /**
   * Preenche o campo de nome
   * @param {string} name - Nome a ser inserido
   */
  async enterName(name) {
    await this.typeText(this.selectors.nameInput, name);
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
   * Preenche o campo de confirmação de senha
   * @param {string} confirmPassword - Confirmação de senha a ser inserida
   */
  async enterConfirmPassword(confirmPassword) {
    await this.typeText(this.selectors.confirmPasswordInput, confirmPassword);
  }

  /**
   * Toca no botão de registro
   */
  async tapRegisterButton() {
    await this.tapElement(this.selectors.registerButton);
  }

  /**
   * Toca no link de login
   */
  async tapLoginLink() {
    await this.tapElement(this.selectors.loginLink);
  }

  /**
   * Toca no botão de voltar
   */
  async tapBackButton() {
    await this.tapElement(this.selectors.backButton);
  }

  /**
   * Toca no checkbox de termos
   */
  async tapTermsCheckbox() {
    await this.tapElement(this.selectors.termsCheckbox);
  }

  /**
   * Toca no link de termos de uso
   */
  async tapTermsLink() {
    await this.tapElement(this.selectors.termsLink);
  }

  /**
   * Toca no link de política de privacidade
   */
  async tapPrivacyLink() {
    await this.tapElement(this.selectors.privacyLink);
  }

  /**
   * Executa o fluxo completo de registro
   * @param {string} name - Nome do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} confirmPassword - Confirmação da senha
   * @param {boolean} acceptTerms - Se deve aceitar os termos
   */
  async register(name, email, password, confirmPassword, acceptTerms = true) {
    await this.waitForRegisterScreen();
    await this.enterName(name);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterConfirmPassword(confirmPassword);
    
    if (acceptTerms) {
      await this.tapTermsCheckbox();
    }
    
    await this.tapRegisterButton();
  }

  /**
   * Faz registro com usuário válido
   */
  async registerWithValidUser() {
    await this.register(
      this.testData.validUser.name,
      this.testData.validUser.email,
      this.testData.validUser.password,
      this.testData.validUser.confirmPassword
    );
  }

  /**
   * Tenta registrar usuário já existente
   */
  async registerWithExistingUser() {
    await this.register(
      this.testData.existingUser.name,
      this.testData.existingUser.email,
      this.testData.existingUser.password,
      this.testData.existingUser.confirmPassword
    );
  }

  /**
   * Tenta registrar com email inválido
   */
  async registerWithInvalidEmail() {
    await this.register(
      this.testData.invalidEmail.name,
      this.testData.invalidEmail.email,
      this.testData.invalidEmail.password,
      this.testData.invalidEmail.confirmPassword
    );
  }

  /**
   * Tenta registrar com senha muito curta
   */
  async registerWithShortPassword() {
    await this.register(
      this.testData.shortPassword.name,
      this.testData.shortPassword.email,
      this.testData.shortPassword.password,
      this.testData.shortPassword.confirmPassword
    );
  }

  /**
   * Tenta registrar com senhas não coincidentes
   */
  async registerWithMismatchPassword() {
    await this.register(
      this.testData.mismatchPassword.name,
      this.testData.mismatchPassword.email,
      this.testData.mismatchPassword.password,
      this.testData.mismatchPassword.confirmPassword
    );
  }

  /**
   * Tenta registrar com campos vazios
   */
  async registerWithEmptyFields() {
    await this.register(
      this.testData.emptyFields.name,
      this.testData.emptyFields.email,
      this.testData.emptyFields.password,
      this.testData.emptyFields.confirmPassword
    );
  }

  /**
   * Tenta registrar sem aceitar termos
   */
  async registerWithoutTerms() {
    await this.register(
      this.testData.validUser.name,
      this.testData.validUser.email,
      this.testData.validUser.password,
      this.testData.validUser.confirmPassword,
      false
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
   * Verifica se há erro no campo de nome
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectNameError(expectedMessage) {
    await this.waitForElement(this.selectors.nameError);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.nameError, expectedMessage);
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
   * Verifica se há erro no campo de confirmação de senha
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectConfirmPasswordError(expectedMessage) {
    await this.waitForElement(this.selectors.confirmPasswordError);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.confirmPasswordError, expectedMessage);
    }
  }

  /**
   * Verifica se há erro nos termos
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectTermsError(expectedMessage) {
    await this.waitForElement(this.selectors.termsError);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.termsError, expectedMessage);
    }
  }

  /**
   * Verifica se mensagem de sucesso está visível
   */
  async expectSuccessMessage() {
    await this.waitForElement(this.selectors.successMessage);
  }

  /**
   * Verifica se o botão de registro está habilitado
   */
  async expectRegisterButtonEnabled() {
    await this.waitForElement(this.selectors.registerButton);
    await expect(element(by.id(this.selectors.registerButton))).toBeEnabled();
  }

  /**
   * Verifica se o botão de registro está desabilitado
   */
  async expectRegisterButtonDisabled() {
    await this.waitForElement(this.selectors.registerButton);
    await expect(element(by.id(this.selectors.registerButton))).toBeDisabled();
  }

  /**
   * Verifica se a tela de registro está visível
   */
  async expectRegisterScreenVisible() {
    await this.expectElementToBeVisible(this.selectors.registerScreen);
  }

  /**
   * Verifica se o título da tela está correto
   */
  async expectTitle(expectedTitle = 'Criar Conta') {
    await this.expectElementToHaveText(this.selectors.title, expectedTitle);
  }

  /**
   * Verifica se o checkbox de termos está marcado
   */
  async expectTermsCheckboxChecked() {
    await this.waitForElement(this.selectors.termsCheckbox);
    await expect(element(by.id(this.selectors.termsCheckbox))).toBeChecked();
  }

  /**
   * Verifica se o checkbox de termos não está marcado
   */
  async expectTermsCheckboxUnchecked() {
    await this.waitForElement(this.selectors.termsCheckbox);
    await expect(element(by.id(this.selectors.termsCheckbox))).toBeUnchecked();
  }

  /**
   * Verifica a força da senha
   * @param {string} expectedStrength - Força esperada ('fraca', 'média', 'forte')
   */
  async expectPasswordStrength(expectedStrength) {
    await this.waitForElement(this.selectors.passwordStrength);
    await this.expectElementToHaveText(this.selectors.passwordStrength, expectedStrength);
  }

  /**
   * Limpa todos os campos de entrada
   */
  async clearAllFields() {
    await element(by.id(this.selectors.nameInput)).clearText();
    await element(by.id(this.selectors.emailInput)).clearText();
    await element(by.id(this.selectors.passwordInput)).clearText();
    await element(by.id(this.selectors.confirmPasswordInput)).clearText();
  }

  /**
   * Navega para tela de login
   */
  async navigateToLogin() {
    await this.tapLoginLink();
  }

  /**
   * Navega para tela anterior
   */
  async navigateBack() {
    await this.tapBackButton();
  }

  /**
   * Verifica se todos os elementos da tela estão visíveis
   */
  async expectAllElementsVisible() {
    await this.expectElementToBeVisible(this.selectors.registerScreen);
    await this.expectElementToBeVisible(this.selectors.title);
    await this.expectElementToBeVisible(this.selectors.nameInput);
    await this.expectElementToBeVisible(this.selectors.emailInput);
    await this.expectElementToBeVisible(this.selectors.passwordInput);
    await this.expectElementToBeVisible(this.selectors.confirmPasswordInput);
    await this.expectElementToBeVisible(this.selectors.registerButton);
    await this.expectElementToBeVisible(this.selectors.loginLink);
    await this.expectElementToBeVisible(this.selectors.termsCheckbox);
  }
}

module.exports = RegisterPage;