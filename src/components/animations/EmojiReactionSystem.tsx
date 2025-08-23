/**
 * Enhanced Emoji Reaction System Component
 * Sistema de reações com emojis animados e integração com sprites
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import SpriteSheetAnimator from './SpriteSheetAnimator';
import { EmojiReaction, EmojiReactionType } from '../../types/animations';
import { hapticFeedback } from '../../utils/haptic';
import { theme, getSpacing } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface EmojiReactionSystemProps {
  onReaction?: (type: EmojiReactionType, position: { x: number; y: number }) => void;
  selectedReaction?: EmojiReactionType | null;
  showControls?: boolean;
  enabled?: boolean;
  maxFloatingReactions?: number;
  style?: any;
  // Modo de exibição
  mode?: 'selector' | 'floating' | 'both';
}

interface ReactionOption {
  type: EmojiReactionType;
  emoji: string;
  label: string;
  color: string;
  spriteAnimation: boolean;
}

interface FloatingReaction extends EmojiReaction {
  animatedX: Animated.SharedValue<number>;
  animatedY: Animated.SharedValue<number>;
  animatedOpacity: Animated.SharedValue<number>;
  animatedScale: Animated.SharedValue<number>;
  animatedRotation: Animated.SharedValue<number>;
}

const reactions: ReactionOption[] = [
  { type: 'beijo', emoji: '😘', label: 'Amei!', color: '#FF1493', spriteAnimation: true },
  { type: 'bravo', emoji: '😠', label: 'Decepção', color: '#DC143C', spriteAnimation: true },
  { type: 'cool', emoji: '😎', label: 'Top!', color: '#1E90FF', spriteAnimation: true },
  { type: 'lingua', emoji: '😜', label: 'Divertido', color: '#9370DB', spriteAnimation: true },
];

const EmojiReactionSystem: React.FC<EmojiReactionSystemProps> = ({
  onReaction,
  selectedReaction,
}) => {
  // Animation values para cada emoji
  const scales = reactions.map(() => useSharedValue(0));
  const rotations = reactions.map(() => useSharedValue(0));
  
  // Anima entrada dos emojis
  React.useEffect(() => {
    scales.forEach((scale, index) => {
      scale.value = withDelay(
        index * 100,
        withSpring(1, {
          damping: 10,
          stiffness: 100,
        })
      );
    });
  }, []);
  
  // Lida com seleção de reação
  const handleReactionPress = useCallback((reaction: ReactionOption, index: number) => {
    // Anima o emoji selecionado
    scales[index].value = withSequence(
      withSpring(1.5),
      withSpring(1)
    );
    
    rotations[index].value = withSequence(
      withSpring(15),
      withSpring(-15),
      withSpring(0)
    );
    
    // Callback para parent
    onReaction(reaction.type);
  }, [onReaction, scales, rotations]);
  
  // Renderiza opção de reação
  const renderReactionOption = (reaction: ReactionOption, index: number) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scales[index].value },
        { rotate: `${rotations[index].value}deg` },
      ],
    }));
    
    const isSelected = selectedReaction === reaction.type;
    
    return (
      <TouchableOpacity
        key={reaction.type}
        onPress={() => handleReactionPress(reaction, index)}
        style={styles.reactionContainer}
        disabled={selectedReaction !== null}
      >
        <Animated.View
          style={[
            styles.reactionButton,
            isSelected && styles.selectedReaction,
            isSelected && { borderColor: reaction.color },
            animatedStyle,
          ]}
        >
          <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
        </Animated.View>
        <Text
          style={[
            styles.reactionLabel,
            isSelected && { color: reaction.color },
          ]}
        >
          {reaction.label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Como você se sentiu?</Text>
      <View style={styles.reactionsRow}>
        {reactions.map((reaction, index) => renderReactionOption(reaction, index))}
      </View>
      {selectedReaction && (
        <Animated.View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            Obrigado pelo feedback! 🎉
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('xl'),
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 400,
  },
  reactionContainer: {
    alignItems: 'center',
  },
  reactionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.outline,
    elevation: 4,
  },
  selectedReaction: {
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 4,
    elevation: 8,
  },
  reactionEmoji: {
    fontSize: 36,
  },
  reactionLabel: {
    marginTop: getSpacing('sm'),
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  feedbackContainer: {
    marginTop: getSpacing('xl'),
    padding: getSpacing('md'),
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 20,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
  },
});

export default EmojiReactionSystem;