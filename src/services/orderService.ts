import { httpClient } from './httpClient';
import { Order, PaginatedResponse } from '../types/api';

/**
 * Serviço para gerenciamento de pedidos
 */

class OrderService {
  private baseURL = '/orders';

  /**
   * Buscar pedidos do usuário
   */
  async getOrders(
    page: number = 1,
    perPage: number = 20,
    filters: any = {}
  ): Promise<PaginatedResponse<Order>> {
    const params = {
      page,
      per_page: perPage,
      ...filters,
    };

    const _response = await httpClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Buscar detalhes de um pedido
   */
  async getOrderById(orderId: string): Promise<Order> {
    const _response = await httpClient.get(`${this.baseURL}/${orderId}`);
    return response.data;
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  }

  /**
   * Recomprar pedido (adicionar itens ao carrinho)
   */
  async reorderOrder(orderId: string): Promise<any> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/reorder`);
    return response.data;
  }

  /**
   * Rastrear pedido
   */
  async trackOrder(orderId: string): Promise<any> {
    const _response = await httpClient.get(`${this.baseURL}/${orderId}/tracking`);
    return response.data;
  }

  /**
   * Avaliar pedido
   */
  async rateOrder(orderId: string, rating: number, review?: string): Promise<Order> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/rate`, {
      rating,
      review,
    });
    return response.data;
  }

  /**
   * Buscar estatísticas de pedidos
   */
  async getOrderStatistics(): Promise<any> {
    const _response = await httpClient.get(`${this.baseURL}/statistics`);
    return response.data;
  }

  /**
   * Gerar nota fiscal
   */
  async generateInvoice(orderId: string): Promise<any> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/invoice`);
    return response.data;
  }

  /**
   * Baixar comprovante
   */
  async downloadReceipt(orderId: string): Promise<string> {
    const _response = await httpClient.get(`${this.baseURL}/${orderId}/receipt`, {
      responseType: 'blob',
    });
    
    // Create blob URL for download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }

  /**
   * Reportar problema com pedido
   */
  async reportIssue(orderId: string, issue: {
    type: string;
    description: string;
    images?: string[];
  }): Promise<any> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/issues`, issue);
    return response.data;
  }

  /**
   * Buscar status de entrega
   */
  async getDeliveryStatus(orderId: string): Promise<any> {
    const _response = await httpClient.get(`${this.baseURL}/${orderId}/delivery-_status`);
    return response.data;
  }

  /**
   * Confirmar recebimento
   */
  async confirmDelivery(orderId: string): Promise<Order> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/confirm-delivery`);
    return response.data;
  }

  /**
   * Solicitar devolução
   */
  async requestReturn(orderId: string, returnData: {
    reason: string;
    description: string;
    items: Array<{
      item_id: string;
      quantity: number;
      reason: string;
    }>;
  }): Promise<any> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/return`, returnData);
    return response.data;
  }

  /**
   * Buscar histórico de status
   */
  async getStatusHistory(orderId: string): Promise<any[]> {
    const _response = await httpClient.get(`${this.baseURL}/${orderId}/_status-history`);
    return response.data;
  }

  /**
   * Atualizar endereço de entrega
   */
  async updateDeliveryAddress(orderId: string, addressId: string): Promise<Order> {
    const _response = await httpClient.patch(`${this.baseURL}/${orderId}/delivery-address`, {
      address_id: addressId,
    });
    return response.data;
  }

  /**
   * Reagendar entrega
   */
  async rescheduleDelivery(orderId: string, newDate: string): Promise<Order> {
    const _response = await httpClient.post(`${this.baseURL}/${orderId}/reschedule`, {
      delivery_date: newDate,
    });
    return response.data;
  }
}

export const orderService = new OrderService();
export default orderService;