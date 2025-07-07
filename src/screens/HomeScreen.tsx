import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { env } from '../config/env';
import { testFirebaseConnection } from '../config/firebase';

// Realtime components
import RealtimeStatus from '../components/RealtimeStatus';
import LiveEventsFeed from '../components/LiveEventsFeed';
import LiveStockUpdates from '../components/LiveStockUpdates';
import LiveNewReleases from '../components/LiveNewReleases';
import { useLiveEvents } from '../hooks/useRealtime';
import { useLiveNotifications } from '../hooks/useLiveNotifications';

// Offline components
import OfflineStatus from '../components/OfflineStatus';
import { useOffline } from '../hooks/useOffline';

// Analytics components
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useScreenTracking, useEngagementTracking } from '../hooks/useAnalytics';

// Performance components
import PerformanceDashboard from '../components/PerformanceDashboard';
import { usePerformance } from '../hooks/usePerformance';

/**
 * Home Screen - Main screen of the app
 * Displays app status and basic functionality tests
 */

const HomeScreen: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Realtime hooks
  const { events, stats, onlineUsers, isConnected } = useLiveEvents(5);
  const { hasToasts, showNextToast } = useLiveNotifications();

  // Offline hooks
  const { isOnline, syncStatus, hasPendingActions } = useOffline();

  // Analytics hooks
  useScreenTracking('Home');
  const { trackButtonClick } = useEngagementTracking();

  // Performance hooks
  const { metrics } = usePerformance({
    componentName: 'HomeScreen',
    trackRenders: true,
    trackInteractions: true,
  });

  /**
   * Test Firebase connection
   */
  const handleTestFirebase = async () => {
    setIsLoading(true);
    trackButtonClick('test_firebase', 'home_screen');

    try {
      const isConnected = await testFirebaseConnection();
      setFirebaseStatus(isConnected);
      
      Alert.alert(
        'Firebase Test',
        isConnected ? 'Conexão bem-sucedida!' : 'Falha na conexão',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setFirebaseStatus(false);
      Alert.alert('Erro', 'Erro ao testar Firebase', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show app info
   */
  const handleShowAppInfo = () => {
    Alert.alert(
      'Informações do App',
      `Versão: ${env.APP_VERSION}\nAmbiente: ${env.NODE_ENV}\nAPI: ${env.API_BASE_URL}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Crowbar Mobile</Title>
        <Paragraph style={styles.subtitle}>
          Aplicativo móvel para gestão de projetos
        </Paragraph>

        {/* App Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Status do Sistema</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Ambiente:</Text>
              <Text style={styles.statusValue}>{env.NODE_ENV}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Versão:</Text>
              <Text style={styles.statusValue}>{env.APP_VERSION}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Debug:</Text>
              <Text style={styles.statusValue}>
                {env.DEBUG_MODE ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Firebase:</Text>
              <Text style={[
                styles.statusValue,
                firebaseStatus === true && styles.statusSuccess,
                firebaseStatus === false && styles.statusError,
              ]}>
                {firebaseStatus === null ? 'Não testado' : 
                 firebaseStatus ? 'Conectado' : 'Erro'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Testes do Sistema</Title>
            <Button
              mode="contained"
              onPress={handleTestFirebase}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}>
              Testar Firebase
            </Button>
            <Button
              mode="outlined"
              onPress={handleShowAppInfo}
              style={styles.button}>
              Informações do App
            </Button>
          </Card.Content>
        </Card>

        {/* Offline Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Status da Conexão</Title>
            <OfflineStatus
              showDetails={true}
              showControls={true}
              style={styles.offlineStatus}
            />
            {!isOnline && (
              <View style={styles.offlineInfo}>
                <Text style={styles.offlineText}>
                  📱 Modo offline ativo
                </Text>
                {hasPendingActions && (
                  <Text style={styles.offlineText}>
                    ⏳ Ações serão sincronizadas quando voltar online
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Realtime Status Card */}
        {isOnline && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Status em Tempo Real</Title>
              <RealtimeStatus
                showControls={true}
                showOnlineUsers={true}
                style={styles.realtimeStatus}
              />
              {isConnected && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statText}>
                    📦 {stats.totalBoxesOpened} caixas abertas hoje
                  </Text>
                  <Text style={styles.statText}>
                    👥 {onlineUsers.count} usuários online
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Live Events Card */}
        {isConnected && events.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Eventos ao Vivo</Title>
              <LiveEventsFeed
                maxEvents={3}
                showHeader={false}
                style={styles.liveEvents}
              />
            </Card.Content>
          </Card>
        )}

        {/* Live Stock Updates */}
        {isConnected && (
          <Card style={styles.card}>
            <Card.Content>
              <LiveStockUpdates maxItems={3} />
            </Card.Content>
          </Card>
        )}

        {/* Live New Releases */}
        {isConnected && (
          <Card style={styles.card}>
            <Card.Content>
              <LiveNewReleases
                maxItems={2}
                onBoxPress={(boxId) => {
                  console.log('Navigate to box:', boxId);
                  // navigation.navigate('BoxDetails', { boxId });
                }}
              />
            </Card.Content>
          </Card>
        )}

        {/* Analytics Dashboard (Debug only) */}
        {__DEV__ && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Analytics Dashboard (Debug)</Title>
              <AnalyticsDashboard />
            </Card.Content>
          </Card>
        )}

        {/* Performance Dashboard (Debug only) */}
        {__DEV__ && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Performance Dashboard (Debug)</Title>
              <Text style={styles.performanceInfo}>
                Renders: {metrics.renderCount} | Tempo: {metrics.renderTime}ms
              </Text>
              <PerformanceDashboard />
            </Card.Content>
          </Card>
        )}

        {/* Configuration Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Configuração</Title>
            <Paragraph>
              API Base URL: {env.API_BASE_URL}
            </Paragraph>
            <Paragraph>
              Socket URL: {env.SOCKET_URL}
            </Paragraph>
            <Paragraph>
              Firebase Project: {env.FIREBASE_PROJECT_ID}
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusValue: {
    color: '#666',
  },
  statusSuccess: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusError: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  offlineStatus: {
    marginVertical: 8,
  },
  offlineInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  offlineText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  realtimeStatus: {
    marginVertical: 8,
  },
  statsContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  liveEvents: {
    maxHeight: 200,
    marginTop: 8,
  },
  performanceInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});

export default HomeScreen;
