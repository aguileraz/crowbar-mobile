import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { analyticsService } from './analyticsService';

/**
 * Cliente HTTP para comunicação com a API
 */
class HttpClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: env.API_URL,
      timeout: env.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configurar interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        // Adicionar timestamp para rastreamento de performance
        (config as any).metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (_response) => {
        // Rastrear latência da API
        const config = _response.config as any;
        if (config.metadata?.startTime) {
          const responseTime = Date.now() - config.metadata.startTime;
          const endpoint = config.url || 'unknown';
          const method = config.method?.toUpperCase() || 'GET';
          
          // Rastrear no analytics
          analyticsService.trackApiLatency(
            endpoint,
            method,
            responseTime,
            _response.status
          );
          
          // Rastrear chamada da API para métricas gerais
          analyticsService.trackApiCall(
            endpoint,
            method,
            config.metadata.startTime
          );
        }
        
        return _response;
      },
      (error) => {
        // Rastrear erro
        if (error.config) {
          const config = error.config as any;
          const responseTime = config.metadata?.startTime ? 
            Date.now() - config.metadata.startTime : 0;
          const endpoint = config.url || 'unknown';
          const method = config.method?.toUpperCase() || 'GET';
          const _status = error.response?.status || 0;
          
          // Rastrear latência mesmo em caso de erro
          analyticsService.trackApiLatency(
            endpoint,
            method,
            responseTime,
            _status
          );
          
          // Rastrear erro específico
          analyticsService.trackError(
            new Error(`API Error: ${_status} ${endpoint}`),
            'http_client'
          );
        }
        
        // Tratar erros de autenticação
        if (error.response?.status === 401) {
          this.authToken = null;
          // Aqui poderia disparar um evento para logout
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Definir token de autenticação
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Requisição GET
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  /**
   * Requisição POST
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  /**
   * Requisição PUT
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  /**
   * Requisição PATCH
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  /**
   * Requisição DELETE
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

export const httpClient = new HttpClient();
export default httpClient;