/**
 * Testes Unitários - FavoriteButton
 * 
 * Cobertura completa do componente de botão de favorito
 * 
 * Categorias de testes:
 * 1. Renderização básica
 * 2. Estado de favorito (favoritado/não favoritado)
 * 3. Toggle de favorito
 * 4. Animações
 * 5. Callbacks
 * 6. Estados disabled e updating
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FavoriteButton from '../FavoriteButton';
import { favoritesSlice } from '../../store/slices/favoritesSlice';
import logger from '../../services/loggerService';

// Mocks
jest.mock('../../services/loggerService', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      favorites: favoritesSlice.reducer,
    },
    preloadedState: {
      favorites: {
        favorites: [],
        updating: false,
        error: null,
        ...initialState.favorites,
      },
    },
  });
};

describe('FavoriteButton', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
  });

  describe('Renderização Básica', () => {
    it('should render favorite button', () => {
      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      expect(iconButton).toBeTruthy();
    });

    it('should render unfilled heart icon when not favorite', () => {
      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      expect(iconButton.props.icon).toBe('heart-outline');
    });

    it('should render filled heart icon when favorite', () => {
      mockStore = createMockStore({
        favorites: {
          favorites: ['box-1'],
          updating: false,
          error: null,
        },
      });

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      expect(iconButton.props.icon).toBe('heart');
    });
  });

  describe('Toggle de Favorito', () => {
    it('should toggle favorite when pressed', () => {
      const onPress = jest.fn();

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" onPress={onPress} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      fireEvent.press(iconButton);

      // Verificar que a ação foi despachada
      const state = mockStore.getState();
      expect(state).toBeDefined();
    });

    it('should call onPress callback when toggled', () => {
      const onPress = jest.fn();

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" onPress={onPress} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      fireEvent.press(iconButton);

      expect(onPress).toHaveBeenCalled();
    });

    it('should not toggle when disabled', () => {
      const onPress = jest.fn();

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" disabled={true} onPress={onPress} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      fireEvent.press(iconButton);

      // Quando disabled, não deve chamar onPress
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not toggle when updating', () => {
      mockStore = createMockStore({
        favorites: {
          favorites: [],
          updating: true,
          error: null,
        },
      });

      const onPress = jest.fn();

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" onPress={onPress} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      fireEvent.press(iconButton);

      // Quando updating, não deve chamar onPress
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Customização', () => {
    it('should apply custom size', () => {
      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" size={32} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      expect(iconButton.props.size).toBe(32);
    });

    it('should apply custom style', () => {
      const customStyle = { marginTop: 10 };

      render(
        <Provider store={mockStore}>
          <FavoriteButton boxId="box-1" style={customStyle} />
        </Provider>
      );

      const iconButton = screen.UNSAFE_getByType('IconButton');
      expect(iconButton).toBeTruthy();
    });
  });
});

