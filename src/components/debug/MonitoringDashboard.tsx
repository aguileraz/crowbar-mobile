/**
 * Crowbar Mobile - Monitoring Dashboard
 * Development dashboard for monitoring services status and metrics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  DataTable,
  Switch,
  Divider,
  List,
} from 'react-native-paper';
import { useMonitoring } from '../../hooks/useMonitoring';
import config from '../../../config/environments';

interface MonitoringDashboardProps {
  visible?: boolean;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  visible = true,
}) => {
  const {
    logError,
    logNonFatalError,
    startTrace,
    stopTrace,
    recordMetric,
    trackEvent,
    getStatus,
    getPerformanceMetrics,
  } = useMonitoring();

  const [status, setStatus] = useState(getStatus());
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Refresh data
  const refreshData = () => {
    setStatus(getStatus());
    setMetrics(getPerformanceMetrics());
  };

  // Auto refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 2000);
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // Test functions
  const testCrashReporting = () => {
    Alert.alert(
      'Test Crash Reporting',
      'This will test crash reporting. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: () => {
            try {
              throw new Error('Test crash from monitoring dashboard');
            } catch (error) {
              logError(error as Error, {
                screen: 'MonitoringDashboard',
                action: 'test_crash',
                additionalData: { testMode: true },
              });
            }
          },
        },
      ]
    );
  };

  const testNonFatalError = () => {
    logNonFatalError('Test non-fatal error from monitoring dashboard', {
      screen: 'MonitoringDashboard',
      action: 'test_non_fatal',
      additionalData: { testMode: true },
    });
    Alert.alert('Success', 'Non-fatal error logged');
  };

  const testPerformanceTrace = async () => {
    const traceName = 'test_trace';
    await startTrace(traceName, { test: 'true' });
    
    setTimeout(async () => {
      await stopTrace(traceName);
      Alert.alert('Success', 'Performance trace completed');
      refreshData();
    }, 2000);
  };

  const testCustomMetric = () => {
    recordMetric({
      name: 'test_metric',
      value: Math.random() * 100,
      unit: 'ms',
      attributes: { test: 'true' },
    });
    Alert.alert('Success', 'Custom metric recorded');
    refreshData();
  };

  const testEvent = () => {
    trackEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: Date.now(),
    });
    Alert.alert('Success', 'Event tracked');
  };

  if (!visible || !config.IS_DEV) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>🔍 Monitoring Dashboard</Title>
          <Paragraph>Development monitoring and testing tools</Paragraph>
          
          <View style={styles.refreshContainer}>
            <Button mode="outlined" onPress={refreshData}>
              Refresh
            </Button>
            <View style={styles.autoRefreshContainer}>
              <Paragraph>Auto Refresh</Paragraph>
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>📊 Service Status</Title>
          
          <View style={styles.statusContainer}>
            <Chip
              icon={status.isInitialized ? 'check' : 'close'}
              mode={status.isInitialized ? 'flat' : 'outlined'}
              style={[
                styles.statusChip,
                status.isInitialized ? styles.successChip : styles.errorChip,
              ]}
            >
              Initialized
            </Chip>
            
            <Chip
              icon={status.crashlyticsEnabled ? 'check' : 'close'}
              mode={status.crashlyticsEnabled ? 'flat' : 'outlined'}
              style={[
                styles.statusChip,
                status.crashlyticsEnabled ? styles.successChip : styles.errorChip,
              ]}
            >
              Crashlytics
            </Chip>
            
            <Chip
              icon={status.performanceMonitoringEnabled ? 'check' : 'close'}
              mode={status.performanceMonitoringEnabled ? 'flat' : 'outlined'}
              style={[
                styles.statusChip,
                status.performanceMonitoringEnabled ? styles.successChip : styles.errorChip,
              ]}
            >
              Performance
            </Chip>
            
            <Chip
              icon={status.analyticsEnabled ? 'check' : 'close'}
              mode={status.analyticsEnabled ? 'flat' : 'outlined'}
              style={[
                styles.statusChip,
                status.analyticsEnabled ? styles.successChip : styles.errorChip,
              ]}
            >
              Analytics
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <List.Item
            title="Active Traces"
            description={`${status.activeTraces.length} traces running`}
            left={(props) => <List.Icon {...props} icon="timer" />}
          />
          
          <List.Item
            title="Metrics Count"
            description={`${status.metricsCount} metrics recorded`}
            left={(props) => <List.Icon {...props} icon="chart-line" />}
          />
        </Card.Content>
      </Card>

      {/* Performance Metrics Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>⚡ Performance Metrics</Title>
          
          {Object.keys(metrics).length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Metric</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
                <DataTable.Title numeric>Avg</DataTable.Title>
                <DataTable.Title numeric>Min</DataTable.Title>
                <DataTable.Title numeric>Max</DataTable.Title>
              </DataTable.Header>

              {Object.entries(metrics).map(([name, data]) => (
                <DataTable.Row key={name}>
                  <DataTable.Cell>{name}</DataTable.Cell>
                  <DataTable.Cell numeric>{data.count}</DataTable.Cell>
                  <DataTable.Cell numeric>{data.average.toFixed(1)}</DataTable.Cell>
                  <DataTable.Cell numeric>{data.min.toFixed(1)}</DataTable.Cell>
                  <DataTable.Cell numeric>{data.max.toFixed(1)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Paragraph>No performance metrics recorded yet</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Active Traces Card */}
      {status.activeTraces.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>⏱️ Active Traces</Title>
            
            {status.activeTraces.map((traceName) => (
              <Chip
                key={traceName}
                icon="timer"
                style={styles.traceChip}
              >
                {traceName}
              </Chip>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Test Functions Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>🧪 Test Functions</Title>
          <Paragraph>Test monitoring services (development only)</Paragraph>
          
          <View style={styles.testButtonsContainer}>
            <Button
              mode="outlined"
              onPress={testCrashReporting}
              style={styles.testButton}
              icon="bug"
            >
              Test Error
            </Button>
            
            <Button
              mode="outlined"
              onPress={testNonFatalError}
              style={styles.testButton}
              icon="alert"
            >
              Test Non-Fatal
            </Button>
            
            <Button
              mode="outlined"
              onPress={testPerformanceTrace}
              style={styles.testButton}
              icon="timer"
            >
              Test Trace
            </Button>
            
            <Button
              mode="outlined"
              onPress={testCustomMetric}
              style={styles.testButton}
              icon="chart-line"
            >
              Test Metric
            </Button>
            
            <Button
              mode="outlined"
              onPress={testEvent}
              style={styles.testButton}
              icon="send"
            >
              Test Event
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Environment Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>🌍 Environment</Title>
          
          <List.Item
            title="Environment"
            description={config.ENVIRONMENT}
            left={(props) => <List.Icon {...props} icon="earth" />}
          />
          
          <List.Item
            title="Debug Mode"
            description={config.APP_CONFIG.DEBUG_MODE ? 'Enabled' : 'Disabled'}
            left={(props) => <List.Icon {...props} icon="bug" />}
          />
          
          <List.Item
            title="Log Level"
            description={config.APP_CONFIG.LOG_LEVEL}
            left={(props) => <List.Icon {...props} icon="text" />}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  autoRefreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    marginBottom: 4,
  },
  successChip: {
    backgroundColor: '#4CAF50',
  },
  errorChip: {
    backgroundColor: '#F44336',
  },
  divider: {
    marginVertical: 16,
  },
  traceChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  testButton: {
    marginBottom: 8,
  },
});

export default MonitoringDashboard;
