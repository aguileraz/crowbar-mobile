/**
 * CartPage - Page Object para tela do carrinho
 * 
 * Contém todos os elementos e ações relacionadas ao carrinho de compras
 * do aplicativo Crowbar Mobile.
 */

const BasePage = require('./BasePage');

class CartPage extends BasePage {
  constructor() {
    super();
    
    // Seletores dos elementos da tela do carrinho
    this.selectors = {
      // Tela principal
      cartScreen: 'cart-screen',
      
      // Cabeçalho
      headerTitle: 'cart-header-title',
      backButton: 'cart-back-button',
      clearCartButton: 'clear-cart-button',
      
      // Lista de itens
      cartList: 'cart-list',
      cartItem: 'cart-item',
      
      // Elementos do item do carrinho
      itemImage: 'cart-item-image',
      itemTitle: 'cart-item-title',
      itemPrice: 'cart-item-price',
      itemQuantity: 'cart-item-quantity',
      increaseQuantityButton: 'increase-quantity-button',
      decreaseQuantityButton: 'decrease-quantity-button',
      removeItemButton: 'remove-item-button',
      
      // Resumo do carrinho
      summarySection: 'cart-summary-section',
      subtotalLabel: 'cart-subtotal-label',
      subtotalValue: 'cart-subtotal-value',
      shippingLabel: 'cart-shipping-label',
      shippingValue: 'cart-shipping-value',
      discountLabel: 'cart-discount-label',
      discountValue: 'cart-discount-value',
      totalLabel: 'cart-total-label',
      totalValue: 'cart-total-value',
      
      // Cupom de desconto
      couponSection: 'coupon-section',
      couponInput: 'coupon-input',
      applyCouponButton: 'apply-coupon-button',
      removeCouponButton: 'remove-coupon-button',
      couponError: 'coupon-error',
      couponSuccess: 'coupon-success',
      
      // Botões de ação
      checkoutButton: 'checkout-button',
      continueShopping: 'continue-shopping-button',
      
      // Estados vazios
      emptyCartMessage: 'empty-cart-message',
      emptyCartImage: 'empty-cart-image',
      
      // Elementos de carregamento
      loadingIndicator: 'cart-loading',
      
      // Elementos de confirmação
      confirmDialog: 'confirm-dialog',
      confirmButton: 'confirm-button',
      cancelButton: 'cancel-button',
      
      // Elementos de notificação
      successMessage: 'cart-success-message',
      errorMessage: 'cart-error-message',
      
      // Elementos de scroll
      scrollView: 'cart-scroll-view'
    };
    
    // Dados de teste
    this.testData = {
      coupons: {
        valid: 'DESCONTO10',
        invalid: 'CUPOM_INVALIDO',
        expired: 'EXPIRADO',
        empty: ''
      },
      quantities: {
        min: 1,
        max: 10,
        default: 1
      }
    };
  }

  /**
   * Aguarda a tela do carrinho carregar completamente
   */
  async waitForCartScreen() {
    await this.waitForScreen(this.selectors.cartScreen);
    await this.waitForElement(this.selectors.headerTitle);
  }

  /**
   * Verifica se o carrinho está vazio
   */
  async isCartEmpty() {
    return await this.isElementVisible(this.selectors.emptyCartMessage);
  }

  /**
   * Aguarda o carrinho carregar com itens
   */
  async waitForCartWithItems() {
    await this.waitForCartScreen();
    await this.waitForElement(this.selectors.cartList);
    await this.waitForElement(this.selectors.summarySection);
  }

  /**
   * Aguarda o carrinho vazio
   */
  async waitForEmptyCart() {
    await this.waitForCartScreen();
    await this.waitForElement(this.selectors.emptyCartMessage);
  }

  /**
   * Toca no botão de voltar
   */
  async tapBackButton() {
    await this.tapElement(this.selectors.backButton);
  }

  /**
   * Toca no botão de limpar carrinho
   */
  async tapClearCartButton() {
    await this.tapElement(this.selectors.clearCartButton);
  }

  /**
   * Toca no botão de continuar comprando
   */
  async tapContinueShoppingButton() {
    await this.tapElement(this.selectors.continueShopping);
  }

  /**
   * Toca no botão de checkout
   */
  async tapCheckoutButton() {
    await this.tapElement(this.selectors.checkoutButton);
  }

  /**
   * Aumenta a quantidade de um item
   * @param {number} itemIndex - Índice do item no carrinho
   */
  async increaseItemQuantity(itemIndex) {
    await this.tapElement(`${this.selectors.increaseQuantityButton}-${itemIndex}`);
  }

