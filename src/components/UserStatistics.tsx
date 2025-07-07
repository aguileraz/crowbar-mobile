import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Icon,
} from 'react-native-paper';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Estatísticas do Usuário
 * Exibe métricas e conquistas do usuário
 */

interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  boxesOpened: number;
  favoriteBoxes: number;
  memberSince: string;
  level: number;
  experience: number;
  nextLevelExp: number;
}

interface UserStatisticsProps {
  statistics: UserStatistics;
  style?: ViewStyle;
}

const UserStatisticsComponent: React.FC<UserStatisticsProps> = ({
  statistics,
  style,
}) => {
  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Format number with K/M suffix
   */
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  /**
   * Get achievement level based on statistics
   */
  const getAchievementLevel = (type: string, value: number): string => {
    switch (type) {
      case 'orders':
        if (value >= 100) return 'Comprador Expert';
        if (value >= 50) return 'Comprador Frequente';
        if (value >= 10) return 'Comprador Ativo';
        return 'Novo Comprador';
      
      case 'boxes':
        if (value >= 500) return 'Colecionador Lendário';
        if (value >= 100) return 'Colecionador Expert';
        if (value >= 50) return 'Colecionador';
        return 'Explorador';
      
      case 'spent':
        if (value >= 10000) return 'VIP Platinum';
        if (value >= 5000) return 'VIP Gold';
        if (value >= 1000) return 'VIP Silver';
        return 'Membro';
      
      default:
        return '';
    }
  };

  /**
   * Render statistic item
   */
  const renderStatItem = (
    icon: string,
    label: string,
    value: string,
    achievement?: string,
    color?: string
  ) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: color || theme.colors.primaryContainer }]}>
        <Icon source={icon} size={24} color={color || theme.colors.primary} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {achievement && (
          <Text style={styles.statAchievement}>{achievement}</Text>
        )}
      </View>
    </View>
  );

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Title style={styles.title}>Suas Estatísticas</Title>
        
        <View style={styles.statsGrid}>
          {/* Total Orders */}
          {renderStatItem(
            'package-variant',
            'Pedidos Realizados',
            formatNumber(statistics.totalOrders),
            getAchievementLevel('orders', statistics.totalOrders),
            '#4CAF50'
          )}
          
          {/* Total Spent */}
          {renderStatItem(
            'currency-usd',
            'Total Gasto',
            formatCurrency(statistics.totalSpent),
            getAchievementLevel('spent', statistics.totalSpent),
            '#FF9800'
          )}
          
          {/* Boxes Opened */}
          {renderStatItem(
            'gift',
            'Caixas Abertas',
            formatNumber(statistics.boxesOpened),
            getAchievementLevel('boxes', statistics.boxesOpened),
            '#9C27B0'
          )}
          
          {/* Favorite Boxes */}
          {renderStatItem(
            'heart',
            'Favoritos',
            formatNumber(statistics.favoriteBoxes),
            undefined,
            '#F44336'
          )}
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>Nível {statistics.level}</Text>
            <Text style={styles.levelExp}>
              {statistics.experience}/{statistics.nextLevelExp} XP
            </Text>
          </View>
          
          <View style={styles.levelProgressContainer}>
            <View
              style={[
                styles.levelProgressBar,
                {
                  width: `${(statistics.experience / statistics.nextLevelExp) * 100}%`,
                },
              ]}
            />
          </View>
          
          <Text style={styles.levelDescription}>
            Continue comprando e abrindo caixas para subir de nível!
          </Text>
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>Conquistas Recentes</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementBadge}>
              <Icon source="trophy" size={16} color="#FFD700" />
              <Text style={styles.achievementText}>
                {getAchievementLevel('orders', statistics.totalOrders)}
              </Text>
            </View>
            <View style={styles.achievementBadge}>
              <Icon source="star" size={16} color="#FFD700" />
              <Text style={styles.achievementText}>
                {getAchievementLevel('boxes', statistics.boxesOpened)}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: getBorderRadius('lg'),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getSpacing('lg'),
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: getSpacing('lg'),
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
    padding: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('md'),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('sm'),
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statAchievement: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  levelSection: {
    backgroundColor: theme.colors.primaryContainer,
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
    marginBottom: getSpacing('lg'),
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
  },
  levelExp: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
    opacity: 0.8,
  },
  levelProgressContainer: {
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    marginBottom: getSpacing('sm'),
    overflow: 'hidden',
  },
  levelProgressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  levelDescription: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    opacity: 0.8,
  },
  achievementsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: getSpacing('md'),
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('sm'),
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
  },
  achievementText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: getSpacing('xs'),
    fontWeight: '500',
  },
});

export default UserStatisticsComponent;
