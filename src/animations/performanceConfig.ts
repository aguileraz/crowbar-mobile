/**
 * Configurações de otimização de performance para animações
 */

import { configureReanimatedLogger } from 'react-native-reanimated';

// Configurar logger do Reanimated para produção
if (__DEV__) {
  configureReanimatedLogger({
    strict: false, // Desabilitar modo strict em desenvolvimento para melhor debugging
  });
} else {
  configureReanimatedLogger({
    strict: true, // Habilitar modo strict em produção
  });
}

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  // Usar driver nativo sempre que possível
  useNativeDriver: true,
  
  // Limitar FPS para economizar bateria
  maxFPS: 60,
  
  // Configurações de memória
  animation: {
    // Limpar animações não utilizadas após este tempo (ms)
    cleanupDelay: 5000,
    
    // Máximo de animações simultâneas
    maxConcurrent: 10,
  },
  
  // Configurações de gesture
  gesture: {
    // Threshold mínimo para ativar gestos (pixels)
    minDistance: 5,
    
    // Tempo máximo para detectar tap (ms)
    maxTapDuration: 250,
    
    // Ativar otimizações de gesture handler
    enableOptimizations: true,
  },
  
  // Configurações de scroll
  scroll: {
    // Throttle para eventos de scroll (ms)
    throttle: 16, // ~60fps
    
    // Desabilitar animações durante scroll rápido
    disableOnFastScroll: true,
    
    // Velocidade mínima para considerar "scroll rápido"
    fastScrollThreshold: 1000,
  },
  
  // Configurações de imagem
  image: {
    // Lazy loading de imagens em listas
    enableLazyLoading: true,
    
    // Fade-in ao carregar imagens
    fadeInDuration: 200,
    
    // Cache de imagens
    enableCache: true,
  },
};

// Helpers de performance
export const performanceHelpers = {
  /**
   * Debounce para animações
   */
  debounceAnimation: (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },
  
  /**
   * Throttle para animações
   */
  throttleAnimation: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  
  /**
   * Verificar se deve executar animação baseado em performance
   */
  shouldAnimate: (complexity: 'low' | 'medium' | 'high' = 'medium'): boolean => {
    // Em dispositivos com baixa performance, pular animações complexas
    const lowPerformance = false; // Implementar detecção real de performance
    
    if (lowPerformance) {
      return complexity === 'low';
    }
    
    return true;
  },
  
  /**
   * Otimizar valor para GPU
   */
  optimizeForGPU: (value: number): number => {
    // Arredondar para evitar sub-pixel rendering
    return Math.round(value);
  },
};

// Configurações específicas por plataforma
export const platformConfig = {
  ios: {
    // iOS geralmente tem melhor performance para animações
    enableComplexAnimations: true,
    enableShadows: true,
    enableBlur: true,
  },
  android: {
    // Android pode precisar de otimizações extras
    enableComplexAnimations: true,
    enableShadows: false, // Shadows são caras no Android
    enableBlur: false, // Blur é muito caro no Android
  },
};

// Best practices para performance
export const performanceTips = {
  /**
   * 1. Sempre use useNativeDriver: true quando possível
   * 2. Evite animações em propriedades de layout (width, height, padding, margin)
   * 3. Use transform e opacity para melhor performance
   * 4. Limite o número de animações simultâneas
   * 5. Use InteractionManager para animações pesadas
   * 6. Implemente lazy loading para listas longas
   * 7. Use FlatList ou VirtualizedList para listas grandes
   * 8. Evite re-renders desnecessários com React.memo
   * 9. Use worklets para cálculos complexos
   * 10. Monitore performance com Flipper ou React DevTools
   */
};

// Configuração de monitoramento
export const monitoringConfig = {
  // Habilitar logs de performance em desenvolvimento
  enablePerformanceLogs: __DEV__,
  
  // Métricas para monitorar
  metrics: {
    fps: true,
    jsFrameRate: true,
    uiFrameRate: true,
    animationDrops: true,
  },
  
  // Alertas de performance
  alerts: {
    lowFPS: 30, // Alertar se FPS cair abaixo de 30
    highMemoryUsage: 80, // Alertar se memória passar de 80%
  },
};

// Exportar configuração unificada
export const animationPerformanceConfig = {
  ...PERFORMANCE_CONFIG,
  helpers: performanceHelpers,
  platform: platformConfig,
  monitoring: monitoringConfig,
};