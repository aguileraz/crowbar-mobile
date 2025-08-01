import React, { useState } from 'react';
import logger from '../services/loggerService';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  DataTable,
  ProgressBar,

  Divider,
} from 'react-native-paper';
import { bundleAnalyzer } from '../utils/bundleAnalyzer';
import { useAppPerformance, useApiPerformance } from '../hooks/usePerformance';
import { theme, getSpacing } from '../theme';

/**
 * Dashboard de Performance para desenvolvimento
 * Mostra métricas de performance em tempo real
 */

interface PerformanceDashboardProps {
  style?: ViewStyle;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ style }) => {
  const [bundleReport, setBundleReport] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Performance hooks
  const { appMetrics, getPerformanceReport: _getPerformanceReport } = useAppPerformance();
  const { apiMetrics, getAllApiStats } = useApiPerformance();

  /**
   * Load bundle analysis
   */
  const loadBundleAnalysis = async () => {
    try {
      setRefreshing(true);
      const report = bundleAnalyzer.generateFullReport();
      setBundleReport(report);
    } catch (error) {
      logger.error('Error loading bundle analysis:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /**
   * Get performance score
   */
  const getPerformanceScore = (): number => {
    if (!bundleReport) return 0;
    
    let score = 100;
    
    // Bundle size penalty
    if (bundleReport.bundle.totalSize > 1000000) score -= 20; // > 1MB
    if (bundleReport.bundle.totalSize > 2000000) score -= 30; // > 2MB
    
    // Load time penalty
    if (bundleReport.performance.loadTime > 3000) score -= 15; // > 3s
    if (bundleReport.performance.loadTime > 5000) score -= 25; // > 5s
    
    // Memory usage penalty
    if (bundleReport.performance.memoryUsage > 50000000) score -= 10; // > 50MB
    
    // API performance penalty
    const apiStats = getAllApiStats();
    const avgApiTime = Object.values(apiStats).reduce((sum: number, stat: any) => 
      sum + stat.responseTime, 0) / Object.keys(apiStats).length;
    
    if (avgApiTime > 1000) score -= 10; // > 1s average
    
    return Math.max(0, score);
  };

  /**
   * Get score color
   */
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  useEffect(() => {
    if (__DEV__) {
      loadBundleAnalysis();
    }
  }, []);

  if (!__DEV__) {
    return (
      <View style={[styles.container, style]}>
        <Text>Performance Dashboard disponível apenas em modo de desenvolvimento</Text>
      </View>
    );
  }

  const performanceScore = getPerformanceScore();
  const scoreColor = getScoreColor(performanceScore);

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Performance Score */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.scoreHeader}>
            <Title>Performance Score</Title>
            <Chip
              mode="flat"
              style={[styles.scoreChip, { backgroundColor: scoreColor + '20' }]}
              textStyle={[styles.scoreText, { color: scoreColor }]}
            >
              {performanceScore}/100
            </Chip>
          </View>
          
          <ProgressBar
            progress={performanceScore / 100}
            color={scoreColor}
            style={styles.scoreProgress}
          />
          
          <Paragraph style={styles.scoreDescription}>
            {performanceScore >= 80 && 'Excelente performance! 🚀'}
            {performanceScore >= 60 && performanceScore < 80 && 'Boa performance, mas pode melhorar 👍'}
            {performanceScore < 60 && 'Performance precisa de otimização ⚠️'}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* App Metrics */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Métricas da Aplicação</Title>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatDuration(appMetrics.appStartTime)}</Text>
              <Text style={styles.metricLabel}>Tempo de Inicialização</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{appMetrics.totalApiCalls}</Text>
              <Text style={styles.metricLabel}>Chamadas API</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatFileSize(appMetrics.memoryUsage)}</Text>
              <Text style={styles.metricLabel}>Uso de Memória</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{appMetrics.crashCount}</Text>
              <Text style={styles.metricLabel}>Crashes</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Bundle Analysis */}
      {bundleReport && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Análise do Bundle</Title>
              <Button
                mode="outlined"
                onPress={loadBundleAnalysis}
                loading={refreshing}
                style={styles.refreshButton}
              >
                Atualizar
              </Button>
            </View>
            
            <View style={styles.bundleStats}>
              <View style={styles.bundleStat}>
                <Text style={styles.bundleValue}>
                  {formatFileSize(bundleReport.bundle.totalSize)}
                </Text>
                <Text style={styles.bundleLabel}>Tamanho Total</Text>
              </View>
              
              <View style={styles.bundleStat}>
                <Text style={styles.bundleValue}>
                  {formatFileSize(bundleReport.bundle.gzippedSize)}
                </Text>
                <Text style={styles.bundleLabel}>Comprimido</Text>
              </View>
              
              <View style={styles.bundleStat}>
                <Text style={styles.bundleValue}>
                  {bundleReport.bundle.chunks.length}
                </Text>
                <Text style={styles.bundleLabel}>Chunks</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Chunks</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Nome</DataTable.Title>
                <DataTable.Title>Tamanho</DataTable.Title>
                <DataTable.Title>Tipo</DataTable.Title>
              </DataTable.Header>
              
              {bundleReport.bundle.chunks.map((chunk: any, _index: number) => (
                <DataTable.Row key={0}>
                  <DataTable.Cell>{chunk.name}</DataTable.Cell>
                  <DataTable.Cell>{formatFileSize(chunk._size)}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      mode="flat"
                      style={[
                        styles.typeChip,
                        chunk.isAsync ? styles.asyncChip : styles.syncChip,
                      ]}
                      textStyle={styles.typeChipText}
                    >
                      {chunk.isAsync ? 'Async' : 'Sync'}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* API Performance */}
      {Object.keys(apiMetrics).length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Performance da API</Title>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Endpoint</DataTable.Title>
                <DataTable.Title numeric>Tempo</DataTable.Title>
                <DataTable.Title numeric>Chamadas</DataTable.Title>
                <DataTable.Title numeric>Erro %</DataTable.Title>
              </DataTable.Header>
              
              {Object.entries(apiMetrics).map(([endpoint, stats]: [string, any]) => (
                <DataTable.Row key={endpoint}>
                  <DataTable.Cell>{endpoint}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatDuration(stats.responseTime)}</DataTable.Cell>
                  <DataTable.Cell numeric>{stats.callCount}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={[
                      styles.errorRate,
                      stats.errorRate > 0.1 && styles.highErrorRate,
                    ]}>
                      {(stats.errorRate * 100).toFixed(1)}%
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* Optimization Suggestions */}
      {bundleReport?.optimizations && bundleReport.optimizations.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Sugestões de Otimização</Title>
            
            {bundleReport.optimizations.map((optimization: any, _index: number) => (
              <View key={0} style={styles.optimizationItem}>
                <View style={styles.optimizationHeader}>
                  <Chip
                    mode="flat"
                    style={[
                      styles.impactChip,
                      optimization.impact === 'high' && styles.highImpact,
                      optimization.impact === 'medium' && styles.mediumImpact,
                      optimization.impact === 'low' && styles.lowImpact,
                    ]}
                    textStyle={styles.impactText}
                  >
                    {optimization.impact.toUpperCase()}
                  </Chip>
                  <Text style={styles.savingsText}>
                    Economia: {formatFileSize(optimization.savings)}
                  </Text>
                </View>
                
                <Paragraph style={styles.optimizationDescription}>
                  {optimization.description}
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
    padding: getSpacing('md'),
  },
  card: {
    marginBottom: getSpacing('md'),
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  refreshButton: {
    minWidth: 100,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  scoreChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: getSpacing('md'),
  },
  scoreDescription: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: getSpacing('xs'),
  },
  bundleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: getSpacing('md'),
  },
  bundleStat: {
    alignItems: 'center',
  },
  bundleValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  bundleLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  divider: {
    marginVertical: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('sm'),
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 10,
  },
  asyncChip: {
    backgroundColor: '#4CAF50' + '20',
  },
  syncChip: {
    backgroundColor: '#FF9800' + '20',
  },
  errorRate: {
    fontSize: 12,
  },
  highErrorRate: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  optimizationItem: {
    marginBottom: getSpacing('md'),
    padding: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  optimizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  impactChip: {
    height: 24,
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  highImpact: {
    backgroundColor: '#F44336' + '20',
  },
  mediumImpact: {
    backgroundColor: '#FF9800' + '20',
  },
  lowImpact: {
    backgroundColor: '#4CAF50' + '20',
  },
  savingsText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  optimizationDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});

export default PerformanceDashboard;