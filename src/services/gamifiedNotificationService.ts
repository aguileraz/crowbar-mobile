
import notifee, { 
  AndroidImportance, 
  AndroidStyle,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticFeedback } from '../utils/haptic';

export type NotificationType = 
  | 'streak_reminder'
  | 'challenge_complete'
  | 'leaderboard_update'
  | 'flash_sale'
  | 'box_expiring'
  | 'reward_available'
  | 'level_up'
  | 'friend_activity'
  | 'daily_spin'
  | 'achievement_unlock';

interface GamifiedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: NotificationAction[];
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
}

interface NotificationSchedule {
  type: 'daily' | 'weekly' | 'custom';
  time: { hour: number; minute: number };
  days?: number[]; // Para weekly: 0 = domingo, 6 = sábado
  date?: Date; // Para custom
}

class GamifiedNotificationService {
  private static instance: GamifiedNotificationService;
  private channelId = 'gamification';
  private notificationTemplates: Map<NotificationType, Partial<GamifiedNotification>>;

  private constructor() {
    this.notificationTemplates = this.initializeTemplates();
    this.setupChannels();
    this.setupEventHandlers();
  }

  static getInstance(): GamifiedNotificationService {
    if (!GamifiedNotificationService.instance) {
      GamifiedNotificationService.instance = new GamifiedNotificationService();
    }
    return GamifiedNotificationService.instance;
  }

  private initializeTemplates(): Map<NotificationType, Partial<GamifiedNotification>> {
    return new Map([
      ['streak_reminder', {
        title: '🔥 Mantenha sua Sequência!',
        body: 'Não perca sua sequência de {days} dias! Abra uma caixa hoje.',
        priority: 'high',
        haptic: 'warning',
        actions: [
          { id: 'open_app', title: 'Abrir App', icon: '📱' },
          { id: 'snooze', title: 'Lembrar Depois', icon: '⏰' },
        ],
      }],
      ['challenge_complete', {
        title: '🎯 Desafio Completo!',
        body: 'Parabéns! Você completou o desafio "{challenge}".',
        priority: 'medium',
        haptic: 'success',
        actions: [
          { id: 'claim', title: 'Resgatar Recompensa', icon: '🎁' },
        ],
      }],
      ['leaderboard_update', {
        title: '📊 Mudança no Ranking!',
        body: '{change} no ranking! Você está agora em #{position}.',
        priority: 'low',
        haptic: 'light',
      }],
      ['flash_sale', {
        title: '⚡ FLASH SALE COMEÇOU!',
        body: '{discount}% OFF em {product} por tempo limitado!',
        priority: 'critical',
        haptic: 'heavy',
        actions: [
          { id: 'view_sale', title: 'Ver Oferta', icon: '🛍️' },
          { id: 'dismiss', title: 'Ignorar', destructive: true },
        ],
      }],
      ['box_expiring', {
        title: '⏰ Caixa Expirando!',
        body: 'Você tem apenas {hours} horas para abrir sua caixa!',
        priority: 'high',
        haptic: 'warning',
        actions: [
          { id: 'open_now', title: 'Abrir Agora', icon: '📦' },
        ],
      }],
      ['reward_available', {
        title: '🎁 Recompensa Disponível!',
        body: 'Você tem {rewards} recompensas esperando por você!',
        priority: 'medium',
        haptic: 'success',
      }],
      ['level_up', {
        title: '🌟 SUBIU DE NÍVEL!',
        body: 'Parabéns! Você alcançou o nível {level}!',
        priority: 'high',
        haptic: 'success',
      }],
      ['friend_activity', {
        title: '👥 Atividade de Amigo',
        body: '{friend} acabou de {action}!',
        priority: 'low',
        haptic: 'light',
      }],
      ['daily_spin', {
        title: '🎰 Roda da Sorte Disponível!',
        body: 'Seus giros diários foram renovados! Gire agora!',
        priority: 'medium',
        haptic: 'medium',
        actions: [
          { id: 'spin_now', title: 'Girar Agora', icon: '🎯' },
        ],
      }],
      ['achievement_unlock', {
        title: '🏆 Conquista Desbloqueada!',
        body: 'Você desbloqueou: "{achievement}"!',
        priority: 'high',
        haptic: 'success',
      }],
    ]);
  }

  private async setupChannels() {
    // Canal principal de gamificação
    await notifee.createChannel({
      id: this.channelId,
      name: 'Gamificação',
      importance: AndroidImportance.HIGH,
      vibration: true,
      lights: true,
      lightColor: '#FF6B6B',
      sound: 'default',
    });

    // Canal para ofertas urgentes
    await notifee.createChannel({
      id: 'flash_sales',
      name: 'Ofertas Relâmpago',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      lightColor: '#FFD700',
      sound: 'flash_sale',
    });

    // Canal para conquistas
    await notifee.createChannel({
      id: 'achievements',
      name: 'Conquistas',
      importance: AndroidImportance.DEFAULT,
      vibration: true,
      lights: true,
      lightColor: '#4CAF50',
      sound: 'achievement',
    });
  }

