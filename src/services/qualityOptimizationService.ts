/**
 * Quality Optimization Service
 * Otimização automática de qualidade baseada em dispositivo e rede
 */

import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QualityOptimization,
  DevicePerformanceProfile,
  NetworkProfile,
  OptimizedSettings,
} from '../types/ai';
import { analyticsService } from './analyticsService';

interface PerformanceMetrics {
  fps: number[];
  memoryUsage: number[];
  cpuUsage: number[];
  batteryDrain: number;
  networkLatency: number[];
  timestamp: string;
}

interface BenchmarkResult {
  deviceScore: number;
  recommendedQuality: 'low' | 'medium' | 'high' | 'ultra';
  capabilities: string[];
}

class QualityOptimizationService {
  private static instance: QualityOptimizationService;
  private currentProfile: QualityOptimization | null = null;
  private performanceMetrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  
  // Thresholds e configurações
  private readonly FPS_TARGET = 60;
  private readonly FPS_MINIMUM = 30;
  private readonly MEMORY_THRESHOLD = 0.8; // 80% de uso
  private readonly BATTERY_THRESHOLD = 0.2; // 20% de bateria
  private readonly THERMAL_THRESHOLD = 'serious';
  private readonly NETWORK_LATENCY_THRESHOLD = 100; // ms
  
  // Cache de benchmark
  private benchmarkCache: BenchmarkResult | null = null;
  private lastBenchmarkTime = 0;
  private readonly BENCHMARK_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  private constructor() {
    this.initializeService();
  }

  static getInstance(): QualityOptimizationService {
    if (!QualityOptimizationService.instance) {
      QualityOptimizationService.instance = new QualityOptimizationService();
    }
    return QualityOptimizationService.instance;
  }

  /**
   * Inicializa o serviço
   */
  private async initializeService(): Promise<void> {
    await this.loadSavedProfile();
    this.startNetworkMonitoring();
    await this.runInitialBenchmark();
  }

  /**
   * Carrega perfil salvo
   */
  private async loadSavedProfile(): Promise<void> {
    try {
      const savedProfile = await AsyncStorage.getItem('quality_optimization_profile');
      if (savedProfile) {
        this.currentProfile = JSON.parse(savedProfile);
      }
    } catch (error) {
      // console.error('Erro ao carregar perfil de otimização:', error);
    }
  }

  /**
   * Salva perfil atual
   */
  private async saveProfile(): Promise<void> {
    if (!this.currentProfile) return;
    
    try {
      await AsyncStorage.setItem(
        'quality_optimization_profile',
        JSON.stringify(this.currentProfile)
      );
    } catch (error) {
      // console.error('Erro ao salvar perfil de otimização:', error);
    }
  }

  /**
   * Executa benchmark inicial
   */
  private async runInitialBenchmark(): Promise<void> {
    const now = Date.now();
    
    // Usa cache se ainda válido
    if (this.benchmarkCache && (now - this.lastBenchmarkTime) < this.BENCHMARK_CACHE_DURATION) {
      return;
    }
    
    
    // Coleta informações do dispositivo
    const deviceProfile = await this.collectDeviceProfile();
    const networkProfile = await this.collectNetworkProfile();
    
    // Calcula score do dispositivo
    const deviceScore = this.calculateDeviceScore(deviceProfile);
    
    // Determina qualidade recomendada
    const recommendedQuality = this.determineRecommendedQuality(deviceScore, networkProfile);
    
    // Identifica capacidades
    const capabilities = await this.identifyDeviceCapabilities();
    
    this.benchmarkCache = {
      deviceScore,
      recommendedQuality,
      capabilities,
    };
    
    this.lastBenchmarkTime = now;
    
    // Aplica configurações otimizadas
    await this.applyOptimizedSettings(deviceProfile, networkProfile);
    
  }

