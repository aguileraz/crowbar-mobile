import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Dialog,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  // FadeInDown,
  FadeInUp,
  // useSharedValue,
  // useAnimatedStyle,
  // withSpring,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Componentes de Gamificação
import DailyChallenges from '../../components/DailyChallenges';
import StreakTracker from '../../components/StreakTracker';
import DailySpinWheel from '../../components/DailySpinWheel';
import _AnimatedEmoji, { FloatingEmojiReaction } from '../../components/AnimatedEmoji';
import CountdownTimer from '../../components/CountdownTimer';

// Hooks e Serviços
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { hapticFeedback } from '../../utils/haptic';
import gamifiedNotificationService from '../../services/gamifiedNotificationService';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GamificationHubScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GamificationHub'>;

interface Props {
  navigation: GamificationHubScreenNavigationProp;
}

/**
 * Tela Central de Gamificação
 * Concentra todos os elementos de gamificação em um único lugar
 */
const GamificationHubScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const _dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  
  // Estados
  const [refreshing, setRefreshing] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<string>('');
  const [emojiReactions, setEmojiReactions] = useState<any[]>([]);
  
  // Animações
  const headerScale = useSharedValue(1);
  
  // Mock de dados (substituir por dados reais do Redux/API)
  const [stats, setStats] = useState({
    level: 15,
    currentXP: 1250,
    nextLevelXP: 2000,
    totalPoints: 5420,
    rank: 42,
    availableRewards: 3,
    dailySpinsLeft: 2,
    nextEventIn: new Date(Date.now() + 7200000).toISOString(), // 2 horas
  });

  useEffect(() => {
    loadGamificationData();
    checkDailyRewards();
  }, []);

  const loadGamificationData = async () => {
    // Carregar dados de gamificação
    try {
      // const response = await api.getGamificationData();
      // setStats(response.data);
    } catch (error) {
      // console.error('Erro ao carregar dados de gamificação:', error);
    }
  };

  const checkDailyRewards = async () => {
    // Verificar recompensas diárias disponíveis
    const hasNewRewards = stats.availableRewards > 0;
    if (hasNewRewards) {
      gamifiedNotificationService.show({
        id: 'daily_rewards',
        type: 'reward_available',
        title: '🎁 Recompensas Disponíveis!',
        body: `Você tem ${stats.availableRewards} recompensas esperando!`,
        priority: 'medium',
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback('impactLight');
    
    // Simular refresh
    setTimeout(() => {
      loadGamificationData();
      setRefreshing(false);
      
      // Adicionar reação de emoji
      addEmojiReaction('cool');
    }, 1500);
  };

  const addEmojiReaction = (type: 'fire' | 'cool' | 'beijo') => {
    const id = `${Date.now()}-${Math.random()}`;
    const position = {
      x: Math.random() * SCREEN_WIDTH - 32,
      y: 100 + Math.random() * 200,
    };
    
    setEmojiReactions(prev => [...prev, { id, type, position }]);
    
    setTimeout(() => {
      setEmojiReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const handleSpinWheel = () => {
    if (stats.dailySpinsLeft > 0) {
      setShowSpinWheel(true);
      hapticFeedback('impactMedium');
    } else {
      hapticFeedback('notificationError');
      showInfoMessage('Você não tem mais giros disponíveis hoje!');
    }
  };

  const handleWheelReward = (_reward: any) => {
    // Processar recompensa da roda
    addEmojiReaction('fire');
    
    // Atualizar stats
    setStats(prev => ({
      ...prev,
      dailySpinsLeft: prev.dailySpinsLeft - 1,
    }));
  };

  const showInfoMessage = (message: string) => {
    setSelectedInfo(message);
    setShowInfoDialog(true);
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

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
        {/* Header Gamificado */}
        <Animated.View
          entering={FadeInDown}
          style={[styles.header, animatedHeaderStyle]}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Olá, {user?.displayName || 'Jogador'}!</Text>
                <Text style={styles.levelText}>Nível {stats.level} • Rank #{stats.rank}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <Text style={styles.xpText}>{stats.currentXP}/{stats.nextLevelXP} XP</Text>
                <View style={styles.xpBar}>
                  <View 
                    style={[
                      styles.xpProgress,
                      { width: `${(stats.currentXP / stats.nextLevelXP) * 100}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
            
            {/* Pontos totais */}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>Pontos Totais</Text>
              <Text style={styles.pointsValue}>⭐ {stats.totalPoints.toLocaleString('pt-BR')}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Próximo Evento */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.eventCard}>
            <Card.Content>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>🎯 Próximo Evento</Text>
                <CountdownTimer
                  endDate={stats.nextEventIn}
                  variant="compact"
                  urgencyLevel="medium"
                />
              </View>
              <Text style={styles.eventDescription}>
                Torneio Semanal de Mystery Boxes
              </Text>
              <Text style={styles.eventReward}>
                Prêmio: 1000 XP + Caixa Lendária
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Streak Tracker */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <StreakTracker
          />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.actionGrid}>
            {/* Roda da Sorte */}
            <Card style={styles.actionCard} onPress={handleSpinWheel}>
              <LinearGradient
                colors={['#FFD700', '#FFA000']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎰</Text>
                <Text style={styles.actionTitle}>Girar Roda</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.dailySpinsLeft} giros restantes
                </Text>
              </LinearGradient>
            </Card>
            
            {/* Leaderboard */}
            <Card
              style={styles.actionCard}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <LinearGradient
                colors={['#4CAF50', '#8BC34A']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🏆</Text>
                <Text style={styles.actionTitle}>Ranking</Text>
                <Text style={styles.actionSubtitle}>Posição #{stats.rank}</Text>
              </LinearGradient>
            </Card>
            
            {/* Recompensas */}
            <Card
              style={styles.actionCard}
              onPress={() => navigation.navigate('Rewards')}
            >
              <LinearGradient
                colors={['#E91E63', '#F06292']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎁</Text>
                <Text style={styles.actionTitle}>Recompensas</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.availableRewards} disponíveis
                </Text>
              </LinearGradient>
            </Card>
            
            {/* Conquistas */}
            <Card
              style={styles.actionCard}
              onPress={() => navigation.navigate('Achievements')}
            >
              <LinearGradient
                colors={['#9C27B0', '#BA68C8']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🏅</Text>
                <Text style={styles.actionTitle}>Conquistas</Text>
                <Text style={styles.actionSubtitle}>Ver todas</Text>
              </LinearGradient>
            </Card>
          </View>
        </Animated.View>

        {/* Desafios Diários */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Text style={styles.sectionTitle}>Desafios do Dia</Text>
          <DailyChallenges
            onChallengePress={(_challenge) => {
              hapticFeedback('impactLight');
            }}
            onClaimReward={(_challenge) => {
              addEmojiReaction('fire');
            }}
          />
        </Animated.View>

        {/* Estatísticas */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
          
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📦</Text>
                  <Text style={styles.statValue}>234</Text>
                  <Text style={styles.statLabel}>Caixas Abertas</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🎯</Text>
                  <Text style={styles.statValue}>45</Text>
                  <Text style={styles.statLabel}>Desafios Completos</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🏆</Text>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Conquistas</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>💰</Text>
                  <Text style={styles.statValue}>R$ 2.5k</Text>
                  <Text style={styles.statLabel}>Total Gasto</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Espaço para FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB Menu */}
      <FAB.Group
        open={false}
        icon="gamepad-variant"
        actions={[
          {
            icon: 'help-circle',
            label: 'Como funciona',
            onPress: () => showInfoMessage('Sistema de gamificação completo!'),
          },
          {
            icon: 'share-variant',
            label: 'Convidar amigos',
          },
        ]}
        onStateChange={() => {}}
        style={styles.fab}
      />

      {/* Modais */}
      <Portal>
        {/* Roda da Sorte */}
        <DailySpinWheel
          visible={showSpinWheel}
          onClose={() => setShowSpinWheel(false)}
          onRewardWon={handleWheelReward}
          maxDailySpins={3}
        />
        
        {/* Dialog de Informação */}
        <Dialog
          visible={showInfoDialog}
          onDismiss={() => setShowInfoDialog(false)}
        >
          <Dialog.Title>Informação</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{selectedInfo}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInfoDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Reações de Emoji */}
      {emojiReactions.map(reaction => (
        <FloatingEmojiReaction
          key={reaction.id}
          type={reaction.type}
          startPosition={reaction.position}
          onComplete={() => {
            setEmojiReactions(prev => prev.filter(r => r.id !== reaction.id));
          }}
        />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  xpContainer: {
    marginTop: 12,
  },
  xpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eventCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  eventReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    color: '#212121',
  },
  quickActions: {
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  statsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 8,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#757575',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default GamificationHubScreen;