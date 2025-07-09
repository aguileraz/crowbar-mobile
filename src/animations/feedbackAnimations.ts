/**
 * Animações de feedback para ações do usuário
 */

import {
  withSequence,
  withTiming,
  withSpring,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';
import { DURATIONS, SPRING_CONFIGS, EASINGS, HAPTIC_FEEDBACK, SCALE_VALUES } from './constants';

interface FeedbackOptions {
  haptic?: boolean;
  hapticType?: keyof typeof HAPTIC_FEEDBACK;
  callback?: () => void;
}

/**
 * Animação de sucesso
 */
export const successAnimation = (
  scale: SharedValue<number>,
  opacity: SharedValue<number>,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'success', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scale.value = withSequence(
    withSpring(1.2, SPRING_CONFIGS.bouncy),
    withSpring(1, SPRING_CONFIGS.smooth, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
  
  opacity.value = withSequence(
    withTiming(1, { duration: DURATIONS.fast }),
    withTiming(1, { duration: DURATIONS.slow }),
    withTiming(0, { duration: DURATIONS.normal })
  );
};

/**
 * Animação de erro
 */
export const errorAnimation = (
  translateX: SharedValue<number>,
  scale: SharedValue<number>,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'error', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  // Shake animation
  translateX.value = withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
  
  // Pulse scale
  scale.value = withSequence(
    withTiming(1.05, { duration: DURATIONS.fast }),
    withTiming(1, { duration: DURATIONS.fast }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

/**
 * Animação de aviso
 */
export const warningAnimation = (
  scale: SharedValue<number>,
  rotation: SharedValue<number>,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'warning', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  // Wiggle rotation
  rotation.value = withSequence(
    withTiming(-5, { duration: 100 }),
    withTiming(5, { duration: 100 }),
    withTiming(-5, { duration: 100 }),
    withTiming(0, { duration: 100 })
  );
  
  // Pulse scale
  scale.value = withSequence(
    withSpring(1.1, SPRING_CONFIGS.stiff),
    withSpring(1, SPRING_CONFIGS.smooth, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

/**
 * Animação de loading
 */
export const loadingAnimation = (
  rotation: SharedValue<number>,
  opacity: SharedValue<number>
) => {
  'worklet';
  
  // Rotação contínua
  rotation.value = withRepeat(
    withTiming(360, {
      duration: DURATIONS.slow * 2,
      easing: EASINGS.linear,
    }),
    -1,
    false
  );
  
  // Fade pulsante
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.5, { duration: DURATIONS.slow }),
      withTiming(1, { duration: DURATIONS.slow })
    ),
    -1,
    true
  );
};

/**
 * Animação de progresso
 */
export const progressAnimation = (
  width: SharedValue<number>,
  targetProgress: number, // 0 a 1
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection', callback } = options;
  
  width.value = withSpring(targetProgress, SPRING_CONFIGS.smooth, (finished) => {
    if (finished) {
      if (targetProgress === 1 && haptic) {
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

/**
 * Animação de seleção
 */
export const selectionAnimation = (
  scale: SharedValue<number>,
  backgroundColor: SharedValue<number>,
  isSelected: boolean,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scale.value = withSequence(
    withSpring(isSelected ? 1.1 : 0.9, SPRING_CONFIGS.stiff),
    withSpring(1, SPRING_CONFIGS.smooth)
  );
  
  backgroundColor.value = withTiming(isSelected ? 1 : 0, {
    duration: DURATIONS.fast,
  });
};

/**
 * Animação de favorito (coração)
 */
export const favoriteAnimation = (
  scale: SharedValue<number>,
  rotation: SharedValue<number>,
  isFavorite: boolean,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'medium' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  if (isFavorite) {
    // Animação de adicionar aos favoritos
    scale.value = withSequence(
      withSpring(0, SPRING_CONFIGS.stiff),
      withSpring(1.3, SPRING_CONFIGS.bouncy),
      withSpring(1, SPRING_CONFIGS.smooth)
    );
    
    rotation.value = withSequence(
      withTiming(-15, { duration: DURATIONS.fast }),
      withTiming(15, { duration: DURATIONS.fast }),
      withTiming(0, { duration: DURATIONS.fast })
    );
  } else {
    // Animação de remover dos favoritos
    scale.value = withSequence(
      withTiming(0.8, { duration: DURATIONS.fast }),
      withSpring(1, SPRING_CONFIGS.smooth)
    );
  }
};

/**
 * Animação de adicionar ao carrinho
 */
export const addToCartAnimation = (
  scale: SharedValue<number>,
  translateY: SharedValue<number>,
  opacity: SharedValue<number>,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'success', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  // Animação do item voando para o carrinho
  scale.value = withTiming(0.5, { duration: DURATIONS.normal });
  translateY.value = withTiming(-100, { duration: DURATIONS.normal });
  opacity.value = withTiming(0, { duration: DURATIONS.normal }, (finished) => {
    if (finished) {
      // Reset values
      scale.value = 1;
      translateY.value = 0;
      opacity.value = 1;
      
      if (callback) {
        runOnJS(callback)();
      }
    }
  });
};

/**
 * Animação de compartilhar
 */
export const shareAnimation = (
  scale: SharedValue<number>,
  rotation: SharedValue<number>,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'selection', callback } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  scale.value = withSequence(
    withSpring(1.2, SPRING_CONFIGS.bouncy),
    withSpring(1, SPRING_CONFIGS.smooth)
  );
  
  rotation.value = withSequence(
    withTiming(360, { duration: DURATIONS.normal }),
    withTiming(0, { duration: 0 }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    })
  );
};

/**
 * Animação de notificação
 */
export const notificationAnimation = (
  translateY: SharedValue<number>,
  opacity: SharedValue<number>,
  autoHide: boolean = true,
  options: FeedbackOptions = {}
) => {
  'worklet';
  const { haptic = true, hapticType = 'light' } = options;
  
  if (haptic) {
    runOnJS(() => {
      HapticFeedback.trigger(HAPTIC_FEEDBACK[hapticType] as any);
    })();
  }
  
  // Slide in from top
  translateY.value = withSpring(0, SPRING_CONFIGS.smooth);
  opacity.value = withTiming(1, { duration: DURATIONS.fast });
  
  if (autoHide) {
    // Auto hide after 3 seconds
    translateY.value = withDelay(
      3000,
      withTiming(-100, { duration: DURATIONS.normal })
    );
    opacity.value = withDelay(
      3000,
      withTiming(0, { duration: DURATIONS.normal })
    );
  }
};