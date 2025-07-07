import { apiClient } from './api';
import {
  User,
  Address,
  UserPreferences,
  UserStats,
  Favorite,
  Order,
  Notification,
  PaginatedResponse,
} from '../types/api';

/**
 * Serviço para operações relacionadas ao usuário
 */
export class UserService {
  /**
   * Obter perfil do usuário atual
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/user/profile');
    return response.data;
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(data: Partial<Pick<User, 'name' | 'phone' | 'birth_date' | 'gender'>>): Promise<User> {
    const response = await apiClient.put<User>('/user/profile', data);
    return response.data;
  }

  /**
   * Atualizar avatar do usuário
   */
  async updateAvatar(imageFile: FormData): Promise<{ avatar_url: string }> {
    const response = await apiClient.upload<{ avatar_url: string }>('/user/avatar', imageFile);
    return response.data;
  }

  /**
   * Obter endereços do usuário
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<Address[]>('/user/addresses');
    return response.data;
  }

  /**
   * Adicionar novo endereço
   */
  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    const response = await apiClient.post<Address>('/user/addresses', address);
    return response.data;
  }

  /**
   * Atualizar endereço
   */
  async updateAddress(addressId: string, address: Partial<Address>): Promise<Address> {
    const response = await apiClient.put<Address>(`/user/addresses/${addressId}`, address);
    return response.data;
  }

  /**
   * Remover endereço
   */
  async deleteAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/user/addresses/${addressId}`);
  }

  /**
   * Definir endereço padrão
   */
  async setDefaultAddress(addressId: string): Promise<void> {
    await apiClient.post(`/user/addresses/${addressId}/set-default`);
  }

  /**
   * Obter preferências do usuário
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>('/user/preferences');
    return response.data;
  }

  /**
   * Atualizar preferências do usuário
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.put<UserPreferences>('/user/preferences', preferences);
    return response.data;
  }

  /**
   * Obter estatísticas do usuário
   */
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>('/user/stats');
    return response.data;
  }

  /**
   * Obter favoritos do usuário
   */
  async getFavorites(page: number = 1, perPage: number = 20): Promise<PaginatedResponse<Favorite>> {
    const response = await apiClient.get<Favorite[]>(`/user/favorites?page=${page}&per_page=${perPage}`);
    return response;
  }

  /**
   * Adicionar caixa aos favoritos
   */
  async addToFavorites(boxId: string): Promise<Favorite> {
    const response = await apiClient.post<Favorite>('/user/favorites', { mystery_box_id: boxId });
    return response.data;
  }

  /**
   * Remover caixa dos favoritos
   */
  async removeFromFavorites(boxId: string): Promise<void> {
    await apiClient.delete(`/user/favorites/${boxId}`);
  }

  /**
   * Verificar se caixa está nos favoritos
   */
  async isFavorite(boxId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ is_favorite: boolean }>(`/user/favorites/${boxId}/check`);
      return response.data.is_favorite;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter pedidos do usuário
   */
  async getOrders(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<Order[]>(`/user/orders?page=${page}&per_page=${perPage}`);
    return response;
  }

  /**
   * Obter detalhes de um pedido específico
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/user/orders/${orderId}`);
    return response.data;
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await apiClient.post(`/user/orders/${orderId}/cancel`, { reason });
  }

  /**
   * Obter notificações do usuário
   */
  async getNotifications(page: number = 1, perPage: number = 20): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<Notification[]>(`/user/notifications?page=${page}&per_page=${perPage}`);
    return response;
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/user/notifications/${notificationId}/read`);
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await apiClient.post('/user/notifications/read-all');
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/user/notifications/${notificationId}`);
  }

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadNotificationsCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/user/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Alterar senha
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<void> {
    await apiClient.post('/user/change-password', data);
  }

  /**
   * Solicitar exclusão de conta
   */
  async requestAccountDeletion(reason?: string): Promise<void> {
    await apiClient.post('/user/request-deletion', { reason });
  }

  /**
   * Cancelar solicitação de exclusão de conta
   */
  async cancelAccountDeletion(): Promise<void> {
    await apiClient.post('/user/cancel-deletion');
  }

  /**
   * Exportar dados do usuário (LGPD)
   */
  async exportUserData(): Promise<{ download_url: string; expires_at: string }> {
    const response = await apiClient.post<{ download_url: string; expires_at: string }>('/user/export-data');
    return response.data;
  }

  /**
   * Atualizar configurações de notificação
   */
  async updateNotificationSettings(settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
  }): Promise<void> {
    await apiClient.put('/user/notification-settings', settings);
  }

  /**
   * Obter histórico de atividades
   */
  async getActivityHistory(page: number = 1, perPage: number = 20): Promise<PaginatedResponse<{
    id: string;
    type: string;
    description: string;
    data: any;
    created_at: string;
  }>> {
    const response = await apiClient.get(`/user/activity?page=${page}&per_page=${perPage}`);
    return response;
  }

  /**
   * Verificar se email está disponível
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(`/user/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
  }

  /**
   * Reenviar email de verificação
   */
  async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/user/resend-verification');
  }

  /**
   * Verificar email com token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/user/verify-email', { token });
  }
}

// Instância singleton do serviço
export const userService = new UserService();
export default userService;
