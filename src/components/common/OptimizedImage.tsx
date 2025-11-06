/**
 * Componente otimizado de imagem usando react-native-fast-image
 * Fornece cache, placeholder e carregamento progressivo
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import FastImage, {
  FastImageProps,
  Priority,
  ResizeMode,
} from 'react-native-fast-image';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
  source: string | { uri: string };
  style?: ImageStyle | ImageStyle[];
  containerStyle?: ViewStyle;
  priority?: Priority;
  resizeMode?: ResizeMode;
  placeholder?: boolean;
  placeholderColor?: string;
  showLoading?: boolean;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  onLoad?: () => void;
  onError?: () => void;
  testID?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  containerStyle,
  priority = FastImage.priority.normal,
  resizeMode = FastImage.resizeMode.cover,
  placeholder = true,
  placeholderColor,
  showLoading = true,
  fallbackIcon = 'image-broken',
  fallbackIconSize = 48,
  onLoad,
  onError,
  testID,
  ...props
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Normaliza a fonte da imagem
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  // Manipuladores de eventos
  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // Estilos computados
  const computedStyle = StyleSheet.flatten([styles.image, style]);
  const containerStyles = StyleSheet.flatten([
    styles.container,
    containerStyle,
    computedStyle,
  ]);

  // Cor do placeholder
  const bgColor = placeholderColor || theme.colors.surfaceVariant;

  // Renderiza o estado de erro
  if (error) {
    return (
      <View
        style={[
          containerStyles,
          styles.placeholder,
          { backgroundColor: bgColor },
        ]}
        testID={`${testID}-error`}
      >
        <Icon
          name={fallbackIcon}
          size={fallbackIconSize}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    );
  }

  return (
    <View style={containerStyles} testID={testID}>
      {/* Placeholder de fundo */}
      {placeholder && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.placeholder,
            { backgroundColor: bgColor },
          ]}
        />
      )}

      {/* Imagem otimizada */}
      <FastImage
        {...props}
        source={{
          ...imageSource,
          priority,
          cache: FastImage.cacheControl.immutable,
        }}
        style={computedStyle}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />

      {/* Indicador de carregamento */}
      {loading && showLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            testID={`${testID}-loading`}
          />
        </View>
      )}
    </View>
  );
};

// Função utilitária para pré-carregar imagens
export const preloadImages = (urls: string[]) => {
  const sources = urls.map((url) => ({
    uri: url,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,
  }));

  FastImage.preload(sources);
};

// Hook para gerenciar cache de imagens
export const useImageCache = () => {
  const clearCache = React.useCallback(() => {
    FastImage.clearMemoryCache();
    FastImage.clearDiskCache();
  }, []);

  const preload = React.useCallback((urls: string[]) => {
    preloadImages(urls);
  }, []);

  return { clearCache, preload };
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default OptimizedImage;