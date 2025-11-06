/**
 * Predictive Analytics Service
 * Sistema de analytics preditivo com Machine Learning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PredictiveMetrics,
  RiskFactor,
  Opportunity,
  UserBehavior,
  PredictionResult,
  MLEvent,
} from '../types/ai';

import personalizationService from './personalizationService';

interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-1
  confidence: number; // 0-1
  forecast: number[];
  seasonality?: 'daily' | 'weekly' | 'monthly';
}

interface AnomalyDetection {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  deviationScore: number;
  expectedRange: [number, number];
  actualValue: number;
}

interface CohortAnalysis {
  cohortId: string;
  cohortDate: string;
  metrics: {
    retention: number[];
    ltv: number;
    churnRate: number;
    avgEngagement: number;
  };
  size: number;
}

interface FunnelAnalysis {
  funnelName: string;
  steps: FunnelStep[];
  overallConversion: number;
  dropoffPoints: DropoffPoint[];
}

interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  avgTimeToNext: number; // segundos
}

interface DropoffPoint {
  fromStep: string;
  toStep: string;
  dropoffRate: number;
  reasons: string[];
}

class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private userId: string | null = null;
  private mlEvents: MLEvent[] = [];
  private timeSeriesData: Map<string, TimeSeriesData[]> = new Map();
  private predictiveMetrics: Map<string, PredictiveMetrics> = new Map();
  private cohorts: Map<string, CohortAnalysis> = new Map();
  private isInitialized = false;
  
  // Configurações do modelo
  private readonly MIN_DATA_POINTS = 30;
  private readonly FORECAST_HORIZON = 7; // dias
  private readonly ANOMALY_THRESHOLD = 2.5; // desvios padrão
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  
  // Cache de predições
  private predictionCache: Map<string, PredictionResult> = new Map();
  private cacheExpiry = 60 * 60 * 1000; // 1 hora

  private constructor() {}

  static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  /**
   * Inicializa o serviço
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadHistoricalData();
    this.isInitialized = true;
    
    // Inicia análise preditiva
    await this.runPredictiveAnalysis();
    
  }

  /**
   * Carrega dados históricos
   */
  private async loadHistoricalData(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const [eventsData, metricsData] = await Promise.all([
        AsyncStorage.getItem(`ml_events_${this.userId}`),
        AsyncStorage.getItem(`predictive_metrics_${this.userId}`),
      ]);
      
      if (eventsData) {
        this.mlEvents = JSON.parse(eventsData);
        this.processEventsIntoTimeSeries();
      }
      
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        this.predictiveMetrics.set(this.userId, metrics);
      }
    } catch (error) {
      // console.error('Erro ao carregar dados de analytics:', error);
    }
  }

  /**
   * Processa eventos em séries temporais
   */
  private processEventsIntoTimeSeries(): void {
    const seriesMap = new Map<string, TimeSeriesData[]>();
    
    this.mlEvents.forEach(event => {
      const seriesKey = event.eventType;
      
      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, []);
      }
      
      seriesMap.get(seriesKey)!.push({
        timestamp: event.timestamp,
        value: this.extractValueFromEvent(event),
        metadata: event.context,
      });
    });
    
    // Ordena séries por timestamp
    seriesMap.forEach((series, key) => {
      series.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      this.timeSeriesData.set(key, series);
    });
  }

  /**
   * Extrai valor numérico do evento
   */
  private extractValueFromEvent(event: MLEvent): number {
    // Lógica específica por tipo de evento
    if (event.eventType === 'box_opened') return 1;
    if (event.eventType === 'purchase_completed') return event.features.price || 0;
    if (event.eventType === 'session_duration') return event.features.duration || 0;
    if (event.eventType === 'engagement_score') return event.features.score || 0;
    
    return 1; // Valor padrão para contagem
  }

  /**
   * Registra evento ML
   */
  async trackMLEvent(event: MLEvent): Promise<void> {
    this.mlEvents.push(event);
    
    // Atualiza série temporal
    const seriesKey = event.eventType;
    if (!this.timeSeriesData.has(seriesKey)) {
      this.timeSeriesData.set(seriesKey, []);
    }
    
    this.timeSeriesData.get(seriesKey)!.push({
      timestamp: event.timestamp,
      value: this.extractValueFromEvent(event),
      metadata: event.context,
    });
    
    // Salva periodicamente
    if (this.mlEvents.length % 10 === 0) {
      await this.saveData();
    }
    
    // Invalida cache
    this.predictionCache.clear();
  }

  /**
   * Executa análise preditiva completa
   */
  private async runPredictiveAnalysis(): Promise<void> {
    if (!this.userId) return;
    
    const metrics: PredictiveMetrics = {
      userId: this.userId,
      churnProbability: await this.predictChurn(),
      ltv: await this.predictLTV(),
      nextPurchaseDate: await this.predictNextPurchase(),
      recommendedActions: await this.generateRecommendedActions(),
      riskFactors: await this.identifyRiskFactors(),
      opportunities: await this.identifyOpportunities(),
    };
    
    this.predictiveMetrics.set(this.userId, metrics);
    await this.saveData();
  }

  /**
   * Prediz probabilidade de churn
   */
  private async predictChurn(): Promise<number> {
    const sessionSeries = this.timeSeriesData.get('session_start') || [];
    
    if (sessionSeries.length < this.MIN_DATA_POINTS) {
      return 0.1; // Baixa probabilidade por padrão para novos usuários
    }
    
    // Analisa frequência de sessões
    const recentSessions = this.getRecentDataPoints(sessionSeries, 7);
    const historicalAvg = this.calculateAverage(sessionSeries);
    const recentAvg = this.calculateAverage(recentSessions);
    
    // Calcula tendência
    const trend = this.analyzeTrend(sessionSeries);
    
    // Fatores de churn
    let churnScore = 0;
    
    // Redução de frequência
    if (recentAvg < historicalAvg * 0.5) {
      churnScore += 0.3;
    }
    
    // Tendência decrescente
    if (trend.direction === 'decreasing') {
      churnScore += trend.strength * 0.3;
    }
    
    // Dias desde última sessão
    const lastSession = sessionSeries[sessionSeries.length - 1];
    const daysSinceLastSession = (Date.now() - new Date(lastSession.timestamp).getTime()) / 
                                 (1000 * 60 * 60 * 24);
    
    if (daysSinceLastSession > 7) {
      churnScore += 0.2;
    }
    if (daysSinceLastSession > 14) {
      churnScore += 0.2;
    }
    
    return Math.min(churnScore, 1);
  }

  /**
   * Prediz Lifetime Value
   */
  private async predictLTV(): Promise<number> {
    const purchaseSeries = this.timeSeriesData.get('purchase_completed') || [];
    
    if (purchaseSeries.length === 0) {
      // Estima baseado em segmento
      const segments = personalizationService.getUserSegments();
      if (segments.some(s => s.segmentId === 'high_spenders')) {
        return 500;
      }
      return 100; // Valor padrão
    }
    
    // Calcula valor médio de compra
    const avgPurchaseValue = this.calculateAverage(purchaseSeries);
    
    // Prediz frequência futura
    const purchaseFrequency = this.predictFrequency(purchaseSeries);
    
    // Ajusta por probabilidade de retenção
    const retentionProbability = 1 - (await this.predictChurn());
    
    // LTV = Valor médio × Frequência × Tempo × Retenção
    const monthlyValue = avgPurchaseValue * purchaseFrequency;
    const yearlyValue = monthlyValue * 12;
    const adjustedLTV = yearlyValue * retentionProbability;
    
    return Math.round(adjustedLTV);
  }

  /**
   * Prediz próxima compra
   */
  private async predictNextPurchase(): Promise<string | undefined> {
    const purchaseSeries = this.timeSeriesData.get('purchase_completed') || [];
    
    if (purchaseSeries.length < 2) {
      return undefined;
    }
    
    // Calcula intervalo médio entre compras
    const intervals: number[] = [];
    for (let i = 1; i < purchaseSeries.length; i++) {
      const interval = new Date(purchaseSeries[i].timestamp).getTime() - 
                      new Date(purchaseSeries[i - 1].timestamp).getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Prediz próxima data
    const lastPurchase = purchaseSeries[purchaseSeries.length - 1];
    const nextPurchaseTime = new Date(lastPurchase.timestamp).getTime() + avgInterval;
    
    // Ajusta por sazonalidade
    const seasonalityFactor = this.detectSeasonality(purchaseSeries);
    const adjustedTime = nextPurchaseTime * seasonalityFactor;
    
    return new Date(adjustedTime).toISOString();
  }

  /**
   * Gera ações recomendadas
   */
  private async generateRecommendedActions(): Promise<string[]> {
    const actions: string[] = [];
    const churnProb = await this.predictChurn();
    const segments = personalizationService.getUserSegments();
    
    // Ações baseadas em risco de churn
    if (churnProb > 0.7) {
      actions.push('Enviar oferta de retenção urgente');
      actions.push('Ativar campanha de re-engajamento');
    } else if (churnProb > 0.4) {
      actions.push('Aumentar frequência de notificações');
      actions.push('Oferecer desconto personalizado');
    }
    
    // Ações baseadas em segmentos
    if (segments.some(s => s.segmentId === 'new_users')) {
      actions.push('Completar onboarding');
      actions.push('Enviar dicas de uso');
    }
    
    if (segments.some(s => s.segmentId === 'power_users')) {
      actions.push('Oferecer features beta');
      actions.push('Convidar para programa VIP');
    }
    
    if (segments.some(s => s.segmentId === 'social_enthusiasts')) {
      actions.push('Promover features sociais');
      actions.push('Incentivar criação de salas');
    }
    
    // Ações baseadas em oportunidades
    const opportunities = await this.identifyOpportunities();
    opportunities.forEach(opp => {
      if (opp.confidence > 0.7) {
        actions.push(opp.description);
      }
    });
    
    return actions.slice(0, 5); // Limita a 5 ações prioritárias
  }

  /**
   * Identifica fatores de risco
   */
  private async identifyRiskFactors(): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    // Analisa métricas chave
    const sessionTrend = this.analyzeTrend(this.timeSeriesData.get('session_start') || []);
    const purchaseTrend = this.analyzeTrend(this.timeSeriesData.get('purchase_completed') || []);
    
    // Risco de abandono
    if (sessionTrend.direction === 'decreasing' && sessionTrend.strength > 0.5) {
      factors.push({
        factor: 'Redução de engajamento',
        impact: sessionTrend.strength > 0.7 ? 'high' : 'medium',
        probability: sessionTrend.confidence,
        mitigation: 'Implementar estratégia de re-engajamento',
      });
    }
    
    // Risco de não conversão
    if (purchaseTrend.direction === 'decreasing' || purchaseTrend.forecast[0] < 0) {
      factors.push({
        factor: 'Queda nas conversões',
        impact: 'high',
        probability: purchaseTrend.confidence,
        mitigation: 'Revisar ofertas e preços',
      });
    }
    
    // Risco de insatisfação
    const anomalies = this.detectAnomalies(this.timeSeriesData.get('app_crash') || []);
    if (anomalies.some(a => a.severity === 'high')) {
      factors.push({
        factor: 'Problemas técnicos frequentes',
        impact: 'high',
        probability: 0.9,
        mitigation: 'Priorizar correção de bugs',
      });
    }
    
    // Risco competitivo
    const marketShare = await this.estimateMarketPosition();
    if (marketShare < 0.3) {
      factors.push({
        factor: 'Perda de competitividade',
        impact: 'medium',
        probability: 0.6,
        mitigation: 'Diferenciar features e melhorar UX',
      });
    }
    
    return factors;
  }

  /**
   * Identifica oportunidades
   */
  private async identifyOpportunities(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Analisa padrões de uso
    const _usagePatterns = await this.analyzeUsagePatterns();
    
    // Oportunidade de upsell
    const purchaseHistory = this.timeSeriesData.get('purchase_completed') || [];
    if (purchaseHistory.length > 5) {
      const avgValue = this.calculateAverage(purchaseHistory);
      opportunities.push({
        type: 'upsell',
        description: 'Oferecer pacote premium',
        potentialValue: avgValue * 1.5,
        confidence: 0.75,
        timeWindow: '7 dias',
      });
    }
    
    // Oportunidade de cross-sell
    const themeUsage = this.timeSeriesData.get('theme_selected') || [];
    if (themeUsage.length > 10) {
      opportunities.push({
        type: 'cross_sell',
        description: 'Recomendar novos temas baseados no histórico',
        potentialValue: 50,
        confidence: 0.8,
        timeWindow: '3 dias',
      });
    }
    
    // Oportunidade de referral
    const socialActivity = this.timeSeriesData.get('friend_added') || [];
    if (socialActivity.length > 3) {
      opportunities.push({
        type: 'referral',
        description: 'Ativar programa de indicação',
        potentialValue: 100,
        confidence: 0.7,
        timeWindow: '14 dias',
      });
    }
    
    // Oportunidade sazonal
    const seasonalOpportunity = this.identifySeasonalOpportunity();
    if (seasonalOpportunity) {
      opportunities.push(seasonalOpportunity);
    }
    
    return opportunities;
  }

  /**
   * Analisa tendência
   */
  private analyzeTrend(series: TimeSeriesData[]): TrendAnalysis {
    if (series.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        confidence: 0,
        forecast: [],
      };
    }
    
    // Calcula regressão linear simples
    const values = series.map(s => s.value);
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Coeficientes da regressão
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Determina direção e força
    const direction = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
    const strength = Math.min(Math.abs(slope) / Math.max(...values), 1);
    
    // Calcula R²
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);
    
    // Gera forecast
    const forecast = Array.from({ length: this.FORECAST_HORIZON }, (_, i) => {
      return Math.max(0, slope * (n + i) + intercept);
    });
    
    // Detecta sazonalidade
    const seasonality = this.detectSeasonalityPattern(series);
    
    return {
      direction,
      strength,
      confidence: Math.max(0, r2),
      forecast,
      seasonality,
    };
  }

  /**
   * Detecta anomalias
   */
  private detectAnomalies(series: TimeSeriesData[]): AnomalyDetection[] {
    if (series.length < this.MIN_DATA_POINTS) {
      return [];
    }
    
    const values = series.map(s => s.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    return series.map(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      const isAnomaly = zScore > this.ANOMALY_THRESHOLD;
      
      return {
        isAnomaly,
        severity: zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low',
        deviationScore: zScore,
        expectedRange: [
          mean - this.ANOMALY_THRESHOLD * stdDev,
          mean + this.ANOMALY_THRESHOLD * stdDev,
        ],
        actualValue: point.value,
      };
    });
  }

  /**
   * Análise de coorte
   */
  async analyzeCohort(cohortDate: string): Promise<CohortAnalysis> {
    // Simula análise de coorte
    const cohortId = `cohort_${cohortDate}`;
    
    const analysis: CohortAnalysis = {
      cohortId,
      cohortDate,
      metrics: {
        retention: this.calculateCohortRetention(cohortDate),
        ltv: await this.predictLTV(),
        churnRate: await this.predictChurn(),
        avgEngagement: Math.random() * 100,
      },
      size: Math.floor(Math.random() * 1000) + 100,
    };
    
    this.cohorts.set(cohortId, analysis);
    return analysis;
  }

  /**
   * Calcula retenção de coorte
   */
  private calculateCohortRetention(cohortDate: string): number[] {
    // Simula curva de retenção típica
    const baseRetention = [100, 70, 50, 40, 35, 30, 28, 25];
    const variation = Math.random() * 0.2 - 0.1; // ±10% variação
    
    return baseRetention.map(r => Math.max(0, r * (1 + variation)));
  }

  /**
   * Análise de funil
   */
  analyzeFunnel(funnelName: string, steps: string[]): FunnelAnalysis {
    // Simula análise de funil
    const funnelSteps: FunnelStep[] = [];
    let currentUsers = 1000;
    
    steps.forEach((stepName, index) => {
      const conversionRate = Math.max(0.3, Math.random() * 0.9 - index * 0.1);
      currentUsers = Math.floor(currentUsers * conversionRate);
      
      funnelSteps.push({
        name: stepName,
        users: currentUsers,
        conversionRate,
        avgTimeToNext: Math.floor(Math.random() * 300) + 30,
      });
    });
    
    // Identifica pontos de drop-off
    const dropoffPoints: DropoffPoint[] = [];
    for (let i = 0; i < funnelSteps.length - 1; i++) {
      const dropoffRate = 1 - funnelSteps[i + 1].conversionRate;
      
      if (dropoffRate > 0.3) {
        dropoffPoints.push({
          fromStep: funnelSteps[i].name,
          toStep: funnelSteps[i + 1].name,
          dropoffRate,
          reasons: this.identifyDropoffReasons(dropoffRate),
        });
      }
    }
    
    return {
      funnelName,
      steps: funnelSteps,
      overallConversion: funnelSteps[funnelSteps.length - 1].users / 1000,
      dropoffPoints,
    };
  }

  /**
   * Identifica razões de drop-off
   */
  private identifyDropoffReasons(dropoffRate: number): string[] {
    const reasons: string[] = [];
    
    if (dropoffRate > 0.5) {
      reasons.push('Fricção alta no processo');
      reasons.push('Falta de clareza nas instruções');
    }
    
    if (dropoffRate > 0.3) {
      reasons.push('Tempo de carregamento lento');
      reasons.push('Campos obrigatórios excessivos');
    }
    
    return reasons;
  }

  /**
   * Helpers auxiliares
   */
  
  private getRecentDataPoints(series: TimeSeriesData[], days: number): TimeSeriesData[] {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return series.filter(point => new Date(point.timestamp).getTime() > cutoff);
  }

  private calculateAverage(series: TimeSeriesData[]): number {
    if (series.length === 0) return 0;
    return series.reduce((sum, point) => sum + point.value, 0) / series.length;
  }

  private predictFrequency(series: TimeSeriesData[]): number {
    if (series.length < 2) return 0;
    
    const timeSpan = new Date(series[series.length - 1].timestamp).getTime() - 
                    new Date(series[0].timestamp).getTime();
    const months = timeSpan / (1000 * 60 * 60 * 24 * 30);
    
    return series.length / Math.max(1, months);
  }

  private detectSeasonality(series: TimeSeriesData[]): number {
    // Simplificado - retorna fator de ajuste sazonal
    const month = new Date().getMonth();
    const seasonalFactors = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.05, 1.0, 0.95, 0.9, 1.2];
    return seasonalFactors[month];
  }

  private detectSeasonalityPattern(series: TimeSeriesData[]): 'daily' | 'weekly' | 'monthly' | undefined {
    if (series.length < 30) return undefined;
    
    // Análise simplificada de padrões
    const hourlyPattern = this.checkHourlyPattern(series);
    const weeklyPattern = this.checkWeeklyPattern(series);
    const monthlyPattern = this.checkMonthlyPattern(series);
    
    if (hourlyPattern > 0.7) return 'daily';
    if (weeklyPattern > 0.7) return 'weekly';
    if (monthlyPattern > 0.7) return 'monthly';
    
    return undefined;
  }

  private checkHourlyPattern(series: TimeSeriesData[]): number {
    // Verifica padrão diário
    const hourlyAverages = new Map<number, number[]>();
    
    series.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyAverages.has(hour)) {
        hourlyAverages.set(hour, []);
      }
      hourlyAverages.get(hour)!.push(point.value);
    });
    
    // Calcula variância entre horas
    const variances: number[] = [];
    hourlyAverages.forEach(values => {
      if (values.length > 1) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        variances.push(variance);
      }
    });
    
    return variances.length > 0 ? 1 - (Math.min(...variances) / Math.max(...variances)) : 0;
  }

  private checkWeeklyPattern(series: TimeSeriesData[]): number {
    // Similar ao hourly mas por dia da semana
    return Math.random() * 0.5; // Simplificado
  }

  private checkMonthlyPattern(series: TimeSeriesData[]): number {
    // Similar ao hourly mas por dia do mês
    return Math.random() * 0.3; // Simplificado
  }

  private async analyzeUsagePatterns(): Promise<any> {
    // Análise de padrões de uso
    return {
      peakHours: [19, 20, 21],
      peakDays: ['Friday', 'Saturday'],
      avgSessionLength: 15,
    };
  }

  private async estimateMarketPosition(): Promise<number> {
    // Estima posição de mercado (simplificado)
    return Math.random() * 0.5 + 0.3;
  }

  private identifySeasonalOpportunity(): Opportunity | null {
    const month = new Date().getMonth();
    const day = new Date().getDate();
    
    // Oportunidades sazonais
    if (month === 11 && day > 15) {
      return {
        type: 'seasonal',
        description: 'Campanha de Natal com temas especiais',
        potentialValue: 200,
        confidence: 0.9,
        timeWindow: '10 dias',
      };
    }
    
    if (month === 1 && day < 15) {
      return {
        type: 'seasonal',
        description: 'Promoção de Dia dos Namorados',
        potentialValue: 150,
        confidence: 0.85,
        timeWindow: '7 dias',
      };
    }
    
    return null;
  }

  /**
   * Obtém métricas preditivas
   */
  getPredictiveMetrics(): PredictiveMetrics | null {
    if (!this.userId) return null;
    return this.predictiveMetrics.get(this.userId) || null;
  }

  /**
   * Obtém análise de tendência
   */
  getTrendAnalysis(metricName: string): TrendAnalysis | null {
    const series = this.timeSeriesData.get(metricName);
    if (!series || series.length < this.MIN_DATA_POINTS) {
      return null;
    }
    
    return this.analyzeTrend(series);
  }

  /**
   * Obtém anomalias recentes
   */
  getRecentAnomalies(metricName: string, days: number = 7): AnomalyDetection[] {
    const series = this.timeSeriesData.get(metricName);
    if (!series) return [];
    
    const recentSeries = this.getRecentDataPoints(series, days);
    return this.detectAnomalies(recentSeries);
  }

  /**
   * Salva dados
   */
  private async saveData(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const metrics = this.predictiveMetrics.get(this.userId);
      
      await Promise.all([
        AsyncStorage.setItem(`ml_events_${this.userId}`, JSON.stringify(this.mlEvents)),
        metrics && AsyncStorage.setItem(`predictive_metrics_${this.userId}`, JSON.stringify(metrics)),
      ]);
    } catch (error) {
      // console.error('Erro ao salvar dados de analytics:', error);
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanup(daysToKeep: number = 90): Promise<void> {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // Limpa eventos antigos
    this.mlEvents = this.mlEvents.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
    
    // Limpa séries temporais
    this.timeSeriesData.forEach((series, key) => {
      const filtered = series.filter(point => 
        new Date(point.timestamp).getTime() > cutoff
      );
      this.timeSeriesData.set(key, filtered);
    });
    
    await this.saveData();
  }
}

export default PredictiveAnalyticsService.getInstance();