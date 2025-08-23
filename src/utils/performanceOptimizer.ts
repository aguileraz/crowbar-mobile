import { Platform, DeviceInfo } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { AnimationTheme, PerformanceConfig } from '../types/animations';
import { animationManager } from '../services/animationManager';

/**
 * Configuração de dispositivo detectada
 */
interface DeviceCapabilities {
  tier: 'low' | 'mid' | 'high' | 'flagship';
  memoryGB: number;
  isEmulator: boolean;
  androidApiLevel?: number;
  iosVersion?: string;
  cpuArch: string;
  screenDensity: number;
}

/**
 * Métricas de performance em tempo real
 */
interface RealTimeMetrics {
  fps: number;
  frameDrops: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryLevel: number;
  thermalState?: string;
}

/**
 * Configurações adaptativas baseadas em performance
 */
interface AdaptiveSettings {
  targetFPS: number;
  particleCount: number;
  glowIntensity: number;
  enableBlur: boolean;
  enableShadows: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  animationComplexity: 'minimal' | 'reduced' | 'full';
}

/**
 * Sistema de otimização de performance para animações
 * Adapta automaticamente as configurações baseado no dispositivo e performance
 */
class PerformanceOptimizer {
  private deviceCapabilities: DeviceCapabilities | null = null;
  private currentMetrics: RealTimeMetrics = {
    fps: 60,
    frameDrops: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    batteryLevel: 100,
  };
  
  private adaptiveSettings: AdaptiveSettings = {
    targetFPS: 60,
    particleCount: 20,
    glowIntensity: 1.0,
    enableBlur: true,
    enableShadows: true,
    textureQuality: 'high',
    animationComplexity: 'full',
  };

  private performanceHistory: RealTimeMetrics[] = [];
  private maxHistoryLength = 60; // 60 samples (1 minuto a 1fps de medição)
  
  private thresholds = {
    lowPerformance: {
      fps: 30,
      frameDrops: 10,
      memoryUsage: 0.8, // 80% da memória disponível
    },
    mediumPerformance: {
      fps: 45,
      frameDrops: 5,
      memoryUsage: 0.6,
    },
    highPerformance: {
      fps: 55,
      frameDrops: 2,
      memoryUsage: 0.4,
    },
  };

  private listeners: Array<(settings: AdaptiveSettings) => void> = [];
  
  /**
   * Inicializar detector de capacidades do dispositivo
   */
  async initialize(): Promise<void> {
    try {
      const [
        totalMemory,
        isEmulator,
        apiLevel,
        systemVersion,
        supportedAbis,
      ] = await Promise.all([
        DeviceInfo.getTotalMemory(),
        DeviceInfo.isEmulator(),
        Platform.OS === 'android' ? DeviceInfo.getApiLevel() : Promise.resolve(0),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.supportedAbis(),
      ]);

      const memoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
      
      // Detectar tier do dispositivo
      let tier: DeviceCapabilities['tier'] = 'low';
      
      if (memoryGB >= 8) {
        tier = 'flagship';
      } else if (memoryGB >= 6) {
        tier = 'high';
      } else if (memoryGB >= 4) {
        tier = 'mid';
      }

      this.deviceCapabilities = {
        tier,
        memoryGB,
        isEmulator,
        androidApiLevel: Platform.OS === 'android' ? apiLevel : undefined,
        iosVersion: Platform.OS === 'ios' ? systemVersion : undefined,
        cpuArch: supportedAbis[0] || 'unknown',
        screenDensity: 2.0, // Valor padrão, será atualizado se possível
      };

      // Configurar configurações iniciais baseadas no dispositivo
      this.applyDeviceOptimizations();
      
    } catch (error) {
      console.error('❌ Erro na inicialização do Performance Optimizer:', error);
      
      // Fallback para dispositivo de baixa performance
      this.deviceCapabilities = {
        tier: 'low',
        memoryGB: 2,
        isEmulator: false,
        cpuArch: 'unknown',
        screenDensity: 2.0,
      };
      
      this.applyDeviceOptimizations();
    }
  }

