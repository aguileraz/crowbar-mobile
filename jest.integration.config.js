module.exports = {
  preset: 'react-native',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/services/__tests__/integration/**/*.test.ts',
    '<rootDir>/src/services/__tests__/integration/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/services/__tests__/integration/setup.ts',
  ],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/services/**/*.ts',
    '!src/services/**/*.test.ts',
    '!src/services/**/__tests__/**',
    '!src/services/**/__mocks__/**',
    '!src/services/**/index.ts',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  maxWorkers: 2,
  verbose: true,
  bail: false,
  errorOnDeprecated: true,
  testEnvironmentOptions: {
    jsdom: {
      url: 'http://localhost:3000',
    },
  },
  globals: {
    __DEV__: true,
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-config|@react-native-firebase|axios-mock-adapter)/)',
  ],
};