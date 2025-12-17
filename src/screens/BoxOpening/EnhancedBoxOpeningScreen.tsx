/**
 * Enhanced Box Opening Screen
 * Tela de abertura de caixas com todos os recursos de gamificação aprimorados
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  // withDelay,
  withTiming,
  // runOnJS,
} from 'react-native-reanimated';

// Componentes aprimorados
import SpriteSheetAnimator from '../../components/animations/SpriteSheetAnimator';
import EmojiReactionSystem from '../../components/animations/EmojiReactionSystem';

// Serviços
import gamificationAssetManager from '../../services/gamificationAssetManager';
import advancedHapticService from '../../services/advancedHapticService';
import { analyticsService } from '../../services/analyticsService';

// Redux
import { AppDispatch } from '../../store';
import {
  _openMysteryBox,
  setCurrentBox,
  selectCurrentBox,
  selectOpeningResult,
  selectAnimationState,
} from '../../store/slices/boxOpeningSlice';

// Types

import { GameThemeType, EmojiReactionType, GamePhase } from '../../types/animations';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Theme
import {getSpacing} from '../../theme';

const { width: screenWidth, height: _screenHeight } = Dimensions.get('window');

type EnhancedBoxOpeningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EnhancedBoxOpening'>;
type EnhancedBoxOpeningScreenRouteProp = RouteProp<RootStackParamList, 'EnhancedBoxOpening'>;

interface Props {
  navigation: EnhancedBoxOpeningScreenNavigationProp;
  route: EnhancedBoxOpeningScreenRouteProp;
}

// Configuração das fases de abertura
const OPENING_PHASES: Record<string, GamePhase> = {
  anticipation: {
    name: 'Antecipação',
    duration: 2000,
    animations: ['box_shake', 'particles_orbit'],
    effects: {
      particles: {
        enabled: true,
        count: 20,
        size: { min: 4, max: 8 },
        speed: { min: 20, max: 40 },
        colors: ['#FFD700', '#FFA500'],
        gravity: 0.1,
        fadeOut: true,
      },
      glow: {
        enabled: true,
        intensity: 0.5,
        color: '#FFD700',
        radius: 20,
        pulsate: true,
        duration: 1000,
      },
      shake: { enabled: false, intensity: 0, duration: 0, direction: 'both' },
      flash: { enabled: false, color: '', duration: 0, opacity: 0 },
      zoom: { enabled: false, scale: 0, duration: 0, easing: '' },
    },
    hapticPattern: 'box_shake',
    canSkip: false,
  },
  climax: {
    name: 'Clímax',
    duration: 1500,
    animations: ['theme_explosion'],
    effects: {
      particles: {
        enabled: true,
        count: 50,
        size: { min: 8, max: 16 },
        speed: { min: 100, max: 200 },
        colors: ['#FF4500', '#FFD700', '#FF1493'],
        gravity: 0.3,
        fadeOut: true,
      },
      glow: {
        enabled: true,
        intensity: 1.0,
        color: '#FFFFFF',
        radius: 50,
        pulsate: false,
      },
      shake: {
        enabled: true,
        intensity: 0.8,
        duration: 500,
        direction: 'both',
      },
      flash: {
        enabled: true,
        color: '#FFFFFF',
        duration: 200,
        opacity: 0.7,
      },
      zoom: {
        enabled: true,
        scale: 1.3,
        duration: 800,
        easing: 'easeOut',
      },
    },
    hapticPattern: 'explosion',
    canSkip: false,
  },
  revelation: {
    name: 'Revelação',
    duration: 3000,
    animations: ['item_reveal'],
    effects: {
      particles: {
        enabled: true,
        count: 30,
        size: { min: 6, max: 12 },
        speed: { min: 30, max: 80 },
        colors: ['#32CD32', '#00FA9A', '#98FB98'],
        gravity: 0.2,
        fadeOut: true,
      },
      glow: {
        enabled: true,
        intensity: 0.7,
        color: '#32CD32',
        radius: 30,
        pulsate: true,
        duration: 2000,
      },
      shake: { enabled: false, intensity: 0, duration: 0, direction: 'both' },
      flash: { enabled: false, color: '', duration: 0, opacity: 0 },
      zoom: { enabled: false, scale: 0, duration: 0, easing: '' },
    },
    canSkip: true,
  },
  celebration: {
    name: 'Celebração',
    duration: 2000,
    animations: ['confetti', 'success_glow'],
    effects: {
      particles: {
        enabled: true,
        count: 100,
        size: { min: 4, max: 10 },
        speed: { min: 50, max: 150 },
        colors: ['#FF69B4', '#00BFFF', '#FFD700', '#32CD32'],
        gravity: 0.4,
        fadeOut: true,
      },
      glow: {
        enabled: true,
        intensity: 1.2,
        color: '#FFD700',
        radius: 60,
        pulsate: true,
        duration: 1000,
      },
      shake: { enabled: false, intensity: 0, duration: 0, direction: 'both' },
      flash: { enabled: false, color: '', duration: 0, opacity: 0 },
      zoom: { enabled: false, scale: 0, duration: 0, easing: '' },
    },
    hapticPattern: 'achievement',
    canSkip: true,
  },
};

const EnhancedBoxOpeningScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const _insets = useSafeAreaInsets();
  
  // Redux state
  const currentBox = useSelector(selectCurrentBox);
  const _openingResult = useSelector(selectOpeningResult);
  const _animationState = useSelector(selectAnimationState);
  
  // Local state
  const [selectedTheme, setSelectedTheme] = useState<GameThemeType>('fire');
  const [currentPhase, setCurrentPhase] = useState<keyof typeof OPENING_PHASES>('anticipation');
  const [showThemeSelector, setShowThemeSelector] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [showEmojiReactions, setShowEmojiReactions] = useState(false);
  const [openingStarted, setOpeningStarted] = useState(false);
  const [_phaseProgress, setPhaseProgress] = useState(0);
  
  // Animation values
  const containerOpacity = useSharedValue(1);
  const backgroundScale = useSharedValue(1);
  const boxScale = useSharedValue(1);
  const boxRotation = useSharedValue(0);
  
  // Refs
  const phaseTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // Initialize box
  useEffect(() => {
    if (route.params.box) {
      dispatch(setCurrentBox(route.params.box));
    }
  }, [route.params.box, dispatch]);

  /**
   * Pré-carrega assets do tema selecionado
   */
  const preloadThemeAssets = useCallback(async (themeType: GameThemeType) => {
    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      // Simular progresso de carregamento
      const progressInterval = setInterval(() => {
        setPreloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Pré-carregar assets do tema
      await gamificationAssetManager.warmupTheme(themeType);
      
      clearInterval(progressInterval);
      setPreloadProgress(100);
      
      // Pequena pausa para mostrar 100%
      setTimeout(() => {
        setIsPreloading(false);
        setShowThemeSelector(false);
      }, 300);
      
    } catch (error) {
      // console.error('Erro ao pré-carregar assets:', error);
      Alert.alert('Erro', 'Falha ao carregar animações');
      setIsPreloading(false);
    }
  }, []);

  /**
   * Seleciona tema e inicia pré-carregamento
   */
  const handleThemeSelect = useCallback(async (themeType: GameThemeType) => {
    setSelectedTheme(themeType);
    await preloadThemeAssets(themeType);

    // Analytics
    analyticsService.trackEngagement('theme_selected', themeType, 1);
  }, [preloadThemeAssets]);

  /**
   * Inicia processo de abertura
   */
  const startBoxOpening = useCallback(async () => {
    if (!currentBox || openingStarted) return;
    
    setOpeningStarted(true);
    setShowEmojiReactions(true);
    
    // Rastrear início
    analyticsService.trackEngagement('box_opening_started', selectedTheme, 1);
    
    // Iniciar sequência de fases
    await executePhaseSequence();
    
  }, [currentBox, openingStarted, selectedTheme]);

  /**
   * Executa sequência de fases
   */
  const executePhaseSequence = useCallback(async () => {
    const phases = Object.keys(OPENING_PHASES);
    
    for (let i = 0; i < phases.length; i++) {
      const phaseName = phases[i] as keyof typeof OPENING_PHASES;
      const phase = OPENING_PHASES[phaseName];
      
      setCurrentPhase(phaseName);
      setPhaseProgress(0);
      
      // Feedback háptico para início da fase
      if (phase.hapticPattern) {
        await advancedHapticService.playPattern(phase.hapticPattern as keyof typeof import('../types/animations').HAPTIC_PATTERNS);
      }
      
      // Feedback háptico temático
      if (phaseName === 'anticipation') {
        await advancedHapticService.playThematicFeedback(selectedTheme, 'start');
      } else if (phaseName === 'climax') {
        await advancedHapticService.playThematicFeedback(selectedTheme, 'climax');
      } else if (phaseName === 'celebration') {
        await advancedHapticService.playThematicFeedback(selectedTheme, 'end');
      }
      
      // Animações da fase
      await executePhaseAnimations(phase);
      
      // Aguardar duração da fase
      await new Promise(resolve => {
        phaseTimer.current = setTimeout(resolve, phase.duration);
      });
    }
    
    // Finalizar abertura
    completeBoxOpening();
    
  }, [selectedTheme]);

  /**
   * Executa animações de uma fase
   */
  const executePhaseAnimations = useCallback(async (phase: GamePhase) => {
    // Implementar animações específicas da fase
    switch (phase.name) {
      case 'Antecipação':
        boxScale.value = withSequence(
          withSpring(1.05),
          withSpring(1),
          withSpring(1.05),
          withSpring(1)
        );
        break;
        
      case 'Clímax':
        boxScale.value = withSpring(1.2);
        boxRotation.value = withSequence(
          withTiming(5, { duration: 100 }),
          withTiming(-5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        backgroundScale.value = withSpring(1.1);
        break;
        
      case 'Revelação':
        boxScale.value = withSpring(0.8);
        containerOpacity.value = withTiming(0.9);
        break;
        
      case 'Celebração':
        boxScale.value = withSpring(1);
        containerOpacity.value = withTiming(1);
        backgroundScale.value = withSpring(1);
        break;
    }
  }, [boxScale, boxRotation, backgroundScale, containerOpacity]);

  /**
   * Completa abertura da caixa
   */
  const completeBoxOpening = useCallback(() => {
    // Calcular métricas da sessão
    const sessionDuration = Date.now() - sessionStartTime.current;
    
    // Analytics finais
    analyticsService.trackEngagement('box_opening_completed', selectedTheme, sessionDuration);
    
    // Mostrar resultados
    Alert.alert(
      'Caixa Aberta!',
      'Sua caixa foi aberta com sucesso!',
      [
        { text: 'Ver Itens', onPress: () => navigation.goBack() },
        { text: 'Abrir Outra', onPress: () => resetOpening() }
      ]
    );
  }, [selectedTheme, navigation]);

  /**
   * Reseta estado para nova abertura
   */
  const resetOpening = useCallback(() => {
    setOpeningStarted(false);
    setShowEmojiReactions(false);
    setCurrentPhase('anticipation');
    setPhaseProgress(0);
    setShowThemeSelector(true);
    
    // Reset animation values
    containerOpacity.value = 1;
    backgroundScale.value = 1;
    boxScale.value = 1;
    boxRotation.value = 0;
    
    sessionStartTime.current = Date.now();
  }, [containerOpacity, backgroundScale, boxScale, boxRotation]);

  /**
   * Manipula reação emoji
   */
  const handleEmojiReaction = useCallback((type: EmojiReactionType, _position: { x: number; y: number }) => {
    // Feedback háptico para reação
    advancedHapticService.playGestureFeedback('tap');
    
    // Analytics
    analyticsService.trackEngagement('emoji_reaction', type, 1);
  }, []);

  // Estilos animados
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: backgroundScale.value }],
  }));

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: boxScale.value },
      { rotate: `${boxRotation.value}deg` },
    ],
  }));

  /**
   * Renderiza seletor de tema
   */
  const renderThemeSelector = () => {
    if (!showThemeSelector) return null;

    return (
      <Portal>
        <Dialog visible={true} dismissable={false}>
          <Dialog.Title>Escolha o Tema da Abertura</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Selecione o efeito visual para sua abertura de caixa:</Paragraph>
            
            <View style={styles.themeOptions}>
              {(['fire', 'ice', 'meteor'] as GameThemeType[]).map((themeType) => (
                <Button
                  key={themeType}
                  mode={selectedTheme === themeType ? 'contained' : 'outlined'}
                  onPress={() => handleThemeSelect(themeType)}
                  style={styles.themeButton}
                  disabled={isPreloading}
                >
                  {themeType === 'fire' ? '🔥 Fogo' : themeType === 'ice' ? '❄️ Gelo' : '☄️ Meteoro'}
                </Button>
              ))}
            </View>
            
            {isPreloading && (
              <View style={styles.preloadingContainer}>
                <ActivityIndicator animating={true} />
                <Text style={styles.preloadingText}>
                  Carregando animações... {preloadProgress}%
                </Text>
              </View>
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    );
  };

  /**
   * Renderiza interface principal
   */
  const renderMainInterface = () => {
    if (showThemeSelector) return null;

    return (
      <Animated.View style={[styles.mainContainer, animatedContainerStyle]}>
        {/* Caixa animada */}
        <View style={styles.boxContainer}>
          <Animated.View style={[styles.box, animatedBoxStyle]}>
            {/* Renderizar animação baseada na fase atual */}
            {currentPhase === 'climax' && (
              <SpriteSheetAnimator
                theme={selectedTheme}
                effectType="explosion"
                autoPlay={true}
                loop={false}
                style={styles.explosionAnimation}
              />
            )}
            
            {/* Caixa base */}
            <View style={styles.boxContent}>
              <Text style={styles.boxText}>📦</Text>
            </View>
          </Animated.View>
        </View>

        {/* Informações da fase */}
        <View style={styles.phaseInfo}>
          <Text style={styles.phaseTitle}>
            {OPENING_PHASES[currentPhase].name}
          </Text>
          <Text style={styles.phaseDescription}>
            Tema: {selectedTheme === 'fire' ? '🔥 Fogo' : selectedTheme === 'ice' ? '❄️ Gelo' : '☄️ Meteoro'}
          </Text>
        </View>

        {/* Botão de abertura */}
        {!openingStarted && (
          <Button
            mode="contained"
            onPress={startBoxOpening}
            style={styles.openButton}
            contentStyle={styles.openButtonContent}
            disabled={!currentBox}
          >
            Abrir Caixa Misteriosa
          </Button>
        )}

        {/* Sistema de reações emoji */}
        {showEmojiReactions && (
          <EmojiReactionSystem
            onReaction={handleEmojiReaction}
            showControls={true}
            enabled={true}
            maxFloatingReactions={10}
            mode="both"
            style={styles.emojiSystem}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderThemeSelector()}
      {renderMainInterface()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  boxContainer: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(6),
  },
  box: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContent: {
    width: 120,
    height: 120,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#654321',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  boxText: {
    fontSize: 48,
  },
  explosionAnimation: {
    position: 'absolute',
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
  },
  phaseInfo: {
    alignItems: 'center',
    marginBottom: getSpacing(4),
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: getSpacing(1),
  },
  phaseDescription: {
    fontSize: 16,
    color: '#CCC',
  },
  openButton: {
    marginTop: getSpacing(4),
    borderRadius: 25,
  },
  openButtonContent: {
    height: 50,
  },
  emojiSystem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  themeOptions: {
    marginVertical: getSpacing(3),
    gap: getSpacing(2),
  },
  themeButton: {
    marginVertical: getSpacing(1),
  },
  preloadingContainer: {
    alignItems: 'center',
    marginTop: getSpacing(3),
  },
  preloadingText: {
    marginTop: getSpacing(2),
    textAlign: 'center',
  },
});

export default EnhancedBoxOpeningScreen;