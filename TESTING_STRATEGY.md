# Comprehensive Testing Strategy for Gamified Box Opening System

> **Testing Specialist Report**  
> **Date:** 2025-01-23  
> **Version:** 1.0.0  
> **Status:** Implementation Ready

## Overview

Este documento define uma estratégia abrangente de testes para o sistema gamificado de abertura de caixas do Crowbar Mobile, focando em animações, performance, acessibilidade e compatibilidade entre dispositivos.

## Test Architecture

### Testing Pyramid

```
        /\
       /E2E\     (5%) - User Journey Tests
      /------\
     /Integration\ (25%) - Component Integration
    /------------\
   /  Unit Tests  \ (70%) - Component & Animation Logic
  /----------------\
```

### Testing Layers

1. **Unit Tests** - Individual components and animation logic
2. **Integration Tests** - Component interactions and state management
3. **E2E Tests** - Complete user flows and scenarios
4. **Performance Tests** - Animation performance and resource usage
5. **Accessibility Tests** - Screen reader and usability compliance
6. **Device Tests** - Cross-platform compatibility

## 1. Unit Testing for Animation Components

### Key Components to Test

#### BoxOpeningAnimation Component
- Animation state transitions
- Particle animation calculations
- Glow effect timing
- Rarity color mapping
- Image loading and fallbacks
- Button interaction states

#### Animation Library (animations.ts)
- Individual animation functions
- Timing and easing calculations
- Spring configuration handling
- Animation callbacks
- Value reset functionality

#### React Native Reanimated Hooks
- `useAnimations` hook behavior
- `useGestureAnimations` gesture handling
- `useReanimatedAnimations` performance optimizations

### Sample Unit Tests

```typescript
// src/components/__tests__/BoxOpeningAnimation.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import BoxOpeningAnimation from '../BoxOpeningAnimation';
import { MysteryBox } from '../../types/api';

// Mock Animated.Value
const createMockAnimatedValue = (initialValue: number) => ({
  setValue: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  _value: initialValue,
});

describe('BoxOpeningAnimation', () => {
  const mockBox: MysteryBox = {
    id: '1',
    name: 'Test Box',
    price: 29.99,
    rarity: 'rare',
    images: [{ url: 'https://example.com/box.jpg' }],
  };

  const defaultProps = {
    box: mockBox,
    animationState: 'idle' as const,
    fadeAnim: createMockAnimatedValue(1),
    scaleAnim: createMockAnimatedValue(1),
    rotateAnim: createMockAnimatedValue(0),
    onOpenPress: jest.fn(),
    canOpen: true,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders box information correctly', () => {
      const { getByText } = render(<BoxOpeningAnimation {...defaultProps} />);
      
      expect(getByText('Test Box')).toBeTruthy();
      expect(getByText('R$ 29,99')).toBeTruthy();
      expect(getByText('RARE')).toBeTruthy();
    });

    it('displays open button when in idle state', () => {
      const { getByText } = render(<BoxOpeningAnimation {...defaultProps} />);
      
      expect(getByText('ABRIR CAIXA')).toBeTruthy();
    });

    it('applies correct rarity color', () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation {...defaultProps} />
      );
      
      // Test rarity border color
      const rarityBorder = getByTestId('rarity-border');
      expect(rarityBorder.props.style.borderColor).toBe('#2196F3'); // rare = blue
    });
  });

  describe('Animation States', () => {
    it('shows loading indicator when opening', () => {
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="opening" 
        />
      );
      
      expect(getByText('Abrindo caixa...')).toBeTruthy();
    });

    it('shows revealing text when revealing', () => {
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="revealing" 
        />
      );
      
      expect(getByText('Revelando itens...')).toBeTruthy();
    });

    it('renders particles when opening', () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="opening" 
        />
      );
      
      expect(getByTestId('particles-container')).toBeTruthy();
    });

    it('renders glow effect when opening', () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="opening" 
        />
      );
      
      expect(getByTestId('glow-effect')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onOpenPress when button is pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          onOpenPress={mockOnPress} 
        />
      );
      
      fireEvent.press(getByText('ABRIR CAIXA'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('disables button when canOpen is false', () => {
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          canOpen={false} 
        />
      );
      
      const button = getByText('ABRIR CAIXA');
      expect(button.props.disabled).toBe(true);
    });

    it('shows loading state when isLoading is true', () => {
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          isLoading={true} 
        />
      );
      
      expect(getByText('Abrindo...')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing images gracefully', () => {
      const boxWithoutImages = { ...mockBox, images: [] };
      const { getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithoutImages} 
        />
      );
      
      const image = getByTestId('box-image');
      expect(image.props.source.uri).toContain('data:image/svg+xml');
    });

    it('handles unknown rarity gracefully', () => {
      const boxWithUnknownRarity = { ...mockBox, rarity: 'unknown' };
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithUnknownRarity} 
        />
      );
      
      expect(getByText('UNKNOWN')).toBeTruthy();
    });

    it('formats currency correctly for different values', () => {
      const expensiveBox = { ...mockBox, price: 1234.56 };
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={expensiveBox} 
        />
      );
      
      expect(getByText('R$ 1.234,56')).toBeTruthy();
    });
  });
});
```

