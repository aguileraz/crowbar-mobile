/**
 * Mock do Keycloak Service para testes
 * 
 * Substitui Firebase Auth
 * Usado em testes para simular comportamento do Keycloak OAuth2/OIDC
 */

import { AuthorizeResult } from 'react-native-app-auth';

export interface KeycloakUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

class MockKeycloakService {
  private isAuth: boolean = false;
  private tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    accessTokenExpirationDate: string;
  } | null = null;
  private userInfo: KeycloakUserInfo | null = null;

  // Mock methods
  login = jest.fn().mockImplementation(async (): Promise<AuthorizeResult> => {
    this.isAuth = true;
    this.tokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      idToken: 'mock-id-token.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBjcm93YmFyLmNvbSJ9.signature',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
    };
    this.userInfo = {
      sub: 'user-123',
      email: 'test@crowbar.com',
      email_verified: true,
      name: 'Test User',
      preferred_username: 'testuser',
    };
    return {
      accessToken: this.tokens.accessToken,
      refreshToken: this.tokens.refreshToken,
      idToken: this.tokens.idToken,
      accessTokenExpirationDate: this.tokens.accessTokenExpirationDate,
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email'],
    };
  });

  logout = jest.fn().mockImplementation(async () => {
    this.isAuth = false;
    this.tokens = null;
    this.userInfo = null;
  });

  getAccessToken = jest.fn().mockImplementation(async () => {
    if (this.isAuth && this.tokens) {
      // Verificar se token expirou
      const expirationDate = new Date(this.tokens.accessTokenExpirationDate);
      const now = new Date();
      if (expirationDate.getTime() - now.getTime() < 60000) {
        // Token expirado, renovar
        await this.refreshTokens();
      }
      return this.tokens.accessToken;
    }
    return null;
  });

  refreshTokens = jest.fn().mockImplementation(async () => {
    if (this.tokens) {
      this.tokens = {
        ...this.tokens,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      };
      return this.tokens;
    }
    return null;
  });

  isAuthenticated = jest.fn().mockImplementation(async () => {
    return this.isAuth && this.tokens !== null;
  });

  getUserInfo = jest.fn().mockImplementation(async () => {
    return this.userInfo;
  });

  // Helper methods para testes
  setAuthenticated = (authenticated: boolean) => {
    this.isAuth = authenticated;
    if (!authenticated) {
      this.tokens = null;
      this.userInfo = null;
    }
  };

  setUserInfo = (userInfo: KeycloakUserInfo) => {
    this.userInfo = userInfo;
  };

  setTokens = (tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    accessTokenExpirationDate: string;
  }) => {
    this.tokens = tokens;
    this.isAuth = true;
  };

  reset = () => {
    this.isAuth = false;
    this.tokens = null;
    this.userInfo = null;
    jest.clearAllMocks();
  };
}

const mockKeycloakService = new MockKeycloakService();

export default mockKeycloakService;
