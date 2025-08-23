 
import { boxService } from '../boxService';
import { httpClient } from '../httpClient';

// Mock httpClient
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('BoxService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBoxes', () => {
    it('should fetch boxes successfully', async () => {
      const mockResponse = {
        data: {
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
        },
      };

      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxes();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes', {
        params: { page: 1, per_page: 20 },
      });
      expect(_result).toEqual(mockResponse.data);
    });

    it('should handle API error', async () => {
      const mockError = new Error('API Error');
      mockedHttpClient.get.mockRejectedValue(mockError);

      await expect(boxService.getBoxes()).rejects.toThrow('API Error');
    });

    it('should pass filters correctly', async () => {
      const filters = {
        category: 'electronics',
        minPrice: 10,
        maxPrice: 100,
        rarity: 'rare',
      };

      mockedHttpClient.get.mockResolvedValue({ data: { data: [], pagination: {} } });

      await boxService.getBoxes(1, 10, filters);

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes', {
        params: {
          page: 1,
          per_page: 10,
          category: 'electronics',
          min_price: 10,
          max_price: 100,
          rarity: 'rare',
        },
      });
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

      mockedHttpClient.get.mockResolvedValue({ data: mockBox });

      const _result = await boxService.getBoxById('1');

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/1');
      expect(_result).toEqual(mockBox);
    });

    it('should handle not found error', async () => {
      const mockError = { response: { status: 404 } };
      mockedHttpClient.get.mockRejectedValue(mockError);

      await expect(boxService.getBoxById('999')).rejects.toEqual(mockError);
    });
  });

  describe('searchBoxes', () => {
    it('should search boxes successfully', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {},
        },
      };

      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.searchBoxes('test query');

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/search', {
        params: { q: 'test query', page: 1, per_page: 20 },
      });
      expect(_result).toEqual(mockResponse.data);
    });

    it('should handle empty query', async () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await boxService.searchBoxes('');

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/search', {
        params: { q: '', page: 1, per_page: 20 },
      });
    });
  });

  describe('getBoxesByCategory', () => {
    it('should fetch boxes by category successfully', async () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxesByCategory('electronics');

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/category/electronics', {
        params: { page: 1, per_page: 20 },
      });
      expect(_result).toEqual(mockResponse.data);
    });
  });

  describe('getFeaturedBoxes', () => {
    it('should fetch featured boxes successfully', async () => {
      const mockBoxes = [
        { id: '1', name: 'Featured Box 1' },
        { id: '2', name: 'Featured Box 2' },
      ];

      mockedHttpClient.get.mockResolvedValue({ data: mockBoxes });

      const _result = await boxService.getFeaturedBoxes();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/featured');
      expect(_result).toEqual(mockBoxes);
    });
  });

  describe('getPopularBoxes', () => {
    it('should fetch popular boxes successfully', async () => {
      const mockBoxes = [
        { id: '1', name: 'Popular Box 1' },
        { id: '2', name: 'Popular Box 2' },
      ];

      mockedHttpClient.get.mockResolvedValue({ data: mockBoxes });

      const _result = await boxService.getPopularBoxes();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/popular');
      expect(_result).toEqual(mockBoxes);
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Electronics', slug: 'electronics' },
        { id: '2', name: 'Gaming', slug: 'gaming' },
      ];

      mockedHttpClient.get.mockResolvedValue({ data: mockCategories });

      const _result = await boxService.getCategories();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/categories');
      expect(_result).toEqual(mockCategories);
    });
  });

  describe('openBox', () => {
    it('should open box successfully', async () => {
      const mockResult = {
        items: [
          { id: '1', name: 'Item 1', rarity: 'common' },
          { id: '2', name: 'Item 2', rarity: 'rare' },
        ],
        total_value: 25.99,
      };

      mockedHttpClient.post.mockResolvedValue({ data: mockResult });

      const _result = await boxService.openBox('1');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/boxes/1/open');
      expect(_result).toEqual(mockResult);
    });

    it('should handle insufficient funds error', async () => {
      const mockError = { response: { status: 400, data: { message: 'Insufficient funds' } } };
      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(boxService.openBox('1')).rejects.toEqual(mockError);
    });
  });

  describe('getBoxReviews', () => {
    it('should fetch box reviews successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              rating: 5,
              comment: 'Great box!',
              user: { name: 'John Doe' },
            },
          ],
          pagination: {},
        },
      };

      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const _result = await boxService.getBoxReviews('1');

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/boxes/1/reviews', {
        params: { page: 1, per_page: 20 },
      });
      expect(_result).toEqual(mockResponse.data);
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

      mockedHttpClient.post.mockResolvedValue({ data: mockReview });

      const _result = await boxService.addBoxReview('1', reviewData);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/boxes/1/reviews', reviewData);
      expect(_result).toEqual(mockReview);
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { rating: ['Rating is required'] } },
        },
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

      await expect(boxService.addBoxReview('1', { rating: 0, comment: '' })).rejects.toEqual(mockError);
    });
  });
});
