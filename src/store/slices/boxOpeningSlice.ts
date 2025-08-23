import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { boxService } from '../../services/boxService';
import { MysteryBox, BoxOpeningResult, BoxItem } from '../../types/api';

/**
 * Redux Slice para gerenciamento de abertura de caixas
 */

// Estado do slice
export interface BoxOpeningState {
  currentBox: MysteryBox | null;
  openingResult: BoxOpeningResult | null;
  isOpening: boolean;
  isLoading: boolean;
  error: string | null;
  openingHistory: BoxOpeningResult[];
  animationState: 'idle' | 'opening' | 'revealing' | 'completed';
  revealedItems: BoxItem[];
  currentRevealIndex: number;
  showShareModal: boolean;
  statistics: {
    totalBoxesOpened: number;
    totalValueReceived: number;
    rareItemsFound: number;
    favoriteItems: string[];
  } | null;
}

// Estado inicial
const initialState: BoxOpeningState = {
  currentBox: null,
  openingResult: null,
  isOpening: false,
  isLoading: false,
  error: null,
  openingHistory: [],
  animationState: 'idle',
  revealedItems: [],
  currentRevealIndex: 0,
  showShareModal: false,
  statistics: null,
};

// Async Thunks

/**
 * Abrir caixa misteriosa
 */
export const openMysteryBox = createAsyncThunk(
  'boxOpening/openMysteryBox',
  async (boxId: string, { rejectWithValue }) => {
    try {
      const _result = await boxService.openBox(boxId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao abrir caixa');
    }
  }
);

/**
 * Buscar histórico de aberturas
 */
export const fetchOpeningHistory = createAsyncThunk(
  'boxOpening/fetchOpeningHistory',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20 } = params;
      const _response = await boxService.getOpeningHistory(page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar histórico');
    }
  }
);

/**
 * Buscar estatísticas de abertura
 */
export const fetchOpeningStatistics = createAsyncThunk(
  'boxOpening/fetchOpeningStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const statistics = await boxService.getOpeningStatistics();
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar estatísticas');
    }
  }
);

/**
 * Compartilhar resultado
 */
export const shareOpeningResult = createAsyncThunk(
  'boxOpening/shareOpeningResult',
  async ({ resultId, platform }: { resultId: string; platform: string }, { rejectWithValue }) => {
    try {
      const shareData = await boxService.shareOpeningResult(resultId, platform);
      return shareData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao compartilhar resultado');
    }
  }
);

/**
 * Adicionar item aos favoritos
 */
export const addItemToFavorites = createAsyncThunk(
  'boxOpening/addItemToFavorites',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await boxService.addItemToFavorites(itemId);
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao adicionar aos favoritos');
    }
  }
);

// Slice
const boxOpeningSlice = createSlice({
  name: 'boxOpening',
  initialState,
  reducers: {
    // Definir caixa atual
    setCurrentBox: (state, action: PayloadAction<MysteryBox>) => {
      state.currentBox = action.payload;
      state.openingResult = null;
      state.animationState = 'idle';
      state.revealedItems = [];
      state.currentRevealIndex = 0;
    },
    
    // Iniciar animação de abertura
    startOpeningAnimation: (state) => {
      state.animationState = 'opening';
    },
    
    // Iniciar revelação dos itens
    startRevealingItems: (state) => {
      state.animationState = 'revealing';
      state.currentRevealIndex = 0;
      state.revealedItems = [];
    },
    
    // Revelar próximo item
    revealNextItem: (state) => {
      if (state.openingResult && state.currentRevealIndex < state.openingResult.items.length) {
        const nextItem = state.openingResult.items[state.currentRevealIndex];
        state.revealedItems.push(nextItem);
        state.currentRevealIndex += 1;
        
        // Se todos os itens foram revelados
        if (state.currentRevealIndex >= state.openingResult.items.length) {
          state.animationState = 'completed';
        }
      }
    },
    
    // Completar abertura
    completeOpening: (state) => {
      state.animationState = 'completed';
      if (state.openingResult) {
        state.revealedItems = state.openingResult.items;
        state.currentRevealIndex = state.openingResult.items.length;
      }
    },
    
    // Mostrar/esconder modal de compartilhamento
    setShowShareModal: (state, action: PayloadAction<boolean>) => {
      state.showShareModal = action.payload;
    },
    
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Resetar estado de abertura
    resetOpening: (state) => {
      state.currentBox = null;
      state.openingResult = null;
      state.animationState = 'idle';
      state.revealedItems = [];
      state.currentRevealIndex = 0;
      state.showShareModal = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Open mystery box
    builder
      .addCase(openMysteryBox.pending, (state) => {
        state.isOpening = true;
        state.error = null;
      })
      .addCase(openMysteryBox.fulfilled, (state, action) => {
        state.isOpening = false;
        state.openingResult = action.payload;
        state.openingHistory.unshift(action.payload);
        // Animation will be controlled by UI components
      })
      .addCase(openMysteryBox.rejected, (state, action) => {
        state.isOpening = false;
        state.error = action.payload as string;
      });

    // Fetch opening history
    builder
      .addCase(fetchOpeningHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOpeningHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.meta.arg.page === 1) {
          state.openingHistory = action.payload.data;
        } else {
          state.openingHistory = [...state.openingHistory, ...action.payload.data];
        }
      })
      .addCase(fetchOpeningHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch opening statistics
    builder
      .addCase(fetchOpeningStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });

    // Add item to favorites
    builder
      .addCase(addItemToFavorites.fulfilled, (state, action) => {
        if (state.statistics) {
          state.statistics.favoriteItems.push(action.payload);
        }
      });
  },
});

// Actions
export const {
  setCurrentBox,
  startOpeningAnimation,
  startRevealingItems,
  revealNextItem,
  completeOpening,
  setShowShareModal,
  clearError,
  resetOpening,
} = boxOpeningSlice.actions;

// Selectors
export const selectCurrentBox = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.currentBox;
export const selectOpeningResult = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.openingResult;
export const selectIsOpening = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.isOpening;
export const selectAnimationState = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.animationState;
export const selectRevealedItems = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.revealedItems;
export const selectCurrentRevealIndex = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.currentRevealIndex;
export const selectOpeningHistory = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.openingHistory;
export const selectOpeningStatistics = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.statistics;
export const selectShowShareModal = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.showShareModal;
export const selectBoxOpeningError = (state: { boxOpening: BoxOpeningState }) => state.boxOpening.error;

export default boxOpeningSlice.reducer;