import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  Dimensions,
  RefreshControl 
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  SegmentedButtons,
  Chip,
  IconButton,
  ActivityIndicator,
  FAB,
  useTheme,
} from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/hooks';
import { hapticFeedback } from '../../utils/haptic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  level: number;
  boxesOpened: number;
  totalSpent: number;
  streak: number;
  badges: string[];
  isCurrentUser?: boolean;
  previousRank?: number;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'allTime';
type Category = 'score' | 'boxes' | 'spending' | 'streaks';

const LeaderboardScreen: React.FC = () => {
  const _theme = useTheme();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [timeframe, setTimeframe] = useState<TimeFrame>('weekly');
  const [category, setCategory] = useState<Category>('score');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock de dados do leaderboard
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([
    {
      id: '1',
      name: 'João Silva',
      avatar: 'https://i.pravatar.cc/150?img=1',
      score: 15420,
      level: 42,
      boxesOpened: 234,
      totalSpent: 4500,
      streak: 15,
      badges: ['🏆', '⭐', '🔥'],
      previousRank: 2,
    },
    {
      id: '2',
      name: 'Maria Santos',
      avatar: 'https://i.pravatar.cc/150?img=2',
      score: 14200,
      level: 38,
      boxesOpened: 198,
      totalSpent: 3800,
      streak: 12,
      badges: ['💎', '🌟'],
      previousRank: 1,
    },
    {
      id: '3',
      name: 'Pedro Costa',
      avatar: 'https://i.pravatar.cc/150?img=3',
      score: 13500,
      level: 35,
      boxesOpened: 176,
      totalSpent: 3200,
      streak: 8,
      badges: ['🥉'],
      previousRank: 4,
    },
    {
      id: '4',
      name: currentUser?.displayName || 'Você',
      avatar: currentUser?.photoURL || 'https://i.pravatar.cc/150?img=4',
      score: 12800,
      level: 33,
      boxesOpened: 156,
      totalSpent: 2900,
      streak: 10,
      badges: ['🎯'],
      isCurrentUser: true,
      previousRank: 6,
    },
    // Adicionar mais usuários...
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 5}`,
      name: `Usuário ${i + 5}`,
      avatar: `https://i.pravatar.cc/150?img=${i + 5}`,
      score: 12000 - (i * 200),
      level: 30 - i,
      boxesOpened: 150 - (i * 5),
      totalSpent: 2500 - (i * 100),
      streak: Math.max(1, 7 - i),
      badges: i < 5 ? ['🌟'] : [],
      previousRank: i + 7,
    })),
  ]);

  // Animações para o pódio
  const podiumAnimation = useSharedValue(0);
  const crownAnimation = useSharedValue(0);

  useEffect(() => {
    podiumAnimation.value = withSpring(1);
    crownAnimation.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  // Estilos animados do pódio
  const animatedPodiumStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          podiumAnimation.value,
          [0, 1],
          [200, 0]
        ),
      },
    ],
    opacity: podiumAnimation.value,
  }));

  const animatedCrownStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: interpolate(
          crownAnimation.value,
          [0, 1],
          [-5, 5],
        ) + 'deg',
      },
    ],
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    hapticFeedback('impactLight');
    // Simular refresh
    setTimeout(() => {
      setRefreshing(false);
      // Embaralhar rankings para simular mudanças
      setLeaderboardData(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 1500);
  };

  const getRankChange = (user: LeaderboardUser, currentRank: number) => {
    if (!user.previousRank) return null;
    const change = user.previousRank - currentRank;
    
    if (change > 0) return { icon: '↑', color: '#4CAF50', value: change };
    if (change < 0) return { icon: '↓', color: '#F44336', value: Math.abs(change) };
    return { icon: '−', color: '#9E9E9E', value: 0 };
  };

  const getCategoryValue = (user: LeaderboardUser) => {
    switch (category) {
      case 'boxes': return user.boxesOpened;
      case 'spending': return user.totalSpent;
      case 'streaks': return user.streak;
      default: return user.score;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'boxes': return 'Caixas Abertas';
      case 'spending': return 'Total Gasto';
      case 'streaks': return 'Dias Seguidos';
      default: return 'Pontuação';
    }
  };

  const formatValue = (value: number) => {
    if (category === 'spending') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }
    if (category === 'streaks') {
      return `${value} dias`;
    }
    return value.toLocaleString('pt-BR');
  };

  // Componente do Pódio (Top 3)
  const renderPodium = () => {
    const top3 = leaderboardData.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2º, 1º, 3º
    const heights = [120, 150, 100];
    const medals = ['🥈', '🥇', '🥉'];
    const positions = [2, 1, 3];

    // Usa os estilos animados declarados no nível do componente

    return (
      <Card style={styles.podiumCard}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.podiumGradient}
        >
          <Text style={styles.podiumTitle}>🏆 Top 3 {getCategoryLabel()}</Text>

          <View style={styles.podiumContainer}>
            {podiumOrder.map((user, index) => {
              if (!user) return null;

              return (
                <Animated.View
                  key={user.id}
                  style={[
                    styles.podiumItem,
                    animatedPodiumStyle,
                    { flex: index === 1 ? 1.2 : 1 },
                  ]}
                  entering={FadeInDown.delay(index * 200)}
                >
                  {/* Coroa para o 1º lugar */}
                  {index === 1 && (
                    <Animated.Text style={[styles.crown, animatedCrownStyle]}>
                      👑
                    </Animated.Text>
                  )}
                  
                  {/* Avatar */}
                  <View style={styles.podiumAvatarContainer}>
                    <Avatar.Image
                      size={index === 1 ? 80 : 64}
                      source={{ uri: user.avatar }}
                      style={[
                        styles.podiumAvatar,
                        user.isCurrentUser && styles.currentUserAvatar,
                      ]}
                    />
                    <Text style={styles.medal}>{medals[index]}</Text>
                  </View>
                  
                  {/* Nome */}
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {user.name}
                  </Text>
                  
                  {/* Valor */}
                  <Text style={styles.podiumScore}>
                    {formatValue(getCategoryValue(user))}
                  </Text>
                  
                  {/* Pódio visual */}
                  <LinearGradient
                    colors={
                      index === 1
                        ? ['#FFD700', '#FFA000']
                        : index === 0
                        ? ['#C0C0C0', '#9E9E9E']
                        : ['#CD7F32', '#8D6E63']
                    }
                    style={[styles.podiumBase, { height: heights[index] }]}
                  >
                    <Text style={styles.podiumPosition}>{positions[index]}</Text>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
        </LinearGradient>
      </Card>
    );
  };

  // Renderizar item da lista
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const rank = index + 4; // Começar do 4º (top 3 no pódio)
    const rankChange = getRankChange(item, rank);
    const value = getCategoryValue(item);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Card
          style={[
            styles.leaderboardItem,
            item.isCurrentUser && styles.currentUserItem,
          ]}
        >
          <Card.Content style={styles.itemContent}>
            {/* Rank */}
            <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>{rank}</Text>
              {rankChange && rankChange.value !== 0 && (
                <View style={[styles.rankChange, { backgroundColor: rankChange.color }]}>
                  <Text style={styles.rankChangeText}>
                    {rankChange.icon}{rankChange.value}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Avatar e Info */}
            <View style={styles.userInfo}>
              <Avatar.Image
                size={48}
                source={{ uri: item.avatar }}
                style={item.isCurrentUser && styles.currentUserAvatar}
              />
              
              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {item.name}
                    {item.isCurrentUser && ' (Você)'}
                  </Text>
                  {item.badges.length > 0 && (
                    <View style={styles.badges}>
                      {item.badges.slice(0, 3).map((badge, i) => (
                        <Text key={i} style={styles.badge}>{badge}</Text>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.statsRow}>
                  <Chip compact style={styles.statChip}>
                    Nível {item.level}
                  </Chip>
                  {item.streak > 7 && (
                    <Chip compact style={[styles.statChip, styles.streakChip]}>
                      🔥 {item.streak}
                    </Chip>
                  )}
                </View>
              </View>
            </View>
            
            {/* Score */}
            <Text style={[styles.itemScore, item.isCurrentUser && styles.currentUserScore]}>
              {formatValue(value)}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  // Posição do usuário atual
  const currentUserPosition = leaderboardData.findIndex(u => u.isCurrentUser) + 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Ranking</Text>
          <Text style={styles.subtitle}>
            Sua posição: #{currentUserPosition}
          </Text>
        </View>

        {/* Filtros de Período */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeframeContainer}
        >
          <SegmentedButtons
            value={timeframe}
            onValueChange={(value) => {
              setTimeframe(value as TimeFrame);
              hapticFeedback('impactLight');
            }}
            buttons={[
              { value: 'daily', label: 'Hoje' },
              { value: 'weekly', label: 'Semana' },
              { value: 'monthly', label: 'Mês' },
              { value: 'allTime', label: 'Geral' },
            ]}
            style={styles.segmentedButtons}
          />
        </ScrollView>

        {/* Filtros de Categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {(['score', 'boxes', 'spending', 'streaks'] as Category[]).map((cat) => (
            <Chip
              key={cat}
              mode={category === cat ? 'flat' : 'outlined'}
              onPress={() => {
                setCategory(cat);
                hapticFeedback('impactLight');
              }}
              style={[
                styles.categoryChip,
                category === cat && styles.categoryChipActive,
              ]}
              textStyle={styles.categoryChipText}
            >
              {cat === 'score' && '⭐ Pontos'}
              {cat === 'boxes' && '📦 Caixas'}
              {cat === 'spending' && '💰 Gastos'}
              {cat === 'streaks' && '🔥 Sequência'}
            </Chip>
          ))}
        </ScrollView>

        {/* Pódio Top 3 */}
        {renderPodium()}

        {/* Lista do Ranking */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Ranking Completo</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <>
              {leaderboardData.slice(3).map((item, index) => 
                renderLeaderboardItem({ item, index })
              )}
            </>
          )}
        </View>

        {/* Legenda */}
        <Card style={styles.legendCard}>
          <Card.Content>
            <Text style={styles.legendTitle}>📊 Como funciona</Text>
            <Text style={styles.legendText}>
              • Ganhe pontos abrindo caixas e completando desafios
            </Text>
            <Text style={styles.legendText}>
              • Mantenha sua sequência diária para bônus extras
            </Text>
            <Text style={styles.legendText}>
              • Suba de nível para desbloquear recompensas exclusivas
            </Text>
            <Text style={styles.legendText}>
              • O ranking é atualizado em tempo real
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB para compartilhar posição */}
      <FAB
        icon="share-variant"
        style={styles.fab}
        onPress={() => {
          hapticFeedback('impactMedium');
          // Implementar compartilhamento
        }}
        label="Compartilhar"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  timeframeContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  segmentedButtons: {
    width: SCREEN_WIDTH - 40,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 12,
  },
  podiumCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  podiumGradient: {
    padding: 20,
  },
  podiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  podiumItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  crown: {
    fontSize: 32,
    position: 'absolute',
    top: -35,
    zIndex: 1,
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatar: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  currentUserAvatar: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  medal: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    fontSize: 24,
  },
  podiumName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumScore: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPosition: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#424242',
  },
  leaderboardItem: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
  },
  rankChange: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  rankChangeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    fontSize: 14,
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statChip: {
    height: 20,
    marginRight: 6,
  },
  streakChip: {
    backgroundColor: '#FFF3E0',
  },
  itemScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    marginRight: 8,
  },
  currentUserScore: {
    color: '#4CAF50',
  },
  loader: {
    marginVertical: 40,
  },
  legendCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#424242',
  },
  legendText: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6366F1',
  },
});

export default LeaderboardScreen;