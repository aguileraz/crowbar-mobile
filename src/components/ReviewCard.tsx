import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Image,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Avatar,
  IconButton,
  Button,
  Menu,
  Chip,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { markReviewHelpful, reportReview } from '../store/slices/reviewsSlice';
import { Review } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Card de Review
 * Exibe review com rating, comentário, fotos e ações
 */

interface ReviewCardProps {
  review: Review;
  style?: ViewStyle;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  style,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showMenu, setShowMenu] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} semana${weeks > 1 ? 's' : ''} atrás`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mês${months > 1 ? 'es' : ''} atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  /**
   * Render star rating
   */
  const renderStarRating = (rating: number) => {
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
          ⭐
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  /**
   * Handle helpful vote
   */
  const handleHelpfulVote = async (helpful: boolean) => {
    try {
      await dispatch(markReviewHelpful({
        reviewId: review.id,
        helpful,
      })).unwrap();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  /**
   * Handle report
   */
  const handleReport = async () => {
    try {
      await dispatch(reportReview({
        reviewId: review.id,
        reason: 'inappropriate_content',
      })).unwrap();
      setShowMenu(false);
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  /**
   * Get user avatar
   */
  const getUserAvatar = () => {
    if (review.user?.avatar) {
      return { uri: review.user.avatar };
    }
    return undefined;
  };

  /**
   * Get user initials
   */
  const getUserInitials = (): string => {
    if (review.user?.name) {
      return review.user.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return 'U';
  };

  /**
   * Truncate comment
   */
  const getTruncatedComment = (comment: string, maxLength: number = 200): string => {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  /**
   * Check if comment should be truncated
   */
  const shouldTruncateComment = (): boolean => {
    return review.comment && review.comment.length > 200;
  };

  return (
    <Card style={[styles.card, style]} elevation={1}>
      <Card.Content style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Image
              size={40}
              source={getUserAvatar()}
              style={styles.avatar}
            />
            {!getUserAvatar() && (
              <Avatar.Text
                size={40}
                label={getUserInitials()}
                style={styles.avatar}
              />
            )}
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {review.user?.name || 'Usuário Anônimo'}
              </Text>
              <Text style={styles.reviewDate}>
                {formatDate(review.created_at)}
              </Text>
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
              />
            }
          >
            <Menu.Item
              onPress={handleReport}
              title="Reportar"
              leadingIcon="flag"
            />
          </Menu>
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          {renderStarRating(review.rating)}
          <Text style={styles.ratingText}>
            {review.rating}/5
          </Text>
        </View>

        {/* Comment */}
        {review.comment && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>
              {showFullComment || !shouldTruncateComment()
                ? review.comment
                : getTruncatedComment(review.comment)
              }
            </Text>
            
            {shouldTruncateComment() && (
              <Button
                mode="text"
                onPress={() => setShowFullComment(!showFullComment)}
                style={styles.expandButton}
                compact
              >
                {showFullComment ? 'Ver menos' : 'Ver mais'}
              </Button>
            )}
          </View>
        )}

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <View style={styles.photosContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
            >
              {review.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Verified Purchase */}
        {review.verified_purchase && (
          <Chip
            mode="flat"
            style={styles.verifiedChip}
            textStyle={styles.verifiedChipText}
            icon="check-circle"
            compact
          >
            Compra verificada
          </Chip>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.helpfulActions}>
            <Text style={styles.helpfulLabel}>Foi útil?</Text>
            <IconButton
              icon="thumb-up"
              size={16}
              onPress={() => handleHelpfulVote(true)}
              style={[
                styles.helpfulButton,
                review.user_helpful_vote === true && styles.helpfulButtonActive,
              ]}
            />
            <Text style={styles.helpfulCount}>
              {review.helpful_count || 0}
            </Text>
            <IconButton
              icon="thumb-down"
              size={16}
              onPress={() => handleHelpfulVote(false)}
              style={[
                styles.helpfulButton,
                review.user_helpful_vote === false && styles.helpfulButtonActive,
              ]}
            />
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
    padding: getSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing('sm'),
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
    marginBottom: getSpacing('xs'),
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: getSpacing('sm'),
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  commentContainer: {
    marginBottom: getSpacing('md'),
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.onSurface,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: getSpacing('xs'),
  },
  photosContainer: {
    marginBottom: getSpacing('md'),
  },
  photosScroll: {
    marginHorizontal: -getSpacing('md'),
    paddingHorizontal: getSpacing('md'),
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: getBorderRadius('sm'),
    marginRight: getSpacing('sm'),
  },
  verifiedChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
    marginBottom: getSpacing('md'),
  },
  verifiedChipText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: getSpacing('sm'),
  },
  helpfulActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginRight: getSpacing('sm'),
  },
  helpfulButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  helpfulButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  helpfulCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginHorizontal: getSpacing('xs'),
  },
});

export default ReviewCard;
