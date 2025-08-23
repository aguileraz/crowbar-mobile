import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartService } from '../../services/cartService';
import {
  Cart,
  _CartItem,
} from '../../types/api';

/**
 * Redux Slice para gerenciamento do carrinho
 */

// Estado do slice
export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  appliedCoupon: string | null;
  shippingOptions: Array<{
    id: string;
    name: string;
    price: number;
    estimated_days: number;
    description?: string;
  }>;
  selectedShippingOption: string | null;
  lastUpdated: number | null;
}

// Estado inicial
const initialState: CartState = {
  cart: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  appliedCoupon: null,
  shippingOptions: [],
  selectedShippingOption: null,
  lastUpdated: null,
};

// Async Thunks

/**
 * Buscar carrinho atual
 */
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartService.getCart();
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar carrinho');
    }
  }
);

/**
 * Adicionar item ao carrinho
 */
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ boxId, quantity }: { boxId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const cart = await cartService.addToCart(boxId, quantity);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao adicionar ao carrinho');
    }
  }
);

/**
 * Atualizar quantidade de item
 */
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const cart = await cartService.updateCartItem(itemId, quantity);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar item');
    }
  }
);

/**
 * Remover item do carrinho
 */
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const cart = await cartService.removeFromCart(itemId);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao remover item');
    }
  }
);

/**
 * Limpar carrinho
 */
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao limpar carrinho');
    }
  }
);

/**
 * Aplicar cupom
 */
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (code: string, { rejectWithValue }) => {
    try {
      const cart = await cartService.applyCoupon(code);
      return { cart, code };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao aplicar cupom');
    }
  }
);

/**
 * Remover cupom
 */
export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartService.removeCoupon();
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao remover cupom');
    }
  }
);

/**
 * Calcular frete
 */
export const calculateShipping = createAsyncThunk(
  'cart/calculateShipping',
  async (addressId: string, { rejectWithValue }) => {
    try {
      const _response = await cartService.calculateShipping(addressId);
      return response.options;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao calcular frete');
    }
  }
);

/**
 * Calcular frete por CEP
 */
export const calculateShippingByZip = createAsyncThunk(
  'cart/calculateShippingByZip',
  async (zipCode: string, { rejectWithValue }) => {
    try {
      const _response = await cartService.calculateShippingByZip(zipCode);
      return response.options;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao calcular frete');
    }
  }
);

/**
 * Validar cupom
 */
export const validateCoupon = createAsyncThunk(
  'cart/validateCoupon',
  async (code: string, { rejectWithValue }) => {
    try {
      const _result = await cartService.validateCoupon(code);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao validar cupom');
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Definir opção de frete selecionada
    setSelectedShippingOption: (state, action: PayloadAction<string>) => {
      state.selectedShippingOption = action.payload;
    },
    
    // Limpar opções de frete
    clearShippingOptions: (state) => {
      state.shippingOptions = [];
      state.selectedShippingOption = null;
    },
    
    // Resetar estado
    resetCart: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Clear cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isUpdating = false;
        state.cart = null;
        state.appliedCoupon = null;
        state.shippingOptions = [];
        state.selectedShippingOption = null;
        state.lastUpdated = Date.now();
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Apply coupon
    builder
      .addCase(applyCoupon.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.cart = action.payload.cart;
        state.appliedCoupon = action.payload.code;
        state.lastUpdated = Date.now();
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Remove coupon
    builder
      .addCase(removeCoupon.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.cart = action.payload;
        state.appliedCoupon = null;
        state.lastUpdated = Date.now();
      })
      .addCase(removeCoupon.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Calculate shipping
    builder
      .addCase(calculateShipping.fulfilled, (state, action) => {
        state.shippingOptions = action.payload;
      })
      .addCase(calculateShippingByZip.fulfilled, (state, action) => {
        state.shippingOptions = action.payload;
      });
  },
});

// Actions
export const { setSelectedShippingOption, clearShippingOptions, resetCart,  } = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.cart?.items || [];
export const selectCartTotal = (state: { cart: CartState }) => state.cart.cart?.total || 0;
export const selectCartSubtotal = (state: { cart: CartState }) => state.cart.cart?.subtotal || 0;
export const selectCartItemsCount = (state: { cart: CartState }) => state.cart.cart?.total_items || 0;
export const selectCartIsLoading = (state: { cart: CartState }) => state.cart.isLoading;
export const selectCartIsUpdating = (state: { cart: CartState }) => state.cart.isUpdating;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectAppliedCoupon = (state: { cart: CartState }) => state.cart.appliedCoupon;
export const selectShippingOptions = (state: { cart: CartState }) => state.cart.shippingOptions;
export const selectSelectedShippingOption = (state: { cart: CartState }) => state.cart.selectedShippingOption;

export default cartSlice.reducer;