/**
 * ShopPage - Page Object para tela da loja
 * 
 * Contém todos os elementos e ações relacionadas à tela principal da loja
 * do aplicativo Crowbar Mobile.
 */

const BasePage = require('./BasePage');

class ShopPage extends BasePage {
  constructor() {
    super();
    
    // Seletores dos elementos da tela da loja
    this.selectors = {
      // Tela principal
      shopScreen: 'shop-screen',
      
      // Cabeçalho
      headerTitle: 'shop-header-title',
      searchButton: 'search-button',
      cartButton: 'cart-button',
      cartBadge: 'cart-badge',
      profileButton: 'profile-button',
      
      // Seções principais
      categoriesSection: 'categories-section',
      featuredSection: 'featured-section',
      popularSection: 'popular-section',
      newReleasesSection: 'new-releases-section',
      
      // Lista de categorias
      categoriesList: 'categories-list',
      categoryItem: 'category-item',
      
      // Lista de caixas em destaque
      featuredList: 'featured-list',
      featuredBoxCard: 'featured-box-card',
      
      // Lista de caixas populares
      popularList: 'popular-list',
      popularBoxCard: 'popular-box-card',
      
      // Lista de novos lançamentos
      newReleasesList: 'new-releases-list',
      newReleasesBoxCard: 'new-releases-box-card',
      
      // Elementos de caixa
      boxCard: 'box-card',
      boxImage: 'box-image',
      boxTitle: 'box-title',
      boxPrice: 'box-price',
      boxRating: 'box-rating',
      favoriteButton: 'favorite-button',
      addToCartButton: 'add-to-cart-button',
      
      // Elementos de navegação
      bottomTab: 'bottom-tab',
      shopTab: 'shop-tab',
      favoritesTab: 'favorites-tab',
      cartTab: 'cart-tab',
      profileTab: 'profile-tab',
      
      // Elementos de estado
      loadingIndicator: 'loading-indicator',
      errorMessage: 'error-message',
      emptyState: 'empty-state',
      
      // Elementos de busca
      searchInput: 'search-input',
      searchResults: 'search-results',
      
      // Elementos de filtro
      filterButton: 'filter-button',
      sortButton: 'sort-button',
      
      // Elementos de notificação
      notificationBadge: 'notification-badge',
      notificationIcon: 'notification-icon',
      
      // Elementos de refresh
      refreshControl: 'refresh-control',
      
      // Elementos de scroll
      scrollView: 'shop-scroll-view'
    };
    
    // Dados de teste
    this.testData = {
      searchTerms: {
        valid: 'caixa',
        invalid: 'produto inexistente',
        empty: '',
        special: '!@#$%'
      },
      categories: [
        'Eletrônicos',
        'Roupas',
        'Acessórios',
        'Casa',
        'Beleza'
      ]
    };
  }

  /**
   * Aguarda a tela da loja carregar completamente
   */
  async waitForShopScreen() {
    await this.waitForScreen(this.selectors.shopScreen);
    await this.waitForElement(this.selectors.headerTitle);
    await this.waitForElement(this.selectors.categoriesSection);
    await this.waitForElement(this.selectors.featuredSection);
  }

  /**
   * Toca no botão de busca
   */
  async tapSearchButton() {
    await this.tapElement(this.selectors.searchButton);
  }

  /**
   * Toca no botão do carrinho
   */
  async tapCartButton() {
    await this.tapElement(this.selectors.cartButton);
  }

  /**
   * Toca no botão de perfil
   */
  async tapProfileButton() {
    await this.tapElement(this.selectors.profileButton);
  }

  /**
   * Toca em uma categoria específica
   * @param {string} categoryName - Nome da categoria
   */
  async tapCategory(categoryName) {
    await this.tapElementWithText(categoryName);
  }

  /**
   * Toca na primeira categoria disponível
   */
  async tapFirstCategory() {
    await this.tapElement(`${this.selectors.categoryItem}-0`);
  }

