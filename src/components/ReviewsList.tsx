import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import {
  Card,
  Text,
  Avatar,
  IconButton,
  Chip,
} from 'react-native-paper';
import { Review } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente para Lista de Reviews
 * Exibe avaliações dos usuários com fotos e ratings
 */

interface ReviewsListProps {
  reviews: Review[];
  showAll?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ 
  reviews, 
  showAll = false 
}) => {
  /**
   * Renderizar estrelas de rating
   */
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={[
            styles.star,
            { color: i <= rating ? '#FFD700' : theme.colors.outline },
          ]}
        >
          ★
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Renderizar imagens do review
   */
  const renderReviewImages = (images: string[]) => {
    if (!images || images.length === 0) return null;

    return (
      <View style={styles.reviewImages}>
        <FlatList
          data={images.slice(0, 3)}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          )}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
        {images.length > 3 && (
          <View style={styles.moreImagesIndicator}>
            <Text style={styles.moreImagesText}>
              +{images.length - 3}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Renderizar review individual
   */
  const renderReview = ({ item }: { item: Review }) => (
    <Card style={styles.reviewCard} elevation={1}>
      <Card.Content style={styles.reviewContent}>
        {/* Header do review */}
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <Avatar.Image
              size={40}
              source={{ uri: item.user.avatar || undefined }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.reviewDate}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          
          <View style={styles.reviewMeta}>
            {renderStars(item.rating)}
            {item.is_verified_purchase && (
              <Chip
                mode="outlined"
                style={styles.verifiedChip}
                textStyle={styles.verifiedText}
                compact
              >
                ✓ Compra verificada
              </Chip>
            )}
          </View>
        </View>

        {/* Comentário */}
        {item.comment && (
          <Text style={styles.reviewComment} numberOfLines={showAll ? undefined : 3}>
            {item.comment}
          </Text>
        )}

        {/* Imagens do review */}
        {item.images && renderReviewImages(item.images)}

        {/* Footer com ações */}
        <View style={styles.reviewFooter}>
          <View style={styles.helpfulContainer}>
            <IconButton
              icon="thumb-up-outline"
              size={16}
              onPress={() => {}}
              style={styles.helpfulButton}
            />
            <Text style={styles.helpfulText}>
              {item.helpful_count} acharam útil
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * Renderizar estatísticas de reviews
   */
  const renderStats = () => {
    if (reviews.length === 0) return null;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
      reviews.filter(review => review.rating === rating).length
    );

    return (
      <View style={styles.statsContainer}>
        <View style={styles.averageRating}>
          <Text style={styles.averageRatingValue}>
            {averageRating.toFixed(1)}
          </Text>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.totalReviews}>
            {reviews.length} avaliações
          </Text>
        </View>

        <View style={styles.ratingBreakdown}>
          {ratingCounts.map((count, index) => {
            const rating = 5 - index;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <View key={rating} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{rating}★</Text>
                <View style={styles.ratingBar}>
                  <View
                    style={[
                      styles.ratingBarFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ratingCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Ainda não há avaliações para esta caixa
        </Text>
        <Text style={styles.emptySubtext}>
          Seja o primeiro a avaliar!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAll && renderStats()}
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        scrollEnabled={showAll}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    gap: getSpacing('md'),
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: getSpacing('lg'),
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('md'),
  },
  averageRating: {
    flex: 1,
    alignItems: 'center',
  },
  averageRatingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  totalReviews: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  ratingBreakdown: {
    flex: 2,
    marginLeft: getSpacing('lg'),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  ratingLabel: {
    width: 30,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.outline,
    borderRadius: 4,
    marginHorizontal: getSpacing('sm'),
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingCount: {
    width: 20,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
  },
  reviewCard: {
    borderRadius: getBorderRadius('md'),
  },
  reviewContent: {
    padding: getSpacing('md'),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('md'),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: getSpacing('sm'),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: getSpacing('xs'),
  },
  star: {
    fontSize: 14,
  },
  verifiedChip: {
    height: 20,
    borderColor: theme.colors.success,
  },
  verifiedText: {
    fontSize: 10,
    color: theme.colors.success,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurface,
    marginBottom: getSpacing('md'),
  },
  reviewImages: {
    flexDirection: 'row',
    marginBottom: getSpacing('md'),
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: getBorderRadius('sm'),
    marginRight: getSpacing('sm'),
  },
  moreImagesIndicator: {
    width: 60,
    height: 60,
    borderRadius: getBorderRadius('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: getSpacing('sm'),
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    margin: 0,
  },
  helpfulText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: getSpacing('xs'),
  },
  emptyContainer: {
    padding: getSpacing('lg'),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: getSpacing('sm'),
  },
});

export default ReviewsList;
