import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { setNetworkStatus, updateCacheStatus } from '../store/slices/offlineSlice';
import { boxService } from './boxService';
import { userService } from './userService';
import { cartService } from './cartService';

/**
 * Serviço para gerenciamento de funcionalidades offline
 */

class OfflineService {
  private readonly CACHE_KEYS = {
    BOXES: 'offline_boxes',
    CATEGORIES: 'offline_categories',
    USER_PROFILE: 'offline_user_profile',
    CART: 'offline_cart',
    PENDING_ACTIONS: 'offline_pending_actions',
    CACHE_METADATA: 'offline_cache_metadata',
  };

  private networkListener: any = null;

  /**
   * Inicializar serviço offline
   */
  async initialize(): Promise<any> {
    try {
      // Setup network listener
      this.setupNetworkListener();
      
      // Load cache metadata
      const cacheStatus = await this.getCacheStatus();
      
      // Load pending actions
      const pendingActions = await this.getPendingActions();
      
      return {
        cacheStatus,
        pendingActions,
      };
    } catch (error) {
      console.error('Error initializing offline service:', error);
      throw error;
    }
  }

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    // Mock network listener - in real app would use @react-native-community/netinfo
    const checkNetworkStatus = () => {
      const isOnline = navigator.onLine !== false; // Default to online
      
      store.dispatch(setNetworkStatus({
        isOnline,
        networkInfo: {
          type: 'unknown',
          isConnected: isOnline,
          isInternetReachable: isOnline,
          details: null,
        },
      }));
    };

    // Initial check
    checkNetworkStatus();

    // Listen for network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', checkNetworkStatus);
      window.addEventListener('offline', checkNetworkStatus);
      
