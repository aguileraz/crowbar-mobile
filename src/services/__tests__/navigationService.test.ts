/**
 * Testes para o serviço de navegação
 *
 * Cobre:
 * - Inicialização do serviço
 * - Navegação básica (navigate, goBack)
 * - Reset de navegação
 * - Navegação baseada em notificações
 * - Detecção de tela atual
 * - Deep links
 */

import { navigationService } from '../navigationService';

describe('NavigationService', () => {
  let mockNavigationRef: any;

  beforeEach(() => {
    // Criar mock do navigationRef com todos os métodos necessários
    mockNavigationRef = {
      isReady: jest.fn(),
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(),
      reset: jest.fn(),
      getCurrentRoute: jest.fn(),
    };

    // Injetar o mock diretamente no serviço
    (navigationService as any).navigationRef = mockNavigationRef;

    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve criar instância do NavigationService', () => {
      expect(navigationService).toBeDefined();
    });

    it('deve retornar referência de navegação', () => {
      const ref = navigationService.getNavigationRef();
      expect(ref).toBeDefined();
      expect(ref).toBe(mockNavigationRef);
    });
  });

  describe('Navegação Básica', () => {
    it('deve navegar para tela com parâmetros quando pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      const params = { boxId: 'box-123' };

      // Act
      navigationService.navigate('BoxDetails', params);

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('BoxDetails', params);
    });

    it('deve navegar para tela sem parâmetros quando pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);

      // Act
      navigationService.navigate('Shop');

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Shop', undefined);
    });

    it('não deve navegar quando não está pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(false);

      // Act
      navigationService.navigate('Home');

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('deve voltar para tela anterior quando pode voltar', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      mockNavigationRef.canGoBack.mockReturnValue(true);

      // Act
      navigationService.goBack();

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.canGoBack).toHaveBeenCalled();
      expect(mockNavigationRef.goBack).toHaveBeenCalled();
    });

    it('não deve voltar quando não pode voltar', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      mockNavigationRef.canGoBack.mockReturnValue(false);

      // Act
      navigationService.goBack();

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.canGoBack).toHaveBeenCalled();
      expect(mockNavigationRef.goBack).not.toHaveBeenCalled();
    });

    it('não deve voltar quando não está pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(false);

      // Act
      navigationService.goBack();

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.canGoBack).not.toHaveBeenCalled();
      expect(mockNavigationRef.goBack).not.toHaveBeenCalled();
    });
  });

  describe('Reset de Navegação', () => {
    it('deve resetar navegação para tela com parâmetros', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      const params = { orderId: 'order-456' };

      // Act
      navigationService.reset('OrderDetails', params);

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'OrderDetails', params }],
      });
    });

    it('deve resetar navegação para tela sem parâmetros', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);

      // Act
      navigationService.reset('Home');

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home', params: undefined }],
      });
    });

    it('não deve resetar quando não está pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(false);

      // Act
      navigationService.reset('Home');

      // Assert
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.reset).not.toHaveBeenCalled();
    });
  });

  describe('Navegação Baseada em Notificações', () => {
    beforeEach(() => {
      mockNavigationRef.isReady.mockReturnValue(true);
    });

    it('deve navegar para OrderDetails quando notificação order_update com orderId', () => {
      // Arrange
      const notificationData = {
        type: 'order_update',
        orderId: 'order-123',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('OrderDetails', {
        orderId: 'order-123',
      });
    });

    it('deve navegar para OrderHistory quando order_status sem orderId', () => {
      // Arrange
      const notificationData = {
        type: 'order_status',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('OrderHistory', undefined);
    });

    it('deve navegar para BoxDetails quando new_box com boxId', () => {
      // Arrange
      const notificationData = {
        type: 'new_box',
        boxId: 'box-789',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('BoxDetails', {
        boxId: 'box-789',
      });
    });

    it('deve navegar para Shop quando box_restock sem boxId', () => {
      // Arrange
      const notificationData = {
        type: 'box_restock',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Shop', undefined);
    });

    it('deve navegar para BoxDetails quando promotion com boxId', () => {
      // Arrange
      const notificationData = {
        type: 'promotion',
        boxId: 'box-456',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('BoxDetails', {
        boxId: 'box-456',
      });
    });

    it('deve navegar para Category quando discount com categoryId', () => {
      // Arrange
      const notificationData = {
        type: 'discount',
        categoryId: 'cat-123',
        categoryName: 'Eletrônicos',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Category', {
        categoryId: 'cat-123',
        categoryName: 'Eletrônicos',
      });
    });

    it('deve navegar para Shop quando promotion sem boxId ou categoryId', () => {
      // Arrange
      const notificationData = {
        type: 'promotion',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Shop', undefined);
    });

    it('deve navegar para Cart quando cart_reminder', () => {
      // Arrange
      const notificationData = {
        type: 'cart_reminder',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Cart', undefined);
    });

    it('deve navegar para Reviews quando review_request com boxId', () => {
      // Arrange
      const notificationData = {
        type: 'review_request',
        boxId: 'box-999',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Reviews', {
        boxId: 'box-999',
      });
    });

    it('deve navegar para Notifications quando system notification', () => {
      // Arrange
      const notificationData = {
        type: 'system',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Notifications', undefined);
    });

    it('deve navegar para Notifications quando announcement', () => {
      // Arrange
      const notificationData = {
        type: 'announcement',
      };

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Notifications', undefined);
    });

    it('deve navegar para Notifications quando sem tipo especificado', () => {
      // Arrange
      const notificationData = {};

      // Act
      navigationService.navigateFromNotification(notificationData);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Notifications', undefined);
    });

    it('deve navegar para Notifications quando dados são null', () => {
      // Act
      navigationService.navigateFromNotification(null);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Notifications', undefined);
    });
  });

  describe('Detecção de Tela Atual', () => {
    it('deve retornar true quando está na tela especificada', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      mockNavigationRef.getCurrentRoute.mockReturnValue({
        name: 'Home',
        params: {},
      });

      // Act
      const result = navigationService.isCurrentScreen('Home');

      // Assert
      expect(result).toBe(true);
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.getCurrentRoute).toHaveBeenCalled();
    });

    it('deve retornar false quando não está na tela especificada', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      mockNavigationRef.getCurrentRoute.mockReturnValue({
        name: 'Shop',
        params: {},
      });

      // Act
      const result = navigationService.isCurrentScreen('Home');

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando não está pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(false);

      // Act
      const result = navigationService.isCurrentScreen('Home');

      // Assert
      expect(result).toBe(false);
      expect(mockNavigationRef.getCurrentRoute).not.toHaveBeenCalled();
    });

    it('deve retornar nome da tela atual quando pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(true);
      mockNavigationRef.getCurrentRoute.mockReturnValue({
        name: 'BoxDetails',
        params: { boxId: 'box-123' },
      });

      // Act
      const result = navigationService.getCurrentScreen();

      // Assert
      expect(result).toBe('BoxDetails');
      expect(mockNavigationRef.isReady).toHaveBeenCalled();
      expect(mockNavigationRef.getCurrentRoute).toHaveBeenCalled();
    });

    it('deve retornar undefined quando não está pronto', () => {
      // Arrange
      mockNavigationRef.isReady.mockReturnValue(false);

      // Act
      const result = navigationService.getCurrentScreen();

      // Assert
      expect(result).toBeUndefined();
      expect(mockNavigationRef.getCurrentRoute).not.toHaveBeenCalled();
    });
  });

  describe('Deep Link Navigation', () => {
    beforeEach(() => {
      mockNavigationRef.isReady.mockReturnValue(true);
    });

    it('deve navegar para BoxDetails quando deep link de box', () => {
      // Arrange
      const deepLink = 'crowbar://box/box-123';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('BoxDetails', {
        boxId: 'box-123',
      });
    });

    it('deve navegar para OrderDetails quando deep link de order', () => {
      // Arrange
      const deepLink = 'crowbar://order/order-456';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('OrderDetails', {
        orderId: 'order-456',
      });
    });

    it('deve navegar para Category quando deep link de category', () => {
      // Arrange
      const deepLink = 'crowbar://category/cat-789';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Category', {
        categoryId: 'cat-789',
      });
    });

    it('deve navegar para Cart quando deep link de cart', () => {
      // Arrange
      const deepLink = 'crowbar://cart';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Cart', undefined);
    });

    it('deve navegar para Profile quando deep link de profile', () => {
      // Arrange
      const deepLink = 'crowbar://profile';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Profile', undefined);
    });

    it('deve navegar para Home quando deep link desconhecido', () => {
      // Arrange
      const deepLink = 'crowbar://unknown';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Home', undefined);
    });

    it('não deve navegar quando deep link é inválido', () => {
      // Arrange
      const deepLink = 'invalid-url';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('não deve navegar quando deep link de box sem parâmetro', () => {
      // Arrange
      const deepLink = 'crowbar://box/';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('não deve navegar quando deep link de order sem parâmetro', () => {
      // Arrange
      const deepLink = 'crowbar://order/';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('não deve navegar quando deep link de category sem parâmetro', () => {
      // Arrange
      const deepLink = 'crowbar://category/';

      // Act
      navigationService.handleDeepLink(deepLink);

      // Assert
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });
  });
});
