import {
  fadeIn,
  fadeOut,
  fadeInOut,
  scaleIn,
  scaleOut,
  scaleBounce,
  pulse,
  slideInFromRight,
  slideInFromLeft,
  slideInFromBottom,
  slideInFromTop,
  rotate,
  spin,
  wiggle,
  fadeAndScale,
  slideAndFade,
  scaleAndRotate,
  resetValue,
  resetMultipleValues,
} from '../animations';

// Mock react-native-reanimated
const mockTiming = jest.fn((value, config, callback) => {
  if (callback) setTimeout(() => callback(true), 100);
  return { value, config, callback };
});

const mockSpring = jest.fn((value, config, callback) => {
  if (callback) setTimeout(() => callback(true), 100);
  return { value, config, callback };
});

const mockDelay = jest.fn((delay, animation) => animation);
const mockSequence = jest.fn((...animations) => animations[0]);
const mockRepeat = jest.fn((animation) => animation);
const mockRunOnJS = jest.fn((fn) => fn);

jest.mock('react-native-reanimated', () => ({
  withTiming: mockTiming,
  withSpring: mockSpring,
  withDelay: mockDelay,
  withSequence: mockSequence,
  withRepeat: mockRepeat,
  runOnJS: mockRunOnJS,
  Easing: {
    linear: 'linear',
    ease: 'ease',
    quad: 'quad',
    bezier: jest.fn(),
  },
}));

