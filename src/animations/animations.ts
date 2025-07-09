/**
 * Biblioteca de animações reutilizáveis
 */

import {
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { DURATIONS, SPRING_CONFIGS, EASINGS } from './constants';

// Tipos de animação
export type AnimationType = 'timing' | 'spring';
export type AnimationCallback = () => void;

interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: typeof Easing.linear;
  springConfig?: typeof SPRING_CONFIGS.smooth;
  callback?: AnimationCallback;
}

/**
 * Animação de fade
 */
export const fadeIn = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0, easing = EASINGS.easeOut, callback } = options;
  
  value.value = withDelay(
    delay,
    withTiming(1, { duration, easing }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const fadeOut = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0, easing = EASINGS.easeIn, callback } = options;
  
  value.value = withDelay(
    delay,
    withTiming(0, { duration, easing }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const fadeInOut = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0 } = options;
  
  value.value = withDelay(
    delay,
    withSequence(
      withTiming(1, { duration: duration / 2 }),
      withTiming(0, { duration: duration / 2 })
    )
  );
};

/**
 * Animação de escala
 */
export const scaleIn = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(1, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const scaleOut = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(0, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const scaleBounce = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.bouncy, delay = 0 } = options;
  
  value.value = withDelay(
    delay,
    withSequence(
      withSpring(1.2, springConfig),
      withSpring(1, springConfig)
    )
  );
};

export const pulse = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0 } = options;
  
  value.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      ),
      -1,
      true
    )
  );
};

/**
 * Animação de slide
 */
export const slideInFromRight = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(0, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const slideInFromLeft = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(0, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const slideInFromBottom = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(0, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const slideInFromTop = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, delay = 0, callback } = options;
  
  value.value = withDelay(
    delay,
    withSpring(0, springConfig, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

/**
 * Animação de rotação
 */
export const rotate = (
  value: SharedValue<number>,
  degrees: number = 360,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.normal, delay = 0, easing = EASINGS.linear, callback } = options;
  
  value.value = withDelay(
    delay,
    withTiming(degrees, { duration, easing }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

export const spin = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.slow * 2, delay = 0 } = options;
  
  value.value = withDelay(
    delay,
    withRepeat(
      withTiming(360, { duration, easing: EASINGS.linear }),
      -1,
      false
    )
  );
};

export const wiggle = (
  value: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.fast, delay = 0 } = options;
  
  value.value = withDelay(
    delay,
    withSequence(
      withTiming(-10, { duration: duration / 4 }),
      withTiming(10, { duration: duration / 2 }),
      withTiming(-10, { duration: duration / 2 }),
      withTiming(0, { duration: duration / 4 })
    )
  );
};

/**
 * Animações combinadas
 */
export const fadeAndScale = (
  fadeValue: SharedValue<number>,
  scaleValue: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  fadeIn(fadeValue, options);
  scaleIn(scaleValue, options);
};

export const slideAndFade = (
  slideValue: SharedValue<number>,
  fadeValue: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  slideInFromBottom(slideValue, options);
  fadeIn(fadeValue, options);
};

export const scaleAndRotate = (
  scaleValue: SharedValue<number>,
  rotateValue: SharedValue<number>,
  options: AnimationOptions = {}
) => {
  'worklet';
  scaleIn(scaleValue, options);
  rotate(rotateValue, 360, options);
};

/**
 * Reset de valores
 */
export const resetValue = (value: SharedValue<number>, initialValue: number = 0) => {
  'worklet';
  value.value = initialValue;
};

export const resetMultipleValues = (values: { value: SharedValue<number>, initial: number }[]) => {
  'worklet';
  values.forEach(({ value, initial }) => {
    value.value = initial;
  });
};