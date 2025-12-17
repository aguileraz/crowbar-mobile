/**
 * Testes do Logger Service
 *
 * Cobertura de testes:
 * - Métodos de log (debug, info, warn, error, performance, api, navigation)
 * - Armazenamento de logs (adição, limite, timestamp, contexto)
 * - Recuperação de logs (getLogs com e sem filtro)
 * - Limpeza de logs (clearLogs)
 * - Comportamento em produção (reportToCrashlytics)
 */

import logger from '../loggerService';

describe('LoggerService', () => {
  // Mock do console
  const originalConsole = { ...console };

  beforeEach(() => {
    // Mock dos métodos do console
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();

    // Limpar logs antes de cada teste
    logger.clearLogs();

    // Mock do __DEV__ como desenvolvimento por padrão
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    // Restaurar console original
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  });

  describe('Métodos de Log Level', () => {
    describe('debug()', () => {
      it('deve registrar mensagem com nível debug', () => {
        // Arrange
        const message = 'Mensagem de debug';
        const context = 'TestContext';
        const extra = { key: 'value' };

        // Act
        logger.debug(message, context, extra);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('debug');
        expect(logs[0].message).toBe(message);
        expect(logs[0].context).toBe(context);
        expect(logs[0].extra).toEqual(extra);
      });

      it('deve registrar mensagem debug sem contexto ou extra', () => {
        // Arrange
        const message = 'Debug simples';

        // Act
        logger.debug(message);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('debug');
        expect(logs[0].message).toBe(message);
        expect(logs[0].context).toBeUndefined();
        expect(logs[0].extra).toBeUndefined();
      });
    });

    describe('info()', () => {
      it('deve registrar mensagem com nível info', () => {
        // Arrange
        const message = 'Informação importante';
        const context = 'InfoContext';
        const extra = { userId: 123 };

        // Act
        logger.info(message, context, extra);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe(message);
        expect(logs[0].context).toBe(context);
        expect(logs[0].extra).toEqual(extra);
      });

      it('deve registrar múltiplas mensagens info em sequência', () => {
        // Arrange & Act
        logger.info('Primeira mensagem');
        logger.info('Segunda mensagem');
        logger.info('Terceira mensagem');
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(3);
        expect(logs[0].message).toBe('Primeira mensagem');
        expect(logs[1].message).toBe('Segunda mensagem');
        expect(logs[2].message).toBe('Terceira mensagem');
      });
    });

    describe('warn()', () => {
      it('deve registrar mensagem com nível warn', () => {
        // Arrange
        const message = 'Aviso importante';
        const context = 'WarnContext';
        const extra = { warning: 'deprecated' };

        // Act
        logger.warn(message, context, extra);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('warn');
        expect(logs[0].message).toBe(message);
        expect(logs[0].context).toBe(context);
        expect(logs[0].extra).toEqual(extra);
      });
    });

    describe('error()', () => {
      it('deve registrar mensagem com nível error', () => {
        // Arrange
        const message = 'Erro crítico';
        const context = 'ErrorContext';
        const error = new Error('Erro de teste');

        // Act
        logger.error(message, context, error);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('error');
        expect(logs[0].message).toBe(message);
        expect(logs[0].context).toBe(context);
        expect(logs[0].extra).toBe(error);
      });

      it('NÃO deve reportar erro em desenvolvimento', () => {
        // Arrange
        (global as any).__DEV__ = true;
        const message = 'Erro em dev';
        const error = new Error('Erro dev');
        const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

        // Act
        logger.error(message, 'DevError', error);

        // Assert
        expect(reportSpy).not.toHaveBeenCalled();
        reportSpy.mockRestore();
      });

      it('deve reportar erro em produção quando error object está presente', () => {
        // Arrange
        const message = 'Erro em produção';
        const context = 'ProdError';
        const error = new Error('Erro prod');
        const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

        // Mock isDev como false (produção)
        Object.defineProperty(logger as any, 'isDev', {
          get: () => false,
          configurable: true,
        });

        // Act
        logger.error(message, context, error);

        // Assert
        expect(reportSpy).toHaveBeenCalledWith(message, context, error);
        expect(reportSpy).toHaveBeenCalledTimes(1);

        // Cleanup
        reportSpy.mockRestore();
        Object.defineProperty(logger as any, 'isDev', {
          get: () => true,
          configurable: true,
        });
      });

      it('NÃO deve reportar erro em produção quando error object está ausente', () => {
        // Arrange
        const message = 'Erro sem objeto';
        const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

        // Mock isDev como false (produção)
        Object.defineProperty(logger as any, 'isDev', {
          get: () => false,
          configurable: true,
        });

        // Act
        logger.error(message, 'NoErrorObject');

        // Assert
        expect(reportSpy).not.toHaveBeenCalled();

        // Cleanup
        reportSpy.mockRestore();
        Object.defineProperty(logger as any, 'isDev', {
          get: () => true,
          configurable: true,
        });
      });
    });

    describe('performance()', () => {
      it('deve registrar log de performance com duração', () => {
        // Arrange
        const operation = 'Carregar produtos';
        const duration = 250;

        // Act
        logger.performance(operation, duration);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe(`Performance: ${operation}`);
        expect(logs[0].context).toBe('PERF');
        expect(logs[0].extra).toEqual({ duration });
      });

      it('deve registrar performance com duração menor que 100ms', () => {
        // Arrange
        const operation = 'Operação rápida';
        const duration = 50;

        // Act
        logger.performance(operation, duration);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].extra.duration).toBe(50);
      });
    });

    describe('api()', () => {
      it('deve registrar chamada de API com todos os parâmetros', () => {
        // Arrange
        const method = 'GET';
        const url = '/api/products';
        const status = 200;
        const duration = 150;

        // Act
        logger.api(method, url, status, duration);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe(`${method} ${url}`);
        expect(logs[0].context).toBe('API');
        expect(logs[0].extra).toEqual({ _status: status, duration });
      });

      it('deve registrar chamada de API sem status e duração', () => {
        // Arrange
        const method = 'POST';
        const url = '/api/users';

        // Act
        logger.api(method, url);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe(`${method} ${url}`);
        expect(logs[0].extra._status).toBeUndefined();
        expect(logs[0].extra.duration).toBeUndefined();
      });
    });

    describe('navigation()', () => {
      it('deve registrar navegação entre telas', () => {
        // Arrange
        const from = 'HomeScreen';
        const to = 'ProductScreen';

        // Act
        logger.navigation(from, to);
        const logs = logger.getLogs();

        // Assert
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe('info');
        expect(logs[0].message).toBe(`Navigation: ${from} → ${to}`);
        expect(logs[0].context).toBe('NAV');
      });
    });
  });

  describe('Armazenamento de Logs', () => {
    it('deve adicionar logs ao array interno', () => {
      // Arrange & Act
      logger.info('Log 1');
      logger.debug('Log 2');
      logger.warn('Log 3');
      const logs = logger.getLogs();

      // Assert
      expect(logs).toHaveLength(3);
    });

    it('deve incluir timestamp em cada log', () => {
      // Arrange
      const beforeTimestamp = new Date();

      // Act
      logger.info('Log com timestamp');
      const logs = logger.getLogs();
      const afterTimestamp = new Date();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime());
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTimestamp.getTime());
    });

    it('deve incluir contexto quando fornecido', () => {
      // Arrange
      const context = 'TestContext';

      // Act
      logger.info('Log com contexto', context);
      const logs = logger.getLogs();

      // Assert
      expect(logs[0].context).toBe(context);
    });

    it('deve incluir dados extras quando fornecidos', () => {
      // Arrange
      const extra = { userId: 123, action: 'purchase' };

      // Act
      logger.info('Log com extras', 'Context', extra);
      const logs = logger.getLogs();

      // Assert
      expect(logs[0].extra).toEqual(extra);
    });

    it('deve limitar logs ao maxLogs (1000) e remover os mais antigos', () => {
      // Arrange & Act
      // Adicionar 1050 logs
      for (let i = 0; i < 1050; i++) {
        logger.info(`Log ${i}`);
      }
      const logs = logger.getLogs();

      // Assert
      expect(logs).toHaveLength(1000);
      // Os primeiros 50 logs devem ter sido removidos
      expect(logs[0].message).toBe('Log 50');
      expect(logs[999].message).toBe('Log 1049');
    });
  });

  describe('Recuperação de Logs', () => {
    beforeEach(() => {
      // Adicionar logs de diferentes níveis
      logger.debug('Debug log');
      logger.info('Info log 1');
      logger.info('Info log 2');
      logger.warn('Warning log');
      logger.error('Error log');
    });

    it('deve retornar todos os logs quando chamado sem parâmetro', () => {
      // Act
      const logs = logger.getLogs();

      // Assert
      expect(logs).toHaveLength(5);
    });

    it('deve filtrar logs por nível debug', () => {
      // Act
      const debugLogs = logger.getLogs('debug');

      // Assert
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0].level).toBe('debug');
      expect(debugLogs[0].message).toBe('Debug log');
    });

    it('deve filtrar logs por nível info', () => {
      // Act
      const infoLogs = logger.getLogs('info');

      // Assert
      expect(infoLogs).toHaveLength(2);
      expect(infoLogs[0].message).toBe('Info log 1');
      expect(infoLogs[1].message).toBe('Info log 2');
    });

    it('deve filtrar logs por nível warn', () => {
      // Act
      const warnLogs = logger.getLogs('warn');

      // Assert
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].level).toBe('warn');
    });

    it('deve filtrar logs por nível error', () => {
      // Act
      const errorLogs = logger.getLogs('error');

      // Assert
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
    });
  });

  describe('Limpeza de Logs', () => {
    it('deve limpar todos os logs do array', () => {
      // Arrange
      logger.info('Log 1');
      logger.info('Log 2');
      logger.info('Log 3');
      expect(logger.getLogs()).toHaveLength(3);

      // Act
      logger.clearLogs();
      const logs = logger.getLogs();

      // Assert
      expect(logs).toHaveLength(0);
    });

    it('deve retornar array vazio após clearLogs', () => {
      // Arrange
      logger.info('Log antes de limpar');

      // Act
      logger.clearLogs();
      const logs = logger.getLogs();

      // Assert
      expect(logs).toEqual([]);
    });

    it('deve permitir adicionar novos logs após clearLogs', () => {
      // Arrange
      logger.info('Log antigo');
      logger.clearLogs();

      // Act
      logger.info('Log novo');
      const logs = logger.getLogs();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Log novo');
    });
  });

  describe('Comportamento em Produção', () => {
    it('deve chamar reportToCrashlytics em produção quando erro presente', () => {
      // Arrange
      const message = 'Erro crítico produção';
      const context = 'ProdContext';
      const error = new Error('Erro production');
      const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

      // Mock isDev como false (produção)
      Object.defineProperty(logger as any, 'isDev', {
        get: () => false,
        configurable: true,
      });

      // Act
      logger.error(message, context, error);

      // Assert
      expect(reportSpy).toHaveBeenCalledWith(message, context, error);

      // Cleanup
      reportSpy.mockRestore();
      Object.defineProperty(logger as any, 'isDev', {
        get: () => true,
        configurable: true,
      });
    });

    it('NÃO deve chamar reportToCrashlytics em desenvolvimento', () => {
      // Arrange
      const message = 'Erro dev';
      const error = new Error('Erro dev');
      const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

      // isDev já é true por padrão no beforeEach

      // Act
      logger.error(message, 'DevContext', error);

      // Assert
      expect(reportSpy).not.toHaveBeenCalled();
      reportSpy.mockRestore();
    });

    it('NÃO deve chamar reportToCrashlytics quando erro não fornecido', () => {
      // Arrange
      const message = 'Erro sem objeto';
      const reportSpy = jest.spyOn(logger as any, 'reportToCrashlytics');

      // Mock isDev como false (produção)
      Object.defineProperty(logger as any, 'isDev', {
        get: () => false,
        configurable: true,
      });

      // Act
      logger.error(message, 'NoError');

      // Assert
      expect(reportSpy).not.toHaveBeenCalled();

      // Cleanup
      reportSpy.mockRestore();
      Object.defineProperty(logger as any, 'isDev', {
        get: () => true,
        configurable: true,
      });
    });
  });
});