      this.networkListener = () => {
        window.removeEventListener('online', checkNetworkStatus);
        window.removeEventListener('offline', checkNetworkStatus);
      };
    }
  }

  /**
   * Cache boxes data
   */
  async cacheBoxes(boxes: any[], metadata?: any): Promise<void> {
    try {
      const cacheData = {
        data: boxes,
        timestamp: Date.now(),
        metadata: metadata || {},
      };
      
      await AsyncStorage.setItem(this.CACHE_KEYS.BOXES, JSON.stringify(cacheData));
      
      // Update cache status
      store.dispatch(updateCacheStatus({
        type: 'boxes',
        data: {
          lastUpdated: Date.now(),
          count: boxes.length,
          size: JSON.stringify(cacheData).length,
        },
      }));
    } catch (error) {
      console.error('Error caching boxes:', error);
      throw error;
    }
  }

  /**
   * Get cached boxes
   */
  async getCachedBoxes(): Promise<any[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.BOXES);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > maxAge) {
        // Cache expired
        await this.clearCache('boxes');
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached boxes:', error);
      return null;
    }
  }

  /**
   * Cache categories data
   */
  async cacheCategories(categories: any[]): Promise<void> {
    try {
      const cacheData = {
        data: categories,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(this.CACHE_KEYS.CATEGORIES, JSON.stringify(cacheData));
      
      store.dispatch(updateCacheStatus({
        type: 'categories',
        data: {
          lastUpdated: Date.now(),
          count: categories.length,
        },
      }));
    } catch (error) {
      console.error('Error caching categories:', error);
      throw error;
    }
  }

  /**
   * Get cached categories
   */
  async getCachedCategories(): Promise<any[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.CATEGORIES);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached categories:', error);
      return null;
    }
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(profile: any): Promise<void> {
    try {
      const cacheData = {
        data: profile,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(this.CACHE_KEYS.USER_PROFILE, JSON.stringify(cacheData));
      
      store.dispatch(updateCacheStatus({
        type: 'user',
        data: {
          lastUpdated: Date.now(),
        },
      }));
    } catch (error) {
      console.error('Error caching user profile:', error);
      throw error;
    }
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.USER_PROFILE);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached user profile:', error);
      return null;
    }
  }

  /**
   * Cache cart data
   */
  async cacheCart(cart: any): Promise<void> {
    try {
      const cacheData = {
        data: cart,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(this.CACHE_KEYS.CART, JSON.stringify(cacheData));
      
      store.dispatch(updateCacheStatus({
        type: 'cart',
        data: {
          lastUpdated: Date.now(),
        },
      }));
    } catch (error) {
      console.error('Error caching cart:', error);
      throw error;
    }
  }

  /**
   * Get cached cart
   */
  async getCachedCart(): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.CART);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached cart:', error);
      return null;
    }
  }

  /**
   * Add pending action
   */
  async addPendingAction(action: any): Promise<void> {
    try {
      const existing = await this.getPendingActions();
      const updated = [...existing, action];
      
      await AsyncStorage.setItem(this.CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding pending action:', error);
      throw error;
    }
  }

  /**
   * Get pending actions
   */
  async getPendingActions(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEYS.PENDING_ACTIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  /**
   * Process pending actions
   */
  async processPendingActions(): Promise<{ processedActions: any[]; remainingActions: any[] }> {
    try {
      const pendingActions = await this.getPendingActions();
      const processedActions: any[] = [];
      const remainingActions: any[] = [];
      
      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          processedActions.push(action);
        } catch (error) {
          console.error('Error processing action:', action, error);
          
          // Increment retry count
          action.retryCount = (action.retryCount || 0) + 1;
          
          // Keep action if retry count is less than max
          if (action.retryCount < 3) {
            remainingActions.push(action);
          } else {
            console.warn('Max retries reached for action:', action);
          }
        }
      }
      
      // Update pending actions
      await AsyncStorage.setItem(this.CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(remainingActions));
      
      return { processedActions, remainingActions };
    } catch (error) {
      console.error('Error processing pending actions:', error);
      throw error;
    }
  }

  /**
   * Execute a pending action
   */
  private async executeAction(action: any): Promise<void> {
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
      case 'ADD_FAVORITE':
        // await favoritesService.addFavorite(action.data.boxId);
        break;
      case 'REMOVE_FAVORITE':
        // await favoritesService.removeFavorite(action.data.boxId);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Sync data with server
   */
  async syncData(force: boolean = false): Promise<any> {
    try {
      const state = store.getState();
      const isOnline = state.offline?.isOnline;
      
      if (!isOnline && !force) {
        throw new Error('No internet connection');
      }
      
      // Process pending actions first
      await this.processPendingActions();
      
      // Sync fresh data from server
      const [boxes, categories, userProfile, cart] = await Promise.allSettled([
        boxService.getBoxes(),
        boxService.getCategories(),
        userService.getProfile(),
        cartService.getCart(),
      ]);
      
      // Cache successful responses
      if (boxes.status === 'fulfilled') {
        await this.cacheBoxes(boxes.value.data);
      }
      
      if (categories.status === 'fulfilled') {
        await this.cacheCategories(categories.value);
      }
      
      if (userProfile.status === 'fulfilled') {
        await this.cacheUserProfile(userProfile.value);
      }
      
      if (cart.status === 'fulfilled') {
        await this.cacheCart(cart.value);
      }
      
      const cacheStatus = await this.getCacheStatus();
      const pendingActions = await this.getPendingActions();
      
      return {
        cacheStatus,
        pendingActions,
        syncResults: {
          boxes: boxes.status,
          categories: categories.status,
          userProfile: userProfile.status,
          cart: cart.status,
        },
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(cacheType?: string): Promise<void> {
    try {
      if (cacheType) {
        // Clear specific cache
        const key = this.CACHE_KEYS[cacheType.toUpperCase() as keyof typeof this.CACHE_KEYS];
        if (key) {
          await AsyncStorage.removeItem(key);
        }
      } else {
        // Clear all cache
        const keys = Object.values(this.CACHE_KEYS);
        await AsyncStorage.multiRemove(keys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<any> {
    try {
      const cacheStatus = {
        boxes: { lastUpdated: null, count: 0, size: 0 },
        categories: { lastUpdated: null, count: 0 },
        user: { lastUpdated: null },
        cart: { lastUpdated: null },
      };
      
      // Check each cache
      for (const [type, key] of Object.entries(this.CACHE_KEYS)) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            const cacheKey = type.toLowerCase() as keyof typeof cacheStatus;
            
            if (cacheStatus[cacheKey]) {
              (cacheStatus[cacheKey] as any).lastUpdated = data.timestamp;
              
              if (data.data && Array.isArray(data.data)) {
                (cacheStatus[cacheKey] as any).count = data.data.length;
              }
              
              (cacheStatus[cacheKey] as any).size = cached.length;
            }
          }
        } catch (error) {
          console.warn(`Error checking cache for ${type}:`, error);
        }
      }
      
      return cacheStatus;
    } catch (error) {
      console.error('Error getting cache status:', error);
      throw error;
    }
  }

  /**
   * Cleanup old cache
   */
  async cleanupOldCache(): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const key of Object.values(this.CACHE_KEYS)) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.warn(`Error cleaning up cache for ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
    }
  }

  /**
   * Destroy service
   */
  destroy(): void {
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
