import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/**
 * Tema customizado para Crowbar Mobile
 * Baseado no Material Design 3 com cores personalizadas
 */

// Paleta de cores personalizada
const colors = {
  // Cores primárias (roxo/violeta para o Crowbar)
  primary: '#6200EE',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',

  // Cores secundárias (laranja/dourado para caixas misteriosas)
  secondary: '#FF6F00',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFE0B2',
  onSecondaryContainer: '#E65100',

  // Cores terciárias (verde para sucesso)
  tertiary: '#4CAF50',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C8E6C9',
  onTertiaryContainer: '#1B5E20',

  // Cores de erro
  error: '#F44336',
  onError: '#FFFFFF',
  errorContainer: '#FFEBEE',
  onErrorContainer: '#C62828',

  // Cores de fundo
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',

  // Cores de outline
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // Cores de sombra
  shadow: '#000000',
  scrim: '#000000',

  // Cores inversas
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',

  // Cores específicas do app
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Cores para caixas misteriosas
  mysteryBox: '#9C27B0',
  mysteryBoxLight: '#E1BEE7',
  mysteryBoxDark: '#6A1B9A',
  
  // Cores para status
  online: '#4CAF50',
  offline: '#9E9E9E',
  pending: '#FF9800',
};

// Configuração de fontes simplificada (usando padrões do React Native Paper)
// const _fontConfig = {
//   default: {
//     fontFamily: 'System',
//   },
// };

// Tema principal
export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  // Usar fontes padrão do React Native Paper
  fonts: MD3LightTheme.fonts,
};

// Tema escuro (para implementação futura)
export const darkTheme: MD3Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    // Cores específicas para tema escuro
    background: '#121212',
    surface: '#121212',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
};

// Estilos comuns reutilizáveis
export const commonStyles = {
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Padding e margin padrões
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
  },
  
  // Elevações (sombras)
  elevation: {
    low: 2,
    medium: 4,
    high: 8,
  },
  
  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Utilitários de tema
export const getThemeColor = (colorName: keyof typeof colors) => colors[colorName];

export const getSpacing = (size: keyof typeof commonStyles.padding) => 
  commonStyles.padding[size];

export const getBorderRadius = (size: keyof typeof commonStyles.borderRadius) => 
  commonStyles.borderRadius[size];

export default theme;
