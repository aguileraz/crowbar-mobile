import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShopScreen from '../screens/Shop/ShopScreen';
import BoxDetailsScreen from '../screens/Box/BoxDetailsScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import CategoryScreen from '../screens/Category/CategoryScreen';
import CartScreen from '../screens/Cart/CartScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AddressesScreen from '../screens/Address/AddressesScreen';
import AddEditAddressScreen from '../screens/Address/AddEditAddressScreen';
import OrderHistoryScreen from '../screens/Orders/OrderHistoryScreen';
import BoxOpeningScreen from '../screens/BoxOpening/BoxOpeningScreen';
import ReviewsScreen from '../screens/Reviews/ReviewsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/Notifications/NotificationSettingsScreen';

// Import navigators
import AuthNavigator from './AuthNavigator';

// Import components
import LoadingScreen from '../components/LoadingScreen';

// Import hooks
import useAuthListener from '../hooks/useAuthListener';

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
  Reviews: { box: any };
  Notifications: undefined;
  NotificationSettings: undefined;
  BoxDetails: { boxId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Bottom Tab Navigator
 */
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="home" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          tabBarLabel: 'Loja',
          // tabBarIcon: ({ color, size }) => (
          //   <Icon name="shopping" color={color} size={size} />
          // ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Configurações',
          // tabBarIcon: ({ color, size }) => (
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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Usuário autenticado - mostrar app principal
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="BoxOpening" component={BoxOpeningScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} />
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
