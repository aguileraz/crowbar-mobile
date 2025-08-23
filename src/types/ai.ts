/**
 * AI and Personalization Types
 * Define tipos para sistemas de IA, recomendação e personalização
 */

import { GameThemeType, EmojiReactionType } from './animations';

// Tipos de dados de comportamento do usuário
export interface UserBehavior {
  userId: string;
  sessionId: string;
  timestamp: string;
  action: UserActionType;
  context: ActionContext;
  metadata?: Record<string, any>;
}

export type UserActionType = 
  | 'box_opened'
  | 'theme_selected'
  | 'reaction_sent'
  | 'room_joined'
  | 'bet_placed'
  | 'friend_added'
  | 'achievement_unlocked'
  | 'item_favorited'
  | 'time_spent'
  | 'app_opened'
  | 'purchase_completed';

export interface ActionContext {
  screenName: string;
  previousScreen?: string;
  sessionDuration: number;
  deviceInfo: DeviceInfo;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  deviceType: 'phone' | 'tablet';
  screenSize: 'small' | 'medium' | 'large';
  connectionType: 'wifi' | 'cellular' | 'offline';
  batteryLevel?: number;
  performanceClass: 'low' | 'medium' | 'high';
}

// Perfil de preferências do usuário
export interface UserPreferences {
  userId: string;
  themes: ThemePreference[];
  openingTimes: TimePreference[];
  socialPreferences: SocialPreference;
  engagementLevel: 'casual' | 'regular' | 'hardcore';
  priceRange: PriceRange;
  categories: string[];
  lastUpdated: string;
}

export interface ThemePreference {
  theme: GameThemeType;
  affinity: number; // 0-1
  usageCount: number;
  lastUsed: string;
  successRate: number; // Taxa de satisfação
}

export interface TimePreference {
  hourRange: [number, number];
  dayOfWeek: number[];
  frequency: number;
  avgSessionLength: number;
}

export interface SocialPreference {
  prefersSolo: boolean;
  prefersMultiplayer: boolean;
  avgGroupSize: number;
  interactionRate: number;
  betParticipation: number;
}

export interface PriceRange {
  min: number;
  max: number;
  sweet_spot: number;
  sensitivity: 'low' | 'medium' | 'high';
}

// Sistema de recomendações
export interface Recommendation {
  id: string;
  type: RecommendationType;
  confidence: number; // 0-1
  reason: string;
  data: any;
  expiresAt: string;
  priority: 'low' | 'medium' | 'high';
}

export type RecommendationType = 
  | 'theme'
  | 'box'
  | 'friend'
  | 'room'
  | 'time_to_open'
  | 'achievement'
  | 'challenge'
  | 'promotion';

export interface ThemeRecommendation extends Recommendation {
  type: 'theme';
  data: {
    theme: GameThemeType;
    matchScore: number;
    reasons: string[];
    alternativeThemes: GameThemeType[];
  };
}

export interface BoxRecommendation extends Recommendation {
  type: 'box';
  data: {
    boxId: string;
    title: string;
    price: number;
    predictedSatisfaction: number;
    similarUsers: number; // Quantos usuários similares compraram
  };
}

// Modelos de predição
export interface PredictionModel {
  modelId: string;
  version: string;
  type: ModelType;
  accuracy: number;
  lastTrained: string;
  features: string[];
  hyperparameters: Record<string, any>;
}

export type ModelType = 
  | 'theme_preference'
  | 'churn_prediction'
  | 'ltv_prediction'
  | 'engagement_forecast'
  | 'satisfaction_predictor';

export interface PredictionResult {
  modelId: string;
  prediction: any;
  confidence: number;
  explanation?: string[];
  timestamp: string;
}

// A/B Testing
export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: TestVariant[];
  metrics: TestMetric[];
  targetAudience?: AudienceFilter;
}

export interface TestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Porcentagem de tráfego
  config: Record<string, any>;
  isControl: boolean;
}

