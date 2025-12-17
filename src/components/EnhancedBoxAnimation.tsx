import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MysteryBox } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';
import { 
  loadAnimationFrames, 
  _getAnimationInfo,
  AnimationType,
  preloadAnimationFrames
} from '../utils/animationLoader';
import AnimatedEmoji from './AnimatedEmoji';

/**
 * Componente aprimorado de Animação de Abertura de Caixa
 * Utiliza as animações do protótipo para criar uma experiência imersiva
 */

interface EnhancedBoxAnimationProps {
  box: MysteryBox;
  animationState: 'idle' | 'opening' | 'revealing' | 'completed';
  onOpenPress: () => void;
  canOpen: boolean;
  isLoading: boolean;
  theme?: 'fire' | 'ice' | 'meteor' | 'normal';
}

const { width: _screenWidth, height: _screenHeight } = Dimensions.get('window');

const EnhancedBoxAnimation: React.FC<EnhancedBoxAnimationProps> = ({
  box,
  animationState,
  onOpenPress,
  canOpen,
  isLoading,
  theme: boxTheme = 'normal',
}) => {
  // Estados para controle das animações
  const [currentBackgroundFrame, setCurrentBackgroundFrame] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<'beijo' | 'bravo' | 'cool' | 'lingua'>('cool');
  
  // Animações principais
  const boxScaleAnim = useRef(new Animated.Value(1)).current;
  const boxRotateAnim = useRef(new Animated.Value(0)).current;
  const boxOpacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Frames de animação do tema
  const themeFrames = useCallback(() => {
    switch (boxTheme) {
      case 'fire':
        return {
          background: loadAnimationFrames('fire_smoke'),
          explosion: loadAnimationFrames('fire_explosion'),
          product: loadAnimationFrames('fire_product'),
        };
      case 'ice':
        return {
          background: loadAnimationFrames('ice_blizzard'),
          top: loadAnimationFrames('ice_top'),
          bottom: loadAnimationFrames('ice_bottom'),
        };
      case 'meteor':
        return {
          background: loadAnimationFrames('meteor_asteroid'),
          explosion: loadAnimationFrames('meteor_exit'),
          product: loadAnimationFrames('meteor_product'),
        };
      default:
        return null;
    }
  }, [boxTheme]);

  // Pré-carregar animações do tema
  useEffect(() => {
    const animationsToPreload: AnimationType[] = [];
    
    switch (boxTheme) {
      case 'fire':
        animationsToPreload.push('fire_smoke', 'fire_explosion', 'fire_product');
        break;
      case 'ice':
        animationsToPreload.push('ice_blizzard', 'ice_top', 'ice_bottom');
        break;
      case 'meteor':
        animationsToPreload.push('meteor_asteroid', 'meteor_exit', 'meteor_product');
        break;
    }
    
    if (animationsToPreload.length > 0) {
      preloadAnimationFrames(animationsToPreload).catch(console.warn);
    }
  }, [boxTheme]);

  /**
   * Animação de shake da caixa
   */
  const _startShakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(boxRotateAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(boxRotateAnim, {
        toValue: -1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [boxRotateAnim]);

  /**
   * Animação de abertura da caixa
   */
  const startOpeningAnimation = useCallback(() => {
    // Shake intenso
    const shakeSequence = [];
    for (let i = 0; i < 10; i++) {
      shakeSequence.push(
        Animated.timing(boxRotateAnim, {
          toValue: i % 2 === 0 ? 2 : -2,
          duration: 30,
          useNativeDriver: true,
        })
      );
    }
    
    Animated.parallel([
      Animated.sequence(shakeSequence),
      Animated.timing(boxScaleAnim, {
        toValue: 1.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
    
    // Mostrar emoji aleatório após delay
    setTimeout(() => {
      const emojis: Array<'beijo' | 'bravo' | 'cool' | 'lingua'> = ['beijo', 'bravo', 'cool', 'lingua'];
      setSelectedEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
      setShowEmoji(true);
    }, 300);
  }, [boxRotateAnim, boxScaleAnim, glowAnim]);

  /**
   * Animação de revelação
   */
  const startRevealAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(boxScaleAnim, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(boxOpacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [boxScaleAnim, boxOpacityAnim]);

  // Controlar animações baseado no estado
  useEffect(() => {
    switch (animationState) {
      case 'idle':
        // Reset animations
        boxScaleAnim.setValue(1);
        boxRotateAnim.setValue(0);
        boxOpacityAnim.setValue(1);
        glowAnim.setValue(0);
        setShowEmoji(false);
        break;
      case 'opening':
        startOpeningAnimation();
        break;
      case 'revealing':
        startRevealAnimation();
        break;
      case 'completed':
        // Manter estado final
        break;
    }
  }, [animationState, startOpeningAnimation, startRevealAnimation, boxScaleAnim, boxRotateAnim, boxOpacityAnim, glowAnim]);

  /**
   * Obter imagem da caixa
   */
  const getBoxImage = () => {
    if (box.images && box.images.length > 0) {
      return { uri: box.images[0].url };
    }
    // Placeholder base64 para fallback
    return { 
      uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' 
    };
  };

  /**
   * Renderizar fundo temático
   */
  const renderThemeBackground = () => {
    const frames = themeFrames();
    if (!frames || !frames.background || frames.background.length === 0) {
      return null;
    }

    const backgroundFrame = frames.background[currentBackgroundFrame % frames.background.length];
    
    return (
      <ImageBackground
        source={backgroundFrame}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        blurRadius={2}
      />
    );
  };

  /**
   * Obter cor de raridade
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
      case 'mythical':
        return '#E91E63';
      default:
        return '#757575';
    }
  };

  const rarityColor = getRarityColor(box.rarity || 'common');
  
  // Animação do fundo temático
  useEffect(() => {
    const frames = themeFrames();
    if (!frames || !frames.background) return;
    
    const interval = setInterval(() => {
      setCurrentBackgroundFrame(prev => prev + 1);
    }, 100); // 10 FPS para o fundo
    
    return () => clearInterval(interval);
  }, [themeFrames]);

  const rotateInterpolate = boxRotateAnim.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-5deg', '5deg'],
  });

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={styles.container}>
      {/* Fundo temático */}
      {renderThemeBackground()}
      
      {/* Container da caixa */}
      <View style={styles.boxContainer}>
        {/* Efeito de brilho */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              shadowColor: rarityColor,
              shadowRadius: glowInterpolate,
              shadowOpacity: 0.8,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
        
        {/* Caixa animada */}
        <Animated.View
          style={[
            styles.box,
            {
              transform: [
                { scale: boxScaleAnim },
                { rotate: rotateInterpolate },
              ],
              opacity: boxOpacityAnim,
            },
          ]}
        >
          <Image
            source={getBoxImage()}
            style={styles.boxImage}
            resizeMode="contain"
          />
          
          {/* Indicador de raridade */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{box.rarity || 'COMUM'}</Text>
          </View>
        </Animated.View>
        
        {/* Emoji animado */}
        {showEmoji && animationState === 'opening' && (
          <View style={styles.emojiContainer}>
            <AnimatedEmoji
              type={selectedEmoji}
              size="xlarge"
              autoPlay={true}
              loop={false}
            />
          </View>
        )}
        
        {/* Informações da caixa */}
        <View style={styles.infoContainer}>
          <Text style={styles.boxName}>{box.name}</Text>
          <Text style={styles.boxPrice}>R$ {box.price.toFixed(2)}</Text>
        </View>
        
        {/* Botão de abrir */}
        {animationState === 'idle' && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={onOpenPress}
              disabled={!canOpen || isLoading}
              loading={isLoading}
              style={[
                styles.openButton,
                { backgroundColor: rarityColor },
              ]}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? 'ABRINDO...' : 'ABRIR CAIXA'}
            </Button>
          </View>
        )}
        
        {/* Indicador de carregamento */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={rarityColor} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing(4),
  },
  glowEffect: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'transparent',
  },
  box: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(3),
  },
  boxImage: {
    width: '100%',
    height: '100%',
  },
  rarityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1),
    borderRadius: getBorderRadius('small'),
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emojiContainer: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: getSpacing(2),
  },
  boxName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: getSpacing(1),
  },
  boxPrice: {
    fontSize: 18,
    color: theme.colors.primary,
  },
  buttonContainer: {
    marginTop: getSpacing(4),
    width: '100%',
    paddingHorizontal: getSpacing(4),
  },
  openButton: {
    paddingVertical: getSpacing(2),
    borderRadius: getBorderRadius('medium'),
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnhancedBoxAnimation;