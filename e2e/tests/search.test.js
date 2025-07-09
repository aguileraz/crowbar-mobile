/**
 * Testes E2E para busca de caixas
 * 
 * Testa a funcionalidade de busca e filtros de caixas misteriosas
 * do aplicativo Crowbar Mobile.
 */

const LoginPage = require('../page-objects/LoginPage');
const ShopPage = require('../page-objects/ShopPage');

describe('Busca de Caixas', () => {
  let loginPage;
  let shopPage;

  beforeAll(async () => {
    // Inicializar page objects
    loginPage = new LoginPage();
    shopPage = new ShopPage();
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
      await shopPage.goBack();
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Busca Básica', () => {
    it('deve abrir tela de busca', async () => {
      // Tocar no botão de busca
      await shopPage.tapSearchButton();
      await sleep(2000);
      
      // Verificar se abriu tela de busca
      await shopPage.takeScreenshot('search-screen-opened');
      
      // Verificar se campo de busca está focado
      await expect(element(by.id('search-input'))).toBeFocused();
      
      // Verificar se elementos de busca estão visíveis
      await expect(element(by.id('search-screen'))).toBeVisible();
      await expect(element(by.id('search-input'))).toBeVisible();
    });

    it('deve buscar caixas com termo válido', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por termo válido
      await shopPage.searchFor('caixa');
      await sleep(3000);
      
      // Verificar se resultados aparecem
      await shopPage.expectSearchResultsVisible();
      
      // Verificar se há pelo menos um resultado
      await expect(element(by.id('search-result-0'))).toBeVisible();
      
      // Capturar screenshot dos resultados
      await shopPage.takeScreenshot('search-results-valid');
    });

    it('deve mostrar mensagem para busca sem resultados', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por termo sem resultados
      await shopPage.searchFor('produto inexistente');
      await sleep(3000);
      
      // Verificar se mensagem de "nenhum resultado" aparece
      await expect(element(by.text('Nenhum resultado encontrado'))).toBeVisible();
      
      // Capturar screenshot da mensagem
      await shopPage.takeScreenshot('search-no-results');
    });

    it('deve mostrar sugestões de busca', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Começar a digitar
      await element(by.id('search-input')).typeText('cai');
      await sleep(2000);
      
      // Verificar se sugestões aparecem
      await expect(element(by.id('search-suggestions'))).toBeVisible();
      
      // Verificar se há sugestões
      await expect(element(by.id('search-suggestion-0'))).toBeVisible();
      
      // Capturar screenshot das sugestões
      await shopPage.takeScreenshot('search-suggestions');
    });

    it('deve limpar busca e mostrar estado inicial', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Fazer uma busca
      await shopPage.searchFor('caixa');
      await sleep(2000);
      
      // Limpar busca
      await element(by.id('clear-search-button')).tap();
      await sleep(1000);
      
      // Verificar se voltou ao estado inicial
      await expect(element(by.id('search-input'))).toHaveText('');
      await expect(element(by.id('search-initial-state'))).toBeVisible();
      
      // Capturar screenshot do estado limpo
      await shopPage.takeScreenshot('search-cleared');
    });
  });

  describe('Busca com Filtros', () => {
    beforeEach(async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
    });

    it('deve aplicar filtro por categoria', async () => {
      // Abrir filtros
      await element(by.id('filters-button')).tap();
      await sleep(1000);
      
      // Selecionar categoria
      await element(by.id('category-filter')).tap();
      await element(by.text('Eletrônicos')).tap();
      await sleep(1000);
      
      // Aplicar filtros
      await element(by.id('apply-filters-button')).tap();
      await sleep(2000);
      
      // Verificar se filtros foram aplicados
      await expect(element(by.id('active-filters'))).toBeVisible();
      await expect(element(by.text('Eletrônicos'))).toBeVisible();
      
      // Capturar screenshot com filtros aplicados
      await shopPage.takeScreenshot('filters-category-applied');
    });

    it('deve aplicar filtro por faixa de preço', async () => {
      // Abrir filtros
      await element(by.id('filters-button')).tap();
      await sleep(1000);
      
      // Configurar faixa de preço
      await element(by.id('price-range-filter')).tap();
      await element(by.id('min-price-input')).typeText('50');
      await element(by.id('max-price-input')).typeText('200');
      await sleep(1000);
      
      // Aplicar filtros
      await element(by.id('apply-filters-button')).tap();
      await sleep(2000);
      
      // Verificar se filtros foram aplicados
      await expect(element(by.id('active-filters'))).toBeVisible();
      await expect(element(by.text('R$ 50 - R$ 200'))).toBeVisible();
      
      // Capturar screenshot com filtros de preço
      await shopPage.takeScreenshot('filters-price-applied');
    });

    it('deve aplicar filtro por avaliação', async () => {
      // Abrir filtros
      await element(by.id('filters-button')).tap();
      await sleep(1000);
      
      // Selecionar avaliação mínima
      await element(by.id('rating-filter')).tap();
      await element(by.id('rating-4-stars')).tap();
      await sleep(1000);
      
      // Aplicar filtros
      await element(by.id('apply-filters-button')).tap();
      await sleep(2000);
      
      // Verificar se filtros foram aplicados
      await expect(element(by.id('active-filters'))).toBeVisible();
      await expect(element(by.text('4+ estrelas'))).toBeVisible();
      
      // Capturar screenshot com filtros de avaliação
      await shopPage.takeScreenshot('filters-rating-applied');
    });

    it('deve aplicar múltiplos filtros', async () => {
      // Abrir filtros
      await element(by.id('filters-button')).tap();
      await sleep(1000);
      
      // Aplicar múltiplos filtros
      await element(by.id('category-filter')).tap();
      await element(by.text('Eletrônicos')).tap();
      
      await element(by.id('price-range-filter')).tap();
      await element(by.id('min-price-input')).typeText('100');
      await element(by.id('max-price-input')).typeText('500');
      
      await element(by.id('rating-filter')).tap();
      await element(by.id('rating-4-stars')).tap();
      
      await sleep(1000);
      
      // Aplicar filtros
      await element(by.id('apply-filters-button')).tap();
      await sleep(2000);
      
      // Verificar se todos os filtros foram aplicados
      await expect(element(by.id('active-filters'))).toBeVisible();
      await expect(element(by.text('Eletrônicos'))).toBeVisible();
      await expect(element(by.text('R$ 100 - R$ 500'))).toBeVisible();
      await expect(element(by.text('4+ estrelas'))).toBeVisible();
      
      // Capturar screenshot com múltiplos filtros
      await shopPage.takeScreenshot('filters-multiple-applied');
    });

    it('deve limpar filtros aplicados', async () => {
      // Aplicar alguns filtros primeiro
      await element(by.id('filters-button')).tap();
      await sleep(1000);
      
      await element(by.id('category-filter')).tap();
      await element(by.text('Eletrônicos')).tap();
      
      await element(by.id('apply-filters-button')).tap();
      await sleep(2000);
      
      // Limpar filtros
      await element(by.id('clear-filters-button')).tap();
      await sleep(1000);
      
      // Verificar se filtros foram removidos
      await expect(element(by.id('active-filters'))).toBeNotVisible();
      
      // Capturar screenshot com filtros limpos
      await shopPage.takeScreenshot('filters-cleared');
    });
  });

  describe('Busca com Ordenação', () => {
    beforeEach(async () => {
      // Abrir tela de busca e fazer uma busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      await shopPage.searchFor('caixa');
      await sleep(2000);
    });

    it('deve ordenar por relevância', async () => {
      // Abrir menu de ordenação
      await element(by.id('sort-button')).tap();
      await sleep(1000);
      
      // Selecionar ordenação por relevância
      await element(by.text('Relevância')).tap();
      await sleep(2000);
      
      // Verificar se ordenação foi aplicada
      await expect(element(by.text('Relevância'))).toBeVisible();
      
      // Capturar screenshot da ordenação
      await shopPage.takeScreenshot('sort-by-relevance');
    });

    it('deve ordenar por menor preço', async () => {
      // Abrir menu de ordenação
      await element(by.id('sort-button')).tap();
      await sleep(1000);
      
      // Selecionar ordenação por menor preço
      await element(by.text('Menor preço')).tap();
      await sleep(2000);
      
      // Verificar se ordenação foi aplicada
      await expect(element(by.text('Menor preço'))).toBeVisible();
      
      // Capturar screenshot da ordenação
      await shopPage.takeScreenshot('sort-by-price-low');
    });

    it('deve ordenar por maior preço', async () => {
      // Abrir menu de ordenação
      await element(by.id('sort-button')).tap();
      await sleep(1000);
      
      // Selecionar ordenação por maior preço
      await element(by.text('Maior preço')).tap();
      await sleep(2000);
      
      // Verificar se ordenação foi aplicada
      await expect(element(by.text('Maior preço'))).toBeVisible();
      
      // Capturar screenshot da ordenação
      await shopPage.takeScreenshot('sort-by-price-high');
    });

    it('deve ordenar por melhor avaliação', async () => {
      // Abrir menu de ordenação
      await element(by.id('sort-button')).tap();
      await sleep(1000);
      
      // Selecionar ordenação por melhor avaliação
      await element(by.text('Melhor avaliação')).tap();
      await sleep(2000);
      
      // Verificar se ordenação foi aplicada
      await expect(element(by.text('Melhor avaliação'))).toBeVisible();
      
      // Capturar screenshot da ordenação
      await shopPage.takeScreenshot('sort-by-rating');
    });

    it('deve ordenar por mais recente', async () => {
      // Abrir menu de ordenação
      await element(by.id('sort-button')).tap();
      await sleep(1000);
      
      // Selecionar ordenação por mais recente
      await element(by.text('Mais recente')).tap();
      await sleep(2000);
      
      // Verificar se ordenação foi aplicada
      await expect(element(by.text('Mais recente'))).toBeVisible();
      
      // Capturar screenshot da ordenação
      await shopPage.takeScreenshot('sort-by-newest');
    });
  });

  describe('Busca Avançada', () => {
    it('deve buscar com termos compostos', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por termo composto
      await shopPage.searchFor('caixa eletrônicos premium');
      await sleep(3000);
      
      // Verificar se resultados aparecem
      await shopPage.expectSearchResultsVisible();
      
      // Capturar screenshot dos resultados
      await shopPage.takeScreenshot('search-compound-terms');
    });

    it('deve buscar com caracteres especiais', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por termo com caracteres especiais
      await shopPage.searchFor('caixa-surpresa!');
      await sleep(3000);
      
      // Verificar se busca foi tratada corretamente
      await expect(element(by.id('search-results'))).toBeVisible();
      
      // Capturar screenshot dos resultados
      await shopPage.takeScreenshot('search-special-chars');
    });

    it('deve buscar com números', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por código numérico
      await shopPage.searchFor('123');
      await sleep(3000);
      
      // Verificar se busca foi processada
      await expect(element(by.id('search-results'))).toBeVisible();
      
      // Capturar screenshot dos resultados
      await shopPage.takeScreenshot('search-numeric');
    });

    it('deve buscar com acentos', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Buscar por termo com acentos
      await shopPage.searchFor('eletrônicos');
      await sleep(3000);
      
      // Verificar se busca foi processada
      await expect(element(by.id('search-results'))).toBeVisible();
      
      // Capturar screenshot dos resultados
      await shopPage.takeScreenshot('search-accents');
    });
  });

  describe('Histórico de Busca', () => {
    it('deve salvar busca no histórico', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Fazer uma busca
      await shopPage.searchFor('caixa premium');
      await sleep(2000);
      
      // Voltar para tela de busca
      await shopPage.goBack();
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Verificar se histórico aparece
      await expect(element(by.id('search-history'))).toBeVisible();
      await expect(element(by.text('caixa premium'))).toBeVisible();
      
      // Capturar screenshot do histórico
      await shopPage.takeScreenshot('search-history');
    });

    it('deve permitir buscar novamente do histórico', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Fazer uma busca
      await shopPage.searchFor('eletrônicos');
      await sleep(2000);
      
      // Voltar para tela de busca
      await shopPage.goBack();
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Tocar no item do histórico
      await element(by.text('eletrônicos')).tap();
      await sleep(2000);
      
      // Verificar se busca foi executada novamente
      await expect(element(by.id('search-input'))).toHaveText('eletrônicos');
      await shopPage.expectSearchResultsVisible();
    });

    it('deve limpar histórico de busca', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Fazer algumas buscas
      await shopPage.searchFor('caixa');
      await sleep(1000);
      await shopPage.goBack();
      
      await shopPage.tapSearchButton();
      await shopPage.searchFor('eletrônicos');
      await sleep(1000);
      await shopPage.goBack();
      
      // Abrir tela de busca novamente
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Limpar histórico
      await element(by.id('clear-history-button')).tap();
      await sleep(1000);
      
      // Verificar se histórico foi limpo
      await expect(element(by.id('search-history'))).toBeNotVisible();
      
      // Capturar screenshot do histórico limpo
      await shopPage.takeScreenshot('search-history-cleared');
    });
  });

  describe('Busca com Estados de Carregamento', () => {
    it('deve mostrar loading durante busca', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Iniciar busca
      await element(by.id('search-input')).typeText('caixa');
      await element(by.id('search-button')).tap();
      
      // Verificar se loading aparece
      await expect(element(by.id('search-loading'))).toBeVisible();
      
      // Aguardar busca completar
      await sleep(3000);
      
      // Verificar se loading desaparece
      await expect(element(by.id('search-loading'))).toBeNotVisible();
      
      // Capturar screenshot final
      await shopPage.takeScreenshot('search-loading-complete');
    });

    it('deve mostrar erro de conexão', async () => {
      // Simular erro de conexão
      await device.setNetworkConditions({
        type: 'none'
      });
      
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      // Tentar buscar
      await shopPage.searchFor('caixa');
      await sleep(3000);
      
      // Verificar se erro aparece
      await expect(element(by.text('Erro de conexão'))).toBeVisible();
      
      // Capturar screenshot do erro
      await shopPage.takeScreenshot('search-connection-error');
      
      // Restaurar conexão
      await device.setNetworkConditions({
        type: 'normal'
      });
    });
  });

  describe('Performance de Busca', () => {
    it('deve buscar com tempo de resposta aceitável', async () => {
      // Abrir tela de busca
      await shopPage.tapSearchButton();
      await sleep(1000);
      
      const startTime = Date.now();
      
      // Fazer busca
      await shopPage.searchFor('caixa');
      await sleep(3000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verificar se busca foi rápida (menos de 5 segundos)
      expect(duration).toBeLessThan(5000);
      
      // Verificar se resultados aparecem
      await shopPage.expectSearchResultsVisible();
      
      console.log(`Busca completada em ${duration}ms`);
    });

    it('deve manter performance com múltiplas buscas', async () => {
      // Fazer múltiplas buscas
      const searchTerms = ['caixa', 'eletrônicos', 'premium', 'surpresa', 'gaming'];
      
      for (const term of searchTerms) {
        await shopPage.tapSearchButton();
        await sleep(1000);
        
        await shopPage.searchFor(term);
        await sleep(2000);
        
        await shopPage.goBack();
      }
      
      // Verificar se app ainda responde normalmente
      await shopPage.expectShopScreenVisible();
    });
  });
});