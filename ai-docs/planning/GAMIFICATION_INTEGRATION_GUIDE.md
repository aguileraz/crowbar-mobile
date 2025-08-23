# 📚 Guia de Integração - Sistema de Gamificação

**Data:** 2025-08-11  
**Versão:** 1.0.0  
**Status:** Pronto para Implementação  

## 🎯 Visão Rápida

Este guia fornece instruções detalhadas para integrar todos os componentes de gamificação no Crowbar Mobile.

## 📦 Instalação de Dependências

```bash
# Dependências necessárias
npm install --save \
  react-native-reanimated@3.x \
  react-native-linear-gradient \
  react-native-svg \
  react-native-sound \
  @react-native-firebase/messaging \
  @notifee/react-native \
  @shopify/react-native-skia \
  react-native-fast-image

# iOS apenas
cd ios && pod install
```

## 🔧 Configuração Inicial

### 1. Configurar Reanimated (babel.config.js)
```javascript
module.exports = {
  plugins: [
    'react-native-reanimated/plugin', // Deve ser o último
  ],
};
```

### 2. Configurar Notificações (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

## 🎮 Integração dos Componentes

### 1. Timer/Countdown em BoxCard

```typescript
// src/screens/Shop/ShopScreen.tsx
import React from 'react';
import { FlatList } from 'react-native';
import BoxCard from '../../components/BoxCard';

const ShopScreen = () => {
  const boxes = [
    {
      id: '1',
      name: 'Caixa Premium',
      price: 99.90,
      // Adicionar timer de oferta limitada
      limited_time_offer: {
        ends_at: new Date(Date.now() + 7200000).toISOString(), // 2 horas
        label: 'Oferta Especial',
        discount_percentage: 30,
      },
      // Adicionar janela de abertura
      opening_window: {
        opens_at: new Date().toISOString(),
        closes_at: new Date(Date.now() + 432000000).toISOString(), // 5 dias
        days_left: 5,
      },
      // Adicionar flash sale
      flash_sale: {
        active: true,
        ends_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        original_price: 99.90,
        sale_price: 49.90,
      },
    },
  ];

  return (
    <FlatList
      data={boxes}
      renderItem={({ item }) => (
        <BoxCard
          box={item}
          onPress={() => navigateToBox(item)}
          variant="featured"
          showFavoriteButton
        />
      )}
    />
  );
};
```

### 2. Daily Challenges na Home

```typescript
// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import DailyChallenges from '../components/DailyChallenges';
import { Challenge } from '../components/DailyChallenges';

const HomeScreen = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Primeira Compra',
      description: 'Faça sua primeira compra hoje',
      icon: '📦',
      type: 'purchase',
      category: 'daily',
      target: 1,
      current: 0,
      reward: {
        type: 'xp',
        value: 100,
        label: '+100 XP',
      },
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      difficulty: 'easy',
      isCompleted: false,
      isClaimed: false,
    },
  ]);

  const handleChallengePress = (challenge: Challenge) => {
    // Navegar para a tela relevante
    if (challenge.type === 'purchase') {
      navigation.navigate('Shop');
    } else if (challenge.type === 'open_boxes') {
      navigation.navigate('MyBoxes');
    }
  };

  const handleClaimReward = async (challenge: Challenge) => {
    // Chamar API para resgatar recompensa
    try {
      const response = await api.claimReward(challenge.id);
      
      // Atualizar estado do desafio
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id 
          ? { ...c, isClaimed: true }
          : c
      ));
      
      // Mostrar notificação de sucesso
      showSuccessToast(`${challenge.reward.label} adicionado!`);
    } catch (error) {
      showErrorToast('Erro ao resgatar recompensa');
    }
  };

  return (
    <ScrollView>
      <DailyChallenges
        challenges={challenges}
        onChallengePress={handleChallengePress}
        onClaimReward={handleClaimReward}
      />
      {/* Outros componentes */}
    </ScrollView>
  );
};
```

### 3. Streak Tracker no Header

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { View } from 'react-native';
import StreakTracker from '../components/StreakTracker';

