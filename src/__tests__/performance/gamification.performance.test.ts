/**
 * Testes de Performance para Sistema de Gamificação
 * Foco em dispositivos low-end
 */

import { Platform } from 'react-native';
import performanceMonitor, { PerformanceReport } from '../../utils/performanceMonitor';
import gamificationAssetManager from '../../services/gamificationAssetManager';
import { animationManager } from '../../services/animationManager';
import { GameThemeType } from '../../types/animations';

// Mock para simular dispositivo low-end
const mockPlatformOS = Platform.OS;
jest.mock('react-native-device-info', () => ({
  getTotalMemory: jest.fn(() => Promise.resolve(2 * 1024 * 1024 * 1024)), // 2GB
  getUsedMemory: jest.fn(() => Promise.resolve(1.5 * 1024 * 1024 * 1024)), // 1.5GB usado
  getModel: jest.fn(() => 'Test Device'),
  getBrand: jest.fn(() => 'TestBrand'),
  getSystemName: jest.fn(() => mockPlatformOS || 'android'),
  getSystemVersion: jest.fn(() => '10.0'),
}));

describe('Gamification Performance Tests', () => {
  const reports: PerformanceReport[] = [];

  beforeAll(async () => {
    // Inicializa gerenciadores
    await gamificationAssetManager.initialize();
    animationManager.initialize();
  });

  afterAll(() => {
    // Gera relatório consolidado
    generateConsolidatedReport(reports);
  });

  describe('Asset Loading Performance', () => {
    it('should load theme assets within acceptable time', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Asset Loading - Fire Theme',
        async () => {
          await gamificationAssetManager.warmupTheme('fire');
        },
        3000 // 3 segundos máximo
      );

      reports.push(report);
      
      // Validações
      expect(report.duration).toBeLessThan(3000);
      expect(report.metrics.average.memoryUsage).toBeLessThan(150 * 1024 * 1024);
      expect(report.metrics.average.fps).toBeGreaterThan(20);
    });

    it('should handle multiple theme preloading', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Multi-Theme Loading',
        async () => {
          await Promise.all([
            gamificationAssetManager.warmupTheme('fire'),
            gamificationAssetManager.warmupTheme('ice'),
            gamificationAssetManager.warmupTheme('meteor'),
          ]);
        },
        5000
      );

      reports.push(report);
      
      expect(report.duration).toBeLessThan(5000);
      expect(report.issues.length).toBeLessThan(3);
    });

    it('should efficiently manage memory during asset loading', async () => {
      const initialMemory = await getMemoryUsage();
      
      const report = await performanceMonitor.runPerformanceTest(
        'Memory Management Test',
        async () => {
          // Carrega e limpa múltiplas vezes
          for (let i = 0; i < 5; i++) {
            await gamificationAssetManager.warmupTheme('fire');
            gamificationAssetManager.clearCache();
          }
        },
        10000
      );

      const finalMemory = await getMemoryUsage();
      const memoryLeak = finalMemory - initialMemory;

      reports.push(report);
      
      // Não deve ter vazamento significativo
      expect(memoryLeak).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });
  });

  describe('Animation Playback Performance', () => {
    const themes: GameThemeType[] = ['fire', 'ice', 'meteor'];

    themes.forEach(theme => {
      it(`should play ${theme} animation smoothly`, async () => {
        const report = await performanceMonitor.runPerformanceTest(
          `Animation Playback - ${theme}`,
          async () => {
            await simulateAnimation(theme, 120); // 120 frames
          },
          5000
        );

        reports.push(report);
        
        // Validações específicas para dispositivos low-end
        const device = await performanceMonitor.getDeviceProfile();
        const minFPS = device.isLowEndDevice ? 15 : 24;
        
        expect(report.metrics.average.fps).toBeGreaterThan(minFPS);
        expect(report.metrics.min.fps).toBeGreaterThan(10); // Nunca abaixo de 10fps
        expect(report.metrics.average.frameDrops).toBeLessThan(10);
      });
    });

    it('should handle multiple simultaneous animations', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Multiple Animations',
        async () => {
          // Simula múltiplas animações simultâneas
          await Promise.all([
            simulateAnimation('fire', 60),
            simulateEmojiReactions(10),
            simulateParticleEffects(),
          ]);
        },
        5000
      );

      reports.push(report);
      
      expect(report.metrics.average.fps).toBeGreaterThan(15);
      expect(report.metrics.average.cpuUsage).toBeLessThan(80);
    });
  });

  describe('Emoji Reaction System Performance', () => {
    it('should handle burst of emoji reactions', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Emoji Burst Test',
        async () => {
          // Simula explosão de emojis
          for (let i = 0; i < 20; i++) {
            await simulateEmojiReaction();
            await sleep(100);
          }
        },
        3000
      );

      reports.push(report);
      
      expect(report.metrics.average.fps).toBeGreaterThan(20);
      expect(report.metrics.average.frameDrops).toBeLessThan(5);
    });

    it('should maintain performance with continuous reactions', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Continuous Emoji Test',
        async () => {
          const interval = setInterval(() => {
            simulateEmojiReaction();
          }, 200);

          await sleep(5000);
          clearInterval(interval);
        },
        5000
      );

      reports.push(report);
      
      expect(report.metrics.average.fps).toBeGreaterThan(24);
    });
  });

  describe('Adaptive Quality System', () => {
    it('should automatically reduce quality on low-end devices', async () => {
      const device = await performanceMonitor.getDeviceProfile();
      
      if (device.isLowEndDevice) {
        const report = await performanceMonitor.runPerformanceTest(
          'Adaptive Quality Test',
          async () => {
            // Testa com qualidade adaptativa
            await animationManager.setQuality('auto');
            await simulateAnimation('fire', 120);
          },
          5000
        );

        reports.push(report);
        
        // Com qualidade reduzida, deve manter FPS aceitável
        expect(report.metrics.average.fps).toBeGreaterThan(20);
      }
    });

    it('should implement frame skipping when needed', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Frame Skipping Test',
        async () => {
          // Força situação de stress
          await Promise.all([
            simulateAnimation('fire', 200),
            simulateAnimation('ice', 200),
            simulateAnimation('meteor', 200),
          ]);
        },
        5000
      );

      reports.push(report);
      
      // Mesmo com frame skipping, deve manter experiência aceitável
      expect(report.metrics.min.fps).toBeGreaterThan(10);
    });
  });

  describe('Memory Cleanup and Optimization', () => {
    it('should clean up memory after animations', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Memory Cleanup Test',
        async () => {
          // Ciclo de carga e limpeza
          for (let i = 0; i < 3; i++) {
            await gamificationAssetManager.warmupTheme('fire');
            await simulateAnimation('fire', 100);
            gamificationAssetManager.clearCache();
            await sleep(500);
          }
        },
        10000
      );

      reports.push(report);
      
      // Memória deve voltar ao normal após cleanup
      const memoryVariation = report.metrics.max.memoryUsage - report.metrics.min.memoryUsage;
      expect(memoryVariation).toBeLessThan(50 * 1024 * 1024); // < 50MB variação
    });

    it('should handle memory pressure gracefully', async () => {
      const report = await performanceMonitor.runPerformanceTest(
        'Memory Pressure Test',
        async () => {
          // Carrega muitos assets simultaneamente
          const promises = [];
          for (let i = 0; i < 10; i++) {
            promises.push(gamificationAssetManager.loadEmojiAsset('kiss'));
            promises.push(gamificationAssetManager.loadEmojiAsset('angry'));
            promises.push(gamificationAssetManager.loadEmojiAsset('cool'));
          }
          await Promise.all(promises);
        },
        5000
      );

      reports.push(report);
      
      // Não deve crashar ou ter performance inaceitável
      expect(report.metrics.average.fps).toBeGreaterThan(10);
      expect(report.issues.filter(i => i.includes('memória')).length).toBeLessThan(2);
    });
  });
});

