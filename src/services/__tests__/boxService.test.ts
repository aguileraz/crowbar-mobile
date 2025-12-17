
import { boxService } from '../boxService';
import { apiClient } from '../api';

// Mock apiClient
jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BoxService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBoxes', () => {
    it('should fetch boxes successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Box',
            price: 10.99,
            description: 'Test description',
            image_url: 'test.jpg',
            category: 'test',
            stock: 10,
            rarity: 'common',
          },
        ],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 1,
          from: 1,
          to: 1,
        },
        links: {
          first: '/boxes?page=1',
          last: '/boxes?page=1',
          prev: null,
          next: null,
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxes({});

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes');
      expect(_result).toEqual(mockResponse);
      expect(_result.success).toBe(true);
      expect(_result.data).toHaveLength(1);
    });

    it('should handle API error', async () => {
      const mockError = new Error('API Error');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(boxService.getBoxes()).rejects.toThrow('API Error');
    });

    it('should pass filters correctly', async () => {
      const filters = {
        category_id: 'electronics',
        min_price: 10,
        max_price: 100,
        rarity: ['rare'],
        page: 1,
        per_page: 10,
      };

      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        links: {
          first: '/boxes?page=1',
          last: '/boxes?page=1',
          prev: null,
          next: null,
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      await boxService.getBoxes(filters);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes?category_id=electronics&min_price=10&max_price=100&rarity%5B%5D=rare&page=1&per_page=10');
    });
  });

  describe('getBoxById', () => {
    it('should fetch box by id successfully', async () => {
      const mockBox = {
        id: '1',
        name: 'Test Box',
        price: 10.99,
        description: 'Test description',
        image_url: 'test.jpg',
        category: 'test',
        stock: 10,
        rarity: 'common',
        possible_items: [],
        reviews: [],
      };

      const mockResponse = {
        success: true,
        data: mockBox,
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxById('1');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes/1');
      expect(_result).toEqual(mockResponse);
      expect(_result.data).toEqual(mockBox);
    });

    it('should handle not found error', async () => {
      const mockError = { response: { status: 404 } };
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(boxService.getBoxById('999')).rejects.toEqual(mockError);
    });
  });

  describe('searchBoxes', () => {
    it('should search boxes successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
          },
          links: {
            first: '/boxes/search?page=1',
            last: '/boxes/search?page=1',
            prev: null,
            next: null,
          },
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const _result = await boxService.searchBoxes('test query');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/search', { query: 'test query' });
      expect(_result).toEqual(mockResponse.data);
    });

    it('should handle empty query', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
          },
          links: {
            first: '/boxes/search?page=1',
            last: '/boxes/search?page=1',
            prev: null,
            next: null,
          },
        },
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      await boxService.searchBoxes('');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/search', { query: '' });
    });
  });

  describe('getBoxesByCategory', () => {
    it('should fetch boxes by category successfully', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        links: {
          first: '/boxes?page=1',
          last: '/boxes?page=1',
          prev: null,
          next: null,
        },
      };
      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxesByCategory('electronics');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes?category_id=electronics');
      expect(_result).toEqual(mockResponse);
    });
  });

  describe('getFeaturedBoxes', () => {
    it('should fetch featured boxes successfully', async () => {
      const mockBoxes = [
        { id: '1', name: 'Featured Box 1' },
        { id: '2', name: 'Featured Box 2' },
      ];

      const mockResponse = {
        success: true,
        data: mockBoxes,
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getFeaturedBoxes();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes/featured?limit=10');
      expect(_result).toEqual(mockBoxes);
    });
  });

  describe('getPopularBoxes', () => {
    it('should fetch popular boxes successfully', async () => {
      const mockBoxes = [
        { id: '1', name: 'Popular Box 1' },
        { id: '2', name: 'Popular Box 2' },
      ];

      const mockResponse = {
        success: true,
        data: mockBoxes,
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getPopularBoxes();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes/popular?limit=10');
      expect(_result).toEqual(mockBoxes);
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Gaming', slug: 'gaming' },
      ];

      const mockResponse = {
        success: true,
        data: mockCategories,
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getCategories();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/categories');
      expect(_result).toEqual(mockCategories);
    });
  });

  // TODO: openBox method doesn't exist in boxService
  // Box opening functionality likely handled elsewhere (possibly in cart/order flow)
  describe.skip('openBox', () => {
    it('should open box successfully', async () => {
      const mockResult = {
        items: [
          { id: '1', name: 'Item 1', rarity: 'common' },
          { id: '2', name: 'Item 2', rarity: 'rare' },
        ],
        total_value: 25.99,
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResult });

      const _result = await boxService.openBox('1');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/1/open');
      expect(_result).toEqual(mockResult);
    });

    it('should handle insufficient funds error', async () => {
      const mockError = { response: { status: 400, data: { message: 'Insufficient funds' } } };
      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(boxService.openBox('1')).rejects.toEqual(mockError);
    });
  });

  describe('getBoxReviews', () => {
    it('should fetch box reviews successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            rating: 5,
            comment: 'Great box!',
            user: { name: 'John Doe' },
          },
        ],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 1,
          from: 1,
          to: 1,
        },
        links: {
          first: '/boxes/1/reviews?page=1',
          last: '/boxes/1/reviews?page=1',
          prev: null,
          next: null,
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxReviews('1');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes/1/reviews?page=1&per_page=10');
      expect(_result).toEqual(mockResponse);
    });
  });

  describe('addBoxReview', () => {
    it('should add review successfully', async () => {
      const mockReview = {
        id: '1',
        rating: 5,
        comment: 'Great box!',
        user: { name: 'John Doe' },
      };

      const reviewData = {
        rating: 5,
        comment: 'Great box!',
      };

      const mockResponse = {
        success: true,
        data: mockReview,
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const _result = await boxService.addBoxReview('1', reviewData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/1/reviews', reviewData);
      expect(_result).toEqual(mockResponse.data);
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { rating: ['Rating is required'] } },
        },
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(boxService.addBoxReview('1', { rating: 0, comment: '' })).rejects.toEqual(mockError);
    });
  });
});
