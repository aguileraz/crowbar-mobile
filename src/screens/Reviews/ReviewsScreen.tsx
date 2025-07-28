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
  Chip,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchReviews,
  fetchReviewStatistics,
  fetchUserReview,
  setFilters,
  clearFilters,
  selectReviews,
  selectUserReview,
  selectReviewsLoading,
  selectReviewsError,
  selectReviewsFilters,
  selectReviewsPagination,
  selectReviewStatistics,
} from '../../store/slices/reviewsSlice';

// Components
import ReviewCard from '../../components/ReviewCard';
import ReviewStatistics from '../../components/ReviewStatistics';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { Review, MysteryBox } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Reviews e Avaliações
 * Lista reviews com filtros e estatísticas
 */

type ReviewsScreenNavigationProp = NativeStackNavigationProp<any, 'Reviews'>;
type ReviewsScreenRouteProp = RouteProp<{
  Reviews: { box: MysteryBox };
}, 'Reviews'>;

interface ReviewsScreenProps {
  navigation: ReviewsScreenNavigationProp;
  route: ReviewsScreenRouteProp;
}

const ReviewsScreen: React.FC<ReviewsScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const reviews = useSelector(selectReviews);
  const userReview = useSelector(selectUserReview);
  const isLoading = useSelector(selectReviewsLoading);
  const error = useSelector(selectReviewsError);
  const filters = useSelector(selectReviewsFilters);
  const pagination = useSelector(selectReviewsPagination);
  const statistics = useSelector(selectReviewStatistics);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPhotosOnly, setShowPhotosOnly] = useState(false);

  const { box } = route.params;

  // Load reviews
  useFocusEffect(
    useCallback(() => {
      loadReviews();
      loadStatistics();
      loadUserReview();
    }, [])
  );

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [ratingFilter, showPhotosOnly, filters.sortBy]);

  /**
   * Load reviews
   */
  const loadReviews = async () => {
    try {
      await dispatch(fetchReviews({ 
        boxId: box.id, 
        page: 1, 
        filters 
      })).unwrap();
    } catch (err) {
      logger.error('Error loading reviews:', err);
    }
  };

  /**
   * Load statistics
   */
  const loadStatistics = async () => {
    try {
      await dispatch(fetchReviewStatistics(box.id)).unwrap();
    } catch (err) {
      logger.error('Error loading statistics:', err);
    }
  };

  /**
   * Load user review
   */
  const loadUserReview = async () => {
    try {
      await dispatch(fetchUserReview(box.id)).unwrap();
    } catch (err) {
      logger.error('Error loading user review:', err);
    }
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    const newFilters: any = {
      sortBy: filters.sortBy || 'newest',
    };
    
    if (ratingFilter) {
      newFilters.rating = ratingFilter;
    }
    
    if (showPhotosOnly) {
      newFilters.hasPhotos = true;
    }
    
    dispatch(setFilters(newFilters));
    dispatch(fetchReviews({ 
      boxId: box.id, 
      page: 1, 
      filters: newFilters 
    }));
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadReviews(),
      loadStatistics(),
      loadUserReview(),
    ]);
    setRefreshing(false);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore && !isLoading) {
      setLoadingMore(true);
      try {
        await dispatch(fetchReviews({ 
          boxId: box.id,
          page: pagination.currentPage + 1, 
          filters 
        })).unwrap();
      } catch (err) {
        logger.error('Error loading more reviews:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setRatingFilter(undefined);
    setShowPhotosOnly(false);
    dispatch(clearFilters());
    dispatch(fetchReviews({ boxId: box.id, page: 1 }));
  };

  /**
   * Navigate to add review
   */
  const navigateToAddReview = () => {
    navigation.navigate('AddEditReview', { 
      mode: userReview ? 'edit' : 'add',
      box,
      review: userReview,
    });
  };

  /**
   * Get sort options
   */
  const getSortOptions = () => [
    { value: 'newest', label: 'Mais recentes' },
    { value: 'oldest', label: 'Mais antigos' },
    { value: 'rating_high', label: 'Maior avaliação' },
    { value: 'rating_low', label: 'Menor avaliação' },
    { value: 'helpful', label: 'Mais úteis' },
  ];

  /**
   * Get rating filter options
   */
  const getRatingFilterOptions = () => [
    { value: 'all', label: 'Todas' },
    { value: '5', label: '5 ⭐' },
    { value: '4', label: '4 ⭐' },
    { value: '3', label: '3 ⭐' },
    { value: '2', label: '2 ⭐' },
    { value: '1', label: '1 ⭐' },
  ];

  /**
   * Get active filters count
   */
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (ratingFilter) count++;
    if (showPhotosOnly) count++;
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
      {getSortOptions().map((option) => (
        <Menu.Item
          key={option.value}
          onPress={() => {
            dispatch(setFilters({ sortBy: option.value }));
            setShowSortMenu(false);
          }}
          title={option.label}
          leadingIcon={filters.sortBy === option.value ? 'check' : undefined}
        />
      ))}
    </Menu>
  );

  /**
   * Render review item
   */
  const renderReviewItem = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      style={styles.reviewCard}
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
      <Text style={styles.emptyIcon}>⭐</Text>
      <Title style={styles.emptyTitle}>Nenhum review encontrado</Title>
      <Text style={styles.emptyText}>
        {getActiveFiltersCount() > 0 
          ? 'Tente ajustar os filtros para encontrar reviews'
          : 'Seja o primeiro a avaliar esta caixa!'
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

  if (isLoading && reviews.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando reviews...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadReviews}
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
          Reviews ({statistics?.totalReviews || 0})
        </Title>
        {renderSortMenu()}
      </View>

      {/* Statistics */}
      {statistics && (
        <ReviewStatistics
          statistics={statistics}
          style={styles.statisticsCard}
        />
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <SegmentedButtons
          value={ratingFilter ? ratingFilter.toString() : 'all'}
          onValueChange={(value) => setRatingFilter(value === 'all' ? undefined : parseInt(value, 10))}
          buttons={getRatingFilterOptions().slice(0, 4).map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.ratingFilter}
        />
        
        <View style={styles.filterChips}>
          <Chip
            mode={showPhotosOnly ? 'flat' : 'outlined'}
            selected={showPhotosOnly}
            onPress={() => setShowPhotosOnly(!showPhotosOnly)}
            style={styles.filterChip}
            icon="camera"
          >
            Com fotos
          </Chip>
          
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
      </View>

      {reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
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

      {/* Add Review FAB */}
      <FAB
        icon={userReview ? 'pencil' : 'plus'}
        style={styles.fab}
        onPress={navigateToAddReview}
        label={userReview ? 'Editar' : 'Avaliar'}
      />
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
  statisticsCard: {
    margin: getSpacing('md'),
    marginBottom: 0,
  },
  filtersContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  ratingFilter: {
    marginBottom: getSpacing('sm'),
  },
  filterChips: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: getBorderRadius('sm'),
  },
  activeFiltersChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  list: {
    padding: getSpacing('md'),
  },
  reviewCard: {
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
  fab: {
    position: 'absolute',
    margin: getSpacing('lg'),
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default ReviewsScreen;
