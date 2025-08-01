/**
 * Configurações e helpers para animações Lottie
 */

import _LottieView from 'lottie-react-native';
import { useAnimatedProps, interpolate } from 'react-native-reanimated';

// Caminhos para os arquivos Lottie
// Por enquanto, vamos usar placeholders vazios até os arquivos serem adicionados
export const LOTTIE_ANIMATIONS = {
  // Estados gerais
  loading: null, // require('../assets/lottie/loading.json'),
  success: null, // require('../assets/lottie/success.json'),
  error: null, // require('../assets/lottie/error.json'),
  empty: null, // require('../assets/lottie/empty.json'),
  
  // Estados específicos do app
  boxOpening: null, // require('../assets/lottie/box-opening.json'),
  celebration: null, // require('../assets/lottie/celebration.json'),
  coins: null, // require('../assets/lottie/coins.json'),
  heart: null, // require('../assets/lottie/heart.json'),
  star: null, // require('../assets/lottie/star.json'),
  
  // Onboarding
  welcome: null, // require('../assets/lottie/welcome.json'),
  tutorial1: null, // require('../assets/lottie/tutorial-1.json'),
  tutorial2: null, // require('../assets/lottie/tutorial-2.json'),
  tutorial3: null, // require('../assets/lottie/tutorial-3.json'),
  
  // Pull to refresh
  pullToRefresh: null, // require('../assets/lottie/pull-to-refresh.json'),
} as const;

// Configurações padrão para animações Lottie
export const LOTTIE_CONFIGS = {
  default: {
    autoPlay: true,
    loop: false,
    speed: 1,
  },
  loading: {
    autoPlay: true,
    loop: true,
    speed: 1.5,
  },
  success: {
    autoPlay: true,
    loop: false,
    speed: 1,
  },
  error: {
    autoPlay: true,
    loop: false,
    speed: 1,
  },
  celebration: {
    autoPlay: true,
    loop: false,
    speed: 1.2,
  },
  pullToRefresh: {
    autoPlay: false,
    loop: false,
    speed: 1,
  },
} as const;

/**
 * Hook para controlar progresso de animação Lottie com Reanimated
 */
export const useLottieProgress = (
  progress: SharedValue<number>,
  inputRange: number[] = [0, 1],
  outputRange: number[] = [0, 1]
) => {
  const animatedProps = useAnimatedProps(() => {
    return {
      progress: interpolate(
        progress.value,
        inputRange,
        outputRange
      ),
    };
  });

  return animatedProps;
};

/**
 * Configurações para animações de estado
 */
export const stateAnimationConfigs = {
  empty: {
    source: LOTTIE_ANIMATIONS.empty,
    style: {
      width: 200,
      height: 200,
    },
    ...LOTTIE_CONFIGS.default,
  },
  error: {
    source: LOTTIE_ANIMATIONS.error,
    style: {
      width: 150,
      height: 150,
    },
    ...LOTTIE_CONFIGS.error,
  },
  success: {
    source: LOTTIE_ANIMATIONS.success,
    style: {
      width: 150,
      height: 150,
    },
    ...LOTTIE_CONFIGS.success,
  },
  loading: {
    source: LOTTIE_ANIMATIONS.loading,
    style: {
      width: 100,
      height: 100,
    },
    ...LOTTIE_CONFIGS.loading,
  },
};

/**
 * Configurações para animações especiais
 */
export const specialAnimationConfigs = {
  boxOpening: {
    source: LOTTIE_ANIMATIONS.boxOpening,
    style: {
      width: 300,
      height: 300,
    },
    ...LOTTIE_CONFIGS.default,
  },
  celebration: {
    source: LOTTIE_ANIMATIONS.celebration,
    style: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },
    ...LOTTIE_CONFIGS.celebration,
  },
  coins: {
    source: LOTTIE_ANIMATIONS.coins,
    style: {
      width: 200,
      height: 200,
    },
    ...LOTTIE_CONFIGS.default,
  },
  heart: {
    source: LOTTIE_ANIMATIONS.heart,
    style: {
      width: 50,
      height: 50,
    },
    ...LOTTIE_CONFIGS.default,
  },
  star: {
    source: LOTTIE_ANIMATIONS.star,
    style: {
      width: 50,
      height: 50,
    },
    ...LOTTIE_CONFIGS.default,
  },
};

/**
 * Configurações para pull to refresh customizado
 */
export const pullToRefreshConfig = {
  source: LOTTIE_ANIMATIONS.pullToRefresh,
  style: {
    width: 80,
    height: 80,
  },
  ...LOTTIE_CONFIGS.pullToRefresh,
  // Progresso controlado pelo gesto de pull
  progressRange: {
    pull: [0, 0.5], // Durante o pull
    refresh: [0.5, 1], // Durante o refresh
  },
};

/**
 * Helper para criar configuração de animação Lottie
 */
export const createLottieConfig = (
  animationName: keyof typeof LOTTIE_ANIMATIONS,
  customConfig?: Partial<typeof LOTTIE_CONFIGS.default>,
  customStyle?: any
) => {
  const baseConfig = LOTTIE_CONFIGS[animationName as keyof typeof LOTTIE_CONFIGS] || LOTTIE_CONFIGS.default;
  
  return {
    source: LOTTIE_ANIMATIONS[animationName],
    ...baseConfig,
    ...customConfig,
    style: customStyle || {},
  };
};