import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {
  IconButton,
  Text,
} from 'react-native-paper';
import { BoxImage } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente de Galeria de Imagens
 * Exibe galeria principal com thumbnails navegáveis
 */

interface ImageGalleryProps {
  images: BoxImage[];
  style?: ViewStyle;
}

const { width } = Dimensions.get('window');
const MAIN_IMAGE_HEIGHT = 300;
const THUMBNAIL_SIZE = 60;

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, style }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Ordenar imagens (primária primeiro)
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.order - b.order;
  });

  /**
   * Renderizar imagem principal
   */
  const renderMainImage = () => {
    const currentImage = sortedImages[selectedIndex];
    
    return (
      <View style={styles.mainImageContainer}>
        <Image
          source={{ uri: currentImage?.url }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        
        {/* Indicador de posição */}
        {sortedImages.length > 1 && (
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              {selectedIndex + 1} / {sortedImages.length}
            </Text>
          </View>
        )}
        
        {/* Botões de navegação */}
        {sortedImages.length > 1 && (
          <>
            <IconButton
              icon="chevron-left"
              size={24}
              iconColor="white"
              onPress={() => setSelectedIndex(
                selectedIndex === 0 ? sortedImages.length - 1 : selectedIndex - 1
              )}
              style={[styles.navButton, styles.prevButton]}
            />
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor="white"
              onPress={() => setSelectedIndex(
                selectedIndex === sortedImages.length - 1 ? 0 : selectedIndex + 1
              )}
              style={[styles.navButton, styles.nextButton]}
            />
          </>
        )}
      </View>
    );
  };

  /**
   * Renderizar thumbnail
   */
  const renderThumbnail = ({ item, index }: { item: BoxImage; index: number }) => (
    <TouchableOpacity
      onPress={() => setSelectedIndex(index)}
      style={[
        styles.thumbnail,
        index === selectedIndex && styles.selectedThumbnail,
      ]}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  /**
   * Renderizar lista de thumbnails
   */
  const renderThumbnails = () => {
    if (sortedImages.length <= 1) return null;

    return (
      <View style={styles.thumbnailsContainer}>
        <FlatList
          data={sortedImages}
          renderItem={renderThumbnail}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsList}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderMainImage()}
      {renderThumbnails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
  },
  mainImageContainer: {
    position: 'relative',
    width: width,
    height: MAIN_IMAGE_HEIGHT,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  positionIndicator: {
    position: 'absolute',
    top: getSpacing('md'),
    right: getSpacing('md'),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
  },
  positionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  prevButton: {
    left: getSpacing('md'),
  },
  nextButton: {
    right: getSpacing('md'),
  },
  thumbnailsContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: getSpacing('md'),
  },
  thumbnailsList: {
    paddingHorizontal: getSpacing('md'),
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginRight: getSpacing('sm'),
    borderRadius: getBorderRadius('sm'),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: theme.colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageGallery;
