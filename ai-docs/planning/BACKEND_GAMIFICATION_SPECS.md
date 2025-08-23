# 🎮 Especificações Backend - Sistema de Gamificação

**Data:** 2025-08-12  
**Versão:** 1.0.0  
**Status:** Pronto para Implementação Backend  

## 📊 Visão Geral

Especificação completa das APIs e estruturas de dados necessárias para suportar o sistema de gamificação implementado no frontend do Crowbar Mobile.

## 🗄️ Estrutura do Banco de Dados

### 1. Tabela: `user_gamification`
```sql
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  points INT DEFAULT 0,
  coins INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_gamification_level ON user_gamification(level);
CREATE INDEX idx_user_gamification_points ON user_gamification(points DESC);
```

### 2. Tabela: `streaks`
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  freezes_available INT DEFAULT 3,
  freezes_used INT DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_streaks_current ON streaks(current_streak DESC);
```

### 3. Tabela: `challenges`
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  type VARCHAR(50) NOT NULL, -- 'purchase', 'open_boxes', 'share', 'review', 'spend'
  category VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'special', 'achievement'
  target_value INT NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- 'xp', 'coins', 'discount', 'box', 'badge'
  reward_value JSONB NOT NULL,
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_active ON challenges(is_active, end_date);
CREATE INDEX idx_challenges_category ON challenges(category);
```

### 4. Tabela: `user_challenges`
```sql
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  current_progress INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_progress ON user_challenges(user_id, is_completed, is_claimed);
```

### 5. Tabela: `leaderboard`
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'points', 'boxes', 'spent', 'streak'
  timeframe VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  score INT NOT NULL,
  rank INT,
  previous_rank INT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, timeframe, period_start)
);

CREATE INDEX idx_leaderboard_ranking ON leaderboard(category, timeframe, score DESC);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id, timeframe);
```

### 6. Tabela: `spin_wheel`
```sql
CREATE TABLE spin_wheel_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  probability DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spin_date DATE NOT NULL,
  spins_used INT DEFAULT 0,
  max_spins INT DEFAULT 3,
  rewards_won JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, spin_date)
);

CREATE INDEX idx_user_spins_date ON user_spins(user_id, spin_date DESC);
```

### 7. Tabela: `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50),
  points INT DEFAULT 0,
  tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  requirement_type VARCHAR(50),
  requirement_value INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements ON user_achievements(user_id, unlocked_at DESC);
```

### 8. Tabela: `rewards`
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'xp', 'coins', 'discount', 'box', 'badge'
  value JSONB NOT NULL,
  source VARCHAR(100), -- 'challenge', 'achievement', 'level_up', 'spin_wheel'
  source_id UUID,
  is_claimed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_pending ON rewards(user_id, is_claimed, expires_at);
```

## 🔌 Endpoints da API

### 1. Gamification Status
```typescript
GET /api/v1/gamification/status
Response: {
  level: number,
  currentXP: number,
  nextLevelXP: number,
  totalPoints: number,
  coins: number,
  rank: number,
  streak: {
    current: number,
    longest: number,
    freezesAvailable: number,
    isFrozen: boolean
  }
}
```

### 2. Challenges
```typescript
// Listar desafios disponíveis
GET /api/v1/challenges
Query: {
  category?: 'daily' | 'weekly' | 'special',
  status?: 'available' | 'in_progress' | 'completed'
}

// Atualizar progresso
POST /api/v1/challenges/:id/progress
Body: {
  increment: number
}

// Resgatar recompensa
POST /api/v1/challenges/:id/claim
Response: {
  reward: {
    type: string,
    value: any
  }
}
```

### 3. Streaks
```typescript
// Obter streak atual
GET /api/v1/streaks/current

// Registrar atividade (atualiza streak)
POST /api/v1/streaks/activity
Body: {
  activity_type: 'purchase' | 'open_box' | 'login'
}

// Usar freeze
POST /api/v1/streaks/freeze
Response: {
  freezesRemaining: number,
  frozenUntil: string
}
```

### 4. Leaderboard
```typescript
// Obter ranking
GET /api/v1/leaderboard
Query: {
  category: 'points' | 'boxes' | 'spent' | 'streak',
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time',
  limit?: number,
  offset?: number
}

Response: {
  userPosition: {
    rank: number,
    score: number,
    previousRank: number
  },
  top: Array<{
    rank: number,
    userId: string,
    username: string,
    avatar: string,
    score: number,
    change: number
  }>
}
```

### 5. Spin Wheel
```typescript
// Verificar spins disponíveis
GET /api/v1/spin-wheel/available

// Girar roda
POST /api/v1/spin-wheel/spin
Response: {
  reward: {
    id: string,
    label: string,
    value: string
  },
  spinsRemaining: number
}

// Histórico de giros
GET /api/v1/spin-wheel/history
```

### 6. Achievements
```typescript
// Listar conquistas
GET /api/v1/achievements
Query: {
  category?: string,
  unlocked?: boolean
}

// Verificar e desbloquear conquistas
POST /api/v1/achievements/check
Response: {
  newlyUnlocked: Achievement[]
}
```

### 7. Rewards
```typescript
// Listar recompensas pendentes
GET /api/v1/rewards/pending

// Resgatar recompensa
POST /api/v1/rewards/:id/claim

// Aplicar desconto
POST /api/v1/rewards/apply-discount
Body: {
  rewardId: string,
  orderId: string
}
```

## 🔄 WebSocket Events

