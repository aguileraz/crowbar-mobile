import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from '../analyticsService';
import { store } from '../../store';
import { 
  addPendingEvent, 
  recordConversion,
  recordApiResponseTime,
  recordError 
} from '../../store/slices/analyticsSlice';

// Mock das dependências
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../store');

describe('AnalyticsService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset do serviço para estado inicial
    (analyticsService as any).isInitialized = false;
    (analyticsService as any).sessionId = '';
    (analyticsService as any).userId = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('deve inicializar o serviço com sucesso', async () => {
      // Preparar dados mockados
      const mockSessionId = 'session-123';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockSessionId);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('user-123');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // pending events

      // Executar inicialização
      const result = await analyticsService.initialize();

      // Verificar resultado
      expect(result.sessionId).toBe(mockSessionId);
      expect((analyticsService as any).isInitialized).toBe(true);
      expect((analyticsService as any).userId).toBe('user-123');
    });

    it('deve criar novo session ID se não existir', async () => {
      // Mock para retornar null quando buscar session ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // user ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // pending events
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Executar inicialização
      const result = await analyticsService.initialize();

      // Verificar que foi criado e salvo novo session ID
      expect(result.sessionId).toBeTruthy();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics_session_id',
        expect.any(String)
      );
    });

    it('deve processar eventos pendentes na inicialização', async () => {
      // Mock de eventos pendentes
      const pendingEvents = JSON.stringify([
        { name: 'test_event', parameters: { test: true } }
      ]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('session-123');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null); // user ID
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(pendingEvents);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      // Executar inicialização
      await analyticsService.initialize();

      // Verificar que eventos pendentes foram processados
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('analytics_pending_events');
    });

    it('deve tratar erro na inicialização', async () => {
      // Mock de erro
      const mockError = new Error('Initialization failed');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(mockError);

      // Verificar que erro é propagado
      await expect(analyticsService.initialize()).rejects.toThrow('Initialization failed');
      expect((analyticsService as any).isInitialized).toBe(false);
    });
  });

  describe('logEvent', () => {
    beforeEach(async () => {
      // Inicializar serviço para testes
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('session-123');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      await analyticsService.initialize();
    });

    it('deve registrar evento com sucesso', async () => {
      // Executar log de evento
      await analyticsService.logEvent('test_event', { param1: 'value1' });

      // Verificar que evento foi registrado
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        'test_event',
        expect.objectContaining({ param1: 'value1' })
      );
    });

    it('deve sanitizar parâmetros do evento', async () => {
      // Evento com parâmetros que precisam sanitização
      const params = {
        valid_param: 'value',
        'invalid-param': 'should be sanitized',
        nested: { object: 'should be stringified' },
        longString: 'a'.repeat(200), // string muito longa
        nullValue: null,
        undefinedValue: undefined
      };

      await analyticsService.logEvent('test_event', params);

      // Verificar sanitização
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        'test_event',
        expect.objectContaining({
          valid_param: 'value',
          invalid_param: 'should be sanitized',
          nested: '{"object":"should be stringified"}',
          longString: expect.stringMatching(/^a{100}$/), // truncado para 100 chars
          nullValue: 'null',
          // undefinedValue não deve estar presente
        })
      );
    });

    it('deve adicionar evento pendente se não inicializado', async () => {
      // Reset para estado não inicializado
      (analyticsService as any).isInitialized = false;
      const mockDispatch = jest.fn();
      (store.dispatch as jest.Mock) = mockDispatch;

      // Tentar registrar evento
      await analyticsService.logEvent('test_event', { test: true });

      // Verificar que foi adicionado como pendente
      expect(mockDispatch).toHaveBeenCalledWith(
        addPendingEvent({ name: 'test_event', parameters: { test: true } })
      );
    });

    it('deve adicionar evento pendente em caso de erro', async () => {
      // Mock para simular erro na sanitização
      const mockDispatch = jest.fn();
      (store.dispatch as jest.Mock) = mockDispatch;
      jest.spyOn(analyticsService as any, 'sanitizeParameters').mockImplementation(() => {
        throw new Error('Sanitization error');
      });

      // Tentar registrar evento
      await analyticsService.logEvent('test_event', { test: true });

      // Verificar que foi adicionado como pendente
      expect(mockDispatch).toHaveBeenCalledWith(
        addPendingEvent({ name: 'test_event', parameters: { test: true } })
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error logging event:',
        expect.any(Error)
      );
    });
  });

  describe('setUserProperties', () => {
    it('deve definir propriedades do usuário', async () => {
      const properties = {
        plan: 'premium',
        registration_date: '2025-01-01'
      };

      await analyticsService.setUserProperties(properties);

      // Verificar que propriedades foram salvas
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics_user_properties',
        JSON.stringify(properties)
      );
      expect(console.log).toHaveBeenCalledWith(
        'Analytics User Properties:',
        properties
      );
    });

    it('deve tratar erro ao definir propriedades', async () => {
      const mockError = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(mockError);

      await expect(
        analyticsService.setUserProperties({ test: true })
      ).rejects.toThrow('Storage error');
    });
  });

  describe('setUserId', () => {
    it('deve definir ID do usuário', async () => {
      await analyticsService.setUserId('user-456');

      expect((analyticsService as any).userId).toBe('user-456');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'analytics_user_id',
        'user-456'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Analytics User ID set:',
        'user-456'
      );
    });

    it('deve remover ID do usuário quando null', async () => {
      await analyticsService.setUserId(null);

      expect((analyticsService as any).userId).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('analytics_user_id');
    });

    it('deve tratar erro ao definir ID', async () => {
      const mockError = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(mockError);

      await expect(
        analyticsService.setUserId('user-123')
      ).rejects.toThrow('Storage error');
    });
  });

  describe('logScreenView', () => {
    beforeEach(async () => {
      // Inicializar serviço
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await analyticsService.initialize();
    });

    it('deve registrar visualização de tela', async () => {
      jest.spyOn(analyticsService, 'logEvent');

      await analyticsService.logScreenView('HomeScreen', 'Home');

      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'screen_view',
        expect.objectContaining({
          screen_name: 'HomeScreen',
          screen_class: 'Home',
          session_id: expect.any(String)
        })
      );
    });

    it('deve usar screen_name como screen_class se não fornecido', async () => {
      jest.spyOn(analyticsService, 'logEvent');

      await analyticsService.logScreenView('ProfileScreen');

      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'screen_view',
        expect.objectContaining({
          screen_name: 'ProfileScreen',
          screen_class: 'ProfileScreen'
        })
      );
    });
  });

  describe('trackPurchase', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await analyticsService.initialize();
    });

    it('deve rastrear compra com sucesso', async () => {
      const mockDispatch = jest.fn();
      (store.dispatch as jest.Mock) = mockDispatch;
      jest.spyOn(analyticsService, 'logEvent');

      const purchaseData = {
        transactionId: 'trans-123',
        value: 99.90,
        currency: 'BRL',
        items: [
          {
            item_id: 'item-1',
            item_name: 'Product 1',
            item_category: 'Category A',
            quantity: 2,
            price: 49.95
          }
        ]
      };

      await analyticsService.trackPurchase(
        purchaseData.transactionId,
        purchaseData.value,
        purchaseData.currency,
        purchaseData.items
      );

      // Verificar log do evento
      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'purchase',
        expect.objectContaining({
          transaction_id: purchaseData.transactionId,
          value: purchaseData.value,
          currency: purchaseData.currency,
          items: purchaseData.items
        })
      );

      // Verificar registro de conversão
      expect(mockDispatch).toHaveBeenCalledWith(
        recordConversion({
          event: 'purchase',
          value: purchaseData.value,
          currency: purchaseData.currency
        })
      );
    });
  });

  describe('trackError', () => {
    it('deve rastrear erro corretamente', async () => {
      const mockDispatch = jest.fn();
      (store.dispatch as jest.Mock) = mockDispatch;
      jest.spyOn(analyticsService, 'logEvent');

      const error = new Error('Test error');
      const context = { screen: 'HomeScreen', action: 'button_click' };

      await analyticsService.trackError(error, context);

      // Verificar log do evento
      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'app_error',
        expect.objectContaining({
          error_message: 'Test error',
          error_stack: expect.any(String),
          error_context: context
        })
      );

      // Verificar dispatch para Redux
      expect(mockDispatch).toHaveBeenCalledWith(
        recordError({
          message: 'Test error',
          stack: expect.any(String),
          context
        })
      );
    });
  });

  describe('trackApiCall', () => {
    it('deve rastrear chamada de API', async () => {
      const mockDispatch = jest.fn();
      (store.dispatch as jest.Mock) = mockDispatch;

      const apiData = {
        endpoint: '/api/users',
        method: 'GET' as const,
        responseTime: 250,
        statusCode: 200
      };

      await analyticsService.trackApiCall(
        apiData.endpoint,
        apiData.method,
        apiData.responseTime,
        apiData.statusCode
      );

      // Verificar dispatch
      expect(mockDispatch).toHaveBeenCalledWith(
        recordApiResponseTime({
          endpoint: apiData.endpoint,
          duration: apiData.responseTime,
          statusCode: apiData.statusCode
        })
      );
    });

    it('deve rastrear erro de API', async () => {
      jest.spyOn(analyticsService, 'logEvent');

      await analyticsService.trackApiCall(
        '/api/users',
        'POST',
        500,
        500
      );

      // Verificar log de erro
      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'api_error',
        expect.objectContaining({
          endpoint: '/api/users',
          method: 'POST',
          response_time: 500,
          status_code: 500
        })
      );
    });
  });

  describe('Performance tracking', () => {
    it('deve iniciar medição de performance', () => {
      const startTime = analyticsService.startPerformanceMeasure('test_operation');
      
      expect(startTime).toBeGreaterThan(0);
      expect((analyticsService as any).performanceMeasures.get('test_operation')).toBe(startTime);
    });

    it('deve finalizar medição de performance', async () => {
      jest.spyOn(analyticsService, 'logEvent');
      
      // Iniciar medição
      analyticsService.startPerformanceMeasure('test_operation');
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Finalizar medição
      const duration = await analyticsService.endPerformanceMeasure('test_operation');

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'performance_measure',
        expect.objectContaining({
          operation: 'test_operation',
          duration: expect.any(Number)
        })
      );
    });

    it('deve retornar -1 se medição não existir', async () => {
      const duration = await analyticsService.endPerformanceMeasure('non_existent');
      expect(duration).toBe(-1);
    });
  });

  describe('Campaign tracking', () => {
    it('deve rastrear origem de campanha', async () => {
      jest.spyOn(analyticsService, 'logEvent');
      jest.spyOn(analyticsService, 'setUserProperties');

      const campaignData = {
        source: 'facebook',
        medium: 'social',
        campaign: 'summer_sale'
      };

      await analyticsService.trackCampaign(
        campaignData.source,
        campaignData.medium,
        campaignData.campaign
      );

      // Verificar log de evento
      expect(analyticsService.logEvent).toHaveBeenCalledWith(
        'campaign_start',
        campaignData
      );

      // Verificar propriedades do usuário
      expect(analyticsService.setUserProperties).toHaveBeenCalledWith({
        campaign_source: campaignData.source,
        campaign_medium: campaignData.medium,
        campaign_name: campaignData.campaign
      });
    });
  });

  describe('Crowbar Custom Events', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await analyticsService.initialize();
    });

    describe('E-commerce Events', () => {
      it('deve rastrear visualização de item', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        const item = {
          item_id: 'box-123',
          item_name: 'Mystery Box Premium',
          item_category: 'Electronics',
          price: 199.90,
          currency: 'BRL'
        };

        await analyticsService.trackViewItem(item);

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'view_item',
          expect.objectContaining({
            ...item,
            currency: 'BRL'
          })
        );
      });

      it('deve rastrear adição ao carrinho', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        const item = {
          item_id: 'box-123',
          item_name: 'Mystery Box Premium',
          item_category: 'Electronics',
          quantity: 2,
          price: 199.90
        };

        await analyticsService.trackAddToCart(item);

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'add_to_cart',
          expect.objectContaining({
            ...item,
            currency: 'BRL',
            value: 399.80
          })
        );
      });

      it('deve rastrear início do checkout', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        const items = [
          { item_id: '1', item_name: 'Box 1', price: 100 },
          { item_id: '2', item_name: 'Box 2', price: 200 }
        ];

        await analyticsService.trackBeginCheckout(items, 300, 'BRL');

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'begin_checkout',
          expect.objectContaining({
            items,
            value: 300,
            currency: 'BRL',
            item_count: 2
          })
        );
      });
    });

    describe('Mystery Box Events', () => {
      it('deve rastrear visualização de caixa', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        const box = {
          box_id: 'box-456',
          box_name: 'Epic Gaming Box',
          category: 'Gaming',
          price: 299.90,
          rarity_level: 'epic'
        };

        await analyticsService.trackBoxViewed(box);

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'box_viewed',
          expect.objectContaining({
            ...box,
            view_time: expect.any(Number)
          })
        );
      });

      it('deve rastrear abertura de caixa', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        const items = [
          { id: '1', name: 'Item 1', rarity: 'rare', value: 150 },
          { id: '2', name: 'Item 2', rarity: 'common', value: 50 }
        ];

        await analyticsService.trackBoxOpening(
          'box-456',
          'Epic Gaming Box',
          299.90,
          items
        );

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'box_opened',
          expect.objectContaining({
            box_id: 'box-456',
            box_name: 'Epic Gaming Box',
            cost: 299.90,
            total_value: 200,
            profit: -99.90,
            items_count: 2,
            rare_items: 1
          })
        );
      });

      it('deve rastrear compartilhamento de caixa', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.trackBoxShared({
          box_id: 'box-789',
          box_name: 'Mystery Tech Box',
          share_method: 'whatsapp',
          items_received: 5
        });

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'box_shared',
          expect.objectContaining({
            box_id: 'box-789',
            box_name: 'Mystery Tech Box',
            share_method: 'whatsapp',
            items_received: 5,
            share_time: expect.any(Number)
          })
        );
      });
    });

    describe('Engagement Events', () => {
      it('deve rastrear submissão de review', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.trackReviewSubmitted({
          box_id: 'box-123',
          rating: 5,
          has_comment: true,
          has_photo: false
        });

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'review_submitted',
          expect.objectContaining({
            box_id: 'box-123',
            rating: 5,
            has_comment: true,
            has_photo: false,
            submit_time: expect.any(Number)
          })
        );
      });

      it('deve rastrear compartilhamento social', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.trackSocialShare({
          content_type: 'box_opening',
          content_id: 'opening-123',
          share_method: 'instagram'
        });

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'social_share',
          expect.objectContaining({
            content_type: 'box_opening',
            content_id: 'opening-123',
            share_method: 'instagram',
            share_time: expect.any(Number)
          })
        );
      });
    });

    describe('Performance Events', () => {
      it('deve rastrear latência da API', async () => {
        jest.spyOn(analyticsService, 'logEvent');
        const mockDispatch = jest.fn();
        (store.dispatch as jest.Mock) = mockDispatch;

        await analyticsService.trackApiLatency(
          '/api/boxes',
          'GET',
          250,
          200
        );

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'api_latency',
          expect.objectContaining({
            endpoint: '/api/boxes',
            method: 'GET',
            response_time_ms: 250,
            status_code: 200,
            is_success: true
          })
        );

        expect(mockDispatch).toHaveBeenCalledWith(
          recordApiResponseTime({
            endpoint: '/api/boxes',
            responseTime: 250
          })
        );
      });

      it('deve rastrear tempo de carregamento de tela', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.trackScreenLoadTime('ShopScreen', 1500);

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'screen_load_time',
          expect.objectContaining({
            screen_name: 'ShopScreen',
            load_time_ms: 1500,
            is_slow: false
          })
        );
      });

      it('deve marcar tela como lenta se > 3000ms', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.trackScreenLoadTime('BoxDetailsScreen', 4500);

        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'screen_load_time',
          expect.objectContaining({
            screen_name: 'BoxDetailsScreen',
            load_time_ms: 4500,
            is_slow: true
          })
        );
      });
    });

    describe('Privacy and LGPD', () => {
      it('deve definir consentimento de analytics', async () => {
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.setAnalyticsConsent(true);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'analytics_consent',
          'true'
        );
        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'analytics_consent_updated',
          expect.objectContaining({
            consented: true,
            update_time: expect.any(Number)
          })
        );
      });

      it('deve verificar consentimento de analytics', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

        const consent = await analyticsService.checkAnalyticsConsent();

        expect(consent).toBe(true);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('analytics_consent');
      });

      it('deve deletar dados do usuário (LGPD)', async () => {
        jest.spyOn(analyticsService, 'setUserId');
        jest.spyOn(analyticsService, 'logEvent');

        await analyticsService.deleteUserData();

        expect(analyticsService.setUserId).toHaveBeenCalledWith(null);
        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
          'analytics_user_id',
          'analytics_user_properties',
          'analytics_pending_events',
          'analytics_consent',
          'debug_analytics_events'
        ]);
        expect(analyticsService.logEvent).toHaveBeenCalledWith(
          'user_data_deleted',
          expect.objectContaining({
            deletion_time: expect.any(Number)
          })
        );
      });
    });

    describe('User Properties and Audiences', () => {
      it('deve definir segmento do usuário', async () => {
        jest.spyOn(analyticsService, 'setUserProperties');

        await analyticsService.setUserSegment('vip_customer');

        expect(analyticsService.setUserProperties).toHaveBeenCalledWith({
          user_segment: 'vip_customer',
          segment_updated_at: expect.any(String)
        });
      });

      it('deve calcular nível de engajamento - alto', async () => {
        jest.spyOn(analyticsService, 'setUserProperties');

        await analyticsService.setEngagementProperties({
          total_purchases: 15,
          boxes_opened: 25,
          total_spent: 2500
        });

        expect(analyticsService.setUserProperties).toHaveBeenCalledWith(
          expect.objectContaining({
            total_purchases: 15,
            boxes_opened: 25,
            total_spent: 2500,
            engagement_level: 'high'
          })
        );
      });

      it('deve calcular nível de engajamento - médio', async () => {
        jest.spyOn(analyticsService, 'setUserProperties');

        await analyticsService.setEngagementProperties({
          total_purchases: 7,
          boxes_opened: 12
        });

        expect(analyticsService.setUserProperties).toHaveBeenCalledWith(
          expect.objectContaining({
            engagement_level: 'medium'
          })
        );
      });

      it('deve calcular nível de engajamento - baixo', async () => {
        jest.spyOn(analyticsService, 'setUserProperties');

        await analyticsService.setEngagementProperties({
          total_purchases: 2,
          boxes_opened: 3
        });

        expect(analyticsService.setUserProperties).toHaveBeenCalledWith(
          expect.objectContaining({
            engagement_level: 'low'
          })
        );
      });
    });
  });
});