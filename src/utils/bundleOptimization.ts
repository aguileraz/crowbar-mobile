/**
 * Crowbar Mobile - Bundle Optimization Utilities
 * Tools for analyzing and optimizing bundle size and performance
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface BundleAnalysis {
  totalSize: number;
  jsSize: number;
  assetsSize: number;
  modules: ModuleInfo[];
  recommendations: string[];
}

interface ModuleInfo {
  name: string;
  size: number;
  type: 'js' | 'asset' | 'native';
  isLazy: boolean;
  loadTime?: number;
}

interface PerformanceMetrics {
  bundleLoadTime: number;
  firstRenderTime: number;
  interactionTime: number;
  memoryUsage: number;
  jsHeapSize?: number;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableAssetOptimization: boolean;
  enableTreeShaking: boolean;
  minChunkSize: number;
  maxChunkSize: number;
}

/**
 * Bundle Analyzer
 */
class BundleAnalyzer {
  private metrics: PerformanceMetrics[] = [];
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableAssetOptimization: true,
      enableTreeShaking: true,
      minChunkSize: 20000, // 20KB
      maxChunkSize: 244000, // 244KB (recommended for mobile)
      ...config,
    };
  }

  /**
   * Analyze current bundle
   */
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    const analysis: BundleAnalysis = {
      totalSize: 0,
      jsSize: 0,
      assetsSize: 0,
      modules: [],
      recommendations: [],
    };

    try {
      // Get bundle info from Metro (development only)
      if (__DEV__) {
        const bundleInfo = await this.getBundleInfo();
        analysis.totalSize = bundleInfo.totalSize;
        analysis.jsSize = bundleInfo.jsSize;
        analysis.assetsSize = bundleInfo.assetsSize;
        analysis.modules = bundleInfo.modules;
      }

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Failed to analyze bundle:', error);
      return analysis;
    }
  }

  /**
   * Get bundle information (development only)
   */
  private async getBundleInfo(): Promise<{
    totalSize: number;
    jsSize: number;
    assetsSize: number;
    modules: ModuleInfo[];
  }> {
    // This would integrate with Metro bundler in development
    // For now, return mock data
    return {
      totalSize: 2500000, // 2.5MB
      jsSize: 1800000,    // 1.8MB
      assetsSize: 700000, // 700KB
      modules: [
        {
          name: 'react-native',
          size: 500000,
          type: 'js',
          isLazy: false,
        },
        {
          name: 'react-navigation',
          size: 200000,
          type: 'js',
          isLazy: false,
        },
        {
          name: 'react-native-paper',
          size: 300000,
          type: 'js',
          isLazy: false,
        },
        {
          name: 'redux-toolkit',
          size: 150000,
          type: 'js',
          isLazy: false,
        },
        {
          name: 'app-screens',
          size: 400000,
          type: 'js',
          isLazy: true,
        },
        {
          name: 'app-assets',
          size: 700000,
          type: 'asset',
          isLazy: false,
        },
      ],
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check total bundle size
    if (analysis.totalSize > 5000000) { // 5MB
      recommendations.push('Bundle size is large (>5MB). Consider code splitting and lazy loading.');
    }

    // Check JS bundle size
    if (analysis.jsSize > 3000000) { // 3MB
      recommendations.push('JavaScript bundle is large (>3MB). Consider removing unused dependencies.');
    }

    // Check asset size
    if (analysis.assetsSize > 2000000) { // 2MB
      recommendations.push('Assets are large (>2MB). Consider image optimization and compression.');
    }

    // Check for large modules
    const largeModules = analysis.modules.filter(m => m.size > 500000);
    if (largeModules.length > 0) {
      recommendations.push(`Large modules detected: ${largeModules.map(m => m.name).join(', ')}`);
    }

    // Check lazy loading usage
    const nonLazyScreens = analysis.modules.filter(m => 
      m.name.includes('screen') && !m.isLazy
    );
    if (nonLazyScreens.length > 0) {
      recommendations.push('Consider lazy loading for screen components.');
    }

    return recommendations;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now(),
    } as any);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageBundleLoadTime: number;
    averageFirstRenderTime: number;
    averageInteractionTime: number;
    averageMemoryUsage: number;
    totalSamples: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageBundleLoadTime: 0,
        averageFirstRenderTime: 0,
        averageInteractionTime: 0,
        averageMemoryUsage: 0,
        totalSamples: 0,
      };
    }

    const sum = this.metrics.reduce(
      (acc, metric) => ({
        bundleLoadTime: acc.bundleLoadTime + metric.bundleLoadTime,
        firstRenderTime: acc.firstRenderTime + metric.firstRenderTime,
        interactionTime: acc.interactionTime + metric.interactionTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
      }),
      { bundleLoadTime: 0, firstRenderTime: 0, interactionTime: 0, memoryUsage: 0 }
    );

    const count = this.metrics.length;

    return {
      averageBundleLoadTime: sum.bundleLoadTime / count,
      averageFirstRenderTime: sum.firstRenderTime / count,
      averageInteractionTime: sum.interactionTime / count,
      averageMemoryUsage: sum.memoryUsage / count,
      totalSamples: count,
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export analysis report
   */
  async exportReport(): Promise<string> {
    const analysis = await this.analyzeBundleSize();
    const stats = this.getPerformanceStats();

    const report = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      bundleAnalysis: analysis,
      performanceStats: stats,
      config: this.config,
    };

    return JSON.stringify(report, null, 2);
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  private startTime: number = Date.now();
  private firstRenderTime?: number;
  private interactionTime?: number;
  private memoryCheckInterval?: NodeJS.Timeout;

  /**
   * Start monitoring
   */
  start(): void {
    this.startTime = Date.now();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  /**
   * Record first render
   */
  recordFirstRender(): void {
    if (!this.firstRenderTime) {
      this.firstRenderTime = Date.now() - this.startTime;
    }
  }

  /**
   * Record first interaction
   */
  recordFirstInteraction(): void {
    if (!this.interactionTime) {
      this.interactionTime = Date.now() - this.startTime;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      bundleLoadTime: this.firstRenderTime || 0,
      firstRenderTime: this.firstRenderTime || 0,
      interactionTime: this.interactionTime || 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      jsHeapSize: this.getJSHeapSize(),
    };
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    this.memoryCheckInterval = setInterval(() => {
      const memoryUsage = this.getCurrentMemoryUsage();
      
      // Log warning if memory usage is high
      if (memoryUsage > 100 * 1024 * 1024) { // 100MB
        console.warn(`High memory usage detected: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    // This would use native modules to get actual memory usage
    // For now, return a mock value
    return Math.random() * 50 * 1024 * 1024; // Random value up to 50MB
  }

  /**
   * Get JS heap size
   */
  private getJSHeapSize(): number | undefined {
    // This would use performance.memory if available
    // Not available in React Native by default
    return undefined;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }
}

/**
 * Cache Manager for optimized resource loading
 */
class CacheManager {
  private static readonly CACHE_KEY_PREFIX = '@crowbar_cache_';
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Set cache item
   */
  static async setItem(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 24 * 60 * 60 * 1000, // 24 hours default
        version: this.CACHE_VERSION,
      };

      await AsyncStorage.setItem(
        `${this.CACHE_KEY_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Failed to set cache item:', error);
    }
  }

  /**
   * Get cache item
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_KEY_PREFIX}${key}`);
      
      if (!cached) {
        return null;
      }

      const cacheItem = JSON.parse(cached);

      // Check version
      if (cacheItem.version !== this.CACHE_VERSION) {
        await this.removeItem(key);
        return null;
      }

      // Check TTL
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        await this.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cache item:', error);
      return null;
    }
  }

  /**
   * Remove cache item
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cache item:', error);
    }
  }

  /**
   * Clear all cache
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size
   */
  static async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Cleanup old cache items
   */
  static async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const cacheItem = JSON.parse(cached);
            
            // Remove expired items
            if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
              await AsyncStorage.removeItem(key);
            }
            
            // Remove items with old version
            if (cacheItem.version !== this.CACHE_VERSION) {
              await AsyncStorage.removeItem(key);
            }
          } catch (parseError) {
            // Remove corrupted items
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Check total cache size and remove oldest items if needed
      const cacheSize = await this.getCacheSize();
      if (cacheSize > this.MAX_CACHE_SIZE) {
        await this.trimCache();
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Trim cache to fit size limit
   */
  private static async trimCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      // Get all cache items with timestamps
      const cacheItems: Array<{ key: string; timestamp: number }> = [];
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const cacheItem = JSON.parse(cached);
            cacheItems.push({ key, timestamp: cacheItem.timestamp });
          } catch (parseError) {
            // Remove corrupted items
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Sort by timestamp (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest items until cache size is acceptable
      let currentSize = await this.getCacheSize();
      let index = 0;

      while (currentSize > this.MAX_CACHE_SIZE * 0.8 && index < cacheItems.length) {
        await AsyncStorage.removeItem(cacheItems[index].key);
        currentSize = await this.getCacheSize();
        index++;
      }
    } catch (error) {
      console.error('Failed to trim cache:', error);
    }
  }
}

// Export instances
export const bundleAnalyzer = new BundleAnalyzer();
export const performanceMonitor = new PerformanceMonitor();

// Export classes and utilities
export {
  BundleAnalyzer,
  PerformanceMonitor,
  CacheManager,
};

// Export types
export type {
  BundleAnalysis,
  ModuleInfo,
  PerformanceMetrics,
  OptimizationConfig,
};
