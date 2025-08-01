import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Portal, Snackbar, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectIsOnline, selectPendingActions } from '../store/slices/offlineSlice';
import NetworkStatusBar from './NetworkStatusBar';
import { useOffline } from '../hooks/useOffline';

interface OfflineNavigationWrapperProps {
  children: React.ReactNode;
  showNetworkBar?: boolean;
  showPendingActionsAlert?: boolean;
}

/**
 * Wrapper para navegação com suporte offline
 * Gerencia estado offline, mostra alertas e processa ações pendentes
 */
export const OfflineNavigationWrapper: React.FC<OfflineNavigationWrapperProps> = ({
  children,
  showNetworkBar = true,
  showPendingActionsAlert = true,
}) => {
  const theme = useTheme();
  const isOnline = useSelector(selectIsOnline);
  const pendingActions = useSelector(selectPendingActions);
  const { sync, hasPendingActions } = useOffline();

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousOnlineStatus, setPreviousOnlineStatus] = useState(isOnline);

  // Detectar mudanças no status da conexão
  useEffect(() => {
    if (previousOnlineStatus !== isOnline) {
      setPreviousOnlineStatus(isOnline);
      
      if (isOnline) {
        // Voltou online
        setSnackbarMessage('Conexão restaurada');
        setShowSnackbar(true);
        
        // Sincronizar ações pendentes
        if (hasPendingActions) {
          sync().catch((_error) => {
            // TODO: Handle sync error properly
          });
        }
      } else {
        // Ficou offline
        setSnackbarMessage('Modo offline ativado');
        setShowSnackbar(true);
      }
    }
  }, [isOnline, previousOnlineStatus, hasPendingActions, sync]);

  // Mostrar alerta de ações pendentes quando necessário
  useEffect(() => {
    if (showPendingActionsAlert && pendingActions.length > 0 && !isOnline) {
      // Mostrar alerta apenas se houver muitas ações pendentes
      if (pendingActions.length >= 5) {
        Alert.alert(
          'Ações Pendentes',
          `Você tem ${pendingActions.length} ações aguardando sincronização. Elas serão processadas quando a conexão for restaurada.`,
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      }
    }
  }, [pendingActions.length, isOnline, showPendingActionsAlert]);

  // Verificar se pode navegar para determinadas telas offline
  const _canNavigateOffline = (screenName: string): boolean => {
    const offlineAllowedScreens = [
      'Home',
      'Boxes',
      'Cart',
      'Profile',
      'Settings',
      'About',
    ];
    
    return offlineAllowedScreens.includes(screenName);
  };

  // Interceptar navegação para telas que requerem conexão
  const _handleNavigationStateChange = (state: any) => {
    if (!isOnline && state?.routes) {
      const currentRoute = state.routes[state.0];
      
      // Verificar se a tela atual requer conexão
      const onlineRequiredScreens = [
        'Checkout',
        'Payment',
        'OrderHistory',
        'Support',
      ];
      
      if (onlineRequiredScreens.includes(currentRoute.name)) {
        setSnackbarMessage('Esta funcionalidade requer conexão com a internet');
        setShowSnackbar(true);
        
        // Aqui você poderia navegar de volta ou para uma tela offline
        // navigation.goBack();
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra de status de rede */}
      {showNetworkBar && <NetworkStatusBar />}
      
      {/* Conteúdo principal */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Snackbar para notificações */}
      <Portal>
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setShowSnackbar(false),
          }}
          style={[
            styles.snackbar,
            {
              backgroundColor: isOnline ? theme.colors.primary : theme.colors.error,
            },
          ]}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  snackbar: {
    bottom: 80, // Acima da bottom navigation
  },
});

export default OfflineNavigationWrapper;