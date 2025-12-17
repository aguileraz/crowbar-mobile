import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme, Snackbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  selectIsOnline,
  selectSyncStatus,
  syncOfflineData,
} from '../store/slices/offlineSlice';

interface SyncButtonProps {
  onSyncComplete?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Botão para forçar sincronização manual
 * Mostra feedback visual do status da sincronização
 */
export const SyncButton: React.FC<SyncButtonProps> = ({
  onSyncComplete,
  variant = 'outlined',
  _size = 'medium',
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSync = async () => {
    try {
      const _result = await dispatch(syncOfflineData(true)).unwrap();
      
      // Mostrar resultado
      const successCount = Object.values(_result.syncResults).filter(
        (_status) => status === 'fulfilled'
      ).length;
      const totalCount = Object.keys(_result.syncResults).length;
      
      setSnackbarMessage(
        `Sincronização concluída: ${successCount}/${totalCount} itens atualizados`
      );
      setShowSnackbar(true);
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      setSnackbarMessage(`Erro na sincronização: ${error}`);
      setShowSnackbar(true);
    }
  };

  const getButtonProps = () => {
    const isLoading = syncStatus === 'syncing';
    const disabled = !isOnline || isLoading;
    
    return {
      mode: variant,
      onPress: handleSync,
      loading: isLoading,
      disabled,
      icon: isLoading ? undefined : 'sync',
      style: getButtonStyle(),
    };
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (_size === 'small') {
      baseStyle.push(styles.buttonSmall);
    } else if (_size === 'large') {
      baseStyle.push(styles.buttonLarge);
    }
    
    return baseStyle;
  };

  const getButtonText = () => {
    if (syncStatus === 'syncing') return 'Sincronizando...';
    if (!isOnline) return 'Offline';
    return 'Sincronizar';
  };

  return (
    <>
      <Button {...getButtonProps()}>
        {getButtonText()}
      </Button>
      
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
            backgroundColor: snackbarMessage.includes('Erro')
              ? theme.colors.error
              : theme.colors.primary,
          },
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
  buttonSmall: {
    height: 32,
  },
  buttonLarge: {
    height: 48,
  },
  snackbar: {
    bottom: 80, // Acima da bottom navigation
  },
});

export default SyncButton;