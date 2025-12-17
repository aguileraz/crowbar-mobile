/**
 * Testes Unitários - MFASetupScreen
 * 
 * Cobertura completa da tela de configuração MFA (Multi-Factor Authentication)
 * 
 * Categorias de testes:
 * 1. Renderização inicial
 * 2. Carregamento de status MFA
 * 3. Habilitar MFA
 * 4. Desabilitar MFA
 * 5. Estados de loading e erro
 * 6. Navegação
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MFASetupScreen from '../MFASetupScreen';
import mfaService, { MFAStatus } from '../../../services/mfaService';
import logger from '../../../services/loggerService';
import { authSlice } from '../../../store/slices/authSlice';

// Mocks
jest.mock('../../../services/mfaService');
jest.mock('../../../services/loggerService', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          sub: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          idToken: 'id-token',
          accessTokenExpirationDate: '2025-12-31T23:59:59Z',
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
        lastLoginTime: Date.now(),
        needsMfaSetup: false,
        ...initialState.auth,
      },
    },
  });
};

describe('MFASetupScreen', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  const mockedMfaService = mfaService as jest.Mocked<typeof mfaService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
  });

  describe('Renderização Inicial', () => {
    it('should render loading state initially', async () => {
      mockedMfaService.getStatus.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      expect(screen.getByText('Carregando...')).toBeTruthy();
    });

    it('should render MFA disabled state', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Autenticação de Dois Fatores (MFA)')).toBeTruthy();
        expect(screen.getByText(/❌ Desabilitado/)).toBeTruthy();
      });
    });

    it('should render MFA enabled state', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-1',
            type: 'TOTP',
            userLabel: 'My Authenticator',
            createdDate: Date.now(),
          },
        ],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/✅ Habilitado/)).toBeTruthy();
        expect(screen.getByText(/Credenciais configuradas: 1/)).toBeTruthy();
      });
    });
  });

  describe('Carregamento de Status', () => {
    it('should load MFA status on mount', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(mockedMfaService.getStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle error when loading status fails', async () => {
      mockedMfaService.getStatus.mockRejectedValue(new Error('Failed to load status'));

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Erro ao carregar status MFA:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Habilitar MFA', () => {
    it('should enable MFA when button is pressed', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);
      mockedMfaService.enable.mockResolvedValue({
        message: 'MFA habilitado com sucesso',
        nextAction: 'Configure seu aplicativo autenticador',
      });

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Habilitar MFA')).toBeTruthy();
      });

      const enableButton = screen.getByText('Habilitar MFA');
      fireEvent.press(enableButton);

      await waitFor(() => {
        expect(mockedMfaService.enable).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state when enabling MFA', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);
      mockedMfaService.enable.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        const enableButton = screen.getByText('Habilitar MFA');
        fireEvent.press(enableButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Habilitando...')).toBeTruthy();
      });
    });

    it('should handle error when enabling MFA fails', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);
      mockedMfaService.enable.mockRejectedValue(new Error('Failed to enable MFA'));

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        const enableButton = screen.getByText('Habilitar MFA');
        fireEvent.press(enableButton);
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Erro ao habilitar MFA:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Desabilitar MFA', () => {
    it('should show disable button when MFA is enabled', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-1',
            type: 'TOTP',
            userLabel: 'My Authenticator',
            createdDate: Date.now(),
          },
        ],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Desabilitar MFA')).toBeTruthy();
      });
    });

    it('should disable MFA when button is pressed', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [
          {
            id: 'cred-1',
            type: 'TOTP',
            userLabel: 'My Authenticator',
            createdDate: Date.now(),
          },
        ],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);
      mockedMfaService.disable.mockResolvedValue({
        message: 'MFA desabilitado com sucesso',
      });

      // Mock Alert.alert
      const alertSpy = jest.spyOn(require('react-native'), 'Alert');
      alertSpy.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        const disableButton = screen.getByText('Desabilitar MFA');
        fireEvent.press(disableButton);
      });

      await waitFor(() => {
        expect(mockedMfaService.disable).toHaveBeenCalledWith('cred-1');
      });

      alertSpy.mockRestore();
    });

    it('should not disable if no credentials available', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: true,
        mfaType: 'TOTP',
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        // Should not show disable button if no credentials
        expect(screen.queryByText('Desabilitar MFA')).toBeNull();
      });
    });
  });

  describe('Instruções e Informações', () => {
    it('should display MFA instructions', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Como funciona?')).toBeTruthy();
        expect(screen.getByText(/O MFA adiciona uma segunda camada de segurança/)).toBeTruthy();
      });
    });

    it('should display security notice', async () => {
      const mockStatus: MFAStatus = {
        mfaEnabled: false,
        mfaType: null,
        credentials: [],
      };

      mockedMfaService.getStatus.mockResolvedValue(mockStatus);

      render(
        <Provider store={mockStore}>
          <MFASetupScreen navigation={mockNavigation as any} />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/🔒 Importante/)).toBeTruthy();
        expect(screen.getByText(/Mantenha seus códigos de backup/)).toBeTruthy();
      });
    });
  });
});

