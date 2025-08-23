import { store } from '../store';
import logger from './loggerService';
import {
  setConnectionStatus,
  setConnectionError,
  updateBoxStock,
  updateOrderStatus,
  addLiveEvent,
  updateOnlineUsers,
  updateLiveStats,
} from '../store/slices/realtimeSlice';
import { addNotification } from '../store/slices/notificationsSlice';

/**
 * Serviço para gerenciamento de funcionalidades de tempo real via WebSocket
 */

class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  
  private baseURL: string;

  constructor() {
    // Use environment variable or fallback
    this.baseURL = process.env.REACT_APP_WS_URL || 'wss://crowbar-backend-staging.azurewebsites.net/ws';
  }

  /**
   * Conectar ao WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection
        if (this.ws) {
          this.ws.close();
        }

        store.dispatch(setConnectionStatus('connecting'));

        // Get auth token for WebSocket authentication
        const state = store.getState();
        const token = state.auth.token;

        // Create WebSocket connection with auth
        const wsUrl = `${this.baseURL}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          logger.debug('WebSocket connected');
          store.dispatch(setConnectionStatus('connected'));
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          logger.debug('WebSocket closed:', event.code, event.reason);
          store.dispatch(setConnectionStatus('disconnected'));
          this.stopHeartbeat();
          
          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error:', error);
          store.dispatch(setConnectionError('Erro de conexão WebSocket'));
          reject(new Error('WebSocket connection failed'));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Desconectar do WebSocket
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.subscriptions.clear();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    
    store.dispatch(setConnectionStatus('disconnected'));
  }

  /**
   * Tentar reconectar
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    logger.debug(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Iniciar heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Parar heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Enviar mensagem
   */
  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Tratar mensagens recebidas
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'pong':
          // Heartbeat response
          break;
          
        case 'box_stock_update':
          store.dispatch(updateBoxStock({
            boxId: message.data.boxId,
            stock: message.data.stock,
            price: message.data.price,
          }));
          break;
          
        case 'order_status_update':
          store.dispatch(updateOrderStatus({
            orderId: message.data.orderId,
            status: message.data.status,
            tracking: message.data.tracking,
          }));
          
          // Also add as notification
          store.dispatch(addNotification({
            id: `order_${message.data.orderId}_${Date.now()}`,
            type: 'order',
            title: 'Atualização do Pedido',
            message: `Seu pedido foi ${this.getStatusLabel(message.data._status)}`,
            read: false,
            created_at: new Date().toISOString(),
            action_url: `/orders/${message.data.orderId}`,
          }));
          break;
          
        case 'box_opened':
          store.dispatch(addLiveEvent({
            id: `box_opened_${Date.now()}`,
            type: 'box_opened',
            data: message.data,
          }));
          
          // Update live stats
          store.dispatch(updateLiveStats({
            totalBoxesOpened: message.data.totalBoxesOpened,
            recentOpenings: message.data.recentOpenings,
          }));
          break;
          
        case 'new_box_available':
          store.dispatch(addLiveEvent({
            id: `new_box_${Date.now()}`,
            type: 'new_box',
            data: message.data,
          }));
          
          // Add notification
          store.dispatch(addNotification({
            id: `new_box_${message.data.boxId}_${Date.now()}`,
            type: 'promotion',
            title: 'Nova Caixa Disponível!',
            message: `${message.data.boxName} está agora disponível na loja`,
            read: false,
            created_at: new Date().toISOString(),
            action_url: `/boxes/${message.data.boxId}`,
          }));
          break;
          
        case 'promotion_started':
          store.dispatch(addLiveEvent({
            id: `promotion_${Date.now()}`,
            type: 'promotion',
            data: message.data,
          }));
          
          // Add notification
          store.dispatch(addNotification({
            id: `promotion_${message.data.promotionId}_${Date.now()}`,
            type: 'promotion',
            title: 'Promoção Especial!',
            message: message.data.description,
            read: false,
            created_at: new Date().toISOString(),
            action_url: message.data.actionUrl,
          }));
          break;
          
        case 'online_users_update':
          store.dispatch(updateOnlineUsers({
            count: message.data.count,
            users: message.data.users,
          }));
          break;
          
        case 'live_stats_update':
          store.dispatch(updateLiveStats(message.data));
          break;
          
        default:
          logger.debug('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Subscrever a atualizações de uma caixa
   */
  async subscribeToBox(boxId: string): Promise<void> {
    const subscription = `box:${boxId}`;
    
    if (!this.subscriptions.has(subscription)) {
      this.send({
        type: 'subscribe',
        channel: 'box_updates',
        boxId,
      });
      
      this.subscriptions.add(subscription);
    }
  }

  /**
   * Subscrever a atualizações de um pedido
   */
  async subscribeToOrder(orderId: string): Promise<void> {
    const subscription = `order:${orderId}`;
    
    if (!this.subscriptions.has(subscription)) {
      this.send({
        type: 'subscribe',
        channel: 'order_updates',
        orderId,
      });
      
      this.subscriptions.add(subscription);
    }
  }

  /**
   * Subscrever a eventos globais
   */
  subscribeToGlobalEvents(): void {
    this.send({
      type: 'subscribe',
      channel: 'global_events',
    });
  }

  /**
   * Subscrever a estatísticas ao vivo
   */
  subscribeToLiveStats(): void {
    this.send({
      type: 'subscribe',
      channel: 'live_stats',
    });
  }

  /**
   * Cancelar subscrição
   */
  unsubscribe(channel: string, id?: string): void {
    const subscription = id ? `${channel}:${id}` : channel;
    
    if (this.subscriptions.has(subscription)) {
      this.send({
        type: 'unsubscribe',
        channel,
        id,
      });
      
      this.subscriptions.delete(subscription);
    }
  }

  /**
   * Obter label do status
   */
  private getStatusLabel(_status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'confirmado',
      'confirmed': 'confirmado',
      'processing': 'sendo processado',
      'shipped': 'enviado',
      'delivered': 'entregue',
      'cancelled': 'cancelado',
    };
    
    return statusLabels[status] || status;
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Obter status da conexão
   */
  getConnectionState(): number | undefined {
    return this.ws?.readyState;
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;