### Eventos Emitidos pelo Server
```typescript
// Atualização de ranking
{
  type: 'leaderboard:update',
  data: {
    category: string,
    userRank: number,
    previousRank: number
  }
}

// Desafio completado
{
  type: 'challenge:complete',
  data: {
    challengeId: string,
    reward: any
  }
}

// Level up
{
  type: 'level:up',
  data: {
    newLevel: number,
    rewards: any[]
  }
}

// Flash sale iniciada
{
  type: 'flash_sale:start',
  data: {
    boxId: string,
    discount: number,
    endsAt: string
  }
}

// Conquista desbloqueada
{
  type: 'achievement:unlock',
  data: {
    achievement: Achievement
  }
}
```

## 🔐 Validações e Segurança

### 1. Anti-Cheating
```typescript
// Middleware de validação
function validateProgress(req, res, next) {
  // Verificar rate limiting
  if (tooManyRequests(req.userId)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Validar incremento razoável
  if (req.body.increment > MAX_ALLOWED_INCREMENT) {
    return res.status(400).json({ error: 'Invalid increment value' });
  }
  
  // Verificar timestamp
  if (!isValidTimestamp(req.body.timestamp)) {
    return res.status(400).json({ error: 'Invalid timestamp' });
  }
  
  next();
}
```

### 2. Rate Limiting
```typescript
// Configuração de rate limiting por endpoint
const rateLimits = {
  '/api/v1/spin-wheel/spin': {
    window: 86400000, // 24 horas
    max: 3 // máximo 3 spins por dia
  },
  '/api/v1/challenges/*/progress': {
    window: 60000, // 1 minuto
    max: 10 // máximo 10 updates por minuto
  },
  '/api/v1/streaks/activity': {
    window: 3600000, // 1 hora
    max: 5 // máximo 5 atividades por hora
  }
};
```

## 📈 Analytics & Métricas

### Eventos para Tracking
```sql
CREATE TABLE gamification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eventos importantes:
-- 'challenge_started', 'challenge_completed', 'challenge_claimed'
-- 'streak_maintained', 'streak_lost', 'streak_frozen'
-- 'spin_wheel_used', 'reward_claimed'
-- 'level_up', 'achievement_unlocked'
-- 'leaderboard_viewed', 'leaderboard_position_changed'
```

## 🚀 Jobs & Cron Tasks

### 1. Daily Reset (00:00 UTC)
```typescript
// Reset de spins diários
async function resetDailySpins() {
  await db.query(`
    INSERT INTO user_spins (user_id, spin_date, spins_used, max_spins)
    SELECT id, CURRENT_DATE, 0, 3
    FROM users
    WHERE is_active = true
    ON CONFLICT (user_id, spin_date) DO NOTHING
  `);
}

// Criar desafios diários
async function generateDailyChallenges() {
  const challenges = await selectRandomChallenges('daily', 5);
  await assignChallengesToAllUsers(challenges);
}
```

### 2. Hourly Jobs
```typescript
// Atualizar leaderboard
async function updateLeaderboard() {
  await calculateRankings('points', 'daily');
  await calculateRankings('boxes', 'daily');
  await notifyRankChanges();
}

// Verificar expiração de recompensas
async function checkRewardExpiration() {
  const expired = await getExpiredRewards();
  await markAsExpired(expired);
  await notifyUsersAboutExpiring();
}
```

### 3. Weekly Reset (Monday 00:00 UTC)
```typescript
// Reset de desafios semanais
async function resetWeeklyChallenges() {
  await archiveCompletedChallenges('weekly');
  await generateWeeklyChallenges();
}

// Distribuir recompensas de leaderboard
async function distributeLeaderboardRewards() {
  const topPlayers = await getTopPlayers('weekly', 10);
  await distributeRewards(topPlayers);
}
```

## 🔧 Configurações

### Environment Variables
```env
# Gamification Settings
DAILY_SPINS_LIMIT=3
STREAK_FREEZE_DAYS=1
MAX_CHALLENGE_SLOTS=10
LEADERBOARD_UPDATE_INTERVAL=3600000
XP_PER_LEVEL=1000
POINTS_PER_PURCHASE=100
BONUS_MULTIPLIER_EVENTS=2

# Rewards
DEFAULT_SPIN_REWARDS=xp_100,coins_50,discount_10,free_box,try_again
LEVEL_UP_REWARD_COINS=100
STREAK_MILESTONE_DAYS=7,30,60,90,365
ACHIEVEMENT_POINT_VALUES=10,25,50,100,500
```

## 📊 Métricas de Performance

### KPIs para Monitoramento
```typescript
interface GamificationMetrics {
  // Engajamento
  dailyActiveUsers: number;
  averageSessionTime: number;
  challengeCompletionRate: number;
  spinWheelUsageRate: number;
  
  // Retenção
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
  streakRetentionRate: number;
  
  // Monetização
  purchaseWithTimerRate: number;
  flashSaleConversionRate: number;
  rewardRedemptionRate: number;
  averageOrderValueWithGamification: number;
  
  // Sistema
  apiResponseTime: number;
  websocketLatency: number;
  databaseQueryTime: number;
  cacheHitRate: number;
}
```

## 🎯 Próximas Implementações

### Fase 1 (MVP - 1 semana)
- [ ] Estrutura básica do banco de dados
- [ ] APIs de challenges e streaks
- [ ] Sistema de XP e níveis
- [ ] Leaderboard básico

### Fase 2 (Engajamento - 2 semanas)
- [ ] Spin wheel completo
- [ ] Sistema de achievements
- [ ] Notificações gamificadas
- [ ] WebSocket para real-time

### Fase 3 (Otimização - 1 semana)
- [ ] Cache Redis para leaderboard
- [ ] Otimização de queries
- [ ] Sistema anti-cheating
- [ ] Analytics avançado

---

**Documento criado por:** AI Assistant  
**Data:** 2025-08-12  
**Versão:** 1.0.0  
**Status:** Pronto para Implementação Backend