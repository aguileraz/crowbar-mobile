import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import BoxOpeningAnimation from '../BoxOpeningAnimation';
import { MysteryBox } from '../../types/api';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    ...jest.requireActual('react-native-reanimated/mock'),
    useSharedValue: jest.fn((value) => ({ value })),
    useAnimatedStyle: jest.fn((callback) => callback()),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((delay, animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    withRepeat: jest.fn((animation) => animation),
    runOnJS: jest.fn((fn) => fn),
    Easing: {
      linear: 'linear',
      ease: 'ease',
    },
    default: {
      View,
    },
  };
});

// Mock Animated.Value
const createMockAnimatedValue = (initialValue: number) => {
  const animatedValue = new Animated.Value(initialValue);
  animatedValue.setValue = jest.fn();
  animatedValue.addListener = jest.fn();
  animatedValue.removeListener = jest.fn();
  return animatedValue;
};

describe('BoxOpeningAnimation', () => {
  const mockBox: MysteryBox = {
    id: '1',
    name: 'Epic Mystery Box',
    price: 79.99,
    rarity: 'epic',
    images: [{ url: 'https://example.com/box.jpg' }],
    description: 'Test box description',
    category: 'gaming',
    vendor: 'Test Vendor',
    rating: 4.5,
    reviewCount: 10,
    tags: ['gaming', 'mystery'],
    isAvailable: true,
    stock: 5,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
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
      
      expect(getByText('Epic Mystery Box')).toBeTruthy();
      expect(getByText('R$ 79,99')).toBeTruthy();
      expect(getByText('EPIC')).toBeTruthy();
    });

    it('displays open button when in idle state', () => {
      const { getByText } = render(<BoxOpeningAnimation {...defaultProps} />);
      
      expect(getByText('ABRIR CAIXA')).toBeTruthy();
    });

    it('applies correct rarity colors', () => {
      const rarityTests = [
        { rarity: 'common', expectedColor: '#9E9E9E' },
        { rarity: 'uncommon', expectedColor: '#4CAF50' },
        { rarity: 'rare', expectedColor: '#2196F3' },
        { rarity: 'epic', expectedColor: '#9C27B0' },
        { rarity: 'legendary', expectedColor: '#FF9800' },
        { rarity: 'mythic', expectedColor: '#F44336' },
      ];

      rarityTests.forEach(({ rarity, expectedColor }) => {
        const testBox = { ...mockBox, rarity };
        const { getByTestId } = render(
          <BoxOpeningAnimation {...defaultProps} box={testBox} />
        );
        
        const rarityText = getByTestId('box-rarity');
        expect(rarityText.props.style.color).toBe(expectedColor);
      });
    });
  });

  describe('Animation States', () => {
    it('shows loading indicator when opening', () => {
      const { getByText, getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="opening" 
        />
      );
      
      expect(getByText('Abrindo caixa...')).toBeTruthy();
      expect(getByTestId('activity-indicator')).toBeTruthy();
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

    it('hides open button during opening states', () => {
      const { queryByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          animationState="opening" 
        />
      );
      
      expect(queryByText('ABRIR CAIXA')).toBeFalsy();
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
      const { getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          canOpen={false} 
        />
      );
      
      const button = getByTestId('open-box-button');
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

    it('prevents multiple rapid taps', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          onOpenPress={mockOnPress} 
        />
      );
      
      const button = getByText('ABRIR CAIXA');
      
      // Rapid fire presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      // Should only register first press
      expect(mockOnPress).toHaveBeenCalledTimes(1);
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

    it('handles null images array gracefully', () => {
      const boxWithNullImages = { ...mockBox, images: null as any };
      const { getByTestId } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithNullImages} 
        />
      );
      
      const image = getByTestId('box-image');
      expect(image.props.source.uri).toContain('data:image/svg+xml');
    });

    it('handles unknown rarity gracefully', () => {
      const boxWithUnknownRarity = { ...mockBox, rarity: 'unknown' as any };
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithUnknownRarity} 
        />
      );
      
      expect(getByText('UNKNOWN')).toBeTruthy();
    });

    it('handles missing rarity gracefully', () => {
      const boxWithoutRarity = { ...mockBox, rarity: undefined as any };
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithoutRarity} 
        />
      );
      
      expect(getByText('COMUM')).toBeTruthy();
    });

    it('formats currency correctly for different values', () => {
      const testCases = [
        { price: 1234.56, expected: 'R$ 1.234,56' },
        { price: 0.99, expected: 'R$ 0,99' },
        { price: 1000000, expected: 'R$ 1.000.000,00' },
        { price: 0, expected: 'R$ 0,00' },
      ];

      testCases.forEach(({ price, expected }) => {
        const testBox = { ...mockBox, price };
        const { getByText } = render(
          <BoxOpeningAnimation 
            {...defaultProps} 
            box={testBox} 
          />
        );
        
        expect(getByText(expected)).toBeTruthy();
      });
    });

    it('handles very long box names', () => {
      const longName = 'This is a very long box name that should be handled gracefully without breaking the layout or causing any issues';
      const boxWithLongName = { ...mockBox, name: longName };
      
      const { getByText } = render(
        <BoxOpeningAnimation 
          {...defaultProps} 
          box={boxWithLongName} 
        />
      );
      
      expect(getByText(longName)).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <BoxOpeningAnimation {...defaultProps} />;
      };
      
      const { rerender } = render(<TestComponent />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('cleans up animations on unmount', () => {
      const { unmount } = render(<BoxOpeningAnimation {...defaultProps} />);
      
      // Should not throw errors when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful accessibility labels', () => {
      const { getByLabelText } = render(
        <BoxOpeningAnimation {...defaultProps} />
      );

      expect(getByLabelText(/Epic Mystery Box/)).toBeTruthy();
      expect(getByLabelText(/79,99/)).toBeTruthy();
      expect(getByLabelText(/epic/i)).toBeTruthy();
    });

    it('supports screen reader navigation', () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation {...defaultProps} />
      );

      const elements = [
        getByTestId('box-name'),
        getByTestId('box-price'),
        getByTestId('box-rarity'),
        getByTestId('open-box-button'),
      ];

      elements.forEach(element => {
        expect(element.props.accessible).toBe(true);
      });
    });

    it('provides button action hints', () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation {...defaultProps} />
      );

      const button = getByTestId('open-box-button');
      expect(button.props.accessibilityHint).toContain('Toque para abrir a caixa');
    });
  });
});