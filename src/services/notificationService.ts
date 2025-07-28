import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { httpClient } from './httpClient';
import { Notification, NotificationSettings, PaginatedResponse } from '../types/api';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { navigationService } from './navigationService';
import logger from './loggerService';

/**
 * Serviço para gerenciamento de notificações push
 */

class NotificationService {
  private baseURL = '/notifications';
  private fcmToken: string | null = null;

  /**
   * Inicializar serviço de notificações
   */
  async initialize(): Promise<{ token: string | null; permissionStatus: string }> {
    try {
      // Verificar e solicitar permissões
      const permissionStatus = await this.requestPermissions();
      
      if (permissionStatus === 'granted') {
        // Obter token FCM
        const token = await this.getFCMToken();
        this.fcmToken = token;
        
        // Registrar token no backend
        if (token) {
          await this.registerToken(token);
        }
        
        // Configurar listeners
        this.setupMessageListeners();
        
        return { token, permissionStatus };
      }
      
      return { token: null, permissionStatus };
    } catch (error) {
      logger.error('Error initializing notifications:', error);
      return { token: null, permissionStatus: 'denied' };
    }
  }

  /**
   * Solicitar permissões de notificação
   */
  async requestPermissions(): Promise<'granted' | 'denied' | 'not-determined'> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requer permissão explícita
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            const authStatus = await messaging().requestPermission();
            return this.getPermissionStatus(authStatus);
          } else {
            return 'denied';
          }
        } else {
          const authStatus = await messaging().requestPermission();
          return this.getPermissionStatus(authStatus);
        }
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return this.getPermissionStatus(authStatus);
      }
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      return 'denied';
    }
  }

  /**
   * Converter status de autorização
   */
  private getPermissionStatus(authStatus: number): 'granted' | 'denied' | 'not-determined' {
    switch (authStatus) {
      case messaging.AuthorizationStatus.AUTHORIZED:
      case messaging.AuthorizationStatus.PROVISIONAL:
        return 'granted';
      case messaging.AuthorizationStatus.DENIED:
        return 'denied';
      default:
        return 'not-determined';
    }
  }

  /**
   * Obter token FCM
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      logger.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Configurar listeners de mensagens
   */
  private setupMessageListeners(): void {
    // Mensagem recebida quando app está em foreground
    messaging().onMessage(async remoteMessage => {
      logger.debug('Foreground message:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Mensagem que abriu o app (background/quit state)
    messaging().onNotificationOpenedApp(remoteMessage => {
      logger.debug('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Verificar se app foi aberto por notificação (quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          logger.debug('App opened by notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Token refresh
    messaging().onTokenRefresh(token => {
      logger.debug('FCM token refreshed:', token);
      this.fcmToken = token;
      this.registerToken(token);
    });
  }

  /**
   * Tratar mensagem em foreground
   */
  private handleForegroundMessage(remoteMessage: any): void {
    if (remoteMessage.notification) {
      // Mostrar notificação local ou atualizar UI
      Alert.alert(
        remoteMessage.notification.title || 'Nova notificação',
        remoteMessage.notification.body || '',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Tratar abertura por notificação
   */
  handleNotificationOpen(remoteMessage: any): void {
    // Navegar para tela específica baseada no tipo de notificação
    const { data } = remoteMessage;
    navigationService.navigateFromNotification(data);
  }

  /**
   * Registrar token no backend
   */
  async registerToken(token: string): Promise<void> {
    try {
      await httpClient.post(`${this.baseURL}/register-token`, {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      logger.error('Error registering FCM token:', error);
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

    const _response = await httpClient.get(this.baseURL, { params });
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
    const _response = await httpClient.get(`${this.baseURL}/settings`);
    return response.data;
  }

  /**
   * Atualizar configurações de notificação
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const _response = await httpClient.patch(`${this.baseURL}/settings`, settings);
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
  async scheduleLocalNotification(notification: {
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
      const _response = await httpClient.get(`${this.baseURL}/badge-count`);
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
   * Verificar status de permissão
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'not-determined'> {
    try {
      const authStatus = await messaging().hasPermission();
      return this.getPermissionStatus(authStatus);
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
   * Listeners de mensagens (retornam funções de cleanup)
   */
  onMessage(handler: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onMessage(handler);
  }

  onBackgroundMessage(handler: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    messaging().setBackgroundMessageHandler(handler);
    return () => {}; // Firebase não fornece cleanup para background handler
  }

  onTokenRefresh(handler: (token: string) => void): () => void {
    return messaging().onTokenRefresh(handler);
  }

  onNotificationOpenedApp(handler: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onNotificationOpenedApp(handler);
  }

  /**
   * Obter notificação inicial (app aberto por notificação)
   */
  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    return messaging().getInitialNotification();
  }

  /**
   * Configurar manipuladores de interação com notifee
   */
  async setupNotifeeHandlers(): Promise<void> {
    // Evento quando usuário interage com notificação
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case 1: // EventType.DISMISSED
          logger.debug('Notificação dispensada');
          break;
        case 7: // EventType.PRESS
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
      if (type === 7) { // EventType.PRESS
        logger.debug('Background notification pressed', detail.notification);
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
