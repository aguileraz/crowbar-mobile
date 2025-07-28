import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { scaleAnimation, feedbackAnimations } from '../utils/animations';

/**
 * Botão animado com micro-interações
 */

interface AnimatedButtonProps extends ButtonProps {
  animationType?: 'scale' | 'pulse' | 'bounce' | 'none';
  feedbackType?: 'success' | 'error' | 'none';
  triggerFeedback?: boolean;
  onAnimationComplete?: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  animationType = 'scale',
  feedbackType = 'none',
  triggerFeedback = false,
  onAnimationComplete,
  onPress,
  style,
  labelStyle,
  children,
  ...buttonProps
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const feedbackValue = useRef(new Animated.Value(1)).current;
  const shakeValue = useRef(new Animated.Value(0)).current;

  // Trigger feedback animation
  useEffect(() => {
    if (triggerFeedback && feedbackType !== 'none') {
      let animation: Animated.CompositeAnimation;
      
      switch (feedbackType) {
        case 'success':
          animation = feedbackAnimations.success(feedbackValue);
          break;
        case 'error':
          animation = feedbackAnimations.error(shakeValue);
          break;
        default:
          return;
      }
      
      animation.start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [triggerFeedback, feedbackType, feedbackValue, shakeValue, onAnimationComplete]);

  /**
   * Handle press in
   */
  const handlePressIn = () => {
    if (animationType === 'none') return;
    
    let animation: Animated.CompositeAnimation;
    
    switch (animationType) {
      case 'scale':
        animation = Animated.timing(scaleValue, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        });
        break;
      case 'pulse':
        animation = scaleAnimation.pulse(scaleValue, 1.05);
        break;
      case 'bounce':
        animation = scaleAnimation.bounce(scaleValue);
        break;
      default:
        return;
    }
    
    animation.start();
  };

  /**
   * Handle press out
   */
  const handlePressOut = () => {
    if (animationType === 'none') return;
    
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle press
   */
  const handlePress = (event: any) => {
    if (onPress) {
      onPress(event);
    }
  };

  /**
   * Get animated style
   */
  const getAnimatedStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      transform: [{ scale: scaleValue }],
    };

    if (feedbackType === 'success') {
      baseStyle.transform!.push({ scale: feedbackValue });
    }

    if (feedbackType === 'error') {
      baseStyle.transform!.push({ translateX: shakeValue });
    }

    return baseStyle;
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={buttonProps.disabled}
    >
      <Animated.View style={[getAnimatedStyle(), style]}>
        <Button
          {...buttonProps}
          onPress={undefined} // Remove onPress to prevent double handling
          labelStyle={labelStyle}
        >
          {children}
        </Button>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default AnimatedButton;
