import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  IconButton,
  Menu,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Address } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Card de Endereço
 * Exibe informações do endereço com opções de ação
 */

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDeleting?: boolean;
  style?: ViewStyle;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting = false,
  style,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  /**
   * Format complete address
   */
  const formatAddress = (): string => {
    const parts = [
      address.street,
      address.number,
      address.complement,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  /**
   * Format neighborhood and city
   */
  const formatLocation = (): string => {
    const parts = [
      address.neighborhood,
      address.city,
      address.state,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  /**
   * Get address type icon
   */
  const getAddressIcon = (): string => {
    switch (address.type) {
      case 'home':
        return 'home';
      case 'work':
        return 'office-building';
      case 'other':
      default:
        return 'map-marker';
    }
  };

  /**
   * Get address type label
   */
  const getAddressTypeLabel = (): string => {
    switch (address.type) {
      case 'home':
        return 'Casa';
      case 'work':
        return 'Trabalho';
      case 'other':
      default:
        return 'Outro';
    }
  };

  return (
    <Card style={[styles.card, style]} elevation={1}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <IconButton
                icon={getAddressIcon()}
                size={20}
                iconColor={theme.colors.primary}
                style={styles.typeIcon}
              />
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.addressLabel}>
                {address.label || getAddressTypeLabel()}
              </Text>
              {address.is_default && (
                <Chip
                  mode="flat"
                  style={styles.defaultChip}
                  textStyle={styles.defaultChipText}
                  compact
                >
                  Padrão
                </Chip>
              )}
            </View>
          </View>

          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setShowMenu(true)}
                disabled={isDeleting}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                onEdit();
              }}
              title="Editar"
              leadingIcon="pencil"
            />
            {!address.is_default && (
              <Menu.Item
                onPress={() => {
                  setShowMenu(false);
                  onSetDefault();
                }}
                title="Definir como padrão"
                leadingIcon="star"
              />
            )}
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                onDelete();
              }}
              title="Excluir"
              leadingIcon="delete"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>

        <View style={styles.addressInfo}>
          <Text style={styles.addressText}>
            {formatAddress()}
          </Text>
          <Text style={styles.locationText}>
            {formatLocation()}
          </Text>
          <Text style={styles.zipText}>
            CEP: {address.zip_code}
          </Text>
          
          {address.reference && (
            <Text style={styles.referenceText}>
              Ref: {address.reference}
            </Text>
          )}
        </View>

        {isDeleting && (
          <View style={styles.deletingOverlay}>
            <ActivityIndicator size="small" />
            <Text style={styles.deletingText}>Excluindo...</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: getBorderRadius('md'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    padding: getSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('md'),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: getSpacing('sm'),
  },
  typeIcon: {
    margin: 0,
    backgroundColor: theme.colors.primaryContainer,
  },
  titleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  defaultChip: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  defaultChipText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  addressInfo: {
    marginLeft: getSpacing('sm'),
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  zipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  referenceText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: getBorderRadius('md'),
  },
  deletingText: {
    marginLeft: getSpacing('sm'),
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
});

export default AddressCard;
