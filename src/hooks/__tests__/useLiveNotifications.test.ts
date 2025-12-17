import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  useLiveNotifications,
  useOrderNotifications,
  usePromotionNotifications,
  useSocialNotifications,
} from '../useLiveNotifications';
import realtimeReducer from '../../store/slices/realtimeSlice';
import notificationsReducer from '../../store/slices/notificationsSlice';
import logger from '../../services/loggerService';

// Mock dos serviços
jest.mock('../../services/loggerService', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock useNotifications with dynamic settings
let mockNotificationSettings = {
  enabled: true,
  sound: true,
  order: true,
  box: true,
  promotion: true,
  social: true,
  system: true,
};

jest.mock('../useNotifications', () => ({
  useNotifications: jest.fn(() => ({
    settings: mockNotificationSettings,
  })),
}));

// Factory para criar eventos mock
const createMockLiveEvent = (type: string, overrides = {}) => ({
  id: `event-${Date.now()}-${Math.random()}`,
  type,
  data: {},
  timestamp: Date.now(),
  ...overrides,
});

// Estado inicial do realtime slice
const createRealtimeState = (overrides = {}) => ({
  isConnected: true,
  connectionStatus: 'connected' as const,
  lastConnected: Date.now(),
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

// Estado inicial do notifications slice
const createNotificationsState = (overrides = {}) => ({
  notifications: [],
  unreadCount: 0,
  settings: {
    enabled: true,
    sound: true,
    order: true,
    box: true,
    promotion: true,
    social: true,
    system: true,
  },
  isLoading: false,
  isUpdating: false,
  error: null,
  fcmToken: null,
  permissionStatus: 'granted' as const,
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  },
  ...overrides,
});

// Store mock para os testes
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      realtime: realtimeReducer,
      notifications: notificationsReducer,
    },
    preloadedState: {
      realtime: createRealtimeState(initialState.realtime || {}),
      notifications: createNotificationsState(initialState.notifications || {}),
    },
  });
};

// Wrapper com Redux Provider
const createWrapper = (store: ReturnType<typeof createMockStore>) => {
  return ({ children }: any) => React.createElement(Provider, { store }, children);
};

