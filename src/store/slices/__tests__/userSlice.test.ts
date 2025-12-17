/**
 * Testes Unitários - userSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de usuário Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, perfil, endereços, métodos de pagamento, estatísticas, selectors
 */

import userReducer, {
  UserState,
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  fetchUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  fetchUserPaymentMethods,
  addUserPaymentMethod,
  deleteUserPaymentMethod,
  fetchUserStatistics,
  clearError,
  resetUser,
  selectUserProfile,
  selectUserAddresses,
  selectUserPaymentMethods,
  selectUserStatistics,
  selectUserIsLoading,
  selectUserIsUpdating,
  selectUserError,
} from '../userSlice';
import { configureStore } from '@reduxjs/toolkit';
import { User, Address, PaymentMethod } from '../../../types/api';

// Mock do serviço
jest.mock('../../../services/userService');

import { userService } from '../../../services/userService';

// Helper para criar mock user
const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  email_verified_at: '2025-01-01T00:00:00Z',
  avatar: 'https://example.com/avatar.jpg',
  phone: '+5511999999999',
  birth_date: '1990-01-01',
  gender: 'male',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// Helper para criar mock address
const createMockAddress = (overrides?: Partial<Address>): Address => ({
  id: 'addr-1',
  street: 'Rua Teste',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01310-100',
  country: 'BR',
  is_default: true,
  ...overrides,
});

// Helper para criar mock payment method
const createMockPaymentMethod = (overrides?: Partial<PaymentMethod>): PaymentMethod => ({
  id: 'pm-1',
  type: 'credit_card',
  brand: 'visa',
  last_digits: '1234',
  holder_name: 'Test User',
  expiry_month: 12,
  expiry_year: 2025,
  is_default: true,
  ...overrides,
});

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ user: UserState }>) => {
  return configureStore({
    reducer: {
      user: userReducer,
    },
    preloadedState,
  });
};

