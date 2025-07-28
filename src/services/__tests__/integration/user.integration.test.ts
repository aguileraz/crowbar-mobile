import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { apiClient } from '../../api';
import { userService } from '../../userService';
import { Address, UserPreferences, UserStats, Favorite, Notification } from '../../../types/api';

/**
 * Testes de integração para operações de usuário
 * Verifica perfil, endereços, preferências e funcionalidades relacionadas
 */

describe('Testes de Integração - Operações de Usuário', () => {
  let testClient: TestApiClient;

  // Dados de teste específicos para usuário
  const testUserPreferences: UserPreferences = {
    theme: 'light',
    language: 'pt-BR',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    privacy: {
      profile_visibility: 'public',
      activity_visibility: 'friends',
      email_visibility: 'private',
    },
    box_preferences: {
      preferred_categories: ['electronics', 'gaming'],
      price_range: { min: 50, max: 200 },
      exclude_categories: ['fashion'],
    },
  };

  const testUserStats: UserStats = {
    boxes_opened: 25,
    total_spent: 1250.75,
    favorite_boxes: 8,
    reviews_written: 12,
    boxes_by_category: {
      electronics: 10,
      gaming: 8,
      books: 4,
      fashion: 3,
    },
    monthly_spending: [
      { month: '2025-01', amount: 299.97 },
      { month: '2024-12', amount: 450.50 },
      { month: '2024-11', amount: 200.28 },
    ],
    achievements: [
      {
        id: 'first_box',
        name: 'Primeira Caixa',
        description: 'Abriu sua primeira caixa misteriosa',
        icon: 'gift',
        earned_at: '2024-10-15T10:00:00Z',
      },
      {
        id: 'big_spender',
        name: 'Grande Gastador',
        description: 'Gastou mais de R$ 1000',
        icon: 'money',
        earned_at: '2025-01-05T15:30:00Z',
      },
    ],
  };

  const testAddresses: Address[] = [
    {
      id: 'addr-001',
      user_id: 'user-123',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      country: 'BR',
      is_default: true,
      created_at: '2025-01-01T10:00:00Z',
    },
    {
      id: 'addr-002',
      user_id: 'user-123',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 201',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      country: 'BR',
      is_default: false,
      created_at: '2025-01-02T14:30:00Z',
    },
  ];

  const testFavorites: Favorite[] = [
    {
      id: 'fav-001',
      user_id: 'user-123',
      mystery_box_id: 'box-electronics-001',
      mystery_box: {
        id: 'box-electronics-001',
        name: 'Caixa Eletrônicos Premium',
        image_url: 'https://test.com/electronics.jpg',
        price: 99.99,
        stock: 50,
        is_active: true,
      },
      created_at: '2025-01-03T16:00:00Z',
    },
    {
      id: 'fav-002',
      user_id: 'user-123',
      mystery_box_id: 'box-gaming-002',
      mystery_box: {
        id: 'box-gaming-002',
        name: 'Caixa Gaming Deluxe',
        image_url: 'https://test.com/gaming.jpg',
        price: 149.99,
        stock: 25,
        is_active: true,
      },
      created_at: '2025-01-04T09:15:00Z',
    },
  ];

  const testNotifications: Notification[] = [
    {
      id: 'notif-001',
      user_id: 'user-123',
      type: 'order_shipped',
      title: 'Pedido Enviado',
      message: 'Seu pedido #ORD-2025-001 foi enviado',
      data: { order_id: 'order-123' },
      is_read: false,
      created_at: '2025-01-07T10:30:00Z',
    },
    {
      id: 'notif-002',
      user_id: 'user-123',
      type: 'new_box_release',
      title: 'Nova Caixa Disponível',
      message: 'Confira a nova Caixa Gaming Deluxe',
      data: { box_id: 'box-gaming-002' },
      is_read: true,
      created_at: '2025-01-06T14:00:00Z',
    },
  ];

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Gerenciamento de perfil', () => {
    it('deve obter perfil do usuário atual', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testData.user);
      testClient.mockSuccess('get', '/user/profile', expectedResponse);

      // Act
      const _response = await userService.getProfile();

      // Assert
      expect(response).toMatchObject({
        id: 'user-test-123',
        email: 'test@crowbar.com',
        name: 'Usuário Teste',
        phone: '(11) 99999-9999',
      });
    });

    it('deve atualizar perfil do usuário', async () => {
      // Arrange
      const updateData = {
        name: 'João Silva Santos',
        phone: '(11) 98765-4321',
        birth_date: '1990-05-15',
        gender: 'male' as const,
      };

      const updatedUser = {
        ...testData.user,
        ...updateData,
        updated_at: '2025-01-07T12:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(updatedUser);
      testClient.mockSuccess('put', '/user/profile', expectedResponse);

      // Act
      const _response = await userService.updateProfile(updateData);

      // Assert
      expect(response).toMatchObject({
        name: 'João Silva Santos',
        phone: '(11) 98765-4321',
        birth_date: '1990-05-15',
        gender: 'male',
      });
    });

    it('deve atualizar avatar do usuário', async () => {
      // Arrange
      const imageFile = new FormData();
      imageFile.append('avatar', 'fake-image-data');

      const avatarResult = {
        avatar_url: 'https://storage.com/avatars/user-123-new.jpg',
      };

      const expectedResponse = testUtils.createApiResponse(avatarResult);
      testClient.mockSuccess('post', '/user/avatar', expectedResponse);

      // Act
      const _response = await userService.updateAvatar(imageFile);

      // Assert
      expect(response).toMatchObject({
        avatar_url: 'https://storage.com/avatars/user-123-new.jpg',
      });
    });

    it('deve falhar ao atualizar com dados inválidos', async () => {
      // Arrange
      const invalidData = {
        name: '', // Nome vazio
        phone: '123', // Telefone inválido
        birth_date: '2030-01-01', // Data futura
      };

      testClient.mockHttpError('put', '/user/profile', 422, {
        success: false,
        message: 'Dados inválidos',
        errors: {
          name: ['Nome é obrigatório'],
          phone: ['Telefone inválido'],
          birth_date: ['Data de nascimento não pode ser futura'],
        },
      });

      // Act & Assert
      await expect(userService.updateProfile(invalidData)).rejects.toMatchObject({
        status: 422,
        message: 'Dados inválidos',
        errors: {
          name: ['Nome é obrigatório'],
          phone: ['Telefone inválido'],
          birth_date: ['Data de nascimento não pode ser futura'],
        },
      });
    });
  });

  describe('Gerenciamento de endereços', () => {
    it('deve obter lista de endereços do usuário', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testAddresses);
      testClient.mockSuccess('get', '/user/addresses', expectedResponse);

      // Act
      const _response = await userService.getAddresses();

      // Assert
      expect(response).toHaveLength(2);
      expect(response[0]).toMatchObject({
        id: 'addr-001',
        street: 'Rua das Flores',
        number: '123',
        is_default: true,
      });
    });

    it('deve adicionar novo endereço', async () => {
      // Arrange
      const newAddress = {
        street: 'Rua Nova',
        number: '456',
        complement: 'Casa 2',
        neighborhood: 'Jardim',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '04567-890',
        country: 'BR',
        is_default: false,
      };

      const createdAddress = {
        id: 'addr-003',
        user_id: 'user-123',
        ...newAddress,
        created_at: '2025-01-07T15:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(createdAddress);
      testClient.mockSuccess('post', '/user/addresses', expectedResponse);

      // Act
      const _response = await userService.addAddress(newAddress);

      // Assert
      expect(response).toMatchObject({
        id: 'addr-003',
        street: 'Rua Nova',
        number: '456',
        zip_code: '04567-890',
      });
    });

    it('deve atualizar endereço existente', async () => {
      // Arrange
      const addressId = 'addr-001';
      const updateData = {
        complement: 'Apto 46',
        neighborhood: 'Centro Histórico',
      };

      const updatedAddress = {
        ...testAddresses[0],
        ...updateData,
        updated_at: '2025-01-07T16:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(updatedAddress);
      testClient.mockSuccess('put', `/user/addresses/${addressId}`, expectedResponse);

      // Act
      const _response = await userService.updateAddress(addressId, updateData);

      // Assert
      expect(response).toMatchObject({
        id: addressId,
        complement: 'Apto 46',
        neighborhood: 'Centro Histórico',
      });
    });

    it('deve remover endereço', async () => {
      // Arrange
      const addressId = 'addr-002';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Endereço removido com sucesso',
      });
      testClient.mockSuccess('delete', `/user/addresses/${addressId}`, expectedResponse);

      // Act
      await userService.deleteAddress(addressId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve definir endereço como padrão', async () => {
      // Arrange
      const addressId = 'addr-002';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Endereço padrão definido com sucesso',
      });
      testClient.mockSuccess('post', `/user/addresses/${addressId}/set-default`, expectedResponse);

      // Act
      await userService.setDefaultAddress(addressId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve falhar ao remover endereço padrão único', async () => {
      // Arrange
      const addressId = 'addr-001';

      testClient.mockHttpError('delete', `/user/addresses/${addressId}`, 400, {
        success: false,
        message: 'Não é possível remover o único endereço padrão',
        errors: { address: ['Endereço padrão não pode ser removido'] },
      });

      // Act & Assert
      await expect(userService.deleteAddress(addressId)).rejects.toMatchObject({
        status: 400,
        message: 'Não é possível remover o único endereço padrão',
      });
    });
  });

  describe('Preferências do usuário', () => {
    it('deve obter preferências do usuário', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testUserPreferences);
      testClient.mockSuccess('get', '/user/preferences', expectedResponse);

      // Act
      const _response = await userService.getPreferences();

      // Assert
      expect(response).toMatchObject({
        theme: 'light',
        language: 'pt-BR',
        notifications: expect.objectContaining({
          email: true,
          push: true,
          sms: false,
        }),
        box_preferences: expect.objectContaining({
          preferred_categories: ['electronics', 'gaming'],
        }),
      });
    });

    it('deve atualizar preferências do usuário', async () => {
      // Arrange
      const updateData = {
        theme: 'dark' as const,
        notifications: {
          email: false,
          push: true,
          sms: true,
          marketing: true,
        },
        box_preferences: {
          preferred_categories: ['electronics', 'books'],
          price_range: { min: 30, max: 150 },
          exclude_categories: ['fashion', 'sports'],
        },
      };

      const updatedPreferences = {
        ...testUserPreferences,
        ...updateData,
      };

      const expectedResponse = testUtils.createApiResponse(updatedPreferences);
      testClient.mockSuccess('put', '/user/preferences', expectedResponse);

      // Act
      const _response = await userService.updatePreferences(updateData);

      // Assert
      expect(response).toMatchObject({
        theme: 'dark',
        notifications: expect.objectContaining({
          email: false,
          sms: true,
          marketing: true,
        }),
        box_preferences: expect.objectContaining({
          preferred_categories: ['electronics', 'books'],
          exclude_categories: ['fashion', 'sports'],
        }),
      });
    });

    it('deve atualizar configurações de notificação', async () => {
      // Arrange
      const notificationSettings = {
        email_notifications: false,
        push_notifications: true,
        sms_notifications: true,
        marketing_emails: false,
      };

      const expectedResponse = testUtils.createApiResponse({
        message: 'Configurações atualizadas com sucesso',
      });
      testClient.mockSuccess('put', '/user/notification-settings', expectedResponse);

      // Act
      await userService.updateNotificationSettings(notificationSettings);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });
  });

  describe('Estatísticas do usuário', () => {
    it('deve obter estatísticas do usuário', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testUserStats);
      testClient.mockSuccess('get', '/user/stats', expectedResponse);

      // Act
      const _response = await userService.getStats();

      // Assert
      expect(response).toMatchObject({
        boxes_opened: 25,
        total_spent: 1250.75,
        favorite_boxes: 8,
        reviews_written: 12,
        boxes_by_category: expect.objectContaining({
          electronics: 10,
          gaming: 8,
        }),
        achievements: expect.arrayContaining([
          expect.objectContaining({
            id: 'first_box',
            name: 'Primeira Caixa',
          }),
        ]),
      });
    });

    it('deve obter histórico de atividades', async () => {
      // Arrange
      const activities = [
        {
          id: 'activity-001',
          type: 'box_opened',
          description: 'Abriu a Caixa Eletrônicos Premium',
          data: { box_id: 'box-electronics-001' },
          created_at: '2025-01-07T10:00:00Z',
        },
        {
          id: 'activity-002',
          type: 'review_written',
          description: 'Escreveu uma avaliação',
          data: { review_id: 'review-123' },
          created_at: '2025-01-06T15:30:00Z',
        },
      ];

      const expectedResponse = testUtils.createPaginatedResponse(activities);
      testClient.mockSuccess('get', '/user/activity', expectedResponse);

      // Act
      const _response = await userService.getActivityHistory();

      // Assert
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'activity-001',
        type: 'box_opened',
        description: 'Abriu a Caixa Eletrônicos Premium',
      });
    });
  });

  describe('Gerenciamento de favoritos', () => {
    it('deve obter lista de favoritos', async () => {
      // Arrange
      const expectedResponse = testUtils.createPaginatedResponse(testFavorites);
      testClient.mockSuccess('get', '/user/favorites', expectedResponse);

      // Act
      const _response = await userService.getFavorites();

      // Assert
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'fav-001',
        mystery_box_id: 'box-electronics-001',
        mystery_box: expect.objectContaining({
          name: 'Caixa Eletrônicos Premium',
        }),
      });
    });

    it('deve adicionar caixa aos favoritos', async () => {
      // Arrange
      const boxId = 'box-new-favorite';
      const newFavorite = {
        id: 'fav-003',
        user_id: 'user-123',
        mystery_box_id: boxId,
        mystery_box: {
          id: boxId,
          name: 'Nova Caixa Favorita',
          image_url: 'https://test.com/new-favorite.jpg',
          price: 75.99,
          stock: 30,
          is_active: true,
        },
        created_at: '2025-01-07T17:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(newFavorite);
      testClient.mockSuccess('post', '/user/favorites', expectedResponse);

      // Act
      const _response = await userService.addToFavorites(boxId);

      // Assert
      expect(response).toMatchObject({
        id: 'fav-003',
        mystery_box_id: boxId,
        mystery_box: expect.objectContaining({
          name: 'Nova Caixa Favorita',
        }),
      });
    });

    it('deve remover caixa dos favoritos', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Caixa removida dos favoritos',
      });
      testClient.mockSuccess('delete', `/user/favorites/${boxId}`, expectedResponse);

      // Act
      await userService.removeFromFavorites(boxId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve verificar se caixa está nos favoritos', async () => {
      // Arrange
      const boxId = 'box-electronics-001';
      const favoriteCheck = { is_favorite: true };

      const expectedResponse = testUtils.createApiResponse(favoriteCheck);
      testClient.mockSuccess('get', `/user/favorites/${boxId}/check`, expectedResponse);

      // Act
      const _response = await userService.isFavorite(boxId);

      // Assert
      expect(response).toBe(true);
    });

    it('deve retornar false para caixa não favoritada', async () => {
      // Arrange
      const boxId = 'box-not-favorite';
      const favoriteCheck = { is_favorite: false };

      const expectedResponse = testUtils.createApiResponse(favoriteCheck);
      testClient.mockSuccess('get', `/user/favorites/${boxId}/check`, expectedResponse);

      // Act
      const _response = await userService.isFavorite(boxId);

      // Assert
      expect(response).toBe(false);
    });

    it('deve falhar ao adicionar caixa já favoritada', async () => {
      // Arrange
      const boxId = 'box-electronics-001';

      testClient.mockHttpError('post', '/user/favorites', 409, {
        success: false,
        message: 'Caixa já está nos favoritos',
        errors: { mystery_box_id: ['Caixa já favoritada'] },
      });

      // Act & Assert
      await expect(userService.addToFavorites(boxId)).rejects.toMatchObject({
        status: 409,
        message: 'Caixa já está nos favoritos',
      });
    });
  });

  describe('Gerenciamento de notificações', () => {
    it('deve obter lista de notificações', async () => {
      // Arrange
      const expectedResponse = testUtils.createPaginatedResponse(testNotifications);
      testClient.mockSuccess('get', '/user/notifications', expectedResponse);

      // Act
      const _response = await userService.getNotifications();

      // Assert
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toMatchObject({
        id: 'notif-001',
        type: 'order_shipped',
        title: 'Pedido Enviado',
        is_read: false,
      });
    });

    it('deve marcar notificação como lida', async () => {
      // Arrange
      const notificationId = 'notif-001';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Notificação marcada como lida',
      });
      testClient.mockSuccess('post', `/user/notifications/${notificationId}/read`, expectedResponse);

      // Act
      await userService.markNotificationAsRead(notificationId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve marcar todas as notificações como lidas', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        message: 'Todas as notificações foram marcadas como lidas',
      });
      testClient.mockSuccess('post', '/user/notifications/read-all', expectedResponse);

      // Act
      await userService.markAllNotificationsAsRead();

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve deletar notificação', async () => {
      // Arrange
      const notificationId = 'notif-002';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Notificação deletada com sucesso',
      });
      testClient.mockSuccess('delete', `/user/notifications/${notificationId}`, expectedResponse);

      // Act
      await userService.deleteNotification(notificationId);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve obter contagem de notificações não lidas', async () => {
      // Arrange
      const unreadCount = { count: 5 };
      const expectedResponse = testUtils.createApiResponse(unreadCount);
      testClient.mockSuccess('get', '/user/notifications/unread-count', expectedResponse);

      // Act
      const _response = await userService.getUnreadNotificationsCount();

      // Assert
      expect(response).toBe(5);
    });
  });

  describe('Funcionalidades auxiliares', () => {
    it('deve alterar senha do usuário', async () => {
      // Arrange
      const passwordData = {
        current_password: 'oldpassword123',
        new_password: 'newpassword456',
        new_password_confirmation: 'newpassword456',
      };

      const expectedResponse = testUtils.createApiResponse({
        message: 'Senha alterada com sucesso',
      });
      testClient.mockSuccess('post', '/user/change-password', expectedResponse);

      // Act
      await userService.changePassword(passwordData);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve falhar ao alterar senha com senha atual incorreta', async () => {
      // Arrange
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword456',
        new_password_confirmation: 'newpassword456',
      };

      testClient.mockHttpError('post', '/user/change-password', 400, {
        success: false,
        message: 'Senha atual incorreta',
        errors: { current_password: ['Senha atual incorreta'] },
      });

      // Act & Assert
      await expect(userService.changePassword(passwordData)).rejects.toMatchObject({
        status: 400,
        message: 'Senha atual incorreta',
      });
    });

    it('deve verificar disponibilidade de email', async () => {
      // Arrange
      const email = 'novo@crowbar.com';
      const availability = { available: true };

      const expectedResponse = testUtils.createApiResponse(availability);
      testClient.mockSuccess('get', '/user/check-email', expectedResponse);

      // Act
      const _response = await userService.checkEmailAvailability(email);

      // Assert
      expect(response).toMatchObject({
        available: true,
      });
    });

    it('deve reenviar email de verificação', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        message: 'Email de verificação enviado',
      });
      testClient.mockSuccess('post', '/user/resend-verification', expectedResponse);

      // Act
      await userService.resendVerificationEmail();

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve verificar email com token', async () => {
      // Arrange
      const token = 'verification-token-123';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Email verificado com sucesso',
      });
      testClient.mockSuccess('post', '/user/verify-email', expectedResponse);

      // Act
      await userService.verifyEmail(token);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve solicitar exclusão de conta', async () => {
      // Arrange
      const reason = 'Não uso mais o aplicativo';
      const expectedResponse = testUtils.createApiResponse({
        message: 'Solicitação de exclusão enviada',
        scheduled_deletion: '2025-01-14T00:00:00Z',
      });
      testClient.mockSuccess('post', '/user/request-deletion', expectedResponse);

      // Act
      await userService.requestAccountDeletion(reason);

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve cancelar solicitação de exclusão', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse({
        message: 'Solicitação de exclusão cancelada',
      });
      testClient.mockSuccess('post', '/user/cancel-deletion', expectedResponse);

      // Act
      await userService.cancelAccountDeletion();

      // Assert - Não deve lançar erro
      expect(true).toBe(true);
    });

    it('deve exportar dados do usuário', async () => {
      // Arrange
      const exportResult = {
        download_url: 'https://storage.com/exports/user-123-data.zip',
        expires_at: '2025-01-14T00:00:00Z',
      };

      const expectedResponse = testUtils.createApiResponse(exportResult);
      testClient.mockSuccess('post', '/user/export-data', expectedResponse);

      // Act
      const _response = await userService.exportUserData();

      // Assert
      expect(response).toMatchObject({
        download_url: 'https://storage.com/exports/user-123-data.zip',
        expires_at: '2025-01-14T00:00:00Z',
      });
    });
  });

  describe('Cenários de erro', () => {
    it('deve tratar erro de rede durante busca de perfil', async () => {
      // Arrange
      testClient.mockNetworkError('get', '/user/profile');

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('Erro de conexão'),
      });
    });

    it('deve tratar timeout durante atualização de perfil', async () => {
      // Arrange
      const updateData = { name: 'João Silva' };
      testClient.mockTimeout('put', '/user/profile');

      // Act & Assert
      await expect(userService.updateProfile(updateData)).rejects.toMatchObject({
        status: 0,
        message: expect.stringContaining('timeout'),
      });
    });

    it('deve tratar erro 500 durante busca de estatísticas', async () => {
      // Arrange
      testClient.mockHttpError('get', '/user/stats', 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getStats()).rejects.toMatchObject({
        status: 500,
        message: 'Erro interno do servidor',
      });
    });

    it('deve tratar erro 403 ao tentar acessar dados de outro usuário', async () => {
      // Arrange
      testClient.mockHttpError('get', '/user/profile', 403, {
        success: false,
        message: 'Acesso negado',
        errors: {},
      });

      // Act & Assert
      await expect(userService.getProfile()).rejects.toMatchObject({
        status: 403,
        message: 'Acesso negado',
      });
    });

    it('deve tratar erro isFavorite graciosamente', async () => {
      // Arrange
      const boxId = 'box-error';
      testClient.mockHttpError('get', `/user/favorites/${boxId}/check`, 500, {
        success: false,
        message: 'Erro interno do servidor',
        errors: {},
      });

      // Act
      const _response = await userService.isFavorite(boxId);

      // Assert
      expect(response).toBe(false); // Deve retornar false em caso de erro
    });
  });
});