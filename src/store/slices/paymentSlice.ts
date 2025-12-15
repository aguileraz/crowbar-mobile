/**
 * Payment Slice - Redux Toolkit
 * 
 * Gerencia estado de pagamentos no Redux
 * Integra com cartService para processar pagamentos
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartService } from '../../services/cartService';

export interface PaymentState {
  currentPayment: {
    orderId: string | null;
    method: 'credit_card' | 'pix' | 'boleto' | null;
    status: 'idle' | 'processing' | 'pending' | 'success' | 'failed' | null;
    paymentId: string | null;
    pixQrCode: string | null;
    boletoUrl: string | null;
    message: string | null;
    error: string | null;
  };
  paymentMethods: {
    credit_card: {
      enabled: boolean;
      brands: string[];
      max_installments: number;
    } | null;
    pix: {
      enabled: boolean;
      discount_percentage?: number;
    } | null;
    boleto: {
      enabled: boolean;
    } | null;
  } | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  currentPayment: {
    orderId: null,
    method: null,
    status: null,
    paymentId: null,
    pixQrCode: null,
    boletoUrl: null,
    message: null,
    error: null,
  },
  paymentMethods: null,
  isLoading: false,
  isProcessing: false,
  error: null,
};

/**
 * Processar pagamento
 */
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (
    {
      orderId,
      paymentData,
    }: {
      orderId: string;
      paymentData: {
        method: 'credit_card' | 'pix' | 'boleto';
        card_data?: {
          number: string;
          holder_name: string;
          expiry_month: string;
          expiry_year: string;
          cvv: string;
        };
        installments?: number;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await cartService.processPayment(orderId, paymentData);
      return {
        orderId,
        ...result,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Erro ao processar pagamento');
    }
  }
);

/**
 * Verificar status do pagamento
 */
export const checkPaymentStatus = createAsyncThunk(
  'payment/checkPaymentStatus',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const result = await cartService.checkPaymentStatus(orderId);
      return {
        orderId,
        ...result,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Erro ao verificar status do pagamento');
    }
  }
);

/**
 * Obter métodos de pagamento disponíveis
 */
export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const result = await cartService.getPaymentMethods();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Erro ao buscar métodos de pagamento');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPayment: (state) => {
      state.currentPayment = initialState.currentPayment;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
      if (state.currentPayment.status === 'failed') {
        state.currentPayment.status = null;
      }
    },
    resetPayment: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // processPayment
    builder
      .addCase(processPayment.pending, (state, action) => {
        state.isProcessing = true;
        state.currentPayment.orderId = action.meta.arg.orderId;
        state.currentPayment.method = action.meta.arg.paymentData.method;
        state.currentPayment.status = 'processing';
        state.currentPayment.error = null;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentPayment.status = action.payload.status === 'success' ? 'success' : 'pending';
        state.currentPayment.paymentId = action.payload.payment_id;
        state.currentPayment.pixQrCode = action.payload.pix_qr_code || null;
        state.currentPayment.boletoUrl = action.payload.boleto_url || null;
        state.currentPayment.message = action.payload.message || null;
        state.error = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.currentPayment.status = 'failed';
        state.currentPayment.error = action.payload as string;
        state.error = action.payload as string;
      });

    // checkPaymentStatus
    builder
      .addCase(checkPaymentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPayment.status = action.payload.status;
        state.currentPayment.paymentId = action.payload.payment_id;
        state.error = null;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchPaymentMethods
    builder
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentMethods = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPayment, clearError, resetPayment } = paymentSlice.actions;

// Selectors
export const selectCurrentPayment = (state: { payment: PaymentState }) => state.payment.currentPayment;
export const selectPaymentMethods = (state: { payment: PaymentState }) => state.payment.paymentMethods;
export const selectPaymentIsLoading = (state: { payment: PaymentState }) => state.payment.isLoading;
export const selectPaymentIsProcessing = (state: { payment: PaymentState }) => state.payment.isProcessing;
export const selectPaymentError = (state: { payment: PaymentState }) => state.payment.error;

export default paymentSlice.reducer;
