import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  Portal,
  Modal,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Redux
import { AppDispatch } from '../../store';
import {
  openMysteryBox,
  setCurrentBox,
  startOpeningAnimation,
  startRevealingItems,
  revealNextItem,
  completeOpening,
  setShowShareModal,
  resetOpening,
  selectCurrentBox,
  selectOpeningResult,
  selectIsOpening,
  selectAnimationState,
  selectRevealedItems,
  selectCurrentRevealIndex,
  selectShowShareModal,
  selectBoxOpeningError,
} from '../../store/slices/boxOpeningSlice';

// Components
import BoxOpeningAnimation from '../../components/BoxOpeningAnimation';
import ItemRevealCard from '../../components/ItemRevealCard';
import ShareResultModal from '../../components/ShareResultModal';
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { MysteryBox } from '../../types/api';

// Theme
import { theme, getSpacing } from '../../theme';

/**
 * Tela de Abertura de Caixas
 * Animações de abertura e revelação dos itens
 */

type BoxOpeningScreenNavigationProp = NativeStackNavigationProp<any, 'BoxOpening'>;
type BoxOpeningScreenRouteProp = RouteProp<{
  BoxOpening: { box: MysteryBox };
}, 'BoxOpening'>;

interface BoxOpeningScreenProps {
  navigation: BoxOpeningScreenNavigationProp;
  route: BoxOpeningScreenRouteProp;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BoxOpeningScreen: React.FC<BoxOpeningScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  // Redux state
  const currentBox = useSelector(selectCurrentBox);
  const openingResult = useSelector(selectOpeningResult);
  const isOpening = useSelector(selectIsOpening);
  const animationState = useSelector(selectAnimationState);
  const revealedItems = useSelector(selectRevealedItems);
  const currentRevealIndex = useSelector(selectCurrentRevealIndex);
  const showShareModal = useSelector(selectShowShareModal);
  const error = useSelector(selectBoxOpeningError);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Local state
  const [canStartOpening, setCanStartOpening] = useState(true);

  // Initialize box
  useEffect(() => {
    if (route.params.box) {
      dispatch(setCurrentBox(route.params.box));
    }
  }, [route.params.box, dispatch]);

  // Handle animation state changes
  useEffect(() => {
    switch (animationState) {
      case 'opening':
        startBoxOpeningAnimation();
        break;
      case 'revealing':
        startItemRevealSequence();
        break;
      case 'completed':
        // Animation completed
        break;
    }
  }, [animationState]);

  /**
   * Start box opening process
   */
  const handleOpenBox = async () => {
    if (!currentBox || !canStartOpening) return;
    
    setCanStartOpening(false);
    
    try {
      // Start opening animation
      dispatch(startOpeningAnimation());
      
      // Open box on server
      await dispatch(openMysteryBox(currentBox.id)).unwrap();
      
      // Wait for opening animation to complete
      setTimeout(() => {
        dispatch(startRevealingItems());
      }, 2000);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao abrir caixa');
      setCanStartOpening(true);
    }
  };

