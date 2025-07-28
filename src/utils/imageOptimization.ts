import { Dimensions, PixelRatio } from 'react-native';
import logger from '../services/loggerService';

/**
 * Utilitários para otimização de imagens
 */

// Configurações
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const PIXEL_RATIO = PixelRatio.get();

// Qualidades de imagem
export const IMAGE_QUALITY = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
  ORIGINAL: 1.0,
} as const;

// Formatos de imagem suportados
export const IMAGE_FORMATS = {
  WEBP: 'webp',
  JPEG: 'jpeg',
  PNG: 'png',
} as const;

// Tamanhos padrão
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 100, height: 100 },
  SMALL: { width: 200, height: 200 },
  MEDIUM: { width: 400, height: 400 },
  LARGE: { width: 800, height: 800 },
  FULL_WIDTH: { width: DEVICE_WIDTH, height: DEVICE_WIDTH },
  SCREEN: { width: DEVICE_WIDTH, height: DEVICE_HEIGHT },
} as const;

/**
 * Interface para configuração de otimização
 */
interface ImageOptimizationConfig {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  progressive?: boolean;
  blur?: number;
  grayscale?: boolean;
}

/**
 * Interface para configuração responsiva
 */
interface ResponsiveImageConfig {
  baseUrl: string;
  sizes: Array<{
    width: number;
    height?: number;
    quality?: number;
    condition?: () => boolean;
  }>;
  fallback?: string;
}

/**
 * Gerar URL otimizada para imagem
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  config: ImageOptimizationConfig = {}
): string => {
  if (!baseUrl) return '';

  const {
    width,
    height,
    quality = IMAGE_QUALITY.MEDIUM,
    format = IMAGE_FORMATS.WEBP,
    progressive = true,
    blur,
    grayscale,
  } = config;

  // Se for uma URL local ou já otimizada, retorna como está
  if (baseUrl.startsWith('file://') || baseUrl.includes('optimized')) {
    return baseUrl;
  }

  // Construir parâmetros de otimização
  const params = new URLSearchParams();

  if (width) params.append('w', Math.round(width * PIXEL_RATIO).toString());
  if (height) params.append('h', Math.round(height * PIXEL_RATIO).toString());
  if (quality !== IMAGE_QUALITY.ORIGINAL) params.append('q', Math.round(quality * 100).toString());
  if (format !== IMAGE_FORMATS.JPEG) params.append('f', format);
  if (progressive) params.append('progressive', 'true');
  if (blur) params.append('blur', blur.toString());
  if (grayscale) params.append('grayscale', 'true');

  // Adicionar parâmetros à URL
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
};

/**
 * Gerar URLs responsivas para diferentes tamanhos
 */
export const getResponsiveImageUrls = (config: ResponsiveImageConfig): string[] => {
  const { baseUrl, sizes, fallback } = config;

  if (!baseUrl) return fallback ? [fallback] : [];

  return sizes
    .filter(size => !size.condition || size.condition())
    .map(size => getOptimizedImageUrl(baseUrl, {
      width: size.width,
      height: size.height,
      quality: size.quality,
    }));
};

/**
 * Calcular tamanho otimizado baseado no container
 */
export const calculateOptimalSize = (
  containerWidth: number,
  containerHeight: number,
  aspectRatio?: number
): { width: number; height: number } => {
  const pixelRatio = PIXEL_RATIO;
  
  let width = Math.round(containerWidth * pixelRatio);
  let height = Math.round(containerHeight * pixelRatio);

  // Aplicar aspect ratio se fornecido
  if (aspectRatio) {
    if (width / height > aspectRatio) {
      width = Math.round(height * aspectRatio);
    } else {
      height = Math.round(width / aspectRatio);
    }
  }

  // Limitar tamanho máximo para economizar memória
  const maxSize = 2048;
  if (width > maxSize) {
    height = Math.round((height * maxSize) / width);
    width = maxSize;
  }
  if (height > maxSize) {
    width = Math.round((width * maxSize) / height);
    height = maxSize;
  }

  return { width, height };
};

/**
 * Gerar srcSet para imagens responsivas
 */
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[] = [1, 1.5, 2, 3]
): string => {
  if (!baseUrl) return '';

  return sizes
    .map(scale => {
      const scaledWidth = Math.round(DEVICE_WIDTH * scale);
      const optimizedUrl = getOptimizedImageUrl(baseUrl, {
        width: scaledWidth,
        quality: scale > 2 ? IMAGE_QUALITY.MEDIUM : IMAGE_QUALITY.HIGH,
      });
      return `${optimizedUrl} ${scale}x`;
    })
    .join(', ');
};

/**
 * Configurações predefinidas para diferentes tipos de imagem
 */
