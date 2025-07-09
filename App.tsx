/**
 * Crowbar Mobile App - Aplicativo React Native para marketplace de caixas misteriosas
 *
 * Este é o componente raiz da aplicação que configura todos os providers necessários:
 * - Redux Store com persistência
 * - React Native Paper (Material Design 3)
 * - React Navigation
 * - SafeAreaProvider
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Store e persistência
import { store, persistor } from './src/store';

// Navegação
import AppNavigator from './src/navigation/AppNavigator';

// Tema e configurações
import { theme } from './src/theme';
import { env, validateEnvironment } from './src/config/env';

// Componentes
import LoadingScreen from './src/components/LoadingScreen';
import NotificationInitializer from './src/components/NotificationInitializer';

// Configurações de desenvolvimento
if (__DEV__) {
  // Ignorar warnings específicos do React Native
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'VirtualizedLists should never be nested',
  ]);
}

/**
 * Componente principal da aplicação
 */
const App: React.FC = () => {
  useEffect(() => {
    // Validar variáveis de ambiente na inicialização
    try {
      validateEnvironment();
      console.log('✅ Environment validation passed');
      console.log(`🚀 App starting in ${env.NODE_ENV} mode`);
      console.log(`📡 API Base URL: ${env.API_BASE_URL}`);
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <PaperProvider theme={theme}>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={theme.colors.surface}
                translucent={false}
              />
              <NotificationInitializer />
              <AppNavigator />
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
