/**
 * Social Room Screen
 * Tela principal de sala social com todos os recursos multiplayer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Avatar,
  Chip,
  Badge,
  Portal,
  Dialog,
  Surface,
  ProgressBar,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

// Serviços sociais
import sharedRoomService from '../../services/sharedRoomService';
import bettingService from '../../services/bettingService';
import leaderboardService from '../../services/leaderboardService';
import advancedHapticService from '../../services/advancedHapticService';

// Componentes
import SpriteSheetAnimator from '../../components/animations/SpriteSheetAnimator';
import EmojiReactionSystem from '../../components/animations/EmojiReactionSystem';

// Types
import {
  SharedRoom,
  RoomParticipant,
  Bet,
  SocialUser,
  ParticipantReaction,
} from '../../types/social';
import { EmojiReactionType, GameThemeType } from '../../types/animations';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Theme
import { theme, getSpacing } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SocialRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SocialRoom'>;
type SocialRoomScreenRouteProp = RouteProp<RootStackParamList, 'SocialRoom'>;

interface Props {
  navigation: SocialRoomScreenNavigationProp;
  route: SocialRoomScreenRouteProp;
}

const SocialRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  
  // State da sala
  const [room, setRoom] = useState<SharedRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // State da interface
  const [showBettingDialog, setShowBettingDialog] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userReady, setUserReady] = useState(false);
  
  // State das apostas
  const [roomBets, setRoomBets] = useState<Bet[]>([]);
  const [userBalance, setUserBalance] = useState({ coins: 0, points: 0, real: 0 });
  
  // Reações flutuantes
  const [floatingReactions, setFloatingReactions] = useState<ParticipantReaction[]>([]);
  
  // Animation values
  const roomOpacity = useSharedValue(0);
  const participantScale = useSharedValue(1);
  
  // Refs
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Conecta à sala
   */
  const connectToRoom = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      // Conectar ao servidor
      await sharedRoomService.connect();
      
      // Configurar callbacks
      sharedRoomService.setEventCallbacks({
        onRoomUpdate: (updatedRoom) => {
          setRoom(updatedRoom);
          roomOpacity.value = withSpring(1);
        },
        onParticipantJoin: (participant) => {
          advancedHapticService.playGestureFeedback('tap');
          participantScale.value = withSpring(1.1, {}, () => {
            participantScale.value = withSpring(1);
          });
        },
        onParticipantLeave: (userId) => {
        },
        onReactionAdd: (reaction) => {
          addFloatingReaction(reaction);
        },
        onCountdownStart: (duration) => {
          startCountdown(duration);
        },
        onBoxOpened: (userId, result) => {
          handleBoxOpened(userId, result);
        },
        onError: (error) => {
          Alert.alert('Erro', error);
          setConnectionStatus('disconnected');
        },
      });
      
      // Entrar na sala
      const joinedRoom = await sharedRoomService.joinRoom(route.params.roomId);
      setRoom(joinedRoom);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Carregar apostas da sala
      loadRoomBets();
      
      // Carregar saldo do usuário
      setUserBalance(bettingService.getUserBalance());
      
    } catch (error) {
      console.error('Erro ao conectar à sala:', error);
      setConnectionStatus('disconnected');
      Alert.alert('Erro', 'Não foi possível conectar à sala');
    }
  }, [route.params.roomId, roomOpacity, participantScale]);

  /**
   * Carrega apostas da sala
   */
  const loadRoomBets = useCallback(() => {
    const bets = bettingService.getBetsByRoom(route.params.roomId);
    setRoomBets(bets);
  }, [route.params.roomId]);

  /**
   * Adiciona reação flutuante
   */
  const addFloatingReaction = useCallback((reaction: ParticipantReaction) => {
    setFloatingReactions(prev => [...prev, reaction]);
    
    // Remover após 3 segundos
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.timestamp !== reaction.timestamp));
    }, 3000);
  }, []);

  /**
   * Inicia contagem regressiva
   */
  const startCountdown = useCallback((duration: number) => {
    setCountdown(duration);
    
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev && prev > 1) {
          if (prev <= 3) {
            advancedHapticService.playPattern('box_shake');
          }
          return prev - 1;
        } else {
          if (countdownTimer.current) {
            clearInterval(countdownTimer.current);
          }
          setCountdown(null);
          return null;
        }
      });
    }, 1000);
  }, []);

  /**
   * Manipula abertura de caixa
   */
  const handleBoxOpened = useCallback((userId: string, result: any) => {
    advancedHapticService.playBoxOpeningFeedback(result.rarity || 'common');
    
    // Resolver apostas relacionadas
    roomBets.forEach(bet => {
      if (bet.status === 'open' && shouldResolveBet(bet, result)) {
        resolveBet(bet, result);
      }
    });
  }, [roomBets]);

  /**
   * Verifica se aposta deve ser resolvida
   */
  const shouldResolveBet = (bet: Bet, result: any): boolean => {
    switch (bet.type) {
      case 'value_guess':
        return result.totalValue !== undefined;
      case 'rarity_guess':
        return result.rarity !== undefined;
      case 'first_to_complete':
        return result.completed === true;
      default:
        return false;
    }
  };

  /**
   * Resolve aposta
   */
  const resolveBet = async (bet: Bet, result: any) => {
    try {
      let winningOptionId = '';
      
      switch (bet.type) {
        case 'value_guess':
          winningOptionId = determineValueWinner(bet, result.totalValue);
          break;
        case 'rarity_guess':
          winningOptionId = determineRarityWinner(bet, result.rarity);
          break;
        case 'first_to_complete':
          winningOptionId = determineFirstCompleteWinner(bet, result.userId);
          break;
      }
      
      if (winningOptionId) {
        await bettingService.resolveBet(bet.id, winningOptionId);
        loadRoomBets();
        setUserBalance(bettingService.getUserBalance());
      }
    } catch (error) {
      console.error('Erro ao resolver aposta:', error);
    }
  };

  /**
   * Determina vencedor por valor
   */
  const determineValueWinner = (bet: Bet, value: number): string => {
    // Lógica para determinar qual opção corresponde ao valor
    return bet.options[0].id; // Placeholder
  };

  /**
   * Determina vencedor por raridade
   */
  const determineRarityWinner = (bet: Bet, rarity: string): string => {
    const option = bet.options.find(opt => 
      opt.description.toLowerCase().includes(rarity.toLowerCase())
    );
    return option?.id || bet.options[0].id;
  };

  /**
   * Determina vencedor por primeiro a completar
   */
  const determineFirstCompleteWinner = (bet: Bet, userId: string): string => {
    const option = bet.options.find(opt => opt.description.includes(userId));
    return option?.id || bet.options[0].id;
  };

  /**
   * Manipula reação do usuário
   */
  const handleUserReaction = useCallback(async (type: EmojiReactionType, position: { x: number; y: number }) => {
    if (!isConnected) return;
    
    try {
      await sharedRoomService.addReaction(type, position);
    } catch (error) {
      console.error('Erro ao enviar reação:', error);
    }
  }, [isConnected]);

  /**
   * Alterna estado de pronto
   */
  const toggleReady = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const newReadyState = !userReady;
      await sharedRoomService.setReady(newReadyState);
      setUserReady(newReadyState);
      
      advancedHapticService.playGestureFeedback('tap');
    } catch (error) {
      console.error('Erro ao alterar estado:', error);
    }
  }, [isConnected, userReady]);

  /**
   * Sai da sala
   */
  const leaveRoom = useCallback(async () => {
    try {
      await sharedRoomService.leaveRoom();
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      navigation.goBack();
    }
  }, [navigation]);

  // Conectar ao entrar na tela
  useEffect(() => {
    connectToRoom();
    
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
      sharedRoomService.leaveRoom().catch(console.error);
    };
  }, [connectToRoom]);

  // Estilos animados
  const animatedRoomStyle = useAnimatedStyle(() => ({
    opacity: roomOpacity.value,
  }));

  const animatedParticipantStyle = useAnimatedStyle(() => ({
    transform: [{ scale: participantScale.value }],
  }));

  /**
   * Renderiza status da conexão
   */
  const renderConnectionStatus = () => (
    <Surface style={styles.connectionStatus}>
      <View style={styles.statusIndicator}>
        <View style={[
          styles.statusDot,
          { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF5722' }
        ]} />
        <Text style={styles.statusText}>
          {connectionStatus === 'connected' ? 'Conectado' : 
           connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
        </Text>
      </View>
    </Surface>
  );

  /**
   * Renderiza header da sala
   */
  const renderRoomHeader = () => {
    if (!room) return null;

    return (
      <Animated.View entering={FadeInUp} style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomTheme}>
            Tema: {room.theme === 'fire' ? '🔥 Fogo' : room.theme === 'ice' ? '❄️ Gelo' : '☄️ Meteoro'}
          </Text>
        </View>
        
        <View style={styles.roomActions}>
          <IconButton icon="account-group" onPress={() => setShowParticipants(true)} />
          <IconButton icon="close" onPress={leaveRoom} />
        </View>
      </Animated.View>
    );
  };

  /**
   * Renderiza contagem regressiva
   */
  const renderCountdown = () => {
    if (!countdown) return null;

    return (
      <Animated.View entering={FadeInDown} style={styles.countdownContainer}>
        <Text style={styles.countdownText}>{countdown}</Text>
        <Text style={styles.countdownLabel}>Abertura em...</Text>
      </Animated.View>
    );
  };

  /**
   * Renderiza participantes
   */
  const renderParticipants = () => {
    if (!room) return null;

    return (
      <Animated.View style={[styles.participantsContainer, animatedParticipantStyle]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {room.participants.map((participant) => (
            <View key={participant.user.id} style={styles.participantCard}>
              <Avatar.Text 
                size={50} 
                label={participant.user.displayName.charAt(0)}
                style={{ backgroundColor: participant.ready ? '#4CAF50' : '#FFC107' }}
              />
              <Text style={styles.participantName}>
                {participant.user.displayName}
              </Text>
              {participant.role === 'host' && (
                <Chip icon="crown" compact>Host</Chip>
              )}
              {participant.ready && (
                <Badge size={16} style={styles.readyBadge}>✓</Badge>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  /**
   * Renderiza apostas ativas
   */
  const renderActiveBets = () => {
    if (roomBets.length === 0) return null;

    return (
      <View style={styles.betsSection}>
        <Text style={styles.sectionTitle}>Apostas Ativas</Text>
        {roomBets.map((bet) => (
          <Surface key={bet.id} style={styles.betCard}>
            <Text style={styles.betDescription}>{bet.description}</Text>
            <Text style={styles.betStakes}>
              Aposta: {bet.stakes} {bet.currency}
            </Text>
            <Text style={styles.betParticipants}>
              {bet.participants.length} participantes
            </Text>
          </Surface>
        ))}
      </View>
    );
  };

  /**
   * Renderiza controles principais
   */
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <Button
        mode={userReady ? 'contained' : 'outlined'}
        onPress={toggleReady}
        style={styles.readyButton}
        disabled={!isConnected}
      >
        {userReady ? 'Pronto!' : 'Ficar Pronto'}
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => setShowBettingDialog(true)}
        style={styles.betButton}
        disabled={!isConnected}
      >
        Apostar
      </Button>
    </View>
  );

  if (!room && connectionStatus !== 'connecting') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar a sala</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderConnectionStatus()}
      {renderRoomHeader()}
      
      <Animated.View style={[styles.mainContent, animatedRoomStyle]}>
        {renderCountdown()}
        {renderParticipants()}
        {renderActiveBets()}
        
        {/* Sistema de reações em tempo real */}
        <EmojiReactionSystem
          onReaction={handleUserReaction}
          showControls={true}
          enabled={isConnected}
          maxFloatingReactions={20}
          mode="floating"
          style={styles.reactionSystem}
        />
        
        {/* Reações flutuantes de outros usuários */}
        {floatingReactions.map((reaction, index) => (
          <Animated.View
            key={`${reaction.timestamp}-${index}`}
            entering={FadeInUp}
            style={[
              styles.otherUserReaction,
              reaction.position && {
                left: reaction.position.x - 20,
                top: reaction.position.y - 20,
              }
            ]}
          >
            <SpriteSheetAnimator
              emojiType={reaction.type}
              autoPlay={true}
              loop={false}
              scale={0.6}
            />
          </Animated.View>
        ))}
      </Animated.View>
      
      {renderControls()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  errorText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: getSpacing(4),
  },
  connectionStatus: {
    position: 'absolute',
    top: 50,
    right: 16,
    padding: getSpacing(2),
    borderRadius: 20,
    zIndex: 1000,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: getSpacing(1),
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing(4),
    paddingTop: getSpacing(8),
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roomTheme: {
    fontSize: 16,
    color: '#CCC',
    marginTop: getSpacing(1),
  },
  roomActions: {
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: getSpacing(4),
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: getSpacing(6),
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  countdownLabel: {
    fontSize: 18,
    color: '#FFF',
    marginTop: getSpacing(2),
  },
  participantsContainer: {
    marginBottom: getSpacing(4),
  },
  participantCard: {
    alignItems: 'center',
    marginRight: getSpacing(3),
    padding: getSpacing(2),
  },
  participantName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: getSpacing(1),
    textAlign: 'center',
  },
  readyBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
  },
  betsSection: {
    marginBottom: getSpacing(4),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: getSpacing(2),
  },
  betCard: {
    padding: getSpacing(3),
    marginBottom: getSpacing(2),
    borderRadius: 8,
  },
  betDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: getSpacing(1),
  },
  betStakes: {
    fontSize: 14,
    color: '#FFD700',
  },
  betParticipants: {
    fontSize: 12,
    color: '#CCC',
    marginTop: getSpacing(1),
  },
  reactionSystem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  otherUserReaction: {
    position: 'absolute',
    width: 40,
    height: 40,
    zIndex: 999,
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: getSpacing(4),
    gap: getSpacing(3),
  },
  readyButton: {
    flex: 2,
  },
  betButton: {
    flex: 1,
  },
});

export default SocialRoomScreen;