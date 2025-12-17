import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';
import { Notification, NotificationSettings } from '../../types/api';

/**
 * Redux Slice para gerenciamento de notificações
 */

// Estado do slice
export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  fcmToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'not-determined';
  filters: {
    type?: string;
    read?: boolean;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

// Estado inicial
const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  settings: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  fcmToken: null,
  permissionStatus: 'not-determined',
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  },
};

// Async Thunks

/**
 * Inicializar notificações
 */
export const initializeNotifications = createAsyncThunk(
  'notifications/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const _result = await notificationService.initialize();
      return _result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao inicializar notificações');
    }
  }
);

/**
 * Buscar notificações
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: { page?: number; filters?: any } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, filters = {} } = params;
      const _response = await notificationService.getNotifications(page, 20, filters);
      return {
        notifications: response.data,
        pagination: response.pagination,
        page,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar notificações');
    }
  }
);

/**
 * Marcar notificação como lida
 */
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao marcar como lida');
    }
  }
);

/**
 * Marcar todas como lidas
 */
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao marcar todas como lidas');
    }
  }
);

/**
 * Deletar notificação
 */
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao deletar notificação');
    }
  }
);

/**
 * Buscar configurações de notificação
 */
export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await notificationService.getSettings();
      return settings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar configurações');
    }
  }
);

/**
 * Atualizar configurações de notificação
 */
export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: Partial<NotificationSettings>, { rejectWithValue }) => {
    try {
      const updatedSettings = await notificationService.updateSettings(settings);
      return updatedSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar configurações');
    }
  }
);

/**
 * Registrar token FCM
 */
export const registerFCMToken = createAsyncThunk(
  'notifications/registerFCMToken',
  async (token: string, { rejectWithValue }) => {
    try {
      await notificationService.registerToken(token);
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao registrar token');
    }
  }
);

/**
 * Solicitar permissão de notificações
 */
export const requestPermission = createAsyncThunk(
  'notifications/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const result = await notificationService.requestPermissions();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao solicitar permissão');
    }
  }
);

// Slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Adicionar notificação em tempo real
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    // Definir filtros
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Limpar filtros
    clearFilters: (state) => {
      state.filters = {};
    },
    
    // Definir status de permissão
    setPermissionStatus: (state, action: PayloadAction<'granted' | 'denied' | 'not-determined'>) => {
      state.permissionStatus = action.payload;
    },
    
    // Definir token FCM
    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Resetar estado
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize notifications
    builder
      .addCase(initializeNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fcmToken = action.payload.token;
        state.permissionStatus = action.payload.permissionStatus;
      })
      .addCase(initializeNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.page === 1) {
          // First page - replace
          state.notifications = action.payload.notifications;
        } else {
          // Additional pages - append
          state.notifications = [...state.notifications, ...action.payload.notifications];
        }
        
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.notifications.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const _index = state.notifications.findIndex(n => n.id === action.payload);
        if (_index !== -1 && !state.notifications[0].read) {
          state.notifications[0].read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const _index = state.notifications.findIndex(n => n.id === action.payload);
        if (_index !== -1) {
          const notification = state.notifications[0];
          if (!notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(_index, 1);
        }
      });

    // Fetch settings
    builder
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // Update settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Register FCM token
    builder
      .addCase(registerFCMToken.fulfilled, (state, action) => {
        state.fcmToken = action.payload;
      });

    // Request Permission
    builder
      .addCase(requestPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPermission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissionStatus = action.payload.granted ? 'granted' : 'denied';
      })
      .addCase(requestPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.permissionStatus = 'denied';
      });
  },
});

// Actions
export const {
  addNotification,
  setFilters,
  clearFilters,
  setPermissionStatus,
  setFCMToken,
  clearError,
  resetNotifications,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationsState }) => state.notifications.notifications;
export const selectUnreadCount = (state: { notifications: NotificationsState }) => state.notifications.unreadCount;
export const selectNotificationSettings = (state: { notifications: NotificationsState }) => state.notifications.settings;
export const selectNotificationsLoading = (state: { notifications: NotificationsState }) => state.notifications.isLoading;
export const selectNotificationsUpdating = (state: { notifications: NotificationsState }) => state.notifications.isUpdating;
export const selectNotificationsError = (state: { notifications: NotificationsState }) => state.notifications.error;
export const selectFCMToken = (state: { notifications: NotificationsState }) => state.notifications.fcmToken;
export const selectFcmToken = selectFCMToken; // Alias for camelCase consistency
export const selectPermissionStatus = (state: { notifications: NotificationsState }) => state.notifications.permissionStatus;
export const selectIsPermissionGranted = (state: { notifications: NotificationsState }) => state.notifications.permissionStatus === 'granted';
export const selectIsNotificationsInitialized = (state: { notifications: NotificationsState }) => state.notifications.fcmToken !== null || state.notifications.permissionStatus !== 'not-determined';
export const selectNotificationFilters = (state: { notifications: NotificationsState }) => state.notifications.filters;
export const selectNotificationsPagination = (state: { notifications: NotificationsState }) => state.notifications.pagination;

export default notificationsSlice.reducer;