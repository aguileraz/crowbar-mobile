import { io } from 'socket.io-client';
import { websocketService } from '../websocketService';
import { env } from '../../config/env';

// Mock do socket.io-client
jest.mock('socket.io-client');

describe('WebSocketService', () => {
  let mockSocket: any;
  let mockIo: jest.MockedFunction<typeof io>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock do socket
    mockSocket = {
      connected: false,
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
    };

    mockIo = io as jest.MockedFunction<typeof io>;
    mockIo.mockReturnValue(mockSocket as any);

    // Reset do serviço
    (websocketService as any).socket = null;
    (websocketService as any).isConnected = false;
    (websocketService as any).reconnectAttempts = 0;
    (websocketService as any).authToken = null;
    (websocketService as any).eventListeners.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Garantir desconexão limpa
    if ((websocketService as any).socket) {
      websocketService.disconnect();
    }
  });

  describe('connect', () => {
    it('deve conectar ao servidor WebSocket', () => {
      websocketService.connect('auth-token-123');

      expect(mockIo).toHaveBeenCalledWith(env.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        auth: { token: 'auth-token-123' },
        autoConnect: true,
      });

      expect((websocketService as any).authToken).toBe('auth-token-123');
      expect(console.log).toHaveBeenCalledWith('🔌 Connecting to WebSocket server...');
    });

    it('deve conectar sem token de autenticação', () => {
      websocketService.connect();

      expect(mockIo).toHaveBeenCalledWith(env.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        auth: undefined,
        autoConnect: true,
      });
    });

    it('não deve reconectar se já estiver conectado', () => {
      mockSocket.connected = true;
      (websocketService as any).socket = mockSocket;

      websocketService.connect();

      expect(mockIo).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('🔌 WebSocket already connected');
    });

    it('deve configurar event listeners ao conectar', () => {
      websocketService.connect();

      // Verificar que listeners foram configurados
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('box_opened', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('stock_update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('new_notification', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('deve desconectar do servidor WebSocket', () => {
      websocketService.connect();
      websocketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((websocketService as any).socket).toBeNull();
      expect((websocketService as any).isConnected).toBe(false);
      expect((websocketService as any).reconnectAttempts).toBe(0);
      expect(console.log).toHaveBeenCalledWith('🔌 Disconnecting from WebSocket server...');
    });

    it('não deve fazer nada se não estiver conectado', () => {
      websocketService.disconnect();

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      websocketService.connect();
    });

    it('deve tratar evento de conexão', () => {
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      const listener = jest.fn();
      websocketService.on('connected', listener);

      connectHandler();

      expect((websocketService as any).isConnected).toBe(true);
      expect((websocketService as any).reconnectAttempts).toBe(0);
      expect(listener).toHaveBeenCalledWith({ connected: true });
      expect(console.log).toHaveBeenCalledWith('✅ WebSocket connected');
    });

    it('deve tratar evento de desconexão', () => {
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      const listener = jest.fn();
      websocketService.on('disconnected', listener);

      disconnectHandler('transport close');

      expect((websocketService as any).isConnected).toBe(false);
      expect(listener).toHaveBeenCalledWith({ 
        connected: false, 
        reason: 'transport close' 
      });
      expect(console.log).toHaveBeenCalledWith(
        '❌ WebSocket disconnected:', 
        'transport close'
      );
    });

    it('não deve tentar reconectar se servidor desconectou', () => {
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      jest.spyOn(websocketService as any, 'attemptReconnect');

      disconnectHandler('io server disconnect');

      expect((websocketService as any).attemptReconnect).not.toHaveBeenCalled();
    });

    it('deve tratar erro de conexão', () => {
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];

      const listener = jest.fn();
      websocketService.on('error', listener);

      const error = new Error('Connection failed');
      errorHandler(error);

      expect(listener).toHaveBeenCalledWith({ error: 'Connection failed' });
      expect(console.error).toHaveBeenCalledWith(
        '❌ WebSocket connection error:', 
        error
      );
    });

    it('deve tratar evento box_opened', () => {
      const boxOpenedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'box_opened'
      )?.[1];

      const listener = jest.fn();
      websocketService.on('box_opened', listener);

      const eventData = {
        box_id: 'box-123',
        user_id: 'user-456',
        opened_at: new Date().toISOString(),
        items: [{ id: 'item-1', name: 'Item 1' }],
      };

      boxOpenedHandler(eventData);

      expect(listener).toHaveBeenCalledWith(eventData);
      expect(console.log).toHaveBeenCalledWith(
        '📦 Box opened event received:', 
        eventData
      );
    });

    it('deve tratar evento stock_update', () => {
      const stockUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'stock_update'
      )?.[1];

      const listener = jest.fn();
      websocketService.on('stock_update', listener);

      const eventData = {
        box_id: 'box-123',
        stock: 50,
      };

      stockUpdateHandler(eventData);

      expect(listener).toHaveBeenCalledWith(eventData);
      expect(console.log).toHaveBeenCalledWith(
        '📊 Stock update received:', 
        eventData
      );
    });
  });

  describe('Event Listeners Management', () => {
    it('deve adicionar listener de evento', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      websocketService.on('test_event', listener1);
      websocketService.on('test_event', listener2);

      const listeners = (websocketService as any).eventListeners.get('test_event');
      expect(listeners?.size).toBe(2);
      expect(listeners?.has(listener1)).toBe(true);
      expect(listeners?.has(listener2)).toBe(true);
    });

    it('deve remover listener de evento', () => {
      const listener = jest.fn();

      websocketService.on('test_event', listener);
      websocketService.off('test_event', listener);

      const listeners = (websocketService as any).eventListeners.get('test_event');
      expect(listeners?.has(listener)).toBe(false);
    });

    it('deve emitir evento para todos os listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      websocketService.on('test_event', listener1);
      websocketService.on('test_event', listener2);

      (websocketService as any).emitToListeners('test_event', { data: 'test' });

      expect(listener1).toHaveBeenCalledWith({ data: 'test' });
      expect(listener2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('não deve falhar ao emitir evento sem listeners', () => {
      expect(() => {
        (websocketService as any).emitToListeners('nonexistent_event', {});
      }).not.toThrow();
    });
  });

  describe('Message Emission', () => {
    beforeEach(() => {
      websocketService.connect();
    });

    it('deve emitir mensagem quando conectado', () => {
      (websocketService as any).isConnected = true;

      const result = websocketService.emit('test_event', { data: 'test' });

      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('não deve emitir mensagem quando desconectado', () => {
      (websocketService as any).isConnected = false;

      const result = websocketService.emit('test_event', { data: 'test' });

      expect(result).toBe(false);
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '⚠️ Cannot emit test_event - WebSocket not connected'
      );
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      websocketService.connect();
      (websocketService as any).isConnected = true;
    });

    it('deve entrar em uma sala', () => {
      websocketService.joinRoom('room-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', { room: 'room-123' });
      expect(console.log).toHaveBeenCalledWith('🚪 Joining room: room-123');
    });

    it('deve sair de uma sala', () => {
      websocketService.leaveRoom('room-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', { room: 'room-123' });
      expect(console.log).toHaveBeenCalledWith('🚪 Leaving room: room-123');
    });

    it('não deve entrar em sala quando desconectado', () => {
      (websocketService as any).isConnected = false;

      websocketService.joinRoom('room-123');

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      websocketService.connect();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve tentar reconectar após desconexão', () => {
      const reconnectSpy = jest.spyOn(websocketService as any, 'attemptReconnect');
      
      // Simular desconexão
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      
      disconnectHandler('transport close');

      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('deve incrementar tentativas de reconexão', () => {
      (websocketService as any).attemptReconnect();
      
      expect((websocketService as any).reconnectAttempts).toBe(1);
      expect(console.log).toHaveBeenCalledWith(
        '🔄 Attempting to reconnect... (1/5)'
      );
    });

    it('deve parar de tentar reconectar após limite máximo', () => {
      (websocketService as any).reconnectAttempts = 5;
      
      (websocketService as any).attemptReconnect();
      
      expect(console.log).toHaveBeenCalledWith(
        '❌ Max reconnection attempts reached. Giving up.'
      );
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('deve aumentar delay entre tentativas de reconexão', () => {
      // Primeira tentativa - delay de 1s
      (websocketService as any).attemptReconnect();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

      // Segunda tentativa - delay de 2s
      jest.advanceTimersByTime(1000);
      (websocketService as any).attemptReconnect();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

      // Terceira tentativa - delay de 4s
      jest.advanceTimersByTime(2000);
      (websocketService as any).attemptReconnect();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 4000);
    });
  });

  describe('Connection Status', () => {
    it('deve retornar status de conexão corretamente', () => {
      expect(websocketService.isConnected()).toBe(false);

      websocketService.connect();
      (websocketService as any).isConnected = true;

      expect(websocketService.isConnected()).toBe(true);
    });

    it('deve retornar informações de conexão', () => {
      websocketService.connect();
      (websocketService as any).isConnected = true;

      const info = websocketService.getConnectionInfo();

      expect(info).toEqual({
        connected: true,
        reconnectAttempts: 0,
        socketId: undefined, // Mock não tem ID real
      });
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erro ao emitir para listeners', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      websocketService.on('test_event', errorListener);

      expect(() => {
        (websocketService as any).emitToListeners('test_event', {});
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error emitting to listener:',
        expect.any(Error)
      );
    });
  });

  describe('Authentication Update', () => {
    it('deve atualizar token de autenticação e reconectar', () => {
      websocketService.connect('old-token');
      
      websocketService.updateAuthToken('new-token');

      expect((websocketService as any).authToken).toBe('new-token');
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockIo).toHaveBeenCalledTimes(2); // Conexão inicial + reconexão
    });
  });
});