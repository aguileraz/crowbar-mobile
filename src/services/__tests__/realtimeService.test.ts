 
import { realtimeService } from '../realtimeService';
import { store } from '../../store';

// Mock store
jest.mock('../../store', () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn(),
  },
}));

const mockedStore = store as jest.Mocked<typeof store>;

// Mock WebSocket
const mockWebSocket = {
  close: jest.fn(),
  send: jest.fn(),
  readyState: WebSocket.OPEN,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
};

// Override global WebSocket
(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('RealtimeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock store state
    mockedStore.getState.mockReturnValue({
      auth: { token: 'test-token' },
    });
  });

  describe('connect', () => {
    it('should connect to WebSocket successfully', async () => {
      const connectPromise = realtimeService.connect();

      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }

      await expect(connectPromise).resolves.toBeUndefined();
      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'realtime/setConnectionStatus',
          payload: 'connecting'
        })
      );
    });

    it('should handle connection error', async () => {
      const connectPromise = realtimeService.connect();

      // Simulate connection error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror({} as Event);
      }

      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
    });

    // TODO: Fix fake timers issue with WebSocket timeout
    it.skip('should handle connection timeout', async () => {
      jest.useFakeTimers();
      
      const connectPromise = realtimeService.connect();

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(10000);

      await expect(connectPromise).rejects.toThrow('Connection timeout');
      
      jest.useRealTimers();
    });

    it('should use auth token in connection URL', async () => {
      realtimeService.connect();

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('token=test-token')
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect WebSocket successfully', async () => {
      // First connect
      const connectPromise = realtimeService.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;

      // Then disconnect
      await realtimeService.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'User disconnect');
      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'realtime/setConnectionStatus',
          payload: 'disconnected'
        })
      );
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = realtimeService.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;
    });

    it('should handle box stock update message', () => {
      const message = {
        type: 'box_stock_update',
        data: {
          boxId: 'box1',
          stock: 5,
          price: 19.99,
        },
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('updateBoxStock'),
          payload: {
            boxId: 'box1',
            stock: 5,
            price: 19.99,
          },
        })
      );
    });

    it('should handle order _status update message', () => {
      const message = {
        type: 'order_status_update',
        data: {
          orderId: 'order1',
          status: 'shipped',
          tracking: { number: 'TR123456' },
        },
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('updateOrderStatus'),
        })
      );

      // Should also add notification
      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addNotification'),
        })
      );
    });

    it('should handle box opened event', () => {
      const message = {
        type: 'box_opened',
        data: {
          userId: 'user1',
          userName: 'John Doe',
          boxName: 'Mystery Box',
          rareItems: ['Rare Item 1'],
          totalBoxesOpened: 100,
          recentOpenings: [],
        },
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addLiveEvent'),
        })
      );

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('updateLiveStats'),
        })
      );
    });

    it('should handle new box available message', () => {
      const message = {
        type: 'new_box_available',
        data: {
          boxId: 'box2',
          boxName: 'New Mystery Box',
        },
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addLiveEvent'),
        })
      );

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addNotification'),
        })
      );
    });

    it('should handle online users update', () => {
      const message = {
        type: 'online_users_update',
        data: {
          count: 42,
          users: [
            { id: 'user1', name: 'John Doe' },
            { id: 'user2', name: 'Jane Smith' },
          ],
        },
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      expect(mockedStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('updateOnlineUsers'),
          payload: {
            count: 42,
            users: expect.any(Array),
          },
        })
      );
    });

    it('should handle pong message', () => {
      const message = { type: 'pong' };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify(message),
        } as MessageEvent);
      }

      // Should not dispatch any actions for pong
      expect(mockedStore.dispatch).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: 'invalid json',
        } as MessageEvent);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling WebSocket message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('subscriptions', () => {
    beforeEach(async () => {
      // Connect first
      const connectPromise = realtimeService.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
      await connectPromise;
    });

    it('should subscribe to box updates', async () => {
      await realtimeService.subscribeToBox('box1');

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          channel: 'box_updates',
          boxId: 'box1',
        })
      );
    });

    it('should not subscribe to same box twice', async () => {
      await realtimeService.subscribeToBox('box1');
      await realtimeService.subscribeToBox('box1');

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to order updates', async () => {
      await realtimeService.subscribeToOrder('order1');

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          channel: 'order_updates',
          orderId: 'order1',
        })
      );
    });

    it('should subscribe to global events', () => {
      realtimeService.subscribeToGlobalEvents();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          channel: 'global_events',
        })
      );
    });

    it('should subscribe to live stats', () => {
      realtimeService.subscribeToLiveStats();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          channel: 'live_stats',
        })
      );
    });
  });

  describe('connection state', () => {
    it('should return correct connection state', () => {
      expect(realtimeService.isConnected()).toBe(false);

      // Mock connected state
      mockWebSocket.readyState = WebSocket.OPEN;
      expect(realtimeService.getConnectionState()).toBe(WebSocket.OPEN);
    });
  });
});
