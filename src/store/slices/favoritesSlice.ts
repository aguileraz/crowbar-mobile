import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { MysteryBox } from '../../types/api';

/**
 * Redux Slice para gerenciamento de favoritos
 */

// Estado do slice
export interface FavoritesState {
  favorites: MysteryBox[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastUpdated: number | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

// Estado inicial
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

// Async Thunks

/**
 * Buscar favoritos do usuário
 */
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const response = await userService.getFavorites(page, 20);
      return {
        favorites: response.data,
        pagination: response.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar favoritos');
    }
  }
);

/**
 * Adicionar aos favoritos
 */
export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (boxId: string, { rejectWithValue }) => {
    try {
      await userService.addToFavorites(boxId);
      return boxId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao adicionar aos favoritos');
    }
  }
);

/**
 * Remover dos favoritos
 */
export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (boxId: string, { rejectWithValue }) => {
    try {
      await userService.removeFromFavorites(boxId);
      return boxId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao remover dos favoritos');
    }
  }
);

/**
 * Verificar se é favorito
 */
export const checkIsFavorite = createAsyncThunk(
  'favorites/checkIsFavorite',
  async (boxId: string, { rejectWithValue }) => {
    try {
      const isFavorite = await userService.isFavorite(boxId);
      return { boxId, isFavorite };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao verificar favorito');
    }
  }
);

/**
 * Sincronizar favoritos
 */
export const syncFavorites = createAsyncThunk(
  'favorites/syncFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const favoriteIds = await userService.getFavoriteIds();
      return favoriteIds;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao sincronizar favoritos');
    }
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Limpar favoritos
    clearFavorites: (state) => {
      state.favorites = [];
      state.favoriteIds = new Set();
      state.pagination = initialState.pagination;
    },
    
    // Adicionar favorito local (otimistic update)
    addFavoriteLocal: (state, action: PayloadAction<string>) => {
      state.favoriteIds.add(action.payload);
    },
    
    // Remover favorito local (otimistic update)
    removeFavoriteLocal: (state, action: PayloadAction<string>) => {
      state.favoriteIds.delete(action.payload);
      state.favorites = state.favorites.filter(box => box.id !== action.payload);
    },
    
    // Resetar estado
    resetFavorites: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.meta.arg === 1) {
          // First page - replace
          state.favorites = action.payload.favorites;
        } else {
          // Additional pages - append
          state.favorites = [...state.favorites, ...action.payload.favorites];
        }
        
        state.pagination = action.payload.pagination;
        
        // Update favorite IDs set
        state.favoriteIds = new Set(state.favorites.map(box => box.id));
        state.lastUpdated = Date.now();
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to favorites
    builder
      .addCase(addToFavorites.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.favoriteIds.add(action.payload);
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
        // Revert optimistic update
        state.favoriteIds.delete(action.meta.arg);
      });

    // Remove from favorites
    builder
      .addCase(removeFromFavorites.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.favoriteIds.delete(action.payload);
        state.favorites = state.favorites.filter(box => box.id !== action.payload);
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
        // Revert optimistic update
        state.favoriteIds.add(action.meta.arg);
      });

    // Check is favorite
    builder
      .addCase(checkIsFavorite.fulfilled, (state, action) => {
        if (action.payload.isFavorite) {
          state.favoriteIds.add(action.payload.boxId);
        } else {
          state.favoriteIds.delete(action.payload.boxId);
        }
      });

    // Sync favorites
    builder
      .addCase(syncFavorites.fulfilled, (state, action) => {
        state.favoriteIds = new Set(action.payload);
      });
  },
});

// Actions
export const {
  clearError,
  clearFavorites,
  addFavoriteLocal,
  removeFavoriteLocal,
  resetFavorites,
} = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state: { favorites: FavoritesState }) => state.favorites.favorites;
export const selectFavoriteIds = (state: { favorites: FavoritesState }) => state.favorites.favoriteIds;
export const selectFavoritesLoading = (state: { favorites: FavoritesState }) => state.favorites.isLoading;
export const selectFavoritesUpdating = (state: { favorites: FavoritesState }) => state.favorites.isUpdating;
export const selectFavoritesError = (state: { favorites: FavoritesState }) => state.favorites.error;
export const selectFavoritesPagination = (state: { favorites: FavoritesState }) => state.favorites.pagination;

// Helper selector to check if a box is favorite
export const selectIsFavorite = (boxId: string) => (state: { favorites: FavoritesState }) => 
  state.favorites.favoriteIds.has(boxId);

export default favoritesSlice.reducer;
