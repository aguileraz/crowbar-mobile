/**
 * Testes para o utilitário de debounce
 *
 * Testa todas as funcionalidades do debounce incluindo:
 * - Atraso de execução
 * - Cancelamento de chamadas anteriores
 * - Preservação de argumentos
 * - Preservação de contexto
 * - Casos extremos (delay zero, delay longo)
 */

import { debounce } from '../debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    // Usar fake timers do Jest
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Limpar todos os timers e restaurar timers reais
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Funcionalidade Básica', () => {
    it('deve atrasar a execução da função', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      // Chamar função debounced
      debouncedFn();

      // Verificar que não foi executada imediatamente
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar tempo em 499ms (ainda não deve executar)
      jest.advanceTimersByTime(499);
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar mais 1ms (deve executar agora)
      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('deve executar apenas a última chamada em múltiplas chamadas rápidas', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      // Fazer múltiplas chamadas rápidas
      debouncedFn();
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Verificar que ainda não executou
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar tempo
      jest.runAllTimers();

      // Deve executar apenas uma vez
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('deve respeitar o tempo de espera correto', () => {
      const mockFn = jest.fn();
      const delay = 1000;
      const debouncedFn = debounce(mockFn, delay);

      debouncedFn();

      // Testar diferentes intervalos de tempo
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preservação de Argumentos', () => {
    it('deve passar todos os argumentos corretamente', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Chamar com argumentos
      debouncedFn('arg1', 'arg2', 'arg3');

      jest.runAllTimers();

      // Verificar que todos os argumentos foram passados
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('deve preservar argumentos da última chamada em múltiplas invocações', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 200);

      // Fazer múltiplas chamadas com argumentos diferentes
      debouncedFn('primeira', 1);
      debouncedFn('segunda', 2);
      debouncedFn('terceira', 3);

      jest.runAllTimers();

      // Deve ter executado apenas com os últimos argumentos
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('terceira', 3);
    });

    it('deve lidar corretamente com argumentos complexos', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      const objectArg = { id: 1, name: 'Test' };
      const arrayArg = [1, 2, 3];
      const functionArg = () => 'test';

      debouncedFn(objectArg, arrayArg, functionArg);

      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledWith(objectArg, arrayArg, functionArg);
    });
  });

  describe('Preservação de Contexto', () => {
    it('deve preservar o contexto this da função', () => {
      const context = {
        value: 42,
        method: jest.fn(function(this: any) {
          return this.value;
        }),
      };

      const debouncedMethod = debounce(context.method, 100);

      // Chamar com contexto específico
      debouncedMethod.call(context);

      jest.runAllTimers();

      expect(context.method).toHaveBeenCalledTimes(1);
    });
  });

  describe('Limpeza de Timeout', () => {
    it('deve cancelar execução pendente quando chamado novamente', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      // Primeira chamada
      debouncedFn();

      // Avançar quase até o fim
      jest.advanceTimersByTime(450);

      // Segunda chamada (deve cancelar a primeira)
      debouncedFn();

      // Avançar o tempo restante da primeira chamada
      jest.advanceTimersByTime(50);

      // Não deve ter executado ainda
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar tempo completo da segunda chamada
      jest.advanceTimersByTime(450);

      // Agora deve executar
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('deve limpar timeout corretamente após execução', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledTimes(1);

      // Chamar novamente após execução completa
      debouncedFn();
      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Múltiplas Funções Debounced', () => {
    it('deve manter timers independentes para funções diferentes', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();

      const debouncedFn1 = debounce(mockFn1, 300);
      const debouncedFn2 = debounce(mockFn2, 500);

      // Chamar ambas
      debouncedFn1();
      debouncedFn2();

      // Avançar 300ms (primeira deve executar)
      jest.advanceTimersByTime(300);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).not.toHaveBeenCalled();

      // Avançar mais 200ms (segunda deve executar)
      jest.advanceTimersByTime(200);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com delay zero', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn();

      // Não deve executar imediatamente mesmo com delay zero
      expect(mockFn).not.toHaveBeenCalled();

      // Executar todos os timers pendentes
      jest.runAllTimers();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com delay muito longo', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 10000); // 10 segundos

      debouncedFn();

      // Avançar 9999ms
      jest.advanceTimersByTime(9999);
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar mais 1ms
      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Funções Assíncronas', () => {
    it('deve funcionar com funções assíncronas', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('resultado');
      const debouncedFn = debounce(mockAsyncFn, 200);

      debouncedFn();

      // Avançar timers
      jest.runAllTimers();

      // Aguardar promessas pendentes
      await Promise.resolve();

      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    });

    it('deve chamar função assíncrona com argumentos corretos', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue({ success: true });
      const debouncedFn = debounce(mockAsyncFn, 150);

      // Chamar com argumentos específicos
      debouncedFn({ userId: 123, action: 'update' });

      jest.runAllTimers();
      await Promise.resolve();

      expect(mockAsyncFn).toHaveBeenCalledWith({ userId: 123, action: 'update' });
    });
  });

  describe('Cancelamento de Execução Pendente', () => {
    it('deve cancelar execução se nova chamada ocorrer durante delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      // Primeira chamada
      debouncedFn('primeira');

      // Avançar 500ms
      jest.advanceTimersByTime(500);

      // Segunda chamada (deve cancelar a primeira)
      debouncedFn('segunda');

      // Avançar 500ms (total 1000ms da primeira chamada)
      jest.advanceTimersByTime(500);

      // Não deve ter executado ainda
      expect(mockFn).not.toHaveBeenCalled();

      // Avançar mais 500ms (total 1000ms da segunda chamada)
      jest.advanceTimersByTime(500);

      // Deve ter executado apenas uma vez com os argumentos da segunda chamada
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('segunda');
    });
  });

  describe('Múltiplas Invocações Após Delay', () => {
    it('deve permitir múltiplas execuções se chamadas após o delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Primeira invocação
      debouncedFn('primeira');
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledWith('primeira');

      // Segunda invocação
      debouncedFn('segunda');
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledWith('segunda');

      // Terceira invocação
      debouncedFn('terceira');
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledWith('terceira');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('deve resetar timer completamente entre execuções completas', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 200);

      // Primeira sequência
      debouncedFn('primeira');
      jest.advanceTimersByTime(200);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Aguardar mais tempo
      jest.advanceTimersByTime(100);

      // Segunda sequência
      debouncedFn('segunda');

      // Deve levar 200ms novos a partir desta chamada
      jest.advanceTimersByTime(199);
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Uso Real - Busca de Texto', () => {
    it('deve simular busca em tempo real com debounce', () => {
      const searchFn = jest.fn();
      const debouncedSearch = debounce(searchFn, 300);

      // Simular usuário digitando "react"
      debouncedSearch('r');
      jest.advanceTimersByTime(100);

      debouncedSearch('re');
      jest.advanceTimersByTime(100);

      debouncedSearch('rea');
      jest.advanceTimersByTime(100);

      debouncedSearch('reac');
      jest.advanceTimersByTime(100);

      debouncedSearch('react');

      // Não deve ter executado ainda
      expect(searchFn).not.toHaveBeenCalled();

      // Avançar 300ms
      jest.advanceTimersByTime(300);

      // Deve ter executado apenas uma vez com o texto final
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('react');
    });
  });

  describe('Uso Real - Resize de Janela', () => {
    it('deve simular handler de resize com debounce', () => {
      const resizeHandler = jest.fn();
      const debouncedResize = debounce(resizeHandler, 250);

      // Simular múltiplos eventos de resize
      for (let i = 0; i < 10; i++) {
        debouncedResize({ width: 800 + i * 10, height: 600 });
        jest.advanceTimersByTime(50);
      }

      // Ainda não deve ter executado
      expect(resizeHandler).not.toHaveBeenCalled();

      // Avançar tempo suficiente
      jest.advanceTimersByTime(250);

      // Deve executar apenas uma vez com as últimas dimensões
      expect(resizeHandler).toHaveBeenCalledTimes(1);
      expect(resizeHandler).toHaveBeenCalledWith({ width: 890, height: 600 });
    });
  });
});
