import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types/api';

/**
 * Redux Slice para gerenciamento de reviews e avaliações
 */

// Estado do slice
export interface ReviewsState {
  reviews: Review[];
  currentReview: Review | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: {
    rating?: number;
    sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
    hasPhotos?: boolean;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
  userReview: Review | null;
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  } | null;
}

// Estado inicial
const initialState: ReviewsState = {
  reviews: [],
  currentReview: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {
    sortBy: 'newest',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  },
  userReview: null,
  statistics: null,
};

// Async Thunks

/**
 * Buscar reviews de uma caixa
 */
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (params: { boxId: string; page?: number; filters?: any }, { rejectWithValue }) => {
    try {
      const { boxId, page = 1, filters = {} } = params;
      const _response = await reviewService.getReviews(boxId, page, 20, filters);
      return {
        reviews: response.data,
        pagination: response.pagination,
        page,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar reviews');
    }
  }
);

/**
 * Buscar estatísticas de reviews
 */
export const fetchReviewStatistics = createAsyncThunk(
  'reviews/fetchReviewStatistics',
  async (boxId: string, { rejectWithValue }) => {
    try {
      const statistics = await reviewService.getReviewStatistics(boxId);
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar estatísticas');
    }
  }
);

/**
 * Buscar review do usuário
 */
export const fetchUserReview = createAsyncThunk(
  'reviews/fetchUserReview',
  async (boxId: string, { rejectWithValue }) => {
    try {
      const review = await reviewService.getUserReview(boxId);
      return review;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar review do usuário');
    }
  }
);

/**
 * Criar review
 */
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData: {
    boxId: string;
    rating: number;
    comment: string;
    photos?: string[];
  }, { rejectWithValue }) => {
    try {
      const review = await reviewService.createReview(reviewData);
      return review;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao criar review');
    }
  }
);

/**
 * Atualizar review
 */
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData }: {
    reviewId: string;
    reviewData: {
      rating: number;
      comment: string;
      photos?: string[];
    };
  }, { rejectWithValue }) => {
    try {
      const review = await reviewService.updateReview(reviewId, reviewData);
      return review;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar review');
    }
  }
);

/**
 * Deletar review
 */
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId: string, { rejectWithValue }) => {
    try {
      await reviewService.deleteReview(reviewId);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao deletar review');
    }
  }
);

/**
 * Marcar review como útil
 */
export const markReviewHelpful = createAsyncThunk(
  'reviews/markReviewHelpful',
  async ({ reviewId, helpful }: { reviewId: string; helpful: boolean }, { rejectWithValue }) => {
    try {
      const review = await reviewService.markReviewHelpful(reviewId, helpful);
      return review;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao marcar review');
    }
  }
);

/**
 * Reportar review
 */
export const reportReview = createAsyncThunk(
  'reviews/reportReview',
  async ({ reviewId, reason }: { reviewId: string; reason: string }, { rejectWithValue }) => {
    try {
      await reviewService.reportReview(reviewId, reason);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao reportar review');
    }
  }
);

// Slice
const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    // Definir filtros
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Limpar filtros
    clearFilters: (state) => {
      state.filters = { sortBy: 'newest' };
    },
    
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Limpar review atual
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
    
    // Resetar estado
    resetReviews: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.page === 1) {
          // First page - replace
          state.reviews = action.payload.reviews;
        } else {
          // Additional pages - append
          state.reviews = [...state.reviews, ...action.payload.reviews];
        }
        
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch review statistics
    builder
      .addCase(fetchReviewStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });

    // Fetch user review
    builder
      .addCase(fetchUserReview.fulfilled, (state, action) => {
        state.userReview = action.payload;
      });

    // Create review
    builder
      .addCase(createReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.userReview = action.payload;
        state.reviews.unshift(action.payload);
        
        // Update statistics
        if (state.statistics) {
          state.statistics.totalReviews += 1;
          state.statistics.ratingDistribution[action.payload.rating as keyof typeof state.statistics.ratingDistribution] += 1;
          
          // Recalculate average
          const total = Object.values(state.statistics.ratingDistribution).reduce((sum, count) => sum + count, 0);
          const weightedSum = Object.entries(state.statistics.ratingDistribution).reduce(
            (sum, [rating, count]) => sum + (parseInt(rating, 10) * count), 0
          );
          state.statistics.averageRating = weightedSum / total;
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Update review
    builder
      .addCase(updateReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.userReview = action.payload;
        
        // Update in reviews list
        const index = state.reviews.findIndex(review => review.id === action.payload.id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Delete review
    builder
      .addCase(deleteReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.userReview = null;
        
        // Remove from reviews list
        state.reviews = state.reviews.filter(review => review.id !== action.payload);
        
        // Update statistics
        if (state.statistics) {
          state.statistics.totalReviews -= 1;
        }
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Mark review helpful
    builder
      .addCase(markReviewHelpful.fulfilled, (state, action) => {
        // Update in reviews list
        const index = state.reviews.findIndex(review => review.id === action.payload.id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      });
  },
});

// Actions
export const {
  setFilters,
  clearFilters,
  clearError,
  clearCurrentReview,
  resetReviews,
} = reviewsSlice.actions;

// Selectors
export const selectReviews = (state: { reviews: ReviewsState }) => state.reviews.reviews;
export const selectCurrentReview = (state: { reviews: ReviewsState }) => state.reviews.currentReview;
export const selectUserReview = (state: { reviews: ReviewsState }) => state.reviews.userReview;
export const selectReviewsLoading = (state: { reviews: ReviewsState }) => state.reviews.isLoading;
export const selectReviewsSubmitting = (state: { reviews: ReviewsState }) => state.reviews.isSubmitting;
export const selectReviewsError = (state: { reviews: ReviewsState }) => state.reviews.error;
export const selectReviewsFilters = (state: { reviews: ReviewsState }) => state.reviews.filters;
export const selectReviewsPagination = (state: { reviews: ReviewsState }) => state.reviews.pagination;
export const selectReviewStatistics = (state: { reviews: ReviewsState }) => state.reviews.statistics;

export default reviewsSlice.reducer;
