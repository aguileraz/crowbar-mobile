/**
 * Componente de lista otimizada usando FlashList
 * Melhora significativamente a performance em listas grandes
 */

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  RefreshControl,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import { useTheme } from 'react-native-paper';

interface OptimizedListProps<T> extends Omit<FlashListProps<T>, 'data'> {
  data: T[] | null | undefined;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  testID?: string;
}

export function OptimizedList<T>({
  data,
  loading = false,
  refreshing = false,
  onRefresh,
  emptyTitle = 'Nada encontrado',
  emptyMessage = 'Não há itens para exibir',
  emptyIcon,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  testID,
  renderItem,
  estimatedItemSize = 100,
  ...props
}: OptimizedListProps<T>) {
  const theme = useTheme();

  // Componente de lista vazia
  const ListEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={[styles.centerContainer, styles.emptyContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <View style={[styles.centerContainer, styles.emptyContainer]}>
        {emptyIcon}
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {emptyTitle}
        </Text>
        <Text
          style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }, [loading, emptyIcon, emptyTitle, emptyMessage, theme]);

  // RefreshControl otimizado
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[theme.colors.primary]}
        tintColor={theme.colors.primary}
        progressBackgroundColor={theme.colors.surface}
      />
    );
  }, [refreshing, onRefresh, theme]);

  // Garante que data seja sempre um array
  const safeData = useMemo(() => data || [], [data]);

  // Props otimizadas para a FlashList
  const optimizedProps = useMemo(
    () => ({
      // Performance
      estimatedItemSize,
      drawDistance: 200,
      recycleItems: true,
      removeClippedSubviews: true,
      
      // Layout
      showsVerticalScrollIndicator,
      contentContainerStyle: [
        safeData.length === 0 ? styles.emptyListContainer : {},
        contentContainerStyle,
      ],
      
      // Comportamento
      keyboardShouldPersistTaps: 'handled' as const,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      },
    }),
    [estimatedItemSize, showsVerticalScrollIndicator, contentContainerStyle, safeData.length]
  );

  return (
    <FlashList<T>
      testID={testID}
      data={safeData}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}
      {...optimizedProps}
      {...props}
    />
  );
}

// Lista otimizada com seções
interface OptimizedSectionListProps<T> {
  sections: Array<{
    title: string;
    data: T[];
  }>;
  renderItem: (item: T, _index: number) => React.ReactElement;
  renderSectionHeader?: (title: string) => React.ReactElement;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  estimatedItemSize?: number;
  testID?: string;
}

export function OptimizedSectionList<T>({
  sections,
  renderItem,
  renderSectionHeader,
  loading = false,
  refreshing = false,
  onRefresh,
  estimatedItemSize = 100,
  testID,
}: OptimizedSectionListProps<T>) {
  const theme = useTheme();

  // Transforma seções em dados flat com marcadores
  const flatData = useMemo(() => {
    const result: Array<{ type: 'header' | 'item'; title?: string; item?: T; 0?: number }> = [];
    
    sections.forEach((section) => {
      if (section.data.length > 0) {
        result.push({ type: 'header', title: section.title });
        section.data.forEach((item, _index) => {
          result.push({ type: 'item', item, _index });
        });
      }
    });
    
    return result;
  }, [sections]);

  // Renderiza item ou header
  const renderFlatItem = useCallback(
    ({ item }: { item: typeof flatData[0] }) => {
      if (item.type === 'header' && renderSectionHeader) {
        return renderSectionHeader(item.title!);
      }
      
      if (item.type === 'item') {
        return renderItem(item.item!, item._index!);
      }
      
      return null;
    },
    [renderItem, renderSectionHeader]
  );

  // Header padrão da seção
  const _defaultRenderSectionHeader = useCallback(
    (title: string) => (
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionHeaderText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {title}
        </Text>
      </View>
    ),
    [theme]
  );

  return (
    <OptimizedList
      testID={testID}
      data={flatData}
      renderItem={renderFlatItem}
      keyExtractor={(item, _index) => 
        item.type === 'header' ? `header-${item.title}` : `item-${0}`
      }
      getItemType={(item) => item.type}
      estimatedItemSize={estimatedItemSize}
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default OptimizedList;