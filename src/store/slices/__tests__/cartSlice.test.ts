/**
 * Testes Unitários - cartSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de carrinho Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, adicionar/remover/atualizar items, cupons, frete, selectors
 */

import cartReducer, {
  CartState,
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  calculateShipping,
  calculateShippingByZip,
  validateCoupon,
  clearError,
  setSelectedShippingOption,
  clearShippingOptions,
  resetCart,
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartSubtotal,
  selectCartItemsCount,
  selectCartIsLoading,
  selectCartIsUpdating,
  selectCartError,
  selectAppliedCoupon,
  selectShippingOptions,
  selectSelectedShippingOption,
} from '../cartSlice';
import { configureStore } from '@reduxjs/toolkit';
import { Cart } from '../../../types/api';

// Mock do serviço
jest.mock('../../../services/cartService');

import { cartService } from '../../../services/cartService';

// Helper para criar mock cart
const createMockCart = (overrides?: Partial<Cart>): Cart => ({
  id: 'cart-123',
  user_id: 'user-123',
  items: [
    {
      id: 'item-1',
      box_id: 'box-1',
      quantity: 2,
      price: 50.0,
      subtotal: 100.0,
      box: {
        id: 'box-1',
        name: 'Mystery Box 1',
        price: 50.0,
        image_url: 'https://example.com/box1.jpg',
      },
    },
  ],
  subtotal: 100.0,
  discount: 10.0,
  shipping: 15.0,
  total: 105.0,
  total_items: 2,
  coupon_code: null,
  created_at: '2025-11-11T00:00:00Z',
  updated_at: '2025-11-11T00:00:00Z',
  ...overrides,
});

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ cart: CartState }>) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState,
  });
};

