import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { orderService } from '../../orderService';
import { Order } from '../../../types/api';

/**
 * Testes de integração para operações de pedidos
 * Verifica criação, busca, cancelamento e funcionalidades relacionadas
 */

describe('Testes de Integração - Operações de Pedidos', () => {
  let testClient: TestApiClient;

  // Dados de teste específicos para pedidos
  const testOrders: Order[] = [
    {
      id: 'order-123',
      order_number: 'ORD-2025-001',
      user_id: 'user-123',
      status: 'pending',
      payment_status: 'pending',
      items: [
        {
          id: 'item-001',
          mystery_box_id: 'box-electronics-001',
          mystery_box: {
            id: 'box-electronics-001',
            name: 'Caixa Eletrônicos Premium',
            image_url: 'https://test.com/electronics.jpg',
            price: 99.99,
            stock: 50,
            is_active: true,
          },
          quantity: 2,
          price: 99.99,
          total: 199.98,
        },
      ],
      subtotal: 199.98,
      discount: 0,
      shipping: 15.00,
      taxes: 0,
      total: 214.98,
      shipping_address: testData.address,
      created_at: '2025-01-07T10:00:00Z',
      updated_at: '2025-01-07T10:00:00Z',
    },
    {
      id: 'order-124',
      order_number: 'ORD-2025-002',
      user_id: 'user-123',
      status: 'shipped',
      payment_status: 'paid',
      items: [
        {
          id: 'item-002',
          mystery_box_id: 'box-gaming-002',
          mystery_box: {
            id: 'box-gaming-002',
            name: 'Caixa Gaming Deluxe',
            image_url: 'https://test.com/gaming.jpg',
            price: 149.99,
            stock: 25,
            is_active: true,
          },
          quantity: 1,
          price: 149.99,
          total: 149.99,
        },
      ],
      subtotal: 149.99,
      discount: 15.00,
      shipping: 15.00,
      taxes: 0,
      total: 149.99,
      shipping_address: testData.address,
      created_at: '2025-01-06T14:00:00Z',
      updated_at: '2025-01-07T08:00:00Z',
    },
  ];

  const testStatusHistory = [
    {
      id: 'status-001',
      status: 'pending',
      description: 'Pedido aguardando pagamento',
      created_at: '2025-01-07T10:00:00Z',
    },
    {
      id: 'status-002',
      status: 'paid',
      description: 'Pagamento confirmado',
      created_at: '2025-01-07T10:30:00Z',
    },
    {
      id: 'status-003',
      status: 'processing',
      description: 'Pedido em preparação',
      created_at: '2025-01-07T11:00:00Z',
    },
  ];

  const testTrackingInfo = {
    tracking_code: 'BR123456789',
    carrier: 'Correios',
    status: 'in_transit',
    estimated_delivery: '2025-01-10T00:00:00Z',
    events: [
      {
        date: '2025-01-07T12:00:00Z',
        location: 'São Paulo - SP',
        description: 'Objeto postado',
      },
      {
        date: '2025-01-07T18:00:00Z',
        location: 'São Paulo - SP',
        description: 'Objeto em trânsito',
      },
    ],
  };

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Listagem e busca de pedidos', () => {
    it('deve obter lista de pedidos do usuário', async () => {
      // Arrange
      const expectedResponse = testUtils.createPaginatedResponse(testOrders);
      testClient.mockSuccess('get', '/orders', expectedResponse);

      // Act
      const _response = await orderService.getOrders();

      // Assert
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'order-123',
        order_number: 'ORD-2025-001',
        status: 'pending',
        total: 214.98,
      });
    });

    it('deve obter pedidos com filtros aplicados', async () => {
      // Arrange
      const filters = {
        status: 'shipped',
        payment_status: 'paid',
        date_from: '2025-01-01',
        date_to: '2025-01-31',
      };

      const filteredOrders = testOrders.filter(order => order.status === 'shipped');
      const expectedResponse = testUtils.createPaginatedResponse(filteredOrders);
      testClient.mockSuccess('get', '/orders', expectedResponse);

      // Act
      const _response = await orderService.getOrders(1, 10, filters);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.data[0].status).toBe('shipped');
      expect(response.data[0].payment_status).toBe('paid');
    });

    it('deve obter pedidos com paginação', async () => {
      // Arrange
      const page = 2;
      const perPage = 5;
      const paginatedOrders = testOrders.slice(0, 1); // Simular segunda página
      const expectedResponse = testUtils.createPaginatedResponse(paginatedOrders, page, perPage);
      testClient.mockSuccess('get', '/orders', expectedResponse);

      // Act
      const _response = await orderService.getOrders(page, perPage);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.meta.current_page).toBe(page);
      expect(response.meta.per_page).toBe(perPage);
    });

    it('deve obter detalhes de um pedido específico', async () => {
      // Arrange
      const orderId = 'order-123';
      const expectedResponse = testUtils.createApiResponse(testOrders[0]);
      testClient.mockSuccess('get', `/orders/${orderId}`, expectedResponse);

      // Act
      const _response = await orderService.getOrderById(orderId);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        order_number: 'ORD-2025-001',
        status: 'pending',
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: 'box-electronics-001',
            quantity: 2,
          }),
        ]),
      });
    });

    it('deve falhar ao buscar pedido inexistente', async () => {
      // Arrange
      const orderId = 'order-nonexistent';
      testClient.mockHttpError('get', `/orders/${orderId}`, 404, {
        success: false,
        message: 'Pedido não encontrado',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.getOrderById(orderId)).rejects.toMatchObject({
        status: 404,
        message: 'Pedido não encontrado',
      });
    });

    it('deve obter estatísticas de pedidos', async () => {
      // Arrange
      const statistics = {
        total_orders: 15,
        total_spent: 2499.85,
        average_order_value: 166.66,
        orders_by_status: {
          pending: 2,
          paid: 3,
          shipped: 5,
          delivered: 4,
          cancelled: 1,
        },
        orders_by_month: [
          { month: '2025-01', orders: 5, total: 749.95 },
          { month: '2024-12', orders: 10, total: 1749.90 },
        ],
      };

      const expectedResponse = testUtils.createApiResponse(statistics);
      testClient.mockSuccess('get', '/orders/statistics', expectedResponse);

      // Act
      const _response = await orderService.getOrderStatistics();

      // Assert
      expect(response).toMatchObject({
        total_orders: 15,
        total_spent: 2499.85,
        orders_by_status: expect.objectContaining({
          pending: 2,
          delivered: 4,
        }),
      });
    });
  });

  describe('Cancelamento de pedidos', () => {
    it('deve cancelar pedido com sucesso', async () => {
      // Arrange
      const orderId = 'order-123';
      const reason = 'Mudança de endereço';
      const cancelledOrder = {
        ...testOrders[0],
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: '2025-01-07T13:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(cancelledOrder);
      testClient.mockSuccess('post', `/orders/${orderId}/cancel`, expectedResponse);

      // Act
      const _response = await orderService.cancelOrder(orderId, reason);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: '2025-01-07T13:00:00Z',
      });
    });

    it('deve falhar ao cancelar pedido já enviado', async () => {
      // Arrange
      const orderId = 'order-124';
      const reason = 'Não quero mais';

      testClient.mockHttpError('post', `/orders/${orderId}/cancel`, 400, {
        success: false,
        message: 'Pedido já foi enviado e não pode ser cancelado',
        errors: { status: ['Pedido não pode ser cancelado'] },
      });

      // Act & Assert
      await expect(orderService.cancelOrder(orderId, reason)).rejects.toMatchObject({
        status: 400,
        message: 'Pedido já foi enviado e não pode ser cancelado',
      });
    });

    it('deve falhar ao cancelar pedido sem permissão', async () => {
      // Arrange
      const orderId = 'order-other-user';
      const reason = 'Cancelamento';

      testClient.mockHttpError('post', `/orders/${orderId}/cancel`, 403, {
        success: false,
        message: 'Você não tem permissão para cancelar este pedido',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.cancelOrder(orderId, reason)).rejects.toMatchObject({
        status: 403,
        message: 'Você não tem permissão para cancelar este pedido',
      });
    });
  });

  describe('Rastreamento e status', () => {
    it('deve obter informações de rastreamento', async () => {
      // Arrange
      const orderId = 'order-124';
      const expectedResponse = testUtils.createApiResponse(testTrackingInfo);
      testClient.mockSuccess('get', `/orders/${orderId}/tracking`, expectedResponse);

      // Act
      const _response = await orderService.trackOrder(orderId);

      // Assert
      expect(response).toMatchObject({
        tracking_code: 'BR123456789',
        carrier: 'Correios',
        status: 'in_transit',
        events: expect.arrayContaining([
          expect.objectContaining({
            location: 'São Paulo - SP',
            description: 'Objeto postado',
          }),
        ]),
      });
    });

    it('deve obter histórico de status', async () => {
      // Arrange
      const orderId = 'order-123';
      const expectedResponse = testUtils.createApiResponse(testStatusHistory);
      testClient.mockSuccess('get', `/orders/${orderId}/status-history`, expectedResponse);

      // Act
      const _response = await orderService.getStatusHistory(orderId);

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toMatchObject({
        status: 'pending',
        description: 'Pedido aguardando pagamento',
      });
      expect(response[2]).toMatchObject({
        status: 'processing',
        description: 'Pedido em preparação',
      });
    });

    it('deve obter status de entrega', async () => {
      // Arrange
      const orderId = 'order-124';
      const deliveryStatus = {
        status: 'out_for_delivery',
        estimated_delivery: '2025-01-10T16:00:00Z',
        delivery_attempts: 0,
        delivery_instructions: 'Entregar na portaria',
        carrier_contact: '(11) 3003-0321',
      };

      const expectedResponse = testUtils.createApiResponse(deliveryStatus);
      testClient.mockSuccess('get', `/orders/${orderId}/delivery-status`, expectedResponse);

      // Act
      const _response = await orderService.getDeliveryStatus(orderId);

      // Assert
      expect(response).toMatchObject({
        status: 'out_for_delivery',
        estimated_delivery: '2025-01-10T16:00:00Z',
        delivery_attempts: 0,
      });
    });

    it('deve confirmar recebimento da entrega', async () => {
      // Arrange
      const orderId = 'order-124';
      const deliveredOrder = {
        ...testOrders[1],
        status: 'delivered',
        delivered_at: '2025-01-10T16:30:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(deliveredOrder);
      testClient.mockSuccess('post', `/orders/${orderId}/confirm-delivery`, expectedResponse);

      // Act
      const _response = await orderService.confirmDelivery(orderId);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        status: 'delivered',
        delivered_at: '2025-01-10T16:30:00Z',
      });
    });

    it('deve falhar ao confirmar entrega de pedido não enviado', async () => {
      // Arrange
      const orderId = 'order-123';

      testClient.mockHttpError('post', `/orders/${orderId}/confirm-delivery`, 400, {
        success: false,
        message: 'Pedido ainda não foi enviado',
        errors: { status: ['Pedido deve estar enviado para confirmar entrega'] },
      });

      // Act & Assert
      await expect(orderService.confirmDelivery(orderId)).rejects.toMatchObject({
        status: 400,
        message: 'Pedido ainda não foi enviado',
      });
    });
  });

  describe('Avaliação e feedback', () => {
    it('deve avaliar pedido com sucesso', async () => {
      // Arrange
      const orderId = 'order-124';
      const rating = 5;
      const review = 'Excelente produto! Chegou rápido e bem embalado.';

      const ratedOrder = {
        ...testOrders[1],
        rating,
        review,
        reviewed_at: '2025-01-10T18:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(ratedOrder);
      testClient.mockSuccess('post', `/orders/${orderId}/rate`, expectedResponse);

      // Act
      const _response = await orderService.rateOrder(orderId, rating, review);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        rating,
        review,
        reviewed_at: '2025-01-10T18:00:00Z',
      });
    });

    it('deve falhar ao avaliar pedido não entregue', async () => {
      // Arrange
      const orderId = 'order-123';
      const rating = 4;

      testClient.mockHttpError('post', `/orders/${orderId}/rate`, 400, {
        success: false,
        message: 'Pedido deve estar entregue para ser avaliado',
        errors: { status: ['Pedido não pode ser avaliado'] },
      });

      // Act & Assert
      await expect(orderService.rateOrder(orderId, rating)).rejects.toMatchObject({
        status: 400,
        message: 'Pedido deve estar entregue para ser avaliado',
      });
    });

    it('deve falhar ao avaliar com rating inválido', async () => {
      // Arrange
      const orderId = 'order-124';
      const rating = 6; // Rating inválido

      testClient.mockHttpError('post', `/orders/${orderId}/rate`, 422, {
        success: false,
        message: 'Dados inválidos',
        errors: { rating: ['Rating deve ser entre 1 e 5'] },
      });

      // Act & Assert
      await expect(orderService.rateOrder(orderId, rating)).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: { rating: ['Rating deve ser entre 1 e 5'] },
      });
    });
  });

  describe('Funcionalidades auxiliares', () => {
    it('deve recomprar pedido anterior', async () => {
      // Arrange
      const orderId = 'order-124';
      const reorderResult = {
        cart_id: 'cart-456',
        items_added: 1,
        items_unavailable: 0,
        message: 'Itens adicionados ao carrinho com sucesso',
      };

      const expectedResponse = testUtils.createApiResponse(reorderResult);
      testClient.mockSuccess('post', `/orders/${orderId}/reorder`, expectedResponse);

      // Act
      const _response = await orderService.reorderOrder(orderId);

      // Assert
      expect(response).toMatchObject({
        cart_id: 'cart-456',
        items_added: 1,
        items_unavailable: 0,
      });
    });

    it('deve gerar nota fiscal do pedido', async () => {
      // Arrange
      const orderId = 'order-124';
      const invoiceResult = {
        invoice_url: 'https://storage.com/invoices/invoice-124.pdf',
        invoice_number: 'NF-2025-001',
        generated_at: '2025-01-10T20:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(invoiceResult);
      testClient.mockSuccess('post', `/orders/${orderId}/invoice`, expectedResponse);

      // Act
      const _response = await orderService.generateInvoice(orderId);

      // Assert
      expect(response).toMatchObject({
        invoice_url: 'https://storage.com/invoices/invoice-124.pdf',
        invoice_number: 'NF-2025-001',
        generated_at: '2025-01-10T20:00:00Z',
      });
    });

    it('deve baixar comprovante do pedido', async () => {
      // Arrange
      const orderId = 'order-124';
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      
      // Mock para axios com responseType blob
      const axiosInstance = testClient.getAxiosInstance();
      axiosInstance.get = jest.fn().mockResolvedValue({
        data: mockBlob,
      });

      // Mock para URL.createObjectURL
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/receipt.pdf');

      // Act
      const _response = await orderService.downloadReceipt(orderId);

      // Assert
      expect(response).toBe('blob:http://localhost/receipt.pdf');
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('deve reportar problema com pedido', async () => {
      // Arrange
      const orderId = 'order-124';
      const issue = {
        type: 'damaged_item',
        description: 'Item chegou danificado',
        images: ['https://test.com/damage1.jpg', 'https://test.com/damage2.jpg'],
      };

      const issueResult = {
        issue_id: 'issue-001',
        status: 'open',
        created_at: '2025-01-10T21:00:00Z',
        message: 'Problema reportado com sucesso',
      };

      const expectedResponse = testUtils.createApiResponse(issueResult);
      testClient.mockSuccess('post', `/orders/${orderId}/issues`, expectedResponse);

      // Act
      const _response = await orderService.reportIssue(orderId, issue);

      // Assert
      expect(response).toMatchObject({
        issue_id: 'issue-001',
        status: 'open',
        message: 'Problema reportado com sucesso',
      });
    });

    it('deve atualizar endereço de entrega', async () => {
      // Arrange
      const orderId = 'order-123';
      const addressId = 'address-456';
      const updatedOrder = {
        ...testOrders[0],
        shipping_address: {
          ...testData.address,
          id: addressId,
        },
      };

      const expectedResponse = testUtils.createApiResponse(updatedOrder);
      testClient.mockSuccess('patch', `/orders/${orderId}/delivery-address`, expectedResponse);

      // Act
      const _response = await orderService.updateDeliveryAddress(orderId, addressId);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        shipping_address: expect.objectContaining({
          id: addressId,
        }),
      });
    });

    it('deve reagendar entrega', async () => {
      // Arrange
      const orderId = 'order-124';
      const newDate = '2025-01-15T14:00:00Z';
      const rescheduledOrder = {
        ...testOrders[1],
        delivery_date: newDate,
      };

      const expectedResponse = testUtils.createApiResponse(rescheduledOrder);
      testClient.mockSuccess('post', `/orders/${orderId}/reschedule`, expectedResponse);

      // Act
      const _response = await orderService.rescheduleDelivery(orderId, newDate);

      // Assert
      expect(response).toMatchObject({
        id: orderId,
        delivery_date: newDate,
      });
    });
  });

  describe('Solicitação de devolução', () => {
    it('deve solicitar devolução com sucesso', async () => {
      // Arrange
      const orderId = 'order-124';
      const returnData = {
        reason: 'product_defect',
        description: 'Produto chegou com defeito',
        items: [
          {
            item_id: 'item-002',
            quantity: 1,
            reason: 'Produto não funciona corretamente',
          },
        ],
      };

      const returnResult = {
        return_id: 'return-001',
        status: 'pending',
        return_code: 'RET-2025-001',
        created_at: '2025-01-10T22:00:00Z',
        estimated_refund: 149.99,
      };

      const expectedResponse = testUtils.createApiResponse(returnResult);
      testClient.mockSuccess('post', `/orders/${orderId}/return`, expectedResponse);

      // Act
      const _response = await orderService.requestReturn(orderId, returnData);

      // Assert
      expect(response).toMatchObject({
        return_id: 'return-001',
        status: 'pending',
        return_code: 'RET-2025-001',
        estimated_refund: 149.99,
      });
    });

    it('deve falhar ao solicitar devolução após prazo', async () => {
      // Arrange
      const orderId = 'order-old';
      const returnData = {
        reason: 'changed_mind',
        description: 'Mudei de ideia',
        items: [
          {
            item_id: 'item-001',
            quantity: 1,
            reason: 'Não quero mais',
          },
        ],
      };

      testClient.mockHttpError('post', `/orders/${orderId}/return`, 400, {
        success: false,
        message: 'Prazo para devolução expirado',
        errors: { order: ['Pedido fora do prazo para devolução'] },
      });

      // Act & Assert
      await expect(orderService.requestReturn(orderId, returnData)).rejects.toMatchObject({
        status: 400,
        message: 'Prazo para devolução expirado',
      });
    });
  });

  describe('Cenários de erro', () => {
    it('deve tratar erro de rede durante busca de pedidos', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/orders');

      // Act & Assert
      await expect(orderService.getOrders()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante cancelamento', async () => {
      // Arrange
      const orderId = 'order-123';
      testClient.mockTimeout('post', `/orders/${orderId}/cancel`);

      // Act & Assert
      await expect(orderService.cancelOrder(orderId)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar erro 500 durante rastreamento', async () => {
      // Arrange
      const orderId = 'order-124';
      testClient.mockHttpError('get', `/orders/${orderId}/tracking`, 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.trackOrder(orderId)).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });

    it('deve tratar erro 403 ao tentar acessar pedido de outro usuário', async () => {
      // Arrange
      const orderId = 'order-other-user';
      testClient.mockHttpError('get', `/orders/${orderId}`, 403, {
        success: false,
        message: 'Acesso negado',
        errors: {},
      });

      // Act & Assert
      await expect(orderService.getOrderById(orderId)).rejects.toMatchObject({
        status: 403,
        message: 'Acesso negado',
      });
    });
  });
});