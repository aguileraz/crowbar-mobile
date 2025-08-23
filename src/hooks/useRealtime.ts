import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import logger from '../services/loggerService';
import {
  connectRealtime,
  disconnectRealtime,
  subscribeToBox,
  subscribeToOrder,
  selectIsConnected,
  selectConnectionStatus,
  selectRealtimeError,
  selectBoxStock,
  selectOrderStatus,
  selectLiveEvents,
  selectOnlineUsers,
  selectLiveStats,
} from '../store/slices/realtimeSlice';
import { realtimeService } from '../services/realtimeService';

/**
 * Hook personalizado para gerenciar funcionalidades de tempo real
 */

interface UseRealtimeOptions {
  autoConnect?: boolean;
  subscribeToGlobal?: boolean;
  subscribeToStats?: boolean;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const {
    autoConnect = true,
    subscribeToGlobal = false,
    subscribeToStats = false,
  } = options;

  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const isConnected = useSelector(selectIsConnected);
  const connectionStatus = useSelector(selectConnectionStatus);
  const error = useSelector(selectRealtimeError);
  const liveEvents = useSelector(selectLiveEvents);
  const onlineUsers = useSelector(selectOnlineUsers);
  const liveStats = useSelector(selectLiveStats);

  /**
   * Connect to realtime
   */
  const connect = useCallback(async () => {
    try {
      await dispatch(connectRealtime()).unwrap();
      
      // Subscribe to global events if requested
      if (subscribeToGlobal) {
        realtimeService.subscribeToGlobalEvents();
      }
      
      // Subscribe to live stats if requested
      if (subscribeToStats) {
        realtimeService.subscribeToLiveStats();
      }
    } catch (err) {
      logger.error('Failed to connect to realtime:', err);
    }
  }, [dispatch, subscribeToGlobal, subscribeToStats]);

  /**
   * Disconnect from realtime
   */
  const disconnect = useCallback(async () => {
    try {
      await dispatch(disconnectRealtime()).unwrap();
    } catch (err) {
      logger.error('Failed to disconnect from realtime:', err);
    }
  }, [dispatch]);

  /**
   * Subscribe to box updates
   */
  const subscribeBox = useCallback(async (boxId: string) => {
    try {
      await dispatch(subscribeToBox(boxId)).unwrap();
    } catch (err) {
      logger.error('Failed to subscribe to box:', err);
    }
  }, [dispatch]);

  /**
   * Subscribe to order updates
   */
  const subscribeOrder = useCallback(async (orderId: string) => {
    try {
      await dispatch(subscribeToOrder(orderId)).unwrap();
    } catch (err) {
      logger.error('Failed to subscribe to order:', err);
    }
  }, [dispatch]);

  // Remove these functions as they violate React Hooks rules
  // useSelector cannot be called inside callbacks
  // Components should use useSelector directly

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect && connectionStatus === 'disconnected') {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [autoConnect, connectionStatus, connect, disconnect, isConnected]);

  /**
   * Reconnect on app focus (if needed)
   */
  useEffect(() => {
    const _handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !isConnected && autoConnect) {
        connect();
      }
    };

    // Note: In a real app, you'd use AppState from react-native
    // AppState.addEventListener('change', handleAppStateChange);
    
    // return () => {
    //   AppState.removeEventListener('change', handleAppStateChange);
    // };
  }, [isConnected, autoConnect, connect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,
    
    // Connection methods
    connect,
    disconnect,
    
    // Subscription methods
    subscribeBox,
    subscribeOrder,
    
    // Data getters
    getBoxStock,
    getOrderStatus,
    
    // Live data
    liveEvents,
    onlineUsers,
    liveStats,
    
    // Utility methods
    isReady: isConnected && connectionStatus === 'connected',
    hasError: !!error,
  };
};

/**
 * Hook específico para atualizações de caixa
 */
export const useBoxRealtime = (boxId: string) => {
  const { subscribeBox, getBoxStock: _getBoxStock, isConnected } = useRealtime();
  const boxStock = useSelector(selectBoxStock(boxId));

  useEffect(() => {
    if (isConnected && boxId) {
      subscribeBox(boxId);
    }
  }, [isConnected, boxId, subscribeBox]);

  return {
    stock: boxStock?.stock,
    price: boxStock?.price,
    lastUpdated: boxStock?.lastUpdated,
    isSubscribed: isConnected,
  };
};

/**
 * Hook específico para atualizações de pedido
 */
export const useOrderRealtime = (orderId: string) => {
  const { subscribeOrder, getOrderStatus: _getOrderStatus, isConnected } = useRealtime();
  const orderStatus = useSelector(selectOrderStatus(orderId));

  useEffect(() => {
    if (isConnected && orderId) {
      subscribeOrder(orderId);
    }
  }, [isConnected, orderId, subscribeOrder]);

  return {
    status: orderStatus?.status,
    tracking: orderStatus?.tracking,
    lastUpdated: orderStatus?.lastUpdated,
    isSubscribed: isConnected,
  };
};

/**
 * Hook para eventos globais ao vivo
 */
export const useLiveEvents = (maxEvents: number = 20) => {
  const { liveEvents, liveStats, onlineUsers, isConnected } = useRealtime({
    subscribeToGlobal: true,
    subscribeToStats: true,
  });

  const recentEvents = liveEvents.slice(0, maxEvents);

  return {
    events: recentEvents,
    stats: liveStats,
    onlineUsers,
    isConnected,
    hasEvents: recentEvents.length > 0,
  };
};

export default useRealtime;