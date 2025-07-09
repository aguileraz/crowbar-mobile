import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOffline, useOfflineCache, useOfflineImage, useOfflineAction } from '../useOffline';
import offlineSlice from '../../store/slices/offlineSlice';
import offlineService, { CacheStrategy, SyncPriority } from '../../services/offlineService';

// Mock dos serviços
jest.mock('../../services/offlineService');

const mockOfflineService = offlineService as jest.Mocked<typeof offlineService>;

// Store mock para os testes
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      offline: offlineSlice,
    },
    preloadedState: {
      offline: {
        isOnline: true,
        lastOnlineTime: Date.now(),
        syncStatus: 'idle',
        syncError: null,
        cacheStatus: {
          boxes: { lastUpdated: null, count: 0, size: 0 },
          categories: { lastUpdated: null, count: 0 },
          user: { lastUpdated: null },
          cart: { lastUpdated: null },
        },
        pendingActions: [],
        settings: {
          enableOfflineMode: true,
          autoSync: true,
          cacheExpiration: 24 * 60 * 60 * 1000,
          maxCacheSize: 50 * 1024 * 1024,
          syncOnWifiOnly: false,
        },
        networkInfo: {
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: null,
        },
        ...initialState,
      },
    },
  });
};

const wrapper = ({ children, store = createMockStore() }: any) => {
  return React.createElement(Provider, { store }, children);
};

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Principal', () => {
    it('deve retornar estado offline correto', () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.syncStatus).toBe('idle');
      expect(result.current.pendingActions).toEqual([]);
      expect(result.current.cacheStatus).toBeDefined();
      expect(result.current.canSync).toBe(true);
    });

    it('deve sincronizar dados', async () => {
      const mockSyncResult = { success: true };
      mockOfflineService.syncData.mockResolvedValue(mockSyncResult);

      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        const syncResult = await result.current.sync();
        expect(syncResult).toEqual(mockSyncResult);
      });

      expect(mockOfflineService.syncData).toHaveBeenCalledWith(false);
    });

    it('deve adicionar ação offline', async () => {
      const mockAction = { type: 'ADD_TO_CART', data: { boxId: '123' } };
      
      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        await result.current.addOfflineAction(mockAction.type, mockAction.data);
      });

      // Verificar se a ação foi adicionada
      expect(result.current.pendingActions).toHaveLength(1);
    });

    it('deve verificar se está no modo offline', () => {
      mockOfflineService.isOfflineMode.mockReturnValue(true);

      const { result } = renderHook(() => useOffline(), { wrapper });

      expect(result.current.isOfflineMode()).toBe(true);
    });

    it('deve limpar cache', async () => {
      const { result } = renderHook(() => useOffline(), { wrapper });

      await act(async () => {
        await result.current.clearCache('boxes');
      });

      expect(mockOfflineService.clearCache).toHaveBeenCalledWith('boxes');
    });

    it('deve identificar flags de estado', () => {
      const store = createMockStore({
        syncStatus: 'syncing',
        pendingActions: [{ id: '1', type: 'TEST' }],
      });

      const { result } = renderHook(() => useOffline(), { 
        wrapper: ({ children }: any) => React.createElement(Provider, { store }, children)
      });

      expect(result.current.isSyncing).toBe(true);
      expect(result.current.hasPendingActions).toBe(true);
      expect(result.current.lastSyncError).toBe(false);
    });
  });

  describe('useOfflineCache', () => {
    it('deve buscar dados com cache', async () => {
      const mockData = { id: '1', name: 'Test Data' };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);
      
      mockOfflineService.getCachedData.mockResolvedValue(mockData);

      const { result } = renderHook(() => 
        useOfflineCache('test_key', mockFetcher, {
          strategy: CacheStrategy.CACHE_FIRST,
          priority: SyncPriority.NORMAL,
        }), 
        { wrapper }
      );

      // Aguardar busca automática
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve atualizar cache manualmente', async () => {
      const mockData = { id: '1', name: 'Test Data' };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => 
        useOfflineCache('test_key', mockFetcher), 
        { wrapper }
      );

      const newData = { id: '2', name: 'Updated Data' };

      await act(async () => {
        await result.current.updateCache(newData);
      });

      expect(mockOfflineService.cacheData).toHaveBeenCalledWith(
        'test_key',
        newData,
        SyncPriority.NORMAL,
        CacheStrategy.CACHE_FIRST
      );
    });

    it('deve tratar erro na busca', async () => {
      const mockError = new Error('Fetch error');
      const mockFetcher = jest.fn().mockRejectedValue(mockError);
      
      mockOfflineService.getCachedData.mockRejectedValue(mockError);

      const { result } = renderHook(() => 
        useOfflineCache('test_key', mockFetcher), 
        { wrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeNull();
    });

    it('deve refazer busca quando voltar online', async () => {
      const mockData = { id: '1', name: 'Test Data' };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);

      // Começar offline
      const offlineStore = createMockStore({ isOnline: false });
      
      const { result, rerender } = renderHook(() => 
        useOfflineCache('test_key', mockFetcher, {
          strategy: CacheStrategy.NETWORK_FIRST,
        }), 
        { 
          wrapper: ({ children }: any) => 
            React.createElement(Provider, { store: offlineStore }, children)
        }
      );

      // Voltar online
      const onlineStore = createMockStore({ isOnline: true });
      
      rerender({ 
        wrapper: ({ children }: any) => 
          React.createElement(Provider, { store: onlineStore }, children)
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOfflineService.getCachedData).toHaveBeenCalled();
    });
  });

  describe('useOfflineImage', () => {
    it('deve cachear imagem com sucesso', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const cachedUrl = 'file:///cache/image.jpg';
      
      mockOfflineService.cacheImage.mockResolvedValue(cachedUrl);

      const { result } = renderHook(() => 
        useOfflineImage(imageUrl, SyncPriority.LOW), 
        { wrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uri).toBe(cachedUrl);
      expect(result.current.loading).toBe(false);
      expect(result.current.isFromCache).toBe(true);
    });

    it('deve usar URL original em caso de erro', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const mockError = new Error('Cache error');
      
      mockOfflineService.cacheImage.mockRejectedValue(mockError);

      const { result } = renderHook(() => 
        useOfflineImage(imageUrl), 
        { wrapper }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uri).toBe(imageUrl);
      expect(result.current.error).toEqual(mockError);
    });

    it('deve retornar null para URL null', () => {
      const { result } = renderHook(() => 
        useOfflineImage(null), 
        { wrapper }
      );

      expect(result.current.uri).toBeNull();
    });
  });

  describe('useOfflineAction', () => {
    it('deve executar ação online imediatamente', async () => {
      const mockResult = { success: true };
      const mockExecutor = jest.fn().mockResolvedValue(mockResult);
      const mockOnSuccess = jest.fn();

      const { result } = renderHook(() => 
        useOfflineAction('TEST_ACTION', mockExecutor, {
          onSuccess: mockOnSuccess,
        }), 
        { wrapper }
      );

      const testData = { id: '123' };

      await act(async () => {
        const actionResult = await result.current.execute(testData);
        expect(actionResult).toEqual(mockResult);
      });

      expect(mockExecutor).toHaveBeenCalledWith(testData);
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
    });

    it('deve adicionar ação à fila quando offline', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = jest.fn();

      // Store offline
      const offlineStore = createMockStore({ isOnline: false });

      const { result } = renderHook(() => 
        useOfflineAction('TEST_ACTION', mockExecutor, {
          onSuccess: mockOnSuccess,
        }), 
        { 
          wrapper: ({ children }: any) => 
            React.createElement(Provider, { store: offlineStore }, children)
        }
      );

      const testData = { id: '123' };

      await act(async () => {
        await result.current.execute(testData);
      });

      expect(mockExecutor).not.toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith({});
    });

    it('deve chamar atualização otimista', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({ success: true });
      const mockOptimisticUpdate = jest.fn();

      const { result } = renderHook(() => 
        useOfflineAction('TEST_ACTION', mockExecutor, {
          optimisticUpdate: mockOptimisticUpdate,
        }), 
        { wrapper }
      );

      const testData = { id: '123' };

      await act(async () => {
        await result.current.execute(testData);
      });

      expect(mockOptimisticUpdate).toHaveBeenCalledWith(testData);
    });

    it('deve tratar erro na execução', async () => {
      const mockError = new Error('Execution error');
      const mockExecutor = jest.fn().mockRejectedValue(mockError);
      const mockOnError = jest.fn();

      const { result } = renderHook(() => 
        useOfflineAction('TEST_ACTION', mockExecutor, {
          onError: mockOnError,
        }), 
        { wrapper }
      );

      const testData = { id: '123' };

      await act(async () => {
        try {
          await result.current.execute(testData);
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toEqual(mockError);
    });
  });
});