/**
 * Testes Unitários - authSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de autenticação Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, login, logout, refresh tokens, MFA, selectors
 */

import authReducer, {
  AuthState,
  User,
  loginWithKeycloak,
  logout,
  refreshTokens,
  checkAuthState,
  enableMfa,
  disableMfa,
  clearError,
  setUser,
  setGotifyToken,
  finishInitialization,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsInitializing,
  selectAuthError,
  selectNeedsMfaSetup,
} from '../authSlice';
import { configureStore } from '@reduxjs/toolkit';

// Mock dos serviços
jest.mock('../../../services/keycloakService');
jest.mock('../../../services/mfaService');
jest.mock('../../../services/loggerService');

import keycloakService from '../../../services/keycloakService';
import mfaService from '../../../services/mfaService';

// Helper para criar mock user
const createMockUser = (overrides?: Partial<User>): User => ({
  sub: 'test-sub-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  idToken: 'mock-id-token',
  accessTokenExpirationDate: '2025-12-31T23:59:59Z',
  mfaEnabled: false,
  ...overrides,
});

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ auth: AuthState }>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });
};

describe('authSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = authReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: true,
        error: null,
        lastLoginTime: null,
        needsMfaSetup: false,
      });
    });

    it('deve ter isInitializing como true no estado inicial', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.isInitializing).toBe(true);
    });

    it('deve ter user como null no estado inicial', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.user).toBeNull();
    });

    it('deve ter isAuthenticated como false no estado inicial', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // ============================================
  // 2. LOGIN TESTS (loginWithKeycloak thunk)
  // ============================================
  describe('Login com Keycloak', () => {
    const mockAuthResult = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      idToken: 'test-id-token',
      accessTokenExpirationDate: '2025-12-31T23:59:59Z',
    };

    const mockUserInfo = {
      sub: 'user-123',
      email: 'user@test.com',
      name: 'Test User',
      email_verified: true,
      preferred_username: 'testuser',
    };

    it('deve definir isLoading como true quando login está pendente', () => {
      const initialState: AuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        error: null,
        lastLoginTime: null,
        needsMfaSetup: false,
      };

      const nextState = authReducer(initialState, loginWithKeycloak.pending('', undefined));

      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar estado com user e isAuthenticated true quando login é bem-sucedido', async () => {
      (keycloakService.login as jest.Mock).mockResolvedValue(mockAuthResult);
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: false });

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.sub).toBe('user-123');
      expect(state.user?.email).toBe('user@test.com');
      expect(state.user?.displayName).toBe('Test User');
      expect(state.error).toBeNull();
    });

    it('deve definir lastLoginTime quando login é bem-sucedido', async () => {
      (keycloakService.login as jest.Mock).mockResolvedValue(mockAuthResult);
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: false });

      const beforeTime = Date.now();
      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());
      const afterTime = Date.now();

      const state = store.getState().auth;

      expect(state.lastLoginTime).not.toBeNull();
      expect(state.lastLoginTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastLoginTime).toBeLessThanOrEqual(afterTime);
    });

    it('deve definir needsMfaSetup como true quando MFA não está habilitado', async () => {
      (keycloakService.login as jest.Mock).mockResolvedValue(mockAuthResult);
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: false });

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.needsMfaSetup).toBe(true);
    });

    it('deve definir needsMfaSetup como false quando MFA está habilitado', async () => {
      (keycloakService.login as jest.Mock).mockResolvedValue(mockAuthResult);
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: true });

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.needsMfaSetup).toBe(false);
      expect(state.user?.mfaEnabled).toBe(true);
    });

    it('deve lidar com erro de login e definir mensagem de erro', async () => {
      (keycloakService.login as jest.Mock).mockRejectedValue(new Error('Login failed'));

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('deve definir mensagem de erro específica quando usuário cancela login', async () => {
      (keycloakService.login as jest.Mock).mockRejectedValue(new Error('User cancelled flow'));

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.error).toBe('Login cancelado pelo usuário');
    });

    it('deve definir mensagem de erro específica quando há erro de rede', async () => {
      (keycloakService.login as jest.Mock).mockRejectedValue(new Error('network error occurred'));

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.error).toBe('Erro de conexão. Verifique sua internet');
    });

    it('deve continuar login mesmo se verificação de MFA falhar', async () => {
      (keycloakService.login as jest.Mock).mockResolvedValue(mockAuthResult);
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (mfaService.getStatus as jest.Mock).mockRejectedValue(new Error('MFA check failed'));

      const store = createTestStore();
      await store.dispatch(loginWithKeycloak());

      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.mfaEnabled).toBe(false);
    });
  });

  // ============================================
  // 3. LOGOUT TESTS
  // ============================================
  describe('Logout', () => {
    it('deve definir isLoading como true quando logout está pendente', () => {
      const initialState: AuthState = {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
        lastLoginTime: Date.now(),
        needsMfaSetup: false,
      };

      const nextState = authReducer(initialState, logout.pending('', undefined));

      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve limpar user e isAuthenticated quando logout é bem-sucedido', async () => {
      (keycloakService.logout as jest.Mock).mockResolvedValue(undefined);

      const store = createTestStore({
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        },
      });

      await store.dispatch(logout());

      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.lastLoginTime).toBeNull();
      expect(state.needsMfaSetup).toBe(false);
      expect(state.error).toBeNull();
    });

    it('deve limpar lastLoginTime quando logout é bem-sucedido', async () => {
      (keycloakService.logout as jest.Mock).mockResolvedValue(undefined);

      const store = createTestStore({
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: 1234567890,
          needsMfaSetup: false,
        },
      });

      await store.dispatch(logout());

      const state = store.getState().auth;

      expect(state.lastLoginTime).toBeNull();
    });

    it('deve definir erro quando logout falha', async () => {
      (keycloakService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      const store = createTestStore({
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        },
      });

      await store.dispatch(logout());

      const state = store.getState().auth;

      expect(state.error).toBe('Erro ao fazer logout');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 4. TOKEN REFRESH TESTS
  // ============================================
  describe('Refresh Tokens', () => {
    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      idToken: 'new-id-token',
      accessTokenExpirationDate: '2025-12-31T23:59:59Z',
    };

    it('deve definir isLoading como true quando refresh está pendente', () => {
      const initialState: AuthState = {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
        lastLoginTime: Date.now(),
        needsMfaSetup: false,
      };

      const nextState = authReducer(initialState, refreshTokens.pending('', undefined));

      expect(nextState.isLoading).toBe(true);
    });

    it('deve atualizar tokens do usuário quando refresh é bem-sucedido', async () => {
      (keycloakService.refreshTokens as jest.Mock).mockResolvedValue(mockNewTokens);

      const store = createTestStore({
        auth: {
          user: createMockUser({
            accessToken: 'old-token',
            refreshToken: 'old-refresh',
          }),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        },
      });

      await store.dispatch(refreshTokens());

      const state = store.getState().auth;

      expect(state.user?.accessToken).toBe('new-access-token');
      expect(state.user?.refreshToken).toBe('new-refresh-token');
      expect(state.user?.idToken).toBe('new-id-token');
      expect(state.isLoading).toBe(false);
    });

    it('não deve atualizar tokens se user for null', async () => {
      (keycloakService.refreshTokens as jest.Mock).mockResolvedValue(mockNewTokens);

      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: null,
          needsMfaSetup: false,
        },
      });

      await store.dispatch(refreshTokens());

      const state = store.getState().auth;

      expect(state.user).toBeNull();
    });

    it('deve forçar logout quando refresh falha', async () => {
      (keycloakService.refreshTokens as jest.Mock).mockResolvedValue(null);

      const store = createTestStore({
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        },
      });

      await store.dispatch(refreshTokens());

      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Sessão expirada. Faça login novamente');
    });

    it('deve definir erro quando refresh rejeita', async () => {
      (keycloakService.refreshTokens as jest.Mock).mockRejectedValue(
        new Error('Token refresh failed')
      );

      const store = createTestStore({
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        },
      });

      await store.dispatch(refreshTokens());

      const state = store.getState().auth;

      expect(state.error).toBe('Sessão expirada. Faça login novamente');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // ============================================
  // 5. CHECK AUTH STATE TESTS
  // ============================================
  describe('Verificar Estado de Autenticação', () => {
    const mockTokens = {
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
      idToken: 'stored-id-token',
      accessTokenExpirationDate: '2025-12-31T23:59:59Z',
    };

    const mockUserInfo = {
      sub: 'user-123',
      email: 'stored@test.com',
      name: 'Stored User',
      email_verified: true,
    };

    it('deve definir isInitializing como true quando check está pendente', () => {
      const initialState: AuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        error: null,
        lastLoginTime: null,
        needsMfaSetup: false,
      };

      const nextState = authReducer(initialState, checkAuthState.pending('', undefined));

      expect(nextState.isInitializing).toBe(true);
    });

    it('deve restaurar usuário quando tokens válidos existem', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (keycloakService.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (keycloakService.getTokens as jest.Mock).mockResolvedValue(mockTokens);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: false });

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.isInitializing).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.sub).toBe('user-123');
      expect(state.user?.email).toBe('stored@test.com');
    });

    it('deve retornar null quando usuário não está autenticado', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockResolvedValue(false);

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.isInitializing).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('deve retornar null quando token expirou e refresh falhou', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (keycloakService.getAccessToken as jest.Mock).mockResolvedValue(null);

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('deve retornar null quando tokens não existem', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (keycloakService.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (keycloakService.getTokens as jest.Mock).mockResolvedValue(null);

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.user).toBeNull();
    });

    it('deve definir needsMfaSetup baseado no status MFA', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockResolvedValue(true);
      (keycloakService.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      (keycloakService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (keycloakService.getTokens as jest.Mock).mockResolvedValue(mockTokens);
      (mfaService.getStatus as jest.Mock).mockResolvedValue({ mfaEnabled: true });

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.needsMfaSetup).toBe(false);
    });

    it('deve lidar com erro ao verificar auth state', async () => {
      (keycloakService.isAuthenticated as jest.Mock).mockRejectedValue(
        new Error('Check failed')
      );

      const store = createTestStore();
      await store.dispatch(checkAuthState());

      const state = store.getState().auth;

      expect(state.isInitializing).toBe(false);
      expect(state.error).toBe('Erro ao verificar autenticação');
    });
  });

  // ============================================
  // 6. MFA TESTS (enableMfa, disableMfa)
  // ============================================
  describe('MFA Operations', () => {
    describe('Enable MFA', () => {
      it('deve definir isLoading como true quando enable MFA está pendente', () => {
        const initialState: AuthState = {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: true,
        };

        const nextState = authReducer(initialState, enableMfa.pending('', undefined));

        expect(nextState.isLoading).toBe(true);
        expect(nextState.error).toBeNull();
      });

      it('deve atualizar needsMfaSetup e user.mfaEnabled quando MFA é habilitado', async () => {
        (mfaService.enable as jest.Mock).mockResolvedValue({ success: true });

        const store = createTestStore({
          auth: {
            user: createMockUser({ mfaEnabled: false }),
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            error: null,
            lastLoginTime: Date.now(),
            needsMfaSetup: true,
          },
        });

        await store.dispatch(enableMfa());

        const state = store.getState().auth;

        expect(state.needsMfaSetup).toBe(false);
        expect(state.user?.mfaEnabled).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('deve definir erro quando enable MFA falha', async () => {
        (mfaService.enable as jest.Mock).mockRejectedValue(new Error('MFA enable failed'));

        const store = createTestStore({
          auth: {
            user: createMockUser({ mfaEnabled: false }),
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            error: null,
            lastLoginTime: Date.now(),
            needsMfaSetup: true,
          },
        });

        await store.dispatch(enableMfa());

        const state = store.getState().auth;

        expect(state.error).toBe('Erro ao habilitar MFA');
        expect(state.isLoading).toBe(false);
      });
    });

    describe('Disable MFA', () => {
      it('deve definir isLoading como true quando disable MFA está pendente', () => {
        const initialState: AuthState = {
          user: createMockUser({ mfaEnabled: true }),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        };

        const nextState = authReducer(
          initialState,
          disableMfa.pending('', 'credential-123')
        );

        expect(nextState.isLoading).toBe(true);
        expect(nextState.error).toBeNull();
      });

      it('deve atualizar user.mfaEnabled para false quando MFA é desabilitado', async () => {
        (mfaService.disable as jest.Mock).mockResolvedValue(undefined);

        const store = createTestStore({
          auth: {
            user: createMockUser({ mfaEnabled: true }),
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            error: null,
            lastLoginTime: Date.now(),
            needsMfaSetup: false,
          },
        });

        await store.dispatch(disableMfa('credential-123'));

        const state = store.getState().auth;

        expect(state.user?.mfaEnabled).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('deve definir erro quando disable MFA falha', async () => {
        (mfaService.disable as jest.Mock).mockRejectedValue(new Error('MFA disable failed'));

        const store = createTestStore({
          auth: {
            user: createMockUser({ mfaEnabled: true }),
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
            error: null,
            lastLoginTime: Date.now(),
            needsMfaSetup: false,
          },
        });

        await store.dispatch(disableMfa('credential-123'));

        const state = store.getState().auth;

        expect(state.error).toBe('Erro ao desabilitar MFA');
        expect(state.isLoading).toBe(false);
      });
    });
  });

  // ============================================
  // 7. SYNCHRONOUS REDUCERS TESTS
  // ============================================
  describe('Reducers Síncronos', () => {
    describe('clearError', () => {
      it('deve limpar erro do estado', () => {
        const initialState: AuthState = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
          error: 'Algum erro',
          lastLoginTime: null,
          needsMfaSetup: false,
        };

        const nextState = authReducer(initialState, clearError());

        expect(nextState.error).toBeNull();
      });
    });

    describe('setUser', () => {
      it('deve definir usuário e isAuthenticated quando user não é null', () => {
        const initialState: AuthState = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: true,
          error: null,
          lastLoginTime: null,
          needsMfaSetup: false,
        };

        const mockUser = createMockUser();
        const nextState = authReducer(initialState, setUser(mockUser));

        expect(nextState.user).toEqual(mockUser);
        expect(nextState.isAuthenticated).toBe(true);
        expect(nextState.isInitializing).toBe(false);
      });

      it('deve limpar usuário e isAuthenticated quando user é null', () => {
        const initialState: AuthState = {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: true,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        };

        const nextState = authReducer(initialState, setUser(null));

        expect(nextState.user).toBeNull();
        expect(nextState.isAuthenticated).toBe(false);
        expect(nextState.isInitializing).toBe(false);
      });
    });

    describe('setGotifyToken', () => {
      it('deve definir gotifyToken no usuário quando user existe', () => {
        const initialState: AuthState = {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: Date.now(),
          needsMfaSetup: false,
        };

        const nextState = authReducer(initialState, setGotifyToken('gotify-token-123'));

        expect(nextState.user?.gotifyToken).toBe('gotify-token-123');
      });

      it('não deve fazer nada quando user é null', () => {
        const initialState: AuthState = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
          error: null,
          lastLoginTime: null,
          needsMfaSetup: false,
        };

        const nextState = authReducer(initialState, setGotifyToken('gotify-token-123'));

        expect(nextState.user).toBeNull();
      });
    });

    describe('finishInitialization', () => {
      it('deve definir isInitializing como false', () => {
        const initialState: AuthState = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: true,
          error: null,
          lastLoginTime: null,
          needsMfaSetup: false,
        };

        const nextState = authReducer(initialState, finishInitialization());

        expect(nextState.isInitializing).toBe(false);
      });
    });
  });

  // ============================================
  // 8. SELECTORS TESTS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      auth: {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: 'Test error',
        lastLoginTime: 1234567890,
        needsMfaSetup: true,
      },
    };

    it('selectAuth deve retornar estado auth completo', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    it('selectUser deve retornar usuário', () => {
      expect(selectUser(mockState)).toEqual(mockState.auth.user);
    });

    it('selectIsAuthenticated deve retornar status de autenticação', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('selectIsLoading deve retornar status de loading', () => {
      expect(selectIsLoading(mockState)).toBe(false);
    });

    it('selectIsInitializing deve retornar status de inicialização', () => {
      expect(selectIsInitializing(mockState)).toBe(false);
    });

    it('selectAuthError deve retornar erro', () => {
      expect(selectAuthError(mockState)).toBe('Test error');
    });

    it('selectNeedsMfaSetup deve retornar status de MFA setup', () => {
      expect(selectNeedsMfaSetup(mockState)).toBe(true);
    });

    it('selectUser deve retornar null quando user não existe', () => {
      const stateWithoutUser = {
        auth: {
          ...mockState.auth,
          user: null,
        },
      };

      expect(selectUser(stateWithoutUser)).toBeNull();
    });

    it('selectIsAuthenticated deve retornar false quando não autenticado', () => {
      const unauthState = {
        auth: {
          ...mockState.auth,
          isAuthenticated: false,
        },
      };

      expect(selectIsAuthenticated(unauthState)).toBe(false);
    });
  });
});
