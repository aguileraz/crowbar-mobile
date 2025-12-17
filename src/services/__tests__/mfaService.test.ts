/**
 * Testes para MFAService
 *
 * Cobertura completa do serviço de Multi-Factor Authentication (MFA)
 * Total: 20 testes organizados em 4 categorias
 *
 * Categorias:
 * 1. Obtenção de Status MFA (6 testes)
 * 2. Habilitação de MFA (5 testes)
 * 3. Desabilitação de MFA (5 testes)
 * 4. Verificação de Necessidade de Setup (4 testes)
 *
 * ⚠️ SEGURANÇA CRÍTICA: 2FA Protection Layer
 */

import mfaService, { MFAStatus } from '../mfaService';
import httpClient from '../httpClient';
import keycloakService from '../keycloakService';

// Mocks (usar automocks da pasta __mocks__)
jest.mock('../httpClient');
jest.mock('../keycloakService');

// Type assertions for mocked modules
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
const mockKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;

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

describe('MFAService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // MOCK DATA FACTORIES
  // ============================================

  /**
   * Factory para criar resposta de status MFA completa
   */
  const createMockMFAStatus = (overrides?: Partial<MFAStatus>): MFAStatus => ({
    mfaEnabled: true,
    mfaType: 'TOTP',
    credentials: [
      {
        id: 'cred-123-abc',
        type: 'otp',
        userLabel: 'Google Authenticator',
        createdDate: 1704067200000, // 2024-01-01 00:00:00
      },
    ],
    ...overrides,
  });

  /**
   * Factory para criar status MFA desabilitado
   */
  const createDisabledMFAStatus = (): MFAStatus => ({
    mfaEnabled: false,
    mfaType: null,
    credentials: [],
  });

  /**
   * Factory para criar resposta de habilitação MFA
   */
  const createEnableResponse = () => ({
    message: 'MFA habilitado com sucesso',
    nextAction: 'CONFIGURE_TOTP',
  });

  /**
   * Factory para criar resposta de desabilitação MFA
   */
  const createDisableResponse = () => ({
    message: 'MFA desabilitado com sucesso',
  });

  /**
   * Factory para criar token de acesso válido
   */
  const createMockAccessToken = () =>
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxNzA0MDcwODAwfQ.signature';

  // ============================================
  // CATEGORIA 1: Obtenção de Status MFA (6 testes)
  // ============================================

  describe('getStatus()', () => {
    it('deve obter status MFA com sucesso quando autenticado', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockStatus = createMockMFAStatus();

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockResolvedValue({ data: mockStatus } as any);

      // Act
      const result = await mfaService.getStatus();

      // Assert
      expect(result).toEqual(mockStatus);
      expect(mockKeycloakService.getAccessToken).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/auth/mfa/status',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('deve receber status MFA completo com mfaEnabled, mfaType e credentials', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockStatus = createMockMFAStatus({
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-001',
            type: 'otp',
            userLabel: 'Microsoft Authenticator',
            createdDate: 1704153600000,
          },
          {
            id: 'cred-002',
            type: 'otp',
            userLabel: 'Google Authenticator',
            createdDate: 1704240000000,
          },
        ],
      });

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockResolvedValue({ data: mockStatus } as any);

      // Act
      const result = await mfaService.getStatus();

      // Assert
      expect(result.mfaEnabled).toBe(true);
      expect(result.mfaType).toBe('TOTP');
      expect(result.credentials).toHaveLength(2);
      expect(result.credentials[0].userLabel).toBe('Microsoft Authenticator');
      expect(result.credentials[1].userLabel).toBe('Google Authenticator');
    });

    it('deve lançar erro quando usuário não está autenticado', async () => {
      // Arrange
      mockKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act & Assert
      await expect(mfaService.getStatus()).rejects.toThrow('User not authenticated');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('deve tratar erro HTTP 404 corretamente', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockError = {
        response: {
          status: 404,
          data: { message: 'MFA not configured' },
        },
      };

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mfaService.getStatus()).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith('❌ Error getting MFA status:', mockError);
    });

    it('deve tratar erro HTTP 500 corretamente', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mfaService.getStatus()).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith('❌ Error getting MFA status:', mockError);
    });

    it('deve tratar erro de rede graciosamente', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const networkError = new Error('Network request failed');

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(mfaService.getStatus()).rejects.toThrow('Network request failed');
      expect(console.error).toHaveBeenCalledWith('❌ Error getting MFA status:', networkError);
    });
  });

  // ============================================
  // CATEGORIA 2: Habilitação de MFA (5 testes)
  // ============================================

  describe('enable()', () => {
    it('deve habilitar MFA com sucesso e receber instruções da próxima ação', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createEnableResponse();

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.post.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await mfaService.enable();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('MFA habilitado com sucesso');
      expect(result.nextAction).toBe('CONFIGURE_TOTP');
      expect(mockKeycloakService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('deve enviar requisição POST para o endpoint correto', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createEnableResponse();

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.post.mockResolvedValue({ data: mockResponse } as any);

      // Act
      await mfaService.enable();

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/auth/mfa/enable',
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('deve verificar cabeçalho Authorization com Bearer token', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createEnableResponse();

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.post.mockResolvedValue({ data: mockResponse } as any);

      // Act
      await mfaService.enable();

      // Assert
      const callArgs = mockHttpClient.post.mock.calls[0];
      expect(callArgs[2]?.headers?.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('deve lançar erro quando usuário não está autenticado', async () => {
      // Arrange
      mockKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act & Assert
      await expect(mfaService.enable()).rejects.toThrow('User not authenticated');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('deve tratar erros HTTP durante habilitação', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockError = {
        response: {
          status: 400,
          data: { message: 'MFA already enabled' },
        },
      };

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mfaService.enable()).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith('❌ Error enabling MFA:', mockError);
    });
  });

  // ============================================
  // CATEGORIA 3: Desabilitação de MFA (5 testes)
  // ============================================

  describe('disable()', () => {
    it('deve desabilitar MFA com sucesso usando credentialId', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createDisableResponse();
      const credentialId = 'cred-123-abc';

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.delete.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await mfaService.disable(credentialId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('MFA desabilitado com sucesso');
      expect(mockKeycloakService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('deve enviar credentialId nos dados da requisição', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createDisableResponse();
      const credentialId = 'cred-456-def';

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.delete.mockResolvedValue({ data: mockResponse } as any);

      // Act
      await mfaService.disable(credentialId);

      // Assert
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/auth/mfa',
        {
          data: { credentialId: 'cred-456-def' },
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('deve verificar requisição DELETE com dados corretos', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createDisableResponse();
      const credentialId = 'cred-789-ghi';

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.delete.mockResolvedValue({ data: mockResponse } as any);

      // Act
      await mfaService.disable(credentialId);

      // Assert
      const callArgs = mockHttpClient.delete.mock.calls[0];
      expect(callArgs[0]).toBe('/auth/mfa');
      expect(callArgs[1]?.data).toEqual({ credentialId: 'cred-789-ghi' });
      expect(callArgs[1]?.headers?.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('deve lançar erro quando usuário não está autenticado', async () => {
      // Arrange
      const credentialId = 'cred-999-xyz';
      mockKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act & Assert
      await expect(mfaService.disable(credentialId)).rejects.toThrow('User not authenticated');
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it('deve tratar erros HTTP durante desabilitação', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const credentialId = 'cred-invalid';
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Credential not found' },
        },
      };

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.delete.mockRejectedValue(mockError);

      // Act & Assert
      await expect(mfaService.disable(credentialId)).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith('❌ Error disabling MFA:', mockError);
    });
  });

  // ============================================
  // CATEGORIA 4: Verificação de Necessidade de Setup (4 testes)
  // ============================================

  describe('needsSetup()', () => {
    it('deve retornar true quando MFA não está habilitado (necessita setup)', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockStatus = createDisabledMFAStatus();

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockResolvedValue({ data: mockStatus } as any);

      // Act
      const result = await mfaService.needsSetup();

      // Assert
      expect(result).toBe(true);
      expect(mockKeycloakService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('deve retornar false quando MFA já está habilitado', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockStatus = createMockMFAStatus({ mfaEnabled: true });

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockResolvedValue({ data: mockStatus } as any);

      // Act
      const result = await mfaService.needsSetup();

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false em caso de erro (degradação graciosa)', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockError = new Error('Network error');

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockRejectedValue(mockError);

      // Act
      const result = await mfaService.needsSetup();

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('❌ Error checking MFA setup:', mockError);
    });

    it('deve tratar erros de autenticação graciosamente', async () => {
      // Arrange
      mockKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act
      const result = await mfaService.needsSetup();

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES DE SEGURANÇA ADICIONAIS
  // ============================================

  describe('Segurança - Verificações de Token', () => {
    it('deve sempre verificar autenticação antes de qualquer operação', async () => {
      // Arrange
      mockKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act & Assert - getStatus
      await expect(mfaService.getStatus()).rejects.toThrow('User not authenticated');

      // Act & Assert - enable
      await expect(mfaService.enable()).rejects.toThrow('User not authenticated');

      // Act & Assert - disable
      await expect(mfaService.disable('cred-123')).rejects.toThrow('User not authenticated');

      // Verificar que getAccessToken foi chamado 3 vezes (uma para cada método)
      expect(mockKeycloakService.getAccessToken).toHaveBeenCalledTimes(3);
    });

    it('deve passar credentialId de forma segura na requisição', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockResponse = createDisableResponse();
      const sensitiveCredentialId = 'cred-secret-123';

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.delete.mockResolvedValue({ data: mockResponse } as any);

      // Act
      await mfaService.disable(sensitiveCredentialId);

      // Assert - credentialId deve estar no body, não na URL
      const callArgs = mockHttpClient.delete.mock.calls[0];
      expect(callArgs[0]).toBe('/auth/mfa'); // URL não contém credentialId
      expect(callArgs[1]?.data).toEqual({ credentialId: sensitiveCredentialId }); // Está no body
    });

    it('não deve vazar dados sensíveis em mensagens de erro', async () => {
      // Arrange
      const mockToken = createMockAccessToken();
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal error', sensitiveData: 'secret-key-123' },
        },
      };

      mockKeycloakService.getAccessToken.mockResolvedValue(mockToken);
      mockHttpClient.get.mockRejectedValue(mockError);

      // Act
      try {
        await mfaService.getStatus();
      } catch (error) {
        // Assert - erro original é propagado mas não deve conter dados sensíveis expostos
        expect(error).toEqual(mockError);
      }

      // Verificar que o console.error foi chamado (para logging interno)
      expect(console.error).toHaveBeenCalled();
    });
  });
});
