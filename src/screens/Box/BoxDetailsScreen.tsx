import React, { useState, useCallback } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  IconButton,
  ActivityIndicator,

  ProgressBar,
  Badge,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchBoxById,
  selectSelectedBox,
  selectBoxLoading,
  selectBoxError,
  clearSelectedBox,
} from '../../store/slices/boxSlice';

// Services
import { boxService } from '../../services/boxService';
import { cartService } from '../../services/cartService';
import { userService } from '../../services/userService';

// Components
import ErrorMessage from '../../components/ErrorMessage';
import ImageGallery from '../../components/ImageGallery';
import PossibleItemsList from '../../components/PossibleItemsList';
import ReviewsList from '../../components/ReviewsList';

// Types
import { MysteryBox, Review } from '../../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Detalhes da Caixa Misteriosa
 * Exibe informações completas, galeria, itens possíveis, reviews e opções de compra
 */

type BoxDetailsScreenNavigationProp = NativeStackNavigationProp<any, 'BoxDetails'>;
type BoxDetailsScreenRouteProp = RouteProp<{ BoxDetails: { boxId: string } }, 'BoxDetails'>;

interface BoxDetailsScreenProps {
  navigation: BoxDetailsScreenNavigationProp;
  route: BoxDetailsScreenRouteProp;
}

const { _width } = Dimensions.get('window');

