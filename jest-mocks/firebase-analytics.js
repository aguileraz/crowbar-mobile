/**
 * Mock para @react-native-firebase/analytics
 *
 * Firebase Analytics é usado para tracking de eventos de usuário.
 * Este mock permite que os testes rodem sem dependência do Firebase real.
 */

const mockAnalytics = {
  // Métodos principais
  logEvent: jest.fn((_eventName, _params) => Promise.resolve()),

  logAppOpen: jest.fn(() => Promise.resolve()),

  logLogin: jest.fn((_method) => Promise.resolve()),

  logScreenView: jest.fn((_params) => Promise.resolve()),

  logSignUp: jest.fn((_method) => Promise.resolve()),

  logPurchase: jest.fn((_params) => Promise.resolve()),

  logBeginCheckout: jest.fn((_params) => Promise.resolve()),

  logAddToCart: jest.fn((_params) => Promise.resolve()),

  logRemoveFromCart: jest.fn((_params) => Promise.resolve()),

  logSearch: jest.fn((_searchTerm) => Promise.resolve()),

  logShare: jest.fn((_params) => Promise.resolve()),

  logSelectContent: jest.fn((_params) => Promise.resolve()),

  logViewItem: jest.fn((_params) => Promise.resolve()),

  logViewItemList: jest.fn((_params) => Promise.resolve()),

  logAddPaymentInfo: jest.fn((_params) => Promise.resolve()),

  logAddShippingInfo: jest.fn((_params) => Promise.resolve()),

  // User properties
  setUserId: jest.fn((_userId) => Promise.resolve()),

  setUserProperty: jest.fn((_name, _value) => Promise.resolve()),

  setUserProperties: jest.fn((_properties) => Promise.resolve()),

  // Analytics settings
  setAnalyticsCollectionEnabled: jest.fn((_enabled) => Promise.resolve()),

  setSessionTimeoutDuration: jest.fn((_milliseconds) => Promise.resolve()),

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
