import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { ApiResponse } from '../types/api';

/**
 * Cliente HTTP para comunicação com o Crowbar Backend
 * Configurado com interceptors para autenticação, logging e tratamento de erros
 */

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: env.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configurar interceptors para request e response
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Adicionar token de autenticação se disponível
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Log da requisição em desenvolvimento
        if (__DEV__) {
          console.log('🌐 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // Log da resposta em desenvolvimento
        if (__DEV__) {
          console.log('✅ API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }

        return response;
      },
      (error) => {
        // Log do erro
        console.error('❌ API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        // Tratamento específico de erros
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          this.clearAuthToken();
          // TODO: Redirecionar para login ou renovar token
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Formatar erro para um formato consistente
   */
  private formatError(error: any): ApiError {
    const response = error.response;
    
    if (response) {
      return {
        status: response.status,
        message: response.data?.message || 'Erro na requisição',
        errors: response.data?.errors || {},
        data: response.data,
      };
    }

    // Erro de rede ou timeout
    return {
      status: 0,
      message: error.message || 'Erro de conexão',
      errors: {},
      data: null,
    };
  }

  /**
   * Definir token de autenticação
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Limpar token de autenticação
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Métodos HTTP genéricos
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload de arquivo
   */
  async upload<T = any>(url: string, file: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const uploadConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await this.client.post<ApiResponse<T>>(url, file, uploadConfig);
    return response.data;
  }

  /**
   * Download de arquivo
   */
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const downloadConfig = {
      ...config,
      responseType: 'blob' as const,
    };

    const response = await this.client.get(url, downloadConfig);
    return response.data;
  }

  /**
   * Cancelar requisições pendentes
   */
  cancelPendingRequests(): void {
    // TODO: Implementar cancelamento de requisições
    console.log('🚫 Cancelling pending requests...');
  }

  /**
   * Verificar conectividade
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter instância do Axios para uso avançado
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

/**
 * Interface para erros da API
 */
export interface ApiError {
  status: number;
  message: string;
  errors: Record<string, string[]>;
  data: any;
}

/**
 * Instância singleton do cliente API
 */
export const apiClient = new ApiClient();

/**
 * Hook para usar o cliente API em componentes
 */
export const useApiClient = () => {
  return apiClient;
};

/**
 * Utilitários para tratamento de erros
 */
export const ApiErrorUtils = {
  /**
   * Verificar se é erro de validação
   */
  isValidationError(error: ApiError): boolean {
    return error.status === 422;
  },

  /**
   * Verificar se é erro de autenticação
   */
  isAuthError(error: ApiError): boolean {
    return error.status === 401;
  },

  /**
   * Verificar se é erro de autorização
   */
  isAuthorizationError(error: ApiError): boolean {
    return error.status === 403;
  },

  /**
   * Verificar se é erro de não encontrado
   */
  isNotFoundError(error: ApiError): boolean {
    return error.status === 404;
  },

  /**
   * Verificar se é erro de servidor
   */
  isServerError(error: ApiError): boolean {
    return error.status >= 500;
  },

  /**
   * Verificar se é erro de rede
   */
  isNetworkError(error: ApiError): boolean {
    return error.status === 0;
  },

  /**
   * Obter mensagem de erro amigável
   */
  getFriendlyMessage(error: ApiError): string {
    if (this.isNetworkError(error)) {
      return 'Erro de conexão. Verifique sua internet.';
    }

    if (this.isServerError(error)) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }

    if (this.isNotFoundError(error)) {
      return 'Recurso não encontrado.';
    }

    if (this.isAuthError(error)) {
      return 'Sessão expirada. Faça login novamente.';
    }

    if (this.isAuthorizationError(error)) {
      return 'Você não tem permissão para esta ação.';
    }

    return error.message || 'Erro desconhecido.';
  },

  /**
   * Obter erros de validação formatados
   */
  getValidationErrors(error: ApiError): Record<string, string> {
    if (!this.isValidationError(error)) {
      return {};
    }

    const formattedErrors: Record<string, string> = {};
    
    Object.entries(error.errors).forEach(([field, messages]) => {
      formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages;
    });

    return formattedErrors;
  },
};

export default apiClient;
