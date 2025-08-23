/**
 * Crowbar Mobile - Monitoring Hook
 * React hook for easy integration with monitoring services
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import monitoringService, { ErrorContext, CustomMetric } from '../services/monitoringService';
import { RootState } from '../store';

/**
 * Hook for monitoring integration
 */
export const useMonitoring = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isInitialized = useRef(false);

  // Initialize monitoring when user changes
  useEffect(() => {
    const initializeMonitoring = async () => {
      if (!isInitialized.current) {
        await monitoringService.initialize();
        isInitialized.current = true;
      }

      // Set user properties when user is available
      if (user) {
        await monitoringService.setUserId(user.id);
        await monitoringService.setUserProperties({
          userId: user.id,
          userType: user.isPremium ? 'premium' : 'free',
          appVersion: '1.0.0', // Should come from config
        });
      }
    };

    initializeMonitoring();
  }, [user]);

  // Log error with context
  const logError = useCallback((error: Error, context?: ErrorContext) => {
    const enhancedContext = {
      ...context,
      userId: user?.id,
    };
    monitoringService.logError(error, enhancedContext);
  }, [user]);

  // Log non-fatal error
  const logNonFatalError = useCallback((message: string, context?: ErrorContext) => {
    const enhancedContext = {
      ...context,
      userId: user?.id,
    };
    monitoringService.logNonFatalError(message, enhancedContext);
  }, [user]);

  // Start performance trace
  const startTrace = useCallback((traceName: string, attributes?: Record<string, string>) => {
    return monitoringService.startTrace(traceName, attributes);
  }, []);

  // Stop performance trace
  const stopTrace = useCallback((traceName: string) => {
    return monitoringService.stopTrace(traceName);
  }, []);

  // Record custom metric
  const recordMetric = useCallback((metric: CustomMetric) => {
    monitoringService.recordMetric(metric);
  }, []);

  // Track event
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    const enhancedParameters = {
      ...parameters,
      user_id: user?.id,
      user_type: user?.isPremium ? 'premium' : 'free',
    };
    return monitoringService.trackEvent(eventName, enhancedParameters);
  }, [user]);

  return {
    logError,
    logNonFatalError,
    startTrace,
    stopTrace,
    recordMetric,
    trackEvent,
    getStatus: monitoringService.getStatus.bind(monitoringService),
    getPerformanceMetrics: monitoringService.getPerformanceMetrics.bind(monitoringService),
  };
};

/**
 * Hook for screen tracking
 */
export const useScreenTracking = (screenName: string, screenClass?: string) => {
  const { trackEvent } = useMonitoring();

  useFocusEffect(
    useCallback(() => {
      // Track screen view
      monitoringService.trackScreenView(screenName, screenClass);

      // Track screen focus event
      trackEvent('screen_focus', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      return () => {
        // Track screen blur event
        trackEvent('screen_blur', {
          screen_name: screenName,
          screen_class: screenClass || screenName,
        });
      };
    }, [screenName, screenClass, trackEvent])
  );
};

/**
 * Hook for performance tracking
 */
export const usePerformanceTracking = (traceName: string, dependencies: any[] = []) => {
  const { startTrace, stopTrace, recordMetric } = useMonitoring();
  const startTime = useRef<number>();

  useEffect(() => {
    const start = async () => {
      startTime.current = Date.now();
      await startTrace(traceName);
    };

    start();

    return () => {
      const cleanup = async () => {
        await stopTrace(traceName);
        
        if (startTime.current) {
          const duration = Date.now() - startTime.current;
          recordMetric({
            name: `${traceName}_duration`,
            value: duration,
            unit: 'ms',
          });
        }
      };

      cleanup();
    };
  }, dependencies);

  return {
    recordMetric,
  };
};

/**
 * Hook for API call tracking
 */
export const useApiTracking = () => {
  const { logError, recordMetric, trackEvent } = useMonitoring();

  const trackApiCall = useCallback(async (
    apiName: string,
    apiCall: () => Promise<any>,
    options?: {
      trackSuccess?: boolean;
      trackError?: boolean;
      trackDuration?: boolean;
    }
  ) => {
    const {
      trackSuccess = true,
      trackError = true,
      trackDuration = true,
    } = options || {};

    const startTime = Date.now();

    try {
      const _result = await apiCall();

      if (trackSuccess) {
        trackEvent('api_call_success', {
          api_name: apiName,
          duration: trackDuration ? Date.now() - startTime : undefined,
        });
      }

      if (trackDuration) {
        recordMetric({
          name: `api_${apiName}_duration`,
          value: Date.now() - startTime,
          unit: 'ms',
        });
      }

      return result;
    } catch (error) {
      if (trackError) {
        logError(error as Error, {
          action: 'api_call',
          additionalData: {
            api_name: apiName,
            duration: Date.now() - startTime,
          },
        });

        trackEvent('api_call_error', {
          api_name: apiName,
          error_message: (error as Error).message,
          duration: trackDuration ? Date.now() - startTime : undefined,
        });
      }

      throw error;
    }
  }, [logError, recordMetric, trackEvent]);

  return {
    trackApiCall,
  };
};

/**
 * Hook for user action tracking
 */
export const useUserActionTracking = () => {
  const { trackEvent, recordMetric } = useMonitoring();

  const trackUserAction = useCallback((
    action: string,
    category?: string,
    label?: string,
    value?: number,
    additionalData?: Record<string, any>
  ) => {
    trackEvent('user_action', {
      action,
      category,
      label,
      value,
      ...additionalData,
    });

    if (value !== undefined) {
      recordMetric({
        name: `user_action_${action}`,
        value,
      });
    }
  }, [trackEvent, recordMetric]);

  const trackButtonPress = useCallback((buttonName: string, screen?: string) => {
    trackUserAction('button_press', 'interaction', buttonName, undefined, { screen });
  }, [trackUserAction]);

  const trackFormSubmission = useCallback((formName: string, success: boolean) => {
    trackUserAction('form_submission', 'form', formName, success ? 1 : 0, { success });
  }, [trackUserAction]);

  const trackPurchase = useCallback((productId: string, amount: number, currency: string) => {
    trackUserAction('purchase', 'ecommerce', productId, amount, { currency });
  }, [trackUserAction]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackUserAction('search', 'discovery', query, resultsCount);
  }, [trackUserAction]);

  return {
    trackUserAction,
    trackButtonPress,
    trackFormSubmission,
    trackPurchase,
    trackSearch,
  };
};

/**
 * Hook for error boundary integration
 */
export const useErrorBoundary = () => {
  const { logError } = useMonitoring();

  const handleError = useCallback((error: Error, errorInfo: any) => {
    logError(error, {
      action: 'error_boundary',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });
  }, [logError]);

  return {
    handleError,
  };
};

export default useMonitoring;