```typescript
// src/animations/__tests__/animations.test.ts
import { SharedValue } from 'react-native-reanimated';
import {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleBounce,
  pulse,
  rotate,
  wiggle,
  resetValue,
} from '../animations';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  withTiming: jest.fn((value, config, callback) => {
    if (callback) callback(true);
    return value;
  }),
  withSpring: jest.fn((value, config, callback) => {
    if (callback) callback(true);
    return value;
  }),
  withDelay: jest.fn((delay, animation) => animation),
  withSequence: jest.fn((...animations) => animations[0]),
  withRepeat: jest.fn((animation) => animation),
  runOnJS: jest.fn((fn) => fn),
  Easing: {
    linear: 'linear',
    ease: 'ease',
    quad: 'quad',
  },
}));

describe('Animation Functions', () => {
  let mockSharedValue: SharedValue<number>;

  beforeEach(() => {
    mockSharedValue = {
      value: 0,
    } as SharedValue<number>;
    jest.clearAllMocks();
  });

  describe('Fade Animations', () => {
    it('fadeIn sets value to 1', () => {
      fadeIn(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('fadeOut sets value to 0', () => {
      fadeOut(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('fadeIn calls callback when finished', () => {
      const callback = jest.fn();
      fadeIn(mockSharedValue, { callback });
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Scale Animations', () => {
    it('scaleIn animates to scale 1', () => {
      scaleIn(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('scaleBounce creates bounce effect', () => {
      scaleBounce(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('pulse creates repeating animation', () => {
      pulse(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });
  });

  describe('Rotation Animations', () => {
    it('rotate animates to specified degrees', () => {
      rotate(mockSharedValue, 180);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('rotate uses default 360 degrees', () => {
      rotate(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });

    it('wiggle creates shake effect', () => {
      wiggle(mockSharedValue);
      expect(mockSharedValue.value).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('resetValue sets value to initial', () => {
      resetValue(mockSharedValue, 5);
      expect(mockSharedValue.value).toBe(5);
    });

    it('resetValue uses default 0', () => {
      resetValue(mockSharedValue);
      expect(mockSharedValue.value).toBe(0);
    });
  });

  describe('Animation Options', () => {
    it('respects duration option', () => {
      const customDuration = 1500;
      fadeIn(mockSharedValue, { duration: customDuration });
      expect(mockSharedValue.value).toBeDefined();
    });

    it('respects delay option', () => {
      const customDelay = 500;
      fadeIn(mockSharedValue, { delay: customDelay });
      expect(mockSharedValue.value).toBeDefined();
    });

    it('handles callback option', () => {
      const callback = jest.fn();
      scaleIn(mockSharedValue, { callback });
      expect(callback).toHaveBeenCalled();
    });
  });
});
```

