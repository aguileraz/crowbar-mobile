/**
 * Crowbar Mobile - Production Monitoring Service
 * Integrates Crashlytics, Performance Monitoring, and custom analytics
 */

import crashlytics from '@react-native-firebase/crashlytics';
import perf from '@react-native-firebase/perf';
import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';
import config from '../../config/environments';
import logger from './loggerService';

// Types
interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

interface PerformanceTrace {
  name: string;
  startTime: number;
  attributes?: Record<string, string>;
}

interface CustomMetric {
  name: string;
  value: number;
  unit?: string;
  attributes?: Record<string, string>;
}

interface UserProperties {
  userId?: string;
  userType?: 'free' | 'premium';
  appVersion?: string;
  platform?: string;
  deviceModel?: string;
}

/**
 * Production Monitoring Service
 */
class MonitoringService {
  private isInitialized = false;
  private activeTraces = new Map<string, any>();
  private performanceMetrics = new Map<string, number[]>();

  /**
   * Initialize monitoring services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Crashlytics
      if (config.FEATURES.CRASHLYTICS_ENABLED) {
        await this.initializeCrashlytics();
      }

      // Initialize Performance Monitoring
      if (config.FEATURES.PERFORMANCE_MONITORING) {
        await this.initializePerformanceMonitoring();
      }

      // Initialize Analytics
      if (config.FEATURES.ANALYTICS_ENABLED) {
        await this.initializeAnalytics();
      }

      this.isInitialized = true;
      logger.debug('🔍 Monitoring services initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring services:', error);
    }
  }

  /**
   * Initialize Crashlytics
   */
  private async initializeCrashlytics(): Promise<void> {
    try {
      // Enable Crashlytics collection
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // Set custom keys
      await crashlytics().setAttributes({
        environment: config.ENVIRONMENT,
        appVersion: config.APP_CONFIG.VERSION || '1.0.0',
        platform: Platform.OS,
      });

      logger.debug('📊 Crashlytics initialized');
    } catch (error) {
      logger.error('Failed to initialize Crashlytics:', error);
    }
  }

  /**
   * Initialize Performance Monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      // Enable Performance Monitoring
      await perf().setPerformanceCollectionEnabled(true);

      // Start app start trace
      const appStartTrace = perf().newTrace('app_start');
      await appStartTrace.start();

      // Stop after a delay (app is considered started)
      setTimeout(async () => {
        await appStartTrace.stop();
      }, 3000);

      logger.debug('⚡ Performance Monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize Performance Monitoring:', error);
    }
  }

  /**
   * Initialize Analytics
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      // Enable Analytics collection
      await analytics().setAnalyticsCollectionEnabled(true);

      // Set default parameters
      await analytics().setDefaultEventParameters({
        environment: config.ENVIRONMENT,
        app_version: config.APP_CONFIG.VERSION || '1.0.0',
        platform: Platform.OS,
      });

      logger.debug('📈 Analytics initialized');
    } catch (error) {
      logger.error('Failed to initialize Analytics:', error);
    }
  }

  /**
   * Log error to Crashlytics
   */
  logError(error: Error, context?: ErrorContext): void {
    if (!config.FEATURES.CRASHLYTICS_ENABLED) return;

    try {
      // Set context attributes
      if (context) {
        crashlytics().setAttributes({
          screen: context.screen || 'unknown',
          action: context.action || 'unknown',
          userId: context.userId || 'anonymous',
        });

        // Set additional data
        if (context.additionalData) {
          Object.entries(context.additionalData).forEach(([key, value]) => {
            crashlytics().setAttribute(key, String(value));
          });
        }
      }

      // Log the error
      crashlytics().recordError(error);

      logger.error('🚨 Error logged to Crashlytics:', error.message);
    } catch (logError) {
      logger.error('Failed to log error to Crashlytics:', logError);
    }
  }

  /**
   * Log non-fatal error
   */
  logNonFatalError(message: string, context?: ErrorContext): void {
    if (!config.FEATURES.CRASHLYTICS_ENABLED) return;

    try {
      const error = new Error(message);
      error.name = 'NonFatalError';
      
      this.logError(error, context);
    } catch (logError) {
      logger.error('Failed to log non-fatal error:', logError);
    }
  }

