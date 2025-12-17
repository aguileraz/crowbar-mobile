const mockFunctions = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
};

// Named export for tests that use { httpClient }
export const httpClient = mockFunctions;

// Default export for tests that use default import
export default mockFunctions;