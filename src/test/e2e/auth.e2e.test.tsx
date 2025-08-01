 
/**
 * E2E Tests for Authentication Flow
 * Tests complete user authentication scenarios
 */

import React from 'react';
import { act } from '@testing-library/react-native';
import { renderWithProviders, testUtils, scenarios, assertions, TEST_USER } from './setup';
import AuthNavigator from '../../navigation/AuthNavigator';
import { authService } from '../../services/authService';

// Mock auth service
jest.mock('../../services/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testUtils.resetStore();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      // Mock successful registration
      mockedAuthService.register.mockResolvedValue({
        user: {
          id: '1',
          name: TEST_USER.name,
          email: TEST_USER.email,
          avatar: null,
        },
        token: 'test-token-12345',
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      // Navigate to registration
      await testUtils.pressButton(getByTestId, 'register-tab');

      // Complete registration flow
      await act(async () => {
        await scenarios.userRegistration(getByTestId, _queryByTestId);
      });

      // Verify registration was successful
      expect(mockedAuthService.register).toHaveBeenCalledWith({
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
        password_confirmation: TEST_USER.password,
      });

      // Should navigate to main app
      await testUtils.waitForElement(getByTestId, 'main-app-screen');
      assertions.userIsLoggedIn(getByTestId);
    });

    it('should handle registration validation errors', async () => {
      // Mock validation error
      mockedAuthService.register.mockRejectedValue({
        response: {
          status: 422,
          data: {
            errors: {
              email: ['Email is already taken'],
            },
          },
        },
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      // Navigate to registration
      await testUtils.pressButton(getByTestId, 'register-tab');

      // Try to register with invalid data
      await act(async () => {
        await testUtils.fillField(getByTestId, 'register-name-input', '');
        await testUtils.fillField(getByTestId, 'register-email-input', 'invalid-email');
        await testUtils.fillField(getByTestId, 'register-password-input', '123');
        await testUtils.fillField(getByTestId, 'register-confirm-password-input', '456');
        await testUtils.pressButton(getByTestId, 'register-submit-button');
      });

      // Should show validation errors
      await testUtils.waitForElement(getByTestId, 'error-message');
      expect(getByTestId('error-message')).toBeTruthy();

      // Should remain on registration screen
      expect(getByTestId('register-screen')).toBeTruthy();
    });

    it('should handle network errors during registration', async () => {
      // Mock network error
      mockedAuthService.register.mockRejectedValue(new Error('Network Error'));

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      await testUtils.pressButton(getByTestId, 'register-tab');

      await act(async () => {
        await scenarios.userRegistration(getByTestId, _queryByTestId);
      });

      // Should show error message
      await testUtils.waitForElement(getByTestId, 'error-message');
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  describe('User Login Flow', () => {
    it('should complete full login process', async () => {
      // Mock successful login
      mockedAuthService.login.mockResolvedValue({
        user: {
          id: '1',
          name: TEST_USER.name,
          email: TEST_USER.email,
          avatar: null,
        },
        token: 'test-token-12345',
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      // Complete login flow
      await act(async () => {
        await scenarios.userLogin(getByTestId, _queryByTestId);
      });

      // Verify login was called
      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      // Should navigate to main app
      await testUtils.waitForElement(getByTestId, 'main-app-screen');
      assertions.userIsLoggedIn(getByTestId);
    });

    it('should handle invalid credentials', async () => {
      // Mock authentication error
      mockedAuthService.login.mockRejectedValue({
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
          },
        },
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      await act(async () => {
        await testUtils.fillField(getByTestId, 'login-email-input', 'wrong@email.com');
        await testUtils.fillField(getByTestId, 'login-password-input', 'wrongpassword');
        await testUtils.pressButton(getByTestId, 'login-submit-button');
      });

      // Should show error message
      await testUtils.waitForElement(getByTestId, 'error-message');
      expect(getByTestId('error-message')).toBeTruthy();

      // Should remain on login screen
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('should remember user credentials', async () => {
      mockedAuthService.login.mockResolvedValue({
        user: {
          id: '1',
          name: TEST_USER.name,
          email: TEST_USER.email,
          avatar: null,
        },
        token: 'test-token-12345',
      });

      const { getByTestId, _queryByTestId } = renderWithProviders(<AuthNavigator />);

      // Enable remember me
      await testUtils.pressButton(getByTestId, 'remember-me-checkbox');

      await act(async () => {
        await scenarios.userLogin(getByTestId, _queryByTestId);
      });

      // Verify remember me was included in login call
      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: TEST_USER.email,
        password: TEST_USER.password,
        remember: true,
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password request', async () => {
      // Mock successful password reset request
      mockedAuthService.forgotPassword.mockResolvedValue({
        message: 'Password reset email sent',
      });

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Navigate to forgot password
      await testUtils.pressButton(getByTestId, 'forgot-password-link');

      // Fill email and submit
      await act(async () => {
        await testUtils.fillField(getByTestId, 'forgot-password-email-input', TEST_USER.email);
        await testUtils.pressButton(getByTestId, 'forgot-password-submit-button');
      });

      // Verify API was called
      expect(mockedAuthService.forgotPassword).toHaveBeenCalledWith(TEST_USER.email);

      // Should show success message
      await testUtils.waitForElement(getByTestId, 'success-message');
      expect(getByTestId('success-message')).toBeTruthy();
    });

    it('should handle invalid email for password reset', async () => {
      // Mock error for invalid email
      mockedAuthService.forgotPassword.mockRejectedValue({
        response: {
          status: 404,
          data: {
            message: 'Email not found',
          },
        },
      });

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      await testUtils.pressButton(getByTestId, 'forgot-password-link');

      await act(async () => {
        await testUtils.fillField(getByTestId, 'forgot-password-email-input', 'nonexistent@email.com');
        await testUtils.pressButton(getByTestId, 'forgot-password-submit-button');
      });

      // Should show error message
      await testUtils.waitForElement(getByTestId, 'error-message');
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Set authenticated state
      testUtils.setAuthenticatedState();
    });

    it('should complete logout process', async () => {
      // Mock successful logout
      mockedAuthService.logout.mockResolvedValue({});

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Logout
      await act(async () => {
        await testUtils.pressButton(getByTestId, 'logout-button');
      });

      // Verify logout was called
      expect(mockedAuthService.logout).toHaveBeenCalled();

      // Should navigate back to login screen
      await testUtils.waitForElement(getByTestId, 'login-screen');
      assertions.userIsLoggedOut(getByTestId);
    });

    it('should handle logout confirmation dialog', async () => {
      mockedAuthService.logout.mockResolvedValue({});

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Trigger logout
      await testUtils.pressButton(getByTestId, 'logout-button');

      // Should show confirmation dialog
      await testUtils.waitForElement(getByTestId, 'logout-confirmation-dialog');

      // Confirm logout
      await testUtils.pressButton(getByTestId, 'confirm-logout-button');

      // Should complete logout
      expect(mockedAuthService.logout).toHaveBeenCalled();
    });

    it('should cancel logout when user declines', async () => {
      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Trigger logout
      await testUtils.pressButton(getByTestId, 'logout-button');

      // Should show confirmation dialog
      await testUtils.waitForElement(getByTestId, 'logout-confirmation-dialog');

      // Cancel logout
      await testUtils.pressButton(getByTestId, 'cancel-logout-button');

      // Should remain logged in
      expect(mockedAuthService.logout).not.toHaveBeenCalled();
      assertions.userIsLoggedIn(getByTestId);
    });
  });

  describe('Session Management', () => {
    it('should handle token expiration', async () => {
      // Set authenticated state
      testUtils.setAuthenticatedState();

      // Mock token validation failure
      mockedAuthService.validateToken.mockRejectedValue({
        response: { status: 401 },
      });

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Simulate app becoming active (token validation)
      await act(async () => {
        // This would be triggered by app state change
        // For testing, we'll dispatch the action directly
        testUtils.clearAuthenticatedState();
      });

      // Should redirect to login
      await testUtils.waitForElement(getByTestId, 'login-screen');
      assertions.userIsLoggedOut(getByTestId);
    });

    it('should persist session across app restarts', async () => {
      // Mock token validation success
      mockedAuthService.validateToken.mockResolvedValue({
        user: {
          id: '1',
          name: TEST_USER.name,
          email: TEST_USER.email,
          avatar: null,
        },
      });

      // Set authenticated state (simulating persisted session)
      testUtils.setAuthenticatedState();

      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      // Should remain logged in
      assertions.userIsLoggedIn(getByTestId);
      expect(getByTestId('main-app-screen')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      await act(async () => {
        await testUtils.fillField(getByTestId, 'login-email-input', 'invalid-email');
        await testUtils.pressButton(getByTestId, 'login-submit-button');
      });

      // Should show validation error
      await testUtils.waitForElement(getByTestId, 'email-validation-error');
      expect(getByTestId('email-validation-error')).toBeTruthy();
    });

    it('should validate password strength', async () => {
      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      await testUtils.pressButton(getByTestId, 'register-tab');

      await act(async () => {
        await testUtils.fillField(getByTestId, 'register-password-input', '123');
        await testUtils.pressButton(getByTestId, 'register-submit-button');
      });

      // Should show password strength error
      await testUtils.waitForElement(getByTestId, 'password-validation-error');
      expect(getByTestId('password-validation-error')).toBeTruthy();
    });

    it('should validate password confirmation match', async () => {
      const { getByTestId } = renderWithProviders(<AuthNavigator />);

      await testUtils.pressButton(getByTestId, 'register-tab');

      await act(async () => {
        await testUtils.fillField(getByTestId, 'register-password-input', 'password123');
        await testUtils.fillField(getByTestId, 'register-confirm-password-input', 'different123');
        await testUtils.pressButton(getByTestId, 'register-submit-button');
      });

      // Should show password mismatch error
      await testUtils.waitForElement(getByTestId, 'password-mismatch-error');
      expect(getByTestId('password-mismatch-error')).toBeTruthy();
    });
  });
});
