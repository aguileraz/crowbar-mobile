/**
 * Animações de loading skeletons
 */

import {
  withRepeat,
  withSequence,
  withTiming,
  SharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient as _LinearGradient } from 'react-native-linear-gradient';
import { DURATIONS, EASINGS } from './constants';

interface SkeletonOptions {
  duration?: number;
  delay?: number;
  colors?: string[];
  locations?: number[];
}

// Cores padrão para skeleton
export const SKELETON_COLORS = {
  light: {
    base: '#E1E9EE',
    highlight: '#F2F8FC',
  },
  dark: {
    base: '#2C2C2C',
    highlight: '#3C3C3C',
  },
};

/**
 * Animação shimmer para skeleton
 */
export const shimmerAnimation = (
  progress: SharedValue<number>,
  options: SkeletonOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.slow * 2, delay = 0 } = options;
  
  progress.value = withDelay(
    delay,
    withRepeat(
      withTiming(1, {
        duration,
        easing: EASINGS.easeInOut,
      }),
      -1,
      false
    )
  );
};

/**
 * Animação pulse para skeleton
 */
export const pulseAnimation = (
  opacity: SharedValue<number>,
  options: SkeletonOptions = {}
) => {
  'worklet';
  const { duration = DURATIONS.slow, delay = 0 } = options;
  
  opacity.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(0.3, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      ),
      -1,
      true
    )
  );
};

/**
 * Configurações de skeleton por tipo
 */
export const SKELETON_CONFIGS = {
  // Skeleton de texto
  text: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  
  // Skeleton de título
  title: {
    height: 24,
    borderRadius: 4,
    marginBottom: 12,
  },
  
  // Skeleton de parágrafo
  paragraph: {
    lines: 3,
    lineHeight: 16,
    lineSpacing: 8,
    borderRadius: 4,
  },
  
  // Skeleton de imagem
  image: {
    aspectRatio: 1,
    borderRadius: 8,
  },
  
  // Skeleton de avatar
  avatar: {
    size: 40,
    borderRadius: 20,
  },
  
  // Skeleton de card
  card: {
    height: 200,
    borderRadius: 12,
    padding: 16,
  },
  
  // Skeleton de botão
  button: {
    height: 48,
    borderRadius: 24,
  },
  
  // Skeleton de lista
  listItem: {
    height: 72,
    borderRadius: 8,
    marginBottom: 8,
  },
};

/**
 * Helper para criar gradiente animado
 */
export const createAnimatedGradient = (
  progress: SharedValue<number>,
  colors: string[] = [
    SKELETON_COLORS.light.base,
    SKELETON_COLORS.light.highlight,
    SKELETON_COLORS.light.base,
  ]
) => {
  'worklet';
  
  const translateX = interpolate(
    progress.value,
    [0, 1],
    [-1, 2],
    Extrapolate.CLAMP
  );
  
  return {
    colors,
    locations: [translateX - 0.3, translateX, translateX + 0.3],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  };
};

/**
 * Variações de animação para diferentes elementos
 */
export const skeletonVariants = {
  // Animação wave (onda)
  wave: (progress: SharedValue<number>, _index: number = 0) => {
    'worklet';
    const delay = 0 * 100;
    
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: DURATIONS.slow * 2,
          easing: EASINGS.easeInOut,
        }),
        -1,
        false
      )
    );
  },
  
  // Animação staggered (escalonada)
  staggered: (progress: SharedValue<number>, _index: number = 0) => {
    'worklet';
    const delay = 0 * 50;
    
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DURATIONS.normal }),
          withTiming(0, { duration: DURATIONS.normal })
        ),
        -1,
        false
      )
    );
  },
  
  // Animação fade
  fade: (opacity: SharedValue<number>) => {
    'worklet';
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: DURATIONS.slow }),
        withTiming(1, { duration: DURATIONS.slow })
      ),
      -1,
      true
    );
  },
};

/**
 * Presets de skeleton para componentes comuns
 */
export const skeletonPresets = {
  // Box card skeleton
  boxCard: {
    image: { ...SKELETON_CONFIGS.image, height: 200 },
    title: { ...SKELETON_CONFIGS.title, width: '80%' },
    price: { ...SKELETON_CONFIGS.text, width: '40%' },
    button: { ...SKELETON_CONFIGS.button, marginTop: 12 },
  },
  
  // User profile skeleton
  userProfile: {
    avatar: SKELETON_CONFIGS.avatar,
    name: { ...SKELETON_CONFIGS.title, width: '60%' },
    email: { ...SKELETON_CONFIGS.text, width: '80%' },
    stats: {
      ...SKELETON_CONFIGS.text,
      width: '30%',
      height: 40,
      borderRadius: 8,
    },
  },
  
  // List item skeleton
  orderItem: {
    thumbnail: { ...SKELETON_CONFIGS.avatar, size: 60 },
    title: { ...SKELETON_CONFIGS.text, width: '70%' },
    subtitle: { ...SKELETON_CONFIGS.text, width: '50%', height: 14 },
    price: { ...SKELETON_CONFIGS.text, width: '30%' },
  },
  
  // Notification skeleton
  notification: {
    icon: { ...SKELETON_CONFIGS.avatar, size: 32 },
    title: { ...SKELETON_CONFIGS.text, width: '85%' },
    description: { ...SKELETON_CONFIGS.text, width: '95%', height: 14 },
    time: { ...SKELETON_CONFIGS.text, width: '25%', height: 12 },
  },
};