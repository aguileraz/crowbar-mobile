import { TestApiClient, testEnvironment } from './testConfig';
import { ApiError, ApiErrorUtils } from '../../api';
import { boxService } from '../../boxService';
import { cartService } from '../../cartService';
import { userService } from '../../userService';
import { orderService } from '../../orderService';

/**
 * Testes de integração para cenários de erro de rede
 * Verifica tratamento de timeout, 404, 500 e outros erros HTTP
 */

describe('Testes de Integração - Cenários de Erro de Rede', () => {
  let testClient: TestApiClient;

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

  describe('Erros de conectividade', () => {
    it('deve tratar erro de rede durante busca de caixas', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/boxes');

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar erro de rede durante login', async () => {
      // Arrange
      testClient.mockNetworkError('post', '/auth/login');

      // Act & Assert
      await expect(apiClient.post('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      })).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar erro de rede durante adição ao carrinho', async () => {
      // Arrange
      testClient.mockNetworkError('post', '/cart/items');

      // Act & Assert
      await expect(cartService.addToCart('box-123', 1)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar erro de rede durante busca de perfil', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/user/profile');

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar erro de rede durante busca de pedidos', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/orders');

      // Act & Assert
      await expect(orderService.getOrders()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });
  });

  describe('Erros de timeout', () => {
    it('deve tratar timeout durante busca de caixas', async () => {
      // Arrange
      testClient.mockTimeout('get', '/boxes');

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar timeout durante checkout', async () => {
      // Arrange
      testClient.mockTimeout('post', '/orders');

      // Act & Assert
      await expect(cartService.checkout({
        shipping_address_id: 'addr-123',
        shipping_option_id: 'shipping-123',
        payment_method: 'credit_card',
      })).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar timeout durante busca de detalhes do pedido', async () => {
      // Arrange
      testClient.mockTimeout('get', '/orders/order-123');

      // Act & Assert
      await expect(orderService.getOrderById('order-123')).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar timeout durante atualização de perfil', async () => {
      // Arrange
      testClient.mockTimeout('put', '/user/profile');

      // Act & Assert
      await expect(userService.updateProfile({
        name: 'João Silva',
      })).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });
  });

  describe('Erros HTTP 404 - Not Found', () => {
    it('deve tratar erro 404 para caixa não encontrada', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes/nonexistent-box', 404, {
        success: false,
        message: 'Caixa não encontrada',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxById('nonexistent-box')).rejects.toMatchObject({
        status: 404,
        message: 'Caixa não encontrada',
      });
    });

    it('deve tratar erro 404 para pedido não encontrado', async () => {
      // Arrange
      testClient.mockHttpError('get', '/orders/nonexistent-order', 404, {
        success: false,
        message: 'Pedido não encontrado',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.getOrderById('nonexistent-order')).rejects.toMatchObject({
        status: 404,
        message: 'Pedido não encontrado',
      });
    });

    it('deve tratar erro 404 para item de carrinho não encontrado', async () => {
      // Arrange
      testClient.mockHttpError('put', '/cart/items/nonexistent-item', 404, {
        success: false,
        message: 'Item não encontrado no carrinho',
        errors: {},
      });

      // Act & Assert
      await expect(cartService.updateCartItem('nonexistent-item', 2)).rejects.toMatchObject({
        status: 404,
        message: 'Item não encontrado no carrinho',
      });
    });

    it('deve tratar erro 404 para endpoint não existente', async () => {
      // Arrange
      testClient.mockHttpError('get', '/nonexistent-endpoint', 404, {
        success: false,
        message: 'Endpoint não encontrado',
        errors: {},
      });

      // Act & Assert
      await expect(apiClient.get('/nonexistent-endpoint')).rejects.toMatchObject({
        status: 404,
        message: 'Endpoint não encontrado',
      });
    });
  });

  describe('Erros HTTP 500 - Internal Server Error', () => {
    it('deve tratar erro 500 durante busca de caixas', async () => {
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

    it('deve tratar erro 500 durante processamento de pagamento', async () => {
      // Arrange
      testClient.mockHttpError('post', '/orders/order-123/payment', 500, {
        success: false,
        message: 'Erro no processamento do pagamento',
        errors: {},
      });

      // Act & Assert
      await expect(cartService.processPayment('order-123', {
        method: 'credit_card',
        card_data: {
          number: '4111111111111111',
          holder_name: 'João Silva',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      })).rejects.toMatchObject({
        status: 500,
        message: 'Erro no processamento do pagamento',
      });
    });

    it('deve tratar erro 500 durante busca de estatísticas', async () => {
      // Arrange
      testClient.mockHttpError('get', '/user/stats', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getStats()).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });

    it('deve tratar erro 500 durante cancelamento de pedido', async () => {
      // Arrange
      testClient.mockHttpError('post', '/orders/order-123/cancel', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.cancelOrder('order-123', 'Cancelamento')).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });
  });

  describe('Erros HTTP 401 - Unauthorized', () => {
    it('deve tratar erro 401 para token expirado', async () => {
      // Arrange
      testClient.mockHttpError('get', '/user/profile', 401, {
        success: false,
        message: 'Token expirado ou inválido',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Token expirado ou inválido',
      });
    });

    it('deve tratar erro 401 durante busca de pedidos', async () => {
      // Arrange
      testClient.mockHttpError('get', '/orders', 401, {
        success: false,
        message: 'Autenticação necessária',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.getOrders()).rejects.toMatchObject({
        status: 401,
        message: 'Autenticação necessária',
      });
    });

    it('deve tratar erro 401 durante adição ao carrinho', async () => {
      // Arrange
      testClient.mockHttpError('post', '/cart/items', 401, {
        success: false,
        message: 'Sessão expirada',
        errors: {},
      });

      // Act & Assert
      await expect(cartService.addToCart('box-123', 1)).rejects.toMatchObject({
        status: 401,
        message: 'Sessão expirada',
      });
    });
  });

  describe('Erros HTTP 403 - Forbidden', () => {
    it('deve tratar erro 403 para acesso negado', async () => {
      // Arrange
      testClient.mockHttpError('get', '/orders/order-other-user', 403, {
        success: false,
        message: 'Acesso negado',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.getOrderById('order-other-user')).rejects.toMatchObject({
        status: 403,
        message: 'Acesso negado',
      });
    });

    it('deve tratar erro 403 para cancelamento não autorizado', async () => {
      // Arrange
      testClient.mockHttpError('post', '/orders/order-123/cancel', 403, {
        success: false,
        message: 'Você não tem permissão para cancelar este pedido',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.cancelOrder('order-123')).rejects.toMatchObject({
        status: 403,
        message: 'Você não tem permissão para cancelar este pedido',
      });
    });
  });

  describe('Erros HTTP 422 - Unprocessable Entity', () => {
    it('deve tratar erro 422 para dados inválidos no perfil', async () => {
      // Arrange
      testClient.mockHttpError('put', '/user/profile', 422, {
        success: false,
        message: 'Dados inválidos',
        errors: {
          name: ['Nome é obrigatório'],
          phone: ['Telefone inválido'],
          email: ['Email já está em uso'],
        },
      });

      // Act & Assert
      await expect(userService.updateProfile({
        name: '',
        phone: '123',
        email: 'invalid@email',
      })).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          name: ['Nome é obrigatório'],
          phone: ['Telefone inválido'],
          email: ['Email já está em uso'],
        },
      });
    });

    it('deve tratar erro 422 para cupom inválido', async () => {
      // Arrange
      testClient.mockHttpError('post', '/cart/coupon', 422, {
        success: false,
        message: 'Cupom inválido',
        errors: {
          code: ['Cupom não encontrado ou expirado'],
        },
      });

      // Act & Assert
      await expect(cartService.applyCoupon('INVALID_COUPON')).rejects.toMatchObject({
        status: 422,
        message: 'Cupom inválido',
        errors: {
          code: ['Cupom não encontrado ou expirado'],
        },
      });
    });

    it('deve tratar erro 422 para avaliação inválida', async () => {
      // Arrange
      testClient.mockHttpError('post', '/orders/order-123/rate', 422, {
        success: false,
        message: 'Dados inválidos',
        errors: {
          rating: ['Rating deve ser entre 1 e 5'],
          review: ['Review deve ter pelo menos 10 caracteres'],
        },
      });

      // Act & Assert
      await expect(orderService.rateOrder('order-123', 6, 'Bad')).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          rating: ['Rating deve ser entre 1 e 5'],
          review: ['Review deve ter pelo menos 10 caracteres'],
        },
      });
    });
  });

  describe('Erros HTTP 409 - Conflict', () => {
    it('deve tratar erro 409 para email já em uso', async () => {
      // Arrange
      testClient.mockHttpError('post', '/auth/register', 409, {
        success: false,
        message: 'Email já está em uso',
        errors: {
          email: ['Email já cadastrado'],
        },
      });

      // Act & Assert
      await expect(apiClient.post('/auth/register', {
        name: 'João Silva',
        email: 'existing@email.com',
        password: 'password123',
      })).rejects.toMatchObject({
        status: 409,
        message: 'Email já está em uso',
      });
    });

    it('deve tratar erro 409 para item já favoritado', async () => {
      // Arrange
      testClient.mockHttpError('post', '/user/favorites', 409, {
        success: false,
        message: 'Caixa já está nos favoritos',
        errors: {
          mystery_box_id: ['Caixa já favoritada'],
        },
      });

      // Act & Assert
      await expect(userService.addToFavorites('box-123')).rejects.toMatchObject({
        status: 409,
        message: 'Caixa já está nos favoritos',
      });
    });
  });

  describe('Erros HTTP 400 - Bad Request', () => {
    it('deve tratar erro 400 para produto fora de estoque', async () => {
      // Arrange
      testClient.mockHttpError('post', '/cart/items', 400, {
        success: false,
        message: 'Produto fora de estoque',
        errors: {
          quantity: ['Quantidade não disponível'],
        },
      });

      // Act & Assert
      await expect(cartService.addToCart('box-out-of-stock', 1)).rejects.toMatchObject({
        status: 400,
        message: 'Produto fora de estoque',
      });
    });

    it('deve tratar erro 400 para operação inválida', async () => {
      // Arrange
      testClient.mockHttpError('post', '/orders/order-shipped/cancel', 400, {
        success: false,
        message: 'Pedido já foi enviado e não pode ser cancelado',
        errors: {
          status: ['Operação não permitida'],
        },
      });

      // Act & Assert
      await expect(orderService.cancelOrder('order-shipped')).rejects.toMatchObject({
        status: 400,
        message: 'Pedido já foi enviado e não pode ser cancelado',
      });
    });
  });

  describe('Cenários de recuperação de erro', () => {
    it('deve falhar silenciosamente em verificação de favorito', async () => {
      // Arrange
      testClient.mockHttpError('get', '/user/favorites/box-123/check', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act
      const result = await userService.isFavorite('box-123');

      // Assert
      expect(result).toBe(false); // Deve retornar false em caso de erro
    });

    it('deve tratar múltiplos erros em sequência', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      testClient.mockHttpError('get', '/user/profile', 401, {
        success: false,
        message: 'Token expirado',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });

      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Token expirado',
      });
    });
  });

  describe('Utilitários de erro', () => {
    it('deve identificar corretamente tipos de erro', () => {
      // Arrange
      const networkError: ApiError = { status: 0, message: 'Network error', errors: {}, data: null };
      const validationError: ApiError = { status: 422, message: 'Validation error', errors: { field: ['error'] }, data: null };
      const authError: ApiError = { status: 401, message: 'Auth error', errors: {}, data: null };
      const authorizationError: ApiError = { status: 403, message: 'Authorization error', errors: {}, data: null };
      const notFoundError: ApiError = { status: 404, message: 'Not found', errors: {}, data: null };
      const serverError: ApiError = { status: 500, message: 'Server error', errors: {}, data: null };

      // Act & Assert
      expect(ApiErrorUtils.isNetworkError(networkError)).toBe(true);
      expect(ApiErrorUtils.isValidationError(validationError)).toBe(true);
      expect(ApiErrorUtils.isAuthError(authError)).toBe(true);
      expect(ApiErrorUtils.isAuthorizationError(authorizationError)).toBe(true);
      expect(ApiErrorUtils.isNotFoundError(notFoundError)).toBe(true);
      expect(ApiErrorUtils.isServerError(serverError)).toBe(true);
    });

    it('deve retornar mensagens amigáveis para diferentes tipos de erro', () => {
      // Arrange
      const networkError: ApiError = { status: 0, message: 'Network error', errors: {}, data: null };
      const serverError: ApiError = { status: 500, message: 'Server error', errors: {}, data: null };
      const notFoundError: ApiError = { status: 404, message: 'Not found', errors: {}, data: null };
      const authError: ApiError = { status: 401, message: 'Auth error', errors: {}, data: null };
      const authorizationError: ApiError = { status: 403, message: 'Authorization error', errors: {}, data: null };

      // Act & Assert
      expect(ApiErrorUtils.getFriendlyMessage(networkError)).toBe('Erro de conexão. Verifique sua internet.');
      expect(ApiErrorUtils.getFriendlyMessage(serverError)).toBe('Erro interno do servidor. Tente novamente mais tarde.');
      expect(ApiErrorUtils.getFriendlyMessage(notFoundError)).toBe('Recurso não encontrado.');
      expect(ApiErrorUtils.getFriendlyMessage(authError)).toBe('Sessão expirada. Faça login novamente.');
      expect(ApiErrorUtils.getFriendlyMessage(authorizationError)).toBe('Você não tem permissão para esta ação.');
    });

    it('deve formatar erros de validação corretamente', () => {
      // Arrange
      const validationError: ApiError = {
        status: 422,
        message: 'Validation error',
        errors: {
          name: ['Nome é obrigatório'],
          email: ['Email inválido', 'Email já está em uso'],
          password: ['Senha deve ter no mínimo 6 caracteres'],
        },
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(validationError);

      // Assert
      expect(formattedErrors).toEqual({
        name: 'Nome é obrigatório',
        email: 'Email inválido', // Deve pegar apenas o primeiro erro
        password: 'Senha deve ter no mínimo 6 caracteres',
      });
    });

    it('deve retornar objeto vazio para erros não-validação', () => {
      // Arrange
      const serverError: ApiError = { status: 500, message: 'Server error', errors: {}, data: null };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(serverError);

      // Assert
      expect(formattedErrors).toEqual({});
    });
  });

  describe('Cenários de estresse e edge cases', () => {
    it('deve tratar erro sem mensagem', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 500, {
        success: false,
        message: '',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 500,
        message: expect.any(String),
      });
    });

    it('deve tratar resposta malformada', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 500, null);

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 500,
      });
    });

    it('deve tratar erro com dados extras', async () => {
      // Arrange
      testClient.mockHttpError('get', '/boxes', 400, {
        success: false,
        message: 'Erro com dados extras',
        errors: {},
        additional_data: {
          error_code: 'BOXES_UNAVAILABLE',
          retry_after: 300,
        },
      });

      // Act & Assert
      await expect(boxService.getBoxes()).rejects.toMatchObject({
        status: 400,
        message: 'Erro com dados extras',
        data: expect.objectContaining({
          additional_data: expect.objectContaining({
            error_code: 'BOXES_UNAVAILABLE',
            retry_after: 300,
          }),
        }),
      });
    });
  });
});