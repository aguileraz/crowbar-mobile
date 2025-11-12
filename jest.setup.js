/**
 * Jest setup file
 * Global mocks and configurations for testing
 */

// ===================================
// API CLIENT MOCKS
// ===================================

// Mock API Client com detecção inteligente de endpoints
// Substitui MSW devido a problemas de ESM com Jest/Babel
// Usa fixtures e helper para retornar dados realistas baseados na URL
const { createMockApiClient } = require('./src/test/helpers/mockApiClient');

const mockApiClient = createMockApiClient();

// Adiciona métodos extras não relacionados a HTTP
mockApiClient.upload = jest.fn().mockResolvedValue({ data: {} });
mockApiClient.setAuthToken = jest.fn();
mockApiClient.getAuthToken = jest.fn(() => null);
mockApiClient.clearAuthToken = jest.fn();

jest.mock('./src/services/api', () => ({
  apiClient: mockApiClient,
}));

// Mock HTTP Client (usado por serviços legados)
// IMPORTANT: All HTTP methods must return { data: ... } to match real axios behavior
jest.mock('./src/services/httpClient', () => ({
  httpClient: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    setAuthToken: jest.fn(),
  },
}));

// ===================================
// REACT NATIVE MOCKS
// ===================================

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
        linear: jest.fn((t) => t),
        ease: jest.fn((t) => t),
        quad: jest.fn((t) => t * t),
        cubic: jest.fn((t) => t * t * t),
        poly: jest.fn((n) => (t) => Math.pow(t, n)),
        sin: jest.fn((t) => 1 - Math.cos((t * Math.PI) / 2)),
        circle: jest.fn((t) => 1 - Math.sqrt(1 - t * t)),
        exp: jest.fn((t) => Math.pow(2, 10 * (t - 1))),
        elastic: jest.fn((bounciness) => (t) => t),
        back: jest.fn((s) => (t) => t),
        bounce: jest.fn((t) => t),
        bezier: jest.fn((x1, y1, x2, y2) => (t) => t),
        in: jest.fn((easing) => (t) => easing(t)),
        out: jest.fn((easing) => (t) => 1 - easing(1 - t)),
        inOut: jest.fn((easing) => (t) => t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2),
      },
    },
  };
});

// Mock I18nManager
jest.mock('react-native/Libraries/ReactNative/I18nManager', () => ({
  getConstants: jest.fn(() => ({
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
    localeIdentifier: 'pt_BR',
  })),
  allowRTL: jest.fn(),
  forceRTL: jest.fn(),
  swapLeftAndRightInRTL: jest.fn(),
  isRTL: false,
}));

// Mock NativeModules antes de tudo
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  DevSettings: {
    addMenuItem: jest.fn(),
    reload: jest.fn(),
  },
  DeviceInfo: {
    getConstants: () => ({
      Dimensions: {
        window: { width: 375, height: 812, scale: 2, fontScale: 1 },
        screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
      },
    }),
  },
  PlatformConstants: {
    getConstants: () => ({
      isTesting: true,
      reactNativeVersion: { major: 0, minor: 80, patch: 1 },
    }),
  },
  StatusBarManager: {
    getHeight: jest.fn(() => 20),
    setHidden: jest.fn(),
    setStyle: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
  },
  UIManager: {
    getViewManagerConfig: jest.fn(() => ({ Commands: {} })),
    getConstants: () => ({}),
    createView: jest.fn(),
    updateView: jest.fn(),
    manageChildren: jest.fn(),
    measure: jest.fn(),
    measureInWindow: jest.fn(),
    measureLayout: jest.fn(),
    setChildren: jest.fn(),
  },
  Networking: {
    sendRequest: jest.fn(),
    abortRequest: jest.fn(),
    clearCookies: jest.fn(),
  },
  Clipboard: {
    getString: jest.fn(() => Promise.resolve('')),
    setString: jest.fn(),
  },
  AlertManager: {
    alertWithArgs: jest.fn(),
  },
}));

// Mock TurboModuleRegistry para evitar erros
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn((name) => {
    const mocks = {
      DevSettings: {
        addMenuItem: jest.fn(),
        reload: jest.fn(),
      },
      DevMenu: {
        show: jest.fn(),
        dismiss: jest.fn(),
      },
      PlatformConstants: {
        getConstants: () => ({
          isTesting: true,
          reactNativeVersion: { major: 0, minor: 80, patch: 1 },
        }),
      },
      DeviceInfo: {
        getConstants: () => ({
          Dimensions: {
            window: { width: 375, height: 812, scale: 2, fontScale: 1 },
            screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
          },
        }),
      },
    };
    return mocks[name] || {};
  }),
  get: jest.fn((name) => {
    const mocks = {
      ReactNativeFeatureFlags: null,
      PlatformConstants: {
        getConstants: () => ({
          isTesting: true,
          reactNativeVersion: { major: 0, minor: 80, patch: 1 },
        }),
      },
    };
    return mocks[name] || null;
  }),
}));

