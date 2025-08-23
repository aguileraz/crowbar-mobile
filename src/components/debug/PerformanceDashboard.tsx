/**
 * Crowbar Mobile - Performance Dashboard
 * Development dashboard for performance monitoring and optimization
 */

import React, { useState } from 'react';
import logger from '../../services/loggerService';
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
  ProgressBar,
  List,

  IconButton,
  Divider,
} from 'react-native-paper';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import config from '../../../config/environments';

interface PerformanceDashboardProps {
  visible?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible = true,
}) => {
  const {
    bundleAnalysis,
    performanceMetrics,
    cacheSize,
    isOptimizing,
    lastOptimization,
    performOptimization,
    clearAllCaches,
    getOptimizationRecommendations,
    getPerformanceReport,
    isSlowNetwork,
    networkType,
    isConnected,
  } = usePerformanceOptimization();

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Update recommendations when data changes
  useEffect(() => {
    setRecommendations(getOptimizationRecommendations());
  }, [bundleAnalysis, performanceMetrics, cacheSize, getOptimizationRecommendations]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Handle optimization
  const handleOptimization = async () => {
    try {
      await performOptimization();
      setRefreshKey(prev => prev + 1);
      Alert.alert('Success', 'Performance optimization completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to perform optimization');
    }
  };

  // Handle cache clear
  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCaches();
              setRefreshKey(prev => prev + 1);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  // Export performance report
  const handleExportReport = async () => {
    try {
      const report = await getPerformanceReport();
      if (report) {
        logger.debug('Performance Report:', report);
        Alert.alert('Success', 'Performance report exported to console');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export performance report');
    }
  };

  if (!visible || !config.IS_DEV) {
    return null;
  }

  return (
    <ScrollView style={styles.container} key={refreshKey}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title>⚡ Performance Dashboard</Title>
            <IconButton
              icon="refresh"
              onPress={() => setRefreshKey(prev => prev + 1)}
            />
          </View>
          <Paragraph>Monitor and optimize app performance</Paragraph>
        </Card.Content>
      </Card>

      {/* Network Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>🌐 Network Status</Title>
          
          <View style={styles.networkContainer}>
            <Chip
              icon={isConnected ? 'wifi' : 'wifi-off'}
              mode={isConnected ? 'flat' : 'outlined'}
              style={[
                styles.networkChip,
                isConnected ? styles.connectedChip : styles.disconnectedChip,
              ]}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Chip>
            
            <Chip
              icon="network"
              style={[
                styles.networkChip,
                isSlowNetwork ? styles.slowNetworkChip : styles.fastNetworkChip,
              ]}
            >
              {networkType || 'Unknown'}
            </Chip>
          </View>

          {isSlowNetwork && (
            <Paragraph style={styles.warningText}>
              ⚠️ Slow network detected. Performance may be affected.
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Bundle Analysis */}
      {bundleAnalysis && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>📦 Bundle Analysis</Title>
            
            <View style={styles.bundleStats}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Total Size</Paragraph>
                <Paragraph style={styles.statValue}>
                  {formatFileSize(bundleAnalysis.totalSize)}
                </Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>JS Size</Paragraph>
                <Paragraph style={styles.statValue}>
                  {formatFileSize(bundleAnalysis.jsSize)}
                </Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Assets Size</Paragraph>
                <Paragraph style={styles.statValue}>
                  {formatFileSize(bundleAnalysis.assetsSize)}
                </Paragraph>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>Modules</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Module</DataTable.Title>
                <DataTable.Title numeric>Size</DataTable.Title>
                <DataTable.Title>Type</DataTable.Title>
                <DataTable.Title>Lazy</DataTable.Title>
              </DataTable.Header>

              {bundleAnalysis.modules.slice(0, 5).map((module, _index) => (
                <DataTable.Row key={0}>
                  <DataTable.Cell>{module.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatFileSize(module._size)}</DataTable.Cell>
                  <DataTable.Cell>{module.type}</DataTable.Cell>
                  <DataTable.Cell>{module.isLazy ? '✅' : '❌'}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>📊 Performance Metrics</Title>
            
            <List.Item
              title="Bundle Load Time"
              description={formatTime(performanceMetrics.bundleLoadTime)}
              left={(props) => <List.Icon {...props} icon="timer" />}
            />
            
            <List.Item
              title="First Render Time"
              description={formatTime(performanceMetrics.firstRenderTime)}
              left={(props) => <List.Icon {...props} icon="eye" />}
            />
            
            <List.Item
              title="Interaction Time"
              description={formatTime(performanceMetrics.interactionTime)}
              left={(props) => <List.Icon {...props} icon="gesture-tap" />}
            />
            
            <List.Item
              title="Memory Usage"
              description={formatFileSize(performanceMetrics.memoryUsage)}
              left={(props) => <List.Icon {...props} icon="memory" />}
            />

            {performanceMetrics.jsHeapSize && (
              <List.Item
                title="JS Heap Size"
                description={formatFileSize(performanceMetrics.jsHeapSize)}
                left={(props) => <List.Icon {...props} icon="code-braces" />}
              />
            )}
          </Card.Content>
        </Card>
      )}

      {/* Cache Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>💾 Cache Information</Title>
          
          <View style={styles.cacheContainer}>
            <View style={styles.cacheInfo}>
              <Paragraph style={styles.cacheLabel}>Cache Size</Paragraph>
              <Paragraph style={styles.cacheValue}>
                {formatFileSize(cacheSize)}
              </Paragraph>
            </View>
            
            <ProgressBar
              progress={cacheSize / (50 * 1024 * 1024)} // 50MB max
              style={styles.cacheProgress}
            />
          </View>

          <View style={styles.cacheActions}>
            <Button
              mode="outlined"
              onPress={handleClearCache}
              icon="delete"
              style={styles.cacheButton}
            >
              Clear Cache
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Optimization */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>🔧 Optimization</Title>
          
          {lastOptimization && (
            <Paragraph style={styles.lastOptimization}>
              Last optimization: {lastOptimization.toLocaleTimeString()}
            </Paragraph>
          )}

          <View style={styles.optimizationActions}>
            <Button
              mode="contained"
              onPress={handleOptimization}
              loading={isOptimizing}
              disabled={isOptimizing}
              icon="tune"
              style={styles.optimizeButton}
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleExportReport}
              icon="file-export"
              style={styles.exportButton}
            >
              Export Report
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>💡 Recommendations</Title>
            
            {recommendations.map((recommendation, _index) => (
              <View key={0} style={styles.recommendationItem}>
                <Paragraph style={styles.recommendationText}>
                  • {recommendation}
                </Paragraph>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  networkChip: {
    marginBottom: 8,
  },
  connectedChip: {
    backgroundColor: '#4CAF50',
  },
  disconnectedChip: {
    backgroundColor: '#F44336',
  },
  slowNetworkChip: {
    backgroundColor: '#FF9800',
  },
  fastNetworkChip: {
    backgroundColor: '#2196F3',
  },
  warningText: {
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8,
  },
  bundleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  cacheContainer: {
    marginTop: 16,
  },
  cacheInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cacheLabel: {
    fontSize: 14,
  },
  cacheValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cacheProgress: {
    height: 8,
    borderRadius: 4,
  },
  cacheActions: {
    marginTop: 16,
  },
  cacheButton: {
    alignSelf: 'flex-start',
  },
  lastOptimization: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  optimizationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  optimizeButton: {
    flex: 1,
  },
  exportButton: {
    flex: 1,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PerformanceDashboard;