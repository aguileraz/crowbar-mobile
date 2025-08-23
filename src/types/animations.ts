/**
 * Tipos e interfaces para o sistema de animações avançado
 * Crowbar Mobile - Box Opening Animation System
 */

/**
 * Estados possíveis da animação principal
 */
export type AnimationState = 
  | 'idle'           // Aguardando início
  | 'preloading'     // Carregando assets
  | 'ready'          // Pronto para iniciar
  | 'opening'        // Animação de abertura da caixa
  | 'explosion'      // Efeito de explosão
  | 'revealing'      // Revelando itens
  | 'celebrating'    // Celebração final
  | 'completed'      // Animação concluída
  | 'interrupted'    // Animação interrompida
  | 'error'          // Erro na animação
  | 'cleanup';       // Limpando recursos

/**
 * Tipos de transições entre estados
 */
export type AnimationTransition =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'bounce'
  | 'spring'
  | 'elastic'
  | 'shake'
  | 'pulse'
  | 'rotate'
  | 'flip';

/**
 * Configuração de timing para animações
 */
export interface AnimationTiming {
  duration: number;           // Duração em milissegundos
  delay?: number;            // Delay antes do início
  easing?: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring' | 'bounce';
  repeat?: number;           // Número de repetições (-1 = infinito)
  reverse?: boolean;         // Se deve reverter no final
  interpolation?: 'linear' | 'bezier' | 'step';
}

/**
 * Configuração de sprite sheet
 */
export interface SpriteSheet {
  id: string;
  name: string;
  source: any;               // Fonte da imagem
  frameWidth: number;        // Largura de cada frame
  frameHeight: number;       // Altura de cada frame
  totalFrames: number;       // Total de frames no sprite
  framesPerRow: number;      // Frames por linha
  fps: number;               // Frames por segundo
  loopable: boolean;         // Se pode fazer loop
  preloadPriority: 'high' | 'medium' | 'low';
  memoryEstimate: number;    // Estimativa de uso de memória (bytes)
}

/**
 * Configuração de efeitos visuais
 */
export interface VisualEffects {
  particles: {
    enabled: boolean;
    count: number;
    size: { min: number; max: number };
    speed: { min: number; max: number };
    colors: string[];
    gravity: number;
    fadeOut: boolean;
    textures?: string[];
  };
  glow: {
    enabled: boolean;
    intensity: number;
    color: string;
    radius: number;
    pulsate: boolean;
    duration?: number;
  };
  shake: {
    enabled: boolean;
    intensity: number;
    duration: number;
    direction: 'horizontal' | 'vertical' | 'both';
  };
  flash: {
    enabled: boolean;
    color: string;
    duration: number;
    opacity: number;
  };
  zoom: {
    enabled: boolean;
    scale: number;
    duration: number;
    easing: string;
  };
}

/**
 * Configuração de áudio sincronizado
 */
export interface AudioConfig {
  enabled: boolean;
  tracks: {
    opening?: string;      // Som de abertura
    explosion?: string;    // Som de explosão
    reveal?: string;       // Som de revelação
    celebration?: string;  // Som de celebração
    ambient?: string;      // Som ambiente/música de fundo
  };
  volume: {
    master: number;
    effects: number;
    music: number;
  };
  fadeIn?: number;         // Fade in duration
  fadeOut?: number;        // Fade out duration
  spatialAudio?: boolean;  // Audio 3D espacial
}

/**
 * Configuração de tema completa
 */
export interface AnimationTheme {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  
  // Sprite sheets por fase
  spriteSheets: {
    opening: SpriteSheet;
    explosion: SpriteSheet;
    particles?: SpriteSheet;
    ui?: SpriteSheet;        // Elementos de UI animados
  };
  
  // Esquema de cores
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    particles: string[];
    background: string;
  };
  
  // Efeitos visuais
  effects: VisualEffects;
  
  // Configuração de áudio
  audio: AudioConfig;
  
  // Timing específico do tema
  timing: {
    totalDuration: number;
    phaseTransitions: {
      openingToExplosion: number;
      explosionToReveal: number;
      revealToCelebration: number;
    };
  };
  
  // Configurações específicas de raridade
  rarityEffects: {
    [key: string]: {
      glowIntensity: number;
      particleMultiplier: number;
      shakeIntensity: number;
      specialEffects?: string[];
    };
  };
}

