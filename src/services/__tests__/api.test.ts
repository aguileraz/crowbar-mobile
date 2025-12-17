/**
 * Testes para ApiClient service
 * Wrapper HTTP cliente com Axios e interceptors
 */

import axios from 'axios';
import { ApiError, ApiErrorUtils } from '../api';
import logger from '../loggerService';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do logger
jest.mock('../loggerService', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock do env
jest.mock('../../config/env', () => ({
  env: {
    API_BASE_URL: 'https://api.test.com',
    API_TIMEOUT: 10000,
  },
}));

describe('ApiClient', () => {
  let mockAxiosInstance: any;
  let requestInterceptorOnFulfilled: any;
  let requestInterceptorOnRejected: any;
  let responseInterceptorOnFulfilled: any;
  let responseInterceptorOnRejected: any;
  let originalDEV: boolean;
  let apiClient: any;

  beforeEach(() => {
    // Limpar módulo para forçar nova importação
    jest.resetModules();

    // Salvar valor original de __DEV__
    originalDEV = (global as any).__DEV__;

    // Limpar mocks
    jest.clearAllMocks();

    // Criar mock da instância do Axios
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            requestInterceptorOnFulfilled = onFulfilled;
            requestInterceptorOnRejected = onRejected;
            return 0;
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            responseInterceptorOnFulfilled = onFulfilled;
            responseInterceptorOnRejected = onRejected;
            return 0;
          }),
        },
      },
    };

    // Configurar axios.create para retornar a instância mock
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    // Importar apiClient após configurar mocks
    const apiModule = require('../api');
    apiClient = apiModule.apiClient;
  });

  afterEach(() => {
    // Restaurar valor original de __DEV__
    (global as any).__DEV__ = originalDEV;
  });

  describe('1. Inicialização e Configuração', () => {
    it('deve criar instância do Axios com baseURL correto', () => {
      // Verificar
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.test.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    });

    it('deve configurar headers padrão corretamente', () => {
      // Verificar
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
      );
    });

    it('deve configurar timeout corretamente', () => {
      // Verificar
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('deve configurar interceptors no construtor', () => {
      // Verificar
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('2. Métodos HTTP', () => {
    it('deve executar GET request com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: { id: '123', name: 'Test Box' },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.get('/boxes/123');

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/boxes/123', undefined);
    });

    it('deve executar POST request com dados', async () => {
      // Arrange
      const mockData = { name: 'New Box', price: 99.99 };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '456', ...mockData },
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.post('/boxes', mockData);

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/boxes', mockData, undefined);
    });

    it('deve executar PUT request com dados', async () => {
      // Arrange
      const mockData = { name: 'Updated Box', price: 149.99 };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '123', ...mockData },
        },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.put('/boxes/123', mockData);

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/boxes/123', mockData, undefined);
    });

    it('deve executar PATCH request com dados', async () => {
      // Arrange
      const mockData = { price: 129.99 };
      const mockResponse = {
        data: {
          success: true,
          data: { id: '123', price: 129.99 },
        },
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.patch('/boxes/123', mockData);

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/boxes/123', mockData, undefined);
    });

    it('deve executar DELETE request com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          message: 'Box deleted successfully',
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.delete('/boxes/123');

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/boxes/123', undefined);
    });

    it('deve retornar response.data de todos os métodos', async () => {
      // Arrange
      const mockResponse = {
        data: { success: true, data: { test: 'value' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      mockAxiosInstance.put.mockResolvedValue(mockResponse);
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      // Act & Assert
      expect(await apiClient.get('/test')).toEqual(mockResponse.data);
      expect(await apiClient.post('/test', {})).toEqual(mockResponse.data);
      expect(await apiClient.put('/test', {})).toEqual(mockResponse.data);
      expect(await apiClient.patch('/test', {})).toEqual(mockResponse.data);
      expect(await apiClient.delete('/test')).toEqual(mockResponse.data);
    });

    it('deve passar config customizado para Axios em GET', async () => {
      // Arrange
      const mockResponse = { data: { success: true } };
      const customConfig = {
        headers: { 'Custom-Header': 'value' },
        timeout: 5000,
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      await apiClient.get('/test', customConfig);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', customConfig);
    });

    it('deve passar config customizado para Axios em POST', async () => {
      // Arrange
      const mockResponse = { data: { success: true } };
      const customConfig = {
        headers: { 'Custom-Header': 'value' },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      await apiClient.post('/test', {}, customConfig);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', {}, customConfig);
    });

    it('deve tratar erros em requisições', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(apiClient.get('/test')).rejects.toThrow();
    });
  });

  describe('3. Request Interceptor', () => {
    it('deve adicionar token de autorização quando token está definido', async () => {
      // Arrange
      const mockConfig = {
        headers: {},
        url: '/test',
      };
      apiClient.setAuthToken('test-token-123');

      // Act
      const result = await requestInterceptorOnFulfilled(mockConfig);

      // Assert
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('não deve adicionar Authorization header quando token não está definido', async () => {
      // Arrange
      const mockConfig = {
        headers: {},
        url: '/test',
      };
      apiClient.clearAuthToken();

      // Act
      const result = await requestInterceptorOnFulfilled(mockConfig);

      // Assert
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('deve logar requisição em modo desenvolvimento', async () => {
      // Arrange
      (global as any).__DEV__ = true;
      jest.resetModules();
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      const apiModule = require('../api');
      const devApiClient = apiModule.apiClient;

      const mockConfig = {
        method: 'post',
        url: '/boxes',
        data: { name: 'Test Box' },
        params: { filter: 'active' },
        headers: {},
      };

      // Act
      await requestInterceptorOnFulfilled(mockConfig);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('🌐 API Request:', {
        method: 'POST',
        url: '/boxes',
        data: { name: 'Test Box' },
        params: { filter: 'active' },
      });
    });

    it('não deve logar requisição em modo produção', async () => {
      // Arrange
      (global as any).__DEV__ = false;
      jest.resetModules();
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      const apiModule = require('../api');
      const prodApiClient = apiModule.apiClient;
      jest.clearAllMocks();

      const mockConfig = {
        method: 'get',
        url: '/boxes',
        headers: {},
      };

      // Act
      await requestInterceptorOnFulfilled(mockConfig);

      // Assert
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('deve tratar erro no request interceptor', async () => {
      // Arrange
      const mockError = new Error('Interceptor error');

      // Act
      const result = requestInterceptorOnRejected(mockError);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('❌ Request Error:', mockError);
      await expect(result).rejects.toThrow('Interceptor error');
    });
  });

  describe('4. Response Interceptor', () => {
    it('deve logar resposta em modo desenvolvimento', async () => {
      // Arrange
      (global as any).__DEV__ = true;
      jest.resetModules();
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      const apiModule = require('../api');
      jest.clearAllMocks();

      const mockResponse = {
        status: 200,
        config: { url: '/boxes' },
        data: { success: true, data: [] },
      };

      // Act
      await responseInterceptorOnFulfilled(mockResponse);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('✅ API Response:', {
        status: 200,
        url: '/boxes',
        data: { success: true, data: [] },
      });
    });

    it('não deve logar resposta em modo produção', async () => {
      // Arrange
      (global as any).__DEV__ = false;
      jest.resetModules();
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      const apiModule = require('../api');
      jest.clearAllMocks();

      const mockResponse = {
        status: 200,
        config: { url: '/boxes' },
        data: { success: true },
      };

      // Act
      await responseInterceptorOnFulfilled(mockResponse);

      // Assert
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('deve limpar token de autenticação em erro 401', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: { url: '/protected' },
        message: 'Request failed',
      };
      apiClient.setAuthToken('test-token');

      // Act
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        // Ignorar erro esperado
      }

      // Assert - verifica que o token foi limpo
      const testConfig = { headers: {} };
      await requestInterceptorOnFulfilled(testConfig);
      expect(testConfig.headers.Authorization).toBeUndefined();
    });

    it('deve formatar erro com resposta do servidor', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 422,
          data: {
            message: 'Validation error',
            errors: { email: ['Email is required'] },
          },
        },
        config: { url: '/users' },
        message: 'Request failed',
      };

      // Act
      let formattedError: ApiError | undefined;
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        formattedError = error as ApiError;
      }

      // Assert
      expect(formattedError).toEqual({
        status: 422,
        message: 'Validation error',
        errors: { email: ['Email is required'] },
        data: mockError.response.data,
      });
    });

    it('deve formatar erro de rede (sem resposta)', async () => {
      // Arrange
      const mockError = {
        message: 'Network Error',
        config: { url: '/boxes' },
      };

      // Act
      let formattedError: ApiError | undefined;
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        formattedError = error as ApiError;
      }

      // Assert
      expect(formattedError).toEqual({
        status: 0,
        message: 'Network Error',
        errors: {},
        data: null,
      });
    });

    it('deve formatar erro de timeout', async () => {
      // Arrange
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        config: { url: '/slow-endpoint' },
      };

      // Act
      let formattedError: ApiError | undefined;
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        formattedError = error as ApiError;
      }

      // Assert
      expect(formattedError).toEqual({
        status: 0,
        message: 'timeout of 10000ms exceeded',
        errors: {},
        data: null,
      });
    });

    it('deve logar erro antes de formatá-lo', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
        config: { url: '/error' },
        message: 'Server error',
      };

      // Act
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        // Ignorar erro esperado
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith('❌ API Error:', {
        status: 500,
        url: '/error',
        message: 'Server error',
        data: { message: 'Internal Server Error' },
      });
    });

    it('deve usar mensagem padrão se resposta não tiver message', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 400,
          data: {},
        },
        config: { url: '/bad-request' },
        message: 'Request failed',
      };

      // Act
      let formattedError: ApiError | undefined;
      try {
        await responseInterceptorOnRejected(mockError);
      } catch (error) {
        formattedError = error as ApiError;
      }

      // Assert
      expect(formattedError?.message).toBe('Erro na requisição');
    });
  });

  describe('5. Gerenciamento de Token', () => {
    it('deve definir token de autenticação', () => {
      // Act
      apiClient.setAuthToken('new-token-456');

      // Assert
      const testConfig = { headers: {} };
      requestInterceptorOnFulfilled(testConfig);
      expect(testConfig.headers.Authorization).toBe('Bearer new-token-456');
    });

    it('deve limpar token de autenticação', () => {
      // Arrange
      apiClient.setAuthToken('token-to-clear');

      // Act
      apiClient.clearAuthToken();

      // Assert
      const testConfig = { headers: {} };
      requestInterceptorOnFulfilled(testConfig);
      expect(testConfig.headers.Authorization).toBeUndefined();
    });

    it('deve adicionar token a requisições subsequentes', async () => {
      // Arrange
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      apiClient.setAuthToken('persistent-token');

      const testConfig = { headers: {}, url: '/protected' };

      // Act
      await requestInterceptorOnFulfilled(testConfig);

      // Assert
      expect(testConfig.headers.Authorization).toBe('Bearer persistent-token');
    });

    it('não deve adicionar token após limpeza', async () => {
      // Arrange
      apiClient.setAuthToken('token-to-remove');
      apiClient.clearAuthToken();

      // Act
      const testConfig = { headers: {} };
      await requestInterceptorOnFulfilled(testConfig);

      // Assert
      expect(testConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('6. Upload e Download', () => {
    it('deve fazer upload de arquivo com FormData', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('file', 'test-file-content');
      const mockResponse = {
        data: {
          success: true,
          data: { url: 'https://cdn.example.com/file.jpg' },
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.upload('/upload', formData);

      // Assert
      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload',
        formData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
    });

    it('deve definir Content-Type multipart/form-data no upload', async () => {
      // Arrange
      const formData = new FormData();
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      await apiClient.upload('/upload', formData);

      // Assert
      const callConfig = mockAxiosInstance.post.mock.calls[0][2];
      expect(callConfig.headers['Content-Type']).toBe('multipart/form-data');
    });

    it('deve fazer download de arquivo como Blob', async () => {
      // Arrange
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.download('/download/file.pdf');

      // Assert
      expect(result).toBe(mockBlob);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/download/file.pdf',
        expect.objectContaining({
          responseType: 'blob',
        })
      );
    });

    it('deve retornar Blob do download', async () => {
      // Arrange
      const mockBlob = new Blob(['test data']);
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.download('/file.pdf');

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result).toBe(mockBlob);
    });

    it('deve mesclar config customizado no upload', async () => {
      // Arrange
      const formData = new FormData();
      const customConfig = {
        headers: { 'X-Custom': 'value' },
        timeout: 30000,
      };
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      // Act
      await apiClient.upload('/upload', formData, customConfig);

      // Assert
      const callConfig = mockAxiosInstance.post.mock.calls[0][2];
      expect(callConfig.headers['Content-Type']).toBe('multipart/form-data');
      expect(callConfig.headers['X-Custom']).toBe('value');
      expect(callConfig.timeout).toBe(30000);
    });
  });

  describe('7. Utilitários', () => {
    it('deve verificar conectividade com sucesso', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      // Act
      const result = await apiClient.checkConnectivity();

      // Assert
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('deve verificar conectividade com falha', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await apiClient.checkConnectivity();

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar instância do Axios', () => {
      // Act
      const axiosInstance = apiClient.getAxiosInstance();

      // Assert
      expect(axiosInstance).toBe(mockAxiosInstance);
    });

    it('deve cancelar requisições pendentes e logar', () => {
      // Act
      apiClient.cancelPendingRequests();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('🚫 Cancelling pending requests...');
    });
  });

  describe('8. ApiErrorUtils - Verificadores de Tipo de Erro', () => {
    it('deve identificar erro de validação (422)', () => {
      // Arrange
      const validationError: ApiError = {
        status: 422,
        message: 'Validation failed',
        errors: { email: ['Email is required'] },
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isValidationError(validationError)).toBe(true);
    });

    it('deve identificar erro de autenticação (401)', () => {
      // Arrange
      const authError: ApiError = {
        status: 401,
        message: 'Unauthorized',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isAuthError(authError)).toBe(true);
    });

    it('deve identificar erro de autorização (403)', () => {
      // Arrange
      const authorizationError: ApiError = {
        status: 403,
        message: 'Forbidden',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isAuthorizationError(authorizationError)).toBe(true);
    });

    it('deve identificar erro de não encontrado (404)', () => {
      // Arrange
      const notFoundError: ApiError = {
        status: 404,
        message: 'Not Found',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isNotFoundError(notFoundError)).toBe(true);
    });

    it('deve identificar erro de servidor (500+)', () => {
      // Arrange
      const serverError500: ApiError = {
        status: 500,
        message: 'Internal Server Error',
        errors: {},
        data: null,
      };
      const serverError503: ApiError = {
        status: 503,
        message: 'Service Unavailable',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isServerError(serverError500)).toBe(true);
      expect(ApiErrorUtils.isServerError(serverError503)).toBe(true);
    });

    it('deve identificar erro de rede (status 0)', () => {
      // Arrange
      const networkError: ApiError = {
        status: 0,
        message: 'Network Error',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isNetworkError(networkError)).toBe(true);
    });

    it('não deve identificar falsamente tipos de erro', () => {
      // Arrange
      const badRequestError: ApiError = {
        status: 400,
        message: 'Bad Request',
        errors: {},
        data: null,
      };

      // Act & Assert
      expect(ApiErrorUtils.isValidationError(badRequestError)).toBe(false);
      expect(ApiErrorUtils.isAuthError(badRequestError)).toBe(false);
      expect(ApiErrorUtils.isAuthorizationError(badRequestError)).toBe(false);
      expect(ApiErrorUtils.isNotFoundError(badRequestError)).toBe(false);
      expect(ApiErrorUtils.isServerError(badRequestError)).toBe(false);
      expect(ApiErrorUtils.isNetworkError(badRequestError)).toBe(false);
    });
  });

  describe('9. ApiErrorUtils - Mensagens Amigáveis', () => {
    it('deve retornar mensagem amigável para erro de rede', () => {
      // Arrange
      const networkError: ApiError = {
        status: 0,
        message: 'Network Error',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(networkError);

      // Assert
      expect(message).toBe('Erro de conexão. Verifique sua internet.');
    });

    it('deve retornar mensagem amigável para erro de servidor', () => {
      // Arrange
      const serverError: ApiError = {
        status: 500,
        message: 'Internal Server Error',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(serverError);

      // Assert
      expect(message).toBe('Erro interno do servidor. Tente novamente mais tarde.');
    });

    it('deve retornar mensagem amigável para erro não encontrado', () => {
      // Arrange
      const notFoundError: ApiError = {
        status: 404,
        message: 'Not Found',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(notFoundError);

      // Assert
      expect(message).toBe('Recurso não encontrado.');
    });

    it('deve retornar mensagem amigável para erro de autenticação', () => {
      // Arrange
      const authError: ApiError = {
        status: 401,
        message: 'Unauthorized',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(authError);

      // Assert
      expect(message).toBe('Sessão expirada. Faça login novamente.');
    });

    it('deve retornar mensagem amigável para erro de autorização', () => {
      // Arrange
      const authorizationError: ApiError = {
        status: 403,
        message: 'Forbidden',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(authorizationError);

      // Assert
      expect(message).toBe('Você não tem permissão para esta ação.');
    });

    it('deve retornar mensagem do erro para outros casos', () => {
      // Arrange
      const customError: ApiError = {
        status: 400,
        message: 'Custom error message',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(customError);

      // Assert
      expect(message).toBe('Custom error message');
    });

    it('deve retornar mensagem padrão quando erro não tem mensagem', () => {
      // Arrange
      const errorWithoutMessage: ApiError = {
        status: 400,
        message: '',
        errors: {},
        data: null,
      };

      // Act
      const message = ApiErrorUtils.getFriendlyMessage(errorWithoutMessage);

      // Assert
      expect(message).toBe('Erro desconhecido.');
    });
  });

  describe('10. ApiErrorUtils - Erros de Validação Formatados', () => {
    it('deve formatar erros de validação corretamente', () => {
      // Arrange
      const validationError: ApiError = {
        status: 422,
        message: 'Validation failed',
        errors: {
          email: ['Email is required', 'Email must be valid'],
          password: ['Password must be at least 8 characters'],
        },
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(validationError);

      // Assert
      expect(formattedErrors).toEqual({
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      });
    });

    it('deve retornar primeira mensagem de array de erros', () => {
      // Arrange
      const validationError: ApiError = {
        status: 422,
        message: 'Validation failed',
        errors: {
          name: ['Name is required', 'Name must be at least 3 characters', 'Name is invalid'],
        },
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(validationError);

      // Assert
      expect(formattedErrors.name).toBe('Name is required');
    });

    it('deve retornar objeto vazio para erro não-validação', () => {
      // Arrange
      const notValidationError: ApiError = {
        status: 500,
        message: 'Server error',
        errors: {
          field: ['Some error'],
        },
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(notValidationError);

      // Assert
      expect(formattedErrors).toEqual({});
    });

    it('deve lidar com erros vazios', () => {
      // Arrange
      const validationError: ApiError = {
        status: 422,
        message: 'Validation failed',
        errors: {},
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(validationError);

      // Assert
      expect(formattedErrors).toEqual({});
    });

    it('deve lidar com mensagens de erro que não são arrays', () => {
      // Arrange - TypeScript permite any, então precisamos testar edge cases
      const validationError: ApiError = {
        status: 422,
        message: 'Validation failed',
        errors: {
          field1: ['Array message'] as any,
          field2: 'String message' as any,
        },
        data: null,
      };

      // Act
      const formattedErrors = ApiErrorUtils.getValidationErrors(validationError);

      // Assert
      expect(formattedErrors.field1).toBe('Array message');
      expect(formattedErrors.field2).toBe('String message');
    });
  });
});
