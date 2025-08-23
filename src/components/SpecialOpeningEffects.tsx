import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, BlurMask } from '@shopify/react-native-skia';
import { hapticFeedback } from '../utils/haptic';
import Sound from 'react-native-sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type EffectType = 'fire' | 'ice' | 'meteor' | 'lightning' | 'rainbow' | 'cosmic';
export type RarityLevel = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface SpecialOpeningEffectsProps {
  type: EffectType;
  rarity: RarityLevel;
  onComplete?: () => void;
  autoPlay?: boolean;
  soundEnabled?: boolean;
}

// Mapeamento de raridade para efeitos
const RARITY_EFFECTS: Record<RarityLevel, EffectType> = {
  common: 'fire',
  rare: 'ice',
  epic: 'lightning',
  legendary: 'meteor',
  mythic: 'cosmic',
};

// Configurações de efeitos
const EFFECT_CONFIG = {
  fire: {
    colors: ['#FF6B6B', '#FF8E53', '#FFD93D'],
    duration: 2000,
    particles: 30,
    sound: 'fire_explosion.mp3',
    haptic: 'impactHeavy',
  },
  ice: {
    colors: ['#4FC3F7', '#29B6F6', '#FFFFFF'],
    duration: 2500,
    particles: 40,
    sound: 'ice_crystal.mp3',
    haptic: 'impactMedium',
  },
  meteor: {
    colors: ['#FF5722', '#FF9800', '#FFEB3B'],
    duration: 3000,
    particles: 50,
    sound: 'meteor_impact.mp3',
    haptic: 'notificationWarning',
  },
  lightning: {
    colors: ['#9C27B0', '#E91E63', '#FFFFFF'],
    duration: 1500,
    particles: 25,
    sound: 'lightning_strike.mp3',
    haptic: 'impactLight',
  },
  rainbow: {
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
    duration: 3000,
    particles: 60,
    sound: 'rainbow_magic.mp3',
    haptic: 'selection',
  },
  cosmic: {
    colors: ['#6A0DAD', '#FF00FF', '#00FFFF', '#FFD700'],
    duration: 4000,
    particles: 80,
    sound: 'cosmic_explosion.mp3',
    haptic: 'notificationSuccess',
  },
};

// Componente de Partícula Individual
const Particle: React.FC<{
  index: number;
  type: EffectType;
  delay: number;
}> = ({ index, type, delay }) => {
  const config = EFFECT_CONFIG[type];
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const angle = (index / config.particles) * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration: config.duration })
    );
    translateY.value = withDelay(
      delay,
      withTiming(targetY, { duration: config.duration })
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1 + Math.random()),
        withTiming(0, { duration: config.duration / 2 })
      )
    );
    opacity.value = withDelay(
      delay + config.duration / 2,
      withTiming(0, { duration: config.duration / 2 })
    );
    rotation.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: config.duration })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const particleColor = config.colors[index % config.colors.length];

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <View 
        style={[
          styles.particleInner,
          { backgroundColor: particleColor }
        ]} 
      />
    </Animated.View>
  );
};

// Efeito de Fogo
const FireEffect: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const scaleAnimation = useSharedValue(0);
  const rotationAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(1);

  useEffect(() => {
    scaleAnimation.value = withSequence(
      withSpring(1.5),
      withSpring(1),
      withTiming(3, { duration: 500 })
    );
    rotationAnimation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      2
    );
    opacityAnimation.value = withDelay(
      1500,
      withTiming(0, { duration: 500 })
    );

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnimation.value },
      { rotate: `${rotationAnimation.value}deg` },
    ],
    opacity: opacityAnimation.value,
  }));

  return (
    <Animated.View style={[styles.effectContainer, animatedStyle]}>
      {/* Chamas centrais */}
      <View style={styles.fireCenter}>
        {Array.from({ length: 30 }).map((_, i) => (
          <Particle key={i} index={i} type="fire" delay={i * 20} />
        ))}
      </View>
      
      {/* Anel de fogo */}
      <Animated.View 
        style={[
          styles.fireRing,
          { borderColor: '#FF6B6B' }
        ]}
      />
    </Animated.View>
  );
};

// Efeito de Gelo
const IceEffect: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const crystallizeAnimation = useSharedValue(0);
  const shatterAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(1);

  useEffect(() => {
    crystallizeAnimation.value = withTiming(1, { duration: 1000 });
    shatterAnimation.value = withDelay(
      1000,
      withSpring(1)
    );
    opacityAnimation.value = withDelay(
      2000,
      withTiming(0, { duration: 500 })
    );

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
  }));

  const crystallStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          crystallizeAnimation.value,
          [0, 1],
          [0, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.effectContainer, animatedStyle]}>
      {/* Cristais de gelo */}
      <Animated.View style={[styles.iceCrystals, crystallStyle]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.iceShard,
              {
                transform: [
                  { rotate: `${i * 60}deg` },
                  { translateY: -50 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
      
      {/* Partículas de neve */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Particle key={i} index={i} type="ice" delay={i * 15} />
      ))}
    </Animated.View>
  );
};

