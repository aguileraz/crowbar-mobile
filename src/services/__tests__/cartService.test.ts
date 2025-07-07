import { cartService } from '../cartService';
import { httpClient } from '../httpClient';

// Mock httpClient
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

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

      mockedHttpClient.get.mockResolvedValue({ data: mockCart });

      const result = await cartService.getCart();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCart);
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

      mockedHttpClient.get.mockResolvedValue({ data: mockEmptyCart });

      const result = await cartService.getCart();

      expect(result).toEqual(mockEmptyCart);
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

      mockedHttpClient.post.mockResolvedValue({ data: mockCartItem });

      const result = await cartService.addToCart('box1', 1);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/cart/items', {
        box_id: 'box1',
        quantity: 1,
      });
      expect(result).toEqual(mockCartItem);
    });

    it('should handle out of stock error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Insufficient stock' },
        },
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(cartService.addToCart('box1', 10)).rejects.toEqual(mockError);
    });

    it('should default quantity to 1', async () => {
      mockedHttpClient.post.mockResolvedValue({ data: {} });

      await cartService.addToCart('box1');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/cart/items', {
        box_id: 'box1',
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

      mockedHttpClient.patch.mockResolvedValue({ data: mockUpdatedItem });

      const result = await cartService.updateCartItem('1', 3);

      expect(mockedHttpClient.patch).toHaveBeenCalledWith('/cart/items/1', {
        quantity: 3,
      });
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should handle invalid quantity', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { quantity: ['Quantity must be at least 1'] } },
        },
      };

      mockedHttpClient.patch.mockRejectedValue(mockError);

      await expect(cartService.updateCartItem('1', 0)).rejects.toEqual(mockError);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      mockedHttpClient.delete.mockResolvedValue({ data: {} });

      await cartService.removeFromCart('1');

      expect(mockedHttpClient.delete).toHaveBeenCalledWith('/cart/items/1');
    });

    it('should handle item not found', async () => {
      const mockError = { response: { status: 404 } };
      mockedHttpClient.delete.mockRejectedValue(mockError);

      await expect(cartService.removeFromCart('999')).rejects.toEqual(mockError);
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      mockedHttpClient.delete.mockResolvedValue({ data: {} });

      await cartService.clearCart();

      expect(mockedHttpClient.delete).toHaveBeenCalledWith('/cart');
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

      mockedHttpClient.post.mockResolvedValue({ data: mockCart });

      const result = await cartService.applyCoupon('SAVE5');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/cart/coupon', {
        code: 'SAVE5',
      });
      expect(result).toEqual(mockCart);
    });

    it('should handle invalid coupon', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid or expired coupon' },
        },
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

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

      mockedHttpClient.delete.mockResolvedValue({ data: mockCart });

      const result = await cartService.removeCoupon();

      expect(mockedHttpClient.delete).toHaveBeenCalledWith('/cart/coupon');
      expect(result).toEqual(mockCart);
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

      mockedHttpClient.post.mockResolvedValue({ data: mockShipping });

      const result = await cartService.calculateShipping('01234-567');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/cart/shipping', {
        zip_code: '01234-567',
      });
      expect(result).toEqual(mockShipping);
    });

    it('should handle invalid zip code', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { zip_code: ['Invalid zip code format'] } },
        },
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(cartService.calculateShipping('invalid')).rejects.toEqual(mockError);
    });
  });

  describe('selectShipping', () => {
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

      mockedHttpClient.patch.mockResolvedValue({ data: mockCart });

      const result = await cartService.selectShipping('express');

      expect(mockedHttpClient.patch).toHaveBeenCalledWith('/cart/shipping', {
        shipping_option_id: 'express',
      });
      expect(result).toEqual(mockCart);
    });
  });

  describe('getCartSummary', () => {
    it('should get cart summary successfully', async () => {
      const mockSummary = {
        total_items: 3,
        subtotal: 32.97,
        shipping: 5.00,
        discount: 5.00,
        tax: 2.30,
        total: 35.27,
      };

      mockedHttpClient.get.mockResolvedValue({ data: mockSummary });

      const result = await cartService.getCartSummary();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/cart/summary');
      expect(result).toEqual(mockSummary);
    });
  });
});