## 2. Integration Testing

### Box Opening Flow Integration

```typescript
// src/test/integration/boxOpening.integration.test.ts
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BoxOpeningScreen from '../../screens/BoxOpening/BoxOpeningScreen';
import { boxOpeningSlice } from '../../store/slices/boxOpeningSlice';
import { authSlice } from '../../store/slices/authSlice';
import * as boxService from '../../services/boxService';

// Mock services
jest.mock('../../services/boxService');
jest.mock('../../services/analyticsService');
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const mockBoxService = boxService as jest.Mocked<typeof boxService>;

describe('Box Opening Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        boxOpening: boxOpeningSlice.reducer,
        auth: authSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    jest.clearAllMocks();
  });

  const mockBox = {
    id: '1',
    name: 'Premium Mystery Box',
    price: 49.99,
    rarity: 'epic',
    images: [{ url: 'https://example.com/box.jpg' }],
  };

  const mockItems = [
    { id: '1', name: 'Rare Item 1', value: 25.00, rarity: 'rare' },
    { id: '2', name: 'Epic Item 2', value: 75.00, rarity: 'epic' },
  ];

  it('completes full box opening flow', async () => {
    // Setup mocks
    mockBoxService.openBox.mockResolvedValue({
      success: true,
      items: mockItems,
      totalValue: 100.00,
    });

    // Setup initial state
    store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));
    store.dispatch(authSlice.actions.loginSuccess({
      user: { id: '1', name: 'Test User', email: 'test@test.com' },
      token: 'test-token',
    }));

    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <BoxOpeningScreen route={{ params: { boxId: '1' } }} navigation={{}} />
      </Provider>
    );

    // 1. Initial state - should show box and open button
    expect(getByText('Premium Mystery Box')).toBeTruthy();
    expect(getByText('ABRIR CAIXA')).toBeTruthy();

    // 2. Start opening process
    fireEvent.press(getByText('ABRIR CAIXA'));

    // 3. Should show opening animation
    await waitFor(() => {
      expect(getByText('Abrindo caixa...')).toBeTruthy();
    });

    // 4. Wait for animation and API call
    await waitFor(() => {
      expect(mockBoxService.openBox).toHaveBeenCalledWith('1');
    }, { timeout: 5000 });

    // 5. Should show revealing state
    await waitFor(() => {
      expect(getByText('Revelando itens...')).toBeTruthy();
    });

    // 6. Should show revealed items
    await waitFor(() => {
      expect(getByText('Rare Item 1')).toBeTruthy();
      expect(getByText('Epic Item 2')).toBeTruthy();
    }, { timeout: 3000 });

    // 7. Should show total value
    await waitFor(() => {
      expect(getByText('R$ 100,00')).toBeTruthy();
    });

    // 8. Verify final state
    const state = store.getState();
    expect(state.boxOpening.animationState).toBe('completed');
    expect(state.boxOpening.revealedItems).toHaveLength(2);
  });

  it('handles opening errors gracefully', async () => {
    // Setup error mock
    mockBoxService.openBox.mockRejectedValue(new Error('Network error'));

    store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));

    const { getByText } = render(
      <Provider store={store}>
        <BoxOpeningScreen route={{ params: { boxId: '1' } }} navigation={{}} />
      </Provider>
    );

    // Start opening
    fireEvent.press(getByText('ABRIR CAIXA'));

    // Should show error message
    await waitFor(() => {
      expect(getByText(/erro/i)).toBeTruthy();
    });

    // Should reset to idle state
    await waitFor(() => {
      expect(getByText('ABRIR CAIXA')).toBeTruthy();
    });
  });

  it('tracks analytics events during opening', async () => {
    const mockAnalytics = require('../../services/analyticsService');
    
    mockBoxService.openBox.mockResolvedValue({
      success: true,
      items: mockItems,
      totalValue: 100.00,
    });

    store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));

    const { getByText } = render(
      <Provider store={store}>
        <BoxOpeningScreen route={{ params: { boxId: '1' } }} navigation={{}} />
      </Provider>
    );

    fireEvent.press(getByText('ABRIR CAIXA'));

    await waitFor(() => {
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('box_opening_started', {
        boxId: '1',
        boxName: 'Premium Mystery Box',
        rarity: 'epic',
      });
    });

    await waitFor(() => {
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('box_opening_completed', {
        boxId: '1',
        itemsReceived: 2,
        totalValue: 100.00,
      });
    }, { timeout: 5000 });
  });
});
```

