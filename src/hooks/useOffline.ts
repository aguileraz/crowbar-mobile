import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import logger from '../services/loggerService';
import {
  selectIsOnline,
  selectNetworkInfo,
  selectSyncStatus,
  selectPendingActions,
  selectCacheStatus,
  selectCanSync,
  syncOfflineData,
  addPendingAction,
} from '../store/slices/offlineSlice';
import offlineService, { CacheStrategy, SyncPriority } from '../services/offlineService';

/**
 * Hook principal para funcionalidades offline
 * Fornece acesso a todas as funcionalidades offline de forma simplificada
 */
export const useOffline = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isOnline = useSelector(selectIsOnline);
  const networkInfo = useSelector(selectNetworkInfo);
  const syncStatus = useSelector(selectSyncStatus);
  const pendingActions = useSelector(selectPendingActions);
  const cacheStatus = useSelector(selectCacheStatus);
  const canSync = useSelector(selectCanSync);

  // Sincronizar dados
  const sync = useCallback(
    async (force = false) => {
      try {
        const _result = await dispatch(syncOfflineData(force)).unwrap();
        return _result;
      } catch (error) {
        logger.error('Erro ao sincronizar:', error);
        throw error;
      }
    },
    [dispatch]
  );

  // Adicionar ação para execução quando voltar online
  const addOfflineAction = useCallback(
    async (type: string, data: any, _priority: SyncPriority = SyncPriority.NORMAL) => {
      try {
        await dispatch(addPendingAction({ type, data })).unwrap();
        
        // Se online, tentar executar imediatamente
        if (isOnline) {
          await sync();
        }
      } catch (error) {
        logger.error('Erro ao adicionar ação offline:', error);
        throw error;
      }
    },
    [dispatch, isOnline, sync]
  );

  // Verificar se está no modo offline
  const isOfflineMode = useCallback(() => {
    return offlineService.isOfflineMode();
  }, []);

  // Limpar cache
  const clearCache = useCallback(async (cacheType?: string) => {
    try {
      await offlineService.clearCache(cacheType);
    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
      throw error;
    }
  }, []);

  return {
    // Estados
    isOnline,
    networkInfo,
    syncStatus,
    pendingActions,
    cacheStatus,
    canSync,
    
    // Métodos
    sync,
    addOfflineAction,
    isOfflineMode,
    clearCache,
    
    // Flags úteis
    isSyncing: syncStatus === 'syncing',
    hasPendingActions: pendingActions.length > 0,
    lastSyncError: syncStatus === 'error',
  };
};

/**
 * Hook para cache de dados com estratégias
 */
export const useOfflineCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    strategy?: CacheStrategy;
    priority?: SyncPriority;
    autoFetch?: boolean;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isOnline = useSelector(selectIsOnline);

  const {
    strategy = CacheStrategy.CACHE_FIRST,
    _priority = SyncPriority.NORMAL,
    autoFetch = true,
  } = options || {};

  // Buscar dados
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const _result = await offlineService.getCachedData(
        key,
        strategy,
        fetcher
      );

      setData(_result);
      return _result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, strategy, fetcher]);

  // Atualizar cache
  const updateCache = useCallback(
    async (newData: T) => {
      try {
        await offlineService.cacheData(_key, newData, priority, strategy);
        setData(newData);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [priority, strategy]
  );

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  // Refetch quando voltar online
  useEffect(() => {
    if (isOnline && strategy === CacheStrategy.NETWORK_FIRST) {
      fetch();
    }
  }, [isOnline, strategy, fetch]);

  return {
    data,
    loading,
    error,
    fetch,
    updateCache,
    isFromCache: !isOnline || strategy === CacheStrategy.CACHE_FIRST,
  };
};

/**
 * Hook para cache de imagens
 */
export const useOfflineImage = (url: string | null, _priority: SyncPriority = SyncPriority.LOW) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setCachedUrl(null);
      return;
    }

    const cacheImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const cached = await offlineService.cacheImage(url, priority);
        setCachedUrl(cached);
      } catch (err) {
        setError(err as Error);
        setCachedUrl(url); // Fallback para URL original
      } finally {
        setLoading(false);
      }
    };

    cacheImage();
  }, [url, priority]);

  return {
    uri: cachedUrl || url,
    loading,
    error,
    isFromCache: cachedUrl !== url,
  };
};

/**
 * Hook para executar ações com suporte offline
 */