/**
 * Estado do sistema de animação
 */
export interface AnimationSystemState {
  currentState: AnimationState;
  previousState: AnimationState | null;
  activeTheme: string | null;
  progress: {
    overall: number;       // 0-1 progresso geral
    phase: number;         // 0-1 progresso da fase atual
    frame: number;         // Frame atual da animação
    time: number;          // Tempo decorrido (ms)
  };
  performance: {
    fps: number;
    droppedFrames: number;
    memoryUsage: number;
    renderTime: number;
  };
  interruption: {
    canInterrupt: boolean;
    method: 'tap' | 'double-tap' | 'long-press' | 'swipe' | null;
    skipToState?: AnimationState;
  };
}

/**
 * Configuração de performance
 */
export interface PerformanceConfig {
  targetFPS: number;
  maxDroppedFrames: number;
  memoryWarningThreshold: number;   // Em bytes
  lowPerformanceMode: {
    enabled: boolean;
    reducedParticles: boolean;
    lowerFPS: boolean;
    disableGlow: boolean;
    simplifiedShaders: boolean;
  };
  adaptiveQuality: {
    enabled: boolean;
    thresholds: {
      excellent: number;    // FPS threshold para qualidade máxima
      good: number;         // FPS threshold para qualidade boa
      acceptable: number;   // FPS threshold para qualidade aceitável
    };
  };
}

/**
 * Configuração de acessibilidade
 */
export interface AccessibilityConfig {
  reduceMotion: {
    enabled: boolean;
    fallbackType: 'static' | 'simplified' | 'text-only';
    progressIndicator: boolean;
  };
  highContrast: {
    enabled: boolean;
    colorAdjustments: Record<string, string>;
  };
  hapticFeedback: {
    enabled: boolean;
    intensity: 'light' | 'medium' | 'heavy';
    patterns: Record<AnimationState, string>;
  };
  screenReader: {
    enabled: boolean;
    descriptions: Record<AnimationState, string>;
    progressAnnouncements: boolean;
  };
}

/**
 * Configuração de interação do usuário
 */
export interface UserInteractionConfig {
  gestures: {
    tap: {
      enabled: boolean;
      action: 'skip' | 'boost' | 'interrupt' | 'none';
      requiredTaps: number;
    };
    doubleTap: {
      enabled: boolean;
      action: 'skip' | 'boost' | 'interrupt' | 'none';
      timeout: number;
    };
    longPress: {
      enabled: boolean;
      action: 'skip' | 'boost' | 'interrupt' | 'none';
      duration: number;
    };
    swipe: {
      enabled: boolean;
      direction: 'up' | 'down' | 'left' | 'right' | 'any';
      action: 'skip' | 'boost' | 'interrupt' | 'none';
      threshold: number;
    };
  };
  feedback: {
    visual: boolean;
    haptic: boolean;
    audio: boolean;
  };
}

/**
 * Evento de animação
 */
export interface AnimationEvent {
  type: 'stateChange' | 'phaseComplete' | 'error' | 'performance' | 'user' | 'system';
  timestamp: number;
  data: {
    previousState?: AnimationState;
    newState?: AnimationState;
    phase?: string;
    error?: Error;
    performance?: Partial<AnimationSystemState['performance']>;
    userAction?: string;
    systemInfo?: any;
  };
}

/**
 * Configuração do sistema de cache
 */
export interface CacheConfig {
  maxSize: number;           // Tamanho máximo do cache em bytes
  maxAge: number;            // Idade máxima dos itens em ms
  preloadStrategy: 'aggressive' | 'lazy' | 'predictive';
  compression: {
    enabled: boolean;
    level: number;           // 1-9, maior = mais compressão
    format: 'gzip' | 'lz4' | 'zstd';
  };
  persistence: {
    enabled: boolean;
    storage: 'memory' | 'disk' | 'hybrid';
    encryptionKey?: string;
  };
}

/**
 * Métricas de telemetria
 */
