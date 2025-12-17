/**
 * Testes de Integração - Gotify Notifications
 * 
 * Testa o fluxo completo de notificações via Gotify:
 * - Conexão WebSocket
 * - Recebimento de mensagens
 * - Exibição de notificações locais
 * - Gerenciamento de mensagens
 * 
 * ⚠️ INTEGRATION TEST - Requer Gotify configurado
 */

import { TestApiClient, testEnvironment } from './testConfig';
import gotifyService, { GotifyMessage } from '../../gotifyService';
import notifee from '@notifee/react-native';
import io from 'socket.io-client';

// Mocks
jest.mock('@notifee/react-native');
jest.mock('socket.io-client');
jest.mock('../../loggerService', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedNotifee = notifee as jest.Mocked<typeof notifee>;
const mockedIo = io as jest.MockedFunction<typeof io>;

describe('Testes de Integração - Gotify Notifications', () => {
  let testClient: TestApiClient;
  let mockSocket: any;

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
    jest.clearAllMocks();

    // Mock Socket.IO
    mockSocket = {
      on: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };
    mockedIo.mockReturnValue(mockSocket as any);

    // Mock Notifee
    mockedNotifee.createChannel.mockResolvedValue(undefined);
    mockedNotifee.displayNotification.mockResolvedValue('notification-id');
  });

  afterEach(() => {
    testClient.clearMocks();
    (gotifyService as any).socket = null;
    (gotifyService as any).connected = false;
  });

  describe('Inicialização', () => {
    it('deve inicializar canais de notificação', async () => {
      // Act
      await gotifyService.initialize();

      // Assert
      expect(mockedNotifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'default',
          name: 'Notificações Crowbar',
        })
      );
      expect(mockedNotifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'critical',
        })
      );
      expect(mockedNotifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'normal',
        })
      );
    });
  });

  describe('Conexão WebSocket', () => {
    it('deve conectar ao Gotify WebSocket com token', () => {
      // Arrange
      const token = 'test-gotify-token';

      // Act
      gotifyService.connect(token);

      // Assert
      expect(mockedIo).toHaveBeenCalledWith(
        expect.stringContaining('gotify'),
        expect.objectContaining({
          path: '/stream',
          query: { token },
          transports: ['websocket'],
        })
      );
    });

    it('deve registrar handlers de eventos do socket', () => {
      // Arrange
      const token = 'test-token';

      // Act
      gotifyService.connect(token);

      // Assert
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('deve processar mensagem recebida via WebSocket', async () => {
      // Arrange
      const token = 'test-token';
      let messageHandler: (message: GotifyMessage) => void;

      mockSocket.on.mockImplementation((event: string, handler: (message: GotifyMessage) => void) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      const mockMessage: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Test notification',
        title: 'Test Title',
        priority: 5,
        date: new Date().toISOString(),
        extras: {
          userId: 'user-123',
          type: 'order',
        },
      };

      // Act
      gotifyService.connect(token);
      messageHandler!(mockMessage);

      // Assert
      await new Promise(resolve => setImmediate(resolve));
      expect(mockedNotifee.displayNotification).toHaveBeenCalled();
    });
  });

  describe('Recebimento de Notificações', () => {
    it('deve exibir notificação local quando mensagem é recebida', async () => {
      // Arrange
      const token = 'test-token';
      const handler: { onNotification: (message: GotifyMessage) => void } = {
        onNotification: jest.fn(),
      };

      gotifyService.setNotificationHandler(handler);

      const mockMessage: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Test message',
        title: 'Test Title',
        priority: 5,
        date: new Date().toISOString(),
      };

      // Act
      (gotifyService as any).handleMessage(mockMessage);

      // Assert
      await new Promise(resolve => setImmediate(resolve));
      expect(handler.onNotification).toHaveBeenCalledWith(mockMessage);
      expect(mockedNotifee.displayNotification).toHaveBeenCalled();
    });

    it('deve usar canal crítico para notificações de alta prioridade', async () => {
      // Arrange
      const mockMessage: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Critical message',
        title: 'Critical Title',
        priority: 8,
        date: new Date().toISOString(),
      };

      // Act
      (gotifyService as any).handleMessage(mockMessage);

      // Assert
      await new Promise(resolve => setImmediate(resolve));
      expect(mockedNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            channelId: 'critical',
          }),
        })
      );
    });

    it('deve usar canal normal para notificações de baixa prioridade', async () => {
      // Arrange
      const mockMessage: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Normal message',
        title: 'Normal Title',
        priority: 3,
        date: new Date().toISOString(),
      };

      // Act
      (gotifyService as any).handleMessage(mockMessage);

      // Assert
      await new Promise(resolve => setImmediate(resolve));
      expect(mockedNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({
            channelId: 'normal',
          }),
        })
      );
    });
  });

  describe('Gerenciamento de Mensagens', () => {
    beforeEach(() => {
      (gotifyService as any).baseURL = 'http://localhost:8888';
      (gotifyService as any).clientToken = 'test-token';
      global.fetch = jest.fn();
    });

    it('deve buscar mensagens anteriores do Gotify', async () => {
      // Arrange
      const mockMessages: GotifyMessage[] = [
        {
          id: 1,
          appid: 1,
          message: 'Message 1',
          title: 'Title 1',
          priority: 5,
          date: new Date().toISOString(),
        },
        {
          id: 2,
          appid: 1,
          message: 'Message 2',
          title: 'Title 2',
          priority: 7,
          date: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      });

      // Act
      const messages = await gotifyService.getMessages(20);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8888/message?limit=20',
        expect.objectContaining({
          headers: {
            'X-Gotify-Key': 'test-token',
          },
        })
      );
      expect(messages).toEqual(mockMessages);
      expect(messages).toHaveLength(2);
    });

    it('deve deletar mensagem específica', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const result = await gotifyService.deleteMessage(123);

      // Assert
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

    it('deve deletar todas as mensagens', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      // Act
      const result = await gotifyService.deleteAllMessages();

      // Assert
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
  });

  describe('Fluxo Completo de Notificação', () => {
    it('deve completar fluxo: conectar → receber → exibir → gerenciar', async () => {
      // Arrange
      const token = 'test-token';
      let messageHandler: (message: GotifyMessage) => void;

      mockSocket.on.mockImplementation((event: string, handler: (message: GotifyMessage) => void) => {
        if (event === 'message') {
          messageHandler = handler;
        }
        if (event === 'connect') {
          handler();
        }
      });
      mockSocket.connected = true;

      const handler: { onNotification: (message: GotifyMessage) => void } = {
        onNotification: jest.fn(),
      };

      // Act 1: Inicializar
      await gotifyService.initialize();

      // Act 2: Conectar
      gotifyService.setNotificationHandler(handler);
      gotifyService.connect(token);

      // Act 3: Simular recebimento de mensagem
      const mockMessage: GotifyMessage = {
        id: 1,
        appid: 1,
        message: 'Test notification',
        title: 'Test Title',
        priority: 5,
        date: new Date().toISOString(),
        extras: {
          userId: 'user-123',
          type: 'order',
        },
      };

      messageHandler!(mockMessage);

      // Assert
      await new Promise(resolve => setImmediate(resolve));
      expect(handler.onNotification).toHaveBeenCalledWith(mockMessage);
      expect(mockedNotifee.displayNotification).toHaveBeenCalled();

      // Act 4: Verificar conexão
      expect(gotifyService.isConnected()).toBe(true);

      // Act 5: Desconectar
      gotifyService.disconnect();
      expect(gotifyService.isConnected()).toBe(false);
    });
  });
});

