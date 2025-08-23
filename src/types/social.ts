/**
 * Tipos para sistema social de gamificação
 */

import { EmojiReactionType, GameThemeType } from './animations';

// Tipos básicos de usuário
export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  totalBoxesOpened: number;
  favoriteTheme: GameThemeType;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  country?: string;
  isVip: boolean;
}

export interface FriendshipStatus {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  since: string;
  mutualFriends: number;
}

// Sistema de salas compartilhadas
export interface SharedRoom {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  theme: GameThemeType;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'countdown' | 'opening' | 'celebrating' | 'closed';
  createdAt: string;
  scheduledAt?: string;
  participants: RoomParticipant[];
  settings: RoomSettings;
  statistics: RoomStatistics;
}

export interface RoomParticipant {
  user: SocialUser;
  role: 'host' | 'participant' | 'spectator';
  joinedAt: string;
  hasBox: boolean;
  boxValue?: number;
  ready: boolean;
  reactions: ParticipantReaction[];
}

export interface ParticipantReaction {
  type: EmojiReactionType;
  timestamp: string;
  position?: { x: number; y: number };
}

export interface RoomSettings {
  allowSpectators: boolean;
  enableChat: boolean;
  enableReactions: boolean;
  enableBetting: boolean;
  countdownDuration: number;
  simultaneousOpening: boolean;
  revealDelay: number;
  autoCloseAfter: number;
}

export interface RoomStatistics {
  totalBoxesOpened: number;
  totalValue: number;
  averageValue: number;
  bestItem: {
    name: string;
    value: number;
    openedBy: string;
  };
  themesUsed: Record<GameThemeType, number>;
  reactionsCount: Record<EmojiReactionType, number>;
}

// Sistema de apostas
export interface Bet {
  id: string;
  roomId: string;
  createdBy: string;
  type: 'value_guess' | 'rarity_guess' | 'theme_preference' | 'first_to_complete';
  description: string;
  options: BetOption[];
  stakes: number;
  currency: 'coins' | 'points' | 'real';
  status: 'open' | 'locked' | 'completed' | 'cancelled';
  participants: BetParticipant[];
  deadline: string;
  result?: BetResult;
}

export interface BetOption {
  id: string;
  description: string;
  odds: number;
  participantCount: number;
}

export interface BetParticipant {
  userId: string;
  optionId: string;
  amount: number;
  timestamp: string;
}

export interface BetResult {
  winningOptionId: string;
  totalPayout: number;
  winners: Array<{
    userId: string;
    payout: number;
  }>;
  resolvedAt: string;
}

// Sistema de leaderboards
export interface Leaderboard {
  id: string;
  name: string;
  type: 'global' | 'friends' | 'country' | 'weekly' | 'monthly';
  category: 'boxes_opened' | 'total_value' | 'rare_items' | 'theme_master' | 'social_activity';
  theme?: GameThemeType;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  entries: LeaderboardEntry[];
  updatedAt: string;
  season?: number;
}

export interface LeaderboardEntry {
  position: number;
  previousPosition?: number;
  user: SocialUser;
  score: number;
  additionalStats: Record<string, any>;
  badge?: string;
  trend: 'up' | 'down' | 'stable' | 'new';
}

// Sistema de conquistas e badges
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'opening' | 'collection' | 'streak' | 'special';
  type: 'single' | 'progressive' | 'seasonal';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  condition: AchievementCondition;
  rewards: AchievementReward[];
  unlockedBy: number; // Quantas pessoas desbloquearam
  isSecret: boolean;
}

export interface AchievementCondition {
  type: 'count' | 'value' | 'streak' | 'social' | 'time' | 'combination';
  target: number;
  timeframe?: string;
  parameters?: Record<string, any>;
}

export interface AchievementReward {
  type: 'xp' | 'coins' | 'points' | 'badge' | 'theme' | 'title';
  amount?: number;
  item?: string;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  progress: number;
  isCompleted: boolean;
  notified: boolean;
}

// Sistema de notificações sociais
export interface SocialNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'room_invite' | 'bet_win' | 'achievement' | 'leaderboard' | 'reaction';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'accept' | 'decline' | 'view' | 'join' | 'custom';
  style: 'primary' | 'secondary' | 'danger';
}

// Sistema de chat
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  type: 'text' | 'emoji' | 'system' | 'achievement' | 'bet';
  timestamp: string;
  edited?: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: EmojiReactionType;
  userId: string;
  timestamp: string;
}

// Configurações sociais
export interface SocialSettings {
  privacy: {
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    allowRoomInvites: boolean;
    shareOpeningResults: boolean;
  };
  notifications: {
    friendRequests: boolean;
    roomInvites: boolean;
    betResults: boolean;
    achievements: boolean;
    leaderboardChanges: boolean;
  };
  display: {
    showCountry: boolean;
    showLevel: boolean;
    showStatistics: boolean;
  };
}

// Eventos em tempo real
export interface SocialEvent {
  type: 'user_joined' | 'user_left' | 'box_opened' | 'reaction_added' | 'bet_placed' | 'achievement_unlocked';
  roomId?: string;
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}

// Estatísticas sociais
export interface SocialStatistics {
  totalFriends: number;
  totalRoomsJoined: number;
  totalRoomsHosted: number;
  totalBetsWon: number;
  totalBetsLost: number;
  favoritePartners: string[];
  socialScore: number;
  reputation: number;
}

// WebSocket eventos
export type SocketEvent = 
  | 'room:join'
  | 'room:leave'
  | 'room:update'
  | 'reaction:add'
  | 'chat:message'
  | 'bet:place'
  | 'user:status'
  | 'achievement:unlock'
  | 'leaderboard:update';

export interface SocketMessage {
  event: SocketEvent;
  data: any;
  timestamp: string;
  userId?: string;
}

// Filtros e busca
export interface RoomFilter {
  theme?: GameThemeType;
  hasSlots?: boolean;
  isPrivate?: boolean;
  language?: string;
  minLevel?: number;
  maxLevel?: number;
  region?: string;
}

export interface LeaderboardFilter {
  category: string;
  timeframe: string;
  theme?: GameThemeType;
  friends?: boolean;
  country?: string;
}

// Constantes
export const ROOM_LIMITS = {
  MAX_PARTICIPANTS: 8,
  MIN_PARTICIPANTS: 2,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  DEFAULT_COUNTDOWN: 10,
  MAX_COUNTDOWN: 60,
} as const;

export const BET_LIMITS = {
  MIN_STAKE: 10,
  MAX_STAKE: 1000,
  MAX_OPTIONS: 6,
  MIN_PARTICIPANTS: 2,
} as const;

export const ACHIEVEMENT_CATEGORIES = [
  'social',
  'opening', 
  'collection',
  'streak',
  'special'
] as const;

export const LEADERBOARD_CATEGORIES = [
  'boxes_opened',
  'total_value', 
  'rare_items',
  'theme_master',
  'social_activity'
] as const;