/**
 * Test Helpers para Keycloak OAuth2/OIDC
 *
 * Utilitários para facilitar testes de autenticação Keycloak.
 * Use estas funções para configurar cenários de teste comuns.
 *
 * @module keycloakTestHelpers
 */

import { __mockHelpers, MOCK_USERS, AuthorizeResult } from './react-native-app-auth';

// ==================== CENÁRIOS DE TESTE PRÉ-CONFIGURADOS ====================

/**
 * Configura mock para cenário de login bem-sucedido
 *
 * @example
 * beforeEach(() => {
 *   setupSuccessfulLogin();
 * });
 */
export const setupSuccessfulLogin = (userType: keyof typeof MOCK_USERS = 'default') => {
  __mockHelpers.reset();
  __mockHelpers.setUserType(userType);
  __mockHelpers.setRequestDelay(0);
};

/**
 * Configura mock para cenário de login com falha de rede
 *
 * @example
 * it('deve lidar com erro de rede', async () => {
 *   setupNetworkError();
 *   await expect(keycloakService.login()).rejects.toThrow('Network request failed');
 * });
 */
export const setupNetworkError = () => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('network');
};

/**
 * Configura mock para cenário de credenciais inválidas
 *
 * @example
 * it('deve rejeitar credenciais inválidas', async () => {
 *   setupInvalidCredentials();
 *   await expect(keycloakService.login()).rejects.toThrow('Invalid credentials');
 * });
 */
export const setupInvalidCredentials = () => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('invalid_credentials');
};

/**
 * Configura mock para cenário de timeout
 *
 * @example
 * it('deve lidar com timeout', async () => {
 *   setupTimeout();
 *   await expect(keycloakService.login()).rejects.toThrow('timeout');
 * });
 */
export const setupTimeout = () => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('timeout');
};

/**
 * Configura mock para cenário de erro do servidor
 *
 * @example
 * it('deve lidar com erro 500', async () => {
 *   setupServerError();
 *   await expect(keycloakService.login()).rejects.toThrow('500');
 * });
 */
export const setupServerError = () => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('server_error');
};

/**
 * Configura mock para simular latência de rede
 *
 * @param delayMs - Delay em milissegundos
 *
 * @example
 * it('deve mostrar loading durante requisição', async () => {
 *   setupNetworkLatency(1000);
 *   const promise = keycloakService.login();
 *   expect(screen.getByTestId('loading')).toBeTruthy();
 *   await promise;
 * });
 */
export const setupNetworkLatency = (delayMs: number = 500) => {
  __mockHelpers.reset();
  __mockHelpers.setRequestDelay(delayMs);
};

/**
 * Configura mock para cenário de token expirado
 *
 * @example
 * it('deve renovar token expirado', async () => {
 *   setupExpiredToken();
 *   const token = await keycloakService.getAccessToken();
 *   expect(token).not.toBe(null); // Deve ter renovado automaticamente
 * });
 */
export const setupExpiredToken = () => {
  __mockHelpers.reset();
  // Primeiro, fazer login
  __mockHelpers.setUserType('default');
  // Depois, expirar o token
  __mockHelpers.expireAccessToken();
};

/**
 * Configura mock para usuário autenticado com tokens válidos
 *
 * @param userType - Tipo de usuário ('default', 'admin', 'unverified')
 *
 * @example
 * beforeEach(() => {
 *   setupAuthenticatedUser('admin');
 * });
 */
export const setupAuthenticatedUser = (userType: keyof typeof MOCK_USERS = 'default') => {
  __mockHelpers.reset();
  __mockHelpers.setUserType(userType);

  // Simular que já fez login (tokens já existem)
  const mockTokens: AuthorizeResult = {
    accessToken: `mock_access_token_existing_${userType}`,
    accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
    idToken: `mock_id_token_existing_${userType}`,
    refreshToken: `mock_refresh_token_existing_${userType}`,
    tokenType: 'Bearer',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  };

  __mockHelpers.setTokens(mockTokens);
};

/**
 * Configura mock para usuário não autenticado
 *
 * @example
 * beforeEach(() => {
 *   setupUnauthenticatedUser();
 * });
 */
export const setupUnauthenticatedUser = () => {
  __mockHelpers.reset();
  __mockHelpers.setTokens(null);
};

// ==================== SOCIAL AUTH PROVIDERS ====================

/**
 * Configura mock para login com Google OAuth2
 *
 * @example
 * it('deve fazer login com Google', async () => {
 *   setupGoogleAuth();
 *   const result = await keycloakService.loginWithGoogle();
 *   expect(result.idToken).toContain('google');
 * });
 */
export const setupGoogleAuth = () => {
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
};

/**
 * Configura mock para login com Facebook OAuth2
 *
 * @example
 * it('deve fazer login com Facebook', async () => {
 *   setupFacebookAuth();
 *   const result = await keycloakService.loginWithFacebook();
 *   expect(result.idToken).toContain('facebook');
 * });
 */
export const setupFacebookAuth = () => {
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
};

/**
 * Configura mock para login com Apple OAuth2
 *
 * @example
 * it('deve fazer login com Apple', async () => {
 *   setupAppleAuth();
 *   const result = await keycloakService.loginWithApple();
 *   expect(result.idToken).toContain('apple');
 * });
 */
export const setupAppleAuth = () => {
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
};

/**
 * Configura mock para cenário de social auth cancelado pelo usuário
 *
 * @example
 * it('deve tratar cancelamento', async () => {
 *   setupSocialAuthCancelled();
 *   await expect(keycloakService.loginWithGoogle()).rejects.toThrow('User cancelled');
 * });
 */
