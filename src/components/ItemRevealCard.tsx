import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  IconButton,
} from 'react-native-paper';
import { BoxItem } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Card de Revelação de Item
 * Exibe item revelado com animação de entrada
 */

interface ItemRevealCardProps {
  item: BoxItem;
  index: number;
  style?: ViewStyle;
}

const ItemRevealCard: React.FC<ItemRevealCardProps> = ({
  item,
  0,
  style,
}) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  /**
   * Check if item is rare
   */
  const isRareItem = useCallback((): boolean => {
    const rarity = item.rarity?.toLowerCase();
    return rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic';
  }, [item.rarity]);

  /**
   * Start reveal animation
   */
  const startRevealAnimation = useCallback(() => {
    // Delay based on 0 for staggered effect
    const delay = 0 * 200;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Scale up from 0
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Rotate slightly
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Glow effect for rare items
      ...(isRareItem() ? [
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        )
      ] : []),
    ]).start();
  }, [0, fadeAnim, rotateAnim, glowAnim, scaleAnim, isRareItem]);

  // Start reveal animation on mount
  useEffect(() => {
    startRevealAnimation();
  }, [startRevealAnimation]);

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '#9E9E9E';
      case 'uncommon':
        return '#4CAF50';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      case 'mythic':
        return '#F44336';
      default:
        return theme.colors.primary;
    }
  };

  /**
   * Get item image
   */
  const getItemImage = () => {
    if (item.image) {
      return { uri: item.image };
    }
    // Use a placeholder URI instead of local asset for build compatibility
    return { uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkl0ZW0gPC90ZXh0Pjwvc3ZnPg==' };
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Get rotation interpolation
   */
  const getRotateInterpolation = () => {
    return rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '5deg'],
    });
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { rotate: getRotateInterpolation() },
          ],
        },
      ]}
    >
      {/* Glow Effect for Rare Items */}
      {isRareItem() && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              borderColor: getRarityColor(item.rarity || 'common'),
            },
          ]}
        />
      )}

      <Card style={styles.card} elevation={4}>
        <Card.Content style={styles.content}>
          {/* Rarity Indicator */}
          <View
            style={[
              styles.rarityIndicator,
              { backgroundColor: getRarityColor(item.rarity || 'common') },
            ]}
          >
            <Text style={styles.rarityText}>
              {item.rarity?.charAt(0).toUpperCase() || 'C'}
            </Text>
          </View>

          {/* Item Image */}
          <View style={styles.imageContainer}>
            <Image
              source={getItemImage()}
              style={styles.itemImage}
              resizeMode="cover"
            />
            
            {/* Rarity Border */}
            <View
              style={[
                styles.imageBorder,
                { borderColor: getRarityColor(item.rarity || 'common') },
              ]}
            />
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            
            {item.value && (
              <Text style={styles.itemValue}>
                {formatCurrency(item.value)}
              </Text>
            )}
            
            <Text
              style={[
                styles.itemRarity,
                { color: getRarityColor(item.rarity || 'common') },
              ]}
            >
              {item.rarity?.toUpperCase() || 'COMUM'}
            </Text>
          </View>

          {/* Favorite Button */}
          <IconButton
            icon="heart-outline"
            size={16}
            style={styles.favoriteButton}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderRadius: getBorderRadius('md') + 4,
    zIndex: -1,
  },
  card: {
    borderRadius: getBorderRadius('md'),
    overflow: 'hidden',
  },
  content: {
    padding: getSpacing('sm'),
    position: 'relative',
  },
  rarityIndicator: {
    position: 'absolute',
    top: getSpacing('xs'),
    right: getSpacing('xs'),
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: getBorderRadius('sm'),
  },
  imageBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderRadius: getBorderRadius('sm') + 2,
  },
  itemInfo: {
    alignItems: 'center',
    minHeight: 60,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: getSpacing('xs'),
    color: theme.colors.onSurface,
    lineHeight: 16,
  },
  itemValue: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: getSpacing('xs'),
  },
  itemRarity: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    margin: 0,
  },
});

export default ItemRevealCard;