/**
 * AI Recommendation Service
 * Sistema inteligente de recomendações baseado em Machine Learning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  _UserBehavior,
  UserPreferences,
  Recommendation,
  ThemeRecommendation,
  BoxRecommendation,
  ThemePreference,
  UserActionType,
  RecommendationType,
  PredictionResult,
} from '../types/ai';
import { GameThemeType } from '../types/animations';
import { analyticsService } from './analyticsService';

interface BehaviorPattern {
  action: UserActionType;
  frequency: number;
  lastOccurrence: string;
  contexts: Map<string, number>;
}

interface ThemeUsageStats {
  theme: GameThemeType;
  usageCount: number;
  successRate: number;
  avgEngagementTime: number;
  lastUsed: Date;
}

class AIRecommendationService {
  private static instance: AIRecommendationService;
  private userBehaviors: Map<string, UserBehavior[]> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern[]> = new Map();
  private themeStats: Map<string, ThemeUsageStats[]> = new Map();
  private isInitialized = false;
  
  // Constantes do modelo
  private readonly MIN_DATA_POINTS = 10;
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly RECOMMENDATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas
  private readonly MAX_BEHAVIORS_STORED = 1000;
  private readonly PATTERN_DECAY_RATE = 0.95; // Decaimento temporal

  private constructor() {}

  static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  /**
   * Inicializa o serviço com dados do usuário
   */
  async initialize(userId: string): Promise<void> {
    await this.loadUserData(userId);
    this.isInitialized = true;
    
    // Inicia processamento assíncrono
    this.processUserPatterns(userId);
    this.generateRecommendations(userId);
  }

  /**
   * Registra comportamento do usuário
   */
  async trackBehavior(behavior: UserBehavior): Promise<void> {
    const { userId } = behavior;
    
    // Adiciona ao histórico
    if (!this.userBehaviors.has(userId)) {
      this.userBehaviors.set(userId, []);
    }
    
    const behaviors = this.userBehaviors.get(userId)!;
    behaviors.push(behavior);
    
    // Limita tamanho do histórico
    if (behaviors.length > this.MAX_BEHAVIORS_STORED) {
      behaviors.shift();
    }
    
    // Atualiza padrões em tempo real
    this.updateBehaviorPattern(userId, behavior);
    
    // Atualiza estatísticas de tema se aplicável
    if (behavior.action === 'theme_selected' && behavior.metadata?.theme) {
      this.updateThemeStats(userId, behavior.metadata.theme as GameThemeType, behavior);
    }
    
    // Persiste dados
    await this.saveUserData(userId);
    
    // Trigger recomendações se atingir threshold
    if (behaviors.length % 10 === 0) {
      this.generateRecommendations(userId);
    }
  }

  /**
   * Atualiza padrões de comportamento
   */
  private updateBehaviorPattern(userId: string, behavior: UserBehavior): void {
    if (!this.behaviorPatterns.has(userId)) {
      this.behaviorPatterns.set(userId, []);
    }
    
    const patterns = this.behaviorPatterns.get(userId)!;
    let pattern = patterns.find(p => p.action === behavior.action);
    
    if (!pattern) {
      pattern = {
        action: behavior.action,
        frequency: 0,
        lastOccurrence: behavior.timestamp,
        contexts: new Map(),
      };
      patterns.push(pattern);
    }
    
    // Atualiza frequência com decaimento temporal
    const timeSinceLastBehavior = new Date(behavior.timestamp).getTime() - 
                                  new Date(pattern.lastOccurrence).getTime();
    const decayFactor = Math.pow(this.PATTERN_DECAY_RATE, timeSinceLastBehavior / (24 * 60 * 60 * 1000));
    
    pattern.frequency = pattern.frequency * decayFactor + 1;
    pattern.lastOccurrence = behavior.timestamp;
    
    // Atualiza contextos
    const contextKey = `${behavior.context.screenName}_${behavior.context.timeOfDay}`;
    pattern.contexts.set(contextKey, (pattern.contexts.get(contextKey) || 0) + 1);
  }

  /**
   * Atualiza estatísticas de uso de temas
   */
  private updateThemeStats(userId: string, theme: GameThemeType, behavior: UserBehavior): void {
    if (!this.themeStats.has(userId)) {
      this.themeStats.set(userId, []);
    }
    
    const stats = this.themeStats.get(userId)!;
    let themeStat = stats.find(s => s.theme === theme);
    
    if (!themeStat) {
      themeStat = {
        theme,
        usageCount: 0,
        successRate: 0,
        avgEngagementTime: 0,
        lastUsed: new Date(),
      };
      stats.push(themeStat);
    }
    
    themeStat.usageCount++;
    themeStat.lastUsed = new Date(behavior.timestamp);
    
    // Atualiza tempo de engajamento se disponível
    if (behavior.metadata?.engagementTime) {
      themeStat.avgEngagementTime = 
        (themeStat.avgEngagementTime * (themeStat.usageCount - 1) + behavior.metadata.engagementTime) / 
        themeStat.usageCount;
    }
    
    // Atualiza taxa de sucesso se disponível
    if (behavior.metadata?.success !== undefined) {
      themeStat.successRate = 
        (themeStat.successRate * (themeStat.usageCount - 1) + (behavior.metadata.success ? 1 : 0)) / 
        themeStat.usageCount;
    }
  }

  /**
   * Processa padrões do usuário usando algoritmos de ML
   */
  private async processUserPatterns(userId: string): Promise<void> {
    const behaviors = this.userBehaviors.get(userId) || [];
    
    if (behaviors.length < this.MIN_DATA_POINTS) {
      return;
    }
    
    // Análise de preferências temporais
    const timePreferences = this.analyzeTimePreferences(behaviors);
    
    // Análise de preferências sociais
    const socialPreferences = this.analyzeSocialPreferences(behaviors);
    
    // Análise de sensibilidade a preço
    const priceRange = this.analyzePricePreferences(behaviors);
    
    // Análise de preferências de tema
    const themePreferences = this.analyzeThemePreferences(userId);
    
    // Determina nível de engajamento
    const engagementLevel = this.calculateEngagementLevel(behaviors);
    
    // Cria ou atualiza perfil de preferências
    const preferences: UserPreferences = {
      userId,
      themes: themePreferences,
      openingTimes: timePreferences,
      socialPreferences,
      engagementLevel,
      priceRange,
      categories: this.extractPreferredCategories(behaviors),
      lastUpdated: new Date().toISOString(),
    };
    
    this.userPreferences.set(userId, preferences);
  }

  /**
   * Analisa preferências de horário
   */
  private analyzeTimePreferences(behaviors: UserBehavior[]): any[] {
    const timeMap = new Map<string, number>();
    
    behaviors.forEach(b => {
      const hour = new Date(b.timestamp).getHours();
      const key = `${Math.floor(hour / 4)}`; // Agrupa em períodos de 4 horas
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });
    
    return Array.from(timeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([period, frequency]) => ({
        hourRange: [parseInt(period, 10) * 4, (parseInt(period, 10) + 1) * 4],
        dayOfWeek: [0, 1, 2, 3, 4, 5, 6], // Simplificado
        frequency,
        avgSessionLength: 15, // Minutos - simplificado
      }));
  }

  /**
   * Analisa preferências sociais
   */
  private analyzeSocialPreferences(behaviors: UserBehavior[]): any {
    const socialBehaviors = behaviors.filter(b => 
      ['room_joined', 'bet_placed', 'friend_added', 'reaction_sent'].includes(b.action)
    );
    
    const totalBehaviors = behaviors.length;
    const socialRatio = socialBehaviors.length / totalBehaviors;
    
    return {
      prefersSolo: socialRatio < 0.3,
      prefersMultiplayer: socialRatio > 0.5,
      avgGroupSize: 3, // Simplificado
      interactionRate: socialRatio,
      betParticipation: behaviors.filter(b => b.action === 'bet_placed').length / totalBehaviors,
    };
  }

  /**
   * Analisa preferências de preço
   */
  private analyzePricePreferences(behaviors: UserBehavior[]): any {
    const purchases = behaviors.filter(b => b.action === 'purchase_completed');
    
    if (purchases.length === 0) {
      return {
        min: 0,
        max: 100,
        sweet_spot: 50,
        sensitivity: 'medium',
      };
    }
    
    const prices = purchases.map(p => p.metadata?.price || 0).filter(p => p > 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      min: minPrice * 0.8,
      max: maxPrice * 1.2,
      sweet_spot: avgPrice,
      sensitivity: this.calculatePriceSensitivity(prices),
    };
  }

  /**
   * Calcula sensibilidade a preço
   */
  private calculatePriceSensitivity(prices: number[]): 'low' | 'medium' | 'high' {
    if (prices.length < 2) return 'medium';
    
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coeficiente de variação
    
    if (cv < 0.2) return 'low';
    if (cv > 0.5) return 'high';
    return 'medium';
  }

  /**
   * Analisa preferências de tema
   */
  private analyzeThemePreferences(userId: string): ThemePreference[] {
    const stats = this.themeStats.get(userId) || [];
    
    return stats.map(stat => ({
      theme: stat.theme,
      affinity: this.calculateThemeAffinity(stat),
      usageCount: stat.usageCount,
      lastUsed: stat.lastUsed.toISOString(),
      successRate: stat.successRate,
    }))
    .sort((a, b) => b.affinity - a.affinity);
  }

  /**
   * Calcula afinidade com tema usando múltiplos fatores
   */
  private calculateThemeAffinity(stats: ThemeUsageStats): number {
    const recencyScore = this.calculateRecencyScore(stats.lastUsed);
    const frequencyScore = Math.min(stats.usageCount / 20, 1); // Normaliza até 20 usos
    const successScore = stats.successRate;
    const engagementScore = Math.min(stats.avgEngagementTime / 300, 1); // Normaliza até 5 minutos
    
    // Média ponderada
    return (
      recencyScore * 0.3 +
      frequencyScore * 0.3 +
      successScore * 0.2 +
      engagementScore * 0.2
    );
  }

  /**
   * Calcula score de recência
   */
  private calculateRecencyScore(lastUsed: Date): number {
    const daysSince = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    return Math.exp(-daysSince / 7); // Decaimento exponencial com meia-vida de 7 dias
  }

  /**
   * Calcula nível de engajamento
   */
  private calculateEngagementLevel(behaviors: UserBehavior[]): 'casual' | 'regular' | 'hardcore' {
    const daysActive = new Set(behaviors.map(b => 
      new Date(b.timestamp).toDateString()
    )).size;
    
    const avgBehaviorsPerDay = behaviors.length / Math.max(daysActive, 1);
    
    if (avgBehaviorsPerDay < 5) return 'casual';
    if (avgBehaviorsPerDay < 20) return 'regular';
    return 'hardcore';
  }

  /**
   * Extrai categorias preferidas
   */
  private extractPreferredCategories(behaviors: UserBehavior[]): string[] {
    const categoryMap = new Map<string, number>();
    
    behaviors.forEach(b => {
      if (b.metadata?.category) {
        categoryMap.set(b.metadata.category, (categoryMap.get(b.metadata.category) || 0) + 1);
      }
    });
    
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
  }

  /**
   * Gera recomendações usando modelos de ML
   */
  private async generateRecommendations(userId: string): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    const behaviors = this.userBehaviors.get(userId) || [];
    
    if (!preferences || behaviors.length < this.MIN_DATA_POINTS) {
      return;
    }
    
    const recommendations: Recommendation[] = [];
    
    // Recomendação de tema
    const themeRec = this.generateThemeRecommendation(preferences, behaviors);
    if (themeRec && themeRec.confidence >= this.CONFIDENCE_THRESHOLD) {
      recommendations.push(themeRec);
    }
    
    // Recomendação de horário
    const timeRec = this.generateTimeRecommendation(preferences, behaviors);
    if (timeRec && timeRec.confidence >= this.CONFIDENCE_THRESHOLD) {
      recommendations.push(timeRec);
    }
    
    // Recomendação de caixa (simulada)
    const boxRec = this.generateBoxRecommendation(preferences, behaviors);
    if (boxRec && boxRec.confidence >= this.CONFIDENCE_THRESHOLD) {
      recommendations.push(boxRec);
    }
    
    // Recomendação social
    const socialRec = this.generateSocialRecommendation(preferences, behaviors);
    if (socialRec && socialRec.confidence >= this.CONFIDENCE_THRESHOLD) {
      recommendations.push(socialRec);
    }
    
    // Armazena recomendações
    this.recommendations.set(userId, recommendations);
    
    // Registra evento analítico
    analyticsService.trackEngagement('recommendations_generated', 'ai', recommendations.length);
  }

  /**
   * Gera recomendação de tema usando collaborative filtering simulado
   */
  private generateThemeRecommendation(
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): ThemeRecommendation | null {
    if (!preferences.themes.length) return null;
    
    // Pega o tema com maior afinidade
    const topTheme = preferences.themes[0];
    
    // Calcula confiança baseada em múltiplos fatores
    const dataPointScore = Math.min(behaviors.length / 100, 1);
    const consistencyScore = this.calculateConsistencyScore(preferences.themes);
    const recencyScore = this.calculateRecencyScore(new Date(topTheme.lastUsed));
    
    const confidence = (dataPointScore + consistencyScore + recencyScore) / 3;
    
    // Identifica temas alternativos
    const alternativeThemes = preferences.themes
      .slice(1, 4)
      .filter(t => t.affinity > 0.5)
      .map(t => t.theme);
    
    return {
      id: `theme_rec_${Date.now()}`,
      type: 'theme',
      confidence,
      reason: this.generateThemeRecommendationReason(topTheme, preferences),
      data: {
        theme: topTheme.theme,
        matchScore: topTheme.affinity,
        reasons: [
          `Você usou ${topTheme.theme} ${topTheme.usageCount} vezes`,
          `Taxa de sucesso de ${Math.round(topTheme.successRate * 100)}%`,
          preferences.engagementLevel === 'hardcore' ? 
            'Perfeito para jogadores experientes' : 
            'Ideal para seu nível de jogo',
        ],
        alternativeThemes,
      },
      expiresAt: new Date(Date.now() + this.RECOMMENDATION_EXPIRY).toISOString(),
      priority: 'high',
    };
  }

  /**
   * Calcula consistência das preferências
   */
  private calculateConsistencyScore(themes: ThemePreference[]): number {
    if (themes.length < 2) return 0.5;
    
    const affinities = themes.map(t => t.affinity);
    const mean = affinities.reduce((a, b) => a + b, 0) / affinities.length;
    const variance = affinities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / affinities.length;
    
    // Quanto menor a variância, maior a consistência
    return Math.exp(-variance);
  }

  /**
   * Gera razão para recomendação de tema
   */
  private generateThemeRecommendationReason(theme: ThemePreference, preferences: UserPreferences): string {
    const reasons = [];
    
    if (theme.affinity > 0.8) {
      reasons.push('Este é seu tema favorito');
    } else if (theme.affinity > 0.6) {
      reasons.push('Você tem boa afinidade com este tema');
    }
    
    if (theme.successRate > 0.7) {
      reasons.push('com alta taxa de sucesso');
    }
    
    if (preferences.engagementLevel === 'hardcore') {
      reasons.push('e combina com seu estilo intenso de jogo');
    }
    
    return reasons.join(' ') || 'Baseado em seu histórico de uso';
  }

  /**
   * Gera recomendação de horário ideal
   */
  private generateTimeRecommendation(
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): Recommendation | null {
    if (!preferences.openingTimes.length) return null;
    
    const topTime = preferences.openingTimes[0];
    const currentHour = new Date().getHours();
    
    // Verifica se está próximo do horário preferido
    const isNearPreferredTime = currentHour >= topTime.hourRange[0] && 
                                currentHour < topTime.hourRange[1];
    
    if (!isNearPreferredTime) {
      return {
        id: `time_rec_${Date.now()}`,
        type: 'time_to_open',
        confidence: 0.85,
        reason: `Você costuma jogar entre ${topTime.hourRange[0]}h e ${topTime.hourRange[1]}h`,
        data: {
          suggestedTime: topTime.hourRange[0],
          currentEngagementLevel: this.predictCurrentEngagement(currentHour, behaviors),
        },
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 horas
        priority: 'medium',
      };
    }
    
    return null;
  }

  /**
   * Prediz engajamento atual baseado no horário
   */
  private predictCurrentEngagement(hour: number, behaviors: UserBehavior[]): number {
    const behaviorsByHour = behaviors.filter(b => 
      new Date(b.timestamp).getHours() === hour
    );
    
    return Math.min(behaviorsByHour.length / behaviors.length * 10, 1);
  }

  /**
   * Gera recomendação de caixa (simulada com dados mockados)
   */
  private generateBoxRecommendation(
    preferences: UserPreferences,
    _behaviors: UserBehavior[]
  ): BoxRecommendation | null {
    // Simula recomendação baseada em preferências
    const mockBoxes = [
      { id: 'box_1', title: 'Caixa Misteriosa Premium', price: 89.90 },
      { id: 'box_2', title: 'Surpresa Eletrônica', price: 149.90 },
      { id: 'box_3', title: 'Mystery Box Gamer', price: 199.90 },
    ];
    
    // Filtra caixas dentro da faixa de preço
    const suitableBoxes = mockBoxes.filter(box => 
      box.price >= preferences.priceRange.min && 
      box.price <= preferences.priceRange.max
    );
    
    if (!suitableBoxes.length) return null;
    
    // Seleciona a caixa mais próxima do sweet spot
    const bestBox = suitableBoxes.reduce((prev, curr) => 
      Math.abs(curr.price - preferences.priceRange.sweet_spot) < 
      Math.abs(prev.price - preferences.priceRange.sweet_spot) ? curr : prev
    );
    
    return {
      id: `box_rec_${Date.now()}`,
      type: 'box',
      confidence: 0.75,
      reason: 'Baseado em suas compras anteriores',
      data: {
        boxId: bestBox.id,
        title: bestBox.title,
        price: bestBox.price,
        predictedSatisfaction: 0.82,
        similarUsers: Math.floor(Math.random() * 100) + 50,
      },
      expiresAt: new Date(Date.now() + this.RECOMMENDATION_EXPIRY).toISOString(),
      priority: 'high',
    };
  }

  /**
   * Gera recomendação social
   */
  private generateSocialRecommendation(
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): Recommendation | null {
    if (!preferences.socialPreferences.prefersMultiplayer) return null;
    
    const recentSocialBehaviors = behaviors.filter(b => 
      ['room_joined', 'friend_added'].includes(b.action) &&
      Date.now() - new Date(b.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // 7 dias
    );
    
    if (recentSocialBehaviors.length < 3) {
      return {
        id: `social_rec_${Date.now()}`,
        type: 'room',
        confidence: 0.7,
        reason: 'Você gosta de experiências multiplayer',
        data: {
          suggestion: 'Junte-se a uma sala compartilhada',
          activeRooms: Math.floor(Math.random() * 10) + 5,
        },
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 horas
        priority: 'low',
      };
    }
    
    return null;
  }

  /**
   * Obtém recomendações atuais
   */
  getRecommendations(userId: string, type?: RecommendationType): Recommendation[] {
    const allRecommendations = this.recommendations.get(userId) || [];
    const now = Date.now();
    
    // Filtra recomendações válidas
    const validRecommendations = allRecommendations.filter(rec => 
      new Date(rec.expiresAt).getTime() > now
    );
    
    if (type) {
      return validRecommendations.filter(rec => rec.type === type);
    }
    
    // Ordena por prioridade e confiança
    return validRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Obtém predição para um modelo específico
   */
  async getPrediction(userId: string, modelType: string): Promise<PredictionResult | null> {
    const preferences = this.userPreferences.get(userId);
    const behaviors = this.userBehaviors.get(userId) || [];
    
    if (!preferences || behaviors.length < this.MIN_DATA_POINTS) {
      return null;
    }
    
    // Simula predições baseadas no tipo de modelo
    switch (modelType) {
      case 'churn_prediction':
        return this.predictChurn(userId, preferences, behaviors);
      case 'ltv_prediction':
        return this.predictLTV(userId, preferences, behaviors);
      case 'engagement_forecast':
        return this.predictEngagement(userId, preferences, behaviors);
      default:
        return null;
    }
  }

  /**
   * Prediz probabilidade de churn
   */
  private predictChurn(
    userId: string,
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): PredictionResult {
    const recentBehaviors = behaviors.filter(b => 
      Date.now() - new Date(b.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    
    const activityDecline = 1 - (recentBehaviors.length / Math.max(behaviors.length, 1));
    const lastActivityDays = (Date.now() - new Date(behaviors[behaviors.length - 1]?.timestamp || Date.now()).getTime()) / 
                             (1000 * 60 * 60 * 24);
    
    const churnProbability = Math.min(
      activityDecline * 0.4 + 
      Math.min(lastActivityDays / 30, 1) * 0.6,
      1
    );
    
    return {
      modelId: 'churn_model_v1',
      prediction: churnProbability,
      confidence: 0.75,
      explanation: [
        churnProbability > 0.7 ? 'Alto risco de abandono' : 'Baixo risco de abandono',
        `${Math.round(activityDecline * 100)}% de redução na atividade recente`,
        `Último acesso há ${Math.round(lastActivityDays)} dias`,
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Prediz Lifetime Value
   */
  private predictLTV(
    userId: string,
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): PredictionResult {
    const purchases = behaviors.filter(b => b.action === 'purchase_completed');
    const avgPurchaseValue = purchases.length > 0 ?
      purchases.reduce((sum, p) => sum + (p.metadata?.price || 0), 0) / purchases.length :
      preferences.priceRange.sweet_spot;
    
    const engagementMultiplier = preferences.engagementLevel === 'hardcore' ? 3 :
                                 preferences.engagementLevel === 'regular' ? 2 : 1;
    
    const predictedMonthlyPurchases = Math.min(purchases.length, 10) * engagementMultiplier;
    const ltv = avgPurchaseValue * predictedMonthlyPurchases * 12; // 1 ano
    
    return {
      modelId: 'ltv_model_v1',
      prediction: ltv,
      confidence: 0.65,
      explanation: [
        `Valor médio de compra: R$ ${avgPurchaseValue.toFixed(2)}`,
        `Frequência estimada: ${predictedMonthlyPurchases} compras/mês`,
        `Nível de engajamento: ${preferences.engagementLevel}`,
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Prediz engajamento futuro
   */
  private predictEngagement(
    userId: string,
    preferences: UserPreferences,
    behaviors: UserBehavior[]
  ): PredictionResult {
    const recentEngagement = behaviors.filter(b => 
      Date.now() - new Date(b.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;
    
    const baseEngagement = preferences.engagementLevel === 'hardcore' ? 0.8 :
                          preferences.engagementLevel === 'regular' ? 0.5 : 0.3;
    
    const timeBonus = preferences.openingTimes.some(t => {
      const hour = new Date().getHours();
      return hour >= t.hourRange[0] && hour < t.hourRange[1];
    }) ? 0.2 : 0;
    
    const predictedEngagement = Math.min(baseEngagement + timeBonus, 1);
    
    return {
      modelId: 'engagement_model_v1',
      prediction: predictedEngagement,
      confidence: 0.8,
      explanation: [
        `Engajamento base: ${Math.round(baseEngagement * 100)}%`,
        timeBonus > 0 ? 'Horário favorável detectado' : 'Fora do horário preferido',
        `${recentEngagement} ações nas últimas 24h`,
      ],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Carrega dados do usuário
   */
  private async loadUserData(userId: string): Promise<void> {
    try {
      const [behaviorsData, preferencesData, recommendationsData] = await Promise.all([
        AsyncStorage.getItem(`ai_behaviors_${userId}`),
        AsyncStorage.getItem(`ai_preferences_${userId}`),
        AsyncStorage.getItem(`ai_recommendations_${userId}`),
      ]);
      
      if (behaviorsData) {
        this.userBehaviors.set(userId, JSON.parse(behaviorsData));
      }
      
      if (preferencesData) {
        this.userPreferences.set(userId, JSON.parse(preferencesData));
      }
      
      if (recommendationsData) {
        this.recommendations.set(userId, JSON.parse(recommendationsData));
      }
    } catch (error) {
      // console.error('Erro ao carregar dados de IA:', error);
    }
  }

  /**
   * Salva dados do usuário
   */
  private async saveUserData(userId: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          `ai_behaviors_${userId}`,
          JSON.stringify(this.userBehaviors.get(userId) || [])
        ),
        AsyncStorage.setItem(
          `ai_preferences_${userId}`,
          JSON.stringify(this.userPreferences.get(userId) || {})
        ),
        AsyncStorage.setItem(
          `ai_recommendations_${userId}`,
          JSON.stringify(this.recommendations.get(userId) || [])
        ),
      ]);
    } catch (error) {
      // console.error('Erro ao salvar dados de IA:', error);
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanupOldData(userId: string, daysToKeep: number = 30): Promise<void> {
    const behaviors = this.userBehaviors.get(userId) || [];
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const filteredBehaviors = behaviors.filter(b => 
      new Date(b.timestamp).getTime() > cutoffDate
    );
    
    this.userBehaviors.set(userId, filteredBehaviors);
    await this.saveUserData(userId);
  }

  /**
   * Reset para desenvolvimento/testes
   */
  async resetUserData(userId: string): Promise<void> {
    this.userBehaviors.delete(userId);
    this.userPreferences.delete(userId);
    this.recommendations.delete(userId);
    this.behaviorPatterns.delete(userId);
    this.themeStats.delete(userId);
    
    await Promise.all([
      AsyncStorage.removeItem(`ai_behaviors_${userId}`),
      AsyncStorage.removeItem(`ai_preferences_${userId}`),
      AsyncStorage.removeItem(`ai_recommendations_${userId}`),
    ]);
  }
}

export default AIRecommendationService.getInstance();