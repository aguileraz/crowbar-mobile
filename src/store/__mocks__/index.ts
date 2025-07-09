export const store = {
  dispatch: jest.fn(),
  getState: jest.fn(() => ({
    auth: { isAuthenticated: false, user: null },
    boxes: { boxes: [], loading: false },
    cart: { items: [], total: 0 },
    offline: { isOnline: true },
  })),
  subscribe: jest.fn(),
  replaceReducer: jest.fn(),
};