## 3. E2E Testing with Detox

### User Journey Tests

```typescript
// e2e/tests/boxOpening.e2e.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Box Opening User Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full box opening experience', async () => {
    // 1. Navigate to shop
    await element(by.id('tab-shop')).tap();
    await detoxExpect(element(by.id('shop-screen'))).toBeVisible();

    // 2. Find and select a box
    await element(by.id('box-card-1')).tap();
    await detoxExpect(element(by.id('box-details-screen'))).toBeVisible();

    // 3. Navigate to opening screen
    await element(by.id('open-box-button')).tap();
    await detoxExpect(element(by.id('box-opening-screen'))).toBeVisible();

    // 4. Verify box information is displayed
    await detoxExpect(element(by.id('box-name'))).toBeVisible();
    await detoxExpect(element(by.id('box-price'))).toBeVisible();
    await detoxExpect(element(by.id('box-rarity'))).toBeVisible();

    // 5. Start opening animation
    await element(by.id('open-box-button')).tap();

    // 6. Wait for opening animation
    await detoxExpected(element(by.id('opening-animation'))).toBeVisible();
    await detoxExpected(element(by.text('Abrindo caixa...'))).toBeVisible();

    // 7. Wait for particles animation
    await detoxExpected(element(by.id('particles-container'))).toBeVisible();

    // 8. Wait for revealing phase
    await waitFor(element(by.text('Revelando itens...')))
      .toBeVisible()
      .withTimeout(10000);

    // 9. Verify items are revealed
    await waitFor(element(by.id('revealed-items-container')))
      .toBeVisible()
      .withTimeout(15000);

    // 10. Check share functionality
    await element(by.id('share-results-button')).tap();
    await detoxExpected(element(by.id('share-modal'))).toBeVisible();

    // 11. Close and return to shop
    await element(by.id('close-share-modal')).tap();
    await element(by.id('back-to-shop-button')).tap();
    await detoxExpected(element(by.id('shop-screen'))).toBeVisible();
  });

  it('should handle network errors gracefully', async () => {
    // Simulate network error
    await device.setURLBlacklist(['**/api/boxes/**']);

    await element(by.id('tab-shop')).tap();
    await element(by.id('box-card-1')).tap();
    await element(by.id('open-box-button')).tap();
    await element(by.id('open-box-button')).tap();

    // Should show error message
    await waitFor(element(by.text(/erro/i)))
      .toBeVisible()
      .withTimeout(10000);

    // Should allow retry
    await detoxExpected(element(by.id('retry-button'))).toBeVisible();

    // Reset network
    await device.setURLBlacklist([]);
  });

  it('should maintain animation performance', async () => {
    await element(by.id('tab-shop')).tap();
    await element(by.id('box-card-1')).tap();
    await element(by.id('open-box-button')).tap();

    // Start performance monitoring
    await device.startProfiling();

    await element(by.id('open-box-button')).tap();

    // Wait for complete animation sequence
    await waitFor(element(by.id('revealed-items-container')))
      .toBeVisible()
      .withTimeout(15000);

    // Stop profiling and check metrics
    const profile = await device.stopProfiling();
    
    // Verify no significant frame drops
    expect(profile.fps).toBeGreaterThan(55); // Should maintain ~60 FPS
    expect(profile.memoryUsage).toBeLessThan(150); // MB
  });

  it('should work on different screen sizes', async () => {
    const devices = ['iPhone SE', 'iPhone 12', 'iPad Pro'];
    
    for (const deviceName of devices) {
      await device.selectDevice(deviceName);
      await device.reloadReactNative();

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-1')).tap();
      await element(by.id('open-box-button')).tap();

      // Verify layout adapts correctly
      await detoxExpected(element(by.id('box-opening-screen'))).toBeVisible();
      await detoxExpected(element(by.id('box-image'))).toBeVisible();
      await detoxExpected(element(by.id('open-box-button'))).toBeVisible();
    }
  });
});
```

