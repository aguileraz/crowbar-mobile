import keycloakService from './keycloakService';
import logger from './loggerService';

/**
 * Serviço de Autenticação
 *
 * ⚠️ MIGRATION NOTICE:
 * Este serviço foi migrado de Firebase Auth para Keycloak OAuth2.
 * Métodos legados do Firebase foram marcados como DEPRECATED e lançam erros.
 *
 * Use keycloakService diretamente para novas implementações:
 * - keycloakService.login() - OAuth2 flow
 * - keycloakService.logout() - Revoke tokens
 * - keycloakService.getAccessToken() - Get valid token
 * - keycloakService.isAuthenticated() - Check auth status
 * - keycloakService.getUserInfo() - Get user claims from ID token
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

class AuthService {
  /**
   * Registrar novo usuário
   *
   * @deprecated Firebase Auth não está mais em uso.
   * Registro de usuários deve ser feito através do Keycloak Admin Console
   * ou API de registro customizada no backend.
   */
  async register(_input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
    const error = new Error(
      'DEPRECATED: Firebase Auth não está disponível. Use Keycloak para registro de usuários.'
    );
    logger.error(error.message);
    throw error;
  }

  /**
   * Login com email e senha
   *
   * @deprecated Firebase Auth não está mais em uso.
   * Use keycloakService.login() para autenticação OAuth2.
   */
  async login(_input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    const error = new Error(
      'DEPRECATED: Firebase Auth não está disponível. Use keycloakService.login() para OAuth2.'
    );
    logger.error(error.message);
    throw error;
  }

  /**
   * Logout
   *
   * @deprecated Use keycloakService.logout() para revogar tokens OAuth2.
   */
  async logout(): Promise<void> {
    logger.warn('DEPRECATED: Use keycloakService.logout() em vez de authService.logout()');
    try {
      await keycloakService.logout();
    } catch (error: any) {
      logger.error('Erro no logout Keycloak:', error);
      throw error;
    }
  }

  /**
   * Resetar senha
   *
   * @deprecated Firebase Auth não está mais em uso.
   * Reset de senha deve ser feito através do Keycloak.
   */
  async resetPassword(_email: string): Promise<void> {
    const error = new Error(
      'DEPRECATED: Reset de senha deve ser feito através do Keycloak, não Firebase.'
    );
    logger.error(error.message);
    throw error;
  }

  /**
   * Obter usuário atual
   *
   * @deprecated Use keycloakService.getUserInfo() para obter claims do usuário.
   */
  getCurrentUser(): AuthUser | null {
    logger.warn('DEPRECATED: Use keycloakService.getUserInfo() para obter informações do usuário');
    return null;
  }

  /**
   * Verificar se está autenticado
   *
   * Wrapper para keycloakService.isAuthenticated()
   */
  async isAuthenticated(): Promise<boolean> {
    return await keycloakService.isAuthenticated();
  }

  /**
   * Obter token atual
   *
   * Wrapper para keycloakService.getAccessToken()
   */
  async getToken(): Promise<string | null> {
    try {
      return await keycloakService.getAccessToken();
    } catch (error) {
      logger.error('Erro ao obter access token:', error);
      return null;
    }
  }

  /**
   * Obter informações do usuário (novo método Keycloak)
   */
  async getUserInfo(): Promise<any | null> {
    try {
      return await keycloakService.getUserInfo();
    } catch (error) {
      logger.error('Erro ao obter informações do usuário:', error);
      return null;
    }
  }

  /**
   * Fazer login OAuth2 (novo método Keycloak)
   */
  async loginOAuth(): Promise<any> {
    try {
      return await keycloakService.login();
    } catch (error) {
      logger.error('Erro no login OAuth2:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
