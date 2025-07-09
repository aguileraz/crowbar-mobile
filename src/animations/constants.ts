/**
 * Constantes para animações
 */

import { Easing } from 'react-native-reanimated';

// Durações padrão em milissegundos
export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
  extraSlow: 1000,
} as const;

// Configurações de spring
export const SPRING_CONFIGS = {
  // Spring suave para transições gerais
  smooth: {
    damping: 15,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  // Spring com bounce para feedback
  bouncy: {
    damping: 10,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  // Spring rígido para micro-interações
  stiff: {
    damping: 20,
    mass: 0.5,
    stiffness: 200,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  // Spring sem bounce
  noBounce: {
    damping: 25,
    mass: 1,
    stiffness: 100,
    overshootClamping: true,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
} as const;

// Easings personalizados
export const EASINGS = {
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  easeInQuad: Easing.in(Easing.quad),
  easeOutQuad: Easing.out(Easing.quad),
  easeInOutQuad: Easing.inOut(Easing.quad),
  easeInCubic: Easing.in(Easing.cubic),
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic),
  easeInQuart: Easing.in(Easing.poly(4)),
  easeOutQuart: Easing.out(Easing.poly(4)),
  easeInOutQuart: Easing.inOut(Easing.poly(4)),
  easeInExpo: Easing.in(Easing.exp),
  easeOutExpo: Easing.out(Easing.exp),
  easeInOutExpo: Easing.inOut(Easing.exp),
  easeInBack: Easing.in(Easing.back(1.7)),
  easeOutBack: Easing.out(Easing.back(1.7)),
  easeInOutBack: Easing.inOut(Easing.back(1.7)),
  elastic: Easing.elastic(1),
  bounce: Easing.bounce,
  linear: Easing.linear,
} as const;

// Delays padrão para animações staggered
export const STAGGER_DELAYS = {
  fast: 50,
  normal: 100,
  slow: 150,
  verySlow: 200,
} as const;

// Configurações de feedback háptico
export const HAPTIC_FEEDBACK = {
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
  selection: 'selection',
} as const;

// Valores de escala para animações
export const SCALE_VALUES = {
  pressed: 0.95,
  hover: 1.05,
  bounce: 1.1,
  shrink: 0.9,
  expand: 1.2,
} as const;

// Valores de opacidade
export const OPACITY_VALUES = {
  invisible: 0,
  disabled: 0.5,
  faded: 0.7,
  visible: 1,
} as const;

// Configurações de blur
export const BLUR_VALUES = {
  none: 0,
  light: 5,
  medium: 10,
  heavy: 20,
  extreme: 30,
} as const;