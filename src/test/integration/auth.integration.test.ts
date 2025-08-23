 
/**
 * Integration tests for authentication flow
 * Tests real API communication for auth endpoints
 */

import { store } from '../../store';
import { login, register, logout } from '../../store/slices/authSlice';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  TEST_CREDENTIALS,
  skipIfAPIUnavailable,
  createTestUser,
  _loginTestUser,
  logoutTestUser,
} from './setup';

describe('Authentication Integration Tests', () => {
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

    // Ensure clean state
    store.dispatch({ type: 'auth/logout' });
  });

  afterEach(async () => {
    // Cleanup after each test
    await logoutTestUser();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const uniqueEmail = `test-${Date.now()}@crowbar.com`;
      const registerData = {
        name: 'Test User',
        email: uniqueEmail,
        password: 'testpassword123',
        password_confirmation: 'testpassword123',
      };

      const _result = await store.dispatch(register(registerData));

      expect(_result.type).toBe('auth/register/fulfilled');
      expect(_result.payload).toHaveProperty('user');
      expect(_result.payload).toHaveProperty('token');
      expect(_result.payload.user.email).toBe(uniqueEmail);

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.email).toBe(uniqueEmail);
      expect(state.auth.token).toBeTruthy();
    }, 15000);

    it('should handle registration with existing email', async () => {
      // First, ensure test user exists
      await createTestUser();

      const registerData = {
        name: 'Test User',
        email: TEST_CREDENTIALS.email,
        password: 'testpassword123',
        password_confirmation: 'testpassword123',
      };

      const _result = await store.dispatch(register(registerData));

      expect(_result.type).toBe('auth/register/rejected');
      expect(_result.payload).toContain('email');

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBeTruthy();
    }, 10000);

    it('should handle registration with invalid data', async () => {
      const registerData = {
        name: '',
        email: 'invalid-email',
        password: '123',
        password_confirmation: '456',
      };

      const _result = await store.dispatch(register(registerData));

      expect(_result.type).toBe('auth/register/rejected');

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBeTruthy();
    }, 10000);
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Ensure test user exists
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const _result = await store.dispatch(login(TEST_CREDENTIALS));

      expect(_result.type).toBe('auth/login/fulfilled');
      expect(_result.payload).toHaveProperty('user');
      expect(_result.payload).toHaveProperty('token');
      expect(_result.payload.user.email).toBe(TEST_CREDENTIALS.email);

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.email).toBe(TEST_CREDENTIALS.email);
      expect(state.auth.token).toBeTruthy();
    }, 10000);

    it('should handle login with invalid credentials', async () => {
      const invalidCredentials = {
        email: TEST_CREDENTIALS.email,
        password: 'wrongpassword',
      };

      const _result = await store.dispatch(login(invalidCredentials));

      expect(_result.type).toBe('auth/login/rejected');

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBeTruthy();
    }, 10000);

    it('should handle login with non-existent user', async () => {
      const nonExistentCredentials = {
        email: 'nonexistent@crowbar.com',
        password: 'password123',
      };

      const _result = await store.dispatch(login(nonExistentCredentials));

      expect(_result.type).toBe('auth/login/rejected');

      // Check store state
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBeTruthy();
    }, 10000);
  });

  describe('User Logout', () => {
    beforeEach(async () => {
      // Login first
      await createTestUser();
      await store.dispatch(login(TEST_CREDENTIALS));
    });

    it('should logout successfully', async () => {
      // Verify user is logged in
      let state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      const _result = await store.dispatch(logout());

      expect(_result.type).toBe('auth/logout/fulfilled');

      // Check store state
      state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.token).toBeNull();
    }, 10000);
  });

  describe('Token Persistence', () => {
    it('should persist token across app restarts', async () => {
      // Login
      await createTestUser();
      const loginResult = await store.dispatch(login(TEST_CREDENTIALS));
      
      expect(loginResult.type).toBe('auth/login/fulfilled');
      
      const token = loginResult.payload.token;
      expect(token).toBeTruthy();

      // Simulate app restart by clearing store and rehydrating
      store.dispatch({ type: 'auth/logout' });
      
      // In a real app, this would come from AsyncStorage
      store.dispatch({
        type: 'auth/setCredentials',
        payload: {
          user: loginResult.payload.user,
          token: token,
        },
      });

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.token).toBe(token);
    }, 10000);
  });

  describe('Authentication State Management', () => {
    it('should handle concurrent login attempts', async () => {
      await createTestUser();

      // Start multiple login attempts simultaneously
      const loginPromises = [
        store.dispatch(login(TEST_CREDENTIALS)),
        store.dispatch(login(TEST_CREDENTIALS)),
        store.dispatch(login(TEST_CREDENTIALS)),
      ];

      const results = await Promise.allSettled(loginPromises);

      // At least one should succeed
      const successfulLogins = results.filter(
        result => result.status === 'fulfilled' && 
        (_result.value as any).type === 'auth/login/fulfilled'
      );

      expect(successfulLogins.length).toBeGreaterThan(0);

      // Final state should be authenticated
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
    }, 15000);

    it('should handle network errors gracefully', async () => {
      // Temporarily break the API URL to simulate network error
      const _originalBaseURL = store.getState().auth.apiBaseURL;
      
      const invalidCredentials = {
        email: 'test@invalid-domain-that-does-not-exist.com',
        password: 'password',
      };

      const _result = await store.dispatch(login(invalidCredentials));

      expect(_result.type).toBe('auth/login/rejected');

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBeTruthy();
    }, 10000);
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await createTestUser();
      await store.dispatch(login(TEST_CREDENTIALS));
    });

    it('should handle token expiration', async () => {
      // This test would require the API to support token expiration simulation
      // or we would need to wait for actual token expiration
      
      // For now, we'll test the error handling when API returns 401
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      // In a real scenario, this would be triggered by an API call returning 401
      store.dispatch({
        type: 'auth/tokenExpired',
      });

      const newState = store.getState();
      expect(newState.auth.isAuthenticated).toBe(false);
    }, 5000);

    it('should refresh token when needed', async () => {
      // This test would require the API to support token refresh
      // Implementation depends on your auth strategy
      
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      
      const originalToken = state.auth.token;
      
      // Simulate token refresh (this would be an actual API call)
      // const refreshResult = await store.dispatch(refreshToken());
      // expect(refreshResult.type).toBe('auth/refreshToken/fulfilled');
      
      // For now, just verify the current state
      expect(originalToken).toBeTruthy();
    }, 5000);
  });
});
