import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { User, Address, PaymentMethod } from '../../types/api';

/**
 * Redux Slice para gerenciamento do usuário
 */

// Estado do slice
export interface UserState {
  profile: User | null;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  statistics: {
    totalOrders: number;
    totalSpent: number;
    boxesOpened: number;
    favoriteBoxes: number;
    memberSince: string;
    level: number;
    experience: number;
    nextLevelExp: number;
  } | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Estado inicial
const initialState: UserState = {
  profile: null,
  addresses: [],
  paymentMethods: [],
  statistics: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks

/**
 * Buscar perfil do usuário
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await userService.getProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar perfil');
    }
  }
);

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const updatedProfile = await userService.updateProfile(profileData);
      return updatedProfile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar perfil');
    }
  }
);

/**
 * Upload de avatar
 */
export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const avatarUrl = await userService.uploadAvatar(imageUri);
      return avatarUrl;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao fazer upload do avatar');
    }
  }
);

/**
 * Buscar endereços do usuário
 */
export const fetchUserAddresses = createAsyncThunk(
  'user/fetchUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const addresses = await userService.getAddresses();
      return addresses;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar endereços');
    }
  }
);

/**
 * Buscar métodos de pagamento
 */
export const fetchPaymentMethods = createAsyncThunk(
  'user/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const paymentMethods = await userService.getPaymentMethods();
      return paymentMethods;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar métodos de pagamento');
    }
  }
);

/**
 * Buscar estatísticas do usuário
 */
export const fetchUserStatistics = createAsyncThunk(
  'user/fetchUserStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const statistics = await userService.getStatistics();
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar estatísticas');
    }
  }
);

/**
 * Deletar conta do usuário
 */
export const deleteUserAccount = createAsyncThunk(
  'user/deleteUserAccount',
  async (password: string, { rejectWithValue }) => {
    try {
      await userService.deleteAccount(password);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao deletar conta');
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Atualizar avatar local
    updateAvatarLocal: (state, action: PayloadAction<string>) => {
      if (state.profile) {
        state.profile.avatar = action.payload;
      }
    },
    
    // Resetar estado
    resetUser: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Upload avatar
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile.avatar = action.payload;
        }
        state.lastUpdated = Date.now();
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Fetch addresses
    builder
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      });

    // Fetch payment methods
    builder
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      });

    // Fetch statistics
    builder
      .addCase(fetchUserStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });

    // Delete account
    builder
      .addCase(deleteUserAccount.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.isUpdating = false;
        // Reset state after account deletion
        Object.assign(state, initialState);
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearError,
  updateAvatarLocal,
  resetUser,
} = userSlice.actions;

// Selectors
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserAddresses = (state: { user: UserState }) => state.user.addresses;
export const selectUserPaymentMethods = (state: { user: UserState }) => state.user.paymentMethods;
export const selectUserStatistics = (state: { user: UserState }) => state.user.statistics;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserUpdating = (state: { user: UserState }) => state.user.isUpdating;
export const selectUserError = (state: { user: UserState }) => state.user.error;

export default userSlice.reducer;