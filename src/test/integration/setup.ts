/**
 * Setup for integration tests
 * Configures test environment for API integration testing
 */

import { store } from '../../store';
import { httpClient } from '../../services/httpClient';
import logger from '../../services/loggerService';

// Test configuration
export const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'https://crowbar-backend-staging.azurewebsites.net/api',
  TEST_USER_EMAIL: 'test@crowbar.com',
  TEST_USER_PASSWORD: 'testpassword123',
  TIMEOUT: 10000,
};

// Test user credentials for integration tests
export const TEST_CREDENTIALS = {
  email: TEST_CONFIG.TEST_USER_EMAIL,
  password: TEST_CONFIG.TEST_USER_PASSWORD,
};

// Mock data for testing
export const MOCK_BOX_DATA = {
  name: 'Test Integration Box',
  description: 'Box created for integration testing',
  price: 19.99,
  category: 'test',
  image_url: 'https://example.com/test-box.jpg',
};

export const MOCK_ADDRESS_DATA = {
  type: 'home',
  street: '123 Test Street',
  number: '456',
  neighborhood: 'Test Neighborhood',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
  country: 'Brazil',
  is_default: true,
};

export const MOCK_PAYMENT_METHOD_DATA = {
  type: 'credit_card',
  card_number: '4111111111111111',
  expiry_month: '12',
  expiry_year: '2025',
  cvv: '123',
  holder_name: 'Test User',
};

/**
 * Setup test environment
 */
export const setupIntegrationTest = async () => {
  // Configure HTTP client for testing
  httpClient.defaults.baseURL = TEST_CONFIG.API_BASE_URL;
  httpClient.defaults.timeout = TEST_CONFIG.TIMEOUT;
  
  // Clear any existing auth state
  store.dispatch({ type: 'auth/logout' });
  
  // Add request interceptor for testing
  httpClient.interceptors.request.use(
    (config) => {
      // Add test headers
      config.headers = {
        ...config.headers,
        'X-Test-Environment': 'integration',
        'X-Test-Run-ID': Date.now().toString(),
      };
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor for testing
  httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // Log API errors for debugging
      logger.error('API Integration Test Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
};

/**
 * Cleanup test environment
 */
export const cleanupIntegrationTest = async () => {
  // Clear auth state
  store.dispatch({ type: 'auth/logout' });
  
  // Clear HTTP client interceptors
  httpClient.interceptors.request.clear();
  httpClient.interceptors.response.clear();
};

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Create a test user for integration tests
 */
export const createTestUser = async () => {
  try {
    const response = await httpClient.post('/auth/register', {
      name: 'Test User',
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
      password_confirmation: TEST_CREDENTIALS.password,
    });
    
    return response.data;
  } catch (error: any) {
    // If user already exists, that's fine for testing
    if (error.response?.status === 422) {
      return null;
    }
    throw error;
  }
};

/**
 * Login test user
 */
export const loginTestUser = async () => {
  const response = await httpClient.post('/auth/login', TEST_CREDENTIALS);
  
  // Set auth token for subsequent requests
  const token = response.data.token;
  httpClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  
  return response.data;
};

/**
 * Logout test user
 */
export const logoutTestUser = async () => {
  try {
    await httpClient.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors in tests
  } finally {
    delete httpClient.defaults.headers.common.Authorization;
  }
};

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  try {
    // Delete test boxes, orders, etc.
    // This would depend on your API having cleanup endpoints
    await httpClient.delete('/test/cleanup');
  } catch (error) {
    // Ignore cleanup errors
    logger.warn('Test cleanup failed:', error);
  }
};

/**
 * Check if API is available
 */
export const checkAPIAvailability = async (): Promise<boolean> => {
  try {
    await httpClient.get('/health');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Skip test if API is not available
 */
export const skipIfAPIUnavailable = async () => {
  const isAvailable = await checkAPIAvailability();
  if (!isAvailable) {
    logger.warn('API not available, skipping integration test');
    return true;
  }
  return false;
};

// Export test utilities
export const testUtils = {
  setupIntegrationTest,
  cleanupIntegrationTest,
  waitFor,
  createTestUser,
  loginTestUser,
  logoutTestUser,
  cleanupTestData,
  checkAPIAvailability,
  skipIfAPIUnavailable,
};
