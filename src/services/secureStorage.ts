/**
 * Serviço de armazenamento seguro para dados sensíveis
 * Utiliza react-native-keychain para criptografia
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './loggerService';

interface _SecureStorageOptions {
  service?: string;
  accessGroup?: string;
  accessible?: Keychain.ACCESSIBLE;
}

class SecureStorageService {
  private readonly serviceName: string = 'crowbar-mobile';
  private readonly tokenKey: string = 'auth_token';
  private readonly refreshTokenKey: string = 'refresh_token';
  private readonly userCredentialsKey: string = 'user_credentials';

  /**
   * Armazenar token de autenticação de forma segura
   */
  async setAuthToken(token: string): Promise<boolean> {
    try {
      const _result = await Keychain.setInternetCredentials(
        this.serviceName,
        this.tokenKey,
        token,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }
      );
      
      logger.debug('Auth token stored securely', 'SecureStorage');
      return _result !== false;
    } catch (error) {
      logger.error('Failed to store auth token', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Recuperar token de autenticação
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.serviceName);
      
      if (credentials && credentials.username === this.tokenKey) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to retrieve auth token', 'SecureStorage', error);
      return null;
    }
  }

  /**
   * Armazenar refresh token de forma segura
   */
  async setRefreshToken(token: string): Promise<boolean> {
    try {
      const _result = await Keychain.setInternetCredentials(
        `${this.serviceName}-refresh`,
        this.refreshTokenKey,
        token,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }
      );
      
      logger.debug('Refresh token stored securely', 'SecureStorage');
      return _result !== false;
    } catch (error) {
      logger.error('Failed to store refresh token', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Recuperar refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.serviceName}-refresh`);
      
      if (credentials && credentials.username === this.refreshTokenKey) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to retrieve refresh token', 'SecureStorage', error);
      return null;
    }
  }

  /**
   * Armazenar credenciais do usuário (email/senha) de forma segura
   */
  async setUserCredentials(email: string, password: string): Promise<boolean> {
    try {
      const _result = await Keychain.setInternetCredentials(
        `${this.serviceName}-credentials`,
        email,
        password,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );
      
      logger.debug('User credentials stored securely', 'SecureStorage');
      return _result !== false;
    } catch (error) {
      logger.error('Failed to store user credentials', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Recuperar credenciais do usuário
   */
  async getUserCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.serviceName}-credentials`);
      
      if (credentials) {
        return {
          email: credentials.username,
          password: credentials.password,
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to retrieve user credentials', 'SecureStorage', error);
      return null;
    }
  }

  /**
   * Armazenar dados genéricos de forma segura
   */
  async setSecureData(key: string, value: string): Promise<boolean> {
    try {
      const _result = await Keychain.setInternetCredentials(
        `${this.serviceName}-${key}`,
        key,
        value,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }
      );
      
      logger.debug(`Secure data stored for key: ${key}`, 'SecureStorage');
      return _result !== false;
    } catch (error) {
      logger.error(`Failed to store secure data for key: ${key}`, 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Recuperar dados genéricos seguros
   */
  async getSecureData(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.serviceName}-${key}`);
      
      if (credentials && credentials.username === key) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to retrieve secure data for key: ${key}`, 'SecureStorage', error);
      return null;
    }
  }

  /**
   * Remover token de autenticação
   */
  async removeAuthToken(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(this.serviceName);
      logger.debug('Auth token removed', 'SecureStorage');
      return true;
    } catch (error) {
      logger.error('Failed to remove auth token', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Remover refresh token
   */
  async removeRefreshToken(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(`${this.serviceName}-refresh`);
      logger.debug('Refresh token removed', 'SecureStorage');
      return true;
    } catch (error) {
      logger.error('Failed to remove refresh token', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Remover credenciais do usuário
   */
  async removeUserCredentials(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(`${this.serviceName}-credentials`);
      logger.debug('User credentials removed', 'SecureStorage');
      return true;
    } catch (error) {
      logger.error('Failed to remove user credentials', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Limpar todos os dados seguros
   */
  async clearAll(): Promise<void> {
    try {
      await this.removeAuthToken();
      await this.removeRefreshToken();
      await this.removeUserCredentials();
      logger.info('All secure data cleared', 'SecureStorage');
    } catch (error) {
      logger.error('Failed to clear all secure data', 'SecureStorage', error);
    }
  }

  /**
   * Verificar se há suporte para armazenamento seguro
   */
  async isSupported(): Promise<boolean> {
    try {
      const supported = await Keychain.getSupportedBiometryType();
      return supported !== null;
    } catch (error) {
      logger.warn('Secure storage may not be fully supported', 'SecureStorage', error);
      return false;
    }
  }

  /**
   * Verificar se biometria está disponível
   */
  async getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error) {
      logger.error('Failed to check biometry type', 'SecureStorage', error);
      return null;
    }
  }

  /**
   * Migrar dados do AsyncStorage para armazenamento seguro
   */
  async migrateFromAsyncStorage(): Promise<void> {
    try {
      // Migrar token
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await this.setAuthToken(token);
        await AsyncStorage.removeItem('auth_token');
        logger.info('Migrated auth token to secure storage', 'SecureStorage');
      }

      // Migrar refresh token
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await this.setRefreshToken(refreshToken);
        await AsyncStorage.removeItem('refresh_token');
        logger.info('Migrated refresh token to secure storage', 'SecureStorage');
      }

      // Migrar credenciais (se existirem)
      const credentials = await AsyncStorage.getItem('user_credentials');
      if (credentials) {
        try {
          const parsed = JSON.parse(credentials);
          if (parsed.email && parsed.password) {
            await this.setUserCredentials(parsed.email, parsed.password);
            await AsyncStorage.removeItem('user_credentials');
            logger.info('Migrated user credentials to secure storage', 'SecureStorage');
          }
        } catch (error) {
          logger.error('Failed to parse stored credentials', 'SecureStorage', error);
        }
      }

      logger.info('Migration from AsyncStorage completed', 'SecureStorage');
    } catch (error) {
      logger.error('Failed to migrate from AsyncStorage', 'SecureStorage', error);
    }
  }
}

// Singleton instance
export const secureStorage = new SecureStorageService();

// Hook para usar em componentes React
export const useSecureStorage = () => {
  return secureStorage;
};

export default secureStorage;