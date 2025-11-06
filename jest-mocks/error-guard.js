// Mock for @react-native/js-polyfills/error-guard to avoid Flow Type parsing
module.exports = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(() => undefined),
};
