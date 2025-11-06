/**
 * Advanced Haptic Feedback Service
 * Serviço avançado de feedback háptico para gamificação
 */

import { Vibration, Platform } from 'react-native';
import { HapticPattern, HAPTIC_PATTERNS } from '../types/animations';

interface HapticConfig {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy';
  adaptToDevice: boolean;
  respectSystemSettings: boolean;
}

interface HapticCapabilities {
  supportsPatterns: boolean;
  supportsIntensity: boolean;
  maxPatternLength: number;
  minInterval: number;
  maxIntensity: number;
}

class AdvancedHapticService {
  private static instance: AdvancedHapticService;
  private config: HapticConfig;
  private capabilities: HapticCapabilities;
  private isEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private hapticQueue: Array<{ pattern: number[]; intensity: number }> = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    this.config = {
      enabled: true,
      intensity: 'medium',
      adaptToDevice: true,
      respectSystemSettings: true,
    };

    this.capabilities = this.detectCapabilities();
    this.loadUserPreferences();
  }

  static getInstance(): AdvancedHapticService {
    if (!AdvancedHapticService.instance) {
      AdvancedHapticService.instance = new AdvancedHapticService();
    }
    return AdvancedHapticService.instance;
  }

  /**
   * Detecta capacidades do dispositivo
   */
  private detectCapabilities(): HapticCapabilities {
    if (Platform.OS === 'ios') {
      return {
        supportsPatterns: true,
        supportsIntensity: true,
        maxPatternLength: 100,
        minInterval: 50,
        maxIntensity: 100,
      };
    } else if (Platform.OS === 'android') {
      return {
        supportsPatterns: true,
        supportsIntensity: false,
        maxPatternLength: 50,
        minInterval: 100,
        maxIntensity: 255,
      };
    }

    return {
      supportsPatterns: false,
      supportsIntensity: false,
      maxPatternLength: 1,
      minInterval: 500,
      maxIntensity: 1,
    };
  }

  /**
   * Carrega preferências do usuário
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      // Implementar carregamento de AsyncStorage
      // const preferences = await AsyncStorage.getItem('haptic_preferences');
      // if (preferences) {
      //   this.config = { ...this.config, ...JSON.parse(preferences) };
      // }
    } catch (error) {
      // console.warn('Erro ao carregar preferências hápticas:', error);
    }
  }

  /**
   * Executa padrão háptico básico
   */
  async playPattern(patternName: keyof typeof HAPTIC_PATTERNS): Promise<void> {
    if (!this.isEnabled || !this.config.enabled) return;

    const pattern = HAPTIC_PATTERNS[patternName];
    if (!pattern) {
      // console.warn(`Padrão háptico não encontrado: ${patternName}`);
      return;
    }

    await this.playHapticPattern(pattern);
  }

  /**
   * Executa padrão háptico customizado
   */
  async playCustomPattern(pattern: HapticPattern): Promise<void> {
    if (!this.isEnabled || !this.config.enabled) return;
    await this.playHapticPattern(pattern);
  }

  /**
   * Feedback háptico para abertura de caixa com base na raridade
   */
  async playBoxOpeningFeedback(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): Promise<void> {
    const patterns = {
      common: this.createSimplePattern([100], 'light'),
      uncommon: this.createSimplePattern([100, 50, 100], 'light'),
      rare: this.createSimplePattern([150, 50, 150, 50, 150], 'medium'),
      epic: this.createSimplePattern([200, 50, 100, 50, 200, 50, 100], 'medium'),
      legendary: this.createSimplePattern([300, 100, 200, 100, 300, 100, 200, 100, 400], 'heavy'),
    };

    await this.playCustomPattern(patterns[rarity]);
  }

  /**
   * Feedback háptico sincronizado com animação
   */
  async playSyncedFeedback(animationDuration: number, intensity: 'light' | 'medium' | 'heavy'): Promise<void> {
    const pulseCount = Math.min(Math.floor(animationDuration / 200), 10);
    const pattern: number[] = [];
    
    for (let i = 0; i < pulseCount; i++) {
      pattern.push(50); // vibração
      if (i < pulseCount - 1) {
        pattern.push(150); // pausa
      }
    }

    const customPattern = this.createSimplePattern(pattern, intensity);
    await this.playCustomPattern(customPattern);
  }

  /**
   * Feedback para sequência de sucesso (combo/streak)
   */
  async playSuccessSequence(comboCount: number): Promise<void> {
    const basePattern = [100, 50];
    const pattern: number[] = [];
    
    // Construir padrão baseado no combo
    for (let i = 0; i < Math.min(comboCount, 5); i++) {
      pattern.push(...basePattern);
      // Intensidade crescente
      if (i < comboCount - 1) {
        pattern.push(30); // pausa entre pulsos
      }
    }

    // Finalizar com vibração mais forte
    pattern.push(200);

    const customPattern = this.createSimplePattern(pattern, 'medium');
    await this.playCustomPattern(customPattern);
  }

  /**
   * Feedback contextual baseado no tema da animação
   */
  async playThematicFeedback(theme: 'fire' | 'ice' | 'meteor', phase: 'start' | 'climax' | 'end'): Promise<void> {
    const themePatterns = {
      fire: {
        start: [50, 30, 50, 30, 100], // Aquecimento gradual
        climax: [200, 100, 200, 100, 300], // Explosão intensa
        end: [100, 50, 75, 50, 50], // Dispersão
      },
      ice: {
        start: [30, 100, 30, 100, 30], // Cristalização lenta
        climax: [150, 200, 150], // Explosão fria
        end: [50, 150, 25, 150, 25], // Fragmentação
      },
      meteor: {
        start: [25, 50, 50, 50, 75], // Aproximação
        climax: [300, 150, 300], // Impacto devastador
        end: [200, 100, 150, 100, 100], // Destroços
      },
    };

    const pattern = themePatterns[theme][phase];
    const customPattern = this.createSimplePattern(pattern, phase === 'climax' ? 'heavy' : 'medium');
    
    await this.playCustomPattern(customPattern);
  }

  /**
   * Feedback para interações gestuais
   */
  async playGestureFeedback(gesture: 'tap' | 'double_tap' | 'long_press' | 'swipe'): Promise<void> {
    const gesturePatterns = {
      tap: [30],
      double_tap: [30, 20, 30],
      long_press: [100, 50, 150],
      swipe: [50, 25, 75, 25, 100],
    };

    const pattern = gesturePatterns[gesture];
    const customPattern = this.createSimplePattern(pattern, 'light');
    
    await this.playCustomPattern(customPattern);
  }

  /**
   * Executa o padrão háptico real
   */
  private async playHapticPattern(pattern: HapticPattern): Promise<void> {
    // Verificar throttling
    const now = Date.now();
    if (now - this.lastHapticTime < this.capabilities.minInterval) {
      // Adicionar à fila se muito próximo do último haptic
      this.hapticQueue.push({
        pattern: pattern.pattern,
        intensity: this.getIntensityValue(pattern.intensity)
      });
      this.processQueue();
      return;
    }

    this.lastHapticTime = now;
    
    try {
      // Adaptar padrão às capacidades do dispositivo
      const adaptedPattern = this.adaptPatternToDevice(pattern);
      
      if (Platform.OS === 'ios') {
        await this.playIOSHaptic(adaptedPattern);
      } else if (Platform.OS === 'android') {
        await this.playAndroidHaptic(adaptedPattern);
      }
    } catch (error) {
      // console.warn('Erro ao executar feedback háptico:', error);
    }
  }

  /**
   * Executa haptic no iOS
   */
  private async playIOSHaptic(pattern: HapticPattern): Promise<void> {
    // No iOS, usar Haptics API se disponível
    if (Vibration.vibrate) {
      Vibration.vibrate(pattern.pattern);
    }
  }

  /**
   * Executa haptic no Android
   */
  private async playAndroidHaptic(pattern: HapticPattern): Promise<void> {
    // No Android, usar Vibration API
    if (Vibration.vibrate) {
      Vibration.vibrate(pattern.pattern);
    }
  }

  /**
   * Adapta padrão às capacidades do dispositivo
   */
  private adaptPatternToDevice(pattern: HapticPattern): HapticPattern {
    let adaptedPattern = [...pattern.pattern];

    // Limitar comprimento do padrão
    if (adaptedPattern.length > this.capabilities.maxPatternLength) {
      adaptedPattern = adaptedPattern.slice(0, this.capabilities.maxPatternLength);
    }

    // Ajustar intervalos mínimos
    adaptedPattern = adaptedPattern.map(value => 
      Math.max(value, this.capabilities.minInterval)
    );

    // Ajustar intensidade baseada na configuração
    const intensityMultiplier = this.getIntensityMultiplier();
    adaptedPattern = adaptedPattern.map(value => 
      Math.floor(value * intensityMultiplier)
    );

    return {
      ...pattern,
      pattern: adaptedPattern,
    };
  }

  /**
   * Processa fila de haptics
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.hapticQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.hapticQueue.length > 0) {
      const queuedHaptic = this.hapticQueue.shift();
      if (queuedHaptic) {
        const pattern: HapticPattern = {
          name: 'queued',
          pattern: queuedHaptic.pattern,
          intensity: this.getIntensityName(queuedHaptic.intensity),
        };
        
        await this.playHapticPattern(pattern);
        await new Promise(resolve => setTimeout(resolve, this.capabilities.minInterval));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Cria padrão simples
   */
  private createSimplePattern(pattern: number[], intensity: 'light' | 'medium' | 'heavy'): HapticPattern {
    return {
      name: 'custom',
      pattern,
      intensity,
    };
  }

  /**
   * Converte intensidade para valor numérico
   */
  private getIntensityValue(intensity: 'light' | 'medium' | 'heavy'): number {
    switch (intensity) {
      case 'light': return 50;
      case 'medium': return 100;
      case 'heavy': return 200;
      default: return 100;
    }
  }

  /**
   * Converte valor numérico para intensidade
   */
  private getIntensityName(value: number): 'light' | 'medium' | 'heavy' {
    if (value <= 75) return 'light';
    if (value <= 150) return 'medium';
    return 'heavy';
  }

  /**
   * Calcula multiplicador de intensidade baseado na configuração
   */
  private getIntensityMultiplier(): number {
    switch (this.config.intensity) {
      case 'light': return 0.6;
      case 'medium': return 1.0;
      case 'heavy': return 1.4;
      default: return 1.0;
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Salvar preferences
    // AsyncStorage.setItem('haptic_preferences', JSON.stringify(this.config));
  }

  /**
   * Habilita/desabilita haptics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.config.enabled = enabled;
  }

  /**
   * Retorna se haptics está habilitado
   */
  isHapticEnabled(): boolean {
    return this.isEnabled && this.config.enabled;
  }

  /**
   * Retorna capacidades do dispositivo
   */
  getCapabilities(): HapticCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Limpa fila de haptics
   */
  clearQueue(): void {
    this.hapticQueue = [];
  }

  /**
   * Para todos os haptics
   */
  stopAll(): void {
    this.clearQueue();
    if (Vibration.cancel) {
      Vibration.cancel();
    }
  }
}

export default AdvancedHapticService.getInstance();