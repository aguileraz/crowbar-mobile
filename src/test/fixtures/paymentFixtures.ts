/**
 * Mock Fixtures para Payment (Pagamentos)
 *
 * Dados mock reutilizáveis para testes de integração de pagamentos.
 */

export const mockPaymentMethod = {
  id: 'pm-123',
  type: 'credit_card' as const,
  cardBrand: 'visa',
  cardLast4: '4242',
  cardExpMonth: 12,
  cardExpYear: 2026,
  cardholderName: 'JOAO SILVA',
  isDefault: true,
  createdAt: '2024-01-01T10:00:00Z',
};

export const mockPaymentMethodDebit = {
  id: 'pm-456',
  type: 'debit_card' as const,
  cardBrand: 'mastercard',
  cardLast4: '8888',
  cardExpMonth: 6,
  cardExpYear: 2025,
  cardholderName: 'JOAO SILVA',
  isDefault: false,
  createdAt: '2024-06-01T10:00:00Z',
};

export const mockPaymentMethods = [mockPaymentMethod, mockPaymentMethodDebit];

export const mockPaymentMethodsResponse = {
  success: true,
  data: mockPaymentMethods,
};

export const mockAddPaymentMethodRequest = {
  type: 'credit_card',
  cardToken: 'tok_visa_4242',
  cardholderName: 'JOAO SILVA',
  setAsDefault: true,
};

export const mockAddPaymentMethodResponse = {
  success: true,
  message: 'Método de pagamento adicionado com sucesso',
  data: mockPaymentMethod,
};

export const mockDeletePaymentMethodResponse = {
  success: true,
  message: 'Método de pagamento removido com sucesso',
};

export const mockPaymentIntent = {
  id: 'pi-123',
  amount: 5990,
  currency: 'BRL',
  status: 'requires_payment_method' as const,
  clientSecret: 'pi_123_secret_456',
  orderId: 'order-123',
  createdAt: '2025-01-06T10:00:00Z',
};

export const mockCreatePaymentIntentRequest = {
  orderId: 'order-123',
  amount: 5990,
  paymentMethod: 'credit_card',
};

export const mockCreatePaymentIntentResponse = {
  success: true,
  data: mockPaymentIntent,
};

export const mockConfirmPaymentRequest = {
  paymentIntentId: 'pi-123',
  paymentMethodId: 'pm-123',
  installments: 1,
};

export const mockConfirmPaymentResponse = {
  success: true,
  message: 'Pagamento confirmado com sucesso',
  data: {
    ...mockPaymentIntent,
    status: 'succeeded' as const,
    confirmedAt: '2025-01-06T10:05:00Z',
  },
};

export const mockPaymentFailed = {
  ...mockPaymentIntent,
  status: 'failed' as const,
  errorCode: 'card_declined',
  errorMessage: 'Cartão recusado',
};

export const mockPaymentFailedResponse = {
  success: false,
  error: 'Pagamento falhou',
  data: mockPaymentFailed,
};

export const mockPixPayment = {
  id: 'pix-123',
  orderId: 'order-123',
  amount: 5990,
  currency: 'BRL',
  qrCode: 'data:image/png;base64,iVBORw0KG...',
  qrCodeText: '00020126580014br.gov.bcb.pix...',
  expiresAt: '2025-01-06T11:00:00Z',
  status: 'pending' as const,
  createdAt: '2025-01-06T10:00:00Z',
};

export const mockCreatePixPaymentRequest = {
  orderId: 'order-123',
  amount: 5990,
};

export const mockCreatePixPaymentResponse = {
  success: true,
  message: 'PIX gerado com sucesso',
  data: mockPixPayment,
};

export const mockPixPaymentPaid = {
  ...mockPixPayment,
  status: 'paid' as const,
  paidAt: '2025-01-06T10:15:00Z',
};

export const mockCheckPixPaymentResponse = {
  success: true,
  data: mockPixPaymentPaid,
};

export const mockBoletoPayment = {
  id: 'boleto-123',
  orderId: 'order-123',
  amount: 5990,
  currency: 'BRL',
  barcode: '34191.79001 01043.510047 91020.150008 1 89520000005990',
  barcodeText: '34191790010104351004791020150008189520000005990',
  pdfUrl: 'https://example.com/boleto-123.pdf',
  expiresAt: '2025-01-09T23:59:59Z',
  status: 'pending' as const,
  createdAt: '2025-01-06T10:00:00Z',
};

export const mockCreateBoletoPaymentRequest = {
  orderId: 'order-123',
  amount: 5990,
};

export const mockCreateBoletoPaymentResponse = {
  success: true,
  message: 'Boleto gerado com sucesso',
  data: mockBoletoPayment,
};

export const mockInstallmentsOptions = [
  { installments: 1, amount: 5990, totalAmount: 5990, interestRate: 0 },
  { installments: 2, amount: 2995, totalAmount: 5990, interestRate: 0 },
  { installments: 3, amount: 1997, totalAmount: 5990, interestRate: 0 },
  { installments: 4, amount: 1573, totalAmount: 6292, interestRate: 5 },
  { installments: 5, amount: 1282, totalAmount: 6410, interestRate: 7 },
  { installments: 6, amount: 1087, totalAmount: 6522, interestRate: 9 },
];

export const mockInstallmentsOptionsResponse = {
  success: true,
  data: mockInstallmentsOptions,
};
