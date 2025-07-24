import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  Menu,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchFavorites,
  removeFromFavorites,
  clearError,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesUpdating,
  selectFavoritesError,
  selectFavoritesPagination,
} from '../../store/slices/favoritesSlice';

// Components
import BoxCard from '../../components/BoxCard';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { MysteryBox } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Favoritos
 * Exibe lista de caixas favoritas com filtros e ordenação
 */

type FavoritesScreenNavigationProp = NativeStackNavigationProp<any, 'Favorites'>;

interface FavoritesScreenProps {
  navigation: FavoritesScreenNavigationProp;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const favorites = useSelector(selectFavorites);
  const isLoading = useSelector(selectFavoritesLoading);
  const isUpdating = useSelector(selectFavoritesUpdating);
  const error = useSelector(selectFavoritesError);
  const pagination = useSelector(selectFavoritesPagination);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date_added' | 'name' | 'price' | 'rating'>('date_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filteredFavorites, setFilteredFavorites] = useState<MysteryBox[]>([]);

  // Load favorites data
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  // Apply sorting when favorites or sort options change
  useEffect(() => {
    applySorting();
  }, [favorites, sortBy, sortOrder]);

  /**
   * Load favorites
   */
  const loadFavorites = async () => {
    try {
      await dispatch(fetchFavorites(1)).unwrap();
    } catch (err) {
      logger.error('Error loading favorites:', err);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = async () => {
    if (pagination.hasNextPage && !loadingMore && !isLoading) {
      setLoadingMore(true);
      try {
        await dispatch(fetchFavorites(pagination.currentPage + 1)).unwrap();
      } catch (err) {
        logger.error('Error loading more favorites:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  /**
   * Apply sorting to favorites
   */
  const applySorting = () => {
    const sorted = [...favorites].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = (a.stats?.average_rating || 0) - (b.stats?.average_rating || 0);
          break;
        case 'date_added':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredFavorites(sorted);
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
    setShowSortMenu(false);
  };

  /**
   * Remove from favorites
   */
  const handleRemoveFavorite = async (boxId: string) => {
    try {
      await dispatch(removeFromFavorites(boxId)).unwrap();
    } catch (err) {
      logger.error('Error removing favorite:', err);
    }
  };

  /**
   * Navigate to box details
   */
  const navigateToBoxDetails = (box: MysteryBox) => {
    navigation.navigate('BoxDetails', { boxId: box.id });
  };

  /**
   * Navigate to shop
   */
  const navigateToShop = () => {
    navigation.navigate('Shop');
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
        onPress={() => handleSortChange('date_added')}
        title="Data de adição"
        leadingIcon={sortBy === 'date_added' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
      />
      <Menu.Item
        onPress={() => handleSortChange('name')}
        title="Nome"
        leadingIcon={sortBy === 'name' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
      />
      <Menu.Item
        onPress={() => handleSortChange('price')}
        title="Preço"
        leadingIcon={sortBy === 'price' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
      />
      <Menu.Item
        onPress={() => handleSortChange('rating')}
        title="Avaliação"
        leadingIcon={sortBy === 'rating' ? (sortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : undefined}
      />
    </Menu>
  );

  /**
   * Render box item
   */
  const renderBoxItem = ({ item }: { item: MysteryBox }) => (
    <BoxCard
      box={item}
      onPress={() => navigateToBoxDetails(item)}
      onFavoritePress={() => handleRemoveFavorite(item.id)}
      variant={layoutMode === 'grid' ? 'compact' : 'list'}
      style={layoutMode === 'grid' ? styles.gridItem : styles.listItem}
      showFavoriteButton
      isFavorite={true}
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

  if (isLoading && favorites.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando favoritos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadFavorites}
        style={styles.container}
      />
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💝</Text>
        <Title style={styles.emptyTitle}>Nenhum favorito ainda</Title>
        <Text style={styles.emptyText}>
          Adicione caixas misteriosas aos seus favoritos para vê-las aqui
        </Text>
        <Button
          mode="contained"
          onPress={navigateToShop}
          style={styles.shopButton}
          icon="heart"
        >
          Explorar caixas
        </Button>
      </View>
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
          Favoritos ({favorites.length})
        </Title>
        {renderSortMenu()}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <SegmentedButtons
          value={layoutMode}
          onValueChange={(value) => setLayoutMode(value as 'grid' | 'list')}
          buttons={[
            { value: 'grid', icon: 'view-grid', label: 'Grade' },
            { value: 'list', icon: 'view-list', label: 'Lista' },
          ]}
          style={styles.layoutToggle}
        />
      </View>

      <FlatList
        data={filteredFavorites}
        renderItem={renderBoxItem}
        keyExtractor={(item) => item.id}
        numColumns={layoutMode === 'grid' ? 2 : 1}
        key={layoutMode} // Force re-render when layout changes
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
    backgroundColor: theme.colors.background,
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
    marginBottom: getSpacing('xl'),
    lineHeight: 24,
  },
  shopButton: {
    borderRadius: getBorderRadius('md'),
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
  controls: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  layoutToggle: {
    marginBottom: getSpacing('sm'),
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
});

export default FavoritesScreen;