  /**
   * Coleta perfil do dispositivo
   */
  private async collectDeviceProfile(): Promise<DevicePerformanceProfile> {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const usedMemory = await DeviceInfo.getUsedMemory();
    const batteryLevel = await DeviceInfo.getBatteryLevel();
    const isCharging = await DeviceInfo.isBatteryCharging();
    const _totalDiskSpace = await DeviceInfo.getTotalDiskCapacity();
    const freeDiskSpace = await DeviceInfo.getFreeDiskStorage();
    
    // Simula scores de CPU/GPU baseado no modelo do dispositivo
    const deviceModel = await DeviceInfo.getModel();
    const { cpuScore, gpuScore } = this.estimateProcessorScores(deviceModel);
    
    return {
      cpuScore,
      gpuScore,
      memoryAvailable: totalMemory - usedMemory,
      storageAvailable: freeDiskSpace,
      thermalState: 'nominal', // Simulado - não disponível no React Native
      batteryLevel,
      isCharging,
    };
  }

  /**
   * Estima scores de processador baseado no modelo
   */
  private estimateProcessorScores(model: string): { cpuScore: number; gpuScore: number } {
    // Mapeamento simplificado de modelos conhecidos
    const highEndModels = ['iPhone 14', 'iPhone 15', 'Galaxy S23', 'Pixel 7'];
    const midRangeModels = ['iPhone 12', 'iPhone 13', 'Galaxy S21', 'Pixel 6'];
    
    if (highEndModels.some(m => model.includes(m))) {
      return { cpuScore: 0.9, gpuScore: 0.9 };
    } else if (midRangeModels.some(m => model.includes(m))) {
      return { cpuScore: 0.7, gpuScore: 0.7 };
    } else {
      return { cpuScore: 0.5, gpuScore: 0.5 };
    }
  }

  /**
   * Coleta perfil de rede
   */
  private async collectNetworkProfile(): Promise<NetworkProfile> {
    const netInfo = await NetInfo.fetch();
    
    let type: NetworkProfile['type'] = 'offline';
    let bandwidth = 0;
    
    if (netInfo.isConnected) {
      if (netInfo.type === 'wifi') {
        type = 'wifi';
        bandwidth = 50; // Estimativa para WiFi
      } else if (netInfo.type === 'cellular') {
        // Estima baseado em detalhes celulares
        const cellularGen = (netInfo.details as any)?.cellularGeneration;
        switch (cellularGen) {
          case '5g':
            type = 'cellular_5g';
            bandwidth = 100;
            break;
          case '4g':
            type = 'cellular_4g';
            bandwidth = 20;
            break;
          default:
            type = 'cellular_3g';
            bandwidth = 5;
        }
      }
    }
    
    // Mede latência com ping simulado
    const latency = await this.measureNetworkLatency();
    
    return {
      type,
      bandwidth,
      latency,
      packetLoss: 0, // Simplificado
      stability: latency < 50 ? 'stable' : latency < 150 ? 'unstable' : 'poor',
    };
  }