// Mock react-native Platform and other core modules
jest.mock('react-native', () => {
  const React = require('react');

  return {
    // View components
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SectionList: 'SectionList',
    Image: 'Image',
    TouchableOpacity: 'TouchableOpacity',
    TouchableHighlight: 'TouchableHighlight',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    ActivityIndicator: 'ActivityIndicator',
    Button: 'Button',
    Switch: 'Switch',
    Modal: 'Modal',
    RefreshControl: 'RefreshControl',
    Pressable: 'Pressable',

    // Platform
    Platform: {
      OS: 'ios',
      Version: '14.0',
      constants: {},
      select: jest.fn(config => {
        if (!config) return undefined;
        return config.ios || config.default || config.native || Object.values(config)[0];
      }),
    },

    // Dimensions
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },

    // PixelRatio
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn(size => size * 2),
      roundToNearestPixel: jest.fn(size => size),
    },

    // StyleSheet
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
      compose: (a, b) => [a, b],
      hairlineWidth: 1,
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    },

    // Alert
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },

    // Keyboard
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      dismiss: jest.fn(),
    },

    // AppState
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },

    // Linking
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },

    // Animated
    Animated: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      Image: 'Animated.Image',
      ScrollView: 'Animated.ScrollView',
      FlatList: 'Animated.FlatList',
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        interpolate: jest.fn(() => ({ setValue: jest.fn() })),
      })),
      ValueXY: jest.fn(() => ({
        setValue: jest.fn(),
        x: { setValue: jest.fn() },
        y: { setValue: jest.fn() },
      })),
      timing: jest.fn(() => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      decay: jest.fn(() => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      parallel: jest.fn((animations) => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
      })),
      sequence: jest.fn((animations) => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
      })),
      stagger: jest.fn((time, animations) => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
      })),
      loop: jest.fn((animation) => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
      })),
      event: jest.fn(),
      createAnimatedComponent: (Component) => Component,
      add: jest.fn(),
      subtract: jest.fn(),
      multiply: jest.fn(),
      divide: jest.fn(),
      modulo: jest.fn(),
      diffClamp: jest.fn(),
    },

    // Easing
    Easing: {
      linear: jest.fn((t) => t),
      ease: jest.fn((t) => t),
      quad: jest.fn((t) => t * t),
      cubic: jest.fn((t) => t * t * t),
      poly: jest.fn((n) => (t) => Math.pow(t, n)),
      sin: jest.fn((t) => 1 - Math.cos((t * Math.PI) / 2)),
      circle: jest.fn((t) => 1 - Math.sqrt(1 - t * t)),
      exp: jest.fn((t) => Math.pow(2, 10 * (t - 1))),
      elastic: jest.fn((bounciness) => (t) => t),
      back: jest.fn((s) => (t) => t),
      bounce: jest.fn((t) => t),
      bezier: jest.fn((x1, y1, x2, y2) => (t) => t),
      in: jest.fn((easing) => (t) => easing(t)),
      out: jest.fn((easing) => (t) => 1 - easing(1 - t)),
      inOut: jest.fn((easing) => (t) => t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2),
    },

    // NativeModules
    NativeModules: {
      DevSettings: {
        addMenuItem: jest.fn(),
        reload: jest.fn(),
      },
      PlatformConstants: {
        getConstants: () => ({
          isTesting: true,
          reactNativeVersion: { major: 0, minor: 80, patch: 1 },
        }),
      },
      UIManager: {
        getViewManagerConfig: jest.fn(() => ({ Commands: {} })),
      },
    },

    // NativeEventEmitter
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),

    // DeviceEventEmitter
    DeviceEventEmitter: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    },

    // I18nManager
    I18nManager: {
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      swapLeftAndRightInRTL: jest.fn(),
      getConstants: jest.fn(() => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
        localeIdentifier: 'pt_BR',
      })),
    },

    // BackHandler
    BackHandler: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },

    // PermissionsAndroid
    PermissionsAndroid: {
      check: jest.fn(() => Promise.resolve(true)),
      request: jest.fn(() => Promise.resolve('granted')),
      PERMISSIONS: {},
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },

    // Share
    Share: {
      share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
    },

    // Vibration
    Vibration: {
      vibrate: jest.fn(),
      cancel: jest.fn(),
    },

    // LogBox
    LogBox: {
      ignoreLogs: jest.fn(),
      ignoreAllLogs: jest.fn(),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
      key: 'test-route',
      name: 'Test',
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    useIsFocused: () => true,
    NavigationContainer: ({ children }) => children,
    createNavigationContainerRef: () => ({
      current: null,
    }),
  };
});

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

