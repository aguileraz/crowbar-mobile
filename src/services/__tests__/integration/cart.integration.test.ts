import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { cartService } from '../../cartService';
import { Cart, CartItem, Order, Promotion } from '../../../types/api';

/**
 * Testes de integração para operações de carrinho
 * Verifica add, remove, update, checkout e funcionalidades relacionadas
 */

describe('Testes de Integração - Operações de Carrinho', () => {
  let testClient: TestApiClient;

  // Dados de teste específicos para carrinho
  const testCartItems: CartItem[] = [
    {
      id: 'cart-item-001',
      mystery_box_id: 'box-electronics-001',
      quantity: 2,
      price: 99.99,
      total: 199.98,
      mystery_box: {
        id: 'box-electronics-001',
        name: 'Caixa Eletrônicos Premium',
        image_url: 'https://test.com/electronics.jpg',
        price: 99.99,
        stock: 50,
        is_active: true,
      },
    },
    {
      id: 'cart-item-002',
      mystery_box_id: 'box-gaming-002',
      quantity: 1,
      price: 149.99,
      total: 149.99,
      mystery_box: {
        id: 'box-gaming-002',
        name: 'Caixa Gaming Deluxe',
        image_url: 'https://test.com/gaming.jpg',
        price: 149.99,
        stock: 25,
        is_active: true,
      },
    },
  ];

  const testCart: Cart = {
    id: 'cart-123',
    user_id: 'user-123',
    items: testCartItems,
    subtotal: 349.97,
    discount: 0,
    shipping: 15.00,
    taxes: 0,
    total: 364.97,
    coupon_code: null,
    created_at: '2025-01-07T10:00:00Z',
    updated_at: '2025-01-07T12:00:00Z',
  };

  const testPromotion: Promotion = {
    id: 'promo-001',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    min_amount: 100,
    max_discount: 50,
    description: 'Desconto de 10% para novos usuários',
    expires_at: '2025-12-31T23:59:59Z',
    is_active: true,
  };

  const testOrder: Order = {
    id: 'order-123',
    order_number: 'ORD-2025-001',
    user_id: 'user-123',
    status: 'pending',
    payment_status: 'pending',
    items: testCartItems,
    subtotal: 349.97,
    discount: 34.99,
    shipping: 15.00,
    taxes: 0,
    total: 329.98,
    shipping_address: testData.address,
    created_at: '2025-01-07T12:00:00Z',
    updated_at: '2025-01-07T12:00:00Z',
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

  describe('Gerenciamento básico do carrinho', () => {
    it('deve obter carrinho atual', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testCart);
      testClient.mockSuccess('get', '/cart', expectedResponse);

      // Act
      const response = await cartService.getCart();

      // Assert
      expect(response).toMatchObject({
        id: 'cart-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: 'box-electronics-001',
            quantity: 2,
          }),
        ]),
        total: 364.97,
      });
    });

    it('deve adicionar item ao carrinho', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const quantity = 2;
      const updatedCart = {
        ...testCart,
        items: [...testCart.items],
        updated_at: '2025-01-07T12:30:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(updatedCart);
      testClient.mockSuccess('post', '/cart/items', expectedResponse);

      // Act
      const response = await cartService.addToCart(boxId, quantity);

      // Assert
      expect(response).toMatchObject({
        id: 'cart-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: boxId,
            quantity,
          }),
        ]),
      });
    });

    it('deve falhar ao adicionar item fora de estoque', async () => {
      // Arrange
      const boxId = 'box-out-of-stock';
      const quantity = 1;

      testClient.mockHttpError('post', '/cart/items', 400, {
        success: false,
        message: 'Produto fora de estoque',
        errors: { quantity: ['Produto não disponível'] },
      });

      // Act & Assert
      await expect(cartService.addToCart(boxId, quantity)).rejects.toMatchObject({
        status: 400,
        message: 'Produto fora de estoque',
      });
    });

    it('deve atualizar quantidade de item no carrinho', async () => {
      // Arrange
      const itemId = 'cart-item-001';
      const newQuantity = 3;
      const updatedCart = {
        ...testCart,
        items: testCart.items.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
            : item
        ),
        total: testCart.total + (testCart.items[0].price * 1), // +1 item
      };

      const expectedResponse = testUtils.createApiResponse(updatedCart);
      testClient.mockSuccess('put', `/cart/items/${itemId}`, expectedResponse);

      // Act
      const response = await cartService.updateCartItem(itemId, newQuantity);

      // Assert
      expect(response.items.find(item => item.id === itemId)).toMatchObject({
        quantity: newQuantity,
        total: testCart.items[0].price * newQuantity,
      });
    });

    it('deve remover item do carrinho', async () => {
      // Arrange
      const itemId = 'cart-item-001';
      const updatedCart = {
        ...testCart,
        items: testCart.items.filter(item => item.id !== itemId),
        total: testCart.total - testCart.items[0].total,
      };

      const expectedResponse = testUtils.createApiResponse(updatedCart);
      testClient.mockSuccess('delete', `/cart/items/${itemId}`, expectedResponse);

      // Act
      const response = await cartService.removeFromCart(itemId);

      // Assert
      expect(response.items.find(item => item.id === itemId)).toBeUndefined();
      expect(response.total).toBeLessThan(testCart.total);
    });

    it('deve limpar carrinho completamente', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        message: 'Carrinho limpo com sucesso',
      });
      testClient.mockSuccess('delete', '/cart', expectedResponse);

      // Act
      await cartService.clearCart();

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve tratar erro ao atualizar item inexistente', async () => {
      // Arrange
      const itemId = 'cart-item-nonexistent';
      const quantity = 2;

      testClient.mockHttpError('put', `/cart/items/${itemId}`, 404, {
        success: false,
        message: 'Item não encontrado no carrinho',
        errors: {},
      });

      // Act & Assert
      await expect(cartService.updateCartItem(itemId, quantity)).rejects.toMatchObject({
        status: 404,
        message: 'Item não encontrado no carrinho',
      });
    });
  });

  describe('Sistema de cupons', () => {
    it('deve aplicar cupom de desconto válido', async () => {
      // Arrange
      const couponCode = 'WELCOME10';
      const cartWithCoupon = {
        ...testCart,
        coupon_code: couponCode,
        discount: 34.99,
        total: testCart.total - 34.99,
      };

      const expectedResponse = testUtils.createApiResponse(cartWithCoupon);
      testClient.mockSuccess('post', '/cart/coupon', expectedResponse);

      // Act
      const response = await cartService.applyCoupon(couponCode);

      // Assert
      expect(response).toMatchObject({
        coupon_code: couponCode,
        discount: 34.99,
        total: testCart.total - 34.99,
      });
    });

    it('deve falhar ao aplicar cupom inválido', async () => {
      // Arrange
      const couponCode = 'INVALID_COUPON';

      testClient.mockHttpError('post', '/cart/coupon', 400, {
        success: false,
        message: 'Cupom inválido ou expirado',
        errors: { code: ['Cupom não encontrado'] },
      });

      // Act & Assert
      await expect(cartService.applyCoupon(couponCode)).rejects.toMatchObject({
        status: 400,
        message: 'Cupom inválido ou expirado',
      });
    });

    it('deve validar cupom antes de aplicar', async () => {
      // Arrange
      const couponCode = 'WELCOME10';
      const validationResult = {
        valid: true,
        promotion: testPromotion,
        discount_amount: 34.99,
        message: 'Cupom válido',
      };

      const expectedResponse = testUtils.createApiResponse(validationResult);
      testClient.mockSuccess('post', '/cart/validate-coupon', expectedResponse);

      // Act
      const response = await cartService.validateCoupon(couponCode);

      // Assert
      expect(response).toMatchObject({
        valid: true,
        promotion: expect.objectContaining({
          code: couponCode,
          type: 'percentage',
          value: 10,
        }),
        discount_amount: 34.99,
      });
    });

    it('deve remover cupom aplicado', async () => {
      // Arrange
      const cartWithoutCoupon = {
        ...testCart,
        coupon_code: null,
        discount: 0,
        total: testCart.subtotal + testCart.shipping,
      };

      const expectedResponse = testUtils.createApiResponse(cartWithoutCoupon);
      testClient.mockSuccess('delete', '/cart/coupon', expectedResponse);

      // Act
      const response = await cartService.removeCoupon();

      // Assert
      expect(response).toMatchObject({
        coupon_code: null,
        discount: 0,
        total: testCart.subtotal + testCart.shipping,
      });
    });

    it('deve falhar validação de cupom com valor mínimo não atingido', async () => {
      // Arrange
      const couponCode = 'BIGDISCOUNT';
      const validationResult = {
        valid: false,
        message: 'Valor mínimo de R$ 500,00 não atingido',
      };

      const expectedResponse = testUtils.createApiResponse(validationResult);
      testClient.mockSuccess('post', '/cart/validate-coupon', expectedResponse);

      // Act
      const response = await cartService.validateCoupon(couponCode);

      // Assert
      expect(response).toMatchObject({
        valid: false,
        message: 'Valor mínimo de R$ 500,00 não atingido',
      });
    });
  });

  describe('Cálculo de frete', () => {
    it('deve calcular frete por endereço', async () => {
      // Arrange
      const addressId = 'address-123';
      const shippingOptions = {
        options: [
          {
            id: 'correios-pac',
            name: 'PAC',
            price: 15.00,
            estimated_days: 7,
            description: 'Entrega padrão dos Correios',
          },
          {
            id: 'correios-sedex',
            name: 'SEDEX',
            price: 25.00,
            estimated_days: 3,
            description: 'Entrega expressa dos Correios',
          },
        ],
      };

      const expectedResponse = testUtils.createApiResponse(shippingOptions);
      testClient.mockSuccess('post', '/cart/shipping', expectedResponse);

      // Act
      const response = await cartService.calculateShipping(addressId);

      // Assert
      expect(response.options).toHaveLength(2);
      expect(response.options[0]).toMatchObject({
        id: 'correios-pac',
        name: 'PAC',
        price: 15.00,
        estimated_days: 7,
      });
    });

    it('deve calcular frete por CEP', async () => {
      // Arrange
      const zipCode = '01310-100';
      const shippingOptions = {
        options: [
          {
            id: 'correios-pac',
            name: 'PAC',
            price: 12.00,
            estimated_days: 5,
            description: 'Entrega padrão dos Correios',
          },
        ],
      };

      const expectedResponse = testUtils.createApiResponse(shippingOptions);
      testClient.mockSuccess('post', '/cart/shipping/zip', expectedResponse);

      // Act
      const response = await cartService.calculateShippingByZip(zipCode);

      // Assert
      expect(response.options).toHaveLength(1);
      expect(response.options[0]).toMatchObject({
        id: 'correios-pac',
        name: 'PAC',
        price: 12.00,
        estimated_days: 5,
      });
    });

    it('deve falhar cálculo de frete com CEP inválido', async () => {
      // Arrange
      const zipCode = '00000-000';

      testClient.mockHttpError('post', '/cart/shipping/zip', 400, {
        success: false,
        message: 'CEP inválido ou não atendido',
        errors: { zip_code: ['CEP inválido'] },
      });

      // Act & Assert
      await expect(cartService.calculateShippingByZip(zipCode)).rejects.toMatchObject({
        status: 400,
        message: 'CEP inválido ou não atendido',
      });
    });

    it('deve estimar tempo de entrega', async () => {
      // Arrange
      const addressId = 'address-123';
      const deliveryEstimate = {
        min_days: 3,
        max_days: 7,
        estimated_date: '2025-01-14T00:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(deliveryEstimate);
      testClient.mockSuccess('get', '/cart/delivery-estimate', expectedResponse);

      // Act
      const response = await cartService.estimateDelivery(addressId);

      // Assert
      expect(response).toMatchObject({
        min_days: 3,
        max_days: 7,
        estimated_date: '2025-01-14T00:00:00Z',
      });
    });
  });

  describe('Processo de checkout', () => {
    it('deve finalizar pedido com sucesso', async () => {
      // Arrange
      const checkoutData = {
        shipping_address_id: 'address-123',
        shipping_option_id: 'correios-pac',
        payment_method: 'credit_card' as const,
        payment_data: {
          card_token: 'card-token-123',
          installments: 1,
        },
        notes: 'Entregar na portaria',
      };

      const expectedResponse = testUtils.createApiResponse(testOrder);
      testClient.mockSuccess('post', '/orders', expectedResponse);

      // Act
      const response = await cartService.checkout(checkoutData);

      // Assert
      expect(response).toMatchObject({
        id: 'order-123',
        order_number: 'ORD-2025-001',
        status: 'pending',
        payment_status: 'pending',
        total: 329.98,
      });
    });

    it('deve obter resumo do pedido antes da finalização', async () => {
      // Arrange
      const summaryData = {
        shipping_address_id: 'address-123',
        shipping_option_id: 'correios-pac',
        coupon_code: 'WELCOME10',
      };

      const orderSummary = {
        items: testCartItems,
        subtotal: 349.97,
        discount: 34.99,
        shipping: 15.00,
        taxes: 0,
        total: 329.98,
        estimated_delivery: '2025-01-14T00:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(orderSummary);
      testClient.mockSuccess('post', '/cart/summary', expectedResponse);

      // Act
      const response = await cartService.getOrderSummary(summaryData);

      // Assert
      expect(response).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: 'box-electronics-001',
          }),
        ]),
        subtotal: 349.97,
        discount: 34.99,
        total: 329.98,
      });
    });

    it('deve falhar checkout com endereço inválido', async () => {
      // Arrange
      const checkoutData = {
        shipping_address_id: 'address-invalid',
        shipping_option_id: 'correios-pac',
        payment_method: 'credit_card' as const,
      };

      testClient.mockHttpError('post', '/orders', 400, {
        success: false,
        message: 'Endereço de entrega inválido',
        errors: { shipping_address_id: ['Endereço não encontrado'] },
      });

      // Act & Assert
      await expect(cartService.checkout(checkoutData)).rejects.toMatchObject({
        status: 400,
        message: 'Endereço de entrega inválido',
      });
    });

    it('deve verificar disponibilidade dos itens antes do checkout', async () => {
      // Arrange
      const availability = {
        available: false,
        unavailable_items: [
          {
            item_id: 'cart-item-001',
            box_name: 'Caixa Eletrônicos Premium',
            requested_quantity: 2,
            available_quantity: 1,
          },
        ],
      };

      const expectedResponse = testUtils.createApiResponse(availability);
      testClient.mockSuccess('get', '/cart/availability', expectedResponse);

      // Act
      const response = await cartService.checkAvailability();

      // Assert
      expect(response).toMatchObject({
        available: false,
        unavailable_items: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'cart-item-001',
            requested_quantity: 2,
            available_quantity: 1,
          }),
        ]),
      });
    });
  });

  describe('Processamento de pagamento', () => {
    it('deve processar pagamento com cartão de crédito', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'João Silva',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      };

      const paymentResult = {
        status: 'success' as const,
        payment_id: 'payment-123',
        message: 'Pagamento processado com sucesso',
      };

      const expectedResponse = testUtils.createApiResponse(paymentResult);
      testClient.mockSuccess('post', `/orders/${orderId}/payment`, expectedResponse);

      // Act
      const response = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(response).toMatchObject({
        status: 'success',
        payment_id: 'payment-123',
        message: 'Pagamento processado com sucesso',
      });
    });

    it('deve processar pagamento PIX', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'pix' as const,
      };

      const paymentResult = {
        status: 'pending' as const,
        payment_id: 'payment-pix-123',
        pix_qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        message: 'QR Code gerado. Escaneie para pagar.',
      };

      const expectedResponse = testUtils.createApiResponse(paymentResult);
      testClient.mockSuccess('post', `/orders/${orderId}/payment`, expectedResponse);

      // Act
      const response = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(response).toMatchObject({
        status: 'pending',
        payment_id: 'payment-pix-123',
        pix_qr_code: expect.stringContaining('data:image/png;base64'),
      });
    });

    it('deve processar pagamento boleto', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'boleto' as const,
      };

      const paymentResult = {
        status: 'pending' as const,
        payment_id: 'payment-boleto-123',
        boleto_url: 'https://pagamento.com/boleto/123.pdf',
        message: 'Boleto gerado. Pague até o vencimento.',
      };

      const expectedResponse = testUtils.createApiResponse(paymentResult);
      testClient.mockSuccess('post', `/orders/${orderId}/payment`, expectedResponse);

      // Act
      const response = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(response).toMatchObject({
        status: 'pending',
        payment_id: 'payment-boleto-123',
        boleto_url: 'https://pagamento.com/boleto/123.pdf',
      });
    });

    it('deve verificar status do pagamento', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentStatus = {
        status: 'paid' as const,
        payment_id: 'payment-123',
        updated_at: '2025-01-07T13:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(paymentStatus);
      testClient.mockSuccess('get', `/orders/${orderId}/payment/status`, expectedResponse);

      // Act
      const response = await cartService.checkPaymentStatus(orderId);

      // Assert
      expect(response).toMatchObject({
        status: 'paid',
        payment_id: 'payment-123',
        updated_at: '2025-01-07T13:00:00Z',
      });
    });

    it('deve obter métodos de pagamento disponíveis', async () => {
      // Arrange
      const paymentMethods = {
        credit_card: {
          enabled: true,
          brands: ['visa', 'mastercard', 'amex'],
          max_installments: 12,
        },
        pix: {
          enabled: true,
          discount_percentage: 5,
        },
        boleto: {
          enabled: true,
          due_days: 3,
          discount_percentage: 2,
        },
      };

      const expectedResponse = testUtils.createApiResponse(paymentMethods);
      testClient.mockSuccess('get', '/payment/methods', expectedResponse);

      // Act
      const response = await cartService.getPaymentMethods();

      // Assert
      expect(response).toMatchObject({
        credit_card: expect.objectContaining({
          enabled: true,
          brands: expect.arrayContaining(['visa', 'mastercard']),
          max_installments: 12,
        }),
        pix: expect.objectContaining({
          enabled: true,
          discount_percentage: 5,
        }),
      });
    });

    it('deve calcular parcelas para pagamento', async () => {
      // Arrange
      const amount = 329.98;
      const installments = [
        { installments: 1, amount_per_installment: 329.98, total_amount: 329.98, interest_rate: 0 },
        { installments: 2, amount_per_installment: 169.99, total_amount: 339.98, interest_rate: 3.0 },
        { installments: 3, amount_per_installment: 116.66, total_amount: 349.98, interest_rate: 6.0 },
      ];

      const expectedResponse = testUtils.createApiResponse(installments);
      testClient.mockSuccess('get', '/payment/installments', expectedResponse);

      // Act
      const response = await cartService.calculateInstallments(amount);

      // Assert
      expect(response).toHaveLength(3);
      expect(response[0]).toMatchObject({
        installments: 1,
        amount_per_installment: 329.98,
        interest_rate: 0,
      });
      expect(response[2]).toMatchObject({
        installments: 3,
        interest_rate: 6.0,
      });
    });

    it('deve falhar pagamento com cartão inválido', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '1234567890123456', // Número inválido
          holder_name: 'João Silva',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      };

      testClient.mockHttpError('post', `/orders/${orderId}/payment`, 400, {
        success: false,
        message: 'Cartão inválido',
        errors: { card_number: ['Número do cartão inválido'] },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        status: 400,
        message: 'Cartão inválido',
      });
    });
  });

  describe('Funcionalidades auxiliares', () => {
    it('deve salvar carrinho para mais tarde', async () => {
      // Arrange
      const saveResult = {
        saved_at: '2025-01-07T12:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(saveResult);
      testClient.mockSuccess('post', '/cart/save', expectedResponse);

      // Act
      const response = await cartService.saveForLater();

      // Assert
      expect(response).toMatchObject({
        saved_at: '2025-01-07T12:00:00Z',
      });
    });

    it('deve restaurar carrinho salvo', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testCart);
      testClient.mockSuccess('post', '/cart/restore', expectedResponse);

      // Act
      const response = await cartService.restoreSavedCart();

      // Assert
      expect(response).toMatchObject({
        id: 'cart-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: 'box-electronics-001',
          }),
        ]),
      });
    });

    it('deve verificar se há carrinho salvo', async () => {
      // Arrange
      const savedCartInfo = {
        has_saved_cart: true,
        saved_at: '2025-01-07T12:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(savedCartInfo);
      testClient.mockSuccess('get', '/cart/saved', expectedResponse);

      // Act
      const response = await cartService.hasSavedCart();

      // Assert
      expect(response).toMatchObject({
        has_saved_cart: true,
        saved_at: '2025-01-07T12:00:00Z',
      });
    });

    it('deve compartilhar carrinho', async () => {
      // Arrange
      const shareResult = {
        share_url: 'https://crowbar.com/cart/share/abc123',
        expires_at: '2025-01-14T12:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(shareResult);
      testClient.mockSuccess('post', '/cart/share', expectedResponse);

      // Act
      const response = await cartService.shareCart();

      // Assert
      expect(response).toMatchObject({
        share_url: 'https://crowbar.com/cart/share/abc123',
        expires_at: '2025-01-14T12:00:00Z',
      });
    });

    it('deve importar carrinho compartilhado', async () => {
      // Arrange
      const shareToken = 'abc123';
      const expectedResponse = testUtils.createApiResponse(testCart);
      testClient.mockSuccess('post', '/cart/import', expectedResponse);

      // Act
      const response = await cartService.importSharedCart(shareToken);

      // Assert
      expect(response).toMatchObject({
        id: 'cart-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            mystery_box_id: 'box-electronics-001',
          }),
        ]),
      });
    });

    it('deve falhar ao importar carrinho com token inválido', async () => {
      // Arrange
      const shareToken = 'invalid-token';

      testClient.mockHttpError('post', '/cart/import', 400, {
        success: false,
        message: 'Token de compartilhamento inválido ou expirado',
        errors: { share_token: ['Token inválido'] },
      });

      // Act & Assert
      await expect(cartService.importSharedCart(shareToken)).rejects.toMatchObject({
        status: 400,
        message: 'Token de compartilhamento inválido ou expirado',
      });
    });
  });

  describe('Cenários de erro', () => {
    it('deve tratar erro de rede durante adição ao carrinho', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      testClient.mockNetworkError('post', '/cart/items');

      // Act & Assert
      await expect(cartService.addToCart(boxId, 1)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante checkout', async () => {
      // Arrange
      const checkoutData = {
        shipping_address_id: 'address-123',
        shipping_option_id: 'correios-pac',
        payment_method: 'credit_card' as const,
      };

      testClient.mockTimeout('post', '/orders');

      // Act & Assert
      await expect(cartService.checkout(checkoutData)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar erro 500 durante processamento de pagamento', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'João Silva',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      };

      testClient.mockHttpError('post', `/orders/${orderId}/payment`, 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });
  });
});