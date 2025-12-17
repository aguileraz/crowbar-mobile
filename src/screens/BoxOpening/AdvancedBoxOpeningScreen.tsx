/**
 * Advanced Box Opening Screen
 * Tela com sistema completo de animações gamificadas
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Vibration,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
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
  withDelay,
  withTiming,
  // interpolate,
  // runOnJS,
} from 'react-native-reanimated';

// Components
import SpriteSheetAnimator from '../../components/animations/SpriteSheetAnimator';
import EmojiReactionSystem from '../../components/animations/EmojiReactionSystem';

// Services
import animationAssetManager from '../../services/animationAssetManager';
import { analyticsService } from '../../services/analyticsService';

// Redux
import { AppDispatch } from '../../store';
import {
  openMysteryBox,
  setCurrentBox,
  startOpeningAnimation,
  startRevealingItems,
  completeOpening,
  resetOpening,
  selectCurrentBox,
  selectOpeningResult,
  selectAnimationState,
} from '../../store/slices/boxOpeningSlice';

// Types

import { RootStackParamList } from '../../navigation/AppNavigator';

// Theme
import { theme, getSpacing } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type AdvancedBoxOpeningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdvancedBoxOpening'>;
type AdvancedBoxOpeningScreenRouteProp = RouteProp<RootStackParamList, 'AdvancedBoxOpening'>;

interface Props {
  navigation: AdvancedBoxOpeningScreenNavigationProp;
  route: AdvancedBoxOpeningScreenRouteProp;
}

const AdvancedBoxOpeningScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  // Redux state
  const currentBox = useSelector(selectCurrentBox);
  const openingResult = useSelector(selectOpeningResult);
  const animationState = useSelector(selectAnimationState);
  
  // Local state
  const [selectedTheme, setSelectedTheme] = useState<'fire' | 'ice' | 'meteor'>('fire');
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [showThemeSelector, setShowThemeSelector] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [showEmojiReaction, setShowEmojiReaction] = useState(false);
  const [userReaction, setUserReaction] = useState<'kiss' | 'angry' | 'cool' | 'tongue' | null>(null);
  
  // Animation values
  const boxScale = useSharedValue(1);
  const boxRotation = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  
  // Sequences de animação
  const animationSequences = useRef<any[]>([]);
  
  // Initialize box
  useEffect(() => {
    if (route.params.box) {
      dispatch(setCurrentBox(route.params.box));
    }
  }, [route.params.box, dispatch]);
  
  // Pré-carrega assets ao selecionar tema
  const handleThemeSelect = async (themeType: 'fire' | 'ice' | 'meteor') => {
    setSelectedTheme(themeType);
    setIsPreloading(true);

    try {
      await animationAssetManager.preloadAnimationAssets(themeType);
      animationSequences.current = animationAssetManager.getAnimationSequences(themeType);
      setShowThemeSelector(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar animações');
    } finally {
      setIsPreloading(false);
    }
  };
  
  // Inicia processo de abertura
  const startBoxOpening = async () => {
    if (!currentBox) return;
    
    // Rastrear evento
    analyticsService.trackEngagement('box_opening_started', selectedTheme, 1);
    
    // Vibração inicial
    Vibration.vibrate([0, 100, 50, 100]);
    
    // Animação de shake da caixa
    boxRotation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    
    // Escala da caixa
    boxScale.value = withSequence(
      withSpring(1.1),
      withDelay(500, withSpring(0.1))
    );
    
    // Fade do background
    backgroundOpacity.value = withTiming(1, { duration: 500 });
    
    // Inicia animações após delay
    setTimeout(() => {
      dispatch(startOpeningAnimation());
      playAnimationSequence();
    }, 1000);
    
    // Abre caixa no servidor
    try {
      const result = await dispatch(openMysteryBox(currentBox.id)).unwrap();
      
      // Rastrear sucesso
      analyticsService.trackBoxOpening(
        currentBox.id,
        currentBox.name,
        currentBox.price,
        result.items_received
      );
      
      // Revela itens após animação
      setTimeout(() => {
        dispatch(startRevealingItems());
        revealProducts();
      }, animationSequences.current[0]?.totalDuration || 3000);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message);
      dispatch(resetOpening());
    }
  };
  
  // Reproduz sequência de animação
  const playAnimationSequence = () => {
    if (animationSequences.current.length === 0) return;
    
    const sequence = animationSequences.current[0];
    let delay = 0;
    
    sequence.assets.forEach((asset: any, index: number) => {
      setTimeout(() => {
        setCurrentAnimationIndex(index);
        
        // Vibração para explosões
        if (asset.type === 'explosion' || asset.type === 'burst') {
          Vibration.vibrate(200);
        }
      }, delay);
      
      delay += asset.duration;
    });
  };
  
  // Revela produtos com animação
  const revealProducts = () => {
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 500 }),
      withDelay(500, withTiming(1, { duration: 1000 }))
    );
    
    // Mostra reações emoji após revelação
    setTimeout(() => {
      setShowEmojiReaction(true);
    }, 2000);
  };
  
  // Lida com reação do usuário
  const handleUserReaction = (reaction: 'kiss' | 'angry' | 'cool' | 'tongue') => {
    setUserReaction(reaction);
    
    // Rastrear reação
    analyticsService.trackEngagement('user_reaction', reaction, 1);
    
    // Vibração de feedback
    Vibration.vibrate(50);
    
    // Completa abertura
    setTimeout(() => {
      dispatch(completeOpening());
    }, 1500);
  };
  
  // Pula animação
  const skipAnimation = () => {
    dispatch(completeOpening());
    setShowEmojiReaction(true);
  };
  
  // Compartilha resultado
  const shareResult = () => {
    // Implementar compartilhamento
    analyticsService.trackEngagement('share_result', selectedTheme, 1);
  };
  
  // Abre outra caixa
  const openAnother = () => {
    dispatch(resetOpening());
    setCurrentAnimationIndex(0);
    setShowThemeSelector(true);
    setShowEmojiReaction(false);
    setUserReaction(null);
    boxScale.value = 1;
    boxRotation.value = 0;
    backgroundOpacity.value = 0;
    contentOpacity.value = 1;
  };
  
  // Estilos animados
  const boxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: boxScale.value },
      { rotate: `${boxRotation.value}deg` },
    ],
  }));
  
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));
  
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  
  // Renderiza seletor de tema
  const renderThemeSelector = () => (
    <Portal>
      <Dialog visible={showThemeSelector} dismissable={false}>
        <Dialog.Title>Escolha o Tema da Abertura</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            Selecione um tema especial para a abertura da sua caixa misteriosa!
          </Paragraph>
          
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, selectedTheme === 'fire' && styles.selectedTheme]}
              onPress={() => handleThemeSelect('fire')}
              disabled={isPreloading}
            >
              <Text style={styles.themeEmoji}>🔥</Text>
              <Text style={styles.themeName}>Fogo</Text>
              <Text style={styles.themeDesc}>Explosivo e intenso</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.themeOption, selectedTheme === 'ice' && styles.selectedTheme]}
              onPress={() => handleThemeSelect('ice')}
              disabled={isPreloading}
            >
              <Text style={styles.themeEmoji}>❄️</Text>
              <Text style={styles.themeName}>Gelo</Text>
              <Text style={styles.themeDesc}>Frio e misterioso</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.themeOption, selectedTheme === 'meteor' && styles.selectedTheme]}
              onPress={() => handleThemeSelect('meteor')}
              disabled={isPreloading}
            >
              <Text style={styles.themeEmoji}>☄️</Text>
              <Text style={styles.themeName}>Meteoro</Text>
              <Text style={styles.themeDesc}>Cósmico e épico</Text>
            </TouchableOpacity>
          </View>
          
          {isPreloading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Carregando animações...</Text>
            </View>
          )}
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
  
  // Renderiza animação atual
  const renderCurrentAnimation = () => {
    if (!animationSequences.current.length || animationState !== 'opening') {
      return null;
    }
    
    const sequence = animationSequences.current[0];
    const asset = sequence.assets[currentAnimationIndex];
    
    if (!asset) return null;
    
    return (
      <SpriteSheetAnimator
        asset={asset}
        autoPlay={true}
        scale={1.2}
        style={styles.animationContainer}
      />
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background animado */}
      <Animated.View style={[styles.animatedBackground, backgroundAnimatedStyle]} />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>
          {animationState === 'idle' ? 'Preparar Abertura' :
           animationState === 'opening' ? 'Abrindo Caixa...' :
           animationState === 'revealing' ? 'Revelando Prêmios!' :
           'Abertura Concluída!'}
        </Text>
        {animationState === 'opening' && (
          <IconButton
            icon="skip-next"
            size={24}
            onPress={skipAnimation}
          />
        )}
      </View>
      
      {/* Conteúdo principal */}
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={contentAnimatedStyle}>
          {/* Caixa antes da abertura */}
          {animationState === 'idle' && !showThemeSelector && (
            <Animated.View style={[styles.boxContainer, boxAnimatedStyle]}>
              <View style={styles.box}>
                <Text style={styles.boxIcon}>📦</Text>
              </View>
              <Text style={styles.boxName}>{currentBox?.name}</Text>
              <Button
                mode="contained"
                onPress={startBoxOpening}
                style={styles.openButton}
                contentStyle={styles.openButtonContent}
              >
                ABRIR CAIXA MISTERIOSA
              </Button>
            </Animated.View>
          )}
          
          {/* Animação de abertura */}
          {animationState === 'opening' && renderCurrentAnimation()}
          
          {/* Revelação de itens */}
          {animationState === 'revealing' && openingResult && (
            <View style={styles.revealContainer}>
              <Text style={styles.revealTitle}>🎉 Parabéns! Você ganhou:</Text>
              {openingResult.items.map((item, _index) => (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemRarity}>{item.rarity}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Sistema de reação emoji */}
          {showEmojiReaction && (
            <EmojiReactionSystem
              onReaction={handleUserReaction}
              selectedReaction={userReaction}
            />
          )}
          
          {/* Ações finais */}
          {animationState === 'completed' && (
            <View style={styles.completedActions}>
              <Button
                mode="outlined"
                onPress={shareResult}
                style={styles.actionButton}
                icon="share"
              >
                Compartilhar
              </Button>
              <Button
                mode="contained"
                onPress={openAnother}
                style={styles.actionButton}
                icon="package"
              >
                Abrir Outra
              </Button>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Seletor de tema */}
      {renderThemeSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  boxContainer: {
    alignItems: 'center',
  },
  box: {
    width: 200,
    height: 200,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
    elevation: 8,
  },
  boxIcon: {
    fontSize: 100,
  },
  boxName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('lg'),
    textAlign: 'center',
  },
  openButton: {
    paddingHorizontal: getSpacing('xl'),
    borderRadius: 30,
    elevation: 6,
  },
  openButtonContent: {
    paddingVertical: getSpacing('md'),
  },
  themeOptions: {
    marginTop: getSpacing('lg'),
  },
  themeOption: {
    padding: getSpacing('md'),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    marginBottom: getSpacing('md'),
    alignItems: 'center',
  },
  selectedTheme: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  themeEmoji: {
    fontSize: 48,
    marginBottom: getSpacing('sm'),
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  themeDesc: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  loadingContainer: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  loadingText: {
    marginTop: getSpacing('md'),
    color: theme.colors.onSurfaceVariant,
  },
  animationContainer: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  revealContainer: {
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  revealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: getSpacing('lg'),
    color: theme.colors.primary,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    padding: getSpacing('md'),
    borderRadius: 12,
    marginBottom: getSpacing('md'),
    width: '100%',
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  itemRarity: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  completedActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getSpacing('md'),
    marginTop: getSpacing('xl'),
  },
  actionButton: {
    minWidth: 140,
  },
});

export default AdvancedBoxOpeningScreen;