// Efeito de Meteoro
const MeteorEffect: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const meteorY = useSharedValue(-SCREEN_HEIGHT);
  const impactScale = useSharedValue(0);
  const shockwaveScale = useSharedValue(0);
  const opacityAnimation = useSharedValue(1);

  useEffect(() => {
    // Meteoro caindo
    meteorY.value = withTiming(0, { duration: 800 });
    
    // Impacto
    setTimeout(() => {
      hapticFeedback('notificationWarning');
      impactScale.value = withSpring(1);
      shockwaveScale.value = withTiming(3, { duration: 1000 });
    }, 800);

    // Fade out
    opacityAnimation.value = withDelay(
      2500,
      withTiming(0, { duration: 500 })
    );

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const meteorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: meteorY.value },
    ],
  }));

  const impactStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: impactScale.value },
    ],
  }));

  const shockwaveStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: shockwaveScale.value },
    ],
    opacity: interpolate(
      shockwaveScale.value,
      [0, 3],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View style={[styles.effectContainer, { opacity: opacityAnimation.value }]}>
      {/* Meteoro */}
      <Animated.View style={[styles.meteor, meteorStyle]}>
        <View style={styles.meteorCore} />
        <View style={styles.meteorTail} />
      </Animated.View>
      
      {/* Impacto */}
      <Animated.View style={[styles.impact, impactStyle]}>
        {Array.from({ length: 50 }).map((_, i) => (
          <Particle key={i} index={i} type="meteor" delay={800 + i * 10} />
        ))}
      </Animated.View>
      
      {/* Onda de choque */}
      <Animated.View style={[styles.shockwave, shockwaveStyle]} />
    </Animated.View>
  );
};

// Componente Principal
const SpecialOpeningEffects: React.FC<SpecialOpeningEffectsProps> = ({
  type,
  rarity,
  onComplete,
  autoPlay = true,
  soundEnabled = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentEffect, setCurrentEffect] = useState(type);
  
  // Som
  useEffect(() => {
    if (soundEnabled && isPlaying) {
      const config = EFFECT_CONFIG[currentEffect];
      // Tocar som do efeito
      Sound.setCategory('Playback');
      const sound = new Sound(config.sound, Sound.MAIN_BUNDLE, (error) => {
        if (!error) {
          sound.play();
        }
      });
      
      return () => {
        sound.release();
      };
    }
  }, [currentEffect, isPlaying, soundEnabled]);

  // Haptic feedback
  useEffect(() => {
    if (isPlaying) {
      const config = EFFECT_CONFIG[currentEffect];
      hapticFeedback(config.haptic as any);
    }
  }, [currentEffect, isPlaying]);

  const handleComplete = () => {
    setIsPlaying(false);
    onComplete?.();
  };

  if (!isPlaying) return null;

  // Renderizar efeito baseado no tipo
  const renderEffect = () => {
    switch (currentEffect) {
      case 'fire':
        return <FireEffect onComplete={handleComplete} />;
      case 'ice':
        return <IceEffect onComplete={handleComplete} />;
      case 'meteor':
        return <MeteorEffect onComplete={handleComplete} />;
      default:
        return <FireEffect onComplete={handleComplete} />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.overlay}
      >
        {renderEffect()}
      </Animated.View>
    </View>
  );
};

// Hook para gerenciar efeitos
export const useSpecialEffects = () => {
  const [activeEffect, setActiveEffect] = useState<EffectType | null>(null);
  
  const triggerEffect = (rarity: RarityLevel) => {
    const effect = RARITY_EFFECTS[rarity];
    setActiveEffect(effect);
    
    // Auto-limpar após duração
    const config = EFFECT_CONFIG[effect];
    setTimeout(() => {
      setActiveEffect(null);
    }, config.duration + 500);
  };

  const clearEffect = () => {
    setActiveEffect(null);
  };

  return {
    activeEffect,
    triggerEffect,
    clearEffect,
  };
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  effectContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  particleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  
  // Fire styles
  fireCenter: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#FF6B6B',
  },
  
  // Ice styles
  iceCrystals: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iceShard: {
    position: 'absolute',
    width: 4,
    height: 100,
    backgroundColor: '#4FC3F7',
    borderRadius: 2,
  },
  
  // Meteor styles
  meteor: {
    position: 'absolute',
    alignItems: 'center',
  },
  meteorCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5722',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  meteorTail: {
    position: 'absolute',
    width: 40,
    height: 200,
    backgroundColor: '#FF9800',
    opacity: 0.6,
    top: -150,
    borderRadius: 20,
  },
  impact: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shockwave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#FFD93D',
  },
});

export default SpecialOpeningEffects;