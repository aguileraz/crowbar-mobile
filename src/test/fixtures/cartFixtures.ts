/**
 * Mock Fixtures para Cart (Carrinho de Compras)
 *
 * Dados mock reutilizáveis para testes de integração do carrinho.
 * Evita dependência de API real ou MSW.
 */

export const mockCartItem = {
  id: 'item-123',
  boxId: 'box-456',
  boxName: 'Caixa Misteriosa Tech',
  boxImage: 'https://example.com/box.jpg',
  quantity: 1,
  price: 49.90,
  subtotal: 49.90,
  vendorId: 'vendor-789',
  vendorName: 'TechStore Brasil',
  platform: 'magalu' as const,
};

export const mockCartItemElectronics = {
  id: 'item-456',
  boxId: 'box-789',
  boxName: 'Caixa Surpresa Eletrônicos',
  boxImage: 'https://example.com/electronics.jpg',
  quantity: 2,
  price: 99.90,
  subtotal: 199.80,
  vendorId: 'vendor-123',
  vendorName: 'Eletrônicos Premium',
  platform: 'amazon' as const,
};

export const mockCart = {
  id: 'cart-123',
  userId: 'user-123',
  items: [mockCartItem],
  itemCount: 1,
  subtotal: 49.90,
  shipping: 10.00,
  discount: 0,
  total: 59.90,
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockCartMultipleItems = {
  id: 'cart-456',
  userId: 'user-123',
  items: [mockCartItem, mockCartItemElectronics],
  itemCount: 3,
  subtotal: 249.70,
  shipping: 15.00,
  discount: 10.00,
  total: 254.70,
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T11:00:00Z',
};

export const mockEmptyCart = {
  id: 'cart-789',
  userId: 'user-123',
  items: [],
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockAddToCartRequest = {
  boxId: 'box-456',
  quantity: 1,
};

export const mockAddToCartResponse = {
  success: true,
  message: 'Item adicionado ao carrinho',
  cart: mockCart,
};

export const mockUpdateCartItemRequest = {
  itemId: 'item-123',
  quantity: 3,
};

export const mockUpdateCartItemResponse = {
  success: true,
  message: 'Quantidade atualizada',
  cart: {
    ...mockCart,
    items: [{ ...mockCartItem, quantity: 3, subtotal: 149.70 }],
    subtotal: 149.70,
    total: 159.70,
  },
};

export const mockRemoveCartItemResponse = {
  success: true,
  message: 'Item removido do carrinho',
  cart: mockEmptyCart,
};

export const mockClearCartResponse = {
  success: true,
  message: 'Carrinho limpo',
  cart: mockEmptyCart,
};
