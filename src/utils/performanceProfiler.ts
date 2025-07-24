/**
 * Performance Profiler para Crowbar Mobile
 * Monitora e reporta métricas de performance em tempo real
 */

import { InteractionManager, AppState, AppStateStatus } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import logger from '../services/loggerService';

interface PerformanceMetrics {
  appStartTime: number;
  coldStartTime?: number;
  warmStartTime?: number;
  lastInteractionTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  fps: number;
  jsThreadBusy: boolean;
  screenTransitions: Record<string, number>;
  apiCallDurations: Record<string, number[]>;
  componentRenderTimes: Record<string, number[]>;
  bundleSize?: number;
}

interface PerformanceThresholds {
  coldStartTime: number; // ms
  warmStartTime: number; // ms
  screenTransitionTime: number; // ms
  apiCallTimeout: number; // ms
  memoryLimit: number; // MB
  minFPS: number;
}

class PerformanceProfiler {
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private startTime: number;
  private lastFrameTime: number;
  private frameCount: number;
  private appStateSubscription: any;
  private backgroundTime?: number;
  private isProfilerEnabled: boolean;

  constructor() {
    this.startTime = Date.now();
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    this.isProfilerEnabled = __DEV__ || this.isPerformanceTestMode();

    this.metrics = {
      appStartTime: this.startTime,
      lastInteractionTime: this.startTime,
      memoryUsage: 0,
      fps: 60,
      jsThreadBusy: false,
      screenTransitions: {},
      apiCallDurations: {},
      componentRenderTimes: {},
    };

    this.thresholds = {
      coldStartTime: 3000, // 3 seconds
      warmStartTime: 1500, // 1.5 seconds
      screenTransitionTime: 300, // 300ms
      apiCallTimeout: 5000, // 5 seconds
      memoryLimit: 150, // 150MB
      minFPS: 50, // 50 FPS minimum
    };

    if (this.isProfilerEnabled) {
      this.setupMonitoring();
    }
  }

  /**
   * Check if running in performance test mode
   */
  private isPerformanceTestMode(): boolean {
    return process.env.PERFORMANCE_TEST === 'true';
  }

  /**
   * Setup performance monitoring
   */
  private setupMonitoring() {
    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // Monitor FPS
    this.startFPSMonitoring();

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Log initial device info
    this.logDeviceInfo();
  }

  /**
   * Handle app state changes for warm start measurement
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      this.backgroundTime = Date.now();
    } else if (nextAppState === 'active' && this.backgroundTime) {
      const warmStartTime = Date.now() - this.backgroundTime;
      this.metrics.warmStartTime = warmStartTime;
      
      if (warmStartTime > this.thresholds.warmStartTime) {
        logger.warn(`Warm start time exceeded threshold: ${warmStartTime}ms`, 'Performance');
      }
      
      this.backgroundTime = undefined;
    }
  };

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring() {
    const measureFPS = () => {
      const now = Date.now();
      const delta = now - this.lastFrameTime;
      
      if (delta >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
        
        if (this.metrics.fps < this.thresholds.minFPS) {
          logger.warn(`Low FPS detected: ${this.metrics.fps}`, 'Performance');
        }
        
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      this.frameCount++;
      
      if (this.isProfilerEnabled) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  private async startMemoryMonitoring() {
    const checkMemory = async () => {
      try {
        // Get memory usage (React Native doesn't have direct API, using approximation)
        const memoryInfo = await this.getMemoryUsage();
        this.metrics.memoryUsage = memoryInfo.usedMemory;
        
        if (memoryInfo.usedMemory > this.thresholds.memoryLimit) {
          logger.warn(
            `High memory usage: ${memoryInfo.usedMemory}MB (limit: ${this.thresholds.memoryLimit}MB)`,
            'Performance'
          );
        }
      } catch (error) {
        logger.debug('Error monitoring memory:', 'Performance', error);
      }
      
      // Check every 30 seconds
      if (this.isProfilerEnabled) {
        setTimeout(checkMemory, 30000);
      }
    };
    
    checkMemory();
  }

  /**
   * Get memory usage (approximation)
   */
  private async getMemoryUsage(): Promise<{ usedMemory: number; totalMemory: number }> {
    try {
      // This is a simplified approach - in production you might use native modules
      const totalMemory = await DeviceInfo.getTotalMemory();
      const maxMemory = await DeviceInfo.getMaxMemory();
      
      // Rough estimation
      const usedMemory = Math.round((totalMemory - maxMemory) / (1024 * 1024));
      
      return {
        usedMemory,
        totalMemory: Math.round(totalMemory / (1024 * 1024)),
      };
    } catch (error) {
      return { usedMemory: 0, totalMemory: 0 };
    }
  }

