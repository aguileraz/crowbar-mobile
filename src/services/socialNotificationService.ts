/**
 * Social Notification Service
 * Serviço de notificações sociais e gamificadas
 */

import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SocialNotification,
  NotificationAction,
  SocialSettings,
  SocialUser,
} from '../types/social';
import { EmojiReactionType } from '../types/animations';
import { analyticsService } from './analyticsService';
import advancedHapticService from './advancedHapticService';

interface NotificationTemplate {
  id: string;
  type: SocialNotification['type'];
  title: string;
  message: string;
  icon?: string;
  sound?: string;
  vibration?: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  actions?: NotificationAction[];
}

interface NotificationCallbacks {
  onNotificationReceived: (notification: SocialNotification) => void;
  onNotificationOpened: (notification: SocialNotification) => void;
  onActionExecuted: (notificationId: string, actionId: string) => void;
}

class SocialNotificationService {
  private static instance: SocialNotificationService;
  private notifications = new Map<string, SocialNotification>();
  private settings: SocialSettings;
  private callbacks: Partial<NotificationCallbacks> = {};
  private currentUser: SocialUser | null = null;
  private pushToken: string | null = null;

  // Templates de notificações
  private notificationTemplates: NotificationTemplate[] = [
    {
      id: 'friend_request',
      type: 'friend_request',
      title: '👋 Nova solicitação de amizade',
      message: '{{senderName}} quer ser seu amigo!',
      icon: 'friend_request',
      sound: 'social_ping',
      vibration: true,
      priority: 'normal',
      category: 'social',
      actions: [
        { id: 'accept', label: 'Aceitar', type: 'accept', style: 'primary' },
        { id: 'decline', label: 'Recusar', type: 'decline', style: 'secondary' },
      ],
    },
    {
      id: 'room_invite',
      type: 'room_invite',
      title: '🎮 Convite para sala',
      message: '{{inviterName}} te convidou para uma sala de {{theme}}!',
      icon: 'room_invite',
      sound: 'room_invite',
      vibration: true,
      priority: 'high',
      category: 'gaming',
      actions: [
        { id: 'join', label: 'Entrar', type: 'join', style: 'primary' },
        { id: 'decline', label: 'Recusar', type: 'decline', style: 'secondary' },
      ],
    },
    {
      id: 'bet_win',
      type: 'bet_win',
      title: '🎉 Você ganhou uma aposta!',
      message: 'Parabéns! Você ganhou {{amount}} {{currency}}',
      icon: 'bet_win',
      sound: 'victory',
      vibration: true,
      priority: 'high',
      category: 'rewards',
      actions: [
        { id: 'view', label: 'Ver Detalhes', type: 'view', style: 'primary' },
      ],
    },
    {
      id: 'achievement',
      type: 'achievement',
      title: '🏆 Conquista Desbloqueada!',
      message: 'Você desbloqueou: {{achievementName}}',
      icon: 'achievement',
      sound: 'achievement',
      vibration: true,
      priority: 'normal',
      category: 'achievements',
      actions: [
        { id: 'view', label: 'Ver Conquista', type: 'view', style: 'primary' },
      ],
    },
    {
      id: 'leaderboard',
      type: 'leaderboard',
      title: '📊 Mudança no Ranking',
      message: 'Você {{direction}} para a posição #{{position}} em {{category}}!',
      icon: 'leaderboard',
      sound: 'rank_change',
      vibration: true,
      priority: 'normal',
      category: 'competition',
      actions: [
        { id: 'view', label: 'Ver Ranking', type: 'view', style: 'primary' },
      ],
    },
    {
      id: 'reaction',
      type: 'reaction',
      title: '😄 Reação recebida',
      message: '{{reactorName}} reagiu com {{reaction}} à sua abertura!',
      icon: 'reaction',
      sound: 'reaction',
      vibration: false,
      priority: 'low',
      category: 'social',
    },
  ];

  private constructor() {
    this.settings = {
      privacy: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowRoomInvites: true,
        shareOpeningResults: true,
      },
      notifications: {
        friendRequests: true,
        roomInvites: true,
        betResults: true,
        achievements: true,
        leaderboardChanges: true,
      },
      display: {
        showCountry: true,
        showLevel: true,
        showStatistics: true,
      },
    };

