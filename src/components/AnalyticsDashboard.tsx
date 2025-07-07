import React, { useState, useEffect } from 'react';
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
  Switch,
  Divider,
} from 'react-native-paper';
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
 * Mostra métricas e eventos em tempo real
 */

interface AnalyticsDashboardProps {
  style?: ViewStyle;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ style }) => {
  const [debugEvents, setDebugEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      console.error('Error loading debug events:', error);
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
      console.error('Error clearing debug events:', error);
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

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Métricas de Performance</Title>
          
          {performanceMetrics.appStartTime && (
            <Paragraph>
              Tempo de inicialização: {formatDuration(performanceMetrics.appStartTime)}
            </Paragraph>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Tempos de Carregamento de Tela</Text>
          {Object.entries(performanceMetrics.screenLoadTimes).map(([screen, time]) => (
            <View key={screen} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{screen}:</Text>
              <Text style={styles.metricValue}>{formatDuration(time)}</Text>
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Tempos de Resposta da API</Text>
          {Object.entries(performanceMetrics.apiResponseTimes).map(([endpoint, times]) => (
            <View key={endpoint} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{endpoint}:</Text>
              <Text style={styles.metricValue}>
                {formatDuration(getAverageResponseTime(times))} (média)
              </Text>
            </View>
          ))}
          
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
            
            {screenHistory.slice(-10).map((screen, index) => (
              <DataTable.Row key={index}>
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

      {/* Conversion Events */}
      {conversionEvents.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Eventos de Conversão</Title>
            {conversionEvents.slice(-5).map((event, index) => (
              <View key={index} style={styles.conversionEvent}>
                <Text style={styles.eventName}>{event.event}</Text>
                <Text style={styles.eventDetails}>
                  {event.value && event.currency && `${event.currency} ${event.value.toFixed(2)}`}
                  {' • '}
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
            debugEvents.map((event, index) => (
              <View key={index} style={styles.debugEvent}>
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

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Configurações</Title>
          
          <View style={styles.settingRow}>
            <Text>Crashlytics</Text>
            <Switch value={settings.enableCrashlytics} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <Text>Monitoramento de Performance</Text>
            <Switch value={settings.enablePerformanceMonitoring} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <Text>Rastreamento de Usuário</Text>
            <Switch value={settings.enableUserTracking} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <Text>Rastreamento de Conversão</Text>
            <Switch value={settings.enableConversionTracking} disabled />
          </View>
          
          <View style={styles.settingRow}>
            <Text>Modo Debug</Text>
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
  },
  divider: {
    marginVertical: getSpacing('md'),
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
  conversionEvent: {
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
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
});

export default AnalyticsDashboard;
