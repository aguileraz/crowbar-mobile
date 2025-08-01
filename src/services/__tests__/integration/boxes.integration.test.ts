import { TestApiClient, testEnvironment, testUtils } from './testConfig';
import { boxService } from '../../boxService';
import { MysteryBox, Category, SearchFilters, SearchResult, Review } from '../../../types/api';

/**
 * Testes de integração para operações de caixas misteriosas
 * Verifica busca, detalhes, filtros e funcionalidades relacionadas
 */

describe('Testes de Integração - Operações de Boxes', () => {
  let testClient: TestApiClient;

  // Dados de teste específicos para boxes
  const testBoxes: MysteryBox[] = [
    {
      id: 'box-electronics-001',
      name: 'Caixa Eletrônicos Premium',
      description: 'Caixa com dispositivos eletrônicos surpresa',
      price: 99.99,
      category_id: 'cat-electronics',
      category: { id: 'cat-electronics', name: 'Eletrônicos', slug: 'electronics' },
      image_url: 'https://test.com/electronics.jpg',
      images: ['https://test.com/electronics1.jpg', 'https://test.com/electronics2.jpg'],
      stock: 50,
      is_featured: true,
      is_new: false,
      rarity: 'rare',
      tags: ['eletrônicos', 'premium', 'surpresa'],
      average_rating: 4.5,
      reviews_count: 23,
      items_count: 8,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'box-gaming-002',
      name: 'Caixa Gaming Deluxe',
      description: 'Caixa com itens de gaming',
      price: 149.99,
      category_id: 'cat-gaming',
      category: { id: 'cat-gaming', name: 'Gaming', slug: 'gaming' },
      image_url: 'https://test.com/gaming.jpg',
      images: ['https://test.com/gaming1.jpg'],
      stock: 25,
      is_featured: false,
      is_new: true,
      rarity: 'legendary',
      tags: ['gaming', 'deluxe', 'jogos'],
      average_rating: 4.8,
      reviews_count: 15,
      items_count: 12,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ];

  const testCategories: Category[] = [
    { id: 'cat-electronics', name: 'Eletrônicos', slug: 'electronics' },
    { id: 'cat-gaming', name: 'Gaming', slug: 'gaming' },
    { id: 'cat-fashion', name: 'Moda', slug: 'fashion' },
  ];

  const testReviews: Review[] = [
    {
      id: 'review-001',
      user_id: 'user-123',
      mystery_box_id: 'box-electronics-001',
      rating: 5,
      comment: 'Caixa excelente! Recebi itens de ótima qualidade.',
      images: ['https://test.com/review1.jpg'],
      helpful_count: 8,
      is_helpful: false,
      created_at: '2025-01-03T00:00:00Z',
      user: {
        id: 'user-123',
        name: 'João Silva',
        avatar_url: 'https://test.com/avatar.jpg',
      },
    },
  ];

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Listagem de caixas', () => {
    it('deve obter lista de caixas com sucesso', async () => {
      // Arrange
      const expectedResponse = testUtils.createPaginatedResponse(testBoxes);
      testClient.mockSuccess('get', '/boxes', expectedResponse);

      // Act
      const response = await boxService.getBoxes();

      // Assert
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'box-electronics-001',
        name: 'Caixa Eletrônicos Premium',
        price: 99.99,
      });
      expect(response.meta.total).toBe(2);
    });

    it('deve obter caixas com filtros aplicados', async () => {
      // Arrange
      const filters: SearchFilters = {
        category_id: 'cat-electronics',
        min_price: 50,
        max_price: 150,
        rarity: ['rare'],
        is_featured: true,
        sort_by: 'price',
        sort_order: 'asc',
        page: 1,
        per_page: 10,
      };

      const filteredBoxes = testBoxes.filter(box => box.category_id === 'cat-electronics');
      const expectedResponse = testUtils.createPaginatedResponse(filteredBoxes);
      
      testClient.mockSuccess('get', '/boxes', expectedResponse);

      // Act
      const response = await boxService.getBoxes(filters);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.data[0].category_id).toBe('cat-electronics');
    });

    it('deve obter caixas em destaque', async () => {
      // Arrange
      const featuredBoxes = testBoxes.filter(box => box.is_featured);
      const expectedResponse = testUtils.createApiResponse(featuredBoxes);
      
      testClient.mockSuccess('get', '/boxes/featured', expectedResponse);

      // Act
      const response = await boxService.getFeaturedBoxes(10);

      // Assert
      expect(response).toHaveLength(1);
      expect(response[0].is_featured).toBe(true);
    });

    it('deve obter caixas populares', async () => {
      // Arrange
      const popularBoxes = testBoxes.sort((a, b) => b.reviews_count - a.reviews_count);
      const expectedResponse = testUtils.createApiResponse(popularBoxes);
      
      testClient.mockSuccess('get', '/boxes/popular', expectedResponse);

      // Act
      const response = await boxService.getPopularBoxes(10);

      // Assert
      expect(response).toHaveLength(2);
      expect(response[0].reviews_count).toBeGreaterThanOrEqual(response[1].reviews_count);
    });

    it('deve obter caixas recém-lançadas', async () => {
      // Arrange
      const newBoxes = testBoxes.filter(box => box.is_new);
      const expectedResponse = testUtils.createApiResponse(newBoxes);
      
      testClient.mockSuccess('get', '/boxes/new', expectedResponse);

      // Act
      const response = await boxService.getNewBoxes(10);

      // Assert
      expect(response).toHaveLength(1);
      expect(response[0].is_new).toBe(true);
    });

    it('deve tratar erro ao obter lista de caixas', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });
  });

  describe('Detalhes da caixa', () => {
    it('deve obter detalhes de uma caixa específica', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const expectedResponse = testUtils.createApiResponse(testBoxes[0]);
      
      testClient.mockSuccess('get', `/boxes/${boxId}`, expectedResponse);

      // Act
      const response = await boxService.getBoxById(boxId);

      // Assert
      expect(response).toMatchObject({
        id: boxId,
        name: 'Caixa Eletrônicos Premium',
        price: 99.99,
        category: { name: 'Eletrônicos' },
      });
    });

    it('deve falhar ao obter caixa inexistente', async () => {
      // Arrange
      const boxId = 'box-nonexistent';
      testClient.mockHttpError('get', `/boxes/${boxId}`, 404, {
        success: false,
        message: 'Caixa não encontrada',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxById(boxId)).rejects.toMatchObject({
        status: 404,
        message: 'Caixa não encontrada',
      });
    });

    it('deve obter estatísticas de uma caixa', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const stats = {
        total_sold: 150,
        total_opened: 120,
        average_rating: 4.5,
        reviews_count: 23,
        recent_openings: [
          {
            id: 'opening-001',
            user: { name: 'João' },
            items: [{ name: 'Fone Bluetooth' }],
            opened_at: '2025-01-07T10:00:00Z',
          },
        ],
      };

      const expectedResponse = testUtils.createApiResponse(stats);
      testClient.mockSuccess('get', `/boxes/${boxId}/stats`, expectedResponse);

      // Act
      const response = await boxService.getBoxStats(boxId);

      // Assert
      expect(response.total_sold).toBe(150);
      expect(response.average_rating).toBe(4.5);
      expect(response.recent_openings).toHaveLength(1);
    });

    it('deve verificar disponibilidade de estoque', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const quantity = 3;
      const stockInfo = {
        available: true,
        stock: 47,
        max_per_user: 5,
      };

      const expectedResponse = testUtils.createApiResponse(stockInfo);
      testClient.mockSuccess('get', `/boxes/${boxId}/stock`, expectedResponse);

      // Act
      const response = await boxService.checkStock(boxId, quantity);

      // Assert
      expect(response.available).toBe(true);
      expect(response.stock).toBe(47);
      expect(response.max_per_user).toBe(5);
    });

    it('deve obter caixas relacionadas', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const relatedBoxes = [testBoxes[1]]; // Gaming box como relacionada
      const expectedResponse = testUtils.createApiResponse(relatedBoxes);
      
      testClient.mockSuccess('get', `/boxes/${boxId}/related`, expectedResponse);

      // Act
      const response = await boxService.getRelatedBoxes(boxId, 6);

      // Assert
      expect(response).toHaveLength(1);
      expect(response[0].id).toBe('box-gaming-002');
    });
  });

  describe('Busca de caixas', () => {
    it('deve realizar busca com sucesso', async () => {
      // Arrange
      const query = 'eletrônicos';
      const searchResult: SearchResult = {
        query,
        results: [testBoxes[0]],
        total: 1,
        suggestions: ['eletrônicos premium', 'eletrônicos gaming'],
        facets: {
          categories: [{ id: 'cat-electronics', name: 'Eletrônicos', count: 1 }],
          rarities: [{ name: 'rare', count: 1 }],
          price_ranges: [{ min: 50, max: 100, count: 1 }],
        },
      };

      const expectedResponse = testUtils.createApiResponse(searchResult);
      testClient.mockSuccess('post', '/boxes/search', expectedResponse);

      // Act
      const response = await boxService.searchBoxes(query);

      // Assert
      expect(response.query).toBe(query);
      expect(response.results).toHaveLength(1);
      expect(response.results[0].name).toContain('Eletrônicos');
      expect(response.suggestions).toContain('eletrônicos premium');
    });

    it('deve realizar busca com filtros avançados', async () => {
      // Arrange
      const query = 'premium';
      const filters = {
        category_id: 'cat-electronics',
        min_price: 50,
        max_price: 150,
        rarity: ['rare', 'legendary'],
        sort_by: 'relevance',
      };

      const searchResult: SearchResult = {
        query,
        results: [testBoxes[0]],
        total: 1,
        suggestions: [],
        facets: {
          categories: [{ id: 'cat-electronics', name: 'Eletrônicos', count: 1 }],
          rarities: [{ name: 'rare', count: 1 }],
          price_ranges: [{ min: 50, max: 100, count: 1 }],
        },
      };

      const expectedResponse = testUtils.createApiResponse(searchResult);
      testClient.mockSuccess('post', '/boxes/search', expectedResponse);

      // Act
      const response = await boxService.searchBoxes(query, filters);

      // Assert
      expect(response.query).toBe(query);
      expect(response.results).toHaveLength(1);
      expect(response.total).toBe(1);
    });

    it('deve obter sugestões de busca', async () => {
      // Arrange
      const query = 'elet';
      const suggestions = ['eletrônicos', 'eletrônicos premium', 'eletrônicos gaming'];
      const expectedResponse = testUtils.createApiResponse(suggestions);
      
      testClient.mockSuccess('get', '/boxes/search/suggestions', expectedResponse);

      // Act
      const response = await boxService.getSearchSuggestions(query);

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toBe('eletrônicos');
      expect(response).toContain('eletrônicos premium');
    });

    it('deve retornar resultado vazio para busca sem matches', async () => {
      // Arrange
      const query = 'inexistente';
      const searchResult: SearchResult = {
        query,
        results: [],
        total: 0,
        suggestions: ['eletrônicos', 'gaming', 'moda'],
        facets: {
          categories: [],
          rarities: [],
          price_ranges: [],
        },
      };

      const expectedResponse = testUtils.createApiResponse(searchResult);
      testClient.mockSuccess('post', '/boxes/search', expectedResponse);

      // Act
      const response = await boxService.searchBoxes(query);

      // Assert
      expect(response.query).toBe(query);
      expect(response.results).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.suggestions).toHaveLength(3);
    });
  });

  describe('Categorias', () => {
    it('deve obter lista de categorias', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testCategories);
      testClient.mockSuccess('get', '/categories', expectedResponse);

      // Act
      const response = await boxService.getCategories();

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toMatchObject({
        id: 'cat-electronics',
        name: 'Eletrônicos',
        slug: 'electronics',
      });
    });

    it('deve obter categoria por ID', async () => {
      // Arrange
      const categoryId = 'cat-electronics';
      const expectedResponse = testUtils.createApiResponse(testCategories[0]);
      
      testClient.mockSuccess('get', `/categories/${categoryId}`, expectedResponse);

      // Act
      const response = await boxService.getCategoryById(categoryId);

      // Assert
      expect(response).toMatchObject({
        id: categoryId,
        name: 'Eletrônicos',
        slug: 'electronics',
      });
    });

    it('deve obter caixas de uma categoria específica', async () => {
      // Arrange
      const categoryId = 'cat-electronics';
      const categoryBoxes = testBoxes.filter(box => box.category_id === categoryId);
      const expectedResponse = testUtils.createPaginatedResponse(categoryBoxes);
      
      testClient.mockSuccess('get', '/boxes', expectedResponse);

      // Act
      const response = await boxService.getBoxesByCategory(categoryId);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.data[0].category_id).toBe(categoryId);
    });
  });

  describe('Reviews', () => {
    it('deve obter reviews de uma caixa', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const expectedResponse = testUtils.createPaginatedResponse(testReviews);
      
      testClient.mockSuccess('get', `/boxes/${boxId}/reviews`, expectedResponse);

      // Act
      const response = await boxService.getBoxReviews(boxId);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toMatchObject({
        id: 'review-001',
        rating: 5,
        comment: 'Caixa excelente! Recebi itens de ótima qualidade.',
      });
    });

    it('deve adicionar review para uma caixa', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const reviewData = {
        rating: 4,
        comment: 'Boa caixa, mas poderia ter mais itens.',
        images: ['https://test.com/my-review.jpg'],
      };

      const newReview = {
        id: 'review-002',
        user_id: 'user-456',
        mystery_box_id: boxId,
        ...reviewData,
        helpful_count: 0,
        is_helpful: false,
        created_at: '2025-01-07T12:00:00Z',
        user: {
          id: 'user-456',
          name: 'Maria Santos',
          avatar_url: 'https://test.com/avatar2.jpg',
        },
      };

      const expectedResponse = testUtils.createApiResponse(newReview);
      testClient.mockSuccess('post', `/boxes/${boxId}/reviews`, expectedResponse);

      // Act
      const response = await boxService.addBoxReview(boxId, reviewData);

      // Assert
      expect(response).toMatchObject({
        id: 'review-002',
        rating: 4,
        comment: 'Boa caixa, mas poderia ter mais itens.',
        mystery_box_id: boxId,
      });
    });

    it('deve marcar review como útil', async () => {
      // Arrange
      const reviewId = 'review-001';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Review marcada como útil',
      });
      
      testClient.mockSuccess('post', `/reviews/${reviewId}/helpful`, expectedResponse);

      // Act
      await boxService.markReviewHelpful(reviewId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });
  });

  describe('Funcionalidades auxiliares', () => {
    it('deve obter tags populares', async () => {
      // Arrange
      const popularTags = [
        { tag: 'eletrônicos', count: 25 },
        { tag: 'gaming', count: 18 },
        { tag: 'premium', count: 15 },
      ];

      const expectedResponse = testUtils.createApiResponse(popularTags);
      testClient.mockSuccess('get', '/tags/popular', expectedResponse);

      // Act
      const response = await boxService.getPopularTags(20);

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toMatchObject({
        tag: 'eletrônicos',
        count: 25,
      });
    });

    it('deve obter filtros disponíveis', async () => {
      // Arrange
      const availableFilters = {
        categories: testCategories,
        rarities: ['common', 'rare', 'legendary'],
        price_range: { min: 19.99, max: 299.99 },
        tags: ['eletrônicos', 'gaming', 'premium', 'deluxe'],
      };

      const expectedResponse = testUtils.createApiResponse(availableFilters);
      testClient.mockSuccess('get', '/boxes/filters', expectedResponse);

      // Act
      const response = await boxService.getAvailableFilters();

      // Assert
      expect(response.categories).toHaveLength(3);
      expect(response.rarities).toContain('legendary');
      expect(response.price_range.min).toBe(19.99);
      expect(response.tags).toContain('eletrônicos');
    });

    it('deve obter histórico de preços', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const priceHistory = [
        { date: '2025-01-01', price: 89.99 },
        { date: '2025-01-05', price: 99.99 },
        { date: '2025-01-07', price: 94.99 },
      ];

      const expectedResponse = testUtils.createApiResponse(priceHistory);
      testClient.mockSuccess('get', `/boxes/${boxId}/price-history`, expectedResponse);

      // Act
      const response = await boxService.getPriceHistory(boxId, 30);

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toMatchObject({
        date: '2025-01-01',
        price: 89.99,
      });
    });

    it('deve reportar problema com uma caixa', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const report = {
        type: 'misleading_info' as const,
        description: 'A descrição da caixa não confere com os itens recebidos',
      };

      const expectedResponse = testUtils.createApiResponse({
        message: 'Relatório enviado com sucesso',
      });
      
      testClient.mockSuccess('post', `/boxes/${boxId}/report`, expectedResponse);

      // Act
      await boxService.reportBox(boxId, report);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });
  });

  describe('Cenários de erro', () => {
    it('deve tratar erro de rede durante busca', async () => {
      // Arrange
      const query = 'eletrônicos';
      testClient.mockNetworkError('post', '/boxes/search');

      // Act & Assert
      await expect(boxService.searchBoxes(query)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante carregamento de detalhes', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      testClient.mockTimeout('get', `/boxes/${boxId}`);

      // Act & Assert
      await expect(boxService.getBoxById(boxId)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar erro 500 durante listagem', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });

    it('deve tratar erro de validação ao adicionar review', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const invalidReview = {
        rating: 6, // Rating inválido
        comment: '', // Comentário vazio
      };

      testClient.mockHttpError('post', `/boxes/${boxId}/reviews`, 422, {
        success: false,
        message: 'Dados inválidos',
        errors: {
          rating: ['Rating deve ser entre 1 e 5'],
          comment: ['Comentário é obrigatório'],
        },
      });

      // Act & Assert
      await expect(boxService.addBoxReview(boxId, invalidReview)).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          rating: ['Rating deve ser entre 1 e 5'],
          comment: ['Comentário é obrigatório'],
        },
      });
    });
  });
});
