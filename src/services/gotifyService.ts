import io, { Socket } from 'socket.io-client';
import notifee, { AndroidImportance } from '@notifee/react-native';
import logger from './loggerService';

/**
 * Gotify Service
 * Substitui Firebase Cloud Messaging (FCM)
 * Conecta via WebSocket e exibe notificações locais
 */

export interface GotifyMessage {
  id: number;
  appid: number;
  message: string;
  title: string;
  priority: number;
  date: string;
  extras?: {
    userId?: string;
    type?: string;
    orderId?: string;
    [key: string]: any;
  };
}

export interface NotificationHandler {
  onNotification: (message: GotifyMessage) => void;
}

class GotifyService {
  private socket: Socket | null = null;
  private baseURL: string;
  private clientToken: string = '';
  private connected: boolean = false;
  private notificationHandler: NotificationHandler | null = null;

  constructor() {
    // Configuração baseada no ambiente
    this.baseURL = __DEV__
      ? 'http://10.0.2.2:8888'  // Android emulator
      : 'https://gotify.crowbar.com.br';
  }

  /**
   * Inicializar canal de notificação (Android)
   */
  async initialize(): Promise<void> {
    try {
      // Criar canal de notificação padrão (Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Notificações Crowbar',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      // Criar canais por prioridade
      await notifee.createChannel({
        id: 'critical',
        name: 'Notificações Críticas',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: 'normal',
        name: 'Notificações Normais',
        importance: AndroidImportance.DEFAULT,
      });

      logger.info('Gotify notification channels created');
    } catch (error) {
      logger.error('Error creating notification channels:', error);
    }
  }

  /**
   * Conectar ao Gotify WebSocket
   */
  connect(clientToken: string): void {
    if (this.socket?.connected) {
      logger.warn('Already connected to Gotify');
      return;
    }

    if (!clientToken) {
      logger.error('No client token provided');
      return;
    }

    this.clientToken = clientToken;

    logger.info('Connecting to Gotify', { baseURL: this.baseURL });

    // Conectar via WebSocket
    this.socket = io(this.baseURL, {
      path: '/stream',
      query: { token: clientToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    // Event handlers
    this.socket.on('connect', () => {
      logger.info('Connected to Gotify');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Disconnected from Gotify', { reason });
      this.connected = false;
    });

    this.socket.on('message', (message: GotifyMessage) => {
      this.handleMessage(message);
    });

    this.socket.on('error', (error: Error) => {
      logger.error('Gotify error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info(`Reconnected to Gotify (attempt ${attemptNumber})`);
    });
  }

  /**
   * Desconectar do Gotify
   */
  disconnect(): void {
    if (this.socket) {
      logger.info('Disconnecting from Gotify');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Registrar handler de notificações
   */
  setNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandler = handler;
  }

  /**
   * Processar mensagem recebida
   */
  private handleMessage(message: GotifyMessage): void {
    logger.info('New notification received', { title: message.title });

    // Chamar handler customizado se registrado
    if (this.notificationHandler) {
      this.notificationHandler.onNotification(message);
    }

    // Mostrar notificação local
    this.showLocalNotification(message);
  }

  /**
   * Mostrar notificação local
   */
  private async showLocalNotification(message: GotifyMessage): Promise<void> {
    try {
      const channelId = message.priority >= 8 ? 'critical' : 'normal';

      await notifee.displayNotification({
        title: message.title,
        body: message.message,
        data: message.extras || {},
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          importance: this.priorityToImportance(message.priority),
          sound: message.priority >= 7 ? 'default' : undefined,
          vibrationPattern: message.priority >= 8 ? [300, 500] : undefined,
          smallIcon: 'ic_notification',
          color: '#FF6B35',
        },
        ios: {
          sound: message.priority >= 7 ? 'default' : undefined,
          critical: message.priority >= 8,
          criticalVolume: 1.0,
        },
      });

      logger.debug('Local notification displayed');
    } catch (error) {
      logger.error('Error displaying notification:', error);
    }
  }

  /**
   * Converter prioridade Gotify para importância Android
   */
  private priorityToImportance(priority: number): AndroidImportance {
    if (priority >= 8) return AndroidImportance.HIGH;
    if (priority >= 5) return AndroidImportance.DEFAULT;
    return AndroidImportance.LOW;
  }

  /**
   * Obter mensagens anteriores do Gotify
   */
  async getMessages(limit: number = 20): Promise<GotifyMessage[]> {
    try {
      const response = await fetch(`${this.baseURL}/message?limit=${limit}`, {
        headers: {
          'X-Gotify-Key': this.clientToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      logger.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Deletar mensagem
   */
  async deleteMessage(messageId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'X-Gotify-Key': this.clientToken,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Deletar todas as mensagens
   */
  async deleteAllMessages(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/message`, {
        method: 'DELETE',
        headers: {
          'X-Gotify-Key': this.clientToken,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('Error deleting all messages:', error);
      return false;
    }
  }
}

export default new GotifyService();
