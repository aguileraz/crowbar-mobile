/**
import logger from "../services/loggerService";
 * Logger Service para Crowbar Mobile
 * Centraliza todos os logs da aplicação com níveis e controle de ambiente
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  extra?: any;
}

class LoggerService {
  private isDev = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: string, extra?: any) {
    if (this.isDev) {
      // logger.debug(`[DEBUG] ${context ? `[${context}]` : ''} ${message}`, extra || '');
    }
    this.addLog('debug', message, context, extra);
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, extra?: any) {
    if (this.isDev) {
      // logger.info(`[INFO] ${context ? `[${context}]` : ''} ${message}`, extra || '');
    }
    this.addLog('info', message, context, extra);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: string, extra?: any) {
    if (this.isDev) {
      // logger.warn(`[WARN] ${context ? `[${context}]` : ''} ${message}`, extra || '');
    }
    this.addLog('warn', message, context, extra);
  }

  /**
   * Log de erro - sempre mostrado
   */
  error(message: string, context?: string, error?: any) {
    // logger.error(`[ERROR] ${context ? `[${context}]` : ''} ${message}`, error || '');
    this.addLog('error', message, context, error);
    
    // Em produção, enviar erros para serviço de monitoramento
    if (!this.isDev && error) {
      this.reportToCrashlytics(message, context, error);
    }
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number) {
    if (this.isDev && duration > 100) {
      // logger.warn(`[PERF] ${operation} took ${duration}ms`);
    }
    this.addLog('info', `Performance: ${operation}`, 'PERF', { duration });
  }

  /**
   * Log de API
   */
  api(method: string, url: string, status?: number, duration?: number) {
    if (this.isDev) {
      const statusEmoji = status ? (status < 400 ? '✅' : '❌') : '🔄';
      // logger.debug(`[API] ${statusEmoji} ${method} ${url} ${status || ''} ${duration ? `(${duration}ms)` : ''}`);
    }
    this.addLog('info', `${method} ${url}`, 'API', { status, duration });
  }

  /**
   * Log de navegação
   */
  navigation(from: string, to: string) {
    if (this.isDev) {
      // logger.debug(`[NAV] ${from} → ${to}`);
    }
    this.addLog('info', `Navigation: ${from} → ${to}`, 'NAV');
  }

  /**
   * Limpar logs antigos
   */
  private addLog(level: LogLevel, message: string, context?: string, extra?: any) {
    this.logs.push({
      level,
      message,
      timestamp: new Date(),
      context,
      extra,
    });

    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Obter logs para debug
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  /**
   * Limpar todos os logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Reportar erro para Crashlytics em produção
   */
  private reportToCrashlytics(message: string, context?: string, error?: any) {
    // TODO: Implementar integração com Firebase Crashlytics
    // import crashlytics from '@react-native-firebase/crashlytics';
    // crashlytics().recordError(error, message);
  }
}

// Singleton instance
const logger = new LoggerService();

export default logger;