  /**
   * Aplicar otimizações baseadas no dispositivo
   */
  private applyDeviceOptimizations(): void {
    if (!this.deviceCapabilities) return;

    const { tier, isEmulator, memoryGB } = this.deviceCapabilities;
    
    switch (tier) {
      case 'flagship':
        this.adaptiveSettings = {
          targetFPS: 60,
          particleCount: 30,
          glowIntensity: 1.0,
          enableBlur: true,
          enableShadows: true,
          textureQuality: 'high',
          animationComplexity: 'full',
        };
        break;
        
      case 'high':
        this.adaptiveSettings = {
          targetFPS: 60,
          particleCount: 20,
          glowIntensity: 0.8,
          enableBlur: true,
          enableShadows: true,
          textureQuality: 'high',
          animationComplexity: 'full',
        };
        break;
        
      case 'mid':
        this.adaptiveSettings = {
          targetFPS: 45,
          particleCount: 15,
          glowIntensity: 0.6,
          enableBlur: false,
          enableShadows: false,
          textureQuality: 'medium',
          animationComplexity: 'reduced',
        };
        break;
        
      case 'low':
        this.adaptiveSettings = {
          targetFPS: 30,
          particleCount: 5,
          glowIntensity: 0.3,
          enableBlur: false,
          enableShadows: false,
          textureQuality: 'low',
          animationComplexity: 'minimal',
        };
        break;
    }

    // Ajustes para emulador
    if (isEmulator) {
      this.adaptiveSettings.targetFPS = Math.min(this.adaptiveSettings.targetFPS, 30);
      this.adaptiveSettings.particleCount = Math.floor(this.adaptiveSettings.particleCount * 0.5);
      this.adaptiveSettings.enableBlur = false;
    }

    // Ajustes para dispositivos com pouca memória
    if (memoryGB < 3) {
      this.adaptiveSettings.particleCount = Math.min(this.adaptiveSettings.particleCount, 10);
      this.adaptiveSettings.textureQuality = 'low';
    }

  }

  /**
   * Atualizar métricas de performance em tempo real
   */
  updateMetrics(metrics: Partial<RealTimeMetrics>): void {
    this.currentMetrics = { ...this.currentMetrics, ...metrics };
    
    // Adicionar ao histórico
    this.performanceHistory.push({ ...this.currentMetrics });
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }

