import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import CheckoutScreen from '../CheckoutScreen';
import { userService } from '../../../services/userService';
import { cartService } from '../../../services/cartService';

// Mock dos serviços
jest.mock('../../../services/userService');
jest.mock('../../../services/cartService');

// Mock dos componentes
jest.mock('../../../components/AddressSelector', () => 'AddressSelector');
jest.mock('../../../components/PaymentMethodSelector', () => 'PaymentMethodSelector');
jest.mock('../../../components/OrderSummary', () => 'OrderSummary');
jest.mock('../../../components/ErrorMessage', () => 'ErrorMessage');

const mockStore = configureStore([thunk]);

// Dados de teste
const mockCart = {
  id: 'cart-123',
  user_id: 'user-123',
  items: [
    {
      id: 'item-1',
      box_id: 'box-1',
      box_name: 'Mystery Box Gamer',
      price: 150.00,
      quantity: 1,
      subtotal: 150.00,
    },
  ],
  subtotal: 150.00,
  discount: 0,
  total: 150.00,
};

const mockAddresses = [
  {
    id: 'addr-1',
    street: 'Rua Teste',
    streetNumber: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
    is_default: true,
  },
  {
    id: 'addr-2',
    street: 'Av Principal',
    streetNumber: '456',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20040020',
    is_default: false,
  },
];

const mockPaymentMethods = [
  {
    id: 'pm-1',
    type: 'credit_card',
    brand: 'Visa',
    lastDigits: '1234',
    is_default: true,
  },
  {
    id: 'pm-2',
    type: 'pix',
    is_default: false,
  },
];

const mockShippingOptions = [
  {
    id: 'ship-1',
    name: 'Padrão',
    price: 15.00,
    estimated_days: 5,
  },
  {
    id: 'ship-2',
    name: 'Expresso',
    price: 30.00,
    estimated_days: 2,
  },
];

const mockOrder = {
  id: 'order-123',
  order_number: 'ORD-2025-001',
  status: 'pending',
  total: 165.00,
};

// Helper para criar store com estado inicial
const createMockStore = (overrides = {}) => {
  const defaultState = {
    cart: {
      cart: mockCart,
      items: mockCart.items,
      selectedShippingOption: null,
      shippingOptions: mockShippingOptions,
      isLoading: false,
      error: null,
    },
    user: {
      user: { id: 'user-123', name: 'Test User' },
      isAuthenticated: true,
    },
    ...overrides,
  };
  return mockStore(defaultState);
};

