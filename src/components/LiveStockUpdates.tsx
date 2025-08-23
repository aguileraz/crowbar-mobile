import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import {
  Text,
  Chip,
  IconButton,
  Badge,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import {
  selectLiveBoxUpdates,
  selectIsConnected,
} from '../store/slices/realtimeSlice';
import { theme, getSpacing, getBorderRadius } from '../theme';
import { useAnimations } from '../hooks/useAnimations';

/**
 * Componente para mostrar atualizações de estoque em tempo real
 */

interface LiveStockUpdatesProps {
  style?: ViewStyle;
  maxItems?: number;
  showAnimation?: boolean;
}

interface StockUpdate {
  boxId: string;
  boxName: string;
  previousStock: number;
  currentStock: number;
  priceChange?: number;
  timestamp: number;
  type: 'increase' | 'decrease' | 'restock' | 'sold_out';
}

const LiveStockUpdates: React.FC<LiveStockUpdatesProps> = ({
  style,
  maxItems = 5,
  showAnimation = true,
}) => {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [newUpdateCount, setNewUpdateCount] = useState(0);

  // Redux state
  const liveBoxUpdates = useSelector(selectLiveBoxUpdates);
  const isConnected = useSelector(selectIsConnected);

  // Animations
  const { fade, scale } = useAnimations();

  /**
   * Process live box updates into stock updates
   */
  useEffect(() => {
    const updates = Object.entries(liveBoxUpdates)
      .map(([boxId, data]) => {
        const previousStock = stockUpdates.find(u => u.boxId === boxId)?.currentStock || data.stock;
        const stockDiff = data.stock - previousStock;
        
        let type: StockUpdate['type'] = 'increase';
        if (data.stock === 0) type = 'sold_out';
        else if (stockDiff < 0) type = 'decrease';
        else if (stockDiff > 10) type = 'restock';

        return {
          boxId,
          boxName: `Caixa ${boxId}`, // In real app, get from box data
          previousStock,
          currentStock: data.stock,
          timestamp: data.lastUpdated,
          type,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxItems);

    if (updates.length > stockUpdates.length) {
      setNewUpdateCount(prev => prev + (updates.length - stockUpdates.length));
      
      if (showAnimation) {
        scale.pulse();
      }
    }

    setStockUpdates(updates);
  }, [liveBoxUpdates, maxItems, showAnimation, scale]);

  /**
   * Clear new update count when user views
   */
  const handleViewUpdates = () => {
    setNewUpdateCount(0);
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  /**
   * Get update icon and color
   */
  const getUpdateInfo = (type: StockUpdate['type']) => {
    switch (type) {
      case 'increase':
        return { icon: 'trending-up', color: '#4CAF50', label: 'Estoque aumentou' };
      case 'decrease':
        return { icon: 'trending-down', color: '#FF9800', label: 'Estoque diminuiu' };
      case 'restock':
        return { icon: 'package-variant', color: '#2196F3', label: 'Reabastecido' };
      case 'sold_out':
        return { icon: 'alert-circle', color: '#F44336', label: 'Esgotado' };
      default:
        return { icon: 'information', color: theme.colors.primary, label: 'Atualizado' };
    }
  };

  /**
   * Render stock update item
   */
  const renderStockUpdate = (update: StockUpdate, _index: number) => {
    const updateInfo = getUpdateInfo(update.type);
    const stockDiff = update.currentStock - update.previousStock;

    return (
      <Animated.View
        key={`${update.boxId}-${update.timestamp}`}
        style={[
          styles.updateItem,
          showAnimation && {
            opacity: fade.values.fade,
            transform: [{ scale: scale.values.scale }],
          },
        ]}
      >
        <View style={styles.updateIcon}>
          <IconButton
            icon={updateInfo.icon}
            size={20}
            iconColor={updateInfo.color}
            style={[
              styles.iconButton,
              { backgroundColor: updateInfo.color + '20' },
            ]}
          />
        </View>

        <View style={styles.updateContent}>
          <Text style={styles.boxName} numberOfLines={1}>
            {update.boxName}
          </Text>
          
          <View style={styles.updateDetails}>
            <Text style={styles.updateLabel}>
              {updateInfo.label}
            </Text>
            
            <View style={styles.stockInfo}>
              <Text style={styles.stockText}>
                {update.previousStock} → {update.currentStock}
              </Text>
              
              {stockDiff !== 0 && (
                <Chip
                  mode="flat"
                  style={[
                    styles.diffChip,
                    stockDiff > 0 ? styles.positiveChip : styles.negativeChip,
                  ]}
                  textStyle={[
                    styles.diffText,
                    { color: stockDiff > 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {stockDiff > 0 ? '+' : ''}{stockDiff}
                </Chip>
              )}
            </View>
          </View>
        </View>

        <View style={styles.updateTime}>
          <Text style={styles.timeText}>
            {formatTimestamp(update.timestamp)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.disconnectedState}>
          <IconButton
            icon="wifi-off"
            size={32}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.disconnectedText}>
            Conecte-se para ver atualizações em tempo real
          </Text>
        </View>
      </View>
    );
  }

  if (stockUpdates.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyState}>
          <IconButton
            icon="package-variant-closed"
            size={32}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>
            Nenhuma atualização de estoque recente
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="pulse"
            size={20}
            iconColor={theme.colors.primary}
          />
          <Text style={styles.headerTitle}>Estoque ao Vivo</Text>
        </View>
        
        {newUpdateCount > 0 && (
          <Badge
            style={styles.newUpdateBadge}
            onPress={handleViewUpdates}
          >
            {newUpdateCount}
          </Badge>
        )}
      </View>

      <View style={styles.updatesList}>
        {stockUpdates.map((update, _index) => renderStockUpdate(update, _index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: getSpacing('xs'),
  },
  newUpdateBadge: {
    backgroundColor: theme.colors.error,
  },
  updatesList: {
    gap: getSpacing('sm'),
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('sm'),
  },
  updateIcon: {
    marginRight: getSpacing('md'),
  },
  iconButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  updateContent: {
    flex: 1,
  },
  boxName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
  },
  updateDetails: {
    gap: getSpacing('xs'),
  },
  updateLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  diffChip: {
    height: 20,
    borderRadius: 10,
  },
  diffText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  positiveChip: {
    backgroundColor: '#4CAF50' + '20',
  },
  negativeChip: {
    backgroundColor: '#F44336' + '20',
  },
  updateTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  disconnectedState: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  disconnectedText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: getSpacing('sm'),
  },
  emptyState: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: getSpacing('sm'),
  },
});

export default LiveStockUpdates;