  /**
   * Toca em uma caixa específica
   * @param {number} 0 - Índice da caixa
   * @param {string} section - Seção da caixa ('featured', 'popular', 'new-releases')
   */
  async tapBox(_index, section = 'featured') {
    const boxSelector = `${section}-box-card-${_index}`;
    await this.tapElement(boxSelector);
  }

  /**
   * Toca na primeira caixa em destaque
   */
  async tapFirstFeaturedBox() {
    await this.tapBox(0, 'featured');
  }

  /**
   * Toca na primeira caixa popular
   */
  async tapFirstPopularBox() {
    await this.tapBox(0, 'popular');
  }

  /**
   * Adiciona uma caixa ao carrinho
   * @param {number} 0 - Índice da caixa
   * @param {string} section - Seção da caixa
   */
  async addBoxToCart(_index, section = 'featured') {
    const addToCartSelector = `${section}-add-to-cart-${_index}`;
    await this.tapElement(addToCartSelector);
  }

  /**
   * Adiciona a primeira caixa em destaque ao carrinho
   */
  async addFirstFeaturedBoxToCart() {
    await this.addBoxToCart(0, 'featured');
  }

  /**
   * Marca/desmarca uma caixa como favorita
   * @param {number} 0 - Índice da caixa
   * @param {string} section - Seção da caixa
   */
  async toggleFavorite(_index, section = 'featured') {
    const favoriteSelector = `${section}-favorite-${_index}`;
    await this.tapElement(favoriteSelector);
  }

  /**
   * Marca a primeira caixa como favorita
   */
  async favoriteFirstBox() {
    await this.toggleFavorite(0, 'featured');
  }

  /**
   * Faz scroll para seção específica
   * @param {string} section - Seção para scroll ('categories', 'featured', 'popular', 'new-releases')
   */
  async scrollToSection(section) {
    await this.scrollToElement(
      this.selectors.scrollView,
      this.selectors[`${section}Section`]
    );
  }

  /**
   * Faz scroll para seção de categorias
   */
  async scrollToCategories() {
    await this.scrollToSection('categories');
  }

  /**
   * Faz scroll para seção em destaque
   */
  async scrollToFeatured() {
    await this.scrollToSection('featured');
  }

  /**
   * Faz scroll para seção popular
   */
  async scrollToPopular() {
    await this.scrollToSection('popular');
  }

  /**
   * Faz scroll para novos lançamentos
   */
  async scrollToNewReleases() {
    await this.scrollToSection('newReleases');
  }

  /**
   * Faz pull-to-refresh na tela
   */
  async pullToRefresh() {
    await this.swipeElement(this.selectors.scrollView, 'down', 'slow');
    await this.waitForElementToDisappear(this.selectors.refreshControl);
  }

  /**
   * Navega para aba específica
   * @param {string} tab - Nome da aba ('shop', 'favorites', 'cart', 'profile')
   */
  async navigateToTab(tab) {
    await this.tapElement(this.selectors[`${tab}Tab`]);
  }

  /**
   * Navega para aba de favoritos
   */
  async navigateToFavorites() {
    await this.navigateToTab('favorites');
  }

  /**
   * Navega para aba do carrinho
   */
  async navigateToCart() {
    await this.navigateToTab('cart');
  }

  /**
   * Navega para aba do perfil
   */
  async navigateToProfile() {
    await this.navigateToTab('profile');
  }

  /**
   * Verifica se a tela da loja está visível
   */
  async expectShopScreenVisible() {
    await this.expectElementToBeVisible(this.selectors.shopScreen);
  }

  /**
   * Verifica se o título do cabeçalho está correto
   */
  async expectHeaderTitle(expectedTitle = 'Crowbar') {
    await this.expectElementToHaveText(this.selectors.headerTitle, expectedTitle);
  }

