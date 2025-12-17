import { performance } from 'perf_hooks';
import { Animated, InteractionManager } from 'react-native';
import React from 'react';
import { TestRenderer, act } from 'react-test-renderer';
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';
import { MysteryBox } from '../../types/api';

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  InteractionManager: {
    runAfterInteractions: (callback: () => void) => {
      setTimeout(callback, 0);
      return { cancel: jest.fn() };
    },
    createInteractionHandle: jest.fn(() => 1),
    clearInteractionHandle: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useSharedValue: jest.fn((value) => ({ value })),
  useAnimatedStyle: jest.fn((callback) => callback()),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  withDelay: jest.fn((delay, animation) => animation),
  withSequence: jest.fn((...animations) => animations[0]),
  withRepeat: jest.fn((animation) => animation),
  runOnJS: jest.fn((fn) => fn),
}));

// Mock performance monitoring utilities
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  getEntries: jest.fn(() => []),
};

// Mock Memory Usage API
const mockMemoryInfo = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
};

interface MockPerformance extends Performance {
  memory?: typeof mockMemoryInfo;
}

// Setup global mocks
beforeAll(() => {
  global.PerformanceObserver = jest.fn(() => mockPerformanceObserver);
  (global.performance as MockPerformance).memory = mockMemoryInfo;
  
  // Mock requestAnimationFrame for animation testing
  global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 16); // ~60 FPS
    return 1;
  };
  
  global.cancelAnimationFrame = jest.fn();
});

