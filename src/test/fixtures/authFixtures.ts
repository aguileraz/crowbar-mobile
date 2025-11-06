/**
 * Mock Fixtures para Authentication (Autenticação)
 *
 * Dados mock reutilizáveis para testes de integração de autenticação.
 */

export const mockAuthUser = {
  uid: 'firebase-uid-123',
  email: 'usuario@exemplo.com',
  displayName: 'João Silva',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
  phoneNumber: '+5511987654321',
  providerId: 'firebase',
  metadata: {
    creationTime: '2024-01-01T10:00:00Z',
    lastSignInTime: '2025-01-06T09:00:00Z',
  },
};

export const mockAuthTokens = {
  idToken: 'mock-firebase-id-token-123',
  accessToken: 'mock-access-token-123',
  refreshToken: 'mock-refresh-token-123',
  expiresIn: 3600,
  expiresAt: Date.now() + 3600000,
};

export const mockLoginRequest = {
  email: 'usuario@exemplo.com',
  password: 'senha123',
};

export const mockLoginResponse = {
  success: true,
  message: 'Login realizado com sucesso',
  user: mockAuthUser,
  tokens: mockAuthTokens,
};

export const mockRegisterRequest = {
  email: 'novo@exemplo.com',
  password: 'senha123',
  name: 'Novo Usuário',
  phone: '+5511999887766',
  cpf: '987.654.321-00',
  birthDate: '1995-05-20',
};

export const mockRegisterResponse = {
  success: true,
  message: 'Cadastro realizado com sucesso',
  user: {
    ...mockAuthUser,
    email: 'novo@exemplo.com',
    displayName: 'Novo Usuário',
  },
  tokens: mockAuthTokens,
};

export const mockResetPasswordRequest = {
  email: 'usuario@exemplo.com',
};

export const mockResetPasswordResponse = {
  success: true,
  message: 'Email de recuperação enviado com sucesso',
};

export const mockChangePasswordRequest = {
  currentPassword: 'senha123',
  newPassword: 'novaSenha456',
};

export const mockChangePasswordResponse = {
  success: true,
  message: 'Senha alterada com sucesso',
};

export const mockRefreshTokenRequest = {
  refreshToken: 'mock-refresh-token-123',
};

export const mockRefreshTokenResponse = {
  success: true,
  tokens: {
    ...mockAuthTokens,
    idToken: 'mock-firebase-id-token-456',
    accessToken: 'mock-access-token-456',
  },
};

export const mockLogoutResponse = {
  success: true,
  message: 'Logout realizado com sucesso',
};

export const mockVerifyEmailResponse = {
  success: true,
  message: 'Email verificado com sucesso',
};

export const mockSocialLoginRequest = {
  provider: 'google' as const,
  token: 'google-oauth-token-123',
};

export const mockSocialLoginResponse = {
  success: true,
  message: 'Login social realizado com sucesso',
  user: {
    ...mockAuthUser,
    providerId: 'google.com',
  },
  tokens: mockAuthTokens,
};
