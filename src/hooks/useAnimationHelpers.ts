/**
 * Helpers e utilitários para animações
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { SPRING_CONFIGS, DURATIONS, EASINGS } from '../animations/constants';

const { width: _SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Hook para animações condicionais
export const useConditionalAnimation = (
  condition: boolean,
  trueValue = 1,
  falseValue = 0,
  options: {
    duration?: number;
    springConfig?: typeof SPRING_CONFIGS.smooth;
    type?: 'timing' | 'spring';
  } = {}
) => {
  const {
    duration = DURATIONS.normal,
    springConfig = SPRING_CONFIGS.smooth,
    type = 'spring',
  } = options;

  const animatedValue = useSharedValue(condition ? trueValue : falseValue);

  useEffect(() => {
    if (type === 'spring') {
      animatedValue.value = withSpring(
        condition ? trueValue : falseValue,
        springConfig
      );
    } else {
      animatedValue.value = withTiming(
        condition ? trueValue : falseValue,
        { duration, easing: EASINGS.easeInOut }
      );
    }
  }, [condition, trueValue, falseValue, type, duration, springConfig]);

  return animatedValue;
};

// Hook para animações com mount/unmount
export const useMountAnimation = (
  isMounted: boolean,
  options: {
    mountDelay?: number;
    unmountDelay?: number;
    onUnmountComplete?: () => void;
  } = {}
) => {
  const {
    mountDelay = 0,
    unmountDelay = 0,
    onUnmountComplete,
  } = options;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isMounted) {
      // Mount animation
      opacity.value = withDelay(
        mountDelay,
        withTiming(1, { duration: DURATIONS.normal })
      );
      scale.value = withDelay(
        mountDelay,
        withSpring(1, SPRING_CONFIGS.smooth)
      );
    } else {
      // Unmount animation
      opacity.value = withDelay(
        unmountDelay,
        withTiming(0, { duration: DURATIONS.fast })
      );
      scale.value = withDelay(
        unmountDelay,
        withTiming(0.9, { duration: DURATIONS.fast }, (finished) => {
          if (finished && onUnmountComplete) {
            onUnmountComplete();
          }
        })
      );
    }
  }, [isMounted, mountDelay, unmountDelay, onUnmountComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return { animatedStyle, opacity, scale };
};

// Hook para animações baseadas em viewport
export const useViewportAnimation = (
  threshold = 0.5,
  options: {
    once?: boolean;
    offset?: number;
  } = {}
) => {
  const { once = false, offset = 0 } = options;
  const hasAnimated = useRef(false);
  const isInViewport = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const onLayout = useCallback((event: any) => {
    const { y, height } = event.nativeEvent.layout;
    const viewportThreshold = SCREEN_HEIGHT * threshold;
    
    if (y + height / 2 < viewportThreshold + offset) {
      if (!once || !hasAnimated.current) {
        isInViewport.value = 1;
        hasAnimated.current = true;
      }
    }
  }, [threshold, offset, once]);

  useEffect(() => {
    opacity.value = withSpring(isInViewport.value, SPRING_CONFIGS.smooth);
    translateY.value = withSpring(
      isInViewport.value === 1 ? 0 : 50,
      SPRING_CONFIGS.smooth
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return { onLayout, animatedStyle, isInViewport };
};

// Hook para animações de número/contador
export const useCounterAnimation = (
  targetValue: number,
  options: {
    duration?: number;
    format?: (value: number) => string;
  } = {}
) => {
  const {
    duration = DURATIONS.slow,
    format = (value) => Math.round(value).toString(),
  } = options;

  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue('0');

  useEffect(() => {
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: EASINGS.easeOut,
    }, () => {
      'worklet';
      displayValue.value = format(animatedValue.value);
    });
  }, [targetValue, duration, format]);

  return { animatedValue, displayValue };
};

// Hook para animações de progresso circular
export const useCircularProgress = (
  progress: number, // 0 a 1
  options: {
    size?: number;
    strokeWidth?: number;
    duration?: number;
  } = {}
) => {
  const {
    size = 100,
    strokeWidth = 10,
    duration = DURATIONS.normal,
  } = options;

  const progressValue = useSharedValue(0);
  const radius = (_size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration,
      easing: EASINGS.easeInOut,
    });
  }, [progress, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = interpolate(
      progressValue.value,
      [0, 1],
      [circumference, 0],
      Extrapolate.CLAMP
    );

    return {
      strokeDashoffset,
    };
  });

  return {
    animatedStyle,
    circumference,
    progressValue,
  };
};

// Hook para animações de shake/vibração
export const useShakeAnimation = (
  trigger: boolean,
  options: {
    intensity?: number;
    duration?: number;
    direction?: 'horizontal' | 'vertical' | 'both';
  } = {}
) => {
  const {
    intensity = 10,
    duration = DURATIONS.fast,
    direction = 'horizontal',
  } = options;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      const sequence = [intensity, -intensity, intensity / 2, -intensity / 2, 0];
      
      if (direction === 'horizontal' || direction === 'both') {
        translateX.value = withSequence(
          ...sequence.map(value => 
            withTiming(value, { duration: duration / sequence.length })
          )
        );
      }
      
      if (direction === 'vertical' || direction === 'both') {
        translateY.value = withSequence(
          ...sequence.map(value => 
            withTiming(value, { duration: duration / sequence.length })
          )
        );
      }
    }
  }, [trigger, intensity, duration, direction]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return { animatedStyle, translateX, translateY };
};

// Hook para animações de floating/flutuação
export const useFloatingAnimation = (
  options: {
    amplitude?: number;
    duration?: number;
    autoStart?: boolean;
  } = {}
) => {
  const {
    amplitude = 10,
    duration = 3000,
    autoStart = true,
  } = options;

  const translateY = useSharedValue(0);

  const start = useCallback(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: duration / 2, easing: EASINGS.easeInOut }),
        withTiming(amplitude, { duration: duration / 2, easing: EASINGS.easeInOut })
      ),
      -1,
      true
    );
  }, [amplitude, duration]);

  const stop = useCallback(() => {
    translateY.value = withTiming(0, { duration: DURATIONS.fast });
  }, []);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return { animatedStyle, start, stop, translateY };
};