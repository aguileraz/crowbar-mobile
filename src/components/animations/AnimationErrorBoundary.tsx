/**
 * Error Boundary para componentes de animação
 * Captura erros e fornece fallback gracioso
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class AnimationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza state para mostrar fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log erro para serviço de analytics
    // console.error('Animation Error Boundary caught:', error, errorInfo);
    
    // Callback customizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualiza state com informações do erro
    this.setState({
      errorInfo,
    });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  renderErrorFallback = () => {
    const { fallback, showErrorDetails } = this.props;
    const { error, retryCount, errorInfo } = this.state;

    // Se tem fallback customizado, usar
    if (fallback) {
      return fallback;
    }

    // Fallback padrão
    return (
      <Card style={styles.errorCard}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons 
            name="animation-play-outline" 
            size={48} 
            color="#666"
            style={styles.errorIcon}
          />
          
          <Text style={styles.errorTitle}>
            Ops! Animação não disponível
          </Text>
          
          <Text style={styles.errorMessage}>
            A animação não pôde ser carregada no momento.
          </Text>

          {showErrorDetails && error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorDetailsText}>
                {error.toString()}
              </Text>
              {errorInfo && (
                <Text style={[styles.errorDetailsText, { marginTop: 8, fontSize: 10 }]}>
                  {errorInfo.componentStack}
                </Text>
              )}
            </View>
          )}

          {retryCount < 3 && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="refresh" 
                size={20} 
                color="#fff"
                style={styles.retryIcon}
              />
              <Text style={styles.retryText}>
                Tentar Novamente
              </Text>
            </TouchableOpacity>
          )}

          {retryCount >= 3 && (
            <Text style={styles.maxRetriesText}>
              Número máximo de tentativas excedido
            </Text>
          )}
        </View>
      </Card>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    elevation: 2,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  errorDetails: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    maxWidth: '90%',
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#e74c3c',
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  maxRetriesText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

/**
 * HOC para adicionar error boundary a componentes de animação
 */
export function withAnimationErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return (props: P) => (
    <AnimationErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </AnimationErrorBoundary>
  );
}

export default AnimationErrorBoundary;