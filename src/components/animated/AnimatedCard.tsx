/**
 * Card animado com efeitos de hover e press
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';
import { elementHover, elementUnhover } from '../../animations/microInteractions';
import { SPRING_CONFIGS, SCALE_VALUES } from '../../animations/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  variant?: 'elevated' | 'outlined' | 'filled';
  pressable?: boolean;
  haptic?: boolean;
  scaleOnPress?: boolean;
  elevateOnHover?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  elevation = 2,
  variant = 'elevated',
  pressable = true,
  haptic = true,
  scaleOnPress = true,
  elevateOnHover = true,
  onPress,
  ...props
}) => {
  const scale = useSharedValue(1);
  const shadowScale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    'worklet';
    if (scaleOnPress) {
      scale.value = withSpring(SCALE_VALUES.pressed, SPRING_CONFIGS.stiff);
    }
    if (elevateOnHover) {
      shadowScale.value = withSpring(0.8, SPRING_CONFIGS.smooth);
      translateY.value = withSpring(-2, SPRING_CONFIGS.smooth);
    }
  }, [scaleOnPress, elevateOnHover]);

  const handlePressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, SPRING_CONFIGS.smooth);
    shadowScale.value = withSpring(1, SPRING_CONFIGS.smooth);
    translateY.value = withSpring(0, SPRING_CONFIGS.smooth);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      shadowScale.value,
      [0.8, 1],
      [0.1, 0.2],
      Extrapolate.CLAMP
    );

    const shadowRadius = interpolate(
      shadowScale.value,
      [0.8, 1],
      [elevation * 0.5, elevation],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      shadowOpacity: variant === 'elevated' ? shadowOpacity : 0,
      shadowRadius: variant === 'elevated' ? shadowRadius : 0,
      elevation: variant === 'elevated' ? elevation * shadowScale.value : 0,
    };
  });

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.card,
      ...styles[variant],
      ...style,
    };
    return baseStyle;
  };

  if (!pressable) {
    return (
      <Animated.View style={[animatedStyle, getCardStyle()]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[animatedStyle, getCardStyle()]}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    padding: 16,
  },
  
  // Variants
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filled: {
    backgroundColor: '#F5F5F5',
  },
});

export default AnimatedCard;