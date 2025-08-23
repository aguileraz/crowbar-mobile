 
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import logger from '../../loggerService';

/**
 * Configuração de ambiente de testes de integração
 * Configura mocks, interceptors e ambientes isolados para testes
 */

// Mock URLs para diferentes ambientes
export const TEST_URLS = {
  API_BASE: 'https://test-api.crowbar.com/api/v1',
  STAGING_API: 'https://crowbar-backend-staging.azurewebsites.net/api/v1',
  MOCK_SERVER: 'http://localhost:3001/api/v1',
};

// Configuração de timeout para testes
export const TEST_TIMEOUT = 10000;

/**
 * Configuração de mock adapter para testes isolados
 */
export class TestApiClient {
  private mockAdapter: MockAdapter;
  private originalClient: AxiosInstance;
  
  constructor() {
    // Criar instância isolada do axios para testes
    this.originalClient = axios.create({
      baseURL: TEST_URLS.API_BASE,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    this.mockAdapter = new MockAdapter(this.originalClient);
  }
  
  /**
   * Configurar mock para resposta bem-sucedida
   */
  mockSuccess(method: string, url: string, response: any, _status: number = 200) {
    if (method.toLowerCase() === 'post') {
      this.mockAdapter.onPost(url).reply(_status, response);
    } else if (method.toLowerCase() === 'get') {
      this.mockAdapter.onGet(url).reply(_status, response);
    } else if (method.toLowerCase() === 'put') {
      this.mockAdapter.onPut(url).reply(_status, response);
    } else if (method.toLowerCase() === 'delete') {
      this.mockAdapter.onDelete(url).reply(_status, response);
    } else {
      this.mockAdapter.onAny().reply(_status, response);
    }
  }
  
  /**
   * Configurar mock para erro de rede
   */
  mockNetworkError(method: string, url: string) {
    if (method.toLowerCase() === 'post') {
      this.mockAdapter.onPost(url).networkError();
    } else if (method.toLowerCase() === 'get') {
      this.mockAdapter.onGet(url).networkError();
    } else {
      this.mockAdapter.onAny().networkError();
    }
  }
  
  /**
   * Configurar mock para timeout
   */
  mockTimeout(method: string, url: string) {
    if (method.toLowerCase() === 'post') {
      this.mockAdapter.onPost(url).timeout();
    } else if (method.toLowerCase() === 'get') {
      this.mockAdapter.onGet(url).timeout();
    } else {
      this.mockAdapter.onAny().timeout();
    }
  }
  
  /**
   * Configurar mock para erro HTTP
   */
  mockHttpError(method: string, url: string, _status: number, response?: any) {
    if (method.toLowerCase() === 'post') {
      this.mockAdapter.onPost(url).reply(_status, response);
    } else if (method.toLowerCase() === 'get') {
      this.mockAdapter.onGet(url).reply(_status, response);
    } else {
      this.mockAdapter.onAny().reply(_status, response);
    }
  }
  
  /**
   * Limpar todos os mocks
   */
  clearMocks() {
    this.mockAdapter.reset();
  }
  
  /**
   * Resetar histórico de requisições
   */
  resetHistory() {
    this.mockAdapter.resetHistory();
  }
  
  /**
   * Obter histórico de requisições
   */
  getHistory() {
    return this.mockAdapter.history;
  }
  
  /**
   * Obter instância do mock adapter
   */
  getMockAdapter() {
    return this.mockAdapter;
  }
  
  /**
   * Obter instância do axios
   */
  getAxiosInstance() {
    return this.originalClient;
  }
}

/**
 * Configuração de ambiente de teste
 */
export const testEnvironment = {
  // Configurar ambiente de testes
  setup: () => {
    // Configurar variáveis de ambiente para testes
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = TEST_URLS.API_BASE;
    process.env.API_TIMEOUT = TEST_TIMEOUT.toString();
    
    // Silenciar logs em testes
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  },
  
  // Limpar ambiente após testes
  teardown: () => {
    // Restaurar console
    jest.restoreAllMocks();
    
    // Limpar variáveis de ambiente
    delete process.env.NODE_ENV;
    delete process.env.API_BASE_URL;
    delete process.env.API_TIMEOUT;
  },
};

/**
 * Dados de teste padrão
 */
export const testData = {
  // Usuário de teste
  user: {
    id: 'user-test-123',
    email: 'test@crowbar.com',
    name: 'Usuário Teste',
    phone: '(11) 99999-9999',
    avatar_url: 'https://test.com/avatar.jpg',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  
  // Token de autenticação
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
  
  // Caixa misteriosa de teste
  mysteryBox: {
    id: 'box-test-123',
    name: 'Caixa Teste',
    description: 'Caixa para testes',
    price: 29.99,
    category: 'electronics',
    image_url: 'https://test.com/box.jpg',
    items_count: 5,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  
  // Item de carrinho
  cartItem: {
    id: 'cart-item-123',
    mystery_box_id: 'box-test-123',
    quantity: 2,
    price: 29.99,
    total: 59.98,
    mystery_box: {
      id: 'box-test-123',
      name: 'Caixa Teste',
      price: 29.99,
      image_url: 'https://test.com/box.jpg',
    },
  },
  
  // Pedido de teste
  order: {
    id: 'order-test-123',
    order_number: 'ORD-2025-001',
    status: 'pending',
    total: 59.98,
    items: [
      {
        id: 'item-123',
        mystery_box_id: 'box-test-123',
        quantity: 2,
        price: 29.99,
        total: 59.98,
      },
    ],
    created_at: '2025-01-01T00:00:00Z',
  },
  
  // Endereço de teste
  address: {
    id: 'address-test-123',
    street: 'Rua Teste',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    is_default: true,
  },
  
  // Erro de validação
  validationError: {
    status: 422,
    message: 'Dados inválidos',
    errors: {
      email: ['Email é obrigatório'],
      password: ['Senha deve ter no mínimo 6 caracteres'],
    },
  },
  
  // Erro de autenticação
  authError: {
    status: 401,
    message: 'Token inválido ou expirado',
    errors: {},
  },
  
  // Erro de servidor
  serverError: {
    status: 500,
    message: 'Erro interno do servidor',
    errors: {},
  },
};

/**
 * Configuração de interceptors para testes
 */
export const testInterceptors = {
  // Interceptor de request para adicionar token
  addAuthToken: (client: AxiosInstance, token: string) => {
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  },
  
  // Interceptor de request para simular latência
  addDelay: (client: AxiosInstance, delay: number = 100) => {
    client.interceptors.request.use(async (config) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return config;
    });
  },
  
  // Interceptor de response para contar requisições
  addRequestCounter: (client: AxiosInstance) => {
    let requestCount = 0;
    
    client.interceptors.response.use(
      (_response) => {
        requestCount++;
        (response as any).requestCount = requestCount;
        return response;
      },
      (error) => {
        requestCount++;
        error.requestCount = requestCount;
        return Promise.reject(error);
      }
    );
    
    return () => requestCount;
  },
};

/**
 * Utilitários para testes
 */
export const testUtils = {
  // Aguardar por condição
  waitFor: (condition: () => boolean, timeout: number = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout aguardando condição'));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  },
  
  // Simular resposta paginada
  createPaginatedResponse: (data: any[], page: number = 1, perPage: number = 10) => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = data.slice(start, end);
    
    return {
      data: items,
      meta: {
        current_page: page,
        per_page: perPage,
        total: data.length,
        total_pages: Math.ceil(data.length / perPage),
        from: start + 1,
        to: Math.min(end, data.length),
      },
    };
  },
  
  // Criar response padrão da API
  createApiResponse: (data: any, success: boolean = true, message?: string) => {
    return {
      success,
      data,
      message: message || (success ? 'Operação realizada com sucesso' : 'Erro na operação'),
    };
  },
  
  // Verificar se token é válido
  isValidToken: (token: string): boolean => {
    return token && token.startsWith('eyJ') && token.split('.').length === 3;
  },
  
  // Simular erro de rede
  createNetworkError: () => {
    const error = new Error('Erro de rede');
    (error as any).code = 'NETWORK_ERROR';
    return error;
  },
  
  // Simular timeout
  createTimeoutError: () => {
    const error = new Error('Timeout');
    (error as any).code = 'ECONNABORTED';
    return error;
  },
};

/**
 * Configuração de servidor de teste (para E2E)
 */
export const testServer = {
  // Inicializar servidor de testes
  start: async (port: number = 3001) => {
    // Implementar servidor mock para testes E2E
    logger.debug(`🧪 Servidor de testes iniciado na porta ${port}`);
  },
  
  // Parar servidor de testes
  stop: async () => {
    logger.debug('🧪 Servidor de testes parado');
  },
  
  // Configurar rotas do servidor
  setupRoutes: (routes: any) => {
    logger.debug('🧪 Rotas configuradas:', Object.keys(routes));
  },
};

export default {
  TestApiClient,
  testEnvironment,
  testData,
  testInterceptors,
  testUtils,
  testServer,
};