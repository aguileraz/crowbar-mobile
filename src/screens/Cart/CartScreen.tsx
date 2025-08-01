import React, { useState, useCallback } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  IconButton,
  ActivityIndicator,

  Chip,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  calculateShippingByZip,
  setSelectedShippingOption,
  selectCart,
  selectCartItems,
  selectCartIsLoading,
  selectCartIsUpdating,
  selectCartError,
  selectAppliedCoupon,
  selectShippingOptions,
  selectSelectedShippingOption,
} from '../../store/slices/cartSlice';

// Components
import CartItemCard from '../../components/CartItemCard';
import ShippingCalculator from '../../components/ShippingCalculator';
import CouponInput from '../../components/CouponInput';
import ErrorMessage from '../../components/ErrorMessage';

// Types

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela do Carrinho
 * Exibe itens do carrinho, cálculo de frete, cupons e resumo do pedido
 */

type CartScreenNavigationProp = NativeStackNavigationProp<any, 'Cart'>;

interface CartScreenProps {
  navigation: CartScreenNavigationProp;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const cart = useSelector(selectCart);
  const cartItems = useSelector(selectCartItems);
  const isLoading = useSelector(selectCartIsLoading);
  const isUpdating = useSelector(selectCartIsUpdating);
  const error = useSelector(selectCartError);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const shippingOptions = useSelector(selectShippingOptions);
  const selectedShippingOption = useSelector(selectSelectedShippingOption);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Load cart data
  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  /**
   * Load cart data
   */
  const loadCart = async () => {
    try {
      await dispatch(fetchCart()).unwrap();
    } catch (err) {
      logger.error('Error loading cart:', err);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  /**
   * Update item quantity
   */
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      await dispatch(updateCartItem({ itemId, quantity })).unwrap();
    } catch (err) {
      Alert.alert('Erro', 'Erro ao atualizar quantidade');
    }
  };

  /**
   * Remove item from cart
   */
  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      'Remover item',
      'Tem certeza que deseja remover este item do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromCart(itemId)).unwrap();
            } catch (err) {
              Alert.alert('Erro', 'Erro ao remover item');
            }
          },
        },
      ]
    );
  };

  /**
   * Clear entire cart
   */
  const handleClearCart = () => {
    Alert.alert(
      'Limpar carrinho',
      'Tem certeza que deseja remover todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearCart()).unwrap();
            } catch (err) {
              Alert.alert('Erro', 'Erro ao limpar carrinho');
            }
          },
        },
      ]
    );
  };

  /**
   * Apply coupon
   */
  const handleApplyCoupon = async (code: string) => {
    try {
      await dispatch(applyCoupon(code)).unwrap();
      Alert.alert('Sucesso', 'Cupom aplicado com sucesso!');
    } catch (err) {
      Alert.alert('Erro', 'Cupom inválido ou expirado');
    }
  };

  /**
   * Remove coupon
   */
  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
    } catch (err) {
      Alert.alert('Erro', 'Erro ao remover cupom');
    }
  };

  /**
   * Calculate shipping
   */
  const handleCalculateShipping = async (zipCode: string) => {
    try {
      await dispatch(calculateShippingByZip(zipCode)).unwrap();
    } catch (err) {
      Alert.alert('Erro', 'Erro ao calcular frete');
    }
  };

  /**
   * Select shipping option
   */
  const handleSelectShippingOption = (optionId: string) => {
    dispatch(setSelectedShippingOption(optionId));
  };

  /**
   * Navigate to checkout
   */
  const navigateToCheckout = () => {
    if (!cart || cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens ao carrinho para continuar');
      return;
    }

    navigation.navigate('Checkout');
  };

  /**
   * Navigate to shop
   */
  const navigateToShop = () => {
    navigation.navigate('Shop');
  };

  /**
   * Format price
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Get selected shipping option details
   */
  const getSelectedShippingDetails = () => {
    if (!selectedShippingOption) return null;
    return shippingOptions.find(option => option.id === selectedShippingOption);
  };

  /**
   * Calculate total with shipping
   */
  const calculateTotalWithShipping = (): number => {
    if (!cart) return 0;
    const shippingCost = getSelectedShippingDetails()?.price || 0;
    return cart.total + shippingCost;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando carrinho...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadCart}
        style={styles.container}
      />
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Title style={styles.emptyTitle}>Carrinho vazio</Title>
        <Text style={styles.emptyText}>
          Adicione caixas misteriosas ao seu carrinho para continuar
        </Text>
        <Button
          mode="contained"
          onPress={navigateToShop}
          style={styles.shopButton}
          icon="shopping"
        >
          Ir às compras
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.headerTitle}>
          Carrinho ({cart.total_items})
        </Title>
        <IconButton
          icon="delete-outline"
          size={24}
          onPress={handleClearCart}
          disabled={isUpdating}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Itens do Carrinho</Title>
          {cartItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={(quantity) => handleUpdateQuantity(item.id, quantity)}
              onRemove={() => handleRemoveItem(item.id)}
              disabled={isUpdating}
            />
          ))}
        </View>

        {/* Coupon Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Cupom de Desconto</Title>
            {appliedCoupon ? (
              <View style={styles.appliedCouponContainer}>
                <Chip
                  mode="flat"
                  icon="ticket-percent"
                  onClose={handleRemoveCoupon}
                  style={styles.appliedCoupon}
                >
                  {appliedCoupon}
                </Chip>
                <Text style={styles.discountText}>
                  Desconto: {formatPrice(cart.discount)}
                </Text>
              </View>
            ) : (
              <CouponInput
                onApply={handleApplyCoupon}
                disabled={isUpdating}
              />
            )}
          </Card.Content>
        </Card>

        {/* Shipping Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Frete</Title>
            <ShippingCalculator
              onCalculate={handleCalculateShipping}
              options={shippingOptions}
              selectedOption={selectedShippingOption}
              onSelectOption={handleSelectShippingOption}
              disabled={isUpdating}
            />
          </Card.Content>
        </Card>

        {/* Order Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumo do Pedido</Title>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(cart.subtotal)}
              </Text>
            </View>
            
            {cart.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Desconto</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(cart.discount)}
                </Text>
              </View>
            )}
            
            {getSelectedShippingDetails() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Frete ({getSelectedShippingDetails()?.name})
                </Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(getSelectedShippingDetails()?.price || 0)}
                </Text>
              </View>
            )}
            
            <Divider style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(calculateTotalWithShipping())}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <Button
          mode="contained"
          onPress={navigateToCheckout}
          loading={isUpdating}
          disabled={isUpdating || cartItems.length === 0}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          icon="credit-card"
        >
          Finalizar Pedido - {formatPrice(calculateTotalWithShipping())}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: getSpacing('md'),
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
    backgroundColor: theme.colors.background,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: getSpacing('lg'),
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
    lineHeight: 24,
  },
  shopButton: {
    borderRadius: getBorderRadius('md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
  },
  card: {
    margin: getSpacing('md'),
    marginTop: 0,
    borderRadius: getBorderRadius('lg'),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedCoupon: {
    backgroundColor: theme.colors.primaryContainer,
  },
  discountText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  discountValue: {
    color: theme.colors.primary,
  },
  summaryDivider: {
    marginVertical: getSpacing('md'),
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
  bottomSpacer: {
    height: 100,
  },
  checkoutContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    elevation: 8,
  },
  checkoutButton: {
    borderRadius: getBorderRadius('md'),
  },
  checkoutButtonContent: {
    paddingVertical: getSpacing('sm'),
  },
});

export default CartScreen;
