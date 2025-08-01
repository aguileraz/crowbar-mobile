/* global browser */
const appiumConfig = require('./appium.config')

exports.config = {
  // Test runner services
  runner: 'local',
  
  // Test files
  specs: [
    './specs/**/*.spec.ts'
  ],
  
  // Exclude specific test files
  exclude: [],
  
  // Capabilities
  maxInstances: parseInt(process.env.MAX_INSTANCES || '1', 10),
  capabilities: [{
    ...appiumConfig.android,
    'appium:options': {
      ...appiumConfig.android,
      systemPort: 8200
    }
  }],
  
  // Test configurations
  logLevel: process.env.LOG_LEVEL || 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: appiumConfig.timeouts.implicit,
  connectionRetryTimeout: appiumConfig.timeouts.appiumNew,
  connectionRetryCount: 3,
  
  // Services
  services: [
    ['appium', {
      args: {
        address: appiumConfig.server.host,
        port: appiumConfig.server.port,
        relaxedSecurity: true,
        log: `${process.env.LOG_DIR || './logs'}/appium.log`
      },
      command: 'appium'
    }]
  ],
  
  // Framework
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: appiumConfig.test.timeout,
    retries: appiumConfig.test.retries
  },
  
  // Reporters
  reporters: [
    'spec',
    ['allure', {
      outputDir: process.env.TEST_RESULTS_DIR || './test-results',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
      disableMochaHooks: false
    }],
    ['junit', {
      outputDir: process.env.TEST_RESULTS_DIR || './test-results',
      outputFileFormat: function(options) {
        return `junit-${options.cid}.xml`
      }
    }]
  ],
  
  // Hooks
  before: function (_capabilities, _specs) {
    // Set up TypeScript
    require('ts-node').register({
      transpileOnly: true,
      project: 'e2e/tsconfig.json'
    })
  },
  
  beforeSession: function (_config, _capabilities, _specs) {

  },
  
  afterTest: async function(test, _context, { _error, _result, _duration, passed, _retries }) {
    if (!passed && appiumConfig.test.screenshotOnFailure) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filepath = `${process.env.SCREENSHOT_DIR || './screenshots'}/${test.title}-${timestamp}.png`
      await browser.saveScreenshot(filepath)

    }
  },
  
  after: function (_result, _capabilities, _specs) {

  },
  
  onComplete: function(_exitCode, _config, _capabilities, _results) {

  }
}