/**
 * Gamification Asset Manager
 * Gerencia carregamento, cache e otimização de assets de gamificação
 */

import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameAsset,
  EmojiReactionType,
  GameThemeType,
  GamificationAssetConfig,
  EMOJI_ASSETS,
  THEME_ASSETS
} from '../types/animations';

interface CacheEntry {
  asset: GameAsset;
  loadedFrames: Map<number, any>;
  lastAccessed: number;
  preloaded: boolean;
  memorySize: number;
}

interface LoadingJob {
  assetId: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  startTime: number;
  estimatedTimeRemaining: number;
}

class GamificationAssetManager {
  private static instance: GamificationAssetManager;
  private cache = new Map<string, CacheEntry>();
  private loadingJobs = new Map<string, LoadingJob>();
  private config: GamificationAssetConfig;
  private memoryUsage = 0;
  private maxMemoryUsage: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      version: '1.0.0',
      compressionEnabled: true,
      cacheStrategy: 'hybrid',
      preloadOnAppStart: ['emoji_lingua', 'emoji_cool'],
      lazyLoadThreshold: 5, // MB
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      cleanupInterval: 60000 // 1 minuto
    };
    this.maxMemoryUsage = this.config.maxMemoryUsage;
    this.startMemoryCleanup();
  }

  static getInstance(): GamificationAssetManager {
    if (!GamificationAssetManager.instance) {
      GamificationAssetManager.instance = new GamificationAssetManager();
    }
    return GamificationAssetManager.instance;
  }

  /**
   * Inicializa o gerenciador e pré-carrega assets essenciais
   */
  async initialize(): Promise<void> {
    
    try {
      // Carregar configuração salva
      await this.loadConfig();
      
      // Pré-carregar assets essenciais
      await this.preloadEssentialAssets();
      
    } catch (error) {
      // console.error('❌ Erro ao inicializar Asset Manager:', error);
      throw error;
    }
  }

  /**
   * Carrega configuração do AsyncStorage
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('gamification_asset_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      // console.warn('Erro ao carregar configuração salva:', error);
    }
  }

  /**
   * Salva configuração no AsyncStorage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('gamification_asset_config', JSON.stringify(this.config));
    } catch (error) {
      // console.warn('Erro ao salvar configuração:', error);
    }
  }

  /**
   * Pré-carrega assets essenciais
   */
  private async preloadEssentialAssets(): Promise<void> {
    const essentialAssets = this.config.preloadOnAppStart;
    const promises = essentialAssets.map(assetId => this.preloadAsset(assetId));
    
    await Promise.allSettled(promises);
  }

  /**
   * Pré-carrega um asset específico
   */
  async preloadAsset(assetId: string): Promise<void> {
    if (this.cache.has(assetId)) {
      return; // Já carregado
    }

    const asset = this.findAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset não encontrado: ${assetId}`);
    }

    
    // Criar entrada no cache
    const cacheEntry: CacheEntry = {
      asset,
      loadedFrames: new Map(),
      lastAccessed: Date.now(),
      preloaded: true,
      memorySize: 0
    };

    // Carregar frames com limite inteligente
    const framesToLoad = this.calculateFramesToPreload(asset);
    
    for (let i = 0; i < framesToLoad; i++) {
      const frameIndex = asset.startIndex + i;
      const framePath = this.getFramePath(asset, frameIndex);
      
      try {
        const frameSize = await this.loadFrame(framePath);
        cacheEntry.loadedFrames.set(frameIndex, framePath);
        cacheEntry.memorySize += frameSize;
        this.memoryUsage += frameSize;
      } catch (error) {
        // console.warn(`Erro ao carregar frame ${frameIndex} do asset ${assetId}:`, error);
      }
    }

    this.cache.set(assetId, cacheEntry);
  }

  /**
   * Calcula quantos frames pré-carregar baseado na prioridade e memória disponível
   */
  private calculateFramesToPreload(asset: GameAsset): number {
    const availableMemory = this.maxMemoryUsage - this.memoryUsage;
    const averageFrameSize = asset.estimatedSize * 1024 / asset.frameCount;
    const maxFramesByMemory = Math.floor(availableMemory / averageFrameSize);
    
    // Baseado na prioridade
    let baseFrames: number;
    switch (asset.preloadPriority) {
      case 'high':
        baseFrames = Math.min(asset.frameCount, 15);
        break;
      case 'medium':
        baseFrames = Math.min(asset.frameCount, 8);
        break;
      case 'low':
        baseFrames = Math.min(asset.frameCount, 3);
        break;
    }

    return Math.min(baseFrames, maxFramesByMemory, asset.frameCount);
  }

  /**
   * Carrega um emoji para uso imediato
   */
  async loadEmojiAsset(type: EmojiReactionType): Promise<string[]> {
    const asset = EMOJI_ASSETS[type];
    if (!asset) {
      throw new Error(`Emoji asset não encontrado: ${type}`);
    }

    return this.loadAssetFrames(asset.id);
  }

  /**
   * Carrega assets de um tema específico
   */
  async loadThemeAssets(theme: GameThemeType): Promise<Record<string, string[]>> {
    const themeAssets = THEME_ASSETS[theme];
    if (!themeAssets) {
      throw new Error(`Tema não encontrado: ${theme}`);
    }

    const results: Record<string, string[]> = {};
    
    // Carregar assets em ordem de prioridade
    const sortedAssets = Object.values(themeAssets).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.preloadPriority] - priorityOrder[a.preloadPriority];
    });

    for (const asset of sortedAssets) {
      try {
        results[asset.type] = await this.loadAssetFrames(asset.id);
      } catch (error) {
        // console.error(`Erro ao carregar asset ${asset.id}:`, error);
        results[asset.type] = [];
      }
    }

    return results;
  }

  /**
   * Carrega todos os frames de um asset
   */
  private async loadAssetFrames(assetId: string): Promise<string[]> {
    let cacheEntry = this.cache.get(assetId);
    
    if (!cacheEntry) {
      const asset = this.findAssetById(assetId);
      if (!asset) {
        throw new Error(`Asset não encontrado: ${assetId}`);
      }

      cacheEntry = {
        asset,
        loadedFrames: new Map(),
        lastAccessed: Date.now(),
        preloaded: false,
        memorySize: 0
      };
      
      this.cache.set(assetId, cacheEntry);
    }

    // Atualizar último acesso
    cacheEntry.lastAccessed = Date.now();

    const frames: string[] = [];
    const { asset } = cacheEntry;

    // Carregar frames que ainda não estão em cache
    for (let i = 0; i < asset.frameCount; i++) {
      const frameIndex = asset.startIndex + i;
      
      if (cacheEntry.loadedFrames.has(frameIndex)) {
        frames.push(cacheEntry.loadedFrames.get(frameIndex));
      } else {
        const framePath = this.getFramePath(asset, frameIndex);
        
        try {
          const frameSize = await this.loadFrame(framePath);
          cacheEntry.loadedFrames.set(frameIndex, framePath);
          cacheEntry.memorySize += frameSize;
          this.memoryUsage += frameSize;
          frames.push(framePath);
        } catch (error) {
          // console.warn(`Erro ao carregar frame ${frameIndex}:`, error);
          // Usar placeholder ou frame anterior
          frames.push(frames[frames.length - 1] || '');
        }
      }
    }

    return frames;
  }

  /**
   * Gera o caminho do frame
   */
  private getFramePath(asset: GameAsset, frameIndex: number): string {
    const paddedIndex = frameIndex.toString().padStart(5, '0');
    return `${asset.basePath}/${asset.framePrefix}${paddedIndex}.${asset.frameExtension}`;
  }

  /**
   * Carrega um frame individual
   */
  private async loadFrame(framePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        framePath,
        (width, height) => {
          // Estimar tamanho baseado nas dimensões
          const estimatedSize = width * height * 4; // RGBA
          resolve(estimatedSize);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Encontra asset por ID
   */
  private findAssetById(assetId: string): GameAsset | null {
    // Procurar em emoji assets
    for (const emoji of Object.values(EMOJI_ASSETS)) {
      if (emoji.id === assetId) {
        return emoji;
      }
    }

    // Procurar em theme assets
    for (const theme of Object.values(THEME_ASSETS)) {
      for (const asset of Object.values(theme)) {
        if (asset.id === assetId) {
          return asset;
        }
      }
    }

    return null;
  }

  /**
   * Limpa cache quando necessário
   */
  private async performMemoryCleanup(): Promise<void> {
    if (this.memoryUsage <= this.maxMemoryUsage * 0.8) {
      return; // Memória OK
    }

    
    // Ordenar por último acesso
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedMemory = 0;
    const targetFree = this.maxMemoryUsage * 0.3;

    for (const [assetId, entry] of entries) {
      if (freedMemory >= targetFree) break;
      
      // Não remover assets pré-carregados essenciais
      if (entry.preloaded && this.config.preloadOnAppStart.includes(assetId)) {
        continue;
      }

      // Remover frames mais antigos primeiro
      const framesToRemove = Math.ceil(entry.loadedFrames.size * 0.5);
      let removed = 0;
      
      for (const [frameIndex] of entry.loadedFrames) {
        if (removed >= framesToRemove) break;
        
        entry.loadedFrames.delete(frameIndex);
        removed++;
      }

      const freedFromAsset = entry.memorySize * 0.5;
      entry.memorySize -= freedFromAsset;
      this.memoryUsage -= freedFromAsset;
      freedMemory += freedFromAsset;

      // Se removeu todos os frames, remover entry
      if (entry.loadedFrames.size === 0) {
        this.cache.delete(assetId);
      }
    }

  }

  /**
   * Inicia limpeza automática de memória
   */
  private startMemoryCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Para limpeza automática
   */
  stopMemoryCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    return {
      totalAssets: this.cache.size,
      memoryUsage: this.memoryUsage,
      maxMemoryUsage: this.maxMemoryUsage,
      memoryUsagePercent: (this.memoryUsage / this.maxMemoryUsage) * 100,
      activeJobs: this.loadingJobs.size,
      cacheEntries: Array.from(this.cache.entries()).map(([id, entry]) => ({
        id,
        framesLoaded: entry.loadedFrames.size,
        totalFrames: entry.asset.frameCount,
        memorySize: entry.memorySize,
        lastAccessed: entry.lastAccessed,
        preloaded: entry.preloaded
      }))
    };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<GamificationAssetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.maxMemoryUsage = this.config.maxMemoryUsage;
    this.saveConfig();

    // Reiniciar limpeza com novo intervalo
    if (newConfig.cleanupInterval) {
      this.startMemoryCleanup();
    }
  }

  /**
   * Força limpeza completa do cache
   */
  clearCache(): void {
    this.cache.clear();
    this.memoryUsage = 0;
    this.loadingJobs.clear();
  }

  /**
   * Pré-aquece assets para um tema específico
   */
  async warmupTheme(theme: GameThemeType): Promise<void> {
    const themeAssets = THEME_ASSETS[theme];
    if (!themeAssets) return;

    const priorityAssets = Object.values(themeAssets)
      .filter(asset => asset.preloadPriority === 'high')
      .map(asset => asset.id);

    const promises = priorityAssets.map(assetId => this.preloadAsset(assetId));
    await Promise.allSettled(promises);
  }

  /**
   * Destruir instância (para testes)
   */
  destroy(): void {
    this.stopMemoryCleanup();
    this.clearCache();
  }
}

export default GamificationAssetManager.getInstance();