const CustomHeader = () => {
  const handleStreakUpdate = (newStreak: number) => {
    // Atualizar streak no Redux/Context
    dispatch(updateStreak(newStreak));
  };

  const handleRewardClaim = (reward: any) => {
    // Processar recompensa de milestone
    if (reward.type === 'free_box') {
      navigation.navigate('FreeBoxClaim', { boxType: reward.value });
    } else if (reward.type === 'discount') {
      dispatch(applyDiscount(reward.value));
    }
  };

  return (
    <View style={styles.header}>
      <Logo />
      <StreakTracker
        compact
        onStreakUpdate={handleStreakUpdate}
        onRewardClaim={handleRewardClaim}
      />
      <NotificationIcon />
    </View>
  );
};
```

### 4. Leaderboard com Bottom Tab

```typescript
// src/navigation/BottomTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LeaderboardScreen from '../screens/Leaderboard/LeaderboardScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="trophy" color={color} />,
          tabBarBadge: '🔥', // Mostrar quando subir de posição
        }}
      />
      {/* Outras tabs */}
    </Tab.Navigator>
  );
};
```

### 5. Roda da Sorte Modal

```typescript
// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { Button } from 'react-native-paper';
import DailySpinWheel from '../components/DailySpinWheel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const [showWheel, setShowWheel] = useState(false);
  const [canSpin, setCanSpin] = useState(false);

  useEffect(() => {
    checkDailySpinAvailability();
  }, []);

  const checkDailySpinAvailability = async () => {
    const lastSpin = await AsyncStorage.getItem('@last_spin_date');
    const today = new Date().toDateString();
    
    if (lastSpin !== today) {
      setCanSpin(true);
      // Mostrar notificação
      showNotification('🎰 Seus giros diários estão disponíveis!');
    }
  };

  const handleRewardWon = async (reward: any) => {
    // Processar recompensa
    switch (reward.value) {
      case 'xp_100':
        dispatch(addXP(100));
        break;
      case 'discount_10':
        dispatch(applyDiscount(10));
        break;
      case 'coins_50':
        dispatch(addCoins(50));
        break;
      case 'free_box':
        navigation.navigate('FreeBoxClaim');
        break;
      case 'try_again':
        // Não faz nada, permite novo giro
        break;
    }
    
    // Salvar data do último giro
    await AsyncStorage.setItem('@last_spin_date', new Date().toDateString());
  };

  return (
    <View>
      {canSpin && (
        <Button
          mode="contained"
          onPress={() => setShowWheel(true)}
          style={styles.spinButton}
        >
          🎰 Girar Roda da Sorte!
        </Button>
      )}
      
      <DailySpinWheel
        visible={showWheel}
        onClose={() => setShowWheel(false)}
        onRewardWon={handleRewardWon}
        maxDailySpins={3}
      />
    </View>
  );
};
```

### 6. Efeitos Especiais na Abertura

```typescript
// src/screens/BoxOpening/BoxOpeningScreen.tsx
import React, { useState } from 'react';
import SpecialOpeningEffects, { useSpecialEffects } from '../../components/SpecialOpeningEffects';

const BoxOpeningScreen = ({ route }) => {
  const { box } = route.params;
  const { activeEffect, triggerEffect, clearEffect } = useSpecialEffects();
  const [items, setItems] = useState([]);

  const handleOpenBox = async () => {
    // Chamar API para abrir caixa
    const response = await api.openBox(box.id);
    setItems(response.items);
    
    // Determinar raridade mais alta dos itens
    const highestRarity = getHighestRarity(response.items);
    
    // Disparar efeito baseado na raridade
    triggerEffect(highestRarity);
    
    // Haptic feedback
    hapticFeedback('notificationSuccess');
    
    // Mostrar animação de abertura
    animateBoxOpening();
  };

  return (
    <View style={styles.container}>
      {/* Conteúdo da tela */}
      
      {/* Overlay de efeitos especiais */}
      {activeEffect && (
        <SpecialOpeningEffects
          type={activeEffect}
          rarity={box.rarity}
          onComplete={clearEffect}
          soundEnabled={true}
        />
      )}
    </View>
  );
};
```

### 7. Emojis Animados para Feedback

```typescript
// src/components/FeedbackModal.tsx
import React, { useState } from 'react';
import AnimatedEmoji, { EmojiSequence, useEmojiReactions } from './AnimatedEmoji';

const FeedbackModal = ({ type, visible, onClose }) => {
  const { reactions, addReaction } = useEmojiReactions();

  const showFeedback = () => {
    switch (type) {
      case 'success':
        addReaction('cool', { x: SCREEN_WIDTH / 2, y: 200 });
        break;
      case 'level_up':
        addReaction('fire', { x: SCREEN_WIDTH / 2, y: 200 });
        break;
      case 'achievement':
        addReaction('beijo', { x: SCREEN_WIDTH / 2, y: 200 });
        break;
    }
  };

  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        {/* Emoji sequencial para conquistas */}
        <EmojiSequence
          emojis={[
            { type: 'fire', delay: 0 },
            { type: 'cool', delay: 500 },
            { type: 'beijo', delay: 500 },
          ]}
          onComplete={onClose}
          size="xlarge"
        />
        
        {/* Reações flutuantes */}
        {reactions.map(reaction => (
          <FloatingEmojiReaction
            key={reaction.id}
            type={reaction.type}
            startPosition={reaction.position}
          />
        ))}
      </View>
    </Modal>
  );
};
```

### 8. Notificações Gamificadas

```typescript
// src/hooks/useGamificationNotifications.ts
import { useEffect } from 'react';
import gamifiedNotificationService from '../services/gamifiedNotificationService';

