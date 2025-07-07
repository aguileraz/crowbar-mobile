import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {
  Text,
  Avatar,
  Badge,
} from 'react-native-paper';
import { Category } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Chip para Categorias
 * Exibe categoria com ícone, nome e contador de caixas
 */

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'compact';
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  selected = false,
  onPress,
  style,
  variant = 'default',
}) => {
  /**
   * Obter estilo do container baseado no estado
   */
  const getContainerStyle = (): ViewStyle => {
    const baseStyle = variant === 'compact' ? styles.compactContainer : styles.container;
    
    if (selected) {
      return [
        baseStyle,
        styles.selectedContainer,
        { backgroundColor: category.color + '20', borderColor: category.color },
      ];
    }
    
    return baseStyle;
  };

  /**
   * Obter estilo do texto baseado no estado
   */
  const getTextStyle = () => {
    if (selected) {
      return [styles.text, styles.selectedText, { color: category.color }];
    }
    
    return styles.text;
  };

  /**
   * Renderizar ícone da categoria
   */
  const renderIcon = () => {
    if (variant === 'compact') {
      return (
        <View
          style={[
            styles.compactIcon,
            { backgroundColor: category.color + '20' },
          ]}
        >
          <Text style={[styles.compactIconText, { color: category.color }]}>
            {category.icon}
          </Text>
        </View>
      );
    }

    return (
      <Avatar.Icon
        size={40}
        icon={category.icon}
        style={[
          styles.avatar,
          { backgroundColor: category.color + '20' },
        ]}
        color={category.color}
      />
    );
  };

  /**
   * Renderizar contador de caixas
   */
  const renderCounter = () => {
    if (variant === 'compact') {
      return null;
    }

    return (
      <Badge
        style={[
          styles.badge,
          selected && { backgroundColor: category.color },
        ]}
        size={18}
      >
        {category.boxes_count}
      </Badge>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[getContainerStyle(), style]}
      activeOpacity={0.7}
    >
      {/* Ícone */}
      {renderIcon()}
      
      {/* Conteúdo */}
      <View style={styles.content}>
        <Text style={getTextStyle()} numberOfLines={1}>
          {category.name}
        </Text>
        
        {variant === 'default' && category.description && (
          <Text style={styles.description} numberOfLines={1}>
            {category.description}
          </Text>
        )}
      </View>
      
      {/* Contador */}
      {renderCounter()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Container padrão
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('md'),
    marginRight: getSpacing('sm'),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    elevation: 1,
    minWidth: 160,
  },
  
  // Container compacto
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: getBorderRadius('round'),
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('md'),
    marginRight: getSpacing('sm'),
    borderWidth: 1,
    borderColor: theme.colors.outline,
    elevation: 1,
  },
  
  // Container selecionado
  selectedContainer: {
    borderWidth: 2,
    elevation: 3,
  },
  
  // Avatar
  avatar: {
    marginRight: getSpacing('md'),
  },
  
  // Ícone compacto
  compactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('sm'),
  },
  compactIconText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Conteúdo
  content: {
    flex: 1,
  },
  
  // Texto
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  
  // Descrição
  description: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  
  // Badge
  badge: {
    backgroundColor: theme.colors.primary,
    marginLeft: getSpacing('sm'),
  },
});

export default CategoryChip;
