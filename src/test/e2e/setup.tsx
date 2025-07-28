/**
 * E2E Test Setup
 * Configuration and utilities for end-to-end testing
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { store } from '../../store';
import { theme } from '../../theme';

// Mock navigation for E2E tests
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

// Mock route for E2E tests
const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

/**
 * Test wrapper component that provides all necessary providers
 */
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
};

/**
 * Custom render function for E2E tests
 */
export const renderWithProviders = (component: React.ReactElement, options = {}) => {
  return render(component, {
    wrapper: TestWrapper,
    ...options,
  });
};

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: 'e2e-test@crowbar.com',
  password: 'testpassword123',
  name: 'E2E Test User',
};

/**
 * Test data for E2E scenarios
 */
export const TEST_DATA = {
  box: {
    id: 'test-box-1',
    name: 'E2E Test Box',
    price: 19.99,
    description: 'Box for end-to-end testing',
    image_url: 'https://example.com/test-box.jpg',
    category: 'test',
    stock: 10,
  },
  address: {
    type: 'home',
    street: '123 E2E Test Street',
    number: '456',
    neighborhood: 'Test Neighborhood',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    country: 'Brazil',
  },
  paymentMethod: {
    type: 'credit_card',
    card_number: '4111111111111111',
    expiry_month: '12',
    expiry_year: '2025',
    cvv: '123',
    holder_name: 'E2E Test User',
  },
};

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for element to appear
   */
  waitForElement: async (getByTestId: any, testId: string, timeout = 5000) => {
    return waitFor(() => getByTestId(testId), { timeout });
  },

  /**
   * Wait for element to disappear
   */
  waitForElementToDisappear: async (_queryByTestId: any, testId: string, timeout = 5000) => {
    return waitFor(() => expect(_queryByTestId(testId)).toBeNull(), { timeout });
  },

  /**
   * Fill form field
   */
  fillField: async (getByTestId: any, testId: string, value: string) => {
    const field = await testUtils.waitForElement(getByTestId, testId);
    fireEvent.changeText(field, value);
    return field;
  },

  /**
   * Press button and wait
   */
  pressButton: async (getByTestId: any, testId: string) => {
    const button = await testUtils.waitForElement(getByTestId, testId);
    fireEvent.press(button);
    return button;
  },

  /**
   * Scroll to element
   */
  scrollToElement: async (getByTestId: any, scrollViewTestId: string, elementTestId: string) => {
    const scrollView = await testUtils.waitForElement(getByTestId, scrollViewTestId);
    const element = await testUtils.waitForElement(getByTestId, elementTestId);
    
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 100 },
        contentSize: { height: 1000, width: 400 },
        layoutMeasurement: { height: 400, width: 400 },
      },
    });
    
    return element;
  },

  /**
   * Wait for loading to complete
   */
  waitForLoadingToComplete: async (_queryByTestId: any, loadingTestId = 'loading-indicator') => {
    return testUtils.waitForElementToDisappear(_queryByTestId, loadingTestId);
  },

  /**
   * Simulate network delay
   */
  simulateNetworkDelay: (ms = 1000) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Mock successful API response
   */
  mockApiSuccess: (data: any) => {
    return Promise.resolve({ data });
  },

  /**
   * Mock API error
   */
  mockApiError: (status = 400, message = 'API Error') => {
    const error = new Error(message);
    (error as any).response = { status, data: { message } };
    return Promise.reject(error);
  },

  /**
   * Reset store state
   */
  resetStore: () => {
    store.dispatch({ type: 'RESET_ALL' });
  },

  /**
   * Set authenticated state
   */
  setAuthenticatedState: (user = TEST_USER) => {
    store.dispatch({
      type: 'auth/setCredentials',
      payload: {
        user: {
          id: '1',
          name: user.name,
          email: user.email,
          avatar: null,
        },
        token: 'test-token-12345',
      },
    });
  },

  /**
   * Clear authenticated state
   */
  clearAuthenticatedState: () => {
    store.dispatch({ type: 'auth/logout' });
  },
};

/**
 * E2E Test scenarios
 */
