import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  ProgressBar,
  Divider,
  List,
  Chip,
  Button,
  useTheme,
} from 'react-native-paper';
import { performanceProfiler } from '../../utils/performanceProfiler';
import { theme } from '../../theme';
/**
 * Tela de monitoramento de performance (apenas em desenvolvimento)
 */
export const PerformanceScreen: React.FC = () => {
  const paperTheme = useTheme();
  const [metrics, setMetrics] = useState(performanceProfiler.getMetrics());
  const [report, setReport] = useState(performanceProfiler.getPerformanceReport());
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const interval = autoRefresh ? setInterval(() => {
      setMetrics(performanceProfiler.getMetrics());
      setReport(performanceProfiler.getPerformanceReport());
    }, 1000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);
  const handleRefresh = () => {
    setRefreshing(true);
    setMetrics(performanceProfiler.getMetrics());
    setReport(performanceProfiler.getPerformanceReport());
    setTimeout(() => setRefreshing(false), 500);
  };
  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const ratio = value / threshold;
    if (inverse) {
      return ratio >= 1 ? paperTheme.colors.error : 
             ratio >= 0.8 ? paperTheme.colors.warning : 
             paperTheme.colors.success;
    }
    return ratio <= 1 ? paperTheme.colors.success : 
           ratio <= 1.2 ? paperTheme.colors.warning : 
           paperTheme.colors.error;
  };
  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };
  const formatMemory = (mb: number) => {
    return `${mb.toFixed(1)} MB`;
  };
  if (!__DEV__) {
    return null;
  }
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Performance Monitor</Title>
            <Button
              mode={autoRefresh ? 'contained' : 'outlined'}
              onPress={() => setAutoRefresh(!autoRefresh)}
              compact
            >
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </View>
          {/* Startup Metrics */}
          <List.Section>
            <List.Subheader>Startup Performance</List.Subheader>
            <View style={styles.metric}>
              <Text>Cold Start Time</Text>
              <Chip
                style={{
                  backgroundColor: report.summary.coldStartTime 
                    ? getStatusColor(report.summary.coldStartTime, 3000)
                    : paperTheme.colors.surface,
                }}
              >
                {formatTime(report.summary.coldStartTime)}
              </Chip>
            </View>
            <View style={styles.metric}>
              <Text>Warm Start Time</Text>
              <Chip
                style={{
                  backgroundColor: report.summary.warmStartTime
                    ? getStatusColor(report.summary.warmStartTime, 1500)
                    : paperTheme.colors.surface,
                }}
              >
                {formatTime(report.summary.warmStartTime)}
              </Chip>
            </View>
          </List.Section>
          <Divider />
          {/* Runtime Metrics */}
          <List.Section>
            <List.Subheader>Runtime Performance</List.Subheader>
            <View style={styles.metric}>
              <Text>FPS</Text>
              <View style={styles.metricValue}>
                <Text>{metrics.fps} FPS</Text>
                <ProgressBar
                  progress={metrics.fps / 60}
                  color={getStatusColor(metrics.fps, 50, true)}
                  style={styles.progressBar}
                />
              </View>
            </View>
            <View style={styles.metric}>
              <Text>Memory Usage</Text>
              <View style={styles.metricValue}>
                <Text>{formatMemory(metrics.memoryUsage)}</Text>
                <ProgressBar
                  progress={metrics.memoryUsage / 150}
                  color={getStatusColor(metrics.memoryUsage, 150)}
                  style={styles.progressBar}
                />
              </View>
            </View>
            <View style={styles.metric}>
              <Text>JS Thread</Text>
              <Chip
                style={{
                  backgroundColor: metrics.jsThreadBusy
                    ? paperTheme.colors.error
                    : paperTheme.colors.success,
                }}
              >
                {metrics.jsThreadBusy ? 'Busy' : 'Idle'}
              </Chip>
            </View>
          </List.Section>
          <Divider />
          {/* Screen Transitions */}
          {Object.keys(metrics.screenTransitions).length > 0 && (
            <>
              <List.Section>
                <List.Subheader>Screen Transitions</List.Subheader>
                {Object.entries(metrics.screenTransitions).map(([screen, time]) => (
                  <View key={screen} style={styles.metric}>
                    <Text>{screen}</Text>
                    <Chip
                      style={{
                        backgroundColor: getStatusColor(time, 300),
                      }}
                    >
                      {formatTime(time)}
                    </Chip>
                  </View>
                ))}
              </List.Section>
              <Divider />
            </>
          )}
          {/* Slow Operations */}
          {report.summary.slowScreens.length > 0 && (
            <List.Section>
              <List.Subheader style={{ color: paperTheme.colors.error }}>
                ⚠️ Slow Screens
              </List.Subheader>
              {report.summary.slowScreens.map(screen => (
                <List.Item
                  key={screen}
                  title={screen}
                  left={props => <List.Icon {...props} icon="alert" color={paperTheme.colors.error} />}
                />
              ))}
            </List.Section>
          )}
          {report.summary.slowAPIs.length > 0 && (
            <List.Section>
              <List.Subheader style={{ color: paperTheme.colors.error }}>
                ⚠️ Slow APIs
              </List.Subheader>
              {report.summary.slowAPIs.map(api => (
                <List.Item
                  key={api}
                  title={api}
                  left={props => <List.Icon {...props} icon="alert" color={paperTheme.colors.error} />}
                />
              ))}
            </List.Section>
          )}
        </Card.Content>
      </Card>
      {/* Export Button */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => {
              const data = performanceProfiler.exportPerformanceData();
              // In a real app, you'd save this to a file or send to a server
            }}
          >
            Export Performance Report
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 100,
    height: 4,
    marginTop: theme.spacing.xs,
  },
});
export default PerformanceScreen;