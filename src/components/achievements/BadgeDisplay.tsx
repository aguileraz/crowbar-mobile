/**
 * Badge Display Component
 * Exibe badges do usuário com animações e seleção
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card, Button, Portal, Modal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { UserBadge, AchievementRarity } from '../../types/achievements';

interface BadgeDisplayProps {
  badges: UserBadge[];
  onBadgeSelect?: (badge: UserBadge) => void;
  equippedBadgeId?: string;
  showEquipButton?: boolean;
  horizontal?: boolean;
  maxVisible?: number;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badges,
  onBadgeSelect,
  equippedBadgeId,
  showEquipButton = false,
  horizontal = false,
  maxVisible,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleBadgePress = (badge: UserBadge) => {
    if (showEquipButton) {
      setSelectedBadge(badge);
      setShowModal(true);
    } else {
      onBadgeSelect?.(badge);
    }
  };

  const handleEquip = () => {
    if (selectedBadge) {
      onBadgeSelect?.(selectedBadge);
      setShowModal(false);
      setSelectedBadge(null);
    }
  };

  const displayBadges = maxVisible ? badges.slice(0, maxVisible) : badges;
  const remainingCount = maxVisible ? Math.max(0, badges.length - maxVisible) : 0;

  const renderBadge = (badge: UserBadge, index: number) => (
    <BadgeItem
      key={badge.id}
      badge={badge}
      isEquipped={badge.id === equippedBadgeId}
      onPress={() => handleBadgePress(badge)}
      animationDelay={index * 100}
    />
  );

  return (
    <View style={styles.container}>
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {displayBadges.map(renderBadge)}
          {remainingCount > 0 && (
            <View style={styles.moreIndicator}>
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          {displayBadges.map(renderBadge)}
          {remainingCount > 0 && (
            <View style={[styles.badgeContainer, styles.moreIndicator]}>
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      )}

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedBadge && (
            <Card style={styles.modalCard}>
              <Card.Content style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.largeBadgeContainer,
                    { borderColor: getRarityColor(selectedBadge.rarity) }
                  ]}>
                    <Icon
                      name={selectedBadge.icon}
                      size={64}
                      color={getRarityColor(selectedBadge.rarity)}
                    />
                  </View>
                </View>

                <Text variant="headlineSmall" style={styles.modalTitle}>
                  {selectedBadge.name}
                </Text>

                <Text
                  variant="bodyMedium"
                  style={[
                    styles.modalRarity,
                    { color: getRarityColor(selectedBadge.rarity) }
                  ]}
                >
                  {getRarityLabel(selectedBadge.rarity)}
                </Text>

                <Text variant="bodyMedium" style={styles.modalDescription}>
                  {selectedBadge.description}
                </Text>

                <Text variant="bodySmall" style={styles.modalDate}>
                  Desbloqueado em {new Date(selectedBadge.unlockedAt).toLocaleDateString('pt-BR')}
                </Text>

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowModal(false)}
                    style={styles.modalButton}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={handleEquip}
                    style={styles.modalButton}
                    disabled={selectedBadge.id === equippedBadgeId}
                  >
                    {selectedBadge.id === equippedBadgeId ? 'Equipado' : 'Equipar'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

interface BadgeItemProps {
  badge: UserBadge;
  isEquipped: boolean;
  onPress: () => void;
  animationDelay?: number;
}

const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  isEquipped,
  onPress,
  animationDelay = 0,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { delay: animationDelay });
    rotation.value = withSpring(isEquipped ? 10 : 0);
  }, [isEquipped, animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotation.value, [0, 10], [0, 0.3]),
  }));

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View style={[styles.badgeContainer, animatedStyle]}>
        {isEquipped && (
          <Animated.View style={[styles.glow, glowStyle]} />
        )}
        
        <View style={[
          styles.badgeContent,
          { borderColor: getRarityColor(badge.rarity) },
          isEquipped && styles.equippedBadge,
        ]}>
          <Icon
            name={badge.icon}
            size={32}
            color={getRarityColor(badge.rarity)}
          />
        </View>

        {isEquipped && (
          <View style={styles.equippedIndicator}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
          </View>
        )}

        <Text
          variant="bodySmall"
          style={styles.badgeName}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
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
  container: {
    flex: 1,
  },
  horizontalContainer: {
    paddingHorizontal: 8,
    gap: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  badgeContainer: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 20,
    backgroundColor: '#FFD700',
    borderRadius: 32,
    zIndex: 0,
  },
  badgeContent: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  equippedBadge: {
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  equippedIndicator: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    zIndex: 2,
  },
  badgeName: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
  },
  moreIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  modalContent: {
    margin: 20,
  },
  modalCard: {
    borderRadius: 16,
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 16,
  },
  largeBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalRarity: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalDate: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
});

export default BadgeDisplay;