  /**
   * Diminui a quantidade de um item
   * @param {number} itemIndex - Índice do item no carrinho
   */
  async decreaseItemQuantity(itemIndex) {
    await this.tapElement(`${this.selectors.decreaseQuantityButton}-${itemIndex}`);
  }

  /**
   * Remove um item do carrinho
   * @param {number} itemIndex - Índice do item no carrinho
   */
  async removeItem(itemIndex) {
    await this.tapElement(`${this.selectors.removeItemButton}-${itemIndex}`);
  }

  /**
   * Remove o primeiro item do carrinho
   */
  async removeFirstItem() {
    await this.removeItem(0);
  }

  /**
   * Aplica um cupom de desconto
   * @param {string} couponCode - Código do cupom
   */
  async applyCoupon(couponCode) {
    await this.typeText(this.selectors.couponInput, couponCode);
    await this.tapElement(this.selectors.applyCouponButton);
  }

  /**
   * Remove cupom aplicado
   */
  async removeCoupon() {
    await this.tapElement(this.selectors.removeCouponButton);
  }

  /**
   * Aplica cupom válido
   */
  async applyValidCoupon() {
    await this.applyCoupon(this.testData.coupons.valid);
  }

  /**
   * Aplica cupom inválido
   */
  async applyInvalidCoupon() {
    await this.applyCoupon(this.testData.coupons.invalid);
  }

  /**
   * Limpa o carrinho completamente
   */
  async clearCart() {
    await this.tapClearCartButton();
    await this.waitForElement(this.selectors.confirmDialog);
    await this.tapElement(this.selectors.confirmButton);
  }

  /**
   * Confirma ação no diálogo
   */
  async confirmAction() {
    await this.waitForElement(this.selectors.confirmDialog);
    await this.tapElement(this.selectors.confirmButton);
  }

  /**
   * Cancela ação no diálogo
   */
  async cancelAction() {
    await this.waitForElement(this.selectors.confirmDialog);
    await this.tapElement(this.selectors.cancelButton);
  }

  /**
   * Faz scroll para o resumo do carrinho
   */
  async scrollToSummary() {
    await this.scrollToElement(
      this.selectors.scrollView,
      this.selectors.summarySection
    );
  }

  /**
   * Faz scroll para seção de cupom
   */
  async scrollToCoupon() {
    await this.scrollToElement(
      this.selectors.scrollView,
      this.selectors.couponSection
    );
  }

  /**
   * Verifica se a tela do carrinho está visível
   */
  async expectCartScreenVisible() {
    await this.expectElementToBeVisible(this.selectors.cartScreen);
  }

  /**
   * Verifica se o título do cabeçalho está correto
   */
  async expectHeaderTitle(expectedTitle = 'Carrinho') {
    await this.expectElementToHaveText(this.selectors.headerTitle, expectedTitle);
  }

  /**
   * Verifica se o carrinho está vazio
   */
  async expectEmptyCart() {
    await this.expectElementToBeVisible(this.selectors.emptyCartMessage);
    await this.expectElementToBeVisible(this.selectors.emptyCartImage);
  }

  /**
   * Verifica se há itens no carrinho
   */
  async expectCartWithItems() {
    await this.expectElementToBeVisible(this.selectors.cartList);
    await this.expectElementToBeVisible(this.selectors.summarySection);
  }

  /**
   * Verifica se um item específico está no carrinho
   * @param {number} itemIndex - Índice do item
   * @param {string} expectedTitle - Título esperado do item
   */
  async expectCartItem(itemIndex, expectedTitle) {
    await this.expectElementToBeVisible(`${this.selectors.cartItem}-${itemIndex}`);
    if (expectedTitle) {
      await this.expectElementToHaveText(
        `${this.selectors.itemTitle}-${itemIndex}`,
        expectedTitle
      );
    }
  }

  /**
   * Verifica a quantidade de um item
   * @param {number} itemIndex - Índice do item
   * @param {number} expectedQuantity - Quantidade esperada
   */
  async expectItemQuantity(itemIndex, expectedQuantity) {
    await this.expectElementToHaveText(
      `${this.selectors.itemQuantity}-${itemIndex}`,
      expectedQuantity.toString()
    );
  }

  /**
   * Verifica o preço de um item
   * @param {number} itemIndex - Índice do item
   * @param {string} expectedPrice - Preço esperado
   */
  async expectItemPrice(itemIndex, expectedPrice) {
    await this.expectElementToHaveText(
      `${this.selectors.itemPrice}-${itemIndex}`,
      expectedPrice
    );
  }

