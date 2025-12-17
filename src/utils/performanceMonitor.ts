/**
 * Performance Monitor para testes em dispositivos low-end
 * Coleta métricas detalhadas de performance durante execução de animações
 */

import { Platform, InteractionManager } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface PerformanceMetrics {
  fps: number;
  jsFps: number;
  memoryUsage: number;
  cpuUsage: number;
  frameDrops: number;
  renderTime: number;
  timestamp: number;
}

export interface DeviceProfile {
  model: string;
  brand: string;
  systemName: string;
  systemVersion: string;
  totalMemory: number;
  usedMemory: number;
  isLowEndDevice: boolean;
  performanceClass: 'low' | 'medium' | 'high';
}

export interface PerformanceReport {
  device: DeviceProfile;
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  metrics: {
    average: PerformanceMetrics;
    min: PerformanceMetrics;
    max: PerformanceMetrics;
    samples: PerformanceMetrics[];
  };
  issues: string[];
  recommendations: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring: boolean = false;
  private metrics: PerformanceMetrics[] = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameDropThreshold: number = 16.67; // 60fps threshold
  private monitoringInterval: NodeJS.Timeout | null = null;
  private rafId: number | null = null;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Detecta se é um dispositivo low-end
   */
  async getDeviceProfile(): Promise<DeviceProfile> {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const usedMemory = await DeviceInfo.getUsedMemory();
    const totalMemoryMB = totalMemory / (1024 * 1024);
    
    // Classificação de performance
    let performanceClass: 'low' | 'medium' | 'high' = 'high';
    let isLowEndDevice = false;

    if (Platform.OS === 'android') {
      // Android: RAM < 2GB = low-end
      if (totalMemoryMB < 2048) {
        performanceClass = 'low';
        isLowEndDevice = true;
      } else if (totalMemoryMB < 3072) {
        performanceClass = 'medium';
      }
    } else if (Platform.OS === 'ios') {
      // iOS: Dispositivos antigos
      const model = DeviceInfo.getModel();
      const lowEndModels = ['iPhone 6', 'iPhone 6s', 'iPhone SE', 'iPhone 7'];
      if (lowEndModels.some(m => model.includes(m))) {
        performanceClass = 'low';
        isLowEndDevice = true;
      }
    }

    return {
      model: DeviceInfo.getModel(),
      brand: DeviceInfo.getBrand(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      totalMemory,
      usedMemory,
      isLowEndDevice,
      performanceClass,
    };
  }

  /**
   * Inicia monitoramento de performance
   */
  startMonitoring(_testName: string): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.metrics = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    // Monitor de FPS usando requestAnimationFrame
    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      const _fps = 1000 / deltaTime;

      this.frameCount++;
      this.lastFrameTime = currentTime;

      // Detecta frame drops
      if (deltaTime > this.frameDropThreshold * 1.5) {
        // Frame demorou mais de 1.5x o esperado
        this.recordFrameDrop();
      }

      this.rafId = requestAnimationFrame(measureFrame);
    };
    this.rafId = requestAnimationFrame(measureFrame);

