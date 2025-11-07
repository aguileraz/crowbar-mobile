import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import LZString from 'lz-string';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { store } from '../store';
import { setNetworkStatus, updateCacheStatus } from '../store/slices/offlineSlice';
import { boxService } from './boxService';
import { userService } from './userService';
import { cartService } from './cartService';
import logger from './loggerService';

/**
 * Serviço avançado para gerenciamento de funcionalidades offline
 * 
 * Funcionalidades:
 * - Detecção real de rede com @react-native-community/netinfo
 * - Cache inteligente com estratégias de invalidação
 * - Compressão de dados com lz-string
 * - Sincronização diferencial (apenas mudanças)
 * - Priorização de sincronização
 * - Cache de imagens com gestão eficiente
 * - Modo offline completo
 */

// Tipos para priorização
export enum SyncPriority {
  CRITICAL = 1,  // Dados críticos (carrinho, pedidos)
  HIGH = 2,      // Dados importantes (perfil, favoritos)
  NORMAL = 3,    // Dados normais (boxes, categorias)
  LOW = 4,       // Dados menos importantes (reviews, analytics)
}

// Interface para cache metadata
interface CacheMetadata {
  version: string;
  timestamp: number;
  hash: string;
  compressed: boolean;
  size: number;
  priority: SyncPriority;
}

// Interface para ação pendente
interface PendingAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: SyncPriority;
}

// Estratégias de cache
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',      // Sempre usa cache se disponível
  NETWORK_FIRST = 'network-first',  // Tenta rede primeiro, cache como fallback
  CACHE_ONLY = 'cache-only',        // Apenas cache
  NETWORK_ONLY = 'network-only',    // Apenas rede
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate', // Retorna cache e atualiza em background
}

class OfflineService {
  private readonly CACHE_KEYS = {
    BOXES: 'offline_boxes',
    CATEGORIES: 'offline_categories',
    USER_PROFILE: 'offline_user_profile',
    CART: 'offline_cart',
    PENDING_ACTIONS: 'offline_pending_actions',
    CACHE_METADATA: 'offline_cache_metadata',
    SYNC_STATE: 'offline_sync_state',
    IMAGE_CACHE: 'offline_image_cache',
    DIFF_SYNC: 'offline_diff_sync',
  };

