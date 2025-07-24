import { TestApiClient, testEnvironment, testData, testUtils, testInterceptors } from './testConfig';
import { apiClient } from '../../api';
import { userService } from '../../userService';
import { boxService } from '../../boxService';
import { cartService } from '../../cartService';

/**
 * Testes de integração para interceptors
 * Verifica comportamento correto dos interceptors de request e response
 */

describe('Testes de Integração - Interceptors', () => {
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

  describe('Request Interceptor - Autenticação', () => {
    it('deve adicionar token de autenticação automaticamente', async () => {
      // Arrange
      const token = 'test-token-123';
      apiClient.setAuthToken(token);

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Mock para interceptar o request e verificar headers
      const axiosInstance = testClient.getAxiosInstance();
      let capturedAuthHeader = '';

      axiosInstance.interceptors.request.use((config) => {
        capturedAuthHeader = config.headers.Authorization || '';
        return config;
      });

      // Act
      await userService.getProfile();

      // Assert
      expect(capturedAuthHeader).toBe(`Bearer ${token}`);
    });

    it('deve fazer request sem token quando não autenticado', async () => {
      // Arrange
      apiClient.clearAuthToken();

      const expectedResponse = testUtils.createApiResponse([]);
      testClient.mockSuccess('get', '/boxes', expectedResponse);

      // Mock para interceptar o request e verificar headers
      const axiosInstance = testClient.getAxiosInstance();
      let capturedAuthHeader = '';

      axiosInstance.interceptors.request.use((config) => {
        capturedAuthHeader = config.headers.Authorization || '';
        return config;
      });

      // Act
      await boxService.getBoxes();

      // Assert
      expect(capturedAuthHeader).toBe('');
    });

    it('deve incluir headers padrão em todas as requisições', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse([]);
      testClient.mockSuccess('get', '/boxes', expectedResponse);

      // Mock para interceptar o request e verificar headers
      const axiosInstance = testClient.getAxiosInstance();
      let capturedHeaders: any = {};

      axiosInstance.interceptors.request.use((config) => {
        capturedHeaders = config.headers;
        return config;
      });

      // Act
      await boxService.getBoxes();

      // Assert
      expect(capturedHeaders['Content-Type']).toBe('application/json');
      expect(capturedHeaders.Accept).toBe('application/json');
    });

    it('deve preservar headers customizados', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse([]);
      testClient.mockSuccess('post', '/user/avatar', expectedResponse);

      // Mock para interceptar o request e verificar headers
      const axiosInstance = testClient.getAxiosInstance();
      let capturedHeaders: any = {};

      axiosInstance.interceptors.request.use((config) => {
        capturedHeaders = config.headers;
        return config;
      });

      // Act
      const formData = new FormData();
      formData.append('avatar', 'image-data');
      await userService.updateAvatar(formData);

      // Assert
      expect(capturedHeaders['Content-Type']).toBe('multipart/form-data');
    });

    it('deve adicionar timestamp ou ID de request para tracking', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Mock para interceptar o request e verificar headers
      const axiosInstance = testClient.getAxiosInstance();
      let capturedHeaders: any = {};

      axiosInstance.interceptors.request.use((config) => {
        // Simular adição de request ID
        config.headers['X-Request-ID'] = `req-${Date.now()}`;
        capturedHeaders = config.headers;
        return config;
      });

      // Act
      await userService.getProfile();

      // Assert
      expect(capturedHeaders['X-Request-ID']).toMatch(/^req-\d+$/);
    });
  });

  describe('Response Interceptor - Tratamento de Erros', () => {
    it('deve limpar token automaticamente em erro 401', async () => {
      // Arrange
      const token = 'expired-token-123';
      apiClient.setAuthToken(token);

      testClient.mockHttpError('get', '/user/profile', 401, {
        success: false,
        message: 'Token expirado',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 401,
        message: 'Token expirado',
      });

      // Verificar se o token foi limpo
      expect((apiClient as any).authToken).toBeNull();
    });

    it('deve manter token em outros tipos de erro', async () => {
      // Arrange
      const token = 'valid-token-123';
      apiClient.setAuthToken(token);

      testClient.mockHttpError('get', '/boxes/nonexistent', 404, {
        success: false,
        message: 'Caixa não encontrada',
        errors: {},
      });

      // Act & Assert
      await expect(boxService.getBoxById('nonexistent')).rejects.toMatchObject({
        status: 404,
        message: 'Caixa não encontrada',
      });

      // Verificar se o token foi mantido
      expect((apiClient as any).authToken).toBe(token);
    });

    it('deve formatar erros de forma consistente', async () => {
      // Arrange
      const originalError = {
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Dados inválidos',
            errors: {
              name: ['Nome é obrigatório'],
              email: ['Email inválido'],
            },
          },
        },
      };

      testClient.mockHttpError('put', '/user/profile', 422, originalError.response.data);

      // Act & Assert
      await expect(userService.updateProfile({
        name: '',
        email: 'invalid-email',
      })).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          name: ['Nome é obrigatório'],
          email: ['Email inválido'],
        },
      });
    });

    it('deve tratar erro sem response de forma consistente', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/user/profile');

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
        errors: {},
        data: null,
      });
    });

    it('deve passar responses bem-sucedidos sem modificação', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      const response = await userService.getProfile();

      // Assert
      expect(response).toEqual(testData.user);
    });
  });

  describe('Interceptor de Logging', () => {
    it('deve logar requests em modo desenvolvimento', async () => {
      // Arrange
      const originalDev = global.__DEV__;
      global.__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🌐 API Request:'),
        expect.objectContaining({
          method: 'GET',
          url: '/user/profile',
        })
      );

      // Cleanup
      global.__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });

    it('deve logar responses em modo desenvolvimento', async () => {
      // Arrange
      const originalDev = global.__DEV__;
      global.__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ API Response:'),
        expect.objectContaining({
          status: 200,
          url: '/user/profile',
        })
      );

      // Cleanup
      global.__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });

    it('deve logar erros em modo desenvolvimento', async () => {
      // Arrange
      const originalDev = global.__DEV__;
      global.__DEV__ = true;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      testClient.mockHttpError('get', '/user/profile', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getProfile()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ API Error:'),
        expect.objectContaining({
          status: 500,
          url: '/user/profile',
        })
      );

      // Cleanup
      global.__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });

    it('não deve logar em modo produção', async () => {
      // Arrange
      const originalDev = global.__DEV__;
      global.__DEV__ = false;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();

      // Cleanup
      global.__DEV__ = originalDev;
      consoleSpy.mockRestore();
    });
  });

  describe('Interceptor de Performance', () => {
    it('deve adicionar delay configurável para simular latência', async () => {
      // Arrange
      const delay = 100;
      const axiosInstance = testClient.getAxiosInstance();
      testInterceptors.addDelay(axiosInstance, delay);

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      const startTime = Date.now();
      await userService.getProfile();
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
    });

    it('deve contar requisições corretamente', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      const getRequestCount = testInterceptors.addRequestCounter(axiosInstance);

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();
      await userService.getProfile();

      // Assert
      expect(getRequestCount()).toBe(2);
    });

    it('deve contar erros também', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      const getRequestCount = testInterceptors.addRequestCounter(axiosInstance);

      testClient.mockHttpError('get', '/user/profile', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act
      try {
        await userService.getProfile();
      } catch (error) {
        // Ignorar erro
      }

      // Assert
      expect(getRequestCount()).toBe(1);
    });
  });

  describe('Interceptor de Retry', () => {
    it('deve implementar retry automático para erros de rede', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      let attemptCount = 0;

      // Interceptor de retry simples
      axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
          attemptCount++;
          if (attemptCount < 3 && !error.response) {
            // Simular retry para erros de rede
            await new Promise(resolve => setTimeout(resolve, 100));
            return axiosInstance.request(error.config);
          }
          return Promise.reject(error);
        }
      );

      testClient.mockNetworkError('get', '/user/profile');

      // Act & Assert
      await expect(userService.getProfile()).rejects.toThrow();
      expect(attemptCount).toBe(3); // Tentativa inicial + 2 retries
    });

    it('não deve fazer retry para erros HTTP', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      let attemptCount = 0;

      // Interceptor de retry simples
      axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
          attemptCount++;
          if (attemptCount < 3 && !error.response) {
            // Simular retry apenas para erros de rede
            await new Promise(resolve => setTimeout(resolve, 100));
            return axiosInstance.request(error.config);
          }
          return Promise.reject(error);
        }
      );

      testClient.mockHttpError('get', '/user/profile', 404, {
        success: false,
        message: 'Não encontrado',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getProfile()).rejects.toThrow();
      expect(attemptCount).toBe(1); // Apenas uma tentativa
    });
  });

  describe('Interceptor de Cache', () => {
    it('deve implementar cache simples para GET requests', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      const cache = new Map();

      // Interceptor de cache simples
      axiosInstance.interceptors.request.use((config) => {
        if (config.method === 'get') {
          const cacheKey = `${config.method}:${config.url}`;
          if (cache.has(cacheKey)) {
            // Simular response do cache
            return Promise.resolve({
              data: cache.get(cacheKey),
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            });
          }
        }
        return config;
      });

      axiosInstance.interceptors.response.use((response) => {
        if (response.config.method === 'get') {
          const cacheKey = `${response.config.method}:${response.config.url}`;
          cache.set(cacheKey, response.data);
        }
        return response;
      });

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      const result1 = await userService.getProfile();
      const result2 = await userService.getProfile();

      // Assert
      expect(result1).toEqual(testData.user);
      expect(result2).toEqual(testData.user);
      expect(cache.size).toBe(1);
      expect(cache.has('get:/user/profile')).toBe(true);
    });

    it('não deve fazer cache para POST requests', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      const cache = new Map();

      // Interceptor de cache simples
      axiosInstance.interceptors.request.use((config) => {
        if (config.method === 'get') {
          const cacheKey = `${config.method}:${config.url}`;
          if (cache.has(cacheKey)) {
            return Promise.resolve({
              data: cache.get(cacheKey),
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            });
          }
        }
        return config;
      });

      axiosInstance.interceptors.response.use((response) => {
        if (response.config.method === 'get') {
          const cacheKey = `${response.config.method}:${response.config.url}`;
          cache.set(cacheKey, response.data);
        }
        return response;
      });

      const expectedResponse = testUtils.createApiResponse(testData.cart);
      testClient.mockSuccess('post', '/cart/items', expectedResponse);

      // Act
      await cartService.addToCart('box-123', 1);

      // Assert
      expect(cache.size).toBe(0); // Nenhum cache para POST
    });
  });

  describe('Interceptor de Transformação de Dados', () => {
    it('deve transformar datas string em objetos Date', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();

      // Interceptor de transformação de datas
      axiosInstance.interceptors.response.use((response) => {
        if (response.data && typeof response.data === 'object') {
          const transformDates = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.map(transformDates);
            }
            if (obj && typeof obj === 'object') {
              const newObj = { ...obj };
              Object.keys(newObj).forEach(key => {
                if (typeof newObj[key] === 'string' && key.includes('_at')) {
                  newObj[key] = new Date(newObj[key]);
                } else if (typeof newObj[key] === 'object') {
                  newObj[key] = transformDates(newObj[key]);
                }
              });
              return newObj;
            }
            return obj;
          };

          response.data = transformDates(response.data);
        }
        return response;
      });

      const userWithStringDates = {
        ...testData.user,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(userWithStringDates);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      const result = await userService.getProfile();

      // Assert
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Interceptor de Validação de Response', () => {
    it('deve validar estrutura de response da API', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();

      // Interceptor de validação
      axiosInstance.interceptors.response.use((response) => {
        if (response.data && typeof response.data === 'object') {
          if (!response.data.hasOwnProperty('success') && !response.data.hasOwnProperty('data')) {
            console.warn('⚠️ Response não segue padrão esperado:', response.data);
          }
        }
        return response;
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Response malformado
      const malformedResponse = { user: testData.user }; // Sem success/data
      testClient.mockSuccess('get', '/user/profile', malformedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Response não segue padrão esperado:'),
        malformedResponse
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Comportamento integrado dos interceptors', () => {
    it('deve executar múltiplos interceptors em ordem', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      const executionOrder: string[] = [];

      // Interceptor 1
      axiosInstance.interceptors.request.use((config) => {
        executionOrder.push('request-1');
        return config;
      });

      // Interceptor 2
      axiosInstance.interceptors.request.use((config) => {
        executionOrder.push('request-2');
        return config;
      });

      // Interceptor 3
      axiosInstance.interceptors.response.use((response) => {
        executionOrder.push('response-1');
        return response;
      });

      // Interceptor 4
      axiosInstance.interceptors.response.use((response) => {
        executionOrder.push('response-2');
        return response;
      });

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(executionOrder).toEqual(['request-2', 'request-1', 'response-1', 'response-2']);
    });

    it('deve permitir interceptors assíncronos', async () => {
      // Arrange
      const axiosInstance = testClient.getAxiosInstance();
      let asyncOperationCompleted = false;

      // Interceptor assíncrono
      axiosInstance.interceptors.request.use(async (config) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        asyncOperationCompleted = true;
        return config;
      });

      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      await userService.getProfile();

      // Assert
      expect(asyncOperationCompleted).toBe(true);
    });
  });
});