export const useOfflineAction = <T = any>(
  actionType: string,
  executor: (data: any) => Promise<T>,
  options?: {
    priority?: SyncPriority;
    optimisticUpdate?: (data: any) => void;
    onSuccess?: (_result: T) => void;
    onError?: (error: Error) => void;
  }
) => {
  const { isOnline } = useOffline();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const {
    _priority = SyncPriority.NORMAL,
    optimisticUpdate,
    onSuccess,
    onError,
  } = options || {};

  const execute = useCallback(
    async (data: any) => {
      setLoading(true);
      setError(null);

      try {
        // Atualização otimista
        if (optimisticUpdate) {
          optimisticUpdate(data);
        }

        if (isOnline) {
          // Executar ação imediatamente
          const _result = await executor(data);
          if (onSuccess) onSuccess(_result);
          return _result;
        } else {
          // Adicionar à fila offline
          await dispatch(
            addPendingAction({
              type: actionType,
              data,
            })
          ).unwrap();
          
          // Simular sucesso para UX
          if (onSuccess) onSuccess({} as T);
          return {} as T;
        }
      } catch (err) {
        const errorObj = err as Error;
        setError(errorObj);
        if (onError) onError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [isOnline, actionType, executor, dispatch, optimisticUpdate, onSuccess, onError]
  );

  return {
    execute,
    loading,
    error,
    isOffline: !isOnline,
  };
};

/**
 * Hook para sincronização diferencial
 */
export const useOfflineDiffSync = <T extends { id?: string; _id?: string }>(
  dataType: string,
  currentData: T[]
) => {
  const [changes, setChanges] = useState<{
    added: T[];
    modified: T[];
    deleted: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateDiff = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const diff = await offlineService.syncDifferential(dataType, currentData);
      setChanges(diff as any);
      return diff;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataType, currentData]);

  useEffect(() => {
    calculateDiff();
  }, [calculateDiff]);

  return {
    changes,
    loading,
    error,
    hasChanges: changes ? 
      (changes.added.length > 0 || changes.modified.length > 0 || changes.deleted.length > 0) : 
      false,
  };
};

/**
 * Hook específico para dados de boxes offline
 */
export const useOfflineBoxes = () => {
  const {data, loading, error: _error, fetch} = useOfflineCache(
    'offline_boxes',
    async () => {
      // Simular chamada para API (commented out for testing)
      return [];
    },
    {
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      priority: SyncPriority.NORMAL,
    }
  );

  return {
    boxes: data || [],
    loading,
    error,
    refresh: fetch,
  };
};

/**
 * Hook específico para carrinho offline
 */
export const useOfflineCart = () => {
  const {addOfflineAction: _addOfflineAction} = useOffline();
  
  const addToCart = useOfflineAction(
    'ADD_TO_CART',
    async (_data: { boxId: string; quantity: number }) => {
      // Simular adição ao carrinho
      // return await cartService.addToCart(data.boxId, data.quantity);
      return { success: true };
    },
    {
      priority: SyncPriority.CRITICAL,
      optimisticUpdate: (data) => {
        logger.debug('Adicionando ao carrinho (otimista):', data);
      },
    }
  );

  const removeFromCart = useOfflineAction(
    'REMOVE_FROM_CART',
    async (_data: { itemId: string }) => {
      // Simular remoção do carrinho
      // return await cartService.removeFromCart(data.itemId);
      return { success: true };
    },
    {
      priority: SyncPriority.CRITICAL,
      optimisticUpdate: (data) => {
        logger.debug('Removendo do carrinho (otimista):', data);
      },
    }
  );

  return {
    addToCart: addToCart.execute,
    removeFromCart: removeFromCart.execute,
    isLoading: addToCart.loading || removeFromCart.loading,
    error: addToCart.error || removeFromCart.error,
  };
};

/**
 * Hook específico para perfil offline
 */
export const useOfflineProfile = () => {
  const {data, loading, error: _error, fetch} = useOfflineCache(
    'offline_user_profile',
    async () => {
      // Simular busca de perfil
      // return await userService.getProfile();
      return null;
    },
    {
      strategy: CacheStrategy.CACHE_FIRST,
      priority: SyncPriority.HIGH,
    }
  );

  const updateProfile = useOfflineAction(
    'UPDATE_PROFILE',
    async (_profileData: any) => {
      // Simular atualização de perfil
      // return await userService.updateProfile(profileData);
      return { success: true };
    },
    {
      priority: SyncPriority.HIGH,
      optimisticUpdate: (profileData) => {
        logger.debug('Atualizando perfil (otimista):', profileData);
      },
    }
  );

  return {
    profile: data,
    loading,
    error,
    refresh: fetch,
    updateProfile: updateProfile.execute,
    isUpdating: updateProfile.loading,
    updateError: updateProfile.error,
  };
};

export default useOffline;