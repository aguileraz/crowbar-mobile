import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  useTheme,
  Portal,
} from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  interpolate,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticFeedback } from '../utils/haptic';
import AnimatedEmoji, { FloatingEmojiReaction } from './AnimatedEmoji';
import CountdownTimer from './CountdownTimer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface WheelSegment {
  id: string;
  label: string;
  value: string;
  color: string;
  textColor: string;
  icon: string;
  probability: number;
}

interface SpinData {
  lastSpinDate: string;
  totalSpins: number;
  todaySpins: number;
  maxDailySpins: number;
  nextFreeSpinAt: string;
  rewards: Array<{
    date: string;
    reward: string;
    claimed: boolean;
  }>;
}

interface DailySpinWheelProps {
  visible: boolean;
  onClose: () => void;
  onRewardWon?: (reward: WheelSegment) => void;
  maxDailySpins?: number;
}

const DEFAULT_SEGMENTS: WheelSegment[] = [
  {
    id: '1',
    label: '100 XP',
    value: 'xp_100',
    color: '#4CAF50',
    textColor: '#FFFFFF',
    icon: '⭐',
    probability: 0.25,
  },
  {
    id: '2',
    label: '10% OFF',
    value: 'discount_10',
    color: '#2196F3',
    textColor: '#FFFFFF',
    icon: '🏷️',
    probability: 0.20,
  },
  {
    id: '3',
    label: '50 Moedas',
    value: 'coins_50',
    color: '#FFC107',
    textColor: '#000000',
    icon: '🪙',
    probability: 0.15,
  },
  {
    id: '4',
    label: 'Caixa Grátis',
    value: 'free_box',
    color: '#9C27B0',
    textColor: '#FFFFFF',
    icon: '🎁',
    probability: 0.05,
  },
  {
    id: '5',
    label: '200 XP',
    value: 'xp_200',
    color: '#FF5722',
    textColor: '#FFFFFF',
    icon: '⭐',
    probability: 0.10,
  },
  {
    id: '6',
    label: 'Tente Novamente',
    value: 'try_again',
    color: '#607D8B',
    textColor: '#FFFFFF',
    icon: '🔄',
    probability: 0.15,
  },
  {
    id: '7',
    label: '20% OFF',
    value: 'discount_20',
    color: '#E91E63',
    textColor: '#FFFFFF',
    icon: '🏷️',
    probability: 0.08,
  },
  {
    id: '8',
    label: '500 Moedas',
    value: 'coins_500',
    color: '#FFD700',
    textColor: '#000000',
    icon: '💰',
    probability: 0.02,
  },
];

