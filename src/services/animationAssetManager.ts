/**
 * Animation Asset Manager
 * Gerencia o carregamento e cache de assets de animação
 */

import { Image } from 'react-native';

export interface AnimationAsset {
  theme: 'fire' | 'ice' | 'meteor' | 'emoji';
  type: string;
  frames: string[];
  duration: number;
  fps: number;
}

export interface AnimationSequence {
  name: string;
  assets: AnimationAsset[];
  totalDuration: number;
}

class AnimationAssetManager {
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  
  /**
   * Pré-carrega assets de animação
   */
  async preloadAnimationAssets(theme: 'fire' | 'ice' | 'meteor'): Promise<void> {
    const sequences = this.getAnimationSequences(theme);
    
    for (const sequence of sequences) {
      for (const asset of sequence.assets) {
        await this.preloadFrames(asset.frames);
      }
    }
  }
  
  /**
   * Pré-carrega frames de animação
   */
  private async preloadFrames(frames: string[]): Promise<void> {
    const promises = frames.map(frame => {
      if (!this.cache.has(frame) && !this.loadingPromises.has(frame)) {
        const promise = Image.prefetch(frame).then(() => {
          this.cache.set(frame, true);
        });
        this.loadingPromises.set(frame, promise);
        return promise;
      }
      return this.loadingPromises.get(frame) || Promise.resolve();
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Obtém sequências de animação para um tema
   */
  getAnimationSequences(theme: 'fire' | 'ice' | 'meteor'): AnimationSequence[] {
    // Em produção, os caminhos devem apontar para assets reais
    // Por enquanto, retornamos URLs placeholder
    const placeholderFrame = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    switch (theme) {
      case 'fire':
        return [{
          name: 'fire_opening',
          totalDuration: 8300,
          assets: [
            {
              theme: 'fire',
              type: 'smoke',
              fps: 24,
              duration: 1600,
              frames: Array.from({ length: 38 }, () => placeholderFrame),
            },
            {
              theme: 'fire',
              type: 'burst',
              fps: 24,
              duration: 500,
              frames: Array.from({ length: 12 }, () => placeholderFrame),
            },
            {
              theme: 'fire',
              type: 'explosion',
              fps: 24,
              duration: 1200,
              frames: Array.from({ length: 28 }, () => placeholderFrame),
            },
            {
              theme: 'fire',
              type: 'product_reveal',
              fps: 24,
              duration: 5000,
              frames: Array.from({ length: 121 }, () => placeholderFrame),
            },
          ],
        }];
        
      case 'ice':
        return [{
          name: 'ice_opening',
          totalDuration: 2400,
          assets: [
            {
              theme: 'ice',
              type: 'blizzard',
              fps: 24,
              duration: 1100,
              frames: Array.from({ length: 27 }, () => placeholderFrame),
            },
            {
              theme: 'ice',
              type: 'top',
              fps: 24,
              duration: 460,
              frames: Array.from({ length: 11 }, () => placeholderFrame),
            },
            {
              theme: 'ice',
              type: 'bottom',
              fps: 24,
              duration: 460,
              frames: Array.from({ length: 11 }, () => placeholderFrame),
            },
            {
              theme: 'ice',
              type: 'footer',
              fps: 24,
              duration: 420,
              frames: Array.from({ length: 10 }, () => placeholderFrame),
            },
          ],
        }];
        
      case 'meteor':
        return [{
          name: 'meteor_opening',
          totalDuration: 2580,
          assets: [
            {
              theme: 'meteor',
              type: 'asteroid',
              fps: 24,
              duration: 1000,
              frames: Array.from({ length: 24 }, () => placeholderFrame),
            },
            {
              theme: 'meteor',
              type: 'explosion_product',
              fps: 24,
              duration: 580,
              frames: Array.from({ length: 14 }, () => placeholderFrame),
            },
            {
              theme: 'meteor',
              type: 'explosion_exit',
              fps: 24,
              duration: 1000,
              frames: Array.from({ length: 24 }, () => placeholderFrame),
            },
          ],
        }];
        
      default:
        return [];
    }
  }
  
  /**
   * Obtém assets de emoji
   */
  getEmojiAssets(type: 'kiss' | 'angry' | 'cool' | 'tongue'): AnimationAsset {
    const placeholderFrame = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    switch (type) {
      case 'kiss':
        return {
          theme: 'emoji',
          type: 'kiss',
          fps: 24,
          duration: 1100,
          frames: Array.from({ length: 27 }, () => placeholderFrame),
        };
        
      case 'angry':
        return {
          theme: 'emoji',
          type: 'angry',
          fps: 24,
          duration: 960,
          frames: Array.from({ length: 23 }, () => placeholderFrame),
        };
        
      case 'cool':
        return {
          theme: 'emoji',
          type: 'cool',
          fps: 24,
          duration: 1080,
          frames: Array.from({ length: 26 }, () => placeholderFrame),
        };
        
      case 'tongue':
        return {
          theme: 'emoji',
          type: 'tongue',
          fps: 24,
          duration: 420,
          frames: Array.from({ length: 10 }, () => placeholderFrame),
        };
    }
  }
  
  /**
   * Limpa cache de memória
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
  
  /**
   * Obtém tamanho do cache
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export default new AnimationAssetManager();