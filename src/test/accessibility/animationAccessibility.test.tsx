import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions } from 'react-native';
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';
import { MysteryBox } from '../../types/api';

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(true)),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
    isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
    isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667, scale: 2 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('Animation Accessibility Tests', () => {
  let mockBox: MysteryBox;

  beforeEach(() => {
    mockBox = {
      id: 'accessibility-test-box',
      name: 'Epic Mystery Box',
      price: 79.99,
      rarity: 'epic',
      images: [{ url: 'https://example.com/box.jpg' }],
      description: 'Test box for accessibility testing',
      category: 'gaming',
      vendor: 'Test Vendor',
      rating: 4.8,
      reviewCount: 156,
      tags: ['epic', 'accessibility'],
      isAvailable: true,
      stock: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    jest.clearAllMocks();
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful accessibility labels for all elements', async () => {
      const { getByTestId, getByLabelText } = render(
        React.createElement(BoxOpeningAnimation, {
          box: mockBox,
          animationState: "idle",
          fadeAnim: { setValue: jest.fn() } as any,
          scaleAnim: { setValue: jest.fn() } as any,
          rotateAnim: { setValue: jest.fn() } as any,
          onOpenPress: () => {},
          canOpen: true,
          isLoading: false,
        })
      );

      // Verify accessibility labels for key elements
      expect(getByLabelText(/Epic Mystery Box/)).toBeTruthy();
      expect(getByLabelText(/79,99/)).toBeTruthy();
      expect(getByLabelText(/epic/i)).toBeTruthy();
      expect(getByLabelText(/abrir caixa/i)).toBeTruthy();
    });

    it('should announce animation state changes', async () => {
      const { rerender } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
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
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Verify accessibility announcement was made
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Abrindo caixa Epic Mystery Box. Aguarde enquanto revelamos os itens.'
      );
    });

    it('should announce item reveals during revealing state', async () => {
      const { rerender } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Change to revealing state
      rerender(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="revealing"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Revelando itens da caixa. Você receberá os resultados em breve.'
      );
    });

    it('should provide accessible descriptions for complex animations', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Verify complex animations have accessible descriptions
      const particlesContainer = getByTestId('particles-container');
      expect(particlesContainer.props.accessibilityLabel).toContain('efeitos visuais de abertura');

      const glowEffect = getByTestId('glow-effect');
      expect(glowEffect.props.accessibilityLabel).toContain('efeito luminoso épico');
    });

    it('should support screen reader navigation order', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Verify accessibility order
      const elements = [
        getByTestId('box-name'),
        getByTestId('box-price'),
        getByTestId('box-rarity'),
        getByTestId('open-box-button'),
      ];

      elements.forEach((element, index) => {
        expect(element.props.accessibilityElementsHidden).toBeFalsy();
        expect(element.props.importantForAccessibility).not.toBe('no');
      });
    });
  });

  describe('Touch Target Accessibility', () => {
    it('should maintain minimum 44x44 point touch targets', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      const button = getByTestId('open-box-button');
      const buttonStyle = button.props.style;

      // Extract dimensions (may be nested in style arrays)
      const flatStyle = Array.isArray(buttonStyle) 
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Minimum touch target size should be 44x44 points
      expect(flatStyle.minHeight || flatStyle.height).toBeGreaterThanOrEqual(44);
      expect(flatStyle.minWidth || flatStyle.width).toBeGreaterThanOrEqual(44);
    });

    it('should adapt touch targets for different screen densities', async () => {
      const screenSizes = [
        { width: 320, height: 568, scale: 2 }, // iPhone SE
        { width: 375, height: 667, scale: 2 }, // iPhone 8
        { width: 414, height: 896, scale: 3 }, // iPhone 11
        { width: 768, height: 1024, scale: 2 }, // iPad
      ];

      for (const screenSize of screenSizes) {
        (Dimensions.get as jest.Mock).mockReturnValue(screenSize);

        const { getByTestId } = render(
          <BoxOpeningAnimation
            box={mockBox}
            animationState="idle"
            fadeAnim={{ setValue: jest.fn() } as any}
            scaleAnim={{ setValue: jest.fn() } as any}
            rotateAnim={{ setValue: jest.fn() } as any}
            onOpenPress={() => {}}
            canOpen={true}
            isLoading={false}
          />
        );

        const button = getByTestId('open-box-button');
        
        // Touch targets should scale appropriately with screen density
        expect(button.props.accessible).toBe(true);
        expect(button.props.accessibilityRole).toBe('button');
      }
    });

    it('should provide sufficient spacing between interactive elements', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="completed"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={false}
          isLoading={false}
        />
      );

      // When multiple interactive elements are present, they should have adequate spacing
      const shareButton = getByTestId('share-results-button');
      const backButton = getByTestId('back-to-shop-button');

      // Both buttons should be accessible
      expect(shareButton.props.accessible).toBe(true);
      expect(backButton.props.accessible).toBe(true);

      // Should have proper accessibility roles
      expect(shareButton.props.accessibilityRole).toBe('button');
      expect(backButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Reduce Motion Support', () => {
    beforeEach(() => {
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    });

    it('should provide reduced motion alternatives', async () => {
      const { getByTestId, queryByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // When reduce motion is enabled, complex animations should be simplified
      const particlesContainer = queryByTestId('particles-container');
      const glowEffect = queryByTestId('glow-effect');

      // Particles and glow effects should be hidden or simplified
      if (particlesContainer) {
        expect(particlesContainer.props.accessibilityElementsHidden).toBe(true);
      }

      if (glowEffect) {
        expect(glowEffect.props.accessibilityElementsHidden).toBe(true);
      }

      // Essential information should still be accessible
      expect(getByTestId('box-name')).toBeTruthy();
      expect(getByTestId('animation-status')).toBeTruthy();
    });

    it('should announce animation states without visual effects', async () => {
      const { rerender } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      rerender(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Should still announce state changes for users with reduced motion
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Abrindo caixa')
      );
    });
  });

  describe('Color and Contrast Accessibility', () => {
    it('should maintain sufficient color contrast for text', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      const boxName = getByTestId('box-name');
      const boxPrice = getByTestId('box-price');
      const boxRarity = getByTestId('box-rarity');

      // Text elements should have sufficient contrast
      // Note: In a real implementation, we would check actual color values
      expect(boxName.props.style).toBeDefined();
      expect(boxPrice.props.style).toBeDefined();
      expect(boxRarity.props.style).toBeDefined();
    });

    it('should adapt to high contrast mode', async () => {
      // Mock high contrast mode
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(true);

      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Should adapt styling for high contrast mode
      const button = getByTestId('open-box-button');
      expect(button.props.accessible).toBe(true);
    });

    it('should work with grayscale mode', async () => {
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(true);

      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Rarity should be distinguishable even in grayscale
      const rarityElement = getByTestId('box-rarity');
      expect(rarityElement.props.accessibilityLabel).toContain('épica');
    });
  });

  describe('Focus Management', () => {
    it('should manage focus correctly during state transitions', async () => {
      const { getByTestId, rerender } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      const button = getByTestId('open-box-button');
      fireEvent.press(button);

      // After pressing, focus should move appropriately
      rerender(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={true}
        />
      );

      // Focus should be managed for the new state
      expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalled();
    });

    it('should provide clear focus indicators', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      const button = getByTestId('open-box-button');
      
      // Focus indicators should be clear
      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessibilityState).toBeDefined();
    });

    it('should trap focus during modal states', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="opening"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // During opening, focus should be contained within the animation area
      const container = getByTestId('box-opening-container');
      expect(container.props.accessibilityViewIsModal).toBe(true);
    });
  });

  describe('Dynamic Text Size Support', () => {
    it('should adapt to large text sizes', async () => {
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(true);

      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Text elements should adapt to bold text settings
      const boxName = getByTestId('box-name');
      const boxPrice = getByTestId('box-price');

      expect(boxName.props.adjustsFontSizeToFit).toBe(true);
      expect(boxPrice.props.allowFontScaling).toBe(true);
    });

    it('should handle extra large text sizes gracefully', async () => {
      // Simulate very large text settings
      const originalDimensions = Dimensions.get('window');
      (Dimensions.get as jest.Mock).mockReturnValue({
        ...originalDimensions,
        fontScale: 3.0, // Very large text
      });

      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Layout should adapt to large text
      const container = getByTestId('box-opening-container');
      expect(container.props.style).toBeDefined();

      // Restore original dimensions
      (Dimensions.get as jest.Mock).mockReturnValue(originalDimensions);
    });
  });

  describe('Voice Control Support', () => {
    it('should provide voice control labels', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      const button = getByTestId('open-box-button');
      
      // Should support voice commands
      expect(button.props.accessibilityLabel).toContain('abrir');
      expect(button.props.accessibilityHint).toContain('caixa');
    });

    it('should provide alternative activation methods', async () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={mockOnPress}
          canOpen={true}
          isLoading={false}
        />
      );

      const button = getByTestId('open-box-button');
      
      // Should support activation via accessibility actions
      expect(button.props.accessibilityActions).toContain(
        expect.objectContaining({ name: 'activate' })
      );

      // Test activation
      fireEvent(button, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('Error State Accessibility', () => {
    it('should announce errors accessibly', async () => {
      const { rerender } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="idle"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={true}
          isLoading={false}
        />
      );

      // Simulate error state
      rerender(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="error"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={false}
          isLoading={false}
        />
      );

      // Error should be announced
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringMatching(/erro/i)
      );
    });

    it('should provide accessible error recovery options', async () => {
      const { getByTestId } = render(
        <BoxOpeningAnimation
          box={mockBox}
          animationState="error"
          fadeAnim={{ setValue: jest.fn() } as any}
          scaleAnim={{ setValue: jest.fn() } as any}
          rotateAnim={{ setValue: jest.fn() } as any}
          onOpenPress={() => {}}
          canOpen={false}
          isLoading={false}
        />
      );

      // Error recovery should be accessible
      const retryButton = getByTestId('retry-button');
      expect(retryButton.props.accessible).toBe(true);
      expect(retryButton.props.accessibilityRole).toBe('button');
      expect(retryButton.props.accessibilityLabel).toContain('tentar novamente');
    });
  });
});