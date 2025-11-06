/**
 * Mock Fixtures para Orders (Pedidos)
 *
 * Dados mock reutilizáveis para testes de integração de pedidos.
 */

export const mockOrderItem = {
  id: 'order-item-123',
  boxId: 'box-456',
  boxName: 'Caixa Misteriosa Tech',
  boxImage: 'https://example.com/box.jpg',
  quantity: 1,
  price: 49.90,
  subtotal: 49.90,
  vendorId: 'vendor-789',
  vendorName: 'TechStore Brasil',
  platform: 'magalu' as const,
  status: 'processing' as const,
};

export const mockOrder = {
  id: 'order-123',
  userId: 'user-123',
  orderNumber: 'ORD-2025-001',
  items: [mockOrderItem],
  subtotal: 49.90,
  shipping: 10.00,
  discount: 0,
  total: 59.90,
  status: 'processing' as const,
  paymentMethod: 'credit_card' as const,
  paymentStatus: 'paid' as const,
  shippingAddress: {
    id: 'address-123',
    street: 'Rua Exemplo',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    country: 'Brasil',
  },
  trackingCode: 'BR123456789',
  estimatedDelivery: '2025-01-15T00:00:00Z',
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockOrderDelivered = {
  ...mockOrder,
  id: 'order-456',
  orderNumber: 'ORD-2025-002',
  status: 'delivered' as const,
  deliveredAt: '2025-01-10T14:30:00Z',
};

export const mockOrderCancelled = {
  ...mockOrder,
  id: 'order-789',
  orderNumber: 'ORD-2025-003',
  status: 'cancelled' as const,
  paymentStatus: 'refunded' as const,
  cancelledAt: '2025-01-02T09:00:00Z',
  cancellationReason: 'Solicitado pelo cliente',
};

export const mockOrders = [mockOrder, mockOrderDelivered, mockOrderCancelled];

export const mockOrdersResponse = {
  success: true,
  data: mockOrders,
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  },
};

export const mockOrderDetailResponse = {
  success: true,
  data: mockOrder,
};

export const mockCreateOrderRequest = {
  cartId: 'cart-123',
  shippingAddressId: 'address-123',
  paymentMethod: 'credit_card',
  paymentDetails: {
    cardToken: 'tok_test_123',
    installments: 1,
  },
};

export const mockCreateOrderResponse = {
  success: true,
  message: 'Pedido criado com sucesso',
  data: mockOrder,
};

export const mockCancelOrderRequest = {
  orderId: 'order-123',
  reason: 'Mudança de ideia',
};

export const mockCancelOrderResponse = {
  success: true,
  message: 'Pedido cancelado com sucesso',
  data: mockOrderCancelled,
};

export const mockTrackOrderResponse = {
  success: true,
  data: {
    orderId: 'order-123',
    trackingCode: 'BR123456789',
    status: 'in_transit',
    currentLocation: 'Centro de Distribuição - São Paulo',
    estimatedDelivery: '2025-01-15T00:00:00Z',
    history: [
      {
        status: 'processing',
        location: 'São Paulo - SP',
        date: '2025-01-01T10:00:00Z',
        description: 'Pedido processado',
      },
      {
        status: 'shipped',
        location: 'São Paulo - SP',
        date: '2025-01-02T14:00:00Z',
        description: 'Pedido enviado',
      },
      {
        status: 'in_transit',
        location: 'Centro de Distribuição - São Paulo',
        date: '2025-01-03T08:00:00Z',
        description: 'Em trânsito',
      },
    ],
  },
};
