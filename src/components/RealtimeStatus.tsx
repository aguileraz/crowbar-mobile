import React, {} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Text,
  Chip,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  connectRealtime,
  disconnectRealtime,
  selectIsConnected,
  selectConnectionStatus,
  selectRealtimeError,
  selectOnlineUsers,
} from '../store/slices/realtimeSlice';
import { theme, getSpacing } from '../theme';

/**
 * Componente de Status de Conexão em Tempo Real
 * Exibe status da conexão WebSocket e controles
 */

interface RealtimeStatusProps {
  style?: ViewStyle;
  showControls?: boolean;
  showOnlineUsers?: boolean;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  style,
  showControls = false,
  showOnlineUsers = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const isConnected = useSelector(selectIsConnected);
  const connectionStatus = useSelector(selectConnectionStatus);
  const error = useSelector(selectRealtimeError);
  const onlineUsers = useSelector(selectOnlineUsers);

  // Auto-connect on mount
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      dispatch(connectRealtime());
    }
  }, [dispatch, connectionStatus]);

  /**
   * Handle connect
   */
  const handleConnect = () => {
    dispatch(connectRealtime());
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = () => {
    dispatch(disconnectRealtime());
  };

  /**
   * Get status info
   */
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          label: 'Conectando...',
          color: theme.colors.primary,
          icon: 'loading',
          backgroundColor: theme.colors.primaryContainer,
        };
      case 'connected':
        return {
          label: 'Online',
          color: '#4CAF50',
          icon: 'wifi',
          backgroundColor: '#4CAF50' + '20',
        };
      case 'disconnected':
        return {
          label: 'Offline',
          color: theme.colors.onSurfaceVariant,
          icon: 'wifi-off',
          backgroundColor: theme.colors.surfaceVariant,
        };
      case 'error':
        return {
          label: 'Erro',
          color: theme.colors.error,
          icon: 'wifi-alert',
          backgroundColor: theme.colors.errorContainer,
        };
      default:
        return {
          label: 'Desconhecido',
          color: theme.colors.onSurfaceVariant,
          icon: 'help',
          backgroundColor: theme.colors.surfaceVariant,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusContainer}>
        {/* Status Chip */}
        <Chip
          mode="flat"
          style={[
            styles.statusChip,
            { backgroundColor: statusInfo.backgroundColor },
          ]}
          textStyle={[
            styles.statusChipText,
            { color: statusInfo.color },
          ]}
          icon={connectionStatus === 'connecting' ? undefined : statusInfo.icon}
          compact
        >
          {connectionStatus === 'connecting' && (
            <ActivityIndicator
              size={12}
              color={statusInfo.color}
              style={styles.loadingIcon}
            />
          )}
          {statusInfo.label}
        </Chip>

        {/* Online Users Count */}
        {showOnlineUsers && isConnected && onlineUsers.count > 0 && (
          <Chip
            mode="flat"
            style={styles.usersChip}
            textStyle={styles.usersChipText}
            icon="account-multiple"
            compact
          >
            {onlineUsers.count} online
          </Chip>
        )}

        {/* Controls */}
        {showControls && (
          <View style={styles.controls}>
            {isConnected ? (
              <IconButton
                icon="wifi-off"
                size={16}
                onPress={handleDisconnect}
                style={styles.controlButton}
              />
            ) : (
              <IconButton
                icon="wifi"
                size={16}
                onPress={handleConnect}
                style={styles.controlButton}
                disabled={connectionStatus === 'connecting'}
              />
            )}
          </View>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText} numberOfLines={1}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  statusChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingIcon: {
    marginRight: getSpacing('xs'),
  },
  usersChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  usersChipText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  controls: {
    flexDirection: 'row',
  },
  controlButton: {
    margin: 0,
  },
  errorText: {
    fontSize: 10,
    color: theme.colors.error,
    marginTop: getSpacing('xs'),
    maxWidth: 200,
  },
});

export default RealtimeStatus;