  /**
   * Log device information
   */
  private async logDeviceInfo() {
    try {
      const deviceInfo = {
        brand: DeviceInfo.getBrand(),
        model: await DeviceInfo.getDeviceName(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        apiLevel: await DeviceInfo.getApiLevel(),
        totalMemory: Math.round((await DeviceInfo.getTotalMemory()) / (1024 * 1024)),
        isEmulator: await DeviceInfo.isEmulator(),
      };
      
      logger.info('Device Info:', 'Performance', deviceInfo);
    } catch (error) {
      logger.debug('Error getting device info:', 'Performance', error);
    }
  }

  /**
   * Measure cold start time (call this when app is ready)
   */
  markColdStartComplete() {
    if (!this.metrics.coldStartTime) {
      this.metrics.coldStartTime = Date.now() - this.startTime;
      
      logger.info(`Cold start time: ${this.metrics.coldStartTime}ms`, 'Performance');
      
      if (this.metrics.coldStartTime > this.thresholds.coldStartTime) {
        logger.warn(
          `Cold start time exceeded threshold: ${this.metrics.coldStartTime}ms (limit: ${this.thresholds.coldStartTime}ms)`,
          'Performance'
        );
      }
    }
  }

  /**
   * Measure screen transition time
   */
  startScreenTransition(screenName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      if (!this.metrics.screenTransitions[screenName]) {
        this.metrics.screenTransitions[screenName] = duration;
      } else {
        // Keep average
        this.metrics.screenTransitions[screenName] = 
          (this.metrics.screenTransitions[screenName] + duration) / 2;
      }
      
      if (duration > this.thresholds.screenTransitionTime) {
        logger.warn(
          `Slow screen transition to ${screenName}: ${duration}ms`,
          'Performance'
        );
      }
      
      logger.debug(`Screen transition to ${screenName}: ${duration}ms`, 'Performance');
    };
  }

  /**
   * Measure API call duration
   */
  startAPICall(endpoint: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      if (!this.metrics.apiCallDurations[endpoint]) {
        this.metrics.apiCallDurations[endpoint] = [];
      }
      
      this.metrics.apiCallDurations[endpoint].push(duration);
      
      // Keep only last 10 measurements
      if (this.metrics.apiCallDurations[endpoint].length > 10) {
        this.metrics.apiCallDurations[endpoint].shift();
      }
      
      if (duration > this.thresholds.apiCallTimeout) {
        logger.warn(`Slow API call to ${endpoint}: ${duration}ms`, 'Performance');
      }
      
      logger.api('GET', endpoint, 200, duration);
    };
  }

  /**
   * Measure component render time
   */
  startComponentRender(componentName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      if (!this.metrics.componentRenderTimes[componentName]) {
        this.metrics.componentRenderTimes[componentName] = [];
      }
      
      this.metrics.componentRenderTimes[componentName].push(duration);
      
      // Keep only last 10 measurements
      if (this.metrics.componentRenderTimes[componentName].length > 10) {
        this.metrics.componentRenderTimes[componentName].shift();
      }
      
      if (duration > 16) { // More than one frame (60fps = ~16ms per frame)
        logger.debug(
          `Slow component render ${componentName}: ${duration}ms`,
          'Performance'
        );
      }
    };
  }

  /**
   * Check if JS thread is busy
   */
  checkJSThreadBusy(callback: (busy: boolean) => void) {
    const start = Date.now();
    
    InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - start;
      const isBusy = duration > 50; // If it takes more than 50ms, thread is busy
      
      this.metrics.jsThreadBusy = isBusy;
      callback(isBusy);
      
      if (isBusy) {
        logger.warn(`JS thread busy: ${duration}ms delay`, 'Performance');
      }
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    summary: {
      coldStartTime?: number;
      warmStartTime?: number;
      averageFPS: number;
      memoryUsage: number;
      slowScreens: string[];
      slowAPIs: string[];
    };
    details: PerformanceMetrics;
    thresholds: PerformanceThresholds;
  } {
    const slowScreens = Object.entries(this.metrics.screenTransitions)
      .filter(([_, time]) => time > this.thresholds.screenTransitionTime)
      .map(([screen]) => screen);
    
    const slowAPIs = Object.entries(this.metrics.apiCallDurations)
      .filter(([_, durations]) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        return avg > this.thresholds.apiCallTimeout;
      })
      .map(([api]) => api);
    
    return {
      summary: {
        coldStartTime: this.metrics.coldStartTime,
        warmStartTime: this.metrics.warmStartTime,
        averageFPS: this.metrics.fps,
        memoryUsage: this.metrics.memoryUsage,
        slowScreens,
        slowAPIs,
      },
      details: this.metrics,
      thresholds: this.thresholds,
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.isProfilerEnabled = false;
  }
}

// Singleton instance
export const performanceProfiler = new PerformanceProfiler();

// Hook for React components
export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    const endMeasure = performanceProfiler.startComponentRender(componentName);
    return endMeasure;
  }, [componentName]);
};