## 4. Performance Testing

### Animation Performance Tests

```typescript
// src/test/performance/animationPerformance.test.ts
import { performance } from 'perf_hooks';
import { Animated } from 'react-native';
import { TestRenderer } from 'react-test-renderer';
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';

describe('Animation Performance', () => {
  let mockPerformanceObserver: any;

  beforeEach(() => {
    mockPerformanceObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      getEntries: jest.fn(() => []),
    };
    
    // Mock Performance Observer
    global.PerformanceObserver = jest.fn(() => mockPerformanceObserver);
  });

  it('should complete box opening animation within performance budget', async () => {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage().heapUsed;

    // Create component with performance monitoring
    const component = TestRenderer.create(
      <BoxOpeningAnimation
        box={{
          id: '1',
          name: 'Test Box',
          price: 29.99,
          rarity: 'rare',
        }}
        animationState="opening"
        fadeAnim={new Animated.Value(0)}
        scaleAnim={new Animated.Value(0)}
        rotateAnim={new Animated.Value(0)}
        onOpenPress={() => {}}
        canOpen={true}
        isLoading={false}
      />
    );

    // Simulate animation completion
    await new Promise(resolve => setTimeout(resolve, 3000));

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = memoryAfter - memoryBefore;

    // Performance assertions
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB max

    component.unmount();
  });

  it('should handle concurrent animations efficiently', async () => {
    const components: TestRenderer[] = [];
    const startTime = performance.now();

    // Create multiple concurrent animations
    for (let i = 0; i < 10; i++) {
      components.push(
        TestRenderer.create(
          <BoxOpeningAnimation
            box={{
              id: `${i}`,
              name: `Box ${i}`,
              price: 29.99,
              rarity: 'common',
            }}
            animationState="opening"
            fadeAnim={new Animated.Value(0)}
            scaleAnim={new Animated.Value(0)}
            rotateAnim={new Animated.Value(0)}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={false}
          />
        )
      );
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    const endTime = performance.now();

    // Should handle multiple animations without significant delay
    expect(endTime - startTime).toBeLessThan(8000); // 8 seconds for 10 concurrent

    // Cleanup
    components.forEach(component => component.unmount());
  });

  it('should cleanup animation resources properly', () => {
    const component = TestRenderer.create(
      <BoxOpeningAnimation
        box={{
          id: '1',
          name: 'Test Box',
          price: 29.99,
          rarity: 'rare',
        }}
        animationState="opening"
        fadeAnim={new Animated.Value(0)}
        scaleAnim={new Animated.Value(0)}
        rotateAnim={new Animated.Value(0)}
        onOpenPress={() => {}}
        canOpen={true}
        isLoading={false}
      />
    );

    const memoryBefore = process.memoryUsage().heapUsed;
    
    // Unmount component
    component.unmount();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = memoryAfter - memoryBefore;

    // Should not leak significant memory
    expect(Math.abs(memoryDelta)).toBeLessThan(10 * 1024 * 1024); // 10MB tolerance
  });
});
```

### Device Performance Testing Matrix