export interface TelemetryMetrics {
  session: {
    startTime: number;
    totalAnimations: number;
    successfulAnimations: number;
    failedAnimations: number;
    interruptedAnimations: number;
  };
  performance: {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    totalDroppedFrames: number;
    averageLoadTime: number;
    peakMemoryUsage: number;
  };
  user: {
    preferredThemes: string[];
    interactionPatterns: Record<string, number>;
    accessibilityFeatures: string[];
    skipRate: number;
  };
  errors: {
    count: number;
    types: Record<string, number>;
    criticalErrors: number;
  };
}

/**
 * Configuração principal do sistema de animações
 */
export interface AnimationSystemConfig {
  themes: Record<string, AnimationTheme>;
  performance: PerformanceConfig;
  accessibility: AccessibilityConfig;
  userInteraction: UserInteractionConfig;
  cache: CacheConfig;
  telemetry: {
    enabled: boolean;
    endpoint?: string;
    batchSize: number;
    flushInterval: number;
  };
  debugging: {
    enabled: boolean;
    showPerformanceOverlay: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    captureEvents: boolean;
  };
}

/**
 * Resposta da API para configuração de animação
 */
export interface AnimationConfigResponse {
  themes: AnimationTheme[];
  defaultTheme: string;
  userPreferences?: {
    preferredTheme?: string;
    accessibilitySettings?: Partial<AccessibilityConfig>;
    performanceSettings?: Partial<PerformanceConfig>;
  };
  experiments?: {
    [key: string]: boolean;
  };
  version: string;
}

/**
 * Utilitários de tipo para desenvolvimento
 */
export type AnimationStateHandler<T = void> = (state: AnimationSystemState) => T;
export type AnimationEventHandler<T = void> = (event: AnimationEvent) => T;
export type ThemeId = keyof AnimationSystemConfig['themes'];
export type EffectId = keyof VisualEffects;

/**
 * Validação de tipos em runtime
 */
export interface TypeValidation {
  isValidAnimationState(value: any): value is AnimationState;
  isValidTheme(value: any): value is AnimationTheme;
  isValidSpriteSheet(value: any): value is SpriteSheet;
}

// Export de tipos utilitários
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Constantes para valores padrão
 */
export const DEFAULT_ANIMATION_CONFIG: DeepPartial<AnimationSystemConfig> = {
  performance: {
    targetFPS: 60,
    maxDroppedFrames: 10,
    memoryWarningThreshold: 100 * 1024 * 1024, // 100MB
  },
  accessibility: {
    reduceMotion: {
      enabled: false,
      fallbackType: 'simplified',
    },
  },
  cache: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxAge: 30 * 60 * 1000,     // 30 minutos
    preloadStrategy: 'predictive',
  },
};

export const ANIMATION_STATES: ReadonlyArray<AnimationState> = [
  'idle', 'preloading', 'ready', 'opening', 'explosion', 'revealing',
  'celebrating', 'completed', 'interrupted', 'error', 'cleanup'
] as const;

export const DEFAULT_SPRITE_SHEET_CONFIG: Partial<SpriteSheet> = {
  fps: 30,
  loopable: false,
  preloadPriority: 'medium',
} as const;

/**
 * Novos tipos para sistema de gamificação aprimorado
 */

export type EmojiReactionType = 'beijo' | 'bravo' | 'cool' | 'lingua';
export type GameThemeType = 'fire' | 'ice' | 'meteor';

export interface EmojiReaction {
  id: string;
  type: EmojiReactionType;
  userId?: string;
  position: {
    x: number;
    y: number;
  };
  timestamp: number;
  opacity: number;
  scale: number;
  velocity: {
    x: number;
    y: number;
  };
}

export interface GameAsset {
  id: string;
  category: 'emoji' | 'theme' | 'effect';
  type: string;
  basePath: string;
  frameCount: number;
  framePrefix: string;
  frameExtension: string;
  startIndex: number;
  fps: number;
  duration: number;
  quality: 'low' | 'medium' | 'high';
  estimatedSize: number;
  preloadPriority: 'low' | 'medium' | 'high';
  dependencies?: string[];
  metadata?: {
    source?: string;
    description?: string;
    tags?: string[];
  };
}

export interface HapticPattern {
  name: string;
  pattern: number[];
  intensity: 'light' | 'medium' | 'heavy';
}

