import { FirebaseApp, initializeApp, getApps } from '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import { env } from './env';

/**
 * Firebase configuration and initialization
 * Centralizes all Firebase services setup
 */

let firebaseApp: FirebaseApp;

/**
 * Initialize Firebase app if not already initialized
 */
export const initializeFirebase = (): FirebaseApp => {
  if (getApps().length === 0) {
    firebaseApp = initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      appId: env.FIREBASE_APP_ID,
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    });
  } else {
    firebaseApp = getApps()[0];
  }
  
  return firebaseApp;
};

/**
 * Firebase Auth service
 */
export const firebaseAuth = (): FirebaseAuthTypes.Module => {
  return auth();
};

/**
 * Firebase Firestore service
 */
export const firebaseFirestore = (): FirebaseFirestoreTypes.Module => {
  return firestore();
};

/**
 * Firebase Messaging service
 */
export const firebaseMessaging = (): FirebaseMessagingTypes.Module => {
  return messaging();
};

/**
 * Firebase Analytics service
 */
export const firebaseAnalytics = () => {
  return analytics();
};

/**
 * Test Firebase connectivity
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Test Firestore connection
    await firebaseFirestore().enableNetwork();
    
    // Test Auth connection
    const currentUser = firebaseAuth().currentUser;
    console.log('Firebase Auth initialized:', currentUser !== undefined);
    
    // Test Analytics (if enabled)
    if (env.ANALYTICS_ENABLED) {
      await firebaseAnalytics().logEvent('firebase_test', {
        test_parameter: 'connection_test',
      });
    }
    
    console.log('✅ Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

/**
 * Configure Firebase messaging for push notifications
 */
export const configurePushNotifications = async (): Promise<string | null> => {
  try {
    // Request permission for iOS
    const authStatus = await firebaseMessaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // Get FCM token
      const fcmToken = await firebaseMessaging().getToken();
      console.log('FCM Token:', fcmToken);
      
      // Listen to token refresh
      firebaseMessaging().onTokenRefresh(token => {
        console.log('FCM Token refreshed:', token);
        // TODO: Send token to backend
      });
      
      return fcmToken;
    } else {
      console.log('Push notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error configuring push notifications:', error);
    return null;
  }
};

/**
 * Initialize Firebase services
 */
export const initializeFirebaseServices = async (): Promise<void> => {
  try {
    // Initialize Firebase app
    initializeFirebase();
    
    // Test connection
    await testFirebaseConnection();
    
    // Configure push notifications
    await configurePushNotifications();
    
    console.log('✅ Firebase services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase services:', error);
    throw error;
  }
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
