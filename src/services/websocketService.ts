import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { WebSocketEvent, BoxOpenedEvent } from '../types/api';
import logger from './loggerService';

/**
 * Serviço WebSocket para comunicação em tempo real
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private authToken: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Conectar ao servidor WebSocket
   */
  connect(authToken?: string): void {
    if (this.socket?.connected) {
      logger.debug('🔌 WebSocket already connected');
      return;
    }

    this.authToken = authToken || this.authToken;

    logger.debug('🔌 Connecting to WebSocket server...');

    this.socket = io(env.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      auth: this.authToken ? { token: this.authToken } : undefined,
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  /**
   * Desconectar do servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      logger.debug('🔌 Disconnecting from WebSocket server...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Configurar listeners de eventos do socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Evento de conexão
    this.socket.on('connect', () => {
      logger.debug('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitToListeners('connected', { connected: true });
    });

    // Evento de desconexão
    this.socket.on('disconnect', (reason) => {
      logger.debug('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emitToListeners('disconnected', { connected: false, reason });

      // Tentar reconectar automaticamente
      if (reason === 'io server disconnect') {
        // Servidor desconectou - não reconectar automaticamente
        return;
      }

      this.attemptReconnect();
    });

    // Evento de erro
    this.socket.on('connect_error', (error) => {
      logger.error('❌ WebSocket connection error:', error);
      this.emitToListeners('error', { error: error.message });
      this.attemptReconnect();
    });

    // Eventos específicos da aplicação
    this.socket.on('box_opened', (data: BoxOpenedEvent['data']) => {
      logger.debug('📦 Box opened event received:', data);
      this.emitToListeners('box_opened', data);
    });

    this.socket.on('stock_update', (data: { box_id: string; stock: number }) => {
      logger.debug('📊 Stock update received:', data);
      this.emitToListeners('stock_update', data);
    });

    this.socket.on('new_notification', (data: any) => {
      logger.debug('🔔 New notification received:', data);
      this.emitToListeners('new_notification', data);
    });

    this.socket.on('order_update', (data: { order_id: string; status: string }) => {
      logger.debug('📋 Order update received:', data);
      this.emitToListeners('order_update', data);
    });

    this.socket.on('promotion_started', (data: any) => {
      logger.debug('🎉 Promotion started:', data);
      this.emitToListeners('promotion_started', data);
    });

    this.socket.on('user_activity', (data: any) => {
      logger.debug('👤 User activity:', data);
      this.emitToListeners('user_activity', data);
    });
  }

  /**
   * Tentar reconectar
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.debug('❌ Max reconnection attempts reached');
      this.emitToListeners('max_reconnect_attempts', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.debug(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Emitir evento para listeners registrados
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in WebSocket listener for event ${event}:`, error);
        }
      });
    }
  }

  /**
   * Adicionar listener para evento
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remover listener para evento
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emitir evento para o servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      logger.warn('⚠️ Cannot emit event: WebSocket not connected');
    }
  }

  /**
   * Entrar em uma sala (room)
   */
  joinRoom(room: string): void {
    this.emit('join_room', { room });
  }

  /**
   * Sair de uma sala (room)
   */
  leaveRoom(room: string): void {
    this.emit('leave_room', { room });
  }

  /**
   * Atualizar token de autenticação
   */
  updateAuthToken(token: string): void {
    this.authToken = token;
    if (this.socket?.connected) {
      this.emit('update_auth', { token });
    }
  }

  /**
   * Verificar se está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Obter status da conexão
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }

  /**
   * Configurar token de autenticação
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
   * Ping para testar conexão
   */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime, (response: number) => {
        const latency = Date.now() - startTime;
        resolve(latency);
      });

      // Timeout após 5 segundos
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  /**
   * Limpar todos os listeners
   */
  removeAllListeners(): void {
    this.eventListeners.clear();
  }
}

// Instância singleton do serviço
export const websocketService = new WebSocketService();

// Hook para usar WebSocket em componentes React
export const useWebSocket = () => {
  return websocketService;
};

export default websocketService;
