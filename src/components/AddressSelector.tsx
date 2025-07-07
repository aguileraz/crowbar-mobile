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
} from 'react-native-paper';
import { Address } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Seleção de Endereço
 * Permite selecionar endereço de entrega
 */

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: string | null;
  onSelectAddress: (addressId: string) => void;
  onAddNew: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNew,
}) => {
  /**
   * Formatar endereço completo
   */
  const formatAddress = (address: Address): string => {
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zip_code,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  if (addresses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum endereço cadastrado
        </Text>
        <Button
          mode="contained"
          onPress={onAddNew}
          style={styles.addButton}
          icon="plus"
        >
          Adicionar Endereço
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {addresses.map((address) => (
        <Card
          key={address.id}
          style={[
            styles.addressCard,
            selectedAddress === address.id && styles.selectedCard,
          ]}
          onPress={() => onSelectAddress(address.id)}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.addressHeader}>
              <RadioButton
                value={address.id}
                status={selectedAddress === address.id ? 'checked' : 'unchecked'}
                onPress={() => onSelectAddress(address.id)}
              />
              <View style={styles.addressInfo}>
                <View style={styles.addressTitleRow}>
                  <Text style={styles.addressTitle}>
                    {address.label || 'Endereço'}
                  </Text>
                  {address.is_default && (
                    <Text style={styles.defaultBadge}>Padrão</Text>
                  )}
                </View>
                <Text style={styles.addressText}>
                  {formatAddress(address)}
                </Text>
                {address.reference && (
                  <Text style={styles.referenceText}>
                    Ref: {address.reference}
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
        Adicionar Novo Endereço
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
  addressCard: {
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
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginLeft: getSpacing('sm'),
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('xs'),
  },
  addressTitle: {
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
  addressText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: getSpacing('xs'),
  },
  referenceText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  addNewButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
});

export default AddressSelector;
