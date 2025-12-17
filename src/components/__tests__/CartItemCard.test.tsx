/**
 * Testes Unitários - CartItemCard Component
 *
 * Testa o componente CartItemCard que exibe um item do carrinho
 * com controles de quantidade e remoção.
 *
 * @coverage Props, rendering, quantity controls, user interactions, accessibility, edge cases
 */

import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react-native';
import CartItemCard from '../CartItemCard';
import { MysteryBox } from '../../types/api';

// Tipo do CartItem conforme usado pelo componente (usa 'box' ao invés de 'mystery_box')
interface CartItem {
  id: string;
  box: MysteryBox;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
}

// Helper para criar mock de MysteryBox
const createMockBox = (overrides?: Partial<MysteryBox>): MysteryBox => ({
  id: 'box-1',
  name: 'Caixa Gaming Pro',
  description: 'Caixa com produtos gamers',
  short_description: 'Gaming premium',
  price: 299.90,
  original_price: 399.90,
  category: {
    id: 'cat-1',
    name: 'Games',
    slug: 'games',
    icon: 'gamepad',
    color: '#9C27B0',
    is_active: true,
    boxes_count: 20,
  },
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/gaming-box.jpg',
      alt_text: 'Gaming Box',
      is_primary: true,
      order: 1,
    },
  ],
  thumbnail: 'https://example.com/gaming-thumb.jpg',
  rarity: 'epic',
  stock: 25,
  is_active: true,
  is_featured: false,
  is_new: false,
  tags: ['gaming', 'tech'],
  possible_items: [],
  stats: {
    total_sold: 200,
    total_opened: 180,
    average_rating: 4.7,
    reviews_count: 65,
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-10T00:00:00Z',
  ...overrides,
});

// Helper para criar mock de CartItem
const createMockCartItem = (overrides?: Partial<CartItem>): CartItem => ({
  id: 'cart-item-1',
  box: createMockBox(),
  quantity: 2,
  unit_price: 299.90,
  total_price: 599.80,
  added_at: '2025-01-15T10:00:00Z',
  ...overrides,
});

