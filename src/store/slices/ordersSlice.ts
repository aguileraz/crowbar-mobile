import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/api';

/**
 * Redux Slice para gerenciamento de pedidos
 */

// Estado do slice
export interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastUpdated: number | null;
  filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

// Estado inicial
const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  lastUpdated: null,
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  },
};

// Async Thunks

/**
 * Buscar pedidos do usuário
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params: { page?: number; filters?: any } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, filters = {} } = params;
      const response = await orderService.getOrders(page, 20, filters);
      return {
        orders: response.data,
        pagination: response.pagination,
        page,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar pedidos');
    }
  }
);

/**
 * Buscar detalhes de um pedido
 */
export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const order = await orderService.getOrderById(orderId);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar detalhes do pedido');
    }
  }
);

/**
 * Cancelar pedido
 */
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }: { orderId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const order = await orderService.cancelOrder(orderId, reason);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao cancelar pedido');
    }
  }
);

/**
 * Recomprar pedido
 */
export const reorderOrder = createAsyncThunk(
  'orders/reorderOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const cart = await orderService.reorderOrder(orderId);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao recomprar pedido');
    }
  }
);

/**
 * Rastrear pedido
 */
export const trackOrder = createAsyncThunk(
  'orders/trackOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const tracking = await orderService.trackOrder(orderId);
      return { orderId, tracking };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao rastrear pedido');
    }
  }
);

/**
 * Avaliar pedido
 */
export const rateOrder = createAsyncThunk(
  'orders/rateOrder',
  async ({ orderId, rating, review }: { orderId: string; rating: number; review?: string }, { rejectWithValue }) => {
    try {
      const order = await orderService.rateOrder(orderId, rating, review);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao avaliar pedido');
    }
  }
);

// Slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Definir filtros
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    
    // Limpar filtros
    clearFilters: (state) => {
      state.filters = {};
    },
    
    // Limpar pedido atual
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    
    // Resetar estado
    resetOrders: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.page === 1) {
          // First page - replace
          state.orders = action.payload.orders;
        } else {
          // Additional pages - append
          state.orders = [...state.orders, ...action.payload.orders];
        }
        
        state.pagination = action.payload.pagination;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch order details
    builder
      .addCase(fetchOrderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;

        // Update order in list if exists
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isUpdating = false;

        // Update order in list
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }

        // Update current order if it's the same
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Reorder
    builder
      .addCase(reorderOrder.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(reorderOrder.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(reorderOrder.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Track order
    builder
      .addCase(trackOrder.fulfilled, (state, action) => {
        // Update order tracking info
        const index = state.orders.findIndex(order => order.id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index].tracking = action.payload.tracking;
        }

        if (state.currentOrder?.id === action.payload.orderId) {
          state.currentOrder.tracking = action.payload.tracking;
        }
      });

    // Rate order
    builder
      .addCase(rateOrder.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(rateOrder.fulfilled, (state, action) => {
        state.isUpdating = false;

        // Update order in list
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }

        // Update current order if it's the same
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(rateOrder.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearError,
  setFilters,
  clearFilters,
  clearCurrentOrder,
  resetOrders,
} = ordersSlice.actions;

// Selectors
export const selectOrders = (state: { orders: OrdersState }) => state.orders.orders;
export const selectCurrentOrder = (state: { orders: OrdersState }) => state.orders.currentOrder;
export const selectOrdersLoading = (state: { orders: OrdersState }) => state.orders.isLoading;
export const selectOrdersUpdating = (state: { orders: OrdersState }) => state.orders.isUpdating;
export const selectOrdersError = (state: { orders: OrdersState }) => state.orders.error;
export const selectOrdersFilters = (state: { orders: OrdersState }) => state.orders.filters;
export const selectOrdersPagination = (state: { orders: OrdersState }) => state.orders.pagination;

export default ordersSlice.reducer;