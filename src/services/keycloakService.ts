import { authorize, refresh, revoke, AuthConfiguration, AuthorizeResult } from 'react-native-app-auth';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

/**
 * Keycloak Authentication Service
 * Substitui Firebase Auth com OAuth2/OIDC
 */

// Configuração Keycloak
const config: AuthConfiguration = {
  issuer: __DEV__ 
    ? 'http://10.0.2.2:8080/realms/crowbar'  // Android emulator
    : 'https://keycloak.crowbar.com.br/realms/crowbar',
  clientId: 'crowbar-mobile',
  redirectUrl: 'crowbar://oauth/callback',
  scopes: ['openid', 'profile', 'email'],
  serviceConfiguration: {
    authorizationEndpoint: __DEV__
      ? 'http://10.0.2.2:8080/realms/crowbar/protocol/openid-connect/auth'
      : 'https://keycloak.crowbar.com.br/realms/crowbar/protocol/openid-connect/auth',
    tokenEndpoint: __DEV__
      ? 'http://10.0.2.2:8080/realms/crowbar/protocol/openid-connect/token'
      : 'https://keycloak.crowbar.com.br/realms/crowbar/protocol/openid-connect/token',
    revocationEndpoint: __DEV__
      ? 'http://10.0.2.2:8080/realms/crowbar/protocol/openid-connect/revoke'
      : 'https://keycloak.crowbar.com.br/realms/crowbar/protocol/openid-connect/revoke',
  },
};

interface KeycloakTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  accessTokenExpirationDate: string;
}

class KeycloakAuthService {
  private static KEYCHAIN_SERVICE = 'keycloak_tokens';

  /**
   * Login via Keycloak OAuth2
   */
  async login(): Promise<AuthorizeResult> {
    try {
      console.log('🔐 Iniciando login Keycloak...');
      const result = await authorize(config);

      // Salvar tokens no Keychain
      await this.saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      });

      console.log('✅ Login Keycloak bem-sucedido');
      return result;
    } catch (error) {
      console.error('❌ Erro no login Keycloak:', error);
      throw error;
    }
  }

  /**
   * Logout e revogação de tokens
   */
  async logout(): Promise<void> {
    try {
      const tokens = await this.getTokens();
      
      if (tokens) {
        // Revogar access token no Keycloak
        try {
          await revoke(config, {
            tokenToRevoke: tokens.accessToken,
            sendClientId: true,
          });
        } catch (error) {
          console.warn('⚠️  Erro ao revogar token:', error);
        }
      }

      // Limpar tokens do Keychain
      await Keychain.resetGenericPassword({ service: KeycloakAuthService.KEYCHAIN_SERVICE });
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  }

  /**
   * Obter access token válido (com refresh automático)
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      
      if (!tokens) {
        return null;
      }

      // Verificar se token expirou
      const expirationDate = new Date(tokens.accessTokenExpirationDate);
      const now = new Date();
      const isExpired = expirationDate.getTime() - now.getTime() < 60000; // 1 minuto antes

      if (isExpired) {
        console.log('🔄 Access token expirado, renovando...');
        const newTokens = await this.refreshTokens();
        return newTokens?.accessToken || null;
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('❌ Erro ao obter access token:', error);
      return null;
    }
  }

  /**
   * Renovar tokens usando refresh token
   */
  async refreshTokens(): Promise<KeycloakTokens | null> {
    try {
      const tokens = await this.getTokens();
      
      if (!tokens || !tokens.refreshToken) {
        console.warn('⚠️  Nenhum refresh token disponível');
        return null;
      }

      const result = await refresh(config, {
        refreshToken: tokens.refreshToken,
      });

      const newTokens: KeycloakTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || tokens.refreshToken,
        idToken: result.idToken || tokens.idToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
      };

      await this.saveTokens(newTokens);
      console.log('✅ Tokens renovados com sucesso');
      
      return newTokens;
    } catch (error) {
      console.error('❌ Erro ao renovar tokens:', error);
      // Se refresh falhar, limpar tokens (usuário precisa fazer login novamente)
      await Keychain.resetGenericPassword({ service: KeycloakAuthService.KEYCHAIN_SERVICE });
      return null;
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }

  /**
   * Obter informações do usuário do ID token
   */
  async getUserInfo(): Promise<any | null> {
    try {
      const tokens = await this.getTokens();
      
      if (!tokens || !tokens.idToken) {
        return null;
      }

      // Decodificar JWT (ID token)
      const base64Url = tokens.idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Erro ao obter informações do usuário:', error);
      return null;
    }
  }

  /**
   * Salvar tokens no Keychain
   */
  private async saveTokens(tokens: KeycloakTokens): Promise<void> {
    await Keychain.setGenericPassword(
      'keycloak',
      JSON.stringify(tokens),
      { service: KeycloakAuthService.KEYCHAIN_SERVICE }
    );
  }

  /**
   * Obter tokens do Keychain
   */
  private async getTokens(): Promise<KeycloakTokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KeycloakAuthService.KEYCHAIN_SERVICE,
      });

      if (credentials) {
        return JSON.parse(credentials.password) as KeycloakTokens;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao obter tokens:', error);
      return null;
    }
  }
}

export default new KeycloakAuthService();
