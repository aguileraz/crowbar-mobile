import React, { useRef, useEffect } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import {
  fadeAnimation,
  slideAnimation,
  scaleAnimation,
  combinedAnimations,
  ANIMATION_CONFIGS,
} from '../utils/animations';

/**
 * Componente de transição de tela com diferentes tipos de animação
 */

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'slideScale' | 'none';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
  direction = 'right',
  duration = ANIMATION_CONFIGS.NORMAL,
  delay = 0,
  style,
  onAnimationComplete,
}) => {
  const fadeValue = useRef(new Animated.Value(type === 'none' ? 1 : 0)).current;
  const slideValue = useRef(new Animated.Value(type === 'none' ? 0 : 1)).current;
  const scaleValue = useRef(new Animated.Value(type === 'none' ? 1 : 0.8)).current;

  useEffect(() => {
    if (type === 'none') {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return;
    }

    let animation: Animated.CompositeAnimation;

    switch (type) {
      case 'fade':
        animation = fadeAnimation.fadeIn(fadeValue, duration);
        break;
      case 'slide':
        animation = getSlideAnimation();
        break;
      case 'scale':
        animation = scaleAnimation.scaleIn(scaleValue, duration);
        break;
      case 'slideScale':
        animation = combinedAnimations.slideInFade(slideValue, fadeValue, duration);
        break;
      default:
        animation = fadeAnimation.fadeIn(fadeValue, duration);
    }

    const delayedAnimation = delay > 0 
      ? Animated.sequence([
          Animated.delay(delay),
          animation,
        ])
      : animation;

    delayedAnimation.start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [type, direction, duration, delay, fadeValue, slideValue, scaleValue, onAnimationComplete]);

  /**
   * Get slide animation based on direction
   */
  const getSlideAnimation = (): Animated.CompositeAnimation => {
    switch (direction) {
      case 'left':
        return slideAnimation.slideInFromLeft(slideValue, duration);
      case 'right':
        return slideAnimation.slideInFromRight(slideValue, duration);
      case 'up':
      case 'down':
        return slideAnimation.slideInFromBottom(slideValue, duration);
      default:
        return slideAnimation.slideInFromRight(slideValue, duration);
    }
  };

  /**
   * Get animated style based on type
   */
  const getAnimatedStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    switch (type) {
      case 'fade':
        return {
          opacity: fadeValue,
        };
      case 'slide':
        return getSlideStyle();
      case 'scale':
        return {
          transform: [{ scale: scaleValue }],
        };
      case 'slideScale':
        return {
          opacity: fadeValue,
          ...getSlideStyle(),
        };
      case 'none':
        return {};
      default:
        return {
          opacity: fadeValue,
        };
    }
  };

  /**
   * Get slide style based on direction
   */
  const getSlideStyle = (): ViewStyle => {
    let translateX = 0;
    let translateY = 0;

    switch (direction) {
      case 'left':
        translateX = slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -screenWidth],
        });
        break;
      case 'right':
        translateX = slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenWidth],
        });
        break;
      case 'up':
        translateY = slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -screenHeight],
        });
        break;
      case 'down':
        translateY = slideValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenHeight],
        });
        break;
    }

    return {
      transform: [
        { translateX },
        { translateY },
      ],
    };
  };

  if (type === 'none') {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <Animated.View style={[styles.container, getAnimatedStyle(), style]}>
      {children}
    </Animated.View>
  );
};

/**
 * Componente de lista animada com entrada escalonada
 */
interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide';
  style?: ViewStyle;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade',
  style,
}) => {
  const animatedValues = useRef(
    children.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((value, index) => {
      const delay = index * staggerDelay;
      
      return Animated.timing(value, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.NORMAL,
        delay,
        easing: ANIMATION_CONFIGS.EASE_OUT,
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
  }, [animatedValues, staggerDelay]);

  /**
   * Get item style
   */
  const getItemStyle = (index: number): ViewStyle => {
    const animatedValue = animatedValues[index];
    
    if (animationType === 'slide') {
      return {
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      };
    }
    
    return {
      opacity: animatedValue,
    };
  };

  return (
    <View style={[styles.listContainer, style]}>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={getItemStyle(index)}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
};

/**
 * Componente de modal animado
 */
interface AnimatedModalProps {
  visible: boolean;
  children: React.ReactNode;
  onDismiss?: () => void;
  animationType?: 'fade' | 'slide' | 'scale';
  style?: ViewStyle;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  children,
  onDismiss,
  animationType = 'scale',
  style,
}) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const slideValue = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      let animation: Animated.CompositeAnimation;
      
      switch (animationType) {
        case 'fade':
          animation = fadeAnimation.fadeIn(fadeValue);
          break;
        case 'scale':
          animation = combinedAnimations.fadeInScale(fadeValue, scaleValue);
          break;
        case 'slide':
          animation = combinedAnimations.slideInFade(slideValue, fadeValue);
          break;
        default:
          animation = fadeAnimation.fadeIn(fadeValue);
      }
      
      animation.start();
    } else {
      // Hide animation
      let animation: Animated.CompositeAnimation;
      
      switch (animationType) {
        case 'fade':
          animation = fadeAnimation.fadeOut(fadeValue);
          break;
        case 'scale':
          animation = combinedAnimations.fadeOutScale(fadeValue, scaleValue);
          break;
        case 'slide':
          animation = Animated.parallel([
            fadeAnimation.fadeOut(fadeValue),
            Animated.timing(slideValue, {
              toValue: screenHeight,
              duration: ANIMATION_CONFIGS.NORMAL,
              useNativeDriver: true,
            }),
          ]);
          break;
        default:
          animation = fadeAnimation.fadeOut(fadeValue);
      }
      
      animation.start();
    }
  }, [visible, animationType, fadeValue, scaleValue, slideValue]);

  /**
   * Get modal style
   */
  const getModalStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      opacity: fadeValue,
    };

    switch (animationType) {
      case 'scale':
        baseStyle.transform = [{ scale: scaleValue }];
        break;
      case 'slide':
        baseStyle.transform = [{ translateY: slideValue }];
        break;
    }

    return baseStyle;
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalContent, getModalStyle(), style]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
});

export default ScreenTransition;
