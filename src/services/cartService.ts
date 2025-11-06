import { apiClient } from './api';
import {
  Cart,
  CartItem,
  Order,
  Promotion,

} from '../types/api';

/**
 * Serviço para operações de carrinho e pedidos
 */
export class CartService {
  /**
   * Obter carrinho atual
   */
  async getCart(): Promise<Cart> {
    const _response = await apiClient.get<Cart>('/cart');
    return _response.data;
  }

  /**
   * Adicionar item ao carrinho
   */
  async addToCart(boxId: string, quantity: number = 1): Promise<Cart> {
    const _response = await apiClient.post<Cart>('/cart/items', {
      mystery_box_id: boxId,
      quantity,
    });
    return _response.data;
  }

  /**
   * Atualizar quantidade de item no carrinho
   */
  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const _response = await apiClient.put<Cart>(`/cart/items/${itemId}`, { quantity });
    return _response.data;
  }

  /**
   * Remover item do carrinho
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    const _response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return _response.data;
  }

  /**
   * Limpar carrinho
   */
  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  }

  /**
   * Aplicar cupom de desconto
   */
  async applyCoupon(code: string): Promise<Cart> {
    const _response = await apiClient.post<Cart>('/cart/coupon', { code });
    return _response.data;
  }

  /**
   * Remover cupom de desconto
   */
  async removeCoupon(): Promise<Cart> {
    const _response = await apiClient.delete<Cart>('/cart/coupon');
    return _response.data;
  }

  /**
   * Validar cupom
   */
  async validateCoupon(code: string): Promise<{
    valid: boolean;
    promotion?: Promotion;
    discount_amount?: number;
    message?: string;
  }> {
    const _response = await apiClient.post(`/cart/validate-coupon`, { code });
    return _response.data;
  }

  /**
   * Calcular frete
   */
  async calculateShipping(addressId: string): Promise<{
    options: Array<{
      id: string;
      name: string;
      price: number;
      estimated_days: number;
      description?: string;
    }>;
  }> {
    const _response = await apiClient.post('/cart/shipping', { address_id: addressId });
    return _response.data;
  }

  /**
   * Calcular frete por CEP
   */
  async calculateShippingByZip(zipCode: string): Promise<{
    options: Array<{
      id: string;
      name: string;
      price: number;
      estimated_days: number;
      description?: string;
    }>;
  }> {
    const _response = await apiClient.post('/cart/shipping/zip', { zip_code: zipCode });
    return _response.data;
  }

  /**
   * Finalizar pedido
   */
  async checkout(data: {
    shipping_address_id: string;
    shipping_option_id: string;
    payment_method: 'credit_card' | 'pix' | 'boleto';
    payment_data?: any;
    notes?: string;
  }): Promise<Order> {
    const _response = await apiClient.post<Order>('/orders', data);
    return _response.data;
  }

  /**
   * Processar pagamento
   */
  async processPayment(orderId: string, paymentData: {
    method: 'credit_card' | 'pix' | 'boleto';
    card_data?: {
      number: string;
      holder_name: string;
      expiry_month: string;
      expiry_year: string;
      cvv: string;
    };
    installments?: number;
  }): Promise<{
    status: 'success' | 'pending' | 'failed';
    payment_id: string;
    pix_qr_code?: string;
    boleto_url?: string;
    message?: string;
  }> {
    const _response = await apiClient.post(`/orders/${orderId}/payment`, paymentData);
    return _response.data;
  }

  /**
   * Verificar status do pagamento
   */
  async checkPaymentStatus(orderId: string): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_id: string;
    updated_at: string;
  }> {
    const _response = await apiClient.get(`/orders/${orderId}/payment/_status`);
    return _response.data;
  }

  /**
   * Obter métodos de pagamento disponíveis
   */
  async getPaymentMethods(): Promise<{
    credit_card: {
      enabled: boolean;
      brands: string[];
      max_installments: number;
    };
    pix: {
      enabled: boolean;
      discount_percentage?: number;
    };
    boleto: {
      enabled: boolean;
      due_days: number;
      discount_percentage?: number;
    };
  }> {
    const _response = await apiClient.get('/payment/methods');
    return _response.data;
  }

  /**
   * Calcular parcelas
   */
  async calculateInstallments(amount: number): Promise<Array<{
    installments: number;
    amount_per_installment: number;
    total_amount: number;
    interest_rate: number;
  }>> {
    const _response = await apiClient.get(`/payment/installments?amount=${amount}`);
    return _response.data;
  }

  /**
   * Salvar carrinho para mais tarde
   */
  async saveForLater(): Promise<{ saved_at: string }> {
    const _response = await apiClient.post('/cart/save');
    return _response.data;
  }

  /**
   * Restaurar carrinho salvo
   */
  async restoreSavedCart(): Promise<Cart> {
    const _response = await apiClient.post<Cart>('/cart/restore');
    return _response.data;
  }

  /**
   * Verificar se há carrinho salvo
   */
  async hasSavedCart(): Promise<{ has_saved_cart: boolean; saved_at?: string }> {
    const _response = await apiClient.get('/cart/saved');
    return _response.data;
  }

  /**
   * Compartilhar carrinho
   */
  async shareCart(): Promise<{ share_url: string; expires_at: string }> {
    const _response = await apiClient.post('/cart/share');
    return _response.data;
  }

  /**
   * Importar carrinho compartilhado
   */
  async importSharedCart(shareToken: string): Promise<Cart> {
    const _response = await apiClient.post<Cart>('/cart/import', { share_token: shareToken });
    return _response.data;
  }

  /**
   * Estimar tempo de entrega
   */
  async estimateDelivery(addressId: string): Promise<{
    min_days: number;
    max_days: number;
    estimated_date: string;
  }> {
    const _response = await apiClient.get(`/cart/delivery-estimate?address_id=${addressId}`);
    return _response.data;
  }

  /**
   * Verificar disponibilidade dos itens do carrinho
   */
  async checkAvailability(): Promise<{
    available: boolean;
    unavailable_items: Array<{
      item_id: string;
      box_name: string;
      requested_quantity: number;
      available_quantity: number;
    }>;
  }> {
    const _response = await apiClient.get('/cart/availability');
    return _response.data;
  }

  /**
   * Obter resumo do pedido antes da finalização
   */
  async getOrderSummary(data: {
    shipping_address_id: string;
    shipping_option_id: string;
    coupon_code?: string;
  }): Promise<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    shipping: number;
    taxes: number;
    total: number;
    estimated_delivery: string;
  }> {
    const _response = await apiClient.post('/cart/summary', data);
    return _response.data;
  }
}

// Instância singleton do serviço
export const cartService = new CartService();
export default cartService;