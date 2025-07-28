/**
 * Crowbar Mobile - Performance Optimization Hook
 * React hook for performance monitoring and optimization
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import logger from '../services/loggerService';
import { 
  bundleAnalyzer, 
  performanceMonitor, 
  CacheManager,
  BundleAnalysis,
  PerformanceMetrics 
} from '../utils/bundleOptimization';
import { useMonitoring } from './useMonitoring';

interface PerformanceOptimizationOptions {
  enableBundleAnalysis?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableCacheOptimization?: boolean;
  enableMemoryOptimization?: boolean;
  autoCleanupInterval?: number; // in milliseconds
}

interface PerformanceState {
  bundleAnalysis: BundleAnalysis | null;
  performanceMetrics: PerformanceMetrics | null;
  cacheSize: number;
  isOptimizing: boolean;
  lastOptimization: Date | null;
}

/**
 * Hook for performance optimization
 */
export const usePerformanceOptimization = (
  options: PerformanceOptimizationOptions = {}
) => {
  const {
    enableBundleAnalysis = true,
    enablePerformanceMonitoring = true,
    enableCacheOptimization = true,
    enableMemoryOptimization = true,
    autoCleanupInterval = 30 * 60 * 1000, // 30 minutes
  } = options;

  const [state, setState] = useState<PerformanceState>({
    bundleAnalysis: null,
    performanceMetrics: null,
    cacheSize: 0,
    isOptimizing: false,
    lastOptimization: null,
  });

  const { recordMetric, trackEvent } = useMonitoring();
  const netInfo = useNetInfo();
  const appState = useRef(AppState.currentState);
  const cleanupInterval = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // Initialize performance monitoring
  useEffect(() => {
    if (!isInitialized.current) {
      initializePerformanceOptimization();
      isInitialized.current = true;
    }

    return () => {
      cleanup();
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        handleAppForeground();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        handleAppBackground();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Auto cleanup interval
  useEffect(() => {
    if (autoCleanupInterval > 0) {
      cleanupInterval.current = setInterval(() => {
        performOptimization();
      }, autoCleanupInterval);

      return () => {
        if (cleanupInterval.current) {
          clearInterval(cleanupInterval.current);
        }
      };
    }
  }, [autoCleanupInterval]);

  /**
   * Initialize performance optimization
   */
  const initializePerformanceOptimization = async () => {
    try {
      if (enablePerformanceMonitoring) {
        performanceMonitor.start();
        
        // Record first render
        setTimeout(() => {
          performanceMonitor.recordFirstRender();
        }, 100);
      }

      // Initial analysis
      await updatePerformanceState();

      trackEvent('performance_optimization_initialized', {
        bundle_analysis: enableBundleAnalysis,
        performance_monitoring: enablePerformanceMonitoring,
        cache_optimization: enableCacheOptimization,
        memory_optimization: enableMemoryOptimization,
      });
    } catch (error) {
      logger.error('Failed to initialize performance optimization:', error);
    }
  };

  /**
   * Update performance state
   */
  const updatePerformanceState = async () => {
    try {
      const updates: Partial<PerformanceState> = {};

      if (enableBundleAnalysis) {
        updates.bundleAnalysis = await bundleAnalyzer.analyzeBundleSize();
      }

      if (enablePerformanceMonitoring) {
        updates.performanceMetrics = performanceMonitor.getMetrics();
      }

      if (enableCacheOptimization) {
        updates.cacheSize = await CacheManager.getCacheSize();
      }

      setState(prev => ({ ...prev, ...updates }));
    } catch (error) {
      logger.error('Failed to update performance state:', error);
    }
  };

  /**
   * Perform optimization
   */
  const performOptimization = useCallback(async () => {
    if (state.isOptimizing) return;

    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const startTime = Date.now();

      // Cache optimization
      if (enableCacheOptimization) {
        await CacheManager.cleanup();
        recordMetric({
          name: 'cache_cleanup_duration',
          value: Date.now() - startTime,
          unit: 'ms',
        });
      }

      // Memory optimization
      if (enableMemoryOptimization) {
        await performMemoryOptimization();
      }

      // Update state
      await updatePerformanceState();

      const optimizationDuration = Date.now() - startTime;
      
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        lastOptimization: new Date(),
      }));

      // Track optimization event
      trackEvent('performance_optimization_completed', {
        duration: optimizationDuration,
        cache_size_before: state.cacheSize,
        cache_size_after: await CacheManager.getCacheSize(),
      });

      recordMetric({
        name: 'optimization_duration',
        value: optimizationDuration,
        unit: 'ms',
      });

    } catch (error) {
      logger.error('Performance optimization failed:', error);
      setState(prev => ({ ...prev, isOptimizing: false }));
    }
  }, [state.isOptimizing, state.cacheSize, enableCacheOptimization, enableMemoryOptimization]);

  /**
   * Perform memory optimization
   */
  const performMemoryOptimization = async () => {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear unnecessary caches
      if (enableCacheOptimization) {
        const cacheSize = await CacheManager.getCacheSize();
        const maxCacheSize = 50 * 1024 * 1024; // 50MB

        if (cacheSize > maxCacheSize) {
          await CacheManager.clearCache();
        }
      }

      recordMetric({
        name: 'memory_optimization_completed',
        value: 1,
      });
    } catch (error) {
      logger.error('Memory optimization failed:', error);
    }
  };

  /**
   * Handle app coming to foreground
   */
  const handleAppForeground = async () => {
    try {
      // Update performance metrics
      await updatePerformanceState();

      // Perform optimization if needed
      const timeSinceLastOptimization = state.lastOptimization 
        ? Date.now() - state.lastOptimization.getTime()
        : Infinity;

      if (timeSinceLastOptimization > autoCleanupInterval) {
        await performOptimization();
      }

      trackEvent('app_foreground', {
        time_since_last_optimization: timeSinceLastOptimization,
      });
    } catch (error) {
      logger.error('Failed to handle app foreground:', error);
    }
  };

  /**
   * Handle app going to background
   */
  const handleAppBackground = async () => {
    try {
      // Perform cleanup before going to background
      if (enableCacheOptimization) {
        await CacheManager.cleanup();
      }

      trackEvent('app_background', {
        cache_size: state.cacheSize,
      });
    } catch (error) {
      logger.error('Failed to handle app background:', error);
    }
  };

  /**
   * Get optimization recommendations
   */
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (state.bundleAnalysis) {
      recommendations.push(...state.bundleAnalysis.recommendations);
    }

    // Cache size recommendations
    if (state.cacheSize > 30 * 1024 * 1024) { // 30MB
      recommendations.push('Cache size is large. Consider clearing old cache items.');
    }

    // Network-based recommendations
    if (netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '2g') {
      recommendations.push('Slow network detected. Consider reducing data usage.');
    }

    // Performance recommendations
    if (state.performanceMetrics) {
      if (state.performanceMetrics.firstRenderTime > 3000) {
        recommendations.push('Slow first render time. Consider lazy loading and code splitting.');
      }

      if (state.performanceMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
        recommendations.push('High memory usage detected. Consider memory optimization.');
      }
    }

    return recommendations;
  }, [state, netInfo]);

  /**
   * Force optimization
   */
  const forceOptimization = useCallback(async () => {
    await performOptimization();
  }, [performOptimization]);

  /**
   * Clear all caches
   */
  const clearAllCaches = useCallback(async () => {
    try {
      await CacheManager.clearCache();
      await updatePerformanceState();
      
      trackEvent('cache_cleared_manually');
    } catch (error) {
      logger.error('Failed to clear caches:', error);
    }
  }, []);

  /**
   * Get performance report
   */
  const _getPerformanceReport = useCallback(async () => {
    try {
      const report = await bundleAnalyzer.exportReport();
      return report;
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      return null;
    }
  }, []);

  /**
   * Record user interaction
   */
  const recordInteraction = useCallback(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.recordFirstInteraction();
    }
  }, [enablePerformanceMonitoring]);

  /**
   * Cleanup
   */
  const cleanup = () => {
    if (cleanupInterval.current) {
      clearInterval(cleanupInterval.current);
    }
    
    if (enablePerformanceMonitoring) {
      performanceMonitor.stop();
    }
  };

  return {
    // State
    ...state,
    
    // Actions
    performOptimization: forceOptimization,
    clearAllCaches,
    recordInteraction,
    
    // Analysis
    getOptimizationRecommendations,
    getPerformanceReport,
    
    // Utils
    isSlowNetwork: netInfo.type === 'cellular' && netInfo.details?.cellularGeneration === '2g',
    networkType: netInfo.type,
    isConnected: netInfo.isConnected,
  };
};

/**
 * Hook for component-level performance optimization
 */
export const useComponentPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const { recordMetric } = useMonitoring();

  useEffect(() => {
    renderCount.current += 1;
    
    // Record render metrics
    recordMetric({
      name: `component_${componentName}_render_count`,
      value: renderCount.current,
    });

    // Record mount time on first render
    if (renderCount.current === 1) {
      recordMetric({
        name: `component_${componentName}_mount_time`,
        value: Date.now() - mountTime.current,
        unit: 'ms',
      });
    }
  });

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
  };
};

export default usePerformanceOptimization;
