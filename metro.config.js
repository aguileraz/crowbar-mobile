const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration otimizada para performance
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
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
    // Resolver para corrigir o problema dos vector icons
    resolveRequest: (context, moduleName, platform) => {
      // Redirecionar @react-native-vector-icons para react-native-vector-icons
      if (moduleName.startsWith('@react-native-vector-icons/')) {
        const iconSet = moduleName.replace('@react-native-vector-icons/', '');
        // material-design-icons -> MaterialCommunityIcons
        const mappedIconSet = iconSet === 'material-design-icons' ? 'MaterialCommunityIcons' : iconSet;
        return {
          filePath: require.resolve(`react-native-vector-icons/${mappedIconSet}`),
          type: 'sourceFile',
        };
      }
      
      // Redirecionar @expo/vector-icons para react-native-vector-icons
      if (moduleName.startsWith('@expo/vector-icons/')) {
        const iconSet = moduleName.replace('@expo/vector-icons/', '');
        return {
          filePath: require.resolve(`react-native-vector-icons/${iconSet}`),
          type: 'sourceFile',
        };
      }
      
      // Caso especial para MaterialCommunityIcons
      if (moduleName === '@expo/vector-icons') {
        return {
          filePath: require.resolve('react-native-vector-icons/MaterialCommunityIcons'),
          type: 'sourceFile',
        };
      }
      
      // Default resolver
      return context.resolveRequest(context, moduleName, platform);
    },
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
