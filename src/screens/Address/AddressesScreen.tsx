import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchUserAddresses,
  selectUserAddresses,
  selectUserLoading,
  selectUserError,
} from '../../store/slices/userSlice';

// Services
import { userService } from '../../services/userService';

// Components
import AddressCard from '../../components/AddressCard';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { Address } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Gerenciamento de Endereços
 * Lista, adiciona, edita e remove endereços de entrega
 */

type AddressesScreenNavigationProp = NativeStackNavigationProp<any, 'Addresses'>;

interface AddressesScreenProps {
  navigation: AddressesScreenNavigationProp;
}

const AddressesScreen: React.FC<AddressesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const addresses = useSelector(selectUserAddresses);
  const isLoading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Load addresses
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  /**
   * Load addresses
   */
  const loadAddresses = async () => {
    try {
      await dispatch(fetchUserAddresses()).unwrap();
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  /**
   * Navigate to add address
   */
  const navigateToAddAddress = () => {
    navigation.navigate('AddEditAddress', { mode: 'add' });
  };

  /**
   * Navigate to edit address
   */
  const navigateToEditAddress = (address: Address) => {
    navigation.navigate('AddEditAddress', { mode: 'edit', address });
  };

  /**
   * Set address as default
   */
  const setAsDefault = async (addressId: string) => {
    try {
      await userService.setDefaultAddress(addressId);
      await loadAddresses();
      Alert.alert('Sucesso', 'Endereço padrão atualizado!');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao definir endereço padrão');
    }
  };

  /**
   * Delete address
   */
  const deleteAddress = async (addressId: string) => {
    Alert.alert(
      'Excluir Endereço',
      'Tem certeza que deseja excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(addressId);
            try {
              await userService.deleteAddress(addressId);
              await loadAddresses();
              Alert.alert('Sucesso', 'Endereço excluído!');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Erro ao excluir endereço');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Render address item
   */
  const renderAddressItem = ({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      onEdit={() => navigateToEditAddress(item)}
      onDelete={() => deleteAddress(item.id)}
      onSetDefault={() => setAsDefault(item.id)}
      isDeleting={deletingId === item.id}
      style={styles.addressCard}
    />
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Title style={styles.emptyTitle}>Nenhum endereço cadastrado</Title>
      <Text style={styles.emptyText}>
        Adicione um endereço de entrega para finalizar suas compras
      </Text>
      <Button
        mode="contained"
        onPress={navigateToAddAddress}
        style={styles.addButton}
        icon="plus"
      >
        Adicionar Endereço
      </Button>
    </View>
  );

  if (isLoading && addresses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando endereços...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadAddresses}
        style={styles.container}
      />
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
          Endereços ({addresses.length})
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      {addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add FAB */}
      {addresses.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={navigateToAddAddress}
          label="Adicionar"
        />
      )}
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
  list: {
    padding: getSpacing('md'),
  },
  addressCard: {
    marginBottom: getSpacing('md'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
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
  addButton: {
    borderRadius: getBorderRadius('md'),
  },
  fab: {
    position: 'absolute',
    margin: getSpacing('lg'),
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default AddressesScreen;
