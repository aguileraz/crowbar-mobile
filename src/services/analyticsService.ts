import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import { store } from '../store';
import { 
  recordApiResponseTime, 
  recordError, 
  addPendingEvent,
  recordConversion 
} from '../store/slices/analyticsSlice';

/**
 * Serviço de Analytics
 * Integração com Firebase Analytics e métricas customizadas
 * 
 * Eventos customizados do Crowbar:
 * - E-commerce: view_item, add_to_cart, purchase, remove_from_cart
 * - Caixas Mistério: box_viewed, box_opened, box_shared, box_favorited
 * - Engajamento: user_engagement, social_share, review_submitted
 * - Performance: api_latency, screen_load_time, app_performance
 */

class AnalyticsService {
  private isInitialized = false;
  private sessionId = '';
  private userId: string | null = null;

  // Storage keys
  private readonly STORAGE_KEYS = {
    USER_ID: 'analytics_user_id',
    SESSION_ID: 'analytics_session_id',
    PENDING_EVENTS: 'analytics_pending_events',
    USER_PROPERTIES: 'analytics_user_properties',
  };

  /**
   * Inicializar serviço de analytics
   */
  async initialize(): Promise<{ sessionId: string }> {
    try {
      // Generate or restore session ID
      this.sessionId = await this.getOrCreateSessionId();
      
      // Restore user ID
      this.userId = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_ID);
      
      // Initialize Firebase Analytics (mock implementation)
      await this.initializeFirebaseAnalytics();
      
      // Process pending events
      await this.processPendingEvents();
      
      this.isInitialized = true;
      
      // Track app start
      this.logEvent('app_start', {
        session_id: this.sessionId,
        timestamp: Date.now(),
      });
      
      return { sessionId: this.sessionId };
    } catch (error) {
      console.error('Error initializing analytics:', error);
      throw error;
    }
  }

  /**
   * Initialize Firebase Analytics
   */
  private async initializeFirebaseAnalytics(): Promise<void> {
    try {
      // Habilitar coleta de analytics
      await analytics().setAnalyticsCollectionEnabled(true);
      
      // Configurar propriedades padrão do usuário
      await analytics().setUserProperties({
        app_version: '1.0.0',
        platform: 'mobile',
        last_login: new Date().toISOString(),
      });
      
      console.log('Firebase Analytics inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Firebase Analytics:', error);
      throw error;
    }
  }

  /**
   * Log event
   */
  async logEvent(name: string, parameters?: Record<string, any>): Promise<void> {
    try {
      if (!this.isInitialized) {
        // Store as pending event
        store.dispatch(addPendingEvent({ name, parameters }));
        return;
      }

      // Sanitize parameters for Firebase
      const sanitizedParams = this.sanitizeParameters(parameters);
      
      // Enviar evento para Firebase Analytics
      await analytics().logEvent(name, sanitizedParams);
      
      if (__DEV__) {
        console.log('Analytics Event:', name, sanitizedParams);
      }
      
      // Store locally for debugging
      if (__DEV__) {
        await this.storeEventLocally(name, sanitizedParams);
      }
    } catch (error) {
      console.error('Error logging event:', error);
      // Store as pending event for retry
      store.dispatch(addPendingEvent({ name, parameters }));
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      const sanitizedProps = this.sanitizeParameters(properties);
      
      // Definir propriedades do usuário no Firebase
      await analytics().setUserProperties(sanitizedProps);
      
      if (__DEV__) {
        console.log('Analytics User Properties:', sanitizedProps);
      }
      
      // Store locally
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(sanitizedProps)
      );
    } catch (error) {
      console.error('Error setting user properties:', error);
      throw error;
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      this.userId = userId;
      
      if (userId) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
        
        // Definir ID do usuário no Firebase
        await analytics().setUserId(userId);
        
        if (__DEV__) {
          console.log('Analytics User ID definido:', userId);
        }
      } else {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.USER_ID);
      }
    } catch (error) {
      console.error('Error setting user ID:', error);
      throw error;
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await this.logEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
        session_id: this.sessionId,
      });
    } catch (error) {
      console.error('Error logging screen view:', error);
    }
  }

  /**
   * Track purchase
   */
  async trackPurchase(
    transactionId: string,
    value: number,
    currency: string,
    items: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      quantity: number;
      price: number;
    }>
  ): Promise<void> {
    try {
      await this.logEvent('purchase', {
        transaction_id: transactionId,
        value,
        currency,
        items,
      });
      
      // Track conversion
      store.dispatch(recordConversion({
        event: 'purchase',
        value,
        currency,
      }));
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  /**
   * Track box opening
   */
  async trackBoxOpening(
    boxId: string,
    boxName: string,
    cost: number,
    itemsReceived: Array<{
      id: string;
      name: string;
      rarity: string;
      value: number;
    }>
  ): Promise<void> {
    try {
      const totalValue = itemsReceived.reduce((sum, item) => sum + item.value, 0);
      
      await this.logEvent('box_opened', {
        box_id: boxId,
        box_name: boxName,
        cost,
        total_value: totalValue,
        profit: totalValue - cost,
        items_count: itemsReceived.length,
        rare_items: itemsReceived.filter(item => item.rarity === 'rare').length,
      });
    } catch (error) {
      console.error('Error tracking box opening:', error);
    }
  }

  /**
   * Track API performance
   */
  trackApiCall(endpoint: string, method: string, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    store.dispatch(recordApiResponseTime({ endpoint, responseTime }));
    
    this.logEvent('api_call', {
      endpoint,
      method,
      response_time: responseTime,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    const errorType = error.name || 'UnknownError';
    
    store.dispatch(recordError({ errorType }));
    
    this.logEvent('error_occurred', {
      error_type: errorType,
      error_message: error.message,
      context,
      stack_trace: error.stack,
    });
  }

  /**
   * Track user engagement
   */
  async trackEngagement(action: string, target?: string, value?: number): Promise<void> {
    try {
      await this.logEvent('user_engagement', {
        action,
        target,
        value,
        session_id: this.sessionId,
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }

  /**
   * Eventos E-commerce
   */
  
  // Visualização de item
  async trackViewItem(item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency?: string;
  }): Promise<void> {
    try {
      await this.logEvent('view_item', {
        ...item,
        currency: item.currency || 'BRL',
      });
    } catch (error) {
      console.error('Erro ao rastrear view_item:', error);
    }
  }

  // Adicionar ao carrinho
  async trackAddToCart(item: {
    item_id: string;
    item_name: string;
    item_category: string;
    quantity: number;
    price: number;
    currency?: string;
  }): Promise<void> {
    try {
      await this.logEvent('add_to_cart', {
        ...item,
        currency: item.currency || 'BRL',
        value: item.price * item.quantity,
      });
    } catch (error) {
      console.error('Erro ao rastrear add_to_cart:', error);
    }
  }

  // Remover do carrinho
  async trackRemoveFromCart(item: {
    item_id: string;
    item_name: string;
    item_category: string;
    quantity: number;
    price: number;
    currency?: string;
  }): Promise<void> {
    try {
      await this.logEvent('remove_from_cart', {
        ...item,
        currency: item.currency || 'BRL',
        value: item.price * item.quantity,
      });
    } catch (error) {
      console.error('Erro ao rastrear remove_from_cart:', error);
    }
  }

  // Início do checkout
  async trackBeginCheckout(items: Array<any>, value: number, currency?: string): Promise<void> {
    try {
      await this.logEvent('begin_checkout', {
        items,
        value,
        currency: currency || 'BRL',
        item_count: items.length,
      });
    } catch (error) {
      console.error('Erro ao rastrear begin_checkout:', error);
    }
  }

  /**
   * Eventos de Caixas Mistério
   */
  
  // Caixa visualizada
  async trackBoxViewed(box: {
    box_id: string;
    box_name: string;
    category: string;
    price: number;
    rarity_level?: string;
  }): Promise<void> {
    try {
      await this.logEvent('box_viewed', {
        ...box,
        view_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao rastrear box_viewed:', error);
    }
  }

  // Caixa compartilhada
  async trackBoxShared(box: {
    box_id: string;
    box_name: string;
    share_method: string;
    items_received?: number;
  }): Promise<void> {
    try {
      await this.logEvent('box_shared', {
        ...box,
        share_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao rastrear box_shared:', error);
    }
  }

  // Caixa favoritada
  async trackBoxFavorited(box: {
    box_id: string;
    box_name: string;
    action: 'add' | 'remove';
  }): Promise<void> {
    try {
      await this.logEvent('box_favorited', {
        ...box,
        is_favorited: box.action === 'add',
      });
    } catch (error) {
      console.error('Erro ao rastrear box_favorited:', error);
    }
  }

  /**
   * Eventos de Engajamento
   */
  
  // Review submetido
  async trackReviewSubmitted(review: {
    box_id: string;
    rating: number;
    has_comment: boolean;
    has_photo: boolean;
  }): Promise<void> {
    try {
      await this.logEvent('review_submitted', {
        ...review,
        submit_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao rastrear review_submitted:', error);
    }
  }

  // Compartilhamento social
  async trackSocialShare(content: {
    content_type: string;
    content_id: string;
    share_method: string;
  }): Promise<void> {
    try {
      await this.logEvent('social_share', {
        ...content,
        share_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao rastrear social_share:', error);
    }
  }

  /**
   * Eventos de Performance
   */
  
  // Latência da API
  async trackApiLatency(endpoint: string, method: string, responseTime: number, status: number): Promise<void> {
    try {
      await this.logEvent('api_latency', {
        endpoint,
        method,
        response_time_ms: responseTime,
        status_code: status,
        is_success: status >= 200 && status < 300,
      });

      // Também armazenar no Redux para dashboard
      store.dispatch(recordApiResponseTime({ endpoint, responseTime }));
    } catch (error) {
      console.error('Erro ao rastrear api_latency:', error);
    }
  }

  // Tempo de carregamento de tela
  async trackScreenLoadTime(screenName: string, loadTime: number): Promise<void> {
    try {
      await this.logEvent('screen_load_time', {
        screen_name: screenName,
        load_time_ms: loadTime,
        is_slow: loadTime > 3000,
      });
    } catch (error) {
      console.error('Erro ao rastrear screen_load_time:', error);
    }
  }

  // Performance geral do app
  async trackAppPerformance(metrics: {
    fps?: number;
    memory_usage?: number;
    battery_level?: number;
    network_type?: string;
  }): Promise<void> {
    try {
      await this.logEvent('app_performance', {
        ...metrics,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao rastrear app_performance:', error);
    }
  }

  /**
   * Configuração de User Properties e Audiences
   */
  
  // Configurar segmento do usuário
  async setUserSegment(segment: string): Promise<void> {
    try {
      await this.setUserProperties({
        user_segment: segment,
        segment_updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao definir segmento do usuário:', error);
    }
  }

  // Configurar propriedades de engajamento
  async setEngagementProperties(properties: {
    total_purchases?: number;
    total_spent?: number;
    boxes_opened?: number;
    favorite_category?: string;
    last_purchase_date?: string;
  }): Promise<void> {
    try {
      await this.setUserProperties({
        ...properties,
        engagement_level: this.calculateEngagementLevel(properties),
      });
    } catch (error) {
      console.error('Erro ao definir propriedades de engajamento:', error);
    }
  }

  // Calcular nível de engajamento
  private calculateEngagementLevel(properties: any): string {
    const { total_purchases = 0, boxes_opened = 0 } = properties;
    
    if (total_purchases > 10 || boxes_opened > 20) return 'high';
    if (total_purchases > 5 || boxes_opened > 10) return 'medium';
    return 'low';
  }

  /**
   * Rastreamento de Conversões
   */
  
  // Rastrear conversão de marketing
  async trackMarketingConversion(campaign: {
    source: string;
    medium: string;
    campaign_name: string;
    conversion_value?: number;
  }): Promise<void> {
    try {
      await this.logEvent('marketing_conversion', {
        ...campaign,
        conversion_time: Date.now(),
      });

      // Registrar conversão no Redux
      if (campaign.conversion_value) {
        store.dispatch(recordConversion({
          event: 'marketing_conversion',
          value: campaign.conversion_value,
          currency: 'BRL',
        }));
      }
    } catch (error) {
      console.error('Erro ao rastrear conversão de marketing:', error);
    }
  }

  /**
   * Privacy Controls e LGPD Compliance
   */
  
  // Definir consentimento do usuário
  async setAnalyticsConsent(consented: boolean): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(consented);
      await AsyncStorage.setItem('analytics_consent', consented.toString());
      
      await this.logEvent('analytics_consent_updated', {
        consented,
        update_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao definir consentimento:', error);
    }
  }

  // Verificar consentimento
  async checkAnalyticsConsent(): Promise<boolean> {
    try {
      const consent = await AsyncStorage.getItem('analytics_consent');
      return consent === 'true';
    } catch (error) {
      console.error('Erro ao verificar consentimento:', error);
      return false;
    }
  }

  // Deletar dados do usuário (LGPD)
  async deleteUserData(): Promise<void> {
    try {
      // Limpar ID do usuário
      await this.setUserId(null);
      
      // Limpar propriedades armazenadas localmente
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER_ID,
        this.STORAGE_KEYS.USER_PROPERTIES,
        this.STORAGE_KEYS.PENDING_EVENTS,
        'analytics_consent',
        'debug_analytics_events',
      ]);
      
      // Resetar sessão
      this.sessionId = await this.getOrCreateSessionId();
      
      await this.logEvent('user_data_deleted', {
        deletion_time: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao deletar dados do usuário:', error);
    }
  }

  /**
   * Get or create session ID
   */
  private async getOrCreateSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
      
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Process pending events
   */
  private async processPendingEvents(): Promise<void> {
    try {
      const pendingEventsJson = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_EVENTS);
      
      if (pendingEventsJson) {
        const pendingEvents = JSON.parse(pendingEventsJson);
        
        for (const event of pendingEvents) {
          try {
            await this.logEvent(event.name, event.parameters);
          } catch (error) {
            console.error('Error processing pending event:', error);
          }
        }
        
        // Clear processed events
        await AsyncStorage.removeItem(this.STORAGE_KEYS.PENDING_EVENTS);
      }
    } catch (error) {
      console.error('Error processing pending events:', error);
    }
  }

  /**
   * Sanitize parameters for Firebase
   */
  private sanitizeParameters(parameters?: Record<string, any>): Record<string, any> {
    if (!parameters) return {};
    
    const sanitized: Record<string, any> = {};
    
    Object.entries(parameters).forEach(([key, value]) => {
      // Firebase parameter name restrictions
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40);
      
      // Firebase parameter value restrictions
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = value.substring(0, 100);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (value === null || value === undefined) {
        sanitized[sanitizedKey] = null;
      } else {
        sanitized[sanitizedKey] = JSON.stringify(value).substring(0, 100);
      }
    });
    
    return sanitized;
  }

  /**
   * Store event locally for debugging
   */
  private async storeEventLocally(name: string, parameters: Record<string, any>): Promise<void> {
    try {
      const event = {
        name,
        parameters,
        timestamp: Date.now(),
        session_id: this.sessionId,
        user_id: this.userId,
      };
      
      const existingEvents = await AsyncStorage.getItem('debug_analytics_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorage.setItem('debug_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Error storing event locally:', error);
    }
  }

  /**
   * Get debug events (for development)
   */
  async getDebugEvents(): Promise<any[]> {
    try {
      const eventsJson = await AsyncStorage.getItem('debug_analytics_events');
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      console.error('Error getting debug events:', error);
      return [];
    }
  }

  /**
   * Clear debug events
   */
  async clearDebugEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem('debug_analytics_events');
    } catch (error) {
      console.error('Error clearing debug events:', error);
    }
  }

  /**
   * Get analytics status
   */
  getStatus(): {
    isInitialized: boolean;
    sessionId: string;
    userId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
