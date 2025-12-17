/**
 * Enhanced Sprite Sheet Animator Component
 * Renderiza animações frame a frame com React Native Reanimated
 * Integrado com GamificationAssetManager
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  // withTiming,
  // withSequence,
  // withDelay,
  // runOnJS,
  // interpolate,
  // Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { GameAsset, EmojiReactionType, GameThemeType } from '../../types/animations';
import gamificationAssetManager from '../../services/gamificationAssetManager';

const { width: _screenWidth, height: _screenHeight } = Dimensions.get('window');

interface SpriteSheetAnimatorProps {
  // Opção 1: Usar asset diretamente
  asset?: GameAsset;
  // Opção 2: Usar emoji type
  emojiType?: EmojiReactionType;
  // Opção 3: Usar theme e effect type
  theme?: GameThemeType;
  effectType?: string;
  // Configurações da animação
  onComplete?: () => void;
  onStart?: () => void;
  onFrameChange?: (frame: number) => void;
  loop?: boolean;
  autoPlay?: boolean;
  scale?: number;
  style?: any;
  // Configurações avançadas
  quality?: 'low' | 'medium' | 'high';
  preload?: boolean;
  cacheFrames?: boolean;
}

const SpriteSheetAnimator: React.FC<SpriteSheetAnimatorProps> = ({
  asset: propAsset,
  emojiType,
  theme,
  effectType,
  onComplete,
  _onStart,
  _onFrameChange,
  loop = false,
  autoPlay = true,
  scale = 1,
  style,
  _quality = 'high',
  _preload = false,
  _cacheFrames = true,
}) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAsset, setCurrentAsset] = useState<GameAsset | null>(null);
  
  const currentFrame = useSharedValue(0);
  const opacity = useSharedValue(1);
  const animationScale = useSharedValue(1);
  
  // Resolve asset baseado nas props
  const resolveAsset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let asset: GameAsset | null = null;
      let loadedFrames: string[] = [];

      if (propAsset) {
        asset = propAsset;
        // Carregar frames diretamente
        loadedFrames = await gamificationAssetManager.loadAssetFrames(asset.id);
      } else if (emojiType) {
        loadedFrames = await gamificationAssetManager.loadEmojiAsset(emojiType);
        // Asset será encontrado internamente
      } else if (theme && effectType) {
        const themeAssets = await gamificationAssetManager.loadThemeAssets(theme);
        loadedFrames = themeAssets[effectType] || [];
      }

      if (loadedFrames.length === 0) {
        throw new Error('Nenhum frame carregado');
      }

      setFrames(loadedFrames);
      if (asset) setCurrentAsset(asset);
      
    } catch (err) {
      // console.error('Erro ao resolver asset:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [propAsset, emojiType, theme, effectType]);

  // Carrega asset quando props mudam
  useEffect(() => {
    resolveAsset();
  }, [resolveAsset]);
  
  // Calcula duração de cada frame
  const frameDuration = useMemo(() => {
    if (!currentAsset || !currentAsset.fps) return 41.67; // ~24fps default
    return 1000 / currentAsset.fps;
  }, [currentAsset]);
  
  // Callback para quando animação completa
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
    if (loop) {
      startAnimation();
    }
  }, [onComplete, loop]);
  
  // Inicia animação
  const startAnimation = useCallback(() => {
    'worklet';
    if (!frames.length || !currentAsset) return;
    
    currentFrame.value = 0;
    
    const duration = currentAsset.duration || frames.length * frameDuration;
    
    // Anima através de todos os frames
    currentFrame.value = withTiming(
      frames.length - 1,
      {
        duration: duration,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      }
    );
    
    // Adiciona efeitos especiais baseados no tipo
    if (currentAsset.type === 'explosion' || currentAsset.type === 'burst') {
      // Efeito de expansão para explosões
      animationScale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: duration - 100 })
      );
    }
    
    if (currentAsset.type === 'smoke' || currentAsset.type === 'blizzard') {
      // Efeito de fade para fumaça/nevasca
      opacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(1, { duration: duration - 400 }),
        withTiming(0.6, { duration: 200 })
      );
    }
  }, [frames, currentAsset, currentFrame, opacity, animationScale, handleComplete, frameDuration]);
  
  // Para animação
  const stopAnimation = useCallback(() => {
    cancelAnimation(currentFrame);
    cancelAnimation(opacity);
    cancelAnimation(animationScale);
  }, [currentFrame, opacity, animationScale]);
  
  // Auto play
  useEffect(() => {
    if (autoPlay && frames.length > 0) {
      startAnimation();
    }
    
    return () => {
      stopAnimation();
    };
  }, [autoPlay, frames, startAnimation, stopAnimation]);
  
  // Estilo animado do container
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: animationScale.value * scale }],
    };
  });
  
  // Renderiza frame atual
  const renderFrame = () => {
    const frameIndex = Math.floor(currentFrame.value);
    if (frameIndex >= 0 && frameIndex < frames.length) {
      return (
        <Image
          source={{ uri: frames[frameIndex] }}
          style={styles.frameImage}
          resizeMode="contain"
        />
      );
    }
    return null;
  };
  
  // Adiciona efeitos especiais baseados no tema
  const renderEffects = () => {
    if (!currentAsset) return null;
    
    switch (currentAsset.theme) {
      case 'fire':
        return (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Glow effect para fogo */}
            <View style={[styles.glowEffect, styles.fireGlow]} />
          </View>
        );
        
      case 'ice':
        return (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Cristais de gelo */}
            <View style={[styles.crystalEffect]} />
          </View>
        );
        
      case 'meteor':
        return (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Trail de fogo */}
            <View style={[styles.trailEffect]} />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {/* Placeholder durante carregamento */}
      </View>
    );
  }

  if (error || frames.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, style]}>
      {renderEffects()}
      {renderFrame()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
  },
  glowEffect: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 1000,
  },
  fireGlow: {
    backgroundColor: 'rgba(255, 100, 0, 0.2)',
    shadowColor: '#ff6400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  crystalEffect: {
    backgroundColor: 'rgba(150, 200, 255, 0.1)',
    shadowColor: '#96c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  trailEffect: {
    backgroundColor: 'rgba(255, 50, 50, 0.15)',
    shadowColor: '#ff3232',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 12,
  },
});

export default SpriteSheetAnimator;