/**
 * Testes Unitários - favoritesSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de favoritos Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, buscar favoritos, adicionar/remover, sincronização, selectors
 */

import favoritesReducer, {
  FavoritesState,
  fetchFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
  syncFavorites,
  clearError,
  clearFavorites,
  addFavoriteLocal,
  removeFavoriteLocal,
  resetFavorites,
  selectFavorites,
  selectFavoriteIds,
  selectFavoritesLoading,
  selectFavoritesUpdating,
  selectFavoritesError,
  selectFavoritesPagination,
  selectIsFavorite,
} from '../favoritesSlice';
import { configureStore } from '@reduxjs/toolkit';
import { MysteryBox } from '../../../types/api';

// Mock do serviço
jest.mock('../../../services/userService');

import { userService } from '../../../services/userService';

// Helper para criar mock box
const createMockBox = (overrides?: Partial<MysteryBox>): MysteryBox => ({
  id: 'box-1',
  name: 'Mystery Box Test',
  description: 'Test description',
  short_description: 'Test',
  price: 100,
  category: {
    id: 'cat-1',
    name: 'Gaming',
    slug: 'gaming',
  },
  image_url: 'https://example.com/box.jpg',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ favorites: FavoritesState }>) => {
  return configureStore({
    reducer: {
      favorites: favoritesReducer,
    },
    preloadedState,
  });
};

