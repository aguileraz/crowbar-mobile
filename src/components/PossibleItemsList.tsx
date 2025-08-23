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
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { PossibleItem } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente para Lista de Itens Possíveis
 * Exibe os itens que podem sair da caixa com probabilidades
 */

interface PossibleItemsListProps {
  items: PossibleItem[];
}

const PossibleItemsList: React.FC<PossibleItemsListProps> = ({ items }) => {
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
   * Formatar valor estimado
   */
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Renderizar item possível
   */
  const renderItem = ({ item }: { item: PossibleItem }) => (
    <Card style={styles.itemCard} elevation={1}>
      <View style={styles.itemContent}>
        {/* Imagem */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          
          {/* Badge de raridade */}
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(item.rarity) },
            ]}
          >
            <Text style={styles.rarityBadgeText}>
              {item.rarity.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Informações */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
          
          {/* Chip de raridade */}
          <Chip
            mode="outlined"
            style={[
              styles.rarityChip,
              { borderColor: getRarityColor(item.rarity) },
            ]}
            textStyle={[
              styles.rarityChipText,
              { color: getRarityColor(item.rarity) },
            ]}
            compact
          >
            {item.rarity.toUpperCase()}
          </Chip>
          
          {/* Valor estimado */}
          <Text style={styles.estimatedValue}>
            Valor: {formatValue(item.estimated_value)}
          </Text>
          
          {/* Probabilidade */}
          <View style={styles.probabilityContainer}>
            <View style={styles.probabilityHeader}>
              <Text style={styles.probabilityLabel}>Chance</Text>
              <Text style={styles.probabilityValue}>
                {item.probability.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={item.probability / 100}
              color={getRarityColor(item.rarity)}
              style={styles.probabilityBar}
            />
          </View>
        </View>
      </View>
    </Card>
  );

  /**
   * Renderizar header com estatísticas
   */
  const renderHeader = () => {
    const totalValue = items.reduce((sum, item) => 
      sum + (item.estimated_value * item.probability / 100), 0
    );
    
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);

    return (
      <View style={styles.header}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Itens Possíveis</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatValue(totalValue)}</Text>
            <Text style={styles.statLabel}>Valor Esperado</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalProbability.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Chance Total</Text>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum item possível disponível
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: getSpacing('lg'),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getSpacing('md'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('md'),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  list: {
    gap: getSpacing('md'),
  },
  itemCard: {
    flex: 1,
    margin: getSpacing('xs'),
    borderRadius: getBorderRadius('md'),
  },
  itemContent: {
    padding: getSpacing('sm'),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: getSpacing('sm'),
  },
  itemImage: {
    width: '100%',
    height: 80,
    borderRadius: getBorderRadius('sm'),
  },
  rarityBadge: {
    position: 'absolute',
    top: getSpacing('xs'),
    right: getSpacing('xs'),
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xs'),
    lineHeight: 18,
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('sm'),
  },
  rarityChip: {
    alignSelf: 'flex-start',
    height: 20,
    marginBottom: getSpacing('xs'),
  },
  rarityChipText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  estimatedValue: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: getSpacing('sm'),
  },
  probabilityContainer: {
    marginTop: 'auto',
  },
  probabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  probabilityLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  probabilityValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  probabilityBar: {
    height: 4,
    borderRadius: 2,
  },
  emptyContainer: {
    padding: getSpacing('lg'),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
});

export default PossibleItemsList;