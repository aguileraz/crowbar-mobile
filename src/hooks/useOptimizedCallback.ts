/**
 * Hooks otimizados para melhor performance
 * Evitam re-renders desnecessários e melhoram a eficiência
 */

import { useCallback, useRef, useEffect, useMemo, DependencyList } from 'react';
import { InteractionManager } from 'react-native';

/**
 * useOptimizedCallback - versão otimizada do useCallback
 * Mantém referência estável mesmo com mudanças nas dependências
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Atualiza a referência do callback quando as dependências mudam
  if (!areDepsEqual(depsRef.current, deps)) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  // Retorna uma função estável que sempre chama a versão mais recente
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * useDebounce - debounce de valores
 * Útil para otimizar operações custosas como busca
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useThrottle - throttle de valores
 * Limita a frequência de atualizações
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * useAfterInteractions - executa callback após interações
 * Evita bloqueio da UI durante animações
 */
export function useAfterInteractions(callback: () => void, deps: DependencyList) {
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => {
      interaction.cancel();
    };
  }, deps);
}

/**
 * useLazyState - estado lazy que só atualiza quando necessário
 * Útil para estados que mudam frequentemente mas nem sempre precisam re-render
 */
export function useLazyState<T>(
  initialValue: T,
  shouldUpdate: (prev: T, next: T) => boolean = (a, b) => a !== b
): [T, (value: T) => void, () => void] {
  const [state, setState] = React.useState(initialValue);
  const pendingState = useRef(initialValue);

  const updateState = useCallback((value: T) => {
    pendingState.current = value;
    if (shouldUpdate(state, value)) {
      setState(value);
    }
  }, [state, shouldUpdate]);

  const forceUpdate = useCallback(() => {
    setState(pendingState.current);
  }, []);

  return [state, updateState, forceUpdate];
}

/**
 * useMemoizedObject - memoiza objetos mantendo referência estável
 * Evita re-renders causados por novos objetos com mesmo conteúdo
 */
export function useMemoizedObject<T extends object>(obj: T): T {
  const objRef = useRef<T>(obj);
  const keysRef = useRef<string[]>(Object.keys(obj));

  const hasChanged = useMemo(() => {
    const currentKeys = Object.keys(obj);
    
    // Verifica se as chaves mudaram
    if (currentKeys.length !== keysRef.current.length) {
      return true;
    }

    // Verifica se algum valor mudou
    for (const key of currentKeys) {
      if (objRef.current[key as keyof T] !== obj[key as keyof T]) {
        return true;
      }
    }

    return false;
  }, [obj]);

  if (hasChanged) {
    objRef.current = obj;
    keysRef.current = Object.keys(obj);
  }

  return objRef.current;
}

/**
 * useVisibleItems - rastreia itens visíveis em uma lista
 * Útil para lazy loading e otimização de renderização
 */
export function useVisibleItems<T>(
  items: T[],
  getItemKey: (item: T) => string,
  visibleRange: { start: number; end: number }
): Set<string> {
  return useMemo(() => {
    const visibleKeys = new Set<string>();
    
    for (let i = visibleRange.start; i <= visibleRange.end && i < items.length; i++) {
      visibleKeys.add(getItemKey(items[i]));
    }
    
    return visibleKeys;
  }, [items, getItemKey, visibleRange.start, visibleRange.end]);
}

/**
 * useAnimatedValue - valor otimizado para animações
 * Evita re-renders durante animações
 */
export function useAnimatedValue(initialValue: number) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  
  const setValue = useCallback((value: number) => {
    animatedValue.setValue(value);
  }, [animatedValue]);
  
  const animateTo = useCallback((value: number, config?: Animated.TimingAnimationConfig) => {
    return Animated.timing(animatedValue, {
      toValue: value,
      duration: 300,
      useNativeDriver: true,
      ...config,
    }).start();
  }, [animatedValue]);
  
  return { animatedValue, setValue, animateTo };
}

// Função auxiliar para comparar dependências
function areDepsEqual(deps1: DependencyList, deps2: DependencyList): boolean {
  if (deps1.length !== deps2.length) {
    return false;
  }
  
  for (let i = 0; i < deps1.length; i++) {
    if (!Object.is(deps1[i], deps2[i])) {
      return false;
    }
  }
  
  return true;
}

// Re-export do React para facilitar importação
export { useCallback, useMemo, useEffect } from 'react';

import React from 'react';
import { Animated } from 'react-native';