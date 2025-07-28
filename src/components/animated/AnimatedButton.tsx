/**
 * Botão animado com feedback visual e háptico
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { buttonPress } from '../../animations/microInteractions';
import { _SCALE_VALUES } from '../../animations/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  children?: React.ReactNode;
  title?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  _haptic?: boolean;
  ripple?: boolean;
  onPress?: () => void;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  title,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  loading = false,
  _haptic = true,
  ripple = true,
  onPress,
  disabled,
  ...props
}) => {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    'worklet';
    buttonPress(scale, { _haptic, _hapticType: 'light' });
  }, [_haptic]);

  const handlePressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
  }, []);

  const handlePress = useCallback(() => {
    if (ripple) {
      // Ripple effect
      rippleScale.value = 0;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(2, { duration: 400 });
      rippleOpacity.value = withTiming(0, { duration: 400 });
    }
    onPress?.();
  }, [onPress, ripple]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  const loadingStyle = useAnimatedStyle(() => {
    const rotation = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const getButtonStyle = (): ViewStyle => {
    const _baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[variant],
      ...styles[size],
      ...(disabled && styles.disabled),
      ...style,
    };
    return _baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const _baseStyle: TextStyle = {
      ...styles.text,
      ...styles[`${variant}Text`],
      ...styles[`${size}Text`],
      ...textStyle,
    };
    return _baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Animated.View style={loadingStyle}>
          <MaterialCommunityIcons
            name="loading"
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'primary' ? '#FFFFFF' : '#2196F3'}
          />
        </Animated.View>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <MaterialCommunityIcons
            name={icon as any}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'primary' ? '#FFFFFF' : '#2196F3'}
            style={styles.iconLeft}
          />
        )}
        {title && <Text style={getTextStyle()}>{title}</Text>}
        {children}
        {icon && iconPosition === 'right' && (
          <MaterialCommunityIcons
            name={icon as any}
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color={variant === 'primary' ? '#FFFFFF' : '#2196F3'}
            style={styles.iconRight}
          />
        )}
      </>
    );
  };

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, getButtonStyle()]}
    >
      {ripple && (
        <Animated.View
          style={[styles.ripple, rippleStyle]}
          pointerEvents="none"
        />
      )}
      <View style={styles.content}>{renderContent()}</View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  
  // Variants
  primary: {
    backgroundColor: '#2196F3',
  },
  secondary: {
    backgroundColor: '#F5F5F5',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Text variants
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#333333',
  },
  outlineText: {
    color: '#2196F3',
  },
  ghostText: {
    color: '#2196F3',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});

export default AnimatedButton;