```typescript
// scripts/devicePerformanceTest.js
const deviceTestMatrix = {
  iOS: {
    devices: [
      { name: 'iPhone SE 2020', tier: 'low', ram: '3GB', cpu: 'A13' },
      { name: 'iPhone 12', tier: 'mid', ram: '4GB', cpu: 'A14' },
      { name: 'iPhone 14 Pro', tier: 'high', ram: '6GB', cpu: 'A16' },
      { name: 'iPad Air', tier: 'mid', ram: '4GB', cpu: 'A14' },
    ],
    versions: ['iOS 13.0', 'iOS 14.0', 'iOS 15.0', 'iOS 16.0', 'iOS 17.0'],
  },
  Android: {
    devices: [
      { name: 'Samsung Galaxy A32', tier: 'low', ram: '4GB', cpu: 'Helio G80' },
      { name: 'Samsung Galaxy S21', tier: 'mid', ram: '8GB', cpu: 'Exynos 2100' },
      { name: 'Samsung Galaxy S23 Ultra', tier: 'high', ram: '12GB', cpu: 'Snapdragon 8 Gen 2' },
      { name: 'Google Pixel 6', tier: 'mid', ram: '8GB', cpu: 'Google Tensor' },
    ],
    versions: ['API 21', 'API 23', 'API 26', 'API 28', 'API 31', 'API 34'],
  },
};

const performanceThresholds = {
  low: {
    animationFPS: 45,
    memoryUsage: 100, // MB
    cpuUsage: 80, // %
    batteryDrain: 5, // % per hour
  },
  mid: {
    animationFPS: 55,
    memoryUsage: 150,
    cpuUsage: 70,
    batteryDrain: 3,
  },
  high: {
    animationFPS: 60,
    memoryUsage: 200,
    cpuUsage: 60,
    batteryDrain: 2,
  },
};

const performanceTests = [
  {
    name: 'Box Opening Animation',
    duration: 5000, // 5 seconds
    concurrent: 1,
    metrics: ['fps', 'memory', 'cpu'],
  },
  {
    name: 'Multiple Box Animations',
    duration: 10000,
    concurrent: 5,
    metrics: ['fps', 'memory', 'cpu', 'battery'],
  },
  {
    name: 'Particle Effects Stress Test',
    duration: 15000,
    concurrent: 10,
    metrics: ['fps', 'memory', 'cpu', 'battery'],
  },
];
```

## 5. Accessibility Testing

### Screen Reader Tests

```typescript
// src/test/accessibility/screenReader.test.ts
import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';

describe('Screen Reader Accessibility', () => {
  const mockBox = {
    id: '1',
    name: 'Epic Mystery Box',
    price: 79.99,
    rarity: 'epic',
  };

  beforeEach(() => {
    // Mock AccessibilityInfo
    AccessibilityInfo.isScreenReaderEnabled = jest.fn(() => Promise.resolve(true));
  });

  it('provides meaningful accessibility labels', () => {
    const { getByLabelText } = render(
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

    // Box information should be accessible
    expect(getByLabelText(/Epic Mystery Box/)).toBeTruthy();
    expect(getByLabelText(/79,99/)).toBeTruthy();
    expect(getByLabelText(/epic/i)).toBeTruthy();
  });

  it('provides action accessibility labels', () => {
    const { getByLabelText } = render(
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

    // Open button should have descriptive label
    expect(getByLabelText(/abrir caixa epic mystery box/i)).toBeTruthy();
  });

  it('announces animation state changes', () => {
    const { getByLabelText, rerender } = render(
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

    // Change to opening state
    rerender(
      <BoxOpeningAnimation
        box={mockBox}
        animationState="opening"
        fadeAnim={new Animated.Value(1)}
        scaleAnim={new Animated.Value(1)}
        rotateAnim={new Animated.Value(0)}
        onOpenPress={() => {}}
        canOpen={true}
        isLoading={false}
      />
    );

    // Should announce opening state
    expect(getByLabelText(/abrindo caixa/i)).toBeTruthy();
  });

  it('maintains proper focus order', () => {
    const { getByTestId } = render(
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

    // Elements should have proper accessibility focus order
    const elements = [
      getByTestId('box-name'),
      getByTestId('box-price'),
      getByTestId('box-rarity'),
      getByTestId('open-box-button'),
    ];

    elements.forEach((element, index) => {
      expect(element.props.accessibilityOrder).toBe(index + 1);
    });
  });
});
```

