/**
 * Mock para @react-native-firebase/analytics
 *
 * Firebase Analytics é usado para tracking de eventos de usuário.
 * Este mock permite que os testes rodem sem dependência do Firebase real.
 */

const mockAnalytics = {
  // Métodos principais
  logEvent: jest.fn((eventName, params) => Promise.resolve()),

  logAppOpen: jest.fn(() => Promise.resolve()),

  logLogin: jest.fn((method) => Promise.resolve()),

  logScreenView: jest.fn((params) => Promise.resolve()),

  logSignUp: jest.fn((method) => Promise.resolve()),

  logPurchase: jest.fn((params) => Promise.resolve()),

  logBeginCheckout: jest.fn((params) => Promise.resolve()),

  logAddToCart: jest.fn((params) => Promise.resolve()),

  logRemoveFromCart: jest.fn((params) => Promise.resolve()),

  logSearch: jest.fn((searchTerm) => Promise.resolve()),

  logShare: jest.fn((params) => Promise.resolve()),

  logSelectContent: jest.fn((params) => Promise.resolve()),

  logViewItem: jest.fn((params) => Promise.resolve()),

  logViewItemList: jest.fn((params) => Promise.resolve()),

  logAddPaymentInfo: jest.fn((params) => Promise.resolve()),

  logAddShippingInfo: jest.fn((params) => Promise.resolve()),

  // User properties
  setUserId: jest.fn((userId) => Promise.resolve()),

  setUserProperty: jest.fn((name, value) => Promise.resolve()),

  setUserProperties: jest.fn((properties) => Promise.resolve()),

  // Analytics settings
  setAnalyticsCollectionEnabled: jest.fn((enabled) => Promise.resolve()),

  setSessionTimeoutDuration: jest.fn((milliseconds) => Promise.resolve()),

  resetAnalyticsData: jest.fn(() => Promise.resolve()),

  // App instance
  getAppInstanceId: jest.fn(() => Promise.resolve('mock-app-instance-id')),
};

// Default export
export default jest.fn(() => mockAnalytics);

// Named exports para compatibilidade
export const firebase = {
  analytics: jest.fn(() => mockAnalytics),
};
