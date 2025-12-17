/**
 * Testes para KeycloakAuthService
 *
 * Cobertura completa do serviço de autenticação OAuth2/OIDC
 * Total: 35 testes organizados em 7 categorias
 *
 * Categorias:
 * 1. Fluxo de Autorização OAuth2 (6 testes)
 * 2. Obtenção de Token de Acesso (8 testes)
 * 3. Renovação de Tokens (7 testes)
 * 4. Logout e Revogação (5 testes)
 * 5. Status de Autenticação (3 testes)
 * 6. Extração de Informações do Usuário (5 testes)
 * 7. Integração com Keychain (4 testes)
 */

import { authorize, refresh, revoke } from 'react-native-app-auth';
import * as Keychain from 'react-native-keychain';
import KeycloakAuthService from '../keycloakService';

// Mocks
jest.mock('react-native-app-auth');
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

// Type mocked modules
const mockedAuthorize = authorize as jest.MockedFunction<typeof authorize>;
const mockedRefresh = refresh as jest.MockedFunction<typeof refresh>;
const mockedRevoke = revoke as jest.MockedFunction<typeof revoke>;
const mockedKeychain = {
  setGenericPassword: Keychain.setGenericPassword as jest.MockedFunction<typeof Keychain.setGenericPassword>,
  getGenericPassword: Keychain.getGenericPassword as jest.MockedFunction<typeof Keychain.getGenericPassword>,
  resetGenericPassword: Keychain.resetGenericPassword as jest.MockedFunction<typeof Keychain.resetGenericPassword>,
};

