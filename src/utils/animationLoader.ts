/**
 * Utilitário para carregar e gerenciar frames de animação
 */

import { Image } from 'react-native';

export type AnimationType = 
  | 'emoji_beijo' 
  | 'emoji_bravo' 
  | 'emoji_cool' 
  | 'emoji_lingua'
  | 'fire_explosion'
  | 'fire_product'
  | 'fire_smoke'
  | 'fire_burst'
  | 'ice_blizzard'
  | 'ice_bottom'
  | 'ice_footer'
  | 'ice_top'
  | 'meteor_asteroid'
  | 'meteor_product'
  | 'meteor_exit'
  | 'emoji_exit';

// Mapeamento de animações para seus frames
const animationFrameMap: Record<AnimationType, () => any[]> = {
  emoji_beijo: () => [
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00010.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00011.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00012.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00013.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00014.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00015.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00016.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00017.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00018.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00019.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00020.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00021.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00022.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00023.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00024.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00025.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00026.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00027.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00028.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00029.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00030.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00031.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00032.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00033.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00034.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00035.png'),
    require('../assets/animations/emojis/beijo/EMOJI_BEIJO_00036.png'),
  ],
  
  emoji_bravo: () => [
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00011.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00012.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00013.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00014.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00015.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00016.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00017.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00018.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00019.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00020.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00021.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00022.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00023.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00024.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00025.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00026.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00027.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00028.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00029.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00030.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00031.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00032.png'),
    require('../assets/animations/emojis/bravo/EMOJI_BRAVO_00033.png'),
  ],
  
  emoji_cool: () => [
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00016.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00017.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00018.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00019.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00020.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00021.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00022.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00023.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00024.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00025.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00026.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00027.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00028.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00029.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00030.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00031.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00032.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00033.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00034.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00035.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00036.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00037.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00038.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00039.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00040.png'),
    require('../assets/animations/emojis/cool/EMOJI_COOL_00000_00041.png'),
  ],
  
  emoji_lingua: () => [
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00016.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00017.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00018.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00019.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00020.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00021.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00022.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00023.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00024.png'),
    require('../assets/animations/emojis/lingua/EMOJI_LINGUA_00025.png'),
  ],
  
  // Animações de fogo - apenas primeiros frames para exemplo
  fire_explosion: () => [
    require('../assets/animations/themes/fire/explosion/EXPLOSAO_FOGO_00778.png'),
    require('../assets/animations/themes/fire/explosion/EXPLOSAO_FOGO_00779.png'),
    require('../assets/animations/themes/fire/explosion/EXPLOSAO_FOGO_00780.png'),
    require('../assets/animations/themes/fire/explosion/EXPLOSAO_FOGO_00781.png'),
    require('../assets/animations/themes/fire/explosion/EXPLOSAO_FOGO_00782.png'),
  ],
  
  fire_product: () => [
    require('../assets/animations/themes/fire/product/FOGO_PRODUTO_00787.png'),
    require('../assets/animations/themes/fire/product/FOGO_PRODUTO_00788.png'),
    require('../assets/animations/themes/fire/product/FOGO_PRODUTO_00789.png'),
    require('../assets/animations/themes/fire/product/FOGO_PRODUTO_00790.png'),
    require('../assets/animations/themes/fire/product/FOGO_PRODUTO_00791.png'),
  ],
  
  fire_smoke: () => [
    require('../assets/animations/themes/fire/smoke/FUMAÇA_FOGO_00767.png'),
    require('../assets/animations/themes/fire/smoke/FUMAÇA_FOGO_00768.png'),
    require('../assets/animations/themes/fire/smoke/FUMAÇA_FOGO_00769.png'),
    require('../assets/animations/themes/fire/smoke/FUMAÇA_FOGO_00770.png'),
    require('../assets/animations/themes/fire/smoke/FUMAÇA_FOGO_00771.png'),
  ],
  
  fire_burst: () => [
    require('../assets/animations/themes/fire/burst/RAJADA_FOGO_00770.png'),
    require('../assets/animations/themes/fire/burst/RAJADA_FOGO_00771.png'),
    require('../assets/animations/themes/fire/burst/RAJADA_FOGO_00772.png'),
    require('../assets/animations/themes/fire/burst/RAJADA_FOGO_00773.png'),
    require('../assets/animations/themes/fire/burst/RAJADA_FOGO_00774.png'),
  ],
  
  // Animações de gelo
  ice_blizzard: () => [
    require('../assets/animations/themes/ice/blizzard/GELO_NEVASCA_00761.png'),
    require('../assets/animations/themes/ice/blizzard/GELO_NEVASCA_00762.png'),
    require('../assets/animations/themes/ice/blizzard/GELO_NEVASCA_00763.png'),
    require('../assets/animations/themes/ice/blizzard/GELO_NEVASCA_00764.png'),
    require('../assets/animations/themes/ice/blizzard/GELO_NEVASCA_00765.png'),
  ],
  
  ice_bottom: () => [
    require('../assets/animations/themes/ice/bottom/GELO_baixo_00778.png'),
    require('../assets/animations/themes/ice/bottom/GELO_baixo_00779.png'),
    require('../assets/animations/themes/ice/bottom/GELO_baixo_00780.png'),
    require('../assets/animations/themes/ice/bottom/GELO_baixo_00781.png'),
    require('../assets/animations/themes/ice/bottom/GELO_baixo_00782.png'),
  ],
  
  ice_footer: () => [
    require('../assets/animations/themes/ice/footer/GELO_FOOTER_00779.png'),
    require('../assets/animations/themes/ice/footer/GELO_FOOTER_00780.png'),
    require('../assets/animations/themes/ice/footer/GELO_FOOTER_00781.png'),
    require('../assets/animations/themes/ice/footer/GELO_FOOTER_00782.png'),
    require('../assets/animations/themes/ice/footer/GELO_FOOTER_00783.png'),
  ],
  
  ice_top: () => [
    require('../assets/animations/themes/ice/top/GELO_TOPO_00778.png'),
    require('../assets/animations/themes/ice/top/GELO_TOPO_00779.png'),
    require('../assets/animations/themes/ice/top/GELO_TOPO_00780.png'),
    require('../assets/animations/themes/ice/top/GELO_TOPO_00781.png'),
    require('../assets/animations/themes/ice/top/GELO_TOPO_00782.png'),
  ],
  
  // Animações de meteoro
  meteor_asteroid: () => [
    require('../assets/animations/themes/meteor/asteroid/asteroid_00000.png'),
    require('../assets/animations/themes/meteor/asteroid/asteroid_00001.png'),
    require('../assets/animations/themes/meteor/asteroid/asteroid_00002.png'),
    require('../assets/animations/themes/meteor/asteroid/asteroid_00003.png'),
    require('../assets/animations/themes/meteor/asteroid/asteroid_00004.png'),
  ],
  
  meteor_product: () => [
    require('../assets/animations/themes/meteor/product_explosion/EX_PRODUTO.png'),
    require('../assets/animations/themes/meteor/product_explosion/EX_PRODUTO1.png'),
    require('../assets/animations/themes/meteor/product_explosion/EX_PRODUTO2.png'),
    require('../assets/animations/themes/meteor/product_explosion/EX_PRODUTO3.png'),
    require('../assets/animations/themes/meteor/product_explosion/EX_PRODUTO4.png'),
  ],
  
  meteor_exit: () => [
    require('../assets/animations/themes/meteor/exit_explosion/EX_SAIDA.png'),
    require('../assets/animations/themes/meteor/exit_explosion/EX_SAIDA1.png'),
    require('../assets/animations/themes/meteor/exit_explosion/EX_SAIDA2.png'),
    require('../assets/animations/themes/meteor/exit_explosion/EX_SAIDA3.png'),
    require('../assets/animations/themes/meteor/exit_explosion/EX_SAIDA4.png'),
  ],
  
  emoji_exit: () => [
    require('../assets/animations/exits/emoji_exit/SAIDA_EMOJIS_00042.png'),
    require('../assets/animations/exits/emoji_exit/SAIDA_EMOJIS_00043.png'),
    require('../assets/animations/exits/emoji_exit/SAIDA_EMOJIS_00044.png'),
    require('../assets/animations/exits/emoji_exit/SAIDA_EMOJIS_00045.png'),
    require('../assets/animations/exits/emoji_exit/SAIDA_EMOJIS_00046.png'),
  ],
};

