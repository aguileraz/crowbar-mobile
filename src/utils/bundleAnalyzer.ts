import logger from '../services/loggerService';

/**
 * Utilitários para análise de bundle size e performance
 */

// Tipos
interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  chunks: ChunkInfo[];
  assets: AssetInfo[];
}

interface ModuleInfo {
  name: string;
  size: number;
  gzippedSize: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  isVendor: boolean;
  isAsync: boolean;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  isEntry: boolean;
  isAsync: boolean;
}

interface AssetInfo {
  name: string;
  size: number;
  type: string;
  cached: boolean;
}

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  parseTime: number;
  executeTime: number;
  memoryUsage: number;
  renderTime: number;
}

/**
 * Classe para análise de bundle
 */
class BundleAnalyzer {
  private metrics: Partial<BundleMetrics> = {};
  private performanceMarks: Map<string, number> = new Map();

  /**
   * Iniciar medição de performance
   */
  startMeasurement(name: string): void {
    this.performanceMarks.set(name, Date.now());
  }

  /**
   * Finalizar medição de performance
   */
  endMeasurement(name: string): number {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) {
      logger.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceMarks.delete(name);
    return duration;
  }

  /**
   * Analisar tamanho de módulos importados
   */
  analyzeModuleSize(moduleName: string): Promise<ModuleInfo> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Simular análise de módulo
      // Dynamic imports não são suportados no React Native
      // Vamos retornar uma estimativa
      const loadTime = Date.now() - startTime;
      
      // Estimar tamanho baseado no nome do módulo
      const estimatedSize = this.estimateModuleSize(loadTime, moduleName);
      
      const moduleInfo: ModuleInfo = {
        name: moduleName,
            size: estimatedSize,
            gzippedSize: Math.round(estimatedSize * 0.7), // Estimativa de compressão
            type: this.getModuleType(moduleName),
            isVendor: this.isVendorModule(moduleName),
            isAsync: true,
          };
          
          resolve(moduleInfo);
    });
  }

  /**
   * Estimar tamanho do módulo baseado no tempo de carregamento
   */
  private estimateModuleSize(loadTime: number, moduleName: string): number {
    // Estimativas baseadas em módulos conhecidos
    const sizeEstimates: Record<string, number> = {
      'react': 45000,
      'react-native': 120000,
      'react-redux': 25000,
      '@reduxjs/toolkit': 35000,
      'react-native-paper': 80000,
      '@react-navigation': 60000,
      'formik': 30000,
      'yup': 25000,
      'axios': 15000,
    };

    // Verificar se é um módulo conhecido
    for (const [module, size] of Object.entries(sizeEstimates)) {
      if (moduleName.includes(module)) {
        return size;
      }
    }

    // Estimar baseado no tempo de carregamento
    // Assumindo ~1KB por ms de carregamento (muito aproximado)
    return Math.max(1000, loadTime * 1000);
  }

  /**
   * Determinar tipo do módulo
   */
  private getModuleType(moduleName: string): ModuleInfo['type'] {
    if (moduleName.includes('.css') || moduleName.includes('style')) {
      return 'css';
    }
    if (moduleName.includes('.png') || moduleName.includes('.jpg') || moduleName.includes('image')) {
      return 'image';
    }
    if (moduleName.includes('.ttf') || moduleName.includes('.woff') || moduleName.includes('font')) {
      return 'font';
    }
    if (moduleName.includes('.js') || moduleName.includes('.ts') || moduleName.includes('.tsx')) {
      return 'js';
    }
    return 'other';
  }

  /**
   * Verificar se é módulo vendor
   */
  private isVendorModule(moduleName: string): boolean {
    return moduleName.includes('node_modules') || 
           moduleName.startsWith('@') ||
           ['react', 'redux', 'axios', 'lodash'].some(vendor => moduleName.includes(vendor));
  }

  /**
   * Analisar chunks assíncronos
   */
  analyzeAsyncChunks(): ChunkInfo[] {
    // Em React Native, não temos chunks tradicionais como no web
    // Mas podemos simular baseado em lazy loading
    const chunks: ChunkInfo[] = [
      {
        name: 'main',
        size: 500000, // 500KB estimado
        modules: ['App', 'Navigation', 'Store'],
        isEntry: true,
        isAsync: false,
      },
      {
        name: 'shop',
        size: 150000, // 150KB estimado
        modules: ['ShopScreen', 'BoxCard', 'FilterModal'],
        isEntry: false,
        isAsync: true,
      },
      {
        name: 'profile',
        size: 100000, // 100KB estimado
        modules: ['ProfileScreen', 'UserStatistics', 'AddressForm'],
        isEntry: false,
        isAsync: true,
      },
      {
        name: 'cart',
        size: 80000, // 80KB estimado
        modules: ['CartScreen', 'CheckoutScreen', 'PaymentForm'],
        isEntry: false,
        isAsync: true,
      },
    ];

    return chunks;
  }

  /**
   * Gerar relatório de bundle
   */
  generateBundleReport(): BundleMetrics {
    const chunks = this.analyzeAsyncChunks();
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    return {
      totalSize,
      gzippedSize: Math.round(totalSize * 0.7),
      modules: [], // Seria preenchido com análise real
      chunks,
      assets: [], // Seria preenchido com análise real
    };
  }

  /**
   * Analisar performance de carregamento
   */
  analyzeLoadPerformance(): PerformanceMetrics {
    const navigation = (global as any).performance || {};
    const timing = navigation.timing || {};
    
    return {
      bundleSize: this.metrics.totalSize || 0,
      loadTime: timing.loadEventEnd - timing.navigationStart || 0,
      parseTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart || 0,
      executeTime: timing.loadEventEnd - timing.domContentLoadedEventEnd || 0,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getRenderTime(),
    };
  }

  /**
   * Obter uso de memória
   */
  private getMemoryUsage(): number {
    // Em React Native, não temos performance.memory
    // Retornar estimativa baseada no bundle size
    return (this.metrics.totalSize || 0) * 2; // Estimativa: 2x o tamanho do bundle
  }

  /**
   * Obter tempo de renderização
   */
  private getRenderTime(): number {
    // Simular tempo de renderização
    return Math.random() * 100 + 50; // 50-150ms
  }

  /**
   * Identificar oportunidades de otimização
   */
  identifyOptimizations(): Array<{
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    savings: number;
  }> {
    const report = this.generateBundleReport();
    const optimizations = [];

    // Bundle muito grande
    if (report.totalSize > 1000000) { // > 1MB
      optimizations.push({
        type: 'bundle-size',
        description: 'Bundle size is too large. Consider code splitting and lazy loading.',
        impact: 'high' as const,
        savings: report.totalSize * 0.3, // 30% de economia potencial
      });
    }

    // Muitos chunks síncronos
    const syncChunks = report.chunks.filter(chunk => !chunk.isAsync);
    if (syncChunks.length > 2) {
      optimizations.push({
        type: 'code-splitting',
        description: 'Too many synchronous chunks. Implement more lazy loading.',
        impact: 'medium' as const,
        savings: 100000, // 100KB de economia estimada
      });
    }

    // Chunks grandes
    const largeChunks = report.chunks.filter(chunk => chunk.size > 200000);
    if (largeChunks.length > 0) {
      optimizations.push({
        type: 'chunk-optimization',
        description: 'Some chunks are too large. Consider splitting them further.',
        impact: 'medium' as const,
        savings: 50000, // 50KB de economia estimada
      });
    }

    return optimizations;
  }

  /**
   * Gerar relatório completo
   */
  generateFullReport(): {
    bundle: BundleMetrics;
    performance: PerformanceMetrics;
    optimizations: Array<{
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      savings: number;
    }>;
  } {
    return {
      bundle: this.generateBundleReport(),
      performance: this.analyzeLoadPerformance(),
      optimizations: this.identifyOptimizations(),
    };
  }
}

