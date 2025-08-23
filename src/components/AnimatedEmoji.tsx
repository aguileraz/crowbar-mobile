import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { hapticFeedback } from '../utils/haptic';
import { 
  loadAnimationFrames, 
  getAnimationInfo,
  AnimationType,
  preloadAnimationFrames
} from '../utils/animationLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type EmojiType = 'beijo' | 'bravo' | 'cool' | 'lingua' | 'fire' | 'ice' | 'meteor';
export type EmojiSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AnimatedEmojiProps {
  type: EmojiType;
  size?: EmojiSize;
  loop?: boolean;
  onComplete?: () => void;
  autoPlay?: boolean;
  frameRate?: number;
  style?: any;
}

// Mapeamento de tipos de emoji para tipos de animação
const emojiToAnimationMap: Record<EmojiType, AnimationType> = {
  beijo: 'emoji_beijo',
  bravo: 'emoji_bravo',
  cool: 'emoji_cool',
  lingua: 'emoji_lingua',
  fire: 'fire_explosion',
  ice: 'ice_blizzard',
  meteor: 'meteor_asteroid',
};

// Componente de fallback para emojis nativos
const FallbackEmoji: React.FC<{ type: EmojiType; size: number }> = ({ type, size }) => {
  const emojiMap = {
    beijo: '😘',
    bravo: '😤',
    cool: '😎',
    lingua: '😜',
    fire: '🔥',
    ice: '❄️',
    meteor: '☄️',
  };

  return (
    <Animated.Text 
      style={{ fontSize: size }}
      entering={ZoomIn}
      exiting={ZoomOut}
    >
      {emojiMap[type]}
    </Animated.Text>
  );
};

const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  type,
  size = 'medium',
  loop = false,
  onComplete,
  autoPlay = true,
  frameRate = 30,
  style,
}) => {
  // Animações compartilhadas
  const scaleAnimation = useSharedValue(1);
  const rotationAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  
  // Cache de frames carregados
  const animationType = emojiToAnimationMap[type];
  const frames = useMemo(() => loadAnimationFrames(animationType), [animationType]);
  const animationInfo = useMemo(() => getAnimationInfo(animationType), [animationType]);
  
  // Estado do frame atual
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const animationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Dimensões baseadas no tamanho
  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 60;
      case 'large':
        return 80;
      case 'xlarge':
        return 120;
      default:
        return 60;
    }
  }, [size]);

  // Pré-carregar frames na montagem
  useEffect(() => {
    preloadAnimationFrames([animationType]).catch(error => {
      console.warn('Failed to preload animation frames:', error);
    });
  }, [animationType]);

  // Efeitos especiais por tipo
  useEffect(() => {
    if (!isPlaying) return;

    switch (type) {
      case 'beijo':
        // Animação de pulsar
        scaleAnimation.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(1.2, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
        hapticFeedback('impactLight');
        break;
        
      case 'bravo':
        // Animação de tremor
        rotationAnimation.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        hapticFeedback('impactMedium');
        break;
        
      case 'cool':
        // Animação de slide
        scaleAnimation.value = withSequence(
          withTiming(0.8, { duration: 100 }),
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 100 })
        );
        break;
        
      case 'fire':
        // Animação de explosão
        scaleAnimation.value = withSequence(
          withTiming(0.5, { duration: 100 }),
          withTiming(1.5, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
        hapticFeedback('impactHeavy');
        break;
        
      case 'ice':
        // Animação de congelamento
        opacityAnimation.value = withSequence(
          withTiming(0.3, { duration: 100 }),
          withTiming(1, { duration: 300 })
        );
        break;
        
      case 'meteor':
        // Animação de impacto
        scaleAnimation.value = withSequence(
          withTiming(0.3, { duration: 100 }),
          withTiming(1.8, { duration: 150 }),
          withTiming(1, { duration: 250 })
        );
        rotationAnimation.value = withTiming(360, { duration: 500 });
        hapticFeedback('impactHeavy');
        break;
    }
  }, [isPlaying, type, scaleAnimation, rotationAnimation, opacityAnimation]);

  // Controle da animação de frames
  useEffect(() => {
    if (!isAnimating || frames.length === 0) return;

    const frameDuration = 1000 / frameRate;
    let frameIndex = 0;

    animationInterval.current = setInterval(() => {
      frameIndex++;
      
      if (frameIndex >= frames.length) {
        if (loop) {
          frameIndex = 0;
        } else {
          setIsAnimating(false);
          if (animationInterval.current) {
            clearInterval(animationInterval.current);
          }
          onComplete?.();
          return;
        }
      }
      
      setCurrentFrame(frameIndex);
    }, frameDuration);

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [isAnimating, frames, frameRate, loop, onComplete]);

  // Iniciar animação
  useEffect(() => {
    if (autoPlay && frames.length > 0) {
      setIsAnimating(true);
    }
  }, [autoPlay, frames]);

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scaleAnimation.value },
        { rotate: `${rotationAnimation.value}deg` },
      ],
      opacity: opacityAnimation.value,
    };
  });

  // Se houver erro ou não houver frames, usar fallback
  if (hasError || frames.length === 0) {
    return <FallbackEmoji type={type} size={dimensions} />;
  }

  // Frame atual
  const currentFrameSource = frames[currentFrame];
  
  if (!currentFrameSource) {
    return <FallbackEmoji type={type} size={dimensions} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[animatedStyle]}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
      >
        <Image
          source={currentFrameSource}
          style={[
            styles.emoji,
            {
              width: dimensions,
              height: dimensions,
            },
          ]}
          resizeMode="contain"
          onError={() => setHasError(true)}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    // Dimensões definidas dinamicamente
  },
});

export default AnimatedEmoji;