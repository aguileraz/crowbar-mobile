import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  Icon,
} from 'react-native-paper';
import { theme, getSpacing, getBorderRadius } from '../theme';

/**
 * Componente para exibir mensagens de erro
 * Com opção de retry e diferentes variantes visuais
 */

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: 'default' | 'minimal' | 'card';
  style?: ViewStyle;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Ops! Algo deu errado',
  onRetry,
  retryText = 'Tentar novamente',
  variant = 'default',
  style,
  showIcon = true,
}) => {
  /**
   * Renderizar ícone de erro
   */
  const renderIcon = () => {
    if (!showIcon) return null;

    return (
      <View style={styles.iconContainer}>
        <Icon
          source="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
      </View>
    );
  };

  /**
   * Renderizar conteúdo baseado na variante
   */
  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <View style={[styles.minimalContainer, style]} testID="error-message-minimal">
            <Text style={styles.minimalMessage} testID="error-text">{message}</Text>
            {onRetry && (
              <Button
                mode="text"
                onPress={onRetry}
                style={styles.minimalButton}
                compact
                testID="error-retry-button"
              >
                {retryText}
              </Button>
            )}
          </View>
        );

      case 'card':
        return (
          <Card style={[styles.card, style]} elevation={2} testID="error-message-card">
            <Card.Content style={styles.cardContent}>
              {renderIcon()}
              <Title style={styles.cardTitle} testID="error-title">{title}</Title>
              <Paragraph style={styles.cardMessage} testID="error-text">{message}</Paragraph>
              {onRetry && (
                <Button
                  mode="contained"
                  onPress={onRetry}
                  style={styles.cardButton}
                  icon="refresh"
                  testID="error-retry-button"
                >
                  {retryText}
                </Button>
              )}
            </Card.Content>
          </Card>
        );

      default:
        return (
          <View style={[styles.defaultContainer, style]} testID="error-message-default">
            {renderIcon()}
            <Title style={styles.defaultTitle} testID="error-title">{title}</Title>
            <Paragraph style={styles.defaultMessage} testID="error-text">{message}</Paragraph>
            {onRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                style={styles.defaultButton}
                icon="refresh"
                testID="error-retry-button"
              >
                {retryText}
              </Button>
            )}
          </View>
        );
    }
  };

  return renderContent();
};

const styles = StyleSheet.create({
  // Variante padrão
  defaultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
    backgroundColor: theme.colors.background,
  },
  defaultTitle: {
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
    color: theme.colors.onSurface,
  },
  defaultMessage: {
    textAlign: 'center',
    marginBottom: getSpacing('lg'),
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  defaultButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },

  // Variante minimal
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.errorContainer,
    borderRadius: getBorderRadius('md'),
    marginHorizontal: getSpacing('md'),
  },
  minimalMessage: {
    flex: 1,
    color: theme.colors.onErrorContainer,
    fontSize: 14,
    marginRight: getSpacing('md'),
  },
  minimalButton: {
    marginLeft: getSpacing('sm'),
  },

  // Variante card
  card: {
    margin: getSpacing('lg'),
    borderRadius: getBorderRadius('lg'),
  },
  cardContent: {
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
    color: theme.colors.onSurface,
  },
  cardMessage: {
    textAlign: 'center',
    marginBottom: getSpacing('lg'),
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  cardButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },

  // Ícone
  iconContainer: {
    marginBottom: getSpacing('lg'),
  },
});

export default ErrorMessage;