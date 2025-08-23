import React from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Card,
  Text,
  IconButton,
  Chip,
} from 'react-native-paper';
import { CartItem } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Item do Carrinho
 * Exibe item com imagem, informações, controles de quantidade
 */

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false,
}) => {
  /**
   * Formatar preço
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Obter cor da raridade
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return theme.colors.primary;
    }
  };

  return (
    <Card style={styles.card} elevation={1}>
      <View style={styles.content}>
        {/* Imagem */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.box.images[0]?.url }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Badge de raridade */}
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(item.box.rarity) },
            ]}
          >
            <Text style={styles.rarityBadgeText}>
              {item.box.rarity.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Informações */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.box.name}
          </Text>
          
          <Text style={styles.category}>
            {item.box.category.name}
          </Text>
          
          <Chip
            mode="outlined"
            style={[
              styles.rarityChip,
              { borderColor: getRarityColor(item.box.rarity) },
            ]}
            textStyle={[
              styles.rarityChipText,
              { color: getRarityColor(item.box.rarity) },
            ]}
            compact
          >
            {item.box.rarity.toUpperCase()}
          </Chip>
          
          {/* Preços */}
          <View style={styles.priceContainer}>
            <Text style={styles.unitPrice}>
              {formatPrice(item.unit_price)}
            </Text>
            {item.box.original_price && item.box.original_price > item.unit_price && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.box.original_price)}
              </Text>
            )}
          </View>
          
          <Text style={styles.totalPrice}>
            Total: {formatPrice(item.total_price)}
          </Text>
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          {/* Remover */}
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={onRemove}
            disabled={disabled}
            style={styles.removeButton}
          />
          
          {/* Quantidade */}
          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus"
              size={16}
              onPress={() => onUpdateQuantity(item.quantity - 1)}
              disabled={disabled || item.quantity <= 1}
              style={styles.quantityButton}
            />
            <Text style={styles.quantity}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={16}
              onPress={() => onUpdateQuantity(item.quantity + 1)}
              disabled={disabled || item.quantity >= item.box.stock}
              style={styles.quantityButton}
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
  content: {
    flexDirection: 'row',
    padding: getSpacing('md'),
  },
  imageContainer: {
    position: 'relative',
    marginRight: getSpacing('md'),
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: getBorderRadius('sm'),
  },
  rarityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
    lineHeight: 20,
  },
  category: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('sm'),
  },
  rarityChip: {
    alignSelf: 'flex-start',
    height: 20,
    marginBottom: getSpacing('sm'),
  },
  rarityChipText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  unitPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: getSpacing('sm'),
  },
  originalPrice: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeButton: {
    margin: 0,
    marginBottom: getSpacing('sm'),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('sm'),
    paddingHorizontal: getSpacing('xs'),
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
    marginHorizontal: getSpacing('xs'),
  },
});

export default CartItemCard;