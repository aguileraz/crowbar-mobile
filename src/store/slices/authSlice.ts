import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import keycloakService from '../../services/keycloakService';
import mfaService from '../../services/mfaService';
import logger from '../../services/loggerService';

/**
 * Authentication Redux Slice
 * Gerencia o estado de autenticação do usuário usando Keycloak OAuth2/OIDC
 */

// Tipos para o estado de autenticação
export interface User {
  sub: string; // Keycloak subject (ID do usuário)
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  accessTokenExpirationDate: string;
  gotifyToken?: string; // Token Gotify para push notifications
  mfaEnabled?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  lastLoginTime: number | null;
  needsMfaSetup: boolean;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  lastLoginTime: null,
  needsMfaSetup: false,
};

// Async Thunks para operações de autenticação

/**
 * Login com Keycloak OAuth2
 * Abre navegador para login e retorna com tokens
 */
export const loginWithKeycloak = createAsyncThunk(
  'auth/loginWithKeycloak',
  async (_, { rejectWithValue }) => {
    try {
      logger.info('Iniciando login com Keycloak...');

      // Executar OAuth2 Authorization Code Flow
      const authResult = await keycloakService.login();

      // Obter informações do usuário
      const userInfo = await keycloakService.getUserInfo();

      // Verificar status MFA
      let mfaEnabled = false;
      try {
        const mfaStatus = await mfaService.getStatus();
        mfaEnabled = mfaStatus.mfaEnabled;
      } catch (error) {
        logger.warn('Failed to check MFA status:', error);
      }

      // Construir objeto User
      const user: User = {
        sub: userInfo.sub,
        email: userInfo.email || null,
        displayName: userInfo.name || userInfo.preferred_username || null,
        emailVerified: userInfo.email_verified || false,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        idToken: authResult.idToken,
        accessTokenExpirationDate: authResult.accessTokenExpirationDate,
        mfaEnabled,
        // gotifyToken será obtido do backend após login
      };

      logger.info('Login com Keycloak realizado com sucesso', {
        sub: user.sub,
        email: user.email,
      });

      return user;
    } catch (error: any) {
      logger.error('Erro no login Keycloak:', error);

      let errorMessage = 'Erro ao fazer login';

      if (error.message) {
        if (error.message.includes('User cancelled')) {
          errorMessage = 'Login cancelado pelo usuário';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet';
        } else {
          errorMessage = error.message;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Logout do Keycloak
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      logger.info('Executando logout...');
      await keycloakService.logout();
      logger.info('Logout realizado com sucesso');
      return null;
    } catch (error: any) {
      logger.error('Erro no logout:', error);
      return rejectWithValue('Erro ao fazer logout');
    }
  }
);

/**
 * Refresh tokens (automático quando token expira)
 */
export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('Atualizando tokens...');
      const newTokens = await keycloakService.refreshTokens();

      if (!newTokens) {
        throw new Error('Failed to refresh tokens');
      }

      logger.debug('Tokens atualizados com sucesso');

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        idToken: newTokens.idToken,
        accessTokenExpirationDate: newTokens.accessTokenExpirationDate,
      };
    } catch (error: any) {
      logger.error('Erro ao atualizar tokens:', error);
      return rejectWithValue('Sessão expirada. Faça login novamente');
    }
  }
);

/**
 * Verificar estado de autenticação atual (tokens salvos)
 */
