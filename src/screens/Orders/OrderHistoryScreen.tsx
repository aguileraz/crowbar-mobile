import React, { useState, useCallback } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Title,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  Menu,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { _useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchOrders,
  setFilters,
  clearFilters,
  selectOrders,
  selectOrdersLoading,
  selectOrdersError,
  selectOrdersFilters,
  selectOrdersPagination,
} from '../../store/slices/ordersSlice';

// Components
import OrderCard from '../../components/OrderCard';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { Order } from '../../types/api';

// Theme
import { _theme, getSpacing } from '../../theme';

/**
 * Tela de Histórico de Pedidos
 * Lista pedidos com filtros por status e busca
 */

type OrderHistoryScreenNavigationProp = NativeStackNavigationProp<any, 'OrderHistory'>;

interface OrderHistoryScreenProps {
  navigation: OrderHistoryScreenNavigationProp;
}

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const orders = useSelector(selectOrders);
  const isLoading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);
  const filters = useSelector(selectOrdersFilters);
  const pagination = useSelector(selectOrdersPagination);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');

  // Load orders
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [statusFilter, searchQuery, sortBy]);

  /**
   * Load orders
   */
  const loadOrders = async () => {
    try {
      await dispatch(fetchOrders({ page: 1, filters })).unwrap();
    } catch (err) {
      logger.error('Error loading orders:', _err);
    }
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    const newFilters: any = {};
    
    if (statusFilter !== 'all') {
      newFilters.status = statusFilter;
    }
    
    if (searchQuery.trim()) {
      newFilters.search = searchQuery.trim();
    }
    
    newFilters.sort_by = sortBy;
    newFilters.sort_order = 'desc';
    
    dispatch(setFilters(newFilters));
    dispatch(fetchOrders({ page: 1, filters: newFilters }));
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore && !isLoading) {
      setLoadingMore(true);
      try {
        await dispatch(fetchOrders({ 
          page: pagination.currentPage + 1, 
          filters 
        })).unwrap();
      } catch (err) {
        logger.error('Error loading more orders:', _err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy('date');
    dispatch(clearFilters());
    dispatch(fetchOrders({ page: 1 }));
  };

  /**
   * Navigate to order details
   */
  const navigateToOrderDetails = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  /**
   * Get status filter options
   */
  const getStatusFilterOptions = () => [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Processando' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  /**
   * Get active filters count
   */
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  /**
   * Render sort menu
   */
  const renderSortMenu = () => (
    <Menu
      visible={showSortMenu}
      onDismiss={() => setShowSortMenu(false)}
      anchor={
        <IconButton
          icon="sort"
          size={24}
          onPress={() => setShowSortMenu(true)}
        />
      }
    >
      <Menu.Item
        onPress={() => {
          setSortBy('date');
          setShowSortMenu(false);
        }}
        title="Data do pedido"
        leadingIcon={sortBy === 'date' ? 'check' : undefined}
      />
      <Menu.Item
        onPress={() => {
          setSortBy('total');
          setShowSortMenu(false);
        }}
        title="Valor total"
        leadingIcon={sortBy === 'total' ? 'check' : undefined}
      />
      <Menu.Item
        onPress={() => {
          setSortBy('_status');
          setShowSortMenu(false);
        }}
        title="Status"
        leadingIcon={sortBy === 'status' ? 'check' : undefined}
      />
    </Menu>
  );

  /**
   * Render order item
   */
  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      onPress={() => navigateToOrderDetails(item)}
      style={styles.orderCard}
    />
  );

  /**
   * Render footer
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
        <Text style={styles.footerText}>Carregando mais...</Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Title style={styles.emptyTitle}>Nenhum pedido encontrado</Title>
      <Text style={styles.emptyText}>
        {getActiveFiltersCount() > 0 
          ? 'Tente ajustar os filtros para encontrar seus pedidos'
          : 'Você ainda não fez nenhum pedido'
        }
      </Text>
      {getActiveFiltersCount() > 0 && (
        <Chip
          mode="outlined"
          onPress={clearAllFilters}
          style={styles.clearFiltersChip}
          icon="filter-remove"
        >
          Limpar filtros
        </Chip>
      )}
    </View>
  );

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadOrders}
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
          Meus Pedidos ({orders.length})
        </Title>
        {renderSortMenu()}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por número do pedido..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={getStatusFilterOptions().slice(0, 4).map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.statusFilter}
        />
        
        {getActiveFiltersCount() > 0 && (
          <Chip
            mode="flat"
            onPress={clearAllFilters}
            style={styles.activeFiltersChip}
            icon="filter-remove"
          >
            {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''}
          </Chip>
        )}
      </View>

      {orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: theme.colors.surfaceVariant,
  },
  filtersContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  statusFilter: {
    marginBottom: getSpacing('sm'),
  },
  activeFiltersChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
  },
  list: {
    padding: getSpacing('md'),
  },
  orderCard: {
    marginBottom: getSpacing('md'),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  footerText: {
    marginLeft: getSpacing('sm'),
    color: theme.colors.onSurfaceVariant,
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
    marginBottom: getSpacing('lg'),
    lineHeight: 24,
  },
  clearFiltersChip: {
    borderColor: theme.colors.primary,
  },
});

export default OrderHistoryScreen;