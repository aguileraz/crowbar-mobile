import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  initializeNotifications,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateSettings,
  requestPermission,
  addNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationSettings,
  selectFcmToken,
  selectIsPermissionGranted,
  selectNotificationsLoading,
  selectNotificationsError,
  selectIsNotificationsInitialized,
} from '../store/slices/notificationsSlice';
import { notificationService } from '../services/notificationService';

/**
 * Hook personalizado para gerenciar notificações
 */

interface UseNotificationsOptions {
  autoInitialize?: boolean;
  enableRealtime?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    autoInitialize = true,
    enableRealtime = true,
  } = options;

  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const settings = useSelector(selectNotificationSettings);
  const fcmToken = useSelector(selectFcmToken);
  const isPermissionGranted = useSelector(selectIsPermissionGranted);
  const isLoading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const isInitialized = useSelector(selectIsNotificationsInitialized);

  /**
   * Initialize notifications
   */
  const initialize = useCallback(async () => {
    try {
      await dispatch(initializeNotifications()).unwrap();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }, [dispatch]);

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async (page = 1, reset = false) => {
    try {
      await dispatch(fetchNotifications({ page, reset })).unwrap();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [dispatch]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [dispatch]);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [dispatch]);

  /**
   * Delete notification
   */
  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [dispatch]);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(async (newSettings: any) => {
    try {
      await dispatch(updateSettings(newSettings)).unwrap();
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, [dispatch]);

  /**
   * Request notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    try {
      const result = await dispatch(requestPermission()).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return { granted: false };
    }
  }, [dispatch]);

  /**
   * Add notification (for real-time)
   */
  const addNewNotification = useCallback((notification: any) => {
    dispatch(addNotification(notification));
  }, [dispatch]);

  /**
   * Setup real-time notification listeners
   */
  useEffect(() => {
    if (!enableRealtime || !isInitialized) return;

    // Setup FCM message listeners
    const setupListeners = async () => {
      try {
        // Foreground message listener
        const unsubscribeForeground = notificationService.onMessage((message) => {
          console.log('Foreground message received:', message);
          
          // Add to notifications list
          const notification = {
            id: Date.now().toString(),
            title: message.notification?.title || 'Nova notificação',
            body: message.notification?.body || '',
            type: message.data?.type || 'system',
            data: message.data,
            imageUrl: message.notification?.android?.imageUrl,
            isRead: false,
            timestamp: Date.now(),
            priority: 'normal' as const,
          };
          
          addNewNotification(notification);
        });

        // Background message listener
        const unsubscribeBackground = notificationService.onBackgroundMessage((message) => {
          console.log('Background message received:', message);
          // Handle background message
        });

        // Token refresh listener
        const unsubscribeTokenRefresh = notificationService.onTokenRefresh((token) => {
          console.log('FCM token refreshed:', token);
          // Update token in backend
        });

        return () => {
          unsubscribeForeground();
          unsubscribeBackground();
          unsubscribeTokenRefresh();
        };
      } catch (error) {
        console.error('Error setting up notification listeners:', error);
      }
    };

    const cleanup = setupListeners();
    
    return () => {
      if (cleanup) {
        cleanup.then(fn => fn && fn());
      }
    };
  }, [enableRealtime, isInitialized, addNewNotification]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initialize]);

  return {
    // State
    notifications,
    unreadCount,
    settings,
    fcmToken,
    isPermissionGranted,
    isLoading,
    error,
    isInitialized,
    
    // Actions
    initialize,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    updateNotificationSettings,
    requestNotificationPermission,
    addNewNotification,
    
    // Utilities
    hasUnreadNotifications: unreadCount > 0,
    isReady: isInitialized && isPermissionGranted,
  };
};

/**
 * Hook específico para badge de notificações
 */
export const useNotificationBadge = () => {
  const unreadCount = useSelector(selectUnreadCount);
  const isPermissionGranted = useSelector(selectIsPermissionGranted);
  
  return {
    count: unreadCount,
    shouldShow: unreadCount > 0 && isPermissionGranted,
    displayCount: unreadCount > 99 ? '99+' : unreadCount.toString(),
  };
};

/**
 * Hook específico para configurações de notificação
 */
export const useNotificationSettings = () => {
  const { settings, updateNotificationSettings, isLoading } = useNotifications();
  
  const updateSetting = useCallback(async (key: string, value: any) => {
    if (!settings) return;
    
    const updates = { [key]: value };
    await updateNotificationSettings(updates);
  }, [settings, updateNotificationSettings]);
  
  const updateQuietHours = useCallback(async (field: string, value: any) => {
    if (!settings) return;
    
    const updates = {
      quietHours: {
        ...settings.quietHours,
        [field]: value,
      },
    };
    
    await updateNotificationSettings(updates);
  }, [settings, updateNotificationSettings]);
  
  return {
    settings,
    updateSetting,
    updateQuietHours,
    isLoading,
  };
};

/**
 * Hook específico para permissões de notificação
 */
export const useNotificationPermissions = () => {
  const { 
    isPermissionGranted, 
    fcmToken, 
    requestNotificationPermission,
    isInitialized 
  } = useNotifications();
  
  const checkPermission = useCallback(async () => {
    try {
      const status = await notificationService.checkPermission();
      return status;
    } catch (error) {
      console.error('Error checking permission:', error);
      return 'denied';
    }
  }, []);
  
  const openSettings = useCallback(async () => {
    try {
      await notificationService.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }, []);
  
  return {
    isGranted: isPermissionGranted,
    hasToken: !!fcmToken,
    isReady: isInitialized,
    requestPermission: requestNotificationPermission,
    checkPermission,
    openSettings,
  };
};

/**
 * Hook específico para filtros de notificação
 */
export const useNotificationFilters = () => {
  const notifications = useSelector(selectNotifications);
  
  const filterByType = useCallback((type: string) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);
  
  const filterByRead = useCallback((isRead: boolean) => {
    return notifications.filter(notification => notification.isRead === isRead);
  }, [notifications]);
  
  const filterByDate = useCallback((days: number) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return notifications.filter(notification => notification.timestamp > cutoff);
  }, [notifications]);
  
  const getNotificationsByType = useCallback(() => {
    return notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {} as Record<string, any[]>);
  }, [notifications]);
  
  return {
    filterByType,
    filterByRead,
    filterByDate,
    getNotificationsByType,
    unreadNotifications: filterByRead(false),
    recentNotifications: filterByDate(7), // Last 7 days
  };
};

export default useNotifications;