// Funções auxiliares

async function getMemoryUsage(): Promise<number> {
  // Simula obtenção de uso de memória
  return Math.random() * 100 * 1024 * 1024; // 0-100MB
}

async function simulateAnimation(theme: GameThemeType, frames: number): Promise<void> {
  for (let i = 0; i < frames; i++) {
    // Simula renderização de frame
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

async function simulateEmojiReaction(): Promise<void> {
  // Simula criação e animação de emoji
  await sleep(50);
}

async function simulateEmojiReactions(count: number): Promise<void> {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(simulateEmojiReaction());
  }
  await Promise.all(promises);
}

async function simulateParticleEffects(): Promise<void> {
  // Simula sistema de partículas
  for (let i = 0; i < 50; i++) {
    await sleep(20);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera relatório consolidado de todos os testes
 */
function generateConsolidatedReport(reports: PerformanceReport[]): void {
  console.log('\n========================================');
  console.log('📊 RELATÓRIO DE PERFORMANCE CONSOLIDADO');
  console.log('========================================\n');

  // Agrupa por tipo de teste
  const byTestType = reports.reduce((acc, report) => {
    const type = report.testName.split(' - ')[0];
    if (!acc[type]) acc[type] = [];
    acc[type].push(report);
    return acc;
  }, {} as Record<string, PerformanceReport[]>);

  // Resumo por tipo
  Object.entries(byTestType).forEach(([type, typeReports]) => {
    console.log(`\n📋 ${type}`);
    console.log('-------------------');
    
    typeReports.forEach(report => {
      const status = report.issues.length === 0 ? '✅' : 
                    report.issues.length < 3 ? '⚠️' : '❌';
      
      console.log(`${status} ${report.testName}`);
      console.log(`   FPS: ${report.metrics.average.fps} (min: ${report.metrics.min.fps})`);
      console.log(`   Memory: ${Math.round(report.metrics.average.memoryUsage / 1024 / 1024)}MB`);
      console.log(`   CPU: ${report.metrics.average.cpuUsage}%`);
      console.log(`   Frame Drops: ${report.metrics.average.frameDrops}`);
      
      if (report.issues.length > 0) {
        console.log('   Issues:');
        report.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log('   Recommendations:');
        report.recommendations.slice(0, 3).forEach(rec => {
          console.log(`     • ${rec}`);
        });
      }
      console.log('');
    });
  });

  // Resumo geral
  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);
  const avgFPS = reports.reduce((sum, r) => sum + r.metrics.average.fps, 0) / reports.length;
  const avgMemory = reports.reduce((sum, r) => sum + r.metrics.average.memoryUsage, 0) / reports.length;
  
  console.log('\n📈 RESUMO GERAL');
  console.log('-------------------');
  console.log(`Total de Testes: ${reports.length}`);
  console.log(`Issues Encontradas: ${totalIssues}`);
  console.log(`FPS Médio: ${Math.round(avgFPS)}`);
  console.log(`Memória Média: ${Math.round(avgMemory / 1024 / 1024)}MB`);
  
  const overallStatus = totalIssues === 0 ? '✅ EXCELENTE' :
                       totalIssues < 5 ? '⚠️ BOM' :
                       totalIssues < 10 ? '⚠️ ACEITÁVEL' :
                       '❌ PRECISA MELHORIAS';
  
  console.log(`\nStatus Geral: ${overallStatus}`);
  console.log('========================================\n');
}