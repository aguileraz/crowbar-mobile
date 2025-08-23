import React, { useState } from 'react';
import logger from '../services/loggerService';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  DataTable,
  Switch,

  ProgressBar,
  Surface,
  useTheme,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import {
  selectAnalyticsEnabled,
  selectUserId,
  selectCurrentScreen,
  selectScreenHistory,
  selectPerformanceMetrics,
  selectConversionEvents,
  selectPendingEvents,
  selectAnalyticsSettings,
} from '../store/slices/analyticsSlice';
import { analyticsService } from '../services/analyticsService';
import { theme, getSpacing } from '../theme';

/**
 * Dashboard de Analytics para desenvolvimento
 * Mostra métricas e eventos em tempo real com gráficos e visualizações
 */

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  style?: ViewStyle;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ style }) => {
  const [debugEvents, setDebugEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const muiTheme = useTheme();

  // Redux state
  const isEnabled = useSelector(selectAnalyticsEnabled);
  const userId = useSelector(selectUserId);
  const currentScreen = useSelector(selectCurrentScreen);
  const screenHistory = useSelector(selectScreenHistory);
  const performanceMetrics = useSelector(selectPerformanceMetrics);
  const conversionEvents = useSelector(selectConversionEvents);
  const pendingEvents = useSelector(selectPendingEvents);
  const settings = useSelector(selectAnalyticsSettings);

  /**
   * Load debug events
   */
  const loadDebugEvents = async () => {
    try {
      setRefreshing(true);
      const events = await analyticsService.getDebugEvents();
      setDebugEvents(events.slice(-20)); // Last 20 events
    } catch (error) {
      logger.error('Error loading debug events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Clear debug events
   */
  const clearDebugEvents = async () => {
    try {
      await analyticsService.clearDebugEvents();
      setDebugEvents([]);
    } catch (error) {
      logger.error('Error clearing debug events:', error);
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /**
   * Get average response time
   */
  const getAverageResponseTime = (times: number[]): number => {
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  };

  useEffect(() => {
    if (__DEV__) {
      loadDebugEvents();
    }
  }, []);

  if (!__DEV__) {
    return (
      <View style={[styles.container, style]}>
        <Text>Analytics Dashboard disponível apenas em modo de desenvolvimento</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Métricas Principais */}
      <View style={styles.metricsGrid}>
        <Surface style={styles.metricCard}>
          <MaterialCommunityIcons 
            name="account-multiple" 
            size={32} 
            color={muiTheme.colors.primary} 
          />
          <Text variant="headlineSmall" style={styles.metricNumber}>
            {screenHistory.length}
          </Text>
          <Text variant="bodySmall">Telas Visitadas</Text>
        </Surface>

        <Surface style={styles.metricCard}>
          <MaterialCommunityIcons 
            name="clock-fast" 
            size={32} 
            color={muiTheme.colors.secondary} 
          />
          <Text variant="headlineSmall" style={styles.metricNumber}>
            {Object.keys(performanceMetrics.apiResponseTimes).length}
          </Text>
          <Text variant="bodySmall">APIs Rastreadas</Text>
        </Surface>

        <Surface style={styles.metricCard}>
          <MaterialCommunityIcons 
            name="cash" 
            size={32} 
            color={muiTheme.colors.tertiary} 
          />
          <Text variant="headlineSmall" style={styles.metricNumber}>
            {conversionEvents.length}
          </Text>
          <Text variant="bodySmall">Conversões</Text>
        </Surface>

        <Surface style={styles.metricCard}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={32} 
            color={muiTheme.colors.error} 
          />
          <Text variant="headlineSmall" style={styles.metricNumber}>
            {Object.values(performanceMetrics.errorCounts).reduce((sum, count) => sum + count, 0)}
          </Text>
          <Text variant="bodySmall">Erros</Text>
        </Surface>
      </View>

      {/* Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Status do Analytics</Title>
          <View style={styles.statusRow}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: isEnabled ? '#4CAF50' + '20' : '#F44336' + '20' },
              ]}
              textStyle={{ color: isEnabled ? '#4CAF50' : '#F44336' }}
              icon={isEnabled ? 'check-circle' : 'alert-circle'}
            >
              {isEnabled ? 'Ativo' : 'Inativo'}
            </Chip>
            
            {userId && (
              <Chip mode="flat" style={styles.userChip} icon="account">
                {userId}
              </Chip>
            )}
          </View>
          
          <Paragraph style={styles.infoText}>
            Tela atual: {currentScreen || 'Nenhuma'}
          </Paragraph>
          
          {pendingEvents.length > 0 && (
            <Paragraph style={styles.warningText}>
              {pendingEvents.length} eventos pendentes
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Performance Metrics com Gráficos */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Métricas de Performance</Title>
          
          {/* Gráfico de Barras Simples para Tempo de Tela */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Tempo de Carregamento por Tela</Text>
            {Object.entries(performanceMetrics.screenLoadTimes)
              .slice(-5)
              .map(([screen, time]) => {
                const percentage = Math.min(time / 3000, 1); // 3s como máximo
                return (
                  <View key={screen} style={styles.barChartRow}>
                    <Text style={styles.barLabel}>{screen}</Text>
                    <View style={styles.barContainer}>
                      <ProgressBar 
                        progress={percentage} 
                        color={percentage > 0.7 ? muiTheme.colors.error : muiTheme.colors.primary}
                        style={styles.progressBar}
                      />
                      <Text style={styles.barValue}>{formatDuration(time)}</Text>
                    </View>
                  </View>
                );
              })}
          </View>
          
          {performanceMetrics.appStartTime && (
            <Paragraph>
              Tempo de inicialização: {formatDuration(performanceMetrics.appStartTime)}
            </Paragraph>
          )}
          
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Tempos de Resposta da API</Text>
          {Object.entries(performanceMetrics.apiResponseTimes).map(([endpoint, times]) => {
            const avgTime = getAverageResponseTime(times);
            const percentage = Math.min(avgTime / 1000, 1); // 1s como máximo
            return (
              <View key={endpoint} style={styles.apiMetricRow}>
                <View style={styles.apiHeader}>
                  <Text style={styles.metricLabel}>{endpoint}</Text>
                  <Text style={styles.metricValue}>
                    {formatDuration(avgTime)} (média)
                  </Text>
                </View>
                <ProgressBar 
                  progress={percentage} 
                  color={percentage > 0.5 ? muiTheme.colors.warning : muiTheme.colors.primary}
                  style={styles.apiProgressBar}
                />
                <Text style={styles.apiCallCount}>
                  {times.length} chamadas
                </Text>
              </View>
            );
          })}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Contadores de Erro</Text>
          {Object.entries(performanceMetrics.errorCounts).map(([errorType, count]) => (
            <View key={errorType} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{errorType}:</Text>
              <Text style={[styles.metricValue, styles.errorCount]}>{count}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Screen History */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Histórico de Telas</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Tela</DataTable.Title>
              <DataTable.Title>Hora</DataTable.Title>
              <DataTable.Title numeric>Duração</DataTable.Title>
            </DataTable.Header>
            
            {screenHistory.slice(-10).map((screen, _index) => (
              <DataTable.Row key={0}>
                <DataTable.Cell>{screen.screen}</DataTable.Cell>
                <DataTable.Cell>{formatTimestamp(screen.timestamp)}</DataTable.Cell>
                <DataTable.Cell numeric>
                  {screen.duration ? formatDuration(screen.duration) : '-'}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Conversion Events com Métricas */}
      {conversionEvents.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Eventos de Conversão</Title>
            
            {/* Resumo de Conversões */}
            <View style={styles.conversionSummary}>
              <Surface style={styles.conversionMetric}>
                <Text variant="bodySmall">Total de Conversões</Text>
                <Text variant="headlineMedium" style={styles.conversionValue}>
                  {conversionEvents.length}
                </Text>
              </Surface>
              
              <Surface style={styles.conversionMetric}>
                <Text variant="bodySmall">Valor Total</Text>
                <Text variant="headlineMedium" style={styles.conversionValue}>
                  R$ {conversionEvents
                    .reduce((sum, event) => sum + (event.value || 0), 0)
                    .toFixed(2)}
                </Text>
              </Surface>
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Lista de Eventos */}
            {conversionEvents.slice(-5).map((event, _index) => (
              <View key={0} style={styles.conversionEvent}>
                <View style={styles.conversionEventHeader}>
                  <Chip 
                    icon="tag" 
                    style={styles.conversionChip}
                    textStyle={styles.conversionChipText}
                  >
                    {event.event}
                  </Chip>
                  {event.value && (
                    <Text style={styles.conversionAmount}>
                      R$ {event.value.toFixed(2)}
                    </Text>
                  )}
                </View>
                <Text style={styles.eventDetails}>
                  {formatTimestamp(event.timestamp)}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Debug Events */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Eventos de Debug</Title>
            <View style={styles.cardActions}>
              <Button
                mode="outlined"
                onPress={loadDebugEvents}
                loading={refreshing}
                style={styles.actionButton}
              >
                Atualizar
              </Button>
              <Button
                mode="outlined"
                onPress={clearDebugEvents}
                style={styles.actionButton}
              >
                Limpar
              </Button>
            </View>
          </View>
          
          {debugEvents.length === 0 ? (
            <Paragraph>Nenhum evento registrado</Paragraph>
          ) : (
            debugEvents.map((event, _index) => (
              <View key={0} style={styles.debugEvent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                </View>
                {Object.keys(event.parameters).length > 0 && (
                  <Text style={styles.eventParams}>
                    {JSON.stringify(event.parameters, null, 2)}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Settings com Indicadores Visuais */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Configurações de Analytics</Title>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="bug" 
                size={24} 
                color={muiTheme.colors.primary} 
              />
              <Text style={styles.settingLabel}>Crashlytics</Text>
            </View>
            <Switch value={settings.enableCrashlytics} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="speedometer" 
                size={24} 
                color={muiTheme.colors.primary} 
              />
              <Text style={styles.settingLabel}>Monitoramento de Performance</Text>
            </View>
            <Switch value={settings.enablePerformanceMonitoring} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="account-eye" 
                size={24} 
                color={muiTheme.colors.primary} 
              />
              <Text style={styles.settingLabel}>Rastreamento de Usuário</Text>
            </View>
            <Switch value={settings.enableUserTracking} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="cash-check" 
                size={24} 
                color={muiTheme.colors.primary} 
              />
              <Text style={styles.settingLabel}>Rastreamento de Conversão</Text>
            </View>
            <Switch value={settings.enableConversionTracking} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="bug-check" 
                size={24} 
                color={muiTheme.colors.primary} 
              />
              <Text style={styles.settingLabel}>Modo Debug</Text>
            </View>
            <Switch value={settings.enableDebugMode} disabled />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('md'),
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: getSpacing('md'),
  },
  metricCard: {
    width: (screenWidth - getSpacing('md') * 3) / 2,
    padding: getSpacing('md'),
    marginBottom: getSpacing('md'),
    alignItems: 'center',
    elevation: 2,
    borderRadius: 8,
  },
  metricNumber: {
    fontWeight: 'bold',
    marginVertical: getSpacing('xs'),
  },
  card: {
    marginBottom: getSpacing('md'),
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  cardActions: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  actionButton: {
    minWidth: 80,
  },
  statusRow: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
    marginVertical: getSpacing('sm'),
  },
  statusChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('sm'),
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: getSpacing('xs'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
    marginTop: getSpacing('md'),
  },
  divider: {
    marginVertical: getSpacing('md'),
  },
  chartContainer: {
    marginTop: getSpacing('md'),
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: getSpacing('md'),
    color: theme.colors.onSurface,
  },
  barChartRow: {
    marginBottom: getSpacing('md'),
  },
  barLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  barValue: {
    fontSize: 11,
    marginLeft: getSpacing('sm'),
    minWidth: 50,
    textAlign: 'right',
    color: theme.colors.onSurfaceVariant,
  },
  apiMetricRow: {
    marginBottom: getSpacing('md'),
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  apiProgressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: getSpacing('xs'),
  },
  apiCallCount: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getSpacing('xs'),
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  errorCount: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  conversionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: getSpacing('md'),
  },
  conversionMetric: {
    flex: 1,
    padding: getSpacing('md'),
    marginHorizontal: getSpacing('xs'),
    alignItems: 'center',
    borderRadius: 8,
    elevation: 1,
  },
  conversionValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  conversionEvent: {
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  conversionEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversionChip: {
    height: 24,
    backgroundColor: theme.colors.primaryContainer,
  },
  conversionChipText: {
    fontSize: 12,
  },
  conversionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  debugEvent: {
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  eventTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  eventDetails: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  eventParams: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginTop: getSpacing('xs'),
    backgroundColor: theme.colors.surfaceVariant,
    padding: getSpacing('xs'),
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getSpacing('sm'),
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    marginLeft: getSpacing('sm'),
    fontSize: 14,
  },
});

export default AnalyticsDashboard;