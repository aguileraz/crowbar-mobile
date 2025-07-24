import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsService } from '../../services/analyticsService';
import logger from '../../services/loggerService';

/**
 * Redux Slice para gerenciamento de analytics
 */

// Estado do slice
export interface AnalyticsState {
  isEnabled: boolean;
  userId: string | null;
  sessionId: string;
  sessionStartTime: number;
  
  // Event tracking
  pendingEvents: Array<{
    id: string;
    name: string;
    parameters: Record<string, any>;
    timestamp: number;
    retryCount: number;
  }>;
  
  // User properties
  userProperties: Record<string, any>;
  
  // Screen tracking
  currentScreen: string | null;
  screenStartTime: number | null;
  screenHistory: Array<{
    screen: string;
    timestamp: number;
    duration?: number;
  }>;
  
  // Performance metrics
  performanceMetrics: {
    appStartTime: number | null;
    screenLoadTimes: Record<string, number>;
    apiResponseTimes: Record<string, number[]>;
    errorCounts: Record<string, number>;
  };
  
  // Conversion tracking
  conversionEvents: Array<{
    event: string;
    value?: number;
    currency?: string;
    timestamp: number;
  }>;
  
  // Settings
  settings: {
    enableCrashlytics: boolean;
    enablePerformanceMonitoring: boolean;
    enableUserTracking: boolean;
    enableConversionTracking: boolean;
    enableDebugMode: boolean;
    dataRetentionDays: number;
  };
  
  // Status
  isInitialized: boolean;
  error: string | null;
}

// Estado inicial
const initialState: AnalyticsState = {
  isEnabled: true,
  userId: null,
  sessionId: '',
  sessionStartTime: Date.now(),
  pendingEvents: [],
  userProperties: {},
  currentScreen: null,
  screenStartTime: null,
  screenHistory: [],
  performanceMetrics: {
    appStartTime: null,
    screenLoadTimes: {},
    apiResponseTimes: {},
    errorCounts: {},
  },
  conversionEvents: [],
  settings: {
    enableCrashlytics: true,
    enablePerformanceMonitoring: true,
    enableUserTracking: true,
    enableConversionTracking: true,
    enableDebugMode: __DEV__,
    dataRetentionDays: 30,
  },
  isInitialized: false,
  error: null,
};

// Async Thunks

/**
 * Inicializar analytics
 */
export const initializeAnalytics = createAsyncThunk(
  'analytics/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const result = await analyticsService.initialize();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao inicializar analytics');
    }
  }
);

/**
 * Rastrear evento
 */