export const scenarios = {
  /**
   * Complete user registration flow
   */
  userRegistration: async (getByTestId: any, _queryByTestId: any) => {
    // Fill registration form
    await testUtils.fillField(getByTestId, 'register-name-input', TEST_USER.name);
    await testUtils.fillField(getByTestId, 'register-email-input', TEST_USER.email);
    await testUtils.fillField(getByTestId, 'register-password-input', TEST_USER.password);
    await testUtils.fillField(getByTestId, 'register-confirm-password-input', TEST_USER.password);
    
    // Submit registration
    await testUtils.pressButton(getByTestId, 'register-submit-button');
    
    // Wait for success
    await testUtils.waitForLoadingToComplete(_queryByTestId);
  },

  /**
   * Complete user login flow
   */
  userLogin: async (getByTestId: any, _queryByTestId: any) => {
    // Fill login form
    await testUtils.fillField(getByTestId, 'login-email-input', TEST_USER.email);
    await testUtils.fillField(getByTestId, 'login-password-input', TEST_USER.password);
    
    // Submit login
    await testUtils.pressButton(getByTestId, 'login-submit-button');
    
    // Wait for success
    await testUtils.waitForLoadingToComplete(_queryByTestId);
  },

  /**
   * Browse and search boxes
   */
  browseBoxes: async (getByTestId: any, _queryByTestId: any) => {
    // Wait for boxes to load
    await testUtils.waitForElement(getByTestId, 'boxes-list');
    
    // Search for boxes
    await testUtils.fillField(getByTestId, 'search-input', 'mystery');
    await testUtils.pressButton(getByTestId, 'search-button');
    
    // Wait for search results
    await testUtils.waitForLoadingToComplete(_queryByTestId);
  },

  /**
   * Add box to cart
   */
  addToCart: async (getByTestId: any, _queryByTestId: any) => {
    // Select first box
    await testUtils.pressButton(getByTestId, 'box-card-0');
    
    // Wait for box details
    await testUtils.waitForElement(getByTestId, 'box-details-screen');
    
    // Add to cart
    await testUtils.pressButton(getByTestId, 'add-to-cart-button');
    
    // Wait for success
    await testUtils.waitForLoadingToComplete(_queryByTestId);
  },

  /**
   * Complete checkout process
   */
  checkout: async (getByTestId: any, _queryByTestId: any) => {
    // Go to cart
    await testUtils.pressButton(getByTestId, 'cart-tab');
    
    // Proceed to checkout
    await testUtils.pressButton(getByTestId, 'checkout-button');
    
    // Fill address (if needed)
    try {
      await testUtils.waitForElement(getByTestId, 'address-form', 2000);
      await testUtils.fillField(getByTestId, 'address-street-input', TEST_DATA.address.street);
      await testUtils.fillField(getByTestId, 'address-city-input', TEST_DATA.address.city);
      await testUtils.fillField(getByTestId, 'address-zip-input', TEST_DATA.address.zip_code);
      await testUtils.pressButton(getByTestId, 'address-save-button');
    } catch (error) {
      // Address already exists
    }
    
    // Select payment method
    await testUtils.pressButton(getByTestId, 'payment-method-credit-card');
    
    // Complete order
    await testUtils.pressButton(getByTestId, 'complete-order-button');
    
    // Wait for success
    await testUtils.waitForLoadingToComplete(_queryByTestId);
  },

  /**
   * Open a box
   */
  openBox: async (getByTestId: any, _queryByTestId: any) => {
    // Go to inventory or boxes
    await testUtils.pressButton(getByTestId, 'profile-tab');
    await testUtils.pressButton(getByTestId, 'my-boxes-button');
    
    // Select box to open
    await testUtils.pressButton(getByTestId, 'owned-box-0');
    
    // Open box
    await testUtils.pressButton(getByTestId, 'open-box-button');
    
    // Wait for animation and results
    await testUtils.waitForElement(getByTestId, 'box-opening-results');
  },
};

/**
 * Test assertions
 */
export const assertions = {
  /**
   * Assert user is logged in
   */
  userIsLoggedIn: (getByTestId: any) => {
    expect(getByTestId('user-avatar')).toBeTruthy();
  },

  /**
   * Assert user is logged out
   */
  userIsLoggedOut: (getByTestId: any) => {
    expect(getByTestId('login-screen')).toBeTruthy();
  },

  /**
   * Assert cart has items
   */
  cartHasItems: (getByTestId: any) => {
    expect(getByTestId('cart-items-count')).toBeTruthy();
  },

  /**
   * Assert order was created
   */
  orderWasCreated: (getByTestId: any) => {
    expect(getByTestId('order-success-message')).toBeTruthy();
  },

  /**
   * Assert box was opened
   */
  boxWasOpened: (getByTestId: any) => {
    expect(getByTestId('box-opening-results')).toBeTruthy();
  },
};
