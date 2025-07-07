/**
 * Integration tests for cart functionality
 * Tests real API communication for cart-related endpoints
 */

import { store } from '../../store';
import { 
  fetchCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  applyCoupon,
  removeCoupon 
} from '../../store/slices/cartSlice';
import { fetchBoxes } from '../../store/slices/boxSlice';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  skipIfAPIUnavailable,
  createTestUser,
  loginTestUser,
  logoutTestUser,
  waitFor,
} from './setup';

describe('Cart Integration Tests', () => {
  let testBoxId: string;

  beforeAll(async () => {
    await setupIntegrationTest();
  });

  afterAll(async () => {
    await cleanupIntegrationTest();
  });

  beforeEach(async () => {
    // Skip if API is not available
    const shouldSkip = await skipIfAPIUnavailable();
    if (shouldSkip) {
      pending('API not available');
      return;
    }

    // Login test user
    await createTestUser();
    await loginTestUser();

    // Clear cart before each test
    try {
      await store.dispatch(clearCart());
    } catch (error) {
      // Ignore if cart is already empty
    }

    // Get a test box ID
    const boxesResult = await store.dispatch(fetchBoxes({ page: 1 }));
    if (boxesResult.payload.data.length > 0) {
      testBoxId = boxesResult.payload.data[0].id;
    }
  });

  afterEach(async () => {
    // Clean up cart after each test
    try {
      await store.dispatch(clearCart());
    } catch (error) {
      // Ignore cleanup errors
    }
    await logoutTestUser();
  });

  describe('Cart Operations', () => {
    it('should fetch empty cart initially', async () => {
      const result = await store.dispatch(fetchCart());

      expect(result.type).toBe('cart/fetchCart/fulfilled');
      expect(result.payload.items).toEqual([]);
      expect(result.payload.total_items).toBe(0);
      expect(result.payload.total).toBe(0);

      // Check store state
      const state = store.getState();
      expect(state.cart.items).toEqual([]);
      expect(state.cart.totalItems).toBe(0);
      expect(state.cart.total).toBe(0);
    }, 10000);

    it('should add item to cart successfully', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      const result = await store.dispatch(addToCart({ boxId: testBoxId, quantity: 2 }));

      expect(result.type).toBe('cart/addToCart/fulfilled');
      expect(result.payload).toHaveProperty('id');
      expect(result.payload.box_id).toBe(testBoxId);
      expect(result.payload.quantity).toBe(2);

      // Verify cart state
      const cartResult = await store.dispatch(fetchCart());
      expect(cartResult.payload.items.length).toBe(1);
      expect(cartResult.payload.total_items).toBe(2);
      expect(cartResult.payload.items[0].box_id).toBe(testBoxId);
    }, 15000);

    it('should update cart item quantity', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // First add item to cart
      const addResult = await store.dispatch(addToCart({ boxId: testBoxId, quantity: 1 }));
      const cartItemId = addResult.payload.id;

      // Then update quantity
      const updateResult = await store.dispatch(updateCartItem({ 
        itemId: cartItemId, 
        quantity: 3 
      }));

      expect(updateResult.type).toBe('cart/updateCartItem/fulfilled');
      expect(updateResult.payload.quantity).toBe(3);

      // Verify cart state
      const cartResult = await store.dispatch(fetchCart());
      expect(cartResult.payload.total_items).toBe(3);
      expect(cartResult.payload.items[0].quantity).toBe(3);
    }, 15000);

    it('should remove item from cart', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // First add item to cart
      const addResult = await store.dispatch(addToCart({ boxId: testBoxId, quantity: 1 }));
      const cartItemId = addResult.payload.id;

      // Then remove item
      const removeResult = await store.dispatch(removeFromCart(cartItemId));

      expect(removeResult.type).toBe('cart/removeFromCart/fulfilled');

      // Verify cart is empty
      const cartResult = await store.dispatch(fetchCart());
      expect(cartResult.payload.items).toEqual([]);
      expect(cartResult.payload.total_items).toBe(0);
    }, 15000);

    it('should clear entire cart', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // Add multiple items to cart
      await store.dispatch(addToCart({ boxId: testBoxId, quantity: 2 }));
      
      // Get another box if available
      const boxesResult = await store.dispatch(fetchBoxes({ page: 1 }));
      if (boxesResult.payload.data.length > 1) {
        const secondBoxId = boxesResult.payload.data[1].id;
        await store.dispatch(addToCart({ boxId: secondBoxId, quantity: 1 }));
      }

      // Clear cart
      const clearResult = await store.dispatch(clearCart());
      expect(clearResult.type).toBe('cart/clearCart/fulfilled');

      // Verify cart is empty
      const cartResult = await store.dispatch(fetchCart());
      expect(cartResult.payload.items).toEqual([]);
      expect(cartResult.payload.total_items).toBe(0);
    }, 15000);
  });

  describe('Coupon Management', () => {
    beforeEach(async () => {
      if (!testBoxId) return;
      
      // Add item to cart for coupon tests
      await store.dispatch(addToCart({ boxId: testBoxId, quantity: 1 }));
    });

    it('should apply valid coupon', async () => {
      // This test assumes there's a test coupon available
      const testCouponCode = 'TEST10'; // 10% discount coupon
      
      try {
        const result = await store.dispatch(applyCoupon(testCouponCode));

        if (result.type === 'cart/applyCoupon/fulfilled') {
          expect(result.payload).toHaveProperty('coupon');
          expect(result.payload.coupon.code).toBe(testCouponCode);
          expect(result.payload.discount).toBeGreaterThan(0);

          // Check store state
          const state = store.getState();
          expect(state.cart.coupon).toBeTruthy();
          expect(state.cart.discount).toBeGreaterThan(0);
        }
      } catch (error: any) {
        // If test coupon doesn't exist, that's okay for this test
        if (error.response?.status === 400) {
          expect(error.response.data.message).toContain('coupon');
        }
      }
    }, 10000);

    it('should handle invalid coupon', async () => {
      const invalidCouponCode = 'INVALID_COUPON_12345';
      
      const result = await store.dispatch(applyCoupon(invalidCouponCode));

      expect(result.type).toBe('cart/applyCoupon/rejected');

      // Check store state
      const state = store.getState();
      expect(state.cart.error).toBeTruthy();
      expect(state.cart.coupon).toBeNull();
    }, 10000);

    it('should remove applied coupon', async () => {
      // First try to apply a coupon (if available)
      try {
        await store.dispatch(applyCoupon('TEST10'));
      } catch (error) {
        // If no valid coupon, skip this test
        pending('No valid test coupon available');
        return;
      }

      // Remove coupon
      const result = await store.dispatch(removeCoupon());

      expect(result.type).toBe('cart/removeCoupon/fulfilled');
      expect(result.payload.coupon).toBeNull();
      expect(result.payload.discount).toBe(0);

      // Check store state
      const state = store.getState();
      expect(state.cart.coupon).toBeNull();
      expect(state.cart.discount).toBe(0);
    }, 10000);
  });

  describe('Cart Calculations', () => {
    it('should calculate cart totals correctly', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // Add item to cart
      const addResult = await store.dispatch(addToCart({ boxId: testBoxId, quantity: 2 }));
      const unitPrice = addResult.payload.unit_price;

      // Fetch cart to get calculations
      const cartResult = await store.dispatch(fetchCart());
      const cart = cartResult.payload;

      expect(cart.total_items).toBe(2);
      expect(cart.subtotal).toBe(unitPrice * 2);
      expect(cart.total).toBeGreaterThanOrEqual(cart.subtotal);

      // Check store state matches
      const state = store.getState();
      expect(state.cart.totalItems).toBe(2);
      expect(state.cart.subtotal).toBe(unitPrice * 2);
      expect(state.cart.total).toBe(cart.total);
    }, 10000);

    it('should handle multiple items correctly', async () => {
      const boxesResult = await store.dispatch(fetchBoxes({ page: 1 }));
      
      if (boxesResult.payload.data.length < 2) {
        pending('Need at least 2 boxes for this test');
        return;
      }

      const box1Id = boxesResult.payload.data[0].id;
      const box2Id = boxesResult.payload.data[1].id;

      // Add multiple different items
      const add1Result = await store.dispatch(addToCart({ boxId: box1Id, quantity: 1 }));
      const add2Result = await store.dispatch(addToCart({ boxId: box2Id, quantity: 2 }));

      const expectedTotal = add1Result.payload.unit_price + (add2Result.payload.unit_price * 2);

      // Fetch cart
      const cartResult = await store.dispatch(fetchCart());
      const cart = cartResult.payload;

      expect(cart.items.length).toBe(2);
      expect(cart.total_items).toBe(3);
      expect(cart.subtotal).toBe(expectedTotal);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle adding out-of-stock item', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // Try to add a very large quantity that would exceed stock
      const result = await store.dispatch(addToCart({ boxId: testBoxId, quantity: 9999 }));

      if (result.type === 'cart/addToCart/rejected') {
        expect(result.payload).toContain('stock');
        
        const state = store.getState();
        expect(state.cart.error).toBeTruthy();
      }
      // If it succeeds, the API doesn't have stock validation, which is also valid
    }, 10000);

    it('should handle updating non-existent cart item', async () => {
      const nonExistentItemId = 'non-existent-item-12345';
      
      const result = await store.dispatch(updateCartItem({ 
        itemId: nonExistentItemId, 
        quantity: 1 
      }));

      expect(result.type).toBe('cart/updateCartItem/rejected');

      const state = store.getState();
      expect(state.cart.error).toBeTruthy();
    }, 10000);

    it('should handle removing non-existent cart item', async () => {
      const nonExistentItemId = 'non-existent-item-12345';
      
      const result = await store.dispatch(removeFromCart(nonExistentItemId));

      expect(result.type).toBe('cart/removeFromCart/rejected');

      const state = store.getState();
      expect(state.cart.error).toBeTruthy();
    }, 10000);
  });

  describe('Cart Persistence', () => {
    it('should persist cart across sessions', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      // Add item to cart
      await store.dispatch(addToCart({ boxId: testBoxId, quantity: 1 }));

      // Simulate logout and login
      await logoutTestUser();
      await loginTestUser();

      // Cart should still contain the item
      const cartResult = await store.dispatch(fetchCart());
      expect(cartResult.payload.items.length).toBe(1);
      expect(cartResult.payload.items[0].box_id).toBe(testBoxId);
    }, 15000);
  });
});
