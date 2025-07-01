/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Mock react-native-config
jest.mock('react-native-config', () => ({
  NODE_ENV: 'test',
  API_BASE_URL: 'http://localhost:3000/api/v1',
  SOCKET_URL: 'http://localhost:3000',
  API_TIMEOUT: '10000',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_APP_ID: 'test-app-id',
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  APP_VERSION: '1.0.0-test',
  DEBUG_MODE: 'true',
  ANALYTICS_ENABLED: 'false',
  FLIPPER_ENABLED: 'false',
  DEV_MENU_ENABLED: 'false',
  LOG_LEVEL: 'debug',
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: null,
}));

jest.mock('@react-native-firebase/firestore', () => () => ({
  enableNetwork: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('test-token')),
  onTokenRefresh: jest.fn(),
}));

jest.mock('@react-native-firebase/analytics', () => () => ({
  logEvent: jest.fn(() => Promise.resolve()),
}));

describe('App', () => {
  test('renders correctly', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<App />);
    });
  });

  test('creates app component without crashing', () => {
    expect(() => {
      ReactTestRenderer.create(<App />);
    }).not.toThrow();
  });
});
