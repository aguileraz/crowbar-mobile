/**
 * Testes Unitários - BoxCard Component
 *
 * Testa o componente BoxCard que exibe informações de uma caixa misteriosa
 * com suporte a diferentes variantes (featured, compact, list).
 *
 * @coverage Props, rendering, variants, user interactions, accessibility, edge cases
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import BoxCard from '../BoxCard';
import { MysteryBox } from '../../types/api';

// Mock dos componentes filhos já está em jest.setup.js
// Não precisamos mockar novamente aqui

// Helper para criar mock de MysteryBox
const createMockBox = (overrides?: Partial<MysteryBox>): MysteryBox => ({
  id: 'box-1',
  name: 'Caixa Tech Premium',
  description: 'Uma caixa incrível com produtos de tecnologia',
  short_description: 'Produtos tech surpresa',
  price: 199.90,
  original_price: 299.90,
  discount_percentage: 33,
  category: {
    id: 'cat-1',
    name: 'Tecnologia',
    slug: 'tecnologia',
    icon: 'laptop',
    color: '#2196F3',
    is_active: true,
    boxes_count: 10,
  },
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/box.jpg',
      alt_text: 'Caixa Tech',
      is_primary: true,
      order: 1,
    },
  ],
  thumbnail: 'https://example.com/thumb.jpg',
  rarity: 'rare',
  stock: 15,
  is_active: true,
  is_featured: false,
  is_new: false,
  tags: ['tech', 'gadgets', 'premium'],
  possible_items: [],
  stats: {
    total_sold: 150,
    total_opened: 120,
    average_rating: 4.5,
    reviews_count: 45,
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-10T00:00:00Z',
  ...overrides,
});

describe('BoxCard', () => {
  const mockOnPress = jest.fn();
  const mockOnFavoritePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // 1. RENDERING TESTS
  // ============================================
  describe('Renderização', () => {
    it('deve renderizar com props obrigatórias', () => {
      const box = createMockBox();
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('Caixa Tech Premium')).toBeTruthy();
      expect(screen.getByText('Tecnologia')).toBeTruthy();
      expect(screen.getByText('RARE')).toBeTruthy();
    });

    it('deve renderizar o título corretamente', () => {
      const box = createMockBox({ name: 'Caixa Especial' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('Caixa Especial')).toBeTruthy();
    });

    it('deve renderizar a categoria', () => {
      const box = createMockBox({
        category: { ...createMockBox().category, name: 'Games' },
      });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('Games')).toBeTruthy();
    });

    it('deve renderizar chip de raridade', () => {
      const box = createMockBox({ rarity: 'legendary' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('LEGENDARY')).toBeTruthy();
    });

    it('deve renderizar preço formatado em BRL', () => {
      const box = createMockBox({ price: 150.50 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*150,50/)).toBeTruthy();
    });

    it('deve renderizar preço original com desconto', () => {
      const box = createMockBox({ price: 100, original_price: 200 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*100/)).toBeTruthy();
      expect(screen.getByText(/R\$\s*200/)).toBeTruthy();
    });
  });

  // ============================================
  // 2. VARIANT TESTS
  // ============================================
  describe('Variantes', () => {
    it('deve renderizar variante compact por padrão', () => {
      const box = createMockBox();
      render(<BoxCard box={box} onPress={mockOnPress} />);

      // Compact é o padrão, não renderiza descrição
      expect(screen.queryByText('Produtos tech surpresa')).toBeNull();
    });

    it('deve renderizar variante featured com estatísticas', () => {
      const box = createMockBox();
      render(<BoxCard box={box} onPress={mockOnPress} variant="featured" />);

      expect(screen.getByText('150')).toBeTruthy(); // total_sold
      expect(screen.getByText('4.5')).toBeTruthy(); // average_rating
      expect(screen.getByText('15')).toBeTruthy(); // stock
    });

    it('deve renderizar variante list com descrição', () => {
      const box = createMockBox();
      render(<BoxCard box={box} onPress={mockOnPress} variant="list" />);

      expect(screen.getByText('Produtos tech surpresa')).toBeTruthy();
    });

    it('deve renderizar tags na variante list', () => {
      const box = createMockBox({ tags: ['tech', 'gadgets', 'premium'] });
      render(<BoxCard box={box} onPress={mockOnPress} variant="list" />);

      expect(screen.getByText('tech')).toBeTruthy();
      expect(screen.getByText('gadgets')).toBeTruthy();
      expect(screen.getByText('premium')).toBeTruthy();
    });

    it('deve limitar tags a 3 na variante list', () => {
      const box = createMockBox({ tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] });
      const { queryByText } = render(<BoxCard box={box} onPress={mockOnPress} variant="list" />);

      expect(queryByText('tag1')).toBeTruthy();
      expect(queryByText('tag2')).toBeTruthy();
      expect(queryByText('tag3')).toBeTruthy();
      expect(queryByText('tag4')).toBeNull();
      expect(queryByText('tag5')).toBeNull();
    });
  });

  // ============================================
  // 3. BADGES TESTS
  // ============================================
  describe('Badges', () => {
    it('deve renderizar badge NOVO quando is_new é true', () => {
      const box = createMockBox({ is_new: true });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('NOVO')).toBeTruthy();
    });

    it('deve renderizar badge DESTAQUE quando is_featured é true', () => {
      const box = createMockBox({ is_featured: true });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('DESTAQUE')).toBeTruthy();
    });

    it('deve renderizar badge de desconto quando disponível', () => {
      const box = createMockBox({ discount_percentage: 25 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('-25%')).toBeTruthy();
    });

    it('deve renderizar múltiplos badges simultaneamente', () => {
      const box = createMockBox({
        is_new: true,
        is_featured: true,
        discount_percentage: 50,
      });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('NOVO')).toBeTruthy();
      expect(screen.getByText('DESTAQUE')).toBeTruthy();
      expect(screen.getByText('-50%')).toBeTruthy();
    });

    it('não deve renderizar badges quando não aplicáveis', () => {
      const box = createMockBox({
        is_new: false,
        is_featured: false,
        discount_percentage: 0,
      });
      const { queryByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(queryByText('NOVO')).toBeNull();
      expect(queryByText('DESTAQUE')).toBeNull();
      expect(queryByText(/-%/)).toBeNull();
    });
  });

  // ============================================
  // 4. STOCK INDICATORS TESTS
  // ============================================
  describe('Indicadores de Estoque', () => {
    it('deve exibir indicador de estoque baixo quando <= 5', () => {
      const box = createMockBox({ stock: 3 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('Restam 3')).toBeTruthy();
    });

    it('deve exibir indicador para cada quantidade baixa (1-5)', () => {
      for (let stock = 1; stock <= 5; stock++) {
        const box = createMockBox({ stock });
        const { getByText } = render(<BoxCard box={box} onPress={mockOnPress} />);
        expect(getByText(`Restam ${stock}`)).toBeTruthy();
      }
    });

    it('não deve exibir indicador de estoque baixo quando > 5', () => {
      const box = createMockBox({ stock: 10 });
      const { queryByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(queryByText(/Restam/)).toBeNull();
    });

    it('deve exibir overlay de ESGOTADO quando stock é 0', () => {
      const box = createMockBox({ stock: 0 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('ESGOTADO')).toBeTruthy();
    });

    it('não deve exibir ESGOTADO quando stock > 0', () => {
      const box = createMockBox({ stock: 1 });
      const { queryByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(queryByText('ESGOTADO')).toBeNull();
    });
  });

  // ============================================
  // 5. FLASH SALE TESTS
  // ============================================
  describe('Flash Sale', () => {
    it('deve renderizar Flash Sale quando ativo', () => {
      const box = createMockBox({
        flash_sale: {
          active: true,
          ends_at: '2025-12-31T23:59:59Z',
          original_price: 200,
          sale_price: 100,
        },
      });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('⚡ FLASH SALE')).toBeTruthy();
    });

    it('deve exibir preço de Flash Sale formatado', () => {
      const box = createMockBox({
        flash_sale: {
          active: true,
          ends_at: '2025-12-31T23:59:59Z',
          original_price: 200,
          sale_price: 99.90,
        },
      });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*99,90/)).toBeTruthy();
    });

    it('não deve renderizar Flash Sale quando inativo', () => {
      const box = createMockBox({
        flash_sale: {
          active: false,
          ends_at: '2025-12-31T23:59:59Z',
          original_price: 200,
          sale_price: 100,
        },
      });
      const { queryByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(queryByText('⚡ FLASH SALE')).toBeNull();
    });

    it('deve exibir preço normal quando Flash Sale não está disponível', () => {
      const box = createMockBox({ price: 150 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*150/)).toBeTruthy();
      expect(screen.queryByText('⚡ FLASH SALE')).toBeNull();
    });
  });

  // ============================================
  // 6. USER INTERACTION TESTS
  // ============================================
  describe('Interações do Usuário', () => {
    it('deve chamar onPress quando o card é pressionado', () => {
      const box = createMockBox();
      render(<BoxCard box={box} onPress={mockOnPress} />);

      const card = screen.getByText('Caixa Tech Premium').parent?.parent;
      fireEvent.press(card!);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('deve renderizar FavoriteButton quando showFavoriteButton é true', () => {
      const box = createMockBox();
      render(
        <BoxCard
          box={box}
          onPress={mockOnPress}
          showFavoriteButton={true}
          onFavoritePress={mockOnFavoritePress}
        />
      );

      expect(screen.getByTestId('FavoriteButton')).toBeTruthy();
    });

    it('não deve renderizar FavoriteButton quando showFavoriteButton é false', () => {
      const box = createMockBox();
      const { queryByTestId } = render(
        <BoxCard box={box} onPress={mockOnPress} showFavoriteButton={false} />
      );

      expect(queryByTestId('FavoriteButton')).toBeNull();
    });

    it('deve passar boxId correto para FavoriteButton', () => {
      const box = createMockBox({ id: 'unique-box-id' });
      render(
        <BoxCard
          box={box}
          onPress={mockOnPress}
          showFavoriteButton={true}
          onFavoritePress={mockOnFavoritePress}
        />
      );

      const favoriteButton = screen.getByTestId('FavoriteButton');
      expect(favoriteButton.props.boxId).toBe('unique-box-id');
    });
  });

  // ============================================
  // 7. RARITY TESTS
  // ============================================
  describe('Raridade', () => {
    it('deve renderizar raridade common corretamente', () => {
      const box = createMockBox({ rarity: 'common' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('COMMON')).toBeTruthy();
    });

    it('deve renderizar raridade rare corretamente', () => {
      const box = createMockBox({ rarity: 'rare' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('RARE')).toBeTruthy();
    });

    it('deve renderizar raridade epic corretamente', () => {
      const box = createMockBox({ rarity: 'epic' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('EPIC')).toBeTruthy();
    });

    it('deve renderizar raridade legendary corretamente', () => {
      const box = createMockBox({ rarity: 'legendary' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText('LEGENDARY')).toBeTruthy();
    });
  });

  // ============================================
  // 8. STATISTICS TESTS (Featured variant)
  // ============================================
  describe('Estatísticas (Variante Featured)', () => {
    it('deve renderizar estatísticas na variante featured', () => {
      const box = createMockBox({
        stats: {
          total_sold: 250,
          total_opened: 200,
          average_rating: 4.8,
          reviews_count: 80,
        },
        stock: 25,
      });
      render(<BoxCard box={box} onPress={mockOnPress} variant="featured" />);

      expect(screen.getByText('250')).toBeTruthy(); // total_sold
      expect(screen.getByText('4.8')).toBeTruthy(); // average_rating
      expect(screen.getByText('25')).toBeTruthy(); // stock
      expect(screen.getByText('Vendidas')).toBeTruthy();
      expect(screen.getByText('★ Avaliação')).toBeTruthy();
      expect(screen.getByText('Estoque')).toBeTruthy();
    });

    it('não deve renderizar estatísticas em variante compact', () => {
      const box = createMockBox();
      const { queryByText } = render(
        <BoxCard box={box} onPress={mockOnPress} variant="compact" />
      );

      expect(queryByText('Vendidas')).toBeNull();
      expect(queryByText('★ Avaliação')).toBeNull();
    });

    it('não deve renderizar estatísticas em variante list', () => {
      const box = createMockBox();
      const { queryByText } = render(
        <BoxCard box={box} onPress={mockOnPress} variant="list" />
      );

      expect(queryByText('Vendidas')).toBeNull();
      expect(queryByText('★ Avaliação')).toBeNull();
    });
  });

  // ============================================
  // 9. EDGE CASES TESTS
  // ============================================
  describe('Casos Extremos', () => {
    it('deve lidar com título muito longo (truncate)', () => {
      const longTitle = 'Caixa Misteriosa com um Título Extremamente Longo que Deve Ser Truncado';
      const box = createMockBox({ name: longTitle });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(longTitle)).toBeTruthy();
    });

    it('deve lidar com preço zero', () => {
      const box = createMockBox({ price: 0 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*0,00/)).toBeTruthy();
    });

    it('deve lidar com preço muito alto', () => {
      const box = createMockBox({ price: 9999.99 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*9\.999,99/)).toBeTruthy();
    });

    it('deve lidar com array de tags vazio', () => {
      const box = createMockBox({ tags: [] });
      const { queryByText } = render(
        <BoxCard box={box} onPress={mockOnPress} variant="list" />
      );

      // Não deve haver exceção, apenas não renderiza tags
      expect(queryByText('tech')).toBeNull();
    });

    it('deve lidar com imagem ausente gracefully', () => {
      const box = createMockBox({ thumbnail: '' });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      // Componente deve renderizar sem crash
      expect(screen.getByText('Caixa Tech Premium')).toBeTruthy();
    });

    it('deve lidar com categoria sem nome', () => {
      const box = createMockBox({
        category: { ...createMockBox().category, name: '' },
      });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      // Deve renderizar string vazia sem crash
      expect(screen.getByText('Caixa Tech Premium')).toBeTruthy();
    });

    it('deve lidar com estatísticas zeradas', () => {
      const box = createMockBox({
        stats: {
          total_sold: 0,
          total_opened: 0,
          average_rating: 0,
          reviews_count: 0,
        },
      });
      render(<BoxCard box={box} onPress={mockOnPress} variant="featured" />);

      expect(screen.getByText('0')).toBeTruthy();
      expect(screen.getByText('0.0')).toBeTruthy();
    });

    it('deve aplicar style customizado passado via props', () => {
      const box = createMockBox();
      const customStyle = { marginTop: 20, backgroundColor: 'red' };
      render(
        <BoxCard box={box} onPress={mockOnPress} style={customStyle} />
      );

      // Verifica que o componente renderizou com o estilo (renderização não falhou)
      expect(screen.getByText('Caixa Tech Premium')).toBeTruthy();
    });
  });

  // ============================================
  // 10. PRICE FORMATTING TESTS
  // ============================================
  describe('Formatação de Preço', () => {
    it('deve formatar preço com centavos', () => {
      const box = createMockBox({ price: 99.99 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*99,99/)).toBeTruthy();
    });

    it('deve formatar preço inteiro com ,00', () => {
      const box = createMockBox({ price: 100 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*100,00/)).toBeTruthy();
    });

    it('deve formatar preço com milhares', () => {
      const box = createMockBox({ price: 1500.50 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*1\.500,50/)).toBeTruthy();
    });

    it('deve exibir preço original quando presente e maior que preço atual', () => {
      const box = createMockBox({ price: 100, original_price: 150 });
      render(<BoxCard box={box} onPress={mockOnPress} />);

      expect(screen.getByText(/R\$\s*100/)).toBeTruthy();
      expect(screen.getByText(/R\$\s*150/)).toBeTruthy();
    });

    it('não deve exibir preço original quando ausente', () => {
      const box = createMockBox({ price: 100, original_price: undefined });
      const { getAllByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      const priceTexts = getAllByText(/R\$\s*100/);
      expect(priceTexts.length).toBe(1); // Apenas o preço atual
    });

    it('não deve exibir preço original quando igual ao preço atual', () => {
      const box = createMockBox({ price: 100, original_price: 100 });
      const { getAllByText } = render(<BoxCard box={box} onPress={mockOnPress} />);

      const priceTexts = getAllByText(/R\$\s*100/);
      expect(priceTexts.length).toBe(1); // Apenas o preço atual
    });
  });
});
