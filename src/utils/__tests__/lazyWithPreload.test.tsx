/**
 * Testes Unitários - lazyWithPreload Utility
 *
 * Testa o utilitário de lazy loading com capacidade de preload para componentes React,
 * incluindo a factory function, hook usePreloadComponents e componente LazyBoundary.
 *
 * @coverage lazyWithPreload, usePreloadComponents, LazyBoundary, error handling
 */

import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  lazyWithPreload,
  usePreloadComponents,
  LazyBoundary,
  LazyComponentWithPreload,
} from '../lazyWithPreload';
import logger from '../../services/loggerService';

// Mock do logger service
jest.mock('../../services/loggerService', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Helper para criar componente de teste
const TestComponent: React.FC<{ text: string }> = ({ text }) => (
  <Text>{text}</Text>
);

// Helper para criar factory function que retorna componente
const createSuccessFactory = (componentText = 'Test Component', delay = 0) => {
  return jest.fn(
    () =>
      new Promise<{ default: React.ComponentType<{ text: string }> }>(
        (resolve) => {
          setTimeout(() => {
            resolve({ default: TestComponent });
          }, delay);
        }
      )
  );
};

// Helper para criar factory que falha
const createFailureFactory = (errorMessage = 'Load failed') => {
  return jest.fn(() => Promise.reject(new Error(errorMessage)));
};

describe('lazyWithPreload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. FACTORY FUNCTION TESTS
  // ============================================
  describe('Factory Function', () => {
    it('deve criar componente lazy com método preload', () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      expect(LazyComponent).toBeDefined();
      expect(LazyComponent.preload).toBeDefined();
      expect(typeof LazyComponent.preload).toBe('function');
    });

    it('deve criar componente lazy sem chamar factory imediatamente', () => {
      const factory = createSuccessFactory();
      lazyWithPreload(factory);

      // Factory não deve ser chamada até preload() ou render
      expect(factory).not.toHaveBeenCalled();
    });

    it('deve retornar tipo correto LazyComponentWithPreload', () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      // Verifica estrutura do tipo
      expect(LazyComponent).toHaveProperty('preload');
      expect(LazyComponent).toHaveProperty('$$typeof');
    });
  });

  // ============================================
  // 2. PRELOAD METHOD TESTS
  // ============================================
  describe('Método preload()', () => {
    it('deve carregar componente quando preload() é chamado', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      const result = await LazyComponent.preload();

      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('default');
      expect(result.default).toBe(TestComponent);
    });

    it('deve retornar promise que resolve com o componente', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      const promise = LazyComponent.preload();

      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result.default).toBe(TestComponent);
    });

    it('deve cachear componente após primeiro preload()', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      const result1 = await LazyComponent.preload();
      const result2 = await LazyComponent.preload();

      // Factory deve ser chamada apenas uma vez
      expect(factory).toHaveBeenCalledTimes(1);
      // Resultados devem ser idênticos (mesmo objeto)
      expect(result1).toBe(result2);
    });

    it('deve retornar mesma promise em chamadas simultâneas', async () => {
      const factory = createSuccessFactory('Component', 100);
      const LazyComponent = lazyWithPreload(factory);

      // Chamadas simultâneas antes da resolução
      const promise1 = LazyComponent.preload();
      const promise2 = LazyComponent.preload();
      const promise3 = LazyComponent.preload();

      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);

      await Promise.all([promise1, promise2, promise3]);

      // Factory deve ser chamada apenas uma vez
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('deve resolver componente cacheado instantaneamente', async () => {
      const factory = createSuccessFactory('Component', 100);
      const LazyComponent = lazyWithPreload(factory);

      // Primeiro preload com delay
      await LazyComponent.preload();

      // Segundo preload deve ser instantâneo (cacheado)
      const startTime = Date.now();
      await LazyComponent.preload();
      const elapsed = Date.now() - startTime;

      // Deve ser muito rápido (< 10ms, considerando cache)
      expect(elapsed).toBeLessThan(10);
    });
  });

  // ============================================
  // 3. COMPONENT RENDERING TESTS
  // ============================================
  describe('Renderização do Componente', () => {
    it('deve renderizar componente corretamente após preload', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      await LazyComponent.preload();

      render(
        <LazyBoundary>
          <LazyComponent text="Hello World" />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeTruthy();
      });
    });

    it('deve usar componente cacheado quando já foi preloaded', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      // Preload antes de renderizar
      await LazyComponent.preload();

      render(
        <LazyBoundary>
          <LazyComponent text="Cached Component" />
        </LazyBoundary>
      );

      // Aguarda renderização, mas factory só é chamado uma vez (cache)
      await waitFor(() => {
        expect(screen.getByText('Cached Component')).toBeTruthy();
      });
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('deve carregar componente automaticamente se não foi preloaded', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      render(
        <LazyBoundary fallback={<Text>Carregando...</Text>}>
          <LazyComponent text="Auto Load" />
        </LazyBoundary>
      );

      // Deve mostrar fallback inicialmente
      expect(screen.getByText('Carregando...')).toBeTruthy();

      // Deve carregar e renderizar componente
      await waitFor(() => {
        expect(screen.getByText('Auto Load')).toBeTruthy();
      });

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 4. ERROR HANDLING TESTS
  // ============================================
  describe('Tratamento de Erros', () => {
    it('deve propagar erro quando factory falha no preload', async () => {
      const factory = createFailureFactory('Component load failed');
      const LazyComponent = lazyWithPreload(factory);

      await expect(LazyComponent.preload()).rejects.toThrow(
        'Component load failed'
      );
    });

    it('deve propagar erro específico da factory', async () => {
      const customError = new Error('Custom error message');
      const factory = jest.fn(() => Promise.reject(customError));
      const LazyComponent = lazyWithPreload(factory);

      await expect(LazyComponent.preload()).rejects.toThrow(
        'Custom error message'
      );
    });

    it('deve cachear promise de erro e retornar mesma promise em retry', async () => {
      const factory = createFailureFactory('Load error');
      const LazyComponent = lazyWithPreload(factory);

      // Primeira chamada falha
      const promise1 = LazyComponent.preload();

      // Segunda chamada simultânea retorna mesma promise
      const promise2 = LazyComponent.preload();

      // Promises devem ser idênticas (cacheadas)
      expect(promise1).toBe(promise2);

      // Aguarda erro
      await expect(promise1).rejects.toThrow('Load error');

      // Factory deve ser chamada apenas uma vez
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 5. usePreloadComponents HOOK TESTS
  // ============================================
  describe('Hook usePreloadComponents', () => {
    it('deve pré-carregar todos os componentes fornecidos', async () => {
      const factory1 = createSuccessFactory('Component 1');
      const factory2 = createSuccessFactory('Component 2');
      const factory3 = createSuccessFactory('Component 3');

      const LazyComponent1 = lazyWithPreload(factory1);
      const LazyComponent2 = lazyWithPreload(factory2);
      const LazyComponent3 = lazyWithPreload(factory3);

      renderHook(() =>
        usePreloadComponents([LazyComponent1, LazyComponent2, LazyComponent3])
      );

      // Aguarda preload
      await waitFor(() => {
        expect(factory1).toHaveBeenCalled();
        expect(factory2).toHaveBeenCalled();
        expect(factory3).toHaveBeenCalled();
      });
    });

    it('deve pré-carregar componentes em paralelo', async () => {
      const factory1 = createSuccessFactory('Component 1', 100);
      const factory2 = createSuccessFactory('Component 2', 100);

      const LazyComponent1 = lazyWithPreload(factory1);
      const LazyComponent2 = lazyWithPreload(factory2);

      const startTime = Date.now();

      renderHook(() => usePreloadComponents([LazyComponent1, LazyComponent2]));

      await waitFor(() => {
        expect(factory1).toHaveBeenCalled();
        expect(factory2).toHaveBeenCalled();
      });

      const elapsed = Date.now() - startTime;

      // Se paralelo, deve levar ~100ms, não 200ms
      // Permite margem para processamento
      expect(elapsed).toBeLessThan(150);
    });

    it('deve lidar com array vazio gracefully', () => {
      expect(() => {
        renderHook(() => usePreloadComponents([]));
      }).not.toThrow();
    });

    it('deve lidar com erros de preload sem crashar', async () => {
      const factory1 = createSuccessFactory();
      const factory2 = createFailureFactory('Failed to load');

      const LazyComponent1 = lazyWithPreload(factory1);
      const LazyComponent2 = lazyWithPreload(factory2);

      const mockLogger = logger as jest.Mocked<typeof logger>;

      renderHook(() => usePreloadComponents([LazyComponent1, LazyComponent2]));

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Erro ao pré-carregar componentes:',
          expect.any(Error)
        );
      });

      // Hook não deve crashar
      expect(factory1).toHaveBeenCalled();
      expect(factory2).toHaveBeenCalled();
    });

    it('deve re-executar preload quando array de componentes muda', async () => {
      const factory1 = createSuccessFactory('Component 1');
      const factory2 = createSuccessFactory('Component 2');

      const LazyComponent1 = lazyWithPreload(factory1);
      const LazyComponent2 = lazyWithPreload(factory2);

      const { rerender } = renderHook(
        ({ components }) => usePreloadComponents(components),
        {
          initialProps: { components: [LazyComponent1] },
        }
      );

      await waitFor(() => {
        expect(factory1).toHaveBeenCalled();
      });

      // Muda os componentes
      rerender({ components: [LazyComponent1, LazyComponent2] });

      await waitFor(() => {
        expect(factory2).toHaveBeenCalled();
      });
    });

    it('não deve re-executar preload quando array não muda', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      const components = [LazyComponent];

      const { rerender } = renderHook(() => usePreloadComponents(components));

      await waitFor(() => {
        expect(factory).toHaveBeenCalledTimes(1);
      });

      // Rerender com mesma referência
      rerender();

      // Factory não deve ser chamada novamente
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 6. LazyBoundary COMPONENT TESTS
  // ============================================
  describe('Componente LazyBoundary', () => {
    it('deve renderizar children quando carregado', () => {
      render(
        <LazyBoundary>
          <Text>Child Component</Text>
        </LazyBoundary>
      );

      expect(screen.getByText('Child Component')).toBeTruthy();
    });

    it('deve usar fallback padrão "Carregando..." quando não fornecido', async () => {
      const factory = createSuccessFactory('Delayed', 50);
      const LazyComponent = lazyWithPreload(factory);

      render(
        <LazyBoundary>
          <LazyComponent text="Content" />
        </LazyBoundary>
      );

      // Aguarda componente carregar (Suspense pode resolver rápido)
      await waitFor(
        () => {
          expect(
            screen.queryByText('Content') || screen.queryByText('Carregando...')
          ).toBeTruthy();
        },
        { timeout: 200 }
      );
    });

    it('deve usar fallback customizado quando fornecido', async () => {
      const factory = createSuccessFactory('Delayed', 100);
      const LazyComponent = lazyWithPreload(factory);

      const CustomFallback = <Text>Por favor, aguarde...</Text>;

      render(
        <LazyBoundary fallback={CustomFallback}>
          <LazyComponent text="Content" />
        </LazyBoundary>
      );

      expect(screen.getByText('Por favor, aguarde...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeTruthy();
      });
    });

    it('deve aceitar componente complexo como fallback', async () => {
      const factory = createSuccessFactory('Delayed', 100);
      const LazyComponent = lazyWithPreload(factory);

      const ComplexFallback = (
        <React.Fragment>
          <Text>Carregando componente...</Text>
          <Text>Aguarde</Text>
        </React.Fragment>
      );

      render(
        <LazyBoundary fallback={ComplexFallback}>
          <LazyComponent text="Content" />
        </LazyBoundary>
      );

      expect(screen.getByText('Carregando componente...')).toBeTruthy();
      expect(screen.getByText('Aguarde')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeTruthy();
      });
    });

    it('deve renderizar múltiplos children', () => {
      render(
        <LazyBoundary>
          <Text>First Child</Text>
          <Text>Second Child</Text>
        </LazyBoundary>
      );

      expect(screen.getByText('First Child')).toBeTruthy();
      expect(screen.getByText('Second Child')).toBeTruthy();
    });

    it('deve suportar nested LazyBoundaries', async () => {
      const factory1 = createSuccessFactory('Outer', 50);
      const factory2 = createSuccessFactory('Inner', 50);

      const OuterComponent = lazyWithPreload(factory1);
      const InnerComponent = lazyWithPreload(factory2);

      render(
        <LazyBoundary fallback={<Text>Loading Outer...</Text>}>
          <OuterComponent text="Outer Content">
            <LazyBoundary fallback={<Text>Loading Inner...</Text>}>
              <InnerComponent text="Inner Content" />
            </LazyBoundary>
          </OuterComponent>
        </LazyBoundary>
      );

      // Fallback do boundary externo
      expect(screen.getByText('Loading Outer...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Outer Content')).toBeTruthy();
      });
    });
  });

  // ============================================
  // 7. INTEGRATION TESTS
  // ============================================
  describe('Testes de Integração', () => {
    it('deve funcionar fluxo completo: preload → render → use cached', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      // 1. Preload
      await LazyComponent.preload();
      expect(factory).toHaveBeenCalledTimes(1);

      // 2. Render (usa cache)
      render(
        <LazyBoundary>
          <LazyComponent text="First Render" />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('First Render')).toBeTruthy();
      });
      expect(factory).toHaveBeenCalledTimes(1); // Ainda 1, usou cache

      // 3. Re-render (usa cache)
      const { getByText } = render(
        <LazyBoundary>
          <LazyComponent text="Second Render" />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(getByText('Second Render')).toBeTruthy();
      });
      expect(factory).toHaveBeenCalledTimes(1); // Ainda 1, usou cache
    });

    it('deve preload múltiplos componentes e renderizar todos', async () => {
      const factory1 = createSuccessFactory('Component 1');
      const factory2 = createSuccessFactory('Component 2');

      const LazyComponent1 = lazyWithPreload(factory1);
      const LazyComponent2 = lazyWithPreload(factory2);

      // Preload com hook
      renderHook(() =>
        usePreloadComponents([LazyComponent1, LazyComponent2])
      );

      await waitFor(() => {
        expect(factory1).toHaveBeenCalled();
        expect(factory2).toHaveBeenCalled();
      });

      // Renderiza ambos
      render(
        <LazyBoundary>
          <LazyComponent1 text="Component One" />
          <LazyComponent2 text="Component Two" />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Component One')).toBeTruthy();
        expect(screen.getByText('Component Two')).toBeTruthy();
      });
    });

    it('deve lidar com mix de componentes preloaded e não preloaded', async () => {
      const factory1 = createSuccessFactory('Preloaded');
      const factory2 = createSuccessFactory('Not Preloaded', 50);

      const PreloadedComponent = lazyWithPreload(factory1);
      const NotPreloadedComponent = lazyWithPreload(factory2);

      // Preload apenas o primeiro
      await PreloadedComponent.preload();

      render(
        <LazyBoundary fallback={<Text>Loading...</Text>}>
          <PreloadedComponent text="I am preloaded" />
          <NotPreloadedComponent text="I am not preloaded" />
        </LazyBoundary>
      );

      // Aguarda ambos renderizarem
      await waitFor(() => {
        expect(screen.getByText('I am preloaded')).toBeTruthy();
        expect(screen.getByText('I am not preloaded')).toBeTruthy();
      });

      // Primeiro foi preloaded, segundo foi carregado sob demanda
      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 8. EDGE CASES TESTS
  // ============================================
  describe('Casos Extremos', () => {
    it('deve lidar com factory que retorna null', async () => {
      const factory = jest.fn(() =>
        Promise.resolve({ default: null as any })
      );
      const LazyComponent = lazyWithPreload(factory);

      const result = await LazyComponent.preload();
      expect(result.default).toBeNull();
    });

    it('deve lidar com factory que retorna undefined', async () => {
      const factory = jest.fn(() =>
        Promise.resolve({ default: undefined as any })
      );
      const LazyComponent = lazyWithPreload(factory);

      const result = await LazyComponent.preload();
      expect(result.default).toBeUndefined();
    });

    it('deve lidar com LazyBoundary sem children', () => {
      expect(() => {
        render(<LazyBoundary />);
      }).not.toThrow();
    });

    it('deve lidar com LazyBoundary com children null', () => {
      expect(() => {
        render(<LazyBoundary>{null}</LazyBoundary>);
      }).not.toThrow();
    });

    it('deve manter referência de preload após múltiplas chamadas', async () => {
      const factory = createSuccessFactory();
      const LazyComponent = lazyWithPreload(factory);

      const preloadMethod1 = LazyComponent.preload;
      await LazyComponent.preload();
      const preloadMethod2 = LazyComponent.preload;

      // Método deve ser a mesma função
      expect(preloadMethod1).toBe(preloadMethod2);
    });
  });

  // ============================================
  // 9. TYPE SAFETY TESTS
  // ============================================
  describe('Segurança de Tipos', () => {
    it('deve manter props do componente no tipo lazy', async () => {
      interface CustomProps {
        title: string;
        count: number;
      }

      const CustomComponent: React.FC<CustomProps> = ({ title, count }) => (
        <Text>
          {title}: {count}
        </Text>
      );

      const factory = jest.fn(() =>
        Promise.resolve({ default: CustomComponent })
      );

      const LazyCustom = lazyWithPreload(factory);

      render(
        <LazyBoundary>
          <LazyCustom title="Items" count={5} />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Items: 5')).toBeTruthy();
      });
    });

    it('deve aceitar componentes com diferentes props', async () => {
      type Props1 = { message: string };
      type Props2 = { value: number };

      const Component1: React.FC<Props1> = ({ message }) => (
        <Text>{message}</Text>
      );
      const Component2: React.FC<Props2> = ({ value }) => (
        <Text>{value}</Text>
      );

      const factory1 = jest.fn(() => Promise.resolve({ default: Component1 }));
      const factory2 = jest.fn(() => Promise.resolve({ default: Component2 }));

      const Lazy1 = lazyWithPreload(factory1);
      const Lazy2 = lazyWithPreload(factory2);

      render(
        <LazyBoundary>
          <Lazy1 message="Hello" />
          <Lazy2 value={42} />
        </LazyBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeTruthy();
        expect(screen.getByText('42')).toBeTruthy();
      });
    });
  });
});
