/**
 * Mock Completo para react-native-app-auth (Keycloak OAuth2/OIDC)
 *
 * Este mock simula todos os métodos de autenticação Keycloak OAuth2/OIDC
 * para testes unitários e de integração.
 *
 * @module react-native-app-auth
 * @see https://github.com/FormidableLabs/react-native-app-auth
 */

import { jest } from '@jest/globals';

// ==================== TIPOS E INTERFACES ====================

export interface AuthConfiguration {
  issuer?: string;
  clientId: string;
  clientSecret?: string;
  redirectUrl: string;
  scopes: string[];
  additionalParameters?: { [key: string]: string };
  serviceConfiguration?: ServiceConfiguration;
  dangerouslyAllowInsecureHttpRequests?: boolean;
  customHeaders?: { [key: string]: string };
  skipCodeExchange?: boolean;
  iosCustomBrowser?: string;
  androidAllowCustomBrowsers?: string[];
  warmAndPrefetchChrome?: boolean;
}

export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  registrationEndpoint?: string;
  endSessionEndpoint?: string;
}

export interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [key: string]: string };
  idToken: string;
  refreshToken: string;
  tokenType: string;
  scopes: string[];
  authorizationCode?: string;
  codeVerifier?: string;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  additionalParameters?: { [key: string]: string };
  idToken?: string;
  refreshToken?: string;
  tokenType: string;
}

export interface RevokeConfiguration {
  tokenToRevoke: string;
  sendClientId?: boolean;
  includeBasicAuth?: boolean;
}

// ==================== MOCK DATA - JWT PAYLOADS ====================

/**
 * Gera um JWT mock realista (base64url encoded)
 */
const generateMockJWT = (payload: any): string => {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'mock-key-id-12345',
  };

  const encodeBase64Url = (obj: any) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const headerEncoded = encodeBase64Url(header);
  const payloadEncoded = encodeBase64Url(payload);
  const signature = 'mock-signature-' + Math.random().toString(36).substring(7);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
};

/**
 * Dados de usuário mock
 */