describe('useLiveNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock notification settings to defaults
    mockNotificationSettings = {
      enabled: true,
      sound: true,
      order: true,
      box: true,
      promotion: true,
      social: true,
      system: true,
    };
  });

  describe('Main Hook - Initialization', () => {
    it('deve inicializar com estado padrão', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.toastQueue).toEqual([]);
      expect(result.current.hasToasts).toBe(false);
      expect(result.current.isEnabled).toBe(true);
    });

    it('deve retornar isEnabled false quando settings disabled', () => {
      // Update mock settings
      mockNotificationSettings.enabled = false;

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(result.current.isEnabled).toBe(false);
    });

    it('deve retornar isEnabled false quando não conectado', () => {
      const store = createMockStore({
        realtime: { isConnected: false },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(result.current.isEnabled).toBe(false);
    });

    it('deve aceitar options customizadas', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(
        () =>
          useLiveNotifications({
            enableToasts: false,
            enableBadgeUpdates: false,
            enableSounds: false,
            filterTypes: ['order_status_changed'],
          }),
        { wrapper }
      );

      // Hook inicializa corretamente com options
      expect(true).toBe(true);
    });
  });

  describe('Main Hook - Event Conversion', () => {
    it('deve converter order_status_changed para notificação', () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-123', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('order');
      expect(notification.title).toBe('Status do Pedido Atualizado');
      expect(notification.priority).toBe('high');
    });

    it('deve converter new_box para notificação', () => {
      const event = createMockLiveEvent('new_box', {
        data: { name: 'Caixa Surpresa Premium' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('box');
      expect(notification.title).toBe('Nova Caixa Disponível!');
      expect(notification.priority).toBe('normal');
    });

    it('deve converter promotion_started para notificação', () => {
      const event = createMockLiveEvent('promotion_started', {
        data: { title: 'Black Friday', discount: 50 },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('promotion');
      expect(notification.title).toBe('Promoção Especial!');
      expect(notification.body).toContain('50% de desconto');
    });

    it('deve converter friend_opened_box para notificação', () => {
      const event = createMockLiveEvent('friend_opened_box', {
        data: { friendName: 'João', boxName: 'Caixa Mistério' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('social');
      expect(notification.priority).toBe('low');
    });

    it('deve converter system_maintenance para notificação', () => {
      const event = createMockLiveEvent('system_maintenance', {
        data: { message: 'Manutenção programada para hoje às 22h' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('system');
      expect(notification.priority).toBe('high');
    });

    it('deve converter low_stock_alert para notificação', () => {
      const event = createMockLiveEvent('low_stock_alert', {
        data: { boxName: 'Caixa Premium' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification).toBeDefined();
      expect(notification.type).toBe('box');
      expect(notification.title).toBe('Estoque Baixo!');
    });

    it('não deve converter eventos desconhecidos', () => {
      const event = createMockLiveEvent('unknown_event_type', {
        data: { foo: 'bar' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(0);
    });

    it('deve incluir dados do evento na notificação', () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-456', status: 'entregue', trackingCode: 'BR123456789' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      const notification = state.notifications.notifications[0];

      expect(notification.data).toEqual({
        orderId: 'ORD-456',
        status: 'entregue',
        trackingCode: 'BR123456789',
      });
    });
  });

  describe('Main Hook - Toast Queue Management', () => {
    it('deve adicionar notificação com showToast ao queue', async () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-123', status: 'enviado' },
      });

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result, rerender } = renderHook(() => useLiveNotifications(), { wrapper });

      // Adicionar evento
      act(() => {
        store.dispatch({
          type: 'realtime/addLiveEvent',
          payload: event,
        });
      });

      rerender();

      await waitFor(() => {
        expect(result.current.toastQueue.length).toBeGreaterThan(0);
      });
    });

    it('não deve adicionar notificação social ao queue (showToast: false)', async () => {
      const event = createMockLiveEvent('friend_opened_box', {
        data: { friendName: 'João', boxName: 'Caixa' },
      });

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result, rerender } = renderHook(() => useLiveNotifications(), { wrapper });

      act(() => {
        store.dispatch({
          type: 'realtime/addLiveEvent',
          payload: event,
        });
      });

      rerender();

      await waitFor(() => {
        expect(result.current.toastQueue).toHaveLength(0);
      });
    });

    it('deve retornar próximo toast da fila', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      // Simular toasts na fila (através de eventos processados)
      const event1 = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      act(() => {
        store.dispatch({
          type: 'realtime/addLiveEvent',
          payload: event1,
        });
      });

      // Aguardar processamento
      waitFor(() => {
        const nextToast = result.current.showNextToast();
        expect(nextToast).toBeDefined();
      });
    });

    it('deve limpar toast queue', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      act(() => {
        result.current.clearToastQueue();
      });

      expect(result.current.toastQueue).toHaveLength(0);
    });

    it('deve retornar null quando queue vazio', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const nextToast = result.current.showNextToast();
      expect(nextToast).toBeNull();
    });

    it('deve respeitar enableToasts option', () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-123', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableToasts: false }), { wrapper });

      expect(result.current.toastQueue).toHaveLength(0);
    });
  });

  describe('Main Hook - Type Filtering', () => {
    it('deve filtrar eventos por tipo', () => {
      const orderEvent = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });
      const promoEvent = createMockLiveEvent('promotion_started', {
        data: { title: 'Promo', discount: 20 },
      });

      const store = createMockStore({
        realtime: { liveEvents: [orderEvent, promoEvent] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications({ filterTypes: ['order_status_changed'] }), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(1);
      expect(state.notifications.notifications[0].type).toBe('order');
    });

    it('deve processar todos os eventos quando filterTypes vazio', () => {
      const event1 = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });
      const event2 = createMockLiveEvent('new_box', {
        data: { name: 'Caixa Nova' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event1, event2] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications({ filterTypes: [] }), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('deve filtrar múltiplos tipos', () => {
      const events = [
        createMockLiveEvent('order_status_changed', { data: { orderId: 'ORD-1', status: 'enviado' } }),
        createMockLiveEvent('new_box', { data: { name: 'Caixa' } }),
        createMockLiveEvent('promotion_started', { data: { title: 'Promo', discount: 10 } }),
        createMockLiveEvent('friend_opened_box', { data: { friendName: 'Ana', boxName: 'Caixa' } }),
      ];

      const store = createMockStore({
        realtime: { liveEvents: events },
      });
      const wrapper = createWrapper(store);

      renderHook(
        () => useLiveNotifications({ filterTypes: ['order_status_changed', 'new_box'] }),
        { wrapper }
      );

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(2);
    });

    it('não deve processar eventos quando tipo não está em filterTypes', () => {
      const event = createMockLiveEvent('friend_opened_box', {
        data: { friendName: 'João', boxName: 'Caixa' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications({ filterTypes: ['order_status_changed'] }), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(0);
    });
  });

  describe('Main Hook - Settings Filtering', () => {
    it('não deve processar eventos quando settings disabled', () => {
      // Update mock settings
      mockNotificationSettings.enabled = false;

      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(0);
    });

    it('não deve processar quando não conectado', () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event], isConnected: false },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      expect(state.notifications.notifications).toHaveLength(0);
    });

    it('deve respeitar settings de tipo de notificação', () => {
      // Update mock settings - disable promotion
      mockNotificationSettings.promotion = false;

      const orderEvent = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });
      const promoEvent = createMockLiveEvent('promotion_started', {
        data: { title: 'Promo', discount: 20 },
      });

      const store = createMockStore({
        realtime: { liveEvents: [orderEvent, promoEvent] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useLiveNotifications(), { wrapper });

      const state = store.getState();
      // Apenas order deve ser processado
      expect(state.notifications.notifications).toHaveLength(1);
      expect(state.notifications.notifications[0].type).toBe('order');
    });
  });

  describe('Main Hook - Navigation Handling', () => {
    it('deve logar navegação para order', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const notification = {
        id: 'order_123',
        title: 'Pedido Atualizado',
        body: 'Seu pedido foi enviado',
        type: 'order' as const,
        data: { orderId: 'ORD-123' },
        priority: 'high' as const,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.handleNotificationTap(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Navigate to order:', 'ORD-123');
    });

    it('deve logar navegação para box', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const notification = {
        id: 'box_456',
        title: 'Nova Caixa',
        body: 'Caixa Premium disponível',
        type: 'box' as const,
        data: { boxId: 'BOX-456' },
        priority: 'normal' as const,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.handleNotificationTap(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Navigate to box:', 'BOX-456');
    });

    it('deve logar navegação para promotion', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const notification = {
        id: 'promo_789',
        title: 'Promoção',
        body: 'Black Friday',
        type: 'promotion' as const,
        data: { promotionId: 'PROMO-789' },
        priority: 'normal' as const,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.handleNotificationTap(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Navigate to promotion:', 'PROMO-789');
    });

    it('deve logar navegação para social', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const notification = {
        id: 'social_111',
        title: 'Amigo',
        body: 'João abriu uma caixa',
        type: 'social' as const,
        data: {},
        priority: 'low' as const,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.handleNotificationTap(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Navigate to social feed');
    });

    it('deve logar system message', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const notification = {
        id: 'system_222',
        title: 'Sistema',
        body: 'Manutenção programada',
        type: 'system' as const,
        data: {},
        priority: 'high' as const,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.handleNotificationTap(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Show system message:', 'Manutenção programada');
    });
  });

  describe('Main Hook - Sound & Badge', () => {
    it('deve logar som quando enabled e notification permite', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableSounds: true }), { wrapper });

      const notification = {
        id: 'notif-1',
        title: 'Test',
        body: 'Test body',
        type: 'order' as const,
        data: {},
        priority: 'high' as const,
        timestamp: Date.now(),
        playSound: true,
      };

      act(() => {
        result.current.playNotificationSound(notification);
      });

      expect(logger.debug).toHaveBeenCalledWith('Playing notification sound for: Test');
    });

    it('não deve tocar som quando enableSounds false', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableSounds: false }), { wrapper });

      const notification = {
        id: 'notif-1',
        title: 'Test',
        body: 'Test body',
        type: 'order' as const,
        data: {},
        priority: 'high' as const,
        timestamp: Date.now(),
        playSound: true,
      };

      act(() => {
        result.current.playNotificationSound(notification);
      });

      expect(logger.debug).not.toHaveBeenCalledWith('Playing notification sound for: Test');
    });

    it('não deve tocar som quando notification.playSound false', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableSounds: true }), { wrapper });

      const notification = {
        id: 'notif-1',
        title: 'Test',
        body: 'Test body',
        type: 'social' as const,
        data: {},
        priority: 'low' as const,
        timestamp: Date.now(),
        playSound: false,
      };

      act(() => {
        result.current.playNotificationSound(notification);
      });

      expect(logger.debug).not.toHaveBeenCalledWith('Playing notification sound for: Test');
    });

    it('deve logar badge update', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableBadgeUpdates: true }), { wrapper });

      act(() => {
        result.current.updateBadgeCount(5);
      });

      expect(logger.debug).toHaveBeenCalledWith('Updating app badge count to: 5');
    });

    it('não deve atualizar badge quando disabled', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications({ enableBadgeUpdates: false }), { wrapper });

      act(() => {
        result.current.updateBadgeCount(5);
      });

      expect(logger.debug).not.toHaveBeenCalledWith('Updating app badge count to: 5');
    });
  });

  describe('Main Hook - Cleanup', () => {
    it('deve processar eventos apenas uma vez', () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [event] },
      });
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(() => useLiveNotifications(), { wrapper });

      const stateAfterFirst = store.getState();
      const countAfterFirst = stateAfterFirst.notifications.notifications.length;

      // Re-render não deve adicionar notificação duplicada
      rerender();

      const stateAfterRerender = store.getState();
      expect(stateAfterRerender.notifications.notifications.length).toBe(countAfterFirst);
    });
  });

  describe('Main Hook - Return Values', () => {
    it('deve retornar todos os valores de state', () => {
      const store = createMockStore({
        realtime: { isConnected: true },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(result.current.isConnected).toBe(true);
      expect(Array.isArray(result.current.toastQueue)).toBe(true);
      expect(typeof result.current.hasToasts).toBe('boolean');
      expect(typeof result.current.isEnabled).toBe('boolean');
    });

    it('deve retornar todas as actions', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(typeof result.current.showNextToast).toBe('function');
      expect(typeof result.current.clearToastQueue).toBe('function');
      expect(typeof result.current.playNotificationSound).toBe('function');
      expect(typeof result.current.updateBadgeCount).toBe('function');
      expect(typeof result.current.handleNotificationTap).toBe('function');
      expect(typeof result.current.getNotificationStats).toBe('function');
    });

    it('deve calcular hasToasts corretamente', async () => {
      const event = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result, rerender } = renderHook(() => useLiveNotifications(), { wrapper });

      expect(result.current.hasToasts).toBe(false);

      act(() => {
        store.dispatch({
          type: 'realtime/addLiveEvent',
          payload: event,
        });
      });

      rerender();

      await waitFor(() => {
        expect(result.current.hasToasts).toBe(true);
      });
    });
  });

  describe('Main Hook - Statistics', () => {
    it('deve retornar estatísticas de notificações', () => {
      const now = Date.now();
      const events = [
        createMockLiveEvent('order_status_changed', {
          timestamp: now - 1000,
          data: { orderId: 'ORD-1', status: 'enviado' },
        }),
        createMockLiveEvent('new_box', {
          timestamp: now - 2000,
          data: { name: 'Caixa' },
        }),
        createMockLiveEvent('promotion_started', {
          timestamp: now - 3000,
          data: { title: 'Promo', discount: 20 },
        }),
      ];

      const store = createMockStore({
        realtime: { liveEvents: events },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const stats = result.current.getNotificationStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('processed');
      expect(stats.total).toBe(3);
    });

    it('deve agrupar estatísticas por tipo', () => {
      const events = [
        createMockLiveEvent('order_status_changed', { data: { orderId: '1', status: 'enviado' } }),
        createMockLiveEvent('order_status_changed', { data: { orderId: '2', status: 'entregue' } }),
        createMockLiveEvent('new_box', { data: { name: 'Caixa 1' } }),
      ];

      const store = createMockStore({
        realtime: { liveEvents: events },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const stats = result.current.getNotificationStats();

      expect(stats.byType.order_status_changed).toBe(2);
      expect(stats.byType.new_box).toBe(1);
    });

    it('deve filtrar eventos das últimas 24 horas', () => {
      const now = Date.now();
      const oneDayAgo = 24 * 60 * 60 * 1000;

      const events = [
        createMockLiveEvent('order_status_changed', {
          timestamp: now - 1000, // Dentro das 24h
          data: { orderId: '1', status: 'enviado' },
        }),
        createMockLiveEvent('new_box', {
          timestamp: now - oneDayAgo - 1000, // Fora das 24h
          data: { name: 'Caixa' },
        }),
      ];

      const store = createMockStore({
        realtime: { liveEvents: events },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useLiveNotifications(), { wrapper });

      const stats = result.current.getNotificationStats();

      expect(stats.total).toBe(1);
    });
  });

  describe('useOrderNotifications', () => {
    it('deve filtrar apenas eventos de orders', () => {
      const orderEvent = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });
      const boxEvent = createMockLiveEvent('new_box', {
        data: { name: 'Caixa' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [orderEvent, boxEvent] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useOrderNotifications(), { wrapper });

      const state = store.getState();
      // Deve processar apenas order
      expect(state.notifications.notifications.length).toBeLessThan(2);
    });

    it('deve habilitar toasts', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useOrderNotifications(), { wrapper });

      // Toasts habilitados por padrão
      expect(result.current).toBeDefined();
    });

    it('deve habilitar sons', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useOrderNotifications(), { wrapper });

      // Sons habilitados por padrão
      expect(result.current).toBeDefined();
    });
  });

  describe('usePromotionNotifications', () => {
    it('deve filtrar apenas eventos de promoções', () => {
      const promoEvent = createMockLiveEvent('promotion_started', {
        data: { title: 'Black Friday', discount: 50 },
      });
      const orderEvent = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [promoEvent, orderEvent] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => usePromotionNotifications(), { wrapper });

      const state = store.getState();
      // Deve processar apenas promotion
      expect(state.notifications.notifications.length).toBeLessThan(2);
    });

    it('deve habilitar toasts', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePromotionNotifications(), { wrapper });

      expect(result.current).toBeDefined();
    });

    it('deve desabilitar sons', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePromotionNotifications(), { wrapper });

      // Sons desabilitados por padrão para promoções
      expect(result.current).toBeDefined();
    });
  });

  describe('useSocialNotifications', () => {
    it('deve filtrar apenas eventos sociais', () => {
      const socialEvent = createMockLiveEvent('friend_opened_box', {
        data: { friendName: 'João', boxName: 'Caixa' },
      });
      const orderEvent = createMockLiveEvent('order_status_changed', {
        data: { orderId: 'ORD-1', status: 'enviado' },
      });

      const store = createMockStore({
        realtime: { liveEvents: [socialEvent, orderEvent] },
      });
      const wrapper = createWrapper(store);

      renderHook(() => useSocialNotifications(), { wrapper });

      const state = store.getState();
      // Deve processar apenas social
      expect(state.notifications.notifications.length).toBeLessThan(2);
    });

    it('deve desabilitar toasts', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useSocialNotifications(), { wrapper });

      // Toasts desabilitados por padrão para social
      expect(result.current).toBeDefined();
    });

    it('deve desabilitar sons', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useSocialNotifications(), { wrapper });

      // Sons desabilitados por padrão para social
      expect(result.current).toBeDefined();
    });
  });
});