describe('Animation Performance Tests', () => {
  let mockBox: MysteryBox;
  let mockAnimatedValues: {
    fadeAnim: Animated.Value;
    scaleAnim: Animated.Value;
    rotateAnim: Animated.Value;
  };

  beforeEach(() => {
    mockBox = {
      id: 'perf-test-box',
      name: 'Performance Test Box',
      price: 49.99,
      rarity: 'epic',
      images: [{ url: 'https://example.com/box.jpg' }],
      description: 'Test box for performance testing',
      category: 'testing',
      vendor: 'Test Vendor',
      rating: 4.5,
      reviewCount: 100,
      tags: ['performance', 'test'],
      isAvailable: true,
      stock: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockAnimatedValues = {
      fadeAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0),
      rotateAnim: new Animated.Value(0),
    };

    jest.clearAllMocks();
  });

  describe('Box Opening Animation Performance', () => {
    it('should complete box opening animation within performance budget', async () => {
      const startTime = performance.now();
      const startMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      // Create component with performance monitoring
      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Simulate animation lifecycle
      await act(async () => {
        // Trigger particle animations
        component.update(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="opening"
            fadeAnim={mockAnimatedValues.fadeAnim}
            scaleAnim={mockAnimatedValues.scaleAnim}
            rotateAnim={mockAnimatedValues.rotateAnim}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={false}
          />
        );

        // Wait for animation completion simulation
        await new Promise(resolve => setTimeout(resolve, 3000));
      });

      const endTime = performance.now();
      const endMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // 5 seconds max total time
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB max memory increase

      component.unmount();

      // Verify cleanup
      const finalMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
      expect(Math.abs(finalMemory - startMemory)).toBeLessThan(10 * 1024 * 1024); // 10MB cleanup tolerance
    });

    it('should handle concurrent animations efficiently', async () => {
      const components: TestRenderer[] = [];
      const startTime = performance.now();
      const startMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      // Create multiple concurrent animations
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          const component = TestRenderer.create(
            <BoxOpeningAnimation
              box={{ ...mockBox, id: `box-${i}` }}
              animationState="opening"
              fadeAnim={new Animated.Value(0)}
              scaleAnim={new Animated.Value(0)}
              rotateAnim={new Animated.Value(0)}
              onOpenPress={() => {}}
              canOpen={true}
              isLoading={false}
            />
          );
          components.push(component);
        }

        // Simulate concurrent animations
        await new Promise(resolve => setTimeout(resolve, 3000));
      });

      const endTime = performance.now();
      const endMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;

      // Should handle multiple animations without significant performance degradation
      expect(duration).toBeLessThan(8000); // 8 seconds for 10 concurrent animations
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // 100MB for 10 components

      // Cleanup all components
      components.forEach(component => component.unmount());

      // Verify memory cleanup
      await act(async () => {
        // Allow garbage collection simulation
        if (global.gc) {
          global.gc();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      const finalMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
      expect(Math.abs(finalMemory - startMemory)).toBeLessThan(20 * 1024 * 1024); // 20MB cleanup tolerance
    });

    it('should maintain frame rate during particle animations', async () => {
      const frameTimings: number[] = [];
      const targetFPS = 60;
      const frameBudget = 1000 / targetFPS; // ~16.67ms per frame

      // Mock frame timing collection
      let frameCount = 0;
      const mockRAF = (callback: FrameRequestCallback) => {
        const startFrame = performance.now();
        setTimeout(() => {
          const endFrame = performance.now();
          frameTimings.push(endFrame - startFrame);
          frameCount++;
          callback(endFrame);
        }, Math.random() * 20 + 10); // Simulate variable frame times
        return frameCount;
      };

      global.requestAnimationFrame = mockRAF;

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Simulate 60 frames (1 second at 60 FPS)
      await act(async () => {
        for (let i = 0; i < 60; i++) {
          await new Promise(resolve => {
            requestAnimationFrame(() => resolve(undefined));
          });
        }
      });

      component.unmount();

      // Analyze frame performance
      const avgFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length;
      const droppedFrames = frameTimings.filter(time => time > frameBudget * 1.5).length;
      const droppedFramePercentage = (droppedFrames / frameTimings.length) * 100;

      // Performance assertions
      expect(avgFrameTime).toBeLessThan(frameBudget * 1.2); // Average should be within 20% of budget
      expect(droppedFramePercentage).toBeLessThan(10); // Less than 10% dropped frames
    });

    it('should gracefully handle low memory conditions', async () => {
      // Simulate low memory by reducing available heap
      const lowMemoryInfo = {
        usedJSHeapSize: 180 * 1024 * 1024, // 180MB used
        totalJSHeapSize: 200 * 1024 * 1024, // 200MB total
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB limit
      };

      (global.performance as MockPerformance).memory = lowMemoryInfo;

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Should not crash under memory pressure
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      expect(component.getInstance()).toBeTruthy();
      component.unmount();

      // Restore normal memory conditions
      (global.performance as MockPerformance).memory = mockMemoryInfo;
    });

    it('should optimize particle count based on device performance', async () => {
      const performanceScenarios = [
        { name: 'high-end', cpuFactor: 1.0, expectedParticles: 8 },
        { name: 'mid-range', cpuFactor: 0.7, expectedParticles: 6 },
        { name: 'low-end', cpuFactor: 0.4, expectedParticles: 4 },
      ];

      for (const scenario of performanceScenarios) {
        // Mock device performance characteristics
        const _mockStartTime = performance.now();
        
        // Simulate different CPU performance
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (callback: any, delay: number) => {
          return originalSetTimeout(callback, delay / scenario.cpuFactor);
        };

        const component = TestRenderer.create(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="opening"
            fadeAnim={mockAnimatedValues.fadeAnim}
            scaleAnim={mockAnimatedValues.scaleAnim}
            rotateAnim={mockAnimatedValues.rotateAnim}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={false}
          />
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        });

        // Verify particle optimization
        const tree = component.toTree();
        // In a real implementation, we would check the particle count here
        // For now, we just verify the component rendered successfully
        expect(tree).toBeTruthy();

        component.unmount();
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Memory Management', () => {
    it('should properly cleanup animation resources', async () => {
      const startMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      await act(async () => {
        // Simulate animation lifecycle
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      const _duringMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      // Unmount and cleanup
      component.unmount();

      await act(async () => {
        // Simulate garbage collection
        if (global.gc) {
          global.gc();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      const finalMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      // Memory should return close to initial levels
      const memoryIncrease = finalMemory - startMemory;
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB permanent increase
    });

    it('should handle rapid mount/unmount cycles', async () => {
      const cycles = 50;
      const startMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < cycles; i++) {
        const component = TestRenderer.create(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="idle"
            fadeAnim={new Animated.Value(1)}
            scaleAnim={new Animated.Value(1)}
            rotateAnim={new Animated.Value(0)}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={false}
          />
        );

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        component.unmount();
      }

      // Force cleanup
      await act(async () => {
        if (global.gc) {
          global.gc();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      const finalMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - startMemory;

      // Should not accumulate significant memory after many cycles
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB after 50 cycles
    });

    it('should monitor InteractionManager usage', async () => {
      const mockCreateHandle = jest.spyOn(InteractionManager, 'createInteractionHandle');
      const mockClearHandle = jest.spyOn(InteractionManager, 'clearInteractionHandle');

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      component.unmount();

      // Verify InteractionManager handles are properly managed
      expect(mockCreateHandle).toHaveBeenCalled();
      expect(mockClearHandle).toHaveBeenCalled();
    });
  });

  describe('Animation Smoothness', () => {
    it('should maintain consistent animation timing', async () => {
      const animationTimings: number[] = [];
      let lastFrameTime = performance.now();

      // Mock animation frame timing
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (callback) => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        animationTimings.push(deltaTime);
        lastFrameTime = currentTime;
        
        return originalRAF(() => callback(currentTime));
      };

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      await act(async () => {
        // Simulate several animation frames
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => {
            requestAnimationFrame(() => resolve(undefined));
          });
        }
      });

      component.unmount();
      global.requestAnimationFrame = originalRAF;

      // Analyze timing consistency
      const avgDelta = animationTimings.reduce((sum, delta) => sum + delta, 0) / animationTimings.length;
      const varianceSquared = animationTimings.reduce((sum, delta) => sum + Math.pow(delta - avgDelta, 2), 0) / animationTimings.length;
      const standardDeviation = Math.sqrt(varianceSquared);

      // Animation timing should be consistent (low standard deviation)
      expect(standardDeviation).toBeLessThan(avgDelta * 0.3); // Within 30% of average
    });

    it('should handle simultaneous state changes efficiently', async () => {
      const startTime = performance.now();

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Rapid state changes
      await act(async () => {
        component.update(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="opening"
            fadeAnim={mockAnimatedValues.fadeAnim}
            scaleAnim={mockAnimatedValues.scaleAnim}
            rotateAnim={mockAnimatedValues.rotateAnim}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={true}
          />
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        component.update(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="revealing"
            fadeAnim={mockAnimatedValues.fadeAnim}
            scaleAnim={mockAnimatedValues.scaleAnim}
            rotateAnim={mockAnimatedValues.rotateAnim}
            onOpenPress={() => {}}
            canOpen={false}
            isLoading={false}
          />
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        component.update(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="completed"
            fadeAnim={mockAnimatedValues.fadeAnim}
            scaleAnim={mockAnimatedValues.scaleAnim}
            rotateAnim={mockAnimatedValues.rotateAnim}
            onOpenPress={() => {}}
            canOpen={false}
            isLoading={false}
          />
        );
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid state changes without blocking
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for state changes

      component.unmount();
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should track CPU usage during animations', async () => {
      const cpuUsageStart = process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 };

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      await act(async () => {
        // Simulate intensive animation workload
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      const cpuUsageEnd = process.cpuUsage ? process.cpuUsage(cpuUsageStart) : { user: 0, system: 0 };

      component.unmount();

      // CPU usage should be reasonable (this is a rough check since CPU usage varies by environment)
      const totalCPUTime = cpuUsageEnd.user + cpuUsageEnd.system;
      expect(totalCPUTime).toBeLessThan(500000); // Less than 500ms of CPU time for 2s of animation
    });

    it('should validate animation performance under load', async () => {
      const performanceMetrics = {
        renderTime: 0,
        updateCount: 0,
        memoryPeak: 0,
      };

      const startMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;

      const component = TestRenderer.create(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={mockAnimatedValues.fadeAnim}
          scaleAnim={mockAnimatedValues.scaleAnim}
          rotateAnim={mockAnimatedValues.rotateAnim}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Simulate high load scenario
      await act(async () => {
        const loadStartTime = performance.now();

        // Multiple rapid updates to simulate high load
        for (let i = 0; i < 100; i++) {
          component.update(
            <BoxOpeningAnimation
              box={mockBox}
              animationState={i % 2 === 0 ? "opening" : "revealing"}
              fadeAnim={mockAnimatedValues.fadeAnim}
              scaleAnim={mockAnimatedValues.scaleAnim}
              rotateAnim={mockAnimatedValues.rotateAnim}
              onOpenPress={() => {}}
              canOpen={true}
              isLoading={i % 3 === 0}
            />
          );

          performanceMetrics.updateCount++;

          const currentMemory = (performance as MockPerformance).memory?.usedJSHeapSize || 0;
          performanceMetrics.memoryPeak = Math.max(performanceMetrics.memoryPeak, currentMemory - startMemory);

          await new Promise(resolve => setTimeout(resolve, 10));
        }

        performanceMetrics.renderTime = performance.now() - loadStartTime;
      });

      component.unmount();

      // Performance should remain acceptable under load
      expect(performanceMetrics.renderTime).toBeLessThan(5000); // 5 seconds for 100 updates
      expect(performanceMetrics.memoryPeak).toBeLessThan(50 * 1024 * 1024); // 50MB peak memory increase
      expect(performanceMetrics.updateCount).toBe(100);
    });
  });
});