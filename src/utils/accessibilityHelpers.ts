import { AccessibilityInfo, Platform } from 'react-native';
import { Haptics } from 'expo-haptics';
import { AnimationState } from '../types/animations';

/**
 * Configuração de acessibilidade para animações
 */
export interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  enableVoiceOver: boolean;
  enableHaptics: boolean;
  largeText: boolean;
  boldText: boolean;
  darkenColors: boolean;
  invertColors: boolean;
}

/**
 * Padrões de haptic feedback por estado de animação
 */
export const HAPTIC_PATTERNS: Record<AnimationState, {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  pattern?: number[]; // Para Android
  description: string;
}> = {
  idle: { type: 'light', description: 'Sistema pronto' },
  preloading: { type: 'light', description: 'Carregando recursos' },
  ready: { type: 'medium', description: 'Pronto para abrir' },
  opening: { type: 'heavy', pattern: [100, 50, 100], description: 'Abrindo caixa' },
  explosion: { type: 'heavy', pattern: [200, 100, 200, 100, 200], description: 'Efeito de explosão' },
  revealing: { type: 'medium', pattern: [50, 30, 50], description: 'Revelando itens' },
  celebrating: { type: 'success', pattern: [100, 50, 100, 50, 100, 50, 100], description: 'Celebração' },
  completed: { type: 'success', description: 'Animação concluída' },
  interrupted: { type: 'warning', description: 'Animação interrompida' },
  error: { type: 'error', description: 'Erro na animação' },
  cleanup: { type: 'light', description: 'Limpando recursos' },
};

/**
 * Descrições de áudio para screen readers
 */
export const ACCESSIBILITY_DESCRIPTIONS: Record<AnimationState, {
  announcement: string;
  hint?: string;
  progress?: string;
}> = {
  idle: {
    announcement: 'Caixa misteriosa pronta para ser aberta',
    hint: 'Toque no botão para abrir a caixa',
  },
  preloading: {
    announcement: 'Carregando animação da caixa',
    progress: 'Carregando recursos necessários',
  },
  ready: {
    announcement: 'Sistema pronto para iniciar animação',
    hint: 'Toque para começar',
  },
  opening: {
    announcement: 'Abrindo caixa misteriosa',
    progress: 'Animação de abertura em andamento',
  },
  explosion: {
    announcement: 'Caixa aberta com efeito de explosão',
    progress: 'Efeitos visuais sendo exibidos',
  },
  revealing: {
    announcement: 'Revelando itens da caixa',
    progress: 'Mostrando conteúdo da caixa',
  },
  celebrating: {
    announcement: 'Celebrando abertura da caixa',
    progress: 'Efeitos de celebração ativos',
  },
  completed: {
    announcement: 'Caixa aberta com sucesso',
    hint: 'Visualize seus novos itens',
  },
  interrupted: {
    announcement: 'Animação foi interrompida',
    hint: 'Toque para ver os resultados',
  },
  error: {
    announcement: 'Erro ao abrir a caixa',
    hint: 'Tente novamente',
  },
  cleanup: {
    announcement: 'Finalizando processo',
    progress: 'Limpando recursos',
  },
};

/**
 * Classe para gerenciar acessibilidade das animações
 */
class AccessibilityManager {
  private config: AccessibilityConfig = {
    reduceMotion: false,
    highContrast: false,
    enableVoiceOver: false,
    enableHaptics: true,
    largeText: false,
    boldText: false,
    darkenColors: false,
    invertColors: false,
  };

  private listeners: Array<(config: AccessibilityConfig) => void> = [];
  private initialized = false;