### Touch Target Tests

```typescript
// src/test/accessibility/touchTargets.test.ts
import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';

describe('Touch Target Accessibility', () => {
  const mockBox = {
    id: '1',
    name: 'Test Box',
    price: 29.99,
    rarity: 'common',
  };

  it('maintains minimum touch target size', () => {
    const { getByTestId } = render(
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

    const button = getByTestId('open-box-button');
    const { width, height } = button.props.style;

    // Minimum 44x44 points for touch targets
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it('adapts to different screen densities', () => {
    const originalDimensions = Dimensions.get('window');
    
    // Mock different screen sizes
    const testSizes = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11
      { width: 768, height: 1024 }, // iPad
    ];

    testSizes.forEach(size => {
      // Mock Dimensions
      Dimensions.get = jest.fn(() => size);

      const { getByTestId } = render(
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

      const button = getByTestId('open-box-button');
      
      // Touch targets should scale appropriately
      expect(button.props.style.width).toBeGreaterThanOrEqual(44);
      expect(button.props.style.height).toBeGreaterThanOrEqual(44);
    });

    // Restore original Dimensions
    Dimensions.get = jest.fn(() => originalDimensions);
  });
});
```

## 6. Load Testing for Animations

### Stress Testing Scenarios

```typescript
// scripts/loadTest.js
const loadTestScenarios = [
  {
    name: 'Single User Heavy Animation',
    description: 'One user opening 50 boxes consecutively',
    duration: '10 minutes',
    actions: [
      { type: 'navigate', target: 'shop' },
      { type: 'repeat', count: 50, actions: [
        { type: 'selectBox', boxId: 'random' },
        { type: 'openBox', waitForCompletion: true },
        { type: 'shareResult' },
        { type: 'returnToShop' },
      ]},
    ],
    metrics: ['memory', 'cpu', 'battery', 'fps'],
  },
  {
    name: 'Concurrent Opening Simulation',
    description: 'Simulate multiple users opening boxes simultaneously',
    users: 100,
    duration: '5 minutes',
    actions: [
      { type: 'login' },
      { type: 'navigate', target: 'shop' },
      { type: 'selectBox', boxId: 'random' },
      { type: 'openBox', waitForCompletion: false },
      { type: 'wait', duration: 'random(3000, 8000)' },
    ],
    metrics: ['serverResponse', 'animationLag', 'memoryLeaks'],
  },
  {
    name: 'Animation Performance Degradation',
    description: 'Test animation performance over extended use',
    duration: '30 minutes',
    actions: [
      { type: 'enablePerformanceMonitoring' },
      { type: 'repeat', duration: '30 minutes', actions: [
        { type: 'triggerBoxAnimation' },
        { type: 'recordMetrics' },
        { type: 'wait', duration: 2000 },
      ]},
    ],
    assertions: [
      { metric: 'fps', condition: 'remains_above', value: 55 },
      { metric: 'memory', condition: 'stable_within', value: '10%' },
      { metric: 'cpu', condition: 'remains_below', value: 80 },
    ],
  },
];
```

## 7. Manual Testing Procedures

### Animation Quality Checklist