export interface TestMetric {
  name: string;
  type: 'conversion' | 'engagement' | 'retention' | 'revenue';
  goalValue?: number;
  significance: number;
}

export interface AudienceFilter {
  minSessions?: number;
  countries?: string[];
  platforms?: ('ios' | 'android')[];
  engagementLevel?: ('casual' | 'regular' | 'hardcore')[];
  customFilters?: Record<string, any>;
}

export interface TestResult {
  testId: string;
  variantId: string;
  metrics: {
    [metricName: string]: {
      value: number;
      confidence: number;
      uplift: number; // vs control
      significance: boolean;
    };
  };
  sampleSize: number;
  duration: number;
}

// Personalização adaptativa
export interface PersonalizationProfile {
  userId: string;
  segments: UserSegment[];
  features: FeatureFlags;
  experiments: ActiveExperiment[];
  dynamicContent: DynamicContent[];
  lastUpdated: string;
}

export interface UserSegment {
  segmentId: string;
  name: string;
  confidence: number;
  traits: string[];
  joinedAt: string;
}

export interface FeatureFlags {
  [featureName: string]: {
    enabled: boolean;
    variant?: string;
    config?: Record<string, any>;
  };
}

export interface ActiveExperiment {
  experimentId: string;
  variantId: string;
  enrolledAt: string;
  sticky: boolean; // Mantém o usuário no mesmo grupo
}

export interface DynamicContent {
  contentId: string;
  type: 'banner' | 'tooltip' | 'notification' | 'animation';
  personalizationRules: PersonalizationRule[];
  content: any;
}

export interface PersonalizationRule {
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
}

export interface RuleCondition {
  type: 'behavioral' | 'demographic' | 'temporal' | 'contextual';
  operator: 'equals' | 'contains' | 'greater' | 'lesser' | 'between';
  field: string;
  value: any;
}

export interface RuleAction {
  type: 'show' | 'hide' | 'modify' | 'redirect';
  target: string;
  value?: any;
}

// Analytics preditivo
export interface PredictiveMetrics {
  userId: string;
  churnProbability: number;
  ltv: number; // Lifetime value
  nextPurchaseDate?: string;
  recommendedActions: string[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  probability: number;
  mitigation: string;
}

export interface Opportunity {
  type: string;
  description: string;
  potentialValue: number;
  confidence: number;
  timeWindow: string;
}

// Otimização de qualidade
export interface QualityOptimization {
  userId: string;
  deviceProfile: DevicePerformanceProfile;
  networkProfile: NetworkProfile;
  recommendedSettings: OptimizedSettings;
  adaptiveQuality: boolean;
}

export interface DevicePerformanceProfile {
  cpuScore: number;
  gpuScore: number;
  memoryAvailable: number;
  storageAvailable: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  batteryLevel: number;
  isCharging: boolean;
}

export interface NetworkProfile {
  type: 'wifi' | 'cellular_5g' | 'cellular_4g' | 'cellular_3g' | 'offline';
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
  stability: 'stable' | 'unstable' | 'poor';
}

export interface OptimizedSettings {
  animationQuality: 'low' | 'medium' | 'high' | 'ultra';
  particleEffects: boolean;
  soundQuality: 'compressed' | 'normal' | 'high';
  preloadStrategy: 'minimal' | 'balanced' | 'aggressive';
  cacheSize: number;
  framerate: 30 | 60 | 120;
  resolution: 'auto' | '720p' | '1080p' | '1440p';
}

// Configurações de ML
export interface MLConfig {
  modelsEndpoint: string;
  updateInterval: number; // horas
  offlineMode: boolean;
  privacyMode: 'full' | 'limited' | 'none';
  dataRetention: number; // dias
  minDataPoints: number; // Mínimo de dados para treinar
  confidenceThreshold: number; // 0-1
}

// Eventos de tracking para ML
export interface MLEvent {
  eventId: string;
  userId: string;
  eventType: string;
  features: Record<string, any>;
  label?: any; // Para aprendizado supervisionado
  timestamp: string;
  context: Record<string, any>;
}