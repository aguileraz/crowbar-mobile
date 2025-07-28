/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/tests/*.test.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  
  // Remove Detox global setup/teardown for configuration tests
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Crowbar Mobile E2E Config Tests',
      outputPath: 'e2e/reports/config-test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: true,
      theme: 'darkTheme'
    }]
  ],
  
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.mock.js'],
  
  // Mock Detox environment for configuration testing
  testEnvironment: 'node',
  
  collectCoverage: false,
};