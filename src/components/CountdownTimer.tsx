import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useCountdown, getUrgencyLevel } from '../hooks/useCountdown';
import { theme as appTheme } from '../theme';
import { hapticFeedback } from '../utils/haptic';

interface CountdownTimerProps {
  endDate: string;
  label?: string;
  variant?: 'compact' | 'detailed' | 'banner' | 'card';
  urgencyLevel?: 'auto' | 'low' | 'medium' | 'high' | 'critical';
  onExpired?: () => void;
  showIcon?: boolean;
  style?: ViewStyle;
  animate?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  label = "Termina em",
  variant = 'compact',
  urgencyLevel = 'auto',
  onExpired,
  showIcon = true,
  style,
  animate = true,
}) => {
  const theme = useTheme();
  const countdown = useCountdown(endDate, {
    onExpire: () => {
      hapticFeedback('notificationWarning');
      onExpired?.();
    },
    onTick: (state) => {
      // Vibrar quando restam apenas 10 segundos
      if (state.totalSeconds === 10) {
        hapticFeedback('impactMedium');
      }
    }
  });

  const pulseAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);
  const shakeAnimation = useSharedValue(0);

  // Determinar nível de urgência
  const actualUrgencyLevel = urgencyLevel === 'auto' 
    ? getUrgencyLevel(countdown.totalSeconds)
    : urgencyLevel;

  // Animações baseadas na urgência
  useEffect(() => {
    if (!animate) return;

    if (actualUrgencyLevel === 'critical' && !countdown.isExpired) {
      // Pulsação rápida para urgência crítica
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1
      );
      
      // Brilho pulsante
      glowAnimation.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1,
        true
      );

      // Tremor leve nos últimos 60 segundos
      if (countdown.totalSeconds < 60) {
        shakeAnimation.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 50 }),
            withTiming(-2, { duration: 50 }),
            withTiming(0, { duration: 50 })
          ),
          -1
        );
      }
    } else if (actualUrgencyLevel === 'high') {
      // Pulsação moderada
      pulseAnimation.value = withRepeat(
        withTiming(1.02, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [actualUrgencyLevel, countdown.totalSeconds, countdown.isExpired, animate]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseAnimation.value },
      { translateX: shakeAnimation.value }
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      glowAnimation.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolate.CLAMP
    ),
  }));

  // Cores baseadas na urgência
  const getColors = () => {
    if (countdown.isExpired) {
      return {
        primary: theme.colors.outline,
        secondary: theme.colors.outlineVariant,
        text: theme.colors.onSurface,
        gradient: [theme.colors.outline, theme.colors.outlineVariant]
      };
    }

    switch (actualUrgencyLevel) {
      case 'critical':
        return {
          primary: '#FF1744',
          secondary: '#D50000',
          text: '#FFFFFF',
          gradient: ['#FF1744', '#D50000']
        };
      case 'high':
        return {
          primary: '#FF6B6B',
          secondary: '#FF5252',
          text: '#FFFFFF',
          gradient: ['#FF6B6B', '#FF5252']
        };
      case 'medium':
        return {
          primary: '#FFA726',
          secondary: '#FF9800',
          text: '#000000',
          gradient: ['#FFA726', '#FF9800']
        };
      default:
        return {
          primary: theme.colors.primary,
          secondary: theme.colors.primaryContainer,
          text: theme.colors.onPrimary,
          gradient: [theme.colors.primary, theme.colors.primaryContainer]
        };
    }
  };

  const colors = getColors();
  const icon = countdown.isExpired ? '⏰' : actualUrgencyLevel === 'critical' ? '🔥' : '⏱️';

  // Renderizar variante compacta
  if (variant === 'compact') {
    return (
      <Animated.View 
        style={[styles.compact, animatedContainerStyle, style]}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <LinearGradient
          colors={colors.gradient}
          style={styles.compactGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {showIcon && <Text style={styles.compactIcon}>{icon}</Text>}
          <Text style={[styles.compactText, { color: colors.text }]}>
            {countdown.formattedTime}
          </Text>
        </LinearGradient>
        {actualUrgencyLevel === 'critical' && !countdown.isExpired && (
          <Animated.View style={[styles.glow, animatedGlowStyle]} />
        )}
      </Animated.View>
    );
  }

  // Renderizar variante banner
  if (variant === 'banner') {
    return (
      <Animated.View 
        style={[styles.banner, animatedContainerStyle, style]}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <LinearGradient
          colors={colors.gradient}
          style={styles.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            {showIcon && <Text style={styles.bannerIcon}>{icon}</Text>}
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.bannerTime, { color: colors.text }]}>
                {countdown.formattedTime}
              </Text>
            </View>
          </View>
        </LinearGradient>
        {actualUrgencyLevel === 'critical' && !countdown.isExpired && (
          <Animated.View style={[styles.bannerGlow, animatedGlowStyle]} />
        )}
      </Animated.View>
    );
  }

  // Renderizar variante detalhada
  if (variant === 'detailed') {
    return (
      <Animated.View 
        style={[animatedContainerStyle, style]}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <Card style={[styles.detailedCard, { borderColor: colors.primary }]}>
          <LinearGradient
            colors={colors.gradient}
            style={styles.detailedHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.detailedLabel, { color: colors.text }]}>{label}</Text>
          </LinearGradient>
          
          <Card.Content style={styles.detailedContent}>
            {countdown.isExpired ? (
              <Text style={[styles.expiredText, { color: colors.primary }]}>
                EXPIRADO
              </Text>
            ) : (
              <View style={styles.timeGrid}>
                {countdown.days > 0 && (
                  <View style={styles.timeUnit}>
                    <Text style={[styles.timeValue, { color: colors.primary }]}>
                      {String(countdown.days).padStart(2, '0')}
                    </Text>
                    <Text style={styles.timeLabel}>dias</Text>
                  </View>
                )}
                <View style={styles.timeUnit}>
                  <Text style={[styles.timeValue, { color: colors.primary }]}>
                    {String(countdown.hours).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>horas</Text>
                </View>
                <View style={styles.timeUnit}>
                  <Text style={[styles.timeValue, { color: colors.primary }]}>
                    {String(countdown.minutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>min</Text>
                </View>
                <View style={styles.timeUnit}>
                  <Text style={[styles.timeValue, { color: colors.primary }]}>
                    {String(countdown.seconds).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>seg</Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    );
  }

  // Renderizar variante card
  return (
    <Animated.View 
      style={[animatedContainerStyle, style]}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <Card style={styles.card}>
        <LinearGradient
          colors={colors.gradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            {showIcon && <Text style={styles.cardIcon}>{icon}</Text>}
            <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.cardTime, { color: colors.text }]}>
              {countdown.formattedTime}
            </Text>
          </View>
        </LinearGradient>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Compact styles
  compact: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FF1744',
  },

  // Banner styles
  banner: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  bannerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  bannerTime: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bannerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF1744',
  },

  // Detailed styles
  detailedCard: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  detailedHeader: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailedLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailedContent: {
    paddingVertical: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  timeLabel: {
    fontSize: 11,
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiredText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },

  // Card styles
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default CountdownTimer;