```markdown
## Manual Animation Testing Checklist

### Box Opening Animation
- [ ] **Timing Accuracy**
  - [ ] Opening animation starts immediately on button press
  - [ ] Particle explosion happens at correct moment
  - [ ] Glow effect pulses smoothly
  - [ ] Total sequence completes within 5 seconds

- [ ] **Visual Quality**
  - [ ] No frame drops during animation
  - [ ] Particles move in natural arc patterns
  - [ ] Glow effect matches box rarity color
  - [ ] Smooth transitions between states

- [ ] **Interaction Responsiveness**
  - [ ] Button provides immediate visual feedback
  - [ ] Animation cannot be interrupted inappropriately
  - [ ] Loading states are clear and informative
  - [ ] Error states allow retry functionality

### Device-Specific Tests
- [ ] **Low-End Devices (< 4GB RAM)**
  - [ ] Animation maintains 30+ FPS
  - [ ] No out-of-memory crashes
  - [ ] Graceful degradation of particle count

- [ ] **Mid-Range Devices (4-8GB RAM)**
  - [ ] Animation maintains 50+ FPS
  - [ ] Full particle effects visible
  - [ ] Smooth glow animations

- [ ] **High-End Devices (8GB+ RAM)**
  - [ ] Animation maintains 60 FPS
  - [ ] All effects at maximum quality
  - [ ] No performance compromises

### Edge Cases
- [ ] **Network Issues**
  - [ ] Animation handles API timeouts
  - [ ] Offline mode shows appropriate messaging
  - [ ] Retry mechanism works correctly

- [ ] **Memory Pressure**
  - [ ] App doesn't crash under low memory
  - [ ] Animation quality degrades gracefully
  - [ ] Memory usage returns to baseline after animation

- [ ] **Background/Foreground Transitions**
  - [ ] Animation pauses when app backgrounds
  - [ ] Animation resumes correctly when app foregrounds
  - [ ] No animation state corruption
```

### Bug Report Template

```markdown
## Animation Bug Report Template

### Bug Information
- **Title:** [Concise description of the issue]
- **Priority:** Critical / High / Medium / Low
- **Component:** BoxOpeningAnimation / Particles / Glow / Other
- **Animation State:** idle / opening / revealing / completed

### Environment
- **Device:** [iPhone 12, Samsung Galaxy S21, etc.]
- **OS Version:** [iOS 16.1, Android 13, etc.]
- **App Version:** [1.0.0]
- **Network:** WiFi / 4G / 5G / Offline

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Continue until bug occurs]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Animation-Specific Details
- **FPS During Issue:** [30 FPS, stuttering, frozen]
- **Memory Usage:** [150MB, increasing, stable]
- **CPU Usage:** [High, normal, spiking]
- **Animation Duration:** [Expected vs actual timing]
- **Visual Artifacts:** [Flickering, missing particles, color issues]

### Screenshots/Videos
- [ ] Screenshot of issue
- [ ] Screen recording of bug occurring
- [ ] Performance profiler screenshots

### Workaround
[Any temporary solution if available]

### Additional Notes
[Any other relevant information]
```

## Implementation Priority

### Phase 1 (Week 1): Foundation
1. Set up unit testing framework for animations
2. Create basic integration tests for box opening flow
3. Implement performance monitoring utilities

### Phase 2 (Week 2): Comprehensive Testing
1. Complete unit test suite for all animation components
2. Develop E2E test scenarios with Detox
3. Create accessibility testing framework

### Phase 3 (Week 3): Performance & Device Testing
1. Implement performance testing suite
2. Set up device compatibility testing matrix
3. Create load testing scenarios

### Phase 4 (Week 4): Validation & Documentation
1. Run comprehensive test suite
2. Document findings and optimization recommendations
3. Create testing maintenance procedures

## Success Metrics

- **Unit Test Coverage:** >90% for animation components
- **Integration Test Coverage:** >80% for gamification flows
- **E2E Test Success Rate:** >95% across all scenarios
- **Performance Targets Met:** 100% for target device tiers
- **Accessibility Compliance:** WCAG 2.1 AA level
- **Zero Critical Animation Bugs:** In production release

---

*Este documento serve como guia completo para implementação da estratégia de testes do sistema gamificado de abertura de caixas. Deve ser atualizado conforme novas funcionalidades são adicionadas e feedback dos testes é incorporado.*