export interface GamePhase {
  name: string;
  duration: number;
  animations: string[];
  effects: VisualEffects;
  hapticPattern?: string;
  soundEffect?: string;
  canSkip: boolean;
}

export interface BoxOpeningSequence {
  id: string;
  theme: GameThemeType;
  phases: GamePhase[];
  totalDuration: number;
  rarityMultipliers: Record<string, number>;
}

export interface ReactionSystemConfig {
  maxConcurrentReactions: number;
  reactionLifetime: number;
  reactionSize: { min: number; max: number };
  reactionSpeed: { min: number; max: number };
  gravityEffect: boolean;
  collisionDetection: boolean;
}

export interface GamificationAssetConfig {
  version: string;
  baseUrl?: string;
  compressionEnabled: boolean;
  cacheStrategy: 'memory' | 'disk' | 'hybrid';
  preloadOnAppStart: string[];
  lazyLoadThreshold: number;
  maxMemoryUsage: number;
  cleanupInterval: number;
}

export const EMOJI_ASSETS: Record<EmojiReactionType, GameAsset> = {
  beijo: {
    id: 'emoji_beijo',
    category: 'emoji',
    type: 'reaction',
    basePath: 'assets/animations/emojis/beijo',
    frameCount: 27,
    framePrefix: 'EMOJI_BEIJO_',
    frameExtension: 'png',
    startIndex: 10,
    fps: 24,
    duration: 1125,
    quality: 'high',
    estimatedSize: 540,
    preloadPriority: 'medium'
  },
  bravo: {
    id: 'emoji_bravo',
    category: 'emoji',
    type: 'reaction',
    basePath: 'assets/animations/emojis/bravo',
    frameCount: 23,
    framePrefix: 'EMOJI_BRAVO_',
    frameExtension: 'png',
    startIndex: 11,
    fps: 24,
    duration: 958,
    quality: 'high',
    estimatedSize: 460,
    preloadPriority: 'medium'
  },
  cool: {
    id: 'emoji_cool',
    category: 'emoji',
    type: 'reaction',
    basePath: 'assets/animations/emojis/cool',
    frameCount: 26,
    framePrefix: 'EMOJI_COOL_00000_',
    frameExtension: 'png',
    startIndex: 16,
    fps: 24,
    duration: 1083,
    quality: 'high',
    estimatedSize: 520,
    preloadPriority: 'medium'
  },
  lingua: {
    id: 'emoji_lingua',
    category: 'emoji',
    type: 'reaction',
    basePath: 'assets/animations/emojis/lingua',
    frameCount: 10,
    framePrefix: 'EMOJI_LINGUA_',
    frameExtension: 'png',
    startIndex: 16,
    fps: 24,
    duration: 417,
    quality: 'high',
    estimatedSize: 200,
    preloadPriority: 'high'
  }
};

