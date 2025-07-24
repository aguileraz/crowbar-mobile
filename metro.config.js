const { getDefaultConfig: _getDefaultConfig, mergeConfig: _mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration otimizada para performance
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const _config = {
  transformer: {
    minifierConfig: {
      // Otimizações do minificador para produção
      keep_fnames: false,
      mangle: {
        keep_fnames: false,
      },
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
      },
    },
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Melhora performance de inicialização
      },
    }),
  },
  resolver: {
    // Otimiza resolução de módulos
    nodeModulesPaths: [],
  },
  // Cache configuration para builds mais rápidos
  cacheStores: ({ FileStore }) => [
    new FileStore({
      root: '.metro-cache',
    }),
  ],
  // Configurações para melhor performance
  maxWorkers: 4,
  resetCache: false,
};
