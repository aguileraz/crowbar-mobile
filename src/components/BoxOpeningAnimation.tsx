import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MysteryBox } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Animação de Abertura de Caixa
 * Exibe a caixa com animações de abertura
 */

interface BoxOpeningAnimationProps {
  box: MysteryBox;
  animationState: 'idle' | 'opening' | 'revealing' | 'completed';
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  rotateAnim: Animated.Value;
  onOpenPress: () => void;
  canOpen: boolean;
  isLoading: boolean;
}

const { width: _screenWidth } = Dimensions.get('window');

const BoxOpeningAnimation: React.FC<BoxOpeningAnimationProps> = ({
  box,
  animationState,
  fadeAnim: _fadeAnim,
  scaleAnim: _scaleAnim,
  rotateAnim: _rotateAnim,
  onOpenPress,
  canOpen,
  isLoading,
}) => {
  // Particle animations for opening effect
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Glow animation
  const glowAnim = useRef(new Animated.Value(0)).current;

  /**
   * Start particle explosion animation
   */
  const startParticleAnimation = useCallback(() => {
    const animations = particleAnims.map((particle, index) => {
      const angle = (index * 45) * (Math.PI / 180); // 45 degrees apart
      const distance = 100;
      
      return Animated.sequence([
        Animated.delay(500), // Wait for box shake
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, [particleAnims]);

  /**
   * Start glow animation
   */
  const startGlowAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  // Start particle animation when opening
  useEffect(() => {
    if (animationState === 'opening') {
      startParticleAnimation();
      startGlowAnimation();
    }
  }, [animationState, startGlowAnimation, startParticleAnimation]);

  /**
   * Get box image
   */
  const getBoxImage = () => {
    if (box.images && box.images.length > 0) {
      return { uri: box.images[0].url };
    }
    // Use a placeholder URI instead of local asset for build compatibility
    return { uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJveCA8L3RleHQ+PC9zdmc+' };
  };

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
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <View style={styles.container}>
      {/* Glow Effect */}
      {animationState === 'opening' && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              borderColor: getRarityColor(box.rarity || 'common'),
            },
          ]}
        />
      )}

      {/* Particles */}
      {animationState === 'opening' && (
        <View style={styles.particlesContainer}>
          {particleAnims.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  opacity: particle.opacity,
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                    { scale: particle.scale },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Box Container */}
      <View style={styles.boxContainer}>
        {/* Box Image */}
        <View style={styles.imageContainer}>
          <Image
            source={getBoxImage()}
            style={styles.boxImage}
            resizeMode="cover"
          />
          
          {/* Rarity Border */}
          <View
            style={[
              styles.rarityBorder,
              { borderColor: getRarityColor(box.rarity || 'common') },
            ]}
          />
        </View>

        {/* Box Info */}
        <View style={styles.boxInfo}>
          <Text style={styles.boxName}>{box.name}</Text>
          <Text style={styles.boxPrice}>{formatCurrency(box.price)}</Text>
          <Text style={[styles.boxRarity, { color: getRarityColor(box.rarity || 'common') }]}>
            {box.rarity?.toUpperCase() || 'COMUM'}
          </Text>
        </View>

        {/* Open Button */}
        {animationState === 'idle' && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={onOpenPress}
              disabled={!canOpen || isLoading}
              loading={isLoading}
              style={[
                styles.openButton,
                { backgroundColor: getRarityColor(box.rarity || 'common') },
              ]}
              contentStyle={styles.openButtonContent}
              labelStyle={styles.openButtonLabel}
            >
              {isLoading ? 'Abrindo...' : 'ABRIR CAIXA'}
            </Button>
          </View>
        )}

        {/* Opening Status */}
        {animationState === 'opening' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color={getRarityColor(box.rarity || 'common')} />
            <Text style={styles.statusText}>Abrindo caixa...</Text>
          </View>
        )}

        {animationState === 'revealing' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Revelando itens...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    top: -50,
    left: -50,
  },
  particlesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  boxContainer: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: getSpacing('lg'),
  },
  boxImage: {
    width: 200,
    height: 200,
    borderRadius: getBorderRadius('lg'),
  },
  rarityBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 3,
    borderRadius: getBorderRadius('lg') + 4,
  },
  boxInfo: {
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  boxName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
    color: theme.colors.onSurface,
  },
  boxPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: getSpacing('xs'),
  },
  boxRarity: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 250,
  },
  openButton: {
    borderRadius: getBorderRadius('lg'),
    elevation: 4,
  },
  openButtonContent: {
    paddingVertical: getSpacing('md'),
  },
  openButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  statusContainer: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginTop: getSpacing('md'),
  },
});

export default BoxOpeningAnimation;
