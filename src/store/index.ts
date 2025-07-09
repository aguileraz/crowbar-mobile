import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import boxReducer from './slices/boxSlice';
import cartReducer from './slices/cartSlice';
import favoritesReducer from './slices/favoritesSlice';
import userReducer from './slices/userSlice';
import ordersReducer from './slices/ordersSlice';
import boxOpeningReducer from './slices/boxOpeningSlice';
import reviewsReducer from './slices/reviewsSlice';
import notificationsReducer from './slices/notificationsSlice';
import realtimeReducer from './slices/realtimeSlice';
import offlineReducer from './slices/offlineSlice';
import analyticsReducer from './slices/analyticsSlice';

/**
 * Redux store configuration with persistence
 */

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Only persist these reducers
};

// Root reducer (will be expanded as slices are added)
const rootReducer = combineReducers({
  auth: authReducer,
  boxes: boxReducer,
  cart: cartReducer,
  favorites: favoritesReducer,
  user: userReducer,
  orders: ordersReducer,
  boxOpening: boxOpeningReducer,
  reviews: reviewsReducer,
  notifications: notificationsReducer,
  realtime: realtimeReducer,
  offline: offlineReducer,
  analytics: analyticsReducer,
  // Add other reducers here
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
