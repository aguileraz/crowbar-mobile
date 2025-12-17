import httpClient from './httpClient';
import keycloakService from './keycloakService';
import logger from './loggerService';

/**
 * MFA (Multi-Factor Authentication) Service
 * Gerencia configuração de MFA via Keycloak
 */

export interface MFAStatus {
  mfaEnabled: boolean;
  mfaType: 'TOTP' | null;
  credentials: Array<{
    id: string;
    type: string;
    userLabel?: string;
    createdDate?: number;
  }>;
}

class MFAService {
  /**
   * Obter status MFA do usuário atual
   */
  async getStatus(): Promise<MFAStatus> {
    try {
      const token = await keycloakService.getAccessToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await httpClient.get<MFAStatus>('/auth/mfa/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting MFA status:', error);
      throw error;
    }
  }

  /**
   * Habilitar MFA (TOTP)
   * Força configuração no próximo login
   */
  async enable(): Promise<{ message: string; nextAction: string }> {
    try {
      const token = await keycloakService.getAccessToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await httpClient.post<{ message: string; nextAction: string }>(
        '/auth/mfa/enable',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error enabling MFA:', error);
      throw error;
    }
  }

  /**
   * Desabilitar MFA (remover credential)
   */
  async disable(credentialId: string): Promise<{ message: string }> {
    try {
      const token = await keycloakService.getAccessToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await httpClient.delete<{ message: string }>(
        '/auth/mfa',
        {
          data: { credentialId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error disabling MFA:', error);
      throw error;
    }
  }

  /**
   * Verificar se usuário precisa configurar MFA
   */
  async needsSetup(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return !status.mfaEnabled;
    } catch (error) {
      logger.error('Error checking MFA setup:', error);
      return false;
    }
  }
}

export default new MFAService();
