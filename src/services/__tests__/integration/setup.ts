/* eslint-disable no-console */
import logger from '../../loggerService';

import 'react-native-testing-library/extend-expect';
import 'jest-extended';

/**
 * Configuração global para testes de integração
 * Configura mocks, globals e utilitários necessários
 */

// Mock para AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock para React Native Config
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

// Mock para Firebase Auth
jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn(),
  })),
}));

// Mock para Firebase Firestore
jest.mock('@react-native-firebase/firestore', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
  })),
}));

// Mock para React Native Paper
jest.mock('react-native-paper', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  DefaultTheme: {},
  configureFonts: jest.fn(),
}));

// Mock para React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock para Axios Mock Adapter
jest.mock('axios-mock-adapter');

// Mock para FormData
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  forEach: jest.fn(),
})) as any;

// Mock para Blob
global.Blob = jest.fn((content, options) => ({
  content,
  options,
  size: content ? content.length : 0,
  type: options?.type || '',
})) as any;

// Mock para URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-blob');
global.URL.revokeObjectURL = jest.fn();

// Mock para XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  response: '',
})) as any;

// Mock para fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as any;

// Mock para WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
})) as any;

// Mock para setTimeout e clearTimeout
global.setTimeout = jest.fn((callback) => {
  callback();
  return 1;
}) as any;

global.clearTimeout = jest.fn();

// Mock para setInterval e clearInterval
global.setInterval = jest.fn((callback) => {
  callback();
  return 1;
}) as any;

global.clearInterval = jest.fn();

// Mock para console em produção
if (process.env.NODE_ENV === 'production') {
  global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  } as any;
}

// Configuração global do Jest
beforeEach(() => {
  // Limpar todos os mocks antes de cada teste
  jest.clearAllMocks();
  
  // Resetar fetch mock
  (global.fetch as jest.Mock).mockClear();
  
  // Resetar timers
  jest.clearAllTimers();
  
  // Configurar timezone para testes consistentes
  process.env.TZ = 'UTC';
});

afterEach(() => {
  // Limpar todos os mocks após cada teste
  jest.clearAllMocks();
  
  // Restaurar timers reais
  jest.useRealTimers();
});

// Configuração para testes de timeout
jest.setTimeout(30000);

// Configuração para suprimir warnings específicos
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suprimir warnings especificos conhecidos
  if (
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('componentWillUpdate') ||
    args[0]?.includes?.('componentWillMount')
  ) {
    return;
  }
  originalWarn(...args);
};

// Configuracao para capturar erros nao tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuração para React Native específica
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((platform) => platform.ios || platform.default),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  DeviceInfo: {
    getDeviceId: jest.fn(() => 'test-device-id'),
    getVersion: jest.fn(() => '1.0.0'),
  },
  NetInfo: {
    isConnected: {
      fetch: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  StatusBar: {
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
  },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  Image: 'Image',
  TextInput: 'TextInput',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  ActivityIndicator: 'ActivityIndicator',
  Switch: 'Switch',
  Slider: 'Slider',
  RefreshControl: 'RefreshControl',
  Modal: 'Modal',
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((styles) => styles),
  },
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(),
    })),
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
    sequence: jest.fn(),
    parallel: jest.fn(),
    stagger: jest.fn(),
    loop: jest.fn(),
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
    FlatList: 'Animated.FlatList',
    SectionList: 'Animated.SectionList',
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
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((_size) => size * 2),
    roundToNearestPixel: jest.fn((_size) => size),
  },
}));

// Configuração para suportar ES6 modules
require('babel-polyfill');

// Configuração para timezone UTC
process.env.TZ = 'UTC';

// Configuração para variáveis de ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

logger.debug('🧪 Setup de testes de integração carregado com sucesso!');