export const MOCK_USERS = {
  default: {
    sub: 'keycloak-user-123',
    email: 'usuario@exemplo.com',
    email_verified: true,
    name: 'João Silva',
    preferred_username: 'joao.silva',
    given_name: 'João',
    family_name: 'Silva',
    phone_number: '+5511987654321',
    picture: 'https://exemplo.com/avatar.jpg',
    roles: ['user'],
    realm_access: {
      roles: ['user', 'offline_access', 'uma_authorization'],
    },
    resource_access: {
      'crowbar-mobile': {
        roles: ['user'],
      },
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: 'crowbar-mobile',
    iss: 'https://keycloak.crowbar.com.br/realms/crowbar',
    typ: 'ID',
  },
  admin: {
    sub: 'keycloak-admin-456',
    email: 'admin@exemplo.com',
    email_verified: true,
    name: 'Maria Administradora',
    preferred_username: 'maria.admin',
    given_name: 'Maria',
    family_name: 'Administradora',
    phone_number: '+5511999887766',
    picture: 'https://exemplo.com/admin-avatar.jpg',
    roles: ['admin', 'user'],
    realm_access: {
      roles: ['admin', 'user', 'offline_access', 'uma_authorization'],
    },
    resource_access: {
      'crowbar-mobile': {
        roles: ['admin', 'user'],
      },
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: 'crowbar-mobile',
    iss: 'https://keycloak.crowbar.com.br/realms/crowbar',
    typ: 'ID',
  },
  unverified: {
    sub: 'keycloak-unverified-789',
    email: 'nao.verificado@exemplo.com',
    email_verified: false,
    name: 'Pedro Não Verificado',
    preferred_username: 'pedro.unverified',
    given_name: 'Pedro',
    family_name: 'Não Verificado',
    roles: ['user'],
    realm_access: {
      roles: ['user'],
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: 'crowbar-mobile',
    iss: 'https://keycloak.crowbar.com.br/realms/crowbar',
    typ: 'ID',
  },
};

/**
 * Calcula data de expiração do token
 */
const getExpirationDate = (secondsFromNow: number = 3600): string => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + secondsFromNow);
  return date.toISOString();
};

/**
 * Gera resultado de autorização mock
 */
const createMockAuthorizeResult = (userType: keyof typeof MOCK_USERS = 'default'): AuthorizeResult => {
  const user = MOCK_USERS[userType];
  const idToken = generateMockJWT(user);

  return {
    accessToken: `mock_access_token_${Math.random().toString(36).substring(7)}`,
    accessTokenExpirationDate: getExpirationDate(3600),
    idToken: idToken,
    refreshToken: `mock_refresh_token_${Math.random().toString(36).substring(7)}`,
    tokenType: 'Bearer',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    additionalParameters: {
      session_state: `mock_session_${Math.random().toString(36).substring(7)}`,
      'not-before-policy': '0',
    },
  };
};

// ==================== MOCK CONFIGURATION ====================

/**
 * Estado interno do mock para testes
 */
interface MockState {
  isAuthenticated: boolean;
  currentUser: keyof typeof MOCK_USERS;
  tokens: AuthorizeResult | null;
  shouldFailNextRequest: boolean;
  failureType: 'network' | 'invalid_credentials' | 'timeout' | 'server_error' | 'user_cancelled' | 'social_auth_failed' | null;
  requestDelay: number;
  socialProvider?: string;
}

let mockState: MockState = {
  isAuthenticated: false,
  currentUser: 'default',
  tokens: null,
  shouldFailNextRequest: false,
  failureType: null,
  requestDelay: 0,
  socialProvider: undefined,
};

// ==================== MOCK FUNCTIONS ====================

/**
 * Mock do método authorize() - OAuth2 Authorization Code Flow
 *
 * Simula o fluxo completo de autenticação OAuth2:
 * 1. Abre navegador para tela de login do Keycloak
 * 2. Usuário faz login e autoriza app
 * 3. Keycloak redireciona com authorization code
 * 4. App troca code por tokens (access, refresh, id)
 *
 * @param config - Configuração do OAuth2
 * @returns Promise com tokens de autenticação
 */
export const authorize = jest.fn(async (config: AuthConfiguration): Promise<AuthorizeResult> => {
  // Simular delay de rede se configurado
  if (mockState.requestDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, mockState.requestDelay));
  }

  // Simular falha se configurado
  if (mockState.shouldFailNextRequest) {
    mockState.shouldFailNextRequest = false;

    switch (mockState.failureType) {
      case 'network':
        throw new Error('Network request failed: Unable to connect to Keycloak server');
      case 'invalid_credentials':
        throw new Error('Authentication failed: Invalid credentials');
      case 'timeout':
        throw new Error('Request timeout: Keycloak server did not respond');
      case 'server_error':
        throw new Error('Server error: Keycloak returned 500 Internal Server Error');
      case 'user_cancelled':
        const error = new Error('User cancelled authorization');
        error.name = 'UserCancelledError';
        throw error;
      case 'social_auth_failed':
        const socialProvider = mockState.socialProvider || 'unknown';
        throw new Error(`Social authentication failed: ${socialProvider} authorization error`);
      default:
        throw new Error('Unknown error occurred during authorization');
    }
  }

  // Sucesso - gerar tokens
  const result = createMockAuthorizeResult(mockState.currentUser);
  mockState.tokens = result;
  mockState.isAuthenticated = true;

  console.log('✅ [MOCK] authorize() - Login bem-sucedido:', {
    user: mockState.currentUser,
    scopes: result.scopes,
  });

  return result;
});

/**
 * Mock do método refresh() - Renovar access token usando refresh token
 *
 * Simula a renovação de tokens expirados:
 * 1. Valida refresh token
 * 2. Emite novo access token
 * 3. Opcionalmente emite novo refresh token
 *
 * @param config - Configuração do OAuth2
 * @param refreshConfig - Objeto contendo o refresh token
 * @returns Promise com novos tokens
 */
