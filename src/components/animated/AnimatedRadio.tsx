/**
 * Radio button animado com micro-interações
 */

import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { radioAnimation } from '../../animations/microInteractions';
import { SPRING_CONFIGS } from '../../animations/constants';

interface AnimatedRadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  haptic?: boolean;
}

export const AnimatedRadio: React.FC<AnimatedRadioProps> = ({
  selected,
  onSelect,
  label,
  size = 'medium',
  color = '#2196F3',
  style,
  labelStyle,
  disabled = false,
  haptic = true,
}) => {
  const scale = useSharedValue(selected ? 1 : 0);
  const borderScale = useSharedValue(1);

  useEffect(() => {
    radioAnimation(scale, selected, { haptic });
  }, [selected, haptic]);

  const handlePress = useCallback(() => {
    if (!disabled && !selected) {
      onSelect();
    }
  }, [disabled, selected, onSelect]);

  const handlePressIn = useCallback(() => {
    'worklet';
    borderScale.value = withSpring(0.9, SPRING_CONFIGS.stiff);
  }, []);

  const handlePressOut = useCallback(() => {
    'worklet';
    borderScale.value = withSpring(1, SPRING_CONFIGS.smooth);
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 26;
      default:
        return 22;
    }
  };

  const radioSize = getSize();
  const innerSize = radioSize * 0.5;

  const outerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: borderScale.value }],
      borderColor: selected ? color : '#999999',
    };
  });

  const innerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: color,
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
          styles.outer,
          {
            width: radioSize,
            height: radioSize,
            borderRadius: radioSize / 2,
          },
          disabled && styles.disabled,
          outerAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
            innerAnimatedStyle,
          ]}
        />
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

interface AnimatedRadioGroupProps {
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
  radioProps?: Partial<AnimatedRadioProps>;
}

export const AnimatedRadioGroup: React.FC<AnimatedRadioGroupProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
  radioProps = {},
}) => {
  return (
    <View style={[styles.group, style]}>
      {options.map((option) => (
        <AnimatedRadio
          key={option.value}
          selected={selectedValue === option.value}
          onSelect={() => onValueChange(option.value)}
          label={option.label}
          {...radioProps}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  group: {
    marginVertical: 8,
  },
  outer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    // Background color is set dynamically
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

export default AnimatedRadio;