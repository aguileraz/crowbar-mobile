 
import { orderService } from '../orderService';
import { httpClient } from '../httpClient';
import { Order, PaginatedResponse } from '../../types/api';

// Mock do httpClient
jest.mock('../httpClient');

describe('OrderService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('deve buscar pedidos com paginação padrão', async () => {
      // Mock de resposta
      const mockResponse: PaginatedResponse<Order> = {
        success: true,
        data: [
          {
            id: '1',
            userId: 'user-1',
            items: [],
            total: 100,
            status: 'delivered',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          } as Order,
        ],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 1,
          from: 1,
          to: 1,
        },
        links: {
          first: '/orders?page=1',
          last: '/orders?page=1',
          prev: null,
          next: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await orderService.getOrders();

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/orders', {
        params: {
          page: 1,
          per_page: 20,
        },
      });
    });

    it('deve buscar pedidos com filtros personalizados', async () => {
      const mockResponse: PaginatedResponse<Order> = {
        success: true,
        data: [],
        meta: {
          current_page: 2,
          last_page: 0,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        links: {
          first: '/orders?page=1',
          last: '/orders?page=1',
          prev: '/orders?page=1',
          next: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar com filtros
      const filters = {
        status: 'pending',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      };
      
      const _result = await orderService.getOrders(2, 10, filters);

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.get).toHaveBeenCalledWith('/orders', {
        params: {
          page: 2,
          per_page: 10,
          status: 'pending',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        },
      });
    });

    it('deve tratar erro ao buscar pedidos', async () => {
      const mockError = new Error('Network error');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      // Verificar que erro é propagado
      await expect(orderService.getOrders()).rejects.toThrow('Network error');
    });
  });

  describe('getOrderById', () => {
    it('deve buscar detalhes de um pedido específico', async () => {
      const mockOrder: Order = {
        id: 'order-123',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productName: 'Product Test',
            quantity: 2,
            price: 50,
            subtotal: 100,
          },
        ],
        total: 100,
        status: 'processing',
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: 'Rua Test',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      } as Order;

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockOrder });

      // Executar
      const _result = await orderService.getOrderById('order-123');

      // Verificar
      expect(_result).toEqual(mockOrder);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/order-123');
    });

    it('deve tratar erro ao buscar pedido inexistente', async () => {
      const mockError = new Error('Order not found');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.getOrderById('invalid-id')).rejects.toThrow('Order not found');
    });
  });

  describe('cancelOrder', () => {
    it('deve cancelar pedido sem motivo', async () => {
      const mockCancelledOrder: Order = {
        id: 'order-123',
        status: 'cancelled',
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockCancelledOrder });

      // Executar
      const _result = await orderService.cancelOrder('order-123');

      // Verificar
      expect(_result).toEqual(mockCancelledOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/cancel', {
        reason: undefined,
      });
    });

    it('deve cancelar pedido com motivo', async () => {
      const mockCancelledOrder: Order = {
        id: 'order-123',
        status: 'cancelled',
        cancellationReason: 'Produto indisponível',
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockCancelledOrder });

      // Executar
      const _result = await orderService.cancelOrder('order-123', 'Produto indisponível');

      // Verificar
      expect(_result).toEqual(mockCancelledOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/cancel', {
        reason: 'Produto indisponível',
      });
    });

    it('deve tratar erro ao cancelar pedido não cancelável', async () => {
      const mockError = new Error('Order cannot be cancelled');
      (httpClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.cancelOrder('order-123')).rejects.toThrow('Order cannot be cancelled');
    });
  });

  describe('reorderOrder', () => {
    it('deve recomprar pedido adicionando itens ao carrinho', async () => {
      const mockResponse = {
        success: true,
        cartItemsAdded: 3,
        message: 'Items added to cart successfully',
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar
      const _result = await orderService.reorderOrder('order-123');

      // Verificar
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/reorder');
    });

    it('deve tratar erro quando produtos não estão disponíveis', async () => {
      const mockError = new Error('Some products are not available');
      (httpClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.reorderOrder('order-123')).rejects.toThrow('Some products are not available');
    });
  });

  describe('trackOrder', () => {
    it('deve rastrear pedido com sucesso', async () => {
      const mockTrackingInfo = {
        orderId: 'order-123',
        carrier: 'Correios',
        trackingCode: 'BR123456789BR',
        status: 'in_transit',
        events: [
          {
            date: '2025-01-07T10:00:00Z',
            description: 'Objeto postado',
            location: 'São Paulo - SP',
          },
          {
            date: '2025-01-08T14:00:00Z',
            description: 'Objeto em trânsito',
            location: 'Curitiba - PR',
          },
        ],
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockTrackingInfo });

      // Executar
      const _result = await orderService.trackOrder('order-123');

      // Verificar
      expect(_result).toEqual(mockTrackingInfo);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/order-123/tracking');
    });

    it('deve tratar erro quando rastreamento não disponível', async () => {
      const mockError = new Error('Tracking information not available');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.trackOrder('order-123')).rejects.toThrow('Tracking information not available');
    });
  });

  describe('rateOrder', () => {
    it('deve avaliar pedido apenas com nota', async () => {
      const mockRatedOrder: Order = {
        id: 'order-123',
        rating: 5,
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockRatedOrder });

      // Executar
      const _result = await orderService.rateOrder('order-123', 5);

      // Verificar
      expect(_result).toEqual(mockRatedOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/rate', {
        rating: 5,
        review: undefined,
      });
    });

    it('deve avaliar pedido com nota e comentário', async () => {
      const mockRatedOrder: Order = {
        id: 'order-123',
        rating: 4,
        review: 'Ótimo produto, entrega rápida!',
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockRatedOrder });

      // Executar
      const _result = await orderService.rateOrder('order-123', 4, 'Ótimo produto, entrega rápida!');

      // Verificar
      expect(_result).toEqual(mockRatedOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/rate', {
        rating: 4,
        review: 'Ótimo produto, entrega rápida!',
      });
    });

    it('deve validar nota inválida', async () => {
      const mockError = new Error('Rating must be between 1 and 5');
      (httpClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.rateOrder('order-123', 6)).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('getOrderStatistics', () => {
    it('deve buscar estatísticas de pedidos', async () => {
      const mockStatistics = {
        totalOrders: 50,
        totalSpent: 5000,
        averageOrderValue: 100,
        ordersByStatus: {
          delivered: 40,
          processing: 5,
          pending: 3,
          cancelled: 2,
        },
        ordersByMonth: [
          { month: '2024-12', count: 10, total: 1000 },
          { month: '2025-01', count: 8, total: 800 },
        ],
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStatistics });

      // Executar
      const _result = await orderService.getOrderStatistics();

      // Verificar
      expect(_result).toEqual(mockStatistics);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/statistics');
    });
  });

  describe('generateInvoice', () => {
    it('deve gerar nota fiscal para pedido', async () => {
      const mockInvoiceResponse = {
        success: true,
        invoiceNumber: 'NF-2025-0001',
        url: 'https://api.example.com/invoices/NF-2025-0001.pdf',
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockInvoiceResponse });

      // Executar
      const _result = await orderService.generateInvoice('order-123');

      // Verificar
      expect(_result).toEqual(mockInvoiceResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/invoice');
    });

    it('deve tratar erro quando nota fiscal já existe', async () => {
      const mockError = new Error('Invoice already generated');
      (httpClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.generateInvoice('order-123')).rejects.toThrow('Invoice already generated');
    });
  });

  describe('downloadReceipt', () => {
    it('deve baixar comprovante de pedido', async () => {
      const mockUrl = 'blob:http://localhost/123456';

      const createObjectURLSpy = jest.spyOn(global.URL, 'createObjectURL').mockReturnValue(mockUrl);

      (httpClient.get as jest.Mock).mockResolvedValue({
        data: 'PDF content',
      });

      // Executar
      const _result = await orderService.downloadReceipt('order-123');

      // Verificar
      expect(_result).toBe(mockUrl);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/order-123/receipt', {
        responseType: 'blob',
      });
      // Verify createObjectURL was called (Blob is created internally)
      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      createObjectURLSpy.mockRestore();
    });

    it('deve tratar erro ao baixar comprovante', async () => {
      const mockError = new Error('Receipt not available');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(orderService.downloadReceipt('order-123')).rejects.toThrow('Receipt not available');
    });
  });

  describe('reportIssue', () => {
    it('deve reportar problema com pedido', async () => {
      const mockResponse = {
        success: true,
        ticketId: 'TICKET-001',
        message: 'Issue reported successfully',
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar - aligned with actual implementation signature
      const _result = await orderService.reportIssue('order-123', {
        type: 'damaged',
        description: 'Produto chegou danificado',
      });

      // Verificar - aligned with actual endpoint
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/issues', {
        type: 'damaged',
        description: 'Produto chegou danificado',
      });
    });

    it('deve aceitar anexos ao reportar problema', async () => {
      const mockResponse = {
        success: true,
        ticketId: 'TICKET-002',
      };

      const attachments = ['photo1.jpg', 'photo2.jpg'];

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      // Executar - aligned with actual implementation signature
      const _result = await orderService.reportIssue('order-123', {
        type: 'wrong_item',
        description: 'Recebi produto errado',
        images: attachments,
      });

      // Verificar - aligned with actual endpoint
      expect(_result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/issues', {
        type: 'wrong_item',
        description: 'Recebi produto errado',
        images: attachments,
      });
    });
  });

  describe('getDeliveryStatus', () => {
    it('deve buscar status de entrega', async () => {
      const mockDeliveryStatus = {
        orderId: 'order-123',
        status: 'in_transit',
        estimatedDelivery: '2025-01-15T10:00:00Z',
        carrier: 'Correios',
        trackingCode: 'BR123456789BR',
      };

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockDeliveryStatus });

      const _result = await orderService.getDeliveryStatus('order-123');

      expect(_result).toEqual(mockDeliveryStatus);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/order-123/delivery-_status');
    });
  });

  describe('confirmDelivery', () => {
    it('deve confirmar recebimento do pedido', async () => {
      const mockConfirmedOrder: Order = {
        id: 'order-123',
        status: 'delivered',
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockConfirmedOrder });

      const _result = await orderService.confirmDelivery('order-123');

      expect(_result).toEqual(mockConfirmedOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/confirm-delivery');
    });
  });

  describe('requestReturn', () => {
    it('deve solicitar devolução de pedido', async () => {
      const mockReturnResponse = {
        success: true,
        returnId: 'RET-001',
        message: 'Devolução solicitada com sucesso',
      };

      const returnData = {
        reason: 'defective',
        description: 'Produto com defeito',
        items: [
          {
            item_id: 'item-1',
            quantity: 1,
            reason: 'defective',
          },
        ],
      };

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockReturnResponse });

      const _result = await orderService.requestReturn('order-123', returnData);

      expect(_result).toEqual(mockReturnResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/return', returnData);
    });
  });

  describe('getStatusHistory', () => {
    it('deve buscar histórico de status do pedido', async () => {
      const mockHistory = [
        {
          status: 'pending',
          date: '2025-01-10T10:00:00Z',
          description: 'Pedido criado',
        },
        {
          status: 'processing',
          date: '2025-01-11T10:00:00Z',
          description: 'Pedido em processamento',
        },
        {
          status: 'shipped',
          date: '2025-01-12T10:00:00Z',
          description: 'Pedido enviado',
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockHistory });

      const _result = await orderService.getStatusHistory('order-123');

      expect(_result).toEqual(mockHistory);
      expect(httpClient.get).toHaveBeenCalledWith('/orders/order-123/_status-history');
    });
  });

  describe('updateDeliveryAddress', () => {
    it('deve atualizar endereço de entrega', async () => {
      const mockUpdatedOrder: Order = {
        id: 'order-123',
        shippingAddress: {
          street: 'Nova Rua',
          number: '456',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '20000-000',
        },
      } as Order;

      (httpClient.patch as jest.Mock).mockResolvedValue({ data: mockUpdatedOrder });

      const _result = await orderService.updateDeliveryAddress('order-123', 'address-456');

      expect(_result).toEqual(mockUpdatedOrder);
      expect(httpClient.patch).toHaveBeenCalledWith('/orders/order-123/delivery-address', {
        address_id: 'address-456',
      });
    });
  });

  describe('rescheduleDelivery', () => {
    it('deve reagendar entrega', async () => {
      const mockRescheduledOrder: Order = {
        id: 'order-123',
        estimatedDelivery: '2025-01-20T10:00:00Z',
      } as Order;

      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockRescheduledOrder });

      const _result = await orderService.rescheduleDelivery('order-123', '2025-01-20T10:00:00Z');

      expect(_result).toEqual(mockRescheduledOrder);
      expect(httpClient.post).toHaveBeenCalledWith('/orders/order-123/reschedule', {
        delivery_date: '2025-01-20T10:00:00Z',
      });
    });
  });

  // Removed getOrderUpdates test - method doesn't exist in implementation
  // This was likely a planned feature that wasn't implemented
});