export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('Verificando estado de autenticação...');

      const isAuthenticated = await keycloakService.isAuthenticated();

      if (!isAuthenticated) {
        logger.debug('Usuário não autenticado');
        return null;
      }

      // Obter token de acesso (auto-refresh se expirado)
      const accessToken = await keycloakService.getAccessToken();

      if (!accessToken) {
        logger.debug('Token expirado e refresh falhou');
        return null;
      }

      // Obter informações do usuário
      const userInfo = await keycloakService.getUserInfo();

      // Obter tokens do Keychain
      const tokens = await keycloakService.getTokens();

      if (!tokens) {
        return null;
      }

      // Verificar status MFA
      let mfaEnabled = false;
      try {
        const mfaStatus = await mfaService.getStatus();
        mfaEnabled = mfaStatus.mfaEnabled;
      } catch (error) {
        logger.warn('Failed to check MFA status:', error);
      }

      const user: User = {
        sub: userInfo.sub,
        email: userInfo.email || null,
        displayName: userInfo.name || userInfo.preferred_username || null,
        emailVerified: userInfo.email_verified || false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        accessTokenExpirationDate: tokens.accessTokenExpirationDate,
        mfaEnabled,
      };

      logger.info('Usuário autenticado encontrado', {
        sub: user.sub,
        email: user.email,
      });

      return user;
    } catch (error: any) {
      logger.error('Erro ao verificar estado de autenticação:', error);
      return rejectWithValue('Erro ao verificar autenticação');
    }
  }
);

/**
 * Habilitar MFA (TOTP)
 */
export const enableMfa = createAsyncThunk(
  'auth/enableMfa',
  async (_, { rejectWithValue }) => {
    try {
      logger.info('Habilitando MFA...');
      const response = await mfaService.enable();
      logger.info('MFA habilitado com sucesso');
      return response;
    } catch (error: any) {
      logger.error('Erro ao habilitar MFA:', error);
      return rejectWithValue('Erro ao habilitar MFA');
    }
  }
);

/**
 * Desabilitar MFA
 */
export const disableMfa = createAsyncThunk(
  'auth/disableMfa',
  async (credentialId: string, { rejectWithValue }) => {
    try {
      logger.info('Desabilitando MFA...');
      await mfaService.disable(credentialId);
      logger.info('MFA desabilitado com sucesso');
      return null;
    } catch (error: any) {
      logger.error('Erro ao desabilitar MFA:', error);
      return rejectWithValue('Erro ao desabilitar MFA');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },

    // Definir usuário manualmente
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitializing = false;
    },

    // Atualizar token Gotify
    setGotifyToken: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.gotifyToken = action.payload;
      }
    },

    // Finalizar inicialização
    finishInitialization: (state) => {
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    // Login com Keycloak
    builder
      .addCase(loginWithKeycloak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithKeycloak.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.lastLoginTime = Date.now();
        state.needsMfaSetup = !action.payload.mfaEnabled;
        state.error = null;
      })
      .addCase(loginWithKeycloak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.lastLoginTime = null;
        state.needsMfaSetup = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh tokens
    builder
      .addCase(refreshTokens.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.accessToken = action.payload.accessToken;
          state.user.refreshToken = action.payload.refreshToken;
          state.user.idToken = action.payload.idToken;
          state.user.accessTokenExpirationDate = action.payload.accessTokenExpirationDate;
        }
      })
      .addCase(refreshTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Forçar logout se refresh falhar
        state.user = null;
        state.isAuthenticated = false;
      });

    // Verificar estado de autenticação
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        if (action.payload) {
          state.needsMfaSetup = !action.payload.mfaEnabled;
        }
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isInitializing = false;
        state.error = action.payload as string;
      });

    // Habilitar MFA
    builder
      .addCase(enableMfa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableMfa.fulfilled, (state) => {
        state.isLoading = false;
        state.needsMfaSetup = false;
        if (state.user) {
          state.user.mfaEnabled = true;
        }
      })
      .addCase(enableMfa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Desabilitar MFA
    builder
      .addCase(disableMfa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disableMfa.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) {
          state.user.mfaEnabled = false;
        }
      })
      .addCase(disableMfa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearError, setUser, setGotifyToken, finishInitialization } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectIsInitializing = (state: { auth: AuthState }) => state.auth.isInitializing;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectNeedsMfaSetup = (state: { auth: AuthState }) => state.auth.needsMfaSetup;

export default authSlice.reducer;
