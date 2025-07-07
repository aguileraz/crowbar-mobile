import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  IconButton,
  Button,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import {
  selectLiveEvents,
  selectIsConnected,
} from '../store/slices/realtimeSlice';
import { theme, getSpacing, getBorderRadius } from '../theme';
import { useAnimations } from '../hooks/useAnimations';

/**
 * Componente para mostrar novos lançamentos em tempo real
 */

interface LiveNewReleasesProps {
  style?: ViewStyle;
  maxItems?: number;
  onBoxPress?: (boxId: string) => void;
  showAnimation?: boolean;
}

interface NewRelease {
  id: string;
  boxId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  timestamp: number;
  isHot?: boolean;
  discount?: number;
}

const LiveNewReleases: React.FC<LiveNewReleasesProps> = ({
  style,
  maxItems = 3,
  onBoxPress,
  showAnimation = true,
}) => {
  const [newReleases, setNewReleases] = useState<NewRelease[]>([]);
  const [dismissedReleases, setDismissedReleases] = useState<Set<string>>(new Set());

  // Redux state
  const liveEvents = useSelector(selectLiveEvents);
  const isConnected = useSelector(selectIsConnected);

  // Animations
  const { fade, scale, slide } = useAnimations();

  /**
   * Process live events for new releases
   */
  useEffect(() => {
    const newBoxEvents = liveEvents
      .filter(event => 
        event.type === 'new_box' && 
        !dismissedReleases.has(event.id)
      )
      .slice(0, maxItems)
      .map(event => ({
        id: event.id,
        boxId: event.data.boxId || event.id,
        name: event.data.name || 'Nova Caixa Misteriosa',
        description: event.data.description || 'Uma nova caixa foi lançada!',
        price: event.data.price || 0,
        imageUrl: event.data.imageUrl,
        category: event.data.category || 'Geral',
        rarity: event.data.rarity || 'common',
        timestamp: event.timestamp,
        isHot: event.data.isHot || false,
        discount: event.data.discount,
      }));

    if (newBoxEvents.length > newReleases.length && showAnimation) {
      slide.inFromRight();
      scale.pulse();
    }

    setNewReleases(newBoxEvents);
  }, [liveEvents, dismissedReleases, maxItems, newReleases.length, showAnimation, slide, scale]);

  /**
   * Handle dismiss release
   */
  const handleDismissRelease = (releaseId: string) => {
    setDismissedReleases(prev => new Set([...prev, releaseId]));
    
    if (showAnimation) {
      fade.out();
    }
  };

  /**
   * Handle box press
   */
  const handleBoxPress = (boxId: string) => {
    if (onBoxPress) {
      onBoxPress(boxId);
    }
  };

  /**
   * Format price
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    return 'Há mais de 1 dia';
  };

  /**
   * Render new release item
   */
  const renderNewRelease = (release: NewRelease, index: number) => {
    const rarityColor = getRarityColor(release.rarity);

    return (
      <Animated.View
        key={release.id}
        style={[
          styles.releaseItem,
          showAnimation && {
            opacity: fade.values.fade,
            transform: [
              { scale: scale.values.scale },
              { translateX: slide.values.slide },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleBoxPress(release.boxId)}
          style={styles.releaseContent}
          activeOpacity={0.7}
        >
          <View style={styles.releaseHeader}>
            <View style={styles.releaseInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.releaseName} numberOfLines={1}>
                  {release.name}
                </Text>
                
                {release.isHot && (
                  <Chip
                    mode="flat"
                    style={styles.hotChip}
                    textStyle={styles.hotText}
                    icon="fire"
                  >
                    HOT
                  </Chip>
                )}
              </View>
              
              <Text style={styles.releaseDescription} numberOfLines={2}>
                {release.description}
              </Text>
              
              <View style={styles.releaseDetails}>
                <Chip
                  mode="flat"
                  style={[styles.rarityChip, { backgroundColor: rarityColor + '20' }]}
                  textStyle={[styles.rarityText, { color: rarityColor }]}
                >
                  {release.rarity.toUpperCase()}
                </Chip>
                
                <Text style={styles.categoryText}>
                  {release.category}
                </Text>
                
                <Text style={styles.timeText}>
                  {formatTimestamp(release.timestamp)}
                </Text>
              </View>
            </View>
            
            <IconButton
              icon="close"
              size={16}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => handleDismissRelease(release.id)}
              style={styles.dismissButton}
            />
          </View>
          
          <View style={styles.priceSection}>
            <View style={styles.priceInfo}>
              {release.discount && (
                <Text style={styles.originalPrice}>
                  {formatPrice(release.price)}
                </Text>
              )}
              
              <Text style={styles.currentPrice}>
                {formatPrice(release.discount ? 
                  release.price * (1 - release.discount / 100) : 
                  release.price
                )}
              </Text>
              
              {release.discount && (
                <Chip
                  mode="flat"
                  style={styles.discountChip}
                  textStyle={styles.discountText}
                >
                  -{release.discount}%
                </Chip>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={() => handleBoxPress(release.boxId)}
              style={styles.viewButton}
              labelStyle={styles.viewButtonText}
            >
              Ver
            </Button>
          </View>
        </TouchableOpacity>
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
            Conecte-se para ver novos lançamentos
          </Text>
        </View>
      </View>
    );
  }

  if (newReleases.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyState}>
          <IconButton
            icon="package-variant"
            size={32}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>
            Nenhum lançamento recente
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
            icon="new-box"
            size={20}
            iconColor={theme.colors.primary}
          />
          <Text style={styles.headerTitle}>Novos Lançamentos</Text>
        </View>
        
        <Chip
          mode="flat"
          style={styles.liveChip}
          textStyle={styles.liveText}
          icon="circle"
        >
          AO VIVO
        </Chip>
      </View>

      <View style={styles.releasesList}>
        {newReleases.map((release, index) => renderNewRelease(release, index))}
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
  liveChip: {
    backgroundColor: '#F44336' + '20',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  liveText: {
    color: '#F44336',
    fontSize: 10,
    fontWeight: 'bold',
  },
  releasesList: {
    gap: getSpacing('md'),
  },
  releaseItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('md'),
    overflow: 'hidden',
  },
  releaseContent: {
    padding: getSpacing('md'),
  },
  releaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getSpacing('md'),
  },
  releaseInfo: {
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
    gap: getSpacing('sm'),
  },
  releaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  hotChip: {
    backgroundColor: '#FF5722' + '20',
    height: 24,
  },
  hotText: {
    color: '#FF5722',
    fontSize: 10,
    fontWeight: 'bold',
  },
  releaseDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('sm'),
  },
  releaseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  rarityChip: {
    height: 20,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  dismissButton: {
    margin: 0,
    width: 24,
    height: 24,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  originalPrice: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  discountChip: {
    backgroundColor: '#4CAF50' + '20',
    height: 20,
  },
  discountText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewButton: {
    minWidth: 60,
  },
  viewButtonText: {
    fontSize: 12,
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

export default LiveNewReleases;
