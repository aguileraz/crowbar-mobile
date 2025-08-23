import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Text,
  RadioButton,
  Button,
  Card,
  Icon,
} from 'react-native-paper';
import { PaymentMethod } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Seleção de Método de Pagamento
 * Permite selecionar método de pagamento
 */

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: string | null;
  onSelectPaymentMethod: (methodId: string) => void;
  onAddNew: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onAddNew,
}) => {
  /**
   * Obter ícone do método de pagamento
   */
  const getPaymentIcon = (type: string): string => {
    switch (type) {
      case 'credit_card':
        return 'credit-card';
      case 'debit_card':
        return 'credit-card-outline';
      case 'pix':
        return 'qrcode';
      case 'boleto':
        return 'barcode';
      case 'paypal':
        return 'paypal';
      default:
        return 'credit-card';
    }
  };

  /**
   * Obter nome do método de pagamento
   */
  const getPaymentTypeName = (type: string): string => {
    switch (type) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto Bancário';
      case 'paypal':
        return 'PayPal';
      default:
        return 'Outro';
    }
  };

  /**
   * Mascarar número do cartão
   */
  const maskCardNumber = (number: string): string => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    return `**** **** **** ${cleaned.slice(-4)}`;
  };

  if (paymentMethods.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum método de pagamento cadastrado
        </Text>
        <Button
          mode="contained"
          onPress={onAddNew}
          style={styles.addButton}
          icon="plus"
        >
          Adicionar Método
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {paymentMethods.map((method) => (
        <Card
          key={method.id}
          style={[
            styles.methodCard,
            selectedPaymentMethod === method.id && styles.selectedCard,
          ]}
          onPress={() => onSelectPaymentMethod(method.id)}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.methodHeader}>
              <RadioButton
                value={method.id}
                status={selectedPaymentMethod === method.id ? 'checked' : 'unchecked'}
                onPress={() => onSelectPaymentMethod(method.id)}
              />
              
              <View style={styles.methodIcon}>
                <Icon
                  source={getPaymentIcon(method.type)}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              
              <View style={styles.methodInfo}>
                <View style={styles.methodTitleRow}>
                  <Text style={styles.methodTitle}>
                    {getPaymentTypeName(method.type)}
                  </Text>
                  {method.is_default && (
                    <Text style={styles.defaultBadge}>Padrão</Text>
                  )}
                </View>
                
                {method.type === 'credit_card' || method.type === 'debit_card' ? (
                  <>
                    <Text style={styles.cardNumber}>
                      {maskCardNumber(method.card_number || '')}
                    </Text>
                    <Text style={styles.cardDetails}>
                      {method.card_brand} • Exp: {method.expiry_month}/{method.expiry_year}
                    </Text>
                  </>
                ) : method.type === 'pix' ? (
                  <Text style={styles.pixDetails}>
                    Pagamento instantâneo via PIX
                  </Text>
                ) : method.type === 'boleto' ? (
                  <Text style={styles.boletoDetails}>
                    Vencimento em 3 dias úteis
                  </Text>
                ) : (
                  <Text style={styles.otherDetails}>
                    {method.description || 'Método de pagamento'}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
      
      <Button
        mode="outlined"
        onPress={onAddNew}
        style={styles.addNewButton}
        icon="plus"
      >
        Adicionar Novo Método
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('lg'),
    textAlign: 'center',
  },
  addButton: {
    borderRadius: getBorderRadius('md'),
  },
  methodCard: {
    marginBottom: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer + '20',
  },
  cardContent: {
    padding: getSpacing('md'),
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    marginLeft: getSpacing('sm'),
    marginRight: getSpacing('md'),
  },
  methodInfo: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('xs'),
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  defaultBadge: {
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
    fontWeight: '500',
  },
  cardNumber: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontFamily: 'monospace',
    marginBottom: getSpacing('xs'),
  },
  cardDetails: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  pixDetails: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  boletoDetails: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  otherDetails: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  addNewButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
});

export default PaymentMethodSelector;