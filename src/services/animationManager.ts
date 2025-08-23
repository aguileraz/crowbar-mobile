import { Image, ImageRequireSource } from 'react-native';
import { AnimationTheme, SpriteSheetConfig } from '../components/animations/SpriteSheetAnimator';

/**
 * Interface para configuração de preload
 */
interface PreloadConfig {
  priority: 'high' | 'medium' | 'low';
  maxConcurrentLoads: number;
  timeout: number;
}

/**
 * Interface para cache de animações
 */
interface AnimationCache {
  [key: string]: {
    loaded: boolean;
    timestamp: number;
    size: number;
    theme: AnimationTheme;
  };
}

/**
 * Interface para métricas de performance
 */
interface PerformanceMetrics {
  loadTime: number;
  frameRate: number;
  memoryUsage: number;
  droppedFrames: number;
}

/**
 * Tipos de tema disponíveis
 */
export type ThemeType = 'fire' | 'ice' | 'meteor' | 'classic';

/**
 * Gerenciador de animações com preload e otimizações de memória
 * Responsável por carregar, cachear e otimizar sprite sheets
 */
class AnimationManager {
  private cache: AnimationCache = {};
  private loadingQueue: Map<string, Promise<void>> = new Map();
  private memoryThreshold = 100 * 1024 * 1024; // 100MB limite de memória
  private maxCacheAge = 10 * 60 * 1000; // 10 minutos
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * Configurações de temas predefinidos
   */
  private readonly themeConfigs: Record<ThemeType, AnimationTheme> = {
    fire: {
      name: 'Fogo',
      spriteSheets: {
        opening: {
          source: require('../assets/animations/fire_opening.png'),
          frameWidth: 200,
          frameHeight: 200,
          totalFrames: 60,
          framesPerRow: 8,
          fps: 30,
        },
        explosion: {
          source: require('../assets/animations/fire_explosion.png'),
          frameWidth: 300,
          frameHeight: 300,
          totalFrames: 45,
          framesPerRow: 9,
          fps: 60,
        },
        particles: {
          source: require('../assets/animations/fire_particles.png'),
          frameWidth: 50,
          frameHeight: 50,
          totalFrames: 24,
          framesPerRow: 6,
          fps: 24,
        },
      },
      colors: {
        primary: '#FF4444',
        secondary: '#FF8844',
        glow: '#FFAA44',
      },
      effects: {
        enableHaptics: true,
        enableGlow: true,
        enableScreenShake: true,
        particleCount: 20,
      },
    },
    ice: {
      name: 'Gelo',
      spriteSheets: {
        opening: {
          source: require('../assets/animations/ice_opening.png'),
          frameWidth: 200,
          frameHeight: 200,
          totalFrames: 50,
          framesPerRow: 8,
          fps: 25,
        },
        explosion: {
          source: require('../assets/animations/ice_explosion.png'),
          frameWidth: 300,
          frameHeight: 300,
          totalFrames: 40,
          framesPerRow: 8,
          fps: 50,
        },
      },
      colors: {
        primary: '#44AAFF',
        secondary: '#66CCFF',
        glow: '#AAEEFF',
      },
      effects: {
        enableHaptics: true,
        enableGlow: true,
        enableScreenShake: false,
        particleCount: 15,
      },
    },
    meteor: {
      name: 'Meteoro',
      spriteSheets: {
        opening: {
          source: require('../assets/animations/meteor_opening.png'),
          frameWidth: 250,
          frameHeight: 250,
          totalFrames: 80,
          framesPerRow: 10,
          fps: 40,
        },
        explosion: {
          source: require('../assets/animations/meteor_explosion.png'),
          frameWidth: 350,
          frameHeight: 350,
          totalFrames: 60,
          framesPerRow: 8,
          fps: 60,
        },
      },
      colors: {
        primary: '#AA44FF',
        secondary: '#CC66FF',
        glow: '#EE88FF',
      },
      effects: {
        enableHaptics: true,
        enableGlow: true,
        enableScreenShake: true,
        particleCount: 30,
      },
    },
    classic: {
      name: 'Clássico',
      spriteSheets: {
        opening: {
          source: require('../assets/animations/classic_opening.png'),
          frameWidth: 200,
          frameHeight: 200,
          totalFrames: 30,
          framesPerRow: 6,
          fps: 20,
        },
        explosion: {
          source: require('../assets/animations/classic_explosion.png'),
          frameWidth: 250,
          frameHeight: 250,
          totalFrames: 25,
          framesPerRow: 5,
          fps: 30,
        },
      },
      colors: {
        primary: '#FFD700',
        secondary: '#FFA500',
        glow: '#FFFF99',
      },
      effects: {
        enableHaptics: false,
        enableGlow: true,
        enableScreenShake: false,
        particleCount: 10,
      },
    },
  };

