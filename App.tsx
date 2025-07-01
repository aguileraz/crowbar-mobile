/**
 * Crowbar Mobile App
 * React Native application for project management
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import configurations
import { store, persistor } from './src/store';
import { initializeFirebaseServices } from './src/config/firebase';
import { validateEnvironment } from './src/config/env';

// Import navigation
import AppNavigator from './src/navigation/AppNavigator';

// Import components
import LoadingScreen from './src/components/LoadingScreen';

/**
 * Main App Component
 * Sets up providers and initializes services
 */
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  /**
   * Initialize app services
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Validate environment variables
        validateEnvironment();

        // Initialize Firebase services
        await initializeFirebaseServices();

        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <PaperProvider>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor="transparent"
              translucent
            />
            <AppNavigator />
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

export default App;
