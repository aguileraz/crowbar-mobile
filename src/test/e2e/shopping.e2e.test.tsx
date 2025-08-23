 
/**
 * E2E Tests for Shopping Flow
 * Tests complete shopping experience from browsing to purchase
 */

import React from 'react';
import { act } from '@testing-library/react-native';
import { renderWithProviders, testUtils, scenarios, assertions, TEST_DATA } from './setup';
import { boxService } from '../../services/boxService';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';

// Mock services
jest.mock('../../services/boxService');
jest.mock('../../services/cartService');
jest.mock('../../services/orderService');

const mockedBoxService = boxService as jest.Mocked<typeof boxService>;
const mockedCartService = cartService as jest.Mocked<typeof cartService>;
const mockedOrderService = orderService as jest.Mocked<typeof orderService>;

// Mock main app component
const MockMainApp = () => <div testID="main-app-screen">Main App</div>;

describe('Shopping Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testUtils.resetStore();
    testUtils.setAuthenticatedState(); // Start authenticated
  });

  describe('Box Browsing and Search', () => {
    it('should browse and search for boxes', async () => {
      // Mock boxes data
      const mockBoxes = [
        { ...TEST_DATA.box, id: '1', name: 'Mystery Box 1' },
        { ...TEST_DATA.box, id: '2', name: 'Mystery Box 2' },
        { ...TEST_DATA.box, id: '3', name: 'Gaming Box' },
      ];

      mockedBoxService.getBoxes.mockResolvedValue({
        data: mockBoxes,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 3, hasNextPage: false },
      });

      mockedBoxService.searchBoxes.mockResolvedValue({
        data: [mockBoxes[0], mockBoxes[1]], // Only mystery boxes
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, hasNextPage: false },
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        await scenarios.browseBoxes(getByTestId, _queryByTestId);
      });

      // Verify boxes were fetched
      expect(mockedBoxService.getBoxes).toHaveBeenCalled();
      expect(mockedBoxService.searchBoxes).toHaveBeenCalledWith('mystery', 1, 20);

      // Should show search results
      await testUtils.waitForElement(getByTestId, 'search-results');
      expect(getByTestId('search-results')).toBeTruthy();
    });

    it('should filter boxes by category', async () => {
      const mockCategories = [
        { id: '1', name: 'Gaming', slug: 'gaming' },
        { id: '2', name: 'Electronics', slug: 'electronics' },
      ];

      const mockGamingBoxes = [
        { ...TEST_DATA.box, id: '1', name: 'Gaming Box 1', category: 'gaming' },
        { ...TEST_DATA.box, id: '2', name: 'Gaming Box 2', category: 'gaming' },
      ];

      mockedBoxService.getCategories.mockResolvedValue(mockCategories);
      mockedBoxService.getBoxesByCategory.mockResolvedValue({
        data: mockGamingBoxes,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, hasNextPage: false },
      });

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Select gaming category
        await testUtils.pressButton(getByTestId, 'category-gaming');
      });

      // Verify category boxes were fetched
      expect(mockedBoxService.getBoxesByCategory).toHaveBeenCalledWith('gaming');

      // Should show category boxes
      await testUtils.waitForElement(getByTestId, 'category-boxes');
      expect(getByTestId('category-boxes')).toBeTruthy();
    });

    it('should view box details', async () => {
      const mockBox = {
        ...TEST_DATA.box,
        possible_items: [
          { id: '1', name: 'Rare Item 1', rarity: 'rare', image_url: 'item1.jpg' },
          { id: '2', name: 'Common Item 1', rarity: 'common', image_url: 'item2.jpg' },
        ],
        reviews: [
          { id: '1', rating: 5, comment: 'Great box!', user: { name: 'John' } },
        ],
      };

      mockedBoxService.getBoxById.mockResolvedValue(mockBox);

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Navigate to box details
        await testUtils.pressButton(getByTestId, 'box-card-0');
      });

      // Verify box details were fetched
      expect(mockedBoxService.getBoxById).toHaveBeenCalledWith('test-box-1');

      // Should show box details
      await testUtils.waitForElement(getByTestId, 'box-details-screen');
      expect(getByTestId('box-details-screen')).toBeTruthy();
      expect(getByTestId('box-possible-items')).toBeTruthy();
      expect(getByTestId('box-reviews')).toBeTruthy();
    });
  });

  describe('Cart Management', () => {
    beforeEach(() => {
      // Mock empty cart initially
      mockedCartService.getCart.mockResolvedValue({
        id: '1',
        items: [],
        total_items: 0,
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      });
    });

    it('should add box to cart', async () => {
      const mockCartItem = {
        id: '1',
        box_id: TEST_DATA.box.id,
        box: TEST_DATA.box,
        quantity: 1,
        unit_price: TEST_DATA.box.price,
        total_price: TEST_DATA.box.price,
      };

      mockedCartService.addToCart.mockResolvedValue(mockCartItem);

      const { getByTestId, _queryByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        await scenarios.addToCart(getByTestId, _queryByTestId);
      });

      // Verify item was added to cart
      expect(mockedCartService.addToCart).toHaveBeenCalledWith(TEST_DATA.box.id, 1);

      // Should show success message
      await testUtils.waitForElement(getByTestId, 'add-to-cart-success');
      expect(getByTestId('add-to-cart-success')).toBeTruthy();
    });

    it('should update cart item quantity', async () => {
      const mockCartItem = {
        id: '1',
        box_id: TEST_DATA.box.id,
        quantity: 3,
        unit_price: TEST_DATA.box.price,
        total_price: TEST_DATA.box.price * 3,
      };

      mockedCartService.updateCartItem.mockResolvedValue(mockCartItem);

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Go to cart
        await testUtils.pressButton(getByTestId, 'cart-tab');
        
        // Update quantity
        await testUtils.fillField(getByTestId, 'cart-item-quantity-input', '3');
        await testUtils.pressButton(getByTestId, 'update-quantity-button');
      });

      // Verify quantity was updated
      expect(mockedCartService.updateCartItem).toHaveBeenCalledWith('1', 3);
    });

    it('should remove item from cart', async () => {
      mockedCartService.removeFromCart.mockResolvedValue({});

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Go to cart
        await testUtils.pressButton(getByTestId, 'cart-tab');
        
        // Remove item
        await testUtils.pressButton(getByTestId, 'remove-cart-item-button');
        
        // Confirm removal
        await testUtils.pressButton(getByTestId, 'confirm-remove-button');
      });

      // Verify item was removed
      expect(mockedCartService.removeFromCart).toHaveBeenCalledWith('1');
    });

    it('should apply coupon to cart', async () => {
      const mockCartWithCoupon = {
        id: '1',
        items: [{ id: '1', box_id: TEST_DATA.box.id, quantity: 1, unit_price: 19.99, total_price: 19.99 }],
        total_items: 1,
        subtotal: 19.99,
        shipping: 5.00,
        discount: 2.00,
        total: 22.99,
        coupon: { code: 'SAVE10', discount_amount: 2.00, discount_type: 'fixed' },
      };

      mockedCartService.applyCoupon.mockResolvedValue(mockCartWithCoupon);

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Go to cart
        await testUtils.pressButton(getByTestId, 'cart-tab');
        
        // Apply coupon
        await testUtils.fillField(getByTestId, 'coupon-input', 'SAVE10');
        await testUtils.pressButton(getByTestId, 'apply-coupon-button');
      });

      // Verify coupon was applied
      expect(mockedCartService.applyCoupon).toHaveBeenCalledWith('SAVE10');

      // Should show discount
      await testUtils.waitForElement(getByTestId, 'cart-discount');
      expect(getByTestId('cart-discount')).toBeTruthy();
    });
  });

  describe('Checkout Process', () => {
    beforeEach(() => {
      // Mock cart with items
      mockedCartService.getCart.mockResolvedValue({
        id: '1',
        items: [
          {
            id: '1',
            box_id: TEST_DATA.box.id,
            box: TEST_DATA.box,
            quantity: 1,
            unit_price: TEST_DATA.box.price,
            total_price: TEST_DATA.box.price,
          },
        ],
        total_items: 1,
        subtotal: TEST_DATA.box.price,
        shipping: 5.00,
        discount: 0,
        total: TEST_DATA.box.price + 5.00,
      });
    });

    it('should complete full checkout process', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'confirmed',
        total: TEST_DATA.box.price + 5.00,
        items: [{ box_id: TEST_DATA.box.id, quantity: 1 }],
      };

      mockedOrderService.createOrder.mockResolvedValue(mockOrder);

      const { getByTestId, _queryByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        await scenarios.checkout(getByTestId, _queryByTestId);
      });

      // Verify order was created
      expect(mockedOrderService.createOrder).toHaveBeenCalledWith({
        address_id: expect.any(String),
        payment_method_id: expect.any(String),
        shipping_option_id: expect.any(String),
      });

      // Should show order confirmation
      await testUtils.waitForElement(getByTestId, 'order-confirmation');
      assertions.orderWasCreated(getByTestId);
    });

    it('should handle shipping calculation', async () => {
      const mockShippingOptions = {
        options: [
          { id: 'standard', name: 'Standard', price: 5.00, estimated_days: '5-7' },
          { id: 'express', name: 'Express', price: 15.00, estimated_days: '1-2' },
        ],
      };

      mockedCartService.calculateShipping.mockResolvedValue(mockShippingOptions);

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Go to checkout
        await testUtils.pressButton(getByTestId, 'cart-tab');
        await testUtils.pressButton(getByTestId, 'checkout-button');
        
        // Enter zip code for shipping calculation
        await testUtils.fillField(getByTestId, 'shipping-zip-input', '01234-567');
        await testUtils.pressButton(getByTestId, 'calculate-shipping-button');
      });

      // Verify shipping was calculated
      expect(mockedCartService.calculateShipping).toHaveBeenCalledWith('01234-567');

      // Should show shipping options
      await testUtils.waitForElement(getByTestId, 'shipping-options');
      expect(getByTestId('shipping-option-standard')).toBeTruthy();
      expect(getByTestId('shipping-option-express')).toBeTruthy();
    });

    it('should handle payment method selection', async () => {
      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Go to checkout
        await testUtils.pressButton(getByTestId, 'cart-tab');
        await testUtils.pressButton(getByTestId, 'checkout-button');
        
        // Select payment method
        await testUtils.pressButton(getByTestId, 'payment-method-credit-card');
        
        // Fill payment details
        await testUtils.fillField(getByTestId, 'card-number-input', '4111111111111111');
        await testUtils.fillField(getByTestId, 'card-expiry-input', '12/25');
        await testUtils.fillField(getByTestId, 'card-cvv-input', '123');
        await testUtils.fillField(getByTestId, 'card-name-input', 'Test User');
      });

      // Should show payment form
      expect(getByTestId('payment-form')).toBeTruthy();
    });

    it('should handle checkout validation errors', async () => {
      mockedOrderService.createOrder.mockRejectedValue({
        response: {
          status: 422,
          data: {
            errors: {
              address_id: ['Address is required'],
              payment_method_id: ['Payment method is required'],
            },
          },
        },
      });

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Try to checkout without required fields
        await testUtils.pressButton(getByTestId, 'cart-tab');
        await testUtils.pressButton(getByTestId, 'checkout-button');
        await testUtils.pressButton(getByTestId, 'complete-order-button');
      });

      // Should show validation errors
      await testUtils.waitForElement(getByTestId, 'checkout-errors');
      expect(getByTestId('checkout-errors')).toBeTruthy();
    });
  });

  describe('Box Opening Experience', () => {
    it('should complete box opening flow', async () => {
      const mockOpeningResult = {
        items: [
          { id: '1', name: 'Rare Item', rarity: 'rare', value: 50.00 },
          { id: '2', name: 'Common Item', rarity: 'common', value: 5.00 },
        ],
        total_value: 55.00,
        experience_gained: 100,
      };

      mockedBoxService.openBox.mockResolvedValue(mockOpeningResult);

      const { getByTestId, _queryByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        await scenarios.openBox(getByTestId, _queryByTestId);
      });

      // Verify box was opened
      expect(mockedBoxService.openBox).toHaveBeenCalledWith('test-box-1');

      // Should show opening results
      await testUtils.waitForElement(getByTestId, 'box-opening-results');
      assertions.boxWasOpened(getByTestId);

      // Should show items received
      expect(getByTestId('received-items')).toBeTruthy();
      expect(getByTestId('total-value')).toBeTruthy();
      expect(getByTestId('experience-gained')).toBeTruthy();
    });

    it('should handle insufficient balance for box opening', async () => {
      mockedBoxService.openBox.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Insufficient balance',
          },
        },
      });

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Try to open box
        await testUtils.pressButton(getByTestId, 'profile-tab');
        await testUtils.pressButton(getByTestId, 'my-boxes-button');
        await testUtils.pressButton(getByTestId, 'owned-box-0');
        await testUtils.pressButton(getByTestId, 'open-box-button');
      });

      // Should show error message
      await testUtils.waitForElement(getByTestId, 'insufficient-balance-error');
      expect(getByTestId('insufficient-balance-error')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedBoxService.getBoxes.mockRejectedValue(new Error('Network Error'));

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Try to load boxes
        await testUtils.pressButton(getByTestId, 'shop-tab');
      });

      // Should show error message
      await testUtils.waitForElement(getByTestId, 'network-error');
      expect(getByTestId('network-error')).toBeTruthy();

      // Should show retry button
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should handle API errors with proper messages', async () => {
      mockedCartService.addToCart.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Box is out of stock',
          },
        },
      });

      const { getByTestId } = renderWithProviders(<MockMainApp />);

      await act(async () => {
        // Try to add out of stock box
        await testUtils.pressButton(getByTestId, 'box-card-0');
        await testUtils.pressButton(getByTestId, 'add-to-cart-button');
      });

      // Should show specific error message
      await testUtils.waitForElement(getByTestId, 'out-of-stock-error');
      expect(getByTestId('out-of-stock-error')).toBeTruthy();
    });
  });
});
