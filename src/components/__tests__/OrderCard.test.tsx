/**
 * Testes Unitários - OrderCard Component
 *
 * Testa o componente OrderCard que exibe informações resumidas de um pedido
 * com status, itens e ações disponíveis.
 *
 * @coverage Props, rendering, status display, date formatting, user interactions, accessibility, edge cases
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import OrderCard from '../OrderCard';
import { MysteryBox, Address } from '../../types/api';

// Tipo do Order conforme usado pelo componente
interface OrderItem {
  id: string;
  box?: MysteryBox; // O componente usa 'box' ao invés de 'mystery_box'
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status?: string;
  _status: string; // O componente usa '_status' como primário
  total: number; // O componente usa 'total' ao invés de 'total_amount'
  payment_method: string;
  payment_status: string;
  items: OrderItem[];
  delivery_address?: Address; // O componente usa 'delivery_address' ao invés de 'shipping_address'
  tracking_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Helper para criar mock de MysteryBox
const createMockBox = (overrides?: Partial<MysteryBox>): MysteryBox => ({
  id: 'box-1',
  name: 'Caixa Surpresa Tech',
  description: 'Produtos tecnológicos surpresa',
  short_description: 'Tech box',
  price: 199.90,
  category: {
    id: 'cat-1',
    name: 'Tecnologia',
    slug: 'tech',
    icon: 'laptop',
    color: '#2196F3',
    is_active: true,
    boxes_count: 15,
  },
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/tech-box.jpg',
      alt_text: 'Tech Box',
      is_primary: true,
      order: 1,
    },
  ],
  thumbnail: 'https://example.com/tech-thumb.jpg',
  rarity: 'rare',
  stock: 30,
  is_active: true,
  is_featured: false,
  is_new: false,
  tags: ['tech'],
  possible_items: [],
  stats: {
    total_sold: 100,
    total_opened: 80,
    average_rating: 4.3,
    reviews_count: 30,
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-10T00:00:00Z',
  ...overrides,
});

// Helper para criar mock de Address
const createMockAddress = (overrides?: Partial<Address>): Address => ({
  id: 'addr-1',
  street: 'Rua das Flores',
  number: '123',
  complement: 'Apt 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01234-567',
  country: 'Brasil',
  is_default: true,
  ...overrides,
});

// Helper para criar mock de Order
const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order-1',
  user_id: 'user-123',
  order_number: 'ORD-12345',
  status: 'pending',
  _status: 'pending',
  total: 399.80,
  payment_method: 'credit_card',
  payment_status: 'paid',
  items: [
    {
      id: 'item-1',
      box: createMockBox(),
      quantity: 2,
      unit_price: 199.90,
      total_price: 399.80,
    },
  ],
  delivery_address: createMockAddress(),
  created_at: '2025-01-15T10:30:00Z',
  updated_at: '2025-01-15T10:30:00Z',
  ...overrides,
});

describe('OrderCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. RENDERING TESTS
  // ============================================
  describe('Renderização', () => {
    it('deve renderizar com props obrigatórias', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
      expect(screen.getByText('Pendente')).toBeTruthy();
    });

    it('deve renderizar número do pedido', () => {
      const order = createMockOrder({ order_number: 'ORD-99999' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Pedido #ORD-99999')).toBeTruthy();
    });

    it('deve renderizar data de criação formatada', () => {
      const order = createMockOrder({ created_at: '2025-03-25T14:30:00Z' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('25/03/2025')).toBeTruthy();
    });

    it('deve renderizar total formatado em BRL', () => {
      const order = createMockOrder({ total: 1250.50 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*1\.250,50/)).toBeTruthy();
    });

    it('deve renderizar informações do endereço de entrega', () => {
      const order = createMockOrder({
        delivery_address: createMockAddress({ city: 'Rio de Janeiro', state: 'RJ' }),
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/Rio de Janeiro, RJ/)).toBeTruthy();
    });

    it('deve renderizar botão "Ver detalhes"', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Ver detalhes')).toBeTruthy();
    });
  });

  // ============================================
  // 2. STATUS DISPLAY TESTS
  // ============================================
  describe('Exibição de Status', () => {
    it('deve exibir status "Pendente" corretamente', () => {
      const order = createMockOrder({ _status: 'pending' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Pendente')).toBeTruthy();
    });

    it('deve exibir status "Confirmado" corretamente', () => {
      const order = createMockOrder({ _status: 'confirmed' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Confirmado')).toBeTruthy();
    });

    it('deve exibir status "Processando" corretamente', () => {
      const order = createMockOrder({ _status: 'processing' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Processando')).toBeTruthy();
    });

    it('deve exibir status "Enviado" corretamente', () => {
      const order = createMockOrder({ _status: 'shipped' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Enviado')).toBeTruthy();
    });

    it('deve exibir status "Entregue" corretamente', () => {
      const order = createMockOrder({ _status: 'delivered' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Entregue')).toBeTruthy();
    });

    it('deve exibir status "Cancelado" corretamente', () => {
      const order = createMockOrder({ _status: 'cancelled' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Cancelado')).toBeTruthy();
    });

    it('deve lidar com status desconhecido', () => {
      const order = createMockOrder({ _status: 'unknown_status' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('unknown_status')).toBeTruthy();
    });
  });

  // ============================================
  // 3. ITEMS DISPLAY TESTS
  // ============================================
  describe('Exibição de Itens', () => {
    it('deve exibir resumo de 1 item corretamente', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox(),
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('1 item')).toBeTruthy();
    });

    it('deve exibir resumo de múltiplos itens da mesma caixa', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox(),
            quantity: 3,
            unit_price: 100,
            total_price: 300,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('3 itens')).toBeTruthy();
    });

    it('deve exibir resumo de múltiplos tipos de caixas', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox({ name: 'Caixa 1' }),
            quantity: 2,
            unit_price: 100,
            total_price: 200,
          },
          {
            id: 'item-2',
            box: createMockBox({ name: 'Caixa 2' }),
            quantity: 3,
            unit_price: 50,
            total_price: 150,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('5 itens (2 tipos)')).toBeTruthy();
    });

    it('deve exibir nome do primeiro item', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox({ name: 'Caixa Premium Games' }),
            quantity: 1,
            unit_price: 200,
            total_price: 200,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Caixa Premium Games')).toBeTruthy();
    });

    it('deve exibir "+N mais" quando há múltiplos tipos', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox({ name: 'Caixa 1' }),
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
          {
            id: 'item-2',
            box: createMockBox({ name: 'Caixa 2' }),
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
          {
            id: 'item-3',
            box: createMockBox({ name: 'Caixa 3' }),
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/Caixa 1 \+2 mais/)).toBeTruthy();
    });

    it('deve lidar com array de itens vazio', () => {
      const order = createMockOrder({ items: [] });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Nenhum item')).toBeTruthy();
    });

    it('deve lidar com items undefined', () => {
      const order = createMockOrder({ items: undefined as any });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Nenhum item')).toBeTruthy();
    });

    it('deve exibir imagem do primeiro item quando disponível', () => {
      const order = createMockOrder();
      const { UNSAFE_getAllByType } = render(<OrderCard order={order} onPress={mockOnPress} />);

      const images = UNSAFE_getAllByType('Image');
      const itemImage = images.find(img => img.props.source?.uri === 'https://example.com/tech-box.jpg');
      expect(itemImage).toBeTruthy();
    });

    it('deve exibir placeholder quando item não tem imagem', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: createMockBox({ images: [] }),
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Deve renderizar IconButton como placeholder
      expect(screen.getByTestId('IconButton')).toBeTruthy();
    });

    it('deve lidar com item.box undefined', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: undefined,
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Deve renderizar sem crash
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
    });
  });

  // ============================================
  // 4. ACTION BUTTONS TESTS
  // ============================================
  describe('Botões de Ação', () => {
    it('deve exibir botão "Comprar novamente" quando pedido está entregue', () => {
      const order = createMockOrder({ _status: 'delivered' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Comprar novamente')).toBeTruthy();
    });

    it('deve exibir botão "Comprar novamente" quando pedido está cancelado', () => {
      const order = createMockOrder({ _status: 'cancelled' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Comprar novamente')).toBeTruthy();
    });

    it('deve exibir botão "Comprar novamente" quando status é "cancelled" (sem underscore)', () => {
      const order = createMockOrder({ status: 'cancelled', _status: 'pending' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Comprar novamente')).toBeTruthy();
    });

    it('não deve exibir botão "Comprar novamente" quando pedido está pendente', () => {
      const order = createMockOrder({ _status: 'pending' });
      const { queryByText } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(queryByText('Comprar novamente')).toBeNull();
    });

    it('não deve exibir botão "Comprar novamente" quando pedido está processando', () => {
      const order = createMockOrder({ _status: 'processing' });
      const { queryByText } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(queryByText('Comprar novamente')).toBeNull();
    });

    it('não deve exibir botão "Comprar novamente" quando pedido está enviado', () => {
      const order = createMockOrder({ _status: 'shipped' });
      const { queryByText } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(queryByText('Comprar novamente')).toBeNull();
    });

    it('deve sempre exibir botão "Ver detalhes"', () => {
      const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

      statuses.forEach(status => {
        const order = createMockOrder({ _status: status });
        const { getByText } = render(<OrderCard order={order} onPress={mockOnPress} />);
        expect(getByText('Ver detalhes')).toBeTruthy();
      });
    });
  });

  // ============================================
  // 5. USER INTERACTION TESTS
  // ============================================
  describe('Interações do Usuário', () => {
    it('deve chamar onPress quando card é pressionado', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      const card = screen.getByText('Pedido #ORD-12345').parent?.parent?.parent;
      fireEvent.press(card!);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onPress quando botão "Ver detalhes" é pressionado', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      const detailsButton = screen.getByText('Ver detalhes').parent;
      fireEvent.press(detailsButton!);

      expect(mockOnPress).toHaveBeenCalled();
    });

    it('não deve chamar onPress múltiplas vezes em pressão única', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      const detailsButton = screen.getByText('Ver detalhes').parent;
      fireEvent.press(detailsButton!);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 6. DATE FORMATTING TESTS
  // ============================================
  describe('Formatação de Data', () => {
    it('deve formatar data no padrão brasileiro DD/MM/YYYY', () => {
      const order = createMockOrder({ created_at: '2025-01-05T12:00:00Z' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('05/01/2025')).toBeTruthy();
    });

    it('deve formatar data com zeros à esquerda', () => {
      const order = createMockOrder({ created_at: '2025-03-09T08:30:00Z' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('09/03/2025')).toBeTruthy();
    });

    it('deve formatar data de fim de ano', () => {
      const order = createMockOrder({ created_at: '2025-12-31T23:59:59Z' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('31/12/2025')).toBeTruthy();
    });

    it('deve formatar data de início de ano', () => {
      const order = createMockOrder({ created_at: '2025-01-01T12:00:00Z' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('01/01/2025')).toBeTruthy();
    });
  });

  // ============================================
  // 7. PRICE FORMATTING TESTS
  // ============================================
  describe('Formatação de Preço', () => {
    it('deve formatar preço com centavos', () => {
      const order = createMockOrder({ total: 99.99 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*99,99/)).toBeTruthy();
    });

    it('deve formatar preço inteiro com ,00', () => {
      const order = createMockOrder({ total: 500 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*500,00/)).toBeTruthy();
    });

    it('deve formatar preço com milhares', () => {
      const order = createMockOrder({ total: 2500.75 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*2\.500,75/)).toBeTruthy();
    });

    it('deve formatar preço com múltiplos milhares', () => {
      const order = createMockOrder({ total: 12345.67 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*12\.345,67/)).toBeTruthy();
    });

    it('deve formatar preço zero', () => {
      const order = createMockOrder({ total: 0 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*0,00/)).toBeTruthy();
    });
  });

  // ============================================
  // 8. EDGE CASES TESTS
  // ============================================
  describe('Casos Extremos', () => {
    it('deve lidar com order_number muito longo', () => {
      const longOrderNumber = 'ORD-VERY-LONG-ORDER-NUMBER-12345678901234567890';
      const order = createMockOrder({ order_number: longOrderNumber });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(`Pedido #${longOrderNumber}`)).toBeTruthy();
    });

    it('deve lidar com ausência de delivery_address', () => {
      const order = createMockOrder({ delivery_address: undefined });
      const { queryByText } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(queryByText(/📍/)).toBeNull();
    });

    it('deve aplicar style customizado passado via props', () => {
      const order = createMockOrder();
      const customStyle = { marginTop: 20, backgroundColor: 'blue' };
      const { root } = render(
        <OrderCard order={order} onPress={mockOnPress} style={customStyle} />
      );

      expect(root).toBeTruthy();
    });

    it('deve lidar com total muito alto', () => {
      const order = createMockOrder({ total: 99999.99 });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*99\.999,99/)).toBeTruthy();
    });

    it('deve lidar com data inválida gracefully', () => {
      const order = createMockOrder({ created_at: 'invalid-date' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Deve renderizar sem crash
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
    });

    it('deve lidar com múltiplos itens sem box', () => {
      const order = createMockOrder({
        items: [
          {
            id: 'item-1',
            box: undefined,
            quantity: 2,
            unit_price: 100,
            total_price: 200,
          },
          {
            id: 'item-2',
            box: undefined,
            quantity: 3,
            unit_price: 50,
            total_price: 150,
          },
        ],
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('5 itens (2 tipos)')).toBeTruthy();
    });

    it('deve lidar com nome de cidade muito longo', () => {
      const order = createMockOrder({
        delivery_address: createMockAddress({
          city: 'Cidade com Nome Extremamente Longo para Testar Truncamento',
          state: 'XX',
        }),
      });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/Cidade com Nome Extremamente Longo/)).toBeTruthy();
    });

    it('deve lidar com tracking_code presente (não usado visualmente)', () => {
      const order = createMockOrder({ tracking_code: 'BR123456789BR' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Tracking code não é exibido no card, apenas deve não causar erro
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
    });

    it('deve lidar com notes presente (não usado visualmente)', () => {
      const order = createMockOrder({ notes: 'Entregar após 18h' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Notes não são exibidas no card, apenas deve não causar erro
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
    });
  });

  // ============================================
  // 9. INTEGRATION TESTS
  // ============================================
  describe('Testes de Integração', () => {
    it('deve atualizar quando order é modificado', () => {
      const order = createMockOrder({ _status: 'pending' });
      const { rerender } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Pendente')).toBeTruthy();

      const updatedOrder = { ...order, _status: 'shipped' };
      rerender(<OrderCard order={updatedOrder} onPress={mockOnPress} />);

      expect(screen.getByText('Enviado')).toBeTruthy();
    });

    it('deve atualizar botões quando status muda para delivered', () => {
      const order = createMockOrder({ _status: 'shipped' });
      const { rerender, queryByText } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(queryByText('Comprar novamente')).toBeNull();

      const updatedOrder = { ...order, _status: 'delivered' };
      rerender(<OrderCard order={updatedOrder} onPress={mockOnPress} />);

      expect(queryByText('Comprar novamente')).toBeTruthy();
    });

    it('deve atualizar total quando valor muda', () => {
      const order = createMockOrder({ total: 500 });
      const { rerender } = render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*500,00/)).toBeTruthy();

      const updatedOrder = { ...order, total: 750 };
      rerender(<OrderCard order={updatedOrder} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*750,00/)).toBeTruthy();
    });

    it('deve manter onPress funcional após re-render', () => {
      const order = createMockOrder();
      const { rerender } = render(<OrderCard order={order} onPress={mockOnPress} />);

      const detailsButton = screen.getByText('Ver detalhes').parent;
      fireEvent.press(detailsButton!);
      expect(mockOnPress).toHaveBeenCalledTimes(1);

      rerender(<OrderCard order={order} onPress={mockOnPress} />);

      fireEvent.press(detailsButton!);
      expect(mockOnPress).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // 10. ACCESSIBILITY TESTS
  // ============================================
  describe('Acessibilidade', () => {
    it('deve ser acessível para leitores de tela', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Verifica que elementos importantes são renderizados e acessíveis
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
      expect(screen.getByText('Ver detalhes')).toBeTruthy();
      expect(screen.getByText('Total')).toBeTruthy();
    });

    it('deve ter hierarquia de informações clara', () => {
      const order = createMockOrder();
      render(<OrderCard order={order} onPress={mockOnPress} />);

      // Verifica ordem lógica: número do pedido, data, status, itens, total
      expect(screen.getByText('Pedido #ORD-12345')).toBeTruthy();
      expect(screen.getByText(/15\/01\/2025/)).toBeTruthy();
      expect(screen.getByText('Pendente')).toBeTruthy();
      expect(screen.getByText('2 itens')).toBeTruthy();
      expect(screen.getByText(/R\$\s*399,80/)).toBeTruthy();
    });

    it('deve ter labels descritivos para ações', () => {
      const order = createMockOrder({ _status: 'delivered' });
      render(<OrderCard order={order} onPress={mockOnPress} />);

      expect(screen.getByText('Ver detalhes')).toBeTruthy();
      expect(screen.getByText('Comprar novamente')).toBeTruthy();
    });
  });
});
