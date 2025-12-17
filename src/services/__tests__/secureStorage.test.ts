/**
 * Testes para o serviço de armazenamento seguro
 *
 * @description Testes abrangentes para SecureStorageService
 * @priority CRITICAL - Previne vazamento de credenciais e brechas de segurança
 * @coverage 30 testes cobrindo autenticação, tokens, credenciais, migração e biometria
 */

// Mock das dependências ANTES de importar o serviço
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    ALWAYS: 'AccessibleAlways',
    ALWAYS_THIS_DEVICE_ONLY: 'AccessibleAlwaysThisDeviceOnly',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
  },
  BIOMETRY_TYPE: {
    TOUCH_ID: 'TouchID',
    FACE_ID: 'FaceID',
    FINGERPRINT: 'Fingerprint',
    FACE: 'Face',
    IRIS: 'Iris',
  },
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  getSupportedBiometryType: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../loggerService', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Agora importar as dependências e o serviço
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../secureStorage';
import logger from '../loggerService';

describe('SecureStorageService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // 1. TESTES DE ARMAZENAMENTO DE AUTH TOKEN
  // ========================================
  describe('Armazenamento de Auth Token', () => {
    test('deve armazenar auth token com sucesso no Keychain', async () => {
      // Arrange
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      const result = await secureStorage.setAuthToken(mockToken);

      // Assert
      expect(result).toBe(true);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile',
        'auth_token',
        mockToken,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Auth token stored securely',
        'SecureStorage'
      );
    });

    test('deve recuperar auth token armazenado corretamente', async () => {
      // Arrange
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const mockCredentials = {
        username: 'auth_token',
        password: mockToken,
        service: 'crowbar-mobile',
        storage: 'KeychainStorage',
      };
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(mockCredentials);

      // Act
      const result = await secureStorage.getAuthToken();

      // Assert
      expect(result).toBe(mockToken);
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('crowbar-mobile');
    });

    test('deve retornar null quando nenhum auth token está armazenado', async () => {
      // Arrange
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await secureStorage.getAuthToken();

      // Assert
      expect(result).toBeNull();
    });

    test('deve retornar null quando username do token não corresponde', async () => {
      // Arrange
      const mockCredentials = {
        username: 'wrong_key',
        password: 'some_token',
        service: 'crowbar-mobile',
        storage: 'KeychainStorage',
      };
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(mockCredentials);

      // Act
      const result = await secureStorage.getAuthToken();

      // Assert
      expect(result).toBeNull();
    });

    test('deve lidar com erros ao armazenar auth token', async () => {
      // Arrange
      const mockError = new Error('Keychain access denied');
      (Keychain.setInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await secureStorage.setAuthToken('test_token');

      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to store auth token',
        'SecureStorage',
        mockError
      );
    });

    test('deve lidar com erros ao recuperar auth token', async () => {
      // Arrange
      const mockError = new Error('Keychain read failed');
      (Keychain.getInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await secureStorage.getAuthToken();

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to retrieve auth token',
        'SecureStorage',
        mockError
      );
    });
  });

  // ========================================
  // 2. TESTES DE ARMAZENAMENTO DE REFRESH TOKEN
  // ========================================
  describe('Armazenamento de Refresh Token', () => {
    test('deve armazenar refresh token com sucesso', async () => {
      // Arrange
      const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      const result = await secureStorage.setRefreshToken(mockRefreshToken);

      // Assert
      expect(result).toBe(true);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile-refresh',
        'refresh_token',
        mockRefreshToken,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Refresh token stored securely',
        'SecureStorage'
      );
    });

    test('deve recuperar refresh token armazenado', async () => {
      // Arrange
      const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token';
      const mockCredentials = {
        username: 'refresh_token',
        password: mockRefreshToken,
        service: 'crowbar-mobile-refresh',
        storage: 'KeychainStorage',
      };
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(mockCredentials);

      // Act
      const result = await secureStorage.getRefreshToken();

      // Assert
      expect(result).toBe(mockRefreshToken);
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-refresh');
    });

    test('deve retornar null quando nenhum refresh token está armazenado', async () => {
      // Arrange
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await secureStorage.getRefreshToken();

      // Assert
      expect(result).toBeNull();
    });

    test('deve usar sufixo correto do service name para refresh token', async () => {
      // Arrange
      const mockRefreshToken = 'test_refresh_token';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      await secureStorage.setRefreshToken(mockRefreshToken);

      // Assert
      const callArgs = (Keychain.setInternetCredentials as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('crowbar-mobile-refresh');
    });

    test('deve lidar com erros ao armazenar refresh token', async () => {
      // Arrange
      const mockError = new Error('Storage full');
      (Keychain.setInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await secureStorage.setRefreshToken('test_token');

      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to store refresh token',
        'SecureStorage',
        mockError
      );
    });
  });

  // ========================================
  // 3. TESTES DE ARMAZENAMENTO DE CREDENCIAIS DE USUÁRIO
  // ========================================
  describe('Armazenamento de Credenciais de Usuário', () => {
    test('deve armazenar credenciais de email/senha com sucesso', async () => {
      // Arrange
      const mockEmail = 'user@example.com';
      const mockPassword = 'SecurePass123!';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      const result = await secureStorage.setUserCredentials(mockEmail, mockPassword);

      // Assert
      expect(result).toBe(true);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile-credentials',
        mockEmail,
        mockPassword,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'User credentials stored securely',
        'SecureStorage'
      );
    });

    test('deve recuperar credenciais armazenadas com ambos os campos', async () => {
      // Arrange
      const mockEmail = 'user@example.com';
      const mockPassword = 'SecurePass123!';
      const mockCredentials = {
        username: mockEmail,
        password: mockPassword,
        service: 'crowbar-mobile-credentials',
        storage: 'KeychainStorage',
      };
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(mockCredentials);

      // Act
      const result = await secureStorage.getUserCredentials();

      // Assert
      expect(result).toEqual({
        email: mockEmail,
        password: mockPassword,
      });
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-credentials');
    });

    test('deve retornar null quando nenhuma credencial está armazenada', async () => {
      // Arrange
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await secureStorage.getUserCredentials();

      // Assert
      expect(result).toBeNull();
    });

    test('deve usar nível de acessibilidade WHEN_UNLOCKED_THIS_DEVICE_ONLY (mais seguro)', async () => {
      // Arrange
      const mockEmail = 'user@example.com';
      const mockPassword = 'password123';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      await secureStorage.setUserCredentials(mockEmail, mockPassword);

      // Assert
      const callArgs = (Keychain.setInternetCredentials as jest.Mock).mock.calls[0];
      expect(callArgs[3]).toEqual({
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    });

    test('deve lidar com erros ao armazenar credenciais', async () => {
      // Arrange
      const mockError = new Error('Keychain unavailable');
      (Keychain.setInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await secureStorage.setUserCredentials('user@test.com', 'pass');

      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to store user credentials',
        'SecureStorage',
        mockError
      );
    });
  });

  // ========================================
  // 4. TESTES DE DADOS GENÉRICOS SEGUROS
  // ========================================
  describe('Armazenamento de Dados Genéricos Seguros', () => {
    test('deve armazenar dados genéricos com chave customizada', async () => {
      // Arrange
      const customKey = 'api_key';
      const customValue = 'sk_test_123456789';
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      const result = await secureStorage.setSecureData(customKey, customValue);

      // Assert
      expect(result).toBe(true);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile-api_key',
        customKey,
        customValue,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Secure data stored for key: api_key',
        'SecureStorage'
      );
    });

    test('deve recuperar dados genéricos armazenados', async () => {
      // Arrange
      const customKey = 'api_key';
      const customValue = 'sk_test_123456789';
      const mockCredentials = {
        username: customKey,
        password: customValue,
        service: `crowbar-mobile-${customKey}`,
        storage: 'KeychainStorage',
      };
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(mockCredentials);

      // Act
      const result = await secureStorage.getSecureData(customKey);

      // Assert
      expect(result).toBe(customValue);
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-api_key');
    });

    test('deve retornar null quando chave não foi encontrada', async () => {
      // Arrange
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await secureStorage.getSecureData('non_existent_key');

      // Assert
      expect(result).toBeNull();
    });

    test('deve lidar com múltiplas chaves diferentes simultaneamente', async () => {
      // Arrange
      const keys = ['api_key', 'encryption_key', 'device_id'];
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      const results = await Promise.all(
        keys.map((key, index) => secureStorage.setSecureData(key, `value_${index}`))
      );

      // Assert
      expect(results.every(r => r === true)).toBe(true);
      expect(Keychain.setInternetCredentials).toHaveBeenCalledTimes(keys.length);
      keys.forEach((key, index) => {
        expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
          `crowbar-mobile-${key}`,
          key,
          `value_${index}`,
          { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
        );
      });
    });
  });

  // ========================================
  // 5. TESTES DE REMOÇÃO DE TOKENS
  // ========================================
  describe('Remoção de Tokens', () => {
    test('deve remover auth token com sucesso', async () => {
      // Arrange
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await secureStorage.removeAuthToken();

      // Assert
      expect(result).toBe(true);
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile');
      expect(logger.debug).toHaveBeenCalledWith(
        'Auth token removed',
        'SecureStorage'
      );
    });

    test('deve remover refresh token com sucesso', async () => {
      // Arrange
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await secureStorage.removeRefreshToken();

      // Assert
      expect(result).toBe(true);
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-refresh');
      expect(logger.debug).toHaveBeenCalledWith(
        'Refresh token removed',
        'SecureStorage'
      );
    });

    test('deve remover credenciais de usuário com sucesso', async () => {
      // Arrange
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await secureStorage.removeUserCredentials();

      // Assert
      expect(result).toBe(true);
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-credentials');
      expect(logger.debug).toHaveBeenCalledWith(
        'User credentials removed',
        'SecureStorage'
      );
    });

    test('deve lidar com erros durante remoção de forma graciosa', async () => {
      // Arrange
      const mockError = new Error('Keychain error');
      (Keychain.resetInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await secureStorage.removeAuthToken();

      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove auth token',
        'SecureStorage',
        mockError
      );
    });

    test('deve verificar logging de remoções bem-sucedidas', async () => {
      // Arrange
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.removeAuthToken();
      await secureStorage.removeRefreshToken();
      await secureStorage.removeUserCredentials();

      // Assert
      expect(logger.debug).toHaveBeenCalledTimes(3);
      expect(logger.debug).toHaveBeenCalledWith('Auth token removed', 'SecureStorage');
      expect(logger.debug).toHaveBeenCalledWith('Refresh token removed', 'SecureStorage');
      expect(logger.debug).toHaveBeenCalledWith('User credentials removed', 'SecureStorage');
    });
  });

  // ========================================
  // 6. TESTES DE LIMPEZA COMPLETA
  // ========================================
  describe('Limpeza de Todos os Dados', () => {
    test('deve limpar todos os dados seguros (auth + refresh + credentials)', async () => {
      // Arrange
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.clearAll();

      // Assert
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledTimes(3);
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile');
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-refresh');
      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith('crowbar-mobile-credentials');
      expect(logger.info).toHaveBeenCalledWith(
        'All secure data cleared',
        'SecureStorage'
      );
    });

    test('deve lidar com erros durante clearAll', async () => {
      // Arrange
      const mockError = new Error('Partial clear failure');
      (Keychain.resetInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      await secureStorage.clearAll();

      // Assert
      // Verifica que os erros individuais de cada remoção foram logados
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove auth token',
        'SecureStorage',
        mockError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove refresh token',
        'SecureStorage',
        mockError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove user credentials',
        'SecureStorage',
        mockError
      );
      // Verifica que foram 3 chamadas de erro (uma para cada remoção)
      expect(logger.error).toHaveBeenCalledTimes(3);
    });

    test('deve verificar que todos os métodos de remoção foram chamados', async () => {
      // Arrange
      const removeSpy = jest.spyOn(secureStorage, 'removeAuthToken');
      const refreshSpy = jest.spyOn(secureStorage, 'removeRefreshToken');
      const credentialsSpy = jest.spyOn(secureStorage, 'removeUserCredentials');
      (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.clearAll();

      // Assert
      expect(removeSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
      expect(credentialsSpy).toHaveBeenCalled();

      // Cleanup
      removeSpy.mockRestore();
      refreshSpy.mockRestore();
      credentialsSpy.mockRestore();
    });
  });

  // ========================================
  // 7. TESTES DE SUPORTE À BIOMETRIA
  // ========================================
  describe('Suporte à Biometria', () => {
    test('deve verificar se armazenamento seguro é suportado', async () => {
      // Arrange
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(
        Keychain.BIOMETRY_TYPE.TOUCH_ID
      );

      // Act
      const result = await secureStorage.isSupported();

      // Assert
      expect(result).toBe(true);
      expect(Keychain.getSupportedBiometryType).toHaveBeenCalled();
    });

    test('deve retornar false quando armazenamento não é suportado', async () => {
      // Arrange
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await secureStorage.isSupported();

      // Assert
      expect(result).toBe(false);
    });

    test('deve obter tipo de biometria (FaceID, TouchID, Fingerprint)', async () => {
      // Arrange
      const biometryType = Keychain.BIOMETRY_TYPE.FACE_ID;
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(biometryType);

      // Act
      const result = await secureStorage.getBiometryType();

      // Assert
      expect(result).toBe(biometryType);
      expect(Keychain.getSupportedBiometryType).toHaveBeenCalled();
    });

    test('deve lidar com dispositivos não suportados', async () => {
      // Arrange
      const mockError = new Error('Biometry not available');
      (Keychain.getSupportedBiometryType as jest.Mock).mockRejectedValue(mockError);

      // Act
      const isSupported = await secureStorage.isSupported();
      const biometryType = await secureStorage.getBiometryType();

      // Assert
      expect(isSupported).toBe(false);
      expect(biometryType).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Secure storage may not be fully supported',
        'SecureStorage',
        mockError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to check biometry type',
        'SecureStorage',
        mockError
      );
    });
  });

  // ========================================
  // 8. TESTES DE MIGRAÇÃO DO ASYNCSTORAGE
  // ========================================
  describe('Migração do AsyncStorage', () => {
    test('deve migrar auth token do AsyncStorage para Keychain', async () => {
      // Arrange
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth.token';
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve(mockToken);
        return Promise.resolve(null);
      });
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile',
        'auth_token',
        mockToken,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(logger.info).toHaveBeenCalledWith(
        'Migrated auth token to secure storage',
        'SecureStorage'
      );
    });

    test('deve migrar refresh token do AsyncStorage', async () => {
      // Arrange
      const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token';
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'refresh_token') return Promise.resolve(mockRefreshToken);
        return Promise.resolve(null);
      });
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('refresh_token');
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile-refresh',
        'refresh_token',
        mockRefreshToken,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(logger.info).toHaveBeenCalledWith(
        'Migrated refresh token to secure storage',
        'SecureStorage'
      );
    });

    test('deve migrar credenciais de usuário parseando JSON corretamente', async () => {
      // Arrange
      const mockCredentials = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_credentials') {
          return Promise.resolve(JSON.stringify(mockCredentials));
        }
        return Promise.resolve(null);
      });
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_credentials');
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'crowbar-mobile-credentials',
        mockCredentials.email,
        mockCredentials.password,
        { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_credentials');
      expect(logger.info).toHaveBeenCalledWith(
        'Migrated user credentials to secure storage',
        'SecureStorage'
      );
    });

    test('deve pular migração quando não há dados no AsyncStorage', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(Keychain.setInternetCredentials).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Migration from AsyncStorage completed',
        'SecureStorage'
      );
    });

    test('deve lidar com JSON malformado de credenciais de forma graciosa', async () => {
      // Arrange
      const malformedJSON = '{invalid json}';
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_credentials') return Promise.resolve(malformedJSON);
        return Promise.resolve(null);
      });

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse stored credentials',
        'SecureStorage',
        expect.any(Error)
      );
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('user_credentials');
    });

    test('deve lidar com credenciais incompletas (sem email ou password)', async () => {
      // Arrange
      const incompleteCredentials = { email: 'user@example.com' }; // falta password
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_credentials') {
          return Promise.resolve(JSON.stringify(incompleteCredentials));
        }
        return Promise.resolve(null);
      });

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(Keychain.setInternetCredentials).not.toHaveBeenCalledWith(
        expect.stringContaining('credentials'),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('user_credentials');
    });

    test('deve remover dados do AsyncStorage após transferência bem-sucedida', async () => {
      // Arrange
      const mockToken = 'test_token';
      const mockRefreshToken = 'test_refresh_token';
      const mockCredentials = { email: 'user@test.com', password: 'pass123' };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve(mockToken);
        if (key === 'refresh_token') return Promise.resolve(mockRefreshToken);
        if (key === 'user_credentials') return Promise.resolve(JSON.stringify(mockCredentials));
        return Promise.resolve(null);
      });
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_credentials');
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(3);
    });

    test('deve lidar com erro geral durante migração', async () => {
      // Arrange
      const mockError = new Error('AsyncStorage unavailable');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(mockError);

      // Act
      await secureStorage.migrateFromAsyncStorage();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to migrate from AsyncStorage',
        'SecureStorage',
        mockError
      );
    });
  });

  // ========================================
  // 9. TESTES DE SEGURANÇA ADICIONAIS
  // ========================================
  describe('Validação de Segurança', () => {
    test('deve verificar que WHEN_UNLOCKED é usado para tokens (menos restritivo)', async () => {
      // Arrange
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      await secureStorage.setAuthToken('test_token');
      await secureStorage.setRefreshToken('test_refresh');

      // Assert
      const calls = (Keychain.setInternetCredentials as jest.Mock).mock.calls;
      expect(calls[0][3]).toEqual({ accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED });
      expect(calls[1][3]).toEqual({ accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED });
    });

    test('deve verificar que service names são únicos por tipo de dado', async () => {
      // Arrange
      (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue({ service: 'success' });

      // Act
      await secureStorage.setAuthToken('token1');
      await secureStorage.setRefreshToken('token2');
      await secureStorage.setUserCredentials('user@test.com', 'pass');

      // Assert
      const calls = (Keychain.setInternetCredentials as jest.Mock).mock.calls;
      const serviceNames = calls.map(call => call[0]);

      expect(serviceNames[0]).toBe('crowbar-mobile');
      expect(serviceNames[1]).toBe('crowbar-mobile-refresh');
      expect(serviceNames[2]).toBe('crowbar-mobile-credentials');

      // Verificar que todos são únicos
      const uniqueNames = new Set(serviceNames);
      expect(uniqueNames.size).toBe(serviceNames.length);
    });

    test('deve verificar que erros não vazam dados sensíveis nos logs', async () => {
      // Arrange
      const sensitiveToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive.data';
      const mockError = new Error('Keychain error');
      (Keychain.setInternetCredentials as jest.Mock).mockRejectedValue(mockError);

      // Act
      await secureStorage.setAuthToken(sensitiveToken);

      // Assert
      const errorCalls = (logger.error as jest.Mock).mock.calls;
      errorCalls.forEach(call => {
        const errorMessage = call[0];
        expect(errorMessage).not.toContain(sensitiveToken);
        expect(errorMessage).not.toContain('eyJ');
      });
    });
  });
});
