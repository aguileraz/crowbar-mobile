import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { ApiError } from '../../api';
import { _auth } from '@react-native-firebase/auth';

/**
 * Testes de integração para sistema de autenticação
 * Verifica fluxos de login, registro, logout e gerenciamento de tokens
 */

// Mock do Firebase Auth
jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    currentUser: {
      uid: 'firebase-test-uid',
      email: 'test@crowbar.com',
      getIdToken: jest.fn().mockResolvedValue('firebase-token'),
    },
  })),
}));

describe('Testes de Integração - Autenticação', () => {
  let testClient: TestApiClient;
  let mockAuth: any;

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
    mockAuth = auth();
    
    // Configurar mock padrão para auth
    mockAuth.signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'firebase-test-uid',
        email: 'test@crowbar.com',
        getIdToken: jest.fn().mockResolvedValue('firebase-token'),
      },
    });
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Login de usuário', () => {
    it('deve fazer login com sucesso usando email e senha', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      const expectedResponse = testUtils.createApiResponse({
        user: testData.user,
        token: testData.authToken,
        expires_in: 3600,
      });

      testClient.mockSuccess('post', '/auth/login', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/login', credentials);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.user).toEqual(testData.user);
      expect(response.data.token).toBe(testData.authToken);
      expect(testUtils.isValidToken(response.data.token)).toBe(true);
    });

    it('deve falhar com credenciais inválidas', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'wrongpassword' };
      const errorResponse = {
        success: false,
        message: 'Credenciais inválidas',
        errors: { email: ['Credenciais inválidas'] },
      };

      testClient.mockHttpError('post', '/auth/login', 401, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 401,
        message: 'Credenciais inválidas',
      });
    });

    it('deve falhar com dados de entrada inválidos', async () => {
      // Arrange
      const credentials = { email: 'invalid-email', password: '123' };
      const errorResponse = {
        success: false,
        message: 'Dados inválidos',
        errors: {
          email: ['Email deve ser válido'],
          password: ['Senha deve ter no mínimo 6 caracteres'],
        },
      };

      testClient.mockHttpError('post', '/auth/login', 422, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          email: ['Email deve ser válido'],
          password: ['Senha deve ter no mínimo 6 caracteres'],
        },
      });
    });

    it('deve tratar erro de rede durante login', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      testClient.mockNetworkError('post', '/auth/login');

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante login', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      testClient.mockTimeout('post', '/auth/login');

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });
  });

  describe('Registro de usuário', () => {
    it('deve registrar novo usuário com sucesso', async () => {
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

      // Act
      const _response = await apiClient.post('/auth/register', userData);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe(userData.email);
      expect(response.data.user.name).toBe(userData.name);
      expect(response.data.token).toBe(testData.authToken);
    });

    it('deve falhar com email já em uso', async () => {
      // Arrange
      const userData = {
        name: 'Usuário Teste',
        email: 'existing@crowbar.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const errorResponse = {
        success: false,
        message: 'Email já está em uso',
        errors: { email: ['Email já está em uso'] },
      };

      testClient.mockHttpError('post', '/auth/register', 409, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/register', userData)).rejects.toMatchObject({
        status: 409,
        message: 'Email já está em uso',
      });
    });

    it('deve falhar com senhas não coincidentes', async () => {
      // Arrange
      const userData = {
        name: 'Usuário Teste',
        email: 'test@crowbar.com',
        password: 'password123',
        password_confirmation: 'differentpassword',
      };

      const errorResponse = {
        success: false,
        message: 'Dados inválidos',
        errors: { password_confirmation: ['Senhas não coincidem'] },
      };

      testClient.mockHttpError('post', '/auth/register', 422, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/register', userData)).rejects.toMatchObject({
        status: 422,
        errors: { password_confirmation: ['Senhas não coincidem'] },
      });
    });
  });

  describe('Logout de usuário', () => {
    it('deve fazer logout com sucesso', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        message: 'Logout realizado com sucesso',
      });

      testClient.mockSuccess('post', '/auth/logout', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/logout');

      // Assert
      expect(response.success).toBe(true);
      expect(response.message).toBe('Logout realizado com sucesso');
    });

    it('deve tratar logout com token inválido', async () => {
      // Arrange
      const errorResponse = {
        success: false,
        message: 'Token inválido',
        errors: {},
      };

      testClient.mockHttpError('post', '/auth/logout', 401, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/logout')).rejects.toMatchObject({
        status: 401,
        message: 'Token inválido',
      });
    });
  });

  describe('Gerenciamento de tokens', () => {
    it('deve renovar token com sucesso', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        token: 'new-token-123',
        expires_in: 3600,
      });

      testClient.mockSuccess('post', '/auth/refresh', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/refresh');

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.token).toBe('new-token-123');
      expect(response.data.expires_in).toBe(3600);
    });

    it('deve falhar renovação com refresh token inválido', async () => {
      // Arrange
      const errorResponse = {
        success: false,
        message: 'Refresh token inválido',
        errors: {},
      };

      testClient.mockHttpError('post', '/auth/refresh', 401, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/refresh')).rejects.toMatchObject({
        status: 401,
        message: 'Refresh token inválido',
      });
    });

    it('deve verificar validade do token', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        valid: true,
        expires_at: '2025-01-08T12:00:00Z',
      });

      testClient.mockSuccess('get', '/auth/verify-token', expectedResponse);

      // Act
      const _response = await apiClient.get('/auth/verify-token');

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.valid).toBe(true);
      expect(response.data.expires_at).toBeDefined();
    });
  });

  describe('Recuperação de senha', () => {
    it('deve enviar email de recuperação com sucesso', async () => {
      // Arrange
      const email = 'test@crowbar.com';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Email de recuperação enviado',
      });

      testClient.mockSuccess('post', '/auth/forgot-password', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/forgot-password', { email });

      // Assert
      expect(response.success).toBe(true);
      expect(response.message).toBe('Email de recuperação enviado');
    });

    it('deve falhar com email não encontrado', async () => {
      // Arrange
      const email = 'nonexistent@crowbar.com';
      const errorResponse = {
        success: false,
        message: 'Email não encontrado',
        errors: { email: ['Email não encontrado'] },
      };

      testClient.mockHttpError('post', '/auth/forgot-password', 404, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/forgot-password', { email })).rejects.toMatchObject({
        status: 404,
        message: 'Email não encontrado',
      });
    });

    it('deve resetar senha com token válido', async () => {
      // Arrange
      const resetData = {
        token: 'reset-token-123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      const expectedResponse = testUtils.createApiResponse({
        message: 'Senha alterada com sucesso',
      });

      testClient.mockSuccess('post', '/auth/reset-password', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/reset-password', resetData);

      // Assert
      expect(response.success).toBe(true);
      expect(response.message).toBe('Senha alterada com sucesso');
    });

    it('deve falhar com token de reset inválido', async () => {
      // Arrange
      const resetData = {
        token: 'invalid-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      const errorResponse = {
        success: false,
        message: 'Token inválido ou expirado',
        errors: { token: ['Token inválido ou expirado'] },
      };

      testClient.mockHttpError('post', '/auth/reset-password', 400, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/reset-password', resetData)).rejects.toMatchObject({
        status: 400,
        message: 'Token inválido ou expirado',
      });
    });
  });

  describe('Integração com Firebase', () => {
    it('deve sincronizar token do Firebase com backend', async () => {
      // Arrange
      const firebaseToken = 'firebase-token-123';
      const expectedResponse = testUtils.createApiResponse({
        user: testData.user,
        token: testData.authToken,
        expires_in: 3600,
      });

      testClient.mockSuccess('post', '/auth/firebase-sync', expectedResponse);

      // Act
      const _response = await apiClient.post('/auth/firebase-sync', { firebase_token: firebaseToken });

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.user).toEqual(testData.user);
      expect(response.data.token).toBe(testData.authToken);
    });

    it('deve falhar sincronização com token Firebase inválido', async () => {
      // Arrange
      const firebaseToken = 'invalid-firebase-token';
      const errorResponse = {
        success: false,
        message: 'Token Firebase inválido',
        errors: { firebase_token: ['Token inválido'] },
      };

      testClient.mockHttpError('post', '/auth/firebase-sync', 401, errorResponse);

      // Act & Assert
      await expect(apiClient.post('/auth/firebase-sync', { firebase_token: firebaseToken })).rejects.toMatchObject({
        status: 401,
        message: 'Token Firebase inválido',
      });
    });
  });

  describe('Cenários de erro de rede', () => {
    it('deve tratar erro de conexão durante autenticação', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      testClient.mockNetworkError('post', '/auth/login');

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante autenticação', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      testClient.mockTimeout('post', '/auth/login');

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar erro 500 do servidor', async () => {
      // Arrange
      const credentials = { email: 'test@crowbar.com', password: 'password123' };
      testClient.mockHttpError('post', '/auth/login', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(apiClient.post('/auth/login', credentials)).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });
  });

  describe('Comportamento de interceptors', () => {
    it('deve adicionar token de autenticação automaticamente', async () => {
      // Arrange
      const token = 'test-token-123';
      apiClient.setAuthToken(token);

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

      // Act
      await apiClient.get('/auth/me');

      // Assert
      expect(authHeaderValue).toBe(`Bearer ${token}`);
    });

    it('deve limpar token automaticamente em erro 401', async () => {
      // Arrange
      const token = 'expired-token-123';
      apiClient.setAuthToken(token);

      testClient.mockHttpError('get', '/auth/me', 401, {
        success: false,
        message: 'Token expirado',
        errors: {},
      });

      // Act & Assert
      await expect(apiClient.get('/auth/me')).rejects.toMatchObject({
        status: 401,
        message: 'Token expirado',
      });

      // Verificar se o token foi limpo
      expect((apiClient as any).authToken).toBeNull();
    });
  });
});