export const THEME_ASSETS: Record<GameThemeType, Record<string, GameAsset>> = {
  fire: {
    explosion: {
      id: 'fire_explosion',
      category: 'theme',
      type: 'explosion',
      basePath: 'assets/animations/themes/fire/explosion',
      frameCount: 28,
      framePrefix: 'EXPLOSAO_FOGO_',
      frameExtension: 'png',
      startIndex: 778,
      fps: 30,
      duration: 933,
      quality: 'high',
      estimatedSize: 1400,
      preloadPriority: 'high'
    },
    product: {
      id: 'fire_product',
      category: 'theme',
      type: 'product_reveal',
      basePath: 'assets/animations/themes/fire/product',
      frameCount: 121,
      framePrefix: 'FOGO_PRODUTO_',
      frameExtension: 'png',
      startIndex: 787,
      fps: 30,
      duration: 4033,
      quality: 'high',
      estimatedSize: 6050,
      preloadPriority: 'medium'
    },
    smoke: {
      id: 'fire_smoke',
      category: 'theme',
      type: 'ambient',
      basePath: 'assets/animations/themes/fire/smoke',
      frameCount: 38,
      framePrefix: 'FUMAÇA_FOGO_',
      frameExtension: 'png',
      startIndex: 767,
      fps: 24,
      duration: 1583,
      quality: 'medium',
      estimatedSize: 1900,
      preloadPriority: 'low'
    },
    burst: {
      id: 'fire_burst',
      category: 'theme',
      type: 'burst',
      basePath: 'assets/animations/themes/fire/burst',
      frameCount: 12,
      framePrefix: 'RAJADA_FOGO_',
      frameExtension: 'png',
      startIndex: 770,
      fps: 30,
      duration: 400,
      quality: 'high',
      estimatedSize: 600,
      preloadPriority: 'high'
    }
  },
  ice: {
    blizzard: {
      id: 'ice_blizzard',
      category: 'theme',
      type: 'ambient',
      basePath: 'assets/animations/themes/ice/blizzard',
      frameCount: 27,
      framePrefix: 'GELO_NEVASCA_',
      frameExtension: 'png',
      startIndex: 761,
      fps: 24,
      duration: 1125,
      quality: 'medium',
      estimatedSize: 1350,
      preloadPriority: 'medium'
    },
    bottom: {
      id: 'ice_bottom',
      category: 'theme',
      type: 'effect',
      basePath: 'assets/animations/themes/ice/bottom',
      frameCount: 11,
      framePrefix: 'GELO_baixo_',
      frameExtension: 'png',
      startIndex: 778,
      fps: 30,
      duration: 367,
      quality: 'high',
      estimatedSize: 550,
      preloadPriority: 'medium'
    },
    top: {
      id: 'ice_top',
      category: 'theme',
      type: 'effect',
      basePath: 'assets/animations/themes/ice/top',
      frameCount: 11,
      framePrefix: 'GELO_TOPO_',
      frameExtension: 'png',
      startIndex: 778,
      fps: 30,
      duration: 367,
      quality: 'high',
      estimatedSize: 550,
      preloadPriority: 'medium'
    },
    footer: {
      id: 'ice_footer',
      category: 'theme',
      type: 'effect',
      basePath: 'assets/animations/themes/ice/footer',
      frameCount: 10,
      framePrefix: 'GELO_FOOTER_',
      frameExtension: 'png',
      startIndex: 779,
      fps: 30,
      duration: 333,
      quality: 'high',
      estimatedSize: 500,
      preloadPriority: 'medium'
    }
  },
  meteor: {
    asteroid: {
      id: 'meteor_asteroid',
      category: 'theme',
      type: 'incoming',
      basePath: 'assets/animations/themes/meteor/asteroid',
      frameCount: 24,
      framePrefix: 'asteroid_',
      frameExtension: 'png',
      startIndex: 0,
      fps: 30,
      duration: 800,
      quality: 'high',
      estimatedSize: 1200,
      preloadPriority: 'high'
    },
    product_explosion: {
      id: 'meteor_product_explosion',
      category: 'theme',
      type: 'explosion',
      basePath: 'assets/animations/themes/meteor/product_explosion',
      frameCount: 14,
      framePrefix: 'EX_PRODUTO',
      frameExtension: 'png',
      startIndex: 0,
      fps: 30,
      duration: 467,
      quality: 'high',
      estimatedSize: 700,
      preloadPriority: 'high'
    },
    exit_explosion: {
      id: 'meteor_exit_explosion',
      category: 'theme',
      type: 'exit',
      basePath: 'assets/animations/themes/meteor/exit_explosion',
      frameCount: 24,
      framePrefix: 'EX_SAIDA',
      frameExtension: 'png',
      startIndex: 0,
      fps: 30,
      duration: 800,
      quality: 'high',
      estimatedSize: 1200,
      preloadPriority: 'medium'
    }
  }
};

export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  box_shake: {
    name: 'Box Shake',
    pattern: [0, 50, 30, 50, 30, 100],
    intensity: 'light'
  },
  explosion: {
    name: 'Explosion',
    pattern: [0, 200, 50, 100, 50, 300],
    intensity: 'heavy'
  },
  rare_item: {
    name: 'Rare Item',
    pattern: [0, 100, 50, 100, 50, 100, 50, 200],
    intensity: 'medium'
  },
  achievement: {
    name: 'Achievement',
    pattern: [0, 50, 25, 50, 25, 50, 25, 100, 50, 200],
    intensity: 'medium'
  },
  emoji_reaction: {
    name: 'Emoji Reaction',
    pattern: [0, 30, 20, 30],
    intensity: 'light'
  }
};