/**
 * Achievement Card Component
 * Exibe uma conquista individual com progresso e animações
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {Card, Text, ProgressBar, Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import {
  Achievement,
  AchievementProgress,
  AchievementRarity,
} from '../../types/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
  isUnlocked: boolean;
  onPress?: () => void;
  showDetails?: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  isUnlocked,
  onPress,
  showDetails = false,
}) => {
  const scale = useSharedValue(1);
  const unlockProgress = useSharedValue(0);

  useEffect(() => {
    if (isUnlocked) {
      // Animação de desbloqueio
      unlockProgress.value = withSequence(
        withSpring(1, { damping: 10 }),
        withSpring(0.95, { damping: 15 })
      );
      
      // Pulso de escala
      scale.value = withSequence(
        withSpring(1.05),
        withSpring(1)
      );
    }
  }, [isUnlocked]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      unlockProgress.value,
      [0, 1],
      ['#f5f5f5', getRarityColor(achievement.rarity)]
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(isUnlocked ? 1.2 : 1) },
      { rotateZ: withSpring(isUnlocked ? '5deg' : '0deg') },
    ],
  }));

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Animated.View style={cardStyle}>
        <Card style={[styles.card, isUnlocked && styles.unlockedCard]}>
          <Card.Content style={styles.content}>
            <View style={styles.header}>
              <Animated.View style={[styles.iconContainer, iconStyle]}>
                <Icon
                  name={achievement.icon}
                  size={32}
                  color={isUnlocked ? '#FFD700' : '#666'}
                />
                {isUnlocked && (
                  <View style={styles.checkmark}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                  </View>
                )}
              </Animated.View>
              
              <View style={styles.titleContainer}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.title,
                    isUnlocked && styles.unlockedTitle,
                  ]}
                >
                  {achievement.title}
                </Text>
                
                <View style={styles.rarityContainer}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.rarity,
                      { color: getRarityColor(achievement.rarity) },
                    ]}
                  >
                    {getRarityLabel(achievement.rarity)}
                  </Text>
                  {achievement.reward.points > 0 && (
                    <Text variant="bodySmall" style={styles.points}>
                      {achievement.reward.points} pts
                    </Text>
                  )}
                </View>
              </View>

              {progress.canClaim && (
                <Button
                  mode="contained"
                  compact
                  onPress={() => {/* Implementar claim */}}
                  style={styles.claimButton}
                >
                  Coletar
                </Button>
              )}
            </View>

            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                !isUnlocked && styles.lockedDescription,
              ]}
            >
              {achievement.description}
            </Text>

            {!isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text variant="bodySmall" style={styles.progressText}>
                    {progress.currentValue} / {progress.targetValue}
                  </Text>
                  <Text variant="bodySmall" style={styles.progressPercent}>
                    {Math.round(progress.percentage)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={progress.percentage / 100}
                  color={getRarityColor(achievement.rarity)}
                  style={styles.progressBar}
                />
              </View>
            )}

            {showDetails && isUnlocked && achievement.reward.title && (
              <View style={styles.rewardContainer}>
                <Icon name="trophy" size={16} color="#FFD700" />
                <Text variant="bodySmall" style={styles.rewardTitle}>
                  Título desbloqueado: {achievement.reward.title}
                </Text>
              </View>
            )}

            {showDetails && achievement.prerequisites?.length && (
              <View style={styles.prerequisitesContainer}>
                <Text variant="bodySmall" style={styles.prerequisitesTitle}>
                  Pré-requisitos:
                </Text>
                {/* Implementar lista de pré-requisitos */}
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );
};

function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':
      return '#9E9E9E';
    case 'rare':
      return '#2196F3';
    case 'epic':
      return '#9C27B0';
    case 'legendary':
      return '#FF9800';
    default:
      return '#9E9E9E';
  }
}

function getRarityLabel(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':
      return 'Comum';
    case 'rare':
      return 'Raro';
    case 'epic':
      return 'Épico';
    case 'legendary':
      return 'Lendário';
    default:
      return 'Comum';
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    elevation: 2,
  },
  unlockedCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  unlockedTitle: {
    color: '#FFD700',
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rarity: {
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  points: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#4CAF50',
  },
  description: {
    marginBottom: 12,
    lineHeight: 18,
  },
  lockedDescription: {
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    color: '#666',
  },
  progressPercent: {
    color: '#666',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF9C4',
    borderRadius: 6,
  },
  rewardTitle: {
    color: '#F57F17',
    fontWeight: '600',
  },
  prerequisitesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  prerequisitesTitle: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default AchievementCard;