  /**
   * Inicializar e detectar configurações de acessibilidade
   */
  async initialize(): Promise<AccessibilityConfig> {
    try {
      const [
        isReduceMotionEnabled,
        isHighContrastEnabled,
        isScreenReaderEnabled,
        isBoldTextEnabled,
        isGrayscaleEnabled,
        isInvertColorsEnabled,
        _isReduceTransparencyEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isHighContrastEnabled?.() : Promise.resolve(false),
        AccessibilityInfo.isScreenReaderEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isBoldTextEnabled?.() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isGrayscaleEnabled?.() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isInvertColorsEnabled?.() : Promise.resolve(false),
        Platform.OS === 'ios' ? AccessibilityInfo.isReduceTransparencyEnabled?.() : Promise.resolve(false),
      ]);

      this.config = {
        reduceMotion: isReduceMotionEnabled,
        highContrast: isHighContrastEnabled || false,
        enableVoiceOver: isScreenReaderEnabled,
        enableHaptics: true, // Padrão habilitado, pode ser desabilitado pelo usuário
        largeText: false, // Será detectado via font scale
        boldText: isBoldTextEnabled || false,
        darkenColors: isGrayscaleEnabled || false,
        invertColors: isInvertColorsEnabled || false,
      };

      this.initialized = true;
      this.notifyListeners();

      // Configurar listeners para mudanças
      this.setupChangeListeners();

      return this.config;
    } catch (error) {
      // console.error('❌ Erro ao detectar configurações de acessibilidade:', error);
      return this.config;
    }
  }

  /**
   * Configurar listeners para mudanças de acessibilidade
   */
  private setupChangeListeners(): void {
    // Listener para mudanças em reduce motion
    AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      this.config.reduceMotion = isEnabled;
      this.notifyListeners();
    });

    // Listener para mudanças no screen reader
    AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
      this.config.enableVoiceOver = isEnabled;
      this.notifyListeners();
    });

    // iOS specific listeners
    if (Platform.OS === 'ios') {
      AccessibilityInfo.addEventListener?.('boldTextChanged', (isEnabled) => {
        this.config.boldText = isEnabled;
        this.notifyListeners();
      });

      AccessibilityInfo.addEventListener?.('grayscaleChanged', (isEnabled) => {
        this.config.darkenColors = isEnabled;
        this.notifyListeners();
      });
    }
  }

  /**
   * Executar haptic feedback baseado no estado da animação
   */
  async triggerHapticFeedback(state: AnimationState): Promise<void> {
    if (!this.config.enableHaptics) return;

    const pattern = HAPTIC_PATTERNS[state];
    if (!pattern) return;

    try {
      if (Platform.OS === 'ios') {
        // iOS usando Haptics
        switch (pattern.type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } else if (Platform.OS === 'android' && pattern.pattern) {
        // Android usando padrão de vibração customizado
        const { Vibration } = require('react-native');
        Vibration.vibrate(pattern.pattern);
      }
    } catch (error) {
      // console.warn('⚠️ Erro ao executar haptic feedback:', error);
    }
  }

  /**
   * Fazer anúncio para screen readers
   */
  announceForScreenReader(
    state: AnimationState, 
    customMessage?: string,
    priority: 'low' | 'high' = 'low'
  ): void {
    if (!this.config.enableVoiceOver) return;

    const description = ACCESSIBILITY_DESCRIPTIONS[state];
    const message = customMessage || description?.announcement;

    if (message) {
      const _options = Platform.OS === 'ios' 
        ? { announcement: message, priority } 
        : { announcement: message };
      
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Anunciar progresso da animação
   */
  announceProgress(state: AnimationState, percentage?: number): void {
    if (!this.config.enableVoiceOver) return;

    const description = ACCESSIBILITY_DESCRIPTIONS[state];
    let message = description?.progress;

    if (percentage !== undefined) {
      message = `${message} - ${Math.round(percentage)}% concluído`;
    }

    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Obter configurações de cores para alto contraste
   */
  getHighContrastColors(): Record<string, string> {
    if (!this.config.highContrast) {
      return {};
    }

    return {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: this.config.invertColors ? '#FFFFFF' : '#000000',
      background: this.config.invertColors ? '#000000' : '#FFFFFF',
      surface: this.config.invertColors ? '#333333' : '#F0F0F0',
      text: this.config.invertColors ? '#FFFFFF' : '#000000',
      border: this.config.invertColors ? '#FFFFFF' : '#000000',
    };
  }

  /**
   * Obter configurações de animação adaptadas
   */
  getAdaptedAnimationConfig() {
    return {
      reduceMotion: this.config.reduceMotion,
      disableParticles: this.config.reduceMotion,
      disableGlow: this.config.reduceMotion || this.config.highContrast,
      disableBlur: this.config.reduceMotion,
      simplifyTransitions: this.config.reduceMotion,
      increasedDuration: this.config.reduceMotion ? 2 : 1, // Duração 2x mais lenta
      staticFallback: this.config.reduceMotion,
      highContrastMode: this.config.highContrast,
      largeTextMode: this.config.largeText,
      boldTextMode: this.config.boldText,
    };
  }

  /**
   * Verificar se deve mostrar elementos de navegação alternativos
   */
  shouldShowAlternativeControls(): boolean {
    return this.config.enableVoiceOver || this.config.reduceMotion;
  }

  /**
   * Obter descrição textual da animação atual
   */
  getTextualDescription(state: AnimationState): string {
    const description = ACCESSIBILITY_DESCRIPTIONS[state];
    return description?.announcement || `Estado da animação: ${state}`;
  }

  /**
   * Configurar acessibilidade para componente React Native
   */
  getAccessibilityProps(state: AnimationState) {
    const description = ACCESSIBILITY_DESCRIPTIONS[state];
    
    return {
      accessible: true,
      accessibilityLabel: description?.announcement,
      accessibilityHint: description?.hint,
      accessibilityRole: 'button' as const,
      accessibilityState: {
        busy: ['preloading', 'opening', 'explosion', 'revealing'].includes(state),
        disabled: ['error'].includes(state),
      },
      accessibilityValue: description?.progress ? {
        text: description.progress
      } : undefined,
    };
  }

  /**
   * Adicionar listener para mudanças de configuração
   */
  addListener(callback: (config: AccessibilityConfig) => void): () => void {
    this.listeners.push(callback);
    
    // Se já inicializado, chamar imediatamente
    if (this.initialized) {
      callback(this.config);
    }
    
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
        callback(this.config);
      } catch (error) {
        // console.error('Erro ao notificar listener de acessibilidade:', error);
      }
    });
  }

  /**
   * Atualizar configuração manualmente
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
  }

  /**
   * Obter configuração atual
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Verificar se sistema de acessibilidade está ativo
   */
  isAccessibilityActive(): boolean {
    return this.config.enableVoiceOver || 
           this.config.reduceMotion || 
           this.config.highContrast ||
           this.config.boldText ||
           this.config.largeText;
  }

  /**
   * Executar sequência de haptic feedback complexa
   */
  async triggerComplexHapticSequence(sequence: Array<{
    type: 'light' | 'medium' | 'heavy';
    delay: number;
  }>): Promise<void> {
    if (!this.config.enableHaptics) return;

    for (const item of sequence) {
      if (item.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
      }
      
      try {
        switch (item.type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
        }
      } catch (error) {
        // console.warn('Erro na sequência de haptic:', error);
      }
    }
  }

  /**
   * Gerar relatório de acessibilidade
   */
  generateAccessibilityReport(): string {
    const activeFeatures = Object.entries(this.config)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);

    return `
♿ RELATÓRIO DE ACESSIBILIDADE
════════════════════════════════════════

STATUS GERAL:
• Sistema Ativo: ${this.isAccessibilityActive() ? 'Sim' : 'Não'}
• Recursos Ativos: ${activeFeatures.length}

CONFIGURAÇÕES DETECTADAS:
• Reduzir Movimento: ${this.config.reduceMotion ? 'Ativo' : 'Inativo'}
• Alto Contraste: ${this.config.highContrast ? 'Ativo' : 'Inativo'}
• Leitor de Tela: ${this.config.enableVoiceOver ? 'Ativo' : 'Inativo'}
• Haptic Feedback: ${this.config.enableHaptics ? 'Habilitado' : 'Desabilitado'}
• Texto em Negrito: ${this.config.boldText ? 'Ativo' : 'Inativo'}
• Cores Escuras: ${this.config.darkenColors ? 'Ativo' : 'Inativo'}
• Cores Invertidas: ${this.config.invertColors ? 'Ativo' : 'Inativo'}

RECURSOS ATIVOS:
${activeFeatures.map(feature => `• ${feature}`).join('\n')}

════════════════════════════════════════
    `.trim();
  }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();

// Export utility functions
export const isReduceMotionEnabled = () => accessibilityManager.getConfig().reduceMotion;
export const isHighContrastEnabled = () => accessibilityManager.getConfig().highContrast;
export const isScreenReaderEnabled = () => accessibilityManager.getConfig().enableVoiceOver;

// Export types
export type { AccessibilityConfig };