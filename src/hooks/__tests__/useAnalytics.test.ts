import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  useAnalytics,
  useScreenTracking,
  usePerformanceTracking,
  useEcommerceTracking,
  useEngagementTracking,
} from '../useAnalytics';
import analyticsReducer from '../../store/slices/analyticsSlice';
import { analyticsService } from '../../services/analyticsService';
import logger from '../../services/loggerService';

// Mock dos serviços
jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    initialize: jest.fn(),
    logEvent: jest.fn(),
    logScreenView: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
    trackError: jest.fn(),
    trackEngagement: jest.fn(),
    trackPurchase: jest.fn(),
    trackBoxOpening: jest.fn(),
    trackApiCall: jest.fn(),
  },
}));

jest.mock('../../services/loggerService', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

// Estado inicial do slice
const createInitialState = (overrides = {}) => ({
  isEnabled: true,
  userId: null,
  sessionId: 'session-123',
  sessionStartTime: Date.now(),
  pendingEvents: [],
  userProperties: {},
  currentScreen: null,
  screenStartTime: null,
  screenHistory: [],
  performanceMetrics: {
    appStartTime: null,
    screenLoadTimes: {},
    apiResponseTimes: {},
    errorCounts: {},
  },
  conversionEvents: [],
  settings: {
    enableCrashlytics: true,
    enablePerformanceMonitoring: true,
    enableUserTracking: true,
    enableConversionTracking: true,
    enableDebugMode: false,
    dataRetentionDays: 30,
  },
  isInitialized: false,
  error: null,
  ...overrides,
});

// Store mock para os testes
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      analytics: analyticsReducer,
    },
    preloadedState: {
      analytics: {
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

// Factory functions
const createMockPurchase = (overrides = {}) => ({
  transactionId: 'order-123',
  value: 99.99,
  currency: 'BRL',
  items: [
    {
      item_id: 'item-1',
      item_name: 'Mystery Box',
      item_category: 'Electronics',
      quantity: 1,
      price: 99.99,
    },
  ],
  ...overrides,
});

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockAnalyticsService.initialize.mockResolvedValue({ sessionId: 'session-123' });
    mockAnalyticsService.logEvent.mockResolvedValue(undefined);
    mockAnalyticsService.logScreenView.mockResolvedValue(undefined);
    mockAnalyticsService.setUserId.mockResolvedValue(undefined);
    mockAnalyticsService.setUserProperties.mockResolvedValue(undefined);
    mockAnalyticsService.trackError.mockReturnValue(undefined);
    mockAnalyticsService.trackEngagement.mockResolvedValue(undefined);
    mockAnalyticsService.trackPurchase.mockResolvedValue(undefined);
    mockAnalyticsService.trackBoxOpening.mockResolvedValue(undefined);
    mockAnalyticsService.trackApiCall.mockReturnValue(undefined);
  });

  describe('Main Hook - Initialization', () => {
    it('deve inicializar analytics automaticamente quando autoInitialize é true', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useAnalytics({ autoInitialize: true }), { wrapper });

      await waitFor(() => {
        expect(mockAnalyticsService.initialize).toHaveBeenCalled();
      });
    });

    it('não deve inicializar automaticamente quando autoInitialize é false', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      expect(mockAnalyticsService.initialize).not.toHaveBeenCalled();
    });

    it('não deve inicializar se já estiver inicializado', () => {
      const store = createMockStore({ isInitialized: true });
      const wrapper = createWrapper(store);

      renderHook(() => useAnalytics({ autoInitialize: true }), { wrapper });

      expect(mockAnalyticsService.initialize).not.toHaveBeenCalled();
    });

    it('deve permitir inicialização manual', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.initialize();
      });

      expect(mockAnalyticsService.initialize).toHaveBeenCalled();
    });

    it('deve logar erro ao falhar na inicialização', async () => {
      mockAnalyticsService.initialize.mockRejectedValueOnce(new Error('Init failed'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.initialize();
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to initialize analytics:', expect.anything());
    });
  });

  describe('Main Hook - Event Tracking', () => {
    it('deve rastrear evento customizado', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('test_event', { param1: 'value1' });
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('test_event', { param1: 'value1' });
    });

    it('deve rastrear evento sem parâmetros', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('simple_event');
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('simple_event', undefined);
    });

    it('não deve rastrear evento quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('disabled_event');
      });

      expect(mockAnalyticsService.logEvent).not.toHaveBeenCalled();
    });

    it('deve rastrear múltiplos eventos', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('event1', { data: 'test1' });
        await result.current.track('event2', { data: 'test2' });
        await result.current.track('event3', { data: 'test3' });
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledTimes(3);
    });

    it('deve logar erro ao falhar no tracking de evento', async () => {
      mockAnalyticsService.logEvent.mockRejectedValueOnce(new Error('Event failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('failed_event');
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to track event:', expect.anything());
    });

    it('deve rastrear evento com parâmetros complexos', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      const complexParams = {
        userId: 'user-123',
        timestamp: Date.now(),
        metadata: { source: 'mobile', version: '1.0' },
        items: [{ id: 1, name: 'test' }],
      };

      await act(async () => {
        await result.current.track('complex_event', complexParams);
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('complex_event', complexParams);
    });

    it('deve rastrear evento com parâmetros vazios', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('empty_params_event', {});
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('empty_params_event', {});
    });

    it('deve rastrear evento com nome vazio', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.track('', { param: 'value' });
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('', { param: 'value' });
    });
  });

  describe('Main Hook - Screen View Tracking', () => {
    it('deve rastrear visualização de tela', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackScreenView('HomeScreen');
      });

      expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('HomeScreen', undefined);
    });

    it('deve rastrear visualização de tela com screenClass', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackScreenView('HomeScreen', 'MainScreen');
      });

      expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('HomeScreen', 'MainScreen');
    });

    it('não deve rastrear tela quando trackScreenViews é false', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false, trackScreenViews: false }), { wrapper });

      await act(async () => {
        await result.current.trackScreenView('DisabledScreen');
      });

      expect(mockAnalyticsService.logScreenView).not.toHaveBeenCalled();
    });

    it('não deve rastrear tela quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackScreenView('DisabledScreen');
      });

      expect(mockAnalyticsService.logScreenView).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar no tracking de tela', async () => {
      mockAnalyticsService.logScreenView.mockRejectedValueOnce(new Error('Screen tracking failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackScreenView('FailedScreen');
      });

      // O hook usa 'Error tracking screen:' ao invés de 'Failed to track screen view:'
      expect(logger.error).toHaveBeenCalledWith('Error tracking screen:', expect.anything());
    });
  });

  describe('Main Hook - User Management', () => {
    it('deve definir ID do usuário', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.setUser('user-123');
      });

      expect(mockAnalyticsService.setUserId).toHaveBeenCalledWith('user-123');
    });

    it('deve definir propriedades do usuário', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      const userProps = {
        age: 30,
        country: 'BR',
        language: 'pt-BR',
      };

      await act(async () => {
        await result.current.setUserProps(userProps);
      });

      expect(mockAnalyticsService.setUserProperties).toHaveBeenCalledWith(userProps);
    });

    it('deve limpar ID do usuário (logout)', async () => {
      const store = createMockStore({ userId: 'user-123' });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.setUser(null);
      });

      expect(mockAnalyticsService.setUserId).toHaveBeenCalledWith(null);
    });

    it('não deve definir propriedades quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.setUserProps({ age: 30 });
      });

      expect(mockAnalyticsService.setUserProperties).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar ao definir ID do usuário', async () => {
      mockAnalyticsService.setUserId.mockRejectedValueOnce(new Error('Failed to set user ID'));

      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.setUser('user-123');
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to set user ID:', expect.anything());
    });
  });

  describe('Main Hook - Conversion Tracking', () => {
    it('deve rastrear evento de conversão', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackConversion('purchase', 99.99, 'BRL');
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('conversion', {
        event: 'purchase',
        value: 99.99,
        currency: 'BRL',
      });
    });

    it('deve rastrear conversão sem valor', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackConversion('signup');
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('conversion', {
        event: 'signup',
        value: undefined,
        currency: undefined,
      });
    });

    it('não deve rastrear conversão quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackConversion('purchase', 99.99, 'BRL');
      });

      expect(mockAnalyticsService.logEvent).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar no tracking de conversão', async () => {
      mockAnalyticsService.logEvent.mockRejectedValueOnce(new Error('Conversion tracking failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackConversion('purchase', 99.99, 'BRL');
      });

      await waitFor(() => {
        // O erro vem de 'track' que é chamado dentro de 'trackConversion'
        expect(logger.error).toHaveBeenCalledWith('Failed to track event:', expect.anything());
      });
    });
  });

  describe('Main Hook - Error & Engagement Tracking', () => {
    it('deve rastrear erro', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      const error = new Error('Test error');

      act(() => {
        result.current.trackError(error, 'test_context');
      });

      expect(mockAnalyticsService.trackError).toHaveBeenCalledWith(error, 'test_context');
    });

    it('deve rastrear engagement', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackEngagement('button_click', 'buy_button', 1);
      });

      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('button_click', 'buy_button', 1);
    });

    it('não deve rastrear erro quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      const error = new Error('Test error');

      act(() => {
        result.current.trackError(error);
      });

      expect(mockAnalyticsService.trackError).not.toHaveBeenCalled();
    });

    it('não deve rastrear engagement quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackEngagement('action', 'target');
      });

      expect(mockAnalyticsService.trackEngagement).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar no tracking de engagement', async () => {
      mockAnalyticsService.trackEngagement.mockRejectedValueOnce(new Error('Engagement failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      await act(async () => {
        await result.current.trackEngagement('action', 'target');
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to track engagement:', expect.anything());
    });
  });

  describe('Main Hook - Return Values', () => {
    it('deve retornar todos os valores de state', () => {
      const store = createMockStore({
        isEnabled: true,
        isInitialized: true,
        userId: 'user-123',
        currentScreen: 'HomeScreen',
        performanceMetrics: {
          appStartTime: Date.now(),
          screenLoadTimes: { HomeScreen: 500 },
          apiResponseTimes: {},
          errorCounts: {},
        },
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.userId).toBe('user-123');
      expect(result.current.currentScreen).toBe('HomeScreen');
      expect(result.current.performanceMetrics).toBeDefined();
    });

    it('deve calcular isReady corretamente quando inicializado e habilitado', () => {
      const store = createMockStore({
        isInitialized: true,
        isEnabled: true,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      expect(result.current.isReady).toBe(true);
    });

    it('deve calcular isReady como false quando não inicializado', () => {
      const store = createMockStore({
        isInitialized: false,
        isEnabled: true,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      expect(result.current.isReady).toBe(false);
    });

    it('deve calcular isReady como false quando desabilitado', () => {
      const store = createMockStore({
        isInitialized: true,
        isEnabled: false,
      });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAnalytics({ autoInitialize: false }), { wrapper });

      expect(result.current.isReady).toBe(false);
    });
  });

  describe('useScreenTracking', () => {
    it('deve rastrear tela automaticamente quando isReady', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      renderHook(() => useScreenTracking('ProfileScreen', 'UserProfile'), { wrapper });

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('ProfileScreen', 'UserProfile');
      });
    });

    it('não deve rastrear tela quando analytics não está pronto', () => {
      const store = createMockStore({ isInitialized: false, isEnabled: true });
      const wrapper = createWrapper(store);

      renderHook(() => useScreenTracking('ProfileScreen'), { wrapper });

      expect(mockAnalyticsService.logScreenView).not.toHaveBeenCalled();
    });

    it('deve rastrear tela sem screenClass', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      renderHook(() => useScreenTracking('SimpleScreen'), { wrapper });

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('SimpleScreen', undefined);
      });
    });

    it('deve retornar screenName', () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useScreenTracking('TestScreen'), { wrapper });

      expect(result.current.screenName).toBe('TestScreen');
    });

    it('deve atualizar tracking quando screenName muda', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(
        ({ screenName, screenClass }) => useScreenTracking(screenName, screenClass),
        {
          wrapper,
          initialProps: { screenName: 'Screen1', screenClass: 'Class1' },
        }
      );

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('Screen1', 'Class1');
      });

      rerender({ screenName: 'Screen2', screenClass: 'Class2' });

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('Screen2', 'Class2');
      });
    });

    it('deve rastrear múltiplas telas', async () => {
      const store = createMockStore({ isInitialized: true, isEnabled: true });
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(
        ({ screenName }) => useScreenTracking(screenName),
        {
          wrapper,
          initialProps: { screenName: 'Screen1' },
        }
      );

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('Screen1', undefined);
      });

      rerender({ screenName: 'Screen2' });

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('Screen2', undefined);
      });

      rerender({ screenName: 'Screen3' });

      await waitFor(() => {
        expect(mockAnalyticsService.logScreenView).toHaveBeenCalledWith('Screen3', undefined);
      });
    });
  });

  describe('usePerformanceTracking', () => {
    it('deve rastrear chamada de API', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      const startTime = Date.now();

      act(() => {
        result.current.trackApiCall('/api/boxes', 'GET', startTime);
      });

      expect(mockAnalyticsService.trackApiCall).toHaveBeenCalledWith('/api/boxes', 'GET', startTime);
    });

    it('não deve rastrear API quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      act(() => {
        result.current.trackApiCall('/api/boxes', 'GET', Date.now());
      });

      expect(mockAnalyticsService.trackApiCall).not.toHaveBeenCalled();
    });

    it('deve rastrear tempo de carregamento de tela', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackScreenLoad('HomeScreen', 250);
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('screen_load_time', {
        screen_name: 'HomeScreen',
        load_time: 250,
      });
    });

    it('não deve rastrear tempo de tela quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackScreenLoad('HomeScreen', 250);
      });

      expect(mockAnalyticsService.logEvent).not.toHaveBeenCalled();
    });

    it('deve rastrear múltiplas chamadas de API', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      const startTime = Date.now();

      act(() => {
        result.current.trackApiCall('/api/boxes', 'GET', startTime);
        result.current.trackApiCall('/api/orders', 'POST', startTime);
        result.current.trackApiCall('/api/users', 'PUT', startTime);
      });

      expect(mockAnalyticsService.trackApiCall).toHaveBeenCalledTimes(3);
    });

    it('deve rastrear diferentes métodos HTTP', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => usePerformanceTracking(), { wrapper });

      const startTime = Date.now();

      act(() => {
        result.current.trackApiCall('/api/boxes', 'GET', startTime);
        result.current.trackApiCall('/api/boxes', 'POST', startTime);
        result.current.trackApiCall('/api/boxes', 'DELETE', startTime);
      });

      expect(mockAnalyticsService.trackApiCall).toHaveBeenCalledWith('/api/boxes', 'GET', startTime);
      expect(mockAnalyticsService.trackApiCall).toHaveBeenCalledWith('/api/boxes', 'POST', startTime);
      expect(mockAnalyticsService.trackApiCall).toHaveBeenCalledWith('/api/boxes', 'DELETE', startTime);
    });
  });

  describe('useEcommerceTracking', () => {
    it('deve rastrear compra completa', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      const purchase = createMockPurchase();

      await act(async () => {
        await result.current.trackPurchase(
          purchase.transactionId,
          purchase.value,
          purchase.currency,
          purchase.items
        );
      });

      expect(mockAnalyticsService.trackPurchase).toHaveBeenCalledWith(
        purchase.transactionId,
        purchase.value,
        purchase.currency,
        purchase.items
      );
    });

    it('deve rastrear adição ao carrinho', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackAddToCart('box-123', 'Mystery Box', 'Electronics', 99.99, 'BRL');
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('add_to_cart', {
        item_id: 'box-123',
        item_name: 'Mystery Box',
        item_category: 'Electronics',
        value: 99.99,
        currency: 'BRL',
      });
    });

    it('deve usar BRL como moeda padrão', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackAddToCart('box-123', 'Mystery Box', 'Electronics', 99.99);
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('add_to_cart', expect.objectContaining({
        currency: 'BRL',
      }));
    });

    it('deve rastrear remoção do carrinho', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackRemoveFromCart('box-123', 'Mystery Box', 'Electronics', 99.99, 'BRL');
      });

      expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith('remove_from_cart', {
        item_id: 'box-123',
        item_name: 'Mystery Box',
        item_category: 'Electronics',
        value: 99.99,
        currency: 'BRL',
      });
    });

    it('deve rastrear abertura de caixa', async () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      const itemsReceived = [
        { id: 'item-1', name: 'Produto 1', rarity: 'rare', value: 50.00 },
        { id: 'item-2', name: 'Produto 2', rarity: 'epic', value: 150.00 },
      ];

      await act(async () => {
        await result.current.trackBoxOpening('box-123', 'Mystery Box Premium', 99.99, itemsReceived);
      });

      expect(mockAnalyticsService.trackBoxOpening).toHaveBeenCalledWith(
        'box-123',
        'Mystery Box Premium',
        99.99,
        itemsReceived
      );
    });

    it('não deve rastrear compra quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      const purchase = createMockPurchase();

      await act(async () => {
        await result.current.trackPurchase(
          purchase.transactionId,
          purchase.value,
          purchase.currency,
          purchase.items
        );
      });

      expect(mockAnalyticsService.trackPurchase).not.toHaveBeenCalled();
    });

    it('não deve rastrear adição ao carrinho quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackAddToCart('box-123', 'Box', 'Category', 99.99);
      });

      expect(mockAnalyticsService.logEvent).not.toHaveBeenCalled();
    });

    it('não deve rastrear abertura de caixa quando analytics está desabilitado', async () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackBoxOpening('box-123', 'Box', 99.99, []);
      });

      expect(mockAnalyticsService.trackBoxOpening).not.toHaveBeenCalled();
    });

    it('deve logar erro ao falhar no tracking de compra', async () => {
      mockAnalyticsService.trackPurchase.mockRejectedValueOnce(new Error('Purchase failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      const purchase = createMockPurchase();

      await act(async () => {
        await result.current.trackPurchase(
          purchase.transactionId,
          purchase.value,
          purchase.currency,
          purchase.items
        );
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to track purchase:', expect.anything());
    });

    it('deve logar erro ao falhar no tracking de abertura de caixa', async () => {
      mockAnalyticsService.trackBoxOpening.mockRejectedValueOnce(new Error('Box opening failed'));

      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEcommerceTracking(), { wrapper });

      await act(async () => {
        await result.current.trackBoxOpening('box-123', 'Box', 99.99, []);
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to track box opening:', expect.anything());
    });
  });

  describe('useEngagementTracking', () => {
    it('deve rastrear clique em botão', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackButtonClick('buy_button', 'checkout');
      });

      // trackButtonClick não passa o parâmetro value, apenas action e target
      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('button_click', 'buy_button', undefined);
    });

    it('deve rastrear busca', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackSearch('mystery box', 42);
      });

      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('search', 'mystery box', 42);
    });

    it('deve rastrear compartilhamento', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackShare('box', 'box-123');
      });

      // trackShare não passa o parâmetro value
      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('share', 'box:box-123', undefined);
    });

    it('deve rastrear tempo gasto', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackTimeSpent('HomeScreen', 5000);
      });

      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('time_spent', 'HomeScreen', 5000);
    });

    it('não deve rastrear clique quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackButtonClick('button', 'context');
      });

      expect(mockAnalyticsService.trackEngagement).not.toHaveBeenCalled();
    });

    it('não deve rastrear busca quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackSearch('query', 10);
      });

      expect(mockAnalyticsService.trackEngagement).not.toHaveBeenCalled();
    });

    it('não deve rastrear compartilhamento quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackShare('type', 'id');
      });

      expect(mockAnalyticsService.trackEngagement).not.toHaveBeenCalled();
    });

    it('não deve rastrear tempo gasto quando analytics está desabilitado', () => {
      const store = createMockStore({ isEnabled: false });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackTimeSpent('Screen', 1000);
      });

      expect(mockAnalyticsService.trackEngagement).not.toHaveBeenCalled();
    });

    it('deve rastrear múltiplos cliques em sequência', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackButtonClick('button1');
        result.current.trackButtonClick('button2');
        result.current.trackButtonClick('button3');
      });

      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledTimes(3);
    });

    it('deve rastrear buscas sem resultados', () => {
      const store = createMockStore({ isEnabled: true });
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useEngagementTracking(), { wrapper });

      act(() => {
        result.current.trackSearch('query inexistente', 0);
      });

      expect(mockAnalyticsService.trackEngagement).toHaveBeenCalledWith('search', 'query inexistente', 0);
    });
  });
});
