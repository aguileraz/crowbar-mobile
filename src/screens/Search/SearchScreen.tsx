import React, { useState, useCallback } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';
import { Searchbar, ActivityIndicator, IconButton, Divider, Card, Text, Button, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  searchBoxes,
  fetchSearchSuggestions,
  setSearchQuery,
  setActiveFilters,
  clearSearchResults,
  selectSearchResults,
  selectSearchQuery,
  selectSearchSuggestions,
  selectActiveFilters,
  selectBoxLoading,
  selectBoxError,
} from '../../store/slices/boxSlice';

// Components
import BoxCard from '../../components/BoxCard';
import FilterModal from '../../components/FilterModal';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { _MysteryBox, SearchFilters } from '../../types/api';

// Theme
import { _theme, getSpacing, getBorderRadius } from '../../theme';

// Utils
import { debounce } from '../../utils/debounce';

/**
 * Tela de Busca e Filtros
 * Busca em tempo real com filtros avançados e sugestões
 */

type SearchScreenNavigationProp = NativeStackNavigationProp<any, 'Search'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const searchResults = useSelector(selectSearchResults);
  const searchQuery = useSelector(selectSearchQuery);
  const suggestions = useSelector(selectSearchSuggestions);
  const activeFilters = useSelector(selectActiveFilters);
  const loading = useSelector(selectBoxLoading);
  const error = useSelector(selectBoxError);
  
  // Local state
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        performSearch(query);
        dispatch(fetchSearchSuggestions(query));
      }
    }, 500),
    [activeFilters]
  );

  // Cleanup on unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(clearSearchResults());
      };
    }, [])
  );

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Handle query changes
  useEffect(() => {
    if (localQuery !== searchQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Handle local query changes
  useEffect(() => {
    dispatch(setSearchQuery(localQuery));
    
    if (localQuery.trim().length >= 2) {
      setShowSuggestions(true);
      debouncedSearch(localQuery);
    } else {
      setShowSuggestions(false);
      dispatch(clearSearchResults());
    }
  }, [localQuery, debouncedSearch]);

  /**
   * Load search history from storage
   */
  const loadSearchHistory = async () => {
    try {
      // TODO: Load from AsyncStorage
      setSearchHistory(['caixa gamer', 'eletrônicos', 'roupas']);
    } catch (err) {
      logger.error('Error loading search history:', _err);
    }
  };

  /**
   * Save search to history
   */
  const saveToHistory = async (query: string) => {
    try {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      // TODO: Save to AsyncStorage
    } catch (err) {
      logger.error('Error saving search history:', _err);
    }
  };

  /**
   * Perform search
   */
  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      await dispatch(searchBoxes({ query, filters: activeFilters })).unwrap();
      saveToHistory(query);
    } catch (err) {
      logger.error('Search error:', _err);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearchSubmit = () => {
    if (localQuery.trim().length >= 2) {
      setShowSuggestions(false);
      Keyboard.dismiss();
      performSearch(localQuery);
    }
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: string) => {
    setLocalQuery(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
    performSearch(suggestion);
  };

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (filters: SearchFilters) => {
    dispatch(setActiveFilters(filters));
    setShowFilters(false);
    
    if (localQuery.trim().length >= 2) {
      performSearch(localQuery);
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    dispatch(setActiveFilters({}));
    if (localQuery.trim().length >= 2) {
      performSearch(localQuery);
    }
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
    if (activeFilters.category_id) count++;
    if (activeFilters.min_price || activeFilters.max_price) count++;
    if (activeFilters.rarity && activeFilters.rarity.length > 0) count++;
    if (activeFilters.is_featured) count++;
    if (activeFilters.is_new) count++;
    if (activeFilters.tags && activeFilters.tags.length > 0) count++;
    return count;
  };

  /**
   * Render search suggestions
   */
  const renderSuggestions = () => {
    if (!showSuggestions || (suggestions.length === 0 && searchHistory.length === 0)) {
      return null;
    }

    return (
      <Card style={styles.suggestionsCard}>
        <Card.Content>
          {/* Search suggestions */}
          {suggestions.length > 0 && (
            <>
              <Text style={styles.suggestionHeader}>Sugestões</Text>
              {suggestions.map((suggestion, _index) => (
                <Button
                  key={_index}
                  mode="text"
                  onPress={() => handleSuggestionSelect(suggestion)}
                  style={styles.suggestionItem}
                  contentStyle={styles.suggestionContent}
                  icon="magnify"
                >
                  {suggestion}
                </Button>
              ))}
              <Divider style={styles.suggestionDivider} />
            </>
          )}

          {/* Search history */}
          {searchHistory.length > 0 && (
            <>
              <Text style={styles.suggestionHeader}>Buscas recentes</Text>
              {searchHistory.map((item, _index) => (
                <Button
                  key={index}
                  mode="text"
                  onPress={() => handleSuggestionSelect(item)}
                  style={styles.suggestionItem}
                  contentStyle={styles.suggestionContent}
                  icon="history"
                >
                  {item}
                </Button>
              ))}
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  /**
   * Render active filters
   */
  const renderActiveFilters = () => {
    const filtersCount = getActiveFiltersCount();
    if (filtersCount === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <View style={styles.activeFiltersHeader}>
          <Text style={styles.activeFiltersTitle}>
            Filtros ativos ({filtersCount})
          </Text>
          <Button mode="text" onPress={clearFilters} compact>
            Limpar
          </Button>
        </View>
        
        <View style={styles.activeFiltersChips}>
          {activeFilters.category_id && (
            <Chip mode="outlined" style={styles.filterChip}>
              Categoria
            </Chip>
          )}
          {(activeFilters.min_price || activeFilters.max_price) && (
            <Chip mode="outlined" style={styles.filterChip}>
              Preço
            </Chip>
          )}
          {activeFilters.rarity && activeFilters.rarity.length > 0 && (
            <Chip mode="outlined" style={styles.filterChip}>
              Raridade ({activeFilters.rarity.length})
            </Chip>
          )}
          {activeFilters.is_featured && (
            <Chip mode="outlined" style={styles.filterChip}>
              Em destaque
            </Chip>
          )}
          {activeFilters.is_new && (
            <Chip mode="outlined" style={styles.filterChip}>
              Novos
            </Chip>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render search results
   */
  const renderSearchResults = () => {
    if (isSearching || loading.search) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <ErrorMessage
          message={error}
          onRetry={() => performSearch(localQuery)}
          variant="minimal"
        />
      );
    }

    if (!searchResults) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Digite pelo menos 2 caracteres para buscar
          </Text>
        </View>
      );
    }

    if (searchResults.boxes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhuma caixa encontrada para "{localQuery}"
          </Text>
          <Text style={styles.emptySubtext}>
            Tente ajustar os filtros ou usar outros termos
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults.boxes}
        renderItem={({ item }) => (
          <BoxCard
            box={item}
            onPress={() => navigateToBoxDetails(item)}
            variant="list"
            style={styles.resultCard}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar caixas misteriosas..."
            value={localQuery}
            onChangeText={setLocalQuery}
            onSubmitEditing={handleSearchSubmit}
            style={styles.searchBar}
            autoFocus
          />
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(true)}
            style={styles.filterButton}
          />
        </View>
      </View>

      {/* Active filters */}
      {renderActiveFilters()}

      {/* Content */}
      <View style={styles.content}>
        {showSuggestions ? renderSuggestions() : renderSearchResults()}
      </View>

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
  header: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  filterButton: {
    backgroundColor: theme.colors.primaryContainer,
  },
  activeFiltersContainer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surfaceVariant,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('sm'),
  },
  filterChip: {
    marginRight: getSpacing('sm'),
    marginBottom: getSpacing('sm'),
  },
  content: {
    flex: 1,
  },
  suggestionsCard: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  suggestionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('sm'),
  },
  suggestionItem: {
    justifyContent: 'flex-start',
    marginBottom: getSpacing('xs'),
  },
  suggestionContent: {
    justifyContent: 'flex-start',
  },
  suggestionDivider: {
    marginVertical: getSpacing('md'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
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
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  resultsList: {
    padding: getSpacing('md'),
  },
  resultCard: {
    marginBottom: getSpacing('md'),
  },
});

export default SearchScreen;
