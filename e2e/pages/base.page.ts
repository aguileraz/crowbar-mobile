/**
 * Base Page Object - All page objects should extend this class
 */

import { TestUtils } from '../helpers/utils'
import { Gestures } from '../helpers/gestures'

export class BasePage {
  /**
   * Common selectors
   */
  protected get loadingIndicator() {
    return '~loading-indicator'
  }

  protected get errorMessage() {
    return '~error-message'
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(timeout: number = 15000): Promise<void> {
    // Wait for loading indicator to disappear
    const loading = await $(this.loadingIndicator)
    if (await loading.isExisting()) {
      await loading.waitForDisplayed({ timeout, reverse: true })
    }
  }

  /**
   * Check if page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return true // Override in child classes
  }

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string> {
    return TestUtils.getElementText(this.errorMessage)
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(): Promise<void> {
    await Gestures.swipeUp(80)
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await Gestures.swipeDown(80)
  }

  /**
   * Pull to refresh
   */
  async pullToRefresh(): Promise<void> {
    await Gestures.swipeDown(30)
    await driver.pause(1000)
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(name: string): Promise<void> {
    await TestUtils.takeScreenshot(`${this.constructor.name}-${name}`)
  }

  /**
   * Handle common alerts
   */
  async handleAlerts(): Promise<void> {
    await TestUtils.acceptAlertIfPresent()
  }

  /**
   * Navigate back
   */
  async goBack(): Promise<void> {
    await driver.back()
  }

  /**
   * Hide keyboard if visible
   */
  async hideKeyboard(): Promise<void> {
    await TestUtils.hideKeyboard()
  }
}