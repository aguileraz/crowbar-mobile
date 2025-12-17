import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// Importar utilitário de lazy loading
import { lazyWithPreload, usePreloadComponents } from '../utils/lazyWithPreload';

// Import screens com lazy loading
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShopScreen from '../screens/Shop/ShopScreen';

// Lazy load das telas secundárias para melhor performance
const BoxDetailsScreen = lazyWithPreload(() => import('../screens/Box/BoxDetailsScreen'));
const SearchScreen = lazyWithPreload(() => import('../screens/Search/SearchScreen'));
const CategoryScreen = lazyWithPreload(() => import('../screens/Category/CategoryScreen'));
const CartScreen = lazyWithPreload(() => import('../screens/Cart/CartScreen'));
const CheckoutScreen = lazyWithPreload(() => import('../screens/Checkout/CheckoutScreen'));
const FavoritesScreen = lazyWithPreload(() => import('../screens/Favorites/FavoritesScreen'));
const ProfileScreen = lazyWithPreload(() => import('../screens/Profile/ProfileScreen'));
const AddressesScreen = lazyWithPreload(() => import('../screens/Address/AddressesScreen'));
const AddEditAddressScreen = lazyWithPreload(() => import('../screens/Address/AddEditAddressScreen'));
const OrderHistoryScreen = lazyWithPreload(() => import('../screens/Orders/OrderHistoryScreen'));
const BoxOpeningScreen = lazyWithPreload(() => import('../screens/BoxOpening/BoxOpeningScreen'));
const ReviewsScreen = lazyWithPreload(() => import('../screens/Reviews/ReviewsScreen'));
const NotificationsScreen = lazyWithPreload(() => import('../screens/Notifications/NotificationsScreen'));
const NotificationSettingsScreen = lazyWithPreload(() => import('../screens/Notifications/NotificationSettingsScreen'));
const AnalyticsScreen = lazyWithPreload(() => import('../screens/Analytics/AnalyticsScreen'));
const PrivacyControlsScreen = lazyWithPreload(() => import('../screens/Privacy/PrivacyControlsScreen'));
const MFASetupScreen = lazyWithPreload(() => import('../screens/Settings/MFASetupScreen'));

// Import navigators
import AuthNavigator from './AuthNavigator';

// Import components
import LoadingScreen from '../components/LoadingScreen';

// Import hooks
import useAuthListener from '../hooks/useAuthListener';

// Import services
import { navigationService } from '../services/navigationService';

// Import selectors
import { selectIsAuthenticated, selectIsInitializing } from '../store/slices/authSlice';

/**
 * Navigation configuration for Crowbar Mobile
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Shop: undefined;
  Search: undefined;
  Category: { categoryId: string };
  Cart: undefined;
  Checkout: undefined;
  Favorites: undefined;
  Profile: undefined;
  Addresses: undefined;
  AddEditAddress: { mode: 'add' | 'edit'; address?: any };
  OrderHistory: undefined;
  BoxOpening: { box: any };
  EnhancedBoxOpening: { box: any };
  AdvancedBoxOpening: { box: any };
  Reviews: { box: any };
  Notifications: undefined;
  NotificationSettings: undefined;
  BoxDetails: { boxId: string };
  Settings: undefined;
  MFASetup: undefined;
  Achievements: undefined;
  GamificationHub: undefined;
  SocialRoom: { roomId: string };
  Analytics: undefined;
  PrivacyControls: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Componente wrapper para telas lazy loaded
 */
const LazyScreen = ({ component: Component, ...props }: any) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

/**
 * Bottom Tab Navigator
 */
const TabNavigator = () => {
  // Pré-carregar telas críticas quando o tab navigator é montado
  usePreloadComponents([
    BoxDetailsScreen,
    SearchScreen,
    CartScreen,
    ProfileScreen,
  ]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        // Otimizar navegação entre tabs
        detachInactiveScreens: true,
        lazy: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          // tabBarIcon: ({ color, _size }) => (
          //   <Icon name="home" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          tabBarLabel: 'Loja',
          // tabBarIcon: ({ color, _size }) => (
          //   <Icon name="shopping" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Configurações',
          // tabBarIcon: ({ color, _size }) => (
          //   <Icon name="settings" color={color} size={size} />
          // ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main App Navigator
 * Gerencia navegação entre autenticação e app principal
 */
const AppNavigator = () => {
  // Hook para escutar mudanças de autenticação
  useAuthListener();

  // Selectors do Redux
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitializing = useSelector(selectIsInitializing);

  // Mostrar loading durante inicialização
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationService.getNavigationRef()}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Usuário autenticado - mostrar app principal
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Search">
              {(props) => <LazyScreen component={SearchScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Category">
              {(props) => <LazyScreen component={CategoryScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Cart">
              {(props) => <LazyScreen component={CartScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Checkout">
              {(props) => <LazyScreen component={CheckoutScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Favorites">
              {(props) => <LazyScreen component={FavoritesScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Profile">
              {(props) => <LazyScreen component={ProfileScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Addresses">
              {(props) => <LazyScreen component={AddressesScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="AddEditAddress">
              {(props) => <LazyScreen component={AddEditAddressScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="OrderHistory">
              {(props) => <LazyScreen component={OrderHistoryScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="BoxOpening">
              {(props) => <LazyScreen component={BoxOpeningScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Reviews">
              {(props) => <LazyScreen component={ReviewsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {(props) => <LazyScreen component={NotificationsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="NotificationSettings">
              {(props) => <LazyScreen component={NotificationSettingsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="BoxDetails">
              {(props) => <LazyScreen component={BoxDetailsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Analytics">
              {(props) => <LazyScreen component={AnalyticsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="PrivacyControls">
              {(props) => <LazyScreen component={PrivacyControlsScreen} {...props} />}
            </Stack.Screen>
            <Stack.Screen name="MFASetup">
              {(props) => <LazyScreen component={MFASetupScreen} {...props} />}
            </Stack.Screen>
          </>
        ) : (
          // Usuário não autenticado - mostrar telas de auth
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;