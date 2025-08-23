/**
 * BasePage - Classe base para todos os Page Objects
 * 
 * Contém métodos comuns que podem ser utilizados por todas as páginas
 * do aplicativo nos testes E2E.
 */

class BasePage {
  constructor() {
    this.timeout = {
      DEFAULT: 5000,
      SLOW: 10000,
      VERY_SLOW: 15000
    };
  }

  /**
   * Aguarda um elemento ficar visível
   * @param {string} testID - ID do elemento para teste
   * @param {number} timeout - Timeout em milissegundos
   */
  async waitForElement(testID, timeout = this.timeout.DEFAULT) {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Aguarda um elemento com texto específico ficar visível
   * @param {string} text - Texto do elemento
   * @param {number} timeout - Timeout em milissegundos
   */
  async waitForElementWithText(text, timeout = this.timeout.DEFAULT) {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Aguarda um elemento desaparecer
   * @param {string} testID - ID do elemento para teste
   * @param {number} timeout - Timeout em milissegundos
   */
  async waitForElementToDisappear(testID, timeout = this.timeout.DEFAULT) {
    await waitFor(element(by.id(testID)))
      .toBeNotVisible()
      .withTimeout(timeout);
  }

  /**
   * Toca em um elemento após aguardar ele aparecer
   * @param {string} testID - ID do elemento para teste
   * @param {number} timeout - Timeout em milissegundos
   */
  async tapElement(testID, _timeout = this.timeout.DEFAULT) {
    await this.waitForElement(testID, _timeout);
    await element(by.id(testID)).tap();
  }

  /**
   * Toca em um elemento com texto específico
   * @param {string} text - Texto do elemento
   * @param {number} timeout - Timeout em milissegundos
   */
  async tapElementWithText(text, _timeout = this.timeout.DEFAULT) {
    await this.waitForElementWithText(text, _timeout);
    await element(by.text(text)).tap();
  }

  /**
   * Digita texto em um campo após aguardar ele aparecer
   * @param {string} testID - ID do elemento para teste
   * @param {string} text - Texto a ser digitado
   * @param {number} timeout - Timeout em milissegundos
   */
  async typeText(testID, text, _timeout = this.timeout.DEFAULT) {
    await this.waitForElement(testID, _timeout);
    await element(by.id(testID)).clearText();
    await element(by.id(testID)).typeText(text);
  }

  /**
   * Verifica se um elemento está visível
   * @param {string} testID - ID do elemento para teste
   * @param {number} timeout - Timeout em milissegundos
   */
  async expectElementToBeVisible(testID, _timeout = this.timeout.DEFAULT) {
    await this.waitForElement(testID, _timeout);
    await expect(element(by.id(testID))).toBeVisible();
  }

  /**
   * Verifica se um elemento contém texto específico
   * @param {string} testID - ID do elemento para teste
   * @param {string} text - Texto esperado
   * @param {number} timeout - Timeout em milissegundos
   */
  async expectElementToHaveText(testID, text, _timeout = this.timeout.DEFAULT) {
    await this.waitForElement(testID, _timeout);
    await expect(element(by.id(testID))).toHaveText(text);
  }

  /**
   * Faz scroll em uma lista até encontrar um elemento
   * @param {string} scrollViewTestID - ID da lista/scroll view
   * @param {string} elementTestID - ID do elemento a ser encontrado
   * @param {string} 'vertical' - Direção do scroll ('down' ou 'up')
   * @param {number} offset - Offset do scroll (0.0 a 1.0)
   */
  async scrollToElement(scrollViewTestID, elementTestID, direction = 'down', offset = 0.5) {
    const scrollView = element(by.id(scrollViewTestID));
    
    try {
      await this.waitForElement(elementTestID, 2000);
      return; // Elemento já visível
    } catch (error) {
      // Elemento não visível, fazer scroll
    }

    for (let i = 0; i < 10; i++) {
      await scrollView.scroll(300, direction, offset);
      await sleep(500);
      
      try {
        await this.waitForElement(elementTestID, 1000);
        return; // Elemento encontrado
      } catch (error) {
        // Continuar scrolling
      }
    }
    
    throw new Error(`Elemento ${elementTestID} não encontrado após scroll`);
  }

  /**
   * Aguarda carregamento desaparecer
   * @param {number} timeout - Timeout em milissegundos
   */
  async waitForLoading(_timeout = this.timeout.SLOW) {
    try {
      await this.waitForElementToDisappear('loading-indicator', _timeout);
    } catch (error) {
      // Indicator de loading pode não estar presente
    }
  }

  /**
   * Aguarda tela específica carregar
   * @param {string} screenTestID - ID da tela
   * @param {number} timeout - Timeout em milissegundos
   */
  async waitForScreen(screenTestID, _timeout = this.timeout.SLOW) {
    await this.waitForElement(screenTestID, _timeout);
  }

  /**
   * Faz swipe em um elemento
   * @param {string} testID - ID do elemento
   * @param {string} direction - Direção do swipe ('left', 'right', 'up', 'down')
   * @param {string} speed - Velocidade do swipe ('fast', 'slow')
   */
  async swipeElement(testID, direction, speed = 'fast') {
    await this.waitForElement(testID);
    await element(by.id(testID)).swipe(direction, speed);
  }

  /**
   * Aguarda um tempo específico
   * @param {number} ms - Milissegundos para aguardar
   */
  async sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Captura screenshot com nome personalizado
   * @param {string} name - Nome do screenshot
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    
    try {
      await device.takeScreenshot(filename);

    } catch (error) {

    }
  }

  /**
   * Verifica se elemento existe na tela
   * @param {string} testID - ID do elemento
   * @returns {boolean} - True se elemento existe
   */
  async isElementVisible(testID) {
    try {
      await this.waitForElement(testID, 2000);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fecha teclado se estiver aberto
   */
  async dismissKeyboard() {
    if (device.getPlatform() === 'ios') {
      await element(by.id('dismiss-keyboard')).tap();
    } else {
      await device.pressBack();
    }
  }

  /**
   * Reinicia o aplicativo
   */
  async reloadApp() {
    await device.reloadReactNative();
  }

  /**
   * Navega para tela anterior
   */
  async goBack() {
    if (device.getPlatform() === 'ios') {
      await element(by.id('back-button')).tap();
    } else {
      await device.pressBack();
    }
  }
}

module.exports = BasePage;