// Silenciar console durante os testes
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('KeycloakAuthService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // MOCK DATA FACTORIES
  // ============================================

  /**
   * Factory para criar resposta de token completa
   */
  const createMockTokenResponse = (overrides?: any) => ({
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature',
    refreshToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.refresh_sig',
    idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0ZXN0dXNlciJ9.id_sig',
    accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(), // 1 hora
    tokenType: 'Bearer',
    scopes: ['openid', 'profile', 'email'],
    ...overrides,
  });

  /**
   * Factory para criar tokens expirados
   */
  const createExpiredTokenResponse = () => createMockTokenResponse({
    accessTokenExpirationDate: new Date(Date.now() - 1000).toISOString(), // Expirado há 1 segundo
  });

  /**
   * Factory para criar tokens prestes a expirar (< 1 minuto)
   */
  const createExpiringTokenResponse = () => createMockTokenResponse({
    accessTokenExpirationDate: new Date(Date.now() + 30000).toISOString(), // 30 segundos
  });

  /**
   * Factory para criar credenciais do Keychain
   */
  const createKeychainCredentials = (tokens: any) => ({
    username: 'keycloak',
    password: JSON.stringify(tokens),
    service: 'keycloak_tokens',
  });

  // ============================================
  // 1. FLUXO DE AUTORIZAÇÃO OAUTH2
  // ============================================

  describe('Fluxo de Autorização OAuth2', () => {
    it('deve realizar login com sucesso e retornar resposta completa de token', async () => {
      // Arrange
      const mockResponse = createMockTokenResponse();
      mockedAuthorize.mockResolvedValue(mockResponse);
      mockedKeychain.setGenericPassword.mockResolvedValue(true as any);

      // Act
      const result = await KeycloakAuthService.login();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockedAuthorize).toHaveBeenCalledTimes(1);
      expect(mockedAuthorize).toHaveBeenCalledWith(expect.objectContaining({
        issuer: expect.any(String),
        clientId: 'crowbar-mobile',
        redirectUrl: 'crowbar://oauth/callback',
        scopes: ['openid', 'profile', 'email'],
      }));
    });

    it('deve salvar tokens no Keychain após login bem-sucedido', async () => {
      // Arrange
      const mockResponse = createMockTokenResponse();
      mockedAuthorize.mockResolvedValue(mockResponse);
      mockedKeychain.setGenericPassword.mockResolvedValue(true as any);

      // Act
      await KeycloakAuthService.login();

      // Assert
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        'keycloak',
        JSON.stringify({
          accessToken: mockResponse.accessToken,
          refreshToken: mockResponse.refreshToken,
          idToken: mockResponse.idToken,
          accessTokenExpirationDate: mockResponse.accessTokenExpirationDate,
        }),
        { service: 'keycloak_tokens' }
      );
    });

    it('deve lançar erro quando login falhar por erro de rede', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      mockedAuthorize.mockRejectedValue(networkError);

      // Act & Assert
      await expect(KeycloakAuthService.login()).rejects.toThrow('Network request failed');
      expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando login falhar por configuração inválida', async () => {
      // Arrange
      const configError = new Error('Invalid issuer configuration');
      mockedAuthorize.mockRejectedValue(configError);

      // Act & Assert
      await expect(KeycloakAuthService.login()).rejects.toThrow('Invalid issuer configuration');
    });

    it('deve usar configuração correta de scopes e redirect URL', async () => {
      // Arrange
      const mockResponse = createMockTokenResponse();
      mockedAuthorize.mockResolvedValue(mockResponse);
      mockedKeychain.setGenericPassword.mockResolvedValue(true as any);

      // Act
      await KeycloakAuthService.login();

      // Assert
      const authConfig = mockedAuthorize.mock.calls[0][0];
      expect(authConfig.scopes).toEqual(['openid', 'profile', 'email']);
      expect(authConfig.redirectUrl).toBe('crowbar://oauth/callback');
      expect(authConfig.clientId).toBe('crowbar-mobile');
    });

    it('deve registrar log de sucesso após login bem-sucedido', async () => {
      // Arrange
      const mockResponse = createMockTokenResponse();
      mockedAuthorize.mockResolvedValue(mockResponse);
      mockedKeychain.setGenericPassword.mockResolvedValue(true as any);

      // Act
      await KeycloakAuthService.login();

      // Assert
      expect(console.log).toHaveBeenCalledWith('🔐 Iniciando login Keycloak...');
      expect(console.log).toHaveBeenCalledWith('✅ Login Keycloak bem-sucedido');
    });
  });

  // ============================================
  // 2. OBTENÇÃO DE TOKEN DE ACESSO
  // ============================================

  describe('Obtenção de Token de Acesso', () => {
    it('deve retornar token de acesso válido quando não expirado', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();
      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBe(mockTokens.accessToken);
      expect(mockedRefresh).not.toHaveBeenCalled();
    });

    it('deve renovar token automaticamente quando expirado', async () => {
      // Arrange
      const expiredTokens = createExpiredTokenResponse();
      const newTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens))
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens));

      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBe(newTokens.accessToken);
      expect(mockedRefresh).toHaveBeenCalledTimes(1);
    });

    it('deve renovar token quando estiver prestes a expirar (< 1 minuto)', async () => {
      // Arrange
      const expiringTokens = createExpiringTokenResponse();
      const newTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce(createKeychainCredentials(expiringTokens))
        .mockResolvedValueOnce(createKeychainCredentials(expiringTokens));

      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBe(newTokens.accessToken);
      expect(mockedRefresh).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('🔄 Access token expirado, renovando...');
    });

    it('deve retornar null quando não houver tokens salvos', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBeNull();
      expect(mockedRefresh).not.toHaveBeenCalled();
    });

    it('deve retornar null quando renovação de token falhar', async () => {
      // Arrange
      const expiredTokens = createExpiredTokenResponse();

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens))
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens));

      mockedRefresh.mockRejectedValue(new Error('Refresh failed'));
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBeNull();
    });

    it('deve retornar null e registrar erro quando Keychain falhar', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockRejectedValue(
        new Error('Keychain error')
      );

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '❌ Erro ao obter tokens:',
        expect.any(Error)
      );
    });

    it('deve verificar expiração com threshold de 1 minuto', async () => {
      // Arrange
      const almostExpiredTokens = createMockTokenResponse({
        accessTokenExpirationDate: new Date(Date.now() + 59000).toISOString(), // 59 segundos
      });
      const newTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce(createKeychainCredentials(almostExpiredTokens))
        .mockResolvedValueOnce(createKeychainCredentials(almostExpiredTokens));

      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(mockedRefresh).toHaveBeenCalledTimes(1);
      expect(token).toBe(newTokens.accessToken);
    });

    it('deve usar token existente quando expiração for maior que 1 minuto', async () => {
      // Arrange
      const validTokens = createMockTokenResponse({
        accessTokenExpirationDate: new Date(Date.now() + 61000).toISOString(), // 61 segundos
      });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(validTokens)
      );

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(mockedRefresh).not.toHaveBeenCalled();
      expect(token).toBe(validTokens.accessToken);
    });
  });

  // ============================================
  // 3. RENOVAÇÃO DE TOKENS
  // ============================================

  describe('Renovação de Tokens', () => {
    it('deve renovar tokens com sucesso usando refresh token', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();
      const newTokens = createMockTokenResponse({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        idToken: 'new_id_token',
      });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await KeycloakAuthService.refreshTokens();

      // Assert
      expect(result).toEqual({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        idToken: newTokens.idToken,
        accessTokenExpirationDate: newTokens.accessTokenExpirationDate,
      });
      expect(mockedRefresh).toHaveBeenCalledWith(
        expect.any(Object),
        { refreshToken: oldTokens.refreshToken }
      );
    });

    it('deve salvar novos tokens no Keychain após renovação', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();
      const newTokens = createMockTokenResponse({
        accessToken: 'new_access_token',
      });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.refreshTokens();

      // Assert
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        'keycloak',
        expect.stringContaining('new_access_token'),
        { service: 'keycloak_tokens' }
      );
    });

    it('deve preservar refresh token antigo se não retornado na renovação', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();
      const newTokens = createMockTokenResponse({
        accessToken: 'new_access_token',
        refreshToken: undefined, // Servidor não retornou novo refresh token
      });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await KeycloakAuthService.refreshTokens();

      // Assert
      expect(result?.refreshToken).toBe(oldTokens.refreshToken);
    });

    it('deve preservar ID token antigo se não retornado na renovação', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();
      const newTokens = createMockTokenResponse({
        accessToken: 'new_access_token',
        idToken: undefined, // Servidor não retornou novo ID token
      });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await KeycloakAuthService.refreshTokens();

      // Assert
      expect(result?.idToken).toBe(oldTokens.idToken);
    });

    it('deve retornar null quando não houver refresh token disponível', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const result = await KeycloakAuthService.refreshTokens();

      // Assert
      expect(result).toBeNull();
      expect(mockedRefresh).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('⚠️  Nenhum refresh token disponível');
    });

    it('deve limpar tokens e retornar null quando renovação falhar (segurança)', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockRejectedValue(new Error('Invalid refresh token'));
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      const result = await KeycloakAuthService.refreshTokens();

      // Assert
      expect(result).toBeNull();
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'keycloak_tokens',
      });
      expect(console.error).toHaveBeenCalledWith(
        '❌ Erro ao renovar tokens:',
        expect.any(Error)
      );
    });

    it('deve registrar log de sucesso após renovação bem-sucedida', async () => {
      // Arrange
      const oldTokens = createMockTokenResponse();
      const newTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(oldTokens)
      );
      mockedRefresh.mockResolvedValue(newTokens);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.refreshTokens();

      // Assert
      expect(console.log).toHaveBeenCalledWith('✅ Tokens renovados com sucesso');
    });
  });

  // ============================================
  // 4. LOGOUT E REVOGAÇÃO
  // ============================================

  describe('Logout e Revogação', () => {
    it('deve revogar token e limpar Keychain durante logout', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );
      mockedRevoke.mockResolvedValue(undefined);
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.logout();

      // Assert
      expect(mockedRevoke).toHaveBeenCalledWith(
        expect.any(Object),
        {
          tokenToRevoke: mockTokens.accessToken,
          sendClientId: true,
        }
      );
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'keycloak_tokens',
      });
      expect(console.log).toHaveBeenCalledWith('✅ Logout realizado');
    });

    it('deve limpar Keychain mesmo quando não houver tokens', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.logout();

      // Assert
      expect(mockedRevoke).not.toHaveBeenCalled();
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'keycloak_tokens',
      });
    });

    it('deve continuar logout mesmo quando revogação falhar', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );
      mockedRevoke.mockRejectedValue(new Error('Revocation failed'));
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.logout();

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️  Erro ao revogar token:',
        expect.any(Error)
      );
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'keycloak_tokens',
      });
    });

    it('deve lançar erro quando falhar ao limpar Keychain', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );
      mockedRevoke.mockResolvedValue(undefined);
      mockedKeychain.resetGenericPassword.mockRejectedValue(
        new Error('Keychain error')
      );

      // Act & Assert
      await expect(KeycloakAuthService.logout()).rejects.toThrow('Keychain error');
    });

    it('deve usar configuração correta ao revogar token', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );
      mockedRevoke.mockResolvedValue(undefined);
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      await KeycloakAuthService.logout();

      // Assert
      const revokeConfig = mockedRevoke.mock.calls[0][1];
      expect(revokeConfig.sendClientId).toBe(true);
      expect(revokeConfig.tokenToRevoke).toBe(mockTokens.accessToken);
    });
  });

  // ============================================
  // 5. STATUS DE AUTENTICAÇÃO
  // ============================================

  describe('Status de Autenticação', () => {
    it('deve retornar true quando usuário estiver autenticado com token válido', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const isAuth = await KeycloakAuthService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(true);
    });

    it('deve retornar false quando não houver tokens salvos', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const isAuth = await KeycloakAuthService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });

    it('deve retornar false quando token estiver expirado e renovação falhar', async () => {
      // Arrange
      const expiredTokens = createExpiredTokenResponse();

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens))
        .mockResolvedValueOnce(createKeychainCredentials(expiredTokens));

      mockedRefresh.mockRejectedValue(new Error('Refresh failed'));
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      const isAuth = await KeycloakAuthService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });
  });

  // ============================================
  // 6. EXTRAÇÃO DE INFORMAÇÕES DO USUÁRIO
  // ============================================

  describe('Extração de Informações do Usuário', () => {
    it('deve decodificar ID token e retornar informações do usuário', async () => {
      // Arrange
      const userInfo = {
        sub: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
      };

      // Criar ID token válido (base64) - usar Buffer no Node.js
      const idToken = `header.${Buffer.from(JSON.stringify(userInfo)).toString('base64')}.signature`;
      const mockTokens = createMockTokenResponse({ idToken });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const result = await KeycloakAuthService.getUserInfo();

      // Assert
      expect(result).toMatchObject(userInfo);
    });

    it('deve extrair corretamente claims do usuário (sub, email, name)', async () => {
      // Arrange
      const userClaims = {
        sub: 'abc-def-ghi',
        email: 'test@crowbar.com',
        name: 'João Silva',
        email_verified: true,
        preferred_username: 'joao.silva',
      };

      const idToken = `header.${Buffer.from(JSON.stringify(userClaims)).toString('base64')}.signature`;
      const mockTokens = createMockTokenResponse({ idToken });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const result = await KeycloakAuthService.getUserInfo();

      // Assert
      expect(result.sub).toBe('abc-def-ghi');
      expect(result.email).toBe('test@crowbar.com');
      expect(result.name).toBe('João Silva');
      expect(result.preferred_username).toBe('joao.silva');
    });

    it('deve retornar null quando não houver ID token', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const result = await KeycloakAuthService.getUserInfo();

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar null e registrar erro quando JWT estiver malformado', async () => {
      // Arrange
      const malformedToken = 'not.a.valid.jwt';
      const mockTokens = createMockTokenResponse({ idToken: malformedToken });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const result = await KeycloakAuthService.getUserInfo();

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '❌ Erro ao obter informações do usuário:',
        expect.anything()
      );
    });

    it('deve tratar erro de decodificação graciosamente', async () => {
      // Arrange
      const invalidBase64Token = `header.${Buffer.from('invalid json').toString('base64')}.signature`;
      const mockTokens = createMockTokenResponse({ idToken: invalidBase64Token });

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const result = await KeycloakAuthService.getUserInfo();

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ============================================
  // 7. INTEGRAÇÃO COM KEYCHAIN
  // ============================================

  describe('Integração com Keychain', () => {
    it('deve salvar tokens no Keychain com nome de serviço correto', async () => {
      // Arrange
      const mockResponse = createMockTokenResponse();
      mockedAuthorize.mockResolvedValue(mockResponse);
      mockedKeychain.setGenericPassword.mockResolvedValue(true as any);

      // Act
      await KeycloakAuthService.login();

      // Assert
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        'keycloak',
        expect.any(String),
        { service: 'keycloak_tokens' }
      );
    });

    it('deve recuperar tokens do Keychain com sucesso', async () => {
      // Arrange
      const mockTokens = createMockTokenResponse();

      mockedKeychain.getGenericPassword.mockResolvedValue(
        createKeychainCredentials(mockTokens)
      );

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBe(mockTokens.accessToken);
      expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
        service: 'keycloak_tokens',
      });
    });

    it('deve retornar null quando não houver credenciais no Keychain', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBeNull();
    });

    it('deve tratar erro do Keychain graciosamente', async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockRejectedValue(
        new Error('Keychain access denied')
      );

      // Act
      const token = await KeycloakAuthService.getAccessToken();

      // Assert
      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '❌ Erro ao obter tokens:',
        expect.any(Error)
      );
    });
  });
});
