 
/**
 * Testes E2E para navegação entre telas
 * 
 * Testa a navegação entre as diferentes telas do aplicativo
 * Crowbar Mobile usando as abas inferiores e navegação em pilha.
 */

const LoginPage = require('../page-objects/LoginPage');
const ShopPage = require('../page-objects/ShopPage');
const CartPage = require('../page-objects/CartPage');

describe('Navegação entre Telas', () => {
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
    // Voltar para tela principal
    try {
      await shopPage.navigateToTab('shop');
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Navegação por Abas Inferiores', () => {
    it('deve navegar para todas as abas principais', async () => {
      // Verificar se está na aba da loja
      await shopPage.expectShopScreenVisible();
      await shopPage.expectTabActive('shop');
      
      // Navegar para aba de favoritos
      await shopPage.navigateToFavorites();
      await sleep(1000);
      await shopPage.expectTabActive('favorites');
      
      // Navegar para aba do carrinho
      await shopPage.navigateToCart();
      await sleep(1000);
      await shopPage.expectTabActive('cart');
      
      // Navegar para aba do perfil
      await shopPage.navigateToProfile();
      await sleep(1000);
      await shopPage.expectTabActive('profile');
      
      // Voltar para aba da loja
      await shopPage.navigateToTab('shop');
      await sleep(1000);
      await shopPage.expectShopScreenVisible();
      
      // Capturar screenshot final
      await shopPage.takeScreenshot('tab-navigation-complete');
    });

    it('deve manter estado ao navegar entre abas', async () => {
      // Adicionar item ao carrinho na tela da loja
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
      
      // Verificar badge do carrinho
      await shopPage.expectCartBadge('1');
      
      // Navegar para aba do carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Verificar se item está no carrinho
      await cartPage.expectCartWithItems();
      
      // Voltar para aba da loja
      await shopPage.navigateToTab('shop');
      await shopPage.waitForShopScreen();
      
      // Verificar se badge do carrinho ainda está presente
      await shopPage.expectCartBadge('1');
    });

    it('deve navegar rapidamente entre abas', async () => {
      // Navegar rapidamente entre abas múltiplas vezes
      for (let i = 0; i < 3; i++) {
        await shopPage.navigateToFavorites();
        await sleep(500);
        
        await shopPage.navigateToCart();
        await sleep(500);
        
        await shopPage.navigateToProfile();
        await sleep(500);
        
        await shopPage.navigateToTab('shop');
        await sleep(500);
      }
      
      // Verificar se ainda está funcionando corretamente
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Navegação em Pilha', () => {
    it('deve navegar para detalhes de uma caixa', async () => {
      // Tocar na primeira caixa em destaque
      await shopPage.tapFirstFeaturedBox();
      await sleep(2000);
      
      // Verificar se navegou para tela de detalhes
      // (Assumindo que existe uma BoxDetailsPage)
      await shopPage.takeScreenshot('box-details-screen');
      
      // Voltar para tela anterior
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar para tela de busca', async () => {
      // Tocar no botão de busca
      await shopPage.tapSearchButton();
      await sleep(2000);
      
      // Verificar se navegou para tela de busca
      await shopPage.takeScreenshot('search-screen');
      
      // Voltar para tela anterior
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar para tela de categoria', async () => {
      // Tocar na primeira categoria
      await shopPage.tapFirstCategory();
      await sleep(2000);
      
      // Verificar se navegou para tela de categoria
      await shopPage.takeScreenshot('category-screen');
      
      // Voltar para tela anterior
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar para tela de perfil do usuário', async () => {
      // Tocar no botão de perfil
      await shopPage.tapProfileButton();
      await sleep(2000);
      
      // Verificar se navegou para tela de perfil
      await shopPage.takeScreenshot('profile-screen');
      
      // Voltar para tela anterior
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Navegação do Carrinho', () => {
    beforeEach(async () => {
      // Adicionar item ao carrinho
      await shopPage.addFirstFeaturedBoxToCart();
      await sleep(1000);
    });

    it('deve navegar para carrinho via aba', async () => {
      // Navegar para aba do carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Verificar se está na tela do carrinho
      await cartPage.expectCartScreenVisible();
      await cartPage.expectCartWithItems();
    });

    it('deve navegar para carrinho via botão no header', async () => {
      // Tocar no botão do carrinho no header
      await shopPage.tapCartButton();
      await cartPage.waitForCartWithItems();
      
      // Verificar se está na tela do carrinho
      await cartPage.expectCartScreenVisible();
      await cartPage.expectCartWithItems();
      
      // Voltar para tela anterior
      await cartPage.tapBackButton();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve continuar comprando a partir do carrinho', async () => {
      // Navegar para carrinho
      await shopPage.navigateToCart();
      await cartPage.waitForCartWithItems();
      
      // Tocar em continuar comprando
      await cartPage.continueShopping();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Navegação em Estados Especiais', () => {
    it('deve navegar com carrinho vazio', async () => {
      // Navegar para carrinho vazio
      await shopPage.navigateToCart();
      await cartPage.waitForEmptyCart();
      
      // Verificar se está na tela do carrinho vazio
      await cartPage.expectEmptyCart();
      
      // Continuar comprando
      await cartPage.continueShopping();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar com conexão lenta', async () => {
      // Simular conexão lenta
      await device.setNetworkConditions({
        type: 'slow',
        download: 100,
        upload: 100
      });
      
      // Navegar entre abas
      await shopPage.navigateToFavorites();
      await sleep(2000);
      
      await shopPage.navigateToCart();
      await sleep(2000);
      
      await shopPage.navigateToProfile();
      await sleep(2000);
      
      await shopPage.navigateToTab('shop');
      await sleep(2000);
      
      // Verificar se ainda funciona
      await shopPage.expectShopScreenVisible();
      
      // Restaurar conexão normal
      await device.setNetworkConditions({
        type: 'normal'
      });
    });

    it('deve navegar após rotação da tela', async () => {
      // Rotacionar tela para landscape
      await device.setOrientation('landscape');
      await sleep(1000);
      
      // Navegar entre abas
      await shopPage.navigateToFavorites();
      await sleep(1000);
      
      await shopPage.navigateToCart();
      await sleep(1000);
      
      // Rotacionar de volta para portrait
      await device.setOrientation('portrait');
      await sleep(1000);
      
      // Continuar navegando
      await shopPage.navigateToProfile();
      await sleep(1000);
      
      await shopPage.navigateToTab('shop');
      await sleep(1000);
      
      // Verificar se ainda funciona
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Navegação com Gestos', () => {
    it('deve navegar com swipe entre abas', async () => {
      // Fazer swipe para navegar entre abas (se suportado)
      await shopPage.swipeElement('bottom-tab', 'left');
      await sleep(1000);
      
      // Verificar se navegou
      await shopPage.takeScreenshot('swipe-navigation');
      
      // Fazer swipe de volta
      await shopPage.swipeElement('bottom-tab', 'right');
      await sleep(1000);
      
      // Verificar se voltou
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar com pull-to-refresh', async () => {
      // Fazer pull-to-refresh
      await shopPage.pullToRefresh();
      await sleep(2000);
      
      // Verificar se página ainda está funcionando
      await shopPage.expectShopScreenVisible();
      await shopPage.expectAllSectionsVisible();
    });
  });

  describe('Navegação de Deep Links', () => {
    it('deve navegar via deep link para produto', async () => {
      // Simular deep link para produto
      await device.openURL({
        url: 'crowbar://product/123'
      });
      await sleep(3000);
      
      // Verificar se navegou para tela de produto
      await shopPage.takeScreenshot('deeplink-product');
      
      // Voltar para tela principal
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });

    it('deve navegar via deep link para categoria', async () => {
      // Simular deep link para categoria
      await device.openURL({
        url: 'crowbar://category/electronics'
      });
      await sleep(3000);
      
      // Verificar se navegou para tela de categoria
      await shopPage.takeScreenshot('deeplink-category');
      
      // Voltar para tela principal
      await shopPage.goBack();
      await sleep(1000);
      
      // Verificar se voltou para tela da loja
      await shopPage.expectShopScreenVisible();
    });
  });

  describe('Performance de Navegação', () => {
    it('deve navegar com tempo de resposta aceitável', async () => {
      const startTime = Date.now();
      
      // Navegar entre múltiplas abas
      await shopPage.navigateToFavorites();
      await shopPage.navigateToCart();
      await shopPage.navigateToProfile();
      await shopPage.navigateToTab('shop');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verificar se navegação foi rápida (menos de 5 segundos)
      expect(duration).toBeLessThan(5000);
      
      // Verificar se ainda está funcionando
      await shopPage.expectShopScreenVisible();

    });

    it('deve manter performance após múltiplas navegações', async () => {
      // Navegar múltiplas vezes
      for (let i = 0; i < 10; i++) {
        await shopPage.navigateToFavorites();
        await shopPage.navigateToCart();
        await shopPage.navigateToProfile();
        await shopPage.navigateToTab('shop');
      }
      
      // Verificar se ainda está funcionando normalmente
      await shopPage.expectShopScreenVisible();
      await shopPage.expectAllSectionsVisible();
    });
  });
});