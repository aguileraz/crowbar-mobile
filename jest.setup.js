/**
 * Jest setup file
 * Global mocks and configurations for testing
 */

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      View: 'View',
      Text: 'Text',
      Image: 'Image',
      ScrollView: 'ScrollView',
      createAnimatedComponent: (component) => component,
      Value: () => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        interpolate: jest.fn(),
      }),
      timing: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      decay: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      event: jest.fn(),
      call: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      eq: jest.fn(),
      neq: jest.fn(),
      add: jest.fn(),
      sub: jest.fn(),
      multiply: jest.fn(),
      divide: jest.fn(),
      pow: jest.fn(),
      modulo: jest.fn(),
      sqrt: jest.fn(),
      log: jest.fn(),
      sin: jest.fn(),
      cos: jest.fn(),
      tan: jest.fn(),
      acos: jest.fn(),
      asin: jest.fn(),
      atan: jest.fn(),
      and: jest.fn(),
      or: jest.fn(),
      not: jest.fn(),
      defined: jest.fn(),
      lessThan: jest.fn(),
      greaterThan: jest.fn(),
      lessOrEq: jest.fn(),
      greaterOrEq: jest.fn(),
      abs: jest.fn(),
      min: jest.fn(),
      max: jest.fn(),
      round: jest.fn(),
      floor: jest.fn(),
      ceil: jest.fn(),
      concat: jest.fn(),
      proc: jest.fn(),
      block: jest.fn(),
      startClock: jest.fn(),
      stopClock: jest.fn(),
      clockRunning: jest.fn(),
      debug: jest.fn(),
      onChange: jest.fn(),
      color: jest.fn(),
      diff: jest.fn(),
      diffClamp: jest.fn(),
      interpolateColor: jest.fn(),
      interpolateColors: jest.fn(),
      Extrapolate: {
        EXTEND: 'extend',
        CLAMP: 'clamp',
        IDENTITY: 'identity',
      },
      Easing: {
        linear: jest.fn(),
        ease: jest.fn(),
        quad: jest.fn(),
        cubic: jest.fn(),
        poly: jest.fn(),
        sin: jest.fn(),
        circle: jest.fn(),
        exp: jest.fn(),
        elastic: jest.fn(),
        back: jest.fn(),
        bounce: jest.fn(),
        bezier: jest.fn(),
        in: jest.fn(),
        out: jest.fn(),
        inOut: jest.fn(),
      },
    },
  };
});

// Mock react-native Platform and other core modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      Version: '14.0',
      constants: {},
      select: jest.fn(config => {
        if (!config) return undefined;
        return config.ios || config.default || config.native || Object.values(config)[0];
      }),
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn(size => size * 2),
      roundToNearestPixel: jest.fn(size => size),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [],
    initializeApp: jest.fn(),
    app: jest.fn(() => ({
      name: 'default',
      options: {},
    })),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        onSnapshot: jest.fn(),
      })),
      add: jest.fn(),
      get: jest.fn(),
      where: jest.fn(() => ({
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        get: jest.fn(),
      })),
      orderBy: jest.fn(() => ({
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        get: jest.fn(),
      })),
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
      onSnapshot: jest.fn(),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
  })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(),
    onTokenRefresh: jest.fn(),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperty: jest.fn(),
    setCurrentScreen: jest.fn(),
  })),
}));


// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
        ssid: 'Test Network',
        bssid: '00:00:00:00:00:00',
        strength: 100,
        ipAddress: '192.168.1.1',
        subnet: '255.255.255.0',
        frequency: 2437,
      },
    })),
    addEventListener: jest.fn(() => jest.fn()),
    useNetInfo: jest.fn(() => ({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: null,
    })),
  },
}));

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: {
        CacheDir: '/cache',
        DocumentDir: '/documents',
        DownloadDir: '/downloads',
      },
      exists: jest.fn(() => Promise.resolve(true)),
      mkdir: jest.fn(() => Promise.resolve()),
      unlink: jest.fn(() => Promise.resolve()),
      ls: jest.fn(() => Promise.resolve([])),
      stat: jest.fn(() => Promise.resolve({
        size: '1024',
        lastModified: '1640995200000',
      })),
    },
    config: jest.fn(() => ({
      fetch: jest.fn(() => Promise.resolve({
        path: jest.fn(() => '/cache/image.jpg'),
      })),
    })),
  },
}));

// Mock lz-string
jest.mock('lz-string', () => ({
  __esModule: true,
  default: {
    compressToUTF16: jest.fn((str) => `compressed_${str}`),
    decompressFromUTF16: jest.fn((compressed) => 
      compressed.startsWith('compressed_') ? compressed.slice(11) : compressed
    ),
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-native-config
jest.mock('react-native-config', () => ({
  NODE_ENV: 'test',
  API_BASE_URL: 'https://test-api.crowbar.com/api/v1',
  SOCKET_URL: 'https://test-api.crowbar.com',
  API_TIMEOUT: '10000',
  FIREBASE_PROJECT_ID: 'crowbar-test',
  FIREBASE_APP_ID: 'test-app-id',
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'crowbar-test.firebaseapp.com',
  FIREBASE_STORAGE_BUCKET: 'crowbar-test.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  APP_VERSION: '1.0.0-test',
  DEBUG_MODE: 'true',
  ANALYTICS_ENABLED: 'false',
  FLIPPER_ENABLED: 'false',
  DEV_MENU_ENABLED: 'false',
  LOG_LEVEL: 'debug',
}));

// Mock @notifee/react-native
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    displayNotification: jest.fn(),
    createChannel: jest.fn(),
    requestPermission: jest.fn(),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
    getNotificationSettings: jest.fn(),
    setBadgeCount: jest.fn(),
    getBadgeCount: jest.fn(),
    onBackgroundEvent: jest.fn(),
    onForegroundEvent: jest.fn(),
  },
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MIN: 1,
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 2,
    NOT_DETERMINED: 0,
  },
  EventType: {
    DELIVERED: 1,
    PRESS: 2,
    DISMISSED: 3,
  },
}));

// Mock global DEV
global.__DEV__ = true;