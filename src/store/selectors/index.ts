/**
 * Seletores memoizados do Redux usando reselect
 * Otimiza a performance evitando recálculos desnecessários
 */

import { createSelector } from 'reselect';
import { RootState } from '../types';
import { _Box } from '../../types/api';

// Seletores base (input selectors)
const selectAuth = (state: RootState) => state.auth;
const selectUser = (state: RootState) => state.user;
const selectBoxes = (state: RootState) => state.boxes;
const selectCart = (state: RootState) => state.cart;
const selectOrders = (state: RootState) => state.orders;
const selectFavorites = (state: RootState) => state.favorites;
const selectAddresses = (state: RootState) => state.addresses;
const selectReviews = (state: RootState) => state.reviews;
const selectNotifications = (state: RootState) => state.notifications;
const selectWebSocket = (state: RootState) => state.websocket;

// Auth selectors
export const selectIsAuthenticated = createSelector(
  selectAuth,
  (auth) => auth.isAuthenticated
);

export const selectAuthUser = createSelector(
  selectAuth,
  (auth) => auth.user
);

export const selectAuthLoading = createSelector(
  selectAuth,
  (auth) => auth.loading
);

// User selectors
export const selectUserProfile = createSelector(
  selectUser,
  (user) => user.profile
);

export const selectUserStats = createSelector(
  selectUser,
  (user) => user.stats
);

// Boxes selectors
export const selectAllBoxes = createSelector(
  selectBoxes,
  (boxes) => boxes.items
);

export const selectFeaturedBoxes = createSelector(
  selectAllBoxes,
  (boxes) => boxes.filter((box) => box.featured)
);

export const selectPopularBoxes = createSelector(
  selectAllBoxes,
  (boxes) => boxes.filter((box) => box.popular)
);

export const selectNewBoxes = createSelector(
  selectAllBoxes,
  (boxes) => boxes.filter((box) => box.isNew)
);

export const selectBoxesByCategory = createSelector(
  [selectAllBoxes, (_: RootState, categoryId: string) => categoryId],
  (boxes, categoryId) => boxes.filter((box) => box.categoryId === categoryId)
);

export const selectBoxById = createSelector(
  [selectAllBoxes, (_: RootState, boxId: string) => boxId],
  (boxes, boxId) => boxes.find((box) => box.id === boxId)
);

export const selectBoxesLoading = createSelector(
  selectBoxes,
  (boxes) => boxes.loading
);

// Cart selectors
export const selectCartItems = createSelector(
  selectCart,
  (cart) => cart.items
);

export const selectCartItemCount = createSelector(
  selectCartItems,
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartSubtotal = createSelector(
  selectCartItems,
  (items) =>
    items.reduce((total, item) => total + item.price * item.quantity, 0)
);

export const selectCartTotal = createSelector(
  [selectCartSubtotal, selectCart],
  (subtotal, cart) => {
    const discount = cart.coupon ? cart.coupon.discount : 0;
    const shipping = cart.shippingCost || 0;
    return subtotal - discount + shipping;
  }
);

export const selectCartCoupon = createSelector(
  selectCart,
  (cart) => cart.coupon
);

export const selectShippingAddress = createSelector(
  selectCart,
  (cart) => cart.shippingAddress
);

// Orders selectors
export const selectAllOrders = createSelector(
  selectOrders,
  (orders) => orders.items
);

export const selectOrderById = createSelector(
  [selectAllOrders, (_: RootState, orderId: string) => orderId],
  (orders, orderId) => orders.find((order) => order.id === orderId)
);

export const selectPendingOrders = createSelector(
  selectAllOrders,
  (orders) => orders.filter((order) => order._status === 'pending')
);

export const selectCompletedOrders = createSelector(
  selectAllOrders,
  (orders) => orders.filter((order) => order._status === 'completed')
);

export const selectOrdersLoading = createSelector(
  selectOrders,
  (orders) => orders.loading
);

// Favorites selectors
export const selectFavoriteIds = createSelector(
  selectFavorites,
  (favorites) => favorites.items
);

export const selectFavoriteBoxes = createSelector(
  [selectAllBoxes, selectFavoriteIds],
  (boxes, favoriteIds) =>
    boxes.filter((box) => favoriteIds.includes(box.id))
);

export const selectIsFavorite = createSelector(
  [selectFavoriteIds, (_: RootState, boxId: string) => boxId],
  (favoriteIds, boxId) => favoriteIds.includes(boxId)
);

export const selectFavoritesCount = createSelector(
  selectFavoriteIds,
  (favoriteIds) => favoriteIds.length
);

// Addresses selectors
export const selectAllAddresses = createSelector(
  selectAddresses,
  (addresses) => addresses.items
);

export const selectDefaultAddress = createSelector(
  selectAllAddresses,
  (addresses) => addresses.find((address) => address.isDefault)
);

export const selectAddressById = createSelector(
  [selectAllAddresses, (_: RootState, addressId: string) => addressId],
  (addresses, addressId) =>
    addresses.find((address) => address.id === addressId)
);

// Reviews selectors
export const selectReviewsByBoxId = createSelector(
  [selectReviews, (_: RootState, boxId: string) => boxId],
  (reviews, boxId) =>
    reviews.items.filter((review) => review.boxId === boxId)
);

export const selectUserReviews = createSelector(
  [selectReviews, selectAuthUser],
  (reviews, user) =>
    user ? reviews.items.filter((review) => review.userId === user.uid) : []
);

export const selectAverageRating = createSelector(
  selectReviewsByBoxId,
  (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
  }
);

// Notifications selectors
export const selectUnreadNotifications = createSelector(
  selectNotifications,
  (notifications) =>
    notifications.items.filter((notification) => !notification.read)
);

export const selectUnreadCount = createSelector(
  selectUnreadNotifications,
  (unreadNotifications) => unreadNotifications.length
);

// WebSocket selectors
export const selectIsWebSocketConnected = createSelector(
  selectWebSocket,
  (websocket) => websocket.connected
);

export const selectOnlineUsersCount = createSelector(
  selectWebSocket,
  (websocket) => websocket.onlineUsers
);

// Search selectors
export const selectSearchResults = createSelector(
  [selectAllBoxes, (_: RootState, searchTerm: string) => searchTerm],
  (boxes, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return [];
    
    const term = searchTerm.toLowerCase();
    return boxes.filter(
      (box) =>
        box.name.toLowerCase().includes(term) ||
        box.description.toLowerCase().includes(term) ||
        box.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }
);

// Combined selectors for complex UI states
export const selectCheckoutData = createSelector(
  [selectCartItems, selectCartTotal, selectShippingAddress, selectDefaultAddress],
  (items, total, shippingAddress, defaultAddress) => ({
    items,
    total,
    shippingAddress: shippingAddress || defaultAddress,
    canCheckout: items.length > 0 && (shippingAddress || defaultAddress),
  })
);

export const selectDashboardData = createSelector(
  [
    selectUserProfile,
    selectUserStats,
    selectPendingOrders,
    selectFavoriteBoxes,
    selectUnreadCount,
  ],
  (profile, stats, pendingOrders, favoriteBoxes, unreadCount) => ({
    profile,
    stats,
    pendingOrdersCount: pendingOrders.length,
    favoritesCount: favoriteBoxes.length,
    unreadNotifications: unreadCount,
  })
);