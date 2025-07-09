/**
 * Animações para listas e scroll
 */

import {
  withDelay,
  withTiming,
  withSpring,
  SharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { DURATIONS, SPRING_CONFIGS, EASINGS, STAGGER_DELAYS } from './constants';

interface ListAnimationOptions {
  staggerDelay?: number;
  duration?: number;
  springConfig?: typeof SPRING_CONFIGS.smooth;
  startDelay?: number;
}

/**
 * Animação staggered para entrada de itens
 */
export const staggeredEntrance = (
  values: SharedValue<number>[],
  options: ListAnimationOptions = {}
) => {
  'worklet';
  const {
    staggerDelay = STAGGER_DELAYS.normal,
    duration = DURATIONS.normal,
    startDelay = 0,
  } = options;
  
  values.forEach((value, index) => {
    value.value = withDelay(
      startDelay + (index * staggerDelay),
      withTiming(1, {
        duration,
        easing: EASINGS.easeOutQuart,
      })
    );
  });
};

/**
 * Animação staggered com spring
 */
export const staggeredSpring = (
  values: SharedValue<number>[],
  options: ListAnimationOptions = {}
) => {
  'worklet';
  const {
    staggerDelay = STAGGER_DELAYS.fast,
    springConfig = SPRING_CONFIGS.smooth,
    startDelay = 0,
  } = options;
  
  values.forEach((value, index) => {
    value.value = withDelay(
      startDelay + (index * staggerDelay),
      withSpring(1, springConfig)
    );
  });
};

/**
 * Animação de saída staggered
 */
export const staggeredExit = (
  values: SharedValue<number>[],
  options: ListAnimationOptions = {}
) => {
  'worklet';
  const {
    staggerDelay = STAGGER_DELAYS.fast,
    duration = DURATIONS.fast,
    startDelay = 0,
  } = options;
  
  // Animar de trás para frente
  values.forEach((value, index) => {
    const reverseIndex = values.length - 1 - index;
    value.value = withDelay(
      startDelay + (reverseIndex * staggerDelay),
      withTiming(0, {
        duration,
        easing: EASINGS.easeInQuart,
      })
    );
  });
};

/**
 * Animação baseada em scroll
 */
export const scrollBasedAnimation = (
  scrollY: SharedValue<number>,
  index: number,
  itemHeight: number
) => {
  'worklet';
  
  const inputRange = [
    (index - 1) * itemHeight,
    index * itemHeight,
    (index + 1) * itemHeight,
  ];
  
  const opacity = interpolate(
    scrollY.value,
    inputRange,
    [0.3, 1, 0.3],
    Extrapolate.CLAMP
  );
  
  const scale = interpolate(
    scrollY.value,
    inputRange,
    [0.8, 1, 0.8],
    Extrapolate.CLAMP
  );
  
  const translateY = interpolate(
    scrollY.value,
    inputRange,
    [20, 0, -20],
    Extrapolate.CLAMP
  );
  
  return { opacity, scale, translateY };
};

/**
 * Animação parallax para itens de lista
 */
export const listParallax = (
  scrollY: SharedValue<number>,
  index: number,
  itemHeight: number,
  parallaxFactor: number = 0.5
) => {
  'worklet';
  
  const translateY = interpolate(
    scrollY.value,
    [(index - 1) * itemHeight, (index + 1) * itemHeight],
    [itemHeight * parallaxFactor, -itemHeight * parallaxFactor],
    Extrapolate.CLAMP
  );
  
  return { translateY };
};

/**
 * Animação de reordenação de lista
 */
export const reorderAnimation = (
  positions: SharedValue<number>[],
  newOrder: number[],
  options: ListAnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth } = options;
  
  newOrder.forEach((newIndex, oldIndex) => {
    positions[oldIndex].value = withSpring(newIndex, springConfig);
  });
};

/**
 * Animação de expansão/colapso de item
 */
export const expandCollapseItem = (
  height: SharedValue<number>,
  opacity: SharedValue<number>,
  isExpanded: boolean,
  expandedHeight: number,
  options: ListAnimationOptions = {}
) => {
  'worklet';
  const { springConfig = SPRING_CONFIGS.smooth, duration = DURATIONS.normal } = options;
  
  height.value = withSpring(
    isExpanded ? expandedHeight : 0,
    springConfig
  );
  
  opacity.value = withTiming(
    isExpanded ? 1 : 0,
    { duration: duration / 2 }
  );
};

/**
 * Animação de swipe para deletar
 */
export const swipeToDelete = (
  translateX: SharedValue<number>,
  opacity: SharedValue<number>,
  onDelete: () => void
) => {
  'worklet';
  
  translateX.value = withTiming(-1000, {
    duration: DURATIONS.normal,
    easing: EASINGS.easeIn,
  });
  
  opacity.value = withTiming(0, {
    duration: DURATIONS.normal,
  }, (finished) => {
    if (finished) {
      'worklet';
      runOnJS(onDelete)();
    }
  });
};

/**
 * Animação de pull to refresh customizada
 */
export const pullToRefreshAnimation = (
  translateY: SharedValue<number>,
  rotation: SharedValue<number>,
  scale: SharedValue<number>,
  progress: number
) => {
  'worklet';
  
  const threshold = 80;
  const maxPull = 150;
  
  translateY.value = Math.min(progress, maxPull);
  
  if (progress < threshold) {
    rotation.value = interpolate(
      progress,
      [0, threshold],
      [0, 360],
      Extrapolate.CLAMP
    );
    scale.value = interpolate(
      progress,
      [0, threshold],
      [0.5, 1],
      Extrapolate.CLAMP
    );
  } else {
    rotation.value = withRepeat(
      withTiming(360, { duration: DURATIONS.slow }),
      -1,
      false
    );
    scale.value = 1;
  }
};

/**
 * Presets de animação para diferentes tipos de lista
 */
export const listAnimationPresets = {
  // Lista de cards
  cardList: {
    entrance: (values: SharedValue<number>[]) => 
      staggeredEntrance(values, { 
        staggerDelay: STAGGER_DELAYS.normal,
        duration: DURATIONS.normal,
      }),
    exit: (values: SharedValue<number>[]) =>
      staggeredExit(values, {
        staggerDelay: STAGGER_DELAYS.fast,
        duration: DURATIONS.fast,
      }),
  },
  
  // Lista de mensagens/chat
  messageList: {
    entrance: (values: SharedValue<number>[]) =>
      staggeredSpring(values, {
        staggerDelay: STAGGER_DELAYS.fast,
        springConfig: SPRING_CONFIGS.bouncy,
      }),
  },
  
  // Grid de produtos
  productGrid: {
    entrance: (values: SharedValue<number>[]) =>
      staggeredEntrance(values, {
        staggerDelay: STAGGER_DELAYS.fast,
        duration: DURATIONS.slow,
      }),
  },
  
  // Lista de notificações
  notificationList: {
    entrance: (values: SharedValue<number>[]) =>
      staggeredEntrance(values, {
        staggerDelay: STAGGER_DELAYS.verySlow,
        duration: DURATIONS.normal,
        startDelay: 200,
      }),
  },
};