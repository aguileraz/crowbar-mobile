import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  IconButton,
  Menu,
  Avatar,
  Chip,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { markAsRead, deleteNotification } from '../store/slices/notificationsSlice';
import { Notification } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Card de Notificação
 * Exibe notificação com ações de marcar como lida e deletar
 */

interface NotificationCardProps {
  notification: Notification;
  style?: ViewStyle;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  style,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showMenu, setShowMenu] = useState(false);

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  /**
   * Get notification icon
   */
  const getNotificationIcon = (): string => {
    switch (notification.type) {
      case 'order':
        return 'package-variant';
      case 'promotion':
        return 'tag';
      case 'system':
        return 'information';
      case 'box_opening':
        return 'gift';
      case 'review':
        return 'star';
      default:
        return 'bell';
    }
  };

  /**
   * Get notification color
   */
  const getNotificationColor = (): string => {
    switch (notification.type) {
      case 'order':
        return '#2196F3';
      case 'promotion':
        return '#FF9800';
      case 'system':
        return '#9C27B0';
      case 'box_opening':
        return '#4CAF50';
      case 'review':
        return '#FFD700';
      default:
        return theme.colors.primary;
    }
  };

  /**
   * Get notification type label
   */
  const getTypeLabel = (): string => {
    switch (notification.type) {
      case 'order':
        return 'Pedido';
      case 'promotion':
        return 'Oferta';
      case 'system':
        return 'Sistema';
      case 'box_opening':
        return 'Abertura';
      case 'review':
        return 'Avaliação';
      default:
        return 'Notificação';
    }
  };

  /**
   * Handle notification press
   */
  const handlePress = async () => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await dispatch(markAsRead(notification.id)).unwrap();
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on notification type and data
    // This would be handled by navigation service
  };

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = async () => {
    try {
      await dispatch(markAsRead(notification.id)).unwrap();
      setShowMenu(false);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    try {
      await dispatch(deleteNotification(notification.id)).unwrap();
      setShowMenu(false);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card 
        style={[
          styles.card, 
          style,
          !notification.read && styles.unreadCard,
        ]} 
        elevation={notification.read ? 1 : 2}
      >
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Avatar.Icon
                size={40}
                icon={getNotificationIcon()}
                style={[
                  styles.icon,
                  { backgroundColor: getNotificationColor() + '20' },
                ]}
                color={getNotificationColor()}
              />
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </View>

            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Chip
                  mode="flat"
                  style={[
                    styles.typeChip,
                    { backgroundColor: getNotificationColor() + '20' },
                  ]}
                  textStyle={[
                    styles.typeChipText,
                    { color: getNotificationColor() },
                  ]}
                  compact
                >
                  {getTypeLabel()}
                </Chip>
              </View>
              
              <Text style={styles.timestamp}>
                {formatDate(notification.created_at)}
              </Text>
            </View>

            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setShowMenu(true)}
                />
              }
            >
              {!notification.read && (
                <Menu.Item
                  onPress={handleMarkAsRead}
                  title="Marcar como lida"
                  leadingIcon="email-open"
                />
              )}
              <Menu.Item
                onPress={handleDelete}
                title="Excluir"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.message} numberOfLines={3}>
              {notification.message}
            </Text>
          </View>

          {/* Action Button */}
          {notification.action_url && (
            <View style={styles.actionContainer}>
              <Text style={styles.actionText}>
                Toque para ver detalhes
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: getBorderRadius('md'),
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unreadCard: {
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer + '10',
  },
  content: {
    padding: getSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getSpacing('sm'),
  },
  iconContainer: {
    position: 'relative',
    marginRight: getSpacing('md'),
  },
  icon: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('xs'),
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  typeChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  body: {
    marginLeft: 56, // Icon width + margin
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurface,
  },
  actionContainer: {
    marginLeft: 56,
    marginTop: getSpacing('sm'),
    paddingTop: getSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default NotificationCard;
