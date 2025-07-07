import { useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import {
  fadeAnimation,
  scaleAnimation,
  slideAnimation,
  rotateAnimation,
  feedbackAnimations,
  ANIMATION_CONFIGS,
} from '../utils/animations';

/**
 * Hook personalizado para gerenciar animações
 */

interface UseAnimationsOptions {
  autoStart?: boolean;
  loop?: boolean;
  duration?: number;
}

export const useAnimations = (options: UseAnimationsOptions = {}) => {
  const {
    autoStart = false,
    loop = false,
    duration = ANIMATION_CONFIGS.NORMAL,
  } = options;

  // Animated values
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const slideValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const shakeValue = useRef(new Animated.Value(0)).current;

  // Animation references
  const currentAnimation = useRef<Animated.CompositeAnimation | null>(null);

  /**
   * Stop current animation
   */
  const stopAnimation = useCallback(() => {
    if (currentAnimation.current) {
      currentAnimation.current.stop();
      currentAnimation.current = null;
    }
  }, []);

  /**
   * Fade animations
   */
  const fade = useCallback({
    in: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = fadeAnimation.fadeIn(fadeValue, duration);
      currentAnimation.current.start(callback);
    },
    out: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = fadeAnimation.fadeOut(fadeValue, duration);
      currentAnimation.current.start(callback);
    },
    toggle: (visible: boolean, callback?: () => void) => {
      if (visible) {
        fade.in(callback);
      } else {
        fade.out(callback);
      }
    },
  }, [fadeValue, duration, stopAnimation]);

  /**
   * Scale animations
   */
  const scale = useCallback({
    in: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = scaleAnimation.scaleIn(scaleValue, duration);
      currentAnimation.current.start(callback);
    },
    out: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = scaleAnimation.scaleOut(scaleValue, duration);
      currentAnimation.current.start(callback);
    },
    pulse: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = scaleAnimation.pulse(scaleValue);
      currentAnimation.current.start(callback);
    },
    bounce: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = scaleAnimation.bounce(scaleValue);
      currentAnimation.current.start(callback);
    },
  }, [scaleValue, duration, stopAnimation]);

  /**
   * Slide animations
   */
  const slide = useCallback({
    inFromRight: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = slideAnimation.slideInFromRight(slideValue, duration);
      currentAnimation.current.start(callback);
    },
    inFromLeft: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = slideAnimation.slideInFromLeft(slideValue, duration);
      currentAnimation.current.start(callback);
    },
    inFromBottom: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = slideAnimation.slideInFromBottom(slideValue, duration);
      currentAnimation.current.start(callback);
    },
  }, [slideValue, duration, stopAnimation]);

  /**
   * Rotate animations
   */
  const rotate = useCallback({
    start: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = rotateAnimation.rotate(rotateValue, duration);
      currentAnimation.current.start(callback);
    },
    spin: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = rotateAnimation.spin(rotateValue);
      currentAnimation.current.start(callback);
    },
  }, [rotateValue, duration, stopAnimation]);

  /**
   * Feedback animations
   */
  const feedback = useCallback({
    success: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = feedbackAnimations.success(scaleValue);
      currentAnimation.current.start(callback);
    },
    error: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = feedbackAnimations.error(shakeValue);
      currentAnimation.current.start(callback);
    },
    loading: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = feedbackAnimations.loading(fadeValue);
      currentAnimation.current.start(callback);
    },
  }, [scaleValue, shakeValue, fadeValue, stopAnimation]);

  /**
   * Combined animations
   */
  const combined = useCallback({
    fadeInScale: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = Animated.parallel([
        fadeAnimation.fadeIn(fadeValue, duration),
        scaleAnimation.scaleIn(scaleValue, duration),
      ]);
      currentAnimation.current.start(callback);
    },
    fadeOutScale: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = Animated.parallel([
        fadeAnimation.fadeOut(fadeValue, duration),
        scaleAnimation.scaleOut(scaleValue, duration),
      ]);
      currentAnimation.current.start(callback);
    },
    slideInFade: (callback?: () => void) => {
      stopAnimation();
      currentAnimation.current = Animated.parallel([
        slideAnimation.slideInFromBottom(slideValue, duration),
        fadeAnimation.fadeIn(fadeValue, duration),
      ]);
      currentAnimation.current.start(callback);
    },
  }, [fadeValue, scaleValue, slideValue, duration, stopAnimation]);

  /**
   * Reset all values
   */
  const reset = useCallback(() => {
    stopAnimation();
    fadeValue.setValue(0);
    scaleValue.setValue(1);
    slideValue.setValue(0);
    rotateValue.setValue(0);
    shakeValue.setValue(0);
  }, [fadeValue, scaleValue, slideValue, rotateValue, shakeValue, stopAnimation]);

  /**
   * Auto-start animation
   */
  useEffect(() => {
    if (autoStart) {
      fade.in();
    }
  }, [autoStart, fade]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    // Animated values
    values: {
      fade: fadeValue,
      scale: scaleValue,
      slide: slideValue,
      rotate: rotateValue,
      shake: shakeValue,
    },
    
    // Animation functions
    fade,
    scale,
    slide,
    rotate,
    feedback,
    combined,
    
    // Utility functions
    stop: stopAnimation,
    reset,
    
    // State
    isAnimating: currentAnimation.current !== null,
  };
};