describe('userSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = userReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        profile: null,
        addresses: [],
        paymentMethods: [],
        statistics: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
      });
    });
  });

  // ============================================
  // 2. REDUCERS SÍNCRONOS
  // ============================================
  describe('Reducers Síncronos', () => {
    it('deve limpar erro', () => {
      const initialState: UserState = {
        profile: null,
        addresses: [],
        paymentMethods: [],
        statistics: null,
        isLoading: false,
        isUpdating: false,
        error: 'Erro de teste',
        lastUpdated: null,
      };

      const state = userReducer(initialState, clearError());

      expect(state.error).toBeNull();
    });

    it('deve resetar usuário completamente', () => {
      const initialState: UserState = {
        profile: createMockUser(),
        addresses: [createMockAddress()],
        paymentMethods: [createMockPaymentMethod()],
        statistics: {
          totalOrders: 10,
          totalSpent: 1000,
          boxesOpened: 5,
          favoriteBoxes: 3,
          memberSince: '2025-01-01',
          level: 5,
          experience: 500,
          nextLevelExp: 1000,
        },
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
      };

      const state = userReducer(initialState, resetUser());

      expect(state).toEqual({
        profile: null,
        addresses: [],
        paymentMethods: [],
        statistics: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
      });
    });
  });

  // ============================================
  // 3. ASYNC THUNKS - fetchUserProfile
  // ============================================
  describe('fetchUserProfile', () => {
    it('deve buscar perfil do usuário com sucesso', async () => {
      const store = createTestStore();
      const mockUser = createMockUser();

      (userService.getProfile as jest.Mock).mockResolvedValue(mockUser);

      await store.dispatch(fetchUserProfile());

      const state = store.getState().user;
      expect(state.profile).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('deve tratar erro ao buscar perfil', async () => {
      const store = createTestStore();
      const error = new Error('Erro ao buscar perfil');

      (userService.getProfile as jest.Mock).mockRejectedValue(error);

      await store.dispatch(fetchUserProfile());

      const state = store.getState().user;
      expect(state.error).toBe('Erro ao buscar perfil');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 4. ASYNC THUNKS - updateUserProfile
  // ============================================
  describe('updateUserProfile', () => {
    it('deve atualizar perfil do usuário com sucesso', async () => {
      const store = createTestStore({
        user: {
          profile: createMockUser(),
          addresses: [],
          paymentMethods: [],
          statistics: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
        },
      });

      const updatedUser = createMockUser({ name: 'Updated Name' });
      (userService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      await store.dispatch(updateUserProfile({ name: 'Updated Name' }));

      const state = store.getState().user;
      expect(state.profile).toEqual(updatedUser);
      expect(state.isUpdating).toBe(false);
    });
  });

  // ============================================
  // 5. ASYNC THUNKS - fetchUserAddresses
  // ============================================
  describe('fetchUserAddresses', () => {
    it('deve buscar endereços do usuário com sucesso', async () => {
      const store = createTestStore();
      const mockAddresses = [createMockAddress(), createMockAddress({ id: 'addr-2', is_default: false })];

      (userService.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      await store.dispatch(fetchUserAddresses());

      const state = store.getState().user;
      expect(state.addresses).toEqual(mockAddresses);
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 6. ASYNC THUNKS - addUserAddress
  // ============================================
  describe('addUserAddress', () => {
    it('deve adicionar endereço com sucesso', async () => {
      const store = createTestStore({
        user: {
          profile: null,
          addresses: [],
          paymentMethods: [],
          statistics: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
        },
      });

      const newAddress = createMockAddress();
      (userService.addAddress as jest.Mock).mockResolvedValue(newAddress);

      await store.dispatch(addUserAddress({
        street: 'Rua Teste',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
      }));

      const state = store.getState().user;
      expect(state.addresses).toContainEqual(newAddress);
      expect(state.isUpdating).toBe(false);
    });
  });

  // ============================================
  // 7. ASYNC THUNKS - fetchUserPaymentMethods
  // ============================================
  describe('fetchUserPaymentMethods', () => {
    it('deve buscar métodos de pagamento com sucesso', async () => {
      const store = createTestStore();
      const mockPaymentMethods = [
        createMockPaymentMethod(),
        createMockPaymentMethod({ id: 'pm-2', brand: 'mastercard', is_default: false }),
      ];

      (userService.getPaymentMethods as jest.Mock).mockResolvedValue(mockPaymentMethods);

      await store.dispatch(fetchUserPaymentMethods());

      const state = store.getState().user;
      expect(state.paymentMethods).toEqual(mockPaymentMethods);
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 8. ASYNC THUNKS - fetchUserStatistics
  // ============================================
  describe('fetchUserStatistics', () => {
    it('deve buscar estatísticas do usuário com sucesso', async () => {
      const store = createTestStore();
      const mockStatistics = {
        totalOrders: 10,
        totalSpent: 1000,
        boxesOpened: 5,
        favoriteBoxes: 3,
        memberSince: '2025-01-01',
        level: 5,
        experience: 500,
        nextLevelExp: 1000,
      };

      (userService.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      await store.dispatch(fetchUserStatistics());

      const state = store.getState().user;
      expect(state.statistics).toEqual(mockStatistics);
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 9. SELECTORS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      user: {
        profile: createMockUser(),
        addresses: [createMockAddress()],
        paymentMethods: [createMockPaymentMethod()],
        statistics: {
          totalOrders: 10,
          totalSpent: 1000,
          boxesOpened: 5,
          favoriteBoxes: 3,
          memberSince: '2025-01-01',
          level: 5,
          experience: 500,
          nextLevelExp: 1000,
        },
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
      } as UserState,
    };

    it('selectUserProfile deve retornar perfil do usuário', () => {
      expect(selectUserProfile(mockState)).toEqual(mockState.user.profile);
    });

    it('selectUserAddresses deve retornar endereços', () => {
      expect(selectUserAddresses(mockState)).toEqual(mockState.user.addresses);
    });

    it('selectUserPaymentMethods deve retornar métodos de pagamento', () => {
      expect(selectUserPaymentMethods(mockState)).toEqual(mockState.user.paymentMethods);
    });

    it('selectUserStatistics deve retornar estatísticas', () => {
      expect(selectUserStatistics(mockState)).toEqual(mockState.user.statistics);
    });

    it('selectUserIsLoading deve retornar estado de loading', () => {
      expect(selectUserIsLoading(mockState)).toBe(false);
    });

    it('selectUserIsUpdating deve retornar estado de updating', () => {
      expect(selectUserIsUpdating(mockState)).toBe(false);
    });

    it('selectUserError deve retornar erro', () => {
      expect(selectUserError(mockState)).toBeNull();
    });
  });
});