const BoxDetailsScreen: React.FC<BoxDetailsScreenProps> = ({ navigation, route }) => {
  const { boxId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const box = useSelector(selectSelectedBox);
  const loading = useSelector(selectBoxLoading);
  const error = useSelector(selectBoxError);
  
  // Local state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBoxes, setRelatedBoxes] = useState<MysteryBox[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Carregar dados da caixa
  useFocusEffect(
    useCallback(() => {
      loadBoxDetails();
      return () => {
        dispatch(clearSelectedBox());
      };
    }, [boxId])
  );

  /**
   * Carregar detalhes da caixa
   */
  const loadBoxDetails = async () => {
    try {
      await dispatch(fetchBoxById(boxId)).unwrap();
      await Promise.all([
        loadFavoriteStatus(),
        loadReviews(),
        loadRelatedBoxes(),
      ]);
    } catch (err) {
      logger.error('Error loading box details:', err);
    }
  };

  /**
   * Carregar status de favorito
   */
  const loadFavoriteStatus = async () => {
    try {
      const favorite = await userService.isFavorite(boxId);
      setIsFavorite(favorite);
    } catch (err) {
      logger.error('Error loading favorite status:', err);
    }
  };

  /**
   * Carregar reviews
   */
  const loadReviews = async () => {
    try {
      const _response = await boxService.getBoxReviews(boxId, 1, 5);
      setReviews(response.data);
    } catch (err) {
      logger.error('Error loading reviews:', err);
    }
  };

  /**
   * Carregar caixas relacionadas
   */
  const loadRelatedBoxes = async () => {
    try {
      const related = await boxService.getRelatedBoxes(boxId, 4);
      setRelatedBoxes(related);
    } catch (err) {
      logger.error('Error loading related boxes:', err);
    }
  };

  /**
   * Toggle favorito
   */
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await userService.removeFromFavorites(boxId);
        setIsFavorite(false);
      } else {
        await userService.addToFavorites(boxId);
        setIsFavorite(true);
      }
    } catch (err) {
      Alert.alert('Erro', 'Erro ao atualizar favoritos');
    }
  };

  /**
   * Adicionar ao carrinho
   */
  const addToCart = async () => {
    if (!box) return;

    setIsAddingToCart(true);
    try {
      await cartService.addToCart(box.id, quantity);
      Alert.alert(
        'Sucesso',
        `${box.name} foi adicionado ao carrinho!`,
        [
          { text: 'Continuar comprando', style: 'cancel' },
          { text: 'Ver carrinho', onPress: () => navigation.navigate('Cart') },
        ]
      );
    } catch (err) {
      Alert.alert('Erro', 'Erro ao adicionar ao carrinho');
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * Comprar agora
   */
  const buyNow = async () => {
    if (!box) return;

    try {
      await cartService.addToCart(box.id, quantity);
      navigation.navigate('Cart');
    } catch (err) {
      Alert.alert('Erro', 'Erro ao processar compra');
    }
  };

  /**
   * Compartilhar caixa
   */
  const shareBox = async () => {
    if (!box) return;

    try {
      await Share.share({
        message: `Confira esta caixa misteriosa incrível: ${box.name}`,
        url: `https://crowbar.app/boxes/${box.id}`,
        title: box.name,
      });
    } catch (err) {
      logger.error('Error sharing:', err);
    }
  };

  /**
   * Formatar preço
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Obter cor da raridade
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return theme.colors.primary;
    }
  };

  if (loading.selectedBox) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadBoxDetails}
        style={styles.container}
      />
    );
  }

  if (!box) {
    return (
      <ErrorMessage
        message="Caixa não encontrada"
        onRetry={() => navigation.goBack()}
        retryText="Voltar"
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Galeria de Imagens */}
        <ImageGallery images={box.images} style={styles.gallery} />

        {/* Header com ações */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <View style={styles.headerActions}>
            <IconButton
              icon="share-variant"
              size={24}
              onPress={shareBox}
              style={styles.actionButton}
            />
            <IconButton
              icon={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              iconColor={isFavorite ? theme.colors.error : theme.colors.onSurface}
              onPress={toggleFavorite}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Informações Principais */}
        <Card style={styles.infoCard}>
          <Card.Content>
            {/* Categoria e Badges */}
            <View style={styles.categoryRow}>
              <Text style={styles.category}>{box.category.name}</Text>
              <View style={styles.badges}>
                {box.is_new && <Badge style={styles.newBadge}>NOVO</Badge>}
                {box.is_featured && <Badge style={styles.featuredBadge}>DESTAQUE</Badge>}
              </View>
            </View>

            {/* Título */}
            <Title style={styles.title}>{box.name}</Title>

            {/* Raridade */}
            <Chip
              mode="outlined"
              style={[styles.rarityChip, { borderColor: getRarityColor(box.rarity) }]}
              textStyle={[styles.rarityText, { color: getRarityColor(box.rarity) }]}
            >
              {box.rarity.toUpperCase()}
            </Chip>

            {/* Preço */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(box.price)}</Text>
              {box.original_price && box.original_price > box.price && (
                <>
                  <Text style={styles.originalPrice}>
                    {formatPrice(box.original_price)}
                  </Text>
                  <Badge style={styles.discountBadge}>
                    -{box.discount_percentage}%
                  </Badge>
                </>
              )}
            </View>

            {/* Descrição */}
            <Paragraph style={styles.description}>{box.description}</Paragraph>

            {/* Estatísticas */}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{box.stats.total_sold}</Text>
                <Text style={styles.statLabel}>Vendidas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {box.stats.average_rating.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>★ Avaliação</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{box.stock}</Text>
                <Text style={styles.statLabel}>Estoque</Text>
              </View>
            </View>

            {/* Barra de Estoque */}
            {box.stock <= 20 && (
              <View style={styles.stockContainer}>
                <Text style={styles.stockText}>
                  Restam apenas {box.stock} unidades!
                </Text>
                <ProgressBar
                  progress={box.stock / 20}
                  color={box.stock <= 5 ? theme.colors.error : theme.colors.warning}
                  style={styles.stockBar}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Itens Possíveis */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Itens Possíveis</Title>
            <PossibleItemsList items={box.possible_items} />
          </Card.Content>
        </Card>

        {/* Reviews */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>
                Avaliações ({box.stats.reviews_count})
              </Title>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Reviews', { boxId: box.id })}
                compact
              >
                Ver todas
              </Button>
            </View>
            <ReviewsList reviews={reviews} />
          </Card.Content>
        </Card>

        {/* Caixas Relacionadas */}
        {relatedBoxes.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Você também pode gostar</Title>
              {/* Lista horizontal de caixas relacionadas */}
            </Card.Content>
          </Card>
        )}

        {/* Espaçamento para botões fixos */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botões de Ação Fixos */}
      <View style={styles.bottomActions}>
        <View style={styles.quantityContainer}>
          <IconButton
            icon="minus"
            size={20}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          />
          <Text style={styles.quantityText}>{quantity}</Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setQuantity(Math.min(box.stock, quantity + 1))}
            disabled={quantity >= box.stock}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={addToCart}
            loading={isAddingToCart}
            disabled={box.stock === 0 || isAddingToCart}
            style={styles.addToCartButton}
            icon="cart-plus"
          >
            Carrinho
          </Button>
          <Button
            mode="contained"
            onPress={buyNow}
            disabled={box.stock === 0}
            style={styles.buyNowButton}
          >
            {box.stock === 0 ? 'Esgotado' : 'Comprar'}
          </Button>
        </View>
      </View>
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
  scrollView: {
    flex: 1,
  },
  gallery: {
    height: 300,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing('md'),
    paddingTop: getSpacing('xl'),
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginLeft: getSpacing('sm'),
  },
  infoCard: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  category: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
  },
  newBadge: {
    backgroundColor: theme.colors.success,
    marginLeft: getSpacing('xs'),
  },
  featuredBadge: {
    backgroundColor: theme.colors.primary,
    marginLeft: getSpacing('xs'),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
    lineHeight: 28,
  },
  rarityChip: {
    alignSelf: 'flex-start',
    marginBottom: getSpacing('md'),
  },
  rarityText: {
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: getSpacing('md'),
  },
  originalPrice: {
    fontSize: 18,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
    marginRight: getSpacing('sm'),
  },
  discountBadge: {
    backgroundColor: theme.colors.error,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('lg'),
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    marginBottom: getSpacing('md'),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  stockContainer: {
    marginTop: getSpacing('md'),
  },
  stockText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
    marginBottom: getSpacing('sm'),
  },
  stockBar: {
    height: 6,
    borderRadius: 3,
  },
  sectionCard: {
    margin: getSpacing('md'),
    marginTop: 0,
    borderRadius: getBorderRadius('lg'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    padding: getSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    elevation: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing('md'),
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: getSpacing('md'),
    minWidth: 30,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getSpacing('md'),
  },
  addToCartButton: {
    flex: 1,
    borderRadius: getBorderRadius('md'),
  },
  buyNowButton: {
    flex: 2,
    borderRadius: getBorderRadius('md'),
  },
});

export default BoxDetailsScreen;