    this.loadSettings();
    this.loadCurrentUser();
    this.initializePushNotifications();
  }

  static getInstance(): SocialNotificationService {
    if (!SocialNotificationService.instance) {
      SocialNotificationService.instance = new SocialNotificationService();
    }
    return SocialNotificationService.instance;
  }

  /**
   * Carrega configurações do usuário
   */
  private async loadSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('social_settings');
      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }
    } catch (error) {
      // console.warn('Erro ao carregar configurações:', error);
    }
  }

  /**
   * Salva configurações do usuário
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('social_settings', JSON.stringify(this.settings));
    } catch (error) {
      // console.warn('Erro ao salvar configurações:', error);
    }
  }

  /**
   * Carrega dados do usuário atual
   */
  private async loadCurrentUser(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      // console.warn('Erro ao carregar usuário:', error);
    }
  }

  /**
   * Inicializa sistema de push notifications
   */
  private initializePushNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        this.pushToken = token.token;
        this.registerTokenOnServer(token.token);
      },
      onNotification: (notification) => {
        this.handleNotificationReceived(notification);
      },
      onAction: (notification) => {
        this.handleActionExecuted(notification.action, notification.userInfo?.notificationId);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Configurar canais de notificação no Android
    this.createNotificationChannels();
  }

  /**
   * Cria canais de notificação (Android)
   */
  private createNotificationChannels(): void {
    if (Platform.OS === 'android') {
      const channels = [
        {
          channelId: 'social',
          channelName: 'Social',
          channelDescription: 'Notificações sociais e de amizade',
          importance: 4,
          vibrate: true,
        },
        {
          channelId: 'gaming',
          channelName: 'Gaming',
          channelDescription: 'Convites para salas e atividades de jogo',
          importance: 4,
          vibrate: true,
        },
        {
          channelId: 'rewards',
          channelName: 'Recompensas',
          channelDescription: 'Conquistas, apostas e prêmios',
          importance: 4,
          vibrate: true,
        },
        {
          channelId: 'competition',
          channelName: 'Competição',
          channelDescription: 'Rankings e leaderboards',
          importance: 3,
          vibrate: false,
        },
      ];

      channels.forEach(channel => {
        PushNotification.createChannel(channel, () => {});
      });
    }
  }

  /**
   * Registra token no servidor
   */
  private async registerTokenOnServer(token: string): Promise<void> {
    try {
      // Em produção, enviar token para o servidor
    } catch (error) {
      // console.warn('Erro ao registrar token:', error);
    }
  }

  /**
   * Manipula notificação recebida
   */
  private handleNotificationReceived(notification: any): void {
    const socialNotification = this.parseNotification(notification);
    if (socialNotification) {
      this.callbacks.onNotificationReceived?.(socialNotification);
      
      // Feedback háptico baseado no tipo
      this.triggerHapticFeedback(socialNotification.type);
    }
  }

  /**
   * Manipula ação executada
   */
  private handleActionExecuted(actionId: string, notificationId: string): void {
    this.callbacks.onActionExecuted?.(notificationId, actionId);
  }

  /**
   * Converte notificação nativa para formato interno
   */
  private parseNotification(notification: any): SocialNotification | null {
    if (!notification.userInfo) return null;

    return {
      id: notification.userInfo.notificationId,
      userId: this.currentUser?.id || '',
      type: notification.userInfo.type,
      title: notification.title || '',
      message: notification.message || '',
      data: notification.userInfo.data || {},
      read: false,
      createdAt: new Date().toISOString(),
      actions: notification.userInfo.actions,
    };
  }

  /**
   * Feedback háptico baseado no tipo de notificação
   */
  private triggerHapticFeedback(type: SocialNotification['type']): void {
    switch (type) {
      case 'friend_request':
      case 'room_invite':
        advancedHapticService.playGestureFeedback('tap');
        break;
      case 'bet_win':
      case 'achievement':
        advancedHapticService.playSuccessSequence(2);
        break;
      case 'leaderboard':
        advancedHapticService.playGestureFeedback('double_tap');
        break;
      case 'reaction':
        // Feedback leve para reações
        advancedHapticService.playGestureFeedback('tap');
        break;
    }
  }

  /**
   * Registra callbacks
   */
  setCallbacks(callbacks: Partial<NotificationCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Envia notificação social
   */
  async sendNotification(config: {
    userId: string;
    type: SocialNotification['type'];
    data: Record<string, any>;
    customMessage?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<void> {
    // Verificar configurações do usuário
    if (!this.shouldSendNotification(config.type)) {
      return;
    }

    const template = this.notificationTemplates.find(t => t.type === config.type);
    if (!template) {
      // console.warn(`Template não encontrado para tipo: ${config.type}`);
      return;
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Processar template com dados
    const processedTitle = this.processTemplate(template.title, config.data);
    const processedMessage = config.customMessage || this.processTemplate(template.message, config.data);

    const notification: SocialNotification = {
      id: notificationId,
      userId: config.userId,
      type: config.type,
      title: processedTitle,
      message: processedMessage,
      data: config.data,
      read: false,
      createdAt: new Date().toISOString(),
      actions: template.actions,
    };

    // Salvar notificação
    this.notifications.set(notificationId, notification);
    await this.saveNotifications();

    // Enviar push notification
    await this.sendPushNotification(notification, template);

    // Analytics
    analyticsService.trackEngagement('notification_sent', config.type, 1);
  }

  /**
   * Processa template com dados
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Verifica se deve enviar notificação
   */
  private shouldSendNotification(type: SocialNotification['type']): boolean {
    switch (type) {
      case 'friend_request':
        return this.settings.notifications.friendRequests;
      case 'room_invite':
        return this.settings.notifications.roomInvites;
      case 'bet_win':
        return this.settings.notifications.betResults;
      case 'achievement':
        return this.settings.notifications.achievements;
      case 'leaderboard':
        return this.settings.notifications.leaderboardChanges;
      default:
        return true;
    }
  }

  /**
   * Envia push notification
   */
  private async sendPushNotification(
    notification: SocialNotification,
    template: NotificationTemplate
  ): Promise<void> {
    const pushConfig: any = {
      title: notification.title,
      message: notification.message,
      playSound: template.sound !== undefined,
      soundName: template.sound || 'default',
      vibrate: template.vibration,
      priority: template.priority,
      channelId: template.category,
      userInfo: {
        notificationId: notification.id,
        type: notification.type,
        data: notification.data,
        actions: notification.actions,
      },
    };

    // Adicionar ações (Android)
    if (Platform.OS === 'android' && notification.actions) {
      pushConfig.actions = notification.actions.map(action => action.label);
    }

    PushNotification.localNotification(pushConfig);
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
    }
  }

  /**
   * Marca todas como lidas
   */
  async markAllAsRead(): Promise<void> {
    for (const notification of this.notifications.values()) {
      notification.read = true;
    }
    await this.saveNotifications();
  }

  /**
   * Remove notificação
   */
  async removeNotification(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId);
    await this.saveNotifications();
  }

  /**
   * Obtém notificações do usuário
   */
  getUserNotifications(unreadOnly: boolean = false): SocialNotification[] {
    const notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === this.currentUser?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return unreadOnly ? notifications.filter(n => !n.read) : notifications;
  }

  /**
   * Conta notificações não lidas
   */
  getUnreadCount(): number {
    return this.getUserNotifications(true).length;
  }

  /**
   * Salva notificações
   */
  private async saveNotifications(): Promise<void> {
    try {
      const data = Object.fromEntries(this.notifications);
      await AsyncStorage.setItem('social_notifications', JSON.stringify(data));
    } catch (error) {
      // console.warn('Erro ao salvar notificações:', error);
    }
  }

  /**
   * Carrega notificações
   */
  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('social_notifications');
      if (data) {
        const stored = JSON.parse(data);
        for (const [id, notification] of Object.entries(stored)) {
          this.notifications.set(id, notification as SocialNotification);
        }
      }
    } catch (error) {
      // console.warn('Erro ao carregar notificações:', error);
    }
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(newSettings: Partial<SocialSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Obtém configurações atuais
   */
  getSettings(): SocialSettings {
    return { ...this.settings };
  }

  /**
   * Métodos de conveniência para tipos específicos
   */
  async sendFriendRequest(fromUserId: string, toUserId: string, senderName: string): Promise<void> {
    await this.sendNotification({
      userId: toUserId,
      type: 'friend_request',
      data: { senderName, fromUserId },
    });
  }

  async sendRoomInvite(fromUserId: string, toUserId: string, roomId: string, inviterName: string, theme: string): Promise<void> {
    await this.sendNotification({
      userId: toUserId,
      type: 'room_invite',
      data: { inviterName, roomId, theme },
      priority: 'high',
    });
  }

  async sendBetWin(userId: string, amount: number, currency: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'bet_win',
      data: { amount, currency },
      priority: 'high',
    });
  }

  async sendAchievementUnlocked(userId: string, achievementName: string, achievementId: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'achievement',
      data: { achievementName, achievementId },
    });
  }

  async sendLeaderboardUpdate(userId: string, direction: string, position: number, category: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'leaderboard',
      data: { direction, position, category },
    });
  }

  async sendReactionReceived(userId: string, reactorName: string, reaction: EmojiReactionType): Promise<void> {
    const emojiMap = {
      beijo: '😘',
      bravo: '😠',
      cool: '😎',
      lingua: '😛',
    };

    await this.sendNotification({
      userId,
      type: 'reaction',
      data: { reactorName, reaction: emojiMap[reaction] },
      priority: 'low',
    });
  }

  /**
   * Limpa dados antigos
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 dias

    for (const [id, notification] of this.notifications) {
      if (new Date(notification.createdAt) < cutoffDate) {
        this.notifications.delete(id);
      }
    }

    await this.saveNotifications();
  }

  /**
   * Solicita permissões de notificação
   */
  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions((permissions) => {
        const granted = permissions.alert && permissions.badge && permissions.sound;
        resolve(granted);
      });
    });
  }

  /**
   * Limpa todas as notificações
   */
  async clearAll(): Promise<void> {
    this.notifications.clear();
    await AsyncStorage.removeItem('social_notifications');
  }
}

export default SocialNotificationService.getInstance();