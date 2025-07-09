/**
 * Micro-interações para botões e elementos interativos
 */

import {
  withSpring,
  withTiming,
  withSequence,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';
import { DURATIONS, SPRING_CONFIGS, SCALE_VALUES, HAPTIC_FEEDBACK } from './constants';

interface MicroInteractionOptions {
  haptic?: boolean;
  hapticType?: keyof typeof HAPTIC_FEEDBACK;
  callback?: () => void;
}

/**
 * Animação de press para botões
 */
export const buttonPress = (
  scaleValue: SharedValue<number>,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'light', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scaleValue.value = withSequence(
    withSpring(SCALE_VALUES.pressed, SPRING_CONFIGS.stiff),
    withSpring(1, SPRING_CONFIGS.smooth, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

/**
 * Animação de hover/focus
 */
export const elementHover = (
  scaleValue: SharedValue<number>,
  opacityValue?: SharedValue<number>
) => {
  'worklet';
  scaleValue.value = withSpring(SCALE_VALUES.hover, SPRING_CONFIGS.smooth);
  if (opacityValue) {
    opacityValue.value = withTiming(0.8, { duration: DURATIONS.fast });
  }
};

export const elementUnhover = (
  scaleValue: SharedValue<number>,
  opacityValue?: SharedValue<number>
) => {
  'worklet';
  scaleValue.value = withSpring(1, SPRING_CONFIGS.smooth);
  if (opacityValue) {
    opacityValue.value = withTiming(1, { duration: DURATIONS.fast });
  }
};

/**
 * Animação de ripple effect
 */
export const rippleEffect = (
  scaleValue: SharedValue<number>,
  opacityValue: SharedValue<number>,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scaleValue.value = 0;
  opacityValue.value = 0.3;
  
  scaleValue.value = withTiming(2, { duration: DURATIONS.slow });
  opacityValue.value = withTiming(0, { duration: DURATIONS.slow });
};

/**
 * Animação de toggle (switch/checkbox)
 */
export const toggleAnimation = (
  translateX: SharedValue<number>,
  backgroundColor: SharedValue<number>,
  isOn: boolean,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  translateX.value = withSpring(isOn ? 1 : 0, SPRING_CONFIGS.bouncy);
  backgroundColor.value = withTiming(isOn ? 1 : 0, { duration: DURATIONS.fast });
};

/**
 * Animação de checkbox
 */
export const checkboxAnimation = (
  scaleValue: SharedValue<number>,
  rotateValue: SharedValue<number>,
  isChecked: boolean,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  if (isChecked) {
    scaleValue.value = withSequence(
      withSpring(1.2, SPRING_CONFIGS.bouncy),
      withSpring(1, SPRING_CONFIGS.smooth)
    );
    rotateValue.value = withSpring(1, SPRING_CONFIGS.smooth);
  } else {
    scaleValue.value = withSpring(0, SPRING_CONFIGS.smooth);
    rotateValue.value = withTiming(0, { duration: DURATIONS.fast });
  }
};

/**
 * Animação de radio button
 */
export const radioAnimation = (
  scaleValue: SharedValue<number>,
  isSelected: boolean,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scaleValue.value = withSpring(
    isSelected ? 1 : 0,
    isSelected ? SPRING_CONFIGS.bouncy : SPRING_CONFIGS.smooth
  );
};

/**
 * Animação de tab selection
 */
export const tabSelection = (
  indicatorPosition: SharedValue<number>,
  scaleValue: SharedValue<number>,
  targetPosition: number,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  indicatorPosition.value = withSpring(targetPosition, SPRING_CONFIGS.smooth);
  scaleValue.value = withSequence(
    withSpring(0.9, SPRING_CONFIGS.stiff),
    withSpring(1, SPRING_CONFIGS.smooth)
  );
};

/**
 * Animação de swipe action
 */
export const swipeAction = (
  translateX: SharedValue<number>,
  opacityValue: SharedValue<number>,
  direction: 'left' | 'right',
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'medium', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  const targetX = direction === 'left' ? -100 : 100;
  
  translateX.value = withTiming(targetX, { duration: DURATIONS.normal });
  opacityValue.value = withTiming(0, { duration: DURATIONS.normal }, (finished) => {
    if (finished && callback) {
      runOnJS(callback)();
    }
  });
};

/**
 * Animação de pull to refresh
 */
export const pullToRefresh = (
  translateY: SharedValue<number>,
  rotateValue: SharedValue<number>,
  isRefreshing: boolean,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'medium' } = options;
  
  if (isRefreshing && haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  if (isRefreshing) {
    translateY.value = withSpring(60, SPRING_CONFIGS.smooth);
    rotateValue.value = withTiming(360, { 
      duration: DURATIONS.slow,
      easing: (t) => t, // linear
    });
  } else {
    translateY.value = withSpring(0, SPRING_CONFIGS.smooth);
    rotateValue.value = 0;
  }
};

/**
 * Animação de long press
 */
export const longPress = (
  scaleValue: SharedValue<number>,
  progressValue: SharedValue<number>,
  duration: number = 1000,
  options: MicroInteractionOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'heavy', callback } = options;
  
  scaleValue.value = withSpring(SCALE_VALUES.pressed, SPRING_CONFIGS.stiff);
  progressValue.value = withTiming(1, { duration }, (finished) => {
    if (finished) {
      if (haptic) {
        runOnJS(() => {
          HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
        })();
      }
      if (callback) {
        runOnJS(callback)();
      }
    }
  });
};

export const cancelLongPress = (
  scaleValue: SharedValue<number>,
  progressValue: SharedValue<number>
) => {
  'worklet';
  scaleValue.value = withSpring(1, SPRING_CONFIGS.smooth);
  progressValue.value = withTiming(0, { duration: DURATIONS.fast });
};