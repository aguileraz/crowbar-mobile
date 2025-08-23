import { useEffect, useRef, useCallback, useState } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';
import { bundleAnalyzer } from '../utils/bundleAnalyzer';
import logger from '../services/loggerService';

/**
 * Hook personalizado para monitoramento de performance
 */

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  interactionTime: number;
  isInteractionComplete: boolean;
}

interface UsePerformanceOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackInteractions?: boolean;
  trackMemory?: boolean;
  logToConsole?: boolean;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    componentName = 'Component',
    trackRenders = true,
    trackInteractions = true,
    trackMemory = false,
    logToConsole = __DEV__,
  } = options;

  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    memoryUsage: 0,
    interactionTime: 0,
    isInteractionComplete: false,
  });

  // Refs
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  /**
   * Start render measurement
   */
  const startRenderMeasurement = useCallback(() => {
    if (!trackRenders) return;
    renderStartTime.current = Date.now();
  }, [trackRenders]);

  /**
   * End render measurement
   */
  const endRenderMeasurement = useCallback(() => {
    if (!trackRenders || renderStartTime.current === 0) return;

    const renderTime = Date.now() - renderStartTime.current;
    renderCountRef.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      renderCount: renderCountRef.current,
    }));

    if (logToConsole) {
      logger.debug(`${componentName} render #${renderCountRef.current} took ${renderTime}ms`);
    }

    renderStartTime.current = 0;
  }, [trackRenders, componentName, logToConsole]);

  /**
   * Start interaction measurement
   */
  const startInteractionMeasurement = useCallback(() => {
    if (!trackInteractions) return;
    
    interactionStartTime.current = Date.now();
    setMetrics(prev => ({ ...prev, isInteractionComplete: false }));
  }, [trackInteractions]);

  /**
   * End interaction measurement
   */
  const endInteractionMeasurement = useCallback(() => {
    if (!trackInteractions || interactionStartTime.current === 0) return;

    InteractionManager.runAfterInteractions(() => {
      const interactionTime = Date.now() - interactionStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        interactionTime,
        isInteractionComplete: true,
      }));

      if (logToConsole) {
        logger.debug(`${componentName} interaction completed in ${interactionTime}ms`);
      }

      interactionStartTime.current = 0;
    });
  }, [trackInteractions, componentName, logToConsole]);

  /**
   * Measure memory usage
   */
  const measureMemoryUsage = useCallback(() => {
    if (!trackMemory) return;

    // React Native doesn't have performance.memory
    // We'll estimate based on component complexity
    const estimatedMemory = renderCountRef.current * 1000; // 1KB per render (rough estimate)
    
    setMetrics(prev => ({
      ...prev,
      memoryUsage: estimatedMemory,
    }));
  }, [trackMemory]);

  /**
   * Track component mount/unmount
   */
  useEffect(() => {
    startRenderMeasurement();
    startInteractionMeasurement();

    return () => {
      endRenderMeasurement();
      endInteractionMeasurement();
    };
  }, []);

  /**
   * Track renders
   */
  useEffect(() => {
    if (trackRenders) {
      endRenderMeasurement();
      measureMemoryUsage();
    }
  });

  /**
   * Track app state changes
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startInteractionMeasurement();
      } else if (nextAppState === 'background') {
        endInteractionMeasurement();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [startInteractionMeasurement, endInteractionMeasurement]);

  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
    startInteractionMeasurement,
    endInteractionMeasurement,
    measureMemoryUsage,
  };
};

/**
 * Hook específico para monitorar performance de listas
 */
export const useListPerformance = (listName: string = 'List') => {
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollTime: 0,
    scrollDistance: 0,
    fps: 60,
    isScrolling: false,
  });

  const scrollStartTime = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsStartTime = useRef<number>(0);

  const onScrollBeginDrag = useCallback(() => {
    scrollStartTime.current = Date.now();
    fpsStartTime.current = Date.now();
    frameCount.current = 0;
    
    setScrollMetrics(prev => ({ ...prev, isScrolling: true }));
  }, []);

  const onScrollEndDrag = useCallback(() => {
    const scrollTime = Date.now() - scrollStartTime.current;
    const fps = frameCount.current / ((Date.now() - fpsStartTime.current) / 1000);
    
    setScrollMetrics(prev => ({
      ...prev,
      scrollTime,
      fps: Math.round(fps),
      isScrolling: false,
    }));

    if (__DEV__) {
      logger.debug(`${listName} scroll completed in ${scrollTime}ms at ${Math.round(fps)} FPS`);
    }
  }, [listName]);

  const onScroll = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const distance = Math.abs(currentY - lastScrollY.current);
    
    frameCount.current += 1;
    lastScrollY.current = currentY;
    
    setScrollMetrics(prev => ({
      ...prev,
      scrollDistance: prev.scrollDistance + distance,
    }));
  }, []);

  return {
    scrollMetrics,
    onScrollBeginDrag,
    onScrollEndDrag,
    onScroll,
  };
};

