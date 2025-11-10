/**
 * Firebase configuration - DEPRECATED
 *
 * ⚠️ MIGRATION NOTICE:
 * This project has migrated away from Firebase to use:
 * - Keycloak (OAuth2/OIDC) for authentication → See src/services/keycloakService.ts
 * - @notifee/react-native for local notifications → See src/services/notificationService.ts
 * - Redux-based analytics → See src/services/analyticsService.ts
 *
 * Firebase packages are NOT installed in package.json.
 * All imports from @react-native-firebase/* will cause RUNTIME CRASHES.
 *
 * This file exists only as a stub to prevent import errors during migration.
 * All methods return null/false and log deprecation warnings.
 */

import logger from '../services/loggerService';

const DEPRECATION_WARNING = '⚠️ Firebase is deprecated in this project. Using Keycloak + @notifee instead.';

export const initializeFirebase = (): boolean => {
  logger.warn(DEPRECATION_WARNING);
  logger.warn('Use keycloakService for authentication instead.');
  return false;
};

export const testFirebaseConnection = async (): Promise<boolean> => {
  logger.warn(DEPRECATION_WARNING);
  logger.warn('Firebase connection test skipped - using Keycloak');
  return false;
};

export const configurePushNotifications = async (): Promise<string | null> => {
  logger.warn(DEPRECATION_WARNING);
  logger.warn('Use @notifee service for push notifications instead.');
  return null;
};

export const initializeFirebaseServices = async (): Promise<void> => {
  logger.warn(DEPRECATION_WARNING);
  logger.warn('Firebase services are not initialized. Use Keycloak and @notifee.');
};

// Stub exports to prevent import errors during migration
export const firebaseAuth = () => {
  logger.warn(DEPRECATION_WARNING);
  return null;
};

export const firebaseFirestore = () => {
  logger.warn(DEPRECATION_WARNING);
  return null;
};

export const firebaseMessaging = () => {
  logger.warn(DEPRECATION_WARNING);
  return null;
};

export const firebaseAnalytics = () => {
  logger.warn(DEPRECATION_WARNING);
  return null;
};

export default {
  initializeFirebase,
  firebaseAuth,
  firebaseFirestore,
  firebaseMessaging,
  firebaseAnalytics,
  testFirebaseConnection,
  configurePushNotifications,
  initializeFirebaseServices,
};