  /**
   * Singleton instance
   */
  private static instance: AnimationManager;

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  /**
   * Preload de animações baseado na prioridade
   */
  async preloadAnimations(
    themes: ThemeType[],
    config: Partial<PreloadConfig> = {}
  ): Promise<void> {
    const { priority = 'medium', maxConcurrentLoads = 2, timeout = 10000 } = config;


    const loadPromises: Promise<void>[] = [];
    const semaphore = new Semaphore(maxConcurrentLoads);

    for (const themeType of themes) {
      const promise = semaphore.acquire().then(async (release) => {
        try {
          await this.preloadTheme(themeType, timeout);
        } finally {
          release();
        }
      });
      loadPromises.push(promise);
    }

    try {
      await Promise.all(loadPromises);
    } catch (error) {
      console.error('❌ Erro durante preload:', error);
      throw error;
    }
  }

  /**
   * Preload de um tema específico
   */
  private async preloadTheme(themeType: ThemeType, timeout: number): Promise<void> {
    const theme = this.themeConfigs[themeType];
    const cacheKey = `theme_${themeType}`;

    // Verificar se já está carregado
    if (this.cache[cacheKey]?.loaded) {
      return;
    }

    // Verificar se já está sendo carregado
    if (this.loadingQueue.has(cacheKey)) {
      return this.loadingQueue.get(cacheKey)!;
    }

    // Iniciar carregamento
    const loadPromise = this.loadThemeAssets(theme, timeout);
    this.loadingQueue.set(cacheKey, loadPromise);

    try {
      await loadPromise;
      
      // Atualizar cache
      this.cache[cacheKey] = {
        loaded: true,
        timestamp: Date.now(),
        size: this.calculateThemeSize(theme),
        theme,
      };

    } catch (error) {
      console.error(`❌ Erro ao carregar tema ${themeType}:`, error);
      throw error;
    } finally {
      this.loadingQueue.delete(cacheKey);
    }
  }

  /**
   * Carregar assets de um tema
   */
  private async loadThemeAssets(theme: AnimationTheme, timeout: number): Promise<void> {
    const startTime = Date.now();
    
    const loadPromises = Object.values(theme.spriteSheets).map(config =>
      this.preloadImage(config.source, timeout)
    );

    try {
      await Promise.all(loadPromises);
      
      // Registrar métricas
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.set(theme.name, {
        loadTime,
        frameRate: 0, // Será atualizado durante reprodução
        memoryUsage: this.calculateThemeSize(theme),
        droppedFrames: 0,
      });
    } catch (error) {
      throw new Error(`Falha ao carregar assets do tema ${theme.name}: ${error}`);
    }
  }

