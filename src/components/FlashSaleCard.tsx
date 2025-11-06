import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Card, Text, Button, Chip, useTheme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolateColor,
  FadeInDown,
  ZoomIn,
  withSpring
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import CountdownTimer from './CountdownTimer';
import { hapticFeedback } from '../utils/haptic';
import { theme as appTheme } from '../theme';
import { MysteryBox } from '../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashSaleCardProps {
  box: MysteryBox & {
    flash_sale?: {
      original_price: number;
      sale_price: number;
      ends_at: string;
      units_left: number;
      highlight_message?: string;
    };
  };
  onPress: () => void;
  index?: number;
}

const FlashSaleCard: React.FC<FlashSaleCardProps> = ({ box, onPress, index = 0 }) => {
  const _theme = useTheme();
  const flashAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);
  const sparkleAnimation = useSharedValue(0);
  const fireAnimation = useSharedValue(0);

  const flashSale = box.flash_sale!;
  const discount = Math.round(
    ((flashSale.original_price - flashSale.sale_price) / flashSale.original_price) * 100
  );

  // Animações de destaque
  useEffect(() => {
    // Animação de flash/brilho no fundo
    flashAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );

    // Animação de faísca
    sparkleAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 2000 })
      ),
      -1
    );

    // Animação de fogo (para ofertas muito boas)
    if (discount > 50) {
      fireAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.8, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1
      );
    }
  }, [discount]);

  const handlePress = () => {
    hapticFeedback('impactMedium');
    scaleAnimation.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onPress();
  };

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      flashAnimation.value,
      [0, 1],
      ['#FF5722', '#FF7043']
    );
    
    return { backgroundColor };
  });

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnimation.value,
    transform: [
      { scale: interpolateColor(sparkleAnimation.value, [0, 1], [1, 1.2]) as any }
    ],
  }));

  const animatedFireStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fireAnimation.value },
      { translateY: withTiming((1 - fireAnimation.value) * 5) }
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.container, animatedScaleStyle]}
    >
      <Pressable onPress={handlePress}>
        <Card style={styles.card}>
          {/* Header com gradiente animado */}
          <Animated.View style={[styles.headerContainer, animatedBackgroundStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'transparent']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Animated.Text style={[styles.flashIcon, animatedFireStyle]}>
                    {discount > 50 ? '🔥' : '⚡'}
                  </Animated.Text>
                  <Text style={styles.flashText}>FLASH SALE</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Sparkles overlay */}
            <Animated.View style={[styles.sparkleOverlay, animatedSparkleStyle]}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
            </Animated.View>
          </Animated.View>

          {/* Imagem do produto */}
          <View style={styles.imageContainer}>
            <FastImage
              source={{ uri: box.image }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
            
            {/* Timer overlay na imagem */}
            <View style={styles.timerOverlay}>
              <CountdownTimer
                endDate={flashSale.ends_at}
                variant="compact"
                urgencyLevel="critical"
                animate
              />
            </View>

            {/* Badge de unidades restantes */}
            {flashSale.units_left < 10 && (
              <Animated.View 
                entering={ZoomIn}
                style={styles.stockBadge}
              >
                <Text style={styles.stockText}>
                  🔥 Restam {flashSale.units_left}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Conteúdo */}
          <Card.Content style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {box.name}
            </Text>

            {/* Mensagem de destaque */}
            {flashSale.highlight_message && (
              <View style={styles.highlightContainer}>
                <Text style={styles.highlightMessage}>
                  {flashSale.highlight_message}
                </Text>
              </View>
            )}

            {/* Preços */}
            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.originalPrice}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(flashSale.original_price)}
                </Text>
                <Text style={styles.salePrice}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(flashSale.sale_price)}
                </Text>
              </View>
              
              <View style={styles.savingsContainer}>
                <Text style={styles.savingsLabel}>Você economiza</Text>
                <Text style={styles.savingsValue}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(flashSale.original_price - flashSale.sale_price)}
                </Text>
              </View>
            </View>

            {/* Timer detalhado */}
            <CountdownTimer
              endDate={flashSale.ends_at}
              label="Oferta termina em"
              variant="detailed"
              urgencyLevel="high"
              style={styles.detailedTimer}
            />

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {box.category && (
                <Chip 
                  mode="flat" 
                  compact 
                  style={styles.tag}
                  textStyle={styles.tagText}
                >
                  {box.category}
                </Chip>
              )}
              {discount > 70 && (
                <Chip 
                  mode="flat" 
                  compact 
                  style={[styles.tag, styles.megaTag]}
                  textStyle={styles.tagText}
                >
                  MEGA OFERTA
                </Chip>
              )}
              {flashSale.units_left < 5 && (
                <Chip 
                  mode="flat" 
                  compact 
                  style={[styles.tag, styles.lastUnitsTag]}
                  textStyle={styles.tagText}
                >
                  ÚLTIMAS UNIDADES
                </Chip>
              )}
            </View>

            {/* Botão de ação */}
            <Button
              mode="contained"
              onPress={handlePress}
              style={styles.buyButton}
              labelStyle={styles.buyButtonLabel}
              contentStyle={styles.buyButtonContent}
            >
              COMPRAR AGORA
            </Button>

            {/* Aviso de urgência */}
            <Text style={styles.urgencyText}>
              ⚠️ Esta oferta é por tempo limitado!
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    position: 'relative',
    height: 50,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  discountText: {
    color: '#FF5722',
    fontSize: 18,
    fontWeight: '800',
  },
  sparkleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
  },
  sparkle2: {
    top: 10,
    right: 50,
  },
  sparkle3: {
    bottom: 10,
    left: 100,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  timerOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 61, 0, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  highlightContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  highlightMessage: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF5722',
  },
  savingsContainer: {
    alignItems: 'flex-end',
  },
  savingsLabel: {
    fontSize: 11,
    color: '#757575',
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  detailedTimer: {
    marginVertical: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  megaTag: {
    backgroundColor: '#FFE0B2',
  },
  lastUnitsTag: {
    backgroundColor: '#FFEBEE',
  },
  buyButton: {
    borderRadius: 24,
    backgroundColor: '#FF5722',
  },
  buyButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buyButtonContent: {
    paddingVertical: 8,
  },
  urgencyText: {
    fontSize: 11,
    color: '#FF5722',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});

export default FlashSaleCard;