const DailySpinWheel: React.FC<DailySpinWheelProps> = ({
  visible,
  onClose,
  onRewardWon,
  maxDailySpins = 3,
}) => {
  const theme = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<WheelSegment | null>(null);
  const [spinData, setSpinData] = useState<SpinData>({
    lastSpinDate: '',
    totalSpins: 0,
    todaySpins: 0,
    maxDailySpins,
    nextFreeSpinAt: '',
    rewards: [],
  });
  const [showReward, setShowReward] = useState(false);
  const [emojiReactions, setEmojiReactions] = useState<any[]>([]);

  // Animações
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const pointerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const confettiAnimation = useSharedValue(0);

  const wheelRadius = 140;
  const numberOfSegments = DEFAULT_SEGMENTS.length;
  const anglePerSegment = 360 / numberOfSegments;

  useEffect(() => {
    if (visible) {
      loadSpinData();
      startGlowAnimation();
    }
  }, [visible]);

  const loadSpinData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@spin_wheel_data');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Reset daily spins if new day
        if (data.lastSpinDate !== today) {
          data.todaySpins = 0;
          data.lastSpinDate = today;
        }
        
        setSpinData(data);
      }
    } catch (error) {
      console.error('Error loading spin data:', error);
    }
  };

  const saveSpinData = async (data: SpinData) => {
    try {
      await AsyncStorage.setItem('@spin_wheel_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving spin data:', error);
    }
  };

  const startGlowAnimation = () => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1
    );
  };

  const calculateWinner = (): WheelSegment => {
    const random = Math.random();
    let accumulated = 0;
    
    for (const segment of DEFAULT_SEGMENTS) {
      accumulated += segment.probability;
      if (random <= accumulated) {
        return segment;
      }
    }
    
    return DEFAULT_SEGMENTS[0];
  };

  const spinWheel = () => {
    if (isSpinning || spinData.todaySpins >= spinData.maxDailySpins) {
      hapticFeedback('notificationError');
      return;
    }

    setIsSpinning(true);
    hapticFeedback('impactMedium');

    // Calcular vencedor
    const winner = calculateWinner();
    const winnerIndex = DEFAULT_SEGMENTS.findIndex(s => s.id === winner.id);
    
    // Calcular rotação final
    const baseRotation = 360 * 5; // 5 voltas completas
    const segmentAngle = winnerIndex * anglePerSegment;
    const finalRotation = baseRotation + (360 - segmentAngle) + anglePerSegment / 2;

    // Animar ponteiro durante spin
    pointerScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      20
    );

    // Animar rotação da roda
    rotation.value = withTiming(finalRotation, {
      duration: 4000,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(handleSpinComplete)(winner);
      }
    });

    // Animação de escala durante spin
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
  };

  const handleSpinComplete = (winner: WheelSegment) => {
    setSelectedSegment(winner);
    setIsSpinning(false);
    
    // Atualizar dados
    const newSpinData: SpinData = {
      ...spinData,
      lastSpinDate: new Date().toDateString(),
      totalSpins: spinData.totalSpins + 1,
      todaySpins: spinData.todaySpins + 1,
      rewards: [
        ...spinData.rewards,
        {
          date: new Date().toISOString(),
          reward: winner.value,
          claimed: false,
        },
      ],
    };
    
    // Se ganhou "Tente Novamente", não conta como spin
    if (winner.value === 'try_again') {
      newSpinData.todaySpins = spinData.todaySpins;
      hapticFeedback('impactLight');
      
      // Resetar e permitir novo spin
      setTimeout(() => {
        rotation.value = withSpring(0);
        setSelectedSegment(null);
      }, 2000);
    } else {
      hapticFeedback('notificationSuccess');
      setShowReward(true);
      triggerCelebration(winner);
    }
    
    setSpinData(newSpinData);
    saveSpinData(newSpinData);
    onRewardWon?.(winner);
  };

  const triggerCelebration = (winner: WheelSegment) => {
    // Confetti animation
    confettiAnimation.value = withSequence(
      withTiming(1, { duration: 500 }),
      withDelay(2000, withTiming(0, { duration: 500 }))
    );

    // Emoji reactions baseadas no prêmio
    let emojiType: 'fire' | 'cool' | 'beijo' = 'cool';
    if (winner.value.includes('box') || winner.value.includes('500')) {
      emojiType = 'fire';
    } else if (winner.value.includes('discount')) {
      emojiType = 'beijo';
    }

    addEmojiReaction(emojiType);
  };

  const addEmojiReaction = (type: 'fire' | 'cool' | 'beijo') => {
    const id = `${Date.now()}-${Math.random()}`;
    const position = {
      x: SCREEN_WIDTH / 2 - 32,
      y: SCREEN_HEIGHT / 2 - 100,
    };
    
    setEmojiReactions(prev => [...prev, { id, type, position }]);
    
    setTimeout(() => {
      setEmojiReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const renderWheel = () => {
    return (
      <Svg width={wheelRadius * 2} height={wheelRadius * 2}>
        <G x={wheelRadius} y={wheelRadius}>
          {DEFAULT_SEGMENTS.map((segment, index) => {
            const startAngle = index * anglePerSegment - 90;
            const endAngle = startAngle + anglePerSegment;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = wheelRadius * Math.cos(startAngleRad);
            const y1 = wheelRadius * Math.sin(startAngleRad);
            const x2 = wheelRadius * Math.cos(endAngleRad);
            const y2 = wheelRadius * Math.sin(endAngleRad);
            
            const pathData = [
              `M 0 0`,
              `L ${x1} ${y1}`,
              `A ${wheelRadius} ${wheelRadius} 0 0 1 ${x2} ${y2}`,
              `Z`,
            ].join(' ');
            
            const textAngle = startAngle + anglePerSegment / 2;
            const textAngleRad = (textAngle * Math.PI) / 180;
            const textX = (wheelRadius * 0.7) * Math.cos(textAngleRad);
            const textY = (wheelRadius * 0.7) * Math.sin(textAngleRad);
            
            return (
              <G key={segment.id}>
                <Path
                  d={pathData}
                  fill={segment.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <SvgText
                  x={textX}
                  y={textY - 10}
                  fill={segment.textColor}
                  fontSize="20"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {segment.icon}
                </SvgText>
                <SvgText
                  x={textX}
                  y={textY + 10}
                  fill={segment.textColor}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {segment.label}
                </SvgText>
              </G>
            );
          })}
          {/* Centro da roda */}
          <Circle r="25" fill="#FFFFFF" stroke="#FFD700" strokeWidth="3" />
          <SvgText
            x="0"
            y="5"
            fill="#FFD700"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
          >
            SPIN
          </SvgText>
        </G>
      </Svg>
    );
  };

  const animatedWheelStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const animatedPointerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pointerScale.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const canSpin = spinData.todaySpins < spinData.maxDailySpins;
  const spinsRemaining = spinData.maxDailySpins - spinData.todaySpins;

  // Calcular próximo reset
  const getNextResetTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn}
            exiting={FadeOut}
            style={styles.modalContent}
          >
            <Card style={styles.card}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.cardGradient}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>🎰 Roda da Sorte Diária</Text>
                  <IconButton
                    icon="close"
                    size={24}
                    iconColor="#FFFFFF"
                    onPress={onClose}
                    style={styles.closeButton}
                  />
                </View>

                {/* Spins restantes */}
                <View style={styles.spinsInfo}>
                  <Text style={styles.spinsText}>
                    Giros Restantes: {spinsRemaining}/{spinData.maxDailySpins}
                  </Text>
                  {!canSpin && (
                    <CountdownTimer
                      endDate={getNextResetTime()}
                      label="Próximo giro em"
                      variant="compact"
                      style={styles.timer}
                    />
                  )}
                </View>

                {/* Roda */}
                <View style={styles.wheelContainer}>
                  {/* Glow effect */}
                  <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />
                  
                  {/* Roda animada */}
                  <Animated.View style={[styles.wheel, animatedWheelStyle]}>
                    {renderWheel()}
                  </Animated.View>
                  
                  {/* Ponteiro */}
                  <Animated.View style={[styles.pointer, animatedPointerStyle]}>
                    <View style={styles.pointerTriangle} />
                  </Animated.View>
                </View>

                {/* Botão Girar */}
                <Button
                  mode="contained"
                  onPress={spinWheel}
                  disabled={!canSpin || isSpinning}
                  style={styles.spinButton}
                  labelStyle={styles.spinButtonLabel}
                  buttonColor="#FFD700"
                  textColor="#000000"
                  loading={isSpinning}
                >
                  {isSpinning ? 'GIRANDO...' : canSpin ? 'GIRAR AGORA!' : 'SEM GIROS'}
                </Button>

                {/* Histórico de prêmios */}
                {spinData.rewards.length > 0 && (
                  <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>Últimos Prêmios</Text>
                    <View style={styles.historyList}>
                      {spinData.rewards.slice(-3).reverse().map((reward, index) => (
                        <View key={index} style={styles.historyItem}>
                          <Text style={styles.historyIcon}>
                            {DEFAULT_SEGMENTS.find(s => s.value === reward.reward)?.icon}
                          </Text>
                          <Text style={styles.historyLabel}>
                            {DEFAULT_SEGMENTS.find(s => s.value === reward.reward)?.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Card>

            {/* Modal de Recompensa */}
            {showReward && selectedSegment && selectedSegment.value !== 'try_again' && (
              <Animated.View
                entering={ZoomIn}
                style={styles.rewardModal}
              >
                <Card style={styles.rewardCard}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA000']}
                    style={styles.rewardGradient}
                  >
                    <Text style={styles.rewardIcon}>{selectedSegment.icon}</Text>
                    <Text style={styles.rewardTitle}>Parabéns!</Text>
                    <Text style={styles.rewardText}>Você ganhou:</Text>
                    <Text style={styles.rewardValue}>{selectedSegment.label}</Text>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setShowReward(false);
                        setSelectedSegment(null);
                      }}
                      style={styles.rewardButton}
                      buttonColor="#FFFFFF"
                      textColor="#FFA000"
                    >
                      Resgatar
                    </Button>
                  </LinearGradient>
                </Card>
              </Animated.View>
            )}
          </Animated.View>

          {/* Reações de emoji flutuantes */}
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
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: -10,
    top: -10,
  },
  spinsInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  spinsText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timer: {
    marginTop: 8,
  },
  wheelContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  wheel: {
    width: 280,
    height: 280,
  },
  pointer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 40,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF1744',
  },
  spinButton: {
    borderRadius: 24,
    paddingVertical: 4,
    marginBottom: 16,
    minWidth: 200,
  },
  spinButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  historyContainer: {
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  historyList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyItem: {
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  historyLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rewardModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -(SCREEN_WIDTH - 64) / 2 },
      { translateY: -150 },
    ],
    width: SCREEN_WIDTH - 64,
    maxWidth: 320,
  },
  rewardCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
  },
  rewardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  rewardButton: {
    borderRadius: 20,
    paddingHorizontal: 32,
  },
});

export default DailySpinWheel;