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
  FAB,
  Badge,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchNotifications,
  markAllAsRead,
  setFilters,
  clearFilters,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsError,
  selectNotificationFilters,
  selectNotificationsPagination,
} from '../../store/slices/notificationsSlice';

// Components
import NotificationCard from '../../components/NotificationCard';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { Notification } from '../../types/api';

// Theme
import { theme, getSpacing } from '../../theme';

/**
 * Tela de Notificações
 * Lista notificações com filtros e ações
 */

type NotificationsScreenNavigationProp = NativeStackNavigationProp<any, 'Notifications'>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const isLoading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const filters = useSelector(selectNotificationFilters);
  const pagination = useSelector(selectNotificationsPagination);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load notifications
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Apply filters when they change
  React.useEffect(() => {
    applyFilters();
  }, [typeFilter, readFilter]);

  /**
   * Load notifications
   */
  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications({ page: 1, filters })).unwrap();
    } catch (err) {
      logger.error('Error loading notifications:', err);
    }
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    const newFilters: any = {};
    
    if (typeFilter !== 'all') {
      newFilters.type = typeFilter;
    }
    
    if (readFilter !== 'all') {
      newFilters.read = readFilter === 'read';
    }
    
    dispatch(setFilters(newFilters));
    dispatch(fetchNotifications({ page: 1, filters: newFilters }));
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore && !isLoading) {
      setLoadingMore(true);
      try {
        await dispatch(fetchNotifications({ 
          page: pagination.currentPage + 1, 
          filters 
        })).unwrap();
      } catch (err) {
        logger.error('Error loading more notifications:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  /**
   * Mark all as read
   */
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (err) {
      logger.error('Error marking all as read:', _err);
    }
  };

  /**
   * Clear all filters
   */
  const _clearAllFilters = () => {
    setTypeFilter('all');
    setReadFilter('all');
    dispatch(clearFilters());
    dispatch(fetchNotifications({ page: 1 }));
  };

  /**
   * Navigate to settings
   */
  const navigateToSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  /**
   * Get type filter options
   */
  const getTypeFilterOptions = () => [
    { value: 'all', label: 'Todas' },
    { value: 'order', label: 'Pedidos' },
    { value: 'promotion', label: 'Ofertas' },
    { value: 'system', label: 'Sistema' },
  ];

  /**
   * Get read filter options
   */
  const getReadFilterOptions = () => [
    { value: 'all', label: 'Todas' },
    { value: 'unread', label: 'Não lidas' },
    { value: 'read', label: 'Lidas' },
  ];

  /**
   * Get active filters count
   */
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (readFilter !== 'all') count++;
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
          dispatch(setFilters({ sortBy: 'newest' }));
          setShowSortMenu(false);
        }}
        title="Mais recentes"
        leadingIcon="clock"
      />
      <Menu.Item
        onPress={() => {
          dispatch(setFilters({ sortBy: 'oldest' }));
          setShowSortMenu(false);
        }}
        title="Mais antigas"
        leadingIcon="clock-outline"
      />
      <Menu.Item
        onPress={() => {
          dispatch(setFilters({ sortBy: 'unread' }));
          setShowSortMenu(false);
        }}
        title="Não lidas primeiro"
        leadingIcon="email-outline"
      />
    </Menu>
  );

  /**
   * Render notification item
   */
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      style={styles.notificationCard}
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
      <Text style={styles.emptyIcon}>🔔</Text>
      <Title style={styles.emptyTitle}>Nenhuma notificação</Title>
      <Text style={styles.emptyText}>
        {getActiveFiltersCount() > 0 
          ? 'Nenhuma notificação encontrada com os filtros aplicados'
          : 'Você não tem notificações ainda'
        }
      </Text>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando notificações...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadNotifications}
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
        <View style={styles.headerTitle}>
          <Title style={styles.title}>Notificações</Title>
          {unreadCount > 0 && (
            <Badge style={styles.badge}>{unreadCount}</Badge>
          )}
        </View>
        <View style={styles.headerActions}>
          {renderSortMenu()}
          <IconButton
            icon="cog"
            size={24}
            onPress={navigateToSettings}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={typeFilter}
          onValueChange={setTypeFilter}
          buttons={getTypeFilterOptions().map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.typeFilter}
        />
        
        <SegmentedButtons
          value={readFilter}
          onValueChange={setReadFilter}
          buttons={getReadFilterOptions().map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.readFilter}
        />
      </View>

      {notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
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

      {/* Mark All Read FAB */}
      {unreadCount > 0 && (
        <FAB
          icon="email-open"
          style={styles.fab}
          onPress={handleMarkAllAsRead}
          label="Marcar todas como lidas"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: getSpacing('sm'),
    backgroundColor: theme.colors.error,
  },
  headerActions: {
    flexDirection: 'row',
  },
  filtersContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  typeFilter: {
    marginBottom: getSpacing('sm'),
  },
  readFilter: {
    marginBottom: getSpacing('sm'),
  },
  list: {
    padding: getSpacing('md'),
  },
  notificationCard: {
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
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: getSpacing('lg'),
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default NotificationsScreen;