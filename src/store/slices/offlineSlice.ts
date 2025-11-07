import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineService } from '../../services/offlineService';

/**
 * Redux Slice para gerenciamento de funcionalidades offline
 */

// Estado do slice
export interface OfflineState {
  isOnline: boolean;
  lastOnlineTime: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  
  // Cache status
  cacheStatus: {
    boxes: {
      lastUpdated: number | null;
      count: number;
      size: number; // in bytes
    };
    categories: {
      lastUpdated: number | null;
      count: number;
    };
    user: {
      lastUpdated: number | null;
    };
    cart: {
      lastUpdated: number | null;
    };
  };
  
  // Pending actions (to be synced when online)
  pendingActions: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retryCount: number;
  }>;
  
  // Offline settings
  settings: {
    enableOfflineMode: boolean;
    autoSync: boolean;
    cacheExpiration: number; // in milliseconds
    maxCacheSize: number; // in bytes
    syncOnWifiOnly: boolean;
  };
  
  // Network info
  networkInfo: {
    type: string | null;
    isConnected: boolean;
    isInternetReachable: boolean | null;
    details: any;
  };
}

// Estado inicial
const initialState: OfflineState = {
  isOnline: true,
  lastOnlineTime: Date.now(),
  syncStatus: 'idle',
  syncError: null,
  cacheStatus: {
    boxes: {
      lastUpdated: null,
      count: 0,
      size: 0,
    },
    categories: {
      lastUpdated: null,
      count: 0,
    },
    user: {
      lastUpdated: null,
    },
    cart: {
      lastUpdated: null,
    },
  },
  pendingActions: [],
  settings: {
    enableOfflineMode: true,
    autoSync: true,
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    syncOnWifiOnly: false,
  },
  networkInfo: {
    type: null,
    isConnected: true,
    isInternetReachable: null,
    details: null,
  },
};

// Async Thunks

/**
 * Inicializar sistema offline
 */
export const initializeOffline = createAsyncThunk(
  'offline/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const _result = await offlineService.initialize();
      return _result;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao inicializar sistema offline');
    }
  }
);

/**
 * Sincronizar dados offline
 */
export const syncOfflineData = createAsyncThunk(
  'offline/syncData',
  async (force: boolean = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      
      if (!state.offline.isOnline && !force) {
        throw new Error('Sem conexão com a internet');
      }

      const _result = await offlineService.syncData(force);
      return _result;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao sincronizar dados');
    }
  }
);

/**
 * Limpar cache offline
 */
export const clearOfflineCache = createAsyncThunk(
  'offline/clearCache',
  async (cacheType?: string, { rejectWithValue }) => {
    try {
      await offlineService.clearCache(cacheType);
      return cacheType;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao limpar cache');
    }
  }
);

/**
 * Adicionar ação pendente
 */
export const addPendingAction = createAsyncThunk(
  'offline/addPendingAction',
  async (action: { type: string; data: any }, { rejectWithValue }) => {
    try {
      const pendingAction = {
        id: Date.now().toString(),
        type: action.type,
        data: action.data,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      await offlineService.addPendingAction(pendingAction);
      return pendingAction;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao adicionar ação pendente');
    }
  }
);

/**
 * Processar ações pendentes
 */
export const processPendingActions = createAsyncThunk(
  'offline/processPendingActions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      
      if (!state.offline.isOnline) {
        throw new Error('Sem conexão com a internet');
      }

      const _result = await offlineService.processPendingActions();
      return _result;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao processar ações pendentes');
    }
  }
);

