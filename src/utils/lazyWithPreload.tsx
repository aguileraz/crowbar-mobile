/**
 * Utilitário para lazy loading de componentes com suporte a preload
 * Permite carregar componentes sob demanda e pré-carregar quando necessário
 */

import React, { ComponentType, lazy, LazyExoticComponent } from 'react';
import logger from '../services/loggerService';

export interface LazyComponentWithPreload<T extends ComponentType<any>>
  extends LazyExoticComponent<T> {
  preload: () => Promise<{ default: T }>;
}

/**
 * Cria um componente lazy com capacidade de preload
 * @param factory Função que retorna a promise do componente
 * @returns Componente lazy com método preload
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyComponentWithPreload<T> {
  let loadedComponent: { default: T } | null = null;
  let loadPromise: Promise<{ default: T }> | null = null;

  // Função para pré-carregar o componente
  const preload = () => {
    if (loadedComponent) {
      return Promise.resolve(loadedComponent);
    }

    if (!loadPromise) {
      loadPromise = factory().then((component) => {
        loadedComponent = component;
        return component;
      });
    }

    return loadPromise;
  };

  // Cria o componente lazy
  const LazyComponent = lazy(() => {
    if (loadedComponent) {
      return Promise.resolve(loadedComponent);
    }
    return preload();
  }) as LazyComponentWithPreload<T>;

  // Adiciona o método preload ao componente
  LazyComponent.preload = preload;

  return LazyComponent;
}

/**
 * Hook para pré-carregar múltiplos componentes
 * Útil para pré-carregar componentes que serão usados em breve
 */
export function usePreloadComponents(
  components: LazyComponentWithPreload<any>[]
): void {
  React.useEffect(() => {
    // Pré-carrega todos os componentes em paralelo
    Promise.all(components.map((component) => component.preload())).catch(
      (error) => {
        logger.warn('Erro ao pré-carregar componentes:', error);
      }
    );
  }, [components]);
}

/**
 * Componente wrapper para exibir fallback enquanto carrega
 */
export const LazyBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <React.Fragment>
            Carregando...
          </React.Fragment>
        )
      }
    >
      {children}
    </React.Suspense>
  );
};