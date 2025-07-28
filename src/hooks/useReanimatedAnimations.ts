/**
 * Hook personalizado para animações com React Native Reanimated
 */

import { useEffect, useCallback } from 'react';
import logger from '../services/loggerService';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  cancelAnimation,
  runOnJS,
  SharedValue,
  AnimatedStyleProp,
} from 'react-native-reanimated';
import {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  slideInFromTop,
  slideInFromLeft,
  slideInFromRight,
  rotate,
  fadeAndScale,
  slideAndFade,
} from '../animations/animations';
import { SPRING_CONFIGS, DURATIONS } from '../animations/constants';

interface UseReanimatedAnimationsOptions {
  autoStart?: boolean;
  loop?: boolean;
  reverse?: boolean;
  delay?: number;
  onComplete?: () => void;
}

export const useReanimatedAnimations = (options: UseReanimatedAnimationsOptions = {}) => {
  const {
    autoStart = false,
    loop = false,
    reverse = false,
    delay = 0,
    onComplete,
  } = options;

  // Valores compartilhados
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Funções de animação
  const animateFadeIn = useCallback((duration = DURATIONS.normal) => {
    fadeIn(opacity, { duration, delay, callback: onComplete });
  }, [delay, onComplete]);

  const animateFadeOut = useCallback((duration = DURATIONS.normal) => {
    fadeOut(opacity, { duration, delay, callback: onComplete });
  }, [delay, onComplete]);

  const animateScaleIn = useCallback((springConfig = SPRING_CONFIGS.smooth) => {
    scaleIn(scale, { springConfig, delay, callback: onComplete });
  }, [delay, onComplete]);

  const animateScaleOut = useCallback((springConfig = SPRING_CONFIGS.smooth) => {
    scaleOut(scale, { springConfig, delay, callback: onComplete });
  }, [delay, onComplete]);

  const animateSlideIn = useCallback((
    direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
    springConfig = SPRING_CONFIGS.smooth
  ) => {
    const value = direction === 'left' || direction === 'right' ? translateX : translateY;
    
    switch (direction) {
      case 'left':
        slideInFromLeft(value, { springConfig, delay, callback: onComplete });
        break;
      case 'right':
        slideInFromRight(value, { springConfig, delay, callback: onComplete });
        break;
      case 'top':
        slideInFromTop(value, { springConfig, delay, callback: onComplete });
        break;
      case 'bottom':
        slideInFromBottom(value, { springConfig, delay, callback: onComplete });
        break;
    }
  }, [delay, onComplete]);

  const animateRotate = useCallback((degrees = 360, duration = DURATIONS.normal) => {
    rotate(rotation, degrees, { duration, delay, callback: onComplete });
  }, [delay, onComplete]);

  const animateCombined = useCallback((
    type: 'fadeScale' | 'slideFade' = 'fadeScale',
    animOptions?: any
  ) => {
    switch (type) {
      case 'fadeScale':
        fadeAndScale(opacity, scale, { ...animOptions, delay, callback: onComplete });
        break;
      case 'slideFade':
        slideAndFade(translateY, opacity, { ...animOptions, delay, callback: onComplete });
        break;
    }
  }, [delay, onComplete]);

  // Parar todas as animações
  const stopAll = useCallback(() => {
    'worklet';
    cancelAnimation(opacity);
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(rotation);
  }, []);

  // Reset valores
  const reset = useCallback(() => {
    'worklet';
    opacity.value = 0;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    rotation.value = 0;
  }, []);

  // Auto-start
  useEffect(() => {
    if (autoStart) {
      animateFadeIn();
    }
  }, [autoStart, animateFadeIn]);

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return {
    // Valores
    values: {
      opacity,
      scale,
      translateX,
      translateY,
      rotation,
    },
    
    // Funções de animação
    animate: {
      fadeIn: animateFadeIn,
      fadeOut: animateFadeOut,
      scaleIn: animateScaleIn,
      scaleOut: animateScaleOut,
      slideIn: animateSlideIn,
      rotate: animateRotate,
      combined: animateCombined,
    },
    
    // Controles
    stop: stopAll,
    reset,
    
    // Estilos
    animatedStyle,
  };
};

// Hook específico para animações de entrada
export const useEntranceAnimation = (
  type: 'fade' | 'scale' | 'slide' | 'combined' = 'fade',
  options: UseReanimatedAnimationsOptions = {}
) => {
  const animations = useReanimatedAnimations(options);

  useEffect(() => {
    if (options.autoStart !== false) {
      switch (type) {
        case 'fade':
          animations.animate.fadeIn();
          break;
        case 'scale':
          animations.animate.scaleIn();
          break;
        case 'slide':
          animations.animate.slideIn('bottom');
          break;
        case 'combined':
          animations.animate.combined('fadeScale');
          break;
      }
    }
  }, [type]);

  return animations;
};

// Hook para animações de lista
// DISABLED: This hook violates React Hooks rules - can't dynamically create hooks
export const useListAnimation = (
  itemCount: number,
  options: {
    staggerDelay?: number;
    animationType?: 'fade' | 'scale' | 'slide';
  } = {}
) => {
  logger.warn('useListAnimation has been disabled due to React Hooks violations. Use individual animation hooks instead.');
  
  return {
    animatedValues: [],
    animatedStyles: [],
    startAnimation: () => {},
    reset: () => {},
    getAnimatedStyle: () => ({}),
  };
};

// Hook para animações baseadas em scroll
export const useScrollAnimation = (scrollThreshold = 100) => {
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const headerScale = useSharedValue(1);

  const updateScroll = useCallback((value: number) => {
    'worklet';
    scrollY.value = value;
    
    // Animações baseadas no scroll
    if (value > scrollThreshold) {
      headerOpacity.value = withTiming(0.9, { duration: DURATIONS.fast });
      headerScale.value = withTiming(0.95, { duration: DURATIONS.fast });
    } else {
      headerOpacity.value = withTiming(1, { duration: DURATIONS.fast });
      headerScale.value = withTiming(1, { duration: DURATIONS.fast });
    }
  }, [scrollThreshold]);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ scale: headerScale.value }],
    };
  });

  const parallaxStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: scrollY.value * 0.5,
      }],
    };
  });

  return {
    scrollY,
    updateScroll,
    headerAnimatedStyle,
    parallaxStyle,
  };
};

// Hook para animações de feedback
export const useFeedbackAnimation = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shake = useSharedValue(0);

  const showSuccess = useCallback((callback?: () => void) => {
    'worklet';
    scale.value = withSequence(
      withSpring(1.2, SPRING_CONFIGS.bouncy),
      withSpring(1, SPRING_CONFIGS.smooth, (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      })
    );
  }, []);

  const showError = useCallback((callback?: () => void) => {
    'worklet';
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 }, (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: shake.value },
      ],
      opacity: opacity.value,
    };
  });

  return {
    showSuccess,
    showError,
    animatedStyle,
  };
};