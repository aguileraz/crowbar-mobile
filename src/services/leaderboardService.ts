/**
 * Leaderboard Service
 * Serviço de rankings temáticos e competições
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardFilter,
  SocialUser,
  _LEADERBOARD_CATEGORIES,
} from '../types/social';
import { GameThemeType } from '../types/animations';
import { analyticsService } from './analyticsService';

interface LeaderboardEventCallbacks {
  onRankingUpdate: (leaderboard: Leaderboard) => void;
  onPositionChange: (userId: string, oldPosition: number, newPosition: number) => void;
  onSeasonEnd: (leaderboard: Leaderboard, winners: LeaderboardEntry[]) => void;
  onNewRecord: (category: string, record: LeaderboardEntry) => void;
}

interface UserStats {
  boxesOpened: number;
  totalValue: number;
  rareItems: number;
  socialActivity: number;
  themePreference: Record<GameThemeType, number>;
  weeklyBoxes: number;
  monthlyBoxes: number;
  streakDays: number;
  friendsInvited: number;
  reactionsGiven: number;
  roomsHosted: number;
  betsWon: number;
}

interface RankingCalculation {
  category: string;
  baseScore: number;
  multipliers: Record<string, number>;
  bonuses: Record<string, number>;
  finalScore: number;
}

class LeaderboardService {
  private static instance: LeaderboardService;
  private leaderboards = new Map<string, Leaderboard>();
  private userStats = new Map<string, UserStats>();
  private eventCallbacks: Partial<LeaderboardEventCallbacks> = {};
  private currentUser: SocialUser | null = null;
  private lastUpdateTime: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;

  // Configurações de ranking
  private rankingConfig = {
    updateFrequency: 300000, // 5 minutos
    seasonDuration: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntriesPerBoard: 100,
    minActivityThreshold: 5, // Mínimo de atividade para aparecer no ranking
    pointsMultipliers: {
      boxes_opened: 10,
      total_value: 0.1,
      rare_items: 50,
      social_activity: 5,
      theme_master: 25,
    },
  };

  private constructor() {
    this.loadUserData();
    this.initializeLeaderboards();
    this.startPeriodicUpdates();
  }

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Carrega dados do usuário
   */
  private async loadUserData(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      // console.warn('Erro ao carregar dados do usuário:', error);
    }
  }

  /**
   * Inicializa leaderboards padrão
   */
  private async initializeLeaderboards(): Promise<void> {
    const defaultLeaderboards: Array<Omit<Leaderboard, 'entries' | 'updatedAt'>> = [
      {
        id: 'global_boxes_opened',
        name: 'Abertura Global',
        type: 'global',
        category: 'boxes_opened',
        timeframe: 'all_time',
      },
      {
        id: 'weekly_boxes_opened',
        name: 'Abertura Semanal',
        type: 'weekly',
        category: 'boxes_opened',
        timeframe: 'weekly',
      },
      {
        id: 'monthly_total_value',
        name: 'Valor Mensal',
        type: 'monthly',
        category: 'total_value',
        timeframe: 'monthly',
      },
      {
        id: 'global_rare_items',
        name: 'Colecionador de Raros',
        type: 'global',
        category: 'rare_items',
        timeframe: 'all_time',
      },
      {
        id: 'theme_fire_master',
        name: 'Mestre do Fogo',
        type: 'global',
        category: 'theme_master',
        theme: 'fire',
        timeframe: 'all_time',
      },
      {
        id: 'theme_ice_master',
        name: 'Mestre do Gelo',
        type: 'global',
        category: 'theme_master',
        theme: 'ice',
        timeframe: 'all_time',
      },
      {
        id: 'theme_meteor_master',
        name: 'Mestre do Meteoro',
        type: 'global',
        category: 'theme_master',
        theme: 'meteor',
        timeframe: 'all_time',
      },
      {
        id: 'social_activity',
        name: 'Atividade Social',
        type: 'global',
        category: 'social_activity',
        timeframe: 'monthly',
      },
    ];

    for (const config of defaultLeaderboards) {
      const leaderboard: Leaderboard = {
        ...config,
        entries: [],
        updatedAt: new Date().toISOString(),
      };
      this.leaderboards.set(config.id, leaderboard);
    }

    await this.loadLeaderboardsFromStorage();
  }

  /**
   * Carrega leaderboards do storage
   */
  private async loadLeaderboardsFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('leaderboards');
      if (data) {
        const stored = JSON.parse(data);
        for (const [id, leaderboard] of Object.entries(stored)) {
          this.leaderboards.set(id, leaderboard as Leaderboard);
        }
      }
    } catch (error) {
      // console.warn('Erro ao carregar leaderboards:', error);
    }
  }

  /**
   * Salva leaderboards no storage
   */
  private async saveLeaderboardsToStorage(): Promise<void> {
    try {
      const data = Object.fromEntries(this.leaderboards);
      await AsyncStorage.setItem('leaderboards', JSON.stringify(data));
    } catch (error) {
      // console.warn('Erro ao salvar leaderboards:', error);
    }
  }

  /**
   * Registra callbacks de eventos
   */
  setEventCallbacks(callbacks: Partial<LeaderboardEventCallbacks>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * Atualiza estatísticas do usuário
   */
  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
    const currentStats = this.userStats.get(userId) || this.getDefaultUserStats();
    const updatedStats = { ...currentStats, ...stats };
    
    this.userStats.set(userId, updatedStats);

    // Recalcular rankings afetados
    await this.recalculateRankings(userId, updatedStats);

    // Analytics
    analyticsService.trackEngagement('user_stats_updated', JSON.stringify(Object.keys(stats)), 1);
  }

  /**
   * Obtém estatísticas padrão para usuário
   */
  private getDefaultUserStats(): UserStats {
    return {
      boxesOpened: 0,
      totalValue: 0,
      rareItems: 0,
      socialActivity: 0,
      themePreference: { fire: 0, ice: 0, meteor: 0 },
      weeklyBoxes: 0,
      monthlyBoxes: 0,
      streakDays: 0,
      friendsInvited: 0,
      reactionsGiven: 0,
      roomsHosted: 0,
      betsWon: 0,
    };
  }

  /**
   * Recalcula rankings para um usuário
   */
  private async recalculateRankings(userId: string, stats: UserStats): Promise<void> {
    for (const [leaderboardId, leaderboard] of this.leaderboards) {
      const score = this.calculateScore(leaderboard.category, stats, leaderboard.theme);
      
      if (score > 0 || this.rankingConfig.minActivityThreshold <= stats.boxesOpened) {
        await this.updateUserPosition(leaderboardId, userId, score);
      }
    }
  }

  /**
   * Calcula pontuação para uma categoria
   */
  private calculateScore(category: string, stats: UserStats, theme?: GameThemeType): number {
    const calculation: RankingCalculation = {
      category,
      baseScore: 0,
      multipliers: {},
      bonuses: {},
      finalScore: 0,
    };

    switch (category) {
      case 'boxes_opened':
        calculation.baseScore = stats.boxesOpened * this.rankingConfig.pointsMultipliers.boxes_opened;
        calculation.multipliers.streak = Math.min(stats.streakDays * 0.1, 2.0);
        break;

      case 'total_value':
        calculation.baseScore = stats.totalValue * this.rankingConfig.pointsMultipliers.total_value;
        calculation.multipliers.efficiency = stats.boxesOpened > 0 ? 
          Math.min((stats.totalValue / stats.boxesOpened) * 0.01, 1.5) : 1;
        break;

      case 'rare_items':
        calculation.baseScore = stats.rareItems * this.rankingConfig.pointsMultipliers.rare_items;
        calculation.bonuses.collector = stats.rareItems >= 10 ? 100 : 0;
        break;

      case 'social_activity':
        calculation.baseScore = (
          stats.friendsInvited * 20 +
          stats.reactionsGiven * 2 +
          stats.roomsHosted * 50 +
          stats.betsWon * 30
        );
        calculation.multipliers.engagement = Math.min(stats.socialActivity * 0.1, 2.0);
        break;

      case 'theme_master':
        if (theme) {
          calculation.baseScore = stats.themePreference[theme] * this.rankingConfig.pointsMultipliers.theme_master;
          calculation.bonuses.specialist = stats.themePreference[theme] >= 50 ? 500 : 0;
        }
        break;

      default:
        calculation.baseScore = 0;
    }

    // Aplicar multiplicadores
    let finalScore = calculation.baseScore;
    for (const multiplier of Object.values(calculation.multipliers)) {
      finalScore *= (1 + multiplier);
    }

    // Adicionar bônus
    for (const bonus of Object.values(calculation.bonuses)) {
      finalScore += bonus;
    }

    calculation.finalScore = Math.floor(finalScore);
    return calculation.finalScore;
  }

  /**
   * Atualiza posição do usuário no leaderboard
   */
  private async updateUserPosition(leaderboardId: string, userId: string, score: number): Promise<void> {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) return;

    // Encontrar entrada existente
    const existingIndex = leaderboard.entries.findIndex(e => e.user.id === userId);
    const oldPosition = existingIndex >= 0 ? leaderboard.entries[existingIndex].position : -1;

    // Remover entrada existente
    if (existingIndex >= 0) {
      leaderboard.entries.splice(existingIndex, 1);
    }

    // Obter dados do usuário
    const userData = await this.getUserData(userId);
    if (!userData) return;

    // Criar nova entrada
    const newEntry: LeaderboardEntry = {
      position: 0, // Será calculado após inserção
      previousPosition: oldPosition > 0 ? oldPosition : undefined,
      user: userData,
      score,
      additionalStats: this.getAdditionalStats(leaderboard.category, _userId),
      trend: 'stable',
    };

    // Inserir na posição correta
    let insertPosition = 0;
    for (let i = 0; i < leaderboard.entries.length; i++) {
      if (score > leaderboard.entries[i].score) {
        insertPosition = i;
        break;
      }
      insertPosition = i + 1;
    }

    leaderboard.entries.splice(insertPosition, 0, newEntry);

    // Atualizar posições e tendências
    this.updatePositionsAndTrends(leaderboard);

    // Limitar número de entradas
    if (leaderboard.entries.length > this.rankingConfig.maxEntriesPerBoard) {
      leaderboard.entries = leaderboard.entries.slice(0, this.rankingConfig.maxEntriesPerBoard);
    }

    leaderboard.updatedAt = new Date().toISOString();

    // Verificar mudanças de posição
    const newPosition = newEntry.position;
    if (oldPosition > 0 && oldPosition !== newPosition) {
      this.eventCallbacks.onPositionChange?.(userId, oldPosition, newPosition);

      // Verificar se é um novo recorde
      if (newPosition === 1) {
        this.eventCallbacks.onNewRecord?.(leaderboard.category, newEntry);
      }
    }

    this.eventCallbacks.onRankingUpdate?.(leaderboard);
    await this.saveLeaderboardsToStorage();
  }

  /**
   * Atualiza posições e tendências
   */
  private updatePositionsAndTrends(leaderboard: Leaderboard): void {
    for (let i = 0; i < leaderboard.entries.length; i++) {
      const entry = leaderboard.entries[i];
      const newPosition = i + 1;
      const oldPosition = entry.previousPosition;

      entry.position = newPosition;

      if (oldPosition) {
        if (newPosition < oldPosition) {
          entry.trend = 'up';
        } else if (newPosition > oldPosition) {
          entry.trend = 'down';
        } else {
          entry.trend = 'stable';
        }
      } else {
        entry.trend = 'new';
      }

      // Determinar badge baseado na posição
      if (newPosition === 1) {
        entry.badge = '🥇';
      } else if (newPosition === 2) {
        entry.badge = '🥈';
      } else if (newPosition === 3) {
        entry.badge = '🥉';
      } else if (newPosition <= 10) {
        entry.badge = '🏆';
      } else {
        entry.badge = undefined;
      }
    }
  }

  /**
   * Obtém estatísticas adicionais para exibição
   */
  private getAdditionalStats(category: string, userId: string): Record<string, any> {
    const stats = this.userStats.get(userId);
    if (!stats) return {};

    switch (category) {
      case 'boxes_opened':
        return {
          weeklyBoxes: stats.weeklyBoxes,
          streakDays: stats.streakDays,
          averagePerDay: stats.boxesOpened / Math.max(1, stats.streakDays),
        };

      case 'total_value':
        return {
          averageValuePerBox: stats.boxesOpened > 0 ? stats.totalValue / stats.boxesOpened : 0,
          rareItems: stats.rareItems,
        };

      case 'rare_items':
        return {
          rareRate: stats.boxesOpened > 0 ? (stats.rareItems / stats.boxesOpened) * 100 : 0,
          totalBoxes: stats.boxesOpened,
        };

      case 'social_activity':
        return {
          friendsInvited: stats.friendsInvited,
          roomsHosted: stats.roomsHosted,
          betsWon: stats.betsWon,
        };

      case 'theme_master':
        return {
          themePreference: stats.themePreference,
          totalThemed: Object.values(stats.themePreference).reduce((a, b) => a + b, 0),
        };

      default:
        return {};
    }
  }

  /**
   * Obtém dados do usuário
   */
  private async getUserData(userId: string): Promise<SocialUser | null> {
    // Em produção, buscar do servidor
    // Por enquanto, retornar dados mock ou do usuário atual
    if (userId === this.currentUser?.id) {
      return this.currentUser;
    }

    // Mock de outros usuários para demonstração
    return {
      id: userId,
      username: `user_${userId.slice(-4)}`,
      displayName: `Usuário ${userId.slice(-4)}`,
      level: Math.floor(Math.random() * 50) + 1,
      totalBoxesOpened: Math.floor(Math.random() * 1000),
      favoriteTheme: (['fire', 'ice', 'meteor'] as GameThemeType[])[Math.floor(Math.random() * 3)],
      status: 'online',
      lastSeen: new Date().toISOString(),
      isVip: Math.random() > 0.8,
    };
  }

  /**
   * Obtém leaderboard por ID
   */
  getLeaderboard(leaderboardId: string): Leaderboard | null {
    return this.leaderboards.get(leaderboardId) || null;
  }

  /**
   * Obtém leaderboards com filtros
   */
  getLeaderboards(filter?: LeaderboardFilter): Leaderboard[] {
    let leaderboards = Array.from(this.leaderboards.values());

    if (filter) {
      if (filter.category) {
        leaderboards = leaderboards.filter(lb => lb.category === filter.category);
      }
      if (filter.timeframe) {
        leaderboards = leaderboards.filter(lb => lb.timeframe === filter.timeframe);
      }
      if (filter.theme) {
        leaderboards = leaderboards.filter(lb => lb.theme === filter.theme);
      }
      if (filter.friends && this.currentUser) {
        // Filtrar apenas amigos (implementar lógica de amizade)
        leaderboards = leaderboards.map(lb => ({
          ...lb,
          entries: lb.entries.filter(entry => this.isUserFriend(entry.user.id))
        }));
      }
    }

    return leaderboards;
  }

  /**
   * Verifica se usuário é amigo (mock)
   */
  private isUserFriend(_userId: string): boolean {
    // Implementar lógica real de amizade
    return Math.random() > 0.5;
  }

  /**
   * Obtém posição do usuário em um leaderboard
   */
  getUserPosition(leaderboardId: string, userId?: string): LeaderboardEntry | null {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) return null;

    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) return null;

    return leaderboard.entries.find(entry => entry.user.id === targetUserId) || null;
  }

  /**
   * Força atualização de um leaderboard
   */
  async forceUpdate(leaderboardId: string): Promise<void> {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) return;

    // Recalcular todas as posições
    for (const [userId, stats] of this.userStats) {
      const score = this.calculateScore(leaderboard.category, stats, leaderboard.theme);
      await this.updateUserPosition(leaderboardId, userId, score);
    }
  }

  /**
   * Inicia atualizações periódicas
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.performPeriodicUpdate();
    }, this.rankingConfig.updateFrequency);
  }

  /**
   * Executa atualização periódica
   */
  private async performPeriodicUpdate(): Promise<void> {
    const now = Date.now();
    
    // Verificar se é hora de resetar rankings semanais/mensais
    for (const [id, leaderboard] of this.leaderboards) {
      if (this.shouldResetLeaderboard(leaderboard, now)) {
        await this.resetLeaderboard(id);
      }
    }

    this.lastUpdateTime = now;
  }

  /**
   * Verifica se leaderboard deve ser resetado
   */
  private shouldResetLeaderboard(leaderboard: Leaderboard, currentTime: number): boolean {
    const lastUpdate = new Date(leaderboard.updatedAt).getTime();
    const timeDiff = currentTime - lastUpdate;

    switch (leaderboard.timeframe) {
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 dias
      case 'monthly':
        return timeDiff > 30 * 24 * 60 * 60 * 1000; // 30 dias
      default:
        return false;
    }
  }

  /**
   * Reseta leaderboard
   */
  private async resetLeaderboard(leaderboardId: string): Promise<void> {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) return;

    // Salvar vencedores da temporada
    const winners = leaderboard.entries.slice(0, 3);
    if (winners.length > 0) {
      this.eventCallbacks.onSeasonEnd?.(leaderboard, winners);
    }

    // Incrementar temporada
    leaderboard.season = (leaderboard.season || 0) + 1;
    leaderboard.entries = [];
    leaderboard.updatedAt = new Date().toISOString();

    await this.saveLeaderboardsToStorage();

    // Analytics
    analyticsService.trackEngagement('leaderboard_season_end', leaderboard.category, leaderboard.season);
  }

  /**
   * Para atualizações periódicas
   */
  stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Limpa dados (para testes)
   */
  async clearData(): Promise<void> {
    this.leaderboards.clear();
    this.userStats.clear();
    await AsyncStorage.removeItem('leaderboards');
    await this.initializeLeaderboards();
  }
}

export default LeaderboardService.getInstance();