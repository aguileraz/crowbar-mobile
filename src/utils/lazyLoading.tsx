import React, { Suspense, ComponentType, lazy } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { theme, getSpacing } from '../theme';
import logger from '../services/loggerService';

/**
 * Utilitários para lazy loading de componentes
 */

// Tipos
interface LazyComponentProps {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface LazyScreenProps extends LazyComponentProps {
  skeletonType?: 'default' | 'profile' | 'boxList' | 'cart';
}

/**
 * Componente de loading padrão
 */
const DefaultFallback: React.FC = () => (
  <View style={styles.fallbackContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

/**
 * Componente de loading com skeleton
 */
const SkeletonFallback: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'profile':
      return <LoadingSkeleton width="100%" height={200} />;
    case 'boxList':
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, _index) => (
            <LoadingSkeleton
              key={0}
              width="48%"
              height={180}
              style={styles.skeletonItem}
            />
          ))}
        </View>
      );
    case 'cart':
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 3 }).map((_, _index) => (
            <LoadingSkeleton
              key={0}
              width="100%"
              height={80}
              style={styles.skeletonItem}
            />
          ))}
        </View>
      );
    default:
      return <DefaultFallback />;
  }
};

/**
 * Error Boundary simples
 */
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <DefaultFallback />
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para lazy loading de componentes
 */
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(importFunc);
  const { fallback: Fallback = DefaultFallback, errorBoundary: _ErrorBoundary } = options;

  return React.forwardRef<any, P>((props, ref) => (
    <LazyErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyErrorBoundary>
  ));
}

/**
 * HOC específico para telas com skeleton loading
 */
export function withLazyScreen<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyScreenProps = {}
) {
  const LazyComponent = lazy(importFunc);
  const { skeletonType = 'default', errorBoundary: _ErrorBoundary } = options;

  const SkeletonComponent = () => <SkeletonFallback type={skeletonType} />;

  return React.forwardRef<any, P>((props, ref) => (
    <LazyErrorBoundary>
      <Suspense fallback={<SkeletonComponent />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyErrorBoundary>
  ));
}

/**
 * Lazy loading para telas principais
 */
export const LazyScreens = {
  // Shop screens
  ShopScreen: withLazyScreen(
    () => import('../screens/ShopScreen'),
    { skeletonType: 'boxList' }
  ),
  BoxDetailsScreen: withLazyScreen(
    () => import('../screens/BoxDetailsScreen'),
    { skeletonType: 'default' }
  ),
  SearchScreen: withLazyScreen(
    () => import('../screens/SearchScreen'),
    { skeletonType: 'boxList' }
  ),
  CategoryScreen: withLazyScreen(
    () => import('../screens/CategoryScreen'),
    { skeletonType: 'boxList' }
  ),

  // Cart and checkout
  CartScreen: withLazyScreen(
    () => import('../screens/CartScreen'),
    { skeletonType: 'cart' }
  ),
  CheckoutScreen: withLazyScreen(
    () => import('../screens/CheckoutScreen'),
    { skeletonType: 'default' }
  ),

  // User screens
  ProfileScreen: withLazyScreen(
    () => import('../screens/ProfileScreen'),
    { skeletonType: 'profile' }
  ),
  FavoritesScreen: withLazyScreen(
    () => import('../screens/FavoritesScreen'),
    { skeletonType: 'boxList' }
  ),
  AddressesScreen: withLazyScreen(
    () => import('../screens/AddressesScreen'),
    { skeletonType: 'default' }
  ),
  OrderHistoryScreen: withLazyScreen(
    () => import('../screens/OrderHistoryScreen'),
    { skeletonType: 'default' }
  ),

  // Box opening
  BoxOpeningScreen: withLazyScreen(
    () => import('../screens/BoxOpeningScreen'),
    { skeletonType: 'default' }
  ),

  // Reviews
  ReviewsScreen: withLazyScreen(
    () => import('../screens/ReviewsScreen'),
    { skeletonType: 'default' }
  ),

  // Notifications
  NotificationsScreen: withLazyScreen(
    () => import('../screens/NotificationsScreen'),
    { skeletonType: 'default' }
  ),
  NotificationSettingsScreen: withLazyScreen(
    () => import('../screens/NotificationSettingsScreen'),
    { skeletonType: 'default' }
  ),
};

/**
 * Lazy loading para componentes
 */
export const LazyComponents = {
  // Complex components
  ImageGallery: withLazyLoading(
    () => import('../components/ImageGallery')
  ),
  FilterModal: withLazyLoading(
    () => import('../components/FilterModal')
  ),
  ShareResultModal: withLazyLoading(
    () => import('../components/ShareResultModal')
  ),
  AnalyticsDashboard: withLazyLoading(
    () => import('../components/AnalyticsDashboard')
  ),

  // Animation components
  BoxOpeningAnimation: withLazyLoading(
    () => import('../components/BoxOpeningAnimation')
  ),
  ItemRevealCard: withLazyLoading(
    () => import('../components/ItemRevealCard')
  ),

  // Chart components (if any)
  // UserStatistics: withLazyLoading(
  //   () => import('../components/UserStatistics')
  // ),
};

/**
 * Preload function para componentes críticos
 */
export const preloadCriticalComponents = async () => {
  try {
    // Preload most used screens
    const criticalImports = [
      import('../screens/ShopScreen'),
      import('../screens/CartScreen'),
      import('../screens/ProfileScreen'),
    ];

    await Promise.all(criticalImports);
    logger.debug('Critical components preloaded');
  } catch (error) {
    logger.error('Error preloading critical components:', error);
  }
};

/**
 * Preload function para componentes baseado na navegação
 */
export const preloadByRoute = async (routeName: string) => {
  try {
    switch (routeName) {
      case 'Shop':
        await import('../screens/BoxDetailsScreen');
        await import('../screens/SearchScreen');
        break;
      case 'Cart':
        await import('../screens/CheckoutScreen');
        break;
      case 'Profile':
        await import('../screens/AddressesScreen');
        await import('../screens/OrderHistoryScreen');
        break;
      default:
        break;
    }
  } catch (error) {
    logger.error(`Error preloading components for route ${routeName}:`, error);
  }
};

/**
 * Hook para preload inteligente
 */
export const useSmartPreload = () => {
  const preloadForUser = React.useCallback(async (userBehavior: {
    frequentScreens: string[];
    lastVisited: string[];
  }) => {
    try {
      const { frequentScreens, lastVisited } = userBehavior;
      
      // Preload based on user behavior
      const preloadPromises = [...frequentScreens, ...lastVisited]
        .slice(0, 3) // Limit to 3 most relevant
        .map(screen => preloadByRoute(screen));
      
      await Promise.all(preloadPromises);
    } catch (error) {
      logger.error('Error in smart preload:', error);
    }
  }, []);

  return { preloadForUser };
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
  },
  skeletonItem: {
    marginBottom: getSpacing('md'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default {
  withLazyLoading,
  withLazyScreen,
  LazyScreens,
  LazyComponents,
  preloadCriticalComponents,
  preloadByRoute,
  useSmartPreload,
};