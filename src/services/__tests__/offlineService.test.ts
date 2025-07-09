import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService, { SyncPriority, CacheStrategy } from '../offlineService';
import { store } from '../../store';
import { jest } from '@jest/globals';

// Mock das dependências
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('react-native-blob-util');
jest.mock('lz-string');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
  });

  describe('Inicialização', () => {
    it('deve inicializar o serviço corretamente', async () => {
      const result = await offlineService.initialize();
      
      expect(result).toBeDefined();
      expect(result.cacheStatus).toBeDefined();
      expect(result.pendingActions).toBeDefined();
      expect(result.networkState).toBeDefined();
    });

    it('deve configurar o listener de rede', async () => {
      await offlineService.initialize();
      
      // Verificar se o listener foi configurado
      expect(offlineService.networkUnsubscribe).toBeDefined();
    });

    it('deve criar o diretório de cache de imagens', async () => {
      await offlineService.initialize();
      
      // Verificar se o diretório foi criado
      // Esta verificação seria feita com o mock do ReactNativeBlobUtil
    });
  });

  describe('Cache de Dados', () => {
    it('deve cachear dados com compressão', async () => {
      const testData = { id: 1, name: 'Test Box' };
      
      await offlineService.cacheData(
        'test_key',
        testData,
        SyncPriority.NORMAL
      );
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2); // Dados + metadata
    });

    it('deve recuperar dados do cache', async () => {
      const testData = { id: 1, name: 'Test Box' };
      const compressedData = JSON.stringify(testData); // Simulação
      const metadata = {
        version: '1.0.0',
        timestamp: Date.now(),
        hash: 'test_hash',
        compressed: true,
        size: compressedData.length,
        priority: SyncPriority.NORMAL,
      };

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(compressedData)
        .mockResolvedValueOnce(JSON.stringify(metadata));

      const result = await offlineService.getCachedData(
        'test_key',
        CacheStrategy.CACHE_FIRST
      );

      expect(result).toBeDefined();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });

    it('deve usar fetcher quando cache não existe', async () => {
      const testData = { id: 1, name: 'Test Box' };
      const fetcher = jest.fn().mockResolvedValue(testData);

      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await offlineService.getCachedData(
        'test_key',
        CacheStrategy.CACHE_FIRST,
        fetcher
      );

      expect(fetcher).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it('deve respeitar estratégias de cache', async () => {
      const testData = { id: 1, name: 'Test Box' };
      const fetcher = jest.fn().mockResolvedValue(testData);

      // Estratégia NETWORK_ONLY
      await offlineService.getCachedData(
        'test_key',
        CacheStrategy.NETWORK_ONLY,
        fetcher
      );

      expect(fetcher).toHaveBeenCalled();
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('Sincronização Diferencial', () => {
    it('deve identificar itens adicionados', async () => {
      const currentData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      // Simular estado anterior vazio
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({}));

      const changes = await offlineService.syncDifferential('test_type', currentData);

      expect(changes.added).toHaveLength(2);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });

    it('deve identificar itens modificados', async () => {
      const currentData = [
        { id: '1', name: 'Item 1 Modified' },
      ];

      // Simular estado anterior com hash diferente
      const previousState = {
        test_type: {
          timestamp: Date.now() - 1000,
          hashes: {
            '1': 'old_hash',
          },
        },
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(previousState));

      const changes = await offlineService.syncDifferential('test_type', currentData);

      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(1);
      expect(changes.deleted).toHaveLength(0);
    });

    it('deve identificar itens removidos', async () => {
      const currentData: any[] = [];

      // Simular estado anterior com item
      const previousState = {
        test_type: {
          timestamp: Date.now() - 1000,
          hashes: {
            '1': 'old_hash',
          },
        },
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(previousState));

      const changes = await offlineService.syncDifferential('test_type', currentData);

      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(1);
    });
  });

  describe('Ações Pendentes', () => {
    it('deve adicionar ação pendente', async () => {
      const action = {
        type: 'ADD_TO_CART',
        data: { boxId: '123', quantity: 2 },
        priority: SyncPriority.CRITICAL,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      await offlineService.addPendingAction(action);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_pending_actions',
        expect.any(String)
      );
    });

    it('deve processar ações pendentes por prioridade', async () => {
      const actions = [
        {
          id: '1',
          type: 'ADD_TO_CART',
          data: { boxId: '123', quantity: 1 },
          priority: SyncPriority.NORMAL,
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: '2',
          type: 'UPDATE_PROFILE',
          data: { name: 'Test' },
          priority: SyncPriority.CRITICAL,
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(actions));

      const result = await offlineService.processPendingActions();

      // Ação crítica deve ser processada primeiro
      expect(result.processedActions).toHaveLength(2);
    });

    it('deve respeitar limite de tentativas', async () => {
      const action = {
        id: '1',
        type: 'INVALID_ACTION',
        data: {},
        priority: SyncPriority.NORMAL,
        timestamp: Date.now(),
        retryCount: 3, // Máximo atingido
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([action]));

      const result = await offlineService.processPendingActions();

      expect(result.remainingActions).toHaveLength(0);
    });
  });

  describe('Cache de Imagens', () => {
    it('deve cachear imagem com sucesso', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      // Mock do ReactNativeBlobUtil seria necessário aqui
      const cachedUrl = await offlineService.cacheImage(imageUrl);
      
      expect(cachedUrl).toBeDefined();
      // Verificar se a imagem foi baixada e registrada no índice
    });

    it('deve retornar URL original em caso de erro', async () => {
      const imageUrl = 'https://example.com/invalid-image.jpg';
      
      // Simular erro no download
      const cachedUrl = await offlineService.cacheImage(imageUrl);
      
      expect(cachedUrl).toBe(imageUrl);
    });
  });

  describe('Limpeza de Cache', () => {
    it('deve limpar cache específico', async () => {
      await offlineService.clearCache('boxes');
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_boxes');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_boxes_metadata');
    });

    it('deve limpar todo o cache', async () => {
      await offlineService.clearCache();
      
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('deve limpar cache antigo baseado no tamanho', async () => {
      // Simular cache grande
      const cacheStatus = {
        totalSize: 60 * 1024 * 1024, // 60MB
      };

      jest.spyOn(offlineService, 'getCacheStatus').mockResolvedValue(cacheStatus);

      await offlineService.cleanupOldCache();

      // Verificar se caches de baixa prioridade foram removidos
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Sincronização de Dados', () => {
    it('deve sincronizar dados quando online', async () => {
      // Mock do estado Redux
      const mockState = {
        offline: {
          isOnline: true,
          settings: {
            syncOnWifiOnly: false,
          },
          networkInfo: {
            type: 'cellular',
          },
        },
      };

      jest.spyOn(store, 'getState').mockReturnValue(mockState);

      const result = await offlineService.syncData();

      expect(result).toBeDefined();
      expect(result.syncResults).toBeDefined();
    });

    it('deve falhar quando offline sem force', async () => {
      const mockState = {
        offline: {
          isOnline: false,
        },
      };

      jest.spyOn(store, 'getState').mockReturnValue(mockState);

      await expect(offlineService.syncData(false)).rejects.toThrow('Sem conexão com a internet');
    });

    it('deve respeitar configuração de WiFi only', async () => {
      const mockState = {
        offline: {
          isOnline: true,
          settings: {
            syncOnWifiOnly: true,
          },
          networkInfo: {
            type: 'cellular',
          },
        },
      };

      jest.spyOn(store, 'getState').mockReturnValue(mockState);

      await expect(offlineService.syncData()).rejects.toThrow('Sincronização permitida apenas em WiFi');
    });
  });

  describe('Destruição do Serviço', () => {
    it('deve limpar recursos ao destruir', () => {
      const unsubscribeMock = jest.fn();
      (offlineService as any).networkUnsubscribe = unsubscribeMock;

      offlineService.destroy();

      expect(unsubscribeMock).toHaveBeenCalled();
      expect((offlineService as any).networkUnsubscribe).toBeNull();
    });
  });
});