  /**
   * Set user identifier
   */
  async setUserId(userId: string): Promise<void> {
    try {
      if (config.FEATURES.CRASHLYTICS_ENABLED) {
        await crashlytics().setUserId(userId);
      }

      if (config.FEATURES.ANALYTICS_ENABLED) {
        await analytics().setUserId(userId);
      }

      logger.debug('👤 User ID set for monitoring');
    } catch (error) {
      logger.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      if (config.FEATURES.CRASHLYTICS_ENABLED) {
        await crashlytics().setAttributes({
          userType: properties.userType || 'free',
          appVersion: properties.appVersion || '1.0.0',
          platform: properties.platform || Platform.OS,
          deviceModel: properties.deviceModel || 'unknown',
        });
      }

      if (config.FEATURES.ANALYTICS_ENABLED) {
        await analytics().setUserProperties({
          user_type: properties.userType || 'free',
          app_version: properties.appVersion || '1.0.0',
          platform: properties.platform || Platform.OS,
          device_model: properties.deviceModel || 'unknown',
        });
      }

      logger.debug('👤 User properties set for monitoring');
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }

  /**
   * Start performance trace
   */
  async startTrace(traceName: string, attributes?: Record<string, string>): Promise<void> {
    if (!config.FEATURES.PERFORMANCE_MONITORING) return;

    try {
      const trace = perf().newTrace(traceName);
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
      }

      await trace.start();
      this.activeTraces.set(traceName, trace);

      logger.debug(`⏱️ Started trace: ${traceName}`);
    } catch (error) {
      logger.error(`Failed to start trace ${traceName}:`, error);
    }
  }

  /**
   * Stop performance trace
   */
  async stopTrace(traceName: string): Promise<void> {
    if (!config.FEATURES.PERFORMANCE_MONITORING) return;

    try {
      const trace = this.activeTraces.get(traceName);
      if (trace) {
        await trace.stop();
        this.activeTraces.delete(traceName);
        logger.debug(`⏹️ Stopped trace: ${traceName}`);
      }
    } catch (error) {
      logger.error(`Failed to stop trace ${traceName}:`, error);
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(metric: CustomMetric): void {
    if (!config.FEATURES.PERFORMANCE_MONITORING) return;

    try {
      // Store metric for aggregation
      const existingValues = this.performanceMetrics.get(metric.name) || [];
      existingValues.push(metric.value);
      this.performanceMetrics.set(metric.name, existingValues);

      // Log to console in development
      if (config.IS_DEV) {
        logger.debug(`📊 Metric recorded: ${metric.name} = ${metric.value}${metric.unit || ''}`);
      }
    } catch (error) {
      logger.error('Failed to record metric:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!config.FEATURES.ANALYTICS_ENABLED) return;

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      logger.debug(`📱 Screen view tracked: ${screenName}`);
    } catch (error) {
      logger.error('Failed to track screen view:', error);
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    if (!config.FEATURES.ANALYTICS_ENABLED) return;

    try {
      await analytics().logEvent(eventName, parameters);

      logger.debug(`📈 Event tracked: ${eventName}`);
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track app crash
   */
  trackCrash(error: Error, isFatal: boolean = true): void {
    if (!config.FEATURES.CRASHLYTICS_ENABLED) return;

    try {
      if (isFatal) {
        crashlytics().crash();
      } else {
        crashlytics().recordError(error);
      }

      logger.debug(`💥 Crash tracked: ${error.message}`);
    } catch (logError) {
      logger.error('Failed to track crash:', logError);
    }
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceMetrics(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, any> = {};

    this.performanceMetrics.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        summary[name] = {
          count: values.length,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });

    return summary;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
    logger.debug('🧹 Performance metrics cleared');
  }

  /**
   * Test crash reporting (development only)
   */
  testCrash(): void {
    if (!config.IS_DEV) {
      logger.warn('Crash testing is only available in development');
      return;
    }

    logger.debug('🧪 Testing crash reporting...');
    crashlytics().crash();
  }

  /**
   * Test non-fatal error reporting
   */
  testNonFatalError(): void {
    if (!config.IS_DEV) {
      logger.warn('Error testing is only available in development');
      return;
    }

    logger.debug('🧪 Testing non-fatal error reporting...');
    this.logNonFatalError('Test non-fatal error', {
      screen: 'TestScreen',
      action: 'test_error',
      additionalData: { testMode: true },
    });
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isInitialized: boolean;
    crashlyticsEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    analyticsEnabled: boolean;
    activeTraces: string[];
    metricsCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      crashlyticsEnabled: config.FEATURES.CRASHLYTICS_ENABLED,
      performanceMonitoringEnabled: config.FEATURES.PERFORMANCE_MONITORING,
      analyticsEnabled: config.FEATURES.ANALYTICS_ENABLED,
      activeTraces: Array.from(this.activeTraces.keys()),
      metricsCount: this.performanceMetrics.size,
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export types
export type {
  ErrorContext,
  PerformanceTrace,
  CustomMetric,
  UserProperties,
};

export default monitoringService;
