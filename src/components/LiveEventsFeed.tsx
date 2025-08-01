import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ViewStyle,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Chip,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import {
  selectLiveEvents,
  selectLiveStats,
} from '../store/slices/realtimeSlice';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Feed de Eventos ao Vivo
 * Exibe eventos em tempo real como aberturas de caixas, novos usuários, etc.
 */

interface LiveEventsFeedProps {
  style?: ViewStyle;
  maxEvents?: number;
  showHeader?: boolean;
}

const LiveEventsFeed: React.FC<LiveEventsFeedProps> = ({
  style,
  maxEvents = 10,
  showHeader = true,
}) => {
  // Redux state
  const liveEvents = useSelector(selectLiveEvents);
  const liveStats = useSelector(selectLiveStats);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate new events
  useEffect(() => {
    if (liveEvents.length > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [liveEvents.length, fadeAnim]);

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) {
      return 'Agora';
    } else if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return 'Há mais de 1 dia';
    }
  };

  /**
   * Get event icon and color
   */
  const getEventInfo = (type: string) => {
    switch (type) {
      case 'box_opened':
        return { icon: 'gift-open', color: '#4CAF50', label: 'Caixa Aberta' };
      case 'new_box':
        return { icon: 'gift', color: '#2196F3', label: 'Nova Caixa' };
      case 'stock_update':
        return { icon: 'package-variant', color: '#FF9800', label: 'Estoque' };
      case 'promotion':
        return { icon: 'tag', color: '#9C27B0', label: 'Promoção' };
      case 'user_activity':
        return { icon: 'account', color: '#607D8B', label: 'Usuário' };
      default:
        return { icon: 'information', color: theme.colors.primary, label: 'Evento' };
    }
  };

  /**
   * Render event item
   */
  const renderEventItem = ({ item, _index }: { item: any; index: number }) => {
    const eventInfo = getEventInfo(item.type);
    
    return (
      <Animated.View
        style={[
          styles.eventItem,
          index === 0 && { opacity: fadeAnim },
        ]}
      >
        <Card style={styles.eventCard} elevation={1}>
          <Card.Content style={styles.eventContent}>
            <View style={styles.eventHeader}>
              <Avatar.Icon
                size={32}
                icon={eventInfo.icon}
                style={[
                  styles.eventIcon,
                  { backgroundColor: eventInfo.color + '20' },
                ]}
                color={eventInfo.color}
              />
              
              <View style={styles.eventInfo}>
                <View style={styles.eventTitleRow}>
                  <Text style={styles.eventTitle}>
                    {getEventTitle(item)}
                  </Text>
                  <Chip
                    mode="flat"
                    style={[
                      styles.eventTypeChip,
                      { backgroundColor: eventInfo.color + '20' },
                    ]}
                    textStyle={[
                      styles.eventTypeChipText,
                      { color: eventInfo.color },
                    ]}
                    compact
                  >
                    {eventInfo.label}
                  </Chip>
                </View>
                
                <Text style={styles.eventDescription}>
                  {getEventDescription(item)}
                </Text>
                
                <Text style={styles.eventTime}>
                  {formatTimeAgo(item.timestamp)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  /**
   * Get event title
   */
  const getEventTitle = (event: any): string => {
    switch (event.type) {
      case 'box_opened':
        return `${event.data.userName} abriu uma caixa!`;
      case 'new_box':
        return `Nova caixa disponível!`;
      case 'stock_update':
        return `Estoque atualizado`;
      case 'promotion':
        return `Promoção especial!`;
      case 'user_activity':
        return `${event.data.userName} entrou`;
      default:
        return 'Novo evento';
    }
  };

  /**
   * Get event description
   */
  const getEventDescription = (event: any): string => {
    switch (event.type) {
      case 'box_opened':
        const rareItems = event.data.rareItems || [];
        if (rareItems.length > 0) {
          return `Encontrou itens raros: ${rareItems.join(', ')}`;
        }
        return `Abriu ${event.data.boxName}`;
      case 'new_box':
        return `${event.data.boxName} está agora na loja`;
      case 'stock_update':
        return `${event.data.boxName} - ${event.data.stock} unidades`;
      case 'promotion':
        return event.data.description;
      case 'user_activity':
        return `Novo usuário online`;
      default:
        return 'Evento em tempo real';
    }
  };

  /**
   * Render header
   */
  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos ao Vivo</Text>
        <View style={styles.statsContainer}>
          <Chip
            mode="flat"
            style={styles.statChip}
            textStyle={styles.statChipText}
            icon="gift-open"
            compact
          >
            {liveStats.totalBoxesOpened} abertas
          </Chip>
          <Chip
            mode="flat"
            style={styles.statChip}
            textStyle={styles.statChipText}
            icon="account-multiple"
            compact
          >
            {liveStats.totalUsersOnline} online
          </Chip>
        </View>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📡</Text>
      <Text style={styles.emptyTitle}>Aguardando eventos...</Text>
      <Text style={styles.emptyText}>
        Os eventos ao vivo aparecerão aqui
      </Text>
    </View>
  );

  const displayEvents = liveEvents.slice(0, maxEvents);

  return (
    <View style={[styles.container, style]}>
      {renderHeader()}
      
      {displayEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={displayEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  statsContainer: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  statChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  statChipText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  list: {
    padding: getSpacing('md'),
  },
  eventItem: {
    marginBottom: getSpacing('sm'),
  },
  eventCard: {
    borderRadius: getBorderRadius('sm'),
  },
  eventContent: {
    padding: getSpacing('sm'),
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    marginRight: getSpacing('sm'),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('xs'),
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  eventTypeChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  eventTypeChipText: {
    fontSize: 9,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  eventTime: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: getSpacing('md'),
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default LiveEventsFeed;