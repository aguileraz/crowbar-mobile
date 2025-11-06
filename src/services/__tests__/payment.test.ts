/**
 * Testes Unit

ários para Funcionalidade de Pagamento
 *
 * Testa processamento de pagamento via Pagar.me incluindo:
 * - PIX (QR Code geração)
 * - Cartão de Crédito (com parcelamento)
 * - Boleto Bancário (geração de URL)
 *
 * @priority CRITICAL - Feature crítica para revenue
 * @coverage Target: 100% (payment é crítico)
 */

import { cartService } from '../cartService';
import { apiClient } from '../api';

// Mock apiClient
jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Payment Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment - PIX', () => {
    it('deve processar pagamento PIX com sucesso', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'pix' as const,
      };

      const mockResponse = {
        status: 'pending',
        payment_id: 'pix-456',
        pix_qr_code: 'data:image/png;base64,iVBORw0KGgo...',
        message: 'Pagamento PIX pendente. Escaneie o QR Code.',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        `/orders/${orderId}/payment`,
        paymentData
      );
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('pending');
      expect(result.pix_qr_code).toBeDefined();
      expect(result.payment_id).toBe('pix-456');
    });

    it('deve tratar erro de geração PIX QR Code', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'pix' as const };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Erro ao gerar QR Code PIX' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 500,
          data: { message: 'Erro ao gerar QR Code PIX' },
        },
      });
    });

    it('deve validar que PIX retorna QR Code', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'pix' as const };

      const mockResponse = {
        status: 'pending',
        payment_id: 'pix-789',
        pix_qr_code: 'data:image/png;base64,abc123...',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(result.pix_qr_code).toBeDefined();
      expect(result.pix_qr_code).toContain('data:image/png');
      expect(result.status).toBe('pending'); // PIX sempre pending inicialmente
    });
  });

  describe('processPayment - Cartão de Crédito', () => {
    it('deve processar pagamento cartão de crédito com sucesso', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111', // Visa test card
          holder_name: 'JOAO DA SILVA',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      };

      const mockResponse = {
        status: 'success',
        payment_id: 'card-456',
        message: 'Pagamento aprovado',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        `/orders/${orderId}/payment`,
        paymentData
      );
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.payment_id).toBe('card-456');
    });

    it('deve processar pagamento parcelado (12x)', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '5555555555554444', // Mastercard test
          holder_name: 'MARIA SANTOS',
          expiry_month: '06',
          expiry_year: '2026',
          cvv: '456',
        },
        installments: 12,
      };

      const mockResponse = {
        status: 'success',
        payment_id: 'card-789',
        message: 'Pagamento aprovado em 12x',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(result.status).toBe('success');
      expect(paymentData.installments).toBe(12);
      expect(result.message).toContain('12x');
    });

    it('deve tratar erro de cartão recusado', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4000000000000002', // Test card que gera declined
          holder_name: 'TESTE RECUSA',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 1,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          status: 'failed',
          payment_id: 'card-fail-123',
          message: 'Cartão recusado. Entre em contato com o banco.',
        },
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.message).toContain('recusado');
    });

    it('deve tratar erro de cartão expirado', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'TESTE EXPIRADO',
          expiry_month: '12',
          expiry_year: '2020', // Ano passado
          cvv: '123',
        },
        installments: 1,
      };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Cartão expirado' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: 'Cartão expirado' },
        },
      });
    });

    it('deve tratar erro de CVV inválido', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'TESTE CVV',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '000', // CVV inválido
        },
        installments: 1,
      };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'CVV inválido' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });

    it('deve tratar erro de dados de cartão ausentes', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        // card_data ausente
        installments: 1,
      };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Dados do cartão são obrigatórios' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData as any)).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });
  });

  describe('processPayment - Boleto', () => {
    it('deve processar pagamento boleto com sucesso', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'boleto' as const,
      };

      const mockResponse = {
        status: 'pending',
        payment_id: 'boleto-456',
        boleto_url: 'https://pagarme.com.br/boletos/abc123.pdf',
        message: 'Boleto gerado. Vencimento em 3 dias úteis.',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith(
        `/orders/${orderId}/payment`,
        paymentData
      );
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('pending');
      expect(result.boleto_url).toBeDefined();
      expect(result.boleto_url).toContain('.pdf');
      expect(result.payment_id).toBe('boleto-456');
    });

    it('deve validar que boleto retorna URL de download', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'boleto' as const };

      const mockResponse = {
        status: 'pending',
        payment_id: 'boleto-789',
        boleto_url: 'https://pagarme.com.br/boletos/def456.pdf',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(result.boleto_url).toBeDefined();
      expect(result.boleto_url).toMatch(/^https?:\/\//); // URL válida
      expect(result.status).toBe('pending'); // Boleto sempre pending até pagamento
    });

    it('deve tratar erro de geração de boleto', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'boleto' as const };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Erro ao gerar boleto' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });
  });

  describe('checkPaymentStatus', () => {
    it('deve verificar status de pagamento pendente', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockResponse = {
        status: 'pending',
        payment_id: 'pay-123',
        updated_at: '2025-11-03T10:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.checkPaymentStatus(orderId);

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith(`/orders/${orderId}/payment/_status`);
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('pending');
    });

    it('deve verificar status de pagamento pago', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockResponse = {
        status: 'paid',
        payment_id: 'pay-456',
        updated_at: '2025-11-03T10:05:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.checkPaymentStatus(orderId);

      // Assert
      expect(result.status).toBe('paid');
    });

    it('deve verificar status de pagamento falhado', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockResponse = {
        status: 'failed',
        payment_id: 'pay-789',
        updated_at: '2025-11-03T10:10:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.checkPaymentStatus(orderId);

      // Assert
      expect(result.status).toBe('failed');
    });

    it('deve verificar status de pagamento reembolsado', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockResponse = {
        status: 'refunded',
        payment_id: 'pay-refund-123',
        updated_at: '2025-11-03T10:15:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      // Act
      const result = await cartService.checkPaymentStatus(orderId);

      // Assert
      expect(result.status).toBe('refunded');
    });

    it('deve tratar erro ao verificar status de pagamento', async () => {
      // Arrange
      const orderId = 'order-invalid';

      (apiClient.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Pedido não encontrado' },
        },
      });

      // Act & Assert
      await expect(cartService.checkPaymentStatus(orderId)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve tratar timeout durante processamento', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'TIMEOUT TEST',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
      };

      (apiClient.post as jest.Mock).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('deve tratar erro de rede', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'pix' as const };

      (apiClient.post as jest.Mock).mockRejectedValue({
        code: 'ENETUNREACH',
        message: 'Network unreachable',
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        code: 'ENETUNREACH',
      });
    });

    it('deve tratar resposta malformada do backend', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'pix' as const };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: null, // Resposta inválida
      });

      // Act
      const result = await cartService.processPayment(orderId, paymentData);

      // Assert
      expect(result).toBeNull();
    });

    it('deve tratar erro 401 (não autenticado)', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'pix' as const };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Token expirado' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 401,
        },
      });
    });

    it('deve tratar erro 403 (sem permissão)', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'credit_card' as const, card_data: {} as any };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Usuário não tem permissão para processar pagamento' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 403,
        },
      });
    });

    it('deve tratar erro 500 (erro do servidor)', async () => {
      // Arrange
      const orderId = 'order-123';
      const paymentData = { method: 'boleto' as const };

      (apiClient.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Erro interno do servidor' },
        },
      });

      // Act & Assert
      await expect(cartService.processPayment(orderId, paymentData)).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });
  });

  describe('Integração Pagar.me - Cenários Reais', () => {
    it('deve simular fluxo completo PIX: criação → verificação → pagamento', async () => {
      // Arrange
      const orderId = 'order-real-123';

      // Step 1: Processar pagamento PIX
      const mockProcessResponse = {
        status: 'pending',
        payment_id: 'pix-real-456',
        pix_qr_code: 'data:image/png;base64,real-qr-code',
        message: 'Aguardando pagamento PIX',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: mockProcessResponse,
      });

      const processResult = await cartService.processPayment(orderId, { method: 'pix' });

      expect(processResult.status).toBe('pending');
      expect(processResult.pix_qr_code).toBeDefined();

      // Step 2: Verificar status (ainda pendente)
      const mockStatusPending = {
        status: 'pending',
        payment_id: 'pix-real-456',
        updated_at: '2025-11-03T10:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockStatusPending,
      });

      const statusCheck1 = await cartService.checkPaymentStatus(orderId);
      expect(statusCheck1.status).toBe('pending');

      // Step 3: Verificar status (pago após 30s)
      const mockStatusPaid = {
        status: 'paid',
        payment_id: 'pix-real-456',
        updated_at: '2025-11-03T10:00:30Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockStatusPaid,
      });

      const statusCheck2 = await cartService.checkPaymentStatus(orderId);
      expect(statusCheck2.status).toBe('paid');
    });

    it('deve simular fluxo completo Cartão: tentativa → recusa → sucesso', async () => {
      // Arrange
      const orderId = 'order-card-123';
      const paymentData = {
        method: 'credit_card' as const,
        card_data: {
          number: '4111111111111111',
          holder_name: 'CLIENTE TESTE',
          expiry_month: '12',
          expiry_year: '2025',
          cvv: '123',
        },
        installments: 3,
      };

      // Step 1: Primeira tentativa recusada
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          status: 'failed',
          payment_id: 'card-fail-1',
          message: 'Saldo insuficiente',
        },
      });

      const attempt1 = await cartService.processPayment(orderId, paymentData);
      expect(attempt1.status).toBe('failed');

      // Step 2: Segunda tentativa com outro cartão (sucesso)
      const newPaymentData = {
        ...paymentData,
        card_data: {
          ...paymentData.card_data,
          number: '5555555555554444', // Outro cartão
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          status: 'success',
          payment_id: 'card-success-2',
          message: 'Pagamento aprovado em 3x',
        },
      });

      const attempt2 = await cartService.processPayment(orderId, newPaymentData);
      expect(attempt2.status).toBe('success');
      expect(attempt2.message).toContain('3x');
    });
  });
});
