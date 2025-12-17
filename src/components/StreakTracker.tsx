import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  ProgressBar,
  Button,
  IconButton,
  useTheme,
} from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  _FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticFeedback } from '../utils/haptic';
import _AnimatedEmoji, { FloatingEmojiReaction } from './AnimatedEmoji';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalDaysActive: number;
  freezesAvailable: number;
  freezeUsedToday: boolean;
  milestones: {
    [key: number]: {
      reached: boolean;
      claimedAt?: string;
      reward: StreakReward;
    };
  };
}

interface StreakReward {
  type: 'xp' | 'discount' | 'free_box' | 'coins' | 'freeze' | 'badge';
  value: number | string;
  label: string;
  icon: string;
}

interface StreakTrackerProps {
  onStreakUpdate?: (streak: number) => void;
  onRewardClaim?: (reward: StreakReward) => void;
  compact?: boolean;
}

const STREAK_MILESTONES = {
  3: { type: 'xp', value: 100, label: '+100 XP', icon: '⭐' },
  7: { type: 'discount', value: 10, label: '10% OFF', icon: '🏷️' },
  14: { type: 'free_box', value: 'small', label: 'Caixa Pequena Grátis', icon: '🎁' },
  21: { type: 'coins', value: 500, label: '+500 Moedas', icon: '🪙' },
  30: { type: 'badge', value: 'fire_master', label: 'Badge Mestre do Fogo', icon: '🔥' },
  60: { type: 'free_box', value: 'premium', label: 'Caixa Premium Grátis', icon: '🎁' },
  90: { type: 'discount', value: 25, label: '25% OFF Permanente', icon: '💎' },
  180: { type: 'badge', value: 'legendary', label: 'Badge Lendário', icon: '👑' },
  365: { type: 'badge', value: 'eternal_flame', label: 'Chama Eterna', icon: '🌟' },
} as const;

