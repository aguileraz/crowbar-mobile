/**
 * Authentication E2E Tests
 */

import { expect } from 'chai'
import { LoginPage } from '../pages/login.page'
import { HomePage } from '../pages/home.page'
import { TestUtils } from '../helpers/utils'

describe('Authentication Tests', () => {
  let loginPage: LoginPage
  let homePage: HomePage

  before(async () => {
    loginPage = new LoginPage()
    homePage = new HomePage()
  })

  beforeEach(async () => {
    // Clear app data and restart
    await TestUtils.clearAppData()
    await TestUtils.restartApp()
  })

  describe('Login Flow', () => {
    it('should display login page elements', async () => {
      expect(await loginPage.isLoaded()).to.be.true
      
      const emailInput = await $(loginPage.emailInput)
      expect(await emailInput.isDisplayed()).to.be.true
      
      const passwordInput = await $(loginPage.passwordInput)
      expect(await passwordInput.isDisplayed()).to.be.true
      
      const loginButton = await $(loginPage.loginButton)
      expect(await loginButton.isDisplayed()).to.be.true
    })

    it('should show error for invalid credentials', async () => {
      await loginPage.login('invalid@email.com', 'wrongpassword')
      await driver.pause(2000)
      
      const error = await loginPage.getLoginError()
      expect(error).to.include('Invalid email or password')
    })

    it('should login with valid credentials', async () => {
      const testEmail = 'test@crowbar.com'
      const testPassword = 'Test123!'
      
      await loginPage.login(testEmail, testPassword)
      await driver.pause(3000)
      
      // Should navigate to home page after successful login
      expect(await homePage.isLoaded()).to.be.true
    })

    it('should disable login button with empty fields', async () => {
      await loginPage.clearForm()
      expect(await loginPage.isLoginButtonEnabled()).to.be.false
    })

    it('should enable login button with filled fields', async () => {
      await TestUtils.waitAndSetValue(loginPage.emailInput, 'test@example.com')
      await TestUtils.waitAndSetValue(loginPage.passwordInput, 'password123')
      
      expect(await loginPage.isLoginButtonEnabled()).to.be.true
    })

    it('should navigate to sign up page', async () => {
      await loginPage.goToSignUp()
      await driver.pause(2000)
      
      // Verify navigation to sign up page
      const signUpTitle = await $('~signup-title')
      expect(await signUpTitle.isDisplayed()).to.be.true
    })

    it('should navigate to forgot password page', async () => {
      await loginPage.goToForgotPassword()
      await driver.pause(2000)
      
      // Verify navigation to forgot password page
      const forgotPasswordTitle = await $('~forgot-password-title')
      expect(await forgotPasswordTitle.isDisplayed()).to.be.true
    })
  })

  describe('Social Login', () => {
    it('should display social login options', async () => {
      const googleButton = await $(loginPage.googleLoginButton)
      expect(await googleButton.isDisplayed()).to.be.true
      
      const facebookButton = await $(loginPage.facebookLoginButton)
      expect(await facebookButton.isDisplayed()).to.be.true
    })

    // Note: Actual social login tests would require handling OAuth flows
    // which is complex in automated tests and often mocked
  })

  describe('Session Management', () => {
    it('should maintain session after app restart', async () => {
      // Login first
      await loginPage.login('test@crowbar.com', 'Test123!')
      await driver.pause(3000)
      expect(await homePage.isLoaded()).to.be.true
      
      // Restart app
      await TestUtils.restartApp()
      await driver.pause(3000)
      
      // Should still be logged in
      expect(await homePage.isLoaded()).to.be.true
    })

    it('should logout successfully', async () => {
      // Login first
      await loginPage.login('test@crowbar.com', 'Test123!')
      await driver.pause(3000)
      
      // Go to profile and logout
      await homePage.goToProfile()
      await driver.pause(2000)
      
      const logoutButton = await $('~logout-button')
      await logoutButton.click()
      
      // Confirm logout
      const confirmButton = await $('~confirm-logout')
      await confirmButton.click()
      await driver.pause(2000)
      
      // Should be back at login page
      expect(await loginPage.isLoaded()).to.be.true
    })
  })

  afterEach(async () => {
    // Take screenshot on failure
    if (this.currentTest?.state === 'failed') {
      await TestUtils.takeScreenshot(`failed-${this.currentTest.title}`)
    }
  })
})