export const useGamificationNotifications = () => {
  useEffect(() => {
    // Configurar notificações recorrentes
    setupRecurringNotifications();
    
    // Listener para eventos de gamificação
    const unsubscribe = subscribeToGamificationEvents();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const setupRecurringNotifications = async () => {
    // Lembrete diário de spin
    await gamifiedNotificationService.scheduleDailySpinReminder();
    
    // Lembrete de streak às 20h
    await gamifiedNotificationService.schedule(
      {
        id: 'streak_reminder',
        type: 'streak_reminder',
        title: '🔥 Não perca sua sequência!',
        body: 'Abra uma caixa antes da meia-noite!',
        priority: 'high',
      },
      {
        type: 'daily',
        time: { hour: 20, minute: 0 },
      }
    );
  };

  const subscribeToGamificationEvents = () => {
    // Ouvir eventos do Redux/Context
    const listeners = [
      // Level up
      store.subscribe(() => {
        const state = store.getState();
        if (state.user.leveledUp) {
          gamifiedNotificationService.sendLevelUpNotification(
            state.user.level,
            state.user.levelRewards
          );
        }
      }),
      
      // Challenge complete
      eventEmitter.on('challenge:complete', (challenge) => {
        gamifiedNotificationService.sendChallengeComplete(
          challenge.name,
          challenge.reward
        );
      }),
      
      // Flash sale
      eventEmitter.on('flash_sale:start', (sale) => {
        gamifiedNotificationService.sendFlashSaleAlert(
          sale.product,
          sale.discount,
          sale.endsAt
        );
      }),
    ];
    
    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  };
};

// App.tsx
import { useGamificationNotifications } from './hooks/useGamificationNotifications';

const App = () => {
  useGamificationNotifications();
  
  return (
    <NavigationContainer>
      {/* App content */}
    </NavigationContainer>
  );
};
```

## 🔗 Redux Integration

### 1. Criar Slices

```typescript
// src/store/slices/gamificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GamificationState {
  challenges: Challenge[];
  streak: {
    current: number;
    longest: number;
    lastActivity: string;
  };
  leaderboard: {
    position: number;
    previousPosition: number;
    users: LeaderboardUser[];
  };
  rewards: {
    pending: Reward[];
    claimed: Reward[];
  };
  dailySpins: {
    available: number;
    lastSpin: string;
  };
}

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    setChallenges: (state, action: PayloadAction<Challenge[]>) => {
      state.challenges = action.payload;
    },
    updateChallenge: (state, action: PayloadAction<Challenge>) => {
      const index = state.challenges.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.challenges[index] = action.payload;
      }
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      state.streak.current = action.payload;
      state.streak.longest = Math.max(state.streak.longest, action.payload);
      state.streak.lastActivity = new Date().toISOString();
    },
    setLeaderboardPosition: (state, action: PayloadAction<number>) => {
      state.leaderboard.previousPosition = state.leaderboard.position;
      state.leaderboard.position = action.payload;
    },
    addPendingReward: (state, action: PayloadAction<Reward>) => {
      state.rewards.pending.push(action.payload);
    },
    claimReward: (state, action: PayloadAction<string>) => {
      const reward = state.rewards.pending.find(r => r.id === action.payload);
      if (reward) {
        state.rewards.pending = state.rewards.pending.filter(r => r.id !== action.payload);
        state.rewards.claimed.push(reward);
      }
    },
    useDailySpin: (state) => {
      state.dailySpins.available -= 1;
      state.dailySpins.lastSpin = new Date().toISOString();
    },
  },
});

