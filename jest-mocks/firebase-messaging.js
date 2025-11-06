/**
 * Mock for @react-native-firebase/messaging
 * Package removed during Keycloak/Gotify migration
 * This mock prevents tests from failing
 */

// Firebase Messaging AuthorizationStatus constants
const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

const mockMessaging = () => ({
  requestPermission: jest.fn(() => Promise.resolve(AuthorizationStatus.AUTHORIZED)),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  onMessage: jest.fn(),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(),
  hasPermission: jest.fn(() => Promise.resolve(AuthorizationStatus.AUTHORIZED)),
  deleteToken: jest.fn(() => Promise.resolve()),
  onTokenRefresh: jest.fn(),
});

module.exports = mockMessaging;
module.exports.default = mockMessaging;
module.exports.AuthorizationStatus = AuthorizationStatus;
module.exports.FirebaseMessagingTypes = {
  AuthorizationStatus,
};