/**
 * Carrega frames de animação
 */
export function loadAnimationFrames(type: AnimationType): any[] {
  const loader = animationFrameMap[type];
  if (!loader) {
    console.warn(`Animation type '${type}' not found`);
    return [];
  }
  
  try {
    return loader();
  } catch (error) {
    console.error(`Error loading animation frames for '${type}':`, error);
    return [];
  }
}

/**
 * Pré-carrega frames de animação para melhor performance
 */
export async function preloadAnimationFrames(types: AnimationType[]): Promise<void> {
  const promises: Promise<boolean>[] = [];
  
  for (const type of types) {
    const frames = loadAnimationFrames(type);
    for (const frame of frames) {
      if (frame) {
        promises.push(Image.prefetch(Image.resolveAssetSource(frame).uri));
      }
    }
  }
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.warn('Some animation frames failed to preload:', error);
  }
}

/**
 * Obtém informações sobre a animação
 */
export function getAnimationInfo(type: AnimationType): {
  frameCount: number;
  defaultFrameRate: number;
  defaultDuration: number;
} {
  const frames = loadAnimationFrames(type);
  const frameCount = frames.length;
  const defaultFrameRate = 30; // 30 FPS padrão
  const defaultDuration = (frameCount / defaultFrameRate) * 1000; // em milissegundos
  
  return {
    frameCount,
    defaultFrameRate,
    defaultDuration,
  };
}

/**
 * Obtém frame específico de uma animação
 */
export function getAnimationFrame(type: AnimationType, frameIndex: number): any {
  const frames = loadAnimationFrames(type);
  if (frameIndex < 0 || frameIndex >= frames.length) {
    console.warn(`Frame index ${frameIndex} out of bounds for animation '${type}'`);
    return null;
  }
  return frames[frameIndex];
}