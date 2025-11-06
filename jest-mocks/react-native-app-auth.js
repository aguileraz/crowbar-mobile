// Mock for react-native-app-auth
const mockAuthConfig = {
  issuer: 'https://test-issuer.com',
  clientId: 'test-client-id',
  redirectUrl: 'com.crowbar.mobile://oauth',
  scopes: ['openid', 'profile', 'email'],
};

const mockAuthorizeResult = {
  accessToken: 'mock-access-token',
  accessTokenExpirationDate: '2025-12-31T23:59:59Z',
  refreshToken: 'mock-refresh-token',
  idToken: 'mock-id-token',
  tokenType: 'Bearer',
};

export const authorize = jest.fn(() => Promise.resolve(mockAuthorizeResult));

export const refresh = jest.fn((config, { refreshToken }) => 
  Promise.resolve({
    ...mockAuthorizeResult,
    accessToken: 'mock-refreshed-access-token',
  })
);

export const revoke = jest.fn(() => Promise.resolve());

export default {
  authorize,
  refresh,
  revoke,
};
