import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuthListener } from '../useAuthListener';
import authSlice from '../../store/slices/authSlice';
import keycloakService from '../../services/keycloakService';
import logger from '../../services/loggerService';

// Mock dos serviços
jest.mock('../../services/keycloakService', () => ({
  __esModule: true,
  default: {
    isAuthenticated: jest.fn(),
    getUserInfo: jest.fn(),
  },
}));

jest.mock('../../services/loggerService', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

// Mock Keycloak User Info
const createMockKeycloakUser = (overrides = {}) => ({
  sub: 'keycloak-user-123',
  id: 'keycloak-user-123',
  email: 'test@crowbar.com',
  name: 'Test User',
  preferred_username: 'testuser',
  picture: 'https://example.com/photo.jpg',
  email_verified: true,
  ...overrides,
});

// Store mock para os testes
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: true,
        error: null,
        lastLoginTime: null,
        needsMfaSetup: false,
        ...initialState,
      },
    },
  });
};

// Wrapper com Redux Provider
const createWrapper = (store: ReturnType<typeof createMockStore>) => {
  return ({ children }: any) => React.createElement(Provider, { store }, children);
};

describe('useAuthListener - Keycloak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mock padrão para Keycloak
    mockedKeycloakService.isAuthenticated.mockResolvedValue(false);
    mockedKeycloakService.getUserInfo.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Inicialização', () => {
    it('deve configurar listener do Keycloak Auth ao montar', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useAuthListener(), { wrapper });

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Setting up Keycloak Auth listener...');
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalled();
    });

    it('deve finalizar inicialização após verificar estado', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useAuthListener(), { wrapper });

      // Avançar timers para executar verificação
      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.isInitializing).toBe(false);
    });
  });

  describe('Login de Usuário', () => {
    it('deve atualizar Redux state quando usuário faz login', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      // Avançar timers para executar verificação
      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Auth state changed:', 'User logged in');
      expect(state.auth.user).toEqual({
        uid: mockUserInfo.sub,
        email: mockUserInfo.email,
        displayName: mockUserInfo.name,
        photoURL: mockUserInfo.picture,
        emailVerified: mockUserInfo.email_verified,
      });
      expect(state.auth.isInitializing).toBe(false);
    });

    it('deve mapear dados do usuário corretamente', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        sub: 'custom-keycloak-id',
        email: 'custom@example.com',
        name: 'Custom Name',
        picture: 'https://custom.com/photo.jpg',
        email_verified: false,
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user).toEqual({
        uid: 'custom-keycloak-id',
        email: 'custom@example.com',
        displayName: 'Custom Name',
        photoURL: 'https://custom.com/photo.jpg',
        emailVerified: false,
      });
    });

    it('deve lidar com usuário sem name (usa preferred_username)', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        name: null,
        preferred_username: 'testuser',
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user?.displayName).toBe('testuser');
    });

    it('deve lidar com usuário sem picture', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        picture: null,
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user?.photoURL).toBeNull();
    });
  });

  describe('Logout de Usuário', () => {
    it('deve limpar Redux state quando usuário faz logout', async () => {
      const store = createMockStore({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          emailVerified: true,
        },
        isAuthenticated: true,
      });
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);
      mockedKeycloakService.getUserInfo.mockResolvedValue(null);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Auth state changed:', 'User logged out');
      expect(state.auth.user).toBeNull();
      expect(state.auth.isInitializing).toBe(false);
    });

    it('deve finalizar inicialização mesmo sem usuário', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.isInitializing).toBe(false);
    });
  });

  describe('Transições de Estado', () => {
    it('deve lidar com login seguido de logout', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValueOnce(true);
      mockedKeycloakService.getUserInfo.mockResolvedValueOnce(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      let state = store.getState();
      expect(state.auth.user).not.toBeNull();

      // Simular logout
      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);
      mockedKeycloakService.getUserInfo.mockResolvedValue(null);

      await waitFor(() => {
        jest.advanceTimersByTime(30000); // Avançar intervalo de verificação
      });

      state = store.getState();
      expect(state.auth.user).toBeNull();
    });

    it('deve lidar com múltiplos logins (troca de usuário)', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const user1Info = createMockKeycloakUser({
        sub: 'user1',
        email: 'user1@example.com',
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValueOnce(true);
      mockedKeycloakService.getUserInfo.mockResolvedValueOnce(user1Info);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      let state = store.getState();
      expect(state.auth.user?.uid).toBe('user1');

      // Segundo usuário
      const user2Info = createMockKeycloakUser({
        sub: 'user2',
        email: 'user2@example.com',
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValueOnce(true);
      mockedKeycloakService.getUserInfo.mockResolvedValueOnce(user2Info);

      await waitFor(() => {
        jest.advanceTimersByTime(30000);
      });

      state = store.getState();
      expect(state.auth.user?.uid).toBe('user2');
      expect(state.auth.user?.email).toBe('user2@example.com');
    });
  });

  describe('Cleanup', () => {
    it('deve limpar interval ao desmontar', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useAuthListener(), { wrapper });

      unmount();

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Cleaning up Keycloak Auth listener...');
      // Verificar que não há mais chamadas após unmount
      jest.advanceTimersByTime(30000);
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1); // Apenas a chamada inicial
    });

    it('deve limpar interval apenas uma vez', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useAuthListener(), { wrapper });

      unmount();
      unmount(); // Segundo unmount não deve causar problemas

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Cleaning up Keycloak Auth listener...');
    });
  });

  describe('Re-render', () => {
    it('não deve criar novo interval em re-render', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { rerender } = renderHook(() => useAuthListener(), { wrapper });

      // Primeiro render já chamou isAuthenticated
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1);

      // Re-render não deve criar novo interval
      rerender();

      // Avançar tempo para verificar que não há múltiplos intervals
      jest.advanceTimersByTime(30000);
      // Deve ter chamado apenas uma vez a mais (do intervalo)
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com email null', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        email: null,
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user?.email).toBeNull();
    });

    it('deve lidar com sub vazio (usa id)', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        sub: '',
        id: 'fallback-id',
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user?.uid).toBe('fallback-id');
    });

    it('deve lidar com emailVerified false', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser({
        email_verified: false,
      });

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user?.emailVerified).toBe(false);
    });

    it('deve lidar com usuário sem propriedades opcionais', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = {
        sub: 'minimal-keycloak-id',
        id: 'minimal-keycloak-id',
        email: null,
        name: null,
        preferred_username: null,
        picture: null,
        email_verified: false,
      };

      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user).toEqual({
        uid: 'minimal-keycloak-id',
        email: null,
        displayName: null,
        photoURL: null,
        emailVerified: false,
      });
    });

    it('deve lidar com erro ao verificar autenticação', async () => {
      const store = createMockStore({
        user: {
          uid: 'existing-user',
          email: 'existing@example.com',
          displayName: 'Existing User',
          photoURL: null,
          emailVerified: true,
        },
      });
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockRejectedValue(new Error('Network error'));

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      // Em caso de erro, deve limpar usuário
      expect(state.auth.user).toBeNull();
      expect(mockedLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('deve logar setup inicial', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      renderHook(() => useAuthListener(), { wrapper });

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Setting up Keycloak Auth listener...');
    });

    it('deve logar login de usuário', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Auth state changed:', 'User logged in');
    });

    it('deve logar logout de usuário', async () => {
      const store = createMockStore({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          emailVerified: true,
        },
      });
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Auth state changed:', 'User logged out');
    });

    it('deve logar cleanup', () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const { unmount } = renderHook(() => useAuthListener(), { wrapper });

      unmount();

      expect(mockedLogger.debug).toHaveBeenCalledWith('🔐 Cleaning up Keycloak Auth listener...');
    });
  });

  describe('Integração com Redux', () => {
    it('deve dispatch setUser e finishInitialization para login', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();

      // Verificar ambos os dispatches
      expect(state.auth.user).not.toBeNull();
      expect(state.auth.isInitializing).toBe(false);
    });

    it('deve dispatch setUser(null) e finishInitialization para logout', async () => {
      const store = createMockStore({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
          emailVerified: true,
        },
        isAuthenticated: true,
      });
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();

      expect(state.auth.user).toBeNull();
      expect(state.auth.isInitializing).toBe(false);
    });

    it('deve preservar outros campos do state', async () => {
      const store = createMockStore({
        error: 'Some previous error',
        lastLoginTime: 123456789,
        needsMfaSetup: true,
      });
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();

      // setUser não deve limpar outros campos
      expect(state.auth.error).toBe('Some previous error');
      expect(state.auth.lastLoginTime).toBe(123456789);
      expect(state.auth.needsMfaSetup).toBe(true);
    });
  });

  describe('Comportamento Assíncrono', () => {
    it('deve lidar com verificação assíncrona', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      const mockUserInfo = createMockKeycloakUser();
      mockedKeycloakService.isAuthenticated.mockResolvedValue(true);
      mockedKeycloakService.getUserInfo.mockResolvedValue(mockUserInfo);

      renderHook(() => useAuthListener(), { wrapper });

      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });

      const state = store.getState();
      expect(state.auth.user).not.toBeNull();
    });

    it('deve verificar estado periodicamente', async () => {
      const store = createMockStore();
      const wrapper = createWrapper(store);

      mockedKeycloakService.isAuthenticated.mockResolvedValue(false);

      renderHook(() => useAuthListener(), { wrapper });

      // Verificação inicial
      await waitFor(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(1);

      // Verificação periódica (30 segundos)
      await waitFor(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(mockedKeycloakService.isAuthenticated).toHaveBeenCalledTimes(2);
    });
  });
});