  /**
   * Verifica se todas as seções estão visíveis
   */
  async expectAllSectionsVisible() {
    await this.expectElementToBeVisible(this.selectors.categoriesSection);
    await this.expectElementToBeVisible(this.selectors.featuredSection);
    await this.expectElementToBeVisible(this.selectors.popularSection);
    await this.expectElementToBeVisible(this.selectors.newReleasesSection);
  }

  /**
   * Verifica se há caixas na seção em destaque
   */
  async expectFeaturedBoxesVisible() {
    await this.expectElementToBeVisible(this.selectors.featuredList);
    await this.expectElementToBeVisible(`${this.selectors.featuredBoxCard}-0`);
  }

  /**
   * Verifica se há categorias visíveis
   */
  async expectCategoriesVisible() {
    await this.expectElementToBeVisible(this.selectors.categoriesList);
    await this.expectElementToBeVisible(`${this.selectors.categoryItem}-0`);
  }

  /**
   * Verifica se o badge do carrinho está visível
   * @param {string} expectedCount - Número esperado de itens
   */
  async expectCartBadge(expectedCount) {
    await this.expectElementToBeVisible(this.selectors.cartBadge);
    if (expectedCount) {
      await this.expectElementToHaveText(this.selectors.cartBadge, expectedCount);
    }
  }

  /**
   * Verifica se o badge do carrinho não está visível
   */
  async expectCartBadgeNotVisible() {
    await expect(element(by.id(this.selectors.cartBadge))).toBeNotVisible();
  }

  /**
   * Verifica se está carregando
   */
  async expectLoading() {
    await this.expectElementToBeVisible(this.selectors.loadingIndicator);
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
   * Verifica se estado vazio está visível
   */
  async expectEmptyState() {
    await this.expectElementToBeVisible(this.selectors.emptyState);
  }

  /**
   * Verifica se uma caixa específica está visível
   * @param {number} 0 - Índice da caixa
   * @param {string} section - Seção da caixa
   */
  async expectBoxVisible(_index, section = 'featured') {
    await this.expectElementToBeVisible(`${section}-box-card-${_index}`);
  }

  /**
   * Verifica se uma categoria específica está visível
   * @param {string} categoryName - Nome da categoria
   */
  async expectCategoryVisible(categoryName) {
    await this.expectElementToBeVisible(this.selectors.categoryItem);
    await this.expectElementToHaveText(this.selectors.categoryItem, categoryName);
  }

  /**
   * Verifica se a aba atual está ativa
   * @param {string} tab - Nome da aba
   */
  async expectTabActive(tab) {
    await this.expectElementToBeVisible(this.selectors[`${tab}Tab`]);
  }

  /**
   * Verifica se há notificações
   */
  async expectNotificationBadge() {
    await this.expectElementToBeVisible(this.selectors.notificationBadge);
  }

  /**
   * Verifica se não há notificações
   */
  async expectNoNotificationBadge() {
    await expect(element(by.id(this.selectors.notificationBadge))).toBeNotVisible();
  }

  /**
   * Conta o número de caixas em uma seção
   * @param {string} section - Seção para contar
   * @returns {number} - Número de caixas
   */
  async countBoxesInSection(_section) {
    // Implementação específica para contar elementos
    // Retorna número aproximado baseado em elementos visíveis
    return 5; // Placeholder
  }

  /**
   * Verifica se há pelo menos uma caixa em cada seção
   */
  async expectBoxesInAllSections() {
    await this.expectBoxVisible(0, 'featured');
    await this.expectBoxVisible(0, 'popular');
    await this.expectBoxVisible(0, 'new-releases');
  }

  /**
   * Busca por um termo específico
   * @param {string} searchTerm - Termo de busca
   */
  async searchFor(searchTerm) {
    await this.tapSearchButton();
    await this.typeText(this.selectors.searchInput, searchTerm);
    await device.pressKey('enter');
  }

  /**
   * Verifica se os resultados da busca estão visíveis
   */
  async expectSearchResultsVisible() {
    await this.expectElementToBeVisible(this.selectors.searchResults);
  }
}

module.exports = ShopPage;