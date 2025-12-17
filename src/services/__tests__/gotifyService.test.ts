/**
 * Testes Unitários - GotifyService
 * 
 * Cobertura completa do serviço de notificações push via Gotify WebSocket
 * 
 * Categorias de testes:
 * 1. Inicialização de canais de notificação
 * 2. Conexão WebSocket
 * 3. Recebimento de mensagens
 * 4. Exibição de notificações locais
 * 5. Gerenciamento de mensagens (get, delete)
 * 6. Tratamento de erros
 */

import gotifyService, { GotifyMessage, NotificationHandler } from '../gotifyService';
import notifee from '@notifee/react-native';
import io from 'socket.io-client';
import logger from '../loggerService';

// Mocks
jest.mock('@notifee/react-native');
jest.mock('socket.io-client');
jest.mock('../loggerService', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('GotifyService', () => {
  let mockSocket: any;
  let mockCreateChannel: jest.Mock;
  let mockDisplayNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Socket.IO
    mockSocket = {
      on: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };
    (io as jest.Mock).mockReturnValue(mockSocket);

    // Mock Notifee
    mockCreateChannel = jest.fn().mockResolvedValue(undefined);
    mockDisplayNotification = jest.fn().mockResolvedValue(undefined);
    (notifee.createChannel as jest.Mock) = mockCreateChannel;
    (notifee.displayNotification as jest.Mock) = mockDisplayNotification;

    // Reset service state
    (gotifyService as any).socket = null;
    (gotifyService as any).connected = false;
    (gotifyService as any).clientToken = '';
    (gotifyService as any).notificationHandler = null;
  });

  describe('initialize()', () => {
    it('should create default notification channel', async () => {
      await gotifyService.initialize();

      expect(mockCreateChannel).toHaveBeenCalledWith({
        id: 'default',
        name: 'Notificações Crowbar',
        importance: expect.any(Number),
        sound: 'default',
      });
    });

    it('should create critical notification channel', async () => {
      await gotifyService.initialize();

      expect(mockCreateChannel).toHaveBeenCalledWith({
        id: 'critical',
        name: 'Notificações Críticas',
        importance: expect.any(Number),
        sound: 'default',
        vibration: true,
      });
    });

    it('should create normal notification channel', async () => {
      await gotifyService.initialize();

      expect(mockCreateChannel).toHaveBeenCalledWith({
        id: 'normal',
        name: 'Notificações Normais',
        importance: expect.any(Number),
      });
    });

    it('should handle errors when creating channels', async () => {
      mockCreateChannel.mockRejectedValueOnce(new Error('Channel creation failed'));

      await gotifyService.initialize();

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating notification channels:',
        expect.any(Error)
      );
    });
  });

  describe('connect()', () => {
    it('should connect to Gotify WebSocket with token', () => {
      const token = 'test-token-123';

      gotifyService.connect(token);

      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('gotify'),
        expect.objectContaining({
          path: '/stream',
          query: { token },
          transports: ['websocket'],
        })
      );
    });

    it('should not connect if already connected', () => {
      const token = 'test-token-123';
      (gotifyService as any).socket = mockSocket;
      mockSocket.connected = true;

      gotifyService.connect(token);

      expect(logger.warn).toHaveBeenCalledWith('Already connected to Gotify');
      expect(io).not.toHaveBeenCalled();
    });

    it('should not connect if token is empty', () => {
      gotifyService.connect('');

      expect(logger.error).toHaveBeenCalledWith('No client token provided');
      expect(io).not.toHaveBeenCalled();
    });

    it('should register connect event handler', () => {
      const token = 'test-token-123';

      gotifyService.connect(token);

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should register disconnect event handler', () => {
      const token = 'test-token-123';

      gotifyService.connect(token);

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should register message event handler', () => {
      const token = 'test-token-123';

      gotifyService.connect(token);

      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should register error event handler', () => {
      const token = 'test-token-123';

      gotifyService.connect(token);

      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should set connected to true on connect event', () => {
      const token = 'test-token-123';
      let connectHandler: () => void;

      mockSocket.on.mockImplementation((event: string, handler: () => void) => {
        if (event === 'connect') {
          connectHandler = handler;
        }
      });

      gotifyService.connect(token);
      connectHandler!();

      expect((gotifyService as any).connected).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Connected to Gotify');
    });

    it('should set connected to false on disconnect event', () => {
      const token = 'test-token-123';
      let disconnectHandler: (reason: string) => void;

      mockSocket.on.mockImplementation((event: string, handler: (reason: string) => void) => {
        if (event === 'disconnect') {
          disconnectHandler = handler;
        }
      });

      gotifyService.connect(token);
      (gotifyService as any).connected = true;
      disconnectHandler!('test reason');

      expect((gotifyService as any).connected).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith('Disconnected from Gotify', { reason: 'test reason' });
    });
  });

  describe('disconnect()', () => {
    it('should disconnect socket if connected', () => {
      (gotifyService as any).socket = mockSocket;

      gotifyService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((gotifyService as any).socket).toBeNull();
      expect((gotifyService as any).connected).toBe(false);
    });

    it('should not throw if socket is null', () => {
      (gotifyService as any).socket = null;

      expect(() => gotifyService.disconnect()).not.toThrow();
    });
  });

  describe('isConnected()', () => {
    it('should return true if socket is connected', () => {
      (gotifyService as any).socket = mockSocket;
      (gotifyService as any).connected = true;
      mockSocket.connected = true;

      expect(gotifyService.isConnected()).toBe(true);
    });

    it('should return false if socket is not connected', () => {
      (gotifyService as any).socket = mockSocket;
      (gotifyService as any).connected = false;
      mockSocket.connected = false;

      expect(gotifyService.isConnected()).toBe(false);
    });

    it('should return false if socket is null', () => {
      (gotifyService as any).socket = null;
      (gotifyService as any).connected = false;

      expect(gotifyService.isConnected()).toBe(false);
    });
  });

  describe('setNotificationHandler()', () => {
    it('should set notification handler', () => {
      const handler: NotificationHandler = {
        onNotification: jest.fn(),
      };

      gotifyService.setNotificationHandler(handler);

      expect((gotifyService as any).notificationHandler).toBe(handler);
    });
  });

  describe('handleMessage()', () => {
    it('should call notification handler if set', () => {
      const handler: NotificationHandler = {
        onNotification: jest.fn(),
      };
      const message: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Test message',
        title: 'Test title',
        priority: 5,
        date: '2025-01-01T00:00:00Z',
      };

      gotifyService.setNotificationHandler(handler);
      (gotifyService as any).handleMessage(message);

      expect(handler.onNotification).toHaveBeenCalledWith(message);
    });

    it('should display local notification when message received', () => {
      const message: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Test message',
        title: 'Test title',
        priority: 5,
        date: '2025-01-01T00:00:00Z',
      };

      (gotifyService as any).handleMessage(message);

      expect(mockDisplayNotification).toHaveBeenCalled();
    });

    it('should use critical channel for high priority messages', async () => {
      const message: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Critical message',
        title: 'Critical title',
        priority: 8,
        date: '2025-01-01T00:00:00Z',
      };

      (gotifyService as any).handleMessage(message);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockDisplayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            channelId: 'critical',
          }),
        })
      );
    });

    it('should use normal channel for low priority messages', async () => {
      const message: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Normal message',
        title: 'Normal title',
        priority: 3,
        date: '2025-01-01T00:00:00Z',
      };

      (gotifyService as any).handleMessage(message);

      await new Promise(resolve => setImmediate(resolve));

      expect(mockDisplayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            channelId: 'normal',
          }),
        })
      );
    });
  });

  describe('getMessages()', () => {
    beforeEach(() => {
      (gotifyService as any).baseURL = 'http://localhost:8888';
      (gotifyService as any).clientToken = 'test-token';
      global.fetch = jest.fn();
    });

    it('should fetch messages from Gotify API', async () => {
      const mockMessages: GotifyMessage[] = [
        {
          id: 1,
          appid: 1,
          message: 'Test message',
          title: 'Test title',
          priority: 5,
          date: '2025-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      });

      const result = await gotifyService.getMessages(20);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8888/message?limit=20',
        expect.objectContaining({
          headers: {
            'X-Gotify-Key': 'test-token',
          },
        })
      );
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await gotifyService.getMessages(20);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Error fetching messages:', expect.any(Error));
    });

    it('should return empty array if response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await gotifyService.getMessages(20);

      expect(result).toEqual([]);
    });
  });

  describe('deleteMessage()', () => {
    beforeEach(() => {
      (gotifyService as any).baseURL = 'http://localhost:8888';
      (gotifyService as any).clientToken = 'test-token';
      global.fetch = jest.fn();
    });

    it('should delete message by id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await gotifyService.deleteMessage(123);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8888/message/123',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'X-Gotify-Key': 'test-token',
          },
        })
      );
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await gotifyService.deleteMessage(123);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error deleting message:', expect.any(Error));
    });
  });

  describe('deleteAllMessages()', () => {
    beforeEach(() => {
      (gotifyService as any).baseURL = 'http://localhost:8888';
      (gotifyService as any).clientToken = 'test-token';
      global.fetch = jest.fn();
    });

    it('should delete all messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await gotifyService.deleteAllMessages();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8888/message',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'X-Gotify-Key': 'test-token',
          },
        })
      );
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await gotifyService.deleteAllMessages();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error deleting all messages:', expect.any(Error));
    });
  });
});

