import AsyncStorage from '@react-native-async-storage/async-storage';
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
      // Mock Firebase Analytics initialization
      // In real implementation, this would be:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().setAnalyticsCollectionEnabled(true);
      
      console.log('Firebase Analytics initialized (mock)');
    } catch (error) {
      console.error('Error initializing Firebase Analytics:', error);
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
      
      // Mock Firebase Analytics event logging
      // In real implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().logEvent(name, sanitizedParams);
      
      console.log('Analytics Event:', name, sanitizedParams);
      
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
      
      // Mock Firebase Analytics user properties
      // In real implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().setUserProperties(sanitizedProps);
      
      console.log('Analytics User Properties:', sanitizedProps);
      
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
        
        // Mock Firebase Analytics user ID
        // In real implementation:
        // import analytics from '@react-native-firebase/analytics';
        // await analytics().setUserId(userId);
        
        console.log('Analytics User ID set:', userId);
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
