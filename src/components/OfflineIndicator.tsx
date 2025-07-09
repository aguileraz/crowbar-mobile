import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  selectIsOnline,
  selectSyncStatus,
  selectPendingActions,
  selectCacheStatus,
} from '../store/slices/offlineSlice';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Indicador de status offline com informações detalhadas
 * Mostra status de sincronização, ações pendentes e cache
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  compact = false,
}) => {
  const theme = useTheme();
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const pendingActions = useSelector(selectPendingActions);
  const cacheStatus = useSelector(selectCacheStatus);

  // Calcular tempo desde última atualização
  const getTimeSinceUpdate = (timestamp: number | null) => {
    if (!timestamp) return 'Nunca';
    
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  // Modo compacto - apenas ícone
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Icon
          name={isOnline ? 'cloud-check' : 'cloud-off-outline'}
          size={24}
          color={isOnline ? theme.colors.primary : theme.colors.error}
        />
        {pendingActions.length > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>{pendingActions.length}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Status principal */}
      <View style={styles.header}>
        <Icon
          name={isOnline ? 'cloud-check' : 'cloud-off-outline'}
          size={32}
          color={isOnline ? theme.colors.primary : theme.colors.error}
        />
        <View style={styles.headerText}>
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {syncStatus === 'syncing' && (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="small" style={styles.syncingIndicator} />
              <Text style={styles.syncingText}>Sincronizando...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Ações pendentes */}
      {pendingActions.length > 0 && (
        <View style={[styles.pendingContainer, { backgroundColor: theme.colors.errorContainer }]}>
          <Icon name="clock-alert-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.pendingText, { color: theme.colors.error }]}>
            {pendingActions.length} ações pendentes
          </Text>
        </View>
      )}

      {/* Detalhes do cache */}
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Status do Cache:</Text>
          
          <View style={styles.cacheItem}>
            <Icon name="package-variant" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.cacheLabel}>Boxes:</Text>
            <Text style={styles.cacheValue}>
              {cacheStatus.boxes.count || 0} itens • {getTimeSinceUpdate(cacheStatus.boxes.lastUpdated)}
            </Text>
          </View>

          <View style={styles.cacheItem}>
            <Icon name="shape" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.cacheLabel}>Categorias:</Text>
            <Text style={styles.cacheValue}>
              {cacheStatus.categories.count || 0} itens • {getTimeSinceUpdate(cacheStatus.categories.lastUpdated)}
            </Text>
          </View>

          <View style={styles.cacheItem}>
            <Icon name="account" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.cacheLabel}>Perfil:</Text>
            <Text style={styles.cacheValue}>
              {getTimeSinceUpdate(cacheStatus.user.lastUpdated)}
            </Text>
          </View>

          <View style={styles.cacheItem}>
            <Icon name="cart" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.cacheLabel}>Carrinho:</Text>
            <Text style={styles.cacheValue}>
              {getTimeSinceUpdate(cacheStatus.cart.lastUpdated)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  compactContainer: {
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  syncingIndicator: {
    marginRight: 4,
  },
  syncingText: {
    fontSize: 12,
    opacity: 0.7,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  pendingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  cacheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  cacheLabel: {
    marginLeft: 8,
    fontSize: 12,
    width: 80,
    opacity: 0.7,
  },
  cacheValue: {
    fontSize: 12,
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default OfflineIndicator;