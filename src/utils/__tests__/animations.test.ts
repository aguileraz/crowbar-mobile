/**
 * Testes para utilitários de animação
 *
 * Cobertura completa de todas as 9 categorias de animação exportadas:
 * 1. ANIMATION_CONFIGS - Configurações e constantes
 * 2. fadeAnimation - Animações de fade in/out
 * 3. scaleAnimation - Animações de escala (in/out/pulse/bounce)
 * 4. slideAnimation - Animações de slide (right/left/bottom)
 * 5. rotateAnimation - Animações de rotação (rotate/spin)
 * 6. combinedAnimations - Animações combinadas (parallel)
 * 7. listAnimations - Animações de lista (staggered)
 * 8. feedbackAnimations - Animações de feedback (success/error/loading)
 * 9. interpolations - Funções de interpolação
 */

/**
 * Mock do React Native Animated API
 *
 * IMPORTANTE: Este mock deve estar ANTES de qualquer import que use react-native
 * para que o Jest possa fazer o hoisting correto.
 */

// Funções mock para Animated
const createMockAnimation = (value: any, config: any) => ({
  start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
    if (callback) {
      callback({ finished: true });
    }
  }),
  stop: jest.fn(),
  reset: jest.fn(),
  _value: value,
  _config: config,
});

// Mock das funções antes de declarar o jest.mock
const mockTiming = jest.fn((value, config) => createMockAnimation(value, config));
const mockSpring = jest.fn((value, config) => createMockAnimation(value, config));
const mockSequence = jest.fn((animations) => ({
  ...createMockAnimation(null, null),
  _animations: animations,
}));
const mockParallel = jest.fn((animations) => ({
  ...createMockAnimation(null, null),
  _animations: animations,
}));
const mockLoop = jest.fn((animation) => ({
  ...createMockAnimation(null, null),
  _animation: animation,
}));
const mockInterpolate = jest.fn((config) => config);
const mockSetValue = jest.fn();

// Declaração do mock - IMPORTANTE: deve retornar as funções mock diretamente
jest.mock('react-native', () => {
  // Precisamos acessar as variáveis declaradas acima
  const mockValue = (initialValue: number) => ({
    _value: initialValue,
    setValue: jest.fn(),
    interpolate: jest.fn((config) => config),
  });

  const createAnim = (value: any, config: any) => ({
    start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
      if (callback) {
        callback({ finished: true });
      }
    }),
    stop: jest.fn(),
    reset: jest.fn(),
    _value: value,
    _config: config,
  });

  return {
    Animated: {
      Value: jest.fn(mockValue),
      timing: jest.fn((value, config) => createAnim(value, config)),
      spring: jest.fn((value, config) => createAnim(value, config)),
      sequence: jest.fn((animations) => ({
        ...createAnim(null, null),
        _animations: animations,
      })),
      parallel: jest.fn((animations) => ({
        ...createAnim(null, null),
        _animations: animations,
      })),
      loop: jest.fn((animation) => ({
        ...createAnim(null, null),
        _animation: animation,
      })),
    },
    Easing: {
      linear: 'linear',
      quad: 'quad',
      in: jest.fn((fn) => `in-${fn}`),
      out: jest.fn((fn) => `out-${fn}`),
      inOut: jest.fn((fn) => `inOut-${fn}`),
      bounce: 'bounce',
      elastic: jest.fn((bounciness) => `elastic-${bounciness}`),
    },
  };
});

// Imports após o mock
import { Animated, Easing } from 'react-native';
import {
  ANIMATION_CONFIGS,
  fadeAnimation,
  scaleAnimation,
  slideAnimation,
  rotateAnimation,
  combinedAnimations,
  listAnimations,
  feedbackAnimations,
  interpolations,
} from '../animations';

