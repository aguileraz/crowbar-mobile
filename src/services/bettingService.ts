/**
 * Betting Service
 * Serviço de apostas sociais entre amigos
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bet,
  BetOption,
  BetParticipant,
  BetResult,
  SocialUser,
  BET_LIMITS,
} from '../types/social';
import { GameThemeType } from '../types/animations';
import { analyticsService } from './analyticsService';
import advancedHapticService from './advancedHapticService';

interface BettingEventCallbacks {
  onBetCreated: (bet: Bet) => void;
  onBetUpdated: (bet: Bet) => void;
  onBetParticipantAdded: (betId: string, participant: BetParticipant) => void;
  onBetCompleted: (bet: Bet, result: BetResult) => void;
  onBetCancelled: (betId: string, reason: string) => void;
  onBalanceChanged: (newBalance: number, currency: string) => void;
}

interface UserBalance {
  coins: number;
  points: number;
  real: number;
}

interface BetTemplate {
  id: string;
  name: string;
  description: string;
  type: Bet['type'];
  defaultOptions: Array<{ description: string; odds: number }>;
  stakes: { min: number; max: number };
  currency: 'coins' | 'points' | 'real';
}

class BettingService {
  private static instance: BettingService;
  private activeBets = new Map<string, Bet>();
  private userBalance: UserBalance = { coins: 0, points: 0, real: 0 };
  private eventCallbacks: Partial<BettingEventCallbacks> = {};
  private currentUser: SocialUser | null = null;
  private betHistory: Bet[] = [];

  // Templates de apostas predefinidos
  private betTemplates: BetTemplate[] = [
    {
      id: 'value_guess',
      name: 'Adivinhe o Valor',
      description: 'Aposte no valor total dos itens da caixa',
      type: 'value_guess',
      defaultOptions: [
        { description: 'Menos de R$ 50', odds: 2.0 },
        { description: 'R$ 50 - R$ 100', odds: 3.0 },
        { description: 'R$ 100 - R$ 200', odds: 4.0 },
        { description: 'Mais de R$ 200', odds: 6.0 },
      ],
      stakes: { min: 10, max: 100 },
      currency: 'coins',
    },
    {
      id: 'rarity_guess',
      name: 'Raridade dos Itens',
      description: 'Aposte na raridade do melhor item',
      type: 'rarity_guess',
      defaultOptions: [
        { description: 'Comum/Incomum', odds: 1.5 },
        { description: 'Raro', odds: 3.0 },
        { description: 'Épico', odds: 5.0 },
        { description: 'Lendário', odds: 10.0 },
      ],
      stakes: { min: 5, max: 50 },
      currency: 'points',
    },
    {
      id: 'theme_preference',
      name: 'Tema Favorito',
      description: 'Aposte no tema que será mais escolhido',
      type: 'theme_preference',
      defaultOptions: [
        { description: 'Fogo 🔥', odds: 2.5 },
        { description: 'Gelo ❄️', odds: 3.0 },
        { description: 'Meteoro ☄️', odds: 2.8 },
      ],
      stakes: { min: 15, max: 75 },
      currency: 'coins',
    },
    {
      id: 'first_to_complete',
      name: 'Primeiro a Completar',
      description: 'Quem abrirá a caixa primeiro?',
      type: 'first_to_complete',
      defaultOptions: [], // Dinâmico baseado nos participantes
      stakes: { min: 20, max: 200 },
      currency: 'points',
    },
  ];

  private constructor() {
    this.loadUserData();
    this.loadUserBalance();
    this.loadBetHistory();
  }

  static getInstance(): BettingService {
    if (!BettingService.instance) {
      BettingService.instance = new BettingService();
    }
    return BettingService.instance;
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
      console.warn('Erro ao carregar dados do usuário:', error);
    }
  }

  /**
   * Carrega saldo do usuário
   */
  private async loadUserBalance(): Promise<void> {
    try {
      const balanceData = await AsyncStorage.getItem('user_balance');
      if (balanceData) {
        this.userBalance = JSON.parse(balanceData);
      } else {
        // Saldo inicial para novos usuários
        this.userBalance = { coins: 1000, points: 500, real: 0 };
        await this.saveUserBalance();
      }
    } catch (error) {
      console.warn('Erro ao carregar saldo:', error);
    }
  }

  /**
   * Salva saldo do usuário
   */
  private async saveUserBalance(): Promise<void> {
    try {
      await AsyncStorage.setItem('user_balance', JSON.stringify(this.userBalance));
      this.eventCallbacks.onBalanceChanged?.(
        this.userBalance.coins + this.userBalance.points,
        'mixed'
      );
    } catch (error) {
      console.warn('Erro ao salvar saldo:', error);
    }
  }

  /**
   * Carrega histórico de apostas
   */
  private async loadBetHistory(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem('bet_history');
      if (historyData) {
        this.betHistory = JSON.parse(historyData);
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico de apostas:', error);
    }
  }

  /**
   * Salva histórico de apostas
   */
  private async saveBetHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('bet_history', JSON.stringify(this.betHistory));
    } catch (error) {
      console.warn('Erro ao salvar histórico de apostas:', error);
    }
  }

  /**
   * Registra callbacks de eventos
   */
  setEventCallbacks(callbacks: Partial<BettingEventCallbacks>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * Obtém templates de apostas disponíveis
   */
  getBetTemplates(): BetTemplate[] {
    return [...this.betTemplates];
  }

  /**
   * Obtém saldo atual do usuário
   */
  getUserBalance(): UserBalance {
    return { ...this.userBalance };
  }

  /**
   * Cria uma nova aposta
   */
  async createBet(config: {
    roomId: string;
    templateId: string;
    customDescription?: string;
    stakes: number;
    currency: 'coins' | 'points' | 'real';
    deadline: string;
    customOptions?: Array<{ description: string; odds: number }>;
  }): Promise<Bet> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const template = this.betTemplates.find(t => t.id === config.templateId);
    if (!template) {
      throw new Error('Template de aposta não encontrado');
    }

    // Validações
    if (config.stakes < BET_LIMITS.MIN_STAKE || config.stakes > BET_LIMITS.MAX_STAKE) {
      throw new Error(`Valor da aposta deve estar entre ${BET_LIMITS.MIN_STAKE} e ${BET_LIMITS.MAX_STAKE}`);
    }

    if (this.userBalance[config.currency] < config.stakes) {
      throw new Error('Saldo insuficiente');
    }

    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const options = config.customOptions || template.defaultOptions.map((opt, index) => ({
      id: `option_${index}`,
      description: opt.description,
      odds: opt.odds,
      participantCount: 0,
    }));

    const bet: Bet = {
      id: betId,
      roomId: config.roomId,
      createdBy: this.currentUser.id,
      type: template.type,
      description: config.customDescription || template.description,
      options,
      stakes: config.stakes,
      currency: config.currency,
      status: 'open',
      participants: [],
      deadline: config.deadline,
    };

    this.activeBets.set(betId, bet);
    this.eventCallbacks.onBetCreated?.(bet);

    // Analytics
    analyticsService.trackEngagement('bet_created', template.type, config.stakes);

    return bet;
  }

  /**
   * Participa de uma aposta
   */
  async joinBet(betId: string, optionId: string, amount?: number): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const bet = this.activeBets.get(betId);
    if (!bet) {
      throw new Error('Aposta não encontrada');
    }

    if (bet.status !== 'open') {
      throw new Error('Aposta não está mais aberta');
    }

    if (new Date() > new Date(bet.deadline)) {
      throw new Error('Prazo da aposta expirou');
    }

    // Verificar se usuário já participou
    const existingParticipant = bet.participants.find(p => p.userId === this.currentUser!.id);
    if (existingParticipant) {
      throw new Error('Você já participou desta aposta');
    }

    const option = bet.options.find(o => o.id === optionId);
    if (!option) {
      throw new Error('Opção não encontrada');
    }

    const betAmount = amount || bet.stakes;

    // Verificar saldo
    if (this.userBalance[bet.currency] < betAmount) {
      throw new Error('Saldo insuficiente');
    }

    // Criar participação
    const participant: BetParticipant = {
      userId: this.currentUser.id,
      optionId,
      amount: betAmount,
      timestamp: new Date().toISOString(),
    };

    // Atualizar aposta
    bet.participants.push(participant);
    option.participantCount++;

    // Debitar saldo
    this.userBalance[bet.currency] -= betAmount;
    await this.saveUserBalance();

    this.eventCallbacks.onBetParticipantAdded?.(betId, participant);
    this.eventCallbacks.onBetUpdated?.(bet);

    // Feedback háptico
    advancedHapticService.playGestureFeedback('tap');

    // Analytics
    analyticsService.trackEngagement('bet_joined', bet.type, betAmount);
  }

  /**
   * Resolve uma aposta
   */
  async resolveBet(betId: string, winningOptionId: string): Promise<BetResult> {
    const bet = this.activeBets.get(betId);
    if (!bet) {
      throw new Error('Aposta não encontrada');
    }

    if (bet.createdBy !== this.currentUser?.id) {
      throw new Error('Apenas o criador pode resolver a aposta');
    }

    if (bet.status !== 'open' && bet.status !== 'locked') {
      throw new Error('Aposta já foi resolvida');
    }

    const winningOption = bet.options.find(o => o.id === winningOptionId);
    if (!winningOption) {
      throw new Error('Opção vencedora não encontrada');
    }

    // Calcular vencedores e prêmios
    const winners = bet.participants.filter(p => p.optionId === winningOptionId);
    const totalPool = bet.participants.reduce((sum, p) => sum + p.amount, 0);
    const winnersTotalBet = winners.reduce((sum, w) => sum + w.amount, 0);

    const result: BetResult = {
      winningOptionId,
      totalPayout: totalPool,
      winners: winners.map(winner => ({
        userId: winner.userId,
        payout: Math.floor((winner.amount / winnersTotalBet) * totalPool),
      })),
      resolvedAt: new Date().toISOString(),
    };

    // Distribuir prêmios
    for (const winner of result.winners) {
      if (winner.userId === this.currentUser.id) {
        this.userBalance[bet.currency] += winner.payout;
      }
    }

    await this.saveUserBalance();

    // Atualizar aposta
    bet.status = 'completed';
    bet.result = result;

    // Mover para histórico
    this.betHistory.push(bet);
    this.activeBets.delete(betId);
    await this.saveBetHistory();

    this.eventCallbacks.onBetCompleted?.(bet, result);

    // Feedback háptico para vencedores
    if (result.winners.some(w => w.userId === this.currentUser?.id)) {
      advancedHapticService.playSuccessSequence(3);
    }

    // Analytics
    analyticsService.trackEngagement('bet_resolved', bet.type, result.totalPayout);

    return result;
  }

  /**
   * Cancela uma aposta
   */
  async cancelBet(betId: string, reason: string): Promise<void> {
    const bet = this.activeBets.get(betId);
    if (!bet) {
      throw new Error('Aposta não encontrada');
    }

    if (bet.createdBy !== this.currentUser?.id) {
      throw new Error('Apenas o criador pode cancelar a aposta');
    }

    if (bet.status !== 'open') {
      throw new Error('Aposta não pode ser cancelada');
    }

    // Reembolsar participantes
    for (const participant of bet.participants) {
      if (participant.userId === this.currentUser.id) {
        this.userBalance[bet.currency] += participant.amount;
      }
    }

    await this.saveUserBalance();

    // Atualizar status
    bet.status = 'cancelled';

    // Remover da lista ativa
    this.activeBets.delete(betId);

    this.eventCallbacks.onBetCancelled?.(betId, reason);

    // Analytics
    analyticsService.trackEngagement('bet_cancelled', bet.type, 1);
  }

  /**
   * Obtém apostas ativas
   */
  getActiveBets(): Bet[] {
    return Array.from(this.activeBets.values());
  }

  /**
   * Obtém apostas por sala
   */
  getBetsByRoom(roomId: string): Bet[] {
    return Array.from(this.activeBets.values()).filter(bet => bet.roomId === roomId);
  }

  /**
   * Obtém histórico de apostas do usuário
   */
  getUserBetHistory(): Bet[] {
    return this.betHistory.filter(bet => 
      bet.createdBy === this.currentUser?.id || 
      bet.participants.some(p => p.userId === this.currentUser?.id)
    );
  }

  /**
   * Calcula estatísticas do usuário
   */
  getUserBettingStats() {
    const userBets = this.getUserBetHistory();
    const participatedBets = userBets.filter(bet => 
      bet.participants.some(p => p.userId === this.currentUser?.id)
    );

    const wonBets = participatedBets.filter(bet => {
      if (!bet.result) return false;
      return bet.result.winners.some(w => w.userId === this.currentUser?.id);
    });

    const totalStaked = participatedBets.reduce((sum, bet) => {
      const participation = bet.participants.find(p => p.userId === this.currentUser?.id);
      return sum + (participation?.amount || 0);
    }, 0);

    const totalWon = wonBets.reduce((sum, bet) => {
      const winner = bet.result?.winners.find(w => w.userId === this.currentUser?.id);
      return sum + (winner?.payout || 0);
    }, 0);

    return {
      totalBets: participatedBets.length,
      betsWon: wonBets.length,
      betsLost: participatedBets.length - wonBets.length,
      winRate: participatedBets.length > 0 ? (wonBets.length / participatedBets.length) * 100 : 0,
      totalStaked,
      totalWon,
      netProfit: totalWon - totalStaked,
      favoriteType: this.getMostFrequentBetType(participatedBets),
    };
  }

  /**
   * Obtém tipo de aposta mais frequente
   */
  private getMostFrequentBetType(bets: Bet[]): string {
    const typeCount = bets.reduce((acc, bet) => {
      acc[bet.type] = (acc[bet.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
  }

  /**
   * Adiciona fundos (para demonstração)
   */
  async addFunds(currency: 'coins' | 'points' | 'real', amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Valor deve ser positivo');
    }

    this.userBalance[currency] += amount;
    await this.saveUserBalance();

    analyticsService.trackEngagement('funds_added', currency, amount);
  }

  /**
   * Obtém aposta específica
   */
  getBet(betId: string): Bet | null {
    return this.activeBets.get(betId) || null;
  }

  /**
   * Limpa dados (para testes)
   */
  async clearData(): Promise<void> {
    this.activeBets.clear();
    this.betHistory = [];
    this.userBalance = { coins: 1000, points: 500, real: 0 };
    
    await Promise.all([
      AsyncStorage.removeItem('bet_history'),
      AsyncStorage.removeItem('user_balance'),
    ]);
  }
}

export default BettingService.getInstance();