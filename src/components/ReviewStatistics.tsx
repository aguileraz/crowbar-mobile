import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  ProgressBar,
} from 'react-native-paper';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Estatísticas de Reviews
 * Exibe média de avaliações e distribuição por estrelas
 */

interface ReviewStatisticsProps {
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  style?: ViewStyle;
}

const ReviewStatistics: React.FC<ReviewStatisticsProps> = ({
  statistics,
  style,
}) => {
  /**
   * Render star rating
   */
  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Text key={i} style={styles.star}>⭐</Text>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Text key={i} style={styles.star}>⭐</Text>
        );
      } else {
        stars.push(
          <Text key={i} style={[styles.star, styles.emptyStar]}>⭐</Text>
        );
      }
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  /**
   * Get rating percentage
   */
  const getRatingPercentage = (count: number): number => {
    if (statistics.totalReviews === 0) return 0;
    return count / statistics.totalReviews;
  };

  /**
   * Format rating
   */
  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  /**
   * Render rating distribution bar
   */
  const renderRatingBar = (stars: number, count: number) => {
    const percentage = getRatingPercentage(count);
    
    return (
      <View key={stars} style={styles.ratingBar}>
        <Text style={styles.ratingBarLabel}>
          {stars} ⭐
        </Text>
        <ProgressBar
          progress={percentage}
          color={theme.colors.primary}
          style={styles.progressBar}
        />
        <Text style={styles.ratingBarCount}>
          {count}
        </Text>
      </View>
    );
  };

  return (
    <Card style={[styles.card, style]}>
      <Card.Content style={styles.content}>
        {/* Overall Rating */}
        <View style={styles.overallRating}>
          <View style={styles.ratingScore}>
            <Text style={styles.averageRating}>
              {formatRating(statistics.averageRating)}
            </Text>
            {renderStarRating(statistics.averageRating)}
            <Text style={styles.totalReviews}>
              {statistics.totalReviews} avaliação{statistics.totalReviews !== 1 ? 'ões' : ''}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View style={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map(stars => 
              renderRatingBar(stars, statistics.ratingDistribution[stars as keyof typeof statistics.ratingDistribution])
            )}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(getRatingPercentage(statistics.ratingDistribution[5] + statistics.ratingDistribution[4]) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Positivas</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(getRatingPercentage(statistics.ratingDistribution[1] + statistics.ratingDistribution[2]) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Negativas</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics.ratingDistribution[5]}
            </Text>
            <Text style={styles.statLabel}>5 Estrelas</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: getBorderRadius('md'),
  },
  content: {
    padding: getSpacing('lg'),
  },
  overallRating: {
    flexDirection: 'row',
    marginBottom: getSpacing('lg'),
  },
  ratingScore: {
    alignItems: 'center',
    marginRight: getSpacing('xl'),
    minWidth: 100,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: getSpacing('xs'),
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 2,
  },
  emptyStar: {
    color: theme.colors.outline,
  },
  totalReviews: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  ratingDistribution: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  ratingBarLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    marginHorizontal: getSpacing('sm'),
    borderRadius: 4,
  },
  ratingBarCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    width: 30,
    textAlign: 'right',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: getSpacing('md'),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing('xs'),
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.outline,
    marginHorizontal: getSpacing('sm'),
  },
});

export default ReviewStatistics;