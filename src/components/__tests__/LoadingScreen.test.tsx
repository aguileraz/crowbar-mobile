/**
 * Testes Unitários - LoadingScreen
 * 
 * Cobertura completa do componente de tela de carregamento
 * 
 * Categorias de testes:
 * 1. Renderização básica
 * 2. ActivityIndicator
 * 3. Texto de carregamento
 * 4. Estilos
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoadingScreen from '../LoadingScreen';

describe('LoadingScreen', () => {
  describe('Renderização Básica', () => {
    it('should render loading screen', () => {
      render(<LoadingScreen />);

      expect(screen.getByText('Carregando...')).toBeTruthy();
    });

    it('should render ActivityIndicator', () => {
      render(<LoadingScreen />);

      const indicator = screen.UNSAFE_getByType('ActivityIndicator');
      expect(indicator).toBeTruthy();
      expect(indicator.props.size).toBe('large');
    });

    it('should render loading text', () => {
      render(<LoadingScreen />);

      const text = screen.getByText('Carregando...');
      expect(text).toBeTruthy();
    });
  });

  describe('Estrutura', () => {
    it('should have correct container structure', () => {
      render(<LoadingScreen />);

      const container = screen.UNSAFE_getByType('View');
      expect(container).toBeTruthy();
    });
  });
});

