/**
 * Achievement System Types
 * Define badges, achievements e conquistas sociais
 */

export type AchievementCategory = 
  | 'social' 
  | 'boxes' 
  | 'collections' 
  | 'reactions' 
  | 'betting' 
  | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementConditionType = 
  | 'box_count' 
  | 'social_interactions' 
  | 'betting_wins' 
  | 'reaction_count'
  | 'friend_count'
  | 'room_hosting'
  | 'streak'
  | 'special_event';

export interface AchievementCondition {
  type: AchievementConditionType;
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  metadata?: Record<string, any>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  condition: AchievementCondition;
  reward: {
    points: number;
    badge?: string;
    title?: string;
    specialEffect?: string;
  };
  isHidden: boolean; // Conquistas secretas
  prerequisites?: string[]; // IDs de achievements necessários
  isActive: boolean;
  createdAt: string;
}

export interface UserAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isCompleted: boolean;
  notified: boolean;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlockedAt: string;
  isEquipped: boolean; // Badge ativo no perfil
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isCompleted: boolean;
  canClaim: boolean;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  pointsEarned: number;
  rareAchievements: number;
  latestUnlocked?: UserAchievement;
}

// Predefined achievement templates
export const ACHIEVEMENT_TEMPLATES: Achievement[] = [
  // Social Achievements
  {
    id: 'social_butterfly',
    title: 'Borboleta Social',
    description: 'Adicione 10 amigos à sua lista',
    category: 'social',
    rarity: 'common',
    icon: 'account-group',
    condition: {
      type: 'friend_count',
      target: 10,
    },
    reward: {
      points: 100,
      badge: 'social_bronze',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'party_host',
    title: 'Anfitrião da Festa',
    description: 'Hospede 5 salas de abertura',
    category: 'social',
    rarity: 'rare',
    icon: 'home-account',
    condition: {
      type: 'room_hosting',
      target: 5,
    },
    reward: {
      points: 250,
      badge: 'host_bronze',
      specialEffect: 'room_sparkles',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'reaction_master',
    title: 'Mestre das Reações',
    description: 'Envie 100 reações em salas compartilhadas',
    category: 'reactions',
    rarity: 'common',
    icon: 'emoticon-happy',
    condition: {
      type: 'reaction_count',
      target: 100,
    },
    reward: {
      points: 150,
      badge: 'reaction_bronze',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  
  // Box Opening Achievements
  {
    id: 'box_opener_novice',
    title: 'Novato das Caixas',
    description: 'Abra sua primeira caixa misteriosa',
    category: 'boxes',
    rarity: 'common',
    icon: 'package-variant',
    condition: {
      type: 'box_count',
      target: 1,
    },
    reward: {
      points: 50,
      badge: 'opener_bronze',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'century_club',
    title: 'Clube dos Cem',
    description: 'Abra 100 caixas misteriosas',
    category: 'boxes',
    rarity: 'epic',
    icon: 'package-check',
    condition: {
      type: 'box_count',
      target: 100,
    },
    reward: {
      points: 500,
      badge: 'opener_gold',
      title: 'Mestre das Caixas',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  
  // Betting Achievements
  {
    id: 'lucky_winner',
    title: 'Sortudo',
    description: 'Ganhe 5 apostas consecutivas',
    category: 'betting',
    rarity: 'rare',
    icon: 'medal',
    condition: {
      type: 'betting_wins',
      target: 5,
      metadata: { consecutive: true },
    },
    reward: {
      points: 300,
      badge: 'lucky_bronze',
    },
    isHidden: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  
  // Special/Hidden Achievements
  {
    id: 'midnight_opener',
    title: 'Coruja Noturna',
    description: 'Abra uma caixa à meia-noite',
    category: 'special',
    rarity: 'legendary',
    icon: 'owl',
    condition: {
      type: 'special_event',
      target: 1,
      metadata: { event_type: 'midnight_opening' },
    },
    reward: {
      points: 1000,
      badge: 'night_owl',
      title: 'Coruja das Caixas',
      specialEffect: 'midnight_glow',
    },
    isHidden: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const BADGE_TEMPLATES = [
  {
    id: 'social_bronze',
    name: 'Social Bronze',
    description: 'Nível básico de interação social',
    icon: 'medal-bronze',
    rarity: 'common' as AchievementRarity,
  },
  {
    id: 'host_bronze',
    name: 'Anfitrião Bronze',
    description: 'Hospedou suas primeiras salas',
    icon: 'home-medal',
    rarity: 'rare' as AchievementRarity,
  },
  {
    id: 'opener_gold',
    name: 'Abridor Ouro',
    description: 'Mestre na arte de abrir caixas',
    icon: 'medal-gold',
    rarity: 'epic' as AchievementRarity,
  },
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Ativo durante as horas sombrias',
    icon: 'owl-medal',
    rarity: 'legendary' as AchievementRarity,
  },
];