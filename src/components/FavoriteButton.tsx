import React, { useState } from 'react';
import logger from '../services/loggerService';
import {
  StyleSheet,
  Animated,
} from 'react-native';
import {
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

// Redux
import { AppDispatch } from '../store';
import {
  addToFavorites,
  removeFromFavorites,
  addFavoriteLocal,
  removeFavoriteLocal,
  selectIsFavorite,
  selectFavoritesUpdating,
} from '../store/slices/favoritesSlice';

// Theme
import { theme } from '../theme';

/**
 * Componente de Botão de Favorito
 * Botão animado para adicionar/remover favoritos
 */

interface FavoriteButtonProps {
  boxId: string;
  size?: number;
  style?: any;
  disabled?: boolean;
  onPress?: (isFavorite: boolean) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  boxId,
  size = 24,
  style,
  disabled = false,
  onPress,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const isFavorite = useSelector(selectIsFavorite(boxId));
  const isUpdating = useSelector(selectFavoritesUpdating);
  
  // Animation state
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  /**
   * Toggle favorite status
   */
  const toggleFavorite = async () => {
    if (disabled || isUpdating) return;

    // Optimistic update
    if (isFavorite) {
      dispatch(removeFavoriteLocal(boxId));
    } else {
      dispatch(addFavoriteLocal(boxId));
    }

    // Animate button
    animatePress();

    // Call parent callback
    onPress?.(!isFavorite);

    try {
      if (isFavorite) {
        await dispatch(removeFromFavorites(boxId)).unwrap();
      } else {
        await dispatch(addToFavorites(boxId)).unwrap();
        // Animate heart pulse when adding
        animatePulse();
      }
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      if (isFavorite) {
        dispatch(addFavoriteLocal(boxId));
      } else {
        dispatch(removeFavoriteLocal(boxId));
      }
    }
  };

  /**
   * Animate button press
   */
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Animate heart pulse when favorited
   */
  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Get icon name based on favorite status
   */
  const getIconName = (): string => {
    return isFavorite ? 'heart' : 'heart-outline';
  };

  /**
   * Get icon color based on favorite status
   */
  const getIconColor = (): string => {
    return isFavorite ? theme.colors.error : theme.colors.onSurfaceVariant;
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
        style,
      ]}
    >
      <IconButton
        icon={getIconName()}
        size={size}
        iconColor={getIconColor()}
        onPress={toggleFavorite}
        disabled={disabled || isUpdating}
        style={[
          styles.button,
          isFavorite && styles.favoriteButton,
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
  favoriteButton: {
    backgroundColor: theme.colors.errorContainer + '40',
  },
});

export default FavoriteButton;
