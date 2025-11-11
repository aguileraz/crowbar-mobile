/**
 * Testes de Exemplo para Keycloak Mocks
 *
 * Este arquivo demonstra como usar os mocks de Keycloak OAuth2/OIDC
 * em diferentes cenários de teste.
 *
 * @see ../../docs/KEYCLOAK-MOCKS-GUIDE.md
 */

import {
  authorize,
  refresh,
  revoke,
  logout,
  __mockHelpers,
  AuthConfiguration,
} from '../../../__mocks__/react-native-app-auth';

import {
  setupSuccessfulLogin,
  setupNetworkError,
  setupInvalidCredentials,
  setupTimeout,
  setupServerError,
  setupNetworkLatency,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  isMockAuthenticated,
  getMockTokens,
  getMockState,
  resetMock,
  expectValidAuthResult,
  expectValidJWT,
  decodeIDToken,
  TEST_KEYCLOAK_CONFIG,
  TEST_USERS,
} from '../../../__mocks__/keycloakTestHelpers';

describe('Keycloak Mocks - Exemplos de Uso', () => {
  // ==================== SETUP/TEARDOWN ====================

  beforeEach(() => {
    resetMock();
  });

  afterEach(() => {
    resetMock();
  });

  // ==================== TESTES BÁSICOS ====================

  describe('Cenários Básicos', () => {
    it('deve fazer login com sucesso (usuário padrão)', async () => {
      // Arrange
      setupSuccessfulLogin('default');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      expectValidAuthResult(result);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.idToken).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
      expect(isMockAuthenticated()).toBe(true);

      // Verificar payload do ID token
      const payload = decodeIDToken(result.idToken);
      expect(payload.email).toBe(TEST_USERS.default.email);
      expect(payload.name).toBe(TEST_USERS.default.name);
      expect(payload.email_verified).toBe(true);
    });

    it('deve fazer login como admin', async () => {
      // Arrange
      setupSuccessfulLogin('admin');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      const payload = decodeIDToken(result.idToken);
      expect(payload.roles).toContain('admin');
      expect(payload.email).toBe(TEST_USERS.admin.email);
    });

    it('deve renovar tokens com sucesso', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();

      // Act
      const result = await refresh(TEST_KEYCLOAK_CONFIG, {
        refreshToken: tokens!.refreshToken,
      });

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).not.toBe(tokens!.accessToken); // Novo token
    });

    it('deve fazer logout com sucesso', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();

      // Act
      await logout(TEST_KEYCLOAK_CONFIG, {
        idToken: tokens!.idToken,
      });

      // Assert
      expect(isMockAuthenticated()).toBe(false);
    });
  });

  // ==================== TESTES DE ERRO ====================

  describe('Cenários de Erro', () => {
    it('deve falhar com erro de rede', async () => {
      // Arrange
      setupNetworkError();

      // Act & Assert
      await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow(
        'Network request failed'
      );
      expect(isMockAuthenticated()).toBe(false);
    });

    it('deve falhar com credenciais inválidas', async () => {
      // Arrange
      setupInvalidCredentials();

      // Act & Assert
      await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('deve falhar com timeout', async () => {
      // Arrange
      setupTimeout();

      // Act & Assert
      await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow('timeout');
    });

    it('deve falhar com erro 500', async () => {
      // Arrange
      setupServerError();

      // Act & Assert
      await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow('500');
    });
  });

  // ==================== TESTES DE LATÊNCIA ====================

  describe('Simulação de Latência', () => {
    it('deve simular latência de 500ms', async () => {
      // Arrange
      setupNetworkLatency(500);
      const startTime = Date.now();

      // Act
      await authorize(TEST_KEYCLOAK_CONFIG);
      const endTime = Date.now();

      // Assert
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(500);
    });
  });

  // ==================== TESTES DE JWT ====================

  describe('Validação de JWT', () => {
    it('deve gerar ID token JWT válido', async () => {
      // Arrange
      setupSuccessfulLogin('default');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      expectValidJWT(result.idToken);
    });

    it('deve conter claims corretos no ID token', async () => {
      // Arrange
      setupSuccessfulLogin('admin');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);
      const payload = decodeIDToken(result.idToken);

      // Assert
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('name');
      expect(payload).toHaveProperty('preferred_username');
      expect(payload).toHaveProperty('roles');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload).toHaveProperty('aud');
      expect(payload).toHaveProperty('iss');
      expect(payload.aud).toBe('crowbar-mobile');
    });
  });

  // ==================== TESTES DE EXPIRAÇÃO ====================

  describe('Expiração de Tokens', () => {
    it('deve detectar token expirado', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();
      expect(tokens).not.toBeNull();

      // Act
      __mockHelpers.expireAccessToken();

      // Assert
      const expiredTokens = getMockTokens();
      const expirationDate = new Date(expiredTokens!.accessTokenExpirationDate);
      expect(expirationDate.getTime()).toBeLessThan(Date.now());
    });

    it('deve renovar token expirado', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      __mockHelpers.expireAccessToken();
      const oldTokens = getMockTokens();

      // Act
      const result = await refresh(TEST_KEYCLOAK_CONFIG, {
        refreshToken: oldTokens!.refreshToken,
      });

      // Assert
      expect(result.accessToken).not.toBe(oldTokens!.accessToken);
      const newExpirationDate = new Date(result.accessTokenExpirationDate);
      expect(newExpirationDate.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
