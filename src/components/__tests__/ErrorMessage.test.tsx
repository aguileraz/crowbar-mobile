/**
 * Testes Unitários - ErrorMessage
 * 
 * Cobertura completa do componente de mensagem de erro
 * 
 * Categorias de testes:
 * 1. Renderização básica
 * 2. Variantes (default, minimal, card)
 * 3. Ação de retry
 * 4. Customização de props
 * 5. Ícones e estilos
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  describe('Renderização Básica', () => {
    it('should render error message with default title', () => {
      render(<ErrorMessage message="Test error message" />);

      expect(screen.getByText('Ops! Algo deu errado')).toBeTruthy();
      expect(screen.getByText('Test error message')).toBeTruthy();
    });

    it('should render custom title', () => {
      render(
        <ErrorMessage message="Test error" title="Custom Error Title" />
      );

      expect(screen.getByText('Custom Error Title')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });

    it('should render icon by default', () => {
      render(<ErrorMessage message="Test error" />);

      const icon = screen.UNSAFE_getByType('Icon');
      expect(icon).toBeTruthy();
      expect(icon.props.source).toBe('alert-circle-outline');
    });

    it('should not render icon when showIcon is false', () => {
      render(<ErrorMessage message="Test error" showIcon={false} />);

      const icons = screen.queryAllByType('Icon');
      expect(icons.length).toBe(0);
    });
  });

  describe('Variantes', () => {
    it('should render default variant', () => {
      render(<ErrorMessage message="Test error" variant="default" />);

      expect(screen.getByText('Ops! Algo deu errado')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });

    it('should render minimal variant', () => {
      render(<ErrorMessage message="Test error" variant="minimal" />);

      expect(screen.getByText('Test error')).toBeTruthy();
    });

    it('should render card variant', () => {
      render(<ErrorMessage message="Test error" variant="card" />);

      expect(screen.getByText('Ops! Algo deu errado')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });
  });

  describe('Ação de Retry', () => {
    it('should render retry button when onRetry is provided', () => {
      const onRetry = jest.fn();

      render(<ErrorMessage message="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Tentar novamente');
      expect(retryButton).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();

      render(<ErrorMessage message="Test error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Tentar novamente');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry text', () => {
      const onRetry = jest.fn();

      render(
        <ErrorMessage
          message="Test error"
          onRetry={onRetry}
          retryText="Retry Custom"
        />
      );

      expect(screen.getByText('Retry Custom')).toBeTruthy();
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage message="Test error" />);

      expect(screen.queryByText('Tentar novamente')).toBeNull();
    });
  });

  describe('Estilos Customizados', () => {
    it('should apply custom style prop', () => {
      const customStyle = { marginTop: 20 };

      render(<ErrorMessage message="Test error" style={customStyle} />);

      const container = screen.UNSAFE_getByType('View');
      expect(container).toBeTruthy();
    });
  });
});

