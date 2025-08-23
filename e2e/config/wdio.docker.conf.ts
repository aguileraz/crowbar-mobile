import type { Options } from '@wdio/types';
import { config as baseConfig } from './wdio.conf';

const apiLevel = process.env.API_LEVEL || '31';
const deviceName = process.env.DEVICE_NAME || 'Pixel 4';
const androidVersion = process.env.ANDROID_VERSION || '12';
const appiumHost = process.env.APPIUM_HOST || 'localhost';
const appiumPort = process.env.APPIUM_PORT || '4723';

// Map API levels to emulator ports
const portMap: Record<string, number> = {
  '21': 5554,
  '23': 5556,
  '26': 5558,
  '28': 5560,
  '31': 5562,
  '34': 5564,
};

const dockerConfig: Options.Testrunner = {
  ...baseConfig,
  
  hostname: appiumHost,
  port: parseInt(appiumPort, 10),
  path: '/',
  
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': deviceName,
    'appium:platformVersion': androidVersion,
    'appium:automationName': 'UiAutomator2',
    'appium:app': '/apk/debug/app-debug.apk',
    'appium:appPackage': 'com.crowbar.app',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:androidInstallTimeout': 90000,
    'appium:adbExecTimeout': 30000,
    'appium:systemPort': 8200 + parseInt(apiLevel, 10),
    'appium:udid': `emulator-${portMap[apiLevel]}`,
    'appium:disableWindowAnimation': true,
    'appium:settings[waitForIdleTimeout]': 10,
    'appium:settings[waitForSelectorTimeout]': 10,
    'appium:skipDeviceInitialization': false,
    'appium:skipServerInstallation': false,
    'appium:ignoreHiddenApiPolicyError': true,
  }],
  
  specs: [
    './e2e/specs/docker/**/*.spec.ts'
  ],
  
  exclude: [
    './e2e/specs/local/**/*.spec.ts'
  ],
  
  maxInstances: 1,
  
  logLevel: process.env.DEBUG === 'true' ? 'debug' : 'info',
  
  bail: 0,
  
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  services: [
    ['appium', {
      args: {
        address: appiumHost,
        port: appiumPort,
        relaxedSecurity: true,
      },
      logPath: './logs/',
    }]
  ],
  
  framework: 'mocha',
  
  reporters: [
    'spec',
    ['allure', {
      outputDir: `/results/api-${apiLevel}/allure-results`,
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
      useCucumberStepReporter: false,
      addConsoleLogs: true,
    }],
    ['junit', {
      outputDir: `/results/api-${apiLevel}`,
      outputFileFormat: function() {
        return `junit-results-api-${apiLevel}.xml`;
      }
    }]
  ],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
    retries: 2,
  },
  
  before: async function(capabilities, specs) {
    console.log(`🚀 Starting tests for Android API ${apiLevel}`);
    console.log(`📱 Device: ${deviceName} (Android ${androidVersion})`);
    console.log(`🔗 Appium: ${appiumHost}:${appiumPort}`);
    
    // Wait for app to be ready
    await driver.pause(3000);
  },
  
  beforeTest: async function(test) {
    console.log(`\n📝 Running test: ${test.title}`);
    
    // Take screenshot before each test
    await driver.saveScreenshot(`/results/api-${apiLevel}/screenshots/before-${test.title}.png`);
  },
  
  afterTest: async function(test, context, { error, result, duration, passed, retries }) {
    if (!passed) {
      console.log(`❌ Test failed: ${test.title}`);
      await driver.saveScreenshot(`/results/api-${apiLevel}/screenshots/failed-${test.title}.png`);
      
      // Get page source for debugging
      const pageSource = await driver.getPageSource();
      const fs = require('fs');
      fs.writeFileSync(
        `/results/api-${apiLevel}/page-source-${test.title}.xml`,
        pageSource
      );
    } else {
      console.log(`✅ Test passed: ${test.title} (${duration}ms)`);
    }
  },
  
  after: async function(result, capabilities, specs) {
    console.log(`\n📊 Test Results for API ${apiLevel}:`);
    console.log(`   Passed: ${result === 0 ? '✅' : '❌'}`);
    
    // Generate visual comparison report
    const visualReport = {
      apiLevel,
      deviceName,
      androidVersion,
      timestamp: new Date().toISOString(),
      passed: result === 0,
    };
    
    const fs = require('fs');
    fs.writeFileSync(
      `/results/api-${apiLevel}/visual-report.json`,
      JSON.stringify(visualReport, null, 2)
    );
  },
};

export const config = dockerConfig;