describe('animations', () => {
  // Precisamos acessar o Animated mockado
  const AnimatedMock = Animated as jest.Mocked<typeof Animated>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CATEGORIA 1: ANIMATION_CONFIGS ====================
  describe('ANIMATION_CONFIGS', () => {
    it('deve conter todas as constantes de duração', () => {
      expect(ANIMATION_CONFIGS.FAST).toBe(150);
      expect(ANIMATION_CONFIGS.NORMAL).toBe(250);
      expect(ANIMATION_CONFIGS.SLOW).toBe(400);
      expect(ANIMATION_CONFIGS.VERY_SLOW).toBe(600);
    });

    it('deve conter todas as funções de easing', () => {
      expect(ANIMATION_CONFIGS.EASE_OUT).toBeDefined();
      expect(ANIMATION_CONFIGS.EASE_IN).toBeDefined();
      expect(ANIMATION_CONFIGS.EASE_IN_OUT).toBeDefined();
      expect(ANIMATION_CONFIGS.BOUNCE).toBe('bounce');
      expect(ANIMATION_CONFIGS.ELASTIC).toBeDefined();
    });

    it('deve conter configurações de spring com propriedades corretas', () => {
      expect(ANIMATION_CONFIGS.SPRING_CONFIG).toEqual({
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      });
    });

    it('deve conter configurações de bounce spring com propriedades corretas', () => {
      expect(ANIMATION_CONFIGS.BOUNCE_SPRING).toEqual({
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      });
    });
  });

  // ==================== CATEGORIA 2: fadeAnimation ====================
  describe('fadeAnimation', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(0);
    });

    it('deve criar fadeIn com configuração padrão', () => {
      fadeAnimation.fadeIn(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar fadeIn com duração customizada', () => {
      fadeAnimation.fadeIn(animatedValue, 500);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar fadeIn com toValue customizado', () => {
      fadeAnimation.fadeIn(animatedValue, 250, 0.8);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0.8,
        duration: 250,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar fadeOut com configuração padrão', () => {
      fadeAnimation.fadeOut(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_IN,
        useNativeDriver: true,
      });
    });

    it('deve criar fadeOut com parâmetros customizados', () => {
      fadeAnimation.fadeOut(animatedValue, 400, 0.2);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0.2,
        duration: 400,
        easing: ANIMATION_CONFIGS.EASE_IN,
        useNativeDriver: true,
      });
    });
  });

  // ==================== CATEGORIA 3: scaleAnimation ====================
  describe('scaleAnimation', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(0);
    });

    it('deve criar scaleIn com configuração padrão', () => {
      scaleAnimation.scaleIn(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar scaleOut com configuração padrão', () => {
      scaleAnimation.scaleOut(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_IN,
        useNativeDriver: true,
      });
    });

    it('deve criar pulse como sequência de animações', () => {
      scaleAnimation.pulse(animatedValue);

      expect(AnimatedMock.sequence).toHaveBeenCalled();
      const sequenceArg = AnimatedMock.sequence.mock.calls[0][0];
      expect(Array.isArray(sequenceArg)).toBe(true);
      expect(sequenceArg).toHaveLength(2);
    });

    it('deve criar pulse com escala customizada', () => {
      scaleAnimation.pulse(animatedValue, 1.5);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(
        animatedValue,
        expect.objectContaining({
          toValue: 1.5,
        })
      );
    });

    it('deve criar bounce como spring animation', () => {
      scaleAnimation.bounce(animatedValue);

      expect(AnimatedMock.spring).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        ...ANIMATION_CONFIGS.BOUNCE_SPRING,
      });
    });
  });

  // ==================== CATEGORIA 4: slideAnimation ====================
  describe('slideAnimation', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(100);
    });

    it('deve criar slideInFromRight com configuração padrão', () => {
      slideAnimation.slideInFromRight(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar slideInFromLeft com configuração padrão', () => {
      slideAnimation.slideInFromLeft(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve criar slideInFromBottom com configuração padrão', () => {
      slideAnimation.slideInFromBottom(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 0,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    it('deve aceitar duração customizada para slide animations', () => {
      slideAnimation.slideInFromRight(animatedValue, 500);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(
        animatedValue,
        expect.objectContaining({
          duration: 500,
        })
      );
    });
  });

  // ==================== CATEGORIA 5: rotateAnimation ====================
  describe('rotateAnimation', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(0);
    });

    it('deve criar rotate com configuração padrão', () => {
      rotateAnimation.rotate(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.NORMAL,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });

    it('deve criar rotate com parâmetros customizados', () => {
      rotateAnimation.rotate(animatedValue, 500, 2);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(animatedValue, {
        toValue: 2,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });

    it('deve criar spin como loop animation', () => {
      rotateAnimation.spin(animatedValue);

      expect(AnimatedMock.loop).toHaveBeenCalled();
      expect(AnimatedMock.timing).toHaveBeenCalledWith(
        animatedValue,
        expect.objectContaining({
          toValue: 1,
          easing: Easing.linear,
        })
      );
    });

    it('deve criar spin com duração customizada', () => {
      rotateAnimation.spin(animatedValue, 2000);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(
        animatedValue,
        expect.objectContaining({
          duration: 2000,
        })
      );
    });
  });

  // ==================== CATEGORIA 6: combinedAnimations ====================
  describe('combinedAnimations', () => {
    let fadeValue: Animated.Value;
    let scaleValue: Animated.Value;
    let slideValue: Animated.Value;

    beforeEach(() => {
      fadeValue = new Animated.Value(0);
      scaleValue = new Animated.Value(0);
      slideValue = new Animated.Value(100);
    });

    it('deve criar fadeInScale como parallel animation', () => {
      combinedAnimations.fadeInScale(fadeValue, scaleValue);

      expect(AnimatedMock.parallel).toHaveBeenCalled();
      const parallelArg = AnimatedMock.parallel.mock.calls[0][0];
      expect(Array.isArray(parallelArg)).toBe(true);
      expect(parallelArg).toHaveLength(2);
    });

    it('deve criar fadeInScale com duração customizada', () => {
      combinedAnimations.fadeInScale(fadeValue, scaleValue, 500);

      // Verifica que ambas as animações usam a mesma duração
      const timingCalls = AnimatedMock.timing.mock.calls;
      expect(timingCalls[0][1].duration).toBe(500);
      expect(timingCalls[1][1].duration).toBe(500);
    });

    it('deve criar fadeOutScale como parallel animation', () => {
      combinedAnimations.fadeOutScale(fadeValue, scaleValue);

      expect(AnimatedMock.parallel).toHaveBeenCalled();
      const parallelArg = AnimatedMock.parallel.mock.calls[0][0];
      expect(Array.isArray(parallelArg)).toBe(true);
      expect(parallelArg).toHaveLength(2);
    });

    it('deve criar slideInFade como parallel animation', () => {
      combinedAnimations.slideInFade(slideValue, fadeValue);

      expect(AnimatedMock.parallel).toHaveBeenCalled();
      const parallelArg = AnimatedMock.parallel.mock.calls[0][0];
      expect(Array.isArray(parallelArg)).toBe(true);
      expect(parallelArg).toHaveLength(2);
    });
  });

  // ==================== CATEGORIA 7: listAnimations ====================
  describe('listAnimations', () => {
    let animatedValues: Animated.Value[];

    beforeEach(() => {
      animatedValues = [
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
      ];
    });

    it('deve criar staggeredFadeIn para todos os valores', () => {
      listAnimations.staggeredFadeIn(animatedValues);

      expect(AnimatedMock.parallel).toHaveBeenCalled();
      const parallelArg = AnimatedMock.parallel.mock.calls[0][0];
      expect(Array.isArray(parallelArg)).toBe(true);
      expect(parallelArg).toHaveLength(3);
    });

    it('deve criar staggeredFadeIn com parâmetros customizados', () => {
      listAnimations.staggeredFadeIn(animatedValues, 200, 400);

      // Verifica que as animações foram criadas com os parâmetros corretos
      const timingCalls = AnimatedMock.timing.mock.calls;
      expect(timingCalls[0][1].duration).toBe(400);
      expect(timingCalls[0][1].toValue).toBe(1);
    });

    it('deve criar staggeredSlideIn para todos os valores', () => {
      listAnimations.staggeredSlideIn(animatedValues);

      expect(AnimatedMock.parallel).toHaveBeenCalled();
      const parallelArg = AnimatedMock.parallel.mock.calls[0][0];
      expect(Array.isArray(parallelArg)).toBe(true);
      expect(parallelArg).toHaveLength(3);
    });

    it('deve criar staggeredSlideIn com toValue 0', () => {
      listAnimations.staggeredSlideIn(animatedValues);

      const timingCalls = AnimatedMock.timing.mock.calls;
      expect(timingCalls[0][1].toValue).toBe(0);
    });
  });

  // ==================== CATEGORIA 8: feedbackAnimations ====================
  describe('feedbackAnimations', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(0);
    });

    it('deve criar success como sequência de timing + spring', () => {
      feedbackAnimations.success(animatedValue);

      expect(AnimatedMock.sequence).toHaveBeenCalled();
      const sequenceArg = AnimatedMock.sequence.mock.calls[0][0];
      expect(Array.isArray(sequenceArg)).toBe(true);
      expect(sequenceArg).toHaveLength(2);
    });

    it('deve criar success com escala 1.2 e depois spring para 1', () => {
      feedbackAnimations.success(animatedValue);

      expect(AnimatedMock.timing).toHaveBeenCalledWith(
        animatedValue,
        expect.objectContaining({
          toValue: 1.2,
          duration: ANIMATION_CONFIGS.FAST,
        })
      );

      expect(AnimatedMock.spring).toHaveBeenCalledWith(animatedValue, {
        toValue: 1,
        ...ANIMATION_CONFIGS.SPRING_CONFIG,
      });
    });

    it('deve criar error como sequência de shake (4 movimentos)', () => {
      feedbackAnimations.error(animatedValue);

      expect(AnimatedMock.sequence).toHaveBeenCalled();
      const sequenceArg = AnimatedMock.sequence.mock.calls[0][0];
      expect(Array.isArray(sequenceArg)).toBe(true);
      expect(sequenceArg).toHaveLength(4);
    });

    it('deve criar error com valores alternados (+10, -10, +10, 0)', () => {
      feedbackAnimations.error(animatedValue);

      const timingCalls = AnimatedMock.timing.mock.calls;
      expect(timingCalls[0][1].toValue).toBe(10);
      expect(timingCalls[1][1].toValue).toBe(-10);
      expect(timingCalls[2][1].toValue).toBe(10);
      expect(timingCalls[3][1].toValue).toBe(0);
    });

    it('deve criar loading como loop de sequência', () => {
      feedbackAnimations.loading(animatedValue);

      expect(AnimatedMock.loop).toHaveBeenCalled();
      expect(AnimatedMock.sequence).toHaveBeenCalled();
      const sequenceArg = AnimatedMock.sequence.mock.calls[0][0];
      expect(sequenceArg).toHaveLength(2);
    });

    it('deve criar loading oscilando entre 1 e 0.3', () => {
      feedbackAnimations.loading(animatedValue);

      const timingCalls = AnimatedMock.timing.mock.calls;
      expect(timingCalls[0][1].toValue).toBe(1);
      expect(timingCalls[0][1].duration).toBe(800);
      expect(timingCalls[1][1].toValue).toBe(0.3);
      expect(timingCalls[1][1].duration).toBe(800);
    });
  });

  // ==================== CATEGORIA 9: interpolations ====================
  describe('interpolations', () => {
    let animatedValue: Animated.Value;

    beforeEach(() => {
      animatedValue = new Animated.Value(0);
    });

    it('deve criar fadeInterpolation com propriedade opacity', () => {
      const result = interpolations.fadeInterpolation(animatedValue);

      expect(result).toEqual({
        opacity: animatedValue,
      });
    });

    it('deve criar scaleInterpolation com transform scale', () => {
      const result = interpolations.scaleInterpolation(animatedValue);

      expect(result).toEqual({
        transform: [{ scale: animatedValue }],
      });
    });

    it('deve criar slideFromRightInterpolation com distância padrão', () => {
      interpolations.slideFromRightInterpolation(animatedValue);

      const interpolateSpy = animatedValue.interpolate as jest.Mock;
      expect(interpolateSpy).toHaveBeenCalledWith({
        inputRange: [0, 1],
        outputRange: [100, 0],
      });
    });

    it('deve criar slideFromRightInterpolation com distância customizada', () => {
      interpolations.slideFromRightInterpolation(animatedValue, 200);

      const interpolateSpy = animatedValue.interpolate as jest.Mock;
      expect(interpolateSpy).toHaveBeenCalledWith({
        inputRange: [0, 1],
        outputRange: [200, 0],
      });
    });

    it('deve criar slideFromBottomInterpolation com distância padrão', () => {
      interpolations.slideFromBottomInterpolation(animatedValue);

      const interpolateSpy = animatedValue.interpolate as jest.Mock;
      expect(interpolateSpy).toHaveBeenCalledWith({
        inputRange: [0, 1],
        outputRange: [100, 0],
      });
    });

    it('deve criar slideFromBottomInterpolation com distância customizada', () => {
      interpolations.slideFromBottomInterpolation(animatedValue, 300);

      const interpolateSpy = animatedValue.interpolate as jest.Mock;
      expect(interpolateSpy).toHaveBeenCalledWith({
        inputRange: [0, 1],
        outputRange: [300, 0],
      });
    });

    it('deve criar rotateInterpolation de 0deg a 360deg', () => {
      interpolations.rotateInterpolation(animatedValue);

      const interpolateSpy = animatedValue.interpolate as jest.Mock;
      expect(interpolateSpy).toHaveBeenCalledWith({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
    });

    it('deve criar shakeInterpolation com translateX direto', () => {
      const result = interpolations.shakeInterpolation(animatedValue);

      expect(result).toEqual({
        transform: [
          {
            translateX: animatedValue,
          },
        ],
      });
    });
  });
});
