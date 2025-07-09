/**
 * Exemplo de componente otimizado para performance
 * Demonstra o uso de todas as técnicas de otimização
 */

import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

// Componentes otimizados
import OptimizedImage from '../common/OptimizedImage';

// Hooks otimizados
import { useOptimizedCallback, useMemoizedObject } from '../../hooks/useOptimizedCallback';

// Seletores memoizados
import { selectIsFavorite } from '../../store/selectors';

// Tipos
import { Box } from '../../types/api';
import { RootState } from '../../store/types';

interface OptimizedBoxCardProps {
  box: Box;
  onPress?: (box: Box) => void;
  onFavoriteToggle?: (boxId: string, isFavorite: boolean) => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Componente BoxCard otimizado para performance
 * Usa memo para evitar re-renders desnecessários
 */
export const OptimizedBoxCard = memo<OptimizedBoxCardProps>(({
  box,
  onPress,
  onFavoriteToggle,
  style,
  testID,
}) => {
  const navigation = useNavigation();
  
  // Seletor memoizado específico para este box
  const isFavorite = useSelector((state: RootState) => 
    selectIsFavorite(state, box.id)
  );

  // Callback otimizado que mantém referência estável
  const handlePress = useOptimizedCallback(() => {
    if (onPress) {
      onPress(box);
    } else {
      navigation.navigate('BoxDetails', { boxId: box.id });
    }
  }, [onPress, box.id, navigation]);

  // Callback otimizado para favoritos
  const handleFavoriteToggle = useOptimizedCallback(() => {
    onFavoriteToggle?.(box.id, !isFavorite);
  }, [onFavoriteToggle, box.id, isFavorite]);

  // Memoiza o objeto de estilos para evitar recriação
  const cardStyle = useMemoizedObject({
    ...styles.card,
    ...style,
  });

  // Formata o preço uma vez (memoizado dentro do componente)
  const formattedPrice = React.useMemo(() => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(box.price);
  }, [box.price]);

  // Calcula o desconto se houver
  const discountPercentage = React.useMemo(() => {
    if (!box.originalPrice || box.originalPrice <= box.price) {
      return null;
    }
    return Math.round((1 - box.price / box.originalPrice) * 100);
  }, [box.price, box.originalPrice]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        cardStyle,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <Card style={styles.cardContent}>
        {/* Imagem otimizada com lazy loading */}
        <OptimizedImage
          source={box.images[0]}
          style={styles.image}
          resizeMode="cover"
          placeholder
          testID={`${testID}-image`}
        />
        
        {/* Badge de desconto */}
        {discountPercentage && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{discountPercentage}%
            </Text>
          </View>
        )}
        
        {/* Informações do box */}
        <View style={styles.content}>
          <Text 
            style={styles.title} 
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {box.name}
          </Text>
          
          <Text 
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {box.description}
          </Text>
          
          {/* Preços */}
          <View style={styles.priceContainer}>
            {box.originalPrice && box.originalPrice > box.price && (
              <Text style={styles.originalPrice}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(box.originalPrice)}
              </Text>
            )}
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
          
          {/* Avaliação */}
          {box.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {box.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({box.reviewCount} avaliações)
              </Text>
            </View>
          )}
        </View>
        
        {/* Botão de favorito */}
        <Pressable
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
          hitSlop={8}
          testID={`${testID}-favorite`}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </Pressable>
      </Card>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para memo
  // Só re-renderiza se props relevantes mudarem
  return (
    prevProps.box.id === nextProps.box.id &&
    prevProps.box.price === nextProps.box.price &&
    prevProps.box.name === nextProps.box.name &&
    prevProps.box.images[0] === nextProps.box.images[0] &&
    prevProps.style === nextProps.style
  );
});

// Nome para debugging
OptimizedBoxCard.displayName = 'OptimizedBoxCard';

const styles = StyleSheet.create({
  card: {
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    elevation: 2,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: 200,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'red',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
});

export default OptimizedBoxCard;