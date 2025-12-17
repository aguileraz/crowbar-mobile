import React, {useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  _TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  DataTable,
  Chip,
  _ProgressBar,
  SegmentedButtons,
  Surface,
  IconButton,
  useTheme,
  Portal,
  Dialog,
  TextInput,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  _FadeInDown,
  FadeInUp,
  _useSharedValue,
  _useAnimatedStyle,
  _withSpring,
} from 'react-native-reanimated';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Dashboard Administrativo para Sistema de Gamificação
 * Permite gerenciar e monitorar todos os aspectos da gamificação
 */

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

const GamificationAdminScreen: React.FC = () => {
  const _theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [_selectedMetric, _setSelectedMetric] = useState('engagement');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Estados para configurações
  const [config, setConfig] = useState({
    dailySpinsLimit: 3,
    xpPerLevel: 1000,
    pointsPerPurchase: 100,
    streakFreezeEnabled: true,
    doubleXPEnabled: false,
    flashSalesEnabled: true,
  });

  // Mock de dados (substituir por API real)
  const [metrics, _setMetrics] = useState<MetricCard[]>([
    {
      title: 'Usuários Ativos',
      value: '12,543',
      change: 15.3,
      icon: 'account-group',
      color: '#4CAF50',
    },
    {
      title: 'Taxa de Engajamento',
      value: '68.4%',
      change: 8.2,
      icon: 'chart-line',
      color: '#2196F3',
    },
    {
      title: 'Desafios Completos',
      value: '45,678',
      change: 22.5,
      icon: 'trophy',
      color: '#FF9800',
    },
    {
      title: 'Conversão com Timer',
      value: '42.7%',
      change: 35.8,
      icon: 'timer',
      color: '#9C27B0',
    },
  ]);

  const [topUsers] = useState([
    { id: '1', name: 'João Silva', level: 45, points: 15420, streak: 89 },
    { id: '2', name: 'Maria Santos', level: 42, points: 14200, streak: 67 },
    { id: '3', name: 'Pedro Costa', level: 38, points: 12800, streak: 45 },
    { id: '4', name: 'Ana Lima', level: 36, points: 11500, streak: 34 },
    { id: '5', name: 'Carlos Dias', level: 35, points: 10900, streak: 28 },
  ]);

  const [challenges] = useState([
    { id: '1', title: 'Primeira Compra', type: 'daily', completions: 234, active: true },
    { id: '2', title: 'Abrir 5 Caixas', type: 'weekly', completions: 156, active: true },
    { id: '3', title: 'Compartilhar', type: 'daily', completions: 89, active: false },
    { id: '4', title: 'Super Gastador', type: 'special', completions: 12, active: true },
  ]);

  // Dados dos gráficos
  const engagementData: ChartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [65, 68, 70, 72, 69, 74, 78],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const conversionData: ChartData = {
    labels: ['Sem Timer', 'Com Timer'],
    datasets: [
      {
        data: [28.5, 42.7],
      },
    ],
  };

  const spinWheelData = [
    {
      name: 'XP',
      population: 35,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Moedas',
      population: 30,
      color: '#2196F3',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Desconto',
      population: 20,
      color: '#FF9800',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Caixa',
      population: 10,
      color: '#9C27B0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Outros',
      population: 5,
      color: '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simular refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleSaveConfig = () => {
    // Salvar configurações via API
    setShowConfigDialog(false);
  };

  const handleUserAction = (_action: string, _userId: string) => {
    // Implementar ações do usuário
  };

  const renderMetricCard = (metric: MetricCard, index: number) => (
    <Animated.View
      key={index}
      entering={FadeInUp.delay(index * 100)}
      style={styles.metricCard}
    >
      <Card>
        <Card.Content>
          <View style={styles.metricHeader}>
            <IconButton
              icon={metric.icon}
              size={24}
              iconColor={metric.color}
            />
            <Chip
              mode="flat"
              textStyle={styles.changeChip}
              style={[
                styles.changeChipContainer,
                { backgroundColor: metric.change > 0 ? '#E8F5E9' : '#FFEBEE' }
              ]}
            >
              {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
            </Chip>
          </View>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricTitle}>{metric.title}</Text>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Dashboard de Gamificação</Text>
          <Text style={styles.headerSubtitle}>Monitoramento em Tempo Real</Text>
        </LinearGradient>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'today', label: 'Hoje' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'year', label: 'Ano' },
            ]}
          />
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => renderMetricCard(metric, index))}
        </View>

        {/* Engagement Chart */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.chartCard}>
            <Card.Title title="Taxa de Engajamento" subtitle="Últimos 7 dias" />
            <Card.Content>
              <LineChart
                data={engagementData}
                width={SCREEN_WIDTH - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Conversion Comparison */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <Card style={styles.chartCard}>
            <Card.Title title="Impacto dos Timers" subtitle="Taxa de conversão" />
            <Card.Content>
              <BarChart
                data={conversionData}
                width={SCREEN_WIDTH - 48}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="%"
              />
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Spin Wheel Distribution */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Card style={styles.chartCard}>
            <Card.Title title="Distribuição de Recompensas" subtitle="Roda da Sorte" />
            <Card.Content>
              <PieChart
                data={spinWheelData}
                width={SCREEN_WIDTH - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Top Users Table */}
        <Animated.View entering={FadeInUp.delay(700)}>
          <Card style={styles.tableCard}>
            <Card.Title 
              title="Top Jogadores" 
              subtitle="Ranking geral"
              right={(props) => (
                <Button {...props} mode="text" onPress={() => {}}>
                  Ver Todos
                </Button>
              )}
            />
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Nome</DataTable.Title>
                <DataTable.Title numeric>Nível</DataTable.Title>
                <DataTable.Title numeric>Pontos</DataTable.Title>
                <DataTable.Title numeric>Streak</DataTable.Title>
                <DataTable.Title>Ações</DataTable.Title>
              </DataTable.Header>

              {topUsers.map((user) => (
                <DataTable.Row key={user.id}>
                  <DataTable.Cell>{user.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{user.level}</DataTable.Cell>
                  <DataTable.Cell numeric>{user.points.toLocaleString()}</DataTable.Cell>
                  <DataTable.Cell numeric>{user.streak}</DataTable.Cell>
                  <DataTable.Cell>
                    <IconButton
                      icon="eye"
                      size={20}
                      onPress={() => {
                        setSelectedUser(user);
                        setShowUserDialog(true);
                      }}
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card>
        </Animated.View>

        {/* Active Challenges */}
        <Animated.View entering={FadeInUp.delay(800)}>
          <Card style={styles.tableCard}>
            <Card.Title 
              title="Desafios Ativos" 
              subtitle="Gerenciar desafios"
              right={(props) => (
                <Button {...props} mode="text" onPress={() => {}}>
                  Criar Novo
                </Button>
              )}
            />
            <Card.Content>
              {challenges.map((challenge) => (
                <Surface key={challenge.id} style={styles.challengeItem}>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <View style={styles.challengeTags}>
                      <Chip compact style={styles.challengeChip}>
                        {challenge.type}
                      </Chip>
                      <Chip compact style={styles.challengeChip}>
                        {challenge.completions} completos
                      </Chip>
                    </View>
                  </View>
                  <Switch
                    value={challenge.active}
                    onValueChange={(_value) => {
                      // Toggle challenge
                    }}
                  />
                </Surface>
              ))}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="cog"
            onPress={() => setShowConfigDialog(true)}
            style={styles.actionButton}
          >
            Configurações
          </Button>
          <Button
            mode="contained"
            icon="bullhorn"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Enviar Notificação
          </Button>
        </View>

        {/* Extra spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Configuration Dialog */}
      <Portal>
        <Dialog visible={showConfigDialog} onDismiss={() => setShowConfigDialog(false)}>
          <Dialog.Title>Configurações de Gamificação</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Limite de Giros Diários"
              value={config.dailySpinsLimit.toString()}
              onChangeText={(text) => setConfig({
                ...config,
                dailySpinsLimit: parseInt(text, 10) || 0
              })}
              keyboardType="numeric"
              style={styles.configInput}
            />
            <TextInput
              label="XP por Nível"
              value={config.xpPerLevel.toString()}
              onChangeText={(text) => setConfig({
                ...config,
                xpPerLevel: parseInt(text, 10) || 0
              })}
              keyboardType="numeric"
              style={styles.configInput}
            />
            <TextInput
              label="Pontos por Compra"
              value={config.pointsPerPurchase.toString()}
              onChangeText={(text) => setConfig({
                ...config,
                pointsPerPurchase: parseInt(text, 10) || 0
              })}
              keyboardType="numeric"
              style={styles.configInput}
            />
            <View style={styles.switchRow}>
              <Text>Freeze de Streak</Text>
              <Switch
                value={config.streakFreezeEnabled}
                onValueChange={(value) => setConfig({
                  ...config,
                  streakFreezeEnabled: value
                })}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>XP Dobrado (Evento)</Text>
              <Switch
                value={config.doubleXPEnabled}
                onValueChange={(value) => setConfig({
                  ...config,
                  doubleXPEnabled: value
                })}
              />
            </View>
            <View style={styles.switchRow}>
              <Text>Flash Sales</Text>
              <Switch
                value={config.flashSalesEnabled}
                onValueChange={(value) => setConfig({
                  ...config,
                  flashSalesEnabled: value
                })}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfigDialog(false)}>Cancelar</Button>
            <Button onPress={handleSaveConfig}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog visible={showUserDialog} onDismiss={() => setShowUserDialog(false)}>
          <Dialog.Title>Detalhes do Usuário</Dialog.Title>
          <Dialog.Content>
            {selectedUser && (
              <View>
                <Text style={styles.userDetailLabel}>Nome: {selectedUser.name}</Text>
                <Text style={styles.userDetailLabel}>Nível: {selectedUser.level}</Text>
                <Text style={styles.userDetailLabel}>Pontos: {selectedUser.points}</Text>
                <Text style={styles.userDetailLabel}>Streak: {selectedUser.streak} dias</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleUserAction('reward', selectedUser?.id)}>
              Dar Recompensa
            </Button>
            <Button onPress={() => handleUserAction('reset', selectedUser?.id)}>
              Resetar Streak
            </Button>
            <Button onPress={() => setShowUserDialog(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  periodSelector: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#757575',
  },
  changeChip: {
    fontSize: 11,
  },
  changeChipContainer: {
    height: 24,
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
  },
  tableCard: {
    margin: 16,
    marginTop: 8,
  },
  challengeItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  challengeTags: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeChip: {
    height: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  configInput: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userDetailLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default GamificationAdminScreen;