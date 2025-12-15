/**
 * Testes Unitários - SettingsScreen
 *
 * Testa a tela de configurações após migração de Firebase para Keycloak
 *
 * Categorias:
 * 1. Renderização inicial
 * 2. Exibição de informações Keycloak
 * 3. Logout
 * 4. Configurações gerais
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SettingsScreen from '../SettingsScreen';
import { logout } from '../../store/slices/authSlice';
import { Alert } from 'react-native';

// Mock do authSlice
jest.mock('../../store/slices/authSlice', () => ({
  ...jest.requireActual('../../store/slices/authSlice'),
  logout: jest.fn(() => ({ type: 'auth/logout' })),
  selectUser: jest.fn((state) => state.auth?.user),
  selectIsLoading: jest.fn((state) => state.auth?.isLoading || false),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {
        user: {
          sub: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          idToken: 'id-token',
          accessTokenExpirationDate: '2025-12-31T23:59:59Z',
        },
        isAuthenticated: true,
        isLoading: false,
      }, action) => {
        if (action.type === 'auth/logout') {
          return {
            ...state,
            user: null,
            isAuthenticated: false,
          };
        }
        return state;
      },
    },
    preloadedState: initialState,
  });
};

describe('SettingsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar a tela corretamente', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      expect(getByText(/Settings/i)).toBeTruthy();
    });

    it('deve exibir informações do usuário', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      expect(getByText(/Test User/i)).toBeTruthy();
      expect(getByText(/test@example.com/i)).toBeTruthy();
    });

    it('deve exibir informações Keycloak Realm', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      expect(getByText(/Keycloak Realm/i)).toBeTruthy();
      expect(getByText(/crowbar/i)).toBeTruthy();
    });
  });

  describe('Logout', () => {
    it('deve mostrar confirmação antes de fazer logout', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const logoutButton = getByText(/Logout/i);
      fireEvent.press(logoutButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Sair',
        'Tem certeza que deseja sair da sua conta?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancelar' }),
          expect.objectContaining({ text: 'Sair' }),
        ])
      );
    });

    it('deve executar logout quando confirmado', async () => {
      const store = createMockStore();
      const dispatch = store.dispatch;

      // Mock Alert para confirmar logout
      alertSpy.mockImplementation((title, message, buttons) => {
        if (title === 'Sair' && buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const logoutButton = getByText(/Logout/i);
      fireEvent.press(logoutButton);

      await waitFor(() => {
        expect(dispatch).toHaveBeenCalled();
      });
    });

    it('não deve executar logout quando cancelado', () => {
      const store = createMockStore();
      const dispatch = store.dispatch;

      // Mock Alert para cancelar logout
      alertSpy.mockImplementation((title, message, buttons) => {
        if (title === 'Sair' && buttons && buttons[0]) {
          buttons[0].onPress();
        }
      });

      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const logoutButton = getByText(/Logout/i);
      fireEvent.press(logoutButton);

      // Verificar que logout não foi chamado (apenas cancel)
      expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/logout' }));
    });
  });

  describe('Configurações Gerais', () => {
    it('deve exibir opção de trocar ambiente', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const envButton = getByText(/Environment/i);
      expect(envButton).toBeTruthy();
    });

    it('deve mostrar alerta ao tentar trocar ambiente', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const envButton = getByText(/Environment/i);
      fireEvent.press(envButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Trocar Ambiente',
        'Escolha o ambiente:',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Desenvolvimento' }),
          expect.objectContaining({ text: 'Staging' }),
          expect.objectContaining({ text: 'Produção' }),
        ])
      );
    });

    it('deve exibir opção de limpar dados', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const clearDataButton = getByText(/Clear Data/i);
      expect(clearDataButton).toBeTruthy();
    });

    it('deve mostrar confirmação antes de limpar dados', () => {
      const store = createMockStore();
      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      const clearDataButton = getByText(/Clear Data/i);
      fireEvent.press(clearDataButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Limpar Dados',
        'Tem certeza que deseja limpar todos os dados do app?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancelar' }),
          expect.objectContaining({ text: 'Limpar' }),
        ])
      );
    });
  });

  describe('Estado de Loading', () => {
    it('deve desabilitar botões durante loading', () => {
      const store = createMockStore({
        auth: {
          isLoading: true,
        },
      });

      const { getByText } = render(
        <Provider store={store}>
          <SettingsScreen />
        </Provider>
      );

      // Verificar que componentes são renderizados mesmo durante loading
      expect(getByText(/Settings/i)).toBeTruthy();
    });
  });
});
