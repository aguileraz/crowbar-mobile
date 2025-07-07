import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { realtimeService } from '../../services/realtimeService';

/**
 * Redux Slice para gerenciamento de funcionalidades de tempo real
 */

// Estado do slice
export interface RealtimeState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected: number | null;
  error: string | null;
  
  // Live updates
  liveBoxUpdates: {
    [boxId: string]: {
      stock: number;
      price: number;
      lastUpdated: number;
    };
  };
  
  // Order updates
  liveOrderUpdates: {
    [orderId: string]: {
      status: string;
      tracking?: any;
      lastUpdated: number;
    };
  };
  
  // Live events
  liveEvents: Array<{
    id: string;
    type: 'box_opened' | 'new_box' | 'stock_update' | 'promotion' | 'user_activity';
    data: any;
    timestamp: number;
  }>;
  
  // Online users
  onlineUsers: {
    count: number;
    users: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  };
  
  // Live statistics
  liveStats: {
    totalBoxesOpened: number;
    totalUsersOnline: number;
    recentOpenings: Array<{
      userId: string;
      userName: string;
      boxName: string;
      rareItems: string[];
      timestamp: number;
    }>;
  };
  
  // Settings
  settings: {
    enableLiveUpdates: boolean;
    enableStockUpdates: boolean;
    enableOrderUpdates: boolean;
    enableLiveEvents: boolean;
    maxEventsHistory: number;
  };
}

// Estado inicial
const initialState: RealtimeState = {
  isConnected: false,
  connectionStatus: 'disconnected',
  lastConnected: null,
  error: null,
  liveBoxUpdates: {},
  liveOrderUpdates: {},
  liveEvents: [],
  onlineUsers: {
    count: 0,
    users: [],
  },
  liveStats: {
    totalBoxesOpened: 0,
    totalUsersOnline: 0,
    recentOpenings: [],
  },
  settings: {
    enableLiveUpdates: true,
    enableStockUpdates: true,
    enableOrderUpdates: true,
    enableLiveEvents: true,
    maxEventsHistory: 50,
  },
};

// Async Thunks

/**
 * Conectar ao WebSocket
 */
export const connectRealtime = createAsyncThunk(
  'realtime/connect',
  async (_, { rejectWithValue }) => {
    try {
      await realtimeService.connect();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao conectar');
    }
  }
);

/**
 * Desconectar do WebSocket
 */
export const disconnectRealtime = createAsyncThunk(
  'realtime/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await realtimeService.disconnect();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao desconectar');
    }
  }
);

/**
 * Subscrever a atualizações de uma caixa
 */
export const subscribeToBox = createAsyncThunk(
  'realtime/subscribeToBox',
  async (boxId: string, { rejectWithValue }) => {
    try {
      await realtimeService.subscribeToBox(boxId);
      return boxId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao subscrever');
    }
  }
);

/**
 * Subscrever a atualizações de um pedido
 */
export const subscribeToOrder = createAsyncThunk(
  'realtime/subscribeToOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await realtimeService.subscribeToOrder(orderId);
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao subscrever');
    }
  }
);

