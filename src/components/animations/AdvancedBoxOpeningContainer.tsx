import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Text, Button, Card, ProgressBar } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  // withTiming,
  // withSequence,
  // runOnJS,
  // interpolate,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

// Componentes de animação
import SpriteSheetAnimator from './SpriteSheetAnimator';
import EmojiReactionSystem from './EmojiReactionSystem';
import AnimationErrorBoundary from './AnimationErrorBoundary';

// Actions e selectors
import {
  selectCurrentBox,
  selectAnimationSystemState,
  selectSelectedTheme,
  selectEmojiSystem,
  selectUserPreferences,
  selectCanOpenBox,
  openMysteryBoxAdvanced,
  setAnimationState,
  updateAnimationProgress,
  setSelectedTheme,
  addEmojiReaction,
  preloadAnimationThemes,
  recordAnimationEvent,
  updatePerformanceMetrics,
} from '../../store/slices/advancedBoxOpeningSlice';

// Services
import { animationManager, ThemeType } from '../../services/animationManager';

// Theme e utils
import { theme as _appTheme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Props do container principal
 */
interface AdvancedBoxOpeningContainerProps {
  boxId: string;
  onAnimationComplete?: () => void;
  onError?: (error: string) => void;
  initialTheme?: ThemeType;
  enableDebugMode?: boolean;
}

const { width: _SCREEN_WIDTH, height: _SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Container principal do sistema de abertura de caixas avançado
 * Integra todos os sistemas de animação, emoji, gamificação e performance
 */
const AdvancedBoxOpeningContainer: React.FC<AdvancedBoxOpeningContainerProps> = ({
  boxId,
  onAnimationComplete,
  onError,
  initialTheme = 'classic',
  enableDebugMode = false,
}) => {
  const dispatch = useDispatch();
  
  // Selectors do Redux
  const currentBox = useSelector(selectCurrentBox);
  const animationSystem = useSelector(selectAnimationSystemState);
  const selectedTheme = useSelector(selectSelectedTheme);
  const emojiSystem = useSelector(selectEmojiSystem);
  const userPreferences = useSelector(selectUserPreferences);
  const canOpenBox = useSelector(selectCanOpenBox);
  
  // Estado local
  const [isReady, setIsReady] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
  });
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);

  // Valores animados para transições
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.8);
  const backgroundBlur = useSharedValue(0);

  // Configuração de tema
  const currentThemeConfig = useMemo(() => {
    if (!selectedTheme) return null;
    return animationManager.getThemeWithFallback(selectedTheme);
  }, [selectedTheme]);

  // Verificar acessibilidade
  useEffect(() => {
    const checkAccessibility = async () => {
      try {
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setAccessibilityEnabled(isReduceMotionEnabled);
        
        if (isReduceMotionEnabled && !userPreferences.reduceMotion) {
          // Sugerir ativação do modo de movimento reduzido
          Alert.alert(
            'Configuração de Acessibilidade',
            'Detectamos que você tem movimento reduzido ativado. Deseja ativar as configurações de acessibilidade?',
            [
              { text: 'Não', style: 'cancel' },
              { text: 'Sim', onPress: () => dispatch(updatePreferences({ reduceMotion: true })) },
            ]
          );
        }
      } catch (error) {
        // console.warn('Erro ao verificar configurações de acessibilidade:', error);
      }
    };

    checkAccessibility();
  }, [dispatch, userPreferences.reduceMotion]);

  // Inicialização do sistema
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Preload de temas baseado nas preferências
        const themesToPreload: ThemeType[] = [initialTheme];
        
        // Adicionar temas favoritos do usuário
        if (selectedTheme && selectedTheme !== initialTheme) {
          themesToPreload.push(selectedTheme);
        }

        dispatch(recordAnimationEvent({
          type: 'system',
          timestamp: Date.now(),
          data: { systemInfo: 'Initialization started' },
        }));

        await dispatch(preloadAnimationThemes(themesToPreload)).unwrap();
        
        // Definir tema inicial
        if (!selectedTheme) {
          dispatch(setSelectedTheme(initialTheme));
        }

        // Animação de entrada
        containerOpacity.value = withTiming(1, { duration: 500 });
        containerScale.value = withTiming(1, { duration: 500 });

        setIsReady(true);

        dispatch(recordAnimationEvent({
          type: 'system',
          timestamp: Date.now(),
          data: { systemInfo: 'Initialization completed' },
        }));
      } catch (error: any) {
        // console.error('Erro na inicialização:', error);
        if (onError) {
          onError(error.message || 'Erro na inicialização do sistema');
        }
      }
    };

    initializeSystem();
  }, [dispatch, initialTheme, selectedTheme, onError]);

  // Monitor de performance
  useEffect(() => {
    if (!enableDebugMode) return;

    const performanceInterval = setInterval(() => {
      const stats = animationManager.getCacheStats();
      const newStats = {
        fps: Math.round(Math.random() * 5 + 55), // Simular FPS
        renderTime: Math.round(Math.random() * 10 + 5),
        memoryUsage: stats.totalMemory,
      };
      
      setPerformanceStats(newStats);
      
      dispatch(updatePerformanceMetrics({
        averageFPS: newStats.fps,
        renderTime: newStats.renderTime,
      }));
    }, 1000);

    return () => clearInterval(performanceInterval);
  }, [dispatch, enableDebugMode]);

  // Função principal para abrir caixa
  const handleOpenBox = useCallback(async () => {
    if (!canOpenBox || !currentBox || !currentThemeConfig) return;

    try {
      dispatch(recordAnimationEvent({
        type: 'user',
        timestamp: Date.now(),
        data: { userAction: 'box_opening_started' },
      }));

      const startTime = Date.now();
      
      // Efeito de background blur durante animação
      backgroundBlur.value = withTiming(10, { duration: 800 });

      // Iniciar abertura
      await dispatch(openMysteryBoxAdvanced({ 
        boxId,
        themeOverride: selectedTheme || undefined
      })).unwrap();

      const duration = Date.now() - startTime;
      
      dispatch(updatePerformanceMetrics({
        animationDuration: duration,
      }));

    } catch (error: any) {
      // console.error('Erro ao abrir caixa:', error);
      
      dispatch(recordAnimationEvent({
        type: 'error',
        timestamp: Date.now(),
        data: { error },
      }));

      if (onError) {
        onError(error.message || 'Erro ao abrir caixa');
      }
    }
  }, [canOpenBox, currentBox, currentThemeConfig, dispatch, boxId, selectedTheme, onError]);

  // Callback para troca de tema
  const handleThemeChange = useCallback((newTheme: ThemeType) => {
    if (animationSystem.currentState !== 'idle') return;

    dispatch(setSelectedTheme(newTheme));
    
    // Preload do novo tema se necessário
    if (!animationManager.isThemeLoaded(newTheme)) {
      dispatch(preloadAnimationThemes([newTheme]));
    }
  }, [dispatch, animationSystem.currentState]);

  // Callback para conclusão de animação
  const handleAnimationComplete = useCallback(() => {
    dispatch(setAnimationState('completed'));
    
    // Reset do background blur
    backgroundBlur.value = withTiming(0, { duration: 500 });
    
    dispatch(recordAnimationEvent({
      type: 'system',
      timestamp: Date.now(),
      data: { systemInfo: 'Animation completed' },
    }));

    if (onAnimationComplete) {
      onAnimationComplete();
    }
  }, [dispatch, onAnimationComplete]);

  // Callback para mudança de frame
  const handleFrameChange = useCallback((frame: number) => {
    dispatch(updateAnimationProgress({ frame }));
  }, [dispatch]);

  // Callback para reação emoji
  const handleEmojiReaction = useCallback((emojiConfig: any) => {
    const reactionId = `reaction_${Date.now()}_${Math.random()}`;
    
    dispatch(addEmojiReaction({
      id: reactionId,
      emoji: emojiConfig.emoji,
      points: emojiConfig.points,
    }));

    dispatch(recordAnimationEvent({
      type: 'user',
      timestamp: Date.now(),
      data: { userAction: 'emoji_reaction', emoji: emojiConfig.emoji },
    }));
  }, [dispatch]);

  // Estilo animado do container
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  // Estilo animado do background
  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${interpolate(backgroundBlur.value, [0, 10], [0, 0.7])})`,
  }));

  // Renderizar selector de temas
  const renderThemeSelector = () => {
    if (animationSystem.currentState !== 'idle') return null;

    const themes: Array<{ key: ThemeType; name: string; color: string }> = [
      { key: 'fire', name: 'Fogo', color: '#FF4444' },
      { key: 'ice', name: 'Gelo', color: '#44AAFF' },
      { key: 'meteor', name: 'Meteoro', color: '#AA44FF' },
      { key: 'classic', name: 'Clássico', color: '#FFD700' },
    ];

    return (
      <View style={styles.themeSelectorContainer}>
        <Text style={styles.themeSelectorTitle}>Escolha o Tema:</Text>
        <View style={styles.themeSelectorButtons}>
          {themes.map(theme => (
            <Button
              key={theme.key}
              mode={selectedTheme === theme.key ? 'contained' : 'outlined'}
              onPress={() => handleThemeChange(theme.key)}
              style={[
                styles.themeButton,
                { 
                  backgroundColor: selectedTheme === theme.key ? theme.color : 'transparent',
                  borderColor: theme.color,
                }
              ]}
              labelStyle={[
                styles.themeButtonLabel,
                { color: selectedTheme === theme.key ? 'white' : theme.color }
              ]}
              compact
            >
              {theme.name}
            </Button>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar debug info
  const renderDebugInfo = () => {
    if (!enableDebugMode) return null;

    return (
      <Card style={styles.debugCard}>
        <Card.Content>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>Estado: {animationSystem.currentState}</Text>
          <Text style={styles.debugText}>FPS: {performanceStats.fps}</Text>
          <Text style={styles.debugText}>Render: {performanceStats.renderTime}ms</Text>
          <Text style={styles.debugText}>Memória: {Math.round(performanceStats.memoryUsage / 1024 / 1024)}MB</Text>
          <Text style={styles.debugText}>Tema: {selectedTheme}</Text>
          <Text style={styles.debugText}>Reações Ativas: {emojiSystem.activeReactions.length}</Text>
        </Card.Content>
      </Card>
    );
  };

  if (!isReady || !currentThemeConfig) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando animações...</Text>
        <ProgressBar 
          progress={0.5} 
          color={_appTheme.colors.primary}
          style={styles.progressBar}
        />
      </View>
    );
  }

  return (
    <AnimationErrorBoundary
      showErrorDetails={enableDebugMode}
      onError={(error, _errorInfo) => {
        // console.error('Animation container error:', error, errorInfo);
        dispatch(recordAnimationEvent({
          type: 'error',
          timestamp: Date.now(),
          data: { error: error.toString() }
        }));
      }}
    >
      <View style={styles.container}>
        {/* Background com blur animado */}
        <Animated.View style={[styles.background, animatedBackgroundStyle]} />
        
        {/* Container principal */}
        <Animated.View style={[styles.contentContainer, animatedContainerStyle]}>
          
          {/* Selector de tema */}
          {renderThemeSelector()}
        
        {/* Sistema de animação principal */}
        <View style={styles.animationContainer}>
          <SpriteSheetAnimator
            theme={currentThemeConfig}
            shouldPlay={animationSystem.currentState === 'opening' || 
                        animationSystem.currentState === 'explosion'}
            onAnimationComplete={handleAnimationComplete}
            onFrameChange={handleFrameChange}
            enableInterruption={userPreferences.autoSkipAnimations}
            reduceMotion={userPreferences.reduceMotion || accessibilityEnabled}
            style={styles.spriteAnimator}
          />
        </View>

        {/* Botão de abertura */}
        {animationSystem.currentState === 'idle' && (
          <Button
            mode="contained"
            onPress={handleOpenBox}
            disabled={!canOpenBox}
            loading={!canOpenBox}
            style={[
              styles.openButton,
              { backgroundColor: currentThemeConfig.colors.primary }
            ]}
            contentStyle={styles.openButtonContent}
            labelStyle={styles.openButtonLabel}
          >
            ABRIR CAIXA MISTERIOSA
          </Button>
        )}

        {/* Debug info */}
        {renderDebugInfo()}
      </Animated.View>

      {/* Sistema de reações emoji */}
      <EmojiReactionSystem
        onReactionTrigger={handleEmojiReaction}
        maxActiveReactions={20}
        enablePhysics={!userPreferences.reduceMotion && !accessibilityEnabled}
        style={styles.emojiSystem}
      />
      </View>
    </AnimationErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing('lg'),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing('xl'),
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: _appTheme.colors.onSurface,
    marginBottom: getSpacing('lg'),
  },
  progressBar: {
    width: 200,
    height: 8,
    borderRadius: 4,
  },
  themeSelectorContainer: {
    marginBottom: getSpacing('xl'),
    alignItems: 'center',
  },
  themeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: _appTheme.colors.onSurface,
    marginBottom: getSpacing('md'),
  },
  themeSelectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: getSpacing('sm'),
  },
  themeButton: {
    borderRadius: getBorderRadius('md'),
    borderWidth: 2,
  },
  themeButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: getSpacing('xl'),
  },
  spriteAnimator: {
    // Estilo específico do sprite animator
  },
  openButton: {
    borderRadius: getBorderRadius('lg'),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  openButtonContent: {
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('xl'),
  },
  openButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  emojiSystem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  debugCard: {
    position: 'absolute',
    top: getSpacing('md'),
    right: getSpacing('md'),
    minWidth: 200,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: getSpacing('sm'),
  },
  debugText: {
    fontSize: 12,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default AdvancedBoxOpeningContainer;