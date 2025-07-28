/**
 * Gesture helpers for mobile testing
 */

export class Gestures {
  /**
   * Swipe from one point to another
   */
  static async swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration: number = 500
  ): Promise<void> {
    await driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerMove', duration, x: endX, y: endY },
        { type: 'pointerUp', button: 0 }
      ]
    }])
    await driver.releaseActions()
  }

  /**
   * Swipe up on element
   */
  static async swipeUp(percentage: number = 50): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    const startX = width / 2
    const startY = height * (percentage / 100)
    const endY = height * 0.1
    
    await this.swipe(startX, startY, startX, endY)
  }

  /**
   * Swipe down on element
   */
  static async swipeDown(percentage: number = 50): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    const startX = width / 2
    const startY = height * (1 - percentage / 100)
    const endY = height * 0.9
    
    await this.swipe(startX, startY, startX, endY)
  }

  /**
   * Swipe left on element
   */
  static async swipeLeft(percentage: number = 50): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    const startX = width * (percentage / 100)
    const startY = height / 2
    const endX = width * 0.1
    
    await this.swipe(startX, startY, endX, startY)
  }

  /**
   * Swipe right on element
   */
  static async swipeRight(percentage: number = 50): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    const startX = width * (1 - percentage / 100)
    const startY = height / 2
    const endX = width * 0.9
    
    await this.swipe(startX, startY, endX, startY)
  }

  /**
   * Tap on coordinates
   */
  static async tap(x: number, y: number): Promise<void> {
    await driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerUp', button: 0 }
      ]
    }])
    await driver.releaseActions()
  }

  /**
   * Long press on element
   */
  static async longPress(element: WebdriverIO.Element, duration: number = 1000): Promise<void> {
    const location = await element.getLocation()
    const size = await element.getSize()
    const centerX = location.x + size.width / 2
    const centerY = location.y + size.height / 2

    await driver.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: centerX, y: centerY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration },
        { type: 'pointerUp', button: 0 }
      ]
    }])
    await driver.releaseActions()
  }

  /**
   * Scroll to element
   */
  static async scrollToElement(
    selector: string,
    maxScrolls: number = 5,
    scrollPercentage: number = 70
  ): Promise<WebdriverIO.Element | null> {
    for (let i = 0; i < maxScrolls; i++) {
      const element = await $(selector)
      if (await element.isDisplayed()) {
        return element
      }
      await this.swipeUp(scrollPercentage)
      await driver.pause(500)
    }
    return null
  }
}