  /**
   * Preload de imagem com timeout
   */
  private preloadImage(source: ImageRequireSource, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout ao carregar imagem'));
      }, timeout);

      Image.prefetch(Image.resolveAssetSource(source).uri)
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Obter tema por tipo
   */
  getTheme(themeType: ThemeType): AnimationTheme | null {
    const cacheKey = `theme_${themeType}`;
    const cached = this.cache[cacheKey];

    if (cached?.loaded) {
      // Atualizar timestamp de acesso
      cached.timestamp = Date.now();
      return cached.theme;
    }

    return null;
  }

  /**
   * Obter tema com fallback
   */
  getThemeWithFallback(themeType: ThemeType): AnimationTheme {
    const theme = this.getTheme(themeType);
    
    if (theme) {
      return theme;
    }

    // Fallback para tema clássico
    console.warn(`⚠️ Tema ${themeType} não encontrado, usando fallback clássico`);
    return this.themeConfigs.classic;
  }

  /**
   * Verificar se tema está carregado
   */
  isThemeLoaded(themeType: ThemeType): boolean {
    const cacheKey = `theme_${themeType}`;
    return this.cache[cacheKey]?.loaded ?? false;
  }

  /**
   * Limpar cache de animações antigas
   */
  cleanupCache(): void {
    const currentTime = Date.now();
    const keysToRemove: string[] = [];
    let freedMemory = 0;

    for (const [key, entry] of Object.entries(this.cache)) {
      const age = currentTime - entry.timestamp;
      
      if (age > this.maxCacheAge) {
        keysToRemove.push(key);
        freedMemory += entry.size;
      }
    }

    keysToRemove.forEach(key => {
      delete this.cache[key];
    });

    if (keysToRemove.length > 0) {
    }
  }

  /**
   * Verificar uso de memória
   */
  checkMemoryUsage(): { total: number; threshold: number; shouldCleanup: boolean } {
    const totalMemory = Object.values(this.cache).reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      total: totalMemory,
      threshold: this.memoryThreshold,
      shouldCleanup: totalMemory > this.memoryThreshold,
    };
  }

  /**
   * Forçar limpeza de memória
   */
  forceMemoryCleanup(): void {
    const before = Object.keys(this.cache).length;
    this.cache = {};
    this.loadingQueue.clear();
    
  }

  /**
   * Obter métricas de performance
   */
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Atualizar métricas de frame rate
   */
  updateFrameRate(themeName: string, frameRate: number, droppedFrames: number): void {
    const metrics = this.performanceMetrics.get(themeName);
    if (metrics) {
      metrics.frameRate = frameRate;
      metrics.droppedFrames = droppedFrames;
    }
  }

  /**
   * Calcular tamanho estimado de um tema
   */
  private calculateThemeSize(theme: AnimationTheme): number {
    let totalSize = 0;

    Object.values(theme.spriteSheets).forEach(config => {
      // Estimativa baseada na resolução e número de frames
      const pixelCount = config.frameWidth * config.frameHeight * config.totalFrames;
      const estimatedSize = pixelCount * 4; // 4 bytes per pixel (RGBA)
      totalSize += estimatedSize;
    });

    return totalSize;
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats() {
    const stats = {
      totalItems: Object.keys(this.cache).length,
      loadedItems: Object.values(this.cache).filter(item => item.loaded).length,
      totalMemory: Object.values(this.cache).reduce((sum, item) => sum + item.size, 0),
      oldestItem: Math.min(...Object.values(this.cache).map(item => item.timestamp)),
      newestItem: Math.max(...Object.values(this.cache).map(item => item.timestamp)),
      loadingQueue: this.loadingQueue.size,
    };

    return stats;
  }
}

/**
 * Classe auxiliar para controle de concorrência
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits -= 1;
        resolve(() => {
          this.permits += 1;
          const next = this.waiting.shift();
          if (next) next();
        });
      } else {
        this.waiting.push(() => {
          this.permits -= 1;
          resolve(() => {
            this.permits += 1;
            const next = this.waiting.shift();
            if (next) next();
          });
        });
      }
    });
  }
}

// Export singleton instance
export const animationManager = AnimationManager.getInstance();
export type { AnimationTheme, ThemeType, PerformanceMetrics };