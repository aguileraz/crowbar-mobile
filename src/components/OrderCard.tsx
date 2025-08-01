import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  Button,
  IconButton,

  Divider,
} from 'react-native-paper';
import { Order } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Card de Pedido
 * Exibe informações resumidas do pedido
 */

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  style?: ViewStyle;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  style,
}) => {
  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Get status color and label
   */
  const getStatusInfo = (_status: string) => {
    switch (_status) {
      case 'pending':
        return { color: '#FF9800', label: 'Pendente', icon: 'clock-outline' };
      case 'confirmed':
        return { color: '#2196F3', label: 'Confirmado', icon: 'check-circle-outline' };
      case 'processing':
        return { color: '#9C27B0', label: 'Processando', icon: 'cog-outline' };
      case 'shipped':
        return { color: '#00BCD4', label: 'Enviado', icon: 'truck-outline' };
      case 'delivered':
        return { color: '#4CAF50', label: 'Entregue', icon: 'package-variant' };
      case 'cancelled':
        return { color: '#F44336', label: 'Cancelado', icon: 'close-circle-outline' };
      default:
        return { color: theme.colors.onSurfaceVariant, label: status, icon: 'help-circle-outline' };
    }
  };

  /**
   * Get first item image
   */
  const getFirstItemImage = (): string | null => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      if (firstItem.box?.images && firstItem.box.images.length > 0) {
        return firstItem.box.images[0].url;
      }
    }
    return null;
  };

  /**
   * Get items summary
   */
  const getItemsSummary = (): string => {
    if (!order.items || order.items.length === 0) {
      return 'Nenhum item';
    }

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (order.items.length === 1) {
      return `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
    }
    
    return `${totalItems} itens (${order.items.length} tipos)`;
  };

  const statusInfo = getStatusInfo(order._status);
  const firstItemImage = getFirstItemImage();

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <Card.Content style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              Pedido #{order.order_number}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(order.created_at)}
            </Text>
          </View>
          
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: statusInfo.color + '20' }]}
            textStyle={[styles.statusChipText, { color: statusInfo.color }]}
            icon={statusInfo.icon}
            compact
          >
            {statusInfo.label}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {/* Content */}
        <View style={styles.orderContent}>
          {/* Item preview */}
          <View style={styles.itemPreview}>
            {firstItemImage ? (
              <Image
                source={{ uri: firstItemImage }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <IconButton
                  icon="package-variant"
                  size={24}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              </View>
            )}
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemsSummary}>
                {getItemsSummary()}
              </Text>
              
              {order.items && order.items.length > 0 && (
                <Text style={styles.firstItemName} numberOfLines={1}>
                  {order.items[0].box?.name}
                  {order.items.length > 1 && ` +${order.items.length - 1} mais`}
                </Text>
              )}
            </View>
          </View>

          {/* Order details */}
          <View style={styles.orderDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.total)}
              </Text>
            </View>
            
            {order.delivery_address && (
              <Text style={styles.deliveryAddress} numberOfLines={1}>
                📍 {order.delivery_address.city}, {order.delivery_address.state}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onPress}
            style={styles.detailsButton}
            compact
          >
            Ver detalhes
          </Button>
          
          {(order._status === 'delivered' || order.status === 'cancelled') && (
            <Button
              mode="contained"
              style={styles.reorderButton}
              compact
            >
              Comprar novamente
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: getBorderRadius('md'),
    elevation: 1,
  },
  content: {
    padding: getSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('sm'),
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
  },
  orderDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    marginVertical: getSpacing('sm'),
  },
  orderContent: {
    marginBottom: getSpacing('md'),
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: getBorderRadius('sm'),
    marginRight: getSpacing('md'),
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: getBorderRadius('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('md'),
  },
  itemInfo: {
    flex: 1,
  },
  itemsSummary: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
  },
  firstItemName: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  deliveryAddress: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    textAlign: 'right',
    marginLeft: getSpacing('md'),
  },
  actions: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  detailsButton: {
    flex: 1,
    borderRadius: getBorderRadius('sm'),
  },
  reorderButton: {
    flex: 1,
    borderRadius: getBorderRadius('sm'),
  },
});

export default OrderCard;