import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  initializeOffline,
  syncOfflineData,
  addPendingAction,
  clearOfflineCache,
  selectIsOnline,
  selectSyncStatus,
  selectSyncError,
  selectCacheStatus,
  selectPendingActions,
  selectOfflineSettings,
  selectCanSync,
} from '../store/slices/offlineSlice';
import { offlineService } from '../services/offlineService';

/**
 * Hook personalizado para gerenciar funcionalidades offline
 */

interface UseOfflineOptions {
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

export const useOffline = (options: UseOfflineOptions = {}) => {
  const {
    autoSync = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const syncError = useSelector(selectSyncError);
  const cacheStatus = useSelector(selectCacheStatus);
  const pendingActions = useSelector(selectPendingActions);
  const settings = useSelector(selectOfflineSettings);
  const canSync = useSelector(selectCanSync);

  /**
   * Initialize offline functionality
   */
  const initialize = useCallback(async () => {
    try {
      await dispatch(initializeOffline()).unwrap();
    } catch (error) {
      console.error('Failed to initialize offline:', error);
    }
  }, [dispatch]);

  /**
   * Sync data with server
   */
  const sync = useCallback(async (force = false) => {
    try {
      await dispatch(syncOfflineData(force)).unwrap();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }, [dispatch]);

  /**
   * Add action to pending queue
   */
  const addToPendingQueue = useCallback(async (actionType: string, data: any) => {
    try {
      await dispatch(addPendingAction({ type: actionType, data })).unwrap();
    } catch (error) {
      console.error('Failed to add pending action:', error);
    }
  }, [dispatch]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(async (cacheType?: string) => {
    try {
      await dispatch(clearOfflineCache(cacheType)).unwrap();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [dispatch]);

  /**
   * Get cached data
   */
  const getCachedData = useCallback(async (dataType: string) => {
    try {
      switch (dataType) {
        case 'boxes':
          return await offlineService.getCachedBoxes();
        case 'categories':
          return await offlineService.getCachedCategories();
        case 'userProfile':
          return await offlineService.getCachedUserProfile();
        case 'cart':
          return await offlineService.getCachedCart();
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, []);

  /**
   * Cache data
   */
  const cacheData = useCallback(async (dataType: string, data: any) => {
    try {
      switch (dataType) {
        case 'boxes':
          await offlineService.cacheBoxes(data);
          break;
        case 'categories':
          await offlineService.cacheCategories(data);
          break;
        case 'userProfile':
          await offlineService.cacheUserProfile(data);
          break;
        case 'cart':
          await offlineService.cacheCart(data);
          break;
        default:
          console.warn('Unknown data type for caching:', dataType);
      }
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  /**
   * Check if data is cached and fresh
   */
  const isCacheFresh = useCallback((dataType: string, maxAge?: number): boolean => {
    const defaultMaxAge = settings.cacheExpiration;
    const ageLimit = maxAge || defaultMaxAge;
    
    const cache = cacheStatus[dataType as keyof typeof cacheStatus];
    if (!cache?.lastUpdated) return false;
    
    const age = Date.now() - cache.lastUpdated;
    return age < ageLimit;
  }, [cacheStatus, settings.cacheExpiration]);

  /**
   * Auto-sync when coming online
   */
  useEffect(() => {
    if (isOnline && autoSync && canSync && pendingActions.length > 0) {
      sync();
    }
  }, [isOnline, autoSync, canSync, pendingActions.length, sync]);

  /**
   * Periodic sync
   */
  useEffect(() => {
    if (!autoSync || !isOnline) return;

    const interval = setInterval(() => {
      if (canSync) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, isOnline, canSync, sync, syncInterval]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    isOnline,
    syncStatus,
    syncError,
    cacheStatus,
    pendingActions,
    settings,
    canSync,
    
    // Actions
    initialize,
    sync,
    addToPendingQueue,
    clearCache,
    getCachedData,
    cacheData,
    
    // Utilities
    isCacheFresh,
    hasPendingActions: pendingActions.length > 0,
    isSyncing: syncStatus === 'syncing',
    hasError: !!syncError,
  };
};

/**
 * Hook específico para dados de caixas offline
 */
export const useOfflineBoxes = () => {
  const { getCachedData, cacheData, isCacheFresh, isOnline } = useOffline();

  const getBoxes = useCallback(async (forceRefresh = false) => {
    // Try cache first if online or if cache is fresh
    if (!forceRefresh && (!isOnline || isCacheFresh('boxes'))) {
      const cached = await getCachedData('boxes');
      if (cached) return cached;
    }

    // If online, fetch fresh data
    if (isOnline) {
      try {
        // This would be the actual API call
        // const fresh = await boxService.getBoxes();
        // await cacheData('boxes', fresh.data);
        // return fresh.data;
      } catch (error) {
        // Fallback to cache on error
        const cached = await getCachedData('boxes');
        if (cached) return cached;
        throw error;
      }
    }

    // Offline fallback
    const cached = await getCachedData('boxes');
    if (cached) return cached;
    
    throw new Error('Nenhum dado disponível offline');
  }, [getCachedData, cacheData, isCacheFresh, isOnline]);

  return { getBoxes };
};

/**
 * Hook específico para carrinho offline
 */
export const useOfflineCart = () => {
  const { getCachedData, cacheData, addToPendingQueue, isOnline } = useOffline();

  const addToCart = useCallback(async (boxId: string, quantity: number) => {
    if (isOnline) {
      try {
        // Try online first
        // const result = await cartService.addToCart(boxId, quantity);
        // await cacheData('cart', result);
        // return result;
      } catch (error) {
        // Add to pending queue on error
        await addToPendingQueue('ADD_TO_CART', { boxId, quantity });
        throw error;
      }
    } else {
      // Add to pending queue when offline
      await addToPendingQueue('ADD_TO_CART', { boxId, quantity });
      
      // Update local cache optimistically
      const cachedCart = await getCachedData('cart') || { items: [], total_items: 0 };
      const updatedCart = {
        ...cachedCart,
        items: [...cachedCart.items, { box_id: boxId, quantity, pending: true }],
        total_items: cachedCart.total_items + quantity,
      };
      
      await cacheData('cart', updatedCart);
      return updatedCart;
    }
  }, [getCachedData, cacheData, addToPendingQueue, isOnline]);

  const getCart = useCallback(async () => {
    const cached = await getCachedData('cart');
    if (cached) return cached;
    
    if (isOnline) {
      try {
        // const fresh = await cartService.getCart();
        // await cacheData('cart', fresh);
        // return fresh;
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }
    }
    
    // Return empty cart as fallback
    return { items: [], total_items: 0, total: 0 };
  }, [getCachedData, cacheData, isOnline]);

  return { addToCart, getCart };
};

/**
 * Hook específico para perfil de usuário offline
 */
export const useOfflineProfile = () => {
  const { getCachedData, cacheData, addToPendingQueue, isOnline } = useOffline();

  const getProfile = useCallback(async () => {
    const cached = await getCachedData('userProfile');
    if (cached) return cached;
    
    if (isOnline) {
      try {
        // const fresh = await userService.getProfile();
        // await cacheData('userProfile', fresh);
        // return fresh;
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    
    throw new Error('Perfil não disponível offline');
  }, [getCachedData, cacheData, isOnline]);

  const updateProfile = useCallback(async (data: any) => {
    if (isOnline) {
      try {
        // const result = await userService.updateProfile(data);
        // await cacheData('userProfile', result);
        // return result;
      } catch (error) {
        await addToPendingQueue('UPDATE_PROFILE', data);
        throw error;
      }
    } else {
      await addToPendingQueue('UPDATE_PROFILE', data);
      
      // Update cache optimistically
      const cached = await getCachedData('userProfile');
      if (cached) {
        const updated = { ...cached, ...data };
        await cacheData('userProfile', updated);
        return updated;
      }
    }
  }, [getCachedData, cacheData, addToPendingQueue, isOnline]);

  return { getProfile, updateProfile };
};

export default useOffline;
