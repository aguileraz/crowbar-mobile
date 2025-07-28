// Appium configuration for Crowbar Mobile
module.exports = {
  // Server configuration
  server: {
    host: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT || '4723'),
    path: '/wd/hub',
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // Android capabilities
  android: {
    platformName: 'Android',
    platformVersion: process.env.ANDROID_API_LEVEL || '31',
    deviceName: process.env.DEVICE_NAME || 'Pixel 4',
    automationName: 'UiAutomator2',
    app: process.env.APK_PATH || '/app/app-release.apk',
    appPackage: 'com.crowbar.mobile',
    appActivity: 'com.crowbar.mobile.MainActivity',
    noReset: false,
    fullReset: false,
    autoGrantPermissions: true,
    disableWindowAnimation: true,
    skipDeviceInitialization: true,
    skipServerInstallation: true,
    ignoreUnimportantViews: true,
    settings: {
      snapshotMaxDepth: 50,
      customFindModules: ['ai'],
      shouldUseCompactResponses: false
    }
  },

  // Test configuration
  test: {
    timeout: process.env.TEST_TIMEOUT || 300000, // 5 minutes
    retries: process.env.TEST_RETRIES || 1,
    bail: process.env.TEST_BAIL || false,
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    videoRecording: process.env.VIDEO_RECORDING === 'true'
  },

  // Timeouts (in milliseconds)
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000,
    elementResponse: 10000,
    appiumNew: 60000
  },

  // Device-specific configurations
  devices: {
    'android-31': {
      platformVersion: '12.0',
      deviceName: 'Pixel 4',
      systemPort: 8200
    },
    'android-26': {
      platformVersion: '8.0',
      deviceName: 'Pixel 2',
      systemPort: 8201
    },
    'android-21': {
      platformVersion: '5.0',
      deviceName: 'Nexus 5',
      systemPort: 8202
    }
  },

  // Commands for different operations
  commands: {
    launchApp: {
      command: 'mobile:launchApp',
      params: { appPackage: 'com.crowbar.mobile' }
    },
    closeApp: {
      command: 'mobile:closeApp',
      params: { appPackage: 'com.crowbar.mobile' }
    },
    clearApp: {
      command: 'mobile:clearApp',
      params: { appPackage: 'com.crowbar.mobile' }
    }
  }
}