module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native.+|react-redux|@reduxjs|redux-persist|@react-navigation|react-native-paper|react-native-vector-icons|react-native-config|@react-native-firebase|@react-native-community|@notifee|react-native-app-auth|invariant)/)',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*setup\\.ts$',
    '.*testConfig\\.ts$',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native/js-polyfills/error-guard': '<rootDir>/jest-mocks/error-guard.js',
    '@react-native-firebase/messaging': '<rootDir>/jest-mocks/firebase-messaging.js',
    '@react-native-firebase/analytics': '<rootDir>/jest-mocks/firebase-analytics.js',
    'react-native-app-auth': '<rootDir>/jest-mocks/react-native-app-auth.js',
  },
  testTimeout: 10000,
  globals: {
    __DEV__: true,
  },
};