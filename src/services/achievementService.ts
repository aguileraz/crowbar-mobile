/**
 * Achievement Service
 * Gerencia badges, conquistas e progressão do usuário
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  UserAchievement,
  UserBadge,
  AchievementProgress,
  AchievementStats,
  AchievementConditionType,
  ACHIEVEMENT_TEMPLATES,
  BADGE_TEMPLATES,
} from '../types/achievements';
import { analyticsService } from './analyticsService';
import socialNotificationService from './socialNotificationService';
import advancedHapticService from './advancedHapticService';

interface UserProgress {
  boxesOpened: number;
  friendsCount: number;
  reactionsCount: number;
  betsWon: number;
  betsStreak: number;
  roomsHosted: number;
  specialEvents: Record<string, number>;
  lastActivity: string;
}

class AchievementService {
  private static instance: AchievementService;
  private userAchievements: UserAchievement[] = [];
  private userBadges: UserBadge[] = [];
  private userProgress: UserProgress = {
    boxesOpened: 0,
    friendsCount: 0,
    reactionsCount: 0,
    betsWon: 0,
    betsStreak: 0,
    roomsHosted: 0,
    specialEvents: {},
    lastActivity: new Date().toISOString(),
  };
  private userId: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Inicializa o serviço com dados do usuário
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserData();
    this.isInitialized = true;
    
    // Verifica conquistas ao inicializar
    await this.checkAllAchievements();
  }

  /**
   * Carrega dados persistidos do usuário
   */
  private async loadUserData(): Promise<void> {
    if (!this.userId) return;

    try {
      const [achievementsData, badgesData, progressData] = await Promise.all([
        AsyncStorage.getItem(`achievements_${this.userId}`),
        AsyncStorage.getItem(`badges_${this.userId}`),
        AsyncStorage.getItem(`progress_${this.userId}`),
      ]);

      this.userAchievements = achievementsData ? JSON.parse(achievementsData) : [];
      this.userBadges = badgesData ? JSON.parse(badgesData) : [];
      this.userProgress = progressData ? JSON.parse(progressData) : this.userProgress;

    } catch (error) {
      // console.error('Erro ao carregar dados de conquistas:', error);
    }
  }

  /**
   * Persiste dados do usuário
   */
  private async saveUserData(): Promise<void> {
    if (!this.userId) return;

    try {
      await Promise.all([
        AsyncStorage.setItem(`achievements_${this.userId}`, JSON.stringify(this.userAchievements)),
        AsyncStorage.setItem(`badges_${this.userId}`, JSON.stringify(this.userBadges)),
        AsyncStorage.setItem(`progress_${this.userId}`, JSON.stringify(this.userProgress)),
      ]);
    } catch (error) {
      // console.error('Erro ao salvar dados de conquistas:', error);
    }
  }

  /**
   * Registra progresso de uma ação específica
   */
  async trackProgress(
    action: AchievementConditionType,
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserAchievement[]> {
    if (!this.isInitialized) return [];

    // Atualiza progresso baseado na ação
    switch (action) {
      case 'box_count':
        this.userProgress.boxesOpened += value;
        break;
      case 'friend_count':
        this.userProgress.friendsCount = Math.max(this.userProgress.friendsCount, value);
        break;
      case 'reaction_count':
        this.userProgress.reactionsCount += value;
        break;
      case 'betting_wins':
        this.userProgress.betsWon += value;
        if (metadata?.consecutive) {
          this.userProgress.betsStreak += value;
        } else {
          this.userProgress.betsStreak = 0; // Reset streak se não for consecutivo
        }
        break;
      case 'room_hosting':
        this.userProgress.roomsHosted += value;
        break;
      case 'special_event':
        const eventType = metadata?.event_type || 'unknown';
        this.userProgress.specialEvents[eventType] = 
          (this.userProgress.specialEvents[eventType] || 0) + value;
        break;
    }

    this.userProgress.lastActivity = new Date().toISOString();

    // Verifica se alguma conquista foi desbloqueada
    const newAchievements = await this.checkAchievementsForAction(action);
    
    // Salva progresso
    await this.saveUserData();

    return newAchievements;
  }

  /**
   * Verifica conquistas relacionadas a uma ação específica
   */
  private async checkAchievementsForAction(action: AchievementConditionType): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];
    const relevantAchievements = ACHIEVEMENT_TEMPLATES.filter(
      achievement => achievement.condition.type === action && achievement.isActive
    );

    for (const achievement of relevantAchievements) {
      if (this.isAchievementCompleted(achievement.id)) continue;

      const isUnlocked = await this.checkAchievementCondition(achievement);
      if (isUnlocked) {
        const userAchievement = await this.unlockAchievement(achievement);
        newAchievements.push(userAchievement);
      }
    }

    return newAchievements;
  }

  /**
   * Verifica todas as conquistas disponíveis
   */
  private async checkAllAchievements(): Promise<void> {
    for (const achievement of ACHIEVEMENT_TEMPLATES) {
      if (!achievement.isActive || this.isAchievementCompleted(achievement.id)) continue;

      const isUnlocked = await this.checkAchievementCondition(achievement);
      if (isUnlocked) {
        await this.unlockAchievement(achievement);
      }
    }
  }

  /**
   * Verifica se condição de uma conquista foi atendida
   */
  private async checkAchievementCondition(achievement: Achievement): Promise<boolean> {
    const { condition } = achievement;
    let currentValue = 0;

    // Obtém valor atual baseado no tipo de condição
    switch (condition.type) {
      case 'box_count':
        currentValue = this.userProgress.boxesOpened;
        break;
      case 'friend_count':
        currentValue = this.userProgress.friendsCount;
        break;
      case 'reaction_count':
        currentValue = this.userProgress.reactionsCount;
        break;
      case 'betting_wins':
        currentValue = condition.metadata?.consecutive 
          ? this.userProgress.betsStreak 
          : this.userProgress.betsWon;
        break;
      case 'room_hosting':
        currentValue = this.userProgress.roomsHosted;
        break;
      case 'special_event':
        const eventType = condition.metadata?.event_type;
        currentValue = this.userProgress.specialEvents[eventType] || 0;
        break;
    }

    // Verifica pré-requisitos se existirem
    if (achievement.prerequisites?.length) {
      const hasPrerequisites = achievement.prerequisites.every(
        prereqId => this.isAchievementCompleted(prereqId)
      );
      if (!hasPrerequisites) return false;
    }

    return currentValue >= condition.target;
  }

  /**
   * Desbloqueia uma conquista
   */
  private async unlockAchievement(achievement: Achievement): Promise<UserAchievement> {
    const userAchievement: UserAchievement = {
      achievementId: achievement.id,
      userId: this.userId!,
      unlockedAt: new Date().toISOString(),
      progress: 100,
      isCompleted: true,
      notified: false,
    };

    this.userAchievements.push(userAchievement);

    // Adiciona badge se especificado
    if (achievement.reward.badge) {
      await this.awardBadge(achievement.reward.badge);
    }

    // Notifica usuário
    await this.notifyAchievementUnlocked(achievement);

    // Registra evento analítico
    analyticsService.trackEngagement('achievement_unlocked', achievement.category, achievement.reward.points);

    // Feedback háptico
    await advancedHapticService.playPattern('rare_item');


    return userAchievement;
  }

  /**
   * Concede badge ao usuário
   */
  private async awardBadge(badgeId: string): Promise<void> {
    const badgeTemplate = BADGE_TEMPLATES.find(b => b.id === badgeId);
    if (!badgeTemplate) return;

    const userBadge: UserBadge = {
      ...badgeTemplate,
      unlockedAt: new Date().toISOString(),
      isEquipped: false,
    };

    // Verifica se usuário já possui o badge
    const existingBadge = this.userBadges.find(b => b.id === badgeId);
    if (!existingBadge) {
      this.userBadges.push(userBadge);
    }
  }

  /**
   * Notifica usuário sobre conquista desbloqueada
   */
  private async notifyAchievementUnlocked(achievement: Achievement): Promise<void> {
    try {
      await socialNotificationService.sendNotification(
        'achievement_unlocked',
        {
          title: achievement.title,
          points: achievement.reward.points,
          rarity: achievement.rarity,
        }
      );
    } catch (error) {
      // console.error('Erro ao notificar conquista:', error);
    }
  }

  /**
   * Obtém progresso de uma conquista específica
   */
  getAchievementProgress(achievementId: string): AchievementProgress | null {
    const achievement = ACHIEVEMENT_TEMPLATES.find(a => a.id === achievementId);
    if (!achievement) return null;

    const userAchievement = this.userAchievements.find(ua => ua.achievementId === achievementId);
    if (userAchievement?.isCompleted) {
      return {
        achievementId,
        currentValue: achievement.condition.target,
        targetValue: achievement.condition.target,
        percentage: 100,
        isCompleted: true,
        canClaim: false,
      };
    }

    let currentValue = 0;
    switch (achievement.condition.type) {
      case 'box_count':
        currentValue = this.userProgress.boxesOpened;
        break;
      case 'friend_count':
        currentValue = this.userProgress.friendsCount;
        break;
      case 'reaction_count':
        currentValue = this.userProgress.reactionsCount;
        break;
      case 'betting_wins':
        currentValue = achievement.condition.metadata?.consecutive 
          ? this.userProgress.betsStreak 
          : this.userProgress.betsWon;
        break;
      case 'room_hosting':
        currentValue = this.userProgress.roomsHosted;
        break;
      case 'special_event':
        const eventType = achievement.condition.metadata?.event_type;
        currentValue = this.userProgress.specialEvents[eventType] || 0;
        break;
    }

    const percentage = Math.min((currentValue / achievement.condition.target) * 100, 100);

    return {
      achievementId,
      currentValue,
      targetValue: achievement.condition.target,
      percentage,
      isCompleted: percentage >= 100,
      canClaim: percentage >= 100 && !userAchievement,
    };
  }

  /**
   * Obtém todas as conquistas disponíveis (exceto ocultas não desbloqueadas)
   */
  getAvailableAchievements(): Achievement[] {
    return ACHIEVEMENT_TEMPLATES.filter(achievement => {
      if (!achievement.isActive) return false;
      if (achievement.isHidden && !this.isAchievementCompleted(achievement.id)) return false;
      return true;
    });
  }

  /**
   * Obtém conquistas do usuário
   */
  getUserAchievements(): UserAchievement[] {
    return this.userAchievements;
  }

  /**
   * Obtém badges do usuário
   */
  getUserBadges(): UserBadge[] {
    return this.userBadges;
  }

  /**
   * Equipa/desequipa um badge
   */
  async equipBadge(badgeId: string): Promise<boolean> {
    const badge = this.userBadges.find(b => b.id === badgeId);
    if (!badge) return false;

    // Desequipa todos os outros badges
    this.userBadges.forEach(b => b.isEquipped = false);
    
    // Equipa o badge selecionado
    badge.isEquipped = true;

    await this.saveUserData();
    return true;
  }

  /**
   * Obtém estatísticas de conquistas do usuário
   */
  getAchievementStats(): AchievementStats {
    const totalAchievements = ACHIEVEMENT_TEMPLATES.filter(a => a.isActive).length;
    const unlockedAchievements = this.userAchievements.filter(ua => ua.isCompleted).length;
    const pointsEarned = this.userAchievements
      .filter(ua => ua.isCompleted)
      .reduce((total, ua) => {
        const achievement = ACHIEVEMENT_TEMPLATES.find(a => a.id === ua.achievementId);
        return total + (achievement?.reward.points || 0);
      }, 0);

    const rareAchievements = this.userAchievements
      .filter(ua => ua.isCompleted)
      .filter(ua => {
        const achievement = ACHIEVEMENT_TEMPLATES.find(a => a.id === ua.achievementId);
        return achievement?.rarity === 'rare' || achievement?.rarity === 'epic' || achievement?.rarity === 'legendary';
      }).length;

    const latestUnlocked = this.userAchievements
      .filter(ua => ua.isCompleted)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())[0];

    return {
      totalAchievements,
      unlockedAchievements,
      completionPercentage: totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0,
      pointsEarned,
      rareAchievements,
      latestUnlocked,
    };
  }

  /**
   * Verifica se uma conquista foi completada
   */
  private isAchievementCompleted(achievementId: string): boolean {
    return this.userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  }

  /**
   * Obtém progresso atual do usuário (para debug)
   */
  getUserProgress(): UserProgress {
    return { ...this.userProgress };
  }

  /**
   * Força verificação de conquistas especiais baseadas em tempo
   */
  async checkTimeBasedAchievements(): Promise<void> {
    const now = new Date();
    const hour = now.getHours();

    // Conquista de meia-noite
    if (hour === 0) {
      await this.trackProgress('special_event', 1, { event_type: 'midnight_opening' });
    }

    // Adicione outras verificações baseadas em tempo conforme necessário
  }

  /**
   * Reset para desenvolvimento/testes
   */
  async resetUserData(): Promise<void> {
    this.userAchievements = [];
    this.userBadges = [];
    this.userProgress = {
      boxesOpened: 0,
      friendsCount: 0,
      reactionsCount: 0,
      betsWon: 0,
      betsStreak: 0,
      roomsHosted: 0,
      specialEvents: {},
      lastActivity: new Date().toISOString(),
    };
    await this.saveUserData();
  }
}

export default AchievementService.getInstance();