describe('cartSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = cartReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
        cart: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        appliedCoupon: null,
        shippingOptions: [],
        selectedShippingOption: null,
        lastUpdated: null,
      });
    });

    it('deve ter cart como null no estado inicial', () => {
      const state = cartReducer(undefined, { type: '@@INIT' });
      expect(state.cart).toBeNull();
    });

    it('deve ter arrays vazios para shippingOptions no estado inicial', () => {
      const state = cartReducer(undefined, { type: '@@INIT' });
      expect(state.shippingOptions).toEqual([]);
    });

    it('deve ter loading flags como false no estado inicial', () => {
      const state = cartReducer(undefined, { type: '@@INIT' });
      expect(state.isLoading).toBe(false);
      expect(state.isUpdating).toBe(false);
    });
  });

  // ============================================
  // 2. FETCH CART TESTS
  // ============================================
  describe('Buscar Carrinho (fetchCart)', () => {
    it('deve definir isLoading como true quando fetch está pendente', () => {
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

      const nextState = cartReducer(initialState, fetchCart.pending('', undefined));

      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar cart e lastUpdated quando fetch é bem-sucedido', async () => {
      const mockCart = createMockCart();
      (cartService.getCart as jest.Mock).mockResolvedValue(mockCart);

      const beforeTime = Date.now();
      const store = createTestStore();
      await store.dispatch(fetchCart());
      const afterTime = Date.now();

      const state = store.getState().cart;

      expect(state.isLoading).toBe(false);
      expect(state.cart).toEqual(mockCart);
      expect(state.lastUpdated).not.toBeNull();
      expect(state.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastUpdated).toBeLessThanOrEqual(afterTime);
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando fetch falha', async () => {
      (cartService.getCart as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      const store = createTestStore();
      await store.dispatch(fetchCart());

      const state = store.getState().cart;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Fetch failed');
      expect(state.cart).toBeNull();
    });

    it('deve usar mensagem de erro personalizada quando fornecida', async () => {
      const error = new Error('Custom error message');
      (cartService.getCart as jest.Mock).mockRejectedValue(error);

      const store = createTestStore();
      await store.dispatch(fetchCart());

      const state = store.getState().cart;

      expect(state.error).toBe('Custom error message');
    });
  });

  // ============================================
  // 3. ADD TO CART TESTS
  // ============================================
  describe('Adicionar ao Carrinho (addToCart)', () => {
    it('deve definir isUpdating como true quando add está pendente', () => {
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

      const nextState = cartReducer(
        initialState,
        addToCart.pending('', { boxId: 'box-1', quantity: 1 })
      );

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar cart com novo item quando add é bem-sucedido', async () => {
      const mockCart = createMockCart();
      (cartService.addToCart as jest.Mock).mockResolvedValue(mockCart);

      const store = createTestStore();
      await store.dispatch(addToCart({ boxId: 'box-1', quantity: 2 }));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.cart).toEqual(mockCart);
      expect(state.lastUpdated).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando add falha', async () => {
      (cartService.addToCart as jest.Mock).mockRejectedValue(
        new Error('Add to cart failed')
      );

      const store = createTestStore();
      await store.dispatch(addToCart({ boxId: 'box-1', quantity: 1 }));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Add to cart failed');
    });

    it('deve usar mensagem padrão quando erro não tem mensagem', async () => {
      (cartService.addToCart as jest.Mock).mockRejectedValue({});

      const store = createTestStore();
      await store.dispatch(addToCart({ boxId: 'box-1', quantity: 1 }));

      const state = store.getState().cart;

      expect(state.error).toBe('Erro ao adicionar ao carrinho');
    });
  });

  // ============================================
  // 4. UPDATE CART ITEM TESTS
  // ============================================
  describe('Atualizar Item (updateCartItem)', () => {
    it('deve definir isUpdating como true quando update está pendente', () => {
      const initialState: CartState = {
        cart: createMockCart(),
        isLoading: false,
        isUpdating: false,
        error: null,
        appliedCoupon: null,
        shippingOptions: [],
        selectedShippingOption: null,
        lastUpdated: Date.now(),
      };

      const nextState = cartReducer(
        initialState,
        updateCartItem.pending('', { itemId: 'item-1', quantity: 3 })
      );

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar cart quando quantity é alterada', async () => {
      const updatedCart = createMockCart({
        items: [
          {
            id: 'item-1',
            box_id: 'box-1',
            quantity: 3,
            price: 50.0,
            subtotal: 150.0,
            box: {
              id: 'box-1',
              name: 'Mystery Box 1',
              price: 50.0,
              image_url: 'https://example.com/box1.jpg',
            },
          },
        ],
        subtotal: 150.0,
        total: 155.0,
        total_items: 3,
      });

      (cartService.updateCartItem as jest.Mock).mockResolvedValue(updatedCart);

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(updateCartItem({ itemId: 'item-1', quantity: 3 }));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.cart?.items[0].quantity).toBe(3);
      expect(state.cart?.total_items).toBe(3);
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando update falha', async () => {
      (cartService.updateCartItem as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(updateCartItem({ itemId: 'item-1', quantity: 3 }));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Update failed');
    });
  });

  // ============================================
  // 5. REMOVE FROM CART TESTS
  // ============================================
  describe('Remover do Carrinho (removeFromCart)', () => {
    it('deve definir isUpdating como true quando remove está pendente', () => {
      const initialState: CartState = {
        cart: createMockCart(),
        isLoading: false,
        isUpdating: false,
        error: null,
        appliedCoupon: null,
        shippingOptions: [],
        selectedShippingOption: null,
        lastUpdated: Date.now(),
      };

      const nextState = cartReducer(initialState, removeFromCart.pending('', 'item-1'));

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar cart removendo item quando remove é bem-sucedido', async () => {
      const cartWithoutItem = createMockCart({
        items: [],
        subtotal: 0,
        total: 15.0, // apenas frete
        total_items: 0,
      });

      (cartService.removeFromCart as jest.Mock).mockResolvedValue(cartWithoutItem);

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(removeFromCart('item-1'));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.cart?.items).toHaveLength(0);
      expect(state.cart?.total_items).toBe(0);
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando remove falha', async () => {
      (cartService.removeFromCart as jest.Mock).mockRejectedValue(
        new Error('Remove failed')
      );

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(removeFromCart('item-1'));

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Remove failed');
    });
  });

  // ============================================
  // 6. CLEAR CART TESTS
  // ============================================
  describe('Limpar Carrinho (clearCart)', () => {
    it('deve definir isUpdating como true quando clear está pendente', () => {
      const initialState: CartState = {
        cart: createMockCart(),
        isLoading: false,
        isUpdating: false,
        error: null,
        appliedCoupon: 'COUPON10',
        shippingOptions: [
          { id: 'ship-1', name: 'Express', price: 20, estimated_days: 2 },
        ],
        selectedShippingOption: 'ship-1',
        lastUpdated: Date.now(),
      };

      const nextState = cartReducer(initialState, clearCart.pending('', undefined));

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve limpar cart e dados relacionados quando clear é bem-sucedido', async () => {
      (cartService.clearCart as jest.Mock).mockResolvedValue(undefined);

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: 'COUPON10',
          shippingOptions: [
            { id: 'ship-1', name: 'Express', price: 20, estimated_days: 2 },
          ],
          selectedShippingOption: 'ship-1',
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(clearCart());

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.cart).toBeNull();
      expect(state.appliedCoupon).toBeNull();
      expect(state.shippingOptions).toEqual([]);
      expect(state.selectedShippingOption).toBeNull();
      expect(state.lastUpdated).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando clear falha', async () => {
      (cartService.clearCart as jest.Mock).mockRejectedValue(new Error('Clear failed'));

      const store = createTestStore({
        cart: {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        },
      });

      await store.dispatch(clearCart());

      const state = store.getState().cart;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Clear failed');
    });
  });

  // ============================================
  // 7. COUPON TESTS (applyCoupon, removeCoupon, validateCoupon)
  // ============================================
  describe('Operações de Cupom', () => {
    describe('Aplicar Cupom (applyCoupon)', () => {
      it('deve definir isUpdating como true quando apply está pendente', () => {
        const initialState: CartState = {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, applyCoupon.pending('', 'COUPON10'));

        expect(nextState.isUpdating).toBe(true);
        expect(nextState.error).toBeNull();
      });

      it('deve atualizar cart e appliedCoupon quando cupom é aplicado', async () => {
        const cartWithCoupon = createMockCart({
          discount: 20.0,
          total: 95.0, // 115 - 20
          coupon_code: 'COUPON10',
        });

        (cartService.applyCoupon as jest.Mock).mockResolvedValue(cartWithCoupon);

        const store = createTestStore({
          cart: {
            cart: createMockCart(),
            isLoading: false,
            isUpdating: false,
            error: null,
            appliedCoupon: null,
            shippingOptions: [],
            selectedShippingOption: null,
            lastUpdated: Date.now(),
          },
        });

        await store.dispatch(applyCoupon('COUPON10'));

        const state = store.getState().cart;

        expect(state.isUpdating).toBe(false);
        expect(state.cart).toEqual(cartWithCoupon);
        expect(state.appliedCoupon).toBe('COUPON10');
        expect(state.lastUpdated).not.toBeNull();
        expect(state.error).toBeNull();
      });

      it('deve definir erro quando cupom inválido', async () => {
        (cartService.applyCoupon as jest.Mock).mockRejectedValue(
          new Error('Cupom inválido')
        );

        const store = createTestStore({
          cart: {
            cart: createMockCart(),
            isLoading: false,
            isUpdating: false,
            error: null,
            appliedCoupon: null,
            shippingOptions: [],
            selectedShippingOption: null,
            lastUpdated: Date.now(),
          },
        });

        await store.dispatch(applyCoupon('INVALID'));

        const state = store.getState().cart;

        expect(state.isUpdating).toBe(false);
        expect(state.error).toBe('Cupom inválido');
      });
    });

    describe('Remover Cupom (removeCoupon)', () => {
      it('deve definir isUpdating como true quando remove está pendente', () => {
        const initialState: CartState = {
          cart: createMockCart({ coupon_code: 'COUPON10' }),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: 'COUPON10',
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, removeCoupon.pending('', undefined));

        expect(nextState.isUpdating).toBe(true);
        expect(nextState.error).toBeNull();
      });

      it('deve remover cupom e atualizar cart quando remove é bem-sucedido', async () => {
        const cartWithoutCoupon = createMockCart({
          discount: 0,
          total: 115.0,
          coupon_code: null,
        });

        (cartService.removeCoupon as jest.Mock).mockResolvedValue(cartWithoutCoupon);

        const store = createTestStore({
          cart: {
            cart: createMockCart({ coupon_code: 'COUPON10' }),
            isLoading: false,
            isUpdating: false,
            error: null,
            appliedCoupon: 'COUPON10',
            shippingOptions: [],
            selectedShippingOption: null,
            lastUpdated: Date.now(),
          },
        });

        await store.dispatch(removeCoupon());

        const state = store.getState().cart;

        expect(state.isUpdating).toBe(false);
        expect(state.cart).toEqual(cartWithoutCoupon);
        expect(state.appliedCoupon).toBeNull();
        expect(state.lastUpdated).not.toBeNull();
        expect(state.error).toBeNull();
      });

      it('deve definir erro quando remove falha', async () => {
        (cartService.removeCoupon as jest.Mock).mockRejectedValue(
          new Error('Remove coupon failed')
        );

        const store = createTestStore({
          cart: {
            cart: createMockCart({ coupon_code: 'COUPON10' }),
            isLoading: false,
            isUpdating: false,
            error: null,
            appliedCoupon: 'COUPON10',
            shippingOptions: [],
            selectedShippingOption: null,
            lastUpdated: Date.now(),
          },
        });

        await store.dispatch(removeCoupon());

        const state = store.getState().cart;

        expect(state.isUpdating).toBe(false);
        expect(state.error).toBe('Remove coupon failed');
      });
    });

    describe('Validar Cupom (validateCoupon)', () => {
      it('deve retornar resultado de validação', async () => {
        const validationResult = {
          valid: true,
          discount: 20,
          message: 'Cupom válido',
        };

        (cartService.validateCoupon as jest.Mock).mockResolvedValue(validationResult);

        const store = createTestStore();
        const result = await store.dispatch(validateCoupon('COUPON10'));

        expect(result.payload).toEqual(validationResult);
      });

      it('deve definir erro quando validação falha', async () => {
        (cartService.validateCoupon as jest.Mock).mockRejectedValue(
          new Error('Validation failed')
        );

        const store = createTestStore();
        const result = await store.dispatch(validateCoupon('INVALID'));

        expect(result.payload).toBe('Validation failed');
      });
    });
  });

  // ============================================
  // 8. SHIPPING TESTS (calculateShipping, calculateShippingByZip)
  // ============================================
  describe('Operações de Frete', () => {
    const mockShippingOptions = [
      { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
      { id: 'ship-2', name: 'Express', price: 20, estimated_days: 3 },
    ];

    describe('Calcular Frete por Endereço (calculateShipping)', () => {
      it('deve atualizar shippingOptions quando cálculo é bem-sucedido', async () => {
        (cartService.calculateShipping as jest.Mock).mockResolvedValue({
          options: mockShippingOptions,
        });

        const store = createTestStore();
        await store.dispatch(calculateShipping('address-123'));

        const state = store.getState().cart;

        expect(state.shippingOptions).toEqual(mockShippingOptions);
      });

      it('deve definir erro quando cálculo falha', async () => {
        (cartService.calculateShipping as jest.Mock).mockRejectedValue(
          new Error('Shipping calculation failed')
        );

        const store = createTestStore();
        await store.dispatch(calculateShipping('address-123'));

        const state = store.getState().cart;

        expect(state.error).toBe('Shipping calculation failed');
      });
    });

    describe('Calcular Frete por CEP (calculateShippingByZip)', () => {
      it('deve atualizar shippingOptions quando cálculo é bem-sucedido', async () => {
        (cartService.calculateShippingByZip as jest.Mock).mockResolvedValue({
          options: mockShippingOptions,
        });

        const store = createTestStore();
        await store.dispatch(calculateShippingByZip('12345-678'));

        const state = store.getState().cart;

        expect(state.shippingOptions).toEqual(mockShippingOptions);
      });

      it('deve definir erro quando cálculo falha', async () => {
        (cartService.calculateShippingByZip as jest.Mock).mockRejectedValue(
          new Error('Invalid zip code')
        );

        const store = createTestStore();
        await store.dispatch(calculateShippingByZip('invalid'));

        const state = store.getState().cart;

        expect(state.error).toBe('Invalid zip code');
      });
    });
  });

  // ============================================
  // 9. SYNCHRONOUS REDUCERS TESTS
  // ============================================
  describe('Reducers Síncronos', () => {
    describe('clearError', () => {
      it('deve limpar erro do estado', () => {
        const initialState: CartState = {
          cart: null,
          isLoading: false,
          isUpdating: false,
          error: 'Algum erro',
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: null,
        };

        const nextState = cartReducer(initialState, clearError());

        expect(nextState.error).toBeNull();
      });
    });

    describe('setSelectedShippingOption', () => {
      it('deve definir opção de frete selecionada', () => {
        const initialState: CartState = {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [
            { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
            { id: 'ship-2', name: 'Express', price: 20, estimated_days: 3 },
          ],
          selectedShippingOption: null,
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, setSelectedShippingOption('ship-2'));

        expect(nextState.selectedShippingOption).toBe('ship-2');
      });

      it('deve permitir trocar opção de frete selecionada', () => {
        const initialState: CartState = {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [
            { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
            { id: 'ship-2', name: 'Express', price: 20, estimated_days: 3 },
          ],
          selectedShippingOption: 'ship-1',
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, setSelectedShippingOption('ship-2'));

        expect(nextState.selectedShippingOption).toBe('ship-2');
      });
    });

    describe('clearShippingOptions', () => {
      it('deve limpar opções de frete e seleção', () => {
        const initialState: CartState = {
          cart: createMockCart(),
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [
            { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
          ],
          selectedShippingOption: 'ship-1',
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, clearShippingOptions());

        expect(nextState.shippingOptions).toEqual([]);
        expect(nextState.selectedShippingOption).toBeNull();
      });
    });

    describe('resetCart', () => {
      it('deve resetar para o estado inicial', () => {
        const initialState: CartState = {
          cart: createMockCart(),
          isLoading: true,
          isUpdating: true,
          error: 'Error',
          appliedCoupon: 'COUPON10',
          shippingOptions: [
            { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
          ],
          selectedShippingOption: 'ship-1',
          lastUpdated: Date.now(),
        };

        const nextState = cartReducer(initialState, resetCart());

        expect(nextState).toEqual({
          cart: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          appliedCoupon: null,
          shippingOptions: [],
          selectedShippingOption: null,
          lastUpdated: null,
        });
      });
    });
  });

  // ============================================
  // 10. SELECTORS TESTS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      cart: {
        cart: createMockCart(),
        isLoading: false,
        isUpdating: true,
        error: 'Test error',
        appliedCoupon: 'COUPON10',
        shippingOptions: [
          { id: 'ship-1', name: 'Standard', price: 10, estimated_days: 7 },
        ],
        selectedShippingOption: 'ship-1',
        lastUpdated: 1234567890,
      },
    };

    it('selectCart deve retornar cart', () => {
      expect(selectCart(mockState)).toEqual(mockState.cart.cart);
    });

    it('selectCartItems deve retornar items do cart', () => {
      expect(selectCartItems(mockState)).toEqual(mockState.cart.cart!.items);
    });

    it('selectCartItems deve retornar array vazio quando cart é null', () => {
      const stateWithoutCart = {
        cart: {
          ...mockState.cart,
          cart: null,
        },
      };

      expect(selectCartItems(stateWithoutCart)).toEqual([]);
    });

    it('selectCartTotal deve retornar total do cart', () => {
      expect(selectCartTotal(mockState)).toBe(105.0);
    });

    it('selectCartTotal deve retornar 0 quando cart é null', () => {
      const stateWithoutCart = {
        cart: {
          ...mockState.cart,
          cart: null,
        },
      };

      expect(selectCartTotal(stateWithoutCart)).toBe(0);
    });

    it('selectCartSubtotal deve retornar subtotal do cart', () => {
      expect(selectCartSubtotal(mockState)).toBe(100.0);
    });

    it('selectCartItemsCount deve retornar total_items do cart', () => {
      expect(selectCartItemsCount(mockState)).toBe(2);
    });

    it('selectCartIsLoading deve retornar isLoading', () => {
      expect(selectCartIsLoading(mockState)).toBe(false);
    });

    it('selectCartIsUpdating deve retornar isUpdating', () => {
      expect(selectCartIsUpdating(mockState)).toBe(true);
    });

    it('selectCartError deve retornar erro', () => {
      expect(selectCartError(mockState)).toBe('Test error');
    });

    it('selectAppliedCoupon deve retornar cupom aplicado', () => {
      expect(selectAppliedCoupon(mockState)).toBe('COUPON10');
    });

    it('selectShippingOptions deve retornar opções de frete', () => {
      expect(selectShippingOptions(mockState)).toEqual(mockState.cart.shippingOptions);
    });

    it('selectSelectedShippingOption deve retornar opção selecionada', () => {
      expect(selectSelectedShippingOption(mockState)).toBe('ship-1');
    });
  });
});
