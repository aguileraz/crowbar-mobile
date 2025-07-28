import React, { useState } from 'react';
import logger from '../../services/loggerService';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,

  Text,
  useTheme,
  SegmentedButtons,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { analyticsService } from '../../services/analyticsService';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import PerformanceMonitor from '../../components/PerformanceMonitor';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ViewMode = 'dashboard' | 'performance' | 'events';

/**
 * Tela de Analytics
 * Visualização de métricas e estatísticas do app
 */
const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugEvents, setDebugEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dados do Redux
  const analytics = useSelector((state: RootState) => state.analytics);
  const _user = useSelector((state: RootState) => state.user.currentUser);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar eventos de debug se em desenvolvimento
      if (__DEV__) {
        const events = await analyticsService.getDebugEvents();
        setDebugEvents(events.slice(-50)); // Últimos 50 eventos
      }
      
      // Rastrear visualização da tela
      await analyticsService.logScreenView('AnalyticsScreen', 'Analytics');
    } catch (error) {
      logger.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const clearDebugEvents = async () => {
    await analyticsService.clearDebugEvents();
    setDebugEvents([]);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'performance':
        return <PerformanceMonitor />;
      case 'events':
        return renderDebugEvents();
      default:
        return null;
    }
  };

  const renderDebugEvents = () => {
    if (!__DEV__) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Eventos de Debug</Title>
            <Paragraph>
              Disponível apenas em modo de desenvolvimento
            </Paragraph>
          </Card.Content>
        </Card>
      );
    }

    return (
      <View>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Eventos de Debug</Title>
              <Button 
                mode="outlined" 
                onPress={clearDebugEvents}
                icon="delete"
                compact
              >
                Limpar
              </Button>
            </View>
            <Paragraph>Últimos {debugEvents.length} eventos registrados</Paragraph>
          </Card.Content>
        </Card>

        {debugEvents.map((event, index) => (
          <Card key={index} style={styles.eventCard}>
            <Card.Content>
              <View style={styles.eventHeader}>
                <Chip 
                  icon="tag" 
                  style={[
                    styles.eventChip,
                    { backgroundColor: theme.colors.primaryContainer }
                  ]}
                >
                  {event.name}
                </Chip>
                <Text variant="bodySmall" style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              {event.parameters && (
                <View style={styles.eventParams}>
                  <Text variant="bodySmall" style={styles.paramsTitle}>
                    Parâmetros:
                  </Text>
                  <Text variant="bodySmall" style={styles.paramsText}>
                    {JSON.stringify(event.parameters, null, 2)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderAnalyticsStatus = () => {
    const status = analyticsService.getStatus();
    
    return (
      <Card style={styles.statusCard}>
        <Card.Content>
          <Title>Status do Analytics</Title>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name={status.isInitialized ? 'check-circle' : 'alert-circle'}
              size={20}
              color={status.isInitialized ? theme.colors.primary : theme.colors.error}
            />
            <Text style={styles.statusText}>
              {status.isInitialized ? 'Inicializado' : 'Não inicializado'}
            </Text>
          </View>
          
          {status.sessionId && (
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statusText}>
                Sessão: {status.sessionId.substring(0, 20)}...
              </Text>
            </View>
          )}
          
          {status.userId && (
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.statusText}>
                Usuário: {status.userId}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Analytics" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Analytics" />
        <Appbar.Action 
          icon="refresh" 
          onPress={handleRefresh}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Seletor de Visualização */}
        <Surface style={styles.segmentedContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            buttons={[
              {
                value: 'dashboard',
                label: 'Dashboard',
                icon: 'view-dashboard',
              },
              {
                value: 'performance',
                label: 'Performance',
                icon: 'speedometer',
              },
              {
                value: 'events',
                label: 'Eventos',
                icon: 'format-list-bulleted',
              },
            ]}
          />
        </Surface>

        {/* Status do Analytics */}
        {renderAnalyticsStatus()}

        {/* Conteúdo baseado no modo de visualização */}
        {renderContent()}

        {/* Resumo de Analytics */}
        {viewMode === 'dashboard' && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Title>Resumo de Conversões</Title>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text variant="headlineMedium" style={styles.metricValue}>
                      {analytics.conversions.total}
                    </Text>
                    <Text variant="bodySmall">Total</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text variant="headlineMedium" style={styles.metricValue}>
                      R$ {analytics.conversions.totalValue.toFixed(2)}
                    </Text>
                    <Text variant="bodySmall">Valor Total</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text variant="headlineMedium" style={styles.metricValue}>
                      {analytics.conversions.events.length}
                    </Text>
                    <Text variant="bodySmall">Eventos</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Title>Eventos Pendentes</Title>
                <Paragraph>
                  {analytics.pendingEvents.length} eventos aguardando envio
                </Paragraph>
                {analytics.pendingEvents.length > 0 && (
                  <Button
                    mode="contained"
                    onPress={() => {
                      // Processar eventos pendentes
                      analytics.pendingEvents.forEach(event => {
                        analyticsService.logEvent(event.name, event.parameters);
                      });
                    }}
                    style={styles.actionButton}
                  >
                    Enviar Eventos Pendentes
                  </Button>
                )}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedContainer: {
    margin: 16,
    padding: 8,
    borderRadius: 8,
    elevation: 2,
  },
  statusCard: {
    margin: 16,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    marginLeft: 8,
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventChip: {
    height: 28,
  },
  eventTime: {
    opacity: 0.6,
  },
  eventParams: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  paramsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paramsText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 16,
  },
});

export default AnalyticsScreen;