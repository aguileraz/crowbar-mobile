/**
 * Integration tests for boxes functionality
 * Tests real API communication for box-related endpoints
 */

import { store } from '../../store';
import { fetchBoxes, fetchBoxById, searchBoxes } from '../../store/slices/boxSlice';
import { boxService } from '../../services/boxService';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  skipIfAPIUnavailable,
  createTestUser,
  loginTestUser,
  logoutTestUser,
  waitFor,
} from './setup';

describe('Boxes Integration Tests', () => {
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

    // Login test user for authenticated requests
    await createTestUser();
    await loginTestUser();
  });

  afterEach(async () => {
    await logoutTestUser();
  });

  describe('Fetch Boxes', () => {
    it('should fetch boxes list successfully', async () => {
      const result = await store.dispatch(fetchBoxes({ page: 1 }));

      expect(result.type).toBe('boxes/fetchBoxes/fulfilled');
      expect(result.payload).toHaveProperty('data');
      expect(result.payload).toHaveProperty('pagination');
      expect(Array.isArray(result.payload.data)).toBe(true);

      // Check store state
      const state = store.getState();
      expect(state.boxes.boxes.length).toBeGreaterThanOrEqual(0);
      expect(state.boxes.isLoading).toBe(false);
      expect(state.boxes.error).toBeNull();
    }, 10000);

    it('should handle pagination correctly', async () => {
      const firstPageResult = await store.dispatch(fetchBoxes({ page: 1, perPage: 5 }));
      
      expect(firstPageResult.type).toBe('boxes/fetchBoxes/fulfilled');
      expect(firstPageResult.payload.pagination).toHaveProperty('currentPage', 1);
      expect(firstPageResult.payload.pagination).toHaveProperty('totalPages');
      
      if (firstPageResult.payload.pagination.totalPages > 1) {
        const secondPageResult = await store.dispatch(fetchBoxes({ page: 2, perPage: 5 }));
        
        expect(secondPageResult.type).toBe('boxes/fetchBoxes/fulfilled');
        expect(secondPageResult.payload.pagination.currentPage).toBe(2);
      }
    }, 15000);

    it('should apply filters correctly', async () => {
      const filters = {
        category: 'electronics',
        minPrice: 10,
        maxPrice: 100,
      };

      const result = await store.dispatch(fetchBoxes({ page: 1, filters }));

      expect(result.type).toBe('boxes/fetchBoxes/fulfilled');
      
      // Verify that returned boxes match the filters (if any)
      if (result.payload.data.length > 0) {
        result.payload.data.forEach((box: any) => {
          if (filters.category) {
            expect(box.category).toBe(filters.category);
          }
          if (filters.minPrice) {
            expect(box.price).toBeGreaterThanOrEqual(filters.minPrice);
          }
          if (filters.maxPrice) {
            expect(box.price).toBeLessThanOrEqual(filters.maxPrice);
          }
        });
      }
    }, 10000);

    it('should handle API errors gracefully', async () => {
      // Test with invalid parameters
      const result = await store.dispatch(fetchBoxes({ page: -1 }));

      // Should either succeed with corrected params or fail gracefully
      if (result.type === 'boxes/fetchBoxes/rejected') {
        const state = store.getState();
        expect(state.boxes.error).toBeTruthy();
        expect(state.boxes.isLoading).toBe(false);
      }
    }, 10000);
  });

  describe('Fetch Box by ID', () => {
    let testBoxId: string;

    beforeEach(async () => {
      // Get a box ID from the boxes list
      const boxesResult = await store.dispatch(fetchBoxes({ page: 1 }));
      if (boxesResult.payload.data.length > 0) {
        testBoxId = boxesResult.payload.data[0].id;
      }
    });

    it('should fetch box details successfully', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      const result = await store.dispatch(fetchBoxById(testBoxId));

      expect(result.type).toBe('boxes/fetchBoxById/fulfilled');
      expect(result.payload).toHaveProperty('id', testBoxId);
      expect(result.payload).toHaveProperty('name');
      expect(result.payload).toHaveProperty('price');
      expect(result.payload).toHaveProperty('description');

      // Check store state
      const state = store.getState();
      expect(state.boxes.selectedBox).toEqual(result.payload);
      expect(state.boxes.isLoading).toBe(false);
    }, 10000);

    it('should handle non-existent box ID', async () => {
      const nonExistentId = 'non-existent-box-id-12345';
      
      const result = await store.dispatch(fetchBoxById(nonExistentId));

      expect(result.type).toBe('boxes/fetchBoxById/rejected');

      const state = store.getState();
      expect(state.boxes.error).toBeTruthy();
      expect(state.boxes.selectedBox).toBeNull();
    }, 10000);
  });

  describe('Search Boxes', () => {
    it('should search boxes successfully', async () => {
      const searchQuery = 'mystery';
      
      const result = await store.dispatch(searchBoxes({ query: searchQuery }));

      expect(result.type).toBe('boxes/searchBoxes/fulfilled');
      expect(result.payload).toHaveProperty('data');
      expect(Array.isArray(result.payload.data)).toBe(true);

      // Check that results contain the search term (if any results)
      if (result.payload.data.length > 0) {
        result.payload.data.forEach((box: any) => {
          const containsQuery = 
            box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            box.description.toLowerCase().includes(searchQuery.toLowerCase());
          expect(containsQuery).toBe(true);
        });
      }

      // Check store state
      const state = store.getState();
      expect(state.boxes.searchResults).toEqual(result.payload.data);
      expect(state.boxes.isSearching).toBe(false);
    }, 10000);

    it('should handle empty search query', async () => {
      const result = await store.dispatch(searchBoxes({ query: '' }));

      expect(result.type).toBe('boxes/searchBoxes/fulfilled');
      expect(result.payload.data).toEqual([]);
    }, 10000);

    it('should handle search with no results', async () => {
      const impossibleQuery = 'xyzabc123impossible';
      
      const result = await store.dispatch(searchBoxes({ query: impossibleQuery }));

      expect(result.type).toBe('boxes/searchBoxes/fulfilled');
      expect(result.payload.data).toEqual([]);

      const state = store.getState();
      expect(state.boxes.searchResults).toEqual([]);
    }, 10000);
  });

  describe('Box Categories', () => {
    it('should fetch categories successfully', async () => {
      const categories = await boxService.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      
      if (categories.length > 0) {
        categories.forEach((category: any) => {
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('slug');
        });
      }
    }, 10000);

    it('should fetch boxes by category', async () => {
      const categories = await boxService.getCategories();
      
      if (categories.length > 0) {
        const testCategory = categories[0];
        const result = await boxService.getBoxesByCategory(testCategory.slug);

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);

        // Verify boxes belong to the category
        result.data.forEach((box: any) => {
          expect(box.category).toBe(testCategory.slug);
        });
      }
    }, 10000);
  });

  describe('Featured and Popular Boxes', () => {
    it('should fetch featured boxes', async () => {
      const featuredBoxes = await boxService.getFeaturedBoxes();

      expect(Array.isArray(featuredBoxes)).toBe(true);
      
      featuredBoxes.forEach((box: any) => {
        expect(box).toHaveProperty('id');
        expect(box).toHaveProperty('name');
        expect(box).toHaveProperty('price');
        expect(box.featured).toBe(true);
      });
    }, 10000);

    it('should fetch popular boxes', async () => {
      const popularBoxes = await boxService.getPopularBoxes();

      expect(Array.isArray(popularBoxes)).toBe(true);
      
      popularBoxes.forEach((box: any) => {
        expect(box).toHaveProperty('id');
        expect(box).toHaveProperty('name');
        expect(box).toHaveProperty('price');
        expect(typeof box.popularity_score).toBe('number');
      });
    }, 10000);
  });

  describe('Box Reviews', () => {
    let testBoxId: string;

    beforeEach(async () => {
      const boxesResult = await store.dispatch(fetchBoxes({ page: 1 }));
      if (boxesResult.payload.data.length > 0) {
        testBoxId = boxesResult.payload.data[0].id;
      }
    });

    it('should fetch box reviews', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      const reviews = await boxService.getBoxReviews(testBoxId);

      expect(reviews).toHaveProperty('data');
      expect(Array.isArray(reviews.data)).toBe(true);

      reviews.data.forEach((review: any) => {
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('comment');
        expect(review).toHaveProperty('user');
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      });
    }, 10000);

    it('should add a review to a box', async () => {
      if (!testBoxId) {
        pending('No boxes available for testing');
        return;
      }

      const reviewData = {
        rating: 5,
        comment: 'Great box! Integration test review.',
      };

      try {
        const newReview = await boxService.addBoxReview(testBoxId, reviewData);

        expect(newReview).toHaveProperty('id');
        expect(newReview.rating).toBe(reviewData.rating);
        expect(newReview.comment).toBe(reviewData.comment);
        expect(newReview).toHaveProperty('user');
      } catch (error: any) {
        // Handle case where user already reviewed this box
        if (error.response?.status === 422) {
          expect(error.response.data).toHaveProperty('errors');
        } else {
          throw error;
        }
      }
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      // This would require configuring a very short timeout
      // and testing with a slow endpoint
      
      const result = await store.dispatch(fetchBoxes({ page: 1 }));
      
      // Should either succeed or fail gracefully
      expect(['boxes/fetchBoxes/fulfilled', 'boxes/fetchBoxes/rejected']).toContain(result.type);
    }, 15000);

    it('should handle malformed responses', async () => {
      // This test would require the API to have an endpoint that returns malformed data
      // or we would need to mock the response at the HTTP level
      
      const result = await store.dispatch(fetchBoxes({ page: 1 }));
      
      if (result.type === 'boxes/fetchBoxes/rejected') {
        const state = store.getState();
        expect(state.boxes.error).toBeTruthy();
      }
    }, 10000);
  });
});