const StreakTracker: React.FC<StreakTrackerProps> = ({
  onStreakUpdate,
  onRewardClaim,
  compact = false,
}) => {
  const _theme = useTheme();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    totalDaysActive: 0,
    freezesAvailable: 2,
    freezeUsedToday: false,
    milestones: {},
  });
  
  const [_showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [emojiReactions, setEmojiReactions] = useState<Array<{
    id: string;
    type: 'fire' | 'ice' | 'cool';
    position: { x: number; y: number };
  }>>([]);

  // Animações
  const fireAnimation = useSharedValue(0);
  const streakAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);
  const freezeAnimation = useSharedValue(0);

  // Carregar dados de streak
  useEffect(() => {
    loadStreakData();
  }, []);

  // Animações baseadas no streak
  useEffect(() => {
    if (streakData.currentStreak > 0) {
      // Animação de fogo pulsante
      fireAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.8, { duration: 500 })
        ),
        -1
      );

      // Brilho para streaks altos
      if (streakData.currentStreak >= 7) {
        glowAnimation.value = withRepeat(
          withTiming(1, { duration: 1500 }),
          -1,
          true
        );
      }

      // Vibração para marcos importantes
      const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number);
      if (milestoneKeys.includes(streakData.currentStreak)) {
        hapticFeedback('notificationSuccess');
        triggerMilestoneAnimation();
      }
    }
  }, [streakData.currentStreak]);

  const loadStreakData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@streak_data');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        const lastActivity = new Date(data.lastActivityDate).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // Verificar se o streak continua
        if (lastActivity === yesterday || lastActivity === today) {
          setStreakData(data);
        } else if (!data.freezeUsedToday && data.freezesAvailable > 0) {
          // Pode usar freeze
          setStreakData({
            ...data,
            freezeUsedToday: false,
          });
        } else {
          // Streak quebrado
          setStreakData({
            ...data,
            currentStreak: 0,
            freezeUsedToday: false,
          });
          hapticFeedback('notificationError');
        }
      }
    } catch (error) {
      // console.error('Erro ao carregar streak:', error);
    }
  };

  const saveStreakData = async (data: StreakData) => {
    try {
      await AsyncStorage.setItem('@streak_data', JSON.stringify(data));
    } catch (error) {
      // console.error('Erro ao salvar streak:', error);
    }
  };

  const handleDailyActivity = () => {
    const today = new Date().toDateString();
    
    if (streakData.lastActivityDate === today) {
      // Já fez atividade hoje
      return;
    }

    const newStreak = streakData.currentStreak + 1;
    const newData: StreakData = {
      ...streakData,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streakData.longestStreak),
      lastActivityDate: today,
      totalDaysActive: streakData.totalDaysActive + 1,
      freezeUsedToday: false,
    };

    // Verificar milestones
    const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number);
    milestoneKeys.forEach(milestone => {
      if (newStreak === milestone && !newData.milestones[milestone]?.reached) {
        newData.milestones[milestone] = {
          reached: true,
          reward: STREAK_MILESTONES[milestone as keyof typeof STREAK_MILESTONES],
        };
      }
    });

    setStreakData(newData);
    saveStreakData(newData);
    onStreakUpdate?.(newStreak);
    
    // Adicionar reação de emoji
    addEmojiReaction('fire');
    hapticFeedback('impactMedium');
  };

  const useStreakFreeze = () => {
    if (streakData.freezesAvailable <= 0 || streakData.freezeUsedToday) {
      hapticFeedback('notificationError');
      return;
    }

    const newData: StreakData = {
      ...streakData,
      freezesAvailable: streakData.freezesAvailable - 1,
      freezeUsedToday: true,
      lastActivityDate: new Date().toDateString(),
    };

    setStreakData(newData);
    saveStreakData(newData);
    
    // Animação de congelamento
    freezeAnimation.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );
    
    addEmojiReaction('ice');
    hapticFeedback('impactHeavy');
  };

  const claimMilestoneReward = (milestone: number) => {
    const milestoneData = streakData.milestones[milestone];
    if (!milestoneData || milestoneData.claimedAt) return;

    const newData: StreakData = {
      ...streakData,
      milestones: {
        ...streakData.milestones,
        [milestone]: {
          ...milestoneData,
          claimedAt: new Date().toISOString(),
        },
      },
    };

    // Adicionar freezes extras em alguns marcos
    if (milestone === 30) {
      newData.freezesAvailable += 2;
    } else if (milestone === 90) {
      newData.freezesAvailable += 5;
    }

    setStreakData(newData);
    saveStreakData(newData);
    onRewardClaim?.(milestoneData.reward);
    
    setShowRewardAnimation(true);
    addEmojiReaction('cool');
    hapticFeedback('notificationSuccess');
  };

  const triggerMilestoneAnimation = () => {
    streakAnimation.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
  };

  const addEmojiReaction = (type: 'fire' | 'ice' | 'cool') => {
    const id = `${Date.now()}-${Math.random()}`;
    const position = {
      x: SCREEN_WIDTH / 2 - 32,
      y: 100,
    };
    
    setEmojiReactions(prev => [...prev, { id, type, position }]);
    
    setTimeout(() => {
      setEmojiReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const getNextMilestone = () => {
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
    return milestones.find(m => m > streakData.currentStreak) || milestones[milestones.length - 1];
  };

  const nextMilestone = getNextMilestone();
  const progressToNextMilestone = nextMilestone 
    ? Math.min(streakData.currentStreak / nextMilestone, 1)
    : 1;

  const animatedFireStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fireAnimation.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.3, 0.6]),
  }));

  const animatedFreezeStyle = useAnimatedStyle(() => ({
    opacity: freezeAnimation.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakAnimation.value }],
  }));

  // Versão compacta
  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, animatedCardStyle]}>
        <LinearGradient
          colors={
            streakData.currentStreak >= 30
              ? ['#FF6B6B', '#FF8E53']
              : streakData.currentStreak >= 7
              ? ['#FF9800', '#FFB74D']
              : ['#FFC107', '#FFD54F']
          }
          style={styles.compactGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.Text style={[styles.compactFireIcon, animatedFireStyle]}>
            🔥
          </Animated.Text>
          <View>
            <Text style={styles.compactStreak}>{streakData.currentStreak}</Text>
            <Text style={styles.compactLabel}>dias</Text>
          </View>
          {streakData.freezesAvailable > 0 && (
            <View style={styles.compactFreezeContainer}>
              <Text style={styles.compactFreezeIcon}>❄️</Text>
              <Text style={styles.compactFreezeCount}>{streakData.freezesAvailable}</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  }

  // Versão completa
  return (
    <View style={styles.container}>
      <Animated.View style={animatedCardStyle}>
        <Card style={styles.card}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Glow effect para streaks altos */}
            {streakData.currentStreak >= 7 && (
              <Animated.View style={[styles.glowOverlay, animatedGlowStyle]} />
            )}

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Animated.Text style={[styles.fireIcon, animatedFireStyle]}>
                  🔥
                </Animated.Text>
                <View>
                  <Text style={styles.title}>Sequência de Dias</Text>
                  <Text style={styles.subtitle}>
                    Mantenha sua chama acesa!
                  </Text>
                </View>
              </View>
              
              {/* Freezes disponíveis */}
              {streakData.freezesAvailable > 0 && (
                <View style={styles.freezeContainer}>
                  <IconButton
                    icon="snowflake"
                    size={24}
                    iconColor="#FFFFFF"
                    onPress={useStreakFreeze}
                    disabled={streakData.freezeUsedToday}
                  />
                  <Text style={styles.freezeCount}>
                    {streakData.freezesAvailable}
                  </Text>
                </View>
              )}
            </View>

            {/* Streak atual */}
            <View style={styles.streakContainer}>
              <View style={styles.currentStreakBox}>
                <Text style={styles.currentStreakNumber}>
                  {streakData.currentStreak}
                </Text>
                <Text style={styles.currentStreakLabel}>Dias Atuais</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streakData.longestStreak}</Text>
                  <Text style={styles.statLabel}>Recorde</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streakData.totalDaysActive}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Progresso para próximo marco */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Próximo marco: {nextMilestone} dias
                </Text>
                <Text style={styles.progressValue}>
                  {Math.round(progressToNextMilestone * 100)}%
                </Text>
              </View>
              <ProgressBar
                progress={progressToNextMilestone}
                color="#FFFFFF"
                style={styles.progressBar}
              />
            </View>

            {/* Marcos e recompensas */}
            <View style={styles.milestonesContainer}>
              <Text style={styles.milestonesTitle}>🏆 Marcos de Conquista</Text>
              <View style={styles.milestonesList}>
                {Object.entries(STREAK_MILESTONES).slice(0, 5).map(([days, reward]) => {
                  const milestone = Number(days);
                  const reached = streakData.currentStreak >= milestone;
                  const claimed = streakData.milestones[milestone]?.claimedAt;

                  return (
                    <View
                      key={days}
                      style={[
                        styles.milestoneItem,
                        reached && styles.milestoneReached,
                        claimed && styles.milestoneClaimed,
                      ]}
                    >
                      <Text style={styles.milestoneIcon}>
                        {reward.icon}
                      </Text>
                      <Text style={styles.milestoneDays}>
                        {days}d
                      </Text>
                      {reached && !claimed && (
                        <Animated.View entering={ZoomIn}>
                          <IconButton
                            icon="gift"
                            size={20}
                            iconColor="#FF6B6B"
                            style={styles.claimButton}
                            onPress={() => claimMilestoneReward(milestone)}
                          />
                        </Animated.View>
                      )}
                      {claimed && <Text style={styles.claimedIcon}>✓</Text>}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Botão de atividade diária */}
            {streakData.lastActivityDate !== new Date().toDateString() && (
              <Button
                mode="contained"
                onPress={handleDailyActivity}
                style={styles.activityButton}
                labelStyle={styles.activityButtonLabel}
                buttonColor="#FFFFFF"
                textColor="#FF6B6B"
              >
                Registrar Atividade de Hoje
              </Button>
            )}

            {/* Freeze overlay animation */}
            <Animated.View
              style={[styles.freezeOverlay, animatedFreezeStyle]}
              pointerEvents="none"
            >
              <Text style={styles.freezeOverlayIcon}>❄️</Text>
            </Animated.View>
          </LinearGradient>
        </Card>
      </Animated.View>

      {/* Reações de emoji flutuantes */}
      {emojiReactions.map(reaction => (
        <FloatingEmojiReaction
          key={reaction.id}
          type={reaction.type as any}
          startPosition={reaction.position}
          onComplete={() => {
            setEmojiReactions(prev => prev.filter(r => r.id !== reaction.id));
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactFireIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  compactStreak: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compactLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  compactFreezeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  compactFreezeIcon: {
    fontSize: 16,
  },
  compactFreezeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fireIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  freezeContainer: {
    alignItems: 'center',
  },
  freezeCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  currentStreakBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  currentStreakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  currentStreakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  milestonesContainer: {
    marginBottom: 20,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  milestonesList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  milestoneReached: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  milestoneClaimed: {
    opacity: 0.6,
  },
  milestoneIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  milestoneDays: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  claimedIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  activityButton: {
    borderRadius: 24,
  },
  activityButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  freezeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,150,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freezeOverlayIcon: {
    fontSize: 64,
  },
});

export default StreakTracker;