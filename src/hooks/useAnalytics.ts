import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import logger from '../services/loggerService';
import {
  initializeAnalytics,
  trackEvent,
  trackScreen,
  setUserProperties,
  setUserId,
  recordScreenLoadTime,
  recordConversion,
  selectAnalyticsEnabled,
  selectUserId,
  selectCurrentScreen,
  selectPerformanceMetrics,
  selectIsInitialized,
} from '../store/slices/analyticsSlice';
import { analyticsService } from '../services/analyticsService';

/**
 * Hook personalizado para gerenciar analytics
 */

interface UseAnalyticsOptions {
  autoInitialize?: boolean;
  trackScreenViews?: boolean;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const {
    autoInitialize = true,
    trackScreenViews = true,
  } = options;

  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const isEnabled = useSelector(selectAnalyticsEnabled);
  const userId = useSelector(selectUserId);
  const currentScreen = useSelector(selectCurrentScreen);
  const performanceMetrics = useSelector(selectPerformanceMetrics);
  const isInitialized = useSelector(selectIsInitialized);

  /**
   * Initialize analytics
   */
  const initialize = useCallback(async () => {
    try {
      await dispatch(initializeAnalytics()).unwrap();
    } catch (error) {
      logger.error('Failed to initialize analytics:', error);
    }
  }, [dispatch]);

  /**
   * Track custom event
   */
  const track = useCallback(async (eventName: string, parameters?: Record<string, any>) => {
    if (!isEnabled) return;
    
    try {
      await dispatch(trackEvent({ name: eventName, parameters })).unwrap();
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }, [dispatch, isEnabled]);

  /**
   * Track screen view
   */
  const trackScreenView = useCallback(async (screenName: string, screenClass?: string) => {
    if (!isEnabled || !trackScreenViews) return;
    
    try {
      const startTime = Date.now();
      await dispatch(trackScreen({ screenName, screenClass })).unwrap();
      
      // Record screen load time
      const loadTime = Date.now() - startTime;
      dispatch(recordScreenLoadTime({ screen: screenName, loadTime }));
    } catch (error) {
      logger.error('Failed to track screen view:', error);
    }
  }, [dispatch, isEnabled, trackScreenViews]);

  /**
   * Set user properties
   */
  const setUserProps = useCallback(async (properties: Record<string, any>) => {
    if (!isEnabled) return;
    
    try {
      await dispatch(setUserProperties(properties)).unwrap();
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }, [dispatch, isEnabled]);

  /**
   * Set user ID
   */
  const setUser = useCallback(async (id: string | null) => {
    try {
      dispatch(setUserId(id));
      await analyticsService.setUserId(id);
    } catch (error) {
      logger.error('Failed to set user ID:', error);
    }
  }, [dispatch]);

  /**
   * Track conversion event
   */
  const trackConversion = useCallback(async (
    event: string,
    value?: number,
    currency?: string
  ) => {
    if (!isEnabled) return;
    
    try {
      dispatch(recordConversion({ event, value, currency }));
      await track('conversion', { event, value, currency });
    } catch (error) {
      logger.error('Failed to track conversion:', error);
    }
  }, [dispatch, isEnabled, track]);

  /**
   * Track error
   */
  const trackError = useCallback((error: Error, context?: string) => {
    if (!isEnabled) return;
    
    analyticsService.trackError(error, context);
  }, [isEnabled]);

  /**
   * Track engagement
   */
  const trackEngagement = useCallback(async (
    action: string,
    target?: string,
    value?: number
  ) => {
    if (!isEnabled) return;
    
    try {
      await analyticsService.trackEngagement(action, target, value);
    } catch (error) {
      logger.error('Failed to track engagement:', error);
    }
  }, [isEnabled]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initialize]);

  return {
    // State
    isEnabled,
    isInitialized,
    userId,
    currentScreen,
    performanceMetrics,
    
    // Actions
    initialize,
    track,
    trackScreenView,
    setUserProps,
    setUser,
    trackConversion,
    trackError,
    trackEngagement,
    
    // Utilities
    isReady: isInitialized && isEnabled,
  };
};

/**
 * Hook específico para tracking de telas
 */
export const useScreenTracking = (screenName: string, screenClass?: string) => {
  const { trackScreenView, isReady } = useAnalytics();

  useEffect(() => {
    if (isReady) {
      trackScreenView(screenName, screenClass);
    }
  }, [screenName, screenClass, trackScreenView, isReady]);

  return { screenName };
};

/**
 * Hook específico para tracking de performance
 */
export const usePerformanceTracking = () => {
  const { track, isEnabled } = useAnalytics();

  const trackApiCall = useCallback((
    endpoint: string,
    method: string,
    startTime: number
  ) => {
    if (!isEnabled) return;
    
    analyticsService.trackApiCall(endpoint, method, startTime);
  }, [isEnabled]);

  const trackScreenLoad = useCallback((screenName: string, loadTime: number) => {
    if (!isEnabled) return;
    
    track('screen_load_time', {
      screen_name: screenName,
      load_time: loadTime,
    });
  }, [track, isEnabled]);

  return {
    trackApiCall,
    trackScreenLoad,
  };
};

/**
 * Hook específico para e-commerce tracking
 */
export const useEcommerceTracking = () => {
  const { track, trackConversion, isEnabled } = useAnalytics();

  const trackPurchase = useCallback(async (
    transactionId: string,
    value: number,
    currency: string,
    items: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      quantity: number;
      price: number;
    }>
  ) => {
    if (!isEnabled) return;
    
    try {
      await analyticsService.trackPurchase(transactionId, value, currency, items);
      await trackConversion('purchase', value, currency);
    } catch (error) {
      logger.error('Failed to track purchase:', error);
    }
  }, [isEnabled, trackConversion]);

