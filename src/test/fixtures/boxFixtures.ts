/**
 * Mock Fixtures para Boxes (Caixas Misteriosas)
 *
 * Dados mock reutilizáveis para testes de integração de caixas.
 */

export const mockBox = {
  id: 'box-123',
  name: 'Caixa Misteriosa Tech',
  description: 'Caixa com produtos de tecnologia surpresa',
  price: 49.90,
  originalPrice: 79.90,
  discount: 37,
  image: 'https://example.com/box-tech.jpg',
  images: [
    'https://example.com/box-tech-1.jpg',
    'https://example.com/box-tech-2.jpg',
  ],
  category: 'tech',
  categoryName: 'Tecnologia',
  vendorId: 'vendor-123',
  vendorName: 'TechStore Brasil',
  platform: 'magalu' as const,
  stock: 50,
  rating: 4.5,
  reviewCount: 128,
  sold: 250,
  featured: true,
  verified: true,
  tags: ['eletrônicos', 'gadgets', 'surpresa'],
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockBoxElectronics = {
  id: 'box-456',
  name: 'Caixa Surpresa Eletrônicos Premium',
  description: 'Eletrônicos de alta qualidade em caixa misteriosa',
  price: 99.90,
  originalPrice: 149.90,
  discount: 33,
  image: 'https://example.com/box-electronics.jpg',
  images: [
    'https://example.com/box-electronics-1.jpg',
    'https://example.com/box-electronics-2.jpg',
  ],
  category: 'electronics',
  categoryName: 'Eletrônicos',
  vendorId: 'vendor-456',
  vendorName: 'Eletrônicos Premium',
  platform: 'amazon' as const,
  stock: 30,
  rating: 4.8,
  reviewCount: 89,
  sold: 180,
  featured: true,
  verified: true,
  tags: ['eletrônicos', 'premium', 'qualidade'],
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockBoxes = [mockBox, mockBoxElectronics];

export const mockBoxesResponse = {
  success: true,
  data: mockBoxes,
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

export const mockBoxDetail = {
  ...mockBox,
  contents: [
    { name: 'Item Surpresa 1', probability: 30 },
    { name: 'Item Surpresa 2', probability: 25 },
    { name: 'Item Surpresa 3', probability: 20 },
    { name: 'Item Raro', probability: 15 },
    { name: 'Item Super Raro', probability: 10 },
  ],
  specifications: {
    weight: '500g',
    dimensions: '20x15x10cm',
    minValue: '30.00',
    maxValue: '150.00',
  },
  vendor: {
    id: 'vendor-123',
    name: 'TechStore Brasil',
    rating: 4.7,
    reviewCount: 1250,
    verified: true,
    since: '2023-01-01',
  },
};

export const mockBoxDetailResponse = {
  success: true,
  data: mockBoxDetail,
};

export const mockFeaturedBoxes = [mockBox, mockBoxElectronics];

export const mockFeaturedBoxesResponse = {
  success: true,
  data: mockFeaturedBoxes,
};

export const mockCategories = [
  { id: 'tech', name: 'Tecnologia', count: 150 },
  { id: 'electronics', name: 'Eletrônicos', count: 120 },
  { id: 'fashion', name: 'Moda', count: 200 },
  { id: 'beauty', name: 'Beleza', count: 180 },
  { id: 'games', name: 'Games', count: 90 },
];

export const mockCategoriesResponse = {
  success: true,
  data: mockCategories,
};

export const mockSearchBoxesRequest = {
  query: 'tech',
  category: 'tech',
  minPrice: 0,
  maxPrice: 100,
  platform: 'magalu',
  sort: 'popular',
  page: 1,
  limit: 20,
};

export const mockSearchBoxesResponse = {
  success: true,
  data: [mockBox],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  filters: {
    categories: ['tech'],
    platforms: ['magalu'],
    priceRange: { min: 49.90, max: 49.90 },
  },
};