/**
 * Hook específico para animações de entrada
 */
export const useEntranceAnimation = (
  type: 'fade' | 'scale' | 'slide' | 'combined' = 'fade',
  autoStart = true
) => {
  const animations = useAnimations({ autoStart: false });

  const start = useCallback((callback?: () => void) => {
    switch (type) {
      case 'fade':
        animations.fade.in(callback);
        break;
      case 'scale':
        animations.scale.in(callback);
        break;
      case 'slide':
        animations.slide.inFromBottom(callback);
        break;
      case 'combined':
        animations.combined.fadeInScale(callback);
        break;
    }
  }, [type, animations]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  return {
    ...animations,
    start,
  };
};

/**
 * Hook específico para animações de feedback
 */
export const useFeedbackAnimation = () => {
  const animations = useAnimations();

  const showSuccess = useCallback((callback?: () => void) => {
    animations.feedback.success(callback);
  }, [animations]);

  const showError = useCallback((callback?: () => void) => {
    animations.feedback.error(callback);
  }, [animations]);

  const showLoading = useCallback((callback?: () => void) => {
    animations.feedback.loading(callback);
  }, [animations]);

  return {
    values: animations.values,
    showSuccess,
    showError,
    showLoading,
    stop: animations.stop,
    reset: animations.reset,
  };
};

/**
 * Hook específico para animações de lista
 */
export const useListAnimation = (itemCount: number, staggerDelay = 100) => {
  const animatedValues = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  const startStaggered = useCallback((callback?: () => void) => {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.NORMAL,
        delay: index * staggerDelay,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start(callback);
  }, [animatedValues, staggerDelay]);

  const reset = useCallback(() => {
    animatedValues.forEach(value => value.setValue(0));
  }, [animatedValues]);

  return {
    values: animatedValues,
    startStaggered,
    reset,
  };
};

/**
 * Hook específico para animações de toggle
 */
export const useToggleAnimation = (initialState = false) => {
  const animations = useAnimations();
  const isToggled = useRef(initialState);

  const toggle = useCallback((callback?: () => void) => {
    isToggled.current = !isToggled.current;
    animations.fade.toggle(isToggled.current, callback);
  }, [animations]);

  const setToggle = useCallback((state: boolean, callback?: () => void) => {
    isToggled.current = state;
    animations.fade.toggle(state, callback);
  }, [animations]);

  return {
    values: animations.values,
    toggle,
    setToggle,
    isToggled: isToggled.current,
    reset: animations.reset,
  };
};

export default useAnimations;
