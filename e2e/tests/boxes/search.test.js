/**
 * Testes E2E para busca e navegação de caixas
 * 
 * Testa funcionalidades de busca, filtros, ordenação e navegação
 * na listagem de caixas mistério.
 */

import { TEST_IDS, TEST_BOXES } from '../../helpers/testData';
import { 
  login, 
  navigateToBoxes, 
  searchBoxes, 
  filterByCategory, 
  sortBoxes,
  expectVisible,
  pullToRefresh
} from '../../helpers/actions';

describe('Boxes Search and Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await login();
  });

  beforeEach(async () => {
    await navigateToBoxes();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('deve exibir lista de caixas disponíveis', async () => {
    logTest('Teste: Exibir lista de caixas');
    
    // Verificar elementos da tela
    await expectVisible(TEST_IDS.BOXES.LIST);
    await expectVisible(TEST_IDS.BOXES.SEARCH_INPUT);
    await expectVisible(TEST_IDS.BOXES.FILTER_BUTTON);
    await expectVisible(TEST_IDS.BOXES.SORT_BUTTON);
    
    // Verificar que existem caixas na lista
    await waitForElement(element(by.id(TEST_IDS.BOXES.ITEM)).atIndex(0));
    
    // Verificar informações básicas da caixa
    await expectVisible('box-item-image');
    await expectVisible('box-item-title');
    await expectVisible('box-item-price');
    await expectVisible('box-item-category');
    
    logTest('Lista de caixas exibida corretamente');
  });

  it('deve buscar caixas por nome', async () => {
    logTest('Teste: Buscar caixas por nome');
    
    // Realizar busca
    await searchBoxes('Gaming');
    
    // Verificar resultados
    await waitForElement(element(by.text('Gaming')).atIndex(0));
    
    // Verificar que caixas não relacionadas não aparecem
    await expect(element(by.text('Eletrônicos'))).toBeNotVisible();
    
    // Limpar busca
    await element(by.id(TEST_IDS.BOXES.SEARCH_INPUT)).clearText();
    await sleep(1000);
    
    // Verificar que todas as caixas voltaram
    await waitForElement(element(by.text('Eletrônicos')));
    
    logTest('Busca por nome funcionando');
  });

  it('deve mostrar mensagem quando não há resultados', async () => {
    logTest('Teste: Mensagem de sem resultados');
    
    // Buscar termo que não existe
    await searchBoxes('xyzabc123');
    
    // Verificar mensagem
    await waitForElement(element(by.text('Nenhuma caixa encontrada')));
    await expectVisible('empty-search-icon');
    
    // Limpar busca
    await element(by.id(TEST_IDS.BOXES.SEARCH_INPUT)).clearText();
    
    logTest('Mensagem de sem resultados funcionando');
  });

  it('deve filtrar por categoria', async () => {
    logTest('Teste: Filtrar por categoria');
    
    // Aplicar filtro de categoria
    await filterByCategory('Eletrônicos');
    
    // Verificar que apenas caixas da categoria aparecem
    const firstBox = element(by.id('box-item-category')).atIndex(0);
    await expect(firstBox).toHaveText('Eletrônicos');
    
    // Verificar badge de filtro ativo
    await expectVisible('active-filter-badge');
    await expect(element(by.id('active-filter-count'))).toHaveText('1');
    
    logTest('Filtro por categoria funcionando');
  });

  it('deve filtrar por faixa de preço', async () => {
    logTest('Teste: Filtrar por faixa de preço');
    
    // Abrir filtros
    await waitAndTap(element(by.id(TEST_IDS.BOXES.FILTER_BUTTON)));
    
    // Selecionar faixa de preço
    await waitAndTap(element(by.text('Até R$ 50')));
    
    // Aplicar filtro
    await waitAndTap(element(by.text('Aplicar')));
    
    // Verificar que apenas caixas na faixa aparecem
    const priceText = await element(by.id('box-item-price')).atIndex(0).getText();
    const price = parseFloat(priceText.replace('R$ ', '').replace(',', '.'));
    expect(price).toBeLessThanOrEqual(50);
    
    logTest('Filtro por preço funcionando');
  });

  it('deve aplicar múltiplos filtros', async () => {
    logTest('Teste: Múltiplos filtros');
    
    // Abrir filtros
    await waitAndTap(element(by.id(TEST_IDS.BOXES.FILTER_BUTTON)));
    
    // Selecionar categoria
    await waitAndTap(element(by.text('Gaming')));
    
    // Selecionar faixa de preço
    await waitAndTap(element(by.text('R$ 200 - R$ 500')));
    
    // Selecionar disponibilidade
    await waitAndTap(element(by.text('Em estoque')));
    
    // Aplicar filtros
    await waitAndTap(element(by.text('Aplicar')));
    
    // Verificar badge com número de filtros
    await expect(element(by.id('active-filter-count'))).toHaveText('3');
    
    // Verificar que resultados atendem todos os critérios
    const category = await element(by.id('box-item-category')).atIndex(0).getText();
    expect(category).toBe('Gaming');
    
    logTest('Múltiplos filtros funcionando');
  });

  it('deve limpar filtros', async () => {
    logTest('Teste: Limpar filtros');
    
    // Aplicar um filtro primeiro
    await filterByCategory('Gaming');
    
    // Abrir filtros novamente
    await waitAndTap(element(by.id(TEST_IDS.BOXES.FILTER_BUTTON)));
    
    // Limpar filtros
    await waitAndTap(element(by.text('Limpar filtros')));
    
    // Aplicar
    await waitAndTap(element(by.text('Aplicar')));
    
    // Verificar que badge sumiu
    await expect(element(by.id('active-filter-badge'))).toBeNotVisible();
    
    // Verificar que todas as categorias aparecem
    await waitForElement(element(by.text('Eletrônicos')));
    await waitForElement(element(by.text('Gaming')));
    
    logTest('Limpar filtros funcionando');
  });

  it('deve ordenar por preço crescente', async () => {
    logTest('Teste: Ordenar por preço crescente');
    
    // Aplicar ordenação
    await sortBoxes('Menor preço');
    
    // Capturar preços das primeiras caixas
    const price1Text = await element(by.id('box-item-price')).atIndex(0).getText();
    const price2Text = await element(by.id('box-item-price')).atIndex(1).getText();
    
    const price1 = parseFloat(price1Text.replace('R$ ', '').replace(',', '.'));
    const price2 = parseFloat(price2Text.replace('R$ ', '').replace(',', '.'));
    
    expect(price1).toBeLessThanOrEqual(price2);
    
    logTest('Ordenação por preço crescente funcionando');
  });

  it('deve ordenar por preço decrescente', async () => {
    logTest('Teste: Ordenar por preço decrescente');
    
    // Aplicar ordenação
    await sortBoxes('Maior preço');
    
    // Capturar preços das primeiras caixas
    const price1Text = await element(by.id('box-item-price')).atIndex(0).getText();
    const price2Text = await element(by.id('box-item-price')).atIndex(1).getText();
    
    const price1 = parseFloat(price1Text.replace('R$ ', '').replace(',', '.'));
    const price2 = parseFloat(price2Text.replace('R$ ', '').replace(',', '.'));
    
    expect(price1).toBeGreaterThanOrEqual(price2);
    
    logTest('Ordenação por preço decrescente funcionando');
  });

  it('deve ordenar por popularidade', async () => {
    logTest('Teste: Ordenar por popularidade');
    
    // Aplicar ordenação
    await sortBoxes('Mais populares');
    
    // Verificar que badge de "Popular" aparece nas primeiras
    await expectVisible('box-item-popular-badge');
    
    logTest('Ordenação por popularidade funcionando');
  });

  it('deve navegar para detalhes da caixa', async () => {
    logTest('Teste: Navegar para detalhes');
    
    // Capturar nome da primeira caixa
    const boxName = await element(by.id('box-item-title')).atIndex(0).getText();
    
    // Tocar na caixa
    await waitAndTap(element(by.id(TEST_IDS.BOXES.ITEM)).atIndex(0));
    
    // Verificar que navegou para detalhes
    await waitForScreen(TEST_IDS.BOX_DETAILS.IMAGE);
    
    // Verificar que é a mesma caixa
    await expect(element(by.id(TEST_IDS.BOX_DETAILS.TITLE))).toHaveText(boxName);
    
    logTest('Navegação para detalhes funcionando');
  });

  it('deve carregar mais caixas ao scrollar (paginação)', async () => {
    logTest('Teste: Paginação infinita');
    
    // Contar caixas iniciais
    const initialCount = await element(by.id(TEST_IDS.BOXES.ITEM)).getAttributes();
    
    // Scrollar até o final
    await element(by.id(TEST_IDS.BOXES.LIST)).scroll(1000, 'down', 1);
    
    // Aguardar carregamento
    await sleep(2000);
    
    // Verificar que mais caixas foram carregadas
    const finalCount = await element(by.id(TEST_IDS.BOXES.ITEM)).getAttributes();
    expect(finalCount.length).toBeGreaterThan(initialCount.length);
    
    logTest('Paginação infinita funcionando');
  });

  it('deve realizar pull to refresh', async () => {
    logTest('Teste: Pull to refresh');
    
    // Fazer pull to refresh
    await pullToRefresh(TEST_IDS.BOXES.LIST);
    
    // Verificar que lista foi atualizada (loading aparece e some)
    await waitForElementToDisappear(element(by.id('refresh-control-loading')));
    
    logTest('Pull to refresh funcionando');
  });

  it('deve mostrar indicadores de promoção', async () => {
    logTest('Teste: Indicadores de promoção');
    
    // Procurar caixa em promoção
    await scrollToElement(
      element(by.id(TEST_IDS.BOXES.LIST)),
      element(by.text(TEST_BOXES.PROMO_BOX.name))
    );
    
    // Verificar elementos de promoção
    await expectVisible('box-item-promo-badge');
    await expectVisible('box-item-original-price');
    await expectVisible('box-item-discount-percentage');
    
    logTest('Indicadores de promoção funcionando');
  });

  it('deve persistir filtros ao navegar', async () => {
    logTest('Teste: Persistência de filtros');
    
    // Aplicar filtro
    await filterByCategory('Gaming');
    
    // Navegar para detalhes
    await waitAndTap(element(by.id(TEST_IDS.BOXES.ITEM)).atIndex(0));
    
    // Voltar para lista
    await waitAndTap(element(by.id('header-back-button')));
    
    // Verificar que filtro ainda está ativo
    await expectVisible('active-filter-badge');
    await expect(element(by.id('active-filter-count'))).toHaveText('1');
    
    logTest('Persistência de filtros funcionando');
  });
});