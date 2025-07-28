module.exports = {
  extends: '../.eslintrc.js',
  globals: {
    // Detox globals
    device: 'readonly',
    element: 'readonly',
    by: 'readonly',
    waitFor: 'readonly',
    expect: 'readonly',
    // Jest globals
    jasmine: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    afterAll: 'readonly',
    afterEach: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    jest: 'readonly',
    // Custom helpers from setup.js
    sleep: 'readonly',
    waitForElement: 'readonly',
    waitForElementToDisappear: 'readonly',
    waitAndTap: 'readonly',
    waitAndType: 'readonly',
    scrollToElement: 'readonly',
    waitForLoading: 'readonly',
    waitForScreen: 'readonly',
    logTest: 'readonly',
    mockNotifications: 'readonly',
    TIMEOUT_CONFIG: 'readonly',
    DEVICE_CONFIG: 'readonly'
  },
  env: {
    jest: true,
    'jest/globals': true
  },
  rules: {
    // E2E tests may have long lines due to selectors
    'max-len': 'off',
    // E2E tests may use console for debugging
    'no-console': 'warn',
    // Allow unused vars in test descriptions
    '@typescript-eslint/no-unused-vars': 'warn'
  }
};