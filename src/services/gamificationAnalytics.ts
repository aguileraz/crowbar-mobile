import AsyncStorage from '@react-native-async-storage/async-storage';
import { MysteryBox } from '../types/api';
import analyticsService from './analyticsService';

/**
 * Serviço de Analytics para Gamificação
 *
 * ⚠️ MIGRATION NOTICE:
 * Firebase Analytics foi REMOVIDO. Agora usa analyticsService (Redux-based).
 *
 * Rastreia todos os eventos importantes do sistema de gamificação:
 * - Timer/Urgency, Challenges, Streaks
 * - Leaderboard, Spin Wheel, Achievements
 * - Level/XP, Special Effects
 */

// Tipos de eventos
export enum GamificationEventType {
  // Timer/Urgency Events
  TIMER_VIEW = 'timer_view',
  TIMER_EXPIRED = 'timer_expired',
  PURCHASE_WITH_TIMER = 'purchase_with_timer',
  FLASH_SALE_VIEW = 'flash_sale_view',
  FLASH_SALE_PURCHASE = 'flash_sale_purchase',
  
  // Challenge Events
  CHALLENGE_START = 'challenge_start',
  CHALLENGE_PROGRESS = 'challenge_progress',
  CHALLENGE_COMPLETE = 'challenge_complete',
  CHALLENGE_CLAIM = 'challenge_claim',
  CHALLENGE_ABANDON = 'challenge_abandon',
  
  // Streak Events
  STREAK_START = 'streak_start',
  STREAK_MAINTAIN = 'streak_maintain',
  STREAK_MILESTONE = 'streak_milestone',
  STREAK_LOST = 'streak_lost',
  STREAK_FREEZE_USED = 'streak_freeze_used',
  
  // Leaderboard Events
  LEADERBOARD_VIEW = 'leaderboard_view',
  LEADERBOARD_FILTER = 'leaderboard_filter',
  LEADERBOARD_RANK_UP = 'leaderboard_rank_up',
  LEADERBOARD_RANK_DOWN = 'leaderboard_rank_down',
  
  // Spin Wheel Events
  SPIN_WHEEL_OPEN = 'spin_wheel_open',
  SPIN_WHEEL_SPIN = 'spin_wheel_spin',
  SPIN_WHEEL_REWARD = 'spin_wheel_reward',
  SPIN_WHEEL_SHARE = 'spin_wheel_share',
  
  // Level/XP Events
  XP_GAINED = 'xp_gained',
  LEVEL_UP = 'level_up',
  POINTS_EARNED = 'points_earned',
  COINS_EARNED = 'coins_earned',
  
  // Achievement Events
  ACHIEVEMENT_PROGRESS = 'achievement_progress',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  ACHIEVEMENT_CLAIM = 'achievement_claim',
  
  // Special Effects
  SPECIAL_EFFECT_TRIGGERED = 'special_effect_triggered',
  EMOJI_REACTION = 'emoji_reaction',
  
  // Engagement
  GAMIFICATION_HUB_VIEW = 'gamification_hub_view',
  FEATURE_INTERACTION = 'feature_interaction',
  NOTIFICATION_INTERACTION = 'notification_interaction',
}

// Propriedades padrão para todos os eventos
interface BaseEventProps {
  user_id?: string;
  session_id?: string;
  timestamp?: number;
  platform?: 'ios' | 'android';
  app_version?: string;
}

// Propriedades específicas por tipo de evento
interface EventProperties extends BaseEventProps {
  // Timer properties
  timer_type?: 'flash_sale' | 'limited_offer' | 'opening_window';
  time_remaining?: number;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  
  // Challenge properties
  challenge_id?: string;
  challenge_type?: string;
  challenge_difficulty?: string;
  progress_percentage?: number;
  
  // Streak properties
  streak_days?: number;
  milestone_reached?: number;
  freeze_count?: number;
  
  // Leaderboard properties
  category?: string;
  timeframe?: string;
  current_rank?: number;
  previous_rank?: number;
  rank_change?: number;
  
  // Spin wheel properties
  reward_type?: string;
  reward_value?: any;
  spin_number?: number;
  
  // Level/XP properties
  current_level?: number;
  current_xp?: number;
  xp_gained?: number;
  points_gained?: number;
  coins_gained?: number;
  
  // Achievement properties
  achievement_id?: string;
  achievement_name?: string;
  achievement_tier?: string;
  
  // General properties
  value?: number;
  currency?: string;
  item_id?: string;
  item_name?: string;
  source?: string;
  action?: string;
  label?: string;
  screen_name?: string;
  component_name?: string;
}

