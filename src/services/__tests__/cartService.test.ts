
import { cartService } from '../cartService';
import { apiClient } from '../api';

// Mock apiClient
jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should fetch cart successfully', async () => {
      const mockCart = {
        id: '1',
        items: [
          {
            id: '1',
            box_id: 'box1',
            box: {
              id: 'box1',
              name: 'Test Box',
              price: 10.99,
              image_url: 'test.jpg',
            },
            quantity: 2,
            unit_price: 10.99,
            total_price: 21.98,
          },
        ],
        total_items: 2,
        subtotal: 21.98,
        shipping: 5.00,
        discount: 0,
        total: 26.98,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockCart });

      const _result = await cartService.getCart();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/cart');
      expect(_result).toEqual(mockCart);
    });

    it('should handle empty cart', async () => {
      const mockEmptyCart = {
        id: null,
        items: [],
        total_items: 0,
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockEmptyCart });

      const _result = await cartService.getCart();

      expect(_result).toEqual(mockEmptyCart);
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      const mockCartItem = {
        id: '1',
        box_id: 'box1',
        box: {
          id: 'box1',
          name: 'Test Box',
          price: 10.99,
          image_url: 'test.jpg',
        },
        quantity: 1,
        unit_price: 10.99,
        total_price: 10.99,
      };

      mockedApiClient.post.mockResolvedValue({ data: mockCartItem });

      const _result = await cartService.addToCart('box1', 1);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/items', {
        mystery_box_id: 'box1',
        quantity: 1,
      });
      expect(_result).toEqual(mockCartItem);
    });

    it('should handle out of stock error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Insufficient stock' },
        },
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(cartService.addToCart('box1', 10)).rejects.toEqual(mockError);
    });

    it('should default quantity to 1', async () => {
      mockedApiClient.post.mockResolvedValue({ data: {} });

      await cartService.addToCart('box1');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/items', {
        mystery_box_id: 'box1',
        quantity: 1,
      });
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity successfully', async () => {
      const mockUpdatedItem = {
        id: '1',
        box_id: 'box1',
        quantity: 3,
        unit_price: 10.99,
        total_price: 32.97,
      };

      mockedApiClient.put.mockResolvedValue({ data: mockUpdatedItem });

      const _result = await cartService.updateCartItem('1', 3);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/cart/items/1', {
        quantity: 3,
      });
      expect(_result).toEqual(mockUpdatedItem);
    });

    it('should handle invalid quantity', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { quantity: ['Quantity must be at least 1'] } },
        },
      };

      mockedApiClient.put.mockRejectedValue(mockError);

      await expect(cartService.updateCartItem('1', 0)).rejects.toEqual(mockError);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: {} });

      await cartService.removeFromCart('1');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/cart/items/1');
    });

    it('should handle item not found', async () => {
      const mockError = { response: { status: 404 } };
      mockedApiClient.delete.mockRejectedValue(mockError);

      await expect(cartService.removeFromCart('999')).rejects.toEqual(mockError);
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: {} });

      await cartService.clearCart();

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/cart');
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon successfully', async () => {
      const mockCart = {
        id: '1',
        items: [],
        total_items: 2,
        subtotal: 21.98,
        shipping: 5.00,
        discount: 5.00,
        total: 21.98,
        coupon: {
          code: 'SAVE5',
          discount_amount: 5.00,
          discount_type: 'fixed',
        },
      };

      mockedApiClient.post.mockResolvedValue({ data: mockCart });

      const _result = await cartService.applyCoupon('SAVE5');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/coupon', {
        code: 'SAVE5',
      });
      expect(_result).toEqual(mockCart);
    });

    it('should handle invalid coupon', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid or expired coupon' },
        },
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(cartService.applyCoupon('INVALID')).rejects.toEqual(mockError);
    });
  });

  describe('removeCoupon', () => {
    it('should remove coupon successfully', async () => {
      const mockCart = {
        id: '1',
        items: [],
        total_items: 2,
        subtotal: 21.98,
        shipping: 5.00,
        discount: 0,
        total: 26.98,
        coupon: null,
      };

      mockedApiClient.delete.mockResolvedValue({ data: mockCart });

      const _result = await cartService.removeCoupon();

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/cart/coupon');
      expect(_result).toEqual(mockCart);
    });
  });

  describe('calculateShipping', () => {
    it('should calculate shipping successfully', async () => {
      const mockShipping = {
        options: [
          {
            id: 'standard',
            name: 'Standard Shipping',
            price: 5.00,
            estimated_days: '5-7',
          },
          {
            id: 'express',
            name: 'Express Shipping',
            price: 15.00,
            estimated_days: '1-2',
          },
        ],
      };

      mockedApiClient.post.mockResolvedValue({ data: mockShipping });

      const _result = await cartService.calculateShipping('01234-567');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/shipping', {
        address_id: '01234-567',
      });
      expect(_result).toEqual(mockShipping);
    });

    it('should handle invalid zip code', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { zip_code: ['Invalid zip code format'] } },
        },
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(cartService.calculateShipping('invalid')).rejects.toEqual(mockError);
    });
  });

  // TODO: selectShipping method doesn't exist in cartService
  // Shipping selection may be handled differently
  describe.skip('selectShipping', () => {
    it('should select shipping option successfully', async () => {
      const mockCart = {
        id: '1',
        items: [],
        total_items: 2,
        subtotal: 21.98,
        shipping: 15.00,
        discount: 0,
        total: 36.98,
        shipping_option: {
          id: 'express',
          name: 'Express Shipping',
          price: 15.00,
          estimated_days: '1-2',
        },
      };

      mockedApiClient.patch.mockResolvedValue({ data: mockCart });

      const _result = await cartService.selectShipping('express');

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/cart/shipping', {
        shipping_option_id: 'express',
      });
      expect(_result).toEqual(mockCart);
    });
  });

  // TODO: getCartSummary method doesn't exist in cartService
  // There is a getOrderSummary method instead
  describe.skip('getCartSummary', () => {
    it('should get cart summary successfully', async () => {
      const mockSummary = {
        total_items: 3,
        subtotal: 32.97,
        shipping: 5.00,
        discount: 5.00,
        tax: 2.30,
        total: 35.27,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockSummary });

      const _result = await cartService.getCartSummary();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/cart/summary');
      expect(_result).toEqual(mockSummary);
    });
  });
});