  /**
   * Mede latência de rede
   */
  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = Date.now();
      await fetch('https://www.google.com/generate_204', { method: 'HEAD' });
      return Date.now() - start;
    } catch {
      return 999; // Alta latência em caso de erro
    }
  }

  /**
   * Calcula score do dispositivo
   */
  private calculateDeviceScore(profile: DevicePerformanceProfile): number {
    const weights = {
      cpu: 0.3,
      gpu: 0.3,
      memory: 0.2,
      battery: 0.1,
      storage: 0.1,
    };
    
    const memoryScore = Math.min(profile.memoryAvailable / (4 * 1024 * 1024 * 1024), 1); // 4GB referência
    const batteryScore = profile.isCharging ? 1 : profile.batteryLevel;
    const storageScore = Math.min(profile.storageAvailable / (1024 * 1024 * 1024), 1); // 1GB referência
    
    return (
      profile.cpuScore * weights.cpu +
      profile.gpuScore * weights.gpu +
      memoryScore * weights.memory +
      batteryScore * weights.battery +
      storageScore * weights.storage
    );
  }

  /**
   * Determina qualidade recomendada
   */
  private determineRecommendedQuality(
    deviceScore: number,
    networkProfile: NetworkProfile
  ): 'low' | 'medium' | 'high' | 'ultra' {
    // Ajusta baseado na rede
    let adjustedScore = deviceScore;
    
    if (networkProfile.type === 'offline') {
      return 'low';
    }
    
    if (networkProfile.stability === 'poor') {
      adjustedScore *= 0.7;
    } else if (networkProfile.stability === 'unstable') {
      adjustedScore *= 0.85;
    }
    
    if (adjustedScore >= 0.8) return 'ultra';
    if (adjustedScore >= 0.6) return 'high';
    if (adjustedScore >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Identifica capacidades do dispositivo
   */
  private async identifyDeviceCapabilities(): Promise<string[]> {
    const capabilities: string[] = [];
    
    // Verifica capacidades básicas
    const hasNotch = await DeviceInfo.hasNotch();
    const hasDynamicIsland = await DeviceInfo.hasDynamicIsland();
    const systemVersion = await DeviceInfo.getSystemVersion();
    
    if (hasNotch || hasDynamicIsland) {
      capabilities.push('modern_display');
    }
    
    // Verifica versão do sistema
    const majorVersion = parseInt(systemVersion.split('.')[0], 10);
    if (majorVersion >= 14) {
      capabilities.push('advanced_animations');
      capabilities.push('particle_effects');
    }
    
    // Adiciona capacidades baseadas no benchmark
    if (this.benchmarkCache) {
      if (this.benchmarkCache.deviceScore >= 0.7) {
        capabilities.push('realtime_shadows');
        capabilities.push('complex_shaders');
      }
      if (this.benchmarkCache.deviceScore >= 0.5) {
        capabilities.push('multi_layer_animations');
      }
    }
    
    return capabilities;
  }

  /**
   * Aplica configurações otimizadas
   */
  private async applyOptimizedSettings(
    deviceProfile: DevicePerformanceProfile,
    networkProfile: NetworkProfile
  ): Promise<void> {
    const quality = this.benchmarkCache?.recommendedQuality || 'medium';
    
    const settings: OptimizedSettings = {
      animationQuality: quality,
      particleEffects: quality !== 'low',
      soundQuality: quality === 'ultra' ? 'high' : quality === 'high' ? 'normal' : 'compressed',
      preloadStrategy: this.determinePreloadStrategy(networkProfile, deviceProfile),
      cacheSize: this.determineCacheSize(deviceProfile),
      framerate: this.determineFramerate(quality, deviceProfile),
      resolution: this.determineResolution(quality),
    };
    
    const userId = await this.getCurrentUserId();
    
    this.currentProfile = {
      userId,
      deviceProfile,
      networkProfile,
      recommendedSettings: settings,
      adaptiveQuality: true,
    };
    
    await this.saveProfile();
    
    // Notifica mudanças
    this.notifySettingsChange(settings);
  }

  /**
   * Determina estratégia de pré-carregamento
   */
  private determinePreloadStrategy(
    network: NetworkProfile,
    device: DevicePerformanceProfile
  ): 'minimal' | 'balanced' | 'aggressive' {
    if (network.type === 'offline' || device.memoryAvailable < 1024 * 1024 * 1024) {
      return 'minimal';
    }
    
    if (network.type === 'wifi' && device.memoryAvailable > 2 * 1024 * 1024 * 1024) {
      return 'aggressive';
    }
    
    return 'balanced';
  }

  /**
   * Determina tamanho do cache
   */
  private determineCacheSize(device: DevicePerformanceProfile): number {
    const baseSize = 50 * 1024 * 1024; // 50MB base
    const availableRatio = Math.min(device.storageAvailable / (10 * 1024 * 1024 * 1024), 1);
    
    return Math.floor(baseSize + (baseSize * 3 * availableRatio)); // Até 200MB
  }

  /**
   * Determina framerate alvo
   */
  private determineFramerate(
    quality: string,
    device: DevicePerformanceProfile
  ): 30 | 60 | 120 {
    if (quality === 'ultra' && device.cpuScore >= 0.9) {
      return 120;
    }
    
    if (quality === 'low' || device.batteryLevel < this.BATTERY_THRESHOLD) {
      return 30;
    }
    
    return 60;
  }

  /**
   * Determina resolução
   */
  private determineResolution(quality: string): 'auto' | '720p' | '1080p' | '1440p' {
    switch (quality) {
      case 'ultra':
        return '1440p';
      case 'high':
        return '1080p';
      case 'medium':
        return '720p';
      default:
        return 'auto';
    }
  }

  /**
   * Inicia monitoramento de rede
   */
  private startNetworkMonitoring(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(async state => {
      if (!this.currentProfile) return;
      
      const networkProfile = await this.collectNetworkProfile();
      
      // Atualiza perfil se mudança significativa
      if (this.hasSignificantNetworkChange(this.currentProfile.networkProfile, networkProfile)) {
        this.currentProfile.networkProfile = networkProfile;
        await this.adjustQualityForNetwork(networkProfile);
      }
    });
  }

  /**
   * Verifica se houve mudança significativa na rede
   */
  private hasSignificantNetworkChange(
    oldProfile: NetworkProfile,
    newProfile: NetworkProfile
  ): boolean {
    return oldProfile.type !== newProfile.type ||
           Math.abs(oldProfile.bandwidth - newProfile.bandwidth) > 10 ||
           oldProfile.stability !== newProfile.stability;
  }

  /**
   * Ajusta qualidade baseado na rede
   */
  private async adjustQualityForNetwork(networkProfile: NetworkProfile): Promise<void> {
    if (!this.currentProfile) return;
    
    const settings = this.currentProfile.recommendedSettings;
    
    // Ajusta baseado na qualidade da rede
    if (networkProfile.type === 'offline') {
      settings.preloadStrategy = 'minimal';
      settings.animationQuality = 'low';
    } else if (networkProfile.stability === 'poor') {
      settings.preloadStrategy = 'minimal';
      if (settings.animationQuality === 'ultra') {
        settings.animationQuality = 'high';
      }
    } else if (networkProfile.type === 'wifi' && networkProfile.stability === 'stable') {
      settings.preloadStrategy = 'aggressive';
    }
    
    await this.saveProfile();
    this.notifySettingsChange(settings);
  }

  /**
   * Inicia monitoramento de performance
   */
  startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 5000); // Coleta a cada 5 segundos
  }

  /**
   * Para monitoramento de performance
   */
  stopPerformanceMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Coleta métricas de performance
   */
  private async collectPerformanceMetrics(): Promise<void> {
    // Simula coleta de métricas (em produção, usar react-native-performance)
    const metrics: PerformanceMetrics = {
      fps: [58, 60, 59, 60, 55], // Últimos 5 frames
      memoryUsage: [0.65, 0.67, 0.66], // Porcentagem de uso
      cpuUsage: [0.45, 0.48, 0.46], // Porcentagem de uso
      batteryDrain: 0.02, // 2% por hora
      networkLatency: [45, 50, 48], // ms
      timestamp: new Date().toISOString(),
    };
    
    this.performanceMetrics.push(metrics);
    
    // Mantém apenas últimas 100 métricas
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }
    
    // Verifica se precisa ajustar qualidade
    await this.checkPerformanceThresholds(metrics);
  }

  /**
   * Verifica thresholds de performance
   */
  private async checkPerformanceThresholds(metrics: PerformanceMetrics): Promise<void> {
    if (!this.currentProfile) return;
    
    const avgFPS = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
    const avgMemory = metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length;
    
    let needsAdjustment = false;
    const settings = this.currentProfile.recommendedSettings;
    
    // FPS muito baixo - reduz qualidade
    if (avgFPS < this.FPS_MINIMUM && settings.animationQuality !== 'low') {
      settings.animationQuality = this.downgradeQuality(settings.animationQuality);
      settings.particleEffects = false;
      needsAdjustment = true;
    }
    
    // Memória alta - reduz cache e qualidade
    if (avgMemory > this.MEMORY_THRESHOLD) {
      settings.cacheSize = Math.floor(settings.cacheSize * 0.7);
      settings.preloadStrategy = 'minimal';
      needsAdjustment = true;
    }
    
    // FPS estável e recursos disponíveis - pode aumentar qualidade
    if (avgFPS >= this.FPS_TARGET && avgMemory < 0.5 && settings.animationQuality !== 'ultra') {
      const upgraded = this.upgradeQuality(settings.animationQuality);
      if (upgraded !== settings.animationQuality) {
        settings.animationQuality = upgraded;
        needsAdjustment = true;
      }
    }
    
    if (needsAdjustment) {
      await this.saveProfile();
      this.notifySettingsChange(settings);
    }
  }

  /**
   * Reduz qualidade
   */
  private downgradeQuality(current: 'low' | 'medium' | 'high' | 'ultra'): 'low' | 'medium' | 'high' | 'ultra' {
    const levels = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.max(0, currentIndex - 1)] as any;
  }

  /**
   * Aumenta qualidade
   */
  private upgradeQuality(current: 'low' | 'medium' | 'high' | 'ultra'): 'low' | 'medium' | 'high' | 'ultra' {
    const levels = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.min(3, currentIndex + 1)] as any;
  }

  /**
   * Notifica mudança de configurações
   */
  private notifySettingsChange(settings: OptimizedSettings): void {
    // Emite evento para componentes ouvirem
    analyticsService.trackEngagement('quality_adjusted', settings.animationQuality, 1);
    
    // Em produção, usar EventEmitter ou Redux
  }

  /**
   * Obtém ID do usuário atual
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        return JSON.parse(userData).id;
      }
    } catch (error) {
      // console.error('Erro ao obter ID do usuário:', error);
    }
    return 'unknown';
  }

  /**
   * Obtém configurações atuais
   */
  getCurrentSettings(): OptimizedSettings | null {
    return this.currentProfile?.recommendedSettings || null;
  }

  /**
   * Obtém perfil completo
   */
  getCurrentProfile(): QualityOptimization | null {
    return this.currentProfile;
  }

  /**
   * Força reavaliação de qualidade
   */
  async forceQualityReassessment(): Promise<void> {
    this.benchmarkCache = null;
    this.lastBenchmarkTime = 0;
    await this.runInitialBenchmark();
  }

  /**
   * Obtém métricas de performance
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return this.performanceMetrics;
  }

  /**
   * Obtém estatísticas de performance
   */
  getPerformanceStats() {
    if (this.performanceMetrics.length === 0) {
      return null;
    }
    
    const allFPS = this.performanceMetrics.flatMap(m => m.fps);
    const allMemory = this.performanceMetrics.flatMap(m => m.memoryUsage);
    const allLatency = this.performanceMetrics.flatMap(m => m.networkLatency);
    
    return {
      avgFPS: allFPS.reduce((a, b) => a + b, 0) / allFPS.length,
      minFPS: Math.min(...allFPS),
      maxFPS: Math.max(...allFPS),
      avgMemoryUsage: allMemory.reduce((a, b) => a + b, 0) / allMemory.length,
      avgNetworkLatency: allLatency.reduce((a, b) => a + b, 0) / allLatency.length,
      currentQuality: this.currentProfile?.recommendedSettings.animationQuality || 'unknown',
      adaptiveEnabled: this.currentProfile?.adaptiveQuality || false,
    };
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    this.stopPerformanceMonitoring();
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }
}

export default QualityOptimizationService.getInstance();