import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { boxService } from '../../services/boxService';
import { animationManager, ThemeType } from '../../services/animationManager';
import {MysteryBox, BoxOpeningResult} from '../../types/api';
import { 
  AnimationState, 
  AnimationSystemState, 
  AnimationEvent, 
  TelemetryMetrics,
  AnimationTheme
} from '../../types/animations';

/**
 * Estado avançado do slice de abertura de caixas
 */
export interface AdvancedBoxOpeningState {
  // Estado básico da caixa
  currentBox: MysteryBox | null;
  openingResult: BoxOpeningResult | null;
  isOpening: boolean;
  isLoading: boolean;
  error: string | null;

  // Histórico e estatísticas
  openingHistory: BoxOpeningResult[];
  statistics: {
    totalBoxesOpened: number;
    totalValueReceived: number;
    rareItemsFound: number;
    favoriteItems: string[];
    averageOpeningTime: number;
    bestStreak: number;
    currentStreak: number;
  } | null;

  // Sistema de animação avançado
  animationSystem: AnimationSystemState;
  
  // Configurações de tema
  availableThemes: Record<string, AnimationTheme>;
  selectedTheme: ThemeType | null;
  themePreloadStatus: Record<ThemeType, 'pending' | 'loaded' | 'error'>;

  // Sistema de reações emoji
  emojiSystem: {
    activeReactions: Array<{
      id: string;
      emoji: string;
      points: number;
      timestamp: number;
    }>;
    totalPoints: number;
    multiplier: number;
    comboActive: boolean;
    comboEndTime: number | null;
  };

  // Sistema de gamificação
  gamification: {
    level: number;
    experience: number;
    experienceToNext: number;
    achievements: string[];
    dailyStreak: number;
    lastOpenDate: string | null;
    seasonalEvent: {
      active: boolean;
      name: string | null;
      bonusMultiplier: number;
      endDate: string | null;
    };
  };

  // Configurações de usuário
  userPreferences: {
    enableHaptics: boolean;
    enableSoundEffects: boolean;
    preferredAnimationSpeed: 'slow' | 'normal' | 'fast';
    autoSkipAnimations: boolean;
    reduceMotion: boolean;
    enableParticleEffects: boolean;
  };

  // Modal states
  showShareModal: boolean;
  showAchievementModal: boolean;
  showLevelUpModal: boolean;
  
  // Performance e telemetria
  performanceMetrics: {
    averageFPS: number;
    droppedFrames: number;
    loadTime: number;
    animationDuration: number;
  };
  
  telemetry: TelemetryMetrics | null;
}

// Estado inicial
const initialState: AdvancedBoxOpeningState = {
  currentBox: null,
  openingResult: null,
  isOpening: false,
  isLoading: false,
  error: null,
  openingHistory: [],
  statistics: null,
  
  animationSystem: {
    currentState: 'idle',
    previousState: null,
    activeTheme: null,
    progress: {
      overall: 0,
      phase: 0,
      frame: 0,
      time: 0,
    },
    performance: {
      fps: 60,
      droppedFrames: 0,
      memoryUsage: 0,
      renderTime: 0,
    },
    interruption: {
      canInterrupt: true,
      method: null,
    },
  },
  
  availableThemes: {},
  selectedTheme: null,
  themePreloadStatus: {
    fire: 'pending',
    ice: 'pending',
    meteor: 'pending',
    classic: 'pending',
  },
  
  emojiSystem: {
    activeReactions: [],
    totalPoints: 0,
    multiplier: 1,
    comboActive: false,
    comboEndTime: null,
  },
  
  gamification: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    achievements: [],
    dailyStreak: 0,
    lastOpenDate: null,
    seasonalEvent: {
      active: false,
      name: null,
      bonusMultiplier: 1,
      endDate: null,
    },
  },
  
  userPreferences: {
    enableHaptics: true,
    enableSoundEffects: true,
    preferredAnimationSpeed: 'normal',
    autoSkipAnimations: false,
    reduceMotion: false,
    enableParticleEffects: true,
  },
  
  showShareModal: false,
  showAchievementModal: false,
  showLevelUpModal: false,
  
  performanceMetrics: {
    averageFPS: 60,
    droppedFrames: 0,
    loadTime: 0,
    animationDuration: 0,
  },
  
  telemetry: null,
};

// Async Thunks Avançados

/**
 * Preload de temas de animação
 */
