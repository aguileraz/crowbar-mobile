import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  Text,
  Button,
  Chip,
  TextInput,
  Switch,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';

// Redux
import { AppDispatch } from '../store';
import { fetchCategories, selectCategories } from '../store/slices/boxSlice';

// Types
import { SearchFilters, Category } from '../types/api';

// Theme
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Modal de Filtros para Busca
 * Permite filtrar por categoria, preço, raridade, etc.
 */

interface FilterModalProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onDismiss: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onApply,
  onDismiss,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(selectCategories);
  
  // Local filter state
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  // Load categories when modal opens
  useEffect(() => {
    if (visible && categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [visible, categories.length]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * Update local filter
   */
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Toggle rarity filter
   */
  const toggleRarity = (rarity: string) => {
    const currentRarities = localFilters.rarity || [];
    const newRarities = currentRarities.includes(rarity)
      ? currentRarities.filter(r => r !== rarity)
      : [...currentRarities, rarity];
    
    updateFilter('rarity', newRarities.length > 0 ? newRarities : undefined);
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setLocalFilters({});
  };

  /**
   * Apply filters
   */
  const handleApply = () => {
    onApply(localFilters);
  };

  /**
   * Render category section
   */
  const renderCategorySection = () => (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Categoria</Title>
      <View style={styles.chipContainer}>
        <Chip
          mode={!localFilters.category_id ? 'flat' : 'outlined'}
          selected={!localFilters.category_id}
          onPress={() => updateFilter('category_id', undefined)}
          style={styles.chip}
        >
          Todas
        </Chip>
        {categories.map(category => (
          <Chip
            key={category.id}
            mode={localFilters.category_id === category.id ? 'flat' : 'outlined'}
            selected={localFilters.category_id === category.id}
            onPress={() => updateFilter('category_id', 
              localFilters.category_id === category.id ? undefined : category.id
            )}
            style={styles.chip}
          >
            {category.name}
          </Chip>
        ))}
      </View>
    </View>
  );

  /**
   * Render price section
   */
  const renderPriceSection = () => (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Faixa de Preço</Title>
      <View style={styles.priceContainer}>
        <TextInput
          label="Preço mínimo"
          value={localFilters.min_price?.toString() || ''}
          onChangeText={(text) => updateFilter('min_price', 
            text ? parseFloat(text) || undefined : undefined
          )}
          keyboardType="numeric"
          style={styles.priceInput}
          mode="outlined"
          dense
        />
        <Text style={styles.priceConnector}>até</Text>
        <TextInput
          label="Preço máximo"
          value={localFilters.max_price?.toString() || ''}
          onChangeText={(text) => updateFilter('max_price', 
            text ? parseFloat(text) || undefined : undefined
          )}
          keyboardType="numeric"
          style={styles.priceInput}
          mode="outlined"
          dense
        />
      </View>
    </View>
  );

  /**
   * Render rarity section
   */
  const renderRaritySection = () => {
    const rarities = [
      { key: 'common', label: 'Comum', color: '#9E9E9E' },
      { key: 'rare', label: 'Raro', color: '#2196F3' },
      { key: 'epic', label: 'Épico', color: '#9C27B0' },
      { key: 'legendary', label: 'Lendário', color: '#FF9800' },
    ];

    return (
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Raridade</Title>
        <View style={styles.chipContainer}>
          {rarities.map(rarity => (
            <Chip
              key={rarity.key}
              mode={localFilters.rarity?.includes(rarity.key) ? 'flat' : 'outlined'}
              selected={localFilters.rarity?.includes(rarity.key)}
              onPress={() => toggleRarity(rarity.key)}
              style={[
                styles.chip,
                localFilters.rarity?.includes(rarity.key) && {
                  backgroundColor: rarity.color + '20',
                  borderColor: rarity.color,
                }
              ]}
              textStyle={localFilters.rarity?.includes(rarity.key) && {
                color: rarity.color,
              }}
            >
              {rarity.label}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render special filters section
   */
  const renderSpecialFiltersSection = () => (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Filtros Especiais</Title>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Apenas em destaque</Text>
        <Switch
          value={localFilters.is_featured || false}
          onValueChange={(value) => updateFilter('is_featured', value || undefined)}
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Apenas novos lançamentos</Text>
        <Switch
          value={localFilters.is_new || false}
          onValueChange={(value) => updateFilter('is_new', value || undefined)}
        />
      </View>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Title style={styles.title}>Filtros</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>

          <Divider />

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCategorySection()}
            <Divider style={styles.divider} />
            
            {renderPriceSection()}
            <Divider style={styles.divider} />
            
            {renderRaritySection()}
            <Divider style={styles.divider} />
            
            {renderSpecialFiltersSection()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={clearAllFilters}
              style={styles.clearButton}
            >
              Limpar
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.applyButton}
            >
              Aplicar
            </Button>
          </View>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: getSpacing('lg'),
    maxHeight: '90%',
  },
  card: {
    borderRadius: getBorderRadius('lg'),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing('lg'),
    paddingBottom: getSpacing('md'),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: getSpacing('lg'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: getSpacing('md'),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('sm'),
  },
  chip: {
    marginRight: getSpacing('sm'),
    marginBottom: getSpacing('sm'),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('md'),
  },
  priceInput: {
    flex: 1,
  },
  priceConnector: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  switchLabel: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  divider: {
    marginVertical: getSpacing('sm'),
  },
  footer: {
    flexDirection: 'row',
    padding: getSpacing('lg'),
    gap: getSpacing('md'),
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});

export default FilterModal;