class GamificationAnalytics {
  private static instance: GamificationAnalytics;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: Array<{ type: string; properties: EventProperties }> = [];
  private isOnline: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
    this.setupNetworkListener();
    this.processQueuedEvents();
  }

  static getInstance(): GamificationAnalytics {
    if (!GamificationAnalytics.instance) {
      GamificationAnalytics.instance = new GamificationAnalytics();
    }
    return GamificationAnalytics.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    try {
      this.userId = await AsyncStorage.getItem('@user_id');
    } catch (error) {
      // console.error('Error initializing user:', error);
    }
  }

  private setupNetworkListener() {
    // Implementar listener de rede
    // NetInfo.addEventListener(state => {
    //   this.isOnline = state.isConnected;
    //   if (this.isOnline) {
    //     this.processQueuedEvents();
    //   }
    // });
  }

  private async processQueuedEvents() {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        await this.logEventInternal(event.type, event.properties);
      } catch (error) {
        // Re-queue failed events
        this.eventQueue.push(event);
      }
    }
  }

  private async logEventInternal(eventType: string, properties: EventProperties) {
    const enrichedProperties = {
      ...properties,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now(),
      platform: properties.platform || 'android', // or detect platform
      app_version: '1.0.0', // Get from app config
    };

    // Use analyticsService (Redux-based) em vez de Firebase
    await analyticsService.logEvent(eventType, enrichedProperties);

    // Also save to local storage for offline analytics
    await this.saveLocalEvent(eventType, enrichedProperties);
  }

  private async saveLocalEvent(eventType: string, properties: EventProperties) {
    try {
      const events = await AsyncStorage.getItem('@analytics_events');
      const eventList = events ? JSON.parse(events) : [];
      
      eventList.push({
        type: eventType,
        properties,
        created_at: new Date().toISOString(),
      });

      // Keep only last 1000 events
      if (eventList.length > 1000) {
        eventList.splice(0, eventList.length - 1000);
      }

      await AsyncStorage.setItem('@analytics_events', JSON.stringify(eventList));
    } catch (error) {
      // console.error('Error saving local event:', error);
    }
  }

  // Public methods for tracking events

  async logEvent(eventType: GamificationEventType, properties?: EventProperties) {
    if (this.isOnline) {
      await this.logEventInternal(eventType, properties || {});
    } else {
      this.eventQueue.push({ type: eventType, properties: properties || {} });
    }
  }

  // Timer/Urgency tracking
  async trackTimerView(boxId: string, timerType: string, timeRemaining: number) {
    await this.logEvent(GamificationEventType.TIMER_VIEW, {
      item_id: boxId,
      timer_type: timerType as any,
      time_remaining: timeRemaining,
      urgency_level: this.calculateUrgencyLevel(timeRemaining),
    });
  }

  async trackTimerExpired(boxId: string, timerType: string) {
    await this.logEvent(GamificationEventType.TIMER_EXPIRED, {
      item_id: boxId,
      timer_type: timerType as any,
    });
  }

  async trackPurchaseWithTimer(box: MysteryBox, timeRemaining: number) {
    await this.logEvent(GamificationEventType.PURCHASE_WITH_TIMER, {
      item_id: box.id,
      item_name: box.name,
      value: box.price,
      currency: 'BRL',
      time_remaining: timeRemaining,
      urgency_level: this.calculateUrgencyLevel(timeRemaining),
    });
  }

  // Challenge tracking
  async trackChallengeStart(challengeId: string, challengeType: string) {
    await this.logEvent(GamificationEventType.CHALLENGE_START, {
      challenge_id: challengeId,
      challenge_type: challengeType,
    });
  }

  async trackChallengeProgress(challengeId: string, progress: number, target: number) {
    await this.logEvent(GamificationEventType.CHALLENGE_PROGRESS, {
      challenge_id: challengeId,
      progress_percentage: (progress / target) * 100,
    });
  }

  async trackChallengeComplete(challengeId: string, rewardType: string, rewardValue: any) {
    await this.logEvent(GamificationEventType.CHALLENGE_COMPLETE, {
      challenge_id: challengeId,
      reward_type: rewardType,
      reward_value: rewardValue,
    });
  }

  // Streak tracking
  async trackStreakMaintained(days: number) {
    await this.logEvent(GamificationEventType.STREAK_MAINTAIN, {
      streak_days: days,
    });
  }

  async trackStreakMilestone(days: number, reward: any) {
    await this.logEvent(GamificationEventType.STREAK_MILESTONE, {
      streak_days: days,
      milestone_reached: days,
      reward_value: reward,
    });
  }

  async trackStreakLost(days: number) {
    await this.logEvent(GamificationEventType.STREAK_LOST, {
      streak_days: days,
    });
  }

  // Leaderboard tracking
  async trackLeaderboardView(category: string, timeframe: string) {
    await this.logEvent(GamificationEventType.LEADERBOARD_VIEW, {
      category,
      timeframe,
    });
  }

  async trackLeaderboardRankChange(category: string, oldRank: number, newRank: number) {
    const eventType = newRank < oldRank 
      ? GamificationEventType.LEADERBOARD_RANK_UP 
      : GamificationEventType.LEADERBOARD_RANK_DOWN;
    
    await this.logEvent(eventType, {
      category,
      previous_rank: oldRank,
      current_rank: newRank,
      rank_change: oldRank - newRank,
    });
  }

  // Spin wheel tracking
  async trackSpinWheelOpen() {
    await this.logEvent(GamificationEventType.SPIN_WHEEL_OPEN);
  }

  async trackSpinWheelSpin(spinNumber: number) {
    await this.logEvent(GamificationEventType.SPIN_WHEEL_SPIN, {
      spin_number: spinNumber,
    });
  }

  async trackSpinWheelReward(rewardType: string, rewardValue: any) {
    await this.logEvent(GamificationEventType.SPIN_WHEEL_REWARD, {
      reward_type: rewardType,
      reward_value: rewardValue,
    });
  }

  // Level/XP tracking
  async trackXPGained(amount: number, source: string) {
    await this.logEvent(GamificationEventType.XP_GAINED, {
      xp_gained: amount,
      source,
    });
  }

  async trackLevelUp(newLevel: number, rewards: any[]) {
    await this.logEvent(GamificationEventType.LEVEL_UP, {
      current_level: newLevel,
      reward_value: rewards,
    });
  }

  // Achievement tracking
  async trackAchievementUnlock(achievementId: string, achievementName: string, tier: string) {
    await this.logEvent(GamificationEventType.ACHIEVEMENT_UNLOCK, {
      achievement_id: achievementId,
      achievement_name: achievementName,
      achievement_tier: tier,
    });
  }

  // Special effects tracking
  async trackSpecialEffect(effectType: string, trigger: string) {
    await this.logEvent(GamificationEventType.SPECIAL_EFFECT_TRIGGERED, {
      label: effectType,
      source: trigger,
    });
  }

  async trackEmojiReaction(emojiType: string, context: string) {
    await this.logEvent(GamificationEventType.EMOJI_REACTION, {
      label: emojiType,
      source: context,
    });
  }

  // Screen tracking (usando analyticsService)
  async trackScreenView(screenName: string) {
    await analyticsService.logScreenView(screenName, screenName);
  }

  // User properties (usando analyticsService)
  async setUserProperties(properties: Record<string, any>) {
    await analyticsService.setUserProperties(properties);
  }

  async setUserId(userId: string) {
    this.userId = userId;
    await AsyncStorage.setItem('@user_id', userId);
    await analyticsService.setUserId(userId);
  }

  // Conversion tracking (usando analyticsService)
  async trackConversion(conversionType: string, value: number, currency: string = 'BRL') {
    await analyticsService.logEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency,
    });
  }

  // Helper methods
  private calculateUrgencyLevel(timeRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
    const hours = timeRemaining / 3600000; // Convert to hours
    
    if (hours <= 1) return 'critical';
    if (hours <= 6) return 'high';
    if (hours <= 24) return 'medium';
    return 'low';
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<any> {
    try {
      const events = await AsyncStorage.getItem('@analytics_events');
      const eventList = events ? JSON.parse(events) : [];
      
      const summary = {
        total_events: eventList.length,
        events_by_type: {} as Record<string, number>,
        last_event: eventList[eventList.length - 1],
        session_count: new Set(eventList.map((e: any) => e.properties.session_id)).size,
      };

      // Count events by type
      eventList.forEach((event: any) => {
        summary.events_by_type[event.type] = (summary.events_by_type[event.type] || 0) + 1;
      });

      return summary;
    } catch (error) {
      // console.error('Error getting analytics summary:', error);
      return null;
    }
  }

  // Clear local analytics (for privacy/GDPR)
  async clearAnalytics() {
    await AsyncStorage.removeItem('@analytics_events');
    this.eventQueue = [];
  }
}

export default GamificationAnalytics.getInstance();