export const {
  setChallenges,
  updateChallenge,
  updateStreak,
  setLeaderboardPosition,
  addPendingReward,
  claimReward,
  useDailySpin,
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
```

### 2. Atualizar Store

```typescript
// src/store/index.ts
import gamificationReducer from './slices/gamificationSlice';

export const store = configureStore({
  reducer: {
    // ... outros reducers
    gamification: gamificationReducer,
  },
});
```

## 🎨 Tema e Estilos

### Cores de Gamificação

```typescript
// src/theme/gamification.ts
export const gamificationTheme = {
  colors: {
    // Níveis de urgência
    urgency: {
      critical: '#FF1744',
      high: '#FF6B6B',
      medium: '#FFA726',
      low: '#66BB6A',
    },
    
    // Raridades
    rarity: {
      common: '#9E9E9E',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FF9800',
      mythic: '#FF1744',
    },
    
    // Achievements
    achievement: {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    },
    
    // Streaks
    streak: {
      cold: '#90CAF9',
      warm: '#FFB74D',
      hot: '#FF7043',
      fire: '#FF3D00',
    },
  },
  
  animations: {
    durations: {
      instant: 0,
      fast: 200,
      normal: 300,
      slow: 500,
      verySlow: 1000,
    },
    
    easings: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
};
```

## 📊 Analytics Events

### Eventos Importantes para Tracking

```typescript
// src/utils/gamificationAnalytics.ts
import analytics from '@react-native-firebase/analytics';

export const trackGamificationEvent = {
  // Challenges
  challengeStarted: (challengeId: string, type: string) => {
    analytics().logEvent('challenge_started', {
      challenge_id: challengeId,
      challenge_type: type,
    });
  },
  
  challengeCompleted: (challengeId: string, timeSpent: number) => {
    analytics().logEvent('challenge_completed', {
      challenge_id: challengeId,
      time_spent_seconds: timeSpent,
    });
  },
  
  rewardClaimed: (rewardType: string, rewardValue: any) => {
    analytics().logEvent('reward_claimed', {
      reward_type: rewardType,
      reward_value: rewardValue,
    });
  },
  
  // Streaks
  streakMaintained: (days: number) => {
    analytics().logEvent('streak_maintained', {
      streak_days: days,
    });
  },
  
  streakLost: (days: number) => {
    analytics().logEvent('streak_lost', {
      streak_days_lost: days,
    });
  },
  
  // Leaderboard
  leaderboardViewed: (position: number) => {
    analytics().logEvent('leaderboard_viewed', {
      user_position: position,
    });
  },
  
  // Spin Wheel
  wheelSpun: (reward: string) => {
    analytics().logEvent('wheel_spun', {
      reward_won: reward,
    });
  },
  
  // Timers
  timerExpired: (type: string, productId: string) => {
    analytics().logEvent('timer_expired', {
      timer_type: type,
      product_id: productId,
    });
  },
  
  purchaseWithTimer: (timeRemaining: number) => {
    analytics().logEvent('purchase_with_timer', {
      time_remaining_seconds: timeRemaining,
    });
  },
};
```

## 🧪 Testing

### Testes Unitários

```typescript
// __tests__/gamification/useCountdown.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCountdown } from '../../src/hooks/useCountdown';

describe('useCountdown', () => {
  it('should countdown correctly', () => {
    const futureDate = new Date(Date.now() + 10000); // 10 segundos
    const { result } = renderHook(() => useCountdown(futureDate));
    
    expect(result.current.totalSeconds).toBeGreaterThan(0);
    expect(result.current.isExpired).toBe(false);
  });
  
  it('should mark as expired when time runs out', async () => {
    const pastDate = new Date(Date.now() - 1000); // 1 segundo atrás
    const { result } = renderHook(() => useCountdown(pastDate));
    
    expect(result.current.isExpired).toBe(true);
    expect(result.current.totalSeconds).toBe(0);
  });
});
```

## 🚀 Checklist de Deploy

### Antes de ir para Produção

- [ ] **Performance**
  - [ ] Testar com 100+ timers simultâneos
  - [ ] Verificar memory leaks em animações
  - [ ] Otimizar bundle size (< 2MB adicional)

- [ ] **Compatibilidade**
  - [ ] Testar em iOS 13+
  - [ ] Testar em Android 5.0+
  - [ ] Verificar em dispositivos low-end

- [ ] **Backend**
  - [ ] APIs de challenges implementadas
  - [ ] WebSocket para leaderboard real-time
  - [ ] Sistema de validação anti-cheating

- [ ] **Analytics**
  - [ ] Todos os eventos configurados
  - [ ] Dashboard de métricas criado
  - [ ] Alertas de anomalias configurados

- [ ] **A/B Testing**
  - [ ] Configurar experimentos
  - [ ] Definir métricas de sucesso
  - [ ] Preparar rollback plan

## 📱 Troubleshooting

### Problemas Comuns

#### 1. Animações travando no Android
```bash
# Adicionar no android/app/build.gradle
android {
  ...
  packagingOptions {
    pickFirst '**/libc++_shared.so'
    pickFirst '**/libjsc.so'
  }
}
```

#### 2. Notificações não aparecem no iOS
```bash
# Verificar capacidades no Xcode
- Push Notifications ✓
- Background Modes ✓
  - Remote notifications ✓
  - Background fetch ✓
```

#### 3. Memory leak em timers
```typescript
// Sempre limpar timers em useEffect
useEffect(() => {
  const timer = setInterval(() => {
    // código
  }, 1000);
  
  return () => clearInterval(timer); // IMPORTANTE!
}, []);
```

## 📞 Suporte

Para dúvidas sobre a implementação:
- Documentação técnica: `/ai-docs/planning/`
- Relatórios de análise: `GAMIFICATION_*.md`
- Exemplos de código: `/src/examples/`

---

**Documento criado por:** AI Assistant  
**Última atualização:** 2025-08-11  
**Versão:** 1.0.0