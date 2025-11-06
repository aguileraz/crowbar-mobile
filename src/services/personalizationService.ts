/**
 * Personalization Service
 * Sistema de personalização adaptativa da experiência do usuário
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PersonalizationProfile,
  UserSegment,
  FeatureFlags,
  ActiveExperiment,
  DynamicContent,
  PersonalizationRule,
  RuleCondition,
  RuleAction,
  UserBehavior,
} from '../types/ai';
import aiRecommendationService from './aiRecommendationService';
import abTestingService from './abTestingService';
import qualityOptimizationService from './qualityOptimizationService';
import { analyticsService } from './analyticsService';

interface SegmentDefinition {
  id: string;
  name: string;
  rules: SegmentRule[];
  priority: number;
}

interface SegmentRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'lesser' | 'between' | 'in';
  value: any;
}

interface ContentVariation {
  id: string;
  segment: string;
  content: any;
  weight: number;
}

interface PersonalizationEvent {
  eventType: 'segment_changed' | 'feature_toggled' | 'content_shown';
  data: any;
  timestamp: string;
}

class PersonalizationService {
  private static instance: PersonalizationService;
  private userProfiles: Map<string, PersonalizationProfile> = new Map();
  private segmentDefinitions: SegmentDefinition[] = [];
  private dynamicContents: Map<string, DynamicContent[]> = new Map();
  private personalizationEvents: PersonalizationEvent[] = [];
  private userId: string | null = null;
  private isInitialized = false;
  
  // Cache de avaliações
  private evaluationCache: Map<string, any> = new Map();
  private cacheExpiry = 60 * 1000; // 1 minuto
  private lastEvaluationTime = 0;
  
  // Feature flags globais
  private globalFeatureFlags: FeatureFlags = {};
  
  // Regras de personalização ativas
  private activeRules: PersonalizationRule[] = [];

  private constructor() {
    this.initializeSegments();
    this.initializeFeatureFlags();
    this.initializePersonalizationRules();
  }

  static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }

  /**
   * Inicializa definições de segmentos
   */
  private initializeSegments(): void {
    this.segmentDefinitions = [
      {
        id: 'new_users',
        name: 'Novos Usuários',
        rules: [
          { field: 'sessions_count', operator: 'lesser', value: 5 },
          { field: 'days_since_install', operator: 'lesser', value: 7 },
        ],
        priority: 1,
      },
      {
        id: 'power_users',
        name: 'Power Users',
        rules: [
          { field: 'engagement_level', operator: 'equals', value: 'hardcore' },
          { field: 'daily_sessions', operator: 'greater', value: 3 },
        ],
        priority: 2,
      },
      {
        id: 'social_enthusiasts',
        name: 'Entusiastas Sociais',
        rules: [
          { field: 'social_interaction_rate', operator: 'greater', value: 0.5 },
          { field: 'friends_count', operator: 'greater', value: 10 },
        ],
        priority: 3,
      },
      {
        id: 'high_spenders',
        name: 'Alto Valor',
        rules: [
          { field: 'total_spent', operator: 'greater', value: 500 },
          { field: 'avg_purchase_value', operator: 'greater', value: 100 },
        ],
        priority: 4,
      },
      {
        id: 'at_risk',
        name: 'Em Risco',
        rules: [
          { field: 'days_since_last_session', operator: 'greater', value: 7 },
          { field: 'churn_probability', operator: 'greater', value: 0.6 },
        ],
        priority: 5,
      },
      {
        id: 'theme_explorers',
        name: 'Exploradores de Temas',
        rules: [
          { field: 'unique_themes_used', operator: 'greater', value: 2 },
          { field: 'theme_switch_frequency', operator: 'greater', value: 0.3 },
        ],
        priority: 6,
      },
    ];
  }

  /**
   * Inicializa feature flags padrão
   */
  private initializeFeatureFlags(): void {
    this.globalFeatureFlags = {
      enhanced_animations: {
        enabled: true,
        variant: 'default',
        config: { quality: 'auto' },
      },
      social_features: {
        enabled: true,
        variant: 'full',
        config: { features: ['rooms', 'betting', 'reactions'] },
      },
      ai_recommendations: {
        enabled: true,
        variant: 'advanced',
        config: { algorithm: 'hybrid' },
      },
      achievement_system: {
        enabled: true,
        config: { showProgress: true, notifications: true },
      },
      adaptive_quality: {
        enabled: true,
        config: { autoAdjust: true },
      },
      seasonal_themes: {
        enabled: false, // Ativado apenas em datas especiais
        config: { theme: null },
      },
      beta_features: {
        enabled: false,
        config: { features: [] },
      },
    };
  }

  /**
   * Inicializa regras de personalização
   */
  private initializePersonalizationRules(): void {
    this.activeRules = [
      // Regra para novos usuários
      {
        condition: {
          type: 'behavioral',
          operator: 'lesser',
          field: 'sessions_count',
          value: 3,
        },
        action: {
          type: 'show',
          target: 'onboarding_tooltip',
          value: { extended: true },
        },
        priority: 1,
      },
      // Regra para horário noturno
      {
        condition: {
          type: 'temporal',
          operator: 'between',
          field: 'hour',
          value: [22, 6],
        },
        action: {
          type: 'modify',
          target: 'theme_mode',
          value: 'dark',
        },
        priority: 2,
      },
      // Regra para baixa bateria
      {
        condition: {
          type: 'contextual',
          operator: 'lesser',
          field: 'battery_level',
          value: 0.2,
        },
        action: {
          type: 'modify',
          target: 'animation_quality',
          value: 'low',
        },
        priority: 3,
      },
      // Regra para usuários em risco
      {
        condition: {
          type: 'behavioral',
          operator: 'greater',
          field: 'days_inactive',
          value: 5,
        },
        action: {
          type: 'show',
          target: 'retention_offer',
          value: { discount: 20 },
        },
        priority: 4,
      },
      // Regra para alta performance
      {
        condition: {
          type: 'contextual',
          operator: 'equals',
          field: 'device_performance',
          value: 'high',
        },
        action: {
          type: 'modify',
          target: 'particle_effects',
          value: true,
        },
        priority: 5,
      },
    ];
  }

  /**
   * Inicializa o serviço para um usuário
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserProfile();
    await this.evaluateUserSegments();
    await this.applyExperiments();
    this.isInitialized = true;
    
  }

  /**
   * Carrega perfil do usuário
   */
  private async loadUserProfile(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const profileData = await AsyncStorage.getItem(`personalization_profile_${this.userId}`);
      
      if (profileData) {
        const profile = JSON.parse(profileData);
        this.userProfiles.set(this.userId, profile);
      } else {
        // Cria perfil inicial
        const newProfile = await this.createInitialProfile();
        this.userProfiles.set(this.userId, newProfile);
      }
    } catch (error) {
      // console.error('Erro ao carregar perfil de personalização:', error);
    }
  }

  /**
   * Cria perfil inicial
   */
  private async createInitialProfile(): Promise<PersonalizationProfile> {
    const experiments = abTestingService.getUserExperiments();
    
    return {
      userId: this.userId!,
      segments: [],
      features: { ...this.globalFeatureFlags },
      experiments,
      dynamicContent: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Avalia segmentos do usuário
   */
  private async evaluateUserSegments(): Promise<void> {
    if (!this.userId) return;
    
    const profile = this.userProfiles.get(this.userId);
    if (!profile) return;
    
    const userData = await this.collectUserData();
    const newSegments: UserSegment[] = [];
    
    // Avalia cada definição de segmento
    for (const segmentDef of this.segmentDefinitions) {
      const confidence = this.evaluateSegmentRules(segmentDef.rules, userData);
      
      if (confidence > 0.5) {
        newSegments.push({
          segmentId: segmentDef.id,
          name: segmentDef.name,
          confidence,
          traits: this.extractSegmentTraits(segmentDef.id),
          joinedAt: new Date().toISOString(),
        });
      }
    }
    
    // Detecta mudanças de segmento
    const oldSegmentIds = new Set(profile.segments.map(s => s.segmentId));
    const newSegmentIds = new Set(newSegments.map(s => s.segmentId));
    
    const added = newSegments.filter(s => !oldSegmentIds.has(s.segmentId));
    const removed = profile.segments.filter(s => !newSegmentIds.has(s.segmentId));
    
    if (added.length > 0 || removed.length > 0) {
      
      this.trackSegmentChange(added, removed);
    }
    
    profile.segments = newSegments;
    profile.lastUpdated = new Date().toISOString();
    
    await this.saveProfile();
  }

  /**
   * Coleta dados do usuário
   */
  private async collectUserData(): Promise<Record<string, any>> {
    // Integra com outros serviços para coletar dados
    const _recommendations = aiRecommendationService.getRecommendations(this.userId!);
    const qualityProfile = qualityOptimizationService.getCurrentProfile();
    
    // Simula coleta de dados (em produção, buscar de APIs/banco)
    return {
      sessions_count: Math.floor(Math.random() * 100),
      days_since_install: Math.floor(Math.random() * 30),
      engagement_level: 'regular',
      daily_sessions: Math.floor(Math.random() * 5),
      social_interaction_rate: Math.random(),
      friends_count: Math.floor(Math.random() * 20),
      total_spent: Math.random() * 1000,
      avg_purchase_value: Math.random() * 200,
      days_since_last_session: Math.floor(Math.random() * 10),
      churn_probability: Math.random() * 0.5,
      unique_themes_used: Math.floor(Math.random() * 4),
      theme_switch_frequency: Math.random(),
      hour: new Date().getHours(),
      battery_level: qualityProfile?.deviceProfile.batteryLevel || 1,
      device_performance: qualityProfile?.recommendedSettings.animationQuality || 'medium',
      days_inactive: 0,
    };
  }

  /**
   * Avalia regras de segmento
   */
  private evaluateSegmentRules(rules: SegmentRule[], userData: Record<string, any>): number {
    let matchedRules = 0;
    
    for (const rule of rules) {
      const value = userData[rule.field];
      if (value === undefined) continue;
      
      let matches = false;
      
      switch (rule.operator) {
        case 'equals':
          matches = value === rule.value;
          break;
        case 'contains':
          matches = String(value).includes(rule.value);
          break;
        case 'greater':
          matches = value > rule.value;
          break;
        case 'lesser':
          matches = value < rule.value;
          break;
        case 'between':
          matches = value >= rule.value[0] && value <= rule.value[1];
          break;
        case 'in':
          matches = rule.value.includes(value);
          break;
      }
      
      if (matches) matchedRules++;
    }
    
    return rules.length > 0 ? matchedRules / rules.length : 0;
  }

  /**
   * Extrai traits do segmento
   */
  private extractSegmentTraits(segmentId: string): string[] {
    const traits: Record<string, string[]> = {
      new_users: ['onboarding_needed', 'tutorial_priority', 'simplified_ui'],
      power_users: ['advanced_features', 'beta_access', 'performance_priority'],
      social_enthusiasts: ['social_features_enhanced', 'multiplayer_priority', 'sharing_enabled'],
      high_spenders: ['premium_offers', 'exclusive_content', 'vip_support'],
      at_risk: ['retention_campaigns', 'special_offers', 'engagement_prompts'],
      theme_explorers: ['new_themes_early', 'theme_recommendations', 'customization_options'],
    };
    
    return traits[segmentId] || [];
  }

  /**
   * Registra mudança de segmento
   */
  private trackSegmentChange(added: UserSegment[], removed: UserSegment[]): void {
    this.personalizationEvents.push({
      eventType: 'segment_changed',
      data: { added, removed },
      timestamp: new Date().toISOString(),
    });
    
    // Analytics
    added.forEach(segment => {
      analyticsService.trackEngagement('segment_joined', segment.segmentId, 1);
    });
    
    removed.forEach(segment => {
      analyticsService.trackEngagement('segment_left', segment.segmentId, 1);
    });
  }

  /**
   * Aplica experimentos ativos
   */
  private async applyExperiments(): Promise<void> {
    if (!this.userId) return;
    
    const profile = this.userProfiles.get(this.userId);
    if (!profile) return;
    
    // Obtém experimentos do A/B testing service
    const experiments = abTestingService.getUserExperiments();
    profile.experiments = experiments;
    
    // Aplica configurações dos experimentos às feature flags
    for (const experiment of experiments) {
      const config = abTestingService.getVariantConfig(experiment.experimentId);
      if (config) {
        this.applyExperimentConfig(experiment.experimentId, config);
      }
    }
  }

  /**
   * Aplica configuração de experimento
   */
  private applyExperimentConfig(experimentId: string, config: Record<string, any>): void {
    const profile = this.userProfiles.get(this.userId!);
    if (!profile) return;
    
    // Mapeia experimentos para feature flags
    const experimentFeatureMap: Record<string, string> = {
      'animation_quality_test': 'enhanced_animations',
      'theme_recommendation_test': 'ai_recommendations',
      'social_features_test': 'social_features',
    };
    
    const featureName = experimentFeatureMap[experimentId];
    if (featureName && profile.features[featureName]) {
      profile.features[featureName].config = {
        ...profile.features[featureName].config,
        ...config,
      };
    }
  }

  /**
   * Obtém feature flag
   */
  getFeatureFlag(featureName: string): any {
    if (!this.userId) return this.globalFeatureFlags[featureName];
    
    const profile = this.userProfiles.get(this.userId);
    if (!profile) return this.globalFeatureFlags[featureName];
    
    return profile.features[featureName] || this.globalFeatureFlags[featureName];
  }

  /**
   * Verifica se feature está habilitada
   */
  isFeatureEnabled(featureName: string): boolean {
    const flag = this.getFeatureFlag(featureName);
    return flag?.enabled || false;
  }

  /**
   * Obtém configuração de feature
   */
  getFeatureConfig(featureName: string): Record<string, any> | null {
    const flag = this.getFeatureFlag(featureName);
    return flag?.config || null;
  }

  /**
   * Avalia regras de personalização
   */
  async evaluateRules(context?: Record<string, any>): Promise<RuleAction[]> {
    const userData = await this.collectUserData();
    const fullContext = { ...userData, ...context };
    
    const actions: RuleAction[] = [];
    
    // Avalia cada regra
    for (const rule of this.activeRules) {
      if (this.evaluateCondition(rule.condition, fullContext)) {
        actions.push(rule.action);
      }
    }
    
    // Ordena por prioridade (implícita pela ordem)
    return actions;
  }

  /**
   * Avalia condição
   */
  private evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
    const value = context[condition.field];
    if (value === undefined) return false;
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'greater':
        return value > condition.value;
      case 'lesser':
        return value < condition.value;
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1];
      default:
        return false;
    }
  }

  /**
   * Obtém conteúdo dinâmico personalizado
   */
  async getDynamicContent(contentId: string, context?: Record<string, any>): Promise<any> {
    // Verifica cache
    const cacheKey = `${contentId}_${JSON.stringify(context)}`;
    const cached = this.evaluationCache.get(cacheKey);
    
    if (cached && Date.now() - this.lastEvaluationTime < this.cacheExpiry) {
      return cached;
    }
    
    const profile = this.userProfiles.get(this.userId!);
    if (!profile) return null;
    
    // Busca conteúdo específico para os segmentos do usuário
    const _userSegmentIds = profile.segments.map(s => s.segmentId);
    const contents = this.dynamicContents.get(contentId) || [];
    
    // Filtra conteúdos aplicáveis
    const applicableContents = contents.filter(content => {
      // Avalia regras de personalização
      for (const rule of content.personalizationRules) {
        if (!this.evaluateCondition(rule.condition, context || {})) {
          return false;
        }
      }
      return true;
    });
    
    if (applicableContents.length === 0) return null;
    
    // Seleciona conteúdo com maior prioridade
    const selectedContent = applicableContents.reduce((prev, curr) => {
      const prevPriority = curr.personalizationRules[0]?.priority || 0;
      const currPriority = curr.personalizationRules[0]?.priority || 0;
      return currPriority > prevPriority ? curr : prev;
    });
    
    // Cacheia resultado
    this.evaluationCache.set(cacheKey, selectedContent.content);
    this.lastEvaluationTime = Date.now();
    
    // Registra evento
    this.personalizationEvents.push({
      eventType: 'content_shown',
      data: { contentId, content: selectedContent.content },
      timestamp: new Date().toISOString(),
    });
    
    return selectedContent.content;
  }

  /**
   * Registra conteúdo dinâmico
   */
  registerDynamicContent(content: DynamicContent): void {
    const contentList = this.dynamicContents.get(content.contentId) || [];
    contentList.push(content);
    this.dynamicContents.set(content.contentId, contentList);
  }

  /**
   * Obtém segmentos do usuário
   */
  getUserSegments(): UserSegment[] {
    if (!this.userId) return [];
    
    const profile = this.userProfiles.get(this.userId);
    return profile?.segments || [];
  }

  /**
   * Verifica se usuário está em segmento
   */
  isInSegment(segmentId: string): boolean {
    const segments = this.getUserSegments();
    return segments.some(s => s.segmentId === segmentId);
  }

  /**
   * Obtém perfil completo
   */
  getProfile(): PersonalizationProfile | null {
    if (!this.userId) return null;
    return this.userProfiles.get(this.userId) || null;
  }

  /**
   * Atualiza feature flag
   */
  async updateFeatureFlag(featureName: string, enabled: boolean, config?: Record<string, any>): Promise<void> {
    if (!this.userId) return;
    
    const profile = this.userProfiles.get(this.userId);
    if (!profile) return;
    
    if (!profile.features[featureName]) {
      profile.features[featureName] = { enabled, config };
    } else {
      profile.features[featureName].enabled = enabled;
      if (config) {
        profile.features[featureName].config = config;
      }
    }
    
    await this.saveProfile();
    
    // Registra evento
    this.personalizationEvents.push({
      eventType: 'feature_toggled',
      data: { featureName, enabled },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Força reavaliação
   */
  async reevaluate(): Promise<void> {
    this.evaluationCache.clear();
    await this.evaluateUserSegments();
    await this.applyExperiments();
  }

  /**
   * Salva perfil
   */
  private async saveProfile(): Promise<void> {
    if (!this.userId) return;
    
    const profile = this.userProfiles.get(this.userId);
    if (!profile) return;
    
    try {
      await AsyncStorage.setItem(
        `personalization_profile_${this.userId}`,
        JSON.stringify(profile)
      );
    } catch (error) {
      // console.error('Erro ao salvar perfil de personalização:', error);
    }
  }

  /**
   * Obtém eventos de personalização
   */
  getEvents(): PersonalizationEvent[] {
    return this.personalizationEvents;
  }

  /**
   * Limpa dados antigos
   */
  async cleanup(): Promise<void> {
    // Mantém apenas últimos 100 eventos
    if (this.personalizationEvents.length > 100) {
      this.personalizationEvents = this.personalizationEvents.slice(-100);
    }
    
    // Limpa cache
    this.evaluationCache.clear();
  }
}

export default PersonalizationService.getInstance();