  const trackAddToCart = useCallback(async (
    itemId: string,
    itemName: string,
    category: string,
    value: number,
    currency: string = 'BRL'
  ) => {
    if (!isEnabled) return;
    
    await track('add_to_cart', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      value,
      currency,
    });
  }, [track, isEnabled]);

  const trackRemoveFromCart = useCallback(async (
    itemId: string,
    itemName: string,
    category: string,
    value: number,
    currency: string = 'BRL'
  ) => {
    if (!isEnabled) return;
    
    await track('remove_from_cart', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      value,
      currency,
    });
  }, [track, isEnabled]);

  const trackBoxOpening = useCallback(async (
    boxId: string,
    boxName: string,
    cost: number,
    itemsReceived: Array<{
      id: string;
      name: string;
      rarity: string;
      value: number;
    }>
  ) => {
    if (!isEnabled) return;
    
    try {
      await analyticsService.trackBoxOpening(boxId, boxName, cost, itemsReceived);
    } catch (error) {
      logger.error('Failed to track box opening:', error);
    }
  }, [isEnabled]);

  return {
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackBoxOpening,
  };
};

/**
 * Hook específico para user engagement
 */
export const useEngagementTracking = () => {
  const { trackEngagement, isEnabled } = useAnalytics();

  const trackButtonClick = useCallback((buttonName: string, _context?: string) => {
    if (!isEnabled) return;
    
    trackEngagement('button_click', buttonName);
  }, [trackEngagement, isEnabled]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    if (!isEnabled) return;
    
    trackEngagement('search', query, resultsCount);
  }, [trackEngagement, isEnabled]);

  const trackShare = useCallback((contentType: string, contentId: string) => {
    if (!isEnabled) return;
    
    trackEngagement('share', `${contentType}:${contentId}`);
  }, [trackEngagement, isEnabled]);

  const trackTimeSpent = useCallback((screen: string, timeSpent: number) => {
    if (!isEnabled) return;
    
    trackEngagement('time_spent', screen, timeSpent);
  }, [trackEngagement, isEnabled]);

  return {
    trackButtonClick,
    trackSearch,
    trackShare,
    trackTimeSpent,
  };
};

export default useAnalytics;