// Slice
const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    // Network status
    setNetworkStatus: (state, action: PayloadAction<{
      isOnline: boolean;
      networkInfo?: any;
    }>) => {
      const wasOnline = state.isOnline;
      state.isOnline = action.payload.isOnline;
      
      if (action.payload.networkInfo) {
        state.networkInfo = action.payload.networkInfo;
      }
      
      if (action.payload.isOnline) {
        state.lastOnlineTime = Date.now();
        
        // Auto-sync when coming back online
        if (!wasOnline && state.settings.autoSync) {
          // This would trigger sync in a middleware or effect
        }
      }
    },
    
    // Cache status updates
    updateCacheStatus: (state, action: PayloadAction<{
      type: keyof OfflineState['cacheStatus'];
      data: Partial<OfflineState['cacheStatus'][keyof OfflineState['cacheStatus']]>;
    }>) => {
      const { type, data } = action.payload;
      state.cacheStatus[type] = { ...state.cacheStatus[type], ...data };
    },
    
    // Settings
    updateOfflineSettings: (state, action: PayloadAction<Partial<OfflineState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Pending actions
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(
        pendingAction => pendingAction.id !== action.payload
      );
    },
    
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const actionIndex = state.pendingActions.findIndex(
        pendingAction => pendingAction.id === action.payload
      );
      
      if (actionIndex !== -1) {
        state.pendingActions[actionIndex].retryCount += 1;
      }
    },
    
    // Sync status
    setSyncStatus: (state, action: PayloadAction<OfflineState['syncStatus']>) => {
      state.syncStatus = action.payload;
      if (action.payload !== 'error') {
        state.syncError = null;
      }
    },
    
    setSyncError: (state, action: PayloadAction<string>) => {
      state.syncStatus = 'error';
      state.syncError = action.payload;
    },
    
    // Reset state
    resetOffline: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize offline
    builder
      .addCase(initializeOffline.pending, (state) => {
        state.syncStatus = 'syncing';
        state.syncError = null;
      })
      .addCase(initializeOffline.fulfilled, (state, action) => {
        state.syncStatus = 'success';
        state.cacheStatus = action.payload.cacheStatus;
        state.pendingActions = action.payload.pendingActions;
      })
      .addCase(initializeOffline.rejected, (state, action) => {
        state.syncStatus = 'error';
        state.syncError = action.payload as string;
      });

    // Sync data
    builder
      .addCase(syncOfflineData.pending, (state) => {
        state.syncStatus = 'syncing';
        state.syncError = null;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.syncStatus = 'success';
        state.cacheStatus = action.payload.cacheStatus;
        state.pendingActions = action.payload.pendingActions;
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.syncStatus = 'error';
        state.syncError = action.payload as string;
      });

    // Clear cache
    builder
      .addCase(clearOfflineCache.fulfilled, (state, action) => {
        if (action.payload) {
          // Clear specific cache
          const cacheType = action.payload as keyof OfflineState['cacheStatus'];
          if (state.cacheStatus[cacheType]) {
            state.cacheStatus[cacheType] = {
              lastUpdated: null,
              count: 0,
              size: 0,
            } as any;
          }
        } else {
          // Clear all cache
          Object.keys(state.cacheStatus).forEach(key => {
            const cacheKey = key as keyof OfflineState['cacheStatus'];
            state.cacheStatus[cacheKey] = {
              lastUpdated: null,
              count: 0,
              size: 0,
            } as any;
          });
        }
      });

    // Add pending action
    builder
      .addCase(addPendingAction.fulfilled, (state, action) => {
        state.pendingActions.push(action.payload);
      });

    // Process pending actions
    builder
      .addCase(processPendingActions.fulfilled, (state, action) => {
        state.pendingActions = action.payload.remainingActions;
      });
  },
});

// Actions
export const {
  setNetworkStatus,
  updateCacheStatus,
  updateOfflineSettings,
  removePendingAction,
  incrementRetryCount,
  setSyncStatus,
  setSyncError,
  resetOffline,
} = offlineSlice.actions;

// Selectors
export const selectIsOnline = (state: { offline: OfflineState }) => state.offline.isOnline;
export const selectSyncStatus = (state: { offline: OfflineState }) => state.offline.syncStatus;
export const selectSyncError = (state: { offline: OfflineState }) => state.offline.syncError;
export const selectCacheStatus = (state: { offline: OfflineState }) => state.offline.cacheStatus;
export const selectPendingActions = (state: { offline: OfflineState }) => state.offline.pendingActions;
export const selectOfflineSettings = (state: { offline: OfflineState }) => state.offline.settings;
export const selectNetworkInfo = (state: { offline: OfflineState }) => state.offline.networkInfo;
export const selectLastOnlineTime = (state: { offline: OfflineState }) => state.offline.lastOnlineTime;

// Computed selectors
export const selectCanSync = (state: { offline: OfflineState }) => {
  const { isOnline, settings, networkInfo } = state.offline;
  
  if (!isOnline) return false;
  if (settings.syncOnWifiOnly && networkInfo.type !== 'wifi') return false;
  
  return true;
};

export const selectCacheSize = (state: { offline: OfflineState }) => {
  return Object.values(state.offline.cacheStatus).reduce(
    (total, cache) => total + (cache._size || 0),
    0
  );
};

export default offlineSlice.reducer;