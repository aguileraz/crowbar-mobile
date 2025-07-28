/* global browser, driver, $ */
/**
 * Utility functions for E2E tests
 */

export class TestUtils {
  /**
   * Wait for element to be displayed
   */
  static async waitForElement(
    selector: string,
    timeout: number = 10000,
    reverse: boolean = false
  ): Promise<WebdriverIO.Element> {
    const element = await $(selector)
    await element.waitForDisplayed({ timeout, reverse })
    return element
  }

  /**
   * Generate random email
   */
  static generateRandomEmail(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `test_${timestamp}_${random}@crowbar.com`
  }

  /**
   * Generate random phone number
   */
  static generateRandomPhone(): string {
    const prefix = '119'
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
    return prefix + random
  }

  /**
   * Take screenshot with custom name
   */
  static async takeScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filepath = `${process.env.SCREENSHOT_DIR || './screenshots'}/${name}-${timestamp}.png`
    await browser.saveScreenshot(filepath)
    console.log(`📸 Screenshot saved: ${filepath}`)
  }

  /**
   * Clear app data
   */
  static async clearAppData(): Promise<void> {
    await driver.execute('mobile: clearApp', {
      appPackage: 'com.crowbar.mobile'
    })
  }

  /**
   * Check if element exists
   */
  static async elementExists(selector: string): Promise<boolean> {
    try {
      const element = await $(selector)
      return await element.isExisting()
    } catch {
      return false
    }
  }

  /**
   * Get element text safely
   */
  static async getElementText(selector: string): Promise<string> {
    try {
      const element = await $(selector)
      if (await element.isExisting()) {
        return await element.getText()
      }
      return ''
    } catch {
      return ''
    }
  }

  /**
   * Wait and click element
   */
  static async waitAndClick(selector: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout)
    await element.click()
  }

  /**
   * Wait and set value
   */
  static async waitAndSetValue(selector: string, value: string, timeout: number = 10000): Promise<void> {
    const element = await this.waitForElement(selector, timeout)
    await element.setValue(value)
  }

  /**
   * Hide keyboard
   */
  static async hideKeyboard(): Promise<void> {
    try {
      await driver.hideKeyboard()
    } catch {
      // Keyboard might not be shown
    }
  }

  /**
   * Accept alert if present
   */
  static async acceptAlertIfPresent(): Promise<void> {
    try {
      await driver.acceptAlert()
    } catch {
      // No alert present
    }
  }

  /**
   * Restart app
   */
  static async restartApp(): Promise<void> {
    await driver.terminateApp('com.crowbar.mobile')
    await driver.pause(1000)
    await driver.activateApp('com.crowbar.mobile')
    await driver.pause(2000)
  }
}