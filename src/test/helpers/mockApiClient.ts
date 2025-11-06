/**
 * Mock API Client Helper
 *
 * Helper inteligente que detecta endpoints e retorna fixtures apropriados.
 * Substitui MSW para evitar problemas de ESM em testes Jest.
 *
 * Uso:
 * - Automaticamente configurado em jest.setup.js
 * - Testes podem sobrescrever mocks específicos usando jest.spyOn()
 * - Suporta query parameters e detecção de método HTTP
 */

import * as cartFixtures from '../fixtures/cartFixtures';
import * as boxFixtures from '../fixtures/boxFixtures';
import * as orderFixtures from '../fixtures/orderFixtures';
import * as userFixtures from '../fixtures/userFixtures';
import * as authFixtures from '../fixtures/authFixtures';
import * as reviewFixtures from '../fixtures/reviewFixtures';
import * as paymentFixtures from '../fixtures/paymentFixtures';

/**
 * Tipo de resposta da API mockada
 */
interface MockApiResponse<T = any> {
  data: T;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

/**
 * Detecta qual fixture retornar baseado na URL
 */
export function getMockResponseForUrl(
  url: string,
  method: string = 'GET',
  body?: any
): MockApiResponse {
  const lowerUrl = url.toLowerCase();
  const upperMethod = method.toUpperCase();

  // ===================================
  // CART ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/cart')) {
    if (upperMethod === 'GET') {
      if (lowerUrl.includes('empty')) {
        return { data: cartFixtures.mockEmptyCart };
      }
      if (lowerUrl.includes('multiple')) {
        return { data: cartFixtures.mockCartMultipleItems };
      }
      return { data: cartFixtures.mockCart };
    }

    if (upperMethod === 'POST') {
      if (lowerUrl.includes('/items') || lowerUrl.includes('/add')) {
        return { data: cartFixtures.mockAddToCartResponse };
      }
      return { data: cartFixtures.mockCart };
    }

    if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
      if (lowerUrl.includes('/items')) {
        return { data: cartFixtures.mockUpdateCartItemResponse };
      }
      return { data: cartFixtures.mockCart };
    }

    if (upperMethod === 'DELETE') {
      if (lowerUrl.includes('/clear')) {
        return { data: cartFixtures.mockClearCartResponse };
      }
      return { data: cartFixtures.mockRemoveCartItemResponse };
    }
  }

  // ===================================
  // BOX ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/box')) {
    if (upperMethod === 'GET') {
      // Box detail (URL com ID específico: /boxes/123)
      if (/\/boxes?\/[\w-]+$/.test(lowerUrl)) {
        return { data: boxFixtures.mockBoxDetailResponse };
      }

      // Featured boxes
      if (lowerUrl.includes('featured')) {
        return { data: boxFixtures.mockFeaturedBoxesResponse };
      }

      // Categories
      if (lowerUrl.includes('categories')) {
        return { data: boxFixtures.mockCategoriesResponse };
      }

      // Search
      if (lowerUrl.includes('search') || lowerUrl.includes('?')) {
        return { data: boxFixtures.mockSearchBoxesResponse };
      }

      // List all boxes
      return { data: boxFixtures.mockBoxesResponse };
    }
  }

  // ===================================
  // ORDER ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/order')) {
    if (upperMethod === 'GET') {
      // Order detail (URL com ID específico: /orders/123)
      if (/\/orders?\/[\w-]+$/.test(lowerUrl)) {
        return { data: orderFixtures.mockOrderDetailResponse };
      }

      // Order tracking
      if (lowerUrl.includes('track')) {
        return { data: orderFixtures.mockTrackOrderResponse };
      }

      // List orders
      return { data: orderFixtures.mockOrdersResponse };
    }

    if (upperMethod === 'POST') {
      if (lowerUrl.includes('cancel')) {
        return { data: orderFixtures.mockCancelOrderResponse };
      }
      return { data: orderFixtures.mockCreateOrderResponse };
    }

    if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
      return { data: orderFixtures.mockOrderDetailResponse };
    }
  }

  // ===================================
  // USER/PROFILE ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/user') || lowerUrl.includes('/profile')) {
    if (upperMethod === 'GET') {
      // Addresses
      if (lowerUrl.includes('address')) {
        return { data: userFixtures.mockAddressesResponse };
      }

      // Profile
      return { data: userFixtures.mockUserProfileResponse };
    }

    if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
      return { data: userFixtures.mockUpdateUserResponse };
    }

    if (upperMethod === 'POST') {
      if (lowerUrl.includes('address')) {
        return { data: userFixtures.mockCreateAddressResponse };
      }
    }

    if (upperMethod === 'DELETE') {
      if (lowerUrl.includes('address')) {
        return { data: userFixtures.mockDeleteAddressResponse };
      }
    }
  }

  // ===================================
  // AUTH ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/auth')) {
    if (upperMethod === 'POST') {
      if (lowerUrl.includes('login') || lowerUrl.includes('signin')) {
        return { data: authFixtures.mockLoginResponse };
      }

      if (lowerUrl.includes('register') || lowerUrl.includes('signup')) {
        return { data: authFixtures.mockRegisterResponse };
      }

      if (lowerUrl.includes('reset') || lowerUrl.includes('forgot')) {
        return { data: authFixtures.mockResetPasswordResponse };
      }

      if (lowerUrl.includes('refresh')) {
        return { data: authFixtures.mockRefreshTokenResponse };
      }

      if (lowerUrl.includes('social')) {
        return { data: authFixtures.mockSocialLoginResponse };
      }

      if (lowerUrl.includes('logout')) {
        return { data: authFixtures.mockLogoutResponse };
      }

      if (lowerUrl.includes('verify')) {
        return { data: authFixtures.mockVerifyEmailResponse };
      }

      if (lowerUrl.includes('change-password')) {
        return { data: authFixtures.mockChangePasswordResponse };
      }
    }
  }

  // ===================================
  // REVIEW ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/review')) {
    if (upperMethod === 'GET') {
      return { data: reviewFixtures.mockReviewsResponse };
    }

    if (upperMethod === 'POST') {
      if (lowerUrl.includes('helpful')) {
        return { data: reviewFixtures.mockMarkReviewHelpfulResponse };
      }

      if (lowerUrl.includes('report')) {
        return { data: reviewFixtures.mockReportReviewResponse };
      }

      return { data: reviewFixtures.mockCreateReviewResponse };
    }

    if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
      return { data: reviewFixtures.mockUpdateReviewResponse };
    }

    if (upperMethod === 'DELETE') {
      return { data: reviewFixtures.mockDeleteReviewResponse };
    }
  }

  // ===================================
  // PAYMENT ENDPOINTS
  // ===================================
  if (lowerUrl.includes('/payment')) {
    if (upperMethod === 'GET') {
      if (lowerUrl.includes('methods')) {
        return { data: paymentFixtures.mockPaymentMethodsResponse };
      }

      if (lowerUrl.includes('installments')) {
        return { data: paymentFixtures.mockInstallmentsOptionsResponse };
      }

      if (lowerUrl.includes('pix')) {
        return { data: paymentFixtures.mockCheckPixPaymentResponse };
      }
    }

    if (upperMethod === 'POST') {
      if (lowerUrl.includes('methods') || lowerUrl.includes('add-method')) {
        return { data: paymentFixtures.mockAddPaymentMethodResponse };
      }

      if (lowerUrl.includes('intent')) {
        return { data: paymentFixtures.mockCreatePaymentIntentResponse };
      }

      if (lowerUrl.includes('confirm')) {
        return { data: paymentFixtures.mockConfirmPaymentResponse };
      }

      if (lowerUrl.includes('pix')) {
        return { data: paymentFixtures.mockCreatePixPaymentResponse };
      }

      if (lowerUrl.includes('boleto')) {
        return { data: paymentFixtures.mockCreateBoletoPaymentResponse };
      }
    }

    if (upperMethod === 'DELETE') {
      return { data: paymentFixtures.mockDeletePaymentMethodResponse };
    }
  }

  // ===================================
  // DEFAULT RESPONSE
  // ===================================
  console.warn(`[mockApiClient] No mock defined for ${upperMethod} ${url}`);
  return {
    data: {},
    status: 200,
    statusText: 'OK',
  };
}

