/**
 * Mock Fixtures para Reviews (Avaliações)
 *
 * Dados mock reutilizáveis para testes de integração de avaliações.
 */

export const mockReview = {
  id: 'review-123',
  boxId: 'box-456',
  userId: 'user-123',
  userName: 'João Silva',
  userAvatar: 'https://example.com/avatar.jpg',
  rating: 5,
  title: 'Excelente caixa!',
  comment: 'Adorei os produtos que vieram na caixa. Superou minhas expectativas!',
  images: [
    'https://example.com/review-1.jpg',
    'https://example.com/review-2.jpg',
  ],
  helpful: 15,
  unhelpful: 2,
  verified: true,
  response: null,
  createdAt: '2025-01-05T14:30:00Z',
  updatedAt: '2025-01-05T14:30:00Z',
};

export const mockReviewWithResponse = {
  ...mockReview,
  id: 'review-456',
  rating: 3,
  title: 'Boa, mas pode melhorar',
  comment: 'Esperava produtos de maior valor. Caixa chegou em bom estado.',
  response: {
    vendorName: 'TechStore Brasil',
    vendorAvatar: 'https://example.com/vendor-avatar.jpg',
    comment: 'Obrigado pelo feedback! Vamos melhorar a curadoria das caixas.',
    createdAt: '2025-01-06T10:00:00Z',
  },
};

export const mockReviewNegative = {
  ...mockReview,
  id: 'review-789',
  rating: 2,
  title: 'Não recomendo',
  comment: 'Produtos de baixa qualidade. Não vale o preço.',
  helpful: 5,
  unhelpful: 10,
  images: [],
};

export const mockReviews = [mockReview, mockReviewWithResponse, mockReviewNegative];

export const mockReviewsResponse = {
  success: true,
  data: mockReviews,
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  },
  stats: {
    averageRating: 3.67,
    totalReviews: 3,
    ratingDistribution: {
      5: 1,
      4: 0,
      3: 1,
      2: 1,
      1: 0,
    },
  },
};

export const mockCreateReviewRequest = {
  boxId: 'box-456',
  orderId: 'order-123',
  rating: 5,
  title: 'Excelente caixa!',
  comment: 'Adorei os produtos que vieram na caixa. Superou minhas expectativas!',
  images: [
    'https://example.com/review-1.jpg',
    'https://example.com/review-2.jpg',
  ],
};

export const mockCreateReviewResponse = {
  success: true,
  message: 'Avaliação criada com sucesso',
  data: mockReview,
};

export const mockUpdateReviewRequest = {
  reviewId: 'review-123',
  rating: 4,
  title: 'Muito boa caixa!',
  comment: 'Gostei bastante dos produtos, mas esperava algo a mais.',
};

export const mockUpdateReviewResponse = {
  success: true,
  message: 'Avaliação atualizada com sucesso',
  data: {
    ...mockReview,
    rating: 4,
    title: 'Muito boa caixa!',
    comment: 'Gostei bastante dos produtos, mas esperava algo a mais.',
    updatedAt: '2025-01-06T15:00:00Z',
  },
};

export const mockDeleteReviewResponse = {
  success: true,
  message: 'Avaliação removida com sucesso',
};

export const mockMarkReviewHelpfulRequest = {
  reviewId: 'review-123',
  helpful: true,
};

export const mockMarkReviewHelpfulResponse = {
  success: true,
  message: 'Avaliação marcada como útil',
  data: {
    ...mockReview,
    helpful: 16,
  },
};

export const mockReportReviewRequest = {
  reviewId: 'review-789',
  reason: 'spam',
  details: 'Conteúdo irrelevante',
};

export const mockReportReviewResponse = {
  success: true,
  message: 'Avaliação reportada com sucesso',
};
