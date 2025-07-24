import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import logger from '../services/loggerService';
import {
  selectLiveEvents,
  selectIsConnected,
} from '../store/slices/realtimeSlice';
import {
  addNotification,
} from '../store/slices/notificationsSlice';
import { useNotifications } from './useNotifications';

/**
 * Hook para gerenciar notificações em tempo real
 */

interface LiveNotificationOptions {
  enableToasts?: boolean;
  enableBadgeUpdates?: boolean;
  enableSounds?: boolean;
  filterTypes?: string[];
}

interface LiveNotification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'box' | 'promotion' | 'system' | 'social';
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  timestamp: number;
  showToast?: boolean;
  playSound?: boolean;
}

export const useLiveNotifications = (options: LiveNotificationOptions = {}) => {
  const {
    enableToasts = true,
    enableBadgeUpdates = true,
    enableSounds = true,
    filterTypes = [],
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const { settings } = useNotifications();

  // Redux state
  const liveEvents = useSelector(selectLiveEvents);
  const isConnected = useSelector(selectIsConnected);

  // Local state
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());
  const [toastQueue, setToastQueue] = useState<LiveNotification[]>([]);

  /**
   * Convert live event to notification
   */
  const convertEventToNotification = useCallback((event: any): LiveNotification | null => {
    switch (event.type) {
      case 'order_status_changed':
        return {
          id: `order_${event.id}`,
          title: 'Status do Pedido Atualizado',
          body: `Seu pedido #${event.data.orderId} foi ${event.data.status}`,
          type: 'order',
          data: event.data,
          priority: 'high',
          timestamp: event.timestamp,
          showToast: true,
          playSound: true,
        };

      case 'new_box':
        return {
          id: `box_${event.id}`,
          title: 'Nova Caixa Disponível!',
          body: `${event.data.name} foi lançada na loja`,
          type: 'box',
          data: event.data,
          priority: 'normal',
          timestamp: event.timestamp,
          showToast: true,
          playSound: false,
        };

      case 'promotion_started':
        return {
          id: `promo_${event.id}`,
          title: 'Promoção Especial!',
          body: `${event.data.title} - ${event.data.discount}% de desconto`,
          type: 'promotion',
          data: event.data,
          priority: 'normal',
          timestamp: event.timestamp,
          showToast: true,
          playSound: false,
        };

      case 'friend_opened_box':
        return {
          id: `social_${event.id}`,
          title: 'Amigo Abriu uma Caixa',
          body: `${event.data.friendName} abriu ${event.data.boxName}`,
          type: 'social',
          data: event.data,
          priority: 'low',
          timestamp: event.timestamp,
          showToast: false,
          playSound: false,
        };

      case 'system_maintenance':
        return {
          id: `system_${event.id}`,
          title: 'Manutenção do Sistema',
          body: event.data.message || 'O sistema entrará em manutenção em breve',
          type: 'system',
          data: event.data,
          priority: 'high',
          timestamp: event.timestamp,
          showToast: true,
          playSound: true,
        };

      case 'low_stock_alert':
        return {
          id: `stock_${event.id}`,
          title: 'Estoque Baixo!',
          body: `${event.data.boxName} está quase esgotada`,
          type: 'box',
          data: event.data,
          priority: 'normal',
          timestamp: event.timestamp,
          showToast: true,
          playSound: false,
        };

      default:
        return null;
    }
  }, []);

  /**
   * Process live events into notifications
   */
  useEffect(() => {
    if (!isConnected || !settings?.enabled) return;

    const newEvents = liveEvents.filter(event => 
      !processedEvents.has(event.id) &&
      (filterTypes.length === 0 || filterTypes.includes(event.type))
    );

    const newNotifications: LiveNotification[] = [];

    newEvents.forEach(event => {
      const notification = convertEventToNotification(event);
      
      if (notification) {
        // Check if notification type is enabled in settings
        const typeEnabled = settings[notification.type as keyof typeof settings];
        
        if (typeEnabled) {
          newNotifications.push(notification);
          
          // Add to Redux store
          dispatch(addNotification({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            data: notification.data,
            isRead: false,
            timestamp: notification.timestamp,
            priority: notification.priority,
          }));
        }
      }
      
      // Mark as processed
      setProcessedEvents(prev => new Set([...prev, event.id]));
    });

    // Add to toast queue if enabled
    if (enableToasts && newNotifications.length > 0) {
      const toastNotifications = newNotifications.filter(n => n.showToast);
      setToastQueue(prev => [...prev, ...toastNotifications]);
    }

  }, [
    liveEvents,
    isConnected,
    settings,
    processedEvents,
    filterTypes,
    enableToasts,
    convertEventToNotification,
    dispatch,
  ]);

  /**
   * Show next toast notification
   */
  const showNextToast = useCallback(() => {
    if (toastQueue.length === 0) return null;
    
    const [nextToast, ...remainingToasts] = toastQueue;
    setToastQueue(remainingToasts);
    
    return nextToast;
  }, [toastQueue]);

  /**
   * Clear toast queue
   */
  const clearToastQueue = useCallback(() => {
    setToastQueue([]);
  }, []);

  /**
   * Play notification sound
   */
  const playNotificationSound = useCallback((notification: LiveNotification) => {
    if (!enableSounds || !settings?.sound || !notification.playSound) return;
    
    // In a real app, you would play a sound file here
    // For now, we'll just log it
    logger.debug(`Playing notification sound for: ${notification.title}`);
  }, [enableSounds, settings?.sound]);

  /**
   * Update app badge count
   */
  const updateBadgeCount = useCallback((count: number) => {
    if (!enableBadgeUpdates) return;
    
    // In a real app, you would update the app badge here
    // For React Native, you might use a library like react-native-badge
    logger.debug(`Updating app badge count to: ${count}`);
  }, [enableBadgeUpdates]);

  /**
   * Handle notification tap
   */
  const handleNotificationTap = useCallback((notification: LiveNotification) => {
    // Handle navigation based on notification type and data
    switch (notification.type) {
      case 'order':
        // Navigate to order details
        logger.debug('Navigate to order:', notification.data?.orderId);
        break;
      case 'box':
        // Navigate to box details
        logger.debug('Navigate to box:', notification.data?.boxId);
        break;
      case 'promotion':
        // Navigate to promotion
        logger.debug('Navigate to promotion:', notification.data?.promotionId);
        break;
      case 'social':
        // Navigate to social feed
        logger.debug('Navigate to social feed');
        break;
      case 'system':
        // Show system message
        logger.debug('Show system message:', notification.body);
        break;
    }
  }, []);

  /**
   * Get notification statistics
   */
  const getNotificationStats = useCallback(() => {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = liveEvents.filter(event => event.timestamp > last24Hours);
    
    const stats = {
      total: recentEvents.length,
      byType: recentEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      pending: toastQueue.length,
      processed: processedEvents.size,
    };
    
    return stats;
  }, [liveEvents, toastQueue.length, processedEvents.size]);

  return {
    // State
    isConnected,
    toastQueue,
    hasToasts: toastQueue.length > 0,
    
    // Actions
    showNextToast,
    clearToastQueue,
    playNotificationSound,
    updateBadgeCount,
    handleNotificationTap,
    
    // Utilities
    getNotificationStats,
    isEnabled: settings?.enabled && isConnected,
  };
};

/**
 * Hook específico para notificações de pedidos
 */
export const useOrderNotifications = () => {
  return useLiveNotifications({
    filterTypes: ['order_status_changed', 'order_shipped', 'order_delivered'],
    enableToasts: true,
    enableSounds: true,
  });
};

/**
 * Hook específico para notificações de promoções
 */
export const usePromotionNotifications = () => {
  return useLiveNotifications({
    filterTypes: ['promotion_started', 'promotion_ending', 'flash_sale'],
    enableToasts: true,
    enableSounds: false,
  });
};

/**
 * Hook específico para notificações sociais
 */
export const useSocialNotifications = () => {
  return useLiveNotifications({
    filterTypes: ['friend_opened_box', 'friend_joined', 'achievement_unlocked'],
    enableToasts: false,
    enableSounds: false,
  });
};

export default useLiveNotifications;
