import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Card, 
  Text, 
  ProgressBar, 
  Button, 
  IconButton,
  Chip,
  useTheme 
} from 'react-native-paper';
import Animated, { 
  FadeInDown, 
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  ZoomIn
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import CountdownTimer from './CountdownTimer';
import { hapticFeedback } from '../utils/haptic';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'purchase' | 'open_boxes' | 'share' | 'review' | 'login' | 'explore';
  category: 'daily' | 'weekly' | 'special';
  target: number;
  current: number;
  reward: {
    type: 'xp' | 'discount' | 'free_box' | 'coins' | 'badge';
    value: number | string;
    label: string;
  };
  expires_at: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted: boolean;
  isClaimed: boolean;
}

interface DailyChallengesProps {
  challenges?: Challenge[];
  onChallengePress?: (challenge: Challenge) => void;
  onClaimReward?: (challenge: Challenge) => void;
}

const DailyChallenges: React.FC<DailyChallengesProps> = ({
  challenges: propChallenges,
  onChallengePress,
  onClaimReward,
}) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');
  
  // Mock de desafios para demonstração
  const mockChallenges: Challenge[] = [
    {
      id: '1',
      title: 'Primeira Compra do Dia',
      description: 'Abra sua primeira caixa hoje',
      icon: '📦',
      type: 'open_boxes',
      category: 'daily',
      target: 1,
      current: 0,
      reward: {
        type: 'xp',
        value: 100,
        label: '+100 XP'
      },
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      difficulty: 'easy',
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: '2',
      title: 'Explorador Curioso',
      description: 'Visualize 10 caixas diferentes',
      icon: '🔍',
      type: 'explore',
      category: 'daily',
      target: 10,
      current: 3,
      reward: {
        type: 'discount',
        value: 10,
        label: '10% OFF'
      },
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      difficulty: 'medium',
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: '3',
      title: 'Compartilhador Social',
      description: 'Compartilhe 3 caixas com amigos',
      icon: '🤝',
      type: 'share',
      category: 'daily',
      target: 3,
      current: 1,
      reward: {
        type: 'coins',
        value: 50,
        label: '+50 Moedas'
      },
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      difficulty: 'easy',
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: '4',
      title: 'Colecionador Semanal',
      description: 'Abra 5 caixas esta semana',
      icon: '🏆',
      type: 'open_boxes',
      category: 'weekly',
      target: 5,
      current: 2,
      reward: {
        type: 'free_box',
        value: 'mystery_small',
        label: 'Caixa Grátis'
      },
      expires_at: new Date(Date.now() + 604800000).toISOString(),
      difficulty: 'hard',
      isCompleted: false,
      isClaimed: false,
    },
    {
      id: '5',
      title: 'Black Friday Special',
      description: 'Complete uma compra hoje',
      icon: '🎯',
      type: 'purchase',
      category: 'special',
      target: 1,
      current: 0,
      reward: {
        type: 'discount',
        value: 25,
        label: '25% OFF Extra'
      },
      expires_at: new Date(Date.now() + 43200000).toISOString(),
      difficulty: 'medium',
      isCompleted: false,
      isClaimed: false,
    },
  ];

  const challenges = propChallenges || mockChallenges;
  
  // Filtrar desafios por categoria
  const filteredChallenges = selectedCategory === 'all' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  // Calcular estatísticas
  const totalChallenges = challenges.length;
  const completedChallenges = challenges.filter(c => c.isCompleted).length;
  const progressPercentage = totalChallenges > 0 ? completedChallenges / totalChallenges : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return theme.colors.primary;
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp': return '⭐';
      case 'discount': return '🏷️';
      case 'free_box': return '🎁';
      case 'coins': return '🪙';
      case 'badge': return '🏅';
      default: return '🎯';
    }
  };

  const handleChallengePress = (challenge: Challenge) => {
    hapticFeedback('impactLight');
    onChallengePress?.(challenge);
  };

  const handleClaimReward = (challenge: Challenge) => {
    hapticFeedback('notificationSuccess');
    onClaimReward?.(challenge);
  };

  // Próximo reset dos desafios diários
  const getTomorrowMidnight = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  };

  return (
    <View style={styles.container}>
      {/* Header com estatísticas */}
      <Card style={styles.headerCard}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>🎯 Desafios do Dia</Text>
              <Text style={styles.headerSubtitle}>
                {completedChallenges}/{totalChallenges} completados
              </Text>
            </View>
            <View style={styles.headerStats}>
              <Text style={styles.statsValue}>{completedChallenges * 100}</Text>
              <Text style={styles.statsLabel}>XP Ganhos</Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={progressPercentage} 
            color="#FFFFFF"
            style={styles.progressBar}
          />
          
          <CountdownTimer
            endDate={getTomorrowMidnight()}
            label="Renovam em"
            variant="compact"
            style={styles.timer}
          />
        </LinearGradient>
      </Card>

      {/* Filtros de categoria */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['all', 'daily', 'weekly', 'special'].map((category) => (
          <Chip
            key={category}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            onPress={() => setSelectedCategory(category as any)}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipActive
            ]}
            textStyle={styles.filterChipText}
          >
            {category === 'all' ? 'Todos' : 
             category === 'daily' ? 'Diários' :
             category === 'weekly' ? 'Semanais' : 'Especiais'}
          </Chip>
        ))}
      </ScrollView>

      {/* Lista de desafios */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.challengesList}
      >
        {filteredChallenges.map((challenge, index) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            index={index}
            onPress={() => handleChallengePress(challenge)}
            onClaimReward={() => handleClaimReward(challenge)}
            getDifficultyColor={getDifficultyColor}
            getRewardIcon={getRewardIcon}
          />
        ))}
      </ScrollView>

      {/* Bônus por completar todos */}
      {completedChallenges === totalChallenges && totalChallenges > 0 && (
        <Animated.View entering={ZoomIn} style={styles.bonusCard}>
          <LinearGradient
            colors={['#FFD700', '#FFA000']}
            style={styles.bonusGradient}
          >
            <Text style={styles.bonusIcon}>🌟</Text>
            <Text style={styles.bonusTitle}>Parabéns!</Text>
            <Text style={styles.bonusText}>
              Você completou todos os desafios!
            </Text>
            <Button 
              mode="contained" 
              buttonColor="#FFFFFF"
              textColor="#FFA000"
              style={styles.bonusButton}
            >
              Resgatar Bônus Extra
            </Button>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

// Componente separado para cada card de desafio
const ChallengeCard: React.FC<{
  challenge: Challenge;
  index: number;
  onPress: () => void;
  onClaimReward: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getRewardIcon: (type: string) => string;
}> = ({ challenge, index, onPress, onClaimReward, getDifficultyColor, getRewardIcon }) => {
  const scaleAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);

  useEffect(() => {
    if (challenge.isCompleted && !challenge.isClaimed) {
      glowAnimation.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [challenge.isCompleted, challenge.isClaimed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnimation.value * 0.3,
  }));

  const handlePress = () => {
    scaleAnimation.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onPress();
  };

  const progress = challenge.target > 0 ? challenge.current / challenge.target : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={[styles.challengeCard, animatedStyle]}
    >
      <Card 
        onPress={handlePress}
        style={[
          styles.challengeCardInner,
          challenge.isCompleted && styles.challengeCompleted
        ]}
      >
        {challenge.isCompleted && !challenge.isClaimed && (
          <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />
        )}
        
        <Card.Content>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconContainer}>
              <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            </View>
            
            <View style={styles.challengeInfo}>
              <View style={styles.challengeTitleRow}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Chip
                  compact
                  mode="flat"
                  style={[
                    styles.difficultyChip,
                    { backgroundColor: getDifficultyColor(challenge.difficulty) }
                  ]}
                  textStyle={styles.difficultyChipText}
                >
                  {challenge.difficulty === 'easy' ? 'Fácil' :
                   challenge.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                </Chip>
              </View>
              
              <Text style={styles.challengeDescription}>
                {challenge.description}
              </Text>
              
              {/* Barra de progresso */}
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progress}
                  color={challenge.isCompleted ? '#4CAF50' : theme.colors.primary}
                  style={styles.challengeProgress}
                />
                <Text style={styles.progressText}>
                  {challenge.current}/{challenge.target}
                </Text>
              </View>
              
              {/* Recompensa */}
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardIcon}>
                  {getRewardIcon(challenge.reward.type)}
                </Text>
                <Text style={styles.rewardLabel}>
                  {challenge.reward.label}
                </Text>
                
                {challenge.isCompleted && !challenge.isClaimed && (
                  <Button
                    mode="contained"
                    onPress={(e) => {
                      e.stopPropagation();
                      onClaimReward();
                    }}
                    style={styles.claimButton}
                    labelStyle={styles.claimButtonLabel}
                  >
                    Resgatar
                  </Button>
                )}
                
                {challenge.isClaimed && (
                  <Chip
                    mode="flat"
                    style={styles.claimedChip}
                    textStyle={styles.claimedChipText}
                  >
                    ✓ Resgatado
                  </Chip>
                )}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  headerGradient: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerStats: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  timer: {
    marginTop: 12,
    alignSelf: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
  },
  challengesList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  challengeCard: {
    marginBottom: 12,
  },
  challengeCardInner: {
    borderRadius: 12,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  challengeCompleted: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  challengeHeader: {
    flexDirection: 'row',
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  challengeDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  difficultyChip: {
    height: 20,
  },
  difficultyChipText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeProgress: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    minWidth: 40,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  claimButton: {
    borderRadius: 16,
    height: 28,
  },
  claimButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
    marginHorizontal: 12,
  },
  claimedChip: {
    backgroundColor: '#E8F5E9',
    height: 24,
  },
  claimedChipText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  bonusCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  bonusGradient: {
    padding: 20,
    alignItems: 'center',
  },
  bonusIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  bonusButton: {
    borderRadius: 20,
  },
});

export default DailyChallenges;