    // Verificar se precisa de adaptação
    this.checkAndAdapt();
  }

  /**
   * Verificar performance e adaptar configurações se necessário
   */
  private checkAndAdapt(): void {
    if (this.performanceHistory.length < 10) return; // Aguardar dados suficientes

    const recentMetrics = this.performanceHistory.slice(-10);
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgFrameDrops = recentMetrics.reduce((sum, m) => sum + m.frameDrops, 0) / recentMetrics.length;
    const maxMemoryUsage = Math.max(...recentMetrics.map(m => m.memoryUsage));

    const currentPerformance = this.classifyPerformance(avgFPS, avgFrameDrops, maxMemoryUsage);
    
    // Aplicar adaptações se necessário
    if (this.shouldAdapt(currentPerformance)) {
      this.adaptSettings(currentPerformance);
    }
  }

  /**
   * Classificar performance atual
   */
  private classifyPerformance(
    fps: number, 
    frameDrops: number, 
    memoryUsage: number
  ): 'low' | 'medium' | 'high' {
    if (
      fps < this.thresholds.lowPerformance.fps ||
      frameDrops > this.thresholds.lowPerformance.frameDrops ||
      memoryUsage > this.thresholds.lowPerformance.memoryUsage
    ) {
      return 'low';
    }
    
    if (
      fps < this.thresholds.mediumPerformance.fps ||
      frameDrops > this.thresholds.mediumPerformance.frameDrops ||
      memoryUsage > this.thresholds.mediumPerformance.memoryUsage
    ) {
      return 'medium';
    }
    
    return 'high';
  }

  /**
   * Determinar se deve adaptar configurações
   */
  private shouldAdapt(performance: 'low' | 'medium' | 'high'): boolean {
    // Lógica para evitar mudanças muito frequentes
    const lastAdaptation = this.performanceHistory[this.performanceHistory.length - 1];
    
    // Só adaptar se a mudança for significativa
    return performance === 'low' || 
           (performance === 'medium' && this.adaptiveSettings.targetFPS > 45);
  }

  /**
   * Adaptar configurações baseado na performance
   */
  private adaptSettings(performance: 'low' | 'medium' | 'high'): void {
    const oldSettings = { ...this.adaptiveSettings };
    
    switch (performance) {
      case 'low':
        this.adaptiveSettings.targetFPS = Math.max(20, this.adaptiveSettings.targetFPS - 10);
        this.adaptiveSettings.particleCount = Math.max(2, Math.floor(this.adaptiveSettings.particleCount * 0.7));
        this.adaptiveSettings.glowIntensity = Math.max(0.1, this.adaptiveSettings.glowIntensity * 0.8);
        this.adaptiveSettings.enableBlur = false;
        this.adaptiveSettings.enableShadows = false;
        this.adaptiveSettings.textureQuality = 'low';
        this.adaptiveSettings.animationComplexity = 'minimal';
        break;
        
      case 'medium':
        this.adaptiveSettings.targetFPS = Math.min(45, this.adaptiveSettings.targetFPS + 5);
        this.adaptiveSettings.particleCount = Math.min(15, Math.floor(this.adaptiveSettings.particleCount * 1.1));
        this.adaptiveSettings.glowIntensity = Math.min(0.8, this.adaptiveSettings.glowIntensity * 1.1);
        this.adaptiveSettings.textureQuality = 'medium';
        this.adaptiveSettings.animationComplexity = 'reduced';
        break;
        
      case 'high':
        // Só melhorar se o dispositivo suportar
        if (this.deviceCapabilities?.tier === 'high' || this.deviceCapabilities?.tier === 'flagship') {
          this.adaptiveSettings.targetFPS = Math.min(60, this.adaptiveSettings.targetFPS + 5);
          this.adaptiveSettings.particleCount = Math.min(25, Math.floor(this.adaptiveSettings.particleCount * 1.2));
          this.adaptiveSettings.enableBlur = true;
          this.adaptiveSettings.enableShadows = true;
          this.adaptiveSettings.textureQuality = 'high';
          this.adaptiveSettings.animationComplexity = 'full';
        }
        break;
    }

    // Notificar listeners sobre mudanças
    if (JSON.stringify(oldSettings) !== JSON.stringify(this.adaptiveSettings)) {
      this.notifyListeners();
    }
  }

  /**
   * Otimizar tema baseado nas configurações atuais
   */
  optimizeTheme(theme: AnimationTheme): AnimationTheme {
    const optimizedTheme = JSON.parse(JSON.stringify(theme)); // Deep copy

    // Aplicar otimizações baseadas nas configurações adaptativas
    optimizedTheme.effects.particles.count = Math.min(
      optimizedTheme.effects.particles.count,
      this.adaptiveSettings.particleCount
    );

    optimizedTheme.effects.glow.intensity = Math.min(
      optimizedTheme.effects.glow.intensity,
      this.adaptiveSettings.glowIntensity
    );

    // Desabilitar efeitos custosos se necessário
    if (!this.adaptiveSettings.enableBlur) {
      optimizedTheme.effects.glow.enabled = false;
    }

    if (!this.adaptiveSettings.enableShadows) {
      optimizedTheme.effects.particles.fadeOut = false;
    }

    // Ajustar FPS dos sprite sheets
    Object.values(optimizedTheme.spriteSheets).forEach(spriteSheet => {
      spriteSheet.fps = Math.min(spriteSheet.fps, this.adaptiveSettings.targetFPS);
    });

    return optimizedTheme;
  }

  /**
   * Obter configuração de performance para React Native Reanimated
   */
  getReanimatedConfig(): any {
    return {
      enableVectorDrawables: this.adaptiveSettings.textureQuality === 'high',
      enableRasterizeVector: this.adaptiveSettings.textureQuality === 'low',
      enableLayoutAnimations: this.adaptiveSettings.animationComplexity !== 'minimal',
      enableNativeViewHierarchyOptimization: true,
      enableWorkletRuntime: this.deviceCapabilities?.tier !== 'low',
    };
  }

  /**
   * Adicionar listener para mudanças de configuração
   */
  addListener(callback: (settings: AdaptiveSettings) => void): () => void {
    this.listeners.push(callback);
    
    // Retornar função de cleanup
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notificar listeners sobre mudanças
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.adaptiveSettings);
      } catch (error) {
        console.error('Erro ao notificar listener de performance:', error);
      }
    });
  }

  /**
   * Obter configurações atuais
   */
  getCurrentSettings(): AdaptiveSettings {
    return { ...this.adaptiveSettings };
  }

  /**
   * Obter capacidades do dispositivo
   */
  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Obter métricas atuais
   */
  getCurrentMetrics(): RealTimeMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Obter histórico de performance
   */
  getPerformanceHistory(): RealTimeMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Resetar histórico de performance
   */
  resetPerformanceHistory(): void {
    this.performanceHistory = [];
  }

  /**
   * Modo de emergência - configurações mínimas
   */
  enableEmergencyMode(): void {
    console.warn('🚨 Modo de emergência ativado - configurações mínimas');
    
    this.adaptiveSettings = {
      targetFPS: 15,
      particleCount: 0,
      glowIntensity: 0,
      enableBlur: false,
      enableShadows: false,
      textureQuality: 'low',
      animationComplexity: 'minimal',
    };

    this.notifyListeners();
  }

  /**
   * Forçar limpeza de memória
   */
  forceMemoryCleanup(): void {
    // Limpar cache do animation manager
    animationManager.forceMemoryCleanup();
    
    // Resetar histórico local
    this.performanceHistory = this.performanceHistory.slice(-10);
    
  }

  /**
   * Gerar relatório de performance
   */
  generatePerformanceReport(): string {
    const avgFPS = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((sum, m) => sum + m.fps, 0) / this.performanceHistory.length
      : 0;
    
    const totalFrameDrops = this.performanceHistory.reduce((sum, m) => sum + m.frameDrops, 0);
    
    const maxMemoryUsage = Math.max(...this.performanceHistory.map(m => m.memoryUsage));

    return `
📊 RELATÓRIO DE PERFORMANCE
════════════════════════════════════════

DISPOSITIVO:
• Tier: ${this.deviceCapabilities?.tier || 'unknown'}
• Memória: ${this.deviceCapabilities?.memoryGB || 'unknown'}GB
• Emulador: ${this.deviceCapabilities?.isEmulator ? 'Sim' : 'Não'}

PERFORMANCE ATUAL:
• FPS Médio: ${Math.round(avgFPS)}
• Frames Perdidos: ${totalFrameDrops}
• Uso Máximo de Memória: ${Math.round(maxMemoryUsage * 100)}%

CONFIGURAÇÕES ATUAIS:
• Target FPS: ${this.adaptiveSettings.targetFPS}
• Partículas: ${this.adaptiveSettings.particleCount}
• Qualidade de Textura: ${this.adaptiveSettings.textureQuality}
• Complexidade: ${this.adaptiveSettings.animationComplexity}

════════════════════════════════════════
    `.trim();
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export types
export type { 
  DeviceCapabilities, 
  RealTimeMetrics, 
  AdaptiveSettings 
};