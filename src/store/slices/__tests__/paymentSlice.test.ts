/**
 * Testes Unitários - paymentSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de pagamentos Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, processPayment, checkPaymentStatus, fetchPaymentMethods, selectors
 */

import paymentReducer, {
  PaymentState,
  processPayment,
  checkPaymentStatus,
  fetchPaymentMethods,
  clearPayment,
  clearError,
  resetPayment,
  selectCurrentPayment,
  selectPaymentMethods,
  selectPaymentIsLoading,
  selectPaymentIsProcessing,
  selectPaymentError,
} from '../paymentSlice';
import { configureStore } from '@reduxjs/toolkit';

// Mock do serviço
jest.mock('../../../services/cartService');

import { cartService } from '../../../services/cartService';

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ payment: PaymentState }>) => {
  return configureStore({
    reducer: {
      payment: paymentReducer,
    },
    preloadedState,
  });
};

describe('paymentSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = paymentReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
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
      });
    });
  });

  // ============================================
  // 2. REDUCERS SÍNCRONOS
  // ============================================
  describe('Reducers Síncronos', () => {
    it('deve limpar pagamento atual', () => {
      const initialState: PaymentState = {
        currentPayment: {
          orderId: 'order-123',
          method: 'pix',
          status: 'pending',
          paymentId: 'pay-123',
          pixQrCode: 'qr-code-123',
          boletoUrl: null,
          message: 'Aguardando pagamento',
          error: null,
        },
        paymentMethods: null,
        isLoading: false,
        isProcessing: false,
        error: null,
      };

      const state = paymentReducer(initialState, clearPayment());

      expect(state.currentPayment.orderId).toBeNull();
      expect(state.currentPayment.method).toBeNull();
      expect(state.currentPayment.status).toBeNull();
      expect(state.error).toBeNull();
    });

    it('deve limpar erro', () => {
      const initialState: PaymentState = {
        currentPayment: {
          orderId: 'order-123',
          method: 'credit_card',
          status: 'failed',
          paymentId: null,
          pixQrCode: null,
          boletoUrl: null,
          message: null,
          error: 'Erro ao processar',
        },
        paymentMethods: null,
        isLoading: false,
        isProcessing: false,
        error: 'Erro ao processar',
      };

      const state = paymentReducer(initialState, clearError());

      expect(state.error).toBeNull();
      expect(state.currentPayment.status).toBeNull();
    });

    it('deve resetar pagamento completamente', () => {
      const initialState: PaymentState = {
        currentPayment: {
          orderId: 'order-123',
          method: 'pix',
          status: 'pending',
          paymentId: 'pay-123',
          pixQrCode: 'qr-code',
          boletoUrl: null,
          message: 'Test',
          error: null,
        },
        paymentMethods: {
          credit_card: { enabled: true, brands: ['visa'], max_installments: 12 },
          pix: { enabled: true },
          boleto: { enabled: true },
        },
        isLoading: true,
        isProcessing: true,
        error: 'Error',
      };

      const state = paymentReducer(initialState, resetPayment());

      expect(state).toEqual({
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
      });
    });
  });

  // ============================================
  // 3. ASYNC THUNKS - processPayment
  // ============================================
  describe('processPayment', () => {
    it('deve processar pagamento PIX com sucesso', async () => {
      const store = createTestStore();

      const mockResponse = {
        status: 'pending',
        payment_id: 'pix-123',
        pix_qr_code: 'data:image/png;base64,abc123',
        message: 'Pagamento PIX pendente',
      };

      (cartService.processPayment as jest.Mock).mockResolvedValue(mockResponse);

      await store.dispatch(
        processPayment({
          orderId: 'order-123',
          paymentData: { method: 'pix' },
        })
      );

      const state = store.getState().payment;
      expect(state.currentPayment.status).toBe('pending');
      expect(state.currentPayment.paymentId).toBe('pix-123');
      expect(state.currentPayment.pixQrCode).toBe('data:image/png;base64,abc123');
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
    });

    it('deve processar pagamento cartão com sucesso', async () => {
      const store = createTestStore();

      const mockResponse = {
        status: 'success',
        payment_id: 'card-456',
        message: 'Pagamento aprovado',
      };

      (cartService.processPayment as jest.Mock).mockResolvedValue(mockResponse);

      await store.dispatch(
        processPayment({
          orderId: 'order-123',
          paymentData: {
            method: 'credit_card',
            card_data: {
              number: '4111111111111111',
              holder_name: 'TEST USER',
              expiry_month: '12',
              expiry_year: '2025',
              cvv: '123',
            },
            installments: 1,
          },
        })
      );

      const state = store.getState().payment;
      expect(state.currentPayment.status).toBe('success');
      expect(state.currentPayment.paymentId).toBe('card-456');
      expect(state.isProcessing).toBe(false);
    });

    it('deve tratar erro ao processar pagamento', async () => {
      const store = createTestStore();

      const mockError = new Error('Cartão recusado');
      (cartService.processPayment as jest.Mock).mockRejectedValue(mockError);

      await store.dispatch(
        processPayment({
          orderId: 'order-123',
          paymentData: { method: 'credit_card', card_data: {} as any },
        })
      );

      const state = store.getState().payment;
      expect(state.currentPayment.status).toBe('failed');
      expect(state.error).toBe('Cartão recusado');
      expect(state.isProcessing).toBe(false);
    });

    it('deve atualizar estado para processing durante processamento', async () => {
      const store = createTestStore();

      // Criar promise que não resolve imediatamente
      let resolvePayment: (value: any) => void;
      const paymentPromise = new Promise((resolve) => {
        resolvePayment = resolve;
      });

      (cartService.processPayment as jest.Mock).mockReturnValue(paymentPromise);

      const dispatchPromise = store.dispatch(
        processPayment({
          orderId: 'order-123',
          paymentData: { method: 'pix' },
        })
      );

      // Verificar estado durante processamento
      let state = store.getState().payment;
      expect(state.isProcessing).toBe(true);
      expect(state.currentPayment.status).toBe('processing');
      expect(state.currentPayment.orderId).toBe('order-123');
      expect(state.currentPayment.method).toBe('pix');

      // Resolver promise
      resolvePayment!({
        status: 'pending',
        payment_id: 'pix-123',
        pix_qr_code: 'qr-code',
      });

      await dispatchPromise;

      state = store.getState().payment;
      expect(state.isProcessing).toBe(false);
      expect(state.currentPayment.status).toBe('pending');
    });
  });

  // ============================================
  // 4. ASYNC THUNKS - checkPaymentStatus
  // ============================================
  describe('checkPaymentStatus', () => {
    it('deve verificar status de pagamento pendente', async () => {
      const store = createTestStore();

      const mockResponse = {
        status: 'pending',
        payment_id: 'pay-123',
        updated_at: '2025-01-23T10:00:00Z',
      };

      (cartService.checkPaymentStatus as jest.Mock).mockResolvedValue(mockResponse);

      await store.dispatch(checkPaymentStatus('order-123'));

      const state = store.getState().payment;
      expect(state.currentPayment.status).toBe('pending');
      expect(state.currentPayment.paymentId).toBe('pay-123');
      expect(state.isLoading).toBe(false);
    });

    it('deve verificar status de pagamento pago', async () => {
      const store = createTestStore();

      const mockResponse = {
        status: 'paid',
        payment_id: 'pay-456',
        updated_at: '2025-01-23T10:05:00Z',
      };

      (cartService.checkPaymentStatus as jest.Mock).mockResolvedValue(mockResponse);

      await store.dispatch(checkPaymentStatus('order-123'));

      const state = store.getState().payment;
      expect(state.currentPayment.status).toBe('paid');
      expect(state.isLoading).toBe(false);
    });

    it('deve tratar erro ao verificar status', async () => {
      const store = createTestStore();

      const mockError = new Error('Pedido não encontrado');
      (cartService.checkPaymentStatus as jest.Mock).mockRejectedValue(mockError);

      await store.dispatch(checkPaymentStatus('invalid-order'));

      const state = store.getState().payment;
      expect(state.error).toBe('Pedido não encontrado');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 5. ASYNC THUNKS - fetchPaymentMethods
  // ============================================
  describe('fetchPaymentMethods', () => {
    it('deve buscar métodos de pagamento disponíveis', async () => {
      const store = createTestStore();

      const mockResponse = {
        credit_card: {
          enabled: true,
          brands: ['visa', 'mastercard'],
          max_installments: 12,
        },
        pix: {
          enabled: true,
          discount_percentage: 5,
        },
        boleto: {
          enabled: true,
        },
      };

      (cartService.getPaymentMethods as jest.Mock).mockResolvedValue(mockResponse);

      await store.dispatch(fetchPaymentMethods());

      const state = store.getState().payment;
      expect(state.paymentMethods).toEqual(mockResponse);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('deve tratar erro ao buscar métodos de pagamento', async () => {
      const store = createTestStore();

      const mockError = new Error('Erro ao buscar métodos');
      (cartService.getPaymentMethods as jest.Mock).mockRejectedValue(mockError);

      await store.dispatch(fetchPaymentMethods());

      const state = store.getState().payment;
      expect(state.error).toBe('Erro ao buscar métodos');
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // 6. SELECTORS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      payment: {
        currentPayment: {
          orderId: 'order-123',
          method: 'pix',
          status: 'pending',
          paymentId: 'pay-123',
          pixQrCode: 'qr-code',
          boletoUrl: null,
          message: 'Aguardando pagamento',
          error: null,
        },
        paymentMethods: {
          credit_card: { enabled: true, brands: ['visa'], max_installments: 12 },
          pix: { enabled: true },
          boleto: { enabled: true },
        },
        isLoading: false,
        isProcessing: false,
        error: null,
      } as PaymentState,
    };

    it('selectCurrentPayment deve retornar pagamento atual', () => {
      expect(selectCurrentPayment(mockState)).toEqual(mockState.payment.currentPayment);
    });

    it('selectPaymentMethods deve retornar métodos disponíveis', () => {
      expect(selectPaymentMethods(mockState)).toEqual(mockState.payment.paymentMethods);
    });

    it('selectPaymentIsLoading deve retornar estado de loading', () => {
      expect(selectPaymentIsLoading(mockState)).toBe(false);
    });

    it('selectPaymentIsProcessing deve retornar estado de processamento', () => {
      expect(selectPaymentIsProcessing(mockState)).toBe(false);
    });

    it('selectPaymentError deve retornar erro', () => {
      expect(selectPaymentError(mockState)).toBeNull();
    });
  });
});
