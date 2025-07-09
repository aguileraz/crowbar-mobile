import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Surface,
  useTheme,
  Button,
  Chip,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { analyticsService } from '../services/analyticsService';

const { width: screenWidth } = Dimensions.get('window');

interface PerformanceMetric {
  timestamp: number;
  value: number;
}

/**
 * Monitor de Performance em Tempo Real
 * Exibe métricas de performance do app com gráficos dinâmicos
 */
const PerformanceMonitor: React.FC = () => {
  const theme = useTheme();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [fps, setFps] = useState<PerformanceMetric[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<PerformanceMetric[]>([]);
  const [networkLatency, setNetworkLatency] = useState<PerformanceMetric[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkType, setNetworkType] = useState<string>('Unknown');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Redux state
  const performanceMetrics = useSelector((state: RootState) => state.analytics.performanceMetrics);
  const apiCallsInProgress = useSelector((state: RootState) => state.analytics.apiCallsInProgress || 0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Iniciar monitoramento
   */
  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Simular coleta de métricas (em produção, usar react-native-performance)
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // FPS simulado (em produção, usar InteractionManager)
      const newFps = 50 + Math.random() * 10;
      setFps(prev => [...prev.slice(-19), { timestamp: now, value: newFps }]);
      
      // Uso de memória simulado
      const newMemory = 100 + Math.random() * 50;
      setMemoryUsage(prev => [...prev.slice(-19), { timestamp: now, value: newMemory }]);
      
      // Latência de rede baseada em métricas reais
      const avgLatency = calculateAverageLatency();
      setNetworkLatency(prev => [...prev.slice(-19), { timestamp: now, value: avgLatency }]);
      
      // Enviar métricas para analytics
      analyticsService.trackAppPerformance({
        fps: newFps,
        memory_usage: newMemory,
        battery_level: batteryLevel || undefined,
        network_type: networkType,
      });
    }, 1000);
  };

  /**
   * Parar monitoramento
   */
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /**
   * Calcular latência média
   */
  const calculateAverageLatency = (): number => {
    const allTimes = Object.values(performanceMetrics.apiResponseTimes).flat();
    if (allTimes.length === 0) return 0;
    return allTimes.slice(-10).reduce((sum, time) => sum + time, 0) / Math.min(allTimes.length, 10);
  };

  /**
   * Renderizar mini gráfico
   */
  const renderMiniChart = (data: PerformanceMetric[], color: string, maxValue: number) => {
    if (data.length === 0) return null;
    
    const chartWidth = screenWidth - 64;
    const chartHeight = 60;
    const barWidth = chartWidth / 20;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((metric, index) => {
            const height = (metric.value / maxValue) * chartHeight;
            return (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height,
                    width: barWidth - 2,
                    backgroundColor: color,
                    opacity: 0.3 + (index / data.length) * 0.7,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  /**
   * Obter cor baseada no valor
   */
  const getColorForValue = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return theme.colors.primary;
    if (value >= thresholds.warning) return theme.colors.secondary;
    return theme.colors.error;
  };

  /**
   * Calcular estatísticas
   */
  const calculateStats = (data: PerformanceMetric[]) => {
    if (data.length === 0) return { current: 0, avg: 0, min: 0, max: 0 };
    
    const values = data.map(d => d.value);
    const current = values[values.length - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { current, avg, min, max };
  };

  const fpsStats = calculateStats(fps);
  const memoryStats = calculateStats(memoryUsage);
  const latencyStats = calculateStats(networkLatency);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Controle de Monitoramento */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.controlHeader}>
            <Title>Monitor de Performance</Title>
            <Button
              mode={isMonitoring ? 'outlined' : 'contained'}
              onPress={isMonitoring ? stopMonitoring : startMonitoring}
              icon={isMonitoring ? 'pause' : 'play'}
            >
              {isMonitoring ? 'Parar' : 'Iniciar'}
            </Button>
          </View>
          
          {isMonitoring && (
            <View style={styles.statusRow}>
              <Chip 
                icon="circle" 
                style={styles.statusChip}
                textStyle={{ color: theme.colors.primary }}
              >
                Monitorando...
              </Chip>
              <Text variant="bodySmall">
                APIs em progresso: {apiCallsInProgress}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* FPS Monitor */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitle}>
              <MaterialCommunityIcons 
                name="speedometer" 
                size={24} 
                color={getColorForValue(fpsStats.current, { good: 55, warning: 45 })}
              />
              <Title style={styles.metricName}>FPS (Frames por Segundo)</Title>
            </View>
            <Text variant="headlineMedium" style={styles.currentValue}>
              {fpsStats.current.toFixed(0)}
            </Text>
          </View>
          
          {fps.length > 0 && (
            <>
              {renderMiniChart(fps, theme.colors.primary, 60)}
              
              <View style={styles.statsRow}>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Média</Text>
                  <Text variant="titleMedium">{fpsStats.avg.toFixed(1)}</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Mínimo</Text>
                  <Text variant="titleMedium">{fpsStats.min.toFixed(1)}</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Máximo</Text>
                  <Text variant="titleMedium">{fpsStats.max.toFixed(1)}</Text>
                </Surface>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Memory Monitor */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitle}>
              <MaterialCommunityIcons 
                name="memory" 
                size={24} 
                color={getColorForValue(150 - memoryStats.current, { good: 50, warning: 25 })}
              />
              <Title style={styles.metricName}>Uso de Memória (MB)</Title>
            </View>
            <Text variant="headlineMedium" style={styles.currentValue}>
              {memoryStats.current.toFixed(0)}
            </Text>
          </View>
          
          {memoryUsage.length > 0 && (
            <>
              {renderMiniChart(memoryUsage, theme.colors.secondary, 200)}
              
              <View style={styles.statsRow}>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Média</Text>
                  <Text variant="titleMedium">{memoryStats.avg.toFixed(0)} MB</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Mínimo</Text>
                  <Text variant="titleMedium">{memoryStats.min.toFixed(0)} MB</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Máximo</Text>
                  <Text variant="titleMedium">{memoryStats.max.toFixed(0)} MB</Text>
                </Surface>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Network Latency Monitor */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitle}>
              <MaterialCommunityIcons 
                name="wifi" 
                size={24} 
                color={getColorForValue(500 - latencyStats.current, { good: 400, warning: 200 })}
              />
              <Title style={styles.metricName}>Latência de Rede (ms)</Title>
            </View>
            <Text variant="headlineMedium" style={styles.currentValue}>
              {latencyStats.current.toFixed(0)}
            </Text>
          </View>
          
          {networkLatency.length > 0 && (
            <>
              {renderMiniChart(networkLatency, theme.colors.tertiary, 1000)}
              
              <View style={styles.statsRow}>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Média</Text>
                  <Text variant="titleMedium">{latencyStats.avg.toFixed(0)} ms</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Mínimo</Text>
                  <Text variant="titleMedium">{latencyStats.min.toFixed(0)} ms</Text>
                </Surface>
                <Surface style={styles.statCard}>
                  <Text variant="bodySmall">Máximo</Text>
                  <Text variant="titleMedium">{latencyStats.max.toFixed(0)} ms</Text>
                </Surface>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Informações do Sistema */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Informações do Sistema</Title>
          
          <View style={styles.systemInfo}>
            <View style={styles.infoRow}>
              <Text>Plataforma</Text>
              <Chip compact>{Platform.OS} {Platform.Version}</Chip>
            </View>
            
            <View style={styles.infoRow}>
              <Text>Tipo de Rede</Text>
              <Chip compact icon="wifi">{networkType}</Chip>
            </View>
            
            {batteryLevel !== null && (
              <View style={styles.infoRow}>
                <Text>Bateria</Text>
                <View style={styles.batteryContainer}>
                  <ProgressBar 
                    progress={batteryLevel / 100} 
                    color={batteryLevel > 20 ? theme.colors.primary : theme.colors.error}
                    style={styles.batteryBar}
                  />
                  <Text style={styles.batteryText}>{batteryLevel}%</Text>
                </View>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text>Tempo de Inicialização</Text>
              <Chip compact>
                {performanceMetrics.appStartTime ? 
                  `${performanceMetrics.appStartTime}ms` : 
                  'N/A'
                }
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Dicas de Performance */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Dicas de Otimização</Title>
          
          {fpsStats.avg < 50 && (
            <View style={styles.tip}>
              <MaterialCommunityIcons 
                name="alert" 
                size={20} 
                color={theme.colors.error} 
              />
              <Text style={styles.tipText}>
                FPS baixo detectado. Considere reduzir animações ou otimizar renderizações.
              </Text>
            </View>
          )}
          
          {memoryStats.avg > 150 && (
            <View style={styles.tip}>
              <MaterialCommunityIcons 
                name="alert" 
                size={20} 
                color={theme.colors.error} 
              />
              <Text style={styles.tipText}>
                Alto uso de memória. Verifique vazamentos de memória ou cache excessivo.
              </Text>
            </View>
          )}
          
          {latencyStats.avg > 500 && (
            <View style={styles.tip}>
              <MaterialCommunityIcons 
                name="alert" 
                size={20} 
                color={theme.colors.error} 
              />
              <Text style={styles.tipText}>
                Alta latência de rede. Considere implementar cache ou otimizar chamadas de API.
              </Text>
            </View>
          )}
          
          {fpsStats.avg >= 50 && memoryStats.avg <= 150 && latencyStats.avg <= 500 && (
            <View style={styles.tip}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.tipText}>
                Performance está ótima! Continue monitorando para manter a qualidade.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    backgroundColor: 'rgba(0, 150, 0, 0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricName: {
    fontSize: 16,
    marginLeft: 8,
  },
  currentValue: {
    fontWeight: 'bold',
  },
  chartContainer: {
    marginVertical: 16,
  },
  chart: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
    elevation: 1,
  },
  systemInfo: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 150,
  },
  batteryBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  batteryText: {
    marginLeft: 8,
    minWidth: 40,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
});

export default PerformanceMonitor;