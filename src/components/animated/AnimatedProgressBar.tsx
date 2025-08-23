/**
 * Barra de progresso animada
 */

import React, {} from 'react';
import {
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
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { progressAnimation } from '../../animations/feedbackAnimations';
import { SPRING_CONFIGS, DURATIONS } from '../../animations/constants';

interface AnimatedProgressBarProps {
  progress: number; // 0 a 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'none';
  labelStyle?: TextStyle;
  style?: ViewStyle;
  animated?: boolean;
  _animationDuration?: number;
  variant?: 'linear' | 'striped' | 'gradient';
  haptic?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 8,
  color = '#2196F3',
  backgroundColor = '#E0E0E0',
  showLabel = false,
  labelPosition = 'outside',
  labelStyle,
  style,
  animated = true,
  _animationDuration = DURATIONS.normal,
  variant = 'linear',
  haptic = true,
}) => {
  const progressValue = useSharedValue(0);
  const stripeOffset = useSharedValue(0);

  useEffect(() => {
    const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;
    
    if (animated) {
      progressAnimation(progressValue, normalizedProgress, { haptic });
    } else {
      progressValue.value = normalizedProgress;
    }

    // Animate stripes if variant is striped
    if (variant === 'striped') {
      stripeOffset.value = withRepeat(
        withTiming(20, { duration: 1000 }),
        -1,
        false
      );
    }
  }, [progress, animated, variant, haptic, progressValue, stripeOffset]);

  const progressAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progressValue.value,
      [0, 1],
      [0, 100],
      Extrapolate.CLAMP
    );

    return {
      width: `${width}%`,
    };
  });

  const stripesAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: stripeOffset.value }],
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progressValue.value,
      [0, 0.9, 1],
      [10, 0, -30],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  const renderLabel = () => {
    if (!showLabel || labelPosition === 'none') return null;

    const label = `${Math.round(progress)}%`;

    if (labelPosition === 'inside') {
      return (
        <Animated.Text
          style={[
            styles.labelInside,
            { fontSize: height * 0.7 },
            labelAnimatedStyle,
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      );
    }

    return (
      <Text style={[styles.labelOutside, labelStyle]}>
        {label}
      </Text>
    );
  };

  const renderProgress = () => {
    switch (variant) {
      case 'striped':
        return (
          <Animated.View style={[styles.progress, progressAnimatedStyle]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: color, height },
              ]}
            >
              <Animated.View
                style={[
                  styles.stripes,
                  { height },
                  stripesAnimatedStyle,
                ]}
              />
            </View>
            {labelPosition === 'inside' && renderLabel()}
          </Animated.View>
        );

      case 'gradient':
        return (
          <Animated.View
            style={[
              styles.progress,
              styles.progressGradient,
              { backgroundColor: color },
              progressAnimatedStyle,
            ]}
          >
            {labelPosition === 'inside' && renderLabel()}
          </Animated.View>
        );

      default:
        return (
          <Animated.View
            style={[
              styles.progress,
              { backgroundColor: color },
              progressAnimatedStyle,
            ]}
          >
            {labelPosition === 'inside' && renderLabel()}
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {labelPosition === 'outside' && renderLabel()}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        {renderProgress()}
      </View>
    </View>
  );
};

interface CircularProgressProps {
  progress: number; // 0 a 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelStyle?: TextStyle;
  animated?: boolean;
}

export const AnimatedCircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  _color = '#2196F3',
  backgroundColor = '#E0E0E0',
  showLabel = true,
  labelStyle,
  animated = true,
}) => {
  const progressValue = useSharedValue(0);
  const radius = (_size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;
    
    if (animated) {
      progressValue.value = withSpring(normalizedProgress, SPRING_CONFIGS.smooth);
    } else {
      progressValue.value = normalizedProgress;
    }
  }, [progress, animated, progressValue]);

  const _animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = interpolate(
      progressValue.value,
      [0, 1],
      [circumference, 0],
      Extrapolate.CLAMP
    );

    return {
      strokeDashoffset,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progressValue.value,
      [0, 0.5, 1],
      [0.8, 1.1, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* TODO: Add react-native-svg dependency to enable circular progress
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedStyle}
          strokeLinecap="round"
          transform={`rotate(-90 ${_size / 2} ${size / 2})`}
        />
      </Svg>
      */}
      {/* Temporary fallback: Show text-only progress */}
      <View style={[StyleSheet.absoluteFillObject, styles.circularFallback]}>
        <View style={[styles.circularBackground, { backgroundColor }]} />
      </View>
      {showLabel && (
        <Animated.Text
          style={[
            styles.circularLabel,
            labelStyle,
            labelAnimatedStyle,
          ]}
        >
          {Math.round(progress)}%
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  track: {
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  progress: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    overflow: 'hidden',
  },
  progressGradient: {
    // Gradient será aplicado via props
  },
  stripes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    backgroundColor: 'transparent',
    // Criar padrão de listras com background-image seria ideal
    // mas React Native não suporta, então usamos uma alternativa
  },
  labelInside: {
    position: 'absolute',
    color: '#FFFFFF',
    fontWeight: 'bold',
    alignSelf: 'center',
    top: '50%',
    marginTop: -8,
  },
  labelOutside: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '600',
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularLabel: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  circularFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    opacity: 0.2,
  },
});

export default AnimatedProgressBar;