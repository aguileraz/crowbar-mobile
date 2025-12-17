/**
 * Testes de Exemplo para Keycloak Mocks
 *
 * Este arquivo demonstra como usar os mocks de Keycloak OAuth2/OIDC
 * em diferentes cenários de teste.
 *
 * @see docs/KEYCLOAK-MOCKS-GUIDE.md
 */

import {
  authorize,
  refresh,
  revoke,
  logout,
  __mockHelpers,
  _AuthConfiguration,
} from '../react-native-app-auth';

import {
  setupSuccessfulLogin,
  setupNetworkError,
  setupInvalidCredentials,
  setupTimeout,
  setupServerError,
  setupNetworkLatency,
  _setupExpiredToken,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  isMockAuthenticated,
  getMockTokens,
  getMockState,
  resetMock,
  expectValidAuthResult,
  expectValidJWT,
  decodeIDToken,
  _VALID_CREDENTIALS,
  TEST_KEYCLOAK_CONFIG,
  TEST_USERS,
} from '../keycloakTestHelpers';

describe('Keycloak Mocks - Exemplos de Uso', () => {
  // ==================== SETUP/TEARDOWN ====================

  beforeEach(() => {
    resetMock();
  });

  afterEach(() => {
    resetMock();
  });

  // ==================== TESTES DE SUCESSO ====================

  describe('Cenários de Sucesso', () => {
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

    it('deve fazer login com usuário não verificado', async () => {
      // Arrange
      setupSuccessfulLogin('unverified');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      const payload = decodeIDToken(result.idToken);
      expect(payload.email_verified).toBe(false);
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

    it('deve revogar token com sucesso', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();
      expect(isMockAuthenticated()).toBe(true);

      // Act
      await revoke(TEST_KEYCLOAK_CONFIG, {
        tokenToRevoke: tokens!.accessToken,
        sendClientId: true,
      });

      // Assert
      expect(isMockAuthenticated()).toBe(false);
      expect(getMockTokens()).toBeNull();
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

    it('deve falhar refresh com token inválido', async () => {
      // Arrange
      setupUnauthenticatedUser();
      setupInvalidCredentials();

      // Act & Assert
      await expect(
        refresh(TEST_KEYCLOAK_CONFIG, {
          refreshToken: 'invalid_token',
        })
      ).rejects.toThrow('Invalid or expired refresh token');
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

    it('deve simular latência de 1 segundo', async () => {
      // Arrange
      setupNetworkLatency(1000);
      const startTime = Date.now();

      // Act
      await authorize(TEST_KEYCLOAK_CONFIG);
      const endTime = Date.now();

      // Assert
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  // ==================== TESTES DE ESTADO ====================

  describe('Gerenciamento de Estado', () => {
    it('deve manter estado após login', async () => {
      // Arrange
      setupSuccessfulLogin('default');

      // Act
      await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      const state = getMockState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser).toBe('default');
      expect(state.tokens).not.toBeNull();
    });

    it('deve limpar estado após logout', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();

      // Act
      await logout(TEST_KEYCLOAK_CONFIG, { idToken: tokens!.idToken });

      // Assert
      const state = getMockState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.tokens).toBeNull();
    });

    it('deve resetar estado com resetMock()', () => {
      // Arrange
      setupAuthenticatedUser('admin');
      expect(isMockAuthenticated()).toBe(true);

      // Act
      resetMock();

      // Assert
      expect(isMockAuthenticated()).toBe(false);
      expect(getMockTokens()).toBeNull();
      const state = getMockState();
      expect(state.currentUser).toBe('default'); // Volta ao padrão
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

    it('deve ter expiração no futuro', async () => {
      // Arrange
      setupSuccessfulLogin('default');

      // Act
      const result = await authorize(TEST_KEYCLOAK_CONFIG);
      const payload = decodeIDToken(result.idToken);

      // Assert
      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
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

  // ==================== TESTES DE HELPERS ====================

  describe('Helper Functions', () => {
    it('deve configurar tipo de usuário corretamente', () => {
      // Act
      __mockHelpers.setUserType('admin');

      // Assert
      const state = getMockState();
      expect(state.currentUser).toBe('admin');
    });

    it('deve configurar falha de requisição', () => {
      // Act
      __mockHelpers.setNextRequestToFail('network');

      // Assert
      const state = getMockState();
      expect(state.shouldFailNextRequest).toBe(true);
      expect(state.failureType).toBe('network');
    });

    it('deve configurar delay de requisição', () => {
      // Act
      __mockHelpers.setRequestDelay(2000);

      // Assert
      const state = getMockState();
      expect(state.requestDelay).toBe(2000);
    });

    it('deve definir tokens manualmente', () => {
      // Arrange
      const customTokens = {
        accessToken: 'custom_access_token',
        refreshToken: 'custom_refresh_token',
        idToken: 'custom_id_token',
        tokenType: 'Bearer' as const,
        accessTokenExpirationDate: new Date().toISOString(),
        scopes: ['openid'],
      };

      // Act
      __mockHelpers.setTokens(customTokens);

      // Assert
      const tokens = getMockTokens();
      expect(tokens).toEqual(customTokens);
    });
  });

  // ==================== TESTES DE MOCK SPY ====================

  describe('Verificação de Chamadas', () => {
    it('deve registrar chamada de authorize', async () => {
      // Arrange
      setupSuccessfulLogin('default');

      // Act
      await authorize(TEST_KEYCLOAK_CONFIG);

      // Assert
      expect(authorize).toHaveBeenCalledTimes(1);
      expect(authorize).toHaveBeenCalledWith(TEST_KEYCLOAK_CONFIG);
    });

    it('deve registrar chamada de refresh', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();

      // Act
      await refresh(TEST_KEYCLOAK_CONFIG, {
        refreshToken: tokens!.refreshToken,
      });

      // Assert
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledWith(TEST_KEYCLOAK_CONFIG, {
        refreshToken: tokens!.refreshToken,
      });
    });

    it('deve registrar chamada de revoke', async () => {
      // Arrange
      setupAuthenticatedUser('default');
      const tokens = getMockTokens();

      // Act
      await revoke(TEST_KEYCLOAK_CONFIG, {
        tokenToRevoke: tokens!.accessToken,
        sendClientId: true,
      });

      // Assert
      expect(revoke).toHaveBeenCalledTimes(1);
    });

    it('deve limpar histórico de chamadas após reset', async () => {
      // Arrange
      setupSuccessfulLogin('default');
      await authorize(TEST_KEYCLOAK_CONFIG);
      expect(authorize).toHaveBeenCalledTimes(1);

      // Act
      resetMock();

      // Assert
      expect(authorize).not.toHaveBeenCalled();
    });
  });

  // ==================== TESTES DE MÚLTIPLOS USUÁRIOS ====================

  describe('Múltiplos Perfis de Usuário', () => {
    it('deve alternar entre usuários diferentes', async () => {
      // Test 1: Usuário padrão
      setupSuccessfulLogin('default');
      const result1 = await authorize(TEST_KEYCLOAK_CONFIG);
      const payload1 = decodeIDToken(result1.idToken);
      expect(payload1.email).toBe(TEST_USERS.default.email);

      // Reset
      resetMock();

      // Test 2: Usuário admin
      setupSuccessfulLogin('admin');
      const result2 = await authorize(TEST_KEYCLOAK_CONFIG);
      const payload2 = decodeIDToken(result2.idToken);
      expect(payload2.email).toBe(TEST_USERS.admin.email);
      expect(payload2.roles).toContain('admin');
    });

    it('deve ter roles diferentes por usuário', async () => {
      const userTypes: Array<keyof typeof TEST_USERS> = ['default', 'admin', 'unverified'];

      for (const userType of userTypes) {
        resetMock();
        setupSuccessfulLogin(userType);

        const result = await authorize(TEST_KEYCLOAK_CONFIG);
        const payload = decodeIDToken(result.idToken);

        expect(payload.email).toBe(TEST_USERS[userType].email);
        expect(payload.roles).toEqual(TEST_USERS[userType].roles);
      }
    });
  });
});