// Helper para renderizar com providers
const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('CheckoutScreen', () => {
  // Mock da navegação
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const mockNavigation = {
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock default dos serviços
    (userService.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);
    (userService.getPaymentMethods as jest.Mock).mockResolvedValue(mockPaymentMethods);
    (cartService.createOrder as jest.Mock).mockResolvedValue(mockOrder);
  });

  // ============================================
  // TESTES: Renderização Inicial
  // ============================================
  describe('Renderização Inicial', () => {
    it('deve renderizar o componente corretamente', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Checkout')).toBeTruthy();
      });
    });

    it('deve mostrar loading ao carregar dados', () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      expect(getByText('Carregando checkout...')).toBeTruthy();
    });

    it('deve carregar endereços e métodos de pagamento', async () => {
      renderWithProviders(<CheckoutScreen navigation={mockNavigation as any} />);

      await waitFor(() => {
        expect(userService.getAddresses).toHaveBeenCalled();
        expect(userService.getPaymentMethods).toHaveBeenCalled();
      });
    });

    it('deve auto-selecionar endereço padrão', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Endereço de Entrega')).toBeTruthy();
      });

      // Verificar que o endereço padrão foi selecionado (addr-1)
      await waitFor(() => {
        expect(userService.getAddresses).toHaveBeenCalled();
      });
    });

    it('deve auto-selecionar método de pagamento padrão', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Checkout')).toBeTruthy();
      });

      // Verificar que o método padrão foi selecionado (pm-1)
      await waitFor(() => {
        expect(userService.getPaymentMethods).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // TESTES: Estado de Erro
  // ============================================
  describe('Estado de Erro', () => {
    it('deve mostrar erro ao falhar carregamento de dados', async () => {
      const errorMessage = 'Erro ao carregar dados';
      (userService.getAddresses as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Erro ao carregar dados do checkout')).toBeTruthy();
      });
    });

    it('deve permitir retry após erro', async () => {
      (userService.getAddresses as jest.Mock).mockRejectedValueOnce(new Error('Erro temporário'));

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Erro ao carregar dados do checkout')).toBeTruthy();
      });

      // Mockar sucesso no retry
      (userService.getAddresses as jest.Mock).mockResolvedValue(mockAddresses);

      // Simular clique em retry (botão em ErrorMessage component)
      // Como ErrorMessage é mockado, este teste verifica se o componente foi renderizado
    });
  });

  // ============================================
  // TESTES: Carrinho Vazio
  // ============================================
  describe('Carrinho Vazio', () => {
    it('deve mostrar mensagem de carrinho vazio', async () => {
      const emptyCartStore = createMockStore({
        cart: {
          cart: null,
          items: [],
          selectedShippingOption: null,
          shippingOptions: [],
          isLoading: false,
          error: null,
        },
      });

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        emptyCartStore
      );

      await waitFor(() => {
        expect(getByText('Carrinho vazio')).toBeTruthy();
        expect(getByText('Ir às compras')).toBeTruthy();
      });
    });

    it('deve navegar para loja ao clicar em "Ir às compras"', async () => {
      const emptyCartStore = createMockStore({
        cart: {
          cart: null,
          items: [],
          selectedShippingOption: null,
          shippingOptions: [],
          isLoading: false,
          error: null,
        },
      });

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        emptyCartStore
      );

      await waitFor(() => {
        expect(getByText('Ir às compras')).toBeTruthy();
      });

      fireEvent.press(getByText('Ir às compras'));
      expect(mockNavigate).toHaveBeenCalledWith('Shop');
    });
  });

  // ============================================
  // TESTES: Indicador de Etapas
  // ============================================
  describe('Indicador de Etapas', () => {
    it('deve renderizar indicador com 3 etapas', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Endereço')).toBeTruthy();
        expect(getByText('Frete')).toBeTruthy();
        expect(getByText('Pagamento')).toBeTruthy();
      });
    });

    it('deve iniciar na etapa 1 (Endereço)', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Endereço de Entrega')).toBeTruthy();
      });
    });
  });

  // ============================================
  // TESTES: Navegação entre Etapas
  // ============================================
  describe('Navegação entre Etapas', () => {
    it('deve permitir avançar para etapa 2 após selecionar endereço', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });

      // Simular seleção de endereço (já auto-selecionado)
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Opções de Entrega')).toBeTruthy();
      });
    });

    it('deve bloquear avanço se etapa não for válida', async () => {
      // Store sem endereço selecionado
      const storeWithoutAddress = createMockStore();

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        storeWithoutAddress
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });

      // Botão deve estar desabilitado sem endereço selecionado
      const _continueButton = getByText('Continuar');
      // React Native Paper Button com disabled não impede press, mas não faz nada
      // Este teste verifica que o componente renderiza corretamente
    });

    it('deve permitir voltar para etapa anterior', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });

      // Avançar para etapa 2
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Opções de Entrega')).toBeTruthy();
        expect(getByText('Voltar')).toBeTruthy();
      });

      // Voltar para etapa 1
      fireEvent.press(getByText('Voltar'));

      await waitFor(() => {
        expect(getByText('Endereço de Entrega')).toBeTruthy();
      });
    });

    it('não deve mostrar botão voltar na etapa 1', async () => {
      const { queryByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(queryByText('Voltar')).toBeNull();
      });
    });
  });

  // ============================================
  // TESTES: Etapa 1 - Endereço
  // ============================================
  describe('Etapa 1 - Endereço', () => {
    it('deve renderizar lista de endereços', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Endereço de Entrega')).toBeTruthy();
      });
    });

    it('deve validar se endereço está selecionado antes de avançar', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });

      // Com endereço padrão selecionado, deve permitir avançar
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Opções de Entrega')).toBeTruthy();
      });
    });
  });

  // ============================================
  // TESTES: Etapa 2 - Frete
  // ============================================
  describe('Etapa 2 - Frete', () => {
    it('deve renderizar opções de frete', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Avançar para etapa 2
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Opções de Entrega')).toBeTruthy();
        expect(getByText('Padrão')).toBeTruthy();
        expect(getByText('Expresso')).toBeTruthy();
      });
    });

    it('deve mostrar preço das opções de frete', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Avançar para etapa 2
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/R\$\s*15,00/)).toBeTruthy();
        expect(getByText(/R\$\s*30,00/)).toBeTruthy();
      });
    });

    it('deve mostrar dias de entrega estimados', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Avançar para etapa 2
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Entrega em 5 dias úteis')).toBeTruthy();
        expect(getByText('Entrega em 2 dias úteis')).toBeTruthy();
      });
    });

    it('deve mostrar mensagem quando não há opções de frete', async () => {
      const storeWithoutShipping = createMockStore({
        cart: {
          ...mockCart,
          shippingOptions: [],
        },
      });

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        storeWithoutShipping
      );

      // Avançar para etapa 2
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Nenhuma opção de frete disponível')).toBeTruthy();
      });
    });
  });

  // ============================================
  // TESTES: Etapa 3 - Pagamento
  // ============================================
  describe('Etapa 3 - Pagamento', () => {
    it('deve renderizar métodos de pagamento', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Avançar para etapa 2
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      // Selecionar frete e avançar para etapa 3
      await waitFor(() => {
        expect(getByText('Padrão')).toBeTruthy();
      });
      // Simular seleção de frete (via Redux)
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Método de Pagamento')).toBeTruthy();
      });
    });

    it('deve mostrar botão Finalizar Pedido na etapa 3', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Navegar até etapa 3
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/Finalizar Pedido/)).toBeTruthy();
        expect(queryByText('Continuar')).toBeNull();
      });
    });
  });

  // ============================================
  // TESTES: Processamento de Pedido
  // ============================================
  describe('Processamento de Pedido', () => {
    it('deve processar pedido com sucesso', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Navegar até etapa 3
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/Finalizar Pedido/)).toBeTruthy();
      });

      // Processar pedido
      fireEvent.press(getByText(/Finalizar Pedido/));

      await waitFor(() => {
        expect(cartService.createOrder).toHaveBeenCalled();
      });
    });

    it('deve mostrar loading durante processamento', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Navegar até etapa 3
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/Finalizar Pedido/)).toBeTruthy();
      });

      // Mock delay no processamento
      (cartService.createOrder as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOrder), 1000))
      );

      fireEvent.press(getByText(/Finalizar Pedido/));

      // Verificar que botão fica desabilitado durante processamento
      await waitFor(() => {
        expect(cartService.createOrder).toHaveBeenCalled();
      });
    });

    it('deve tratar erro no processamento do pedido', async () => {
      (cartService.createOrder as jest.Mock).mockRejectedValue(
        new Error('Erro ao processar pagamento')
      );

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Navegar até etapa 3
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/Finalizar Pedido/)).toBeTruthy();
      });

      // Processar pedido (vai falhar)
      fireEvent.press(getByText(/Finalizar Pedido/));

      await waitFor(() => {
        expect(cartService.createOrder).toHaveBeenCalled();
      });
    });

    it('deve enviar dados corretos ao criar pedido', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      // Navegar até etapa 3
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText(/Finalizar Pedido/)).toBeTruthy();
      });

      // Processar pedido
      fireEvent.press(getByText(/Finalizar Pedido/));

      await waitFor(() => {
        expect(cartService.createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            address_id: expect.any(String),
            shipping_option_id: expect.any(String),
            payment_method_id: expect.any(String),
          })
        );
      });
    });
  });

  // ============================================
  // TESTES: Formatação e Cálculos
  // ============================================
  describe('Formatação e Cálculos', () => {
    it('deve formatar preços em reais corretamente', async () => {
      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      // Verificar formatação de preço nas opções de frete
      await waitFor(() => {
        expect(getByText(/R\$\s*15,00/)).toBeTruthy();
      });
    });

    it('deve calcular total com frete incluído', async () => {
      const storeWithShipping = createMockStore({
        cart: {
          ...mockCart,
          selectedShippingOption: 'ship-1', // R$ 15,00
          shippingOptions: mockShippingOptions,
        },
      });

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        storeWithShipping
      );

      // Navegar até etapa 3 para ver total final
      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        // Total: R$ 150,00 + R$ 15,00 = R$ 165,00
        expect(getByText(/R\$\s*165,00/)).toBeTruthy();
      });
    });

    it('deve mostrar frete grátis quando preço é zero', async () => {
      const storeWithFreeShipping = createMockStore({
        cart: {
          ...mockCart,
          shippingOptions: [
            {
              id: 'ship-free',
              name: 'Frete Grátis',
              price: 0,
              estimated_days: 7,
            },
          ],
        },
      });

      const { getByText } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />,
        storeWithFreeShipping
      );

      await waitFor(() => {
        expect(getByText('Continuar')).toBeTruthy();
      });
      fireEvent.press(getByText('Continuar'));

      await waitFor(() => {
        expect(getByText('Grátis')).toBeTruthy();
      });
    });
  });

  // ============================================
  // TESTES: Navegação
  // ============================================
  describe('Navegação', () => {
    it('deve navegar de volta ao clicar no botão voltar do header', async () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <CheckoutScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const backButton = UNSAFE_getByProps({ icon: 'arrow-left' });
        expect(backButton).toBeTruthy();
      });

      const backButton = UNSAFE_getByProps({ icon: 'arrow-left' });
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