/**
 * Hook para monitorar performance de navegação
 */
export const useNavigationPerformance = () => {
  const [navigationMetrics, setNavigationMetrics] = useState({
    transitionTime: 0,
    screenLoadTime: 0,
    isTransitioning: false,
  });

  const transitionStartTime = useRef<number>(0);
  const screenLoadStartTime = useRef<number>(0);

  const startTransition = useCallback((routeName: string) => {
    transitionStartTime.current = Date.now();
    setNavigationMetrics(prev => ({ ...prev, isTransitioning: true }));
    
    if (__DEV__) {
      logger.debug(`Navigation to ${routeName} started`);
    }
  }, []);

  const endTransition = useCallback((routeName: string) => {
    const transitionTime = Date.now() - transitionStartTime.current;
    
    setNavigationMetrics(prev => ({
      ...prev,
      transitionTime,
      isTransitioning: false,
    }));

    if (__DEV__) {
      logger.debug(`Navigation to ${routeName} completed in ${transitionTime}ms`);
    }
  }, []);

  const startScreenLoad = useCallback((screenName: string) => {
    screenLoadStartTime.current = Date.now();
    
    if (__DEV__) {
      logger.debug(`Screen ${screenName} load started`);
    }
  }, []);

  const endScreenLoad = useCallback((screenName: string) => {
    const screenLoadTime = Date.now() - screenLoadStartTime.current;
    
    setNavigationMetrics(prev => ({
      ...prev,
      screenLoadTime,
    }));

    if (__DEV__) {
      logger.debug(`Screen ${screenName} loaded in ${screenLoadTime}ms`);
    }
  }, []);

  return {
    navigationMetrics,
    startTransition,
    endTransition,
    startScreenLoad,
    endScreenLoad,
  };
};

/**
 * Hook para monitorar performance de API
 */
export const useApiPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<{
    [endpoint: string]: {
      requestTime: number;
      responseTime: number;
      errorRate: number;
      callCount: number;
    };
  }>({});

  const trackApiCall = useCallback((
    endpoint: string,
    startTime: number,
    endTime: number,
    isError: boolean = false
  ) => {
    const responseTime = endTime - startTime;
    
    setApiMetrics(prev => {
      const current = prev[endpoint] || {
        requestTime: 0,
        responseTime: 0,
        errorRate: 0,
        callCount: 0,
      };

      const newCallCount = current.callCount + 1;
      const newErrorRate = isError 
        ? (current.errorRate * current.callCount + 1) / newCallCount
        : (current.errorRate * current.callCount) / newCallCount;

      return {
        ...prev,
        [endpoint]: {
          requestTime: startTime,
          responseTime,
          errorRate: newErrorRate,
          callCount: newCallCount,
        },
      };
    });

    // Track in bundle analyzer
    bundleAnalyzer.startMeasurement(`api_${endpoint}`);
    setTimeout(() => {
      bundleAnalyzer.endMeasurement(`api_${endpoint}`);
    }, responseTime);

    if (__DEV__) {
      logger.debug(`API ${endpoint} ${isError ? 'failed' : 'completed'} in ${responseTime}ms`);
    }
  }, []);

  const getApiStats = useCallback((endpoint: string) => {
    return apiMetrics[endpoint] || null;
  }, [apiMetrics]);

  const getAllApiStats = useCallback(() => {
    return apiMetrics;
  }, [apiMetrics]);

  return {
    apiMetrics,
    trackApiCall,
    getApiStats,
    getAllApiStats,
  };
};

/**
 * Hook para monitorar performance geral da aplicação
 */
export const useAppPerformance = () => {
  const [appMetrics, setAppMetrics] = useState({
    appStartTime: 0,
    totalRenderTime: 0,
    totalApiCalls: 0,
    averageApiTime: 0,
    memoryUsage: 0,
    crashCount: 0,
  });

  const appStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track app start time
    const startTime = Date.now() - appStartTime.current;
    setAppMetrics(prev => ({ ...prev, appStartTime: startTime }));

    // Setup global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      setAppMetrics(prev => ({ ...prev, crashCount: prev.crashCount + 1 }));
      
      if (__DEV__) {
        logger.error('App crash detected:', error);
      }
      
      originalHandler(error, isFatal);
    });

    return () => {
      ErrorUtils.setGlobalHandler(originalHandler);
    };
  }, []);

  const updateMetrics = useCallback((updates: Partial<typeof appMetrics>) => {
    setAppMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  const _getPerformanceReport = useCallback(() => {
    return {
      ...appMetrics,
      uptime: Date.now() - appStartTime.current,
      timestamp: Date.now(),
    };
  }, [appMetrics]);

  return {
    appMetrics,
    updateMetrics,
    getPerformanceReport,
  };
};

export default usePerformance;