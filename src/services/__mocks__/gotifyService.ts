/**
 * Mock do Gotify Service para testes
 * 
 * Substitui Firebase Cloud Messaging (FCM)
 * Usado em testes para simular comportamento do Gotify WebSocket
 */

export interface GotifyMessage {
  id: number;
  appid: number;
  message: string;
  title: string;
  priority: number;
  date: string;
  extras?: {
    userId?: string;
    type?: string;
    orderId?: string;
    [key: string]: any;
  };
}

export interface NotificationHandler {
  onNotification: (message: GotifyMessage) => void;
}

class MockGotifyService {
  private connected: boolean = false;
  private notificationHandler: NotificationHandler | null = null;
  private messages: GotifyMessage[] = [];

  // Mock methods
  initialize = jest.fn().mockResolvedValue(undefined);
  
  connect = jest.fn().mockImplementation((clientToken: string) => {
    this.connected = true;
    return Promise.resolve();
  });

  disconnect = jest.fn().mockImplementation(() => {
    this.connected = false;
    return Promise.resolve();
  });

  isConnected = jest.fn().mockImplementation(() => {
    return this.connected;
  });

  sendNotification = jest.fn().mockResolvedValue({ id: 'notif-123' });

  setNotificationHandler = jest.fn().mockImplementation((handler: NotificationHandler) => {
    this.notificationHandler = handler;
  });

  // Helper methods para testes
  simulateMessage = (message: GotifyMessage) => {
    this.messages.push(message);
    if (this.notificationHandler) {
      this.notificationHandler.onNotification(message);
    }
  };

  clearMessages = () => {
    this.messages = [];
  };

  getMessages = () => {
    return [...this.messages];
  };

  reset = () => {
    this.connected = false;
    this.notificationHandler = null;
    this.messages = [];
    jest.clearAllMocks();
  };
}

const mockGotifyService = new MockGotifyService();

export default mockGotifyService;
