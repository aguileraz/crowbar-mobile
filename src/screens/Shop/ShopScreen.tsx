import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  FAB,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchFeaturedBoxes,
  fetchPopularBoxes,
  fetchNewBoxes,
  fetchCategories,
  selectFeaturedBoxes,
  selectPopularBoxes,
  selectNewBoxes,
  selectCategories,
  selectBoxLoading,
  selectBoxError,
  setSearchQuery,
  selectSearchQuery,
} from '../../store/slices/boxSlice';

// Components
import BoxCard from '../../components/BoxCard';
import CategoryChip from '../../components/CategoryChip';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { MysteryBox, Category } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela Principal da Loja
 * Baseada no protótipo 04_screen-CROWBAR_Loja-V2.png
 */

type ShopScreenNavigationProp = NativeStackNavigationProp<any, 'Shop'>;

interface ShopScreenProps {
  navigation: ShopScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - getSpacing('lg') * 3) / 2;

const ShopScreen: React.FC<ShopScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const featuredBoxes = useSelector(selectFeaturedBoxes);
  const popularBoxes = useSelector(selectPopularBoxes);
  const newBoxes = useSelector(selectNewBoxes);
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectBoxLoading);
  const error = useSelector(selectBoxError);
  const searchQuery = useSelector(selectSearchQuery);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Carregar dados iniciais
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  /**
   * Carregar dados iniciais
   */
  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchFeaturedBoxes(6)).unwrap(),
        dispatch(fetchPopularBoxes(10)).unwrap(),
        dispatch(fetchNewBoxes(8)).unwrap(),
        dispatch(fetchCategories()).unwrap(),
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  /**
   * Refresh da tela
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  /**
   * Navegar para detalhes da caixa
   */
  const navigateToBoxDetails = (box: MysteryBox) => {
    navigation.navigate('BoxDetails', { boxId: box.id });
  };

  /**
   * Navegar para busca
   */
  const navigateToSearch = () => {
    navigation.navigate('Search');
  };

  /**
   * Navegar para categoria
   */
  const navigateToCategory = (category: Category) => {
    navigation.navigate('Category', { categoryId: category.id });
  };

  /**
   * Navegar para lista completa
   */
  const navigateToFullList = (type: 'featured' | 'popular' | 'new') => {
    navigation.navigate('BoxList', { type });
  };

  /**
   * Renderizar caixa em destaque
   */
  const renderFeaturedBox = ({ item }: { item: MysteryBox }) => (
    <BoxCard
      box={item}
      onPress={() => navigateToBoxDetails(item)}
      style={styles.featuredCard}
      variant="featured"
    />
  );

  /**
   * Renderizar caixa popular
   */
  const renderPopularBox = ({ item }: { item: MysteryBox }) => (
    <BoxCard
      box={item}
      onPress={() => navigateToBoxDetails(item)}
      style={styles.popularCard}
      variant="compact"
    />
  );

  /**
   * Renderizar categoria
   */
  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryChip
      category={item}
      selected={selectedCategoryId === item.id}
      onPress={() => {
        setSelectedCategoryId(item.id === selectedCategoryId ? null : item.id);
        navigateToCategory(item);
      }}
      style={styles.categoryChip}
    />
  );

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadInitialData}
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header com busca */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Crowbar Store</Title>
          <Paragraph style={styles.headerSubtitle}>
            Descubra caixas misteriosas incríveis
          </Paragraph>
          
          <Searchbar
            placeholder="Buscar caixas misteriosas..."
            value={searchQuery}
            onChangeText={(query) => dispatch(setSearchQuery(query))}
            onSubmitEditing={navigateToSearch}
            onIconPress={navigateToSearch}
            style={styles.searchBar}
          />
        </View>

        {/* Categorias */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Categorias</Title>
          </View>
          
          {loading.categories ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          )}
        </View>

        {/* Caixas em Destaque */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Em Destaque</Title>
            <Button
              mode="text"
              onPress={() => navigateToFullList('featured')}
              compact
            >
              Ver todas
            </Button>
          </View>
          
          {loading.featuredBoxes ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <FlatList
              data={featuredBoxes}
              renderItem={renderFeaturedBox}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          )}
        </View>

        {/* Caixas Populares */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Mais Populares</Title>
            <Button
              mode="text"
              onPress={() => navigateToFullList('popular')}
              compact
            >
              Ver todas
            </Button>
          </View>
          
          {loading.popularBoxes ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <FlatList
              data={popularBoxes.slice(0, 4)}
              renderItem={renderPopularBox}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.popularGrid}
            />
          )}
        </View>

        {/* Lançamentos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Lançamentos</Title>
            <Button
              mode="text"
              onPress={() => navigateToFullList('new')}
              compact
            >
              Ver todas
            </Button>
          </View>
          
          {loading.newBoxes ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <FlatList
              data={newBoxes.slice(0, 6)}
              renderItem={renderPopularBox}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.newGrid}
            />
          )}
        </View>

        {/* Espaçamento para FAB */}
        <View style={styles.fabSpacer} />
      </ScrollView>

      {/* FAB para filtros */}
      <FAB
        icon="filter-variant"
        style={styles.fab}
        onPress={() => navigation.navigate('Filters')}
        label="Filtros"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: getSpacing('lg'),
    paddingBottom: getSpacing('md'),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing('xs'),
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('lg'),
  },
  searchBar: {
    elevation: 2,
    borderRadius: getBorderRadius('lg'),
  },
  section: {
    marginBottom: getSpacing('xl'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loader: {
    padding: getSpacing('lg'),
  },
  categoriesList: {
    paddingHorizontal: getSpacing('lg'),
  },
  categoryChip: {
    marginRight: getSpacing('sm'),
  },
  featuredList: {
    paddingHorizontal: getSpacing('lg'),
  },
  featuredCard: {
    width: CARD_WIDTH * 1.5,
    marginRight: getSpacing('md'),
  },
  popularGrid: {
    paddingHorizontal: getSpacing('lg'),
  },
  popularCard: {
    width: CARD_WIDTH,
    marginBottom: getSpacing('md'),
    marginRight: getSpacing('md'),
  },
  newGrid: {
    paddingHorizontal: getSpacing('lg'),
  },
  fab: {
    position: 'absolute',
    margin: getSpacing('lg'),
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  fabSpacer: {
    height: 80,
  },
});

export default ShopScreen;