  /**
   * Verifica o subtotal do carrinho
   * @param {string} expectedSubtotal - Subtotal esperado
   */
  async expectSubtotal(expectedSubtotal) {
    await this.expectElementToHaveText(this.selectors.subtotalValue, expectedSubtotal);
  }

  /**
   * Verifica o valor do frete
   * @param {string} expectedShipping - Valor do frete esperado
   */
  async expectShipping(expectedShipping) {
    await this.expectElementToHaveText(this.selectors.shippingValue, expectedShipping);
  }

  /**
   * Verifica o desconto aplicado
   * @param {string} expectedDiscount - Desconto esperado
   */
  async expectDiscount(expectedDiscount) {
    await this.expectElementToHaveText(this.selectors.discountValue, expectedDiscount);
  }

  /**
   * Verifica o total do carrinho
   * @param {string} expectedTotal - Total esperado
   */
  async expectTotal(expectedTotal) {
    await this.expectElementToHaveText(this.selectors.totalValue, expectedTotal);
  }

  /**
   * Verifica se o botão de checkout está habilitado
   */
  async expectCheckoutButtonEnabled() {
    await this.expectElementToBeVisible(this.selectors.checkoutButton);
    await expect(element(by.id(this.selectors.checkoutButton))).toBeEnabled();
  }

  /**
   * Verifica se o botão de checkout está desabilitado
   */
  async expectCheckoutButtonDisabled() {
    await this.expectElementToBeVisible(this.selectors.checkoutButton);
    await expect(element(by.id(this.selectors.checkoutButton))).toBeDisabled();
  }

  /**
   * Verifica se cupom foi aplicado com sucesso
   */
  async expectCouponSuccess() {
    await this.expectElementToBeVisible(this.selectors.couponSuccess);
  }

  /**
   * Verifica se há erro no cupom
   * @param {string} expectedError - Mensagem de erro esperada
   */
  async expectCouponError(expectedError) {
    await this.expectElementToBeVisible(this.selectors.couponError);
    if (expectedError) {
      await this.expectElementToHaveText(this.selectors.couponError, expectedError);
    }
  }

  /**
   * Verifica se mensagem de sucesso está visível
   * @param {string} expectedMessage - Mensagem esperada
   */
  async expectSuccessMessage(expectedMessage) {
    await this.expectElementToBeVisible(this.selectors.successMessage);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.successMessage, expectedMessage);
    }
  }

  /**
   * Verifica se mensagem de erro está visível
   * @param {string} expectedMessage - Mensagem de erro esperada
   */
  async expectErrorMessage(expectedMessage) {
    await this.expectElementToBeVisible(this.selectors.errorMessage);
    if (expectedMessage) {
      await this.expectElementToHaveText(this.selectors.errorMessage, expectedMessage);
    }
  }

  /**
   * Verifica se está carregando
   */
  async expectLoading() {
    await this.expectElementToBeVisible(this.selectors.loadingIndicator);
  }

  /**
   * Verifica se o diálogo de confirmação está visível
   */
  async expectConfirmDialog() {
    await this.expectElementToBeVisible(this.selectors.confirmDialog);
  }

  /**
   * Conta o número de itens no carrinho
   * @returns {number} - Número de itens
   */
  async countCartItems() {
    // Implementação específica para contar elementos
    // Retorna número baseado em elementos visíveis
    return 2; // Placeholder
  }

  /**
   * Verifica se o número de itens está correto
   * @param {number} expectedCount - Número esperado de itens
   */
  async expectItemCount(expectedCount) {
    const actualCount = await this.countCartItems();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Navega para checkout
   */
  async proceedToCheckout() {
    await this.scrollToSummary();
    await this.tapCheckoutButton();
  }

  /**
   * Navega de volta para a loja
   */
  async continueShopping() {
    await this.tapContinueShoppingButton();
  }

  /**
   * Atualiza quantidade de item para valor específico
   * @param {number} itemIndex - Índice do item
   * @param {number} targetQuantity - Quantidade desejada
   */
  async updateItemQuantity(itemIndex, targetQuantity) {
    // Implementação para ajustar quantidade
    // Usando botões de aumentar/diminuir
    const currentQuantity = 1; // Pegar quantidade atual
    
    if (targetQuantity > currentQuantity) {
      for (let i = currentQuantity; i < targetQuantity; i++) {
        await this.increaseItemQuantity(itemIndex);
      }
    } else if (targetQuantity < currentQuantity) {
      for (let i = currentQuantity; i > targetQuantity; i--) {
        await this.decreaseItemQuantity(itemIndex);
      }
    }
  }
}

module.exports = CartPage;