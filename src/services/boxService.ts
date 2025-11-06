import { apiClient } from './api';
import {
  MysteryBox,
  Category,
  SearchFilters,
  SearchResult,
  PaginatedResponse,
  Review,
  BoxOpenedEvent,
} from '../types/api';

/**
 * Serviço para operações relacionadas às caixas misteriosas
 */
export class BoxService {
  /**
   * Obter lista de caixas com filtros e paginação
   */
  async getBoxes(filters: SearchFilters = {}): Promise<PaginatedResponse<MysteryBox>> {
    const params = new URLSearchParams();
    
    // Adicionar filtros como query parameters
    if (filters.query) params.append('query', filters.query);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.min_price) params.append('min_price', filters.min_price.toString());
    if (filters.max_price) params.append('max_price', filters.max_price.toString());
    if (filters.rarity) filters.rarity.forEach(r => params.append('rarity[]', r));
    if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
    if (filters.is_new !== undefined) params.append('is_new', filters.is_new.toString());
    if (filters.tags) filters.tags.forEach(tag => params.append('tags[]', tag));
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const url = queryString ? `/boxes?${queryString}` : '/boxes';
    
    return await apiClient.get<MysteryBox[]>(url);
  }

  /**
   * Obter caixas em destaque
   */
  async getFeaturedBoxes(limit: number = 10): Promise<MysteryBox[]> {
    const _response = await apiClient.get<MysteryBox[]>(`/boxes/featured?limit=${limit}`);
    return _response.data;
  }

  /**
   * Obter caixas mais populares
   */
  async getPopularBoxes(limit: number = 10): Promise<MysteryBox[]> {
    const _response = await apiClient.get<MysteryBox[]>(`/boxes/popular?limit=${limit}`);
    return _response.data;
  }

  /**
   * Obter caixas recém-lançadas
   */
  async getNewBoxes(limit: number = 10): Promise<MysteryBox[]> {
    const _response = await apiClient.get<MysteryBox[]>(`/boxes/new?limit=${limit}`);
    return _response.data;
  }

  /**
   * Obter detalhes de uma caixa específica
   */
  async getBoxById(id: string): Promise<MysteryBox> {
    const _response = await apiClient.get<MysteryBox>(`/boxes/${id}`);
    return _response.data;
  }

  /**
   * Buscar caixas
   */
  async searchBoxes(query: string, filters: Omit<SearchFilters, 'query'> = {}): Promise<SearchResult> {
    const searchFilters = { ...filters, query };
    const _response = await apiClient.post<SearchResult>('/boxes/search', searchFilters);
    return _response.data;
  }

  /**
   * Obter sugestões de busca
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    const _response = await apiClient.get<string[]>(`/boxes/search/suggestions?q=${encodeURIComponent(query)}`);
    return _response.data;
  }

  /**
   * Obter categorias
   */
  async getCategories(): Promise<Category[]> {
    const _response = await apiClient.get<Category[]>('/categories');
    return _response.data;
  }

  /**
   * Obter categoria por ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const _response = await apiClient.get<Category>(`/categories/${id}`);
    return _response.data;
  }

  /**
   * Obter caixas de uma categoria
   */
  async getBoxesByCategory(categoryId: string, filters: Omit<SearchFilters, 'category_id'> = {}): Promise<PaginatedResponse<MysteryBox>> {
    const searchFilters = { ...filters, category_id: categoryId };
    return await this.getBoxes(searchFilters);
  }

  /**
   * Obter reviews de uma caixa
   */
  async getBoxReviews(boxId: string, page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Review>> {
    const _response = await apiClient.get<Review[]>(`/boxes/${boxId}/reviews?page=${page}&per_page=${perPage}`);
    return _response;
  }

  /**
   * Adicionar review para uma caixa
   */
  async addBoxReview(boxId: string, review: {
    rating: number;
    comment?: string;
    images?: string[];
  }): Promise<Review> {
    const _response = await apiClient.post<Review>(`/boxes/${boxId}/reviews`, review);
    return _response.data;
  }

  /**
   * Marcar review como útil
   */
  async markReviewHelpful(reviewId: string): Promise<void> {
    await apiClient.post(`/reviews/${reviewId}/helpful`);
  }

  /**
   * Obter estatísticas de uma caixa
   */
  async getBoxStats(boxId: string): Promise<{
    total_sold: number;
    total_opened: number;
    average_rating: number;
    reviews_count: number;
    recent_openings: BoxOpenedEvent[];
  }> {
    const _response = await apiClient.get(`/boxes/${boxId}/stats`);
    return _response.data;
  }

  /**
   * Verificar disponibilidade de estoque
   */
  async checkStock(boxId: string, quantity: number = 1): Promise<{
    available: boolean;
    stock: number;
    max_per_user?: number;
  }> {
    const _response = await apiClient.get(`/boxes/${boxId}/stock?quantity=${quantity}`);
    return _response.data;
  }

  /**
   * Obter caixas relacionadas/similares
   */
  async getRelatedBoxes(boxId: string, limit: number = 6): Promise<MysteryBox[]> {
    const _response = await apiClient.get<MysteryBox[]>(`/boxes/${boxId}/related?limit=${limit}`);
    return _response.data;
  }

  /**
   * Obter histórico de preços de uma caixa
   */
  async getPriceHistory(boxId: string, days: number = 30): Promise<{
    date: string;
    price: number;
  }[]> {
    const _response = await apiClient.get(`/boxes/${boxId}/price-history?days=${days}`);
    return _response.data;
  }

  /**
   * Reportar problema com uma caixa
   */
  async reportBox(boxId: string, report: {
    type: 'inappropriate_content' | 'misleading_info' | 'copyright' | 'other';
    description: string;
  }): Promise<void> {
    await apiClient.post(`/boxes/${boxId}/report`, report);
  }

  /**
   * Obter tags populares
   */
  async getPopularTags(limit: number = 20): Promise<{
    tag: string;
    count: number;
  }[]> {
    const _response = await apiClient.get(`/tags/popular?limit=${limit}`);
    return _response.data;
  }

  /**
   * Obter filtros disponíveis (para UI de filtros)
   */
  async getAvailableFilters(): Promise<{
    categories: Category[];
    rarities: string[];
    price_range: { min: number; max: number };
    tags: string[];
  }> {
    const _response = await apiClient.get('/boxes/filters');
    return _response.data;
  }
}

// Instância singleton do serviço
export const boxService = new BoxService();
export default boxService;