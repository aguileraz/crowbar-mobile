/**
 * Crowbar Mobile - Error Boundary
 * Catches React errors and reports them to monitoring services
 */

import React, { Component, ReactNode } from 'react';
import logger from '../services/loggerService';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
} from 'react-native-paper';
import monitoringService from '../services/monitoringService';
import config from '../../config/environments';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to monitoring service
    this.logErrorToMonitoring(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (config.IS_DEV) {
      logger.error('ErrorBoundary caught an error:', error);
      logger.error('Error info:', errorInfo);
    }
  }

  private logErrorToMonitoring(error: Error, errorInfo: any) {
    try {
      // Log to monitoring service
      monitoringService.logError(error, {
        action: 'error_boundary',
        screen: 'ErrorBoundary',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
        },
      });

      // Track error event
      monitoringService.trackEvent('app_error', {
        error_type: 'react_error',
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_id: this.state.errorId,
      });
    } catch (monitoringError) {
      logger.error('Failed to log error to monitoring service:', monitoringError);
    }
  }

  private handleRetry = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReportError = () => {
    const { error, errorInfo: _errorInfo, errorId } = this.state;
    
    if (error && errorId) {
      // Additional error reporting
      monitoringService.trackEvent('user_reported_error', {
        error_id: errorId,
        error_message: error.message,
        user_action: 'manual_report',
      });

      // Show confirmation (you might want to show a toast or alert)
      logger.debug('Error reported with ID:', errorId);
    }
  };

  private renderErrorDetails() {
    const { error, errorInfo, errorId } = this.state;
    
    if (!config.IS_DEV || !error) {
      return null;
    }

    return (
      <Card style={styles.errorDetailsCard}>
        <Card.Content>
          <Title style={styles.errorDetailsTitle}>🐛 Error Details (Dev Mode)</Title>
          
          <View style={styles.errorDetailItem}>
            <Paragraph style={styles.errorDetailLabel}>Error ID:</Paragraph>
            <Paragraph style={styles.errorDetailValue}>{errorId}</Paragraph>
          </View>
          
          <View style={styles.errorDetailItem}>
            <Paragraph style={styles.errorDetailLabel}>Message:</Paragraph>
            <Paragraph style={styles.errorDetailValue}>{error.message}</Paragraph>
          </View>
          
          <View style={styles.errorDetailItem}>
            <Paragraph style={styles.errorDetailLabel}>Stack:</Paragraph>
            <Paragraph style={[styles.errorDetailValue, styles.stackTrace]}>
              {error.stack}
            </Paragraph>
          </View>
          
          {errorInfo?.componentStack && (
            <View style={styles.errorDetailItem}>
              <Paragraph style={styles.errorDetailLabel}>Component Stack:</Paragraph>
              <Paragraph style={[styles.errorDetailValue, styles.stackTrace]}>
                {errorInfo.componentStack}
              </Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.errorCard}>
              <Card.Content>
                <View style={styles.errorHeader}>
                  <IconButton
                    icon="alert-circle"
                    size={48}
                    iconColor="#F44336"
                  />
                  <Title style={styles.errorTitle}>Oops! Something went wrong</Title>
                </View>
                
                <Paragraph style={styles.errorMessage}>
                  We're sorry, but something unexpected happened. The error has been 
                  automatically reported to our team.
                </Paragraph>

                {this.state.errorId && (
                  <Paragraph style={styles.errorId}>
                    Error ID: {this.state.errorId}
                  </Paragraph>
                )}

                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={this.handleRetry}
                    style={styles.retryButton}
                    icon="refresh"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={this.handleReportError}
                    style={styles.reportButton}
                    icon="bug-report"
                  >
                    Report Issue
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {this.renderErrorDetails()}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  errorCard: {
    marginBottom: 16,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    textAlign: 'center',
    color: '#F44336',
    marginTop: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorId: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  retryButton: {
    flex: 1,
  },
  reportButton: {
    flex: 1,
  },
  errorDetailsCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  errorDetailsTitle: {
    color: '#856404',
    marginBottom: 12,
  },
  errorDetailItem: {
    marginBottom: 12,
  },
  errorDetailLabel: {
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  errorDetailValue: {
    color: '#856404',
    fontSize: 12,
  },
  stackTrace: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    fontSize: 10,
  },
});

export default ErrorBoundary;
