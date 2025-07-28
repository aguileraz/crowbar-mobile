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
  maxInstances: parseInt(process.env.MAX_INSTANCES || '1'),
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
  before: function (capabilities, specs) {
    // Set up TypeScript
    require('ts-node').register({
      transpileOnly: true,
      project: 'e2e/tsconfig.json'
    })
  },
  
  beforeSession: function (config, capabilities, specs) {
    console.log('🚀 Starting test session...')
    console.log(`📱 Device: ${capabilities['appium:deviceName']}`)
    console.log(`🤖 Android: ${capabilities['appium:platformVersion']}`)
  },
  
  afterTest: async function(test, context, { error, result, duration, passed, retries }) {
    if (!passed && appiumConfig.test.screenshotOnFailure) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filepath = `${process.env.SCREENSHOT_DIR || './screenshots'}/${test.title}-${timestamp}.png`
      await browser.saveScreenshot(filepath)
      console.log(`📸 Screenshot saved: ${filepath}`)
    }
  },
  
  after: function (result, capabilities, specs) {
    console.log('✅ Test session completed')
  },
  
  onComplete: function(exitCode, config, capabilities, results) {
    console.log('🏁 All tests completed')
    console.log(`Exit code: ${exitCode}`)
  }
}