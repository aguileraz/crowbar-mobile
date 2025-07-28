import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  RadioButton,

  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  selectCart,
  selectCartItems,
  selectSelectedShippingOption,
  selectShippingOptions,
} from '../../store/slices/cartSlice';

// Services
import { userService } from '../../services/userService';
import { cartService } from '../../services/cartService';

// Components
import AddressSelector from '../../components/AddressSelector';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import OrderSummary from '../../components/OrderSummary';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { PaymentMethod } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Checkout
 * Processo completo de finalização do pedido
 */

type CheckoutScreenNavigationProp = NativeStackNavigationProp<any, 'Checkout'>;

interface CheckoutScreenProps {
  navigation: CheckoutScreenNavigationProp;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const _dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const cart = useSelector(selectCart);
  const cartItems = useSelector(selectCartItems);
  const selectedShippingOption = useSelector(selectSelectedShippingOption);
  const shippingOptions = useSelector(selectShippingOptions);
  
  // Local state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Load checkout data
  useFocusEffect(
    useCallback(() => {
      loadCheckoutData();
    }, [])
  );

  /**
   * Load checkout data
   */
  const loadCheckoutData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [addressesData, paymentMethodsData] = await Promise.all([
        userService.getAddresses(),
        userService.getPaymentMethods(),
      ]);

      setAddresses(addressesData);
      setPaymentMethods(paymentMethodsData);

      // Auto-select default address
      const defaultAddress = addressesData.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      }

      // Auto-select default payment method
      const defaultPayment = paymentMethodsData.find(pm => pm.is_default);
      if (defaultPayment) {
        setSelectedPaymentMethod(defaultPayment.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do checkout');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Address
        return !!selectedAddress;
      case 2: // Shipping
        return !!selectedShippingOption;
      case 3: // Payment
        return !!selectedPaymentMethod;
      default:
        return false;
    }
  };

  /**
   * Go to next step
   */
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      Alert.alert('Atenção', 'Complete as informações desta etapa para continuar');
    }
  };

  /**
   * Go to previous step
   */
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Process order
   */
  const processOrder = async () => {
    if (!selectedAddress || !selectedShippingOption || !selectedPaymentMethod) {
      Alert.alert('Erro', 'Complete todas as informações para finalizar o pedido');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        address_id: selectedAddress,
        shipping_option_id: selectedShippingOption,
        payment_method_id: selectedPaymentMethod,
      };

      const order = await cartService.createOrder(orderData);

      Alert.alert(
        'Pedido realizado!',
        `Seu pedido #${order.order_number} foi criado com sucesso.`,
        [
          {
            text: 'Ver pedido',
            onPress: () => navigation.navigate('OrderDetails', { orderId: order.id }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
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
   * Get selected shipping details
   */
  const getSelectedShippingDetails = () => {
    if (!selectedShippingOption) return null;
    return shippingOptions.find(option => option.id === selectedShippingOption);
  };

  /**
   * Calculate total with shipping
   */
  const calculateTotal = (): number => {
    if (!cart) return 0;
    const shippingCost = getSelectedShippingDetails()?.price || 0;
    return cart.total + shippingCost;
  };

  /**
   * Render step indicator
   */
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep > step && styles.stepCircleCompleted,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Endereço' : step === 2 ? 'Frete' : 'Pagamento'}
          </Text>
        </View>
      ))}
    </View>
  );

  /**
   * Render address step
   */
  const renderAddressStep = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Endereço de Entrega</Title>
        <AddressSelector
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={setSelectedAddress}
          onAddNew={() => navigation.navigate('AddAddress')}
        />
      </Card.Content>
    </Card>
  );

  /**
   * Render shipping step
   */
  const renderShippingStep = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Opções de Entrega</Title>
        {shippingOptions.length === 0 ? (
          <Text style={styles.noOptionsText}>
            Nenhuma opção de frete disponível
          </Text>
        ) : (
          shippingOptions.map((option) => (
            <View key={option.id} style={styles.shippingOption}>
              <RadioButton
                value={option.id}
                status={selectedShippingOption === option.id ? 'checked' : 'unchecked'}
                onPress={() => setSelectedShippingOption(option.id)}
              />
              <View style={styles.shippingInfo}>
                <View style={styles.shippingHeader}>
                  <Text style={styles.shippingName}>{option.name}</Text>
                  <Text style={styles.shippingPrice}>
                    {option.price === 0 ? 'Grátis' : formatPrice(option.price)}
                  </Text>
                </View>
                <Text style={styles.shippingDelivery}>
                  Entrega em {option.estimated_days} dias úteis
                </Text>
              </View>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  /**
   * Render payment step
   */
  const renderPaymentStep = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Método de Pagamento</Title>
        <PaymentMethodSelector
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          onSelectPaymentMethod={setSelectedPaymentMethod}
          onAddNew={() => navigation.navigate('AddPaymentMethod')}
        />
      </Card.Content>
    </Card>
  );

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderAddressStep();
      case 2:
        return renderShippingStep();
      case 3:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando checkout...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadCheckoutData}
        style={styles.container}
      />
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Carrinho vazio</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Shop')}
          style={styles.shopButton}
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
        <Title style={styles.headerTitle}>Checkout</Title>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Step Content */}
        {renderStepContent()}

        {/* Order Summary */}
        <OrderSummary
          cart={cart}
          shippingOption={getSelectedShippingDetails()}
          total={calculateTotal()}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <Button
            mode="outlined"
            onPress={goToPreviousStep}
            style={styles.backButton}
            disabled={isProcessing}
          >
            Voltar
          </Button>
        )}
        
        {currentStep < 3 ? (
          <Button
            mode="contained"
            onPress={goToNextStep}
            style={styles.nextButton}
            disabled={!validateStep(currentStep)}
          >
            Continuar
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={processOrder}
            loading={isProcessing}
            disabled={isProcessing || !validateStep(currentStep)}
            style={styles.finishButton}
            icon="credit-card"
          >
            Finalizar Pedido - {formatPrice(calculateTotal())}
          </Button>
        )}
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
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('lg'),
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
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: getSpacing('lg'),
    backgroundColor: theme.colors.surface,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  stepNumberActive: {
    color: theme.colors.onPrimary,
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
  },
  noOptionsText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    padding: getSpacing('lg'),
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  shippingInfo: {
    flex: 1,
    marginLeft: getSpacing('sm'),
  },
  shippingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shippingName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  shippingPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  shippingDelivery: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  bottomSpacer: {
    height: 100,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    elevation: 8,
    gap: getSpacing('md'),
  },
  backButton: {
    flex: 1,
    borderRadius: getBorderRadius('md'),
  },
  nextButton: {
    flex: 2,
    borderRadius: getBorderRadius('md'),
  },
  finishButton: {
    flex: 1,
    borderRadius: getBorderRadius('md'),
  },
});

export default CheckoutScreen;
