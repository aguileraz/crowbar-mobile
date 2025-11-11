/**
 * Mock Completo para react-native-keychain
 *
 * Este mock simula o armazenamento seguro de credenciais
 * para testes unitários.
 */

// Mock storage
let mockStorage: { [key: string]: { username: string; password: string } } = {};

// Mock implementation
export const ACCESSIBLE = {
  WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
  AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
  ALWAYS: 'AccessibleAlways',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
  ALWAYS_THIS_DEVICE_ONLY: 'AccessibleAlwaysThisDeviceOnly',
};

export const ACCESS_CONTROL = {
  USER_PRESENCE: 'UserPresence',
  BIOMETRY_ANY: 'BiometryAny',
  BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
  DEVICE_PASSCODE: 'DevicePasscode',
  APPLICATION_PASSWORD: 'ApplicationPassword',
  BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
  BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
};

export const AUTHENTICATION_TYPE = {
  DEVICE_PASSCODE_OR_BIOMETRICS: 'AuthenticationWithBiometricsDevicePasscode',
  BIOMETRICS: 'AuthenticationWithBiometrics',
};

export const BIOMETRY_TYPE = {
  TOUCH_ID: 'TouchID',
  FACE_ID: 'FaceID',
  FINGERPRINT: 'Fingerprint',
  FACE: 'Face',
  IRIS: 'Iris',
};

export interface Options {
  accessControl?: string;
  accessible?: string;
  authenticationPrompt?: {
    title?: string;
    subtitle?: string;
    description?: string;
    cancel?: string;
  };
  authenticationType?: string;
  service?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
  service?: string;
}

/**
 * Set generic password
 */
export const setGenericPassword = jest.fn(
  async (
    username: string,
    password: string,
    options?: Options
  ): Promise<false | { service: string; storage: string }> => {
    const service = options?.service || 'default';
    mockStorage[service] = { username, password };
    return {
      service,
      storage: 'KeychainStorage',
    };
  }
);

/**
 * Get generic password
 */
export const getGenericPassword = jest.fn(
  async (options?: Options): Promise<false | UserCredentials> => {
    const service = options?.service || 'default';
    const stored = mockStorage[service];

    if (!stored) {
      return false;
    }

    return {
      username: stored.username,
      password: stored.password,
      service,
    };
  }
);

/**
 * Reset generic password
 */
export const resetGenericPassword = jest.fn(
  async (options?: Options): Promise<boolean> => {
    const service = options?.service || 'default';
    if (mockStorage[service]) {
      delete mockStorage[service];
      return true;
    }
    return false;
  }
);

/**
 * Has internet credentials
 */
export const hasInternetCredentials = jest.fn(
  async (_server: string): Promise<boolean> => {
    return Object.keys(mockStorage).length > 0;
  }
);

/**
 * Set internet credentials
 */
export const setInternetCredentials = jest.fn(
  async (
    server: string,
    username: string,
    password: string,
    _options?: Options
  ): Promise<false | { service: string }> => {
    mockStorage[server] = { username, password };
    return { service: server };
  }
);

/**
 * Get internet credentials
 */
export const getInternetCredentials = jest.fn(
  async (server: string): Promise<false | UserCredentials> => {
    const stored = mockStorage[server];

    if (!stored) {
      return false;
    }

    return {
      username: stored.username,
      password: stored.password,
      service: server,
    };
  }
);

/**
 * Reset internet credentials
 */
export const resetInternetCredentials = jest.fn(
  async (server: string): Promise<void> => {
    delete mockStorage[server];
  }
);

/**
 * Get supported biometry type
 */
export const getSupportedBiometryType = jest.fn(
  async (): Promise<string | null> => {
    return BIOMETRY_TYPE.TOUCH_ID;
  }
);

/**
 * Get security level
 */
export const getSecurityLevel = jest.fn(
  async (): Promise<string | null> => {
    return 'SECURE_HARDWARE';
  }
);

/**
 * Clear mock storage (for testing)
 */
export const __clearMockStorage = (): void => {
  mockStorage = {};
};

/**
 * Get mock storage (for testing)
 */
export const __getMockStorage = (): typeof mockStorage => {
  return mockStorage;
};

export default {
  ACCESSIBLE,
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
  BIOMETRY_TYPE,
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  hasInternetCredentials,
  setInternetCredentials,
  getInternetCredentials,
  resetInternetCredentials,
  getSupportedBiometryType,
  getSecurityLevel,
  __clearMockStorage,
  __getMockStorage,
};