export const preloadAnimationThemes = createAsyncThunk(
  'advancedBoxOpening/preloadAnimationThemes',
  async (themes: ThemeType[], { rejectWithValue, dispatch }) => {
    try {
      // Atualizar status para pending
      themes.forEach(theme => {
        dispatch(setThemePreloadStatus({ theme, status: 'pending' }));
      });

      await animationManager.preloadAnimations(themes, {
        priority: 'high',
        maxConcurrentLoads: 2,
        timeout: 15000,
      });

      // Atualizar status para loaded
      const loadedThemes: Record<string, AnimationTheme> = {};
      themes.forEach(theme => {
        const themeConfig = animationManager.getTheme(theme);
        if (themeConfig) {
          loadedThemes[theme] = themeConfig;
          dispatch(setThemePreloadStatus({ theme, status: 'loaded' }));
        } else {
          dispatch(setThemePreloadStatus({ theme, status: 'error' }));
        }
      });

      return loadedThemes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro no preload de temas');
    }
  }
);

/**
 * Abrir caixa com sistema avançado
 */
export const openMysteryBoxAdvanced = createAsyncThunk(
  'advancedBoxOpening/openMysteryBoxAdvanced',
  async (
    { boxId, themeOverride }: { boxId: string; themeOverride?: ThemeType },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      const state = getState() as { advancedBoxOpening: AdvancedBoxOpeningState };
      
      // Registrar início da animação
      dispatch(setAnimationState('preloading'));
      
      const startTime = Date.now();
      
      // Garantir que o tema está carregado
      const selectedTheme = themeOverride || state.advancedBoxOpening.selectedTheme || 'classic';
      if (!animationManager.isThemeLoaded(selectedTheme)) {
        await dispatch(preloadAnimationThemes([selectedTheme])).unwrap();
      }

      // Abrir a caixa
      dispatch(setAnimationState('opening'));
      const result = await boxService.openBox(boxId);
      
      // Calcular experiência e level up
      const experienceGained = calculateExperienceGain(result);
      dispatch(addExperience(experienceGained));
      
      // Verificar conquistas
      const newAchievements = checkAchievements(state.advancedBoxOpening, result);
      if (newAchievements.length > 0) {
        dispatch(unlockAchievements(newAchievements));
      }
      
      // Atualizar streak diário
      dispatch(updateDailyStreak());
      
      // Registrar métricas
      const loadTime = Date.now() - startTime;
      dispatch(updatePerformanceMetrics({ loadTime }));
      
      return {
        result,
        theme: selectedTheme,
        experienceGained,
        newAchievements,
        loadTime,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao abrir caixa');
    }
  }
);

/**
 * Buscar dados de gamificação
 */
export const fetchGamificationData = createAsyncThunk(
  'advancedBoxOpening/fetchGamificationData',
  async (_, { rejectWithValue }) => {
    try {
      // Simular chamada de API para dados de gamificação
      const gamificationData = await boxService.getGamificationData();
      return gamificationData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao buscar dados de gamificação');
    }
  }
);

/**
 * Atualizar preferências do usuário
 */
export const updateUserPreferences = createAsyncThunk(
  'advancedBoxOpening/updateUserPreferences',
  async (
    preferences: Partial<AdvancedBoxOpeningState['userPreferences']>,
    { rejectWithValue }
  ) => {
    try {
      // Salvar preferências remotamente
      await boxService.updateUserPreferences(preferences);
      return preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao atualizar preferências');
    }
  }
);

// Funções auxiliares
const calculateExperienceGain = (result: BoxOpeningResult): number => {
  const baseXP = 10;
  const rarityMultipliers = { common: 1, rare: 2, epic: 3, legendary: 5, mythic: 8 };
  
  let totalXP = baseXP;
  result.items.forEach(item => {
    const multiplier = rarityMultipliers[item.rarity as keyof typeof rarityMultipliers] || 1;
    totalXP += 5 * multiplier;
  });
  
  return totalXP;
};

const checkAchievements = (
  state: AdvancedBoxOpeningState,
  result: BoxOpeningResult
): string[] => {
  const newAchievements: string[] = [];
  const stats = state.statistics;
  
  if (!stats) return newAchievements;

  // Primeira caixa
  if (stats.totalBoxesOpened === 0) {
    newAchievements.push('first_box');
  }
  
  // Milestones de caixas abertas
  const milestones = [10, 50, 100, 500, 1000];
  milestones.forEach(milestone => {
    if (stats.totalBoxesOpened + 1 === milestone) {
      newAchievements.push(`boxes_opened_${milestone}`);
    }
  });
  
  // Itens lendários
  const hasLegendary = result.items.some(item => item.rarity === 'legendary');
  if (hasLegendary && !state.achievements.includes('first_legendary')) {
    newAchievements.push('first_legendary');
  }
  
  return newAchievements;
};