// Slice
const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<'connecting' | 'connected' | 'disconnected' | 'error'>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
      
      if (action.payload === 'connected') {
        state.lastConnected = Date.now();
        state.error = null;
      }
    },
    
    // Connection error
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.connectionStatus = 'error';
      state.isConnected = false;
    },
    
    // Box updates
    updateBoxStock: (state, action: PayloadAction<{ boxId: string; stock: number; price?: number }>) => {
      const { boxId, stock, price } = action.payload;
      state.liveBoxUpdates[boxId] = {
        stock,
        price: price || state.liveBoxUpdates[boxId]?.price || 0,
        lastUpdated: Date.now(),
      };
    },
    
    // Order updates
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string; tracking?: any }>) => {
      const { orderId, status, tracking } = action.payload;
      state.liveOrderUpdates[orderId] = {
        status,
        tracking,
        lastUpdated: Date.now(),
      };
    },
    
    // Live events
    addLiveEvent: (state, action: PayloadAction<{
      id: string;
      type: 'box_opened' | 'new_box' | 'stock_update' | 'promotion' | 'user_activity';
      data: any;
    }>) => {
      const event = {
        ...action.payload,
        timestamp: Date.now(),
      };
      
      state.liveEvents.unshift(event);
      
      // Limit events history
      if (state.liveEvents.length > state.settings.maxEventsHistory) {
        state.liveEvents = state.liveEvents.slice(0, state.settings.maxEventsHistory);
      }
    },
    
    // Online users
    updateOnlineUsers: (state, action: PayloadAction<{
      count: number;
      users: Array<{ id: string; name: string; avatar?: string }>;
    }>) => {
      state.onlineUsers = action.payload;
      state.liveStats.totalUsersOnline = action.payload.count;
    },
    
    // Live statistics
    updateLiveStats: (state, action: PayloadAction<{
      totalBoxesOpened?: number;
      recentOpenings?: Array<{
        userId: string;
        userName: string;
        boxName: string;
        rareItems: string[];
        timestamp: number;
      }>;
    }>) => {
      if (action.payload.totalBoxesOpened !== undefined) {
        state.liveStats.totalBoxesOpened = action.payload.totalBoxesOpened;
      }
      
      if (action.payload.recentOpenings) {
        state.liveStats.recentOpenings = action.payload.recentOpenings;
      }
    },
    
    // Settings
    updateSettings: (state, action: PayloadAction<Partial<RealtimeState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Clear events
    clearLiveEvents: (state) => {
      state.liveEvents = [];
    },
    
    // Clear box updates
    clearBoxUpdates: (state) => {
      state.liveBoxUpdates = {};
    },
    
    // Clear order updates
    clearOrderUpdates: (state) => {
      state.liveOrderUpdates = {};
    },
    
    // Reset state
    resetRealtime: () => initialState,
  },
  extraReducers: (builder) => {
    // Connect
    builder
      .addCase(connectRealtime.pending, (state) => {
        state.connectionStatus = 'connecting';
        state.error = null;
      })
      .addCase(connectRealtime.fulfilled, (state) => {
        state.connectionStatus = 'connected';
        state.isConnected = true;
        state.lastConnected = Date.now();
        state.error = null;
      })
      .addCase(connectRealtime.rejected, (state, action) => {
        state.connectionStatus = 'error';
        state.isConnected = false;
        state.error = action.payload as string;
      });

    // Disconnect
    builder
      .addCase(disconnectRealtime.fulfilled, (state) => {
        state.connectionStatus = 'disconnected';
        state.isConnected = false;
      });
  },
});

// Actions
export const {
  setConnectionStatus,
  setConnectionError,
  updateBoxStock,
  updateOrderStatus,
  addLiveEvent,
  updateOnlineUsers,
  updateLiveStats,
  updateSettings,
  clearLiveEvents,
  clearBoxUpdates,
  clearOrderUpdates,
  resetRealtime,
} = realtimeSlice.actions;

// Selectors
export const selectIsConnected = (state: { realtime: RealtimeState }) => state.realtime.isConnected;
export const selectConnectionStatus = (state: { realtime: RealtimeState }) => state.realtime.connectionStatus;
export const selectRealtimeError = (state: { realtime: RealtimeState }) => state.realtime.error;
export const selectLiveBoxUpdates = (state: { realtime: RealtimeState }) => state.realtime.liveBoxUpdates;
export const selectLiveOrderUpdates = (state: { realtime: RealtimeState }) => state.realtime.liveOrderUpdates;
export const selectLiveEvents = (state: { realtime: RealtimeState }) => state.realtime.liveEvents;
export const selectOnlineUsers = (state: { realtime: RealtimeState }) => state.realtime.onlineUsers;
export const selectLiveStats = (state: { realtime: RealtimeState }) => state.realtime.liveStats;
export const selectRealtimeSettings = (state: { realtime: RealtimeState }) => state.realtime.settings;

// Specific selectors
export const selectBoxStock = (boxId: string) => (state: { realtime: RealtimeState }) => 
  state.realtime.liveBoxUpdates[boxId];

export const selectOrderStatus = (orderId: string) => (state: { realtime: RealtimeState }) => 
  state.realtime.liveOrderUpdates[orderId];

export default realtimeSlice.reducer;
