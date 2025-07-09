/**
 * Animações para gestos com react-native-gesture-handler
 */

import {
  withSpring,
  withDecay,
  SharedValue,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import {
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  RotationGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';
import { SPRING_CONFIGS, HAPTIC_FEEDBACK } from './constants';

interface GestureOptions {
  minValue?: number;
  maxValue?: number;
  haptic?: boolean;
  hapticType?: keyof typeof HAPTIC_FEEDBACK;
  onComplete?: () => void;
}

/**
 * Animação de pan (arrastar)
 */
export const panGesture = {
  onStart: (
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    startX: SharedValue<number>,
    startY: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'selection' } = options;
    
    startX.value = translateX.value;
    startY.value = translateY.value;
    
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  },

  onUpdate: (
    event: PanGestureHandlerEventPayload,
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    startX: SharedValue<number>,
    startY: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { minValue = -Infinity, maxValue = Infinity } = options;
    
    translateX.value = clamp(
      startX.value + event.translationX,
      minValue,
      maxValue
    );
    translateY.value = clamp(
      startY.value + event.translationY,
      minValue,
      maxValue
    );
  },

  onEnd: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'light', onComplete } = options;
    
    translateX.value = withDecay({
      velocity: event.velocityX,
      clamp: [options.minValue ?? -Infinity, options.maxValue ?? Infinity],
    });
    
    translateY.value = withDecay({
      velocity: event.velocityY,
      clamp: [options.minValue ?? -Infinity, options.maxValue ?? Infinity],
    }, (finished) => {
      if (finished) {
        if (haptic) {
          runOnJS(() => {
            HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
          })();
        }
        if (onComplete) {
          runOnJS(onComplete)();
        }
      }
    });
  },
};

/**
 * Animação de swipe
 */
export const swipeGesture = {
  onEnd: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    translateX: SharedValue<number>,
    currentIndex: SharedValue<number>,
    itemWidth: number,
    maxIndex: number,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'selection' } = options;
    
    const velocity = event.velocityX;
    const translation = event.translationX;
    
    let nextIndex = currentIndex.value;
    
    if (Math.abs(velocity) > 500 || Math.abs(translation) > itemWidth / 2) {
      if (velocity < 0 || translation < 0) {
        nextIndex = Math.min(currentIndex.value + 1, maxIndex);
      } else {
        nextIndex = Math.max(currentIndex.value - 1, 0);
      }
    }
    
    if (nextIndex !== currentIndex.value && haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
    
    currentIndex.value = nextIndex;
    translateX.value = withSpring(-nextIndex * itemWidth, SPRING_CONFIGS.smooth);
  },
};

/**
 * Animação de pinch (zoom)
 */
export const pinchGesture = {
  onStart: (
    scale: SharedValue<number>,
    startScale: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'selection' } = options;
    
    startScale.value = scale.value;
    
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  },

  onUpdate: (
    event: PinchGestureHandlerEventPayload,
    scale: SharedValue<number>,
    startScale: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { minValue = 0.5, maxValue = 3 } = options;
    
    scale.value = clamp(
      startScale.value * event.scale,
      minValue,
      maxValue
    );
  },

  onEnd: (
    scale: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { minValue = 1, maxValue = 2 } = options;
    
    if (scale.value < minValue) {
      scale.value = withSpring(minValue, SPRING_CONFIGS.bouncy);
    } else if (scale.value > maxValue) {
      scale.value = withSpring(maxValue, SPRING_CONFIGS.bouncy);
    }
  },
};

/**
 * Animação de rotação
 */
export const rotationGesture = {
  onStart: (
    rotation: SharedValue<number>,
    startRotation: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'selection' } = options;
    
    startRotation.value = rotation.value;
    
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  },

  onUpdate: (
    event: RotationGestureHandlerEventPayload,
    rotation: SharedValue<number>,
    startRotation: SharedValue<number>
  ) => {
    'worklet';
    rotation.value = startRotation.value + event.rotation;
  },

  onEnd: (
    rotation: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'light' } = options;
    
    // Snap to nearest 90 degrees
    const snapAngles = [0, 90, 180, 270, 360];
    const currentAngle = ((rotation.value % 360) + 360) % 360;
    
    const closestAngle = snapAngles.reduce((prev, curr) =>
      Math.abs(curr - currentAngle) < Math.abs(prev - currentAngle) ? curr : prev
    );
    
    rotation.value = withSpring(closestAngle, SPRING_CONFIGS.bouncy, (finished) => {
      if (finished && haptic) {
        runOnJS(() => {
          HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
        })();
      }
    });
  },
};

/**
 * Animação de drag and drop
 */
export const dragDropGesture = {
  onStart: (
    scale: SharedValue<number>,
    opacity: SharedValue<number>,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'medium' } = options;
    
    scale.value = withSpring(1.1, SPRING_CONFIGS.bouncy);
    opacity.value = withSpring(0.8, SPRING_CONFIGS.smooth);
    
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  },

  onDrop: (
    scale: SharedValue<number>,
    opacity: SharedValue<number>,
    translateX: SharedValue<number>,
    translateY: SharedValue<number>,
    targetX: number,
    targetY: number,
    options: GestureOptions = {}
  ) => {
    'worklet';
    const { haptic = true, hapticType = 'heavy', onComplete } = options;
    
    scale.value = withSpring(1, SPRING_CONFIGS.smooth);
    opacity.value = withSpring(1, SPRING_CONFIGS.smooth);
    translateX.value = withSpring(targetX, SPRING_CONFIGS.smooth);
    translateY.value = withSpring(targetY, SPRING_CONFIGS.smooth, (finished) => {
      if (finished) {
        if (haptic) {
          runOnJS(() => {
            HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
          })();
        }
        if (onComplete) {
          runOnJS(onComplete)();
        }
      }
    });
  },
};

/**
 * Animação de fling (arremesso)
 */
export const flingGesture = (
  translateY: SharedValue<number>,
  velocityY: number,
  options: GestureOptions = {}
) => {
  'worklet';
  const { minValue = -Infinity, maxValue = 0, haptic = true, hapticType = 'medium' } = options;
  
  if (velocityY < -500) {
    // Fling up
    translateY.value = withSpring(minValue, SPRING_CONFIGS.smooth);
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  } else if (velocityY > 500) {
    // Fling down
    translateY.value = withSpring(maxValue, SPRING_CONFIGS.smooth);
    if (haptic) {
      runOnJS(() => {
        HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
      })();
    }
  }
};