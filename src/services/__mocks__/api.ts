/**
 * Mock do ApiClient para testes unitários
 * Simula todas as operações HTTP sem fazer chamadas de rede reais
 */

export const apiClient = {
  // Métodos HTTP básicos
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),

  // Métodos de autenticação
  setAuthToken: jest.fn(),
  getAuthToken: jest.fn(() => null),
  clearAuthToken: jest.fn(),

  // Métodos utilitários
  request: jest.fn(),
};

export default apiClient;
