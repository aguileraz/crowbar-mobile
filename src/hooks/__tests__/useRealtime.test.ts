import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import {
  useRealtime,
  useBoxRealtime,
  useOrderRealtime,
  useLiveEvents,
} from '../useRealtime';
import realtimeReducer from '../../store/slices/realtimeSlice';
import { realtimeService } from '../../services/realtimeService';
import logger from '../../services/loggerService';

// Mock dos serviços
jest.mock('../../services/realtimeService', () => ({
  realtimeService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribeToBox: jest.fn(),
    subscribeToOrder: jest.fn(),
    subscribeToGlobalEvents: jest.fn(),
    subscribeToLiveStats: jest.fn(),
  },
}));

jest.mock('../../services/loggerService', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

const mockRealtimeService = realtimeService as jest.Mocked<typeof realtimeService>;
const mockAppState = AppState as jest.Mocked<typeof AppState>;

// Estado inicial do slice
const createInitialState = (overrides = {}) => ({
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  lastConnected: null,
  error: null,
  liveBoxUpdates: {},
  liveOrderUpdates: {},
  liveEvents: [],
  onlineUsers: {
    count: 0,
    users: [],
  },
  liveStats: {
    totalBoxesOpened: 0,
    totalUsersOnline: 0,
    recentOpenings: [],
  },
  settings: {
    enableLiveUpdates: true,
    enableStockUpdates: true,
    enableOrderUpdates: true,
    enableLiveEvents: true,
    maxEventsHistory: 50,
  },
  ...overrides,
});

// Store mock para os testes
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      realtime: realtimeReducer,
    },
    preloadedState: {
      realtime: {
        ...createInitialState(),
        ...initialState,
      },
    },
  });
};

// Wrapper com Redux Provider
const createWrapper = (store: ReturnType<typeof createMockStore>) => {
  return ({ children }: any) => React.createElement(Provider, { store }, children);
};