// Slice
const advancedBoxOpeningSlice = createSlice({
  name: 'advancedBoxOpening',
  initialState,
  reducers: {
    // Controle de caixa
    setCurrentBox: (state, action: PayloadAction<MysteryBox>) => {
      state.currentBox = action.payload;
      state.openingResult = null;
      state.animationSystem.currentState = 'idle';
      state.emojiSystem.activeReactions = [];
    },

    // Controle de animação
    setAnimationState: (state, action: PayloadAction<AnimationState>) => {
      state.animationSystem.previousState = state.animationSystem.currentState;
      state.animationSystem.currentState = action.payload;
    },

    updateAnimationProgress: (state, action: PayloadAction<{
      overall?: number;
      phase?: number;
      frame?: number;
      time?: number;
    }>) => {
      Object.assign(state.animationSystem.progress, action.payload);
    },

    setSelectedTheme: (state, action: PayloadAction<ThemeType>) => {
      state.selectedTheme = action.payload;
      state.animationSystem.activeTheme = action.payload;
    },

    setThemePreloadStatus: (state, action: PayloadAction<{
      theme: ThemeType;
      status: 'pending' | 'loaded' | 'error';
    }>) => {
      state.themePreloadStatus[action.payload.theme] = action.payload.status;
    },

    // Sistema de emoji/reações
    addEmojiReaction: (state, action: PayloadAction<{
      id: string;
      emoji: string;
      points: number;
    }>) => {
      state.emojiSystem.activeReactions.push({
        ...action.payload,
        timestamp: Date.now(),
      });
      state.emojiSystem.totalPoints += action.payload.points;
    },

    removeEmojiReaction: (state, action: PayloadAction<string>) => {
      state.emojiSystem.activeReactions = state.emojiSystem.activeReactions.filter(
        reaction => reaction.id !== action.payload
      );
    },

    activateCombo: (state, action: PayloadAction<{ multiplier: number; duration: number }>) => {
      state.emojiSystem.comboActive = true;
      state.emojiSystem.multiplier = action.payload.multiplier;
      state.emojiSystem.comboEndTime = Date.now() + action.payload.duration;
    },

    deactivateCombo: (state) => {
      state.emojiSystem.comboActive = false;
      state.emojiSystem.multiplier = 1;
      state.emojiSystem.comboEndTime = null;
    },

    // Sistema de gamificação
    addExperience: (state, action: PayloadAction<number>) => {
      if (!state.gamification) return;

      state.gamification.experience += action.payload;
      
      // Verificar level up
      while (state.gamification.experience >= state.gamification.experienceToNext) {
        state.gamification.experience -= state.gamification.experienceToNext;
        state.gamification.level += 1;
        state.gamification.experienceToNext = Math.floor(
          state.gamification.experienceToNext * 1.2
        );
        state.showLevelUpModal = true;
      }
    },

    unlockAchievements: (state, action: PayloadAction<string[]>) => {
      const newAchievements = action.payload.filter(
        achievement => !state.gamification.achievements.includes(achievement)
      );
      
      if (newAchievements.length > 0) {
        state.gamification.achievements.push(...newAchievements);
        state.showAchievementModal = true;
      }
    },

    updateDailyStreak: (state) => {
      const today = new Date().toDateString();
      const lastOpen = state.gamification.lastOpenDate;
      
      if (!lastOpen) {
        state.gamification.dailyStreak = 1;
      } else {
        const lastDate = new Date(lastOpen);
        const todayDate = new Date(today);
        const daysDiff = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff === 1) {
          state.gamification.dailyStreak += 1;
        } else if (daysDiff > 1) {
          state.gamification.dailyStreak = 1;
        }
      }
      
      state.gamification.lastOpenDate = today;
    },

    // Preferências do usuário
    updatePreferences: (
      state,
      action: PayloadAction<Partial<AdvancedBoxOpeningState['userPreferences']>>
    ) => {
      Object.assign(state.userPreferences, action.payload);
    },

    // Controle de modais
    setShowShareModal: (state, action: PayloadAction<boolean>) => {
      state.showShareModal = action.payload;
    },

    setShowAchievementModal: (state, action: PayloadAction<boolean>) => {
      state.showAchievementModal = action.payload;
    },

    setShowLevelUpModal: (state, action: PayloadAction<boolean>) => {
      state.showLevelUpModal = action.payload;
    },

    // Performance e telemetria
    updatePerformanceMetrics: (
      state,
      action: PayloadAction<Partial<AdvancedBoxOpeningState['performanceMetrics']>>
    ) => {
      Object.assign(state.performanceMetrics, action.payload);
    },

    recordAnimationEvent: (state, action: PayloadAction<AnimationEvent>) => {
      // Log do evento para telemetria
      
      // Atualizar métricas baseado no evento
      if (action.payload.type === 'performance' && action.payload.data.performance) {
        Object.assign(state.performanceMetrics, action.payload.data.performance);
      }
    },

    // Limpeza e reset
    clearError: (state) => {
      state.error = null;
    },

    resetOpening: (state) => {
      state.currentBox = null;
      state.openingResult = null;
      state.animationSystem.currentState = 'idle';
      state.animationSystem.progress = { overall: 0, phase: 0, frame: 0, time: 0 };
      state.emojiSystem.activeReactions = [];
      state.showShareModal = false;
      state.error = null;
    },

    forceCleanup: (state) => {
      // Força limpeza de memória
      state.animationSystem.currentState = 'cleanup';
      state.emojiSystem.activeReactions = [];
      animationManager.forceMemoryCleanup();
    },
  },

  extraReducers: (builder) => {
    // Preload de temas
    builder
      .addCase(preloadAnimationThemes.fulfilled, (state, action) => {
        state.availableThemes = { ...state.availableThemes, ...action.payload };
        
        // Se não há tema selecionado, usar o primeiro disponível
        if (!state.selectedTheme && Object.keys(action.payload).length > 0) {
          state.selectedTheme = Object.keys(action.payload)[0] as ThemeType;
        }
      })
      .addCase(preloadAnimationThemes.rejected, (state, action) => {
        state.error = action.payload as string;
        // Marcar todos os temas como erro
        Object.keys(state.themePreloadStatus).forEach(theme => {
          state.themePreloadStatus[theme as ThemeType] = 'error';
        });
      });

    // Abertura de caixa avançada
    builder
      .addCase(openMysteryBoxAdvanced.pending, (state) => {
        state.isOpening = true;
        state.error = null;
      })
      .addCase(openMysteryBoxAdvanced.fulfilled, (state, action) => {
        state.isOpening = false;
        state.openingResult = action.payload.result;
        state.selectedTheme = action.payload.theme;
        state.openingHistory.unshift(action.payload.result);
        
        // Atualizar estatísticas
        if (state.statistics) {
          state.statistics.totalBoxesOpened += 1;
          state.statistics.totalValueReceived += action.payload.result.totalValue;
          
          const hasRare = action.payload.result.items.some(
            item => ['rare', 'epic', 'legendary', 'mythic'].includes(item.rarity)
          );
          if (hasRare) {
            state.statistics.rareItemsFound += 1;
          }
        }
      })
      .addCase(openMysteryBoxAdvanced.rejected, (state, action) => {
        state.isOpening = false;
        state.error = action.payload as string;
        state.animationSystem.currentState = 'error';
      });

    // Dados de gamificação
    builder
      .addCase(fetchGamificationData.fulfilled, (state, action) => {
        state.gamification = { ...state.gamification, ...action.payload };
      });

    // Preferências do usuário
    builder
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        Object.assign(state.userPreferences, action.payload);
      });
  },
});

