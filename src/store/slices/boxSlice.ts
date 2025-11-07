import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { boxService } from '../../services/boxService';
import {
  MysteryBox,
  Category,
  SearchFilters,
  SearchResult,
} from '../../types/api';

/**
 * Redux Slice para gerenciamento de caixas misteriosas
 */

// Estado do slice
export interface BoxState {
  // Listas de caixas
  boxes: MysteryBox[];
  featuredBoxes: MysteryBox[];
  popularBoxes: MysteryBox[];
  newBoxes: MysteryBox[];
  
  // Caixa selecionada
  selectedBox: MysteryBox | null;
  
  // Categorias
  categories: Category[];
  selectedCategory: Category | null;
  
  // Busca e filtros
  searchQuery: string;
  searchResults: SearchResult | null;
  searchSuggestions: string[];
  activeFilters: SearchFilters;
  
  // Paginação
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  // Estados de loading
  loading: {
    boxes: boolean;
    featuredBoxes: boolean;
    popularBoxes: boolean;
    newBoxes: boolean;
    selectedBox: boolean;
    categories: boolean;
    search: boolean;
  };
  
  // Erros
  error: string | null;
  
  // Cache
  lastFetch: {
    boxes: number | null;
    featuredBoxes: number | null;
    popularBoxes: number | null;
    newBoxes: number | null;
    categories: number | null;
  };
}

// Estado inicial
const initialState: BoxState = {
  boxes: [],
  featuredBoxes: [],
  popularBoxes: [],
  newBoxes: [],
  selectedBox: null,
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  searchResults: null,
  searchSuggestions: [],
  activeFilters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: {
    boxes: false,
    featuredBoxes: false,
    popularBoxes: false,
    newBoxes: false,
    selectedBox: false,
    categories: false,
    search: false,
  },
  error: null,
  lastFetch: {
    boxes: null,
    featuredBoxes: null,
    popularBoxes: null,
    newBoxes: null,
    categories: null,
  },
};

// Async Thunks

/**
 * Buscar caixas com filtros
 */
export const fetchBoxes = createAsyncThunk(
  'boxes/fetchBoxes',
  async (filters: SearchFilters = {}, { rejectWithValue }) => {
    try {
      const _response = await boxService.getBoxes(filters);
      return _response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar caixas');
    }
  }
);

/**
 * Buscar caixas em destaque
 */
export const fetchFeaturedBoxes = createAsyncThunk(
  'boxes/fetchFeaturedBoxes',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const boxes = await boxService.getFeaturedBoxes(limit);
      return boxes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar caixas em destaque');
    }
  }
);

/**
 * Buscar caixas populares
 */
export const fetchPopularBoxes = createAsyncThunk(
  'boxes/fetchPopularBoxes',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const boxes = await boxService.getPopularBoxes(limit);
      return boxes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar caixas populares');
    }
  }
);

/**
 * Buscar caixas novas
 */
export const fetchNewBoxes = createAsyncThunk(
  'boxes/fetchNewBoxes',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const boxes = await boxService.getNewBoxes(limit);
      return boxes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar caixas novas');
    }
  }
);

/**
 * Buscar detalhes de uma caixa
 */
export const fetchBoxById = createAsyncThunk(
  'boxes/fetchBoxById',
  async (id: string, { rejectWithValue }) => {
    try {
      const box = await boxService.getBoxById(id);
      return box;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar detalhes da caixa');
    }
  }
);

/**
 * Buscar categorias
 */
export const fetchCategories = createAsyncThunk(
  'boxes/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await boxService.getCategories();
      return categories;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar categorias');
    }
  }
);

/**
 * Buscar caixas
 */
export const searchBoxes = createAsyncThunk(
  'boxes/searchBoxes',
  async ({ query, filters }: { query: string; filters?: Omit<SearchFilters, 'query'> }, { rejectWithValue }) => {
    try {
      const _result = await boxService.searchBoxes(query, filters);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro na busca');
    }
  }
);

/**
 * Buscar sugestões de busca
 */
export const fetchSearchSuggestions = createAsyncThunk(
  'boxes/fetchSearchSuggestions',
  async (query: string, { rejectWithValue }) => {
    try {
      const suggestions = await boxService.getSearchSuggestions(query);
      return suggestions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar sugestões');
    }
  }
);

