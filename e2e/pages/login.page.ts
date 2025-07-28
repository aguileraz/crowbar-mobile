/**
 * Login Page Object
 */

import { BasePage } from './base.page'
import { TestUtils } from '../helpers/utils'

export class LoginPage extends BasePage {
  /**
   * Selectors
   */
  get emailInput() {
    return '~email-input'
  }

  get passwordInput() {
    return '~password-input'
  }

  get loginButton() {
    return '~login-button'
  }

  get signUpLink() {
    return '~signup-link'
  }

  get forgotPasswordLink() {
    return '~forgot-password-link'
  }

  get googleLoginButton() {
    return '~google-login-button'
  }

  get facebookLoginButton() {
    return '~facebook-login-button'
  }

  get errorText() {
    return '~login-error-text'
  }

  /**
   * Check if login page is loaded
   */
  async isLoaded(): Promise<boolean> {
    await this.waitForPageLoad()
    return await TestUtils.elementExists(this.emailInput)
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await TestUtils.waitAndSetValue(this.emailInput, email)
    await TestUtils.waitAndSetValue(this.passwordInput, password)
    await this.hideKeyboard()
    await TestUtils.waitAndClick(this.loginButton)
  }

  /**
   * Navigate to sign up
   */
  async goToSignUp(): Promise<void> {
    await TestUtils.waitAndClick(this.signUpLink)
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword(): Promise<void> {
    await TestUtils.waitAndClick(this.forgotPasswordLink)
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<void> {
    await TestUtils.waitAndClick(this.googleLoginButton)
    // Handle Google OAuth flow
  }

  /**
   * Login with Facebook
   */
  async loginWithFacebook(): Promise<void> {
    await TestUtils.waitAndClick(this.facebookLoginButton)
    // Handle Facebook OAuth flow
  }

  /**
   * Get login error message
   */
  async getLoginError(): Promise<string> {
    return TestUtils.getElementText(this.errorText)
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    const button = await $(this.loginButton)
    return await button.isEnabled()
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    const emailField = await $(this.emailInput)
    const passwordField = await $(this.passwordInput)
    
    await emailField.clearValue()
    await passwordField.clearValue()
  }
}