  /**
   * Start box opening animation
   */
  const startBoxOpeningAnimation = () => {
    // Shake animation
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Scale and fade animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Start item reveal sequence
   */
  const startItemRevealSequence = () => {
    if (!openingResult) return;
    
    // Reset animations
    scaleAnim.setValue(1);
    fadeAnim.setValue(1);
    rotateAnim.setValue(0);
    
    // Start revealing items one by one
    revealItemsSequentially();
  };

  /**
   * Reveal items sequentially
   */
  const revealItemsSequentially = () => {
    if (!openingResult) return;
    
    const revealInterval = setInterval(() => {
      if (currentRevealIndex < openingResult.items.length) {
        dispatch(revealNextItem());
      } else {
        clearInterval(revealInterval);
        dispatch(completeOpening());
      }
    }, 800); // Reveal one item every 800ms
  };

  /**
   * Skip to end of animation
   */
  const skipAnimation = () => {
    dispatch(completeOpening());
  };

  /**
   * Share results
   */
  const handleShare = () => {
    dispatch(setShowShareModal(true));
  };

  /**
   * Open another box
   */
  const handleOpenAnother = () => {
    dispatch(resetOpening());
    navigation.goBack();
  };

  /**
   * Go back to previous screen
   */
  const handleGoBack = () => {
    if (animationState === 'idle' || animationState === 'completed') {
      dispatch(resetOpening());
      navigation.goBack();
    } else {
      Alert.alert(
        'Abertura em andamento',
        'Deseja cancelar a abertura da caixa?',
        [
          { text: 'Continuar', style: 'cancel' },
          {
            text: 'Cancelar',
            style: 'destructive',
            onPress: () => {
              dispatch(resetOpening());
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  /**
   * Get rotation interpolation
   */
  const getRotateInterpolation = () => {
    return rotateAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-10deg', '10deg'],
    });
  };

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => dispatch(resetOpening())}
        style={styles.container}
      />
    );
  }

  if (!currentBox) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando caixa...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleGoBack}
          disabled={isOpening}
        />
        <Text style={styles.headerTitle}>
          {animationState === 'idle' ? 'Abrir Caixa' : 
           animationState === 'opening' ? 'Abrindo...' :
           animationState === 'revealing' ? 'Revelando Itens...' :
           'Abertura Concluída'}
        </Text>
        {animationState === 'revealing' && (
          <IconButton
            icon="fast-forward"
            size={24}
            onPress={skipAnimation}
          />
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {animationState === 'idle' && (
          <BoxOpeningAnimation
            box={currentBox}
            animationState={animationState}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            rotateAnim={rotateAnim}
            onOpenPress={handleOpenBox}
            canOpen={canStartOpening && !isOpening}
            isLoading={isOpening}
          />
        )}

        {(animationState === 'opening' || animationState === 'revealing' || animationState === 'completed') && (
          <View style={styles.revealContainer}>
            {/* Box Animation */}
            <Animated.View
              style={[
                styles.boxContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: scaleAnim },
                    { rotate: getRotateInterpolation() },
                  ],
                },
              ]}
            >
              <BoxOpeningAnimation
                box={currentBox}
                animationState={animationState}
                fadeAnim={fadeAnim}
                scaleAnim={scaleAnim}
                rotateAnim={rotateAnim}
                onOpenPress={handleOpenBox}
                canOpen={false}
                isLoading={false}
              />
            </Animated.View>

            {/* Revealed Items */}
            {revealedItems.length > 0 && (
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>
                  Itens Encontrados ({revealedItems.length}/{openingResult?.items.length || 0})
                </Text>
                <View style={styles.itemsGrid}>
                  {revealedItems.map((item, index) => (
                    <ItemRevealCard
                      key={`${item.id}-${index}`}
                      item={item}
                      index={index}
                      style={styles.itemCard}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      {animationState === 'completed' && (
        <View style={styles.bottomActions}>
          <Button
            mode="outlined"
            onPress={handleShare}
            style={styles.actionButton}
            icon="share"
          >
            Compartilhar
          </Button>
          <Button
            mode="contained"
            onPress={handleOpenAnother}
            style={styles.actionButton}
            icon="gift"
          >
            Abrir Outra
          </Button>
        </View>
      )}

      {/* Share Modal */}
      <Portal>
        <ShareResultModal
          visible={showShareModal}
          onDismiss={() => dispatch(setShowShareModal(false))}
          openingResult={openingResult}
          box={currentBox}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: getSpacing('md'),
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  boxContainer: {
    marginBottom: getSpacing('xl'),
  },
  itemsContainer: {
    flex: 1,
    width: '100%',
    padding: getSpacing('md'),
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: getSpacing('lg'),
    color: theme.colors.onSurface,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: getSpacing('md'),
  },
  itemCard: {
    width: (screenWidth - getSpacing('md') * 3) / 2,
    maxWidth: 150,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: getSpacing('md'),
    gap: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  actionButton: {
    flex: 1,
  },
});

export default BoxOpeningScreen;