export const IMAGE_PRESETS = {
  // Avatar do usuário
  avatar: (size: number = 80) => ({
    width: size,
    height: size,
    quality: IMAGE_QUALITY.HIGH,
    format: IMAGE_FORMATS.WEBP,
  }),

  // Thumbnail de caixa
  boxThumbnail: {
    width: IMAGE_SIZES.SMALL.width,
    height: IMAGE_SIZES.SMALL.height,
    quality: IMAGE_QUALITY.MEDIUM,
    format: IMAGE_FORMATS.WEBP,
  },

  // Imagem de caixa em detalhes
  boxDetail: {
    width: IMAGE_SIZES.MEDIUM.width,
    height: IMAGE_SIZES.MEDIUM.height,
    quality: IMAGE_QUALITY.HIGH,
    format: IMAGE_FORMATS.WEBP,
  },

  // Imagem de item
  item: {
    width: IMAGE_SIZES.SMALL.width,
    height: IMAGE_SIZES.SMALL.height,
    quality: IMAGE_QUALITY.MEDIUM,
    format: IMAGE_FORMATS.WEBP,
  },

  // Banner promocional
  banner: {
    width: DEVICE_WIDTH,
    height: Math.round(DEVICE_WIDTH * 0.4), // 2.5:1 aspect ratio
    quality: IMAGE_QUALITY.HIGH,
    format: IMAGE_FORMATS.WEBP,
  },

  // Imagem de fundo
  background: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    quality: IMAGE_QUALITY.MEDIUM,
    format: IMAGE_FORMATS.WEBP,
    blur: 10,
  },

  // Placeholder com blur
  placeholder: {
    width: 50,
    height: 50,
    quality: IMAGE_QUALITY.LOW,
    format: IMAGE_FORMATS.WEBP,
    blur: 20,
  },
} as const;

/**
 * Cache de URLs otimizadas
 */
class ImageUrlCache {
  private cache = new Map<string, string>();
  private maxSize = 1000;

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(_key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const imageUrlCache = new ImageUrlCache();

/**
 * Função helper para obter URL otimizada com cache
 */
export const getCachedOptimizedUrl = (
  baseUrl: string,
  config: ImageOptimizationConfig = {}
): string => {
  if (!baseUrl) return '';

  const cacheKey = `${baseUrl}_${JSON.stringify(config)}`;
  const cached = imageUrlCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const optimizedUrl = getOptimizedImageUrl(baseUrl, config);
  imageUrlCache.set(cacheKey, optimizedUrl);

  return optimizedUrl;
};

/**
 * Função para pré-carregar imagens críticas
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        image.src = url;
      });
    });

    await Promise.all(preloadPromises);
    logger.debug(`Preloaded ${urls.length} images`);
  } catch (error) {
    logger.error('Error preloading images:', error);
  }
};

/**
 * Função para detectar suporte a WebP
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Função para obter formato de imagem ideal
 */
export const getOptimalFormat = async (): Promise<string> => {
  const webpSupported = await supportsWebP();
  return webpSupported ? IMAGE_FORMATS.WEBP : IMAGE_FORMATS.JPEG;
};

/**
 * Função para calcular economia de dados
 */
export const calculateDataSavings = (
  originalSize: number,
  optimizedSize: number
): { savings: number; percentage: number } => {
  const savings = originalSize - optimizedSize;
  const percentage = (savings / originalSize) * 100;
  
  return {
    savings: Math.max(0, savings),
    percentage: Math.max(0, percentage),
  };
};

/**
 * Configuração adaptativa baseada na conexão
 */
export const getAdaptiveImageConfig = (
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown' = 'unknown'
): ImageOptimizationConfig => {
  switch (connectionType) {
    case 'wifi':
      return {
        quality: IMAGE_QUALITY.HIGH,
        format: IMAGE_FORMATS.WEBP,
      };
    case '4g':
      return {
        quality: IMAGE_QUALITY.MEDIUM,
        format: IMAGE_FORMATS.WEBP,
      };
    case '3g':
      return {
        quality: IMAGE_QUALITY.LOW,
        format: IMAGE_FORMATS.WEBP,
      };
    case '2g':
      return {
        quality: IMAGE_QUALITY.LOW,
        format: IMAGE_FORMATS.JPEG,
        progressive: false,
      };
    default:
      return {
        quality: IMAGE_QUALITY.MEDIUM,
        format: IMAGE_FORMATS.WEBP,
      };
  }
};

export default {
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  calculateOptimalSize,
  generateSrcSet,
  IMAGE_PRESETS,
  getCachedOptimizedUrl,
  preloadImages,
  supportsWebP,
  getOptimalFormat,
  calculateDataSavings,
  getAdaptiveImageConfig,
  imageUrlCache,
};
