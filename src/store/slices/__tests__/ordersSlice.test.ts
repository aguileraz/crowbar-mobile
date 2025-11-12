/**
 * Testes Unitários - ordersSlice (Redux State Management)
 *
 * Testa o comportamento do reducer de pedidos Redux Toolkit,
 * incluindo async thunks, reducers síncronos e selectors.
 *
 * @coverage Estado inicial, fetch, cancel, track, rate, filters, pagination, selectors
 */

import ordersReducer, {
  OrdersState,
  fetchOrders,
  fetchOrderDetails,
  cancelOrder,
  reorderOrder,
  trackOrder,
  rateOrder,
  clearError,
  setFilters,
  clearFilters,
  clearCurrentOrder,
  resetOrders,
  selectOrders,
  selectCurrentOrder,
  selectOrdersLoading,
  selectOrdersUpdating,
  selectOrdersError,
  selectOrdersFilters,
  selectOrdersPagination,
} from '../ordersSlice';
import { configureStore } from '@reduxjs/toolkit';
import { Order } from '../../../types/api';

// Mock do serviço
jest.mock('../../../services/orderService');

import { orderService } from '../../../services/orderService';

// Helper para criar mock order
const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order-123',
  user_id: 'user-123',
  status: 'pending',
  total: 105.0,
  subtotal: 100.0,
  shipping: 15.0,
  discount: 10.0,
  items: [
    {
      id: 'item-1',
      box_id: 'box-1',
      quantity: 2,
      price: 50.0,
      subtotal: 100.0,
    },
  ],
  shipping_address: {
    street: 'Rua Teste',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '12345-678',
  },
  payment_method: 'credit_card',
  created_at: '2025-11-11T00:00:00Z',
  updated_at: '2025-11-11T00:00:00Z',
  ...overrides,
});

// Helper para criar store de teste
const createTestStore = (preloadedState?: Partial<{ orders: OrdersState }>) => {
  return configureStore({
    reducer: {
      orders: ordersReducer,
    },
    preloadedState,
  });
};