/**
 * Instância global do analisador
 */
export const bundleAnalyzer = new BundleAnalyzer();

/**
 * Decorator para medir performance de funções
 */
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const measurementName = `${target.constructor.name}.${propertyName}`;
    bundleAnalyzer.startMeasurement(measurementName);
    
    const result = method.apply(this, args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = bundleAnalyzer.endMeasurement(measurementName);
        logger.debug(`${measurementName} took ${duration}ms`);
      });
    } else {
      const duration = bundleAnalyzer.endMeasurement(measurementName);
      logger.debug(`${measurementName} took ${duration}ms`);
      return result;
    }
  };

  return descriptor;
}

/**
 * Hook para monitorar performance de componentes
 */
export const usePerformanceMonitor = (componentName: string) => {
  const [renderCount, setRenderCount] = React.useState(0);
  const [renderTime, setRenderTime] = React.useState(0);
  
  React.useEffect(() => {
    const startTime = Date.now();
    setRenderCount(prev => prev + 1);
    
    return () => {
      const duration = Date.now() - startTime;
      setRenderTime(duration);
      
      if (__DEV__) {
        logger.debug(`${componentName} render #${renderCount + 1} took ${duration}ms`);
      }
    };
  }, [componentName, renderCount]);

  return { renderCount, renderTime };
};

/**
 * Utilitários para análise de dependências
 */
export const analyzeDependencies = () => {
  const packageJson = require('../../package.json');
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  const analysis = {
    total: Object.keys(dependencies).length,
    dev: Object.keys(devDependencies).length,
    large: [] as string[],
    unused: [] as string[],
    outdated: [] as string[],
  };

  // Identificar dependências grandes conhecidas
  const largeDependencies = [
    'react-native-vector-icons',
    'react-native-paper',
    '@react-navigation',
    'react-native-reanimated',
  ];

  analysis.large = Object.keys(dependencies).filter(dep =>
    largeDependencies.some(large => dep.includes(large))
  );

  return analysis;
};

/**
 * Configurações de otimização recomendadas
 */
export const OPTIMIZATION_CONFIG = {
  // Tamanhos máximos recomendados
  maxBundleSize: 1000000, // 1MB
  maxChunkSize: 200000,   // 200KB
  maxAssetSize: 100000,   // 100KB
  
  // Limites de performance
  maxLoadTime: 3000,      // 3s
  maxRenderTime: 100,     // 100ms
  maxMemoryUsage: 50000000, // 50MB
  
  // Configurações de lazy loading
  lazyLoadThreshold: 50000, // 50KB
  preloadCriticalSize: 3,   // 3 componentes críticos
  
  // Configurações de cache
  cacheMaxAge: 86400000,    // 24 horas
  cacheMaxSize: 100,        // 100 entradas
};

export default bundleAnalyzer;