/**
 * Cria um mock do apiClient com detecção inteligente de endpoints
 */
export function createMockApiClient() {
  return {
    get: jest.fn((url: string, config?: any) => {
      const response = getMockResponseForUrl(url, 'GET');
      return Promise.resolve(response);
    }),

    post: jest.fn((url: string, body?: any, config?: any) => {
      const response = getMockResponseForUrl(url, 'POST', body);
      return Promise.resolve(response);
    }),

    put: jest.fn((url: string, body?: any, config?: any) => {
      const response = getMockResponseForUrl(url, 'PUT', body);
      return Promise.resolve(response);
    }),

    patch: jest.fn((url: string, body?: any, config?: any) => {
      const response = getMockResponseForUrl(url, 'PATCH', body);
      return Promise.resolve(response);
    }),

    delete: jest.fn((url: string, config?: any) => {
      const response = getMockResponseForUrl(url, 'DELETE');
      return Promise.resolve(response);
    }),

    request: jest.fn((config: any) => {
      const { url, method = 'GET', data } = config;
      const response = getMockResponseForUrl(url, method, data);
      return Promise.resolve(response);
    }),
  };
}

/**
 * Helper para resetar todos os mocks do apiClient
 * Útil em beforeEach() de testes
 */
export function resetApiClientMocks(apiClient: any) {
  apiClient.get.mockClear();
  apiClient.post.mockClear();
  apiClient.put.mockClear();
  apiClient.patch.mockClear();
  apiClient.delete.mockClear();
  apiClient.request?.mockClear();
}

/**
 * Helper para sobrescrever mock de um endpoint específico
 *
 * Exemplo:
 * overrideMockForEndpoint(apiClient, 'get', '/cart', { data: customCart })
 */
export function overrideMockForEndpoint(
  apiClient: any,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  urlPattern: string | RegExp,
  mockResponse: any
) {
  const originalImpl = apiClient[method].getMockImplementation();

  apiClient[method].mockImplementation((url: string, ...args: any[]) => {
    const matches =
      typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

    if (matches) {
      return Promise.resolve(mockResponse);
    }

    // Fallback para implementação original
    return originalImpl ? originalImpl(url, ...args) : Promise.resolve({ data: {} });
  });
}

/**
 * Helper para simular erro de API
 *
 * Exemplo:
 * mockApiError(apiClient, 'get', '/cart', 500, 'Internal Server Error')
 */
export function mockApiError(
  apiClient: any,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  urlPattern: string | RegExp,
  status: number = 500,
  message: string = 'API Error'
) {
  const originalImpl = apiClient[method].getMockImplementation();

  apiClient[method].mockImplementation((url: string, ...args: any[]) => {
    const matches =
      typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);

    if (matches) {
      return Promise.reject({
        response: {
          status,
          statusText: message,
          data: {
            error: message,
            message,
          },
        },
      });
    }

    // Fallback para implementação original
    return originalImpl ? originalImpl(url, ...args) : Promise.resolve({ data: {} });
  });
}