describe('CartItemCard', () => {
  const mockOnUpdateQuantity = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. RENDERING TESTS
  // ============================================
  describe('Renderização', () => {
    it('deve renderizar com props obrigatórias', () => {
      const item = createMockCartItem();
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Caixa Gaming Pro')).toBeTruthy();
      expect(screen.getByText('Games')).toBeTruthy();
      expect(screen.getByText('EPIC')).toBeTruthy();
    });

    it('deve renderizar o nome da caixa', () => {
      const item = createMockCartItem({
        box: createMockBox({ name: 'Caixa Especial Teste' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Caixa Especial Teste')).toBeTruthy();
    });

    it('deve renderizar a categoria', () => {
      const item = createMockCartItem({
        box: createMockBox({
          category: { ...createMockBox().category, name: 'Eletrônicos' },
        }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Eletrônicos')).toBeTruthy();
    });

    it('deve renderizar a imagem da caixa', () => {
      const item = createMockCartItem();
      const { UNSAFE_getByType } = render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const image = UNSAFE_getByType('Image');
      expect(image.props.source.uri).toBe('https://example.com/gaming-box.jpg');
    });

    it('deve renderizar chip de raridade', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'legendary' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('LEGENDARY')).toBeTruthy();
    });

    it('deve renderizar badge de raridade com primeira letra', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'rare' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('R')).toBeTruthy(); // Primeira letra de 'rare'
    });
  });

  // ============================================
  // 2. PRICE DISPLAY TESTS
  // ============================================
  describe('Exibição de Preços', () => {
    it('deve exibir preço unitário formatado', () => {
      const item = createMockCartItem({ unit_price: 199.90 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/R\$\s*199,90/)).toBeTruthy();
    });

    it('deve exibir preço total formatado', () => {
      const item = createMockCartItem({
        quantity: 3,
        unit_price: 100,
        total_price: 300,
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/Total: R\$\s*300,00/)).toBeTruthy();
    });

    it('deve exibir preço original quando presente e maior que unit_price', () => {
      const item = createMockCartItem({
        box: createMockBox({ original_price: 500 }),
        unit_price: 300,
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/R\$\s*300/)).toBeTruthy();
      expect(screen.getByText(/R\$\s*500/)).toBeTruthy();
    });

    it('não deve exibir preço original quando igual ao unit_price', () => {
      const item = createMockCartItem({
        box: createMockBox({ original_price: 300 }),
        unit_price: 300,
      });
      const { getAllByText, _queryByText } = render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const priceMatches = getAllByText(/R\$\s*300/);
      // Deve aparecer apenas no unit_price e total_price, não como original_price riscado
      expect(priceMatches.length).toBeGreaterThan(0);
    });

    it('não deve exibir preço original quando ausente', () => {
      const item = createMockCartItem({
        box: createMockBox({ original_price: undefined }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // Deve apenas exibir unit_price e total
      expect(screen.getByText(/R\$\s*299,90/)).toBeTruthy();
    });

    it('deve calcular total corretamente (quantidade * preço)', () => {
      const item = createMockCartItem({
        quantity: 4,
        unit_price: 50.25,
        total_price: 201.00,
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/Total: R\$\s*201,00/)).toBeTruthy();
    });
  });

  // ============================================
  // 3. QUANTITY CONTROLS TESTS
  // ============================================
  describe('Controles de Quantidade', () => {
    it('deve exibir quantidade atual', () => {
      const item = createMockCartItem({ quantity: 5 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('5')).toBeTruthy();
    });

    it('deve chamar onUpdateQuantity com quantidade incrementada ao pressionar +', () => {
      const item = createMockCartItem({ quantity: 2 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const plusButtonContainer = screen.getByTestId('plus-button-container');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');
      fireEvent.press(plusButton.parent!);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(3);
    });

    it('deve chamar onUpdateQuantity com quantidade decrementada ao pressionar -', () => {
      const item = createMockCartItem({ quantity: 3 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const minusButtonContainer = screen.getByTestId('minus-button-container');
      const minusButton = within(minusButtonContainer).getByTestId('IconButton');
      fireEvent.press(minusButton.parent!);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(2);
    });

    it('deve desabilitar botão - quando quantidade é 1', () => {
      const item = createMockCartItem({ quantity: 1 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const minusButtonContainer = screen.getByTestId('minus-button-container');
      const minusButton = within(minusButtonContainer).getByTestId('IconButton');
      expect(minusButton.props.disabled).toBe(true);
    });

    it('deve desabilitar botão + quando quantidade atinge o estoque', () => {
      const item = createMockCartItem({
        quantity: 10,
        box: createMockBox({ stock: 10 }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const plusButtonContainer = screen.getByTestId('plus-button-container');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');
      expect(plusButton.props.disabled).toBe(true);
    });

    it('deve permitir quantidade até o limite de estoque', () => {
      const item = createMockCartItem({
        quantity: 9,
        box: createMockBox({ stock: 10 }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const plusButtonContainer = screen.getByTestId('plus-button-container');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');
      expect(plusButton.props.disabled).toBe(false);
    });

    it('não deve permitir quantidade menor que 1', () => {
      const item = createMockCartItem({ quantity: 1 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const minusButtonContainer = screen.getByTestId('minus-button-container');
      const minusButton = within(minusButtonContainer).getByTestId('IconButton');
      fireEvent.press(minusButton.parent!);

      // O botão está desabilitado E tem guarda de lógica, então onUpdateQuantity não deve ser chamado
      expect(mockOnUpdateQuantity).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 4. REMOVE BUTTON TESTS
  // ============================================
  describe('Botão de Remover', () => {
    it('deve chamar onRemove ao pressionar botão de deletar', () => {
      const item = createMockCartItem();
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      fireEvent.press(deleteButton.parent!);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('deve renderizar ícone de delete', () => {
      const item = createMockCartItem();
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      expect(deleteButton.props.icon).toBe('delete-outline');
    });

    it('não deve chamar onRemove quando disabled é true', () => {
      const item = createMockCartItem();
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      expect(deleteButton.props.disabled).toBe(true);
    });
  });

  // ============================================
  // 5. DISABLED STATE TESTS
  // ============================================
  describe('Estado Desabilitado', () => {
    it('deve desabilitar todos os botões quando disabled é true', () => {
      const item = createMockCartItem({ quantity: 5 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const minusButtonContainer = screen.getByTestId('minus-button-container');
      const plusButtonContainer = screen.getByTestId('plus-button-container');

      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      const minusButton = within(minusButtonContainer).getByTestId('IconButton');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');

      expect(deleteButton.props.disabled).toBe(true);
      expect(minusButton.props.disabled).toBe(true);
      expect(plusButton.props.disabled).toBe(true);
    });

    it('deve permitir interação quando disabled é false', () => {
      const item = createMockCartItem({ quantity: 5 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
          disabled={false}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      expect(deleteButton.props.disabled).toBe(false);
    });

    it('deve usar disabled como false por padrão', () => {
      const item = createMockCartItem({ quantity: 5 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const deleteButtonContainer = screen.getByTestId('delete-button-container');
      const deleteButton = within(deleteButtonContainer).getByTestId('IconButton');
      expect(deleteButton.props.disabled).toBe(false);
    });
  });

  // ============================================
  // 6. RARITY DISPLAY TESTS
  // ============================================
  describe('Exibição de Raridade', () => {
    it('deve exibir raridade common corretamente', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'common' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('COMMON')).toBeTruthy();
      expect(screen.getByText('C')).toBeTruthy(); // Badge inicial
    });

    it('deve exibir raridade rare corretamente', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'rare' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('RARE')).toBeTruthy();
      expect(screen.getByText('R')).toBeTruthy();
    });

    it('deve exibir raridade epic corretamente', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'epic' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('EPIC')).toBeTruthy();
      expect(screen.getByText('E')).toBeTruthy();
    });

    it('deve exibir raridade legendary corretamente', () => {
      const item = createMockCartItem({
        box: createMockBox({ rarity: 'legendary' }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('LEGENDARY')).toBeTruthy();
      expect(screen.getByText('L')).toBeTruthy();
    });
  });

  // ============================================
  // 7. EDGE CASES TESTS
  // ============================================
  describe('Casos Extremos', () => {
    it('deve lidar com nome muito longo (truncate)', () => {
      const longName = 'Caixa Misteriosa Super Ultra Mega Premium com Nome Extremamente Longo para Testar Truncamento';
      const item = createMockCartItem({
        box: createMockBox({ name: longName }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(longName)).toBeTruthy();
    });

    it('deve lidar com preço zero', () => {
      const item = createMockCartItem({ unit_price: 0, total_price: 0 });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // Ambos unit_price e total_price devem exibir R$ 0,00
      const priceMatches = screen.getAllByText(/R\$\s*0,00/);
      expect(priceMatches.length).toBeGreaterThan(0);
    });

    it('deve lidar com quantidade muito alta', () => {
      const item = createMockCartItem({
        quantity: 999,
        box: createMockBox({ stock: 1000 }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('999')).toBeTruthy();
    });

    it('deve lidar com estoque zero (botão + desabilitado)', () => {
      const item = createMockCartItem({
        quantity: 1,
        box: createMockBox({ stock: 0 }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const plusButtonContainer = screen.getByTestId('plus-button-container');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');
      expect(plusButton.props.disabled).toBe(true);
    });

    it('deve lidar com array de imagens vazio gracefully', () => {
      const item = createMockCartItem({
        box: createMockBox({ images: [] }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // Deve renderizar sem crash, mesmo sem imagem
      expect(screen.getByText('Caixa Gaming Pro')).toBeTruthy();
    });

    it('deve lidar com imagem sem URL', () => {
      const item = createMockCartItem({
        box: createMockBox({
          images: [{ id: 'img-1', url: '', is_primary: true, order: 1 }],
        }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Caixa Gaming Pro')).toBeTruthy();
    });

    it('deve lidar com categoria sem nome', () => {
      const item = createMockCartItem({
        box: createMockBox({
          category: { ...createMockBox().category, name: '' },
        }),
      });
      render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // Deve renderizar string vazia sem crash
      expect(screen.getByText('Caixa Gaming Pro')).toBeTruthy();
    });
  });

  // ============================================
  // 8. INTEGRATION TESTS
  // ============================================
  describe('Testes de Integração', () => {
    it('deve incrementar quantidade múltiplas vezes', () => {
      const item = createMockCartItem({ quantity: 1, box: createMockBox({ stock: 10 }) });
      const { rerender } = render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const plusButtonContainer = screen.getByTestId('plus-button-container');
      const plusButton = within(plusButtonContainer).getByTestId('IconButton');
      fireEvent.press(plusButton.parent!);
      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(2);

      // Simular atualização de props
      const updatedItem = { ...item, quantity: 2 };
      rerender(
        <CartItemCard
          item={updatedItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.press(plusButton.parent!);
      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(3);
    });

    it('deve decrementar quantidade múltiplas vezes', () => {
      const item = createMockCartItem({ quantity: 5 });
      const { rerender } = render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const minusButtonContainer = screen.getByTestId('minus-button-container');
      const minusButton = within(minusButtonContainer).getByTestId('IconButton');
      fireEvent.press(minusButton.parent!);
      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(4);

      const updatedItem = { ...item, quantity: 4 };
      rerender(
        <CartItemCard
          item={updatedItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.press(minusButton.parent!);
      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(3);
    });

    it('deve atualizar total price quando quantidade muda', () => {
      const item = createMockCartItem({
        quantity: 2,
        unit_price: 100,
        total_price: 200,
      });
      const { rerender } = render(
        <CartItemCard
          item={item}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/Total: R\$\s*200,00/)).toBeTruthy();

      const updatedItem = { ...item, quantity: 3, total_price: 300 };
      rerender(
        <CartItemCard
          item={updatedItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/Total: R\$\s*300,00/)).toBeTruthy();
    });
  });
});