export const refresh = jest.fn(async (
  config: AuthConfiguration,
  refreshConfig: { refreshToken: string }
): Promise<RefreshResult> => {
  // Simular delay de rede
  if (mockState.requestDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, mockState.requestDelay));
  }

  // Simular falha se configurado
  if (mockState.shouldFailNextRequest) {
    mockState.shouldFailNextRequest = false;

    switch (mockState.failureType) {
      case 'network':
        throw new Error('Network request failed: Unable to connect to Keycloak server');
      case 'invalid_credentials':
        throw new Error('Refresh failed: Invalid or expired refresh token');
      default:
        throw new Error('Unknown error occurred during token refresh');
    }
  }

  // Validar se existe refresh token
  if (!refreshConfig.refreshToken) {
    throw new Error('Refresh failed: No refresh token provided');
  }

  // Gerar novos tokens
  const result = createMockAuthorizeResult(mockState.currentUser);

  const refreshResult: RefreshResult = {
    accessToken: result.accessToken,
    accessTokenExpirationDate: result.accessTokenExpirationDate,
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    tokenType: result.tokenType,
    additionalParameters: result.additionalParameters,
  };

  mockState.tokens = result;

  console.log('✅ [MOCK] refresh() - Tokens renovados com sucesso');

  return refreshResult;
});

/**
 * Mock do método revoke() - Revogar access ou refresh token
 *
 * Simula a revogação de tokens no Keycloak:
 * 1. Valida token a ser revogado
 * 2. Marca token como inválido no servidor
 * 3. Token não pode mais ser usado
 *
 * @param config - Configuração do OAuth2
 * @param revokeConfig - Configuração de revogação
 * @returns Promise void
 */
export const revoke = jest.fn(async (
  config: AuthConfiguration,
  revokeConfig: RevokeConfiguration
): Promise<void> => {
  // Simular delay de rede
  if (mockState.requestDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, mockState.requestDelay));
  }

  // Simular falha se configurado
  if (mockState.shouldFailNextRequest) {
    mockState.shouldFailNextRequest = false;

    switch (mockState.failureType) {
      case 'network':
        throw new Error('Network request failed: Unable to connect to Keycloak server');
      default:
        throw new Error('Unknown error occurred during token revocation');
    }
  }

  // Validar se existe token para revogar
  if (!revokeConfig.tokenToRevoke) {
    throw new Error('Revoke failed: No token provided');
  }

  // Limpar estado de autenticação
  mockState.tokens = null;
  mockState.isAuthenticated = false;

  console.log('✅ [MOCK] revoke() - Token revogado com sucesso');
});

/**
 * Mock do método logout() - Logout completo (OIDC)
 *
 * Simula o logout OIDC:
 * 1. Revoga tokens
 * 2. Limpa sessão no Keycloak
 * 3. Opcionalmente redireciona para tela de logout
 *
 * @param config - Configuração do OAuth2
 * @param logoutConfig - Configuração de logout
 * @returns Promise void
 */
export const logout = jest.fn(async (
  config: AuthConfiguration,
  logoutConfig: { idToken: string; postLogoutRedirectUrl?: string }
): Promise<void> => {
  // Simular delay de rede
  if (mockState.requestDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, mockState.requestDelay));
  }

  // Simular falha se configurado
  if (mockState.shouldFailNextRequest) {
    mockState.shouldFailNextRequest = false;

    switch (mockState.failureType) {
      case 'network':
        throw new Error('Network request failed: Unable to connect to Keycloak server');
      default:
        throw new Error('Unknown error occurred during logout');
    }
  }

  // Limpar estado de autenticação
  mockState.tokens = null;
  mockState.isAuthenticated = false;

  console.log('✅ [MOCK] logout() - Logout realizado com sucesso');
});

// ==================== HELPER FUNCTIONS PARA TESTES ====================

/**
 * Funções auxiliares para configurar o comportamento do mock
 */