  private readonly CACHE_VERSION = '1.0.0';
  private readonly IMAGE_CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/crowbar_images`;
  
  private networkUnsubscribe: (() => void) | null = null;
  private syncQueue: Map<string, PendingAction> = new Map();
  private isSyncing = false;

  /**
   * Inicializar serviço offline avançado
   */
  async initialize(): Promise<any> {
    try {
      // Configurar listener de rede real
      this.setupNetworkListener();
      
      // Criar diretório de cache de imagens
      await this.setupImageCache();
      
      // Carregar metadados de cache
      const cacheStatus = await this.getCacheStatus();
      
      // Carregar ações pendentes
      const pendingActions = await this.getPendingActions();
      
      // Configurar sincronização automática
      this.setupAutoSync();
      
      // Limpar cache antigo
      await this.cleanupOldCache();
      
      return {
        cacheStatus,
        pendingActions,
        networkState: await NetInfo.fetch(),
      };
    } catch (error) {
      logger.error('Erro ao inicializar serviço offline:', error);
      throw error;
    }
  }

  /**
   * Configurar listener de rede real com NetInfo
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !store.getState().offline?.isOnline;
      const isNowOnline = state.isConnected && state.isInternetReachable !== false;
      
      // Atualizar status no Redux
      store.dispatch(setNetworkStatus({
        isOnline: isNowOnline,
        networkInfo: {
          type: state.type,
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          details: state.details,
        },
      }));
      
      // Se voltou online, processar ações pendentes
      if (wasOffline && isNowOnline) {
        this.processPendingActionsInBackground();
      }
    });
  }

  /**
   * Configurar diretório de cache de imagens
   */
  private async setupImageCache(): Promise<void> {
    try {
      const exists = await ReactNativeBlobUtil.fs.exists(this.IMAGE_CACHE_DIR);
      if (!exists) {
        await ReactNativeBlobUtil.fs.mkdir(this.IMAGE_CACHE_DIR);
      }
    } catch (error) {
      logger.error('Erro ao criar diretório de cache de imagens:', error);
    }
  }

  /**
   * Configurar sincronização automática
   */
  private setupAutoSync(): void {
    // Sincronização periódica a cada 5 minutos quando online
    setInterval(async () => {
      const state = store.getState();
      if (state.offline?.isOnline && state.offline?.settings?.autoSync) {
        await this.syncInBackground();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Comprimir dados antes de armazenar
   */
  private compressData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return LZString.compressToUTF16(jsonString);
    } catch (error) {
      logger.error('Erro ao comprimir dados:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Descomprimir dados do cache
   */
  private decompressData(compressed: string): any {
    try {
      const decompressed = LZString.decompressFromUTF16(compressed);
      return decompressed ? JSON.parse(decompressed) : null;
    } catch (error) {
      logger.error('Erro ao descomprimir dados:', error);
      return null;
    }
  }

  /**
   * Gerar hash para verificação de mudanças
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte para 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Cache inteligente com estratégia
   */
  async cacheData(
    key: string,
    data: any,
    priority: SyncPriority = SyncPriority.NORMAL,
    _strategy: CacheStrategy = CacheStrategy.NETWORK_FIRST
  ): Promise<void> {
    try {
      const compressed = this.compressData(data);
      const metadata: CacheMetadata = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        hash: this.generateHash(data),
        compressed: true,
        size: compressed.length,
        priority,
      };
      
      // Armazenar dados comprimidos
      await AsyncStorage.setItem(key, compressed);
      
      // Armazenar metadados
      await AsyncStorage.setItem(
        `${key}_metadata`,
        JSON.stringify(metadata)
      );
      
      // Atualizar status no Redux
      store.dispatch(updateCacheStatus({
        type: this.getCacheTypeFromKey(key),
        data: {
          lastUpdated: Date.now(),
          size: compressed.length,
        },
      }));
    } catch (error) {
      logger.error('Erro ao cachear dados:', error);
      throw error;
    }
  }

  /**
   * Recuperar dados do cache com estratégia
   */
  async getCachedData<T>(
    key: string,
    strategy: CacheStrategy = CacheStrategy.CACHE_FIRST,
    fetcher?: () => Promise<T>
  ): Promise<T | null> {
    try {
      // Se estratégia é NETWORK_ONLY e temos fetcher
      if (strategy === CacheStrategy.NETWORK_ONLY && fetcher) {
        return await fetcher();
      }
      
      // Verificar cache
      const cached = await AsyncStorage.getItem(key);
      const metadataStr = await AsyncStorage.getItem(`${key}_metadata`);
      
      if (!cached || !metadataStr) {
        // Se não tem cache e estratégia permite, buscar da rede
        if (fetcher && strategy !== CacheStrategy.CACHE_ONLY) {
          const freshData = await fetcher();
          await this.cacheData(_key, freshData);
          return freshData;
        }
        return null;
      }
      
      const metadata: CacheMetadata = JSON.parse(metadataStr);
      const decompressed = this.decompressData(cached);
      
      // Verificar validade do cache
      const now = Date.now();
      const maxAge = this.getMaxAgeForPriority(metadata.priority);
      const isExpired = (now - metadata.timestamp) > maxAge;
      
      // Estratégia STALE_WHILE_REVALIDATE
      if (strategy === CacheStrategy.STALE_WHILE_REVALIDATE && fetcher) {
        // Retornar cache imediatamente
        if (decompressed) {
          // Atualizar em background se expirado
          if (isExpired) {
            this.updateInBackground(_key, fetcher);
          }
          return decompressed;
        }
      }
      
      // Estratégia NETWORK_FIRST
      if (strategy === CacheStrategy.NETWORK_FIRST && fetcher) {
        try {
          const freshData = await fetcher();
          await this.cacheData(_key, freshData);
          return freshData;
        } catch (error) {
          // Em caso de erro, usar cache se disponível
          return decompressed;
        }
      }
      
      // Estratégia CACHE_FIRST (padrão)
      if (!isExpired && decompressed) {
        return decompressed;
      }
      
      // Cache expirado, tentar buscar novos dados
      if (fetcher && strategy !== CacheStrategy.CACHE_ONLY) {
        try {
          const freshData = await fetcher();
          await this.cacheData(_key, freshData);
          return freshData;
        } catch (error) {
          // Em caso de erro, retornar cache expirado
          return decompressed;
        }
      }
      
      return decompressed;
    } catch (error) {
      logger.error('Erro ao recuperar dados do cache:', error);
      return null;
    }
  }

  /**
   * Atualizar cache em background
   */
  private async updateInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    try {
      const freshData = await fetcher();
      await this.cacheData(_key, freshData);
    } catch (error) {
      logger.error('Erro ao atualizar cache em background:', error);
    }
  }

  /**
   * Obter tempo máximo de cache baseado na prioridade
   */
  private getMaxAgeForPriority(priority: SyncPriority): number {
    switch (priority) {
      case SyncPriority.CRITICAL:
        return 1 * 60 * 60 * 1000; // 1 hora
      case SyncPriority.HIGH:
        return 6 * 60 * 60 * 1000; // 6 horas
      case SyncPriority.NORMAL:
        return 24 * 60 * 60 * 1000; // 24 horas
      case SyncPriority.LOW:
        return 7 * 24 * 60 * 60 * 1000; // 7 dias
      default:
        return 24 * 60 * 60 * 1000; // 24 horas padrão
    }
  }

  /**
   * Cache de imagem com gestão eficiente
   */
  async cacheImage(url: string, priority: SyncPriority = SyncPriority.LOW): Promise<string> {
    try {
      const filename = this.generateHash(url) + '.jpg';
      const filepath = `${this.IMAGE_CACHE_DIR}/${filename}`;
      
      // Verificar se já está em cache
      const exists = await ReactNativeBlobUtil.fs.exists(filepath);
      if (exists) {
        // Verificar idade do cache
        const stat = await ReactNativeBlobUtil.fs.stat(filepath);
        const age = Date.now() - parseInt(stat.lastModified, 10);
        const maxAge = this.getMaxAgeForPriority(priority);
        
        if (age < maxAge) {
          return `file://${filepath}`;
        }
      }
      
      // Baixar imagem
      const _response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filepath,
      }).fetch('GET', url);
      
      // Registrar no índice de cache
      await this.updateImageCacheIndex(url, filepath, priority);
      
      return `file://${filepath}`;
    } catch (error) {
      logger.error('Erro ao cachear imagem:', error);
      return url; // Retornar URL original em caso de erro
    }
  }

  /**
   * Atualizar índice de cache de imagens
   */
  private async updateImageCacheIndex(url: string, filepath: string, priority: SyncPriority): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(this.CACHE_KEYS.IMAGE_CACHE);
      const _index = indexStr ? JSON.parse(indexStr) : {};
      
      index[url] = {
        filepath,
        timestamp: Date.now(),
        priority,
      };
      
      await AsyncStorage.setItem(this.CACHE_KEYS.IMAGE_CACHE, JSON.stringify(_index));
    } catch (error) {
      logger.error('Erro ao atualizar índice de cache de imagens:', error);
    }
  }

  /**
   * Limpar cache de imagens antigas
   */
  async cleanupImageCache(): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(this.CACHE_KEYS.IMAGE_CACHE);
      if (!indexStr) return;
      
      const _index = JSON.parse(indexStr);
      const now = Date.now();
      const updatedIndex: any = {};
      
      for (const [url, data] of Object.entries(_index)) {
        const { filepath, timestamp, priority } = data as any;
        const age = now - timestamp;
        const maxAge = this.getMaxAgeForPriority(priority);
        
        if (age > maxAge) {
          // Remover arquivo
          try {
            await ReactNativeBlobUtil.fs.unlink(filepath);
          } catch (error) {
            logger.warn('Erro ao remover imagem do cache:', error);
          }
        } else {
          updatedIndex[url] = data;
        }
      }
      
      await AsyncStorage.setItem(this.CACHE_KEYS.IMAGE_CACHE, JSON.stringify(updatedIndex));
    } catch (error) {
      logger.error('Erro ao limpar cache de imagens:', error);
    }
  }

  /**
   * Sincronização diferencial - apenas mudanças
   */
  async syncDifferential(dataType: string, currentData: any[]): Promise<any[]> {
    try {
      // Obter estado de sincronização anterior
      const syncStateStr = await AsyncStorage.getItem(this.CACHE_KEYS.SYNC_STATE);
      const syncState = syncStateStr ? JSON.parse(syncStateStr) : {};
      
      const lastSync = syncState[dataType] || { timestamp: 0, hashes: {} };
      
      // Gerar hashes atuais
      const currentHashes: { [key: string]: string } = {};
      currentData.forEach(item => {
        const id = item.id || item._id;
        if (id) {
          currentHashes[id] = this.generateHash(item);
        }
      });
      
      // Identificar mudanças
      const changes = {
        added: [] as any[],
        modified: [] as any[],
        deleted: [] as string[],
      };
      
      // Itens adicionados ou modificados
      currentData.forEach(item => {
        const id = item.id || item._id;
        if (!id) return;
        
        if (!lastSync.hashes[id]) {
          changes.added.push(item);
        } else if (lastSync.hashes[id] !== currentHashes[id]) {
          changes.modified.push(item);
        }
      });
      
      // Itens deletados
      Object.keys(lastSync.hashes).forEach(id => {
        if (!currentHashes[id]) {
          changes.deleted.push(id);
        }
      });
      
      // Atualizar estado de sincronização
      syncState[dataType] = {
        timestamp: Date.now(),
        hashes: currentHashes,
      };
      await AsyncStorage.setItem(this.CACHE_KEYS.SYNC_STATE, JSON.stringify(syncState));
      
      return changes;
    } catch (error) {
      logger.error('Erro na sincronização diferencial:', error);
      throw error;
    }
  }

  /**
   * Adicionar ação pendente com prioridade
   */
  async addPendingAction(
    action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>,
    priority: SyncPriority = SyncPriority.NORMAL
  ): Promise<void> {
    try {
      const pendingAction: PendingAction = {
        ...action,
        id: Date.now().toString() + Math.random().toString(36),
        timestamp: Date.now(),
        retryCount: 0,
        priority,
      };
      
      // Adicionar à fila de sincronização
      this.syncQueue.set(pendingAction.id, pendingAction);
      
      // Persistir
      const existing = await this.getPendingActions();
      const updated = [...existing, pendingAction].sort((a, b) => a.priority - b.priority);
      
      await AsyncStorage.setItem(this.CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
      
      // Tentar processar imediatamente se online
      const state = store.getState();
      if (state.offline?.isOnline) {
        this.processPendingActionsInBackground();
      }
    } catch (error) {
      logger.error('Erro ao adicionar ação pendente:', error);
      throw error;
    }
  }

  /**
   * Processar ações pendentes em background
   */
  private async processPendingActionsInBackground(): Promise<void> {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      await this.processPendingActions();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Processar ações pendentes com priorização
   */
  async processPendingActions(): Promise<{ processedActions: any[]; remainingActions: any[] }> {
    try {
      const pendingActions = await this.getPendingActions();
      const processedActions: any[] = [];
      const remainingActions: any[] = [];
      
      // Ordenar por prioridade
      const sortedActions = pendingActions.sort((a, b) => a.priority - b.priority);
      
      for (const action of sortedActions) {
        try {
          await this.executeAction(action);
          processedActions.push(action);
          this.syncQueue.delete(action.id);
        } catch (error) {
          logger.error('Erro ao processar ação:', action, error);
          
          // Incrementar contador de tentativas
          action.retryCount = (action.retryCount || 0) + 1;
          
          // Manter ação se ainda tem tentativas
          const maxRetries = action.priority === SyncPriority.CRITICAL ? 5 : 3;
          if (action.retryCount < maxRetries) {
            remainingActions.push(action);
          } else {
            logger.warn('Máximo de tentativas atingido para ação:', action);
          }
        }
      }
      
      // Atualizar ações pendentes
      await AsyncStorage.setItem(this.CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(remainingActions));
      
      return { processedActions, remainingActions };
    } catch (error) {
      logger.error('Erro ao processar ações pendentes:', error);
      throw error;
    }
  }

  /**
   * Executar uma ação pendente
   */
  private async executeAction(action: PendingAction): Promise<void> {
    switch (action.type) {
      case 'ADD_TO_CART':
        await cartService.addToCart(action.data.boxId, action.data.quantity);
        break;
      case 'UPDATE_CART_ITEM':
        await cartService.updateCartItem(action.data.itemId, action.data.quantity);
        break;
      case 'REMOVE_FROM_CART':
        await cartService.removeFromCart(action.data.itemId);
        break;
      case 'UPDATE_PROFILE':
        await userService.updateProfile(action.data);
        break;
      case 'CREATE_ORDER':
        // await orderService.createOrder(action.data);
        break;
      case 'ADD_FAVORITE':
        // await favoritesService.addFavorite(action.data.boxId);
        break;
      case 'REMOVE_FAVORITE':
        // await favoritesService.removeFavorite(action.data.boxId);
        break;
      case 'ADD_REVIEW':
        // await reviewService.addReview(action.data);
        break;
      default:
        logger.warn('Tipo de ação desconhecido:', action.type);
    }
  }

  /**
   * Sincronizar dados com estratégia inteligente
   */
  async syncData(force: boolean = false): Promise<any> {
    try {
      const state = store.getState();
      const isOnline = state.offline?.isOnline;
      const settings = state.offline?.settings;
      
      // Verificar condições de sincronização
      if (!isOnline && !force) {
        throw new Error('Sem conexão com a internet');
      }
      
      // Verificar se deve sincronizar apenas em WiFi
      if (settings?.syncOnWifiOnly && state.offline?.networkInfo?.type !== 'wifi' && !force) {
        throw new Error('Sincronização permitida apenas em WiFi');
      }
      
      // Processar ações pendentes primeiro
      await this.processPendingActions();
      
      // Sincronizar dados com priorização
      const syncResults: any = {};
      
      // Dados críticos primeiro
      const criticalData = await Promise.allSettled([
        this.syncCart(),
        this.syncUserProfile(),
      ]);
      
      syncResults.cart = criticalData[0].status;
      syncResults.userProfile = criticalData[1].status;
      
      // Dados normais
      const normalData = await Promise.allSettled([
        this.syncBoxes(),
        this.syncCategories(),
      ]);
      
      syncResults.boxes = normalData[0].status;
      syncResults.categories = normalData[1].status;
      
      // Atualizar status de cache
      const cacheStatus = await this.getCacheStatus();
      const pendingActions = await this.getPendingActions();
      
      return {
        cacheStatus,
        pendingActions,
        syncResults,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Erro ao sincronizar dados:', error);
      throw error;
    }
  }

  /**
   * Sincronizar boxes com cache inteligente
   */
  private async syncBoxes(): Promise<void> {
    try {
      const boxes = await this.getCachedData(
        this.CACHE_KEYS.BOXES,
        CacheStrategy.NETWORK_FIRST,
        async () => {
          const _response = await boxService.getBoxes();
          return _response.data;
        }
      );
      
      if (boxes) {
        await this.cacheData(this.CACHE_KEYS.BOXES, boxes, SyncPriority.NORMAL);
      }
    } catch (error) {
      logger.error('Erro ao sincronizar boxes:', error);
      throw error;
    }
  }

  /**
   * Sincronizar categorias
   */
  private async syncCategories(): Promise<void> {
    try {
      const categories = await this.getCachedData(
        this.CACHE_KEYS.CATEGORIES,
        CacheStrategy.NETWORK_FIRST,
        async () => await boxService.getCategories()
      );
      
      if (categories) {
        await this.cacheData(this.CACHE_KEYS.CATEGORIES, categories, SyncPriority.NORMAL);
      }
    } catch (error) {
      logger.error('Erro ao sincronizar categorias:', error);
      throw error;
    }
  }

  /**
   * Sincronizar perfil do usuário
   */
  private async syncUserProfile(): Promise<void> {
    try {
      const profile = await this.getCachedData(
        this.CACHE_KEYS.USER_PROFILE,
        CacheStrategy.NETWORK_FIRST,
        async () => await userService.getProfile()
      );
      
      if (profile) {
        await this.cacheData(this.CACHE_KEYS.USER_PROFILE, profile, SyncPriority.HIGH);
      }
    } catch (error) {
      logger.error('Erro ao sincronizar perfil:', error);
      throw error;
    }
  }

  /**
   * Sincronizar carrinho
   */
  private async syncCart(): Promise<void> {
    try {
      const cart = await this.getCachedData(
        this.CACHE_KEYS.CART,
        CacheStrategy.NETWORK_FIRST,
        async () => await cartService.getCart()
      );
      
      if (cart) {
        await this.cacheData(this.CACHE_KEYS.CART, cart, SyncPriority.CRITICAL);
      }
    } catch (error) {
      logger.error('Erro ao sincronizar carrinho:', error);
      throw error;
    }
  }

  /**
   * Sincronização em background
   */
  private async syncInBackground(): Promise<void> {
    try {
      await this.syncData();
      await this.cleanupOldCache();
      await this.cleanupImageCache();
    } catch (error) {
      logger.error('Erro na sincronização em background:', error);
    }
  }

  /**
   * Obter ações pendentes
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.PENDING_ACTIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      logger.error('Erro ao obter ações pendentes:', error);
      return [];
    }
  }

  /**
   * Limpar cache específico ou todo o cache
   */
  async clearCache(cacheType?: string): Promise<void> {
    try {
      if (cacheType) {
        // Limpar cache específico
        const key = this.CACHE_KEYS[cacheType.toUpperCase() as keyof typeof this.CACHE_KEYS];
        if (key) {
          await AsyncStorage.removeItem(key);
          await AsyncStorage.removeItem(`${key}_metadata`);
        }
      } else {
        // Limpar todo o cache
        const keys = Object.values(this.CACHE_KEYS);
        const keysWithMetadata = keys.flatMap(key => [key, `${key}_metadata`]);
        await AsyncStorage.multiRemove(keysWithMetadata);
        
        // Limpar cache de imagens
        try {
          await ReactNativeBlobUtil.fs.unlink(this.IMAGE_CACHE_DIR);
          await this.setupImageCache();
        } catch (error) {
          logger.warn('Erro ao limpar cache de imagens:', error);
        }
      }
    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
      throw error;
    }
  }

  /**
   * Obter status do cache
   */
  async getCacheStatus(): Promise<any> {
    try {
      const cacheStatus: any = {
        boxes: { lastUpdated: null, count: 0, size: 0 },
        categories: { lastUpdated: null, count: 0 },
        user: { lastUpdated: null },
        cart: { lastUpdated: null },
        totalSize: 0,
        imageCache: { count: 0, size: 0 },
      };
      
      // Verificar cada cache
      for (const [type, key] of Object.entries(this.CACHE_KEYS)) {
        try {
          if (type === 'IMAGE_CACHE') {
            // Status especial para cache de imagens
            const indexStr = await AsyncStorage.getItem(key);
            if (indexStr) {
              const _index = JSON.parse(indexStr);
              cacheStatus.imageCache.count = Object.keys(_index).length;
            }
            continue;
          }
          
          const metadataStr = await AsyncStorage.getItem(`${key}_metadata`);
          if (metadataStr) {
            const metadata: CacheMetadata = JSON.parse(metadataStr);
            const cacheKey = type.toLowerCase() as keyof typeof cacheStatus;
            
            if (cacheStatus[cacheKey]) {
              cacheStatus[cacheKey].lastUpdated = metadata.timestamp;
              cacheStatus[cacheKey].size = metadata.size;
              cacheStatus.totalSize += metadata.size;
            }
          }
        } catch (error) {
          logger.warn(`Erro ao verificar cache para ${type}:`, error);
        }
      }
      
      // Calcular tamanho do cache de imagens
      try {
        const files = await ReactNativeBlobUtil.fs.ls(this.IMAGE_CACHE_DIR);
        for (const file of files) {
          const stat = await ReactNativeBlobUtil.fs.stat(`${this.IMAGE_CACHE_DIR}/${file}`);
          cacheStatus.imageCache.size += parseInt(stat._size, 10);
        }
        cacheStatus.totalSize += cacheStatus.imageCache.size;
      } catch (error) {
        logger.warn('Erro ao calcular tamanho do cache de imagens:', error);
      }
      
      return cacheStatus;
    } catch (error) {
      logger.error('Erro ao obter _status do cache:', error);
      throw error;
    }
  }

  /**
   * Limpar cache antigo
   */
  async cleanupOldCache(): Promise<void> {
    try {
      const now = Date.now();
      const settings = store.getState().offline?.settings;
      const maxCacheSize = settings?.maxCacheSize || 50 * 1024 * 1024; // 50MB padrão
      
      // Verificar tamanho total do cache
      const cacheStatus = await this.getCacheStatus();
      if (cacheStatus.totalSize > maxCacheSize) {
        // Limpar caches menos prioritários primeiro
        const priorities = [SyncPriority.LOW, SyncPriority.NORMAL, SyncPriority.HIGH];
        
        for (const priority of priorities) {
          if (cacheStatus.totalSize <= maxCacheSize) break;
          
          // Limpar caches com essa prioridade
          for (const [_type, key] of Object.entries(this.CACHE_KEYS)) {
            const metadataStr = await AsyncStorage.getItem(`${key}_metadata`);
            if (metadataStr) {
              const metadata: CacheMetadata = JSON.parse(metadataStr);
              if (metadata.priority === priority) {
                await AsyncStorage.removeItem(key);
                await AsyncStorage.removeItem(`${key}_metadata`);
                cacheStatus.totalSize -= metadata.size;
              }
            }
          }
        }
      }
      
      // Limpar caches expirados
      for (const key of Object.values(this.CACHE_KEYS)) {
        try {
          const metadataStr = await AsyncStorage.getItem(`${key}_metadata`);
          if (metadataStr) {
            const metadata: CacheMetadata = JSON.parse(metadataStr);
            const maxAge = this.getMaxAgeForPriority(metadata.priority);
            
            if ((now - metadata.timestamp) > maxAge) {
              await AsyncStorage.removeItem(key);
              await AsyncStorage.removeItem(`${key}_metadata`);
            }
          }
        } catch (error) {
          logger.warn(`Erro ao limpar cache para ${key}:`, error);
        }
      }
    } catch (error) {
      logger.error('Erro ao limpar cache antigo:', error);
    }
  }

  /**
   * Obter tipo de cache a partir da chave
   */
  private getCacheTypeFromKey(key: string): keyof typeof this.CACHE_KEYS {
    const entry = Object.entries(this.CACHE_KEYS).find(([_, value]) => value === key);
    return (entry?.[0]?.toLowerCase() || 'unknown') as keyof typeof this.CACHE_KEYS;
  }

  /**
   * Verificar se está no modo offline
   */
  isOfflineMode(): boolean {
    const state = store.getState();
    return !state.offline?.isOnline || false;
  }

  /**
   * Destruir serviço e limpar recursos
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    
    this.syncQueue.clear();
  }
}

// Exportar instância única
export const offlineService = new OfflineService();
export default offlineService;