describe('ordersSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. INITIAL STATE TESTS
  // ============================================
  describe('Estado Inicial', () => {
    it('deve retornar o estado inicial correto', () => {
      const state = ordersReducer(undefined, { type: '@@INIT' });

      expect(state).toEqual({
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
      });
    });

    it('deve ter orders como array vazio no estado inicial', () => {
      const state = ordersReducer(undefined, { type: '@@INIT' });
      expect(state.orders).toEqual([]);
    });

    it('deve ter currentOrder como null no estado inicial', () => {
      const state = ordersReducer(undefined, { type: '@@INIT' });
      expect(state.currentOrder).toBeNull();
    });

    it('deve ter pagination inicializado corretamente', () => {
      const state = ordersReducer(undefined, { type: '@@INIT' });
      expect(state.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
      });
    });
  });

  // ============================================
  // 2. FETCH ORDERS TESTS
  // ============================================
  describe('Buscar Pedidos (fetchOrders)', () => {
    const mockPagination = {
      currentPage: 1,
      totalPages: 3,
      totalItems: 50,
      hasNextPage: true,
    };

    it('deve definir isLoading como true quando fetch está pendente', () => {
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

      const nextState = ordersReducer(
        initialState,
        fetchOrders.pending('', { page: 1 })
      );

      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve substituir orders quando page é 1', async () => {
      const mockOrders = [createMockOrder({ id: 'order-1' }), createMockOrder({ id: 'order-2' })];
      (orderService.getOrders as jest.Mock).mockResolvedValue({
        data: mockOrders,
        pagination: mockPagination,
      });

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'old-order' })],
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
        },
      });

      await store.dispatch(fetchOrders({ page: 1 }));

      const state = store.getState().orders;

      expect(state.isLoading).toBe(false);
      expect(state.orders).toEqual(mockOrders);
      expect(state.orders).toHaveLength(2);
      expect(state.pagination).toEqual(mockPagination);
      expect(state.lastUpdated).not.toBeNull();
    });

    it('deve anexar orders quando page > 1', async () => {
      const existingOrders = [createMockOrder({ id: 'order-1' })];
      const newOrders = [createMockOrder({ id: 'order-2' }), createMockOrder({ id: 'order-3' })];

      (orderService.getOrders as jest.Mock).mockResolvedValue({
        data: newOrders,
        pagination: { ...mockPagination, currentPage: 2 },
      });

      const store = createTestStore({
        orders: {
          orders: existingOrders,
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: mockPagination,
        },
      });

      await store.dispatch(fetchOrders({ page: 2 }));

      const state = store.getState().orders;

      expect(state.orders).toHaveLength(3);
      expect(state.orders[0].id).toBe('order-1');
      expect(state.orders[1].id).toBe('order-2');
      expect(state.orders[2].id).toBe('order-3');
    });

    it('deve aplicar filtros ao buscar pedidos', async () => {
      const filters = { status: 'delivered', dateFrom: '2025-01-01' };
      (orderService.getOrders as jest.Mock).mockResolvedValue({
        data: [createMockOrder()],
        pagination: mockPagination,
      });

      const store = createTestStore();
      await store.dispatch(fetchOrders({ page: 1, filters }));

      expect(orderService.getOrders).toHaveBeenCalledWith(1, 20, filters);
    });

    it('deve definir erro quando fetch falha', async () => {
      (orderService.getOrders as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      const store = createTestStore();
      await store.dispatch(fetchOrders({ page: 1 }));

      const state = store.getState().orders;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Fetch failed');
    });

    it('deve usar mensagem padrão quando erro não tem mensagem', async () => {
      (orderService.getOrders as jest.Mock).mockRejectedValue({});

      const store = createTestStore();
      await store.dispatch(fetchOrders());

      const state = store.getState().orders;

      expect(state.error).toBe('Erro ao buscar pedidos');
    });
  });

  // ============================================
  // 3. FETCH ORDER DETAILS TESTS
  // ============================================
  describe('Buscar Detalhes do Pedido (fetchOrderDetails)', () => {
    it('deve definir isLoading como true quando fetch details está pendente', () => {
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

      const nextState = ordersReducer(
        initialState,
        fetchOrderDetails.pending('', 'order-123')
      );

      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar currentOrder quando fetch é bem-sucedido', async () => {
      const mockOrder = createMockOrder();
      (orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder);

      const store = createTestStore();
      await store.dispatch(fetchOrderDetails('order-123'));

      const state = store.getState().orders;

      expect(state.isLoading).toBe(false);
      expect(state.currentOrder).toEqual(mockOrder);
      expect(state.error).toBeNull();
    });

    it('deve atualizar pedido na lista se existir', async () => {
      const existingOrder = createMockOrder({ id: 'order-123', status: 'pending' });
      const updatedOrder = createMockOrder({ id: 'order-123', status: 'confirmed' });

      (orderService.getOrderById as jest.Mock).mockResolvedValue(updatedOrder);

      const store = createTestStore({
        orders: {
          orders: [existingOrder, createMockOrder({ id: 'order-456' })],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(fetchOrderDetails('order-123'));

      const state = store.getState().orders;

      expect(state.orders[0].status).toBe('confirmed');
      expect(state.orders[1].id).toBe('order-456'); // não alterado
    });

    it('deve definir erro quando fetch details falha', async () => {
      (orderService.getOrderById as jest.Mock).mockRejectedValue(
        new Error('Order not found')
      );

      const store = createTestStore();
      await store.dispatch(fetchOrderDetails('order-123'));

      const state = store.getState().orders;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Order not found');
    });
  });

  // ============================================
  // 4. CANCEL ORDER TESTS
  // ============================================
  describe('Cancelar Pedido (cancelOrder)', () => {
    it('deve definir isUpdating como true quando cancel está pendente', () => {
      const initialState: OrdersState = {
        orders: [createMockOrder()],
        currentOrder: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
        filters: {},
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      const nextState = ordersReducer(
        initialState,
        cancelOrder.pending('', { orderId: 'order-123', reason: 'Changed my mind' })
      );

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar status do pedido na lista quando cancel é bem-sucedido', async () => {
      const cancelledOrder = createMockOrder({ id: 'order-123', status: 'cancelled' });
      (orderService.cancelOrder as jest.Mock).mockResolvedValue(cancelledOrder);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123', status: 'pending' })],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(cancelOrder({ orderId: 'order-123' }));

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.orders[0].status).toBe('cancelled');
      expect(state.error).toBeNull();
    });

    it('deve atualizar currentOrder se for o mesmo pedido', async () => {
      const cancelledOrder = createMockOrder({ id: 'order-123', status: 'cancelled' });
      (orderService.cancelOrder as jest.Mock).mockResolvedValue(cancelledOrder);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123', status: 'pending' })],
          currentOrder: createMockOrder({ id: 'order-123', status: 'pending' }),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(cancelOrder({ orderId: 'order-123', reason: 'Test' }));

      const state = store.getState().orders;

      expect(state.currentOrder?.status).toBe('cancelled');
    });

    it('deve definir erro quando cancel falha', async () => {
      (orderService.cancelOrder as jest.Mock).mockRejectedValue(
        new Error('Cannot cancel order')
      );

      const store = createTestStore({
        orders: {
          orders: [createMockOrder()],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(cancelOrder({ orderId: 'order-123' }));

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Cannot cancel order');
    });
  });

  // ============================================
  // 5. REORDER TESTS
  // ============================================
  describe('Recomprar Pedido (reorderOrder)', () => {
    it('deve definir isUpdating como true quando reorder está pendente', () => {
      const initialState: OrdersState = {
        orders: [createMockOrder()],
        currentOrder: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
        filters: {},
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      const nextState = ordersReducer(
        initialState,
        reorderOrder.pending('', 'order-123')
      );

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve completar reorder sem modificar orders', async () => {
      const mockCart = {
        id: 'cart-123',
        items: [],
        total: 0,
      };
      (orderService.reorderOrder as jest.Mock).mockResolvedValue(mockCart);

      const initialOrders = [createMockOrder()];
      const store = createTestStore({
        orders: {
          orders: initialOrders,
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(reorderOrder('order-123'));

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.orders).toEqual(initialOrders);
      expect(state.error).toBeNull();
    });

    it('deve definir erro quando reorder falha', async () => {
      (orderService.reorderOrder as jest.Mock).mockRejectedValue(
        new Error('Reorder failed')
      );

      const store = createTestStore({
        orders: {
          orders: [createMockOrder()],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(reorderOrder('order-123'));

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Reorder failed');
    });
  });

  // ============================================
  // 6. TRACK ORDER TESTS
  // ============================================
  describe('Rastrear Pedido (trackOrder)', () => {
    const mockTracking = {
      status: 'in_transit',
      location: 'São Paulo - SP',
      estimated_delivery: '2025-11-15',
      events: [
        { date: '2025-11-10', description: 'Pedido enviado' },
        { date: '2025-11-11', description: 'Em trânsito' },
      ],
    };

    it('deve atualizar tracking info no pedido da lista', async () => {
      (orderService.trackOrder as jest.Mock).mockResolvedValue(mockTracking);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123' })],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(trackOrder('order-123'));

      const state = store.getState().orders;

      expect(state.orders[0].tracking).toEqual(mockTracking);
    });

    it('deve atualizar tracking info no currentOrder se for o mesmo', async () => {
      (orderService.trackOrder as jest.Mock).mockResolvedValue(mockTracking);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123' })],
          currentOrder: createMockOrder({ id: 'order-123' }),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(trackOrder('order-123'));

      const state = store.getState().orders;

      expect(state.currentOrder?.tracking).toEqual(mockTracking);
    });

    it('não deve falhar quando pedido não está na lista', async () => {
      (orderService.trackOrder as jest.Mock).mockResolvedValue(mockTracking);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-456' })],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(trackOrder('order-123'));

      const state = store.getState().orders;

      // Não deve haver erro, apenas tracking não é atualizado
      expect(state.orders[0].id).toBe('order-456');
      expect(state.orders[0].tracking).toBeUndefined();
    });
  });

  // ============================================
  // 7. RATE ORDER TESTS
  // ============================================
  describe('Avaliar Pedido (rateOrder)', () => {
    it('deve definir isUpdating como true quando rate está pendente', () => {
      const initialState: OrdersState = {
        orders: [createMockOrder()],
        currentOrder: null,
        isLoading: false,
        isUpdating: false,
        error: null,
        lastUpdated: Date.now(),
        filters: {},
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      const nextState = ordersReducer(
        initialState,
        rateOrder.pending('', { orderId: 'order-123', rating: 5, review: 'Great!' })
      );

      expect(nextState.isUpdating).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('deve atualizar pedido com avaliação na lista', async () => {
      const ratedOrder = createMockOrder({
        id: 'order-123',
        rating: 5,
        review: 'Excellent!',
      });
      (orderService.rateOrder as jest.Mock).mockResolvedValue(ratedOrder);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123' })],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(
        rateOrder({ orderId: 'order-123', rating: 5, review: 'Excellent!' })
      );

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.orders[0].rating).toBe(5);
      expect(state.orders[0].review).toBe('Excellent!');
      expect(state.error).toBeNull();
    });

    it('deve atualizar currentOrder se for o mesmo pedido', async () => {
      const ratedOrder = createMockOrder({
        id: 'order-123',
        rating: 4,
        review: 'Good',
      });
      (orderService.rateOrder as jest.Mock).mockResolvedValue(ratedOrder);

      const store = createTestStore({
        orders: {
          orders: [createMockOrder({ id: 'order-123' })],
          currentOrder: createMockOrder({ id: 'order-123' }),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(rateOrder({ orderId: 'order-123', rating: 4, review: 'Good' }));

      const state = store.getState().orders;

      expect(state.currentOrder?.rating).toBe(4);
      expect(state.currentOrder?.review).toBe('Good');
    });

    it('deve definir erro quando rate falha', async () => {
      (orderService.rateOrder as jest.Mock).mockRejectedValue(
        new Error('Rating failed')
      );

      const store = createTestStore({
        orders: {
          orders: [createMockOrder()],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        },
      });

      await store.dispatch(rateOrder({ orderId: 'order-123', rating: 5 }));

      const state = store.getState().orders;

      expect(state.isUpdating).toBe(false);
      expect(state.error).toBe('Rating failed');
    });
  });

  // ============================================
  // 8. SYNCHRONOUS REDUCERS TESTS
  // ============================================
  describe('Reducers Síncronos', () => {
    describe('clearError', () => {
      it('deve limpar erro do estado', () => {
        const initialState: OrdersState = {
          orders: [],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: 'Algum erro',
          lastUpdated: null,
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        };

        const nextState = ordersReducer(initialState, clearError());

        expect(nextState.error).toBeNull();
      });
    });

    describe('setFilters', () => {
      it('deve definir filtros', () => {
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

        const filters = { status: 'delivered', dateFrom: '2025-01-01' };
        const nextState = ordersReducer(initialState, setFilters(filters));

        expect(nextState.filters).toEqual(filters);
      });

      it('deve sobrescrever filtros existentes', () => {
        const initialState: OrdersState = {
          orders: [],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          filters: { status: 'pending' },
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        };

        const newFilters = { status: 'delivered' };
        const nextState = ordersReducer(initialState, setFilters(newFilters));

        expect(nextState.filters).toEqual(newFilters);
      });
    });

    describe('clearFilters', () => {
      it('deve limpar filtros', () => {
        const initialState: OrdersState = {
          orders: [],
          currentOrder: null,
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: null,
          filters: { status: 'delivered', dateFrom: '2025-01-01' },
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        };

        const nextState = ordersReducer(initialState, clearFilters());

        expect(nextState.filters).toEqual({});
      });
    });

    describe('clearCurrentOrder', () => {
      it('deve limpar pedido atual', () => {
        const initialState: OrdersState = {
          orders: [createMockOrder()],
          currentOrder: createMockOrder(),
          isLoading: false,
          isUpdating: false,
          error: null,
          lastUpdated: Date.now(),
          filters: {},
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false,
          },
        };

        const nextState = ordersReducer(initialState, clearCurrentOrder());

        expect(nextState.currentOrder).toBeNull();
      });
    });

    describe('resetOrders', () => {
      it('deve resetar para o estado inicial', () => {
        const initialState: OrdersState = {
          orders: [createMockOrder()],
          currentOrder: createMockOrder(),
          isLoading: true,
          isUpdating: true,
          error: 'Error',
          lastUpdated: Date.now(),
          filters: { status: 'delivered' },
          pagination: {
            currentPage: 5,
            totalPages: 10,
            totalItems: 100,
            hasNextPage: true,
          },
        };

        const nextState = ordersReducer(initialState, resetOrders());

        expect(nextState).toEqual({
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
        });
      });
    });
  });

  // ============================================
  // 9. SELECTORS TESTS
  // ============================================
  describe('Selectors', () => {
    const mockState = {
      orders: {
        orders: [createMockOrder(), createMockOrder({ id: 'order-456' })],
        currentOrder: createMockOrder({ id: 'current-order' }),
        isLoading: true,
        isUpdating: false,
        error: 'Test error',
        lastUpdated: 1234567890,
        filters: { status: 'delivered' },
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          hasNextPage: true,
        },
      },
    };

    it('selectOrders deve retornar lista de pedidos', () => {
      expect(selectOrders(mockState)).toEqual(mockState.orders.orders);
    });

    it('selectCurrentOrder deve retornar pedido atual', () => {
      expect(selectCurrentOrder(mockState)).toEqual(mockState.orders.currentOrder);
    });

    it('selectOrdersLoading deve retornar status de loading', () => {
      expect(selectOrdersLoading(mockState)).toBe(true);
    });

    it('selectOrdersUpdating deve retornar status de updating', () => {
      expect(selectOrdersUpdating(mockState)).toBe(false);
    });

    it('selectOrdersError deve retornar erro', () => {
      expect(selectOrdersError(mockState)).toBe('Test error');
    });

    it('selectOrdersFilters deve retornar filtros', () => {
      expect(selectOrdersFilters(mockState)).toEqual({ status: 'delivered' });
    });

    it('selectOrdersPagination deve retornar paginação', () => {
      expect(selectOrdersPagination(mockState)).toEqual(mockState.orders.pagination);
    });

    it('selectCurrentOrder deve retornar null quando não há pedido atual', () => {
      const stateWithoutCurrentOrder = {
        orders: {
          ...mockState.orders,
          currentOrder: null,
        },
      };

      expect(selectCurrentOrder(stateWithoutCurrentOrder)).toBeNull();
    });

    it('selectOrders deve retornar array vazio quando não há pedidos', () => {
      const stateWithoutOrders = {
        orders: {
          ...mockState.orders,
          orders: [],
        },
      };

      expect(selectOrders(stateWithoutOrders)).toEqual([]);
    });
  });
});