// Slice
const boxSlice = createSlice({
  name: 'boxes',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Definir query de busca
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Limpar resultados de busca
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.searchQuery = '';
      state.searchSuggestions = [];
    },
    
    // Definir filtros ativos
    setActiveFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.activeFilters = action.payload;
    },
    
    // Limpar filtros
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Definir categoria selecionada
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    
    // Limpar caixa selecionada
    clearSelectedBox: (state) => {
      state.selectedBox = null;
    },
    
    // Atualizar estoque de uma caixa (via WebSocket)
    updateBoxStock: (state, action: PayloadAction<{ boxId: string; stock: number }>) => {
      const { boxId, stock } = action.payload;
      
      // Atualizar nas listas
      [state.boxes, state.featuredBoxes, state.popularBoxes, state.newBoxes].forEach(list => {
        const box = list.find(b => b.id === boxId);
        if (box) {
          box.stock = stock;
        }
      });
      
      // Atualizar caixa selecionada
      if (state.selectedBox?.id === boxId) {
        state.selectedBox.stock = stock;
      }
      
      // Atualizar resultados de busca
      if (state.searchResults) {
        const box = state.searchResults.boxes.find(b => b.id === boxId);
        if (box) {
          box.stock = stock;
        }
      }
    },
    
    // Resetar estado
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch boxes
    builder
      .addCase(fetchBoxes.pending, (state) => {
        state.loading.boxes = true;
        state.error = null;
      })
      .addCase(fetchBoxes.fulfilled, (state, action) => {
        state.loading.boxes = false;
        state.boxes = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta?.current_page || 1,
          totalPages: action.payload.meta?.last_page || 1,
          totalItems: action.payload.meta?.total || 0,
          hasNextPage: (action.payload.meta?.current_page || 1) < (action.payload.meta?.last_page || 1),
          hasPreviousPage: (action.payload.meta?.current_page || 1) > 1,
        };
        state.lastFetch.boxes = Date.now();
      })
      .addCase(fetchBoxes.rejected, (state, action) => {
        state.loading.boxes = false;
        state.error = action.payload as string;
      });

    // Fetch featured boxes
    builder
      .addCase(fetchFeaturedBoxes.pending, (state) => {
        state.loading.featuredBoxes = true;
        state.error = null;
      })
      .addCase(fetchFeaturedBoxes.fulfilled, (state, action) => {
        state.loading.featuredBoxes = false;
        state.featuredBoxes = action.payload;
        state.lastFetch.featuredBoxes = Date.now();
      })
      .addCase(fetchFeaturedBoxes.rejected, (state, action) => {
        state.loading.featuredBoxes = false;
        state.error = action.payload as string;
      });

    // Fetch popular boxes
    builder
      .addCase(fetchPopularBoxes.pending, (state) => {
        state.loading.popularBoxes = true;
        state.error = null;
      })
      .addCase(fetchPopularBoxes.fulfilled, (state, action) => {
        state.loading.popularBoxes = false;
        state.popularBoxes = action.payload;
        state.lastFetch.popularBoxes = Date.now();
      })
      .addCase(fetchPopularBoxes.rejected, (state, action) => {
        state.loading.popularBoxes = false;
        state.error = action.payload as string;
      });

    // Fetch new boxes
    builder
      .addCase(fetchNewBoxes.pending, (state) => {
        state.loading.newBoxes = true;
        state.error = null;
      })
      .addCase(fetchNewBoxes.fulfilled, (state, action) => {
        state.loading.newBoxes = false;
        state.newBoxes = action.payload;
        state.lastFetch.newBoxes = Date.now();
      })
      .addCase(fetchNewBoxes.rejected, (state, action) => {
        state.loading.newBoxes = false;
        state.error = action.payload as string;
      });

    // Fetch box by ID
    builder
      .addCase(fetchBoxById.pending, (state) => {
        state.loading.selectedBox = true;
        state.error = null;
      })
      .addCase(fetchBoxById.fulfilled, (state, action) => {
        state.loading.selectedBox = false;
        state.selectedBox = action.payload;
      })
      .addCase(fetchBoxById.rejected, (state, action) => {
        state.loading.selectedBox = false;
        state.error = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
        state.lastFetch.categories = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error = action.payload as string;
      });

    // Search boxes
    builder
      .addCase(searchBoxes.pending, (state) => {
        state.loading.search = true;
        state.error = null;
      })
      .addCase(searchBoxes.fulfilled, (state, action) => {
        state.loading.search = false;
        state.searchResults = action.payload;
      })
      .addCase(searchBoxes.rejected, (state, action) => {
        state.loading.search = false;
        state.error = action.payload as string;
      });

    // Fetch search suggestions
    builder
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.searchSuggestions = action.payload;
      });
  },
});

// Actions
export const {
  setSearchQuery,
  clearSearchResults,
  setActiveFilters,
  clearFilters,
  setSelectedCategory,
  clearSelectedBox,
  updateBoxStock,
  resetState
} = boxSlice.actions;

// Selectors
export const selectBoxes = (state: { boxes: BoxState }) => state.boxes.boxes;
export const selectFeaturedBoxes = (state: { boxes: BoxState }) => state.boxes.featuredBoxes;
export const selectPopularBoxes = (state: { boxes: BoxState }) => state.boxes.popularBoxes;
export const selectNewBoxes = (state: { boxes: BoxState }) => state.boxes.newBoxes;
export const selectSelectedBox = (state: { boxes: BoxState }) => state.boxes.selectedBox;
export const selectCategories = (state: { boxes: BoxState }) => state.boxes.categories;
export const selectSelectedCategory = (state: { boxes: BoxState }) => state.selectedCategory;
export const selectSearchQuery = (state: { boxes: BoxState }) => state.boxes.searchQuery;
export const selectSearchResults = (state: { boxes: BoxState }) => state.boxes.searchResults;
export const selectSearchSuggestions = (state: { boxes: BoxState }) => state.boxes.searchSuggestions;
export const selectActiveFilters = (state: { boxes: BoxState }) => state.boxes.activeFilters;
export const selectPagination = (state: { boxes: BoxState }) => state.boxes.pagination;
export const selectBoxLoading = (state: { boxes: BoxState }) => state.boxes.loading;
export const selectBoxError = (state: { boxes: BoxState }) => state.boxes.error;

export default boxSlice.reducer;