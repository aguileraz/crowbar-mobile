import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, Linking } from 'react-native';
import notifee from '@notifee/react-native';
import { notificationService } from '../notificationService';
import { httpClient } from '../httpClient';
import { navigationService } from '../navigationService';

// Mock das dependências
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(),
    onTokenRefresh: jest.fn(),
    deleteToken: jest.fn(),
    hasPermission: jest.fn(),
  })),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: -1,
    NOT_DETERMINED: 0,
  },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
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
  },
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
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
  },
}));

jest.mock('../httpClient');
jest.mock('../navigationService');

describe('NotificationService', () => {
  const mockMessaging = messaging as jest.MockedFunction<typeof messaging>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset do token FCM
    (notificationService as any).fcmToken = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('deve inicializar com sucesso quando permissões são concedidas', async () => {
      // Mocks
      const mockToken = 'fcm-token-123';
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      const mockGetToken = jest.fn().mockResolvedValue(mockToken);
      const mockRegisterToken = jest.spyOn(notificationService as any, 'registerToken').mockResolvedValue(undefined);
      
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
        getToken: mockGetToken,
        onMessage: jest.fn(),
        onNotificationOpenedApp: jest.fn(),
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onTokenRefresh: jest.fn(),
      } as any);

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: mockToken,
        permissionStatus: 'granted',
      });
      expect(mockGetToken).toHaveBeenCalled();
      expect(mockRegisterToken).toHaveBeenCalledWith(mockToken);
      expect((notificationService as any).fcmToken).toBe(mockToken);
    });

    it('deve retornar null quando permissões são negadas', async () => {
      // Mocks
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.DENIED);
      
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: null,
        permissionStatus: 'denied',
      });
      expect((notificationService as any).fcmToken).toBeNull();
    });

    it('deve tratar erros na inicialização', async () => {
      // Mock de erro
      const mockError = new Error('Initialization error');
      mockMessaging.mockImplementation(() => {
        throw mockError;
      });

      // Executar
      const result = await notificationService.initialize();

      // Verificar
      expect(result).toEqual({
        token: null,
        permissionStatus: 'denied',
      });
      expect(console.error).toHaveBeenCalledWith('Error initializing notifications:', mockError);
    });
  });

  describe('requestPermissions', () => {
    it('deve solicitar permissões no Android 13+', async () => {
      // Mock Android 13+
      (Platform.Version as any) = 33;
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
      
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('deve solicitar permissões no Android < 13', async () => {
      // Mock Android < 13
      (Platform.Version as any) = 30;
      
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('deve solicitar permissões no iOS', async () => {
      // Mock iOS
      (Platform.OS as any) = 'ios';
      
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      // Executar
      const result = await notificationService.requestPermissions();

      // Verificar
      expect(result).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
      
      // Restaurar
      (Platform.OS as any) = 'android';
    });

    it('deve retornar denied quando permissão é negada', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.DENIED);
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
    });

    it('deve tratar erros na solicitação de permissões', async () => {
      const mockError = new Error('Permission error');
      const mockRequestPermission = jest.fn().mockRejectedValue(mockError);
      mockMessaging.mockReturnValue({
        requestPermission: mockRequestPermission,
      } as any);

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
      expect(console.error).toHaveBeenCalledWith('Error requesting permissions:', mockError);
    });
  });

  describe('getFCMToken', () => {
    it('deve obter token FCM com sucesso', async () => {
      const mockToken = 'fcm-token-456';
      const mockGetToken = jest.fn().mockResolvedValue(mockToken);
      mockMessaging.mockReturnValue({
        getToken: mockGetToken,
      } as any);

      const token = await notificationService.getFCMToken();
      
      expect(token).toBe(mockToken);
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('deve retornar null em caso de erro', async () => {
      const mockError = new Error('Token error');
      const mockGetToken = jest.fn().mockRejectedValue(mockError);
      mockMessaging.mockReturnValue({
        getToken: mockGetToken,
      } as any);

      const token = await notificationService.getFCMToken();
      
      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error getting FCM token:', mockError);
    });
  });

  describe('Message Listeners', () => {
    it('deve configurar listeners de mensagem', async () => {
      const mockOnMessage = jest.fn();
      const mockOnNotificationOpenedApp = jest.fn();
      const mockGetInitialNotification = jest.fn().mockResolvedValue(null);
      const mockOnTokenRefresh = jest.fn();
      
      mockMessaging.mockReturnValue({
        requestPermission: jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED),
        getToken: jest.fn().mockResolvedValue('token'),
        onMessage: mockOnMessage,
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
        getInitialNotification: mockGetInitialNotification,
        onTokenRefresh: mockOnTokenRefresh,
      } as any);

      jest.spyOn(notificationService as any, 'registerToken').mockResolvedValue(undefined);

      await notificationService.initialize();

      expect(mockOnMessage).toHaveBeenCalled();
      expect(mockOnNotificationOpenedApp).toHaveBeenCalled();
      expect(mockGetInitialNotification).toHaveBeenCalled();
      expect(mockOnTokenRefresh).toHaveBeenCalled();
    });

    it('deve tratar mensagem em foreground', async () => {
      const remoteMessage = {
        notification: {
          title: 'Teste',
          body: 'Mensagem de teste',
        },
        data: { type: 'test' },
      };

      // Chamar método privado
      (notificationService as any).handleForegroundMessage(remoteMessage);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Teste',
        'Mensagem de teste',
        expect.any(Array)
      );
    });

    it('deve tratar abertura de notificação', async () => {
      const remoteMessage = {
        data: {
          type: 'order',
          orderId: '123',
        },
      };

      const mockNavigate = jest.fn();
      (navigationService.navigate as jest.Mock) = mockNavigate;

      // Simular delay para navegação
      setTimeout(() => {
        (notificationService as any).handleNotificationOpen(remoteMessage);
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockNavigate).toHaveBeenCalledWith('Orders', { orderId: '123' });
    });
  });

  describe('Token Management', () => {
    it('deve registrar token no backend', async () => {
      const mockToken = 'fcm-token-789';
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.post as jest.Mock) = mockPost;

      await (notificationService as any).registerToken(mockToken);

      expect(mockPost).toHaveBeenCalledWith('/notifications/register-token', {
        token: mockToken,
        platform: Platform.OS,
      });
    });

    it('deve desregistrar token', async () => {
      const mockToken = 'fcm-token-to-remove';
      (notificationService as any).fcmToken = mockToken;
      
      const mockDelete = jest.fn().mockResolvedValue({ data: { success: true } });
      const mockDeleteToken = jest.fn().mockResolvedValue(undefined);
      
      (httpClient.delete as jest.Mock) = mockDelete;
      mockMessaging.mockReturnValue({
        deleteToken: mockDeleteToken,
      } as any);

      await notificationService.unregisterToken();

      expect(mockDelete).toHaveBeenCalledWith(`/notifications/unregister-token/${mockToken}`);
      expect(mockDeleteToken).toHaveBeenCalled();
      expect((notificationService as any).fcmToken).toBeNull();
    });
  });

  describe('Notification Settings', () => {
    it('deve obter configurações de notificação', async () => {
      const mockSettings = {
        email: true,
        push: true,
        marketing: false,
      };
      
      const mockGet = jest.fn().mockResolvedValue({ data: mockSettings });
      (httpClient.get as jest.Mock) = mockGet;

      const settings = await notificationService.getNotificationSettings();

      expect(settings).toEqual(mockSettings);
      expect(mockGet).toHaveBeenCalledWith('/notifications/settings');
    });

    it('deve atualizar configurações de notificação', async () => {
      const newSettings = {
        email: false,
        push: true,
        marketing: true,
      };
      
      const mockPut = jest.fn().mockResolvedValue({ data: newSettings });
      (httpClient.put as jest.Mock) = mockPut;

      const result = await notificationService.updateNotificationSettings(newSettings);

      expect(result).toEqual(newSettings);
      expect(mockPut).toHaveBeenCalledWith('/notifications/settings', newSettings);
    });
  });

  describe('Notification Management', () => {
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
        params: { page: 1, limit: 10 },
      });
    });

    it('deve marcar notificação como lida', async () => {
      const notificationId = 'notif-123';
      const mockPut = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.put as jest.Mock) = mockPut;

      await notificationService.markAsRead(notificationId);

      expect(mockPut).toHaveBeenCalledWith(`/notifications/${notificationId}/read`);
    });

    it('deve marcar todas as notificações como lidas', async () => {
      const mockPut = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.put as jest.Mock) = mockPut;

      await notificationService.markAllAsRead();

      expect(mockPut).toHaveBeenCalledWith('/notifications/read-all');
    });

    it('deve deletar notificação', async () => {
      const notificationId = 'notif-456';
      const mockDelete = jest.fn().mockResolvedValue({ data: { success: true } });
      (httpClient.delete as jest.Mock) = mockDelete;

      await notificationService.deleteNotification(notificationId);

      expect(mockDelete).toHaveBeenCalledWith(`/notifications/${notificationId}`);
    });
  });

  describe('Badge Management', () => {
    it('deve obter contagem de badge', async () => {
      const mockCount = 5;
      (notifee.getBadgeCount as jest.Mock).mockResolvedValue(mockCount);

      const count = await notificationService.getBadgeCount();

      expect(count).toBe(mockCount);
      expect(notifee.getBadgeCount).toHaveBeenCalled();
    });

    it('deve definir contagem de badge', async () => {
      const count = 10;
      (notifee.setBadgeCount as jest.Mock).mockResolvedValue(undefined);

      await notificationService.setBadgeCount(count);

      expect(notifee.setBadgeCount).toHaveBeenCalledWith(count);
    });

    it('deve limpar badge', async () => {
      (notifee.setBadgeCount as jest.Mock).mockResolvedValue(undefined);

      await notificationService.clearBadge();

      expect(notifee.setBadgeCount).toHaveBeenCalledWith(0);
    });
  });

  describe('Permission Check', () => {
    it('deve verificar status de permissão atual', async () => {
      const mockHasPermission = jest.fn().mockResolvedValue(messaging.AuthorizationStatus.AUTHORIZED);
      mockMessaging.mockReturnValue({
        hasPermission: mockHasPermission,
      } as any);

      const hasPermission = await notificationService.checkPermissions();

      expect(hasPermission).toBe(true);
      expect(mockHasPermission).toHaveBeenCalled();
    });

    it('deve abrir configurações quando solicitado', async () => {
      await notificationService.openNotificationSettings();

      expect(Linking.openSettings).toHaveBeenCalled();
    });
  });
});