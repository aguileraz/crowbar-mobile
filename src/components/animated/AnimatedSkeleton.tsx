/**
 * Componente de skeleton loading animado
 */

import React, {} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  shimmerAnimation,
  pulseAnimation,
  SKELETON_COLORS,
  SKELETON_CONFIGS,
  skeletonPresets,
} from '../../animations/skeletonAnimations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
  speed?: 'slow' | 'normal' | 'fast';
}

export const AnimatedSkeleton: React.FC<AnimatedSkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
  variant = 'shimmer',
  colorScheme = 'light',
  speed = 'normal',
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return 2000;
      case 'fast':
        return 800;
      default:
        return 1200;
    }
  };

  useEffect(() => {
    if (variant === 'shimmer') {
      shimmerAnimation(progress, { duration: getDuration() });
    } else {
      pulseAnimation(opacity, { duration: getDuration() });
    }
  }, [variant, speed]);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === 'pulse') {
      return {
        opacity: opacity.value,
      };
    }
    return {};
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  const colors = colorScheme === 'light' ? SKELETON_COLORS.light : SKELETON_COLORS.dark;
  const baseColor = colors.base;
  const highlightColor = colors.highlight;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
        animatedStyle,
      ]}
    >
      {variant === 'shimmer' && (
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={[baseColor, highlightColor, baseColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Componentes pré-configurados

interface SkeletonTextProps {
  lines?: number;
  width?: string;
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 1,
  width = '100%',
  style,
  variant = 'shimmer',
  colorScheme = 'light',
}) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, _index) => (
        <AnimatedSkeleton
          key={0}
          width={index === lines - 1 ? '80%' : width}
          height={SKELETON_CONFIGS.text.height}
          borderRadius={SKELETON_CONFIGS.text.borderRadius}
          style={{ marginBottom: 0 < lines - 1 ? 8 : 0 }}
          variant={variant}
          colorScheme={colorScheme}
        />
      ))}
    </View>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: number;
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
}> = ({
  size = SKELETON_CONFIGS.avatar.size,
  style,
  variant = 'shimmer',
  colorScheme = 'light',
}) => {
  return (
    <AnimatedSkeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      variant={variant}
      colorScheme={colorScheme}
    />
  );
};

export const SkeletonButton: React.FC<{
  width?: number | string;
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
}> = ({
  width = 120,
  style,
  variant = 'shimmer',
  colorScheme = 'light',
}) => {
  return (
    <AnimatedSkeleton
      width={width}
      height={SKELETON_CONFIGS.button.height}
      borderRadius={SKELETON_CONFIGS.button.borderRadius}
      style={style}
      variant={variant}
      colorScheme={colorScheme}
    />
  );
};

export const SkeletonCard: React.FC<{
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
  preset?: keyof typeof skeletonPresets;
}> = ({
  style,
  variant = 'shimmer',
  colorScheme = 'light',
  preset = 'boxCard',
}) => {
  const config = skeletonPresets[preset];

  return (
    <View style={[styles.card, style]}>
      {preset === 'boxCard' && (
        <>
          <AnimatedSkeleton
            width="100%"
            height={config.image.height}
            borderRadius={config.image.borderRadius}
            variant={variant}
            colorScheme={colorScheme}
          />
          <View style={styles.cardContent}>
            <AnimatedSkeleton
              width={config.title.width}
              height={SKELETON_CONFIGS.title.height}
              borderRadius={SKELETON_CONFIGS.title.borderRadius}
              style={{ marginTop: 12 }}
              variant={variant}
              colorScheme={colorScheme}
            />
            <AnimatedSkeleton
              width={config.price.width}
              height={SKELETON_CONFIGS.text.height}
              borderRadius={SKELETON_CONFIGS.text.borderRadius}
              style={{ marginTop: 8 }}
              variant={variant}
              colorScheme={colorScheme}
            />
            <AnimatedSkeleton
              width="100%"
              height={config.button.height}
              borderRadius={SKELETON_CONFIGS.button.borderRadius}
              style={{ marginTop: config.button.marginTop }}
              variant={variant}
              colorScheme={colorScheme}
            />
          </View>
        </>
      )}
    </View>
  );
};

export const SkeletonListItem: React.FC<{
  style?: ViewStyle;
  variant?: 'shimmer' | 'pulse';
  colorScheme?: 'light' | 'dark';
  showAvatar?: boolean;
  showSubtitle?: boolean;
}> = ({
  style,
  variant = 'shimmer',
  colorScheme = 'light',
  showAvatar = true,
  showSubtitle = true,
}) => {
  return (
    <View style={[styles.listItem, style]}>
      {showAvatar && (
        <SkeletonAvatar
          size={48}
          variant={variant}
          colorScheme={colorScheme}
          style={styles.listItemAvatar}
        />
      )}
      <View style={styles.listItemContent}>
        <AnimatedSkeleton
          width="70%"
          height={SKELETON_CONFIGS.text.height}
          variant={variant}
          colorScheme={colorScheme}
        />
        {showSubtitle && (
          <AnimatedSkeleton
            width="50%"
            height={14}
            style={{ marginTop: 4 }}
            variant={variant}
            colorScheme={colorScheme}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemAvatar: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
});

export default AnimatedSkeleton;