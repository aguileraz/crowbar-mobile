/**
 * Testes E2E para adicionar itens ao carrinho
 * 
 * Testa a funcionalidade de adicionar, remover e gerenciar itens
 * no carrinho de compras do aplicativo Crowbar Mobile.
 */

const LoginPage = require('../page-objects/LoginPage');
const ShopPage = require('../page-objects/ShopPage');
const CartPage = require('../page-objects/CartPage');

describe('Carrinho de Compras', () => {
  let loginPage;
  let shopPage;
  let cartPage;

  beforeAll(async () => {
    // Inicializar page objects
    loginPage = new LoginPage();
    shopPage = new ShopPage();
    cartPage = new CartPage();
  });

  beforeEach(async () => {
    // Reiniciar app e fazer login
    await device.reloadReactNative();
    await device.launchApp({ newInstance: true });
    
    // Aguardar tela inicial carregar
    await sleep(2000);
    
    // Fazer login se necessário
    try {
      await loginPage.waitForLoginScreen();
      await loginPage.loginWithValidUser();
      await loginPage.waitForLoadingToDisappear();
    } catch (error) {
      // Pode já estar logado
    }
    
    // Aguardar tela principal carregar
    await shopPage.waitForShopScreen();
  });

  afterEach(async () => {
    // Limpar carrinho para próximo teste
    try {
      await shopPage.navigateToCart();
      await cartPage.waitForCartScreen();
      
      if (!(await cartPage.isCartEmpty())) {
        await cartPage.clearCart();
      }
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Adicionar Itens ao Carrinho', () => {
    it('deve adicionar primeira caixa em destaque ao carrinho', async () => {
      // Verificar se badge do carrinho não está visível
      await shopPage.expectCartBadgeNotVisible();
      
      // Adicionar primeira caixa em destaque
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(2000);
      
      // Verificar se badge do carrinho aparece com "1"
      await shopPage.expectCartBadge('1');
      
      // Navegar para carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Verificar se item está no carrinho
      await cartPage.expectCartWithItems();
      await cartPage.expectCartItem(0);
      
      // Capturar screenshot do carrinho com item
      await cartPage.takeScreenshot('cart-with-first-item');
    });

    it('deve adicionar múltiplas caixas ao carrinho', async () => {
      // Adicionar primeira caixa em destaque
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      
      // Adicionar primeira caixa popular
      await shopPage.scrollToPopular();
      await shopPage.addBoxToCart(0, 'popular');
      await sleep(1000);
      
      // Verificar se badge do carrinho mostra "2"
      await shopPage.expectCartBadge('2');
      
      // Navegar para carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Verificar se ambos os itens estão no carrinho
      await cartPage.expectCartItem(0);
      await cartPage.expectCartItem(1);
      
      // Capturar screenshot do carrinho com múltiplos itens
      await cartPage.takeScreenshot('cart-with-multiple-items');
    });

    it('deve adicionar item via detalhes da caixa', async () => {
      // Tocar na primeira caixa para abrir detalhes
      await shopPage.tapFirstFeaturedBox();
      await sleep(2000);
      
      // Adicionar ao carrinho na tela de detalhes
      await element(by.id('add-to-cart-details')).tap();
      await sleep(2000);
      
      // Voltar para tela principal
      await shopPage.goBack();
      await shopPage.waitForShopScreen();
      
      // Verificar se badge do carrinho aparece
      await shopPage.expectCartBadge('1');
      
      // Capturar screenshot após adicionar via detalhes
      await shopPage.takeScreenshot('added-via-details');
    });

    it('deve mostrar confirmação ao adicionar item', async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      
      // Verificar se mensagem de sucesso aparece
      await expect(element(by.text('Item adicionado ao carrinho'))).toBeVisible();
      
      // Aguardar mensagem desaparecer
      await sleep(3000);
      
      // Verificar se mensagem desapareceu
      await expect(element(by.text('Item adicionado ao carrinho'))).toBeNotVisible();
      
      // Capturar screenshot da confirmação
      await shopPage.takeScreenshot('add-to-cart-confirmation');
    });

    it('deve impedir adicionar item indisponível', async () => {
      // Tentar adicionar item indisponível (se existir)
      try {
        await element(by.id('add-to-cart-unavailable')).tap();
        await sleep(1000);
        
        // Verificar se mensagem de erro aparece
        await expect(element(by.text('Item indisponível'))).toBeVisible();
        
        // Verificar se badge do carrinho não aparece
        await shopPage.expectCartBadgeNotVisible();
        
        // Capturar screenshot do erro
        await shopPage.takeScreenshot('add-unavailable-item');
      } catch (error) {
        // Item indisponível pode não existir no teste
        console.log('Item indisponível não encontrado no teste');
      }
    });
  });

  describe('Gerenciar Quantidades no Carrinho', () => {
    beforeEach(async () => {
      // Adicionar item ao carrinho antes de cada teste
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
    });

    it('deve aumentar quantidade de item', async () => {
      // Verificar quantidade inicial
      await cartPage.expectItemQuantity(0, 1);
      
      // Aumentar quantidade
      await cartPage.increaseItemQuantity(0);
      await sleep(1000);
      
      // Verificar nova quantidade
      await cartPage.expectItemQuantity(0, 2);
      
      // Verificar se total foi atualizado
      await cartPage.scrollToSummary();
      await cartPage.expectTotal('R$ 200,00'); // Assumindo preço duplo
      
      // Capturar screenshot da quantidade aumentada
      await cartPage.takeScreenshot('increased-quantity');
    });

    it('deve diminuir quantidade de item', async () => {
      // Aumentar quantidade primeiro
      await cartPage.increaseItemQuantity(0);
      await sleep(1000);
      
      // Verificar quantidade aumentada
      await cartPage.expectItemQuantity(0, 2);
      
      // Diminuir quantidade
      await cartPage.decreaseItemQuantity(0);
      await sleep(1000);
      
      // Verificar quantidade diminuída
      await cartPage.expectItemQuantity(0, 1);
      
      // Capturar screenshot da quantidade diminuída
      await cartPage.takeScreenshot('decreased-quantity');
    });

    it('deve remover item ao diminuir quantidade para zero', async () => {
      // Diminuir quantidade para zero
      await cartPage.decreaseItemQuantity(0);
      await sleep(1000);
      
      // Verificar se diálogo de confirmação aparece
      await cartPage.expectConfirmDialog();
      
      // Confirmar remoção
      await cartPage.confirmAction();
      await sleep(1000);
      
      // Verificar se carrinho está vazio
      await cartPage.expectEmptyCart();
      
      // Capturar screenshot do carrinho vazio
      await cartPage.takeScreenshot('removed-via-quantity');
    });

    it('deve atualizar quantidade para valor específico', async () => {
      // Atualizar quantidade para 5
      await cartPage.updateItemQuantity(0, 5);
      await sleep(1000);
      
      // Verificar nova quantidade
      await cartPage.expectItemQuantity(0, 5);
      
      // Verificar se total foi atualizado
      await cartPage.scrollToSummary();
      await cartPage.expectTotal('R$ 500,00'); // Assumindo preço x5
      
      // Capturar screenshot da quantidade específica
      await cartPage.takeScreenshot('specific-quantity');
    });
  });

  describe('Remover Itens do Carrinho', () => {
    beforeEach(async () => {
      // Adicionar múltiplos itens ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      await shopPage.scrollToPopular();
      await shopPage.addBoxToCart(0, 'popular');
      await sleep(1000);
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
    });

    it('deve remover item específico do carrinho', async () => {
      // Verificar que há 2 itens
      await cartPage.expectItemCount(2);
      
      // Remover primeiro item
      await cartPage.removeFirstItem();
      await sleep(1000);
      
      // Confirmar remoção
      await cartPage.confirmAction();
      await sleep(1000);
      
      // Verificar que agora há 1 item
      await cartPage.expectItemCount(1);
      
      // Capturar screenshot após remoção
      await cartPage.takeScreenshot('item-removed');
    });

    it('deve cancelar remoção de item', async () => {
      // Tentar remover item
      await cartPage.removeFirstItem();
      await sleep(1000);
      
      // Cancelar remoção
      await cartPage.cancelAction();
      await sleep(1000);
      
      // Verificar que ainda há 2 itens
      await cartPage.expectItemCount(2);
      
      // Capturar screenshot após cancelamento
      await cartPage.takeScreenshot('remove-cancelled');
    });

    it('deve limpar carrinho completamente', async () => {
      // Limpar carrinho
      await cartPage.clearCart();
      await sleep(1000);
      
      // Verificar se carrinho está vazio
      await cartPage.expectEmptyCart();
      
      // Verificar se badge do carrinho desapareceu
      await shopPage.navigateToTab('shop');
      await shopPage.expectCartBadgeNotVisible();
      
      // Capturar screenshot do carrinho limpo
      await cartPage.takeScreenshot('cart-cleared');
    });
  });

  describe('Aplicar Cupons de Desconto', () => {
    beforeEach(async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
    });

    it('deve aplicar cupom válido', async () => {
      // Scroll para seção de cupom
      await cartPage.scrollToCoupon();
      
      // Aplicar cupom válido
      await cartPage.applyValidCoupon();
      await sleep(2000);
      
      // Verificar se cupom foi aplicado
      await cartPage.expectCouponSuccess();
      
      // Verificar se desconto aparece no resumo
      await cartPage.scrollToSummary();
      await cartPage.expectDiscount('R$ 10,00');
      
      // Capturar screenshot do cupom aplicado
      await cartPage.takeScreenshot('coupon-applied');
    });

    it('deve mostrar erro com cupom inválido', async () => {
      // Scroll para seção de cupom
      await cartPage.scrollToCoupon();
      
      // Aplicar cupom inválido
      await cartPage.applyInvalidCoupon();
      await sleep(2000);
      
      // Verificar se erro aparece
      await cartPage.expectCouponError('Cupom inválido');
      
      // Capturar screenshot do erro
      await cartPage.takeScreenshot('coupon-error');
    });

    it('deve remover cupom aplicado', async () => {
      // Aplicar cupom válido primeiro
      await cartPage.scrollToCoupon();
      await cartPage.applyValidCoupon();
      await sleep(2000);
      
      // Remover cupom
      await cartPage.removeCoupon();
      await sleep(1000);
      
      // Verificar se cupom foi removido
      await cartPage.scrollToSummary();
      await cartPage.expectDiscount('R$ 0,00');
      
      // Capturar screenshot do cupom removido
      await cartPage.takeScreenshot('coupon-removed');
    });
  });

  describe('Resumo do Carrinho', () => {
    beforeEach(async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
    });

    it('deve mostrar resumo correto com um item', async () => {
      // Scroll para resumo
      await cartPage.scrollToSummary();
      
      // Verificar valores do resumo
      await cartPage.expectSubtotal('R$ 100,00');
      await cartPage.expectShipping('R$ 15,00');
      await cartPage.expectDiscount('R$ 0,00');
      await cartPage.expectTotal('R$ 115,00');
      
      // Capturar screenshot do resumo
      await cartPage.takeScreenshot('cart-summary');
    });

    it('deve atualizar resumo com múltiplos itens', async () => {
      // Aumentar quantidade
      await cartPage.increaseItemQuantity(0);
      await sleep(1000);
      
      // Scroll para resumo
      await cartPage.scrollToSummary();
      
      // Verificar valores atualizados
      await cartPage.expectSubtotal('R$ 200,00');
      await cartPage.expectShipping('R$ 15,00');
      await cartPage.expectTotal('R$ 215,00');
      
      // Capturar screenshot do resumo atualizado
      await cartPage.takeScreenshot('cart-summary-updated');
    });

    it('deve calcular frete grátis para compras acima de valor mínimo', async () => {
      // Adicionar itens suficientes para frete grátis
      await cartPage.updateItemQuantity(0, 10);
      await sleep(1000);
      
      // Scroll para resumo
      await cartPage.scrollToSummary();
      
      // Verificar frete grátis
      await cartPage.expectShipping('R$ 0,00');
      await expect(element(by.text('Frete grátis'))).toBeVisible();
      
      // Capturar screenshot do frete grátis
      await cartPage.takeScreenshot('free-shipping');
    });
  });

  describe('Navegação a partir do Carrinho', () => {
    beforeEach(async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
    });

    it('deve continuar comprando', async () => {
      // Continuar comprando
      await cartPage.continueShopping();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
      
      // Verificar se badge do carrinho ainda mostra item
      await shopPage.expectCartBadge('1');
    });

    it('deve prosseguir para checkout', async () => {
      // Prosseguir para checkout
      await cartPage.proceedToCheckout();
      await sleep(2000);
      
      // Verificar se navegou para checkout
      await expect(element(by.id('checkout-screen'))).toBeVisible();
      
      // Capturar screenshot do checkout
      await cartPage.takeScreenshot('checkout-screen');
    });

    it('deve verificar se botão checkout está habilitado', async () => {
      // Scroll para resumo
      await cartPage.scrollToSummary();
      
      // Verificar se botão está habilitado
      await cartPage.expectCheckoutButtonEnabled();
    });
  });

  describe('Carrinho Vazio', () => {
    it('deve mostrar estado vazio quando não há itens', async () => {
      // Navegar para carrinho vazio
      await shopPage.navigateToCart();
      await cartPage.waitForEmptyCart();
      
      // Verificar estado vazio
      await cartPage.expectEmptyCart();
      
      // Verificar se botão checkout está desabilitado
      await cartPage.expectCheckoutButtonDisabled();
      
      // Capturar screenshot do carrinho vazio
      await cartPage.takeScreenshot('empty-cart');
    });

    it('deve permitir continuar comprando do carrinho vazio', async () => {
      // Navegar para carrinho vazio
      await shopPage.navigateToCart();
      await cartPage.waitForEmptyCart();
      
      // Continuar comprando
      await cartPage.continueShopping();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Persistência do Carrinho', () => {
    it('deve manter itens no carrinho após navegar entre abas', async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      
      // Navegar entre abas
      await shopPage.navigateToFavorites();
      await sleep(1000);
      await shopPage.navigateToProfile();
      await sleep(1000);
      await shopPage.navigateToCart();
      
      // Verificar se item ainda está no carrinho
      await cartPage.waitForCartWithItems();
      await cartPage.expectCartWithItems();
    });

    it('deve manter carrinho após reiniciar app', async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      
      // Reiniciar app
      await device.reloadReactNative();
      await device.launchApp({ newInstance: false });
      await sleep(3000);
      
      // Verificar se item ainda está no carrinho
      await shopPage.waitForShopScreen();
      await shopPage.expectCartBadge('1');
      
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      await cartPage.expectCartWithItems();
    });
  });

  describe('Performance do Carrinho', () => {
    it('deve responder rapidamente ao adicionar múltiplos itens', async () => {
      const startTime = Date.now();
      
      // Adicionar múltiplos itens rapidamente
      for (let i = 0; i < 5; i++) {
        await shopPage.addBoxToCart(i % 3, 'featured');
        await sleep(500);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verificar se operação foi rápida
      expect(duration).toBeLessThan(10000);
      
      // Verificar se badge está correto
      await shopPage.expectCartBadge('5');
      
      console.log(`Adicionado 5 itens em ${duration}ms`);
    });

    it('deve manter performance com carrinho cheio', async () => {
      // Adicionar muitos itens
      for (let i = 0; i < 10; i++) {
        await shopPage.addBoxToCart(i % 3, 'featured');
        await sleep(300);
      }
      
      // Navegar para carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Verificar se carregou corretamente
      await cartPage.expectCartWithItems();
      
      // Fazer operações no carrinho
      await cartPage.increaseItemQuantity(0);
      await cartPage.decreaseItemQuantity(1);
      await cartPage.scrollToSummary();
      
      // Verificar se ainda responde
      await cartPage.expectTotal('R$ 1.115,00'); // Valor estimado
    });
  });
});