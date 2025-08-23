import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { scaleAnimation as _scaleAnimation, feedbackAnimations as _feedbackAnimations } from '../utils/animations';
import { theme } from '../theme';

/**
 * Ícone de favorito animado com micro-interações
 */

interface AnimatedFavoriteIconProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
  iconColor?: string;
  favoriteColor?: string;
}

const AnimatedFavoriteIcon: React.FC<AnimatedFavoriteIconProps> = ({
  isFavorite,
  onToggle,
  size = 24,
  style,
  disabled = false,
  iconColor = theme.colors.onSurfaceVariant,
  favoriteColor = '#FF6B6B',
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Animate when favorite status changes
  useEffect(() => {
    if (isFavorite) {
      // Favorite animation - scale up with rotation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 100,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Pulse effect
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Unfavorite animation - simple scale down
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isFavorite, scaleValue, rotateValue, pulseValue]);

  /**
   * Handle press
   */
  const handlePress = () => {
    if (disabled) return;
    
    // Immediate feedback animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    
    onToggle();
  };

  /**
   * Get animated style
   */
  const getAnimatedStyle = (): ViewStyle => {
    const rotate = rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '12deg'],
    });

    return {
      transform: [
        { scale: scaleValue },
        { scale: pulseValue },
        { rotate },
      ],
    };
  };

  /**
   * Get icon name
   */
  const getIconName = (): string => {
    return isFavorite ? 'heart' : 'heart-outline';
  };

  /**
   * Get icon color
   */
  const getIconColor = (): string => {
    return isFavorite ? favoriteColor : iconColor;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={style}
      activeOpacity={0.7}
    >
      <Animated.View style={getAnimatedStyle()}>
        <IconButton
          icon={getIconName()}
          size={size}
          iconColor={getIconColor()}
          onPress={undefined} // Remove onPress to prevent double handling
          disabled={disabled}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedFavoriteIcon;