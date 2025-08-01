import Config from 'react-native-config';

/**
 * Environment configuration for Crowbar Mobile
 * Centralizes all environment variables with type safety
 */

export interface EnvironmentConfig {
  // Environment
  NODE_ENV: string;
  
  // API Configuration
  API_BASE_URL: string;
  SOCKET_URL: string;
  API_TIMEOUT: number;
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  
  // App Configuration
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  ANALYTICS_ENABLED: boolean;
  
  // Development Configuration
  FLIPPER_ENABLED: boolean;
  DEV_MENU_ENABLED: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Parse string to boolean with fallback
 */
const parseBoolean = (value: string | undefined, fallback: boolean = false): boolean => {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
};

/**
 * Parse string to number with fallback
 */
const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Environment configuration object
 * All values are parsed and validated with fallbacks
 */
export const env: EnvironmentConfig = {
  // Environment
  NODE_ENV: Config.NODE_ENV || 'development',
  
  // API Configuration
  API_BASE_URL: Config.API_BASE_URL || 'https://crowbar-backend-staging.azurewebsites.net/api/v1',
  SOCKET_URL: Config.SOCKET_URL || 'https://crowbar-backend-staging.azurewebsites.net',
  API_TIMEOUT: parseNumber(Config.API_TIMEOUT, 10000),
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: Config.FIREBASE_PROJECT_ID || 'crowbar-mobile-dev',
  FIREBASE_APP_ID: Config.FIREBASE_APP_ID || '',
  FIREBASE_API_KEY: Config.FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: Config.FIREBASE_AUTH_DOMAIN || 'crowbar-mobile-dev.firebaseapp.com',
  FIREBASE_STORAGE_BUCKET: Config.FIREBASE_STORAGE_BUCKET || 'crowbar-mobile-dev.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: Config.FIREBASE_MESSAGING_SENDER_ID || '',
  
  // App Configuration
  APP_VERSION: Config.APP_VERSION || '1.0.0',
  DEBUG_MODE: parseBoolean(Config.DEBUG_MODE, __DEV__),
  ANALYTICS_ENABLED: parseBoolean(Config.ANALYTICS_ENABLED, false),
  
  // Development Configuration
  FLIPPER_ENABLED: parseBoolean(Config.FLIPPER_ENABLED, __DEV__),
  DEV_MENU_ENABLED: parseBoolean(Config.DEV_MENU_ENABLED, __DEV__),
  LOG_LEVEL: (Config.LOG_LEVEL as any) || 'debug',
};

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    'API_BASE_URL',
    'SOCKET_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => !env[varName as keyof EnvironmentConfig]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => env.NODE_ENV === 'production';

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => env.NODE_ENV === 'staging';

export default env;