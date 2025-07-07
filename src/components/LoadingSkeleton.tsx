import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { theme, getSpacing, getBorderRadius } from '../theme';
import { feedbackAnimations } from '../utils/animations';

/**
 * Componente de Loading Skeleton com animação
 */

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = getBorderRadius('sm'),
  style,
  animated = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (animated) {
      const animation = feedbackAnimations.loading(animatedValue);
      animation.start();
      
      return () => {
        animation.stop();
      };
    }
  }, [animated, animatedValue]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animated ? animatedValue : 0.3,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton para card de caixa
 */
export const BoxCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.boxCard, style]}>
      <LoadingSkeleton
        width="100%"
        height={150}
        borderRadius={getBorderRadius('md')}
        style={styles.boxImage}
      />
      <View style={styles.boxContent}>
        <LoadingSkeleton
          width="80%"
          height={16}
          style={styles.boxTitle}
        />
        <LoadingSkeleton
          width="60%"
          height={14}
          style={styles.boxPrice}
        />
        <View style={styles.boxFooter}>
          <LoadingSkeleton
            width={60}
            height={12}
          />
          <LoadingSkeleton
            width={40}
            height={12}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton para lista de caixas
 */
export const BoxListSkeleton: React.FC<{
  count?: number;
  style?: ViewStyle;
}> = ({ count = 6, style }) => {
  return (
    <View style={[styles.boxList, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <BoxCardSkeleton key={index} style={styles.boxListItem} />
      ))}
    </View>
  );
};

/**
 * Skeleton para perfil de usuário
 */
export const ProfileSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.profile, style]}>
      <LoadingSkeleton
        width={80}
        height={80}
        borderRadius={40}
        style={styles.avatar}
      />
      <LoadingSkeleton
        width="60%"
        height={20}
        style={styles.profileName}
      />
      <LoadingSkeleton
        width="40%"
        height={16}
        style={styles.profileEmail}
      />
      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <LoadingSkeleton width={40} height={24} />
          <LoadingSkeleton width={60} height={12} />
        </View>
        <View style={styles.statItem}>
          <LoadingSkeleton width={40} height={24} />
          <LoadingSkeleton width={60} height={12} />
        </View>
        <View style={styles.statItem}>
          <LoadingSkeleton width={40} height={24} />
          <LoadingSkeleton width={60} height={12} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton para item do carrinho
 */
export const CartItemSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.cartItem, style]}>
      <LoadingSkeleton
        width={60}
        height={60}
        borderRadius={getBorderRadius('sm')}
      />
      <View style={styles.cartItemContent}>
        <LoadingSkeleton
          width="70%"
          height={16}
          style={styles.cartItemTitle}
        />
        <LoadingSkeleton
          width="50%"
          height={14}
          style={styles.cartItemPrice}
        />
        <View style={styles.cartItemFooter}>
          <LoadingSkeleton width={80} height={32} />
          <LoadingSkeleton width={60} height={16} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton para lista de reviews
 */
export const ReviewSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.review, style]}>
      <View style={styles.reviewHeader}>
        <LoadingSkeleton
          width={40}
          height={40}
          borderRadius={20}
        />
        <View style={styles.reviewUser}>
          <LoadingSkeleton width={100} height={14} />
          <LoadingSkeleton width={80} height={12} />
        </View>
        <LoadingSkeleton width={60} height={16} />
      </View>
      <LoadingSkeleton
        width="100%"
        height={12}
        style={styles.reviewText}
      />
      <LoadingSkeleton
        width="80%"
        height={12}
        style={styles.reviewText}
      />
      <LoadingSkeleton
        width="60%"
        height={12}
      />
    </View>
  );
};

/**
 * Skeleton genérico para texto
 */
export const TextSkeleton: React.FC<{
  lines?: number;
  lineHeight?: number;
  style?: ViewStyle;
}> = ({ lines = 3, lineHeight = 16, style }) => {
  return (
    <View style={[styles.textSkeleton, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={lineHeight}
          style={index < lines - 1 ? { marginBottom: getSpacing('xs') } : undefined}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  
  // Box Card Skeleton
  boxCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('sm'),
    marginBottom: getSpacing('sm'),
    elevation: 2,
  },
  boxImage: {
    marginBottom: getSpacing('sm'),
  },
  boxContent: {
    gap: getSpacing('xs'),
  },
  boxTitle: {
    marginBottom: getSpacing('xs'),
  },
  boxPrice: {
    marginBottom: getSpacing('sm'),
  },
  boxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Box List Skeleton
  boxList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
  },
  boxListItem: {
    width: '48%',
    marginBottom: getSpacing('md'),
  },
  
  // Profile Skeleton
  profile: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  avatar: {
    marginBottom: getSpacing('md'),
  },
  profileName: {
    marginBottom: getSpacing('sm'),
  },
  profileEmail: {
    marginBottom: getSpacing('lg'),
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  
  // Cart Item Skeleton
  cartItem: {
    flexDirection: 'row',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('md'),
    marginBottom: getSpacing('sm'),
  },
  cartItemContent: {
    flex: 1,
    marginLeft: getSpacing('md'),
    gap: getSpacing('xs'),
  },
  cartItemTitle: {
    marginBottom: getSpacing('xs'),
  },
  cartItemPrice: {
    marginBottom: getSpacing('sm'),
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Review Skeleton
  review: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('md'),
    marginBottom: getSpacing('sm'),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
    gap: getSpacing('sm'),
  },
  reviewUser: {
    flex: 1,
    gap: getSpacing('xs'),
  },
  reviewText: {
    marginBottom: getSpacing('xs'),
  },
  
  // Text Skeleton
  textSkeleton: {
    padding: getSpacing('md'),
  },

  // Notification Skeleton
  notificationSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('md'),
    marginBottom: getSpacing('sm'),
  },
  notificationIcon: {
    marginRight: getSpacing('md'),
  },
  notificationContent: {
    flex: 1,
    gap: getSpacing('xs'),
  },
  notificationTitle: {
    marginBottom: getSpacing('xs'),
  },
  notificationBody: {
    marginBottom: getSpacing('xs'),
  },
});

/**
 * Skeleton para notificação
 */
export const NotificationSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.notificationSkeleton, style]}>
      <LoadingSkeleton
        width={40}
        height={40}
        borderRadius={20}
        style={styles.notificationIcon}
      />
      <View style={styles.notificationContent}>
        <LoadingSkeleton
          width="80%"
          height={16}
          style={styles.notificationTitle}
        />
        <LoadingSkeleton
          width="100%"
          height={14}
          style={styles.notificationBody}
        />
        <LoadingSkeleton
          width="40%"
          height={12}
        />
      </View>
      <LoadingSkeleton
        width={24}
        height={24}
        borderRadius={12}
      />
    </View>
  );
};

export default LoadingSkeleton;