// Mock Firebase (commented out - migrating to Keycloak)
// Firebase packages removed during Keycloak migration
// jest.mock('@react-native-firebase/app', () => ({
//   __esModule: true,
//   default: {
//     apps: [],
//     initializeApp: jest.fn(),
//     app: jest.fn(() => ({
//       name: 'default',
//       options: {},
//     })),
//   },
// }));
// 
// jest.mock('@react-native-firebase/auth', () => ({
//   __esModule: true,
//   default: jest.fn(() => ({
//     currentUser: null,
//     signInWithEmailAndPassword: jest.fn(),
//     createUserWithEmailAndPassword: jest.fn(),
//     signOut: jest.fn(),
//     onAuthStateChanged: jest.fn(),
//     sendPasswordResetEmail: jest.fn(),
//   })),
// }));
// 
// jest.mock('@react-native-firebase/firestore', () => ({
//   __esModule: true,
//   default: jest.fn(() => ({
//     collection: jest.fn(() => ({
//       doc: jest.fn(() => ({
//         set: jest.fn(),
//         get: jest.fn(),
//         update: jest.fn(),
//         delete: jest.fn(),
//         onSnapshot: jest.fn(),
//       })),
//       add: jest.fn(),
//       get: jest.fn(),
//       where: jest.fn(() => ({
//         where: jest.fn(),
//         orderBy: jest.fn(),
//         limit: jest.fn(),
//         get: jest.fn(),
//       })),
//       orderBy: jest.fn(() => ({
//         where: jest.fn(),
//         orderBy: jest.fn(),
//         limit: jest.fn(),
//         get: jest.fn(),
//       })),
//       limit: jest.fn(() => ({
//         get: jest.fn(),
//       })),
//       onSnapshot: jest.fn(),
//     })),
//     batch: jest.fn(() => ({
//       set: jest.fn(),
//       update: jest.fn(),
//       delete: jest.fn(),
//       commit: jest.fn(),
//     })),
//   })),
// }));
// 
// jest.mock('@react-native-firebase/messaging', () => ({
//   __esModule: true,
//   default: jest.fn(() => ({
//     requestPermission: jest.fn(),
//     getToken: jest.fn(),
//     onMessage: jest.fn(),
//     onNotificationOpenedApp: jest.fn(),
//     getInitialNotification: jest.fn(),
//     onTokenRefresh: jest.fn(),
//     subscribeToTopic: jest.fn(),
//     unsubscribeFromTopic: jest.fn(),
//   })),
// }));
// 
// jest.mock('@react-native-firebase/analytics', () => ({
//   __esModule: true,
//   default: jest.fn(() => ({
//     logEvent: jest.fn(),
//     setUserId: jest.fn(),
//     setUserProperty: jest.fn(),
//     setCurrentScreen: jest.fn(),
//   })),
// }));


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

// ===================================
// Enhanced API Mocks for Integration Tests
// ===================================

// Mock API Client Strategy:
// - Fixtures: src/test/fixtures/ contém dados mock reutilizáveis
// - Helper: src/test/helpers/mockApiClient.ts detecta endpoints e retorna fixtures apropriados
// - Override: Testes podem sobrescrever mocks usando overrideMockForEndpoint() ou mockApiError()
//
// Razão: MSW 2.x tem dependências ESM profundas (until-async, strict-event-emitter, @bundled-es-modules)
// que causam erros de transformação no Jest/Babel mesmo quando adicionados ao transformIgnorePatterns.
//
// Uso em testes:
//   import { overrideMockForEndpoint, mockApiError } from '@/test/helpers';
//   import { apiClient } from '@/services/api';
//
//   // Override para cenário específico
//   overrideMockForEndpoint(apiClient, 'get', '/cart', { data: customCart });
//
//   // Simular erro
//   mockApiError(apiClient, 'get', '/cart', 500, 'Server Error');