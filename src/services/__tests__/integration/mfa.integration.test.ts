/**
 * Testes de Integração - MFA (Multi-Factor Authentication)
 * 
 * Testa o fluxo completo de MFA via Keycloak:
 * - Habilitar MFA (TOTP)
 * - Login com MFA
 * - Desabilitar MFA
 * - Verificação de status MFA
 * 
 * ⚠️ INTEGRATION TEST - Requer backend Keycloak configurado
 */

import { TestApiClient, testEnvironment } from './testConfig';
import mfaService, { MFAStatus } from '../../mfaService';
import keycloakService from '../../keycloakService';
import httpClient from '../../httpClient';

// Mocks
jest.mock('../../keycloakService');
jest.mock('../../httpClient');

const mockedKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('Testes de Integração - MFA', () => {
  let testClient: TestApiClient;

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
    jest.clearAllMocks();

    // Mock padrão: usuário autenticado
    mockedKeycloakService.getAccessToken.mockResolvedValue('mock-access-token');
  });

  afterEach(() => {
    testClient.clearMocks();
  });

  describe('Obter Status MFA', () => {
    it('deve obter status MFA do backend', async () => {
      // Arrange
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedHttpClient.get.mockResolvedValue({
        data: mockStatus,
      } as any);

      // Act
      const status = await mfaService.getStatus();

      // Assert
      expect(mockedKeycloakService.getAccessToken).toHaveBeenCalled();
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        '/auth/mfa/status',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
      expect(status).toEqual(mockStatus);
      expect(status.mfaEnabled).toBe(false);
    });

    it('deve retornar status quando MFA está habilitado', async () => {
      // Arrange
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-1',
            type: 'TOTP',
            userLabel: 'My Authenticator',
            createdDate: Date.now(),
          },
        ],
      };

      mockedHttpClient.get.mockResolvedValue({
        data: mockStatus,
      } as any);

      // Act
      const status = await mfaService.getStatus();

      // Assert
      expect(status.mfaEnabled).toBe(true);
      expect(status.mfaType).toBe('TOTP');
      expect(status.credentials).toHaveLength(1);
    });

    it('deve lançar erro quando usuário não está autenticado', async () => {
      // Arrange
      mockedKeycloakService.getAccessToken.mockResolvedValue(null);

      // Act & Assert
      await expect(mfaService.getStatus()).rejects.toThrow('User not authenticated');
    });
  });

  describe('Habilitar MFA', () => {
    it('deve habilitar MFA com sucesso', async () => {
      // Arrange
      const mockResponse = {
        message: 'MFA habilitado com sucesso',
        nextAction: 'Configure seu aplicativo autenticador',
      };

      mockedHttpClient.post.mockResolvedValue({
        data: mockResponse,
      } as any);

      // Act
      const result = await mfaService.enable();

      // Assert
      expect(mockedKeycloakService.getAccessToken).toHaveBeenCalled();
      expect(mockedHttpClient.post).toHaveBeenCalledWith(
        '/auth/mfa/enable',
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('habilitado');
    });

    it('deve lançar erro quando habilitar MFA falha', async () => {
      // Arrange
      mockedHttpClient.post.mockRejectedValue(new Error('Failed to enable MFA'));

      // Act & Assert
      await expect(mfaService.enable()).rejects.toThrow('Failed to enable MFA');
    });
  });

  describe('Desabilitar MFA', () => {
    it('deve desabilitar MFA com sucesso', async () => {
      // Arrange
      const credentialId = 'cred-1';
      const mockResponse = {
        message: 'MFA desabilitado com sucesso',
      };

      mockedHttpClient.delete.mockResolvedValue({
        data: mockResponse,
      } as any);

      // Act
      const result = await mfaService.disable(credentialId);

      // Assert
      expect(mockedKeycloakService.getAccessToken).toHaveBeenCalled();
      expect(mockedHttpClient.delete).toHaveBeenCalledWith(
        '/auth/mfa',
        expect.objectContaining({
          data: { credentialId },
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('desabilitado');
    });

    it('deve lançar erro quando desabilitar MFA falha', async () => {
      // Arrange
      mockedHttpClient.delete.mockRejectedValue(new Error('Failed to disable MFA'));

      // Act & Assert
      await expect(mfaService.disable('cred-1')).rejects.toThrow('Failed to disable MFA');
    });
  });

  describe('Verificar Necessidade de Setup', () => {
    it('deve retornar true quando MFA não está habilitado', async () => {
      // Arrange
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedHttpClient.get.mockResolvedValue({
        data: mockStatus,
      } as any);

      // Act
      const needsSetup = await mfaService.needsSetup();

      // Assert
      expect(needsSetup).toBe(true);
    });

    it('deve retornar false quando MFA está habilitado', async () => {
      // Arrange
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-1',
            type: 'TOTP',
            userLabel: 'My Authenticator',
            createdDate: Date.now(),
          },
        ],
      };

      mockedHttpClient.get.mockResolvedValue({
        data: mockStatus,
      } as any);

      // Act
      const needsSetup = await mfaService.needsSetup();

      // Assert
      expect(needsSetup).toBe(false);
    });
  });

  describe('Fluxo Completo MFA', () => {
    it('deve completar fluxo completo: habilitar → verificar → desabilitar', async () => {
      // Arrange - Status inicial: MFA desabilitado
      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          mfaEnabled: false,
          mfaType: null,
          credentials: [],
        },
      } as any);

      // Act 1: Verificar status inicial
      const initialStatus = await mfaService.getStatus();
      expect(initialStatus.mfaEnabled).toBe(false);

      // Arrange - Habilitar MFA
      mockedHttpClient.post.mockResolvedValueOnce({
        data: {
          message: 'MFA habilitado',
          nextAction: 'Configure seu app',
        },
      } as any);

      // Act 2: Habilitar MFA
      const enableResult = await mfaService.enable();
      expect(enableResult.message).toContain('habilitado');

      // Arrange - Verificar status após habilitar
      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          mfaEnabled: true,
          mfaType: 'TOTP',
          credentials: [
            {
              id: 'cred-1',
              type: 'TOTP',
              userLabel: 'My Authenticator',
              createdDate: Date.now(),
            },
          ],
        },
      } as any);

      // Act 3: Verificar status após habilitar
      const statusAfterEnable = await mfaService.getStatus();
      expect(statusAfterEnable.mfaEnabled).toBe(true);

      // Arrange - Desabilitar MFA
      mockedHttpClient.delete.mockResolvedValueOnce({
        data: {
          message: 'MFA desabilitado',
        },
      } as any);

      // Act 4: Desabilitar MFA
      const disableResult = await mfaService.disable('cred-1');
      expect(disableResult.message).toContain('desabilitado');

      // Assert - Verificar todas as chamadas
      expect(mockedHttpClient.get).toHaveBeenCalledTimes(2);
      expect(mockedHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockedHttpClient.delete).toHaveBeenCalledTimes(1);
    });
  });
});

