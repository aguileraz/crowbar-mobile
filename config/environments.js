/**
 * Configurações de ambiente para Crowbar Mobile
 * Gerencia diferentes ambientes: development, staging, production
 */

const environments = {
  development: {
    // API Configuration
    API_BASE_URL: 'http://localhost:3000/api',
    WS_BASE_URL: 'ws://localhost:3000',

    // Firebase Configuration
    FIREBASE_CONFIG: {
      apiKey: "AIzaSyDev-Key-For-Development-Only",
      authDomain: "crowbar-dev.firebaseapp.com",
      projectId: "crowbar-dev",
      storageBucket: "crowbar-dev.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:android:dev-app-id",
      measurementId: "G-DEV-MEASUREMENT-ID"
    },
    
    // Feature Flags
    FEATURES: {
      ANALYTICS_ENABLED: true,
      CRASHLYTICS_ENABLED: false,
      PERFORMANCE_MONITORING: true,
      DEBUG_MODE: true,
      MOCK_PAYMENTS: true,
      OFFLINE_MODE: true,
      REAL_TIME_FEATURES: true,
    },
    
    // App Configuration
    APP_CONFIG: {
      LOG_LEVEL: 'debug',
      CACHE_TTL: 300000, // 5 minutes
      MAX_RETRY_ATTEMPTS: 3,
      REQUEST_TIMEOUT: 10000,
      ENABLE_FLIPPER: true,
    },
    
    // Third Party Services
    SERVICES: {
      SENTRY_DSN: null,
      AMPLITUDE_API_KEY: null,
      MIXPANEL_TOKEN: null,
    }
  },

  staging: {
    // API Configuration
    API_BASE_URL: 'https://crowbar-backend-staging.azurewebsites.net/api',
    WS_BASE_URL: 'wss://crowbar-backend-staging.azurewebsites.net',
    
    // Firebase Configuration
    FIREBASE_CONFIG: {
      apiKey: process.env.FIREBASE_API_KEY_STAGING || "AIzaSyStaging-Key-Replace-With-Real",
      authDomain: "crowbar-staging.firebaseapp.com",
      projectId: "crowbar-staging",
      storageBucket: "crowbar-staging.appspot.com",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID_STAGING || "987654321",
      appId: process.env.FIREBASE_APP_ID_STAGING || "1:987654321:android:staging-app-id",
      measurementId: process.env.FIREBASE_MEASUREMENT_ID_STAGING || "G-STAGING-MEASUREMENT-ID"
    },
    
    // Feature Flags
    FEATURES: {
      ANALYTICS_ENABLED: true,
      CRASHLYTICS_ENABLED: true,
      PERFORMANCE_MONITORING: true,
      DEBUG_MODE: false,
      MOCK_PAYMENTS: true,
      OFFLINE_MODE: true,
      REAL_TIME_FEATURES: true,
    },
    
    // App Configuration
    APP_CONFIG: {
      LOG_LEVEL: 'info',
      CACHE_TTL: 600000, // 10 minutes
      MAX_RETRY_ATTEMPTS: 3,
      REQUEST_TIMEOUT: 15000,
      ENABLE_FLIPPER: false,
    },
    
    // Third Party Services
    SERVICES: {
      SENTRY_DSN: process.env.SENTRY_DSN_STAGING,
      AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY_STAGING,
      MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN_STAGING,
    }
  },

  production: {
    // API Configuration
    API_BASE_URL: 'https://crowbar-backend.azurewebsites.net/api',
    WS_BASE_URL: 'wss://crowbar-backend.azurewebsites.net',
    
    // Firebase Configuration
    FIREBASE_CONFIG: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: "crowbar-prod.firebaseapp.com",
      projectId: "crowbar-prod",
      storageBucket: "crowbar-prod.appspot.com",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    },
    
    // Feature Flags
    FEATURES: {
      ANALYTICS_ENABLED: true,
      CRASHLYTICS_ENABLED: true,
      PERFORMANCE_MONITORING: true,
      DEBUG_MODE: false,
      MOCK_PAYMENTS: false,
      OFFLINE_MODE: true,
      REAL_TIME_FEATURES: true,
    },
    
    // App Configuration
    APP_CONFIG: {
      LOG_LEVEL: 'error',
      CACHE_TTL: 1800000, // 30 minutes
      MAX_RETRY_ATTEMPTS: 5,
      REQUEST_TIMEOUT: 20000,
      ENABLE_FLIPPER: false,
    },
    
    // Third Party Services
    SERVICES: {
      SENTRY_DSN: process.env.SENTRY_DSN_PRODUCTION,
      AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY_PRODUCTION,
      MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN_PRODUCTION,
    }
  }
};

/**
 * Get current environment configuration
 */
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const buildType = process.env.BUILD_TYPE || 'development';
  
  // Determine environment based on build type and NODE_ENV
  if (buildType === 'production' || env === 'production') {
    return 'production';
  } else if (buildType === 'staging' || env === 'staging') {
    return 'staging';
  } else {
    return 'development';
  }
};

/**
 * Get configuration for current environment
 */
const getConfig = () => {
  const currentEnv = getCurrentEnvironment();
  const config = environments[currentEnv];
  
  if (!config) {
    throw new Error(`Configuration not found for environment: ${currentEnv}`);
  }
  
  return {
    ...config,
    ENVIRONMENT: currentEnv,
    IS_DEV: currentEnv === 'development',
    IS_STAGING: currentEnv === 'staging',
    IS_PRODUCTION: currentEnv === 'production',
  };
};

/**
 * Validate required environment variables for production
 */
const validateProductionConfig = () => {
  const currentEnv = getCurrentEnvironment();
  
  if (currentEnv === 'production') {
    const requiredVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
      'FIREBASE_MEASUREMENT_ID',
      'SENTRY_DSN_PRODUCTION',
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missingVars.join(', ')}`
      );
    }
  }
};

/**
 * Initialize configuration
 */
const initializeConfig = () => {
  try {
    validateProductionConfig();
    const config = getConfig();
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development' || config.IS_DEV) {
      console.log(`🚀 Crowbar Mobile initialized for ${config.ENVIRONMENT} environment`);
      
      if (config.IS_DEV) {
        console.log('📱 Development mode enabled');
        console.log('🔧 Debug features available');
      }
    }
    
    return config;
  } catch (error) {
    // Always log configuration errors as they're critical
    console.error('❌ Configuration error:', error.message);
    throw error;
  }
};

// Export configuration
const config = initializeConfig();

export default config;
export { environments, getCurrentEnvironment, getConfig, validateProductionConfig };

// For CommonJS compatibility
module.exports = {
  default: config,
  environments,
  getCurrentEnvironment,
  getConfig,
  validateProductionConfig,
};
