// eslint-disable-next-line react-native/split-platform-components
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { httpClient } from './httpClient';
import { Notification, NotificationSettings, PaginatedResponse } from '../types/api';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigationService } from './navigationService';
import logger from './loggerService';

/**
 * Serviço para gerenciamento de notificações push
 *
 * ⚠️ MIGRATION NOTICE:
 * Firebase Cloud Messaging foi REMOVIDO. Notificações agora usam @notifee/react-native.
 *
 * @notifee fornece:
 * - Notificações locais avançadas (Android/iOS)
 * - Canais de notificação (Android)
 * - Rich notifications (imagens, ações)
 * - Scheduled notifications
 *
 * Para push notifications remotas, integrar com serviço de push próprio ou APNs/FCM direto.
 */

class NotificationService {
  private baseURL = '/notifications';

  /**
   * Inicializar serviço de notificações (@notifee)
   */
  async initialize(): Promise<{ token: string | null; permissionStatus: string }> {
    try {
      // Verificar e solicitar permissões
      const permissionStatus = await this.requestPermissions();

      if (permissionStatus === 'granted') {
        // Criar canais de notificação (Android)
        await this.createNotificationChannel();

        // Configurar handlers do @notifee
        await this.setupNotifeeHandlers();

        logger.debug('Notificações inicializadas com @notifee');
        return { token: null, permissionStatus };
      }

      return { token: null, permissionStatus };
    } catch (error) {
      logger.error('Error initializing notifications:', error);
      return { token: null, permissionStatus: 'denied' };
    }
  }

  /**
   * Solicitar permissões de notificação (@notifee)
   */
  async requestPermissions(): Promise<'granted' | 'denied' | 'not-determined'> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requer permissão explícita
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
        } else {
          // Versões anteriores do Android concedem permissão automaticamente
          return 'granted';
        }
      } else {
        // iOS - solicitar permissão via @notifee
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus === 1) { // AUTHORIZED
          return 'granted';
        } else if (settings.authorizationStatus === 2) { // DENIED
          return 'denied';
        } else {
          return 'not-determined';
        }
      }
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      return 'denied';
    }
  }

  /**
   * Registrar device token no backend (para push notifications remotas)
   *
   * Nota: FCM token não é mais usado. Implementar APNs/FCM direto se necessário.
   */
  async registerToken(token: string): Promise<void> {
    try {
      await httpClient.post(`${this.baseURL}/register-token`, {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      logger.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Buscar notificações
   */
  async getNotifications(
    page: number = 1,
    perPage: number = 20,
    filters: any = {}
  ): Promise<PaginatedResponse<Notification>> {
    const params = {
      page,
      per_page: perPage,
      ...filters,
    };

    const response = await httpClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    await httpClient.patch(`${this.baseURL}/${notificationId}/read`);
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead(): Promise<void> {
    await httpClient.patch(`${this.baseURL}/mark-all-read`);
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await httpClient.delete(`${this.baseURL}/${notificationId}`);
  }

  /**
   * Buscar configurações de notificação
   */
  async getSettings(): Promise<NotificationSettings> {
    const response = await httpClient.get(`${this.baseURL}/settings`);
    return response.data;
  }

  /**
   * Atualizar configurações de notificação
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await httpClient.patch(`${this.baseURL}/settings`, settings);
    return response.data;
  }

  /**
   * Enviar notificação de teste
   */
  async sendTestNotification(): Promise<void> {
    await httpClient.post(`${this.baseURL}/test`);
  }

  /**
   * Cancelar todas as notificações locais
   */
  async cancelAllLocalNotifications(): Promise<void> {
    // Implementar cancelamento de notificações locais se necessário
  }

  /**
   * Agendar notificação local
   */
  async scheduleLocalNotification(_notification: {
    title: string;
    body: string;
    data?: any;
    scheduleDate?: Date;
  }): Promise<void> {
    // Implementar agendamento de notificação local se necessário
  }

  /**
   * Obter badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      const response = await httpClient.get(`${this.baseURL}/badge-count`);
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Limpar badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await httpClient.patch(`${this.baseURL}/clear-badge`);
    } catch (error) {
      logger.error('Error clearing badge count:', error);
    }
  }

  /**
   * Verificar status de permissão (@notifee)
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'not-determined'> {
    try {
      const settings = await notifee.getNotificationSettings();

      if (settings.authorizationStatus === 1) { // AUTHORIZED
        return 'granted';
      } else if (settings.authorizationStatus === 2) { // DENIED
        return 'denied';
      } else {
        return 'not-determined';
      }
    } catch (error) {
      logger.error('Error checking permission:', error);
      return 'denied';
    }
  }

  /**
   * Abrir configurações do app
   */
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      logger.error('Error opening settings:', error);
      Alert.alert(
        'Erro',
        'Não foi possível abrir as configurações. Acesse manualmente pelas configurações do dispositivo.'
      );
    }
  }

  /**
   * Configurar canal de notificação Android
   */
  async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Notificações Gerais',
        importance: AndroidImportance.HIGH,
        vibration: true,
        lights: true,
      });

      await notifee.createChannel({
        id: 'orders',
        name: 'Pedidos',
        importance: AndroidImportance.HIGH,
        vibration: true,
        lights: true,
      });

      await notifee.createChannel({
        id: 'promotions',
        name: 'Ofertas e Promoções',
        importance: AndroidImportance.DEFAULT,
        vibration: false,
        lights: true,
      });
    }
  }

  /**
   * Exibir notificação local
   */
  async displayLocalNotification(notification: {
    title: string;
    body: string;
    data?: any;
    android?: any;
    ios?: any;
  }): Promise<void> {
    try {
      await notifee.displayNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId: notification.data?.channelId || 'default',
          pressAction: {
            id: 'default',
          },
          ...notification.android,
        },
        ios: notification.ios,
      });
    } catch (error) {
      logger.error('Error displaying local notification:', error);
    }
  }

  /**
   * Obter notificação inicial (app aberto por notificação) - @notifee
   */
  async getInitialNotification(): Promise<any | null> {
    try {
      const initialNotification = await notifee.getInitialNotification();
      return initialNotification;
    } catch (error) {
      logger.error('Error getting initial notification:', error);
      return null;
    }
  }

  /**
   * Configurar manipuladores de interação com notifee
   */
  async setupNotifeeHandlers(): Promise<void> {
    // Evento quando usuário interage com notificação (foreground)
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          logger.debug('Notificação dispensada');
          break;
        case EventType.PRESS:
          logger.debug('Notificação pressionada', detail.notification);
          // Navegar baseado nos dados da notificação
          if (detail.notification?.data) {
            this.handleNotificationNavigation(detail.notification.data);
          }
          break;
      }
    });

    // Background event handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        logger.debug('Background notification pressed', detail.notification);

        // Navegar baseado nos dados da notificação
        if (detail.notification?.data) {
          navigationService.navigateFromNotification(detail.notification.data);
        }
      }
    });
  }

  /**
   * Navegar baseado nos dados da notificação
   */
  private handleNotificationNavigation(data: any): void {
    navigationService.navigateFromNotification(data);
  }
}

export const notificationService = new NotificationService();
export default notificationService;