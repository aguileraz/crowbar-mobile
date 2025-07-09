/**
 * Transições entre telas e elementos
 */

import {
  withTiming,
  withSpring,
  withDelay,
  SharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { DURATIONS, SPRING_CONFIGS, EASINGS } from './constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransitionOptions {
  duration?: number;
  delay?: number;
  springConfig?: typeof SPRING_CONFIGS.smooth;
}

/**
 * Transição de fade entre telas
 */
export const screenFadeTransition = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0 } = options;
  
  return {
    opacity: withDelay(
      delay,
      withTiming(progress.value, {
        duration,
        easing: EASINGS.easeInOut,
      })
    ),
  };
};

/**
 * Transição de slide horizontal
 */
export const screenSlideHorizontal = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const translateX = interpolate(
    progress.value,
    [0, 1],
    [SCREEN_WIDTH, 0],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{
      translateX: withDelay(delay, withSpring(translateX, springConfig)),
    }],
  };
};

/**
 * Transição de slide vertical
 */
export const screenSlideVertical = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const translateY = interpolate(
    progress.value,
    [0, 1],
    [SCREEN_HEIGHT, 0],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{
      translateY: withDelay(delay, withSpring(translateY, springConfig)),
    }],
  };
};

/**
 * Transição de escala
 */
export const screenScaleTransition = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const scale = interpolate(
    progress.value,
    [0, 1],
    [0.8, 1],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{
      scale: withDelay(delay, withSpring(scale, springConfig)),
    }],
    opacity: interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.7, 1],
      Extrapolate.CLAMP
    ),
  };
};

/**
 * Transição de modal (slide up + fade)
 */
export const modalTransition = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const translateY = interpolate(
    progress.value,
    [0, 1],
    [SCREEN_HEIGHT * 0.3, 0],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{
      translateY: withDelay(delay, withSpring(translateY, springConfig)),
    }],
    opacity: interpolate(
      progress.value,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    ),
  };
};

/**
 * Transição de card flip
 */
export const cardFlipTransition = (
  progress: SharedValue<number>,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0 } = options;
  
  const rotateY = interpolate(
    progress.value,
    [0, 1],
    [0, 180],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{
      rotateY: withDelay(
        delay,
        withTiming(`${rotateY}deg`, {
          duration,
          easing: EASINGS.easeInOut,
        })
      ),
    }],
  };
};

/**
 * Transição parallax
 */
export const parallaxTransition = (
  scrollY: SharedValue<number>,
  inputRange: number[],
  outputRange: number[],
  options: TransitionOptions = {}
) => {
  'worklet';
  
  const translateY = interpolate(
    scrollY.value,
    inputRange,
    outputRange,
    Extrapolate.CLAMP
  );
  
  return {
    transform: [{ translateY }],
  };
};

/**
 * Transição de hero element
 */
export const heroTransition = (
  progress: SharedValue<number>,
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number; height: number },
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const translateX = interpolate(
    progress.value,
    [0, 1],
    [from.x, to.x],
    Extrapolate.CLAMP
  );
  
  const translateY = interpolate(
    progress.value,
    [0, 1],
    [from.y, to.y],
    Extrapolate.CLAMP
  );
  
  const scaleX = interpolate(
    progress.value,
    [0, 1],
    [from.width / to.width, 1],
    Extrapolate.CLAMP
  );
  
  const scaleY = interpolate(
    progress.value,
    [0, 1],
    [from.height / to.height, 1],
    Extrapolate.CLAMP
  );
  
  return {
    transform: [
      {
        translateX: withDelay(delay, withSpring(translateX, springConfig)),
      },
      {
        translateY: withDelay(delay, withSpring(translateY, springConfig)),
      },
      {
        scaleX: withDelay(delay, withSpring(scaleX, springConfig)),
      },
      {
        scaleY: withDelay(delay, withSpring(scaleY, springConfig)),
      },
    ],
  };
};

/**
 * Transição de accordion
 */
export const accordionTransition = (
  progress: SharedValue<number>,
  maxHeight: number,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0 } = options;
  
  const height = interpolate(
    progress.value,
    [0, 1],
    [0, maxHeight],
    Extrapolate.CLAMP
  );
  
  return {
    height: withDelay(delay, withSpring(height, springConfig)),
    opacity: interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    ),
  };
};

/**
 * Transição de tab switching
 */
export const tabSwitchTransition = (
  currentIndex: SharedValue<number>,
  targetIndex: number,
  itemWidth: number,
  options: TransitionOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth } = options;
  
  currentIndex.value = withSpring(targetIndex, springConfig);
  
  return {
    transform: [{
      translateX: interpolate(
        currentIndex.value,
        [0, 1, 2, 3, 4],
        [0, itemWidth, itemWidth * 2, itemWidth * 3, itemWidth * 4],
        Extrapolate.CLAMP
      ),
    }],
  };
};