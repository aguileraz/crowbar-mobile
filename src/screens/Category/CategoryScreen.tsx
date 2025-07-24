import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  FAB,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchBoxesByCategory,
  fetchBoxes,
  selectBoxes,
  selectCategories,
  selectPagination,
  selectBoxLoading,
  selectBoxError,
  setActiveFilters,
  selectActiveFilters,
} from '../../store/slices/boxSlice';

// Services
import { boxService } from '../../services/boxService';

// Components
import BoxCard from '../../components/BoxCard';
import FilterModal from '../../components/FilterModal';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { MysteryBox, Category, SearchFilters } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Categoria
 * Exibe caixas de uma categoria específica com filtros e ordenação
 */

type CategoryScreenNavigationProp = NativeStackNavigationProp<any, 'Category'>;
type CategoryScreenRouteProp = RouteProp<{ Category: { categoryId: string } }, 'Category'>;

interface CategoryScreenProps {
  navigation: CategoryScreenNavigationProp;
  route: CategoryScreenRouteProp;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const boxes = useSelector(selectBoxes);
  const categories = useSelector(selectCategories);
  const pagination = useSelector(selectPagination);
  const loading = useSelector(selectBoxLoading);
  const error = useSelector(selectBoxError);
  const activeFilters = useSelector(selectActiveFilters);
  
  // Local state
  const [category, setCategory] = useState<Category | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popularity' | 'rating'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Load category data
  useFocusEffect(
    useCallback(() => {
      loadCategoryData();
    }, [categoryId])
  );

  // Load category data when filters change
  useEffect(() => {
    if (category) {
      loadBoxes();
    }
  }, [activeFilters, sortBy, sortOrder]);

  /**
   * Load category data
   */
  const loadCategoryData = async () => {
    try {
      // Find category in Redux state or fetch from API
      let categoryData = categories.find(cat => cat.id === categoryId);
      
      if (!categoryData) {
        categoryData = await boxService.getCategoryById(categoryId);
      }
      
      setCategory(categoryData);
      
      // Set category filter
      dispatch(setActiveFilters({
        ...activeFilters,
        category_id: categoryId,
        sort_by: sortBy,
        sort_order: sortOrder,
      }));
      
      // Load boxes
      await loadBoxes();
    } catch (err) {
      console.error('Error loading category data:', err);
    }
  };

  /**
   * Load boxes for category
   */
  const loadBoxes = async (page: number = 1) => {
    try {
      const filters: SearchFilters = {
        ...activeFilters,
        category_id: categoryId,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        per_page: 20,
      };

      await dispatch(fetchBoxes(filters)).unwrap();
    } catch (err) {
      console.error('Error loading boxes:', err);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBoxes(1);
    setRefreshing(false);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore && !loading.boxes) {
      setLoadingMore(true);
      await loadBoxes(pagination.currentPage + 1);
      setLoadingMore(false);
    }
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      // Toggle order if same sort field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (filters: SearchFilters) => {
    dispatch(setActiveFilters({
      ...filters,
      category_id: categoryId,
      sort_by: sortBy,
      sort_order: sortOrder,
    }));
    setShowFilters(false);
  };

  /**
   * Navigate to box details
   */
  const navigateToBoxDetails = (box: MysteryBox) => {
    navigation.navigate('BoxDetails', { boxId: box.id });
  };

  /**
   * Get active filters count
   */
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (activeFilters.min_price || activeFilters.max_price) count++;
    if (activeFilters.rarity && activeFilters.rarity.length > 0) count++;
    if (activeFilters.is_featured) count++;
    if (activeFilters.is_new) count++;
    if (activeFilters.tags && activeFilters.tags.length > 0) count++;
    return count;
  };

  /**
   * Render category header
   */
  const renderCategoryHeader = () => {
    if (!category) return null;

    return (
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryIcon}>
              <Text style={[styles.categoryIconText, { color: category.color }]}>
                {category.icon}
              </Text>
            </View>
            <View style={styles.categoryInfo}>
              <Title style={styles.categoryTitle}>{category.name}</Title>
              {category.description && (
                <Paragraph style={styles.categoryDescription}>
                  {category.description}
                </Paragraph>
              )}
              <Text style={styles.categoryStats}>
                {category.boxes_count} caixas disponíveis
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  /**
   * Render controls
   */
  const renderControls = () => (
    <View style={styles.controls}>
      {/* Layout toggle */}
      <SegmentedButtons
        value={layoutMode}
        onValueChange={(value) => setLayoutMode(value as 'grid' | 'list')}
        buttons={[
          { value: 'grid', icon: 'view-grid' },
          { value: 'list', icon: 'view-list' },
        ]}
        style={styles.layoutToggle}
      />

      {/* Sort buttons */}
      <View style={styles.sortButtons}>
        <Button
          mode={sortBy === 'popularity' ? 'contained' : 'outlined'}
          onPress={() => handleSortChange('popularity')}
          compact
          icon={sortBy === 'popularity' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
        >
          Popular
        </Button>
        <Button
          mode={sortBy === 'price' ? 'contained' : 'outlined'}
          onPress={() => handleSortChange('price')}
          compact
          icon={sortBy === 'price' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
        >
          Preço
        </Button>
        <Button
          mode={sortBy === 'rating' ? 'contained' : 'outlined'}
          onPress={() => handleSortChange('rating')}
          compact
          icon={sortBy === 'rating' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
        >
          Avaliação
        </Button>
      </View>
    </View>
  );

  /**
   * Render box item
   */
  const renderBoxItem = ({ item }: { item: MysteryBox }) => (
    <BoxCard
      box={item}
      onPress={() => navigateToBoxDetails(item)}
      variant={layoutMode === 'grid' ? 'compact' : 'list'}
      style={layoutMode === 'grid' ? styles.gridItem : styles.listItem}
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

  if (loading.boxes && boxes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando categoria...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadCategoryData}
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
          {category?.name || 'Categoria'}
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={boxes}
        renderItem={renderBoxItem}
        keyExtractor={(item) => item.id}
        numColumns={layoutMode === 'grid' ? 2 : 1}
        key={layoutMode} // Force re-render when layout changes
        ListHeaderComponent={
          <>
            {renderCategoryHeader()}
            {renderControls()}
          </>
        }
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter FAB */}
      <FAB
        icon="filter-variant"
        style={styles.fab}
        onPress={() => setShowFilters(true)}
        label={getActiveFiltersCount() > 0 ? `Filtros (${getActiveFiltersCount()})` : 'Filtros'}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={activeFilters}
        onApply={handleFiltersChange}
        onDismiss={() => setShowFilters(false)}
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
  headerSpacer: {
    width: 40,
  },
  headerCard: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('md'),
  },
  categoryIconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: getSpacing('xs'),
  },
  categoryDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  categoryStats: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  controls: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  layoutToggle: {
    marginBottom: getSpacing('md'),
  },
  sortButtons: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  list: {
    padding: getSpacing('md'),
  },
  gridItem: {
    flex: 1,
    margin: getSpacing('xs'),
  },
  listItem: {
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
  fab: {
    position: 'absolute',
    margin: getSpacing('lg'),
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default CategoryScreen;
