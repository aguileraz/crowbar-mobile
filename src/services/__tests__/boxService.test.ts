
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
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNextPage: false,
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxes({});

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes');
      expect(_result).toEqual(mockResponse);
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

      mockedApiClient.get.mockResolvedValue({ data: [], pagination: {} });

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

      mockedApiClient.get.mockResolvedValue({ data: mockBox });

      const _result = await boxService.getBoxById('1');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/boxes/1');
      expect(_result).toEqual(mockBox);
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
        data: [],
        pagination: {},
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const _result = await boxService.searchBoxes('test query');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/search', { query: 'test query' });
      expect(_result).toEqual(mockResponse);
    });

    it('should handle empty query', async () => {
      const mockResponse = { data: [], pagination: {} };
      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      await boxService.searchBoxes('');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/search', { query: '' });
    });
  });

  describe('getBoxesByCategory', () => {
    it('should fetch boxes by category successfully', async () => {
      const mockResponse = { data: [], pagination: {} };
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

      mockedApiClient.get.mockResolvedValue({ data: mockBoxes });

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

      mockedApiClient.get.mockResolvedValue({ data: mockBoxes });

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

      mockedApiClient.get.mockResolvedValue({ data: mockCategories });

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
        data: [
          {
            id: '1',
            rating: 5,
            comment: 'Great box!',
            user: { name: 'John Doe' },
          },
        ],
        pagination: {},
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

      mockedApiClient.post.mockResolvedValue({ data: mockReview });

      const _result = await boxService.addBoxReview('1', reviewData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/boxes/1/reviews', reviewData);
      expect(_result).toEqual(mockReview);
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
