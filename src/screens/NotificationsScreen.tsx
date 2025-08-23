import React, { useState, useCallback } from 'react';
import logger from '../services/loggerService';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  IconButton,
  Chip,
  FAB,
  Menu,

  Badge,
  Surface,
  Divider,
} from 'react-native-paper';
import { _useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setFilters,
  clearFilters,
  selectNotifications,
  selectUnreadCount,
  selectNotificationFilters,
  selectNotificationsLoading,
  selectNotificationsError,
  selectNotificationPagination,
} from '../store/slices/notificationsSlice';
import { _theme, getSpacing } from '../theme';
import { _useScreenTracking, useEngagementTracking } from '../hooks/useAnalytics';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ScreenTransition from '../components/ScreenTransition';

/**
 * Tela de Notificações
 */

interface NotificationsScreenProps {
  navigation: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Analytics
  useScreenTracking('Notifications');
  const { trackButtonClick, trackEngagement } = useEngagementTracking();

  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const _filters = useSelector(selectNotificationFilters);
  const isLoading = useSelector(selectNotificationsLoading);
  const _error = useSelector(selectNotificationsError);
  const pagination = useSelector(selectNotificationPagination);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [_selectedFilter, setSelectedFilter] = useState<string>('all');

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async (reset = false) => {
    try {
      await dispatch(fetchNotifications({ 
        page: reset ? 1 : pagination.page + 1, 
        reset 
      })).unwrap();
    } catch (err) {
      logger.error('Error loading notifications:', _err);
    }
  }, [dispatch, pagination.page]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    trackEngagement('pull_to_refresh', 'notifications');
    
    try {
      await loadNotifications(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications, trackEngagement]);

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
      trackEngagement('mark_as_read', 'notification');
    } catch (err) {
      logger.error('Error marking as read:', _err);
    }
  }, [dispatch, trackEngagement]);

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      trackButtonClick('mark_all_as_read', 'notifications');
    } catch (err) {
      logger.error('Error marking all as read:', _err);
    }
  }, [dispatch, trackButtonClick]);

  /**
   * Handle delete notification
   */
  const handleDeleteNotification = useCallback((notificationId: string) => {
    Alert.alert(
      'Excluir Notificação',
      'Tem certeza que deseja excluir esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteNotification(notificationId)).unwrap();
              trackEngagement('delete_notification', 'notification');
            } catch (err) {
              logger.error('Error deleting notification:', _err);
            }
          },
        },
      ]
    );
  }, [dispatch, trackEngagement]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setMenuVisible(false);
    
    switch (filter) {
      case 'all':
        dispatch(clearFilters());
        break;
      case 'unread':
        dispatch(setFilters({ read: false }));
        break;
      case 'orders':
        dispatch(setFilters({ type: 'order' }));
        break;
      case 'promotions':
        dispatch(setFilters({ type: 'promotion' }));
        break;
      case 'system':
        dispatch(setFilters({ type: 'system' }));
        break;
    }
    
    trackEngagement('filter_notifications', _filter);
  }, [dispatch, trackEngagement]);

  /**
   * Handle notification press
   */
  const handleNotificationPress = useCallback((notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.actionUrl) {
      // Handle deep link navigation
      trackEngagement('notification_click', notification.type);
    }
  }, [handleMarkAsRead, trackEngagement]);

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Agora';
    } else if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days} dias atrás`;
    }
  };

  /**
   * Get notification icon
   */
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'order':
        return 'package-variant';
      case 'box':
        return 'cube-outline';
      case 'promotion':
        return 'tag';
      case 'social':
        return 'account-group';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  };

  /**
   * Get notification color
   */
  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'order':
        return '#4CAF50';
      case 'box':
        return '#FF9800';
      case 'promotion':
        return '#E91E63';
      case 'social':
        return '#2196F3';
      case 'system':
        return '#9C27B0';
      default:
        return theme.colors.primary;
    }
  };

  /**
   * Render notification item
   */
  const renderNotificationItem = ({ item }: { item: any }) => (
    <Card
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <IconButton
              icon={getNotificationIcon(item.type)}
              size={24}
              iconColor={getNotificationColor(item.type)}
              style={[
                styles.typeIcon,
                { backgroundColor: getNotificationColor(item.type) + '20' },
              ]}
            />
            {!item.isRead && <Badge style={styles.unreadBadge} />}
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Paragraph style={styles.body} numberOfLines={2}>
              {item.body}
            </Paragraph>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          <IconButton
            icon="delete"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => handleDeleteNotification(item.id)}
            style={styles.deleteButton}
          />
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="bell-outline"
        size={64}
        iconColor={theme.colors.onSurfaceVariant}
      />
      <Title style={styles.emptyTitle}>Nenhuma notificação</Title>
      <Paragraph style={styles.emptyText}>
        Você não tem notificações no momento.
      </Paragraph>
    </View>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 5 }).map((_, _index) => (
        <LoadingSkeleton
          key={0}
          width="100%"
          height={80}
          style={styles.loadingSkeleton}
        />
      ))}
    </View>
  );

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(true);
  }, []);

  return (
    <ScreenTransition type="fade">
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <Title>Notificações</Title>
            {unreadCount > 0 && (
              <Chip
                mode="flat"
                style={styles.unreadChip}
                textStyle={styles.unreadChipText}
              >
                {unreadCount} não lidas
              </Chip>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="filter-variant"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => handleFilterChange('all')}
                title="Todas"
                leadingIcon="bell"
              />
              <Menu.Item
                onPress={() => handleFilterChange('unread')}
                title="Não lidas"
                leadingIcon="bell-badge"
              />
              <Divider />
              <Menu.Item
                onPress={() => handleFilterChange('orders')}
                title="Pedidos"
                leadingIcon="package-variant"
              />
              <Menu.Item
                onPress={() => handleFilterChange('promotions')}
                title="Promoções"
                leadingIcon="tag"
              />
              <Menu.Item
                onPress={() => handleFilterChange('system')}
                title="Sistema"
                leadingIcon="cog"
              />
            </Menu>
            
            {unreadCount > 0 && (
              <IconButton
                icon="check-all"
                onPress={handleMarkAllAsRead}
              />
            )}
          </View>
        </Surface>

        {/* Content */}
        {isLoading && notifications.length === 0 ? (
          renderLoadingState()
        ) : notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={() => {
              if (pagination.hasMore && !isLoading) {
                loadNotifications();
              }
            }}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Settings FAB */}
        <FAB
          icon="cog"
          style={styles.fab}
          onPress={() => {
            navigation.navigate('NotificationSettings');
            trackButtonClick('notification_settings', 'notifications');
          }}
        />
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: getSpacing('md'),
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  unreadChipText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: getSpacing('md'),
  },
  notificationCard: {
    marginBottom: getSpacing('sm'),
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardContent: {
    paddingVertical: getSpacing('sm'),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: getSpacing('md'),
  },
  typeIcon: {
    margin: 0,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    width: 12,
    height: 12,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: getSpacing('xs'),
  },
  unreadTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  body: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  deleteButton: {
    margin: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  emptyTitle: {
    marginTop: getSpacing('md'),
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  loadingContainer: {
    padding: getSpacing('md'),
  },
  loadingSkeleton: {
    marginBottom: getSpacing('sm'),
  },
  fab: {
    position: 'absolute',
    margin: getSpacing('md'),
    right: 0,
    bottom: 0,
  },
});

export default NotificationsScreen;