  private setupEventHandlers() {
    notifee.onForegroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          break;
        case EventType.PRESS:
          await this.handleNotificationPress(detail.notification);
          break;
        case EventType.ACTION_PRESS:
          await this.handleActionPress(detail.notification, detail.pressAction);
          break;
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        await this.handleNotificationPress(detail.notification);
      }
    });
  }

  private async handleNotificationPress(notification: any) {
    const data = notification.data;
    
    if (data?.haptic) {
      hapticFeedback(data.haptic);
    }

    // Navegação baseada no tipo
    switch (data?.type) {
      case 'flash_sale':
        // Navegar para a tela de flash sales
        break;
      case 'challenge_complete':
        // Navegar para desafios
        break;
      case 'leaderboard_update':
        // Navegar para leaderboard
        break;
      // ... outros casos
    }

    // Marcar como lida
    await this.markAsRead(notification.id);
  }

  private async handleActionPress(notification: any, action: any) {
    switch (action.id) {
      case 'open_app':
        // Apenas abre o app (já feito automaticamente)
        break;
      case 'snooze':
        await this.snoozeNotification(notification, 3600000); // 1 hora
        break;
      case 'claim':
        // Navegar para resgatar recompensa
        break;
      case 'view_sale':
        // Navegar para flash sale
        break;
      case 'open_now':
        // Navegar para abrir caixa
        break;
      case 'spin_now':
        // Navegar para roda da sorte
        break;
    }
  }

  // Métodos públicos

  async show(notification: GamifiedNotification) {
    const template = this.notificationTemplates.get(notification.type);
    const finalNotification = { ...template, ...notification };

    // Processar variáveis no texto
    if (finalNotification.data) {
      finalNotification.title = this.processTemplate(finalNotification.title, finalNotification.data);
      finalNotification.body = this.processTemplate(finalNotification.body, finalNotification.data);
    }

    // Determinar canal baseado no tipo
    let channelId = this.channelId;
    if (notification.type === 'flash_sale' || notification.type === 'box_expiring') {
      channelId = 'flash_sales';
    } else if (notification.type === 'achievement_unlock' || notification.type === 'level_up') {
      channelId = 'achievements';
    }

    // Configurar notificação
    const notifeeNotification: any = {
      id: notification.id,
      title: finalNotification.title,
      body: finalNotification.body,
      android: {
        channelId,
        importance: this.getImportance(finalNotification.priority),
        pressAction: {
          id: 'default',
        },
        style: finalNotification.image ? {
          type: AndroidStyle.BIGPICTURE,
          picture: finalNotification.image,
        } : {
          type: AndroidStyle.BIGTEXT,
          text: finalNotification.body,
        },
        actions: finalNotification.actions?.map(action => ({
          title: `${action.icon || ''} ${action.title}`,
          pressAction: {
            id: action.id,
          },
        })),
      },
      ios: {
        categoryId: notification.type,
        importance: finalNotification.priority === 'critical' ? 'critical' : 'default',
      },
      data: {
        type: notification.type,
        haptic: finalNotification.haptic,
        ...finalNotification.data,
      },
    };

    // Adicionar haptic feedback se em foreground
    if (finalNotification.haptic) {
      hapticFeedback(finalNotification.haptic as any);
    }

    await notifee.displayNotification(notifeeNotification);
    await this.saveToHistory(notification);
  }

  async schedule(
    notification: GamifiedNotification,
    schedule: NotificationSchedule
  ) {
    const template = this.notificationTemplates.get(notification.type);
    const finalNotification = { ...template, ...notification };

    let trigger: TimestampTrigger;

    switch (schedule.type) {
      case 'daily':
        const dailyDate = new Date();
        dailyDate.setHours(schedule.time.hour, schedule.time.minute, 0, 0);
        if (dailyDate.getTime() <= Date.now()) {
          dailyDate.setDate(dailyDate.getDate() + 1);
        }
        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: dailyDate.getTime(),
          repeatFrequency: 'daily' as any,
        };
        break;
        
      case 'weekly':
        const weeklyDate = new Date();
        const currentDay = weeklyDate.getDay();
        const targetDay = schedule.days?.[0] || 0;
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        weeklyDate.setDate(weeklyDate.getDate() + daysUntilTarget);
        weeklyDate.setHours(schedule.time.hour, schedule.time.minute, 0, 0);
        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: weeklyDate.getTime(),
          repeatFrequency: 'weekly' as any,
        };
        break;
        
      case 'custom':
        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: schedule.date!.getTime(),
        };
        break;
    }

    await notifee.createTriggerNotification(
      {
        id: notification.id,
        title: finalNotification.title,
        body: finalNotification.body,
        android: {
          channelId: this.channelId,
        },
        data: {
          type: notification.type,
          ...finalNotification.data,
        },
      },
      trigger
    );
  }

  async cancelScheduled(notificationId: string) {
    await notifee.cancelNotification(notificationId);
  }

  async cancelAll() {
    await notifee.cancelAllNotifications();
  }

  // Notificações específicas de gamificação

  async sendStreakReminder(streakDays: number) {
    await this.show({
      id: `streak_${Date.now()}`,
      type: 'streak_reminder',
      title: '🔥 Mantenha sua Sequência!',
      body: `Não perca sua sequência de ${streakDays} dias! Abra uma caixa hoje.`,
      priority: 'high',
      data: { days: streakDays },
    });
  }

  async sendFlashSaleAlert(product: string, discount: number, endsAt: Date) {
    const hoursLeft = Math.floor((endsAt.getTime() - Date.now()) / 3600000);
    
    await this.show({
      id: `flash_${Date.now()}`,
      type: 'flash_sale',
      title: '⚡ FLASH SALE COMEÇOU!',
      body: `${discount}% OFF em ${product} por apenas ${hoursLeft} horas!`,
      priority: 'critical',
      data: { product, discount, hoursLeft },
    });
  }

  async sendLevelUpNotification(newLevel: number, rewards?: string[]) {
    await this.show({
      id: `levelup_${Date.now()}`,
      type: 'level_up',
      title: '🌟 SUBIU DE NÍVEL!',
      body: `Parabéns! Você alcançou o nível ${newLevel}!${rewards ? ` Recompensas: ${rewards.join(', ')}` : ''}`,
      priority: 'high',
      data: { level: newLevel, rewards },
    });
  }

  async sendChallengeComplete(challengeName: string, reward: string) {
    await this.show({
      id: `challenge_${Date.now()}`,
      type: 'challenge_complete',
      title: '🎯 Desafio Completo!',
      body: `Você completou "${challengeName}" e ganhou ${reward}!`,
      priority: 'medium',
      data: { challenge: challengeName, reward },
    });
  }

  async sendLeaderboardUpdate(previousRank: number, currentRank: number) {
    const change = previousRank > currentRank ? '📈 Você subiu' : '📉 Você desceu';
    
    await this.show({
      id: `leaderboard_${Date.now()}`,
      type: 'leaderboard_update',
      title: '📊 Mudança no Ranking!',
      body: `${change} no ranking! Posição atual: #${currentRank}`,
      priority: 'low',
      data: { change, position: currentRank },
    });
  }

  async scheduleDailySpinReminder() {
    await this.schedule(
      {
        id: 'daily_spin',
        type: 'daily_spin',
        title: '🎰 Roda da Sorte Disponível!',
        body: 'Seus giros diários foram renovados! Não perca!',
        priority: 'medium',
      },
      {
        type: 'daily',
        time: { hour: 10, minute: 0 },
      }
    );
  }

  // Métodos auxiliares

  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  private getImportance(priority?: string): AndroidImportance {
    switch (priority) {
      case 'critical':
        return AndroidImportance.HIGH;
      case 'high':
        return AndroidImportance.HIGH;
      case 'medium':
        return AndroidImportance.DEFAULT;
      case 'low':
        return AndroidImportance.LOW;
      default:
        return AndroidImportance.DEFAULT;
    }
  }

  private async snoozeNotification(notification: any, delayMs: number) {
    await this.cancelScheduled(notification.id);
    
    const snoozeTime = new Date(Date.now() + delayMs);
    await this.schedule(
      {
        id: `${notification.id}_snoozed`,
        type: notification.data.type,
        title: notification.title,
        body: notification.body,
        priority: 'high',
        data: notification.data,
      },
      {
        type: 'custom',
        time: { hour: snoozeTime.getHours(), minute: snoozeTime.getMinutes() },
        date: snoozeTime,
      }
    );
  }

  private async saveToHistory(notification: GamifiedNotification) {
    try {
      const history = await AsyncStorage.getItem('@notification_history');
      const notifications = history ? JSON.parse(history) : [];
      
      notifications.unshift({
        ...notification,
        sentAt: new Date().toISOString(),
        read: false,
      });
      
      // Manter apenas últimas 50 notificações
      if (notifications.length > 50) {
        notifications.length = 50;
      }
      
      await AsyncStorage.setItem('@notification_history', JSON.stringify(notifications));
    } catch (error) {
      // console.error('Erro ao salvar histórico de notificações:', error);
    }
  }

  private async markAsRead(notificationId: string) {
    try {
      const history = await AsyncStorage.getItem('@notification_history');
      if (history) {
        const notifications = JSON.parse(history);
        const notification = notifications.find((n: any) => n.id === notificationId);
        if (notification) {
          notification.read = true;
          await AsyncStorage.setItem('@notification_history', JSON.stringify(notifications));
        }
      }
    } catch (error) {
      // console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  async getHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem('@notification_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      // console.error('Erro ao obter histórico de notificações:', error);
      return [];
    }
  }

  async clearHistory() {
    try {
      await AsyncStorage.removeItem('@notification_history');
    } catch (error) {
      // console.error('Erro ao limpar histórico de notificações:', error);
    }
  }
}

export default GamifiedNotificationService.getInstance();