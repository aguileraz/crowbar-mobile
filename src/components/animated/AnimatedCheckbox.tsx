/* eslint-disable react-native/no-unused-styles */
/**
 * Checkbox animado com micro-interações
 */

import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { checkboxAnimation } from '../../animations/microInteractions';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  haptic?: boolean;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onToggle,
  label,
  size = 'medium',
  color = '#2196F3',
  style,
  labelStyle,
  disabled = false,
  haptic = true,
}) => {
  const scale = useSharedValue(checked ? 1 : 0);
  const rotation = useSharedValue(checked ? 1 : 0);
  const borderScale = useSharedValue(1);

  useEffect(() => {
    checkboxAnimation(scale, rotation, checked, { haptic });
  }, [checked, haptic]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onToggle(!checked);
    }
  }, [checked, disabled, onToggle]);

  const handlePressIn = useCallback(() => {
    'worklet';
    borderScale.value = withSpring(0.9);
  }, []);

  const handlePressOut = useCallback(() => {
    'worklet';
    borderScale.value = withSpring(1);
  }, []);

  const getSize = () => {
    switch (_size) {
      case 'small':
        return 18;
      case 'large':
        return 26;
      default:
        return 22;
    }
  };

  const boxSize = getSize();
  const iconSize = boxSize * 0.7;

  const boxAnimatedStyle = useAnimatedStyle(() => {
    const _backgroundColor = interpolate(
      scale.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: borderScale.value }],
      backgroundColor: checked ? color : 'transparent',
      borderColor: checked ? color : '#999999',
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    const rotationDeg = interpolate(
      rotation.value,
      [0, 1],
      [180, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotationDeg}deg` },
      ],
      opacity: scale.value,
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: boxSize * 0.2,
          },
          disabled && styles.disabled,
          boxAnimatedStyle,
        ]}
      >
        <Animated.View style={checkAnimatedStyle}>
          <MaterialCommunityIcons
            name="check"
            size={iconSize}
            color="#FFFFFF"
          />
        </Animated.View>
      </Animated.View>
      {label && (
        <Text
          style={[
            styles.label,
            styles[`${size}Label`],
            disabled && styles.disabledText,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 8,
    color: '#333333',
  },
  smallLabel: {
    fontSize: 14,
  },
  mediumLabel: {
    fontSize: 16,
  },
  largeLabel: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999999',
  },
});

export default AnimatedCheckbox;