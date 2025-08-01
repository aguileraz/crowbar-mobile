import React, {} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Text,
  Chip,
  ProgressBar,
  Button,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  initializeOffline,
  syncOfflineData,
  selectIsOnline,
  selectSyncStatus,
  selectSyncError,
  selectCacheStatus,
  selectPendingActions,
  selectLastOnlineTime,
} from '../store/slices/offlineSlice';
import { theme, getSpacing } from '../theme';

/**
 * Componente de Status Offline
 * Exibe status da conexão, cache e sincronização
 */

interface OfflineStatusProps {
  style?: ViewStyle;
  showDetails?: boolean;
  showControls?: boolean;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({
  style,
  showDetails = false,
  showControls = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const syncError = useSelector(selectSyncError);
  const cacheStatus = useSelector(selectCacheStatus);
  const pendingActions = useSelector(selectPendingActions);
  const lastOnlineTime = useSelector(selectLastOnlineTime);

  // Initialize offline service on mount
  useEffect(() => {
    dispatch(initializeOffline());
  }, [dispatch]);

  /**
   * Handle manual sync
   */
  const handleSync = () => {
    dispatch(syncOfflineData(true));
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return 'Nunca';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Agora';
    } else if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days} dias atrás`;
    }
  };

  /**
   * Get connection status info
   */
  const getConnectionInfo = () => {
    if (isOnline) {
      return {
        label: 'Online',
        color: '#4CAF50',
        icon: 'wifi',
        backgroundColor: '#4CAF50' + '20',
      };
    } else {
      return {
        label: 'Offline',
        color: theme.colors.error,
        icon: 'wifi-off',
        backgroundColor: theme.colors.errorContainer,
      };
    }
  };

  /**
   * Get sync status info
   */
  const getSyncInfo = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          label: 'Sincronizando...',
          color: theme.colors.primary,
          icon: 'sync',
        };
      case 'success':
        return {
          label: 'Sincronizado',
          color: '#4CAF50',
          icon: 'check-circle',
        };
      case 'error':
        return {
          label: 'Erro na sincronização',
          color: theme.colors.error,
          icon: 'alert-circle',
        };
      default:
        return {
          label: 'Aguardando',
          color: theme.colors.onSurfaceVariant,
          icon: 'clock',
        };
    }
  };

  /**
   * Calculate total cache size
   */
  const getTotalCacheSize = (): string => {
    const totalBytes = Object.values(cacheStatus).reduce(
      (total, cache) => total + (cache._size || 0),
      0
    );
    
    if (totalBytes < 1024) {
      return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const connectionInfo = getConnectionInfo();
  const syncInfo = getSyncInfo();

  return (
    <View style={[styles.container, style]}>
      {/* Connection Status */}
      <View style={styles.statusRow}>
        <Chip
          mode="flat"
          style={[
            styles.statusChip,
            { backgroundColor: connectionInfo.backgroundColor },
          ]}
          textStyle={[
            styles.statusChipText,
            { color: connectionInfo.color },
          ]}
          icon={connectionInfo.icon}
          compact
        >
          {connectionInfo.label}
        </Chip>

        {/* Sync Status */}
        <Chip
          mode="flat"
          style={[
            styles.syncChip,
            syncStatus === 'error' && { backgroundColor: theme.colors.errorContainer },
          ]}
          textStyle={[
            styles.syncChipText,
            { color: syncInfo.color },
          ]}
          icon={syncInfo.icon}
          compact
        >
          {syncInfo.label}
        </Chip>

        {/* Pending Actions Count */}
        {pendingActions.length > 0 && (
          <Chip
            mode="flat"
            style={styles.pendingChip}
            textStyle={styles.pendingChipText}
            icon="clock-outline"
            compact
          >
            {pendingActions.length} pendente{pendingActions.length > 1 ? 's' : ''}
          </Chip>
        )}
      </View>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <ProgressBar
          indeterminate
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      )}

      {/* Error Message */}
      {syncError && (
        <Text style={styles.errorText} numberOfLines={2}>
          {syncError}
        </Text>
      )}

      {/* Details */}
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Cache Status</Text>
          
          <View style={styles.cacheInfo}>
            <Text style={styles.cacheText}>
              📦 Caixas: {cacheStatus.boxes.count} itens
            </Text>
            <Text style={styles.cacheText}>
              🏷️ Categorias: {cacheStatus.categories.count} itens
            </Text>
            <Text style={styles.cacheText}>
              💾 Tamanho total: {getTotalCacheSize()}
            </Text>
            <Text style={styles.cacheText}>
              🕒 Última sincronização: {formatTimeAgo(lastOnlineTime)}
            </Text>
          </View>
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          <Button
            mode="outlined"
            onPress={handleSync}
            disabled={syncStatus === 'syncing'}
            icon="sync"
            style={styles.syncButton}
          >
            Sincronizar
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: getSpacing('sm'),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
    flexWrap: 'wrap',
  },
  statusChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  syncChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  syncChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  pendingChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  pendingChipText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    marginTop: getSpacing('sm'),
    height: 2,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: getSpacing('sm'),
    fontStyle: 'italic',
  },
  details: {
    marginTop: getSpacing('md'),
    padding: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  cacheInfo: {
    gap: getSpacing('xs'),
  },
  cacheText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  controls: {
    marginTop: getSpacing('md'),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  syncButton: {
    minWidth: 120,
  },
});

export default OfflineStatus;