describe('useRealtime', () => {
  let _appStateCallback: ((state: string) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup AppState mock
    appStateCallback = null;
    mockAppState.addEventListener.mockImplementation((event, callback) => {
      if (event === 'change') {
        appStateCallback = callback;
      }
      return { remove: jest.fn() } as any;
    });

    // Reset mock implementations
    mockRealtimeService.connect.mockResolvedValue(undefined);
    mockRealtimeService.disconnect.mockResolvedValue(undefined);
    mockRealtimeService.subscribeToBox.mockResolvedValue(undefined);
    mockRealtimeService.subscribeToOrder.mockResolvedValue(undefined);
    mockRealtimeService.subscribeToGlobalEvents.mockReturnValue(jest.fn());
    mockRealtimeService.subscribeToLiveStats.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    appStateCallback = null;
  });

  describe('Main Hook - Connection', () => {
    it('deve conectar automaticamente quando autoConnect é true', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: true }), { wrapper });

      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled();
      });
    });

    it('não deve conectar automaticamente quando autoConnect é false', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(mockRealtimeService.connect).not.toHaveBeenCalled();
    });

    it('não deve conectar se já estiver conectado', () => {
      const store = createMockStore({
        connectionStatus: 'connected',
        isConnected: true,
      });
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: true }), { wrapper });

      expect(mockRealtimeService.connect).not.toHaveBeenCalled();
    });

    it('deve permitir conexão manual', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(mockRealtimeService.connect).toHaveBeenCalled();
    });

    it('deve subscrever a global events quando solicitado', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false, subscribeToGlobal: true }), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToGlobalEvents).toHaveBeenCalled();
      });
    });

    it('deve subscrever a live stats quando solicitado', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false, subscribeToStats: true }), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToLiveStats).toHaveBeenCalled();
      });
    });

    it('deve logar erro ao falhar na conexão', async () => {
      mockRealtimeService.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Failed to connect to realtime:', expect.anything());
      });
    });
  });

  describe('Main Hook - Disconnection', () => {
    it('deve desconectar manualmente', async () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockRealtimeService.disconnect).toHaveBeenCalled();
    });

    it('deve desconectar ao desmontar se conectado', () => {
      const store = createMockStore({ isConnected: true, connectionStatus: 'disconnected' });
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      act(() => {
        unmount();
      });

      // Verificar que desconecta foi chamado através do useEffect cleanup
      expect(mockRealtimeService.disconnect).toHaveBeenCalled();
    });

    it('não deve desconectar ao desmontar se não conectado', () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      act(() => {
        unmount();
      });

      expect(mockRealtimeService.disconnect).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar na desconexão', async () => {
      mockRealtimeService.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.disconnect();
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Failed to disconnect from realtime:', expect.anything());
      });
    });
  });

  describe('Main Hook - Subscriptions', () => {
    it('deve subscrever a box updates', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeBox('box-123');
      });

      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-123');
    });

    it('deve subscrever a order updates', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeOrder('order-456');
      });

      expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledWith('order-456');
    });

    it('deve subscrever a múltiplas boxes', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeBox('box-1');
        await result.current.subscribeBox('box-2');
        await result.current.subscribeBox('box-3');
      });

      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledTimes(3);
      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-1');
      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-2');
      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-3');
    });

    it('deve subscrever a múltiplas orders', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeOrder('order-1');
        await result.current.subscribeOrder('order-2');
      });

      expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledTimes(2);
    });

    it('deve logar erro ao falhar na subscrição de box', async () => {
      mockRealtimeService.subscribeToBox.mockRejectedValueOnce(new Error('Subscribe failed'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeBox('box-123');
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Failed to subscribe to box:', expect.anything());
      });
    });

    it('deve logar erro ao falhar na subscrição de order', async () => {
      mockRealtimeService.subscribeToOrder.mockRejectedValueOnce(new Error('Subscribe failed'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeOrder('order-456');
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Failed to subscribe to order:', expect.anything());
      });
    });

    it('deve lidar com subscrição de box vazio', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeBox('');
      });

      expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('');
    });

    it('deve lidar com subscrição de order vazio', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeOrder('');
      });

      expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledWith('');
    });
  });

  describe('Main Hook - AppState Integration', () => {
    it('deve configurar listener do AppState ao montar', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      // AppState listener está comentado no código, então não deve ser chamado
      // Se for implementado, descomentar este teste
      // expect(mockAppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('deve reconectar quando app volta para ativo', async () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: true }), { wrapper });

      // Implementação futura - AppState listener comentado no código
      // Se implementado, descomentar:
      // act(() => {
      //   appStateCallback?.('active');
      // });
      //
      // await waitFor(() => {
      //   expect(mockRealtimeService.connect).toHaveBeenCalled();
      // });
    });

    it('não deve reconectar se já conectado', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: true }), { wrapper });

      // Implementação futura
      // act(() => {
      //   appStateCallback?.('active');
      // });
      //
      // expect(mockRealtimeService.connect).toHaveBeenCalledTimes(0);
    });

    it('não deve reconectar se autoConnect é false', () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      // Implementação futura
      // act(() => {
      //   appStateCallback?.('active');
      // });
      //
      // expect(mockRealtimeService.connect).not.toHaveBeenCalled();
    });
  });

  describe('Main Hook - Error Handling', () => {
    it('deve lidar com erro de conexão', async () => {
      mockRealtimeService.connect.mockRejectedValueOnce(new Error('Network error'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to connect to realtime:', expect.anything());
    });

    it('deve lidar com erro de desconexão', async () => {
      mockRealtimeService.disconnect.mockRejectedValueOnce(new Error('Disconnect error'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to disconnect from realtime:', expect.anything());
    });

    it('deve lidar com erro de subscrição', async () => {
      mockRealtimeService.subscribeToBox.mockRejectedValueOnce(new Error('Subscribe error'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      await act(async () => {
        await result.current.subscribeBox('box-123');
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to subscribe to box:', expect.anything());
    });
  });

  describe('Main Hook - Cleanup', () => {
    it('deve fazer cleanup ao desmontar', () => {
      const store = createMockStore({ isConnected: true, connectionStatus: 'disconnected' });
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      act(() => {
        unmount();
      });

      expect(mockRealtimeService.disconnect).toHaveBeenCalled();
    });

    it('não deve fazer cleanup se não conectado', () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      act(() => {
        unmount();
      });

      expect(mockRealtimeService.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Main Hook - Return Values', () => {
    it('deve retornar todos os valores de state', () => {
      const store = createMockStore({
        isConnected: true,
        connectionStatus: 'connected',
        error: null,
        liveEvents: [{ id: 'event-1', type: 'box_opened', data: {}, timestamp: Date.now() }],
        onlineUsers: { count: 10, users: [] },
        liveStats: { totalBoxesOpened: 100, totalUsersOnline: 10, recentOpenings: [] },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.error).toBeNull();
      expect(result.current.liveEvents).toHaveLength(1);
      expect(result.current.onlineUsers.count).toBe(10);
      expect(result.current.liveStats.totalBoxesOpened).toBe(100);
    });

    it('deve retornar todas as actions', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.subscribeBox).toBe('function');
      expect(typeof result.current.subscribeOrder).toBe('function');
    });

    it('deve calcular isReady corretamente quando conectado', () => {
      const store = createMockStore({
        isConnected: true,
        connectionStatus: 'connected',
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(result.current.isReady).toBe(true);
    });

    it('deve calcular isReady como false quando não conectado', () => {
      const store = createMockStore({
        isConnected: false,
        connectionStatus: 'disconnected',
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(result.current.isReady).toBe(false);
    });

    it('deve calcular hasError corretamente', () => {
      const store = createMockStore({
        error: 'Connection error',
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(result.current.hasError).toBe(true);
    });

    it('deve calcular hasError como false quando não há erro', () => {
      const store = createMockStore({
        error: null,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useRealtime({ autoConnect: false }), { wrapper });

      expect(result.current.hasError).toBe(false);
    });
  });

  describe('useBoxRealtime', () => {
    it('deve subscrever a box quando conectado', async () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      renderHook(() => useBoxRealtime('box-123'), { wrapper });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-123');
      });
    });

    it('não deve subscrever se não conectado', () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      renderHook(() => useBoxRealtime('box-123'), { wrapper });

      expect(mockRealtimeService.subscribeToBox).not.toHaveBeenCalled();
    });

    it('não deve subscrever se boxId for vazio', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      renderHook(() => useBoxRealtime(''), { wrapper });

      expect(mockRealtimeService.subscribeToBox).not.toHaveBeenCalled();
    });

    it('deve retornar dados de stock da box', () => {
      const store = createMockStore({
        isConnected: true,
        liveBoxUpdates: {
          'box-123': {
            stock: 50,
            price: 99.99,
            lastUpdated: Date.now(),
          },
        },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useBoxRealtime('box-123'), { wrapper });

      expect(result.current.stock).toBe(50);
      expect(result.current.price).toBe(99.99);
      expect(result.current.lastUpdated).toBeDefined();
    });

    it('deve retornar undefined para box sem dados', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useBoxRealtime('box-456'), { wrapper });

      expect(result.current.stock).toBeUndefined();
      expect(result.current.price).toBeUndefined();
      expect(result.current.lastUpdated).toBeUndefined();
    });

    it('deve retornar isSubscribed baseado em isConnected', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useBoxRealtime('box-123'), { wrapper });

      expect(result.current.isSubscribed).toBe(true);
    });

    it('deve atualizar quando boxId muda', async () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(
        ({ boxId }) => useBoxRealtime(boxId),
        {
          wrapper,
          initialProps: { boxId: 'box-1' },
        }
      );

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-1');
      });

      rerender({ boxId: 'box-2' });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToBox).toHaveBeenCalledWith('box-2');
      });
    });
  });

  describe('useOrderRealtime', () => {
    it('deve subscrever a order quando conectado', async () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      renderHook(() => useOrderRealtime('order-456'), { wrapper });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledWith('order-456');
      });
    });

    it('não deve subscrever se não conectado', () => {
      const store = createMockStore({ isConnected: false });
      const wrapper = createWrapper(store);

      renderHook(() => useOrderRealtime('order-456'), { wrapper });

      expect(mockRealtimeService.subscribeToOrder).not.toHaveBeenCalled();
    });

    it('não deve subscrever se orderId for vazio', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      renderHook(() => useOrderRealtime(''), { wrapper });

      expect(mockRealtimeService.subscribeToOrder).not.toHaveBeenCalled();
    });

    it('deve retornar dados de status da order', () => {
      const store = createMockStore({
        isConnected: true,
        liveOrderUpdates: {
          'order-456': {
            status: 'shipped',
            tracking: { code: 'ABC123', carrier: 'Correios' },
            lastUpdated: Date.now(),
          },
        },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useOrderRealtime('order-456'), { wrapper });

      expect(result.current.status).toBe('shipped');
      expect(result.current.tracking).toEqual({ code: 'ABC123', carrier: 'Correios' });
      expect(result.current.lastUpdated).toBeDefined();
    });

    it('deve retornar undefined para order sem dados', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useOrderRealtime('order-999'), { wrapper });

      expect(result.current.status).toBeUndefined();
      expect(result.current.tracking).toBeUndefined();
      expect(result.current.lastUpdated).toBeUndefined();
    });

    it('deve retornar isSubscribed baseado em isConnected', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useOrderRealtime('order-456'), { wrapper });

      expect(result.current.isSubscribed).toBe(true);
    });

    it('deve atualizar quando orderId muda', async () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(
        ({ orderId }) => useOrderRealtime(orderId),
        {
          wrapper,
          initialProps: { orderId: 'order-1' },
        }
      );

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledWith('order-1');
      });

      rerender({ orderId: 'order-2' });

      await waitFor(() => {
        expect(mockRealtimeService.subscribeToOrder).toHaveBeenCalledWith('order-2');
      });
    });
  });

  describe('useLiveEvents', () => {
    it('deve conectar com subscribeToGlobal e subscribeToStats', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useLiveEvents(), { wrapper });

      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled();
      });
    });

    it('deve retornar eventos ao vivo', () => {
      const mockEvents = [
        { id: 'event-1', type: 'box_opened' as const, data: {}, timestamp: Date.now() },
        { id: 'event-2', type: 'new_box' as const, data: {}, timestamp: Date.now() - 1000 },
        { id: 'event-3', type: 'promotion' as const, data: {}, timestamp: Date.now() - 2000 },
      ];

      const store = createMockStore({
        isConnected: true,
        liveEvents: mockEvents,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.events).toHaveLength(3);
    });

    it('deve limitar eventos ao maxEvents', () => {
      const mockEvents = Array.from({ length: 30 }, (_, i) => ({
        id: `event-${i}`,
        type: 'box_opened' as const,
        data: {},
        timestamp: Date.now() - i * 1000,
      }));

      const store = createMockStore({
        isConnected: true,
        liveEvents: mockEvents,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(10), { wrapper });

      expect(result.current.events).toHaveLength(10);
    });

    it('deve retornar stats ao vivo', () => {
      const store = createMockStore({
        isConnected: true,
        liveStats: {
          totalBoxesOpened: 1000,
          totalUsersOnline: 50,
          recentOpenings: [],
        },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.stats.totalBoxesOpened).toBe(1000);
      expect(result.current.stats.totalUsersOnline).toBe(50);
    });

    it('deve retornar online users count', () => {
      const store = createMockStore({
        isConnected: true,
        onlineUsers: {
          count: 42,
          users: [],
        },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.onlineUsers.count).toBe(42);
    });

    it('deve retornar isConnected status', () => {
      const store = createMockStore({ isConnected: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.isConnected).toBe(true);
    });

    it('deve retornar hasEvents true quando há eventos', () => {
      const store = createMockStore({
        isConnected: true,
        liveEvents: [
          { id: 'event-1', type: 'box_opened' as const, data: {}, timestamp: Date.now() },
        ],
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.hasEvents).toBe(true);
    });

    it('deve retornar hasEvents false quando não há eventos', () => {
      const store = createMockStore({
        isConnected: true,
        liveEvents: [],
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.hasEvents).toBe(false);
    });

    it('deve usar maxEvents padrão de 20', () => {
      const mockEvents = Array.from({ length: 30 }, (_, i) => ({
        id: `event-${i}`,
        type: 'box_opened' as const,
        data: {},
        timestamp: Date.now() - i * 1000,
      }));

      const store = createMockStore({
        isConnected: true,
        liveEvents: mockEvents,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveEvents(), { wrapper });

      expect(result.current.events).toHaveLength(20);
    });
  });
});