describe('Animation Functions', () => {
  let mockSharedValue: any;

  beforeEach(() => {
    mockSharedValue = {
      value: 0,
    };
    jest.clearAllMocks();
  });

  describe('Fade Animations', () => {
    describe('fadeIn', () => {
      it('sets value to 1 with default options', () => {
        fadeIn(mockSharedValue);
        
        expect(mockTiming).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            duration: expect.any(Number),
            easing: expect.anything(),
          }),
          expect.any(Function)
        );
      });

      it('respects custom duration', () => {
        const customDuration = 1500;
        fadeIn(mockSharedValue, { duration: customDuration });
        
        expect(mockTiming).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            duration: customDuration,
          }),
          expect.any(Function)
        );
      });

      it('applies delay when specified', () => {
        const delay = 500;
        fadeIn(mockSharedValue, { delay });
        
        expect(mockDelay).toHaveBeenCalledWith(delay, expect.anything());
      });

      it('calls callback when animation finishes', (done) => {
        const callback = jest.fn(() => done());
        fadeIn(mockSharedValue, { callback });
        
        // Callback should be called when animation completes
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
        }, 150);
      });

      it('uses custom easing function', () => {
        const customEasing = 'custom-easing';
        fadeIn(mockSharedValue, { easing: customEasing as any });
        
        expect(mockTiming).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            easing: customEasing,
          }),
          expect.any(Function)
        );
      });
    });

    describe('fadeOut', () => {
      it('sets value to 0', () => {
        fadeOut(mockSharedValue);
        
        expect(mockTiming).toHaveBeenCalledWith(
          0,
          expect.objectContaining({
            duration: expect.any(Number),
          }),
          expect.any(Function)
        );
      });

      it('calls callback on completion', (done) => {
        const callback = jest.fn(() => done());
        fadeOut(mockSharedValue, { callback });
        
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
        }, 150);
      });
    });

    describe('fadeInOut', () => {
      it('creates sequence animation', () => {
        fadeInOut(mockSharedValue);
        
        expect(mockSequence).toHaveBeenCalled();
      });

      it('splits duration between fade in and out', () => {
        const duration = 2000;
        fadeInOut(mockSharedValue, { duration });
        
        // Should call timing twice with half duration each
        expect(mockTiming).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ duration: duration / 2 })
        );
      });
    });
  });

  describe('Scale Animations', () => {
    describe('scaleIn', () => {
      it('animates to scale 1 using spring', () => {
        scaleIn(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          1,
          expect.any(Object),
          expect.any(Function)
        );
      });

      it('uses custom spring configuration', () => {
        const customConfig = { damping: 15, stiffness: 150 };
        scaleIn(mockSharedValue, { springConfig: customConfig });
        
        expect(mockSpring).toHaveBeenCalledWith(
          1,
          customConfig,
          expect.any(Function)
        );
      });

      it('applies delay correctly', () => {
        const delay = 300;
        scaleIn(mockSharedValue, { delay });
        
        expect(mockDelay).toHaveBeenCalledWith(delay, expect.anything());
      });
    });

    describe('scaleOut', () => {
      it('animates to scale 0', () => {
        scaleOut(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          0,
          expect.any(Object),
          expect.any(Function)
        );
      });
    });

    describe('scaleBounce', () => {
      it('creates bounce sequence', () => {
        scaleBounce(mockSharedValue);
        
        expect(mockSequence).toHaveBeenCalled();
      });

      it('uses bouncy spring configuration', () => {
        scaleBounce(mockSharedValue);
        
        // Should call spring twice - once for 1.2, once for 1.0
        expect(mockSpring).toHaveBeenNthCalledWith(
          1,
          1.2,
          expect.any(Object),
          undefined
        );
        expect(mockSpring).toHaveBeenNthCalledWith(
          2,
          1,
          expect.any(Object),
          undefined
        );
      });
    });

    describe('pulse', () => {
      it('creates repeating animation', () => {
        pulse(mockSharedValue);
        
        expect(mockRepeat).toHaveBeenCalledWith(
          expect.anything(),
          -1,
          true
        );
      });

      it('creates pulse sequence', () => {
        pulse(mockSharedValue);
        
        expect(mockSequence).toHaveBeenCalled();
      });
    });
  });

  describe('Slide Animations', () => {
    describe('slideInFromRight', () => {
      it('animates to position 0', () => {
        slideInFromRight(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          0,
          expect.any(Object),
          expect.any(Function)
        );
      });
    });

    describe('slideInFromLeft', () => {
      it('animates to position 0', () => {
        slideInFromLeft(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          0,
          expect.any(Object),
          expect.any(Function)
        );
      });
    });

    describe('slideInFromBottom', () => {
      it('animates to position 0', () => {
        slideInFromBottom(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          0,
          expect.any(Object),
          expect.any(Function)
        );
      });
    });

    describe('slideInFromTop', () => {
      it('animates to position 0', () => {
        slideInFromTop(mockSharedValue);
        
        expect(mockSpring).toHaveBeenCalledWith(
          0,
          expect.any(Object),
          expect.any(Function)
        );
      });
    });
  });

  describe('Rotation Animations', () => {
    describe('rotate', () => {
      it('rotates to specified degrees', () => {
        const degrees = 180;
        rotate(mockSharedValue, degrees);
        
        expect(mockTiming).toHaveBeenCalledWith(
          degrees,
          expect.objectContaining({
            duration: expect.any(Number),
            easing: expect.anything(),
          }),
          expect.any(Function)
        );
      });

      it('uses default 360 degrees when not specified', () => {
        rotate(mockSharedValue);
        
        expect(mockTiming).toHaveBeenCalledWith(
          360,
          expect.anything(),
          expect.any(Function)
        );
      });

      it('calls callback on completion', (done) => {
        const callback = jest.fn(() => done());
        rotate(mockSharedValue, 90, { callback });
        
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
        }, 150);
      });
    });

    describe('spin', () => {
      it('creates infinite spinning animation', () => {
        spin(mockSharedValue);
        
        expect(mockRepeat).toHaveBeenCalledWith(
          expect.anything(),
          -1,
          false
        );
      });

      it('rotates full 360 degrees', () => {
        spin(mockSharedValue);
        
        expect(mockTiming).toHaveBeenCalledWith(
          360,
          expect.objectContaining({
            easing: expect.anything(),
          })
        );
      });
    });

    describe('wiggle', () => {
      it('creates wiggle sequence', () => {
        wiggle(mockSharedValue);
        
        expect(mockSequence).toHaveBeenCalled();
      });

      it('animates through wiggle positions', () => {
        wiggle(mockSharedValue);
        
        // Should animate to -10, 10, -10, 0
        expect(mockTiming).toHaveBeenCalledWith(-10, expect.anything());
        expect(mockTiming).toHaveBeenCalledWith(10, expect.anything());
        expect(mockTiming).toHaveBeenCalledWith(0, expect.anything());
      });
    });
  });

  describe('Combined Animations', () => {
    describe('fadeAndScale', () => {
      it('triggers both fade and scale animations', () => {
        const fadeValue = { value: 0 };
        const scaleValue = { value: 0 };
        
        fadeAndScale(fadeValue, scaleValue);
        
        // Should trigger both animations
        expect(mockTiming).toHaveBeenCalledWith(1, expect.anything(), expect.any(Function));
        expect(mockSpring).toHaveBeenCalledWith(1, expect.anything(), expect.any(Function));
      });

      it('passes options to both animations', () => {
        const fadeValue = { value: 0 };
        const scaleValue = { value: 0 };
        const options = { duration: 1000, delay: 500 };
        
        fadeAndScale(fadeValue, scaleValue, options);
        
        expect(mockDelay).toHaveBeenCalledWith(500, expect.anything());
      });
    });

    describe('slideAndFade', () => {
      it('triggers both slide and fade animations', () => {
        const slideValue = { value: 100 };
        const fadeValue = { value: 0 };
        
        slideAndFade(slideValue, fadeValue);
        
        // Should trigger both spring (slide) and timing (fade) animations
        expect(mockSpring).toHaveBeenCalledWith(0, expect.anything(), expect.any(Function));
        expect(mockTiming).toHaveBeenCalledWith(1, expect.anything(), expect.any(Function));
      });
    });

    describe('scaleAndRotate', () => {
      it('triggers both scale and rotate animations', () => {
        const scaleValue = { value: 0 };
        const rotateValue = { value: 0 };
        
        scaleAndRotate(scaleValue, rotateValue);
        
        // Should trigger both spring (scale) and timing (rotate) animations
        expect(mockSpring).toHaveBeenCalledWith(1, expect.anything(), expect.any(Function));
        expect(mockTiming).toHaveBeenCalledWith(360, expect.anything(), expect.any(Function));
      });
    });
  });

  describe('Utility Functions', () => {
    describe('resetValue', () => {
      it('sets value to specified initial value', () => {
        const initialValue = 5;
        resetValue(mockSharedValue, initialValue);
        
        expect(mockSharedValue.value).toBe(initialValue);
      });

      it('uses default value of 0 when not specified', () => {
        resetValue(mockSharedValue);
        
        expect(mockSharedValue.value).toBe(0);
      });
    });

    describe('resetMultipleValues', () => {
      it('resets all provided values', () => {
        const value1 = { value: 10 };
        const value2 = { value: 20 };
        const value3 = { value: 30 };
        
        const values = [
          { value: value1, initial: 1 },
          { value: value2, initial: 2 },
          { value: value3, initial: 3 },
        ];
        
        resetMultipleValues(values);
        
        expect(value1.value).toBe(1);
        expect(value2.value).toBe(2);
        expect(value3.value).toBe(3);
      });

      it('handles empty array gracefully', () => {
        expect(() => resetMultipleValues([])).not.toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles undefined shared values gracefully', () => {
      expect(() => fadeIn(undefined as any)).not.toThrow();
      expect(() => scaleIn(undefined as any)).not.toThrow();
      expect(() => rotate(undefined as any)).not.toThrow();
    });

    it('handles invalid options gracefully', () => {
      expect(() => fadeIn(mockSharedValue, null as any)).not.toThrow();
      expect(() => scaleIn(mockSharedValue, undefined as any)).not.toThrow();
    });

    it('handles negative durations', () => {
      fadeIn(mockSharedValue, { duration: -100 });
      
      // Should still call timing, implementation should handle negative values
      expect(mockTiming).toHaveBeenCalled();
    });

    it('handles very large durations', () => {
      const largeDuration = 1000000;
      fadeIn(mockSharedValue, { duration: largeDuration });
      
      expect(mockTiming).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ duration: largeDuration }),
        expect.any(Function)
      );
    });
  });

  describe('Performance Considerations', () => {
    it('should not create unnecessary function closures', () => {
      const callback = jest.fn();
      
      // Call same animation multiple times
      fadeIn(mockSharedValue, { callback });
      fadeIn(mockSharedValue, { callback });
      fadeIn(mockSharedValue, { callback });
      
      // Each call should work independently
      expect(mockTiming).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid successive calls', () => {
      // Rapid fire animations
      for (let i = 0; i < 100; i++) {
        fadeIn(mockSharedValue);
      }
      
      expect(mockTiming).toHaveBeenCalledTimes(100);
    });
  });
});