/* eslint-disable no-console */
import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import notifee from '@notifee/react-native';
import { notificationService } from '../notificationService';
import { httpClient } from '../httpClient';
import { navigationService } from '../navigationService';
import logger from '../loggerService';

// Mock das dependências
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(),
    getNotificationSettings: jest.fn(),
    createChannel: jest.fn(),
    displayNotification: jest.fn(),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
    getDisplayedNotifications: jest.fn(),
    getTriggerNotifications: jest.fn(),
    getBadgeCount: jest.fn(),
    setBadgeCount: jest.fn(),
    incrementBadgeCount: jest.fn(),
    decrementBadgeCount: jest.fn(),
    getInitialNotification: jest.fn(),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
  EventType: {
    PRESS: 1,
    DISMISSED: 2,
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 30,
  },
  PermissionsAndroid: {
    request: jest.fn(),
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
    openURL: jest.fn(),
  },
}));

jest.mock('../httpClient');
jest.mock('../navigationService');
jest.mock('../loggerService', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('deve inicializar com sucesso quando permissões são concedidas', async () => {
      // Mocks
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
      (notifee.createChannel as jest.Mock).mockResolvedValue(undefined);
      (notifee.onForegroundEvent as jest.Mock).mockImplementation(() => {});
      (notifee.onBackgroundEvent as jest.Mock).mockImplementation(() => {});

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: null,
        permissionStatus: 'granted',
      });
      expect(notifee.createChannel).toHaveBeenCalled();
      expect(notifee.onForegroundEvent).toHaveBeenCalled();
      expect(notifee.onBackgroundEvent).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Notificações inicializadas com @notifee');
    });

    it('deve retornar denied quando permissões são negadas', async () => {
      // Mocks
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: null,
        permissionStatus: 'denied',
      });
      expect(notifee.createChannel).not.toHaveBeenCalled();
    });

    it('deve tratar erros na inicialização', async () => {
      // Mock de erro
      const mockError = new Error('Initialization error');
      (PermissionsAndroid.request as jest.Mock).mockRejectedValue(mockError);

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: null,
        permissionStatus: 'denied',
      });
      expect(logger.error).toHaveBeenCalledWith('Error initializing notifications:', mockError);
    });
  });

  describe('requestPermissions', () => {
    it('deve solicitar permissões no Android 13+', async () => {
      // Mock Android 13+
      (Platform.Version as any) = 33;
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    });

    it('deve solicitar permissões no Android < 13', async () => {
      // Mock Android < 13
      (Platform.Version as any) = 30;

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    });

    it('deve solicitar permissões no iOS', async () => {
      // Mock iOS
      (Platform.OS as any) = 'ios';
      (notifee.requestPermission as jest.Mock).mockResolvedValue({
        authorizationStatus: 1, // AUTHORIZED
      });

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(notifee.requestPermission).toHaveBeenCalled();

      // Restaurar
      (Platform.OS as any) = 'android';
    });

    it('deve retornar denied quando permissão é negada', async () => {
      (Platform.Version as any) = 33;
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
    });

    it('deve tratar erros na solicitação de permissões', async () => {
      const mockError = new Error('Permission error');
      (Platform.Version as any) = 33;
      (PermissionsAndroid.request as jest.Mock).mockRejectedValue(mockError);

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
      expect(logger.error).toHaveBeenCalledWith('Error requesting permissions:', mockError);
    });
  });

  describe('registerToken', () => {
    it('deve registrar token no backend', async () => {
      const mockToken = 'device-token-123';
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.post as jest.Mock) = mockPost;

      await notificationService.registerToken(mockToken);

      expect(mockPost).toHaveBeenCalledWith('/notifications/register-token', {
        token: mockToken,
        platform: Platform.OS,
      });
    });

    it('deve tratar erro ao registrar token', async () => {
      const mockError = new Error('Registration error');
      const mockPost = jest.fn().mockRejectedValue(mockError);
      (httpClient.post as jest.Mock) = mockPost;

      await expect(notificationService.registerToken('token')).rejects.toThrow('Registration error');
      expect(logger.error).toHaveBeenCalledWith('Error registering device token:', mockError);
    });
  });

  describe('getNotifications', () => {
    it('deve buscar notificações com paginação', async () => {
      const mockResponse = {
        data: [
          { id: '1', title: 'Notificação 1' },
          { id: '2', title: 'Notificação 2' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      const mockGet = jest.fn().mockResolvedValue({ data: mockResponse });
      (httpClient.get as jest.Mock) = mockGet;

      const result = await notificationService.getNotifications(1, 10);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledWith('/notifications', {
        params: { page: 1, per_page: 10 },
      });
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const notificationId = 'notif-123';
      const mockPatch = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.patch as jest.Mock) = mockPatch;

      await notificationService.markAsRead(notificationId);

      expect(mockPatch).toHaveBeenCalledWith(`/notifications/${notificationId}/read`);
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      const mockPatch = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.patch as jest.Mock) = mockPatch;

      await notificationService.markAllAsRead();

      expect(mockPatch).toHaveBeenCalledWith('/notifications/mark-all-read');
    });
  });

  describe('deleteNotification', () => {
    it('deve deletar notificação', async () => {
      const notificationId = 'notif-456';
      const mockDelete = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.delete as jest.Mock) = mockDelete;

      await notificationService.deleteNotification(notificationId);

      expect(mockDelete).toHaveBeenCalledWith(`/notifications/${notificationId}`);
    });
  });

  describe('getSettings', () => {
    it('deve obter configurações de notificação', async () => {
      const mockSettings = {
        email: true,
        push: true,
        marketing: false,
      };

      const mockGet = jest.fn().mockResolvedValue({ data: mockSettings });
      (httpClient.get as jest.Mock) = mockGet;

      const settings = await notificationService.getSettings();

      expect(settings).toEqual(mockSettings);
      expect(mockGet).toHaveBeenCalledWith('/notifications/settings');
    });
  });

  describe('updateSettings', () => {
    it('deve atualizar configurações de notificação', async () => {
      const newSettings = {
        email: false,
        push: true,
        marketing: true,
      };

      const mockPatch = jest.fn().mockResolvedValue({ data: newSettings });
      (httpClient.patch as jest.Mock) = mockPatch;

      const result = await notificationService.updateSettings(newSettings);

      expect(result).toEqual(newSettings);
      expect(mockPatch).toHaveBeenCalledWith('/notifications/settings', newSettings);
    });
  });

  describe('getBadgeCount', () => {
    it('deve obter contagem de badge', async () => {
      const mockCount = 5;
      const mockGet = jest.fn().mockResolvedValue({ data: { count: mockCount } });
      (httpClient.get as jest.Mock) = mockGet;

      const count = await notificationService.getBadgeCount();

      expect(count).toBe(mockCount);
      expect(mockGet).toHaveBeenCalledWith('/notifications/badge-count');
    });

    it('deve retornar 0 em caso de erro', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Error'));
      (httpClient.get as jest.Mock) = mockGet;

      const count = await notificationService.getBadgeCount();

      expect(count).toBe(0);
    });
  });

  describe('clearBadgeCount', () => {
    it('deve limpar badge count', async () => {
      const mockPatch = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.patch as jest.Mock) = mockPatch;

      await notificationService.clearBadgeCount();

      expect(mockPatch).toHaveBeenCalledWith('/notifications/clear-badge');
    });
  });

  describe('checkPermission', () => {
    it('deve verificar status de permissão autorizado', async () => {
      (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: 1, // AUTHORIZED
      });

      const hasPermission = await notificationService.checkPermission();

      expect(hasPermission).toBe('granted');
      expect(notifee.getNotificationSettings).toHaveBeenCalled();
    });

    it('deve verificar status de permissão negado', async () => {
      (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
        authorizationStatus: 2, // DENIED
      });

      const hasPermission = await notificationService.checkPermission();

      expect(hasPermission).toBe('denied');
    });

    it('deve retornar denied em caso de erro', async () => {
      (notifee.getNotificationSettings as jest.Mock).mockRejectedValue(new Error('Error'));

      const hasPermission = await notificationService.checkPermission();

      expect(hasPermission).toBe('denied');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('openSettings', () => {
    it('deve abrir configurações no Android', async () => {
      (Platform.OS as any) = 'android';
      (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

      await notificationService.openSettings();

      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('deve abrir configurações no iOS', async () => {
      (Platform.OS as any) = 'ios';
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await notificationService.openSettings();

      expect(Linking.openURL).toHaveBeenCalledWith('app-settings:');
    });
  });

  describe('createNotificationChannel', () => {
    it('deve criar canais de notificação no Android', async () => {
      (Platform.OS as any) = 'android';
      (notifee.createChannel as jest.Mock).mockResolvedValue(undefined);

      await notificationService.createNotificationChannel();

      expect(notifee.createChannel).toHaveBeenCalledTimes(3); // default, orders, promotions
    });

    it('não deve criar canais no iOS', async () => {
      (Platform.OS as any) = 'ios';

      await notificationService.createNotificationChannel();

      expect(notifee.createChannel).not.toHaveBeenCalled();
    });
  });

  describe('displayLocalNotification', () => {
    it('deve exibir notificação local', async () => {
      const notification = {
        title: 'Teste',
        body: 'Mensagem de teste',
        data: { type: 'test' },
      };

      (notifee.displayNotification as jest.Mock).mockResolvedValue(undefined);

      await notificationService.displayLocalNotification(notification);

      expect(notifee.displayNotification).toHaveBeenCalledWith({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
        },
        ios: undefined,
      });
    });
  });

  describe('getInitialNotification', () => {
    it('deve obter notificação inicial', async () => {
      const mockNotification = {
        notification: {
          id: '123',
          title: 'Test',
          body: 'Test body',
        },
      };

      (notifee.getInitialNotification as jest.Mock).mockResolvedValue(mockNotification);

      const result = await notificationService.getInitialNotification();

      expect(result).toEqual(mockNotification);
      expect(notifee.getInitialNotification).toHaveBeenCalled();
    });

    it('deve retornar null em caso de erro', async () => {
      (notifee.getInitialNotification as jest.Mock).mockRejectedValue(new Error('Error'));

      const result = await notificationService.getInitialNotification();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
