/**
 * A/B Testing Service
 * Sistema de testes A/B para otimização de features e animações
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {
  ABTestConfig,
  TestVariant,
  TestResult,
  TestMetric,
  AudienceFilter,
  ActiveExperiment,
} from '../types/ai';
import { analyticsService } from './analyticsService';
import aiRecommendationService from './aiRecommendationService';

interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
  sticky: boolean;
}

interface MetricData {
  experimentId: string;
  variantId: string;
  metricName: string;
  value: number;
  timestamp: string;
}

interface StatisticalResult {
  mean: number;
  variance: number;
  standardError: number;
  confidenceInterval: [number, number];
  pValue?: number;
  significant?: boolean;
}

class ABTestingService {
  private static instance: ABTestingService;
  private experiments: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, ExperimentAssignment[]> = new Map();
  private metricsData: Map<string, MetricData[]> = new Map();
  private activeExperiments: ABTestConfig[] = [];
  private userId: string | null = null;
  private isInitialized = false;
  
  // Configurações estatísticas
  private readonly MINIMUM_SAMPLE_SIZE = 100;
  private readonly CONFIDENCE_LEVEL = 0.95; // 95% de confiança
  private readonly SIGNIFICANCE_THRESHOLD = 0.05; // p-value < 0.05
  
  // Cache de resultados
  private resultsCache: Map<string, TestResult> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Inicializa o serviço
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadData();
    await this.fetchActiveExperiments();
    this.isInitialized = true;
    
    // Atribui usuário a experimentos elegíveis
    await this.assignUserToExperiments();
  }

  /**
   * Carrega dados salvos
   */
  private async loadData(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const [assignmentsData, metricsData] = await Promise.all([
        AsyncStorage.getItem(`ab_assignments_${this.userId}`),
        AsyncStorage.getItem(`ab_metrics_${this.userId}`),
      ]);
      
      if (assignmentsData) {
        const assignments = JSON.parse(assignmentsData);
        this.userAssignments.set(this.userId, assignments);
      }
      
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        metrics.forEach((metric: MetricData) => {
          const key = `${metric.experimentId}_${metric.variantId}`;
          if (!this.metricsData.has(key)) {
            this.metricsData.set(key, []);
          }
          this.metricsData.get(key)!.push(metric);
        });
      }
    } catch (error) {
      // console.error('Erro ao carregar dados de A/B testing:', error);
    }
  }

  /**
   * Salva dados
   */
  private async saveData(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const assignments = this.userAssignments.get(this.userId) || [];
      const allMetrics: MetricData[] = [];
      
      this.metricsData.forEach(metrics => {
        allMetrics.push(...metrics);
      });
      
      await Promise.all([
        AsyncStorage.setItem(`ab_assignments_${this.userId}`, JSON.stringify(assignments)),
        AsyncStorage.setItem(`ab_metrics_${this.userId}`, JSON.stringify(allMetrics)),
      ]);
    } catch (error) {
      // console.error('Erro ao salvar dados de A/B testing:', error);
    }
  }

  /**
   * Busca experimentos ativos
   */
  private async fetchActiveExperiments(): Promise<void> {
    // Em produção, buscar do servidor
    // Aqui vamos criar experimentos mockados
    this.activeExperiments = [
      this.createAnimationQualityExperiment(),
      this.createThemeRecommendationExperiment(),
      this.createSocialFeaturesExperiment(),
    ];
    
    this.activeExperiments.forEach(exp => {
      this.experiments.set(exp.testId, exp);
    });
  }

  /**
   * Cria experimento de qualidade de animação
   */
  private createAnimationQualityExperiment(): ABTestConfig {
    return {
      testId: 'animation_quality_test',
      name: 'Teste de Qualidade de Animação',
      description: 'Testa diferentes níveis de qualidade de animação',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
      variants: [
        {
          id: 'control',
          name: 'Qualidade Padrão',
          description: 'Configuração atual de animações',
          weight: 0.33,
          config: { quality: 'medium', particleEffects: true },
          isControl: true,
        },
        {
          id: 'high_quality',
          name: 'Alta Qualidade',
          description: 'Animações em alta qualidade com todos efeitos',
          weight: 0.33,
          config: { quality: 'high', particleEffects: true, extraEffects: true },
          isControl: false,
        },
        {
          id: 'optimized',
          name: 'Otimizado',
          description: 'Qualidade adaptativa baseada em performance',
          weight: 0.34,
          config: { quality: 'adaptive', particleEffects: 'conditional' },
          isControl: false,
        },
      ],
      metrics: [
        {
          name: 'engagement_time',
          type: 'engagement',
          goalValue: 180, // 3 minutos
          significance: 0.95,
        },
        {
          name: 'box_open_rate',
          type: 'conversion',
          goalValue: 0.7,
          significance: 0.95,
        },
      ],
    };
  }

  /**
   * Cria experimento de recomendação de tema
   */
  private createThemeRecommendationExperiment(): ABTestConfig {
    return {
      testId: 'theme_recommendation_test',
      name: 'Teste de Recomendação de Temas',
      description: 'Testa algoritmos de recomendação de temas',
      status: 'running',
      startDate: new Date().toISOString(),
      variants: [
        {
          id: 'manual',
          name: 'Seleção Manual',
          description: 'Usuário escolhe tema manualmente',
          weight: 0.25,
          config: { recommendationEnabled: false },
          isControl: true,
        },
        {
          id: 'ml_basic',
          name: 'ML Básico',
          description: 'Recomendação baseada em histórico simples',
          weight: 0.25,
          config: { algorithm: 'frequency_based' },
          isControl: false,
        },
        {
          id: 'ml_advanced',
          name: 'ML Avançado',
          description: 'Recomendação com collaborative filtering',
          weight: 0.25,
          config: { algorithm: 'collaborative_filtering' },
          isControl: false,
        },
        {
          id: 'ml_hybrid',
          name: 'ML Híbrido',
          description: 'Combina múltiplos algoritmos',
          weight: 0.25,
          config: { algorithm: 'hybrid', contextAware: true },
          isControl: false,
        },
      ],
      metrics: [
        {
          name: 'theme_acceptance_rate',
          type: 'conversion',
          goalValue: 0.8,
          significance: 0.95,
        },
        {
          name: 'satisfaction_score',
          type: 'engagement',
          goalValue: 4.5,
          significance: 0.95,
        },
      ],
    };
  }

  /**
   * Cria experimento de features sociais
   */
  private createSocialFeaturesExperiment(): ABTestConfig {
    return {
      testId: 'social_features_test',
      name: 'Teste de Features Sociais',
      description: 'Testa diferentes níveis de features sociais',
      status: 'running',
      startDate: new Date().toISOString(),
      variants: [
        {
          id: 'basic',
          name: 'Social Básico',
          description: 'Apenas compartilhamento',
          weight: 0.33,
          config: { features: ['share'] },
          isControl: true,
        },
        {
          id: 'enhanced',
          name: 'Social Aprimorado',
          description: 'Compartilhamento + Reações',
          weight: 0.33,
          config: { features: ['share', 'reactions'] },
          isControl: false,
        },
        {
          id: 'full',
          name: 'Social Completo',
          description: 'Todas features sociais',
          weight: 0.34,
          config: { features: ['share', 'reactions', 'rooms', 'betting'] },
          isControl: false,
        },
      ],
      metrics: [
        {
          name: 'social_interaction_rate',
          type: 'engagement',
          goalValue: 0.5,
          significance: 0.95,
        },
        {
          name: 'retention_7d',
          type: 'retention',
          goalValue: 0.4,
          significance: 0.95,
        },
      ],
      targetAudience: {
        engagementLevel: ['regular', 'hardcore'],
      },
    };
  }

  /**
   * Atribui usuário a experimentos
   */
  private async assignUserToExperiments(): Promise<void> {
    if (!this.userId) return;
    
    const currentAssignments = this.userAssignments.get(this.userId) || [];
    const assignedExperimentIds = new Set(currentAssignments.map(a => a.experimentId));
    
    for (const experiment of this.activeExperiments) {
      // Pula se já está atribuído
      if (assignedExperimentIds.has(experiment.testId)) continue;
      
      // Verifica elegibilidade
      if (!await this.isUserEligible(experiment)) continue;
      
      // Atribui variante
      const variant = this.selectVariant(experiment);
      if (variant) {
        const assignment: ExperimentAssignment = {
          experimentId: experiment.testId,
          variantId: variant.id,
          assignedAt: new Date().toISOString(),
          sticky: true,
        };
        
        currentAssignments.push(assignment);
        
        // Registra evento
        analyticsService.trackEngagement('experiment_assigned', experiment.testId, 1);
      }
    }
    
    this.userAssignments.set(this.userId, currentAssignments);
    await this.saveData();
  }

  /**
   * Verifica se usuário é elegível para experimento
   */
  private async isUserEligible(experiment: ABTestConfig): Promise<boolean> {
    if (!experiment.targetAudience) return true;
    
    const { targetAudience } = experiment;
    
    // Verifica nível de engajamento
    if (targetAudience.engagementLevel) {
      const preferences = await this.getUserPreferences();
      if (preferences && !targetAudience.engagementLevel.includes(preferences.engagementLevel)) {
        return false;
      }
    }
    
    // Verifica plataforma
    if (targetAudience.platforms) {
      const platform = await DeviceInfo.getBaseOs();
      const platformName = platform.toLowerCase().includes('ios') ? 'ios' : 'android';
      if (!targetAudience.platforms.includes(platformName as any)) {
        return false;
      }
    }
    
    // Verifica número mínimo de sessões
    if (targetAudience.minSessions) {
      // Simplificado - em produção, verificar dados reais
      const sessionCount = Math.floor(Math.random() * 20) + 1;
      if (sessionCount < targetAudience.minSessions) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Obtém preferências do usuário
   */
  private async getUserPreferences(): Promise<any> {
    // Integra com AI service
    const _recommendations = aiRecommendationService.getRecommendations(this.userId!);
    // Simplificado - retorna mock
    return {
      engagementLevel: 'regular',
    };
  }

  /**
   * Seleciona variante baseado em pesos
   */
  private selectVariant(experiment: ABTestConfig): TestVariant | null {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback para controle
    return experiment.variants.find(v => v.isControl) || null;
  }

  /**
   * Obtém variante do usuário para experimento
   */
  getVariant(experimentId: string): TestVariant | null {
    if (!this.userId) return null;
    
    const assignments = this.userAssignments.get(this.userId) || [];
    const assignment = assignments.find(a => a.experimentId === experimentId);
    
    if (!assignment) return null;
    
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    return experiment.variants.find(v => v.id === assignment.variantId) || null;
  }

  /**
   * Obtém configuração da variante
   */
  getVariantConfig(experimentId: string): Record<string, any> | null {
    const variant = this.getVariant(experimentId);
    return variant?.config || null;
  }

  /**
   * Registra métrica
   */
  async trackMetric(
    experimentId: string,
    metricName: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.userId) return;
    
    const assignments = this.userAssignments.get(this.userId) || [];
    const assignment = assignments.find(a => a.experimentId === experimentId);
    
    if (!assignment) return;
    
    const metric: MetricData = {
      experimentId,
      variantId: assignment.variantId,
      metricName,
      value,
      timestamp: new Date().toISOString(),
    };
    
    const key = `${experimentId}_${assignment.variantId}`;
    if (!this.metricsData.has(key)) {
      this.metricsData.set(key, []);
    }
    
    this.metricsData.get(key)!.push(metric);
    
    // Salva periodicamente
    if (this.metricsData.get(key)!.length % 10 === 0) {
      await this.saveData();
    }
    
    // Invalida cache de resultados
    this.resultsCache.delete(experimentId);
  }

  /**
   * Calcula resultados do experimento
   */
  async getExperimentResults(experimentId: string): Promise<TestResult | null> {
    // Verifica cache
    const cached = this.resultsCache.get(experimentId);
    if (cached && Date.now() - new Date(cached.testId).getTime() < this.cacheExpiry) {
      return cached;
    }
    
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    const results: TestResult = {
      testId: experimentId,
      variantId: '',
      metrics: {},
      sampleSize: 0,
      duration: this.calculateDuration(experiment),
    };
    
    // Calcula métricas para cada variante
    for (const variant of experiment.variants) {
      const variantResults = await this.calculateVariantResults(experiment, variant);
      
      // Seleciona melhor variante
      if (this.isBetterVariant(variantResults, results)) {
        results.variantId = variant.id;
        results.metrics = variantResults.metrics;
        results.sampleSize = variantResults.sampleSize;
      }
    }
    
    // Cacheia resultado
    this.resultsCache.set(experimentId, results);
    
    return results;
  }

  /**
   * Calcula duração do experimento
   */
  private calculateDuration(experiment: ABTestConfig): number {
    const start = new Date(experiment.startDate).getTime();
    const end = experiment.endDate ? new Date(experiment.endDate).getTime() : Date.now();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)); // Dias
  }

  /**
   * Calcula resultados de uma variante
   */
  private async calculateVariantResults(
    experiment: ABTestConfig,
    variant: TestVariant
  ): Promise<TestResult> {
    const key = `${experiment.testId}_${variant.id}`;
    const metricsData = this.metricsData.get(key) || [];
    
    const result: TestResult = {
      testId: experiment.testId,
      variantId: variant.id,
      metrics: {},
      sampleSize: metricsData.length,
      duration: this.calculateDuration(experiment),
    };
    
    // Calcula cada métrica definida
    for (const metricDef of experiment.metrics) {
      const metricData = metricsData
        .filter(m => m.metricName === metricDef.name)
        .map(m => m.value);
      
      if (metricData.length === 0) continue;
      
      const stats = this.calculateStatistics(metricData);
      const controlStats = await this.getControlStats(experiment, metricDef.name);
      
      // Calcula uplift e significância
      const uplift = controlStats ? 
        ((stats.mean - controlStats.mean) / controlStats.mean) * 100 : 0;
      
      const significant = controlStats ? 
        this.isStatisticallySignificant(stats, controlStats) : false;
      
      result.metrics[metricDef.name] = {
        value: stats.mean,
        confidence: stats.confidenceInterval[1] - stats.confidenceInterval[0],
        uplift,
        significance: significant,
      };
    }
    
    return result;
  }

  /**
   * Calcula estatísticas
   */
  private calculateStatistics(data: number[]): StatisticalResult {
    if (data.length === 0) {
      return {
        mean: 0,
        variance: 0,
        standardError: 0,
        confidenceInterval: [0, 0],
      };
    }
    
    // Média
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    
    // Variância
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1);
    
    // Erro padrão
    const standardError = Math.sqrt(variance / data.length);
    
    // Intervalo de confiança (95%)
    const zScore = 1.96; // Para 95% de confiança
    const marginOfError = zScore * standardError;
    const confidenceInterval: [number, number] = [
      mean - marginOfError,
      mean + marginOfError,
    ];
    
    return {
      mean,
      variance,
      standardError,
      confidenceInterval,
    };
  }

  /**
   * Obtém estatísticas do controle
   */
  private async getControlStats(
    experiment: ABTestConfig,
    metricName: string
  ): Promise<StatisticalResult | null> {
    const controlVariant = experiment.variants.find(v => v.isControl);
    if (!controlVariant) return null;
    
    const key = `${experiment.testId}_${controlVariant.id}`;
    const metricsData = this.metricsData.get(key) || [];
    const metricData = metricsData
      .filter(m => m.metricName === metricName)
      .map(m => m.value);
    
    if (metricData.length === 0) return null;
    
    return this.calculateStatistics(metricData);
  }

  /**
   * Verifica significância estatística (t-test simplificado)
   */
  private isStatisticallySignificant(
    stats1: StatisticalResult,
    stats2: StatisticalResult
  ): boolean {
    // Teste t de duas amostras
    const pooledStandardError = Math.sqrt(
      Math.pow(stats1.standardError, 2) + Math.pow(stats2.standardError, 2)
    );
    
    const tStatistic = Math.abs(stats1.mean - stats2.mean) / pooledStandardError;
    
    // Valor crítico para 95% de confiança
    const criticalValue = 1.96;
    
    return tStatistic > criticalValue;
  }

  /**
   * Verifica se variante é melhor
   */
  private isBetterVariant(variant: TestResult, current: TestResult): boolean {
    if (!current.metrics || Object.keys(current.metrics).length === 0) {
      return true;
    }
    
    // Conta métricas com melhoria significativa
    let betterMetrics = 0;
    let totalMetrics = 0;
    
    for (const metricName in variant.metrics) {
      totalMetrics++;
      const variantMetric = variant.metrics[metricName];
      const currentMetric = current.metrics[metricName];
      
      if (!currentMetric) {
        betterMetrics++;
      } else if (variantMetric.significance && variantMetric.uplift > currentMetric.uplift) {
        betterMetrics++;
      }
    }
    
    return betterMetrics > totalMetrics / 2;
  }

  /**
   * Obtém todos experimentos do usuário
   */
  getUserExperiments(): ActiveExperiment[] {
    if (!this.userId) return [];
    
    const assignments = this.userAssignments.get(this.userId) || [];
    
    return assignments.map(assignment => ({
      experimentId: assignment.experimentId,
      variantId: assignment.variantId,
      enrolledAt: assignment.assignedAt,
      sticky: assignment.sticky,
    }));
  }

  /**
   * Para experimento para usuário
   */
  async stopExperiment(experimentId: string): Promise<void> {
    if (!this.userId) return;
    
    const assignments = this.userAssignments.get(this.userId) || [];
    const filteredAssignments = assignments.filter(a => a.experimentId !== experimentId);
    
    this.userAssignments.set(this.userId, filteredAssignments);
    await this.saveData();
  }

  /**
   * Obtém recomendação de variante vencedora
   */
  async getWinningVariant(experimentId: string): Promise<string | null> {
    const results = await this.getExperimentResults(experimentId);
    if (!results || results.sampleSize < this.MINIMUM_SAMPLE_SIZE) {
      return null;
    }
    
    // Verifica se há significância estatística
    const hasSignificance = Object.values(results.metrics).some(m => m.significance);
    
    if (hasSignificance) {
      return results.variantId;
    }
    
    return null;
  }

  /**
   * Exporta dados do experimento
   */
  async exportExperimentData(experimentId: string): Promise<any> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    const results = await this.getExperimentResults(experimentId);
    const allMetrics: any[] = [];
    
    this.metricsData.forEach((metrics, key) => {
      if (key.startsWith(experimentId)) {
        allMetrics.push(...metrics);
      }
    });
    
    return {
      experiment,
      results,
      rawData: allMetrics,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Limpa dados antigos
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // Limpa métricas antigas
    this.metricsData.forEach((metrics, key) => {
      const filtered = metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoffDate
      );
      this.metricsData.set(key, filtered);
    });
    
    await this.saveData();
  }
}

export default ABTestingService.getInstance();