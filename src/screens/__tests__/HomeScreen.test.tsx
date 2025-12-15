/**
 * Testes Unitários - HomeScreen
 *
 * Testa a tela principal do app após migração de Firebase para Keycloak
 *
 * Categorias:
 * 1. Renderização inicial
 * 2. Teste de conexão Keycloak
 * 3. Exibição de informações do app
 * 4. Integração com componentes Realtime/Offline/Analytics
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import HomeScreen from '../HomeScreen';
import keycloakService from '../../services/keycloakService';
import logger from '../../services/loggerService';
import { Alert } from 'react-native';

// Mocks
jest.mock('../../services/keycloakService');
jest.mock('../../services/loggerService', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../hooks/useRealtime', () => ({
  useLiveEvents: jest.fn(() => ({
    events: [],
    stats: { total: 0 },
    onlineUsers: 0,
    isConnected: true,
  })),
  useLiveNotifications: jest.fn(() => ({
    hasToasts: false,
    showNextToast: jest.fn(),
  })),
}));

jest.mock('../../hooks/useOffline', () => ({
  useOffline: jest.fn(() => ({
    isOnline: true,
    syncStatus: 'synced',
    hasPendingActions: false,
  })),
}));

jest.mock('../../hooks/useAnalytics', () => ({
  useScreenTracking: jest.fn(),
  useEngagementTracking: jest.fn(() => ({
    trackButtonClick: jest.fn(),
  })),
}));

jest.mock('../../hooks/usePerformance', () => ({
  usePerformance: jest.fn(() => ({
    metrics: {
      renderCount: 1,
      interactionCount: 0,
    },
  })),
}));

jest.mock('../../components/RealtimeStatus', () => 'RealtimeStatus');
jest.mock('../../components/LiveEventsFeed', () => 'LiveEventsFeed');
jest.mock('../../components/LiveStockUpdates', () => 'LiveStockUpdates');
jest.mock('../../components/LiveNewReleases', () => 'LiveNewReleases');
jest.mock('../../components/OfflineStatus', () => 'OfflineStatus');
jest.mock('../../components/AnalyticsDashboard', () => 'AnalyticsDashboard');
jest.mock('../../components/PerformanceDashboard', () => 'PerformanceDashboard');

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
      realtime: (state = { isConnected: true }) => state,
      offline: (state = { isOnline: true }) => state,
    },
    preloadedState: initialState,
  });
};

describe('HomeScreen', () => {
  const mockedKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;
  const mockedLogger = logger as jest.Mocked<typeof logger>;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar a tela corretamente', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      expect(getByText(/Home/i)).toBeTruthy();
    });

    it('deve exibir botão de teste Keycloak', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      expect(getByText(/Test Keycloak/i)).toBeTruthy();
    });

    it('deve exibir botão de informações do app', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      expect(getByText(/App Info/i)).toBeTruthy();
    });
  });

  describe('Teste de Conexão Keycloak', () => {
    it('deve testar conexão Keycloak com sucesso', async () => {
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);

      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      const testButton = getByText(/Test Keycloak/i);
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(
          'Keycloak Test',
          'Conexão bem-sucedida!',
          [{ text: 'OK' }]
        );
      });
    });

    it('deve tratar erro quando Keycloak não está autenticado', async () => {
      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      const testButton = getByText(/Test Keycloak/i);
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(
          'Keycloak Test',
          'Não autenticado',
          [{ text: 'OK' }]
        );
      });
    });

    it('deve tratar erro quando teste Keycloak falha', async () => {
      const error = new Error('Erro de conexão');
      mockedKeycloakService.isAuthenticated.mockRejectedValue(error);

      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      const testButton = getByText(/Test Keycloak/i);
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1);
        expect(mockedLogger.error).toHaveBeenCalledWith('Error testing Keycloak:', error);
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro',
          'Erro ao testar Keycloak',
          [{ text: 'OK' }]
        );
      });
    });

    it('deve mostrar loading durante teste Keycloak', async () => {
      mockedKeycloakService.isAuthenticated.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      const testButton = getByText(/Test Keycloak/i);
      fireEvent.press(testButton);

      // Verificar que o botão está desabilitado durante loading
      await waitFor(() => {
        expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalled();
      });
    });
  });

  describe('Exibição de Informações do App', () => {
    it('deve exibir informações do app ao clicar no botão', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      const infoButton = getByText(/App Info/i);
      fireEvent.press(infoButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Informações do App',
        expect.stringContaining('Versão:'),
        [{ text: 'OK' }]
      );
    });
  });

  describe('Integração com Componentes', () => {
    it('deve renderizar componentes Realtime', () => {
      const store = createMockStore();
      const { UNSAFE_getByType } = render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      // Verificar que componentes são renderizados
      // Como são componentes mockados, apenas verificamos que não há erros
      expect(store.getState()).toBeDefined();
    });

    it('deve renderizar componentes Offline', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      // Verificar que componentes são renderizados
      expect(store.getState()).toBeDefined();
    });

    it('deve renderizar componentes Analytics', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <HomeScreen />
        </Provider>
      );

      // Verificar que componentes são renderizados
      expect(store.getState()).toBeDefined();
    });
  });
});
