import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  Chip,
  Badge,
} from 'react-native-paper';
import { MysteryBox } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';
import FavoriteButton from './FavoriteButton';
import CountdownTimer from './CountdownTimer';
import { getUrgencyLevel } from '../hooks/useCountdown';

/**
 * Componente de Card para Caixas Misteriosas
 * Suporta diferentes variantes: featured, compact, list
 */

interface BoxCardProps {
  box: MysteryBox;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  showFavoriteButton?: boolean;
  variant?: 'featured' | 'compact' | 'list';
  style?: ViewStyle;
}

const BoxCard: React.FC<BoxCardProps> = ({
  box,
  onPress,
  onFavoritePress,
  _isFavorite = false,
  showFavoriteButton = false,
  variant = 'compact',
  style,
}) => {
  /**
   * Obter cor da raridade
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return theme.colors.primary;
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
   * Renderizar badges
   */
  const renderBadges = () => (
    <View style={styles.badges}>
      {box.is_new && (
        <Badge style={[styles.badge, styles.newBadge]}>NOVO</Badge>
      )}
      {box.is_featured && (
        <Badge style={[styles.badge, styles.featuredBadge]}>DESTAQUE</Badge>
      )}
      {box.discount_percentage && box.discount_percentage > 0 && (
        <Badge style={[styles.badge, styles.discountBadge]}>
          -{box.discount_percentage}%
        </Badge>
      )}
    </View>
  );

  /**
   * Renderizar informações de preço
   */
  const renderPriceInfo = () => (
    <View style={styles.priceContainer}>
      <Text style={styles.price}>{formatPrice(box.price)}</Text>
      {box.original_price && box.original_price > box.price && (
        <Text style={styles.originalPrice}>
          {formatPrice(box.original_price)}
        </Text>
      )}
    </View>
  );

  /**
   * Renderizar chip de raridade
   */
  const renderRarityChip = () => (
    <Chip
      mode="outlined"
      style={[
        styles.rarityChip,
        { borderColor: getRarityColor(box.rarity) },
      ]}
      textStyle={[
        styles.rarityText,
        { color: getRarityColor(box.rarity) },
      ]}
      compact
    >
      {box.rarity.toUpperCase()}
    </Chip>
  );

  /**
   * Renderizar estatísticas
   */
  const renderStats = () => (
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
  );

  // Estilos específicos por variante
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'featured':
        return styles.featuredCard;
      case 'list':
        return styles.listCard;
      default:
        return styles.compactCard;
    }
  };

  const getImageStyle = () => {
    switch (variant) {
      case 'featured':
        return styles.featuredImage;
      case 'list':
        return styles.listImage;
      default:
        return styles.compactImage;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={[getCardStyle(), style]}>
      <Card style={styles.card} elevation={2}>
        {/* Imagem */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: box.thumbnail }}
            style={getImageStyle()}
            resizeMode="cover"
          />
          
          {/* Badges */}
          {renderBadges()}
          
          {/* Botão de favorito */}
          {showFavoriteButton && (
            <FavoriteButton
              boxId={box.id}
              size={20}
              style={styles.favoriteButton}
              onPress={onFavoritePress}
            />
          )}
          
          {/* Indicador de estoque baixo */}
          {box.stock <= 5 && box.stock > 0 && (
            <View style={styles.lowStockIndicator}>
              <Text style={styles.lowStockText}>
                Restam {box.stock}
              </Text>
            </View>
          )}
          
          {/* Indicador de sem estoque */}
          {box.stock === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>ESGOTADO</Text>
            </View>
          )}
          
          {/* Timer de Oferta Limitada */}
          {box.limited_time_offer && (
            <View style={styles.timerOverlay}>
              <CountdownTimer
                endDate={box.limited_time_offer.ends_at}
                label={box.limited_time_offer.label || "Oferta termina em"}
                variant="compact"
                urgencyLevel="auto"
                showIcon={true}
                animate={true}
              />
            </View>
          )}
          
          {/* Timer de Janela de Abertura */}
          {box.opening_window && (
            <View style={styles.openingWindowTimer}>
              <Text style={styles.openingWindowLabel}>
                {box.opening_window.days_left} dias para abrir
              </Text>
              <CountdownTimer
                endDate={box.opening_window.closes_at}
                variant="compact"
                urgencyLevel="medium"
                showIcon={false}
                animate={false}
              />
            </View>
          )}
        </View>

        {/* Conteúdo */}
        <Card.Content style={styles.content}>
          {/* Categoria e Raridade */}
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{box.category.name}</Text>
            {renderRarityChip()}
          </View>
          
          {/* Título */}
          <Title style={styles.title} numberOfLines={variant === 'list' ? 1 : 2}>
            {box.name}
          </Title>
          
          {/* Descrição (apenas para featured e list) */}
          {(variant === 'featured' || variant === 'list') && (
            <Paragraph style={styles.description} numberOfLines={2}>
              {box.short_description}
            </Paragraph>
          )}
          
          {/* Preço com desconto de Flash Sale */}
          {box.flash_sale && box.flash_sale.active ? (
            <View style={styles.flashSaleContainer}>
              <Badge style={styles.flashSaleBadge}>⚡ FLASH SALE</Badge>
              <View style={styles.flashPriceContainer}>
                <Text style={styles.flashPrice}>
                  {formatPrice(box.flash_sale.sale_price)}
                </Text>
                <Text style={styles.flashOriginalPrice}>
                  {formatPrice(box.flash_sale.original_price)}
                </Text>
              </View>
              <CountdownTimer
                endDate={box.flash_sale.ends_at}
                variant="compact"
                urgencyLevel="critical"
                style={styles.flashSaleTimer}
              />
            </View>
          ) : (
            renderPriceInfo()
          )}
          
          {/* Estatísticas (apenas para featured) */}
          {variant === 'featured' && renderStats()}
          
          {/* Tags (apenas para list) */}
          {variant === 'list' && box.tags.length > 0 && (
            <View style={styles.tags}>
              {box.tags.slice(0, 3).map((tag, _index) => (
                <Chip key={0} mode="outlined" compact style={styles.tag}>
                  {tag}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Cards base
  card: {
    borderRadius: getBorderRadius('lg'),
    overflow: 'hidden',
  },
  compactCard: {
    width: 180,
  },
  featuredCard: {
    width: 280,
  },
  listCard: {
    width: '100%',
    marginBottom: getSpacing('md'),
  },
  
  // Imagem
  imageContainer: {
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: 120,
  },
  featuredImage: {
    width: '100%',
    height: 160,
  },
  listImage: {
    width: '100%',
    height: 140,
  },
  
  // Badges
  badges: {
    position: 'absolute',
    top: getSpacing('sm'),
    left: getSpacing('sm'),
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  badge: {
    marginBottom: getSpacing('xs'),
  },
  newBadge: {
    backgroundColor: theme.colors.success,
  },
  featuredBadge: {
    backgroundColor: theme.colors.primary,
  },
  discountBadge: {
    backgroundColor: theme.colors.error,
  },
  
  // Botão de favorito
  favoriteButton: {
    position: 'absolute',
    top: getSpacing('xs'),
    right: getSpacing('xs'),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  // Indicadores de estoque
  lowStockIndicator: {
    position: 'absolute',
    bottom: getSpacing('sm'),
    right: getSpacing('sm'),
    backgroundColor: theme.colors.warning,
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
  },
  lowStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Conteúdo
  content: {
    padding: getSpacing('md'),
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  category: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  rarityChip: {
    height: 24,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('xs'),
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('sm'),
    lineHeight: 18,
  },
  
  // Preço
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: getSpacing('sm'),
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  
  // Estatísticas
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getSpacing('sm'),
    paddingTop: getSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  
  // Tags
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: getSpacing('sm'),
  },
  tag: {
    marginRight: getSpacing('xs'),
    marginBottom: getSpacing('xs'),
    height: 24,
  },
  
  // Timer overlays
  timerOverlay: {
    position: 'absolute',
    top: getSpacing('sm'),
    right: getSpacing('sm'),
    zIndex: 2,
  },
  openingWindowTimer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: getSpacing('xs'),
    paddingHorizontal: getSpacing('sm'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openingWindowLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Flash Sale
  flashSaleContainer: {
    backgroundColor: theme.colors.errorContainer,
    padding: getSpacing('sm'),
    borderRadius: getBorderRadius('md'),
    marginBottom: getSpacing('sm'),
  },
  flashSaleBadge: {
    backgroundColor: theme.colors.error,
    marginBottom: getSpacing('xs'),
    alignSelf: 'flex-start',
  },
  flashPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  flashPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginRight: getSpacing('sm'),
  },
  flashOriginalPrice: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  flashSaleTimer: {
    alignSelf: 'flex-start',
  },
});

export default BoxCard;