// Actions
export const {
  setCurrentBox,
  setAnimationState,
  updateAnimationProgress,
  setSelectedTheme,
  setThemePreloadStatus,
  addEmojiReaction,
  removeEmojiReaction,
  activateCombo,
  deactivateCombo,
  addExperience,
  unlockAchievements,
  updateDailyStreak,
  updatePreferences,
  setShowShareModal,
  setShowAchievementModal,
  setShowLevelUpModal,
  updatePerformanceMetrics,
  recordAnimationEvent,
  clearError,
  resetOpening,
  forceCleanup,
} = advancedBoxOpeningSlice.actions;

// Selectors avançados
export const selectCurrentBox = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.currentBox;

export const selectAnimationSystemState = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.animationSystem;

export const selectSelectedTheme = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.selectedTheme;

export const selectEmojiSystem = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.emojiSystem;

export const selectGamificationData = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.gamification;

export const selectUserPreferences = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.userPreferences;

export const selectPerformanceMetrics = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.performanceMetrics;

export const selectThemePreloadStatus = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  state.advancedBoxOpening.themePreloadStatus;

export const selectCanOpenBox = (state: { advancedBoxOpening: AdvancedBoxOpeningState }) =>
  !state.advancedBoxOpening.isOpening && 
  !state.advancedBoxOpening.isLoading &&
  state.advancedBoxOpening.animationSystem.currentState === 'idle';

export default advancedBoxOpeningSlice.reducer;