describe('favoritesSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = favoritesReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        favorites: [],
        favoriteIds: new Set(),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
        },
      });
    });
  });

  // ============================================
  // 2. REDUCERS SÍNCRONOS
  // ============================================
  describe('Reducers Síncronos', () => {
    it('deve limpar erro', () => {
      const initialState: FavoritesState = {
        favorites: [],
        favoriteIds: new Set(),
        isLoading: false,
        isUpdating: false,
        error: 'Erro de teste',
        lastUpdated: null,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
        },
      };

      const state = favoritesReducer(initialState, clearError());

      expect(state.error).toBeNull();
    });

    it('deve limpar favoritos', () => {
      const initialState: FavoritesState = {
        favorites: [createMockBox()],
        favoriteIds: new Set(['box-1']),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      const state = favoritesReducer(initialState, clearFavorites());

      expect(state.favorites).toEqual([]);
      expect(state.favoriteIds.size).toBe(0);
      expect(state.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
      });
    });

    it('deve adicionar favorito local', () => {
      const initialState: FavoritesState = {
        favorites: [],
        favoriteIds: new Set(),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
        },
      };

      const state = favoritesReducer(initialState, addFavoriteLocal('box-1'));

      expect(state.favoriteIds.has('box-1')).toBe(true);
    });

    it('deve remover favorito local', () => {
      const initialState: FavoritesState = {
        favorites: [createMockBox()],
        favoriteIds: new Set(['box-1']),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      const state = favoritesReducer(initialState, removeFavoriteLocal('box-1'));

      expect(state.favoriteIds.has('box-1')).toBe(false);
      expect(state.favorites).toEqual([]);
    });

    it('deve resetar favoritos completamente', () => {
      const initialState: FavoritesState = {
        favorites: [createMockBox()],
        favoriteIds: new Set(['box-1']),
        isLoading: true,
        isUpdating: true,
        error: 'Erro',
        lastUpdated: Date.now(),
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          hasNextPage: true,
        },
      };

      const state = favoritesReducer(initialState, resetFavorites());

      expect(state).toEqual({
        favorites: [],
        favoriteIds: new Set(),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: null,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
        },
      });
    });
  });

  // ============================================
  // 3. ASYNC THUNKS - fetchFavorites
  // ============================================
  describe('fetchFavorites', () => {
    it('deve buscar favoritos com sucesso', async () => {
      const store = createTestStore();
      const mockBoxes = [createMockBox(), createMockBox({ id: 'box-2' })];

      (userService.getFavorites as jest.Mock).mockResolvedValue({
        data: mockBoxes,
        meta: {
          current_page: 1,
          last_page: 1,
          total: 2,
          per_page: 20,
        },
      });

      await store.dispatch(fetchFavorites(1));

      const state = store.getState().favorites;
      expect(state.favorites).toEqual(mockBoxes);
      expect(state.favoriteIds.size).toBe(2);
      expect(state.isLoading).toBe(false);
    });

    it('deve tratar erro ao buscar favoritos', async () => {
      const store = createTestStore();
      const error = new Error('Erro ao buscar favoritos');

      (userService.getFavorites as jest.Mock).mockRejectedValue(error);

      await store.dispatch(fetchFavorites(1));

      const state = store.getState().favorites;
      expect(state.error).toBe('Erro ao buscar favoritos');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 4. ASYNC THUNKS - addToFavorites
  // ============================================
  describe('addToFavorites', () => {
    it('deve adicionar aos favoritos com sucesso', async () => {
      const store = createTestStore();

      (userService.addToFavorites as jest.Mock).mockResolvedValue(undefined);

      await store.dispatch(addToFavorites('box-1'));

      const state = store.getState().favorites;
      expect(state.favoriteIds.has('box-1')).toBe(true);
      expect(state.isUpdating).toBe(false);
    });

    it('deve reverter atualização otimista em caso de erro', async () => {
      const store = createTestStore({
        favorites: {
          favorites: [],
          favoriteIds: new Set(),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        },
      });

      // Adicionar localmente primeiro
      store.dispatch(addFavoriteLocal('box-1'));

      const error = new Error('Erro ao adicionar');
      (userService.addToFavorites as jest.Mock).mockRejectedValue(error);

      await store.dispatch(addToFavorites('box-1'));

      const state = store.getState().favorites;
      expect(state.favoriteIds.has('box-1')).toBe(false); // Revertido
      expect(state.error).toBe('Erro ao adicionar');
    });
  });

  // ============================================
  // 5. ASYNC THUNKS - removeFromFavorites
  // ============================================
  describe('removeFromFavorites', () => {
    it('deve remover dos favoritos com sucesso', async () => {
      const store = createTestStore({
        favorites: {
          favorites: [createMockBox()],
          favoriteIds: new Set(['box-1']),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      (userService.removeFromFavorites as jest.Mock).mockResolvedValue(undefined);

      await store.dispatch(removeFromFavorites('box-1'));

      const state = store.getState().favorites;
      expect(state.favoriteIds.has('box-1')).toBe(false);
      expect(state.favorites).toEqual([]);
      expect(state.isUpdating).toBe(false);
    });
  });

  // ============================================
  // 6. ASYNC THUNKS - checkIsFavorite
  // ============================================
  describe('checkIsFavorite', () => {
    it('deve verificar se é favorito e atualizar estado', async () => {
      const store = createTestStore();

      (userService.isFavorite as jest.Mock).mockResolvedValue(true);

      await store.dispatch(checkIsFavorite('box-1'));

      const state = store.getState().favorites;
      expect(state.favoriteIds.has('box-1')).toBe(true);
    });

    it('deve remover do estado se não for favorito', async () => {
      const store = createTestStore({
        favorites: {
          favorites: [],
          favoriteIds: new Set(['box-1']),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        },
      });

      (userService.isFavorite as jest.Mock).mockResolvedValue(false);

      await store.dispatch(checkIsFavorite('box-1'));

      const state = store.getState().favorites;
      expect(state.favoriteIds.has('box-1')).toBe(false);
    });
  });

  // ============================================
  // 7. SELECTORS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      favorites: {
        favorites: [createMockBox()],
        favoriteIds: new Set(['box-1', 'box-2']),
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      } as FavoritesState,
    };

    it('selectFavorites deve retornar lista de favoritos', () => {
      expect(selectFavorites(mockState)).toEqual(mockState.favorites.favorites);
    });

    it('selectFavoriteIds deve retornar Set de IDs', () => {
      expect(selectFavoriteIds(mockState)).toEqual(mockState.favorites.favoriteIds);
    });

    it('selectIsFavorite deve retornar true se box é favorito', () => {
      expect(selectIsFavorite('box-1')(mockState)).toBe(true);
    });

    it('selectIsFavorite deve retornar false se box não é favorito', () => {
      expect(selectIsFavorite('box-999')(mockState)).toBe(false);
    });

    it('selectFavoritesLoading deve retornar estado de loading', () => {
      expect(selectFavoritesLoading(mockState)).toBe(false);
    });

    it('selectFavoritesUpdating deve retornar estado de updating', () => {
      expect(selectFavoritesUpdating(mockState)).toBe(false);
    });

    it('selectFavoritesError deve retornar erro', () => {
      expect(selectFavoritesError(mockState)).toBeNull();
    });

    it('selectFavoritesPagination deve retornar paginação', () => {
      expect(selectFavoritesPagination(mockState)).toEqual(mockState.favorites.pagination);
    });
  });
});