export const setupSocialAuthCancelled = () => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('user_cancelled');
};

/**
 * Configura mock para cenário de social auth falhado
 *
 * @param provider - Provedor social ('google', 'facebook', 'apple')
 *
 * @example
 * it('deve tratar erro do Google', async () => {
 *   setupSocialAuthFailed('google');
 *   await expect(keycloakService.loginWithGoogle()).rejects.toThrow();
 * });
 */
export const setupSocialAuthFailed = (provider: 'google' | 'facebook' | 'apple' = 'google') => {
  __mockHelpers.reset();
  __mockHelpers.setNextRequestToFail('social_auth_failed', { provider });
};

// ==================== UTILITÁRIOS DE VERIFICAÇÃO ====================

/**
 * Verifica se usuário está autenticado no mock
 *
 * @returns true se autenticado
 *
 * @example
 * it('deve estar autenticado após login', async () => {
 *   await keycloakService.login();
 *   expect(isMockAuthenticated()).toBe(true);
 * });
 */
export const isMockAuthenticated = (): boolean => {
  const state = __mockHelpers.getState();
  return state.isAuthenticated;
};

/**
 * Obtém tokens atuais do mock
 *
 * @returns Tokens ou null
 *
 * @example
 * it('deve ter tokens após login', async () => {
 *   await keycloakService.login();
 *   const tokens = getMockTokens();
 *   expect(tokens?.accessToken).toBeDefined();
 * });
 */
export const getMockTokens = (): AuthorizeResult | null => {
  return __mockHelpers.getTokens();
};

/**
 * Obtém estado completo do mock
 *
 * @returns Estado do mock
 *
 * @example
 * it('deve manter estado correto', () => {
 *   const state = getMockState();
 *   expect(state.currentUser).toBe('default');
 * });
 */
export const getMockState = () => {
  return __mockHelpers.getState();
};

/**
 * Reseta completamente o mock
 *
 * @example
 * afterEach(() => {
 *   resetMock();
 * });
 */
export const resetMock = () => {
  __mockHelpers.reset();
};

// ==================== DADOS DE TESTE REUTILIZÁVEIS ====================

/**
 * Credenciais de teste válidas
 */
export const VALID_CREDENTIALS = {
  username: 'usuario@exemplo.com',
  password: 'senha123',
};

/**
 * Credenciais de teste inválidas
 */
export const INVALID_CREDENTIALS = {
  username: 'invalido@exemplo.com',
  password: 'senhaerrada',
};

/**
 * Configuração Keycloak para testes
 */
export const TEST_KEYCLOAK_CONFIG = {
  issuer: 'https://keycloak.test.com/realms/crowbar',
  clientId: 'crowbar-mobile-test',
  redirectUrl: 'crowbar://oauth/callback',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * Usuários de teste disponíveis
 */
export const TEST_USERS = MOCK_USERS;

// ==================== ASSERTIONS CUSTOMIZADAS ====================

/**
 * Verifica se resultado de autorização é válido
 *
 * @param result - Resultado da autorização
 *
 * @example
 * it('deve retornar resultado válido', async () => {
 *   const result = await keycloakService.login();
 *   expectValidAuthResult(result);
 * });
 */
export const expectValidAuthResult = (result: AuthorizeResult) => {
  expect(result).toBeDefined();
  expect(result.accessToken).toBeDefined();
  expect(result.refreshToken).toBeDefined();
  expect(result.idToken).toBeDefined();
  expect(result.tokenType).toBe('Bearer');
  expect(result.accessTokenExpirationDate).toBeDefined();

  // Verificar que expiração está no futuro
  const expirationDate = new Date(result.accessTokenExpirationDate);
  expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
};

/**
 * Verifica se token JWT é válido (formato)
 *
 * @param token - Token JWT
 *
 * @example
 * it('deve gerar ID token válido', async () => {
 *   const result = await keycloakService.login();
 *   expectValidJWT(result.idToken);
 * });
 */
export const expectValidJWT = (token: string) => {
  expect(token).toBeDefined();

  // JWT deve ter 3 partes separadas por '.'
  const parts = token.split('.');
  expect(parts).toHaveLength(3);

  // Cada parte deve ser base64url
  parts.forEach(part => {
    expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
  });
};

/**
 * Decodifica payload de ID token (para testes)
 *
 * @param idToken - ID token JWT
 * @returns Payload decodificado
 *
 * @example
 * it('deve ter email correto no token', async () => {
 *   const result = await keycloakService.login();
 *   const payload = decodeIDToken(result.idToken);
 *   expect(payload.email).toBe('usuario@exemplo.com');
 * });
 */
export const decodeIDToken = (idToken: string): any => {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');

  return JSON.parse(jsonPayload);
};

// ==================== EXPORT ALL ====================

export default {
  // Cenários
  setupSuccessfulLogin,
  setupNetworkError,
  setupInvalidCredentials,
  setupTimeout,
  setupServerError,
  setupNetworkLatency,
  setupExpiredToken,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,

  // Social Auth
  setupGoogleAuth,
  setupFacebookAuth,
  setupAppleAuth,
  setupSocialAuthCancelled,
  setupSocialAuthFailed,

  // Verificações
  isMockAuthenticated,
  getMockTokens,
  getMockState,
  resetMock,

  // Dados de teste
  VALID_CREDENTIALS,
  INVALID_CREDENTIALS,
  TEST_KEYCLOAK_CONFIG,
  TEST_USERS,

  // Assertions
  expectValidAuthResult,
  expectValidJWT,
  decodeIDToken,
};
