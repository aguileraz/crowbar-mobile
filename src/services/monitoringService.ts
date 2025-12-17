/**
 * Crowbar Mobile - Production Monitoring Service
 *
 * ⚠️ MIGRATION NOTICE:
 * Firebase Crashlytics e Performance Monitoring foram REMOVIDOS.
 *
 * Monitoring agora usa:
 * - Logging local via loggerService
 * - Performance metrics armazenados em memória
 * - Envio de métricas para backend API (TODO: implementar)
 *
 * Para produção, considerar integração com:
 * - Sentry (crash reporting)
 * - Datadog / New Relic (APM)
 * - Custom backend analytics API
 */

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
   * Initialize Crashlytics (STUB - Firebase removido)
   */
  private async initializeCrashlytics(): Promise<void> {
    try {
      logger.debug('📊 Monitoring initialized (local logging only)');
      logger.debug('Environment:', config.ENVIRONMENT);
      logger.debug('App Version:', config.APP_CONFIG.VERSION || '1.0.0');
      logger.debug('Platform:', Platform.OS);

      // TODO: Integrar com Sentry ou serviço de crash reporting
    } catch (error) {
      logger.error('Failed to initialize monitoring:', error);
    }
  }

  /**
   * Initialize Performance Monitoring (STUB - Firebase removido)
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      // Performance monitoring local (in-memory)
      const appStartTime = Date.now();

      // Simular trace de app start
      setTimeout(() => {
        const appStartDuration = Date.now() - appStartTime;
        logger.debug(`⚡ App started in ${appStartDuration}ms`);

        this.recordMetric({
          name: 'app_start',
          value: appStartDuration,
          unit: 'ms',
        });
      }, 3000);

      logger.debug('⚡ Performance Monitoring initialized (local)');
    } catch (error) {
      logger.error('Failed to initialize Performance Monitoring:', error);
    }
  }

  /**
   * Initialize Analytics (STUB - Firebase removido, usar analyticsService)
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      logger.debug('📈 Analytics initialized (use analyticsService)');
      logger.debug('Environment:', config.ENVIRONMENT);
      logger.debug('App Version:', config.APP_CONFIG.VERSION || '1.0.0');
      logger.debug('Platform:', Platform.OS);

      // Analytics real está em src/services/analyticsService.ts
    } catch (error) {
      logger.error('Failed to initialize Analytics:', error);
    }
  }

  /**
   * Log error (local logging, sem Crashlytics)
   */
  logError(error: Error, context?: ErrorContext): void {
    if (!config.FEATURES.CRASHLYTICS_ENABLED) return;

    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: context || {},
        timestamp: new Date().toISOString(),
      };

      logger.error('🚨 Error logged:', errorData);

      // TODO: Enviar erro para backend API ou Sentry
    } catch (logError) {
      logger.error('Failed to log error:', logError);
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
   * Set user identifier (local logging)
   */
  async setUserId(userId: string): Promise<void> {
    try {
      logger.debug('👤 User ID set for monitoring:', userId);

      // TODO: Enviar user ID para backend API ou Sentry
    } catch (error) {
      logger.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user properties (local logging)
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      logger.debug('👤 User properties set:', properties);

      // TODO: Enviar propriedades para backend API ou Sentry
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }

  /**
   * Start performance trace (local timing)
   */
  async startTrace(traceName: string, attributes?: Record<string, string>): Promise<void> {
    if (!config.FEATURES.PERFORMANCE_MONITORING) return;

    try {
      const trace = {
        startTime: Date.now(),
        attributes: attributes || {},
      };

      this.activeTraces.set(traceName, trace);
      logger.debug(`⏱️ Started trace: ${traceName}`);
    } catch (error) {
      logger.error(`Failed to start trace ${traceName}:`, error);
    }
  }

  /**
   * Stop performance trace (local timing)
   */
  async stopTrace(traceName: string): Promise<void> {
    if (!config.FEATURES.PERFORMANCE_MONITORING) return;

    try {
      const trace = this.activeTraces.get(traceName);
      if (trace) {
        const duration = Date.now() - trace.startTime;

        this.recordMetric({
          name: traceName,
          value: duration,
          unit: 'ms',
          attributes: trace.attributes,
        });

        this.activeTraces.delete(traceName);
        logger.debug(`⏹️ Stopped trace: ${traceName} (${duration}ms)`);
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
   * Track screen view (local logging, usar analyticsService)
   */
  async trackScreenView(screenName: string, _screenClass?: string): Promise<void> {
    if (!config.FEATURES.ANALYTICS_ENABLED) return;

    try {
      logger.debug(`📱 Screen view tracked: ${screenName}`);

      // Use analyticsService.logScreenView() para analytics real
    } catch (error) {
      logger.error('Failed to track screen view:', error);
    }
  }

  /**
   * Track custom event (local logging, usar analyticsService)
   */
  async trackEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    if (!config.FEATURES.ANALYTICS_ENABLED) return;

    try {
      logger.debug(`📈 Event tracked: ${eventName}`, parameters);

      // Use analyticsService.logEvent() para analytics real
    } catch (error) {
      logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track app crash (local logging)
   */
  trackCrash(error: Error, isFatal: boolean = true): void {
    if (!config.FEATURES.CRASHLYTICS_ENABLED) return;

    try {
      const crashData = {
        message: error.message,
        stack: error.stack,
        isFatal,
        timestamp: new Date().toISOString(),
      };

      logger.error(`💥 Crash tracked:`, crashData);

      // TODO: Enviar crash report para backend API ou Sentry
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

    logger.debug('🧪 Testing crash reporting (simulated)...');
    const testError = new Error('Test crash - Firebase Crashlytics removido');
    this.trackCrash(testError, true);
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