    // Coleta métricas periodicamente
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 100); // Coleta a cada 100ms
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring(): PerformanceReport | null {
    if (!this.isMonitoring) return null;

    this.isMonitoring = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    return this.generateReport('Performance Test');
  }

  /**
   * Coleta métricas instantâneas
   */
  private async collectMetrics(): Promise<void> {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    const fps = Math.min(60, 1000 / deltaTime);

    // Estima uso de memória (simulado, React Native não expõe diretamente)
    const memoryUsage = await this.estimateMemoryUsage();

    const metric: PerformanceMetrics = {
      fps: Math.round(fps),
      jsFps: Math.round(fps * 0.9), // JS thread geralmente um pouco mais lento
      memoryUsage,
      cpuUsage: this.estimateCPUUsage(fps),
      frameDrops: this.getFrameDropCount(),
      renderTime: deltaTime,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
  }

  /**
   * Estima uso de memória
   */
  private async estimateMemoryUsage(): Promise<number> {
    try {
      const usedMemory = await DeviceInfo.getUsedMemory();
      return usedMemory;
    } catch {
      // Fallback: estimar baseado em performance
      return this.frameCount * 1000; // Estimativa simples
    }
  }

  /**
   * Estima uso de CPU baseado em FPS
   */
  private estimateCPUUsage(fps: number): number {
    // Quanto menor o FPS, maior o uso de CPU (inversamente proporcional)
    const targetFPS = 60;
    const usage = Math.max(0, Math.min(100, ((targetFPS - fps) / targetFPS) * 100));
    return Math.round(usage);
  }

  /**
   * Registra frame drop
   */
  private frameDropCount: number = 0;
  private recordFrameDrop(): void {
    this.frameDropCount++;
  }

  private getFrameDropCount(): number {
    return this.frameDropCount;
  }

  /**
   * Gera relatório de performance
   */
  private async generateReport(testName: string): Promise<PerformanceReport> {
    const device = await this.getDeviceProfile();
    
    if (this.metrics.length === 0) {
      return {
        device,
        testName,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        metrics: {
          average: this.getEmptyMetrics(),
          min: this.getEmptyMetrics(),
          max: this.getEmptyMetrics(),
          samples: [],
        },
        issues: ['No metrics collected'],
        recommendations: ['Retry test'],
      };
    }

    const average = this.calculateAverageMetrics();
    const min = this.calculateMinMetrics();
    const max = this.calculateMaxMetrics();

    const issues = this.detectIssues(average, device);
    const recommendations = this.generateRecommendations(issues, device);

    return {
      device,
      testName,
      startTime: this.metrics[0].timestamp,
      endTime: this.metrics[this.metrics.length - 1].timestamp,
      duration: this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp,
      metrics: {
        average,
        min,
        max,
        samples: this.metrics,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Calcula métricas médias
   */
  private calculateAverageMetrics(): PerformanceMetrics {
    const sum = this.metrics.reduce((acc, m) => ({
      fps: acc.fps + m.fps,
      jsFps: acc.jsFps + m.jsFps,
      memoryUsage: acc.memoryUsage + m.memoryUsage,
      cpuUsage: acc.cpuUsage + m.cpuUsage,
      frameDrops: acc.frameDrops + m.frameDrops,
      renderTime: acc.renderTime + m.renderTime,
      timestamp: 0,
    }), this.getEmptyMetrics());

    const count = this.metrics.length;
    return {
      fps: Math.round(sum.fps / count),
      jsFps: Math.round(sum.jsFps / count),
      memoryUsage: Math.round(sum.memoryUsage / count),
      cpuUsage: Math.round(sum.cpuUsage / count),
      frameDrops: Math.round(sum.frameDrops / count),
      renderTime: Math.round(sum.renderTime / count),
      timestamp: Date.now(),
    };
  }

  /**
   * Calcula métricas mínimas
   */
  private calculateMinMetrics(): PerformanceMetrics {
    return this.metrics.reduce((min, m) => ({
      fps: Math.min(min.fps, m.fps),
      jsFps: Math.min(min.jsFps, m.jsFps),
      memoryUsage: Math.min(min.memoryUsage, m.memoryUsage),
      cpuUsage: Math.min(min.cpuUsage, m.cpuUsage),
      frameDrops: Math.min(min.frameDrops, m.frameDrops),
      renderTime: Math.min(min.renderTime, m.renderTime),
      timestamp: m.timestamp,
    }), this.metrics[0]);
  }

  /**
   * Calcula métricas máximas
   */
  private calculateMaxMetrics(): PerformanceMetrics {
    return this.metrics.reduce((max, m) => ({
      fps: Math.max(max.fps, m.fps),
      jsFps: Math.max(max.jsFps, m.jsFps),
      memoryUsage: Math.max(max.memoryUsage, m.memoryUsage),
      cpuUsage: Math.max(max.cpuUsage, m.cpuUsage),
      frameDrops: Math.max(max.frameDrops, m.frameDrops),
      renderTime: Math.max(max.renderTime, m.renderTime),
      timestamp: m.timestamp,
    }), this.metrics[0]);
  }

  /**
   * Detecta problemas de performance
   */
  private detectIssues(metrics: PerformanceMetrics, device: DeviceProfile): string[] {
    const issues: string[] = [];

    // Thresholds baseados no tipo de dispositivo
    const fpsThreshold = device.isLowEndDevice ? 20 : 30;
    const memoryThreshold = device.totalMemory * 0.5; // 50% da memória total
    const cpuThreshold = device.isLowEndDevice ? 70 : 50;

    if (metrics.fps < fpsThreshold) {
      issues.push(`FPS baixo: ${metrics.fps}fps (esperado: >${fpsThreshold}fps)`);
    }

    if (metrics.memoryUsage > memoryThreshold) {
      issues.push(`Uso excessivo de memória: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
    }

    if (metrics.cpuUsage > cpuThreshold) {
      issues.push(`CPU sobrecarregada: ${metrics.cpuUsage}%`);
    }

    if (metrics.frameDrops > 10) {
      issues.push(`Frame drops excessivos: ${metrics.frameDrops}`);
    }

    if (metrics.renderTime > 33) { // 30fps threshold
      issues.push(`Tempo de renderização alto: ${metrics.renderTime}ms`);
    }

    return issues;
  }

  /**
   * Gera recomendações baseadas nos problemas
   */
  private generateRecommendations(issues: string[], device: DeviceProfile): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.includes('FPS baixo'))) {
      recommendations.push('Reduzir qualidade das animações');
      recommendations.push('Implementar frame skipping adaptativo');
      recommendations.push('Desabilitar efeitos secundários');
    }

    if (issues.some(i => i.includes('memória'))) {
      recommendations.push('Implementar cache mais agressivo');
      recommendations.push('Reduzir número de frames pré-carregados');
      recommendations.push('Liberar assets não utilizados mais rapidamente');
    }

    if (issues.some(i => i.includes('CPU'))) {
      recommendations.push('Otimizar cálculos de animação');
      recommendations.push('Usar shouldComponentUpdate/React.memo');
      recommendations.push('Implementar throttling de eventos');
    }

    if (device.isLowEndDevice) {
      recommendations.push('Ativar modo low-end automaticamente');
      recommendations.push('Reduzir resolução de assets');
      recommendations.push('Simplificar UI para dispositivos fracos');
    }

    return recommendations;
  }

  /**
   * Retorna métricas vazias
   */
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      jsFps: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      frameDrops: 0,
      renderTime: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Executa teste de performance específico
   */
  async runPerformanceTest(
    testName: string,
    testFunction: () => Promise<void>,
    duration: number = 5000
  ): Promise<PerformanceReport> {
    // Aguarda sistema estabilizar
    await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));
    
    // Inicia monitoramento
    this.startMonitoring(testName);
    
    // Executa função de teste
    const testPromise = testFunction();
    
    // Aguarda duração do teste ou conclusão da função
    await Promise.race([
      testPromise,
      new Promise(resolve => setTimeout(resolve, duration))
    ]);
    
    // Para monitoramento e retorna relatório
    const report = this.stopMonitoring();
    
    if (!report) {
      throw new Error('Failed to generate performance report');
    }
    
    return report;
  }
}

export default PerformanceMonitor.getInstance();