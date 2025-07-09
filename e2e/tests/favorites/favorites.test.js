/**
 * Testes E2E para gerenciamento de favoritos
 * 
 * Testa funcionalidades de adicionar, remover e gerenciar
 * caixas favoritas.
 */

import { TEST_IDS, TEST_BOXES } from '../../helpers/testData';
import { 
  login, 
  navigateToBoxes,
  navigateToProfile,
  addToFavorites,
  removeFromFavorites,
  expectVisible
} from '../../helpers/actions';

describe('Favorites Management', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await login();
  });

  beforeEach(async () => {
    // Limpar favoritos antes de cada teste
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Remover todos os favoritos se existirem
    while (await element(by.id('favorite-item')).exists()) {
      await waitAndTap(element(by.id('favorite-item-remove')).atIndex(0));
      await sleep(500);
    }
    
    // Voltar para início
    await waitAndTap(element(by.id(TEST_IDS.NAV.HOME)));
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('deve adicionar caixa aos favoritos', async () => {
    logTest('Teste: Adicionar aos favoritos');
    
    // Navegar para caixas
    await navigateToBoxes();
    
    // Selecionar uma caixa
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    
    // Adicionar aos favoritos
    await addToFavorites();
    
    // Verificar ícone mudou
    await expectVisible('favorite-icon-filled');
    
    // Navegar para favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Verificar que caixa está nos favoritos
    await waitForElement(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    
    logTest('Caixa adicionada aos favoritos com sucesso');
  });

  it('deve remover caixa dos favoritos', async () => {
    logTest('Teste: Remover dos favoritos');
    
    // Adicionar primeiro
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    
    // Remover dos favoritos
    await removeFromFavorites();
    
    // Verificar ícone mudou
    await expectVisible('favorite-icon-outline');
    
    // Verificar que foi removido da lista
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Verificar lista vazia
    await expectVisible('empty-favorites-message');
    await expect(element(by.text('Você ainda não tem favoritos'))).toBeVisible();
    
    logTest('Caixa removida dos favoritos com sucesso');
  });

  it('deve mostrar badge de favorito na lista', async () => {
    logTest('Teste: Badge de favorito na lista');
    
    // Adicionar favorito
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    
    // Voltar para lista
    await waitAndTap(element(by.id('header-back-button')));
    
    // Verificar badge
    const boxItem = element(by.text(TEST_BOXES.BASIC_BOX.name)).withAncestor(by.id(TEST_IDS.BOXES.ITEM));
    await expectVisible(element(by.id('favorite-badge')).descendantOf(boxItem));
    
    logTest('Badge de favorito funcionando');
  });

  it('deve ordenar favoritos por data de adição', async () => {
    logTest('Teste: Ordenar favoritos');
    
    // Adicionar múltiplos favoritos
    await navigateToBoxes();
    
    // Adicionar primeira caixa
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    await waitAndTap(element(by.id('header-back-button')));
    
    await sleep(1000); // Garantir ordem diferente
    
    // Adicionar segunda caixa
    await waitAndTap(element(by.text(TEST_BOXES.PREMIUM_BOX.name)));
    await addToFavorites();
    
    // Verificar ordem nos favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Mais recente primeiro
    const firstItem = await element(by.id('favorite-item-title')).atIndex(0).getText();
    expect(firstItem).toBe(TEST_BOXES.PREMIUM_BOX.name);
    
    logTest('Ordenação de favoritos funcionando');
  });

  it('deve permitir adicionar aos favoritos da lista', async () => {
    logTest('Teste: Adicionar favorito da lista');
    
    await navigateToBoxes();
    
    // Encontrar botão de favorito no item da lista
    const boxItem = element(by.text(TEST_BOXES.BASIC_BOX.name)).withAncestor(by.id(TEST_IDS.BOXES.ITEM));
    const favoriteButton = element(by.id('quick-favorite-button')).descendantOf(boxItem);
    
    // Adicionar aos favoritos
    await waitAndTap(favoriteButton);
    
    // Verificar feedback
    await waitForElement(element(by.text('Adicionado aos favoritos')));
    
    // Verificar nos favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    await expectVisible(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    
    logTest('Adicionar da lista funcionando');
  });

  it('deve sincronizar favoritos entre telas', async () => {
    logTest('Teste: Sincronização de favoritos');
    
    // Adicionar favorito dos detalhes
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    
    // Voltar e verificar na lista
    await waitAndTap(element(by.id('header-back-button')));
    const boxItem = element(by.text(TEST_BOXES.BASIC_BOX.name)).withAncestor(by.id(TEST_IDS.BOXES.ITEM));
    await expectVisible(element(by.id('favorite-badge')).descendantOf(boxItem));
    
    // Remover da lista de favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    await waitAndTap(element(by.id('favorite-item-remove')).atIndex(0));
    
    // Voltar e verificar que foi removido
    await waitAndTap(element(by.id(TEST_IDS.NAV.BOXES)));
    await expect(element(by.id('favorite-badge')).descendantOf(boxItem)).toBeNotVisible();
    
    logTest('Sincronização funcionando');
  });

  it('deve mostrar notificação quando caixa favorita entra em promoção', async () => {
    logTest('Teste: Notificação de promoção');
    
    // Adicionar caixa aos favoritos
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    
    // Navegar para notificações
    await navigateToProfile();
    await waitAndTap(element(by.id('profile-notifications-button')));
    
    // Verificar configuração de notificação para favoritos
    await expectVisible('favorite-notifications-toggle');
    await expect(element(by.id('favorite-notifications-toggle'))).toHaveToggleValue(true);
    
    logTest('Configuração de notificações funcionando');
  });

  it('deve permitir compartilhar lista de favoritos', async () => {
    logTest('Teste: Compartilhar favoritos');
    
    // Adicionar alguns favoritos
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    await waitAndTap(element(by.id('header-back-button')));
    await waitAndTap(element(by.text(TEST_BOXES.PREMIUM_BOX.name)));
    await addToFavorites();
    
    // Ir para favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Compartilhar lista
    await waitAndTap(element(by.id('share-favorites-button')));
    
    // Verificar opções de compartilhamento
    if (device.getPlatform() === 'ios') {
      await waitForElement(element(by.type('UIActivityViewController')));
      await element(by.label('Close')).tap();
    } else {
      await waitForElement(element(by.text('Compartilhar via')));
      await device.pressBack();
    }
    
    logTest('Compartilhamento de favoritos funcionando');
  });

  it('deve filtrar favoritos por categoria', async () => {
    logTest('Teste: Filtrar favoritos');
    
    // Adicionar favoritos de diferentes categorias
    await navigateToBoxes();
    
    // Adicionar caixa de eletrônicos
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    await waitAndTap(element(by.id('header-back-button')));
    
    // Adicionar caixa de gaming
    await filterByCategory('Gaming');
    await waitAndTap(element(by.id(TEST_IDS.BOXES.ITEM)).atIndex(0));
    await addToFavorites();
    
    // Ir para favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Aplicar filtro
    await waitAndTap(element(by.id('favorites-filter-button')));
    await waitAndTap(element(by.text('Eletrônicos')));
    
    // Verificar apenas eletrônicos aparecem
    await expectVisible(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await expect(element(by.text('Gaming')).atIndex(1)).toBeNotVisible();
    
    logTest('Filtro de favoritos funcionando');
  });

  it('deve mostrar preço atualizado nos favoritos', async () => {
    logTest('Teste: Preço atualizado nos favoritos');
    
    // Adicionar aos favoritos
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    
    // Capturar preço original
    const originalPrice = await element(by.id(TEST_IDS.BOX_DETAILS.PRICE)).getText();
    
    await addToFavorites();
    
    // Ir para favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Verificar preço
    const favoritePrice = await element(by.id('favorite-item-price')).atIndex(0).getText();
    expect(favoritePrice).toBe(originalPrice);
    
    // Se houver desconto, mostrar ambos os preços
    if (await element(by.id('favorite-item-original-price')).exists()) {
      await expectVisible('favorite-item-discount-badge');
    }
    
    logTest('Preços atualizados funcionando');
  });

  it('deve limpar todos os favoritos', async () => {
    logTest('Teste: Limpar todos os favoritos');
    
    // Adicionar múltiplos favoritos
    await navigateToBoxes();
    await waitAndTap(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await addToFavorites();
    await waitAndTap(element(by.id('header-back-button')));
    await waitAndTap(element(by.text(TEST_BOXES.PREMIUM_BOX.name)));
    await addToFavorites();
    
    // Ir para favoritos
    await navigateToProfile();
    await waitAndTap(element(by.id(TEST_IDS.PROFILE.FAVORITES_BUTTON)));
    
    // Limpar todos
    await waitAndTap(element(by.id('favorites-menu-button')));
    await waitAndTap(element(by.text('Limpar Favoritos')));
    
    // Confirmar
    await waitAndTap(element(by.text('Confirmar')));
    
    // Verificar lista vazia
    await expectVisible('empty-favorites-message');
    
    logTest('Limpar favoritos funcionando');
  });
});