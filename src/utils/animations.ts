import { Animated, Easing } from 'react-native';

/**
 * Utilitários para animações e micro-interações
 */

// Configurações padrão de animação
export const ANIMATION_CONFIGS = {
  // Durações
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  VERY_SLOW: 600,
  
  // Easings
  EASE_OUT: Easing.out(Easing.quad),
  EASE_IN: Easing.in(Easing.quad),
  EASE_IN_OUT: Easing.inOut(Easing.quad),
  BOUNCE: Easing.bounce,
  ELASTIC: Easing.elastic(1),
  
  // Spring configs
  SPRING_CONFIG: {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  },
  
  BOUNCE_SPRING: {
    tension: 150,
    friction: 6,
    useNativeDriver: true,
  },
};

/**
 * Animação de fade in/out
 */
export const fadeAnimation = {
  fadeIn: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL,
    toValue = 1
  ) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: ANIMATION_CONFIGS.EASE_OUT,
      useNativeDriver: true,
    });
  },
  
  fadeOut: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL,
    toValue = 0
  ) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: ANIMATION_CONFIGS.EASE_IN,
      useNativeDriver: true,
    });
  },
};

/**
 * Animação de escala
 */
export const scaleAnimation = {
  scaleIn: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL,
    toValue = 1
  ) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: ANIMATION_CONFIGS.EASE_OUT,
      useNativeDriver: true,
    });
  },
  
  scaleOut: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL,
    toValue = 0
  ) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: ANIMATION_CONFIGS.EASE_IN,
      useNativeDriver: true,
    });
  },
  
  pulse: (animatedValue: Animated.Value, scale = 1.1) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: scale,
        duration: ANIMATION_CONFIGS.FAST,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.FAST,
        easing: ANIMATION_CONFIGS.EASE_IN,
        useNativeDriver: true,
      }),
    ]);
  },
  
  bounce: (animatedValue: Animated.Value) => {
    return Animated.spring(animatedValue, {
      toValue: 1,
      ...ANIMATION_CONFIGS.BOUNCE_SPRING,
    });
  },
};

/**
 * Animação de slide
 */
export const slideAnimation = {
  slideInFromRight: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: ANIMATION_CONFIGS.EASE_OUT,
      useNativeDriver: true,
    });
  },
  
  slideInFromLeft: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: ANIMATION_CONFIGS.EASE_OUT,
      useNativeDriver: true,
    });
  },
  
  slideInFromBottom: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: ANIMATION_CONFIGS.EASE_OUT,
      useNativeDriver: true,
    });
  },
};

/**
 * Animação de rotação
 */
export const rotateAnimation = {
  rotate: (
    animatedValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL,
    toValue = 1
  ) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
  },
  
  spin: (animatedValue: Animated.Value, duration = 1000) => {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  },
};

/**
 * Animações combinadas
 */
export const combinedAnimations = {
  fadeInScale: (
    fadeValue: Animated.Value,
    scaleValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.parallel([
      fadeAnimation.fadeIn(fadeValue, duration),
      scaleAnimation.scaleIn(scaleValue, duration),
    ]);
  },
  
  fadeOutScale: (
    fadeValue: Animated.Value,
    scaleValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.parallel([
      fadeAnimation.fadeOut(fadeValue, duration),
      scaleAnimation.scaleOut(scaleValue, duration),
    ]);
  },
  
  slideInFade: (
    slideValue: Animated.Value,
    fadeValue: Animated.Value,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    return Animated.parallel([
      slideAnimation.slideInFromBottom(slideValue, duration),
      fadeAnimation.fadeIn(fadeValue, duration),
    ]);
  },
};

/**
 * Animações de lista
 */
export const listAnimations = {
  staggeredFadeIn: (
    animatedValues: Animated.Value[],
    staggerDelay = 100,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        delay: index * staggerDelay,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      })
    );
    
    return Animated.parallel(animations);
  },
  
  staggeredSlideIn: (
    animatedValues: Animated.Value[],
    staggerDelay = 100,
    duration = ANIMATION_CONFIGS.NORMAL
  ) => {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 0,
        duration,
        delay: index * staggerDelay,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      })
    );
    
    return Animated.parallel(animations);
  },
};

/**
 * Animações de feedback
 */
export const feedbackAnimations = {
  success: (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: ANIMATION_CONFIGS.FAST,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        ...ANIMATION_CONFIGS.SPRING_CONFIG,
      }),
    ]);
  },
  
  error: (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]);
  },
  
  loading: (animatedValue: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          easing: ANIMATION_CONFIGS.EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          easing: ANIMATION_CONFIGS.EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ])
    );
  },
};

/**
 * Interpolações úteis
 */
export const interpolations = {
  fadeInterpolation: (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
  }),
  
  scaleInterpolation: (animatedValue: Animated.Value) => ({
    transform: [{ scale: animatedValue }],
  }),
  
  slideFromRightInterpolation: (animatedValue: Animated.Value, distance = 100) => ({
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  }),
  
  slideFromBottomInterpolation: (animatedValue: Animated.Value, distance = 100) => ({
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  }),
  
  rotateInterpolation: (animatedValue: Animated.Value) => ({
    transform: [
      {
        rotate: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  }),
  
  shakeInterpolation: (animatedValue: Animated.Value) => ({
    transform: [
      {
        translateX: animatedValue,
      },
    ],
  }),
};
