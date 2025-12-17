/**
 * Testes do Monitoring Service
 *
 * Cobertura de testes:
 * - Inicialização (initialize, initializeCrashlytics, initializePerformanceMonitoring, initializeAnalytics)
 * - Logging de erros (logError, logNonFatalError)
 * - Gerenciamento de usuário (setUserId, setUserProperties)
 * - Performance tracing (startTrace, stopTrace)
 * - Métricas (recordMetric, getPerformanceMetrics, clearPerformanceMetrics)
 * - Event tracking (trackScreenView, trackEvent)
 * - Crash tracking (trackCrash)
 * - Testing functions (testCrash, testNonFatalError)
 * - Status (getStatus)
 */

import { monitoringService } from '../monitoringService';
import logger from '../loggerService';

// Mock do logger
jest.mock('../loggerService', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock do config
jest.mock('../../../config/environments', () => ({
  FEATURES: {
    CRASHLYTICS_ENABLED: true,
    PERFORMANCE_MONITORING: true,
    ANALYTICS_ENABLED: true,
  },
  ENVIRONMENT: 'test',
  APP_CONFIG: {
    VERSION: '1.0.0',
  },
  IS_DEV: true,
}));

// Mock do Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();

    // Resetar estado do serviço
    (monitoringService as any).isInitialized = false;
    (monitoringService as any).activeTraces.clear();
    monitoringService.clearPerformanceMetrics();

    // Mock do __DEV__ como desenvolvimento por padrão
    (global as any).__DEV__ = true;
  });

  describe('Inicialização', () => {
    it('deve criar instância do MonitoringService', () => {
      expect(monitoringService).toBeDefined();
    });

    it('deve inicializar todos os serviços quando features estão habilitadas', async () => {
      // Act
      await monitoringService.initialize();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('🔍 Monitoring services initialized');
      const status = monitoringService.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('não deve inicializar novamente se já inicializado', async () => {
      // Arrange
      await monitoringService.initialize();
      jest.clearAllMocks();

      // Act
      await monitoringService.initialize();

      // Assert
      expect(logger.debug).not.toHaveBeenCalledWith('🔍 Monitoring services initialized');
    });

    it('deve registrar erro se inicialização falhar', async () => {
      // Arrange
      const mockError = new Error('Initialization failed');
      jest.spyOn(monitoringService as any, 'initializeCrashlytics').mockRejectedValueOnce(mockError);

      // Act
      await monitoringService.initialize();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Failed to initialize monitoring services:', mockError);
    });

    it('deve inicializar crashlytics com informações do ambiente', async () => {
      // Act
      await (monitoringService as any).initializeCrashlytics();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('📊 Monitoring initialized (local logging only)');
      expect(logger.debug).toHaveBeenCalledWith('Environment:', 'test');
      expect(logger.debug).toHaveBeenCalledWith('App Version:', '1.0.0');
      expect(logger.debug).toHaveBeenCalledWith('Platform:', 'ios');
    });

    it('deve inicializar performance monitoring', async () => {
      // Arrange
      jest.useFakeTimers();

      // Act
      await (monitoringService as any).initializePerformanceMonitoring();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('⚡ Performance Monitoring initialized (local)');

      // Avançar timers para capturar app_start metric
      jest.advanceTimersByTime(3000);

      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('⚡ App started in'));

      jest.useRealTimers();
    });

    it('deve inicializar analytics com informações do ambiente', async () => {
      // Act
      await (monitoringService as any).initializeAnalytics();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('📈 Analytics initialized (use analyticsService)');
      expect(logger.debug).toHaveBeenCalledWith('Environment:', 'test');
      expect(logger.debug).toHaveBeenCalledWith('App Version:', '1.0.0');
      expect(logger.debug).toHaveBeenCalledWith('Platform:', 'ios');
    });
  });

  describe('Logging de Erros', () => {
    it('deve registrar erro com contexto completo', () => {
      // Arrange
      const error = new Error('Test error');
      const context = {
        screen: 'TestScreen',
        action: 'testAction',
        userId: 'user-123',
        additionalData: { key: 'value' },
      };

      // Act
      monitoringService.logError(error, context);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        message: 'Test error',
        name: 'Error',
        context,
      }));
    });

    it('deve registrar erro sem contexto', () => {
      // Arrange
      const error = new Error('Simple error');

      // Act
      monitoringService.logError(error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        message: 'Simple error',
        context: {},
      }));
    });

    it('deve incluir stack trace no log de erro', () => {
      // Arrange
      const error = new Error('Error with stack');

      // Act
      monitoringService.logError(error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        stack: error.stack,
      }));
    });

    it('deve incluir timestamp no log de erro', () => {
      // Arrange
      const error = new Error('Error with timestamp');

      // Act
      monitoringService.logError(error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        timestamp: expect.any(String),
      }));
    });

    it('deve registrar non-fatal error com nome correto', () => {
      // Arrange
      const message = 'Non-fatal test error';
      const context = { screen: 'TestScreen' };

      // Act
      monitoringService.logNonFatalError(message, context);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        name: 'NonFatalError',
        message,
        context,
      }));
    });

    it('deve registrar non-fatal error sem contexto', () => {
      // Arrange
      const message = 'Simple non-fatal error';

      // Act
      monitoringService.logNonFatalError(message);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        name: 'NonFatalError',
        message,
        context: {},
      }));
    });

    it('deve lidar com erro ao tentar registrar erro', () => {
      // Arrange
      const error = new Error('Original error');
      (logger.error as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      expect(() => monitoringService.logError(error)).not.toThrow();

      // Deve chamar logger.error duas vezes (tentativa original + erro de log)
      expect(logger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('Gerenciamento de Usuário', () => {
    it('deve definir user ID e registrar no log', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      await monitoringService.setUserId(userId);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('👤 User ID set for monitoring:', userId);
    });

    it('deve definir propriedades do usuário e registrar no log', async () => {
      // Arrange
      const properties = {
        userId: 'user-123',
        userType: 'premium' as const,
        appVersion: '1.0.0',
        platform: 'ios',
        deviceModel: 'iPhone 14',
      };

      // Act
      await monitoringService.setUserProperties(properties);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('👤 User properties set:', properties);
    });

    it('deve lidar com erro ao definir user ID', async () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.setUserId('user-123')).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to set user ID:', expect.any(Error));
    });

    it('deve lidar com erro ao definir propriedades do usuário', async () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.setUserProperties({ userId: 'user-123' })).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to set user properties:', expect.any(Error));
    });
  });

  describe('Performance Tracing', () => {
    it('deve iniciar trace com nome e atributos', async () => {
      // Arrange
      const traceName = 'api_call';
      const attributes = { endpoint: '/api/users' };

      // Act
      await monitoringService.startTrace(traceName, attributes);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`⏱️ Started trace: ${traceName}`);
      const activeTraces = (monitoringService as any).activeTraces;
      expect(activeTraces.has(traceName)).toBe(true);
      expect(activeTraces.get(traceName)).toEqual(expect.objectContaining({
        attributes,
        startTime: expect.any(Number),
      }));
    });

    it('deve iniciar trace sem atributos', async () => {
      // Arrange
      const traceName = 'simple_trace';

      // Act
      await monitoringService.startTrace(traceName);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`⏱️ Started trace: ${traceName}`);
      const activeTraces = (monitoringService as any).activeTraces;
      expect(activeTraces.get(traceName).attributes).toEqual({});
    });

    it('deve parar trace e registrar duração', async () => {
      // Arrange
      const traceName = 'api_call';
      await monitoringService.startTrace(traceName);

      // Simular passagem de tempo
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await monitoringService.stopTrace(traceName);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`⏹️ Stopped trace: ${traceName}`));
      const activeTraces = (monitoringService as any).activeTraces;
      expect(activeTraces.has(traceName)).toBe(false);
    });

    it('deve registrar métrica ao parar trace', async () => {
      // Arrange
      const traceName = 'api_call';
      await monitoringService.startTrace(traceName);

      // Simular passagem de tempo
      await new Promise(resolve => setTimeout(resolve, 5));

      // Act
      await monitoringService.stopTrace(traceName);
      const metrics = monitoringService.getPerformanceMetrics();

      // Assert
      expect(metrics).toHaveProperty(traceName);
      expect(metrics[traceName].count).toBe(1);
      expect(metrics[traceName].average).toBeGreaterThanOrEqual(0);
    });

    it('não deve fazer nada ao parar trace inexistente', async () => {
      // Arrange
      const traceName = 'non_existent';

      // Act
      await monitoringService.stopTrace(traceName);

      // Assert - não deve registrar stop
      expect(logger.debug).not.toHaveBeenCalledWith(expect.stringContaining('⏹️ Stopped trace'));
    });

    it('deve lidar com erro ao iniciar trace', async () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.startTrace('test')).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to start trace'), expect.any(Error));
    });

    it('deve lidar com erro ao parar trace', async () => {
      // Arrange
      await monitoringService.startTrace('test');

      // Mock para forçar erro durante recordMetric (chamado por stopTrace)
      const originalRecordMetric = monitoringService.recordMetric;
      monitoringService.recordMetric = jest.fn().mockImplementationOnce(() => {
        throw new Error('Record metric failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.stopTrace('test')).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to stop trace'), expect.any(Error));

      // Restaurar
      monitoringService.recordMetric = originalRecordMetric;
    });
  });

  describe('Métricas de Performance', () => {
    it('deve registrar métrica customizada', () => {
      // Arrange
      const metric = {
        name: 'api_response_time',
        value: 250,
        unit: 'ms',
      };

      // Act
      monitoringService.recordMetric(metric);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`📊 Metric recorded: ${metric.name} = ${metric.value}${metric.unit}`);
    });

    it('deve registrar métrica sem unidade', () => {
      // Arrange
      const metric = {
        name: 'items_count',
        value: 42,
      };

      // Act
      monitoringService.recordMetric(metric);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`📊 Metric recorded: ${metric.name} = ${metric.value}`);
    });

    it('deve armazenar múltiplos valores para mesma métrica', () => {
      // Arrange & Act
      monitoringService.recordMetric({ name: 'response_time', value: 100 });
      monitoringService.recordMetric({ name: 'response_time', value: 200 });
      monitoringService.recordMetric({ name: 'response_time', value: 150 });

      // Assert
      const metrics = monitoringService.getPerformanceMetrics();
      expect(metrics.response_time.count).toBe(3);
      expect(metrics.response_time.average).toBe(150);
      expect(metrics.response_time.min).toBe(100);
      expect(metrics.response_time.max).toBe(200);
    });

    it('deve retornar resumo de métricas vazio quando não há métricas', () => {
      // Act
      const metrics = monitoringService.getPerformanceMetrics();

      // Assert
      expect(metrics).toEqual({});
    });

    it('deve calcular estatísticas corretas das métricas', () => {
      // Arrange
      monitoringService.recordMetric({ name: 'test', value: 10 });
      monitoringService.recordMetric({ name: 'test', value: 20 });
      monitoringService.recordMetric({ name: 'test', value: 30 });

      // Act
      const metrics = monitoringService.getPerformanceMetrics();

      // Assert
      expect(metrics.test).toEqual({
        count: 3,
        average: 20,
        min: 10,
        max: 30,
      });
    });

    it('deve limpar métricas de performance', () => {
      // Arrange
      monitoringService.recordMetric({ name: 'test', value: 100 });
      expect(monitoringService.getPerformanceMetrics()).not.toEqual({});

      // Act
      monitoringService.clearPerformanceMetrics();

      // Assert
      expect(monitoringService.getPerformanceMetrics()).toEqual({});
      expect(logger.debug).toHaveBeenCalledWith('🧹 Performance metrics cleared');
    });

    it('deve lidar com erro ao registrar métrica', () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      expect(() => monitoringService.recordMetric({ name: 'test', value: 100 })).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to record metric:', expect.any(Error));
    });
  });

  describe('Event Tracking', () => {
    it('deve rastrear visualização de tela', async () => {
      // Arrange
      const screenName = 'HomeScreen';

      // Act
      await monitoringService.trackScreenView(screenName);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`📱 Screen view tracked: ${screenName}`);
    });

    it('deve rastrear evento customizado com parâmetros', async () => {
      // Arrange
      const eventName = 'purchase_completed';
      const parameters = { value: 99.99, currency: 'BRL' };

      // Act
      await monitoringService.trackEvent(eventName, parameters);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`📈 Event tracked: ${eventName}`, parameters);
    });

    it('deve rastrear evento sem parâmetros', async () => {
      // Arrange
      const eventName = 'app_opened';

      // Act
      await monitoringService.trackEvent(eventName);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(`📈 Event tracked: ${eventName}`, undefined);
    });

    it('deve lidar com erro ao rastrear tela', async () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.trackScreenView('TestScreen')).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to track screen view:', expect.any(Error));
    });

    it('deve lidar com erro ao rastrear evento', async () => {
      // Arrange
      (logger.debug as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      await expect(monitoringService.trackEvent('test_event')).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to track event:', expect.any(Error));
    });
  });

  describe('Crash Tracking', () => {
    it('deve rastrear crash fatal', () => {
      // Arrange
      const error = new Error('Fatal crash');

      // Act
      monitoringService.trackCrash(error, true);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('💥 Crash tracked:', expect.objectContaining({
        message: 'Fatal crash',
        isFatal: true,
        timestamp: expect.any(String),
      }));
    });

    it('deve rastrear crash não-fatal', () => {
      // Arrange
      const error = new Error('Non-fatal crash');

      // Act
      monitoringService.trackCrash(error, false);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('💥 Crash tracked:', expect.objectContaining({
        message: 'Non-fatal crash',
        isFatal: false,
      }));
    });

    it('deve rastrear crash como fatal por padrão', () => {
      // Arrange
      const error = new Error('Default crash');

      // Act
      monitoringService.trackCrash(error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('💥 Crash tracked:', expect.objectContaining({
        isFatal: true,
      }));
    });

    it('deve incluir stack trace no crash', () => {
      // Arrange
      const error = new Error('Crash with stack');

      // Act
      monitoringService.trackCrash(error);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('💥 Crash tracked:', expect.objectContaining({
        stack: error.stack,
      }));
    });

    it('deve lidar com erro ao rastrear crash', () => {
      // Arrange
      const error = new Error('Test crash');
      (logger.error as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Logger failed');
      });

      // Act & Assert - não deve lançar erro
      expect(() => monitoringService.trackCrash(error)).not.toThrow();
      expect(logger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('Testing Functions', () => {
    it('deve executar teste de crash em desenvolvimento', () => {
      // Arrange
      (global as any).__DEV__ = true;

      // Act
      monitoringService.testCrash();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('🧪 Testing crash reporting (simulated)...');
      expect(logger.error).toHaveBeenCalledWith('💥 Crash tracked:', expect.objectContaining({
        message: 'Test crash - Firebase Crashlytics removido',
      }));
    });

    it('não deve executar teste de crash em produção', () => {
      // Arrange
      const mockConfig = require('../../../config/environments');
      const originalIsDev = mockConfig.IS_DEV;
      mockConfig.IS_DEV = false;

      // Act
      monitoringService.testCrash();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Crash testing is only available in development');
      expect(logger.debug).not.toHaveBeenCalledWith('🧪 Testing crash reporting (simulated)...');

      // Restaurar
      mockConfig.IS_DEV = originalIsDev;
    });

    it('deve executar teste de non-fatal error em desenvolvimento', () => {
      // Arrange
      (global as any).__DEV__ = true;

      // Act
      monitoringService.testNonFatalError();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('🧪 Testing non-fatal error reporting...');
      expect(logger.error).toHaveBeenCalledWith('🚨 Error logged:', expect.objectContaining({
        name: 'NonFatalError',
        message: 'Test non-fatal error',
        context: {
          screen: 'TestScreen',
          action: 'test_error',
          additionalData: { testMode: true },
        },
      }));
    });

    it('não deve executar teste de non-fatal error em produção', () => {
      // Arrange
      const mockConfig = require('../../../config/environments');
      const originalIsDev = mockConfig.IS_DEV;
      mockConfig.IS_DEV = false;

      // Act
      monitoringService.testNonFatalError();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Error testing is only available in development');
      expect(logger.debug).not.toHaveBeenCalledWith('🧪 Testing non-fatal error reporting...');

      // Restaurar
      mockConfig.IS_DEV = originalIsDev;
    });
  });

  describe('Status', () => {
    it('deve retornar status completo do serviço', () => {
      // Act
      const status = monitoringService.getStatus();

      // Assert
      expect(status).toEqual({
        isInitialized: false,
        crashlyticsEnabled: true,
        performanceMonitoringEnabled: true,
        analyticsEnabled: true,
        activeTraces: [],
        metricsCount: 0,
      });
    });

    it('deve retornar status após inicialização', async () => {
      // Arrange
      await monitoringService.initialize();

      // Act
      const status = monitoringService.getStatus();

      // Assert
      expect(status.isInitialized).toBe(true);
    });

    it('deve retornar traces ativos no status', async () => {
      // Arrange
      await monitoringService.startTrace('trace1');
      await monitoringService.startTrace('trace2');

      // Act
      const status = monitoringService.getStatus();

      // Assert
      expect(status.activeTraces).toEqual(['trace1', 'trace2']);
    });

    it('deve retornar contagem de métricas no status', () => {
      // Arrange
      monitoringService.recordMetric({ name: 'metric1', value: 100 });
      monitoringService.recordMetric({ name: 'metric2', value: 200 });

      // Act
      const status = monitoringService.getStatus();

      // Assert
      expect(status.metricsCount).toBe(2);
    });
  });
});
