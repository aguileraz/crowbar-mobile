import React from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Card,
  Text,
  Title,

  Divider,
} from 'react-native-paper';
import { Cart } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Resumo do Pedido
 * Exibe resumo completo do pedido no checkout
 */

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimated_days: number;
}

interface OrderSummaryProps {
  cart: Cart;
  shippingOption?: ShippingOption | null;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  shippingOption,
  total,
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
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Resumo do Pedido</Title>
        
        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Itens ({cart.total_items})</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={{ uri: item.box.images[0]?.url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.box.name}
                </Text>
                <Text style={styles.itemCategory}>
                  {item.box.category.name}
                </Text>
                <View style={styles.itemDetails}>
                  <View
                    style={[
                      styles.rarityIndicator,
                      { backgroundColor: getRarityColor(item.box.rarity) },
                    ]}
                  />
                  <Text style={styles.itemRarity}>
                    {item.box.rarity.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.itemPricing}>
                <Text style={styles.itemQuantity}>
                  {item.quantity}x
                </Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.total_price)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Pricing Breakdown */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>
              {formatPrice(cart.subtotal)}
            </Text>
          </View>
          
          {cart.discount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Desconto</Text>
              <Text style={[styles.pricingValue, styles.discountValue]}>
                -{formatPrice(cart.discount)}
              </Text>
            </View>
          )}
          
          {shippingOption && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Frete ({shippingOption.name})
              </Text>
              <Text style={styles.pricingValue}>
                {shippingOption.price === 0 ? 'Grátis' : formatPrice(shippingOption.price)}
              </Text>
            </View>
          )}
          
          <Divider style={styles.totalDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        {/* Delivery Info */}
        {shippingOption && (
          <View style={styles.deliverySection}>
            <Text style={styles.deliveryTitle}>Informações de Entrega</Text>
            <Text style={styles.deliveryText}>
              Método: {shippingOption.name}
            </Text>
            <Text style={styles.deliveryText}>
              Prazo: {shippingOption.estimated_days} dias úteis
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getSpacing('lg'),
  },
  itemsSection: {
    marginBottom: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('md'),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
    paddingBottom: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: getBorderRadius('sm'),
    marginRight: getSpacing('md'),
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
    lineHeight: 18,
  },
  itemCategory: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: getSpacing('xs'),
  },
  itemRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    marginVertical: getSpacing('md'),
  },
  pricingSection: {
    marginBottom: getSpacing('md'),
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  pricingLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  discountValue: {
    color: theme.colors.primary,
  },
  totalDivider: {
    marginVertical: getSpacing('md'),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  deliverySection: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  deliveryText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
});

export default OrderSummary;