export const trackEvent = createAsyncThunk(
  'analytics/trackEvent',
  async (
    { name, parameters }: { name: string; parameters?: Record<string, any> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { analytics: AnalyticsState };
      
      if (!state.analytics.isEnabled) {
        return null;
      }
      
      await analyticsService.logEvent(name, parameters);
      return { name, parameters, timestamp: Date.now() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao rastrear evento');
    }
  }
);

/**
 * Definir propriedades do usuário
 */
export const setUserProperties = createAsyncThunk(
  'analytics/setUserProperties',
  async (properties: Record<string, any>, { rejectWithValue }) => {
    try {
      await analyticsService.setUserProperties(properties);
      return properties;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao definir propriedades do usuário');
    }
  }
);

/**
 * Rastrear tela
 */
export const trackScreen = createAsyncThunk(
  'analytics/trackScreen',
  async (
    { screenName, screenClass }: { screenName: string; screenClass?: string },
    { getState, dispatch }
  ) => {
    try {
      const state = getState() as { analytics: AnalyticsState };
      
      // End previous screen tracking
      if (state.analytics.currentScreen && state.analytics.screenStartTime) {
        const duration = Date.now() - state.analytics.screenStartTime;
        dispatch(endScreenTracking({ duration }));
      }
      
      await analyticsService.logScreenView(screenName, screenClass);
      return { screenName, timestamp: Date.now() };
    } catch (error: any) {
      logger.error('Error tracking screen:', error);
      return { screenName, timestamp: Date.now() };
    }
  }
);

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Enable/disable analytics
    setAnalyticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
    },
    
    // User management
    setUserId: (state, action: PayloadAction<string | null>) => {
      state.userId = action.payload;
    },
    
    // Session management
    startNewSession: (state) => {
      state.sessionId = Date.now().toString();
      state.sessionStartTime = Date.now();
      state.screenHistory = [];
    },
    
    // Screen tracking
    startScreenTracking: (state, action: PayloadAction<{ screen: string }>) => {
      state.currentScreen = action.payload.screen;
      state.screenStartTime = Date.now();
    },
    
    endScreenTracking: (state, action: PayloadAction<{ duration: number }>) => {
      if (state.currentScreen && state.screenStartTime) {
        state.screenHistory.push({
          screen: state.currentScreen,
          timestamp: state.screenStartTime,
          duration: action.payload.duration,
        });
        
        // Keep only last 50 screens
        if (state.screenHistory.length > 50) {
          state.screenHistory = state.screenHistory.slice(-50);
        }
      }
    },
    
    // Performance tracking
    recordAppStartTime: (state, action: PayloadAction<number>) => {
      state.performanceMetrics.appStartTime = action.payload;
    },
    
    recordScreenLoadTime: (state, action: PayloadAction<{ screen: string; loadTime: number }>) => {
      state.performanceMetrics.screenLoadTimes[action.payload.screen] = action.payload.loadTime;
    },
    
    recordApiResponseTime: (state, action: PayloadAction<{ endpoint: string; responseTime: number }>) => {
      const { endpoint, responseTime } = action.payload;
      if (!state.performanceMetrics.apiResponseTimes[endpoint]) {
        state.performanceMetrics.apiResponseTimes[endpoint] = [];
      }
      state.performanceMetrics.apiResponseTimes[endpoint].push(responseTime);
      
      // Keep only last 100 response times per endpoint
      if (state.performanceMetrics.apiResponseTimes[endpoint].length > 100) {
        state.performanceMetrics.apiResponseTimes[endpoint] = 
          state.performanceMetrics.apiResponseTimes[endpoint].slice(-100);
      }
    },
    
    recordError: (state, action: PayloadAction<{ errorType: string }>) => {
      const { errorType } = action.payload;
      state.performanceMetrics.errorCounts[errorType] = 
        (state.performanceMetrics.errorCounts[errorType] || 0) + 1;
    },
    
    // Conversion tracking
    recordConversion: (state, action: PayloadAction<{
      event: string;
      value?: number;
      currency?: string;
    }>) => {
      state.conversionEvents.push({
        ...action.payload,
        timestamp: Date.now(),
      });
      
      // Keep only last 100 conversions
      if (state.conversionEvents.length > 100) {
        state.conversionEvents = state.conversionEvents.slice(-100);
      }
    },
    
    // Pending events
    addPendingEvent: (state, action: PayloadAction<{
      name: string;
      parameters?: Record<string, any>;
    }>) => {
      state.pendingEvents.push({
        id: Date.now().toString(),
        name: action.payload.name,
        parameters: action.payload.parameters || {},
        timestamp: Date.now(),
        retryCount: 0,
      });
    },
    
    removePendingEvent: (state, action: PayloadAction<string>) => {
      state.pendingEvents = state.pendingEvents.filter(
        event => event.id !== action.payload
      );
    },
    
    incrementEventRetryCount: (state, action: PayloadAction<string>) => {
      const event = state.pendingEvents.find(e => e.id === action.payload);
      if (event) {
        event.retryCount += 1;
      }
    },
    
    // Settings
    updateAnalyticsSettings: (state, action: PayloadAction<Partial<AnalyticsState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Error handling
    setAnalyticsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    
    // Reset
    resetAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize analytics
    builder
      .addCase(initializeAnalytics.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.sessionId = action.payload.sessionId;
        state.error = null;
      })
      .addCase(initializeAnalytics.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Track event
    builder
      .addCase(trackEvent.fulfilled, (state, action) => {
        if (action.payload) {
          // Remove from pending events if it was there
          state.pendingEvents = state.pendingEvents.filter(
            event => event.name !== action.payload!.name
          );
        }
      })
      .addCase(trackEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Set user properties
    builder
      .addCase(setUserProperties.fulfilled, (state, action) => {
        state.userProperties = { ...state.userProperties, ...action.payload };
      });

    // Track screen
    builder
      .addCase(trackScreen.fulfilled, (state, action) => {
        state.currentScreen = action.payload.screenName;
        state.screenStartTime = action.payload.timestamp;
      });
  },
});

// Actions
export const {
  setAnalyticsEnabled,
  setUserId,
  startNewSession,
  startScreenTracking,
  endScreenTracking,
  recordAppStartTime,
  recordScreenLoadTime,
  recordApiResponseTime,
  recordError,
  recordConversion,
  addPendingEvent,
  removePendingEvent,
  incrementEventRetryCount,
  updateAnalyticsSettings,
  setAnalyticsError,
  clearAnalyticsError,
  resetAnalytics,
} = analyticsSlice.actions;

// Selectors
export const selectAnalyticsEnabled = (state: { analytics: AnalyticsState }) => state.analytics.isEnabled;
export const selectUserId = (state: { analytics: AnalyticsState }) => state.analytics.userId;
export const selectCurrentScreen = (state: { analytics: AnalyticsState }) => state.analytics.currentScreen;
export const selectScreenHistory = (state: { analytics: AnalyticsState }) => state.analytics.screenHistory;
export const selectPerformanceMetrics = (state: { analytics: AnalyticsState }) => state.analytics.performanceMetrics;
export const selectConversionEvents = (state: { analytics: AnalyticsState }) => state.analytics.conversionEvents;
export const selectPendingEvents = (state: { analytics: AnalyticsState }) => state.analytics.pendingEvents;
export const selectAnalyticsSettings = (state: { analytics: AnalyticsState }) => state.analytics.settings;
export const selectAnalyticsError = (state: { analytics: AnalyticsState }) => state.analytics.error;
export const selectIsInitialized = (state: { analytics: AnalyticsState }) => state.analytics.isInitialized;

export default analyticsSlice.reducer;
