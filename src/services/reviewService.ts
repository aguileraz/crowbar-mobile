import { httpClient } from './httpClient';
import { Review, PaginatedResponse } from '../types/api';
import { analyticsService } from './analyticsService';

/**
 * Serviço para gerenciamento de reviews e avaliações
 */

class ReviewService {
  private baseURL = '/reviews';

  /**
   * Buscar reviews de uma caixa
   */
  async getReviews(
    boxId: string,
    page: number = 1,
    perPage: number = 20,
    filters: any = {}
  ): Promise<PaginatedResponse<Review>> {
    const params = {
      box_id: boxId,
      page,
      per_page: perPage,
      ...filters,
    };

    const response = await httpClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Buscar estatísticas de reviews de uma caixa
   */
  async getReviewStatistics(boxId: string): Promise<any> {
    const response = await httpClient.get(`${this.baseURL}/statistics`, {
      params: { box_id: boxId },
    });
    return response.data;
  }

  /**
   * Buscar review do usuário para uma caixa
   */
  async getUserReview(boxId: string): Promise<Review | null> {
    try {
      const response = await httpClient.get(`${this.baseURL}/user`, {
        params: { box_id: boxId },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // User hasn't reviewed this box
      }
      throw error;
    }
  }

  /**
   * Criar review
   */
  async createReview(reviewData: {
    boxId: string;
    rating: number;
    comment: string;
    photos?: string[];
  }): Promise<Review> {
    const response = await httpClient.post(this.baseURL, {
      box_id: reviewData.boxId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      photos: reviewData.photos || [],
    });
    return response.data;
  }

  /**
   * Atualizar review
   */
  async updateReview(reviewId: string, reviewData: {
    rating: number;
    comment: string;
    photos?: string[];
  }): Promise<Review> {
    const response = await httpClient.put(`${this.baseURL}/${reviewId}`, {
      rating: reviewData.rating,
      comment: reviewData.comment,
      photos: reviewData.photos || [],
    });
    return response.data;
  }

  /**
   * Deletar review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await httpClient.delete(`${this.baseURL}/${reviewId}`);
  }

  /**
   * Marcar review como útil ou não útil
   */
  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<Review> {
    const response = await httpClient.post(`${this.baseURL}/${reviewId}/helpful`, {
      helpful,
    });
    
    // Rastrear engajamento com review
    analyticsService.trackEngagement(
      helpful ? 'mark_review_helpful' : 'mark_review_not_helpful',
      'review',
      1
    );
    
    return response.data;
  }

  /**
   * Reportar review
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    await httpClient.post(`${this.baseURL}/${reviewId}/report`, {
      reason,
    });
  }

  /**
   * Upload de fotos para review
   */
  async uploadReviewPhotos(photos: string[]): Promise<string[]> {
    const formData = new FormData();
    
    photos.forEach((photoUri, _index) => {
      formData.append('photos', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `review_photo_${0}.jpg`,
      } as any);
    });

    const response = await httpClient.post(`${this.baseURL}/upload-photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.urls;
  }

  /**
   * Buscar reviews do usuário
   */
  async getUserReviews(
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedResponse<Review>> {
    const response = await httpClient.get(`${this.baseURL}/user/all`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  }

  /**
   * Buscar reviews mais úteis
   */
  async getMostHelpfulReviews(
    boxId: string,
    limit: number = 5
  ): Promise<Review[]> {
    const response = await httpClient.get(`${this.baseURL}/most-helpful`, {
      params: { box_id: boxId, limit },
    });
    return response.data;
  }

  /**
   * Buscar reviews recentes
   */
  async getRecentReviews(
    boxId: string,
    limit: number = 5
  ): Promise<Review[]> {
    const response = await httpClient.get(`${this.baseURL}/recent`, {
      params: { box_id: boxId, limit },
    });
    return response.data;
  }

  /**
   * Buscar reviews com fotos
   */
  async getReviewsWithPhotos(
    boxId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedResponse<Review>> {
    const response = await httpClient.get(`${this.baseURL}/with-photos`, {
      params: { box_id: boxId, page, per_page: perPage },
    });
    return response.data;
  }

  /**
   * Buscar reviews por rating
   */
  async getReviewsByRating(
    boxId: string,
    rating: number,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedResponse<Review>> {
    const response = await httpClient.get(`${this.baseURL}/by-rating`, {
      params: { box_id: boxId, rating, page, per_page: perPage },
    });
    return response.data;
  }

  /**
   * Verificar se usuário pode fazer review
   */
  async canUserReview(boxId: string): Promise<boolean> {
    try {
      const response = await httpClient.get(`${this.baseURL}/can-review`, {
        params: { box_id: boxId },
      });
      return response.data.canReview;
    } catch (error) {
      return false;
    }
  }

  /**
   * Buscar resumo de reviews
   */
  async getReviewSummary(boxId: string): Promise<any> {
    const response = await httpClient.get(`${this.baseURL}/summary`, {
      params: { box_id: boxId },
    });
    return response.data;
  }
}

export const reviewService = new ReviewService();
export default reviewService;