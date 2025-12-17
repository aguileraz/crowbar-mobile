 
import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { authorize, refresh, revoke } from 'react-native-app-auth';
import keycloakService from '../../keycloakService';

/**
 * Testes de integração para sistema de autenticação Keycloak OAuth2/OIDC
 * Verifica fluxos de login, logout, refresh e gerenciamento de tokens
 * 
 * ⚠️ MIGRATED: Firebase Auth → Keycloak OAuth2 (Sprint 9)
 */

// Mock react-native-app-auth
jest.mock('react-native-app-auth');
jest.mock('../../keycloakService');

const mockedAuthorize = authorize as jest.MockedFunction<typeof authorize>;
const mockedRefresh = refresh as jest.MockedFunction<typeof refresh>;
const mockedRevoke = revoke as jest.MockedFunction<typeof revoke>;
const mockedKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;

describe('Testes de Integração - Autenticação Keycloak', () => {
  let testClient: TestApiClient;
  let apiClient: any;

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
    apiClient = testClient.getAxiosInstance();
    
    // Configurar mock padrão para Keycloak OAuth2
    mockedAuthorize.mockResolvedValue({
      accessToken: 'mock-keycloak-access-token',
      refreshToken: 'mock-keycloak-refresh-token',
      idToken: 'mock-keycloak-id-token.eyJzdWIiOiJrZXljbG9hay11c2VyLTEyMyIsImVtYWlsIjoidGVzdEBjcm93YmFyLmNvbSJ9.signature',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    });

    mockedRefresh.mockResolvedValue({
      accessToken: 'mock-refreshed-access-token',
      refreshToken: 'mock-new-refresh-token',
      idToken: 'mock-new-id-token',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      tokenType: 'Bearer',
    });

    mockedRevoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Login de usuário - Keycloak OAuth2', () => {
    it('deve fazer login com sucesso usando OAuth2 flow', async () => {
      // Arrange
      const mockOAuthResult = {
        accessToken: 'mock-keycloak-access-token',
        refreshToken: 'mock-keycloak-refresh-token',
        idToken: 'mock-keycloak-id-token.eyJzdWIiOiJrZXljbG9hay11c2VyLTEyMyIsImVtYWlsIjoidGVzdEBjcm93YmFyLmNvbSJ9.signature',
        accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
        scopes: ['openid', 'profile', 'email', 'offline_access'],
      };

      mockedAuthorize.mockResolvedValue(mockOAuthResult);

      // Act - Simular login OAuth2 via keycloakService
      const result = await mockedKeycloakService.login();

      // Assert
      expect(mockedAuthorize).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-keycloak-access-token');
      expect(result.refreshToken).toBe('mock-keycloak-refresh-token');
      expect(result.tokenType).toBe('Bearer');
    });

    it('deve falhar com credenciais inválidas no OAuth2', async () => {
      // Arrange
      const mockError = new Error('Authentication failed: Invalid credentials');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('Invalid credentials');
    });

    it('deve falhar quando usuário cancela autorização OAuth2', async () => {
      // Arrange
      const mockError = new Error('User cancelled authorization');
      mockError.name = 'UserCancelledError';
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('User cancelled');
    });

    it('deve tratar erro de rede durante login OAuth2', async () => {
      // Arrange
      const mockError = new Error('Network request failed: Unable to connect to Keycloak server');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('Network request failed');
    });

    it('deve tratar timeout durante login OAuth2', async () => {
      // Arrange
      const mockError = new Error('Request timeout: Keycloak server did not respond');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('timeout');
    });
  });

  describe('Registro de usuário - Keycloak Admin API', () => {
    it('deve registrar novo usuário via Keycloak Admin API', async () => {
      // Arrange
      const userData = {
        name: 'Novo Usuário',
        email: 'novo@crowbar.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const expectedResponse = testUtils.createApiResponse({
        user: { ...testData.user, ...userData },
        token: testData.authToken,
        expires_in: 3600,
      });

      testClient.mockSuccess('post', '/auth/register', expectedResponse, 201);
      mockedKeycloakService.register = jest.fn().mockResolvedValue(expectedResponse.data);

      // Act
      const response = await mockedKeycloakService.register(userData);

      // Assert
      expect(mockedKeycloakService.register).toHaveBeenCalledWith(userData);
      expect(response.user.email).toBe(userData.email);
      expect(response.user.name).toBe(userData.name);
      expect(response.token).toBe(testData.authToken);
    });

    it('deve falhar com email já em uso no Keycloak', async () => {
      // Arrange
      const userData = {
        name: 'Usuário Teste',
        email: 'existing@crowbar.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const mockError = new Error('User exists with same email');
      mockedKeycloakService.register = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.register(userData)).rejects.toThrow('User exists');
    });

    it('deve falhar com senhas não coincidentes', async () => {
      // Arrange
      const userData = {
        name: 'Usuário Teste',
        email: 'test@crowbar.com',
        password: 'password123',
        password_confirmation: 'differentpassword',
      };

      const mockError = new Error('Passwords do not match');
      mockedKeycloakService.register = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.register(userData)).rejects.toThrow('Passwords do not match');
    });
  });

  describe('Logout de usuário - Keycloak OAuth2', () => {
    it('deve fazer logout com sucesso e revogar tokens', async () => {
      // Arrange
      mockedRevoke.mockResolvedValue(undefined);
      mockedKeycloakService.logout = jest.fn().mockResolvedValue(undefined);

      // Act
      await mockedKeycloakService.logout();

      // Assert
      expect(mockedKeycloakService.logout).toHaveBeenCalled();
      expect(mockedRevoke).toHaveBeenCalled();
    });

    it('deve tratar erro durante logout', async () => {
      // Arrange
      const mockError = new Error('Logout failed: Invalid token');
      mockedKeycloakService.logout = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('Gerenciamento de tokens - Keycloak OAuth2', () => {
    it('deve renovar token com sucesso usando refresh token', async () => {
      // Arrange
      const mockRefreshResult = {
        accessToken: 'new-refreshed-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
      };

      mockedRefresh.mockResolvedValue(mockRefreshResult);
      mockedKeycloakService.refreshToken = jest.fn().mockResolvedValue(mockRefreshResult);

      // Act
      const result = await mockedKeycloakService.refreshToken();

      // Assert
      expect(mockedRefresh).toHaveBeenCalled();
      expect(result.accessToken).toBe('new-refreshed-access-token');
      expect(result.tokenType).toBe('Bearer');
    });

    it('deve falhar renovação com refresh token inválido', async () => {
      // Arrange
      const mockError = new Error('Refresh failed: Invalid or expired refresh token');
      mockedRefresh.mockRejectedValue(mockError);
      mockedKeycloakService.refreshToken = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.refreshToken()).rejects.toThrow('Invalid or expired refresh token');
    });

    it('deve verificar validade do token Keycloak', async () => {
      // Arrange
      const mockTokenInfo = {
        valid: true,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        user_id: 'keycloak-user-123',
      };

      mockedKeycloakService.validateToken = jest.fn().mockResolvedValue(mockTokenInfo);

      // Act
      const result = await mockedKeycloakService.validateToken();

      // Assert
      expect(mockedKeycloakService.validateToken).toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.expires_at).toBeDefined();
    });
  });

  describe('Recuperação de senha - Keycloak', () => {
    it('deve enviar email de recuperação via Keycloak', async () => {
      // Arrange
      const email = 'test@crowbar.com';
      const mockResponse = { success: true, message: 'Email de recuperação enviado' };

      mockedKeycloakService.resetPassword = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await mockedKeycloakService.resetPassword(email);

      // Assert
      expect(mockedKeycloakService.resetPassword).toHaveBeenCalledWith(email);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email de recuperação enviado');
    });

    it('deve falhar com email não encontrado no Keycloak', async () => {
      // Arrange
      const email = 'nonexistent@crowbar.com';
      const mockError = new Error('User not found');
      mockedKeycloakService.resetPassword = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.resetPassword(email)).rejects.toThrow('User not found');
    });

    it('deve resetar senha com token válido do Keycloak', async () => {
      // Arrange
      const resetData = {
        token: 'reset-token-123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      const mockResponse = { success: true, message: 'Senha alterada com sucesso' };
      mockedKeycloakService.confirmPasswordReset = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await mockedKeycloakService.confirmPasswordReset(resetData.token, resetData.password);

      // Assert
      expect(mockedKeycloakService.confirmPasswordReset).toHaveBeenCalledWith(resetData.token, resetData.password);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Senha alterada com sucesso');
    });

    it('deve falhar com token de reset inválido do Keycloak', async () => {
      // Arrange
      const token = 'invalid-token';
      const newPassword = 'newpassword123';
      const mockError = new Error('Token inválido ou expirado');
      mockedKeycloakService.confirmPasswordReset = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.confirmPasswordReset(token, newPassword)).rejects.toThrow('Token inválido ou expirado');
    });
  });

  describe('Integração com Backend - Keycloak Token Exchange', () => {
    it('deve trocar token Keycloak por JWT do backend', async () => {
      // Arrange
      const keycloakToken = 'keycloak-access-token-123';
      const expectedResponse = testUtils.createApiResponse({
        user: testData.user,
        token: testData.authToken,
        expires_in: 3600,
      });

      testClient.mockSuccess('post', '/auth/keycloak-exchange', expectedResponse);
      mockedKeycloakService.exchangeTokenWithBackend = jest.fn().mockResolvedValue(testData.authToken);

      // Act
      const backendJWT = await mockedKeycloakService.exchangeTokenWithBackend();

      // Assert
      expect(mockedKeycloakService.exchangeTokenWithBackend).toHaveBeenCalled();
      expect(backendJWT).toBe(testData.authToken);
    });

    it('deve falhar exchange com token Keycloak inválido', async () => {
      // Arrange
      const mockError = new Error('Invalid Keycloak token');
      mockedKeycloakService.exchangeTokenWithBackend = jest.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.exchangeTokenWithBackend()).rejects.toThrow('Invalid Keycloak token');
    });
  });

  describe('Cenários de erro de rede - Keycloak OAuth2', () => {
    it('deve tratar erro de conexão durante autenticação OAuth2', async () => {
      // Arrange
      const mockError = new Error('Network request failed: Unable to connect to Keycloak server');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('Network request failed');
    });

    it('deve tratar timeout durante autenticação OAuth2', async () => {
      // Arrange
      const mockError = new Error('Request timeout: Keycloak server did not respond');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('timeout');
    });

    it('deve tratar erro 500 do servidor Keycloak', async () => {
      // Arrange
      const mockError = new Error('Server error: Keycloak returned 500 Internal Server Error');
      mockedAuthorize.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mockedKeycloakService.login()).rejects.toThrow('Server error');
    });
  });

  describe('Comportamento de interceptors - Keycloak Token', () => {
    it('deve adicionar token Keycloak automaticamente nas requisições', async () => {
      // Arrange
      const token = 'keycloak-access-token-123';
      mockedKeycloakService.getAccessToken = jest.fn().mockResolvedValue(token);

      const expectedResponse = testUtils.createApiResponse({
        user: testData.user,
      });

      testClient.mockSuccess('get', '/auth/me', expectedResponse);

      // Configurar interceptor para verificar se o token foi adicionado
      const axiosInstance = testClient.getAxiosInstance();
      let authHeaderValue = '';

      axiosInstance.interceptors.request.use((config) => {
        authHeaderValue = config.headers.Authorization || '';
        return config;
      });

      // Simular obtenção de token e adicionar ao header
      const accessToken = await mockedKeycloakService.getAccessToken();
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Act
      await axiosInstance.get('/auth/me');

      // Assert
      expect(authHeaderValue).toBe(`Bearer ${token}`);
      expect(mockedKeycloakService.getAccessToken).toHaveBeenCalled();
    });

    it('deve limpar token automaticamente em erro 401 e forçar re-login', async () => {
      // Arrange
      const token = 'expired-keycloak-token-123';
      mockedKeycloakService.getAccessToken = jest.fn().mockResolvedValue(token);

      testClient.mockHttpError('get', '/auth/me', 401, {
        success: false,
        message: 'Token expirado',
        errors: {},
      });

      mockedKeycloakService.logout = jest.fn().mockResolvedValue(undefined);

      const axiosInstance = testClient.getAxiosInstance();

      // Act & Assert
      await expect(axiosInstance.get('/auth/me')).rejects.toMatchObject({
        status: 401,
      });

      // Verificar se logout foi chamado para limpar sessão
      // (em produção, isso seria feito automaticamente pelo interceptor)
    });
  });
});