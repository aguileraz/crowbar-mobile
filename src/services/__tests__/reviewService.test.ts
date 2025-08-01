 
import { reviewService } from '../reviewService';
import { httpClient } from '../httpClient';
import { Review, PaginatedResponse } from '../../types/api';

// Mock do httpClient
jest.mock('../httpClient');

describe('ReviewService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviews', () => {
    it('deve buscar reviews de uma caixa com paginação padrão', async () => {
      // Mock de resposta
      const mockResponse: PaginatedResponse<Review> = {
        data: [
          {
            id: '1',
            userId: 'user-1',
            userName: 'João Silva',
            boxId: 'box-123',
            rating: 5,
            comment: 'Excelente caixa!',
            photos: [],
            helpful: 10,
            notHelpful: 2,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          } as Review,
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.getReviews('box-123');

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews', {
        params: {
          box_id: 'box-123',
          page: 1,
          per_page: 20,
        },
      });
    });

    it('deve buscar reviews com filtros personalizados', async () => {
      const mockResponse: PaginatedResponse<Review> = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar com filtros
      const filters = {
        rating: 5,
        sort: 'helpful',
        order: 'desc',
      };
      
      const _result = await reviewService.getReviews('box-123', 2, 10, filters);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews', {
        params: {
          box_id: 'box-123',
          page: 2,
          per_page: 10,
          rating: 5,
          sort: 'helpful',
          order: 'desc',
        },
      });
    });

    it('deve tratar erro ao buscar reviews', async () => {
      const mockError = new Error('Network error');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      // Verificar que erro é propagado
      await expect(reviewService.getReviews('box-123')).rejects.toThrow('Network error');
    });
  });

  describe('getReviewStatistics', () => {
    it('deve buscar estatísticas de reviews de uma caixa', async () => {
      const mockStatistics = {
        boxId: 'box-123',
        totalReviews: 150,
        averageRating: 4.5,
        ratingDistribution: {
          '1': 5,
          '2': 10,
          '3': 20,
          '4': 50,
          '5': 65,
        },
        trends: {
          lastMonth: 4.6,
          lastWeek: 4.7,
          trend: 'improving',
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStatistics });

      // Executar
      const _result = await reviewService.getReviewStatistics('box-123');

      // Verificar
      expect(_result).toEqual(mockStatistics);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/statistics', {
        params: { box_id: 'box-123' },
      });
    });

    it('deve tratar erro ao buscar estatísticas', async () => {
      const mockError = new Error('Statistics not available');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(reviewService.getReviewStatistics('box-123')).rejects.toThrow('Statistics not available');
    });
  });

  describe('getUserReview', () => {
    it('deve buscar review do usuário para uma caixa', async () => {
      const mockReview: Review = {
        id: 'review-123',
        userId: 'user-1',
        userName: 'João Silva',
        boxId: 'box-123',
        rating: 4,
        comment: 'Muito boa, mas poderia melhorar a embalagem',
        photos: ['photo1.jpg'],
        helpful: 5,
        notHelpful: 1,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as Review;

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockReview });

      // Executar
      const _result = await reviewService.getUserReview('box-123');

      // Verificar
      expect(_result).toEqual(mockReview);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/user', {
        params: { box_id: 'box-123' },
      });
    });

    it('deve retornar null quando usuário não avaliou a caixa', async () => {
      const mockError = {
        response: { status: 404 },
      };
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      // Executar
      const _result = await reviewService.getUserReview('box-123');

      // Verificar
      expect(_result).toBeNull();
    });

    it('deve propagar outros erros', async () => {
      const mockError = new Error('Server error');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(reviewService.getUserReview('box-123')).rejects.toThrow('Server error');
    });
  });

  describe('createReview', () => {
    it('deve criar review sem fotos', async () => {
      const reviewData = {
        boxId: 'box-123',
        rating: 5,
        comment: 'Perfeita! Recomendo muito!',
      };

      const mockCreatedReview: Review = {
        id: 'review-new',
        userId: 'user-1',
        userName: 'João Silva',
        ...reviewData,
        photos: [],
        helpful: 0,
        notHelpful: 0,
        createdAt: '2025-01-08T00:00:00Z',
        updatedAt: '2025-01-08T00:00:00Z',
      } as Review;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockCreatedReview });

      // Executar
      const _result = await reviewService.createReview(reviewData);

      // Verificar
      expect(_result).toEqual(mockCreatedReview);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews', {
        box_id: reviewData.boxId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        photos: [],
      });
    });

    it('deve criar review com fotos', async () => {
      const reviewData = {
        boxId: 'box-123',
        rating: 4,
        comment: 'Ótima caixa, veja as fotos!',
        photos: ['photo1.jpg', 'photo2.jpg'],
      };

      const mockCreatedReview: Review = {
        id: 'review-new',
        userId: 'user-1',
        userName: 'João Silva',
        boxId: reviewData.boxId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        photos: reviewData.photos,
        helpful: 0,
        notHelpful: 0,
        createdAt: '2025-01-08T00:00:00Z',
        updatedAt: '2025-01-08T00:00:00Z',
      } as Review;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockCreatedReview });

      // Executar
      const _result = await reviewService.createReview(reviewData);

      // Verificar
      expect(_result).toEqual(mockCreatedReview);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews', {
        box_id: reviewData.boxId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        photos: reviewData.photos,
      });
    });

    it('deve tratar erro ao criar review duplicada', async () => {
      const mockError = new Error('User already reviewed this box');
      (httpClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(reviewService.createReview({
        boxId: 'box-123',
        rating: 5,
        comment: 'Test',
      })).rejects.toThrow('User already reviewed this box');
    });
  });

  describe('updateReview', () => {
    it('deve atualizar review existente', async () => {
      const updateData = {
        rating: 3,
        comment: 'Mudei de opinião, não é tão boa',
        photos: [],
      };

      const mockUpdatedReview: Review = {
        id: 'review-123',
        userId: 'user-1',
        userName: 'João Silva',
        boxId: 'box-123',
        ...updateData,
        helpful: 5,
        notHelpful: 3,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-08T10:00:00Z',
      } as Review;

      (httpClient.put as jest.Mock).mockResolvedValue({ data: mockUpdatedReview });

      // Executar
      const _result = await reviewService.updateReview('review-123', updateData);

      // Verificar
      expect(_result).toEqual(mockUpdatedReview);
      expect(httpClient.put).toHaveBeenCalledWith('/reviews/review-123', updateData);
    });

    it('deve tratar erro ao atualizar review inexistente', async () => {
      const mockError = new Error('Review not found');
      (httpClient.put as jest.Mock).mockRejectedValue(mockError);

      await expect(reviewService.updateReview('invalid-id', {
        rating: 5,
        comment: 'Test',
      })).rejects.toThrow('Review not found');
    });
  });

  describe('deleteReview', () => {
    it('deve deletar review com sucesso', async () => {
      (httpClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      // Executar
      await reviewService.deleteReview('review-123');

      // Verificar
      expect(httpClient.delete).toHaveBeenCalledWith('/reviews/review-123');
    });

    it('deve tratar erro ao deletar review', async () => {
      const mockError = new Error('Review not found');
      (httpClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(reviewService.deleteReview('invalid-id')).rejects.toThrow('Review not found');
    });
  });

  describe('markReviewHelpful', () => {
    it('deve marcar review como útil', async () => {
      const mockResponse = {
        success: true,
        helpful: 11,
        notHelpful: 2,
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.markReviewHelpful('review-123', true);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews/review-123/helpful', {
        helpful: true,
      });
    });

    it('deve marcar review como não útil', async () => {
      const mockResponse = {
        success: true,
        helpful: 10,
        notHelpful: 3,
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.markReviewHelpful('review-123', false);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews/review-123/helpful', {
        helpful: false,
      });
    });
  });

  describe('reportReview', () => {
    it('deve reportar review com sucesso', async () => {
      const reportData = {
        reason: 'inappropriate',
        description: 'Contém linguagem ofensiva',
      };

      const mockResponse = {
        success: true,
        reportId: 'report-123',
        message: 'Report submitted successfully',
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.reportReview('review-123', reportData.reason, reportData.description);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews/review-123/report', reportData);
    });

    it('deve reportar sem descrição', async () => {
      const mockResponse = {
        success: true,
        reportId: 'report-124',
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.reportReview('review-123', 'spam');

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/reviews/review-123/report', {
        reason: 'spam',
        description: undefined,
      });
    });
  });

  describe('getTopReviews', () => {
    it('deve buscar top reviews de uma caixa', async () => {
      const mockTopReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Melhor caixa!',
          helpful: 50,
        },
        {
          id: 'review-2',
          rating: 5,
          comment: 'Perfeita!',
          helpful: 45,
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockTopReviews });

      // Executar
      const _result = await reviewService.getTopReviews('box-123', 5);

      // Verificar
      expect(_result).toEqual(mockTopReviews);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/top', {
        params: {
          box_id: 'box-123',
          limit: 5,
        },
      });
    });

    it('deve usar limite padrão de 10', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await reviewService.getTopReviews('box-123');

      expect(httpClient.get).toHaveBeenCalledWith('/reviews/top', {
        params: {
          box_id: 'box-123',
          limit: 10,
        },
      });
    });
  });

  describe('getUserReviews', () => {
    it('deve buscar todas as reviews de um usuário', async () => {
      const mockResponse: PaginatedResponse<Review> = {
        data: [
          {
            id: 'review-1',
            boxId: 'box-1',
            boxName: 'Caixa 1',
            rating: 5,
          } as Review,
          {
            id: 'review-2',
            boxId: 'box-2',
            boxName: 'Caixa 2',
            rating: 4,
          } as Review,
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.getUserReviews('user-123', 1, 20);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/user/user-123', {
        params: {
          page: 1,
          per_page: 20,
        },
      });
    });
  });

  describe('canUserReview', () => {
    it('deve verificar se usuário pode avaliar caixa', async () => {
      const mockResponse = {
        canReview: true,
        reason: null,
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await reviewService.canUserReview('box-123');

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/can-review/box-123');
    });

    it('deve retornar motivo quando não pode avaliar', async () => {
      const mockResponse = {
        canReview: false,
        reason: 'User must purchase box before reviewing',
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const _result = await reviewService.canUserReview('box-123');
      expect(_result).toEqual(mockResponse);
    });
  });
});