export const __mockHelpers = {
  /**
   * Configura o tipo de usuário para próximo login
   */
  setUserType: (userType: keyof typeof MOCK_USERS) => {
    mockState.currentUser = userType;
  },

  /**
   * Configura o próximo request para falhar
   */
  setNextRequestToFail: (
    failureType: 'network' | 'invalid_credentials' | 'timeout' | 'server_error' | 'user_cancelled' | 'social_auth_failed',
    options?: { provider?: string }
  ) => {
    mockState.shouldFailNextRequest = true;
    mockState.failureType = failureType;
    if (options?.provider) {
      mockState.socialProvider = options.provider;
    }
  },

  /**
   * Configura delay artificial de rede (em ms)
   */
  setRequestDelay: (delayMs: number) => {
    mockState.requestDelay = delayMs;
  },

  /**
   * Obtém o estado atual do mock
   */
  getState: () => ({ ...mockState }),

  /**
   * Limpa todos os mocks e reseta estado
   */
  reset: () => {
    mockState = {
      isAuthenticated: false,
      currentUser: 'default',
      tokens: null,
      shouldFailNextRequest: false,
      failureType: null,
      requestDelay: 0,
      socialProvider: undefined,
    };
    authorize.mockClear();
    refresh.mockClear();
    revoke.mockClear();
    logout.mockClear();
  },

  /**
   * Define tokens manualmente (útil para testes específicos)
   */
  setTokens: (tokens: AuthorizeResult | null) => {
    mockState.tokens = tokens;
    mockState.isAuthenticated = tokens !== null;
  },

  /**
   * Obtém tokens atuais
   */
  getTokens: () => mockState.tokens,

  /**
   * Simula expiração de token
   */
  expireAccessToken: () => {
    if (mockState.tokens) {
      // Define expiração para 1 segundo atrás
      const pastDate = new Date();
      pastDate.setSeconds(pastDate.getSeconds() - 1);
      mockState.tokens.accessTokenExpirationDate = pastDate.toISOString();
    }
  },

  /**
   * Configura mock para login com Google OAuth2
   */
  setupGoogleAuth: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_google_access_token',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'mock_google_id_token.eyJpc3MiOiJnb29nbGUifQ==.signature',
      refreshToken: 'mock_google_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura mock para login com Facebook OAuth2
   */
  setupFacebookAuth: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_facebook_access_token',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'mock_facebook_id_token.eyJpc3MiOiJmYWNlYm9vayJ9.signature',
      refreshToken: 'mock_facebook_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura mock para login com Apple OAuth2
   */
  setupAppleAuth: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_apple_access_token',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'mock_apple_id_token.eyJpc3MiOiJhcHBsZSJ9.signature',
      refreshToken: 'mock_apple_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura mock para cenário de social auth cancelado
   */
  setupSocialAuthCancelled: () => {
    __mockHelpers.reset();
    __mockHelpers.setNextRequestToFail('user_cancelled');
  },

  /**
   * Configura mock para cenário de social auth falhado
   */
  setupSocialAuthFailed: (provider: 'google' | 'facebook' | 'apple' = 'google') => {
    __mockHelpers.reset();
    __mockHelpers.setNextRequestToFail('social_auth_failed', { provider });
  },

  /**
   * Configura mock para usuário já autenticado
   */
  setupAuthenticatedUser: (userType: keyof typeof MOCK_USERS = 'default') => {
    __mockHelpers.reset();
    __mockHelpers.setUserType(userType);

    const mockTokens: AuthorizeResult = {
      accessToken: `mock_access_token_existing_${userType}`,
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: `mock_id_token_existing_${userType}`,
      refreshToken: `mock_refresh_token_existing_${userType}`,
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura token já expirado (para testar detecção)
   */
  setupExpiredAccessToken: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_expired_access_token',
      accessTokenExpirationDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      idToken: 'mock_id_token',
      refreshToken: 'mock_refresh_token_valid',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura token prestes a expirar (para testar auto-refresh)
   */
  setupAlmostExpiredToken: (secondsUntilExpiry: number = 60) => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_almost_expired_token',
      accessTokenExpirationDate: new Date(Date.now() + secondsUntilExpiry * 1000).toISOString(),
      idToken: 'mock_id_token',
      refreshToken: 'mock_refresh_token_valid',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Configura refresh token expirado
   */
  setupExpiredRefreshToken: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_access_token_expired',
      accessTokenExpirationDate: new Date(Date.now() - 3600000).toISOString(),
      idToken: 'mock_id_token',
      refreshToken: 'mock_refresh_token_expired',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
    __mockHelpers.setNextRequestToFail('invalid_credentials'); // Refresh will fail
  },

  /**
   * Configura token inválido (formato inválido)
   */
  setupInvalidToken: () => {
    __mockHelpers.reset();

    const mockTokens: AuthorizeResult = {
      accessToken: 'invalid-token-format',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'invalid',
      refreshToken: 'invalid',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Verifica se token está expirado
   */
  isTokenExpired: (token: AuthorizeResult | null): boolean => {
    if (!token) return true;
    const expirationDate = new Date(token.accessTokenExpirationDate);
    return expirationDate.getTime() <= Date.now();
  },

  /**
   * Verifica se token está prestes a expirar (dentro de N segundos)
   */
  isTokenExpiringSoon: (token: AuthorizeResult | null, thresholdSeconds: number = 300): boolean => {
    if (!token) return true;
    const expirationDate = new Date(token.accessTokenExpirationDate);
    const timeUntilExpiry = expirationDate.getTime() - Date.now();
    return timeUntilExpiry <= (thresholdSeconds * 1000);
  },

  // ==================== MFA/2FA HELPERS ====================

  /**
   * Configura usuário com MFA ativado
   */
  setupUserWithMFA: (mfaType: 'otp' | 'sms' | 'email' = 'otp') => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_access_token_mfa_required',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'mock_id_token_mfa_required',
      refreshToken: 'mock_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      additionalParameters: {
        mfa_required: 'true',
        mfa_type: mfaType,
      },
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Simula código OTP válido
   */
  generateValidOTP: (): string => {
    return '123456'; // Mock OTP code
  },

  /**
   * Simula código OTP inválido
   */
  generateInvalidOTP: (): string => {
    return '000000'; // Invalid mock OTP
  },

  /**
   * Configura backup codes para MFA
   */
  generateBackupCodes: (count: number = 10): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  },

  /**
   * Configura falha de validação MFA
   */
  setupMFAValidationFailure: (reason: 'invalid_code' | 'expired_code' | 'too_many_attempts' = 'invalid_code') => {
    __mockHelpers.reset();
    mockState.shouldFailNextRequest = true;
    mockState.failureType = 'invalid_credentials';
    mockState.socialProvider = reason; // Reuse field for MFA failure reason
  },

  /**
   * Configura MFA setup bem-sucedido
   */
  setupMFASetupSuccess: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');
    // MFA será ativado após este setup
  },

  /**
   * Configura MFA desabilitado
   */
  setupMFADisabled: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_access_token_no_mfa',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: 'mock_id_token_no_mfa',
      refreshToken: 'mock_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      additionalParameters: {
        mfa_required: 'false',
      },
    };

    __mockHelpers.setTokens(mockTokens);
  },

  // ==================== OFFLINE TOKEN HANDLING HELPERS ====================

  /**
   * Configura modo offline (sem conexão de rede)
   */
  setupOfflineMode: () => {
    mockState.shouldFailNextRequest = true;
    mockState.failureType = 'network';
  },

  /**
   * Configura modo online (com conexão de rede)
   */
  setupOnlineMode: () => {
    mockState.shouldFailNextRequest = false;
    mockState.failureType = null;
  },

  /**
   * Simula token armazenado no storage offline
   */
  setupTokenInStorage: (userType: keyof typeof MOCK_USERS = 'default') => {
    __mockHelpers.reset();
    __mockHelpers.setUserType(userType);

    const mockTokens: AuthorizeResult = {
      accessToken: `mock_stored_access_token_${userType}`,
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      idToken: `mock_stored_id_token_${userType}`,
      refreshToken: `mock_stored_refresh_token_${userType}`,
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
    mockState.isAuthenticated = true;
  },

  /**
   * Simula token expirado no storage offline
   */
  setupExpiredTokenInStorage: () => {
    __mockHelpers.reset();
    __mockHelpers.setUserType('default');

    const mockTokens: AuthorizeResult = {
      accessToken: 'mock_expired_stored_token',
      accessTokenExpirationDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      idToken: 'mock_expired_id_token',
      refreshToken: 'mock_refresh_token',
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    };

    __mockHelpers.setTokens(mockTokens);
  },

  /**
   * Limpa storage offline (simula logout offline)
   */
  clearOfflineStorage: () => {
    __mockHelpers.reset();
    __mockHelpers.setTokens(null);
    mockState.isAuthenticated = false;
  },

  /**
   * Simula restart do aplicativo (mantém tokens se persistidos)
   */
  simulateAppRestart: () => {
    // Mantém tokens se existirem (simulando Redux Persist)
    const currentTokens = mockState.tokens;
    const wasAuthenticated = mockState.isAuthenticated;

    // Reset outros estados mas mantém tokens
    mockState.shouldFailNextRequest = false;
    mockState.failureType = null;
    mockState.requestDelay = 0;

    // Restaura tokens após restart
    if (currentTokens) {
      mockState.tokens = currentTokens;
      mockState.isAuthenticated = wasAuthenticated;
    }
  },

  /**
   * Obtém tokens armazenados (simula leitura do Redux Persist)
   */
  getStoredTokens: (): AuthorizeResult | null => {
    return mockState.tokens;
  },

  /**
   * Verifica se está em modo offline
   */
  isOfflineMode: (): boolean => {
    return mockState.failureType === 'network';
  },

  /**
   * Simula sincronização automática ao reconectar
   */
  setupAutoSyncOnReconnect: () => {
    __mockHelpers.setupOnlineMode();
    // Tokens existentes serão sincronizados automaticamente
  },

  /**
   * Configura token que requer sincronização
   */
  setupTokenRequiresSync: () => {
    const tokens = mockState.tokens;
    if (tokens) {
      // Adiciona flag indicando necessidade de sync
      (tokens as any).requiresSync = true;
    }
  },

  // ==================== BACKEND TOKEN SYNC HELPERS ====================

  /**
   * Simula troca de token Keycloak por JWT backend
   */
  setupKeycloakToBackendExchange: () => {
    __mockHelpers.setupAuthenticatedUser('default');
    const keycloakTokens = mockState.tokens;

    // Adiciona flag indicando exchange pendente
    if (keycloakTokens) {
      (keycloakTokens as any).backendJWT = 'mock_backend_jwt_token';
      (keycloakTokens as any).exchanged = true;
    }
  },

  /**
   * Simula sincronização de sessão com backend
   */
  setupBackendSessionSync: () => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).backendSessionId = 'mock_backend_session_' + Date.now();
      (tokens as any).sessionSynced = true;
    }
  },

  /**
   * Simula validação de token no backend
   */
  setupBackendTokenValidation: (valid: boolean = true) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).backendValidated = valid;
      (tokens as any).validatedAt = Date.now();
    }
  },

  /**
   * Simula refresh de token backend
   */
  setupBackendTokenRefresh: () => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).backendJWT = 'mock_refreshed_backend_jwt_' + Date.now();
      (tokens as any).backendRefreshedAt = Date.now();
    }
  },

  /**
   * Simula autenticação cross-service
   */
  setupCrossServiceAuth: (services: string[] = ['api', 'websocket', 'cdn']) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).authorizedServices = services;
      (tokens as any).crossServiceAuth = true;
    }
  },

  /**
   * Simula gerenciamento de estado de sessão
   */
  setupSessionStateManagement: (sessionState: 'active' | 'idle' | 'expired' = 'active') => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).sessionState = sessionState;
      (tokens as any).lastActivity = Date.now();
    }
  },

  /**
   * Simula sincronização de revogação de token
   */
  setupTokenRevocationSync: () => {
    __mockHelpers.reset();
    mockState.tokens = null;
    mockState.isAuthenticated = false;

    // Flag indicando que revogação foi sincronizada
    (mockState as any).tokenRevoked = true;
    (mockState as any).revokedAt = Date.now();
  },

  /**
   * Simula logout em múltiplos serviços
   */
  setupMultiServiceLogout: (services: string[] = ['api', 'websocket', 'cdn']) => {
    __mockHelpers.reset();

    // Flag indicando logout de cada serviço
    (mockState as any).loggedOutServices = services;
    (mockState as any).multiServiceLogout = true;
  },

  /**
   * Simula cache de token backend
   */
  setupBackendTokenCache: (cached: boolean = true) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).cachedInBackend = cached;
      (tokens as any).cacheExpiry = Date.now() + 3600000; // 1 hour
    }
  },

  /**
   * Simula timeout de sessão
   */
  setupSessionTimeout: (timeoutMinutes: number = 30) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).sessionTimeout = timeoutMinutes * 60 * 1000; // Convert to ms
      (tokens as any).sessionExpiresAt = Date.now() + (timeoutMinutes * 60 * 1000);
    }
  },

  /**
   * Verifica se token foi trocado por JWT backend
   */
  isTokenExchanged: (): boolean => {
    const tokens = mockState.tokens;
    return tokens ? !!(tokens as any).exchanged : false;
  },

  /**
   * Verifica se sessão está sincronizada com backend
   */
  isSessionSynced: (): boolean => {
    const tokens = mockState.tokens;
    return tokens ? !!(tokens as any).sessionSynced : false;
  },

  /**
   * Obtém JWT backend do token
   */
  getBackendJWT: (): string | null => {
    const tokens = mockState.tokens;
    return tokens ? (tokens as any).backendJWT || null : null;
  },

  // ==================== MULTI-DEVICE SESSIONS HELPERS ====================

  /**
   * Simula login em múltiplos dispositivos
   */
  setupMultiDeviceLogin: (devices: string[] = ['device1', 'device2']) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).activeDevices = devices;
      (tokens as any).currentDevice = devices[devices.length - 1];
      (tokens as any).multiDeviceEnabled = true;
    }
  },

  /**
   * Simula lista de dispositivos ativos
   */
  setupActiveDevicesList: (devices: Array<{ id: string; name: string; lastActive: number }>) => {
    __mockHelpers.setupAuthenticatedUser('default');
    const tokens = mockState.tokens;

    if (tokens) {
      (tokens as any).devices = devices;
    }
  },

  /**
   * Simula invalidação de sessão antiga
   */
  setupInvalidateOldSession: (oldDeviceId: string) => {
    __mockHelpers.setupAuthenticatedUser('default');
    (mockState as any).invalidatedDevices = [oldDeviceId];
  },

  /**
   * Simula logout remoto
   */
  setupRemoteLogout: (deviceId: string) => {
    __mockHelpers.setupAuthenticatedUser('default');
    (mockState as any).remoteLogoutDevice = deviceId;
  },

  /**
   * Simula conflito de sessão
   */
  setupSessionConflict: () => {
    __mockHelpers.setupAuthenticatedUser('default');
    (mockState as any).sessionConflict = true;
    (mockState as any).conflictReason = 'Device limit exceeded';
  },

  // ==================== DEPRECATED METHODS HELPERS ====================

  /**
   * Simula método de registro Firebase (deprecated)
   */
  setupDeprecatedRegistration: () => {
    __mockHelpers.reset();
    (mockState as any).deprecatedMethodCalled = 'registration';
    (mockState as any).deprecationMessage = 'Firebase registration is deprecated. Use Keycloak Admin.';
  },

  /**
   * Simula método de reset de senha Firebase (deprecated)
   */
  setupDeprecatedPasswordReset: () => {
    __mockHelpers.reset();
    (mockState as any).deprecatedMethodCalled = 'passwordReset';
    (mockState as any).deprecationMessage = 'Password reset moved to Keycloak.';
  },

  /**
   * Simula método de verificação de email Firebase (deprecated)
   */
  setupDeprecatedEmailVerification: () => {
    __mockHelpers.reset();
    (mockState as any).deprecatedMethodCalled = 'emailVerification';
    (mockState as any).deprecationMessage = 'Email verification moved to Keycloak.';
  },

  /**
   * Simula autenticação por telefone Firebase (deprecated)
   */
  setupDeprecatedPhoneAuth: () => {
    __mockHelpers.reset();
    (mockState as any).deprecatedMethodCalled = 'phoneAuth';
    (mockState as any).deprecationMessage = 'Phone authentication is deprecated.';
  },

  /**
   * Simula autenticação anônima Firebase (deprecated)
   */
  setupDeprecatedAnonymousAuth: () => {
    __mockHelpers.reset();
    (mockState as any).deprecatedMethodCalled = 'anonymousAuth';
    (mockState as any).deprecationMessage = 'Anonymous authentication is deprecated.';
  },

  /**
   * Obtém lista de dispositivos ativos
   */
  getActiveDevices: (): string[] => {
    const tokens = mockState.tokens;
    return tokens ? (tokens as any).activeDevices || [] : [];
  },

  /**
   * Verifica se método deprecated foi chamado
   */
  wasDeprecatedMethodCalled: (): boolean => {
    return !!(mockState as any).deprecatedMethodCalled;
  },

  /**
   * Obtém mensagem de deprecation
   */
  getDeprecationMessage: (): string | null => {
    return (mockState as any).deprecationMessage || null